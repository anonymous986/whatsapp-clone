import React from 'react'

interface TypingIndicatorProps {
  typingUsers: string[]
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
}) => {
  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} is typing`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} and ${typingUsers[1]} are typing`
    } else {
      return `${typingUsers.length} people are typing`
    }
  }

  return (
    <div className="flex items-center space-x-2 px-4 py-2">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-wa-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-wa-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-wa-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-wa-text-tertiary text-sm italic">
        {getTypingText()}
      </span>
    </div>
  )
}