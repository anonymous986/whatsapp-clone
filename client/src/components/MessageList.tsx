import React, { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

interface MessageListProps {
  messages: any[]
  typingUsers: Set<string>
  currentUserId: string
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  typingUsers,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingUsers])

  // Group messages by date
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [date: string]: any[] } = {}

    messages.forEach((message) => {
      const date = new Date(message.created_at).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date Divider */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-wa-dark-tertiary px-3 py-1 rounded-full">
              <span className="text-wa-text-tertiary text-xs">
                {formatDate(date)}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const previousMessage = dateMessages[index - 1]
              const showAvatar = shouldShowAvatar(message, previousMessage, currentUserId)
              const showDate = shouldShowDate(message, previousMessage)

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === currentUserId}
                  showAvatar={showAvatar}
                  showDate={showDate}
                />
              )
            })}
          </div>
        </div>
      ))}

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <TypingIndicator
          typingUsers={Array.from(typingUsers)}
        />
      )}

      {/* Scroll to bottom anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
}

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }
}

// Determine if avatar should be shown
const shouldShowAvatar = (message: any, previousMessage: any, currentUserId: string) => {
  if (!previousMessage) return true
  if (message.sender_id !== previousMessage.sender_id) return true
  if (message.sender_id === currentUserId) return false // Don't show avatar for own messages

  // Check if messages are far apart in time
  const timeDiff = new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime()
  const minutesDiff = timeDiff / (1000 * 60)

  return minutesDiff > 5
}

// Determine if date should be shown
const shouldShowDate = (message: any, previousMessage: any) => {
  if (!previousMessage) return true
  if (message.sender_id !== previousMessage.sender_id) return true

  // Check if messages are far apart in time
  const timeDiff = new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime()
  const minutesDiff = timeDiff / (1000 * 60)

  return minutesDiff > 30
}