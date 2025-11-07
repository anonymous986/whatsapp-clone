import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface ChatHeaderProps {
  chat: any
  onClose?: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chat, onClose }) => {
  const { user } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const isOnline = chat.participants?.some(
    (participant: any) => participant.status === 'online'
  )

  const getParticipantStatus = () => {
    if (chat.is_group) {
      const onlineCount = chat.participants?.filter(
        (participant: any) => participant.status === 'online'
      ).length || 0

      const totalCount = chat.participants?.length || 0

      if (onlineCount > 0) {
        return `${onlineCount} of ${totalCount} online`
      } else {
        return `${totalCount} members`
      }
    } else {
      // One-on-one chat
      const participant = chat.participants?.[0]
      return participant?.status === 'online' ? 'Online' : 'Offline'
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-wa-dark-secondary border-b border-wa-dark-border">
      {/* Left Section */}
      <div className="flex items-center space-x-3">
        {/* Mobile Back Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Chat Avatar */}
        <div className="relative">
          <img
            src={
              chat.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id}`
            }
            alt={chat.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          {!chat.is_group && (
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-wa-dark-secondary ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`} />
          )}
        </div>

        {/* Chat Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-wa-text-primary font-medium text-sm truncate">
            {chat.name}
          </h2>
          <p className="text-wa-text-tertiary text-xs">
            {getParticipantStatus()}
          </p>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex items-center space-x-1">
        {/* Video Call */}
        <button className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Voice Call */}
        <button className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </button>

        {/* Search */}
        <button className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-wa-dark-secondary rounded-lg shadow-lg border border-wa-dark-border z-50">
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-wa-text-primary hover:bg-wa-dark-tertiary transition-colors duration-200 text-sm">
                  Contact Info
                </button>
                <button className="w-full px-4 py-2 text-left text-wa-text-primary hover:bg-wa-dark-tertiary transition-colors duration-200 text-sm">
                  Select Messages
                </button>
                <button className="w-full px-4 py-2 text-left text-wa-text-primary hover:bg-wa-dark-tertiary transition-colors duration-200 text-sm">
                  Mute Notifications
                </button>
                <button className="w-full px-4 py-2 text-left text-wa-text-primary hover:bg-wa-dark-tertiary transition-colors duration-200 text-sm">
                  Clear Messages
                </button>
                <button className="w-full px-4 py-2 text-left text-wa-text-primary hover:bg-wa-dark-tertiary transition-colors duration-200 text-sm">
                  Delete Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}