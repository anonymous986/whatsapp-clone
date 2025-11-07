import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useSocket } from '../context/SocketContext'
import { ChatService } from '../services/chatService'
import { LoadingSpinner } from './LoadingSpinner'
import { ChatList } from './ChatList'
import { SidebarHeader } from './SidebarHeader'
import { ChatSearch } from './ChatSearch'

interface SidebarProps {
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onSearchContacts: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedChatId,
  onSelectChat,
  onNewChat,
  onSearchContacts,
}) => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { connected } = useSocket()
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Fetch user's chats
  useEffect(() => {
    if (!user) return

    const fetchChats = async () => {
      try {
        setLoading(true)
        const userChats = await ChatService.getUserChats(user.id)
        setChats(userChats)
      } catch (error) {
        console.error('Error fetching chats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [user])

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle new chat
  const handleNewChat = () => {
    onNewChat()
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Toggle search view
  const toggleSearch = () => {
    setShowSearch(!showSearch)
    if (!showSearch) {
      setSearchQuery('')
    }
  }

  return (
    <div className="h-full flex flex-col bg-wa-dark-primary">
      {/* Header */}
      <SidebarHeader
        user={user}
        isConnected={connected}
        onToggleTheme={toggleTheme}
        onNewChat={handleNewChat}
        onSearch={toggleSearch}
        theme={theme}
      />

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-wa-dark-border">
          <ChatSearch
            query={searchQuery}
            onQueryChange={handleSearch}
            onSearchContacts={onSearchContacts}
            onClose={() => {
              setShowSearch(false)
              setSearchQuery('')
            }}
          />
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4">
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
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleNewChat}
                  className="mt-3 text-wa-accent hover:text-wa-accent/80 text-sm font-medium"
                >
                  Start a new chat
                </button>
              )}
            </div>
          </div>
        ) : (
          <ChatList
            chats={filteredChats}
            selectedChatId={selectedChatId}
            onSelectChat={onSelectChat}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  )
}