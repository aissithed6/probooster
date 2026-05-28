'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'

// Types pour les conversations
export interface ChatMessage {
  id: string
  type: 'text' | 'product' | 'image' | 'document'
  content: string
  sender: 'user' | 'seller'
  timestamp: string
  product?: any
  imageUrl?: string
  fileName?: string
  fileSize?: number
  fileType?: string
}

export interface ChatSession {
  id: string
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
  isActive: boolean
}

export interface MessageDeliveryStatus {
  status: 'sending' | 'sent' | 'delivered' | 'read'
  timestamp: string
}

export interface MessageStatus {
  isRead: boolean
  isImportant: boolean
  isUrgent: boolean
  isToResolve: boolean
  isArchived: boolean
}

// Interface du contexte
interface ChatContextType {
  // Conversations
  chatSessions: ChatSession[]
  activeChatSession: ChatSession | null
  
  // Messages
  messages: ChatMessage[]
  messageStatuses: { [key: string]: MessageStatus }
  messageDeliveryStatus: { [key: string]: MessageDeliveryStatus }
  
  // Actions
  createChatSession: (sellerId: string, sellerName: string, sellerAvatar?: string) => string
  openChatSession: (sessionId: string) => void
  closeChatSession: () => void
  sendMessage: (content: string, type?: 'text' | 'product' | 'image' | 'document', product?: any, fileData?: any) => void
  addProductToChat: (product: any) => void
  addFileToChat: (file: File) => void
  
  // Gestion des statuts
  updateMessageStatus: (messageId: string, status: keyof MessageStatus, value: boolean) => void
  markMessageAsRead: (messageId: string) => void
  markMessageAsImportant: (messageId: string) => void
  markMessageAsUrgent: (messageId: string) => void
  markMessageToResolve: (messageId: string) => void
  archiveMessage: (messageId: string) => void
  
  // Sélection de messages
  selectedMessageIds: string[]
  toggleMessageSelection: (messageId: string) => void
  selectAllMessages: () => void
  deselectAllMessages: () => void
  deleteSelectedMessages: () => void
  archiveSelectedMessages: () => void
  transferSelectedMessages: (sellerId: string) => void
  
  // Recherche et filtres
  searchQuery: string
  setSearchQuery: (query: string) => void
  activeTab: 'conversations' | 'produits'
  setActiveTab: (tab: 'conversations' | 'produits') => void
}

// Création du contexte
const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Hook personnalisé pour utiliser le contexte
export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

// Props du provider
interface ChatProviderProps {
  children: ReactNode
}

// Provider du contexte
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { toast } = useToast()
  
  // États des conversations
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null)
  
  // États des messages
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageStatuses, setMessageStatuses] = useState<{ [key: string]: MessageStatus }>({})
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState<{ [key: string]: MessageDeliveryStatus }>({})
  
  // États de sélection
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([])
  
  // États de recherche et filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'conversations' | 'produits'>('conversations')
  
  // Créer une nouvelle session de chat
  const createChatSession = (sellerId: string, sellerName: string, sellerAvatar?: string): string => {
    // Vérifier si une session existe déjà
    const existingSession = chatSessions.find(session => session.sellerId === sellerId)
    if (existingSession) {
      return existingSession.id
    }
    
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      sellerId,
      sellerName,
      sellerAvatar,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: [],
      isActive: false
    }
    
    setChatSessions(prev => [...prev, newSession])
    return newSession.id
  }
  
  // Ouvrir une session de chat
  const openChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      setActiveChatSession(session)
      setMessages(session.messages)
      
      // Marquer comme active
      setChatSessions(prev => prev.map(s => ({
        ...s,
        isActive: s.id === sessionId
      })))
    }
  }
  
  // Fermer la session active
  const closeChatSession = () => {
    setActiveChatSession(null)
    setMessages([])
    setSelectedMessageIds([])
    
    // Marquer toutes les sessions comme inactives
    setChatSessions(prev => prev.map(s => ({ ...s, isActive: false })))
  }
  
  // Envoyer un message
  const sendMessage = (content: string, type: 'text' | 'product' | 'image' | 'document' = 'text', product?: any, fileData?: any) => {
    if (!activeChatSession) return
    
    const messageId = Date.now().toString()
    const newMessage: ChatMessage = {
      id: messageId,
      type,
      content,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      product,
      ...fileData
    }
    
    // Ajouter le message à la session active
    const updatedSession = {
      ...activeChatSession,
      messages: [...activeChatSession.messages, newMessage],
      lastMessage: content,
      lastMessageTime: new Date().toISOString()
    }
    
    setChatSessions(prev => prev.map(s => 
      s.id === activeChatSession.id ? updatedSession : s
    ))
    
    setActiveChatSession(updatedSession)
    setMessages(updatedSession.messages)
    
    // Définir le statut initial du message
    setMessageDeliveryStatus(prev => ({
      ...prev,
      [messageId]: {
        status: 'sending',
        timestamp: new Date().toISOString()
      }
    }))
    
    // Simuler la progression du statut
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: { status: 'sent', timestamp: new Date().toISOString() }
      }))
    }, 500)
    
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: { status: 'delivered', timestamp: new Date().toISOString() }
      }))
    }, 1000)
    
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: { status: 'read', timestamp: new Date().toISOString() }
      }))
    }, 2000)
    
    // Simuler une réponse du vendeur
    setTimeout(() => {
      const sellerResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'text',
        content: 'Merci pour votre message ! Je vais vous répondre dans les plus brefs délais.',
        sender: 'seller',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
      
      const sessionWithResponse = {
        ...updatedSession,
        messages: [...updatedSession.messages, sellerResponse],
        lastMessage: sellerResponse.content,
        lastMessageTime: new Date().toISOString()
      }
      
      setChatSessions(prev => prev.map(s => 
        s.id === activeChatSession.id ? sessionWithResponse : s
      ))
      
      setActiveChatSession(sessionWithResponse)
      setMessages(sessionWithResponse.messages)
    }, 2000)
  }
  
  // Ajouter un produit au chat
  const addProductToChat = (product: any) => {
    if (!activeChatSession) return
    
    const productMessageId = Date.now().toString()
    const introMessageId = (Date.now() + 1).toString()
    
    // Message produit
    const productMessage: ChatMessage = {
      id: productMessageId,
      type: 'product',
      content: `Produit référencé : ${product.name}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      product
    }
    
    // Message d'introduction
    const introMessage: ChatMessage = {
      id: introMessageId,
      type: 'text',
      content: `Bonjour ${product.seller} ! 👋 Je suis très intéressé(e) par votre produit "${product.name}". Pourriez-vous me donner plus d'informations sur ses caractéristiques, la disponibilité et les conditions de vente ? Merci d'avance ! 😊`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
    
    // Mettre à jour la session
    const updatedSession = {
      ...activeChatSession,
      messages: [...activeChatSession.messages, productMessage, introMessage],
      lastMessage: introMessage.content,
      lastMessageTime: new Date().toISOString()
    }
    
    setChatSessions(prev => prev.map(s => 
      s.id === activeChatSession.id ? updatedSession : s
    ))
    
    setActiveChatSession(updatedSession)
    setMessages(updatedSession.messages)
    
    // Définir les statuts des messages
    const initialStatus = {
      status: 'sending' as const,
      timestamp: new Date().toISOString()
    }
    
    setMessageDeliveryStatus(prev => ({
      ...prev,
      [productMessageId]: initialStatus,
      [introMessageId]: initialStatus
    }))
    
    // Simuler la progression des statuts
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [productMessageId]: { status: 'sent', timestamp: new Date().toISOString() },
        [introMessageId]: { status: 'sent', timestamp: new Date().toISOString() }
      }))
    }, 500)
    
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [productMessageId]: { status: 'delivered', timestamp: new Date().toISOString() },
        [introMessageId]: { status: 'delivered', timestamp: new Date().toISOString() }
      }))
    }, 1000)
    
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [productMessageId]: { status: 'read', timestamp: new Date().toISOString() },
        [introMessageId]: { status: 'read', timestamp: new Date().toISOString() }
      }))
    }, 2000)
    
    toast({
      title: "Chat ouvert avec le vendeur !",
      description: `Le chat avec ${product.seller} s'est ouvert avec votre produit référencé`,
      variant: "default",
    })
  }
  
  // Ajouter un fichier au chat
  const addFileToChat = (file: File) => {
    if (!activeChatSession) return
    
    const messageId = Date.now().toString()
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        
        const imageMessage: ChatMessage = {
          id: messageId,
          type: 'image',
          content: `Image: ${file.name}`,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          imageUrl,
          fileName: file.name,
          fileSize: file.size
        }
        
        // Mettre à jour la session
        const updatedSession = {
          ...activeChatSession,
          messages: [...activeChatSession.messages, imageMessage],
          lastMessage: `Image: ${file.name}`,
          lastMessageTime: new Date().toISOString()
        }
        
        setChatSessions(prev => prev.map(s => 
          s.id === activeChatSession.id ? updatedSession : s
        ))
        
        setActiveChatSession(updatedSession)
        setMessages(updatedSession.messages)
        
        // Gérer le statut du message
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: {
            status: 'sending',
            timestamp: new Date().toISOString()
          }
        }))
        
        // Simuler la progression du statut
        setTimeout(() => {
          setMessageDeliveryStatus(prev => ({
            ...prev,
            [messageId]: { status: 'sent', timestamp: new Date().toISOString() }
          }))
        }, 500)
        
        setTimeout(() => {
          setMessageDeliveryStatus(prev => ({
            ...prev,
            [messageId]: { status: 'delivered', timestamp: new Date().toISOString() }
          }))
        }, 1000)
        
        setTimeout(() => {
          setMessageDeliveryStatus(prev => ({
            ...prev,
            [messageId]: { status: 'read', timestamp: new Date().toISOString() }
          }))
        }, 2000)
        
        toast({
          title: "Image ajoutée !",
          description: `${file.name} a été ajoutée au chat`,
          variant: "default",
        })
      }
      reader.readAsDataURL(file)
    } else {
      const documentMessage: ChatMessage = {
        id: messageId,
        type: 'document',
        content: `Document: ${file.name}`,
        sender: 'user',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
      
      // Mettre à jour la session
      const updatedSession = {
        ...activeChatSession,
        messages: [...activeChatSession.messages, documentMessage],
        lastMessage: `Document: ${file.name}`,
        lastMessageTime: new Date().toISOString()
      }
      
      setChatSessions(prev => prev.map(s => 
        s.id === activeChatSession.id ? updatedSession : s
      ))
      
      setActiveChatSession(updatedSession)
      setMessages(updatedSession.messages)
      
      // Gérer le statut du message
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: {
          status: 'sending',
          timestamp: new Date().toISOString()
        }
      }))
      
      // Simuler la progression du statut
      setTimeout(() => {
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: { status: 'sent', timestamp: new Date().toISOString() }
        }))
      }, 500)
      
      setTimeout(() => {
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: { status: 'delivered', timestamp: new Date().toISOString() }
        }))
      }, 1000)
      
      setTimeout(() => {
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: { status: 'read', timestamp: new Date().toISOString() }
        }))
      }, 2000)
      
      toast({
        title: "Document ajouté !",
        description: `${file.name} a été ajouté au chat`,
        variant: "default",
      })
    }
  }
  
  // Gestion des statuts des messages
  const updateMessageStatus = (messageId: string, status: keyof MessageStatus, value: boolean) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [status]: value
      }
    }))
  }
  
  const markMessageAsRead = (messageId: string) => {
    updateMessageStatus(messageId, 'isRead', true)
  }
  
  const markMessageAsImportant = (messageId: string) => {
    updateMessageStatus(messageId, 'isImportant', true)
  }
  
  const markMessageAsUrgent = (messageId: string) => {
    updateMessageStatus(messageId, 'isUrgent', true)
  }
  
  const markMessageToResolve = (messageId: string) => {
    updateMessageStatus(messageId, 'isToResolve', true)
  }
  
  const archiveMessage = (messageId: string) => {
    updateMessageStatus(messageId, 'isArchived', true)
  }
  
  // Gestion de la sélection des messages
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds(prev => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId)
      } else {
        return [...prev, messageId]
      }
    })
  }
  
  const selectAllMessages = () => {
    setSelectedMessageIds(messages.map(msg => msg.id))
  }
  
  const deselectAllMessages = () => {
    setSelectedMessageIds([])
  }
  
  const deleteSelectedMessages = () => {
    if (!activeChatSession) return
    
    const updatedMessages = messages.filter(msg => !selectedMessageIds.includes(msg.id))
    const updatedSession = {
      ...activeChatSession,
      messages: updatedMessages,
      lastMessage: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].content : '',
      lastMessageTime: updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1].timestamp : new Date().toISOString()
    }
    
    setChatSessions(prev => prev.map(s => 
      s.id === activeChatSession.id ? updatedSession : s
    ))
    
    setActiveChatSession(updatedSession)
    setMessages(updatedMessages)
    setSelectedMessageIds([])
    
    toast({
      title: "Messages supprimés",
      description: `${selectedMessageIds.length} message(s) supprimé(s)`,
      variant: "default",
    })
  }
  
  const archiveSelectedMessages = () => {
    selectedMessageIds.forEach(id => archiveMessage(id))
    setSelectedMessageIds([])
    
    toast({
      title: "Messages archivés",
      description: `${selectedMessageIds.length} message(s) archivé(s)`,
      variant: "default",
    })
  }
  
  const transferSelectedMessages = (sellerId: string) => {
    // Logique de transfert des messages vers un autre vendeur
    toast({
      title: "Messages transférés",
      description: `${selectedMessageIds.length} message(s) transféré(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
  }
  
  // Valeur du contexte
  const contextValue: ChatContextType = {
    // Conversations
    chatSessions,
    activeChatSession,
    
    // Messages
    messages,
    messageStatuses,
    messageDeliveryStatus,
    
    // Actions
    createChatSession,
    openChatSession,
    closeChatSession,
    sendMessage,
    addProductToChat,
    addFileToChat,
    
    // Gestion des statuts
    updateMessageStatus,
    markMessageAsRead,
    markMessageAsImportant,
    markMessageAsUrgent,
    markMessageToResolve,
    archiveMessage,
    
    // Sélection de messages
    selectedMessageIds,
    toggleMessageSelection,
    selectAllMessages,
    deselectAllMessages,
    deleteSelectedMessages,
    archiveSelectedMessages,
    transferSelectedMessages,
    
    // Recherche et filtres
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab
  }
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}
