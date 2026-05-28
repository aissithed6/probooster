'use client'

import React from 'react'
import { ChatSessionList } from './ChatSessionList'
import { GlobalChat } from './GlobalChat'

export const ChatInterface: React.FC = () => {
  return (
    <div className="flex h-full bg-gray-50">
      <ChatSessionList />
      <GlobalChat />
    </div>
  )
}
