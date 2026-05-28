'use client'

import React, { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatContext } from '@/lib/chat-context'
import { useToast } from '@/hooks/use-toast'

interface ChatButtonProps {
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  product?: any
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
  children?: React.ReactNode
}

export const ChatButton: React.FC<ChatButtonProps> = ({
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
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleChatClick = async () => {
    setIsLoading(true)
    
    try {
      // Créer ou récupérer la session de chat existante
      const sessionId = createChatSession(sellerId, sellerName, sellerAvatar)
      
      // Ouvrir la session
      openChatSession(sessionId)
      
      // Si un produit est fourni, l'ajouter automatiquement au chat
      if (product) {
        // Simuler un délai pour l'ajout du produit
        setTimeout(() => {
          toast({
            title: "Chat ouvert avec le vendeur !",
            description: `Le chat avec ${sellerName} s'est ouvert avec votre produit référencé`,
            variant: "default",
          })
        }, 100)
      } else {
        toast({
          title: "Chat ouvert !",
          description: `Le chat avec ${sellerName} s'est ouvert`,
          variant: "default",
        })
      }
      
      // Ici on pourrait ajouter la logique pour ouvrir le modal de chat
      // ou naviguer vers la page de chat
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le chat pour le moment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Vérifier si une conversation existe déjà avec ce vendeur
  const existingSession = chatSessions.find(session => session.sellerId === sellerId)
  const hasUnreadMessages = (existingSession?.unreadCount || 0) > 0

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
export const ProductChatButton: React.FC<ChatButtonProps> = (props) => {
  return (
    <ChatButton
      {...props}
      variant="outline"
      size="sm"
      className="w-full"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Contacter le vendeur
    </ChatButton>
  )
}

// Variante pour les modals
export const ModalChatButton: React.FC<ChatButtonProps> = (props) => {
  return (
    <ChatButton
      {...props}
      variant="default"
      size="default"
      className="w-full bg-orange-600 hover:bg-orange-700"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Démarrer une conversation
    </ChatButton>
  )
}

// Variante pour les listes
export const ListChatButton: React.FC<ChatButtonProps> = (props) => {
  return (
    <ChatButton
      {...props}
      variant="ghost"
      size="sm"
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
    >
      <MessageCircle className="w-4 h-4 mr-1" />
      Chat
    </ChatButton>
  )
}
