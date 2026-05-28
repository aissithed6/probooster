'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Search, 
  Send, 
  Plus, 
  Star,
  Clock,
  MapPin,
  Users,
  ShoppingBag,
  MoreHorizontal,
  Archive,
  X,
  Trash2
} from 'lucide-react'
import { useChatContext } from '@/lib/chat-context-supabase'

interface GlobalChatInterfaceProps {
  isOpen: boolean
  onClose: () => void
  userType: 'client' | 'seller'
}

// Vendeurs disponibles pour les clients
const availableSellers = [
  {
    id: 'tech-store-pro',
    name: 'TechStore Pro',
    avatar: '/vendor-avatar.png',
    rating: 4.8,
    responseTime: '2-4h',
    location: 'Abomey-Calavi, Bénin',
    totalProducts: 156,
    isOnline: true,
    specialty: 'Électronique & Informatique'
  },
  {
    id: 'fashion-world',
    name: 'Fashion World',
    avatar: '/vendor-avatar.png',
    rating: 4.6,
    responseTime: '1-3h',
    location: 'Cotonou, Bénin',
    totalProducts: 89,
    isOnline: true,
    specialty: 'Mode & Accessoires'
  },
  {
    id: 'home-decor',
    name: 'Home Decor',
    avatar: '/vendor-avatar.png',
    rating: 4.7,
    responseTime: '3-5h',
    location: 'Porto-Novo, Bénin',
    totalProducts: 234,
    isOnline: false,
    specialty: 'Maison & Décoration'
  }
]

// Clients récents pour les vendeurs
const recentClients = [
  {
    id: 'client-1',
    name: 'Marie Dubois',
    avatar: '/client-avatar.png',
    lastMessage: 'Bonjour ! Je suis intéressée par votre produit...',
    lastMessageTime: '2 min',
    unreadCount: 1,
    isOnline: true
  },
  {
    id: 'client-2',
    name: 'Jean Martin',
    avatar: '/client-avatar.png',
    lastMessage: 'Pouvez-vous me donner plus d\'informations ?',
    lastMessageTime: '1h',
    unreadCount: 0,
    isOnline: false
  }
]

