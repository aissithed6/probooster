'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GlobalChatTrigger, ProductGlobalChatTrigger, ModalGlobalChatTrigger, ListGlobalChatTrigger } from './GlobalChatTrigger'

export const ChatDemo: React.FC = () => {
  // Données de démonstration
  const demoSeller = {
    id: 'demo-seller-1',
    name: 'TechStore Pro',
    avatar: '/avatars/seller1.jpg'
  }

  const demoProduct = {
    id: 'demo-product-1',
    name: 'Smartphone Galaxy S24',
    price: 899.99,
    points: 8999,
    image: '/products/phone1.jpg',
    seller: 'TechStore Pro'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Démonstration du Chat Global
        </h2>
        <p className="text-gray-600">
          Testez les différents boutons de chat pour voir le système en action
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Carte produit avec bouton chat */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Produit avec Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Image du produit</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{demoProduct.name}</h3>
              <p className="text-sm text-gray-600">Prix: {demoProduct.price} F CFA</p>
              <p className="text-sm text-gray-600">Points: {demoProduct.points}</p>
            </div>
            <ProductGlobalChatTrigger
              sellerId={demoSeller.id}
              sellerName={demoSeller.name}
              sellerAvatar={demoSeller.avatar}
              product={demoProduct}
            />
          </CardContent>
        </Card>

        {/* Boutons de chat variés */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Boutons de Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <GlobalChatTrigger
              sellerId={demoSeller.id}
              sellerName={demoSeller.name}
              sellerAvatar={demoSeller.avatar}
              className="w-full"
            >
              Chat Standard
            </GlobalChatTrigger>
            
            <ModalGlobalChatTrigger
              sellerId={demoSeller.id}
              sellerName={demoSeller.name}
              sellerAvatar={demoSeller.avatar}
              className="w-full"
            />
            
            <ListGlobalChatTrigger
              sellerId={demoSeller.id}
              sellerName={demoSeller.name}
              sellerAvatar={demoSeller.avatar}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Informations sur le système */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Fonctionnalités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Synchronisation globale</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Référencement des produits</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Gestion des conversations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Statuts des messages</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Pièces jointes et emojis</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 text-sm">
          💡 <strong>Astuce :</strong> Cliquez sur n'importe quel bouton de chat pour ouvrir une conversation. 
          Le bouton flottant en bas à droite vous permettra d'accéder au chat global.
        </p>
      </div>
    </div>
  )
}
