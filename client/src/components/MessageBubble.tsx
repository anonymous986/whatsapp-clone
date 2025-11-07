import React from 'react'
import { formatDistanceToNow } from 'date-fns'

interface MessageBubbleProps {
  message: any
  isOwn: boolean
  showAvatar: boolean
  showDate: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  showDate,
}) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.file_url}
              alt={message.file_name}
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => {
                // Handle image preview
                window.open(message.file_url, '_blank')
              }}
            />
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )

      case 'file':
        return (
          <div className="flex items-center space-x-3 bg-wa-dark-tertiary/50 rounded-lg p-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-wa-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-wa-text-primary truncate">
                {message.file_name}
              </p>
              <p className="text-xs text-wa-text-tertiary">
                {message.file_size ? formatFileSize(message.file_size) : ''}
              </p>
            </div>
            <button
              onClick={() => {
                // Handle file download
                window.open(message.file_url, '_blank')
              }}
              className="flex-shrink-0 p-1 text-wa-text-secondary hover:text-wa-text-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
          </div>
        )

      default:
        return <p className="text-sm break-words">{message.content}</p>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0">
          <img
            src={
              message.profiles?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender_id}`
            }
            alt={message.profiles?.display_name}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}

      {/* Spacer for avatar alignment */}
      {(!showAvatar || isOwn) && <div className="w-8 flex-shrink-0" />}

      {/* Message Content */}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
        {/* Date and sender info */}
        {showDate && !isOwn && (
          <div className="mb-1 px-2">
            <span className="text-xs text-wa-text-tertiary">
              {message.profiles?.display_name}
            </span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-wa-accent text-white rounded-br-sm'
              : 'bg-wa-dark-tertiary text-wa-text-primary rounded-bl-sm'
          }`}
        >
          {renderMessageContent()}
        </div>

        {/* Time and Read Receipts */}
        <div className={`flex items-center space-x-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <span className="text-xs text-wa-text-tertiary">
            {formatTime(message.created_at)}
          </span>

          {/* Read Receipts for own messages */}
          {isOwn && (
            <div className="flex space-x-1">
              <svg
                className={`w-4 h-4 ${
                  message.read ? 'text-wa-accent' : 'text-wa-text-tertiary'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              {message.read && (
                <svg
                  className="w-4 h-4 text-wa-accent"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}