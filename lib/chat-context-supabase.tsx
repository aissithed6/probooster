"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ChatService } from './services/chat-service'
import type { ChatSession as SupabaseChatSession, ChatMessage as SupabaseChatMessage } from './services/chat-service'
import { supabase } from './supabase'

// Types pour les conversations (compatibles avec l'interface existante)
export interface ChatMessage {
  id: string
  type: 'text' | 'product' | 'image' | 'document'
  content: string
  sender: 'user' | 'seller'
  timestamp: string
  product?: any
  imageUrl?: string
  fileUrl?: string
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
  createChatSession: (sellerId: string, sellerName: string, sellerAvatar?: string) => Promise<string>
  openChatSession: (sessionId: string, openGlobalUI?: boolean) => void
  closeChatSession: () => void
  sendMessage: (content: string, type?: 'text' | 'product' | 'image' | 'document', product?: any, fileData?: any) => Promise<void>
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
  
  // Widget de chat global (pour compatibilité)
  openChatWidget: (product: any, seller: any) => void
  closeChatWidget: () => void
  isGlobalChatOpen: boolean
  globalChatProduct: any | null
  globalChatSeller: any | null
  
  // État global
  isAnyChatOpen: boolean
  setIsAnyChatOpen: (isOpen: boolean) => void
  
  // Synchronisation
  isLoading: boolean
  isSyncing: boolean
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

// Provider du contexte avec synchronisation Supabase
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast()
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  const [userId, setUserId] = useState('')
  
  // États des conversations
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  // Miroir synchrone de chatSessions (évite les closures obsolètes lors de la
  // création puis de l'ouverture immédiate d'une session).
  const chatSessionsRef = useRef<ChatSession[]>([])
  useEffect(() => {
    chatSessionsRef.current = chatSessions
  }, [chatSessions])
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
  
  // États pour la compatibilité avec l'ancien système
  const [isAnyChatOpen, setIsAnyChatOpen] = useState(false)

  const markReadThrottleRef = useRef<Record<string, number>>({})
  const inFlightMessagesFetchRef = useRef<Record<string, boolean>>({})
  const messageSubscriptionsRef = useRef<Record<string, any>>({})
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false)
  const [globalChatProduct, setGlobalChatProduct] = useState<any>(null)
  const [globalChatSeller, setGlobalChatSeller] = useState<any>(null)
  
  // États de synchronisation
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const next = String(data?.user?.id ?? '').trim()
        if (isMounted) setUserId(next)
      } catch {
        if (isMounted) setUserId('')
      }
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = String(session?.user?.id ?? '').trim()
      setUserId(next)
    })

    return () => {
      isMounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  const CHAT_UPLOAD_BUCKET =
    (process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET && process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim())
      ? process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim()
      : 'chat-uploads'
  const ATTACHMENT_PREFIX = '__attachment__:'
  const PRODUCT_PREFIX = '__product__:'

  type AttachmentPayload = {
    kind: 'image' | 'video' | 'audio' | 'document' | 'file'
    url: string
    name?: string
    size?: number
    mime?: string
    text?: string
  }

  type ProductPayload = {
    product: any
    text?: string
  }

  /**
   * Encode les métadonnées d'une pièce jointe dans `content` pour rester compatible avec le schéma DB existant.
   */
  const encodeAttachmentContent = (payload: AttachmentPayload): string => {
    return `${ATTACHMENT_PREFIX}${JSON.stringify(payload)}`
  }

  /**
   * Décode `content` si c'est un message pièce jointe encodé.
   */
  const decodeAttachmentContent = (content: string): AttachmentPayload | null => {
    const raw = String(content ?? '')
    if (!raw.startsWith(ATTACHMENT_PREFIX)) return null
    const jsonPart = raw.slice(ATTACHMENT_PREFIX.length)
    try {
      const parsed = JSON.parse(jsonPart)
      if (!parsed || typeof parsed !== 'object') return null
      const kind = String((parsed as any).kind)
      const url = String((parsed as any).url ?? '')
      if (!url) return null

      const mime = typeof (parsed as any).mime === 'string' ? String((parsed as any).mime) : undefined
      const normalizeKind = (input: string): AttachmentPayload['kind'] => {
        const candidate = String(input ?? '').toLowerCase().trim()
        if (candidate === 'image' || candidate === 'video' || candidate === 'audio' || candidate === 'document' || candidate === 'file') {
          return candidate as any
        }
        if (mime) {
          const m = mime.toLowerCase()
          if (m.startsWith('image/')) return 'image'
          if (m.startsWith('video/')) return 'video'
          if (m.startsWith('audio/')) return 'audio'
        }
        return 'document'
      }
      return {
        kind: normalizeKind(kind),
        url,
        name: typeof (parsed as any).name === 'string' ? (parsed as any).name : undefined,
        size: typeof (parsed as any).size === 'number' ? (parsed as any).size : undefined,
        mime,
        text: typeof (parsed as any).text === 'string' ? (parsed as any).text : undefined
      }
    } catch {
      return null
    }
  }

  /**
   * Encode un produit (payload) dans `content` pour persister le lien produit↔message.
   */
  const encodeProductContent = (payload: ProductPayload): string => {
    return `${PRODUCT_PREFIX}${JSON.stringify(payload)}`
  }

  /**
   * Normalise un objet produit afin qu'il contienne des champs image attendus
   * par les différentes UI (client dashboard / super-admin / chat global).
   */
  const normalizeProductForChatPayload = (product: any): any => {
    if (!product || typeof product !== 'object') return product

    const anyP = product as any
    const metadata = (anyP?.metadata && typeof anyP.metadata === 'object' && !Array.isArray(anyP.metadata)) ? anyP.metadata : {}

    const imgFromMeta = typeof (metadata as any)?.thumbnail === 'string' ? String((metadata as any).thumbnail).trim() : ''
    const imgFromMain = typeof anyP?.mainImage === 'string' ? String(anyP.mainImage).trim() : ''
    const imgFromImage = typeof anyP?.image === 'string' ? String(anyP.image).trim() : ''
    const imgFromImageUrl = typeof anyP?.imageUrl === 'string' ? String(anyP.imageUrl).trim() : ''
    const imgFromImageUrlSnake = typeof anyP?.image_url === 'string' ? String(anyP.image_url).trim() : ''
    const gallery = Array.isArray(anyP?.galleryImages) ? anyP.galleryImages.filter((x: any) => typeof x === 'string') : []
    const imagesArray = Array.isArray(anyP?.images) ? anyP.images.filter((x: any) => typeof x === 'string') : []

    const primary = imgFromImageUrlSnake || imgFromImageUrl || imgFromMeta || imgFromMain || imgFromImage || gallery[0] || imagesArray[0] || ''
    const mergedImages = Array.from(new Set([primary, ...imagesArray, ...gallery].filter((x) => typeof x === 'string' && x.trim().length > 0)))

    return {
      ...anyP,
      image_url: imgFromImageUrlSnake || primary,
      imageUrl: imgFromImageUrl || primary,
      image: imgFromImage || primary,
      images: mergedImages.length > 0 ? mergedImages : imagesArray
    }
  }

  /**
   * Décode `content` si c'est un message produit encodé.
   */
  const decodeProductContent = (content: string): ProductPayload | null => {
    const raw = String(content ?? '')
    if (!raw.startsWith(PRODUCT_PREFIX)) return null
    const jsonPart = raw.slice(PRODUCT_PREFIX.length)
    try {
      const parsed = JSON.parse(jsonPart)
      if (!parsed || typeof parsed !== 'object') return null
      if (!('product' in (parsed as any))) return null
      return {
        product: (parsed as any).product,
        text: typeof (parsed as any).text === 'string' ? (parsed as any).text : undefined
      }
    } catch {
      return null
    }
  }

  /**
   * Normalise le texte affichable (preview) à partir d'un contenu DB encodé.
   */
  const toDisplayTextFromDbContent = (rawContent: string): string => {
    const maybeProduct = decodeProductContent(rawContent)
    if (maybeProduct?.product) {
      const name = String((maybeProduct.product as any)?.name ?? '').trim()
      const fallback = name ? `Produit: ${name}` : 'Produit partagé'
      return String(maybeProduct.text ?? '').trim() || fallback
    }

    const maybeAttachment = decodeAttachmentContent(rawContent)
    if (maybeAttachment?.url) {
      const base = String(maybeAttachment.text ?? '').trim()
      if (base) return base
      if (maybeAttachment.kind === 'image') return 'Image'
      if (maybeAttachment.kind === 'audio') return 'Audio'
      if (maybeAttachment.kind === 'video') return 'Vidéo'
      if (maybeAttachment.kind === 'document') return 'Document'
      return 'Fichier'
    }

    return String(rawContent ?? '')
  }

  /**
   * Upload un fichier sur Supabase Storage et retourne l'URL publique.
   * Note: nécessite un bucket `chat-uploads` configuré côté Supabase.
   */
  const uploadChatAttachment = async (chatId: string, file: File): Promise<string> => {
    const ext = (() => {
      const name = String(file.name ?? '').trim()
      const idx = name.lastIndexOf('.')
      if (idx <= 0) return ''
      return name.slice(idx + 1).toLowerCase()
    })()

    const safeExt = ext ? `.${ext}` : ''
    const path = `chat/${encodeURIComponent(chatId)}/${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`

    const { error } = await ChatService.uploadFileToStorage(CHAT_UPLOAD_BUCKET, path, file)
    if (error) {
      const anyErr = error as any
      const msg = String(anyErr?.message ?? anyErr?.error ?? anyErr?.toString?.() ?? '')
      const lower = msg.toLowerCase()

      if (lower.includes('bucket') && lower.includes('not') && lower.includes('found')) {
        throw new Error(
          `Bucket Storage introuvable: "${CHAT_UPLOAD_BUCKET}". Créez-le dans Supabase Storage (ou définissez NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET).`
        )
      }

      throw error
    }

    const url = ChatService.getPublicUrlFromStorage(CHAT_UPLOAD_BUCKET, path)
    if (!url) {
      throw new Error(
        `URL de fichier indisponible. Vérifiez que le bucket "${CHAT_UPLOAD_BUCKET}" est public (ou que vos policies autorisent l'accès).`
      )
    }
    return url
  }

  /**
   * Convertit un type UI (incluant 'product'/'document') en type DB supporté par la table `chat_messages`.
   */
  const toDbMessageType = (
    type: 'text' | 'product' | 'image' | 'document'
  ): 'text' | 'image' | 'file' | 'system' => {
    if (type === 'document') return 'file'
    if (type === 'product') return 'system'
    if (type === 'image') return 'image'
    return 'text'
  }

  /**
   * Convertit un type DB en type UI (pour compatibilité avec l'interface existante).
   */
  const fromDbMessageType = (dbType: string): ChatMessage['type'] => {
    if (dbType === 'file') return 'document'
    if (dbType === 'image') return 'image'
    return 'text'
  }

  /**
   * Formate un timestamp ISO en heure locale (HH:mm) pour l'affichage.
   */
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  /**
   * Trie les sessions par date du dernier message (desc) pour afficher les plus récentes en haut.
   */
  const sortSessionsByLastMessage = (sessions: ChatSession[]) => {
    const toTime = (v: string) => {
      const t = new Date(String(v ?? '')).getTime()
      return Number.isNaN(t) ? 0 : t
    }

    return [...sessions].sort((a, b) => toTime(b.lastMessageTime) - toTime(a.lastMessageTime))
  }
  
  // Charger les sessions de chat depuis Supabase au démarrage
  useEffect(() => {
    if (userId) {
      loadChatSessions()
    }
  }, [userId])
  
  // S'abonner aux mises à jour en temps réel
  useEffect(() => {
    if (!userId) return
    
    const subscription = ChatService.subscribeToChatSessions(userId, handleChatSessionUpdate)
    
    return () => {
      ChatService.unsubscribe(subscription)
    }
  }, [userId])
  
  // S'abonner aux nouveaux messages de la session active
  useEffect(() => {
    /**
     * Synchronise les subscriptions realtime pour garantir un affichage instantané.
     * On s'abonne aux messages de TOUTES les sessions connues afin que les messages entrants
     * s'affichent côté vendeur sans refresh (même si la session n'est pas ouverte).
     */
    if (!userId) return

    const sessionIds = Array.from(
      new Set((Array.isArray(chatSessions) ? chatSessions : []).map((s) => String(s?.id ?? '').trim()).filter(Boolean))
    )

    // Ajouter les nouvelles subscriptions
    for (const sid of sessionIds) {
      if (messageSubscriptionsRef.current[sid]) continue
      messageSubscriptionsRef.current[sid] = ChatService.subscribeToMessages(sid, handleNewMessage)
    }

    // Retirer celles qui ne sont plus nécessaires
    for (const existingId of Object.keys(messageSubscriptionsRef.current)) {
      if (sessionIds.includes(existingId)) continue
      try {
        ChatService.unsubscribe(messageSubscriptionsRef.current[existingId])
      } catch {
        // ignore
      }
      delete messageSubscriptionsRef.current[existingId]
    }

    return () => {
      // Nettoyage global au démontage
      for (const existingId of Object.keys(messageSubscriptionsRef.current)) {
        try {
          ChatService.unsubscribe(messageSubscriptionsRef.current[existingId])
        } catch {
          // ignore
        }
      }
      messageSubscriptionsRef.current = {}
    }
  }, [userId, chatSessions])
  
  /**
   * Charge toutes les sessions de chat depuis Supabase
   */
  const loadChatSessions = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const sessions = await ChatService.getUserChatSessions(userId)

      const chatIds = sessions.map((s) => s.id)
      const lastByChatId = await ChatService.getLastMessagesByChatId(chatIds)
      
      // Convertir les sessions Supabase en format local
      const convertedSessions: ChatSession[] = await Promise.all(
        sessions.map(async (session) => {
          const otherUserId = session.participant1_id === userId 
            ? session.participant2_id 
            : session.participant1_id
          
          const participant = await ChatService.getParticipantInfo(otherUserId)
          const last = lastByChatId[session.id]
          const lastMessage = toDisplayTextFromDbContent(String(last?.content ?? ''))
          const lastMessageAt = String(last?.created_at ?? session.last_message_at)
          
          return {
            id: session.id,
            sellerId: otherUserId,
            sellerName: participant?.name || 'Utilisateur',
            sellerAvatar: participant?.avatar_url,
            lastMessage: lastMessage,
            lastMessageTime: lastMessageAt,
            unreadCount: 0,
            messages: [],
            isActive: session.is_active
          }
        })
      )
      
      setChatSessions(sortSessionsByLastMessage(convertedSessions))
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Convertit les messages Supabase en format local
   */
  const convertMessages = (supabaseMessages: SupabaseChatMessage[], currentUserId: string): ChatMessage[] => {
    return supabaseMessages.map(msg => {
      const dbType = String(msg.message_type ?? 'text')
      const base: ChatMessage = {
        id: msg.id,
        type: fromDbMessageType(dbType),
        content: toDisplayTextFromDbContent(String(msg.content ?? '')),
        sender: msg.sender_id === currentUserId ? 'user' : 'seller',
        timestamp: formatTime(msg.created_at)
      }

      const maybeProduct = decodeProductContent(String(msg.content ?? ''))
      if (maybeProduct?.product) {
        base.type = 'product'
        base.product = maybeProduct.product
      }

      if (dbType === 'image' || dbType === 'file') {
        const payload = decodeAttachmentContent(String(msg.content ?? ''))
        if (payload?.url) {
          if (payload.kind === 'image') {
            base.type = 'image'
            base.imageUrl = payload.url
            base.content = payload.text ?? ''
          } else {
            base.type = 'document'
            base.fileUrl = payload.url
            base.fileName = payload.name
            base.fileSize = payload.size
            base.fileType = payload.mime
            base.content = payload.text ?? ''
          }
        }
      }

      return base
    })
  }
  
  /**
   * Gère les mises à jour de session en temps réel
   */
  const handleChatSessionUpdate = async (session: SupabaseChatSession) => {
    if (!userId) return
    
    setIsSyncing(true)
    
    const otherUserId = session.participant1_id === userId 
      ? session.participant2_id 
      : session.participant1_id
    
    const participant = await ChatService.getParticipantInfo(otherUserId)
    const lastByChatId = await ChatService.getLastMessagesByChatId([session.id])
    const last = lastByChatId[session.id]
    const lastMessage = toDisplayTextFromDbContent(String(last?.content ?? ''))
    const lastMessageAt = String(last?.created_at ?? session.last_message_at)
    
    const updatedSessionBase: ChatSession = {
      id: session.id,
      sellerId: otherUserId,
      sellerName: participant?.name || 'Utilisateur',
      sellerAvatar: participant?.avatar_url,
      lastMessage: lastMessage,
      lastMessageTime: lastMessageAt,
      unreadCount: 0,
      messages: [],
      isActive: session.is_active
    }
    
    setChatSessions(prev => {
      const index = prev.findIndex(s => s.id === session.id)
      if (index >= 0) {
        const newSessions = [...prev]
        const existing = newSessions[index]
        const preservedUnread = typeof existing?.unreadCount === 'number' ? existing.unreadCount : 0
        const updatedSession: ChatSession = {
          ...updatedSessionBase,
          unreadCount: preservedUnread,
          messages: existing?.messages?.length ? existing.messages : updatedSessionBase.messages
        }
        newSessions[index] = {
          ...updatedSession
        }
        return sortSessionsByLastMessage(newSessions)
      } else {
        return sortSessionsByLastMessage([updatedSessionBase, ...prev])
      }
    })
    
    // Mettre à jour la session active si c'est celle-ci
    if (activeChatSession?.id === session.id) {
      const preserved = activeChatSession.messages?.length ? activeChatSession.messages : updatedSessionBase.messages
      const merged = { ...updatedSessionBase, messages: preserved, unreadCount: 0 }
      setActiveChatSession(merged)
      setMessages(preserved)
    }
    
    setIsSyncing(false)
  }
  
  /**
   * Gère les nouveaux messages en temps réel
   */
  const handleNewMessage = (message: SupabaseChatMessage) => {
    if (!userId) return

    const messageSessionId = String((message as any)?.chat_id ?? (message as any)?.session_id ?? (message as any)?.chat_session_id ?? '').trim()
    if (!messageSessionId) return

    const isForActiveSession = activeChatSession?.id === messageSessionId

    const dbType = String((message as any)?.message_type ?? 'text')
    const rawContent = String((message as any)?.content ?? '')
    const maybeProduct = decodeProductContent(rawContent)
    const maybeAttachment = decodeAttachmentContent(rawContent)

    const convertedMessage: ChatMessage = {
      id: message.id,
      type: fromDbMessageType(dbType),
      content: toDisplayTextFromDbContent(rawContent),
      sender: message.sender_id === userId ? 'user' : 'seller',
      timestamp: formatTime(message.created_at)
    }

    if (maybeProduct?.product) {
      convertedMessage.type = 'product'
      convertedMessage.product = maybeProduct.product
    }

    if ((dbType === 'image' || dbType === 'file') && maybeAttachment?.url) {
      if (maybeAttachment.kind === 'image') {
        convertedMessage.type = 'image'
        convertedMessage.imageUrl = maybeAttachment.url
        convertedMessage.content = maybeAttachment.text ?? ''
      } else {
        convertedMessage.type = 'document'
        convertedMessage.fileUrl = maybeAttachment.url
        convertedMessage.fileName = maybeAttachment.name
        convertedMessage.fileSize = maybeAttachment.size
        convertedMessage.fileType = maybeAttachment.mime
        convertedMessage.content = maybeAttachment.text ?? ''
      }
    }

    const previewContent = toDisplayTextFromDbContent(rawContent)

    // N'injecter dans la liste UI `messages` que si on est sur la session active.
    if (isForActiveSession) {
      setMessages(prev => {
        if (prev.some(m => m.id === convertedMessage.id)) return prev
        return [...prev, convertedMessage]
      })
    }

    // Mettre à jour la session concernée (active ou non) dans `chatSessions`.
    setChatSessions(prev =>
      sortSessionsByLastMessage(
        prev.map(s => {
          if (s.id !== messageSessionId) return s
          const alreadyInSession = s.messages?.some(m => m.id === convertedMessage.id)
          const nextUnread = (() => {
            // Incrémenter si message entrant et session non ouverte.
            if (message.sender_id === userId) return s.unreadCount
            if (isForActiveSession) return 0
            return (s.unreadCount ?? 0) + 1
          })()
          return {
            ...s,
            messages: alreadyInSession ? s.messages : [...(s.messages ?? []), convertedMessage],
            lastMessage: previewContent,
            lastMessageTime: message.created_at,
            unreadCount: nextUnread
          }
        })
      )
    )

    // Mettre à jour la session active uniquement si le message lui appartient.
    if (isForActiveSession) {
      setActiveChatSession(prev => {
        if (!prev) return prev
        if (prev.id !== messageSessionId) return prev

        if (prev.messages.some(m => m.id === convertedMessage.id)) {
          return {
            ...prev,
            lastMessage: previewContent,
            lastMessageTime: message.created_at,
            unreadCount: message.sender_id === userId ? prev.unreadCount : 0
          }
        }

        return {
          ...prev,
          messages: [...prev.messages, convertedMessage],
          lastMessage: previewContent,
          lastMessageTime: message.created_at,
          unreadCount: message.sender_id === userId ? prev.unreadCount : 0
        }
      })
    }
    
    // Marquer comme lu si c'est un message reçu
    if (isForActiveSession && message.sender_id !== userId) {
      ChatService.markMessagesAsRead(messageSessionId, userId)
    }
  }
  
  /**
   * Créer une nouvelle session de chat
   */
  const createChatSession = useCallback(async (sellerId: string, sellerName: string, sellerAvatar?: string): Promise<string> => {
    if (!userId) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour démarrer une conversation",
        variant: "destructive",
      })
      return ''
    }

    if (!sellerId || !UUID_REGEX.test(String(sellerId))) {
      toast({
        title: 'Chat indisponible',
        description: "Impossible d'identifier le destinataire. Veuillez réessayer depuis une fiche produit valide.",
        variant: 'destructive'
      })
      return ''
    }

    // Vérifier si une session existe déjà localement (via ref pour éviter les re-renders)
    const existingSession = chatSessionsRef.current.find(session => session.sellerId === sellerId)
    if (existingSession) {
      return existingSession.id
    }

    // Créer ou récupérer la session depuis Supabase
    const session = await ChatService.getOrCreateChatSession(userId, sellerId)

    if (!session) {
      toast({
        title: "Erreur",
        description:
          "Impossible de créer la conversation. Si vous êtes vendeur, vous pouvez uniquement répondre aux conversations initiées par vos clients.",
        variant: "destructive",
      })
      return ''
    }

    const fallbackParticipant = await ChatService.getParticipantInfo(sellerId)
    const resolvedName = String(sellerName ?? '').trim() || fallbackParticipant?.name || 'Utilisateur'
    const resolvedAvatar = sellerAvatar || fallbackParticipant?.avatar_url

    const newSession: ChatSession = {
      id: session.id,
      sellerId,
      sellerName: resolvedName,
      sellerAvatar: resolvedAvatar,
      lastMessage: '',
      lastMessageTime: session.last_message_at,
      unreadCount: 0,
      messages: [],
      isActive: true
    }

    // Mise à jour synchrone du ref pour que openChatSession (appelé juste
    // après par les déclencheurs de chat) trouve bien la session.
    chatSessionsRef.current = [newSession, ...chatSessionsRef.current.filter(s => s.id !== newSession.id)]
    setChatSessions(prev => [newSession, ...prev])
    return session.id
  }, [userId, toast])
  
  /**
   * Ouvrir une session de chat
   */
  const openChatSession = useCallback((sessionId: string, openGlobalUI: boolean = true) => {
    // Toujours ouvrir l'UI
    if (openGlobalUI) {
      setIsAnyChatOpen(true)
    }

    // Lire depuis le ref pour éviter les closures obsolètes : quand une session
    // vient d'être créée (createChatSession), elle n'est pas encore visible dans
    // `chatSessions` capturé par cette closure au render courant.
    const session = chatSessionsRef.current.find(s => s.id === sessionId)
      ?? chatSessions.find(s => s.id === sessionId)
    if (session) {
      setActiveChatSession(session)
      setMessages(session.messages)
      
      // Marquer les messages comme lus
      if (userId) {
        const now = Date.now()
        const last = markReadThrottleRef.current[sessionId] ?? 0
        if (now - last > 1500) {
          markReadThrottleRef.current[sessionId] = now
          ChatService.markMessagesAsRead(sessionId, userId)
        }
      }
      
      // Marquer comme active
      setChatSessions(prev => prev.map(s => ({
        ...s,
        isActive: s.id === sessionId
      })))

      // Charger l'historique complet à l'ouverture (lazy-load)
      if (userId) {
        ;(async () => {
          if (inFlightMessagesFetchRef.current[sessionId]) return
          inFlightMessagesFetchRef.current[sessionId] = true
          try {
            const supaMessages = await ChatService.getChatMessages(sessionId)
            const converted = convertMessages(supaMessages, userId)

            // Important: en cas d'erreur réseau, getChatMessages() peut retourner [] et provoquer
            // la disparition de l'historique. On évite d'écraser un historique existant par une liste vide.
            const existingLen = (() => {
              const activeLen = activeChatSession?.id === sessionId ? (activeChatSession?.messages?.length ?? 0) : 0
              const sessionLen = session.messages?.length ?? 0
              return Math.max(activeLen, sessionLen)
            })()

            if (!(converted.length === 0 && existingLen > 0)) {
              setMessages(converted)
              setActiveChatSession(prev => (prev ? { ...prev, messages: converted } : prev))
              setChatSessions(prev =>
                prev.map(s => (s.id === sessionId ? { ...s, messages: converted } : s))
              )
            }
          } catch (error) {
            console.error('Erreur lors du chargement des messages:', error)
          } finally {
            inFlightMessagesFetchRef.current[sessionId] = false
          }
        })()
      }
    }
  }, [userId])

  /**
   * Fermer la session active
   */
  const closeChatSession = () => {
    setActiveChatSession(null)
    setMessages([])
    setSelectedMessageIds([])
    setIsAnyChatOpen(false)
    
    // Marquer toutes les sessions comme inactives
    setChatSessions(prev => prev.map(s => ({ ...s, isActive: false })))
  }
  
  /**
   * Envoyer un message
   */
  const sendMessage = async (
    content: string, 
    type: 'text' | 'product' | 'image' | 'document' = 'text', 
    product?: any, 
    fileData?: any
  ) => {
    if (!activeChatSession || !userId) return

    const file: File | null = (() => {
      if (!fileData) return null
      if (fileData instanceof File) return fileData
      return null
    })()

    const willUpload = Boolean(file && (type === 'image' || type === 'document'))

    const tempMessageId = `temp-${Date.now()}`
    
    // Ajouter le message localement immédiatement
    const newMessage: ChatMessage = {
      id: tempMessageId,
      type,
      content,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      product,
      ...(file && type === 'image'
        ? {
            imageUrl: URL.createObjectURL(file),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }
        : file && type === 'document'
          ? {
              fileUrl: '',
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            }
          : {}),
      ...(!file ? (fileData ?? {}) : {})
    }

    setMessages(prev => [...prev, newMessage])

    const previewContent = type === 'product' && product
      ? toDisplayTextFromDbContent(encodeProductContent({ product, text: String(content ?? '').trim() || undefined }))
      : String(content ?? '')

    setActiveChatSession(prev => {
      if (!prev) return prev
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: previewContent,
        lastMessageTime: new Date().toISOString()
      }
    })

    setChatSessions(prev =>
      sortSessionsByLastMessage(
        prev.map(s =>
          s.id === activeChatSession.id
            ? {
                ...s,
                messages: [...s.messages, newMessage],
                lastMessage: previewContent,
                lastMessageTime: new Date().toISOString()
              }
            : s
        )
      )
    )
    
    // Définir le statut initial
    setMessageDeliveryStatus(prev => ({
      ...prev,
      [tempMessageId]: {
        status: 'sending',
        timestamp: new Date().toISOString()
      }
    }))
    
    // Envoyer à Supabase
    try {
      let finalContent = content
      if (type === 'product' && product) {
        const normalizedProduct = normalizeProductForChatPayload(product)
        finalContent = encodeProductContent({ product: normalizedProduct, text: String(content ?? '').trim() || undefined })
      }
      if (willUpload && file) {
        const url = await uploadChatAttachment(activeChatSession.id, file)
        const normalizedKind: AttachmentPayload['kind'] = (() => {
          const mime = String(file.type ?? '').toLowerCase().trim()
          if (type === 'image') return 'image'
          if (mime.startsWith('audio/')) return 'audio'
          if (mime.startsWith('video/')) return 'video'
          return 'document'
        })()
        const payload: AttachmentPayload = {
          kind: normalizedKind,
          url,
          name: file.name,
          size: file.size,
          mime: file.type,
          text: String(content ?? '').trim() || undefined
        }
        finalContent = encodeAttachmentContent(payload)
      }

      const sentMessage = await ChatService.sendMessage(
        activeChatSession.id,
        userId,
        finalContent,
        toDbMessageType(type)
      )
      
      if (sentMessage) {
        const realId = sentMessage.id
        const createdAt = String((sentMessage as any).created_at ?? new Date().toISOString())

        const previewFromDbContent = toDisplayTextFromDbContent(finalContent)

        setMessages(prev => {
          const replaced = prev.map(m =>
            m.id === tempMessageId
              ? {
                  ...m,
                  id: realId,
                  timestamp: formatTime(createdAt),
                  ...(willUpload && file && type === 'document'
                    ? {
                        fileUrl: (() => {
                          const payload = decodeAttachmentContent(finalContent)
                          return payload?.url || ''
                        })()
                      }
                    : {})
                }
              : m
          )
          // Dédupliquer pour éviter les clés dupliquées si le realtime a déjà inséré le message
          const seen = new Set<string>()
          return replaced.filter((m) => {
            if (!m?.id) return true
            if (seen.has(m.id)) return false
            seen.add(m.id)
            return true
          })
        })

        setActiveChatSession(prev => {
          if (!prev) return prev
          return {
            ...prev,
            messages: prev.messages.map(m =>
              m.id === tempMessageId
                ? {
                    ...m,
                    id: realId,
                    timestamp: formatTime(createdAt)
                  }
                : m
            ),
            lastMessage: previewFromDbContent,
            lastMessageTime: createdAt
          }
        })

        setChatSessions(prev =>
          sortSessionsByLastMessage(
            prev.map(s =>
              s.id === activeChatSession.id
                ? {
                    ...s,
                    messages: s.messages.map(m =>
                      m.id === tempMessageId
                        ? {
                            ...m,
                            id: realId,
                            timestamp: formatTime(createdAt)
                          }
                        : m
                    ),
                    lastMessage: previewFromDbContent,
                    lastMessageTime: createdAt
                  }
                : s
            )
          )
        )

        // Mettre à jour le statut
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [realId]: { status: 'sent', timestamp: new Date().toISOString() }
        }))

        setMessageDeliveryStatus(prev => {
          const next = { ...prev }
          delete next[tempMessageId]
          return next
        })
        
        setTimeout(() => {
          setMessageDeliveryStatus(prev => ({
            ...prev,
            [realId]: { status: 'delivered', timestamp: new Date().toISOString() }
          }))
        }, 500)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)

      // Annuler l'envoi optimiste
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId))

      setActiveChatSession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempMessageId)
        }
      })

      setChatSessions(prev =>
        prev.map(s =>
          s.id === activeChatSession.id
            ? { ...s, messages: s.messages.filter(msg => msg.id !== tempMessageId) }
            : s
        )
      )

      // Retirer le statut de livraison du message (évite de rester bloqué en "envoi")
      setMessageDeliveryStatus(prev => {
        const next = { ...prev }
        delete next[tempMessageId]
        return next
      })

      const errorText = (() => {
        const errAny = error as any
        const message = String(errAny?.message ?? '')
        const details = String(errAny?.details ?? '')
        const hint = String(errAny?.hint ?? '')
        const combined = `${message} ${details} ${hint}`.toLowerCase()

        if (combined.includes('chat_muted')) {
          return "Vous êtes temporairement en mode muet (mute). Vous ne pouvez pas envoyer de messages pour le moment."
        }

        if (combined.includes('chat_banned')) {
          return "Vous êtes banni(e) du chat. Vous ne pouvez pas envoyer de messages."
        }

        return "Impossible d'envoyer le message"
      })()

      toast({
        title: "Erreur",
        description: errorText,
        variant: "destructive",
      })
    }
  }
  
  // Les autres fonctions restent identiques à l'ancien contexte
  const addProductToChat = (product: any) => {
    if (!product) return
    const name = String(product?.name ?? '').trim() || 'Produit'
    void sendMessage(`Produit: ${name}`, 'product', product)
  }
  
  const addFileToChat = (file: File) => {
    if (!file) return
    const isImage = String(file.type ?? '').toLowerCase().startsWith('image/')
    const type: 'image' | 'document' = isImage ? 'image' : 'document'
    void sendMessage(file.name || 'Pièce jointe', type, undefined, file)
  }
  
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
    toast({
      title: "Messages transférés",
      description: `${selectedMessageIds.length} message(s) transféré(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
  }
  
  const openChatWidget = (product: any, seller: any) => {
    // Fonction utilitaire: vérifie si une valeur ressemble à un UUID Supabase.
    const isUuid = (value: unknown) => {
      const s = String(value ?? '').trim()
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
    }

    // Fonction utilitaire: tente de résoudre l'UUID vendor_id réel d'un produit.
    const resolveVendorIdForProduct = async (): Promise<string> => {
      const direct = String(
        (seller && typeof seller === 'object' ? (seller as any)?.id : '') ||
          (product && typeof product === 'object' ? ((product as any)?.vendorId ?? (product as any)?.vendor_id ?? (product as any)?.seller?.id) : '') ||
          ''
      ).trim()
      if (isUuid(direct)) return direct

      const productId = String((product as any)?.id ?? '').trim()
      if (!productId) return ''

      try {
        const res = await fetch(`/api/public/products?id=${encodeURIComponent(productId)}`, { method: 'GET' })
        const json = await res.json().catch(() => null)
        const vendorId = String(json?.data?.vendor_id ?? '').trim()
        return isUuid(vendorId) ? vendorId : ''
      } catch {
        return ''
      }
    }

    void (async () => {
      const vendorId = await resolveVendorIdForProduct()

      if (!vendorId) {
        toast({
          title: 'Chat indisponible',
          description: "Impossible d'identifier le vendeur pour ce produit.",
          variant: 'destructive'
        })
        return
      }

      const sellerName =
        String(
          (seller && typeof seller === 'object' ? (seller as any)?.name : '') ||
            (product && typeof product === 'object' ? ((product as any)?.seller?.name ?? (product as any)?.seller) : '') ||
            'Vendeur'
        ) || 'Vendeur'

      const sellerAvatar = String((seller && typeof seller === 'object' ? (seller as any)?.avatar : '') || '')

      // Important: on crée/ouvre la session Supabase, sinon chaque source peut diverger.
      const sessionId = await createChatSession(vendorId, sellerName, sellerAvatar)
      openChatSession(sessionId)

      setGlobalChatProduct(product)
      setGlobalChatSeller({ ...(seller && typeof seller === 'object' ? seller : {}), id: vendorId, name: sellerName })
      setIsGlobalChatOpen(true)
      setIsAnyChatOpen(true)
    })()
  }
  
  const closeChatWidget = () => {
    setIsGlobalChatOpen(false)
    setGlobalChatProduct(null)
    setGlobalChatSeller(null)
    setIsAnyChatOpen(false)
  }
  
  // Valeur du contexte
  const contextValue: ChatContextType = {
    chatSessions,
    activeChatSession,
    messages,
    messageStatuses,
    messageDeliveryStatus,
    createChatSession,
    openChatSession,
    closeChatSession,
    sendMessage,
    addProductToChat,
    addFileToChat,
    updateMessageStatus,
    markMessageAsRead,
    markMessageAsImportant,
    markMessageAsUrgent,
    markMessageToResolve,
    archiveMessage,
    selectedMessageIds,
    toggleMessageSelection,
    selectAllMessages,
    deselectAllMessages,
    deleteSelectedMessages,
    archiveSelectedMessages,
    transferSelectedMessages,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    openChatWidget,
    closeChatWidget,
    isGlobalChatOpen,
    globalChatProduct,
    globalChatSeller,
    isAnyChatOpen,
    setIsAnyChatOpen,
    isLoading,
    isSyncing
  }
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  )
}
