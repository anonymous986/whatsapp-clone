import React from 'react'
import { formatDistanceToNow } from 'date-fns'

interface ChatListItemProps {
  chat: any
  isSelected: boolean
  onClick: () => void
  searchQuery: string
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isSelected,
  onClick,
  searchQuery,
}) => {
  // Format the last message time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday'
    } else if (diffInDays < 7) {
      // This week - show day name
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  // Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="bg-wa-accent/30 text-wa-text-primary">
          {part}
        </span>
      ) : (
        part
      )
    )
  }

  // Get message preview
  const getMessagePreview = (message: any) => {
    if (!message) return 'No messages yet'

    const sender = message.sender_name
    const content = message.content

    if (chat.is_group && sender) {
      return `${sender}: ${content}`
    }

    return content
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
        isSelected
          ? 'bg-wa-dark-tertiary'
          : 'hover:bg-wa-dark-tertiary/50'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={
            chat.avatar_url ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`
          }
          alt={chat.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {chat.participants?.length === 1 && (
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-wa-dark-secondary ${
            chat.participants[0].status === 'online' ? 'bg-green-500' : 'bg-gray-500'
          }`} />
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-wa-text-primary font-medium text-sm truncate">
            {highlightText(chat.name || 'Unknown Chat', searchQuery)}
          </h3>
          {chat.last_message?.created_at && (
            <span className="text-wa-text-tertiary text-xs ml-2 flex-shrink-0">
              {formatTime(chat.last_message.created_at)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-wa-text-secondary text-sm truncate">
            {highlightText(
              getMessagePreview(chat.last_message),
              searchQuery
            )}
          </p>
          {/* Unread count indicator */}
          {chat.unread_count > 0 && (
            <div className="ml-2 bg-wa-accent text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center flex-shrink-0">
              {chat.unread_count > 99 ? '99+' : chat.unread_count}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}