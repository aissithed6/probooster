'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context-supabase'

interface GlobalChatTriggerProps {
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  product?: any
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children?: React.ReactNode
}

export const GlobalChatTrigger: React.FC<GlobalChatTriggerProps> = ({
  sellerId,
  sellerName,
  sellerAvatar,
  product,
  variant = 'default',
  size = 'default',
  className = '',
  children
}) => {
  const { createChatSession, openChatSession, chatSessions, sendMessage } = useChatContext()
  const [isLoading, setIsLoading] = useState(false)

  // Vérifier si une conversation existe déjà avec ce vendeur
  const existingSession = chatSessions.find(session => session.sellerId === sellerId)
  const hasUnreadMessages = (existingSession?.unreadCount || 0) > 0

  /**
   * Construit un message texte stable pour référencer un produit dans le chat.
   */
  const formatProductReferenceMessage = (p: any) => {
    const name = String(p?.name ?? p?.title ?? '').trim()
    const price = p?.price != null ? String(p.price) : ''
    const points = p?.points != null ? String(p.points) : ''

    const url = (() => {
      const direct = String(p?.url ?? '').trim()
      if (direct) return direct

      const slug = String(p?.slug ?? '').trim()
      if (slug) return `/product/${slug}`

      const id = p?.id != null ? String(p.id).trim() : ''
      if (id) return `/product/${id}`
      return ''
    })()

    const lines = [
      'Produit référencé :',
      name ? `- Nom: ${name}` : null,
      price ? `- Prix: ${price}` : null,
      points ? `- Points: ${points}` : null,
      url ? `- Lien: ${url}` : null
    ].filter(Boolean)

    return lines.join('\n')
  }

  const handleChatClick = async () => {
    try {
      setIsLoading(true)

      // Continuité: ouvrir immédiatement si la session existe déjà
      if (existingSession?.id) {
        openChatSession(existingSession.id)

        if (product) {
          const msg = formatProductReferenceMessage(product)
          setTimeout(() => {
            sendMessage(msg, 'product', product)
          }, 0)
        }
        return
      }

      // Créer ou récupérer la session de chat existante
      const sessionId = await createChatSession(sellerId, sellerName, sellerAvatar)
      if (!sessionId) return

      // Ouvrir la session
      openChatSession(sessionId)

      if (product) {
        const msg = formatProductReferenceMessage(product)
        setTimeout(() => {
          sendMessage(msg, 'product', product)
        }, 0)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleChatClick}
      disabled={isLoading}
      className={`relative ${className}`}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      {children || 'Chat'}
      
      {/* Indicateur de messages non lus */}
      {hasUnreadMessages && existingSession && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
          {existingSession.unreadCount || 0}
        </span>
      )}

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
    </Button>
  )
}

// Variante pour les cartes produit
export const ProductGlobalChatTrigger: React.FC<GlobalChatTriggerProps> = (props) => {
  return (
    <GlobalChatTrigger
      {...props}
      variant="outline"
      size="sm"
      className="w-full"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Contacter le vendeur
    </GlobalChatTrigger>
  )
}

// Variante pour les modals
export const ModalGlobalChatTrigger: React.FC<GlobalChatTriggerProps> = (props) => {
  return (
    <GlobalChatTrigger
      {...props}
      variant="default"
      size="default"
      className="w-full bg-orange-600 hover:bg-orange-700"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Démarrer une conversation
    </GlobalChatTrigger>
  )
}

// Variante pour les listes
export const ListGlobalChatTrigger: React.FC<GlobalChatTriggerProps> = (props) => {
  return (
    <GlobalChatTrigger
      {...props}
      variant="ghost"
      size="sm"
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
    >
      <MessageCircle className="w-4 h-4 mr-1" />
      Chat
    </GlobalChatTrigger>
  )
}
