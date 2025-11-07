import { supabase } from './supabase'
import { Database } from '../types/database'

export type Chat = Database['public']['Tables']['chats']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ChatParticipant = Database['public']['Tables']['chat_participants']['Row']

export class ChatService {
  static async getUserChats(userId: string) {
    const { data, error } = await supabase
      .from('chat_participants')
      .select(`
        *,
        chats:chat_id (
          id,
          name,
          is_group,
          avatar_url,
          updated_at,
          messages:messages (
            content,
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

    if (error) throw error
    return data
  }

  static async getChatMessages(chatId: string, limit = 50, offset = 0) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:sender_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('chat_id', chatId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data.reverse()
  }

  static async sendMessage(chatId: string, senderId: string, content: string, type = 'text') {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content,
        message_type: type,
      })
      .select()
      .single()

    if (error) throw error

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId)

    return data
  }

  static async createOneOnOneChat(userId1: string, userId2: string) {
    // Check if chat already exists
    const { data: existingChat } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .in('user_id', [userId1, userId2])
      .group('chat_id')
      .having('COUNT(*) = 2')

    if (existingChat && existingChat.length > 0) {
      return existingChat[0].chat_id
    }

    // Create new chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        is_group: false,
        created_by: userId1,
      })
      .select()
      .single()

    if (chatError) throw chatError

    // Add participants
    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: chat.id, user_id: userId1 },
        { chat_id: chat.id, user_id: userId2 },
      ])

    if (participantsError) throw participantsError

    return chat.id
  }

  static async createGroupChat(name: string, createdBy: string, participantIds: string[]) {
    // Create group chat
    const { data: chat, error } = await supabase
      .from('chats')
      .insert({
        name,
        is_group: true,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) throw error

    // Add creator and all participants
    const participants = [
      { chat_id: chat.id, user_id: createdBy, role: 'admin' },
      ...participantIds.map(userId => ({ chat_id: chat.id, user_id: userId, role: 'member' }))
    ]

    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(participants)

    if (participantsError) throw participantsError

    return chat
  }

  static async markMessagesAsRead(chatId: string, userId: string) {
    // Get unread messages
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .is('deleted_at', null)

    if (!unreadMessages || unreadMessages.length === 0) return

    // Create read receipts
    const readReceipts = unreadMessages.map(message => ({
      message_id: message.id,
      user_id: userId,
    }))

    const { error } = await supabase
      .from('message_read_receipts')
      .upsert(readReceipts, { onConflict: 'message_id,user_id' })

    if (error) throw error

    // Update participant's last_read_at
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userId)
  }

  static async searchUsers(query: string, currentUserId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .ilike('display_name', `%${query}%`)
      .neq('id', currentUserId)
      .limit(10)

    if (error) throw error
    return data
  }

  static async uploadFile(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `chat-files/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    }
  }

  static async subscribeToChat(chatId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        callback
      )
      .subscribe()
  }

  static async subscribeToTyping(chatId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, callback)
      .subscribe()
  }
}