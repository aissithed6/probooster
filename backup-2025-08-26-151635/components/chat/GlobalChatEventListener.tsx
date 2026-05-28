'use client'

import { useEffect } from 'react'
import { useChatContext } from '@/lib/chat-context'

/**
 * Composant qui écoute les événements openGlobalChat et les connecte au nouveau système
 * Permet de maintenir l'ancien design tout en utilisant la nouvelle logique
 */
export const GlobalChatEventListener: React.FC = () => {
  const { createChatSession, openChatSession, addProductToChat } = useChatContext()

  useEffect(() => {
    console.log('🔧 GlobalChatEventListener monté - Écoute des événements...')
    
    const handleOpenGlobalChat = (event: CustomEvent) => {
      console.log('📡 Événement openGlobalChat reçu:', event.detail)
      
      const { sellerId, sellerName, sellerAvatar, product } = event.detail
      
      try {
        console.log('🔍 Création de la session de chat...')
        
        // Créer une nouvelle session de chat
        const sessionId = createChatSession(sellerId, sellerName, sellerAvatar)
        console.log('✅ Session créée avec ID:', sessionId)
        
        // Ouvrir la session
        openChatSession(sessionId)
        console.log('✅ Session ouverte')
        
        // Si un produit est fourni, l'ajouter au chat
        if (product) {
          console.log('🏷️ Ajout du produit au chat:', product.name)
          // Attendre un peu que la session soit ouverte
          setTimeout(() => {
            addProductToChat(product)
            console.log('✅ Produit ajouté au chat')
          }, 100)
        }
        
        console.log('🎉 Chat global ouvert avec succès via événement:', {
          sellerId,
          sellerName,
          product: product?.name
        })
      } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture du chat global:', error)
      }
    }

    // Écouter l'événement personnalisé
    window.addEventListener('openGlobalChat', handleOpenGlobalChat as EventListener)
    console.log('👂 Écouteur d\'événement openGlobalChat configuré')

    // Nettoyage
    return () => {
      window.removeEventListener('openGlobalChat', handleOpenGlobalChat as EventListener)
      console.log('🧹 Écouteur d\'événement openGlobalChat nettoyé')
    }

    // Écouter l'événement personnalisé
    window.addEventListener('openGlobalChat', handleOpenGlobalChat as EventListener)

    // Nettoyage
    return () => {
      window.removeEventListener('openGlobalChat', handleOpenGlobalChat as EventListener)
    }
  }, [createChatSession, openChatSession, addProductToChat])

  // Ce composant ne rend rien, il écoute juste les événements
  return null
}
