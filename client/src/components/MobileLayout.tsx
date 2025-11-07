import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'

interface MobileLayoutProps {
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  onBackToList: () => void
  onNewChat: () => void
  onSearchContacts: () => void
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  selectedChatId,
  onSelectChat,
  onBackToList,
  onNewChat,
  onSearchContacts,
}) => {
  // In mobile view, we show either the sidebar (chat list) or the chat area
  if (selectedChatId) {
    return (
      <div className="h-full">
        <ChatArea
          chatId={selectedChatId}
          onClose={onBackToList}
        />
      </div>
    )
  }

  return (
    <div className="h-full">
      <Sidebar
        selectedChatId={selectedChatId}
        onSelectChat={onSelectChat}
        onNewChat={onNewChat}
        onSearchContacts={onSearchContacts}
      />
    </div>
  )
}