'use client'

import React from 'react'
import { ChatSessionList } from './ChatSessionList'
import { GlobalChat } from './GlobalChat'

export const ChatInterface: React.FC = () => {
  return (
    <div className="flex h-full min-h-0 bg-gray-50 overflow-hidden">
      <ChatSessionList />
      <GlobalChat />
    </div>
  )
}
