'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

/**
 * Composant de test pour vérifier que l'événement openGlobalChat fonctionne
 */
export const ChatTestButton: React.FC = () => {
  const handleTestChat = () => {
    console.log('🔍 Test du bouton chat...')
    
    // Créer l'événement de test
    const event = new CustomEvent('openGlobalChat', {
      detail: {
        sellerId: 'test-seller-123',
        sellerName: 'Vendeur Test',
        sellerAvatar: '/placeholder-user.jpg',
        product: {
          id: 'test-product-123',
          name: 'Produit Test',
          price: 99.99,
          image: '/placeholder-product.jpg',
          seller: 'Vendeur Test'
        }
      }
    })
    
    console.log('📡 Événement créé:', event)
    
    // Déclencher l'événement
    window.dispatchEvent(event)
    
    console.log('✅ Événement déclenché !')
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button
        onClick={handleTestChat}
        className="bg-red-500 hover:bg-red-600 text-white"
        size="sm"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Test Chat
      </Button>
    </div>
  )
}
