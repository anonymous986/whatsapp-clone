import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'
import { MobileLayout } from './MobileLayout'
import { NewChatModal } from './NewChatModal'
import { ContactSearch } from './ContactSearch'

export const AppLayout: React.FC = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [showContactSearch, setShowContactSearch] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)

  // Detect mobile view
  React.useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    checkMobileView()
    window.addEventListener('resize', checkMobileView)

    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    if (isMobileView) {
      // In mobile view, selecting a chat should show the chat area
      // This will be handled by the MobileLayout component
    }
  }

  // Handle back to chat list (mobile only)
  const handleBackToList = () => {
    setSelectedChatId(null)
  }

  if (!user) {
    return null
  }

  // Mobile layout
  if (isMobileView) {
    return (
      <div className={`h-screen flex flex-col bg-wa-dark-primary ${theme}`}>
        <MobileLayout
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onBackToList={handleBackToList}
          onNewChat={() => setShowNewChatModal(true)}
          onSearchContacts={() => setShowContactSearch(true)}
        />

        {showNewChatModal && (
          <NewChatModal
            onClose={() => setShowNewChatModal(false)}
            onChatCreated={handleSelectChat}
          />
        )}

        {showContactSearch && (
          <ContactSearch
            onClose={() => setShowContactSearch(false)}
            onUserSelect={(userId) => {
              // Create one-on-one chat with selected user
              setShowContactSearch(false)
              setShowNewChatModal(true)
            }}
          />
        )}
      </div>
    )
  }

  // Desktop layout
  return (
    <div className={`h-screen flex bg-wa-dark-primary ${theme}`}>
      {/* Sidebar */}
      <div className="w-80 lg:w-96 border-r border-wa-dark-border flex flex-col">
        <Sidebar
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onNewChat={() => setShowNewChatModal(true)}
          onSearchContacts={() => setShowContactSearch(true)}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <ChatArea
            chatId={selectedChatId}
            onClose={() => setSelectedChatId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-wa-dark-primary">
            <div className="text-center">
              <div className="w-24 h-24 bg-wa-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-wa-accent"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-light text-wa-text-primary mb-2">
                WhatsApp Web Clone
              </h2>
              <p className="text-wa-text-secondary text-sm max-w-md">
                Send and receive messages without keeping your phone online.
                Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={handleSelectChat}
        />
      )}

      {showContactSearch && (
        <ContactSearch
          onClose={() => setShowContactSearch(false)}
          onUserSelect={(userId) => {
            setShowContactSearch(false)
            setShowNewChatModal(true)
          }}
        />
      )}
    </div>
  )
}