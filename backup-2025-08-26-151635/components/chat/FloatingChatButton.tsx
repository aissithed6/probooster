'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, X } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context'
import { cn } from '@/lib/utils'

interface FloatingChatButtonProps {
  className?: string
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const { chatSessions, activeChatSession, openChatSession } = useChatContext()

  // Ne pas afficher sur mobile
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return null
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Bouton principal */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        size="icon"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>

      {/* Panneau de chat rapide */}
      {isExpanded && (
        <div className="absolute bottom-20 right-0 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* En-tête */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Chat Global</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-white hover:bg-white/20 p-1 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-4">
            {chatSessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucune conversation en cours</p>
                <p className="text-gray-400 text-xs mt-1">Commencez à discuter avec un vendeur</p>
              </div>
            ) : (
              <div className="space-y-2">
                {chatSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      openChatSession(session.id)
                      setIsExpanded(false)
                    }}
                    className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-100 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-orange-700">
                          {session.sellerName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {session.sellerName}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {session.lastMessage || 'Aucun message'}
                        </p>
                      </div>
                      {session.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                          {session.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
