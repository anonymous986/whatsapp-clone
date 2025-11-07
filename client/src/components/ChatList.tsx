import React from 'react'
import { ChatListItem } from './ChatListItem'
import { formatDistanceToNow } from 'date-fns'

interface ChatListProps {
  chats: any[]
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  searchQuery: string
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  searchQuery,
}) => {
  // Sort chats by last message time or updated_at
  const sortedChats = [...chats].sort((a, b) => {
    const aTime = a.last_message?.created_at || a.updated_at
    const bTime = b.last_message?.created_at || b.updated_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })

  const handleChatClick = (chatId: string) => {
    onSelectChat(chatId)
  }

  if (sortedChats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-wa-text-tertiary mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-wa-text-secondary text-sm">
            {searchQuery ? 'No chats found matching your search' : 'No chats yet'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sortedChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={selectedChatId === chat.id}
          onClick={() => handleChatClick(chat.id)}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  )
}