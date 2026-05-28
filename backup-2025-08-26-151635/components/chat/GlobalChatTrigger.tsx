'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { useChatContext } from '@/lib/chat-context'

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
  const { createChatSession, openChatSession, chatSessions } = useChatContext()

  const handleChatClick = () => {
    // Créer ou récupérer la session de chat existante
    const sessionId = createChatSession(sellerId, sellerName, sellerAvatar)
    
    // Ouvrir la session
    openChatSession(sessionId)
    
    // Si un produit est fourni, l'ajouter automatiquement au chat
    if (product) {
      // Le produit sera ajouté automatiquement via le contexte
      console.log('Produit référencé:', product)
    }
    
    // Ici on pourrait ajouter la logique pour ouvrir le modal de chat global
    // ou naviguer vers la page de chat
  }

  // Vérifier si une conversation existe déjà avec ce vendeur
  const existingSession = chatSessions.find(session => session.sellerId === sellerId)
  const hasUnreadMessages = (existingSession?.unreadCount || 0) > 0

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleChatClick}
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
