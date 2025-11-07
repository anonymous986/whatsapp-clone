import { supabase } from '../config/database'
import { logger } from '../config/logger'

export interface MessageData {
  chatId: string
  senderId: string
  content: string
  messageType?: 'text' | 'image' | 'file'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  replyToId?: string
}

export class MessageService {
  static async sendMessage(data: MessageData) {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          chat_id: data.chatId,
          sender_id: data.senderId,
          content: data.content,
          message_type: data.messageType || 'text',
          file_url: data.fileUrl,
          file_name: data.fileName,
          file_size: data.fileSize,
          reply_to_id: data.replyToId,
        })
        .select(`
          *,
          profiles:sender_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) {
        logger.error('Error sending message:', error)
        throw new Error('Failed to send message')
      }

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.chatId)

      return message
    } catch (error) {
      logger.error('Error in MessageService.sendMessage:', error)
      throw error
    }
  }

  static async getMessages(chatId: string, userId: string, limit = 50, offset = 0) {
    try {
      // Verify user is participant in the chat
      const { data: participant, error: participantError } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single()

      if (participantError || !participant) {
        throw new Error('Access denied')
      }

      // Get messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (
            id,
            display_name,
            avatar_url
          ),
          reply_to:reply_to_id (
            id,
            content,
            sender_id
          )
        `)
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        logger.error('Error fetching messages:', error)
        throw new Error('Failed to fetch messages')
      }

      return messages.reverse()
    } catch (error) {
      logger.error('Error in MessageService.getMessages:', error)
      throw error
    }
  }

  static async markAsRead(messageId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('message_read_receipts')
        .upsert({
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString(),
        }, {
          onConflict: 'message_id,user_id'
        })

      if (error) {
        logger.error('Error marking message as read:', error)
        throw new Error('Failed to mark message as read')
      }

      return { success: true }
    } catch (error) {
      logger.error('Error in MessageService.markAsRead:', error)
      throw error
    }
  }

  static async markChatAsRead(chatId: string, userId: string) {
    try {
      // Get all unread messages for the user in this chat
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .is('deleted_at', null)

      if (fetchError) {
        throw fetchError
      }

      if (unreadMessages && unreadMessages.length > 0) {
        // Create read receipts for all unread messages
        const readReceipts = unreadMessages.map(message => ({
          message_id: message.id,
          user_id: userId,
        }))

        const { error: insertError } = await supabase
          .from('message_read_receipts')
          .upsert(readReceipts, { onConflict: 'message_id,user_id' })

        if (insertError) {
          throw insertError
        }
      }

      // Update participant's last_read_at
      const { error: updateError } = await supabase
        .from('chat_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }

      return { success: true }
    } catch (error) {
      logger.error('Error in MessageService.markChatAsRead:', error)
      throw error
    }
  }

  static async deleteMessage(messageId: string, userId: string) {
    try {
      // Verify user is the sender
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single()

      if (fetchError || !message) {
        throw new Error('Message not found')
      }

      if (message.sender_id !== userId) {
        throw new Error('Access denied')
      }

      // Soft delete the message
      const { error: deleteError } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)

      if (deleteError) {
        throw deleteError
      }

      return { success: true }
    } catch (error) {
      logger.error('Error in MessageService.deleteMessage:', error)
      throw error
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          last_read_at,
          chats:chat_id (
            messages (
              id,
              created_at,
              sender_id
            )
          )
        `)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      let unreadCount = 0

      for (const participant of data || []) {
        const lastReadTime = participant.last_read_at
        const messages = participant.chats?.messages || []

        const unreadMessages = messages.filter(
          (message: any) =>
            message.sender_id !== userId &&
            new Date(message.created_at) > new Date(lastReadTime || 0)
        )

        unreadCount += unreadMessages.length
      }

      return { count: unreadCount }
    } catch (error) {
      logger.error('Error in MessageService.getUnreadCount:', error)
      throw error
    }
  }
}