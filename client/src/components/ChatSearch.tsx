import React, { useState, useRef, useEffect } from 'react'
import { ChatService } from '../services/chatService'

interface ChatSearchProps {
  query: string
  onQueryChange: (query: string) => void
  onSearchContacts: () => void
  onClose: () => void
}

export const ChatSearch: React.FC<ChatSearchProps> = ({
  query,
  onQueryChange,
  onSearchContacts,
  onClose,
}) => {
  const [isSearchMode, setIsSearchMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSearchMode])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleInputFocus = () => {
    setIsSearchMode(true)
  }

  const handleInputBlur = () => {
    if (!query) {
      setIsSearchMode(false)
    }
  }

  const handleSearchContacts = () => {
    onSearchContacts()
  }

  return (
    <div className="relative">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isSearchMode ? (
            <svg className="w-5 h-5 text-wa-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-wa-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={isSearchMode ? 'Search chats...' : 'Search or start new chat'}
          className="w-full pl-10 pr-10 py-2 bg-wa-dark-tertiary text-wa-text-primary placeholder-wa-text-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wa-accent/50 transition-all duration-200"
        />

        {/* Clear/Search Contacts Button */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {query ? (
            <button
              onClick={() => onQueryChange('')}
              className="text-wa-text-tertiary hover:text-wa-text-primary transition-colors duration-200"
              title="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : isSearchMode ? (
            <button
              onClick={handleSearchContacts}
              className="text-wa-text-tertiary hover:text-wa-text-primary transition-colors duration-200"
              title="Search contacts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Suggestions (could be added later) */}
      {isSearchMode && query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-wa-dark-secondary rounded-lg shadow-lg border border-wa-dark-border z-10">
          <div className="p-3 text-center text-wa-text-tertiary text-sm">
            Type to search chats or press ESC to close
          </div>
        </div>
      )}
    </div>
  )
}