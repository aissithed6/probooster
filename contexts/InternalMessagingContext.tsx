"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'
import { InternalMessagingService } from '@/lib/services/internal-messaging-service'
import type { InternalMessage, MessageParticipant } from '@/lib/services/internal-messaging-service'

interface InternalMessagingContextType {
  // Messages
  messages: InternalMessage[]
  receivedMessages: InternalMessage[]
  sentMessages: InternalMessage[]
  unreadCount: number
  
  // États
  isLoading: boolean
  isSyncing: boolean
  
  // Actions
  sendMessage: (
    recipientId: string,
    subject: string,
    content: string,
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      category?: 'support' | 'technical' | 'billing' | 'general' | 'account'
      type?: 'internal' | 'support'
      parentMessageId?: string
    }
  ) => Promise<boolean>
  
  replyToMessage: (
    messageId: string,
    content: string
  ) => Promise<boolean>
  
  markAsRead: (messageId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  archiveMessage: (messageId: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>

  toggleImportant: (messageId: string, isImportant?: boolean) => Promise<void>
  updateMessage: (input: {
    messageId: string
    subject: string
    content: string
    category?: any
    priority?: any
  }) => Promise<boolean>
  
  // Recherche et filtres
  searchMessages: (query: string) => Promise<InternalMessage[]>
  filterByCategory: (category: string) => InternalMessage[]
  filterByPriority: (priority: string) => InternalMessage[]
  filterByStatus: (status: string) => InternalMessage[]
  
  // Thread
  getMessageThread: (messageId: string) => Promise<InternalMessage[]>
  
  // Participants
  getParticipantInfo: (userId: string) => Promise<MessageParticipant | null>
  
  // Refresh
  refreshMessages: () => Promise<void>
}

const InternalMessagingContext = createContext<InternalMessagingContextType | undefined>(undefined)

export const useInternalMessaging = () => {
  const context = useContext(InternalMessagingContext)
  if (!context) {
    throw new Error('useInternalMessaging must be used within an InternalMessagingProvider')
  }
  return context
}

interface InternalMessagingProviderProps {
  children: ReactNode
  userId?: string
  userRole?: string
}

export const InternalMessagingProvider: React.FC<InternalMessagingProviderProps> = ({ 
  children, 
  userId,
  userRole
}) => {
  const { toast } = useToast()
  
  const [messages, setMessages] = useState<InternalMessage[]>([])
  const [receivedMessages, setReceivedMessages] = useState<InternalMessage[]>([])
  const [sentMessages, setSentMessages] = useState<InternalMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Charger les messages au démarrage
  useEffect(() => {
    if (userId) {
      loadMessages()
      loadUnreadCount()
    }
  }, [userId])

  // S'abonner aux nouveaux messages en temps réel
  useEffect(() => {
    if (!userId) return

    const subscription = InternalMessagingService.subscribeToMessages(
      userId,
      handleNewMessage
    )

    return () => {
      InternalMessagingService.unsubscribe(subscription)
    }
  }, [userId])

  // S'abonner aux mises à jour de messages
  useEffect(() => {
    if (!userId) return

    const subscription = InternalMessagingService.subscribeToMessageUpdates(
      userId,
      handleMessageUpdate
    )

    return () => {
      InternalMessagingService.unsubscribe(subscription)
    }
  }, [userId])

  /**
   * Charge tous les messages
   */
  const loadMessages = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const allMessagesRaw = await InternalMessagingService.getUserMessages(userId)

      // Dédupliquer par id (protection contre fetch + realtime + refresh qui peut dupliquer)
      const seen = new Set<string>()
      const allMessages = (allMessagesRaw ?? []).filter((m) => {
        const id = String((m as any)?.id ?? '').trim()
        if (!id) return false
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })

      const activeMessages = allMessages.filter(message => message.status === 'active')

      const received = activeMessages.filter(message => message.recipient_id === userId)
      const sent = activeMessages.filter(message => message.sender_id === userId)

      setMessages(allMessages)
      setReceivedMessages(received)
      setSentMessages(sent)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Charge le nombre de messages non lus
   */
  const loadUnreadCount = async () => {
    if (!userId) return

    try {
      const count = await InternalMessagingService.getUnreadCount(userId)
      setUnreadCount(count)
    } catch (error) {
      console.error('Erreur lors du chargement du compteur:', error)
    }
  }

  /**
   * Gère l'arrivée d'un nouveau message en temps réel
   */
  const handleNewMessage = (message: InternalMessage) => {
    setIsSyncing(true)

    // Ajouter le message à la liste (éviter les doublons)
    setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [message, ...prev]))

    // N'ajouter dans la boîte de réception que si c'est bien un message reçu
    if (message.recipient_id === userId) {
      setReceivedMessages(prev => (prev.some(m => m.id === message.id) ? prev : [message, ...prev]))

      // Compteur non-lu uniquement pour les messages reçus
      if (!message.is_read) {
        setUnreadCount(prev => prev + 1)
      }
    }

    // Afficher une notification
    toast({
      title: "Nouveau message",
      description: message.subject,
      variant: "default",
    })

    setIsSyncing(false)
  }

  /**
   * Gère la mise à jour d'un message
   */
  const handleMessageUpdate = (updatedMessage: InternalMessage) => {
    setIsSyncing(true)

    setMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    ))

    setReceivedMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    ))

    setSentMessages(prev => prev.map(msg => 
      msg.id === updatedMessage.id ? updatedMessage : msg
    ))

    // Mettre à jour le compteur si le message est marqué comme lu
    if (updatedMessage.is_read) {
      loadUnreadCount()
    }

    setIsSyncing(false)
  }

  /**
   * Envoie un nouveau message
   */
  const sendMessage = async (
    recipientId: string,
    subject: string,
    content: string,
    options?: any
  ): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive",
      })
      return false
    }

    try {
      const message = await InternalMessagingService.sendMessage(
        userId,
        recipientId,
        subject,
        content,
        options
      )

      if (message) {
        setSentMessages(prev => (prev.some(m => m.id === message.id) ? prev : [message, ...prev]))
        setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [message, ...prev]))

        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès",
          variant: "default",
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      const msg = error instanceof Error ? error.message : "Impossible d'envoyer le message"
      toast({
        title: "Erreur",
        description: msg,
        variant: "destructive",
      })
      return false
    }
  }

  /**
   * Répond à un message
   */
  const replyToMessage = async (
    messageId: string,
    content: string
  ): Promise<boolean> => {
    if (!userId) return false

    try {
      // Récupérer le message original
      const originalMessage = messages.find(m => m.id === messageId)
      if (!originalMessage) return false

      // Règle: un utilisateur ne répond pas à son propre message (évite les conversations incohérentes)
      if (originalMessage.sender_id === userId) {
        toast({
          title: 'Action interdite',
          description: "Vous ne pouvez pas répondre à un message que vous avez vous-même envoyé.",
          variant: 'destructive'
        })
        return false
      }

      // Envoyer la réponse
      const subject = originalMessage.subject.startsWith('Re: ') 
        ? originalMessage.subject 
        : `Re: ${originalMessage.subject}`

      return await sendMessage(
        originalMessage.sender_id,
        subject,
        content,
        {
          parentMessageId: messageId,
          category: originalMessage.category,
          priority: originalMessage.priority
        }
      )
    } catch (error) {
      console.error('Erreur lors de la réponse:', error)
      return false
    }
  }

  /**
   * Marque un message comme lu
   */
  const markAsRead = async (messageId: string) => {
    const success = await InternalMessagingService.markAsRead(messageId)
    if (success) {
      await loadUnreadCount()
    }
  }

  /**
   * Marque tous les messages comme lus
   */
  const markAllAsRead = async () => {
    if (!userId) return

    const success = await InternalMessagingService.markAllAsRead(userId)
    if (success) {
      await loadMessages()
      await loadUnreadCount()
      
      toast({
        title: "Messages marqués",
        description: "Tous les messages ont été marqués comme lus",
        variant: "default",
      })
    }
  }

  /**
   * Archive un message
   */
  const archiveMessage = async (messageId: string) => {
    const success = await InternalMessagingService.archiveMessage(messageId)
    if (success) {
      await loadMessages()
      
      toast({
        title: "Message archivé",
        description: "Le message a été archivé",
        variant: "default",
      })
    }
  }

  /**
   * Supprime un message
   */
  const deleteMessage = async (messageId: string) => {
    const success = await InternalMessagingService.deleteMessage(messageId)
    if (success) {
      await loadMessages()
      
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé",
        variant: "default",
      })
    }
  }

  /**
   * Marque/Démarque un message comme important.
   */
  const toggleImportant = async (messageId: string, isImportant?: boolean) => {
    const updated = await InternalMessagingService.toggleImportant(messageId, isImportant)
    if (!updated) return

    const apply = (prev: InternalMessage[]) => prev.map((m) => (m.id === updated.id ? updated : m))
    setMessages(apply)
    setReceivedMessages(apply)
    setSentMessages(apply)
  }

  /**
   * Modifie un message (uniquement expéditeur).
   */
  const updateMessage = async (input: {
    messageId: string
    subject: string
    content: string
    category?: any
    priority?: any
  }): Promise<boolean> => {
    const updated = await InternalMessagingService.updateMessage({
      messageId: input.messageId,
      subject: input.subject,
      content: input.content,
      category: input.category,
      priority: input.priority
    })

    if (!updated) {
      toast({
        title: 'Erreur',
        description: "Impossible de modifier le message.",
        variant: 'destructive'
      })
      return false
    }

    const apply = (prev: InternalMessage[]) => prev.map((m) => (m.id === updated.id ? updated : m))
    setMessages(apply)
    setReceivedMessages(apply)
    setSentMessages(apply)
    return true
  }

  /**
   * Recherche dans les messages
   */
  const searchMessages = async (query: string): Promise<InternalMessage[]> => {
    if (!userId) return []
    return await InternalMessagingService.searchMessages(userId, query)
  }

  /**
   * Filtre par catégorie
   */
  const filterByCategory = (category: string): InternalMessage[] => {
    if (category === 'all') return messages
    return messages.filter(msg => msg.category === category)
  }

  /**
   * Filtre par priorité
   */
  const filterByPriority = (priority: string): InternalMessage[] => {
    if (priority === 'all') return messages
    return messages.filter(msg => msg.priority === priority)
  }

  /**
   * Filtre par statut
   */
  const filterByStatus = (status: string): InternalMessage[] => {
    if (status === 'all') return messages
    if (status === 'unread') return messages.filter(msg => !msg.is_read && msg.recipient_id === userId)
    if (status === 'read') return messages.filter(msg => msg.is_read || msg.sender_id === userId)
    return messages.filter(msg => msg.status === status)
  }

  /**
   * Récupère le thread d'un message
   */
  const getMessageThread = async (messageId: string): Promise<InternalMessage[]> => {
    return await InternalMessagingService.getMessageThread(messageId)
  }

  /**
   * Récupère les infos d'un participant
   */
  const getParticipantInfo = async (participantId: string): Promise<MessageParticipant | null> => {
    return await InternalMessagingService.getParticipantInfo(participantId)
  }

  /**
   * Rafraîchit les messages
   */
  const refreshMessages = async () => {
    await loadMessages()
    await loadUnreadCount()
  }

  const contextValue: InternalMessagingContextType = {
    messages,
    receivedMessages,
    sentMessages,
    unreadCount,
    isLoading,
    isSyncing,
    sendMessage,
    replyToMessage,
    markAsRead,
    markAllAsRead,
    archiveMessage,
    deleteMessage,
    toggleImportant,
    updateMessage,
    searchMessages,
    filterByCategory,
    filterByPriority,
    filterByStatus,
    getMessageThread,
    getParticipantInfo,
    refreshMessages
  }

  return (
    <InternalMessagingContext.Provider value={contextValue}>
      {children}
    </InternalMessagingContext.Provider>
  )
}
