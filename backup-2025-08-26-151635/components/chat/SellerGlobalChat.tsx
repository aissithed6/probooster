'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Search, Send, Phone, Mail, Star, Clock, MapPin, ShoppingBag } from 'lucide-react'

interface SellerGlobalChatProps {
  isOpen: boolean
  onClose: () => void
}

// Clients récents pour les vendeurs
const recentClients = [
  {
    id: 'client-1',
    name: 'Marie Dubois',
    avatar: '/client-avatar.png',
    lastMessage: 'Bonjour ! Je suis intéressée par votre produit...',
    lastMessageTime: '2 min',
    unreadCount: 1,
    isOnline: true,
    rating: 4.8,
    totalOrders: 12
  },
  {
    id: 'client-2',
    name: 'Jean Martin',
    avatar: '/client-avatar.png',
    lastMessage: 'Pouvez-vous me donner plus d\'informations ?',
    lastMessageTime: '1h',
    unreadCount: 0,
    isOnline: false,
    rating: 4.6,
    totalOrders: 8
  },
  {
    id: 'client-3',
    name: 'Sophie Bernard',
    avatar: '/client-avatar.png',
    lastMessage: 'Merci pour votre réponse rapide !',
    lastMessageTime: '3h',
    unreadCount: 2,
    isOnline: true,
    rating: 4.9,
    totalOrders: 25
  }
]

export const SellerGlobalChat: React.FC<SellerGlobalChatProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClients = recentClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = () => {
    if (message.trim() && selectedClient) {
      // Ici on pourrait envoyer le message via le contexte de chat
      console.log('Message envoyé à', selectedClient.name, ':', message)
      setMessage('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            <span>Chat Global - Conversations avec les Clients</span>
          </DialogTitle>
          <DialogDescription>
            Gérez toutes vos conversations avec les clients depuis un seul endroit
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[70vh] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          {/* Panneau gauche - Liste des clients */}
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            {/* Barre de recherche */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300 transition-all duration-200"
                />
              </div>
            </div>

            {/* Liste des clients */}
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border ${
                      selectedClient?.id === client.id 
                        ? 'bg-orange-100 border-orange-200' 
                        : 'border-gray-100 hover:border-orange-200'
                    }`}
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
                        <p className="text-xs text-gray-600 truncate mb-2">{client.lastMessage}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{client.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{client.totalOrders} commandes</span>
                          </div>
                        </div>
                      </div>
                      {client.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                          {client.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panneau droit - Zone de chat */}
          <div className="flex-1 bg-white flex flex-col">
            {selectedClient ? (
              <>
                {/* En-tête de la conversation */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
                          {selectedClient.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedClient.name}</h3>
                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                          <span className={`flex items-center space-x-1 ${
                            selectedClient.isOnline ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              selectedClient.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span>{selectedClient.isOnline ? 'En ligne' : 'Hors ligne'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{selectedClient.rating}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{selectedClient.totalOrders} commandes</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Zone des messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Message du client */}
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm text-gray-900">{selectedClient.lastMessage}</p>
                        <span className="text-xs text-gray-500 mt-2 block">{selectedClient.lastMessageTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message du vendeur (exemple) */}
                  <div className="flex justify-end">
                    <div className="max-w-xs lg:max-w-md">
                      <div className="bg-orange-500 text-white rounded-lg p-3">
                        <p className="text-sm">Bonjour ! Je serais ravi de vous aider. Que souhaitez-vous savoir de plus sur nos produits ?</p>
                        <span className="text-xs text-orange-100 mt-2 block">Maintenant</span>
                      </div>
                    </div>
                  </div>
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
                    <Button onClick={handleSendMessage} className="bg-orange-600 hover:bg-orange-700">
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un client</h3>
                  <p className="text-gray-500">Choisissez un client pour voir vos conversations</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
