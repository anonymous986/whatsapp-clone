import { Server as SocketIOServer, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { authenticateSocket } from '../middleware/auth'
import { supabase } from '../config/database'
import { logger } from '../config/logger'

interface AuthenticatedSocket extends Socket {
  userId?: string
  userName?: string
}

interface TypingUsers {
  [chatId: string]: Set<string>
}

interface OnlineUsers {
  [userId: string]: {
    socketId: string
    lastSeen: Date
  }
}

const typingUsers: TypingUsers = {}
const onlineUsers: OnlineUsers = {}

export const setupSocketHandlers = (io: SocketIOServer) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token
      const userId = socket.handshake.auth.userId

      if (!token || !userId) {
        return next(new Error('Authentication credentials required'))
      }

      // Verify token with our auth service
      const user = await authenticateSocket(token)

      if (user.id !== userId) {
        return next(new Error('Token mismatch'))
      }

      socket.userId = user.id
      socket.userName = user.display_name

      next()
    } catch (error) {
      logger.error('Socket authentication failed:', error)
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User connected: ${socket.userName} (${socket.userId})`)

    // Track online user
    if (socket.userId) {
      onlineUsers[socket.userId] = {
        socketId: socket.id,
        lastSeen: new Date()
      }

      // Update user status in database
      supabase
        .from('profiles')
        .update({
          status: 'online',
          last_seen: new Date().toISOString()
        })
        .eq('id', socket.userId)
        .then(() => {
          // Notify all users that this user is online
          socket.broadcast.emit('user:status_changed', {
            userId: socket.userId,
            status: 'online',
            lastSeen: null
          })
        })
    }

    // Handle user coming online
    socket.on('user:online', () => {
      if (socket.userId) {
        onlineUsers[socket.userId] = {
          socketId: socket.id,
          lastSeen: new Date()
        }

        socket.broadcast.emit('user:status_changed', {
          userId: socket.userId,
          status: 'online',
          lastSeen: null
        })
      }
    })

    // Handle user going offline
    socket.on('user:offline', () => {
      if (socket.userId) {
        const lastSeen = new Date()
        delete onlineUsers[socket.userId]

        // Update database
        supabase
          .from('profiles')
          .update({
            status: 'offline',
            last_seen: lastSeen.toISOString()
          })
          .eq('id', socket.userId)
          .then(() => {
            // Notify all users that this user is offline
            socket.broadcast.emit('user:status_changed', {
              userId: socket.userId,
              status: 'offline',
              lastSeen: lastSeen.toISOString()
            })
          })
      }
    })

    // Handle typing indicators
    socket.on('user:typing', (data: { chatId: string }) => {
      if (!socket.userId || !data.chatId) return

      if (!typingUsers[data.chatId]) {
        typingUsers[data.chatId] = new Set()
      }

      typingUsers[data.chatId].add(socket.userId)

      // Broadcast to all users in the chat except the sender
      socket.to(`chat:${data.chatId}`).emit('user:typing', {
        chatId: data.chatId,
        userId: socket.userId,
        userName: socket.userName
      })
    })

    socket.on('user:stop_typing', (data: { chatId: string }) => {
      if (!socket.userId || !data.chatId) return

      if (typingUsers[data.chatId]) {
        typingUsers[data.chatId].delete(socket.userId)

        if (typingUsers[data.chatId].size === 0) {
          delete typingUsers[data.chatId]
        }
      }

      // Broadcast to all users in the chat except the sender
      socket.to(`chat:${data.chatId}`).emit('user:stop_typing', {
        chatId: data.chatId,
        userId: socket.userId
      })
    })

    // Handle joining chat rooms
    socket.on('join_chat', async (data: { chatId: string }) => {
      if (!socket.userId || !data.chatId) return

      try {
        // Verify user is participant in the chat
        const { data: participant, error } = await supabase
          .from('chat_participants')
          .select('id')
          .eq('chat_id', data.chatId)
          .eq('user_id', socket.userId)
          .single()

        if (error || !participant) {
          socket.emit('error', { message: 'Access denied' })
          return
        }

        // Join the chat room
        socket.join(`chat:${data.chatId}`)

        // Send current typing users for this chat
        const currentTyping = typingUsers[data.chatId] || []
        if (currentTyping.size > 0) {
          socket.emit('typing_users', {
            chatId: data.chatId,
            users: Array.from(currentTyping)
          })
        }

        logger.info(`User ${socket.userName} joined chat ${data.chatId}`)
      } catch (error) {
        logger.error('Error joining chat:', error)
        socket.emit('error', { message: 'Failed to join chat' })
      }
    })

    // Handle leaving chat rooms
    socket.on('leave_chat', (data: { chatId: string }) => {
      if (!data.chatId) return

      socket.leave(`chat:${data.chatId}`)

      // Remove user from typing for this chat
      if (typingUsers[data.chatId]) {
        typingUsers[data.chatId].delete(socket.userId)
        if (typingUsers[data.chatId].size === 0) {
          delete typingUsers[data.chatId]
        }
      }

      logger.info(`User ${socket.userName} left chat ${data.chatId}`)
    })

    // Handle message delivery confirmation
    socket.on('message:delivered', (data: { messageId: string; chatId: string; recipientId: string }) => {
      // Forward to recipient if they're online
      const recipientSocket = onlineUsers[data.recipientId]
      if (recipientSocket) {
        io.to(recipientSocket.socketId).emit('message:delivered', {
          messageId: data.messageId,
          chatId: data.chatId
        })
      }
    })

    // Handle read receipts
    socket.on('messages:read', async (data: { chatId: string; messageIds: string[] }) => {
      if (!socket.userId || !data.chatId || !data.messageIds.length) return

      try {
        // Create read receipts
        const readReceipts = data.messageIds.map(messageId => ({
          message_id: messageId,
          user_id: socket.userId!,
          read_at: new Date().toISOString()
        }))

        await supabase
          .from('message_read_receipts')
          .upsert(readReceipts, { onConflict: 'message_id,user_id' })

        // Update participant's last_read_at
        await supabase
          .from('chat_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('chat_id', data.chatId)
          .eq('user_id', socket.userId!)

        // Broadcast read status to chat participants
        socket.to(`chat:${data.chatId}`).emit('messages:read', {
          chatId: data.chatId,
          messageIds: data.messageIds,
          userId: socket.userId
        })

      } catch (error) {
        logger.error('Error marking messages as read:', error)
      }
    })

    // Handle getting online status of users
    socket.on('get_user_status', async (data: { userIds: string[] }) => {
      if (!data.userIds || !Array.isArray(data.userIds)) return

      const statuses = await Promise.all(
        data.userIds.map(async (userId) => {
          // Check if user is online
          const isOnline = !!onlineUsers[userId]

          if (isOnline) {
            return {
              userId,
              status: 'online',
              lastSeen: null
            }
          } else {
            // Get last seen from database
            const { data: profile } = await supabase
              .from('profiles')
              .select('last_seen')
              .eq('id', userId)
              .single()

            return {
              userId,
              status: 'offline',
              lastSeen: profile?.last_seen || null
            }
          }
        })
      )

      socket.emit('user_statuses', statuses)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.userName} (${socket.userId})`)

      if (socket.userId) {
        const lastSeen = new Date()
        delete onlineUsers[socket.userId]

        // Update database
        supabase
          .from('profiles')
          .update({
            status: 'offline',
            last_seen: lastSeen.toISOString()
          })
          .eq('id', socket.userId)
          .then(() => {
            // Notify all users that this user is offline
            socket.broadcast.emit('user:status_changed', {
              userId: socket.userId,
              status: 'offline',
              lastSeen: lastSeen.toISOString()
            })
          })
      }
    })
  })

  // Cleanup function for old online users (remove users not seen for 5 minutes)
  setInterval(() => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    Object.entries(onlineUsers).forEach(([userId, userData]) => {
      if (userData.lastSeen < fiveMinutesAgo) {
        delete onlineUsers[userId]

        // Update database
        supabase
          .from('profiles')
          .update({
            status: 'offline',
            last_seen: userData.lastSeen.toISOString()
          })
          .eq('id', userId)
          .then(() => {
            io.emit('user:status_changed', {
              userId,
              status: 'offline',
              lastSeen: userData.lastSeen.toISOString()
            })
          })
      }
    })
  }, 60000) // Run every minute
}