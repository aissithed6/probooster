"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Message {
  id: string
  text: string
  sender: 'user' | 'seller' | 'system'
  timestamp: Date
  type: 'text' | 'product' | 'system' | 'file' | 'audio'
  fileUrl?: string
  fileName?: string
  fileSize?: string
  fileType?: string
  productId?: number
}

export interface ChatSession {
  id: string
  productId: number
  sellerId: string
  messages: Message[]
  isTyping: boolean
  lastActivity: Date
}

interface ChatContextType {
  // Sessions de chat
  chatSessions: ChatSession[]
  currentSession: ChatSession | null
  
  // Actions
  createOrGetSession: (productId: number, sellerId: string) => ChatSession
  addMessage: (sessionId: string, message: Omit<Message, 'id' | 'timestamp'>) => void
  setTyping: (sessionId: string, isTyping: boolean) => void
  clearSession: (sessionId: string) => void
  
  // Widget de chat global
  openChatWidget: (product: any, seller: any) => void
  closeChatWidget: () => void
  isGlobalChatOpen: boolean
  globalChatProduct: any | null
  globalChatSeller: any | null
  
  // État global
  isAnyChatOpen: boolean
  setIsAnyChatOpen: (isOpen: boolean) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isAnyChatOpen, setIsAnyChatOpen] = useState(false)
  
  // État du widget de chat global
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false)
  const [globalChatProduct, setGlobalChatProduct] = useState<any>(null)
  const [globalChatSeller, setGlobalChatSeller] = useState<any>(null)

  // Charger les sessions depuis localStorage au démarrage
  useEffect(() => {
    const savedSessions = localStorage.getItem('chatSessions')
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions)
        // Convertir les timestamps en objets Date
        const sessionsWithDates = parsed.map((session: any) => ({
          ...session,
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          lastActivity: new Date(session.lastActivity)
        }))
        setChatSessions(sessionsWithDates)
      } catch (error) {
        console.error('Erreur lors du chargement des sessions de chat:', error)
      }
    }
  }, [])

  // Sauvegarder les sessions dans localStorage quand elles changent
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions))
  }, [chatSessions])

  const createOrGetSession = (productId: number, sellerId: string): ChatSession => {
    const existingSession = chatSessions.find(
      session => session.productId === productId && session.sellerId === sellerId
    )

    if (existingSession) {
      setCurrentSession(existingSession)
      return existingSession
    }

    // Créer une nouvelle session
    const newSession: ChatSession = {
      id: `${productId}-${sellerId}-${Date.now()}`,
      productId,
      sellerId,
      messages: [
        {
          id: '1',
          text: `Bonjour ! Je suis le vendeur. Comment puis-je vous aider avec ce produit ?`,
          sender: 'seller',
          timestamp: new Date(),
          type: 'text',
          productId
        },
        {
          id: '2',
          text: 'Voici les détails du produit que vous consultez :',
          sender: 'seller',
          timestamp: new Date(),
          type: 'product',
          productId
        }
      ],
      isTyping: false,
      lastActivity: new Date()
    }

    setChatSessions(prev => [...prev, newSession])
    setCurrentSession(newSession)
    return newSession
  }

  const addMessage = (sessionId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...messageData,
      id: Date.now().toString(),
      timestamp: new Date()
    }

    setChatSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages: [...session.messages, message],
          lastActivity: new Date()
        }
      }
      return session
    }))

    // Mettre à jour la session courante si c'est celle-ci
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
        lastActivity: new Date()
      } : null)
    }
  }

  const setTyping = (sessionId: string, isTyping: boolean) => {
    setChatSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return { ...session, isTyping }
      }
      return session
    }))

    // Mettre à jour la session courante si c'est celle-ci
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, isTyping } : null)
    }
  }

  const clearSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== sessionId))
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null)
    }
  }
  
  // Fonctions pour le widget de chat global
  const openChatWidget = (product: any, seller: any) => {
    setGlobalChatProduct(product)
    setGlobalChatSeller(seller)
    setIsGlobalChatOpen(true)
    setIsAnyChatOpen(true)
  }
  
  const closeChatWidget = () => {
    setIsGlobalChatOpen(false)
    setGlobalChatProduct(null)
    setGlobalChatSeller(null)
    setIsAnyChatOpen(false)
  }

  const value: ChatContextType = {
    chatSessions,
    currentSession,
    createOrGetSession,
    addMessage,
    setTyping,
    clearSession,
    openChatWidget,
    closeChatWidget,
    isGlobalChatOpen,
    globalChatProduct,
    globalChatSeller,
    isAnyChatOpen,
    setIsAnyChatOpen
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
