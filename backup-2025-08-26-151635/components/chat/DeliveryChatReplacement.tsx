'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, Phone, MapPin, Truck, User } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context'

interface DeliveryChatReplacementProps {
  deliveryInfo: any
  onClose: () => void
  isOpen: boolean
}

export const DeliveryChatReplacement: React.FC<DeliveryChatReplacementProps> = ({
  deliveryInfo,
  onClose,
  isOpen
}) => {
  const { createChatSession, openChatSession } = useChatContext()

  const handleOpenChat = (type: 'driver' | 'seller' | 'admin') => {
    let sellerId = ''
    let sellerName = ''
    let sellerAvatar = ''

    switch (type) {
      case 'driver':
        sellerId = `driver-${deliveryInfo.trackingNumber}`
        sellerName = deliveryInfo.driver?.name || 'Livreur'
        sellerAvatar = deliveryInfo.driver?.avatar
        break
      case 'seller':
        sellerId = `seller-${deliveryInfo.trackingNumber}`
        sellerName = deliveryInfo.seller?.name || 'Vendeur'
        sellerAvatar = deliveryInfo.seller?.avatar
        break
      case 'admin':
        sellerId = 'admin-support'
        sellerName = 'Support Probooster'
        sellerAvatar = '/placeholder-user.jpg'
        break
    }

    // Créer et ouvrir la session de chat
    const sessionId = createChatSession(sellerId, sellerName, sellerAvatar)
    openChatSession(sessionId)
    
    // Fermer ce modal
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full">
      {/* Informations de la livraison */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3 mb-4">
          <Truck className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Commande #{deliveryInfo.trackingNumber}
            </h3>
            <p className="text-sm text-gray-600">
              Statut: {deliveryInfo.status}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{deliveryInfo.currentLocation}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{deliveryInfo.driver?.name}</span>
          </div>
        </div>
      </div>

      {/* Options de chat */}
      <div className="flex-1 p-6 space-y-4">
        <div className="text-center mb-6">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Choisissez avec qui discuter
          </h3>
          <p className="text-gray-600">
            Le chat est maintenant géré par le système global synchronisé
          </p>
        </div>

        <div className="space-y-3">
          {/* Chat avec le livreur */}
          <Button
            onClick={() => handleOpenChat('driver')}
            className="w-full justify-start h-16 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium">Chat avec le livreur</div>
                <div className="text-sm text-blue-700">
                  {deliveryInfo.driver?.name || 'Livreur'} • {deliveryInfo.driver?.phone}
                </div>
              </div>
            </div>
          </Button>

          {/* Chat avec le vendeur */}
          <Button
            onClick={() => handleOpenChat('seller')}
            className="w-full justify-start h-16 bg-green-50 hover:bg-green-100 text-green-900 border border-green-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium">Chat avec le vendeur</div>
                <div className="text-sm text-green-700">
                  {deliveryInfo.seller?.name || 'Vendeur'}
                </div>
              </div>
            </div>
          </Button>

          {/* Chat avec l'administrateur */}
          <Button
            onClick={() => handleOpenChat('admin')}
            className="w-full justify-start h-16 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-left">
                <div className="font-medium">Support Administrateur</div>
                <div className="text-sm text-orange-700">
                  Assistance technique et support client
                </div>
              </div>
            </div>
          </Button>
        </div>

        {/* Appel direct */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            onClick={() => {
              const phone = deliveryInfo.driver?.phone || '+225 0123456789'
              window.location.href = `tel:${phone}`
            }}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Phone className="h-4 w-4 mr-2" />
            Appeler directement
          </Button>
        </div>
      </div>

      {/* Bouton fermer */}
      <div className="p-6 border-t border-gray-200">
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Fermer
        </Button>
      </div>
    </div>
  )
}
