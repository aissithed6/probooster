'use client'

import React from 'react'
import { useChatContext } from '@/lib/chat-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Search, Plus } from 'lucide-react'

export const ChatSessionList: React.FC = () => {
  const {
    chatSessions,
    activeChatSession,
    openChatSession,
    createChatSession,
    searchQuery,
    setSearchQuery
  } = useChatContext()

  const handleNewChat = () => {
    // Créer une nouvelle conversation avec un vendeur par défaut
    const sessionId = createChatSession('default', 'Nouveau vendeur')
    openChatSession(sessionId)
  }

  const filteredSessions = chatSessions.filter(session =>
    session.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <Button size="sm" onClick={handleNewChat}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher des conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </p>
              {!searchQuery && (
                <Button variant="outline" size="sm" onClick={handleNewChat} className="mt-3">
                  Commencer une conversation
                </Button>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => openChatSession(session.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  session.isActive
                    ? 'bg-orange-50 border border-orange-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={session.sellerAvatar} />
                    <AvatarFallback className="bg-orange-100 text-orange-600">
                      {session.sellerName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 truncate">
                        {session.sellerName}
                      </h4>
                      {session.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {session.unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {session.lastMessage || 'Aucun message'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {session.lastMessageTime ? new Date(session.lastMessageTime).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        }) : ''}
                      </span>
                      
                      {session.isActive && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
