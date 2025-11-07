import { supabase } from '../config/database'
import { logger } from '../config/logger'

export interface CreateChatData {
  name?: string
  isGroup: boolean
  createdBy: string
  participantIds: string[]
}

export interface ChatParticipant {
  userId: string
  role?: 'admin' | 'member'
}

export class ChatService {
  static async createChat(data: CreateChatData) {
    try {
      // Create chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          name: data.name,
          is_group: data.isGroup,
          created_by: data.createdBy,
        })
        .select()
        .single()

      if (chatError) {
        logger.error('Error creating chat:', chatError)
        throw new Error('Failed to create chat')
      }

      // Add participants (including creator)
      const participants = [
        { chat_id: chat.id, user_id: data.createdBy, role: 'admin' },
        ...data.participantIds.map(userId => ({
          chat_id: chat.id,
          user_id: userId,
          role: 'member'
        }))
      ]

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants)

      if (participantsError) {
        logger.error('Error adding participants:', participantsError)
        // Attempt to clean up the created chat
        await supabase.from('chats').delete().eq('id', chat.id)
        throw new Error('Failed to add participants to chat')
      }

      // Fetch the complete chat with participants
      const { data: completeChat, error: fetchError } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants (
            id,
            user_id,
            role,
            joined_at,
            profiles:user_id (
              id,
              display_name,
              avatar_url,
              status
            )
          )
        `)
        .eq('id', chat.id)
        .single()

      if (fetchError) {
        logger.error('Error fetching complete chat:', fetchError)
      }

      return completeChat
    } catch (error) {
      logger.error('Error in ChatService.createChat:', error)
      throw error
    }
  }

  static async getUserChats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          id,
          role,
          joined_at,
          last_read_at,
          chats:chat_id (
            id,
            name,
            is_group,
            avatar_url,
            updated_at,
            chat_participants!inner (
              user_id,
              profiles:user_id (
                id,
                display_name,
                avatar_url,
                status,
                last_seen
              )
            ),
            messages (
              id,
              content,
              message_type,
              created_at,
              sender_id,
              profiles:sender_id (
                display_name
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { foreignTable: 'chats', ascending: false })

      if (error) {
        logger.error('Error fetching user chats:', error)
        throw new Error('Failed to fetch chats')
      }

      // Process and format the data
      const processedChats = data?.map(participant => {
        const chat = participant.chats
        const otherParticipants = chat.chat_participants.filter(
          (p: any) => p.user_id !== userId
        )

        let chatName = chat.name
        let chatAvatar = chat.avatar_url

        if (!chat.is_group && otherParticipants.length === 1) {
          // For one-on-one chats, use the other person's info
          const otherUser = otherParticipants[0].profiles
          chatName = otherUser.display_name
          chatAvatar = otherUser.avatar_url
        }

        // Get the last message
        const lastMessage = chat.messages?.[0]

        return {
          id: chat.id,
          name: chatName,
          avatar_url: chatAvatar,
          is_group: chat.is_group,
          updated_at: chat.updated_at,
          last_message: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            message_type: lastMessage.message_type,
            created_at: lastMessage.created_at,
            sender_name: lastMessage.profiles?.display_name || 'Unknown'
          } : null,
          participants: otherParticipants.map((p: any) => p.profiles),
          last_read_at: participant.last_read_at,
          unread_count: 0 // Will be calculated separately
        }
      })

      return processedChats || []
    } catch (error) {
      logger.error('Error in ChatService.getUserChats:', error)
      throw error
    }
  }

  static async getChatById(chatId: string, userId: string) {
    try {
      // Verify user is participant in the chat
      const { data: participant, error: participantError } = await supabase
        .from('chat_participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single()

      if (participantError || !participant) {
        throw new Error('Access denied')
      }

      // Get chat details with participants
      const { data: chat, error } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants (
            id,
            user_id,
            role,
            joined_at,
            profiles:user_id (
              id,
              display_name,
              avatar_url,
              status,
              last_seen
            )
          )
        `)
        .eq('id', chatId)
        .single()

      if (error) {
        logger.error('Error fetching chat:', error)
        throw new Error('Failed to fetch chat')
      }

      return {
        ...chat,
        user_role: participant.role
      }
    } catch (error) {
      logger.error('Error in ChatService.getChatById:', error)
      throw error
    }
  }

  static async addParticipant(chatId: string, userId: string, newUserId: string) {
    try {
      // Verify user is admin in the chat
      const { data: participant, error: participantError } = await supabase
        .from('chat_participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single()

      if (participantError || !participant || participant.role !== 'admin') {
        throw new Error('Access denied')
      }

      // Add new participant
      const { error } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatId,
          user_id: newUserId,
          role: 'member',
        })

      if (error) {
        if (error.code === '23505') {
          throw new Error('User is already in the chat')
        }
        logger.error('Error adding participant:', error)
        throw new Error('Failed to add participant')
      }

      return { success: true }
    } catch (error) {
      logger.error('Error in ChatService.addParticipant:', error)
      throw error
    }
  }

  static async removeParticipant(chatId: string, userId: string, targetUserId: string) {
    try {
      // Verify user is admin or removing themselves
      const { data: participant, error: participantError } = await supabase
        .from('chat_participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single()

      if (participantError || !participant) {
        throw new Error('Access denied')
      }

      if (participant.role !== 'admin' && userId !== targetUserId) {
        throw new Error('Access denied')
      }

      // Remove participant
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', targetUserId)

      if (error) {
        logger.error('Error removing participant:', error)
        throw new Error('Failed to remove participant')
      }

      return { success: true }
    } catch (error) {
      logger.error('Error in ChatService.removeParticipant:', error)
      throw error
    }
  }

  static async leaveChat(chatId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId)

      if (error) {
        logger.error('Error leaving chat:', error)
        throw new Error('Failed to leave chat')
      }

      return { success: true }
    } catch (error) {
      logger.error('Error in ChatService.leaveChat:', error)
      throw error
    }
  }

  static async searchUsers(query: string, currentUserId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, status')
        .ilike('display_name', `%${query}%`)
        .neq('id', currentUserId)
        .limit(20)

      if (error) {
        logger.error('Error searching users:', error)
        throw new Error('Failed to search users')
      }

      return data || []
    } catch (error) {
      logger.error('Error in ChatService.searchUsers:', error)
      throw error
    }
  }
}