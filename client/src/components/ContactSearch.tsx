import React, { useState } from 'react'
import { ChatService } from '../services/chatService'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import { X } from 'lucide-react'

interface ContactSearchProps {
  onClose: () => void
  onUserSelect: (userId: string) => void
}

export const ContactSearch: React.FC<ContactSearchProps> = ({
  onClose,
  onUserSelect,
}) => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setLoading(true)
      const results = await ChatService.searchUsers(query, user.id)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (selectedUser: any) => {
    onUserSelect(selectedUser.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-wa-dark-secondary rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-wa-dark-border">
          <h2 className="text-lg font-medium text-wa-text-primary">
            Search Contacts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-wa-text-secondary hover:text-wa-text-primary transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Search Input */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for contacts..."
              className="w-full pl-10 pr-4 py-2 bg-wa-dark-tertiary text-wa-text-primary placeholder-wa-text-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wa-accent/50"
              autoFocus
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {loading ? (
                <LoadingSpinner size="sm" />
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
          </div>

          {/* Search Results */}
          <div className="space-y-2">
            {searchResults.map((searchUser) => (
              <div
                key={searchUser.id}
                onClick={() => handleUserSelect(searchUser)}
                className="flex items-center space-x-3 p-3 hover:bg-wa-dark-tertiary rounded-lg cursor-pointer transition-colors duration-200"
              >
                <img
                  src={
                    searchUser.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchUser.id}`
                  }
                  alt={searchUser.display_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-wa-text-primary font-medium">
                    {searchUser.display_name}
                  </h3>
                  <p className="text-wa-text-tertiary text-sm">
                    {searchUser.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-wa-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            ))}

            {searchQuery && searchResults.length === 0 && !loading && (
              <div className="text-center py-8">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-wa-text-secondary">No contacts found</p>
                <p className="text-wa-text-tertiary text-sm mt-1">
                  Try searching with a different name
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}