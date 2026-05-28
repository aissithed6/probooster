'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useChatContext } from '@/lib/chat-context-supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Search, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

interface VendorItem {
  id: string
  name: string | null
  email: string | null
}

export const ChatSessionList: React.FC = () => {
  const { user } = useAuth()
  const {
    chatSessions,
    activeChatSession,
    openChatSession,
    createChatSession,
    searchQuery,
    setSearchQuery
  } = useChatContext()

  const { toast } = useToast()

  const canStartNewChat = user?.role === 'client'

  const [isVendorPickerOpen, setIsVendorPickerOpen] = useState(false)
  const [vendorSearch, setVendorSearch] = useState('')
  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)

  /**
   * Charge la liste des vendeurs réels (UUID) depuis la DB via la route serveur.
   */
  const loadVendors = async (search: string) => {
    setIsLoadingVendors(true)
    try {
      const url = new URL('/api/catalog/vendors', window.location.origin)
      if (search.trim().length > 0) {
        url.searchParams.set('search', search.trim())
      }

      const res = await fetch(url.toString(), { method: 'GET' })
      const json = await res.json().catch(() => null)
      const items = (json?.data?.items ?? []) as VendorItem[]
      setVendors(Array.isArray(items) ? items : [])
    } catch (error) {
      console.error('Erreur loadVendors:', error)
      setVendors([])
      toast({
        title: 'Erreur',
        description: "Impossible de charger la liste des vendeurs.",
        variant: 'destructive'
      })
    } finally {
      setIsLoadingVendors(false)
    }
  }

  /**
   * Ouvre le sélecteur de vendeurs réels pour démarrer une nouvelle conversation.
   * Règle métier: seul le client peut démarrer une nouvelle conversation.
   */
  const handleNewChat = async () => {
    if (!canStartNewChat) return
    setIsVendorPickerOpen(true)
  }

  /**
   * Démarre une conversation réelle avec un vendeur (UUID).
   */
  const handleSelectVendor = async (vendor: VendorItem) => {
    const sellerId = String(vendor?.id ?? '').trim()
    const sellerName = String(vendor?.name ?? vendor?.email ?? 'Vendeur').trim()

    const sessionId = await createChatSession(sellerId, sellerName)
    if (sessionId) {
      openChatSession(sessionId)
      setIsVendorPickerOpen(false)
    }
  }

  useEffect(() => {
    if (!isVendorPickerOpen) return
    void loadVendors('')
  }, [isVendorPickerOpen])

  useEffect(() => {
    if (!isVendorPickerOpen) return
    const t = setTimeout(() => {
      void loadVendors(vendorSearch)
    }, 250)
    return () => clearTimeout(t)
  }, [vendorSearch, isVendorPickerOpen])

  const filteredSessions = chatSessions.filter(session =>
    session.sellerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-80 border-r border-gray-200 bg-white flex flex-col min-h-0">
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          {canStartNewChat && (
            <Button size="sm" onClick={handleNewChat} className="bg-[#ff6600] hover:bg-[#e55a00] text-white">
              <Plus className="w-4 h-4" />
            </Button>
          )}
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
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-2">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </p>
              {!searchQuery && canStartNewChat && (
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
                    
                    <p className="text-sm text-gray-500 mt-1 break-words line-clamp-2">
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
      </div>

      {canStartNewChat && (
        <Dialog open={isVendorPickerOpen} onOpenChange={setIsVendorPickerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Choisir un vendeur</DialogTitle>
              <DialogDescription>
                Sélectionnez un vendeur réel pour démarrer une conversation synchronisée.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Input
                placeholder="Rechercher un vendeur (nom ou email)..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />

              <div className="border rounded-md">
                <div className="h-64 overflow-y-auto">
                  <div className="p-2">
                    {isLoadingVendors ? (
                      <div className="text-sm text-gray-500 p-2">Chargement...</div>
                    ) : vendors.length === 0 ? (
                      <div className="text-sm text-gray-500 p-2">Aucun vendeur trouvé</div>
                    ) : (
                      vendors.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => void handleSelectVendor(v)}
                          className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {v.name || v.email || 'Vendeur'}
                              </div>
                              {v.email && (
                                <div className="text-xs text-gray-500 truncate">{v.email}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
