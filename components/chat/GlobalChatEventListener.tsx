'use client'

import { useEffect, useRef } from 'react'
import { useChatContext } from '@/lib/chat-context-supabase'

/**
 * Composant qui écoute les événements openGlobalChat et les connecte au nouveau système
 * Permet de maintenir l'ancien design tout en utilisant la nouvelle logique
 *
 * IMPORTANT: on utilise des refs pour référencer les fonctions du contexte afin que
 * l'écouteur ne soit installé qu'UNE fois (montage) quel que soit le nombre de re-renders.
 * Les fonctions du contexte sont recréées à chaque render (non mémoïsées) ; sans ce
 * pattern, le useEffect se réexécutait en boucle (monté -> nettoyé -> monté...).
 */
export const GlobalChatEventListener: React.FC = () => {
  const { createChatSession, openChatSession, addProductToChat } = useChatContext()

  // Ref toujours à jour vers les dernières fonctions du contexte
  const handlersRef = useRef({ createChatSession, openChatSession, addProductToChat })
  handlersRef.current = { createChatSession, openChatSession, addProductToChat }

  useEffect(() => {
    console.log('🔧 GlobalChatEventListener monté - Écoute des événements...')

    const handleOpenGlobalChat = async (event: CustomEvent) => {
      console.log('📡 Événement openGlobalChat reçu:', event.detail)

      const { sellerId, sellerName, sellerAvatar, product } = event.detail
      const { createChatSession, openChatSession, addProductToChat } = handlersRef.current

      try {
        console.log('🔍 Création de la session de chat...')

        // Créer une nouvelle session de chat
        const sessionId = await createChatSession(sellerId, sellerName, sellerAvatar)
        console.log('✅ Session créée avec ID:', sessionId)

        // Ouvrir la session
        if (sessionId) {
          openChatSession(sessionId)
          console.log('✅ Session ouverte')
        }

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
    window.addEventListener('openGlobalChat', handleOpenGlobalChat as any)
    console.log('👂 Écouteur d\'événement openGlobalChat configuré')

    // Nettoyage
    return () => {
      window.removeEventListener('openGlobalChat', handleOpenGlobalChat as any)
      console.log('🧹 Écouteur d\'événement openGlobalChat nettoyé')
    }
    // L'écouteur ne s'installe qu'une seule fois (montage/démontage du composant)
  }, [])

  // Ce composant ne rend rien, il écoute juste les événements
  return null
}
