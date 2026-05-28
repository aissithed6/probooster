'use client'

import React from 'react'
import { ChatProvider } from '@/lib/chat-context'
import { GlobalChatSystem, ChatDemo } from '@/components/chat'

export default function TestChatPage() {
  return (
    <ChatProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Test du Système de Chat Global
          </h1>
          
          <ChatDemo />
        </div>
        
        {/* Système de chat global */}
        <GlobalChatSystem />
      </div>
    </ChatProvider>
  )
}
