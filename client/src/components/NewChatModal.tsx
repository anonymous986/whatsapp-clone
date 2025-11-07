import React, { useState } from 'react'
import { ChatService } from '../services/chatService'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import { X } from 'lucide-react'

interface NewChatModalProps {
  onClose: () => void
  onChatCreated: (chatId: string) => void
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onChatCreated,
}) => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const results = await ChatService.searchUsers(query, user.id)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleUserSelect = (selectedUser: any) => {
    // Check if user is already selected
    if (selectedUsers.some(u => u.id === selectedUser.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== selectedUser.id))
    } else {
      setSelectedUsers(prev => [...prev, selectedUser])
    }
  }

  const handleCreateOneOnOneChat = async (otherUser: any) => {
    try {
      setLoading(true)
      const chatId = await ChatService.createOneOnOneChat(user.id, otherUser.id)
      onChatCreated(chatId)
      onClose()
    } catch (error) {
      console.error('Error creating chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroupChat = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      return
    }

    try {
      setLoading(true)
      const participantIds = selectedUsers.map(u => u.id)
      const chat = await ChatService.createGroupChat({
        name: groupName.trim(),
        isGroup: true,
        createdBy: user.id,
        participantIds,
      })
      onChatCreated(chat.id)
      onClose()
    } catch (error) {
      console.error('Error creating group chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-wa-dark-secondary rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-wa-dark-border">
          <h2 className="text-lg font-medium text-wa-text-primary">
            {isCreatingGroup ? 'Create Group Chat' : 'New Chat'}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-wa-text-secondary hover:text-wa-text-primary transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!isCreatingGroup ? (
            <>
              {/* Search Input */}
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-wa-dark-tertiary text-wa-text-primary placeholder-wa-text-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wa-accent/50"
                  autoFocus
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {searching ? (
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
                    onClick={() => handleCreateOneOnOneChat(searchUser)}
                    className="flex items-center space-x-3 p-3 hover:bg-wa-dark-tertiary rounded-lg cursor-pointer transition-colors duration-200"
                  >
                    <img
                      src={
                        searchUser.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchUser.id}`
                      }
                      alt={searchUser.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-wa-text-primary font-medium">
                        {searchUser.display_name}
                      </h3>
                      <p className="text-wa-text-tertiary text-sm">
                        {searchUser.status === 'online' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    {searchUser.status === 'online' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </div>
                ))}

                {searchQuery && searchResults.length === 0 && !searching && (
                  <div className="text-center py-8">
                    <p className="text-wa-text-secondary">No users found</p>
                  </div>
                )}
              </div>

              {/* Create Group Button */}
              <div className="mt-6 pt-4 border-t border-wa-dark-border">
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-wa-accent hover:bg-wa-accent/90 text-white rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>Create Group Chat</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Group Name Input */}
              <div className="mb-4">
                <label className="block text-wa-text-primary text-sm font-medium mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-4 py-2 bg-wa-dark-tertiary text-wa-text-primary placeholder-wa-text-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wa-accent/50"
                  autoFocus
                />
              </div>

              {/* Add Participants */}
              <div className="mb-4">
                <label className="block text-wa-text-primary text-sm font-medium mb-2">
                  Add Participants
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search users to add..."
                  className="w-full px-4 py-2 bg-wa-dark-tertiary text-wa-text-primary placeholder-wa-text-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wa-accent/50"
                />
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="mb-4">
                  <label className="block text-wa-text-primary text-sm font-medium mb-2">
                    Selected ({selectedUsers.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((selectedUser) => (
                      <div
                        key={selectedUser.id}
                        className="flex items-center space-x-2 bg-wa-dark-tertiary rounded-full px-3 py-1"
                      >
                        <img
                          src={
                            selectedUser.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`
                          }
                          alt={selectedUser.display_name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-wa-text-primary text-sm">
                          {selectedUser.display_name}
                        </span>
                        <button
                          onClick={() => handleUserSelect(selectedUser)}
                          className="text-wa-text-tertiary hover:text-wa-text-primary"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchQuery && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults
                    .filter(user => !selectedUsers.some(selected => selected.id === user.id))
                    .map((searchUser) => (
                      <div
                        key={searchUser.id}
                        onClick={() => handleUserSelect(searchUser)}
                        className="flex items-center space-x-3 p-2 hover:bg-wa-dark-tertiary rounded-lg cursor-pointer transition-colors duration-200"
                      >
                        <img
                          src={
                            searchUser.avatar_url ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${searchUser.id}`
                          }
                          alt={searchUser.display_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="text-wa-text-primary text-sm">
                            {searchUser.display_name}
                          </h3>
                        </div>
                        <div className="w-5 h-5 border-2 border-wa-accent rounded" />
                      </div>
                    ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setIsCreatingGroup(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-wa-dark-tertiary text-wa-text-primary hover:bg-wa-dark-tertiary/80 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateGroupChat}
                  disabled={loading || !groupName.trim() || selectedUsers.length === 0}
                  className="flex-1 px-4 py-2 bg-wa-accent text-white hover:bg-wa-accent/90 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Group</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}