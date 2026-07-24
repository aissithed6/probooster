'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context-supabase'
import { cn } from '@/lib/utils'

interface FloatingChatButtonProps {
  className?: string
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ className }) => {
  const [mounted, setMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const { chatSessions, activeChatSession, openChatSession, isAnyChatOpen, setIsAnyChatOpen } = useChatContext()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isVisible) {
    return null
  }

  // Calculer le nombre total de messages non lus
  const totalUnread = chatSessions.reduce((sum, s) => sum + (s.unreadCount || 0), 0)

  return (
    <div className={cn("fixed bottom-6 right-6 z-[60]", className)}>
      {/* Bouton principal qui ouvre le grand modal */}
      <Button
        onClick={() => setIsAnyChatOpen(!isAnyChatOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-2xl hover:shadow-orange-500/50 transition-all duration-500 transform hover:scale-110 active:scale-95 group relative"
        size="icon"
      >
        <MessageCircle className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Indicateur de messages non lus */}
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-white rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-bounce shadow-lg">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}

        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Button>
    </div>
  )
}