export const GlobalChatInterface: React.FC<GlobalChatInterfaceProps> = ({
  isOpen,
  onClose,
  userType
}) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'new-chat'>('conversations')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  
  const { 
    chatSessions, 
    activeChatSession, 
    createChatSession, 
    openChatSession,
    closeChatSession,
    sendMessage 
  } = useChatContext()

  // Filtrer les vendeurs/clients selon la recherche
  const filteredSellers = availableSellers.filter(seller =>
    seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredClients = recentClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStartChat = (seller: any) => {
    setSelectedSeller(seller)
    setActiveTab('conversations')
    
    // Créer ou ouvrir une session de chat
    const sessionId = createChatSession(seller.id, seller.name, seller.avatar)
    openChatSession(sessionId)
  }

  const handleSendMessage = () => {
    if (message.trim() && activeChatSession) {
      sendMessage(message.trim())
      setMessage('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            <span>
              {userType === 'client' ? 'Chat Global - Discutez avec les Vendeurs' : 'Chat Global - Conversations avec les Clients'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {userType === 'client' 
              ? 'Trouvez et discutez avec les meilleurs vendeurs de la marketplace'
              : 'Gérez toutes vos conversations avec les clients depuis un seul endroit'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[70vh] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          {/* Panneau gauche */}
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            {/* Barre de recherche */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={userType === 'client' ? "Rechercher des vendeurs..." : "Rechercher des clients..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300 transition-all duration-200"
                />
              </div>
            </div>

            {/* Onglets */}
            <div className="px-4 pt-2">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'conversations' | 'new-chat')}>
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
                  <TabsTrigger 
                    value="conversations" 
                    className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    Conversations
                  </TabsTrigger>
                  <TabsTrigger 
                    value="new-chat" 
                    className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    {userType === 'client' ? 'Nouveau Chat' : 'Nouveaux Clients'}
                  </TabsTrigger>
                </TabsList>

                {/* Contenu des onglets */}
                <div className="flex-1 overflow-y-auto">
                  <TabsContent value="conversations" className="mt-0 h-full">
                <div className="p-2 space-y-2">
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Aucune conversation en cours</p>
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => openChatSession(session.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border ${
                          activeChatSession?.id === session.id 
                            ? 'bg-orange-100 border-orange-200' 
                            : 'border-gray-100 hover:border-orange-100'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                                {session.sellerName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm truncate">
                                {session.sellerName}
                              </h4>
                              <span className="text-xs text-gray-500">2 min</span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">
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
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="new-chat" className="mt-0 h-full">
                <div className="p-2 space-y-2">
                  {userType === 'client' ? (
                    // Liste des vendeurs pour les clients
                    filteredSellers.map((seller) => (
                      <div
                        key={seller.id}
                        onClick={() => handleStartChat(seller)}
                        className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border border-gray-100 hover:border-orange-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                                {seller.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              seller.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{seller.name}</h4>
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-600">{seller.rating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">{seller.specialty}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{seller.responseTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{seller.location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ShoppingBag className="w-3 h-3" />
                                <span>{seller.totalProducts}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Liste des clients pour les vendeurs
                    filteredClients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border border-gray-100 hover:border-orange-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              client.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{client.name}</h4>
                              <span className="text-xs text-gray-500">{client.lastMessageTime}</span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">{client.lastMessage}</p>
                          </div>
                          {client.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                              {client.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Panneau droit - Zone de chat */}
          <div className="flex-1 bg-white flex flex-col">
            {activeChatSession ? (
              <>
                {/* En-tête de la conversation */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                          {activeChatSession.sellerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{activeChatSession.sellerName}</h3>
                        <p className="text-xs text-gray-600">En ligne • Répond en 2-4h</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-600 hover:text-orange-600"
                          onClick={() => setShowMoreMenu(!showMoreMenu)}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        
                        {showMoreMenu && (
                          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-50">
                            <button
                              onClick={() => {
                                alert('Conversation marquée comme importante')
                                setShowMoreMenu(false)
                              }}
                              className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left text-sm"
                            >
                              <Star className="w-4 h-4 mr-2 text-yellow-500" />
                              Marquer comme important
                            </button>
                            
                            <button
                              onClick={() => {
                                alert('Conversation archivée')
                                setShowMoreMenu(false)
                              }}
                              className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left text-sm"
                            >
                              <Archive className="w-4 h-4 mr-2 text-blue-500" />
                              Archiver la conversation
                            </button>
                            
                            <button
                              onClick={() => {
                                alert('Contact bloqué')
                                setShowMoreMenu(false)
                              }}
                              className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left text-sm"
                            >
                              <X className="w-4 h-4 mr-2 text-red-500" />
                              Bloquer le contact
                            </button>
                            
                            <div className="border-t border-gray-200 my-1"></div>
                            
                            <button
                              onClick={() => {
                                if (confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
                                  alert('Conversation supprimée')
                                  closeChatSession()
                                }
                                setShowMoreMenu(false)
                              }}
                              className="flex items-center w-full p-2 hover:bg-red-50 rounded text-left text-sm text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer la conversation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone des messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Messages existants */}
                  {activeChatSession.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${
                        msg.sender === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-900'
                      } rounded-lg p-3`}>
                        {msg.type === 'image' && (msg as any)?.imageUrl && (
                          <div className="mb-2">
                            <img
                              src={(msg as any).imageUrl}
                              alt="Image"
                              className="max-w-xs rounded-lg"
                            />
                          </div>
                        )}

                        {msg.type === 'document' && (
                          <div className="mb-2">
                            <div className="text-sm font-medium">
                              {(msg as any)?.fileName || 'Document'}
                            </div>
                            {(msg as any)?.fileUrl && (
                              <a
                                href={(msg as any).fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm underline"
                              >
                                Télécharger
                              </a>
                            )}

                            {String((msg as any)?.fileType ?? '').startsWith('audio/') && (msg as any)?.fileUrl && (
                              <div className="mt-2">
                                <audio controls src={(msg as any).fileUrl} className="w-full" />
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-sm">{msg.content}</p>
                        <span className={`text-xs mt-2 block ${
                          msg.sender === 'user' ? 'text-orange-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Zone de saisie */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Tapez votre message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} className="bg-[#ff6600] hover:bg-[#e55a00] text-white">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Écran d'accueil
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {userType === 'client' ? 'Commencez une conversation' : 'Sélectionnez un client'}
                  </h3>
                  <p className="text-gray-500">
                    {userType === 'client' 
                      ? 'Choisissez un vendeur pour commencer à discuter'
                      : 'Choisissez un client pour voir vos conversations'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
