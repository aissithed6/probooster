'use client'

import React, { useState, useEffect } from 'react'
import { ChatInterface } from './ChatInterface'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context-supabase'

export const GlobalChatSystem: React.FC = () => {
  const { isAnyChatOpen, setIsAnyChatOpen } = useChatContext()

  useEffect(() => {
    if (isAnyChatOpen) {
      console.log('💬 GlobalChatSystem est maintenant OUVERT et visible')
    }
  }, [isAnyChatOpen])

  if (!isAnyChatOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-0 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white shadow-2xl w-full max-w-7xl h-full sm:h-[90vh] flex flex-col overflow-hidden sm:rounded-2xl animate-in zoom-in-95 duration-300">
        {/* En-tête du modal */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white shadow-lg z-10">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Centre de Messagerie Probooster
              </h2>
              <p className="text-xs text-orange-100">Conversations en temps réel synchronisées</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAnyChatOpen(false)}
            className="text-white hover:bg-white/20 rounded-full h-10 w-10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Contenu du chat */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <ChatInterface />
        </div>
      </div>
    </div>
  )
}
