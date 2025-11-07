import React, { useState, useEffect } from 'react'
import { ChatHeader } from './ChatHeader'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ChatService } from '../services/chatService'
import { useSocket } from '../context/SocketContext'
import { LoadingSpinner } from './LoadingSpinner'

interface ChatAreaProps {
  chatId: string
  onClose?: () => void
}

export const ChatArea: React.FC<ChatAreaProps> = ({ chatId, onClose }) => {
  const { socket } = useSocket()
  const [chat, setChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // Fetch chat details and messages
  useEffect(() => {
    if (!chatId) return

    const fetchChatData = async () => {
      try {
        setLoading(true)

        // Fetch chat details
        const chatDetails = await ChatService.getChatById(chatId, 'current-user-id') // TODO: Get actual user ID
        setChat(chatDetails)

        // Fetch messages
        const chatMessages = await ChatService.getMessages(chatId, 'current-user-id') // TODO: Get actual user ID
        setMessages(chatMessages)

        // Mark messages as read
        await ChatService.markChatAsRead(chatId, 'current-user-id') // TODO: Get actual user ID

      } catch (error) {
        console.error('Error fetching chat data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChatData()
  }, [chatId])

  // Handle socket events
  useEffect(() => {
    if (!socket || !chatId) return

    // Join chat room
    socket.emit('join_chat', { chatId })

    // Listen for new messages
    const handleMessageReceived = (data: any) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data])

        // Mark as read
        socket.emit('messages:read', {
          chatId,
          messageIds: [data.id]
        })
      }
    }

    // Listen for typing indicators
    const handleUserTyping = (data: any) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => new Set(prev).add(data.userId))
      }
    }

    const handleUserStopTyping = (data: any) => {
      if (data.chatId === chatId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
    }

    // Listen for message read receipts
    const handleMessagesRead = (data: any) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(msg =>
          data.messageIds.includes(msg.id)
            ? { ...msg, read: true }
            : msg
        ))
      }
    }

    socket.on('message:received', handleMessageReceived)
    socket.on('user:typing', handleUserTyping)
    socket.on('user:stop_typing', handleUserStopTyping)
    socket.on('messages:read', handleMessagesRead)

    return () => {
      socket.emit('leave_chat', { chatId })
      socket.off('message:received', handleMessageReceived)
      socket.off('user:typing', handleUserTyping)
      socket.off('user:stop_typing', handleUserStopTyping)
      socket.off('messages:read', handleMessagesRead)
    }
  }, [socket, chatId])

  // Handle sending messages
  const handleSendMessage = async (content: string, type: string = 'text', file?: File) => {
    if (!chatId) return

    try {
      if (type !== 'text' && file) {
        // Handle file upload
        const formData = new FormData()
        formData.append('file', file)

        // Upload file and send message
        const response = await fetch(`/api/chats/${chatId}/messages/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` // TODO: Get actual token
          }
        })

        if (response.ok) {
          const data = await response.json()
          setMessages(prev => [...prev, data.data])
        }
      } else {
        // Send text message
        const message = await ChatService.sendMessage({
          chatId,
          senderId: 'current-user-id', // TODO: Get actual user ID
          content,
          messageType: type as any,
        })

        setMessages(prev => [...prev, message])

        // Emit to socket for real-time delivery
        if (socket) {
          socket.emit('message:send', {
            chatId,
            messageId: message.id
          })
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Handle typing indicators
  const handleTypingStart = () => {
    if (socket) {
      socket.emit('user:typing', { chatId })
    }
  }

  const handleTypingStop = () => {
    if (socket) {
      socket.emit('user:stop_typing', { chatId })
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wa-dark-primary">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-wa-dark-primary">
        <div className="text-center">
          <p className="text-wa-text-secondary">Chat not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-wa-dark-primary">
      {/* Chat Header */}
      <ChatHeader
        chat={chat}
        onClose={onClose}
      />

      {/* Messages List */}
      <MessageList
        messages={messages}
        typingUsers={typingUsers}
        currentUserId="current-user-id" // TODO: Get actual user ID
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  )
}