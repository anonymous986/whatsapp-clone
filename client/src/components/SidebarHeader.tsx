import React from 'react'
import { useAuth } from '../context/AuthContext'
import { UserMenu } from './UserMenu'

interface SidebarHeaderProps {
  user: any
  isConnected: boolean
  onToggleTheme: () => void
  onNewChat: () => void
  onSearch: () => void
  theme: 'dark' | 'light'
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  user,
  isConnected,
  onToggleTheme,
  onNewChat,
  onSearch,
  theme,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-3 bg-wa-dark-secondary border-b border-wa-dark-border">
      {/* User Profile */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={
              user?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
            }
            alt={user?.display_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-wa-dark-secondary ${
            isConnected ? 'bg-green-500' : 'bg-gray-500'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-wa-text-primary font-medium text-sm truncate">
            {user?.display_name}
          </h2>
          <p className="text-wa-text-tertiary text-xs">
            {isConnected ? 'Online' : 'Connecting...'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* New Chat */}
        <button
          onClick={onNewChat}
          className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200"
          title="New chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Search */}
        <button
          onClick={onSearch}
          className="p-2 text-wa-text-secondary hover:text-wa-text-primary hover:bg-wa-dark-tertiary rounded-lg transition-colors duration-200"
          title="Search chats"
        >
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
        <UserMenu user={user} />
      </div>
    </div>
  )
}