'use client'

import React, { useState } from 'react'
import { ChatInterface } from './ChatInterface'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context'

export const GlobalChatSystem: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const { isAnyChatOpen } = useChatContext()

  return (
    <>
      {/* Bouton flottant pour ouvrir le chat global */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsChatOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-orange-600 hover:bg-orange-700 relative"
        >
          <MessageCircle className="w-6 h-6" />
          {/* Indicateur de messages non lus */}
          {isAnyChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Modal du chat global */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Chat Global - Conversations Synchronisées
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChatOpen(false)}
                className="hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Contenu du chat */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
