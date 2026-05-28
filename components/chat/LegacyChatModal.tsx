'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  MessageCircle, 
  Send, 
  X, 
  Clock, 
  Star, 
  Smile, 
  Paperclip, 
  Mic,
  Image as ImageIcon,
  FileText,
  Download,
  ShoppingCart,
  ThumbsUp,
  ThumbsDown,
  Reply,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  Share2,
  AlertTriangle,
  MessageSquare,
  Copy,
  Save,
  Check,
  XCircle
} from 'lucide-react'
import { useChatContext } from '@/lib/chat-context-supabase'
import { useVendorPresence } from '@/lib/hooks/use-vendor-presence'

interface LegacyChatModalProps {
  isOpen: boolean
  onClose: () => void
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  product?: any
}

// Emojis populaires
const popularEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀',
  '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽'
]

// Réponses rapides
const quickReplies = [
  "Bonjour ! Je suis intéressé(e) par votre produit.",
  "Pouvez-vous me donner plus d'informations ?",
  "Quel est le délai de livraison ?",
  "Y a-t-il une garantie ?",
  "Pouvez-vous faire une remise ?",
  "Merci pour votre réponse !",
  "Parfait, je prends !",
  "Je vais réfléchir et revenir vers vous."
]

// Liste des vendeurs pour le transfert
const availableSellers = [
  { id: 'seller-1', name: 'TechStore Pro', avatar: '/vendor-avatar.png' },
  { id: 'seller-2', name: 'Electronics Plus', avatar: '/vendor-avatar.png' },
  { id: 'seller-3', name: 'Digital World', avatar: '/vendor-avatar.png' },
  { id: 'seller-4', name: 'Smart Solutions', avatar: '/vendor-avatar.png' },
  { id: 'seller-5', name: 'Future Tech', avatar: '/vendor-avatar.png' }
]

export const LegacyChatModal: React.FC<LegacyChatModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  sellerAvatar,
  product
}) => {
  // Styles d'animation personnalisés
  const productCardStyles = {
    animation: 'slideInUp 0.5s ease-out, fadeIn 0.5s ease-out',
    transform: 'translateY(0)',
    opacity: 1,
  }

  const buttonHoverStyles = {
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
  }
  const [message, setMessage] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)
  const [recordingMs, setRecordingMs] = useState(0)
  const [sessionCreated, setSessionCreated] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set())
  const [showMessageActions, setShowMessageActions] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferTarget, setTransferTarget] = useState<string>('')
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [messageStatuses, setMessageStatuses] = useState<Map<string, 'sent' | 'delivered' | 'read'>>(new Map())
  const [messageLabels, setMessageLabels] = useState<Map<string, string>>(new Map())
  
  // Nouveaux états pour la gestion des produits épinglés
  const [pinnedProduct, setPinnedProduct] = useState<any>(null)
  const [productHistory, setProductHistory] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const sessionCreationInFlightRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<BlobPart[]>([])
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const recordingStartRef = useRef<number>(0)
  const recordingAccumulatedRef = useRef<number>(0)
  const recordingPausedRef = useRef<boolean>(false)
  const recordingIntervalRef = useRef<number | null>(null)

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const normalizedSellerId = String(sellerId ?? '').trim()
  const fallbackFromProduct = String(
    (product as any)?.vendorId ?? (product as any)?.vendor_id ?? (product as any)?.seller?.id ?? ''
  ).trim()
  const presenceKey = uuidRegex.test(normalizedSellerId)
    ? normalizedSellerId
    : uuidRegex.test(fallbackFromProduct)
      ? fallbackFromProduct
      : ''
  const { isOnline } = useVendorPresence(presenceKey)
  const isSellerOnline = isOnline === true
  const [vendorSummary, setVendorSummary] = useState<{
    averageRating: number
    reviewCount: number
    avgResponseSeconds: number | null
  } | null>(null)
  
  const { 
    createChatSession, 
    openChatSession, 
    sendMessage, 
    activeChatSession, 
    messages,
    updateMessageStatus,
    markMessageAsRead,
    markMessageAsImportant,
    markMessageAsUrgent,
    markMessageToResolve,
    archiveMessage
  } = useChatContext()

  useEffect(() => {
    let cancelled = false

    const vendor = String(sellerId ?? '').trim()
    if (!vendor) {
      setVendorSummary(null)
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/public/vendors/summary?vendorId=${encodeURIComponent(vendor)}`, { method: 'GET' })
        const json = await res.json().catch(() => null)
        if (!res.ok) return

        const data = json?.data
        const avg = Number(data?.averageRating ?? 0)
        const count = Number(data?.reviewCount ?? 0)
        const respSec = data?.avgResponseSeconds
        const normalizedRespSec = typeof respSec === 'number' && Number.isFinite(respSec) ? respSec : null

        if (!cancelled) {
          setVendorSummary({
            averageRating: Number.isFinite(avg) ? avg : 0,
            reviewCount: Number.isFinite(count) ? count : 0,
            avgResponseSeconds: normalizedRespSec
          })
        }
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sellerId])

  // Créer et ouvrir la session de chat quand le modal s'ouvre
  useEffect(() => {
    const shouldLog = isOpen === true
    if (shouldLog) {
      console.log('🔍 useEffect de création de session déclenché')
      console.log('  - isOpen:', isOpen)
      console.log('  - sellerId:', sellerId)
      console.log('  - sessionCreated:', sessionCreated)
      console.log('  - activeChatSession:', activeChatSession)
    }

    if (isOpen && product) {
      try {
        updatePinnedProduct(product)
      } catch {
        // ignore
      }
    }

    if (isOpen && sellerId && !sessionCreated && !sessionCreationInFlightRef.current) {
      try {
        sessionCreationInFlightRef.current = true
        console.log('🔧 LegacyChatModal - Création de session pour:', sellerId)

        // Créer une nouvelle session
        void createChatSession(sellerId, sellerName, sellerAvatar)
          .then((sessionId) => {
            console.log('✅ Session créée avec ID:', sessionId)

            if (!sessionId) {
              sessionCreationInFlightRef.current = false
              return
            }

            // Ouvrir la session
            openChatSession(sessionId)
            console.log('✅ Session ouverte')

            // Vérifier que la session est bien active
            setTimeout(() => {
              console.log('🔍 Vérification de la session après ouverture:')
              console.log('  - activeChatSession:', activeChatSession)
              console.log('  - messages:', messages)
            }, 100)

            // Marquer la session comme créée
            setSessionCreated(true)
          })
          .catch((error) => {
            sessionCreationInFlightRef.current = false
            console.error('❌ Erreur lors de l\'ouverture du chat:', error)
          })
      } catch (error) {
        sessionCreationInFlightRef.current = false
        console.error('❌ Erreur lors de l\'ouverture du chat:', error)
      }
    } else if (shouldLog) {
      console.log('❌ Conditions non remplies pour la création de session:')
      console.log('  - Modal fermé:', !isOpen)
      console.log('  - Pas de sellerId:', !sellerId)
      console.log('  - Session déjà créée:', sessionCreated)
    }
  }, [isOpen, sellerId, sellerName, sellerAvatar, product, sessionCreated])

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Réinitialiser l'état quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSessionCreated(false)
      sessionCreationInFlightRef.current = false
      setMessage('')
      setShowEmojis(false)
      setShowAttachments(false)
      setShowQuickReplies(false)
      setIsRecording(false)
             setSelectedMessages(new Set())
       setShowMessageActions(false)
       setShowTransferModal(false)
       setTransferTarget('')
             setShowProductDetails(false)
      setSelectedProduct(null)
      setMessageStatuses(new Map())
      setMessageLabels(new Map())
      
      // Réinitialiser les états des produits épinglés
      setPinnedProduct(null)
      setProductHistory([])

      // Nettoyage enregistrement audio
      try {
        const recorder = mediaRecorderRef.current
        if (recorder && recorder.state !== 'inactive') recorder.stop()
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null
      recordingChunksRef.current = []
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      setIsRecordingPaused(false)
      setRecordingMs(0)
      recordingAccumulatedRef.current = 0
      recordingStartRef.current = 0
      recordingPausedRef.current = false
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop())
        recordingStreamRef.current = null
      }
    }
  }, [isOpen])

  // Mettre à jour l'affichage des actions de messages
  useEffect(() => {
    setShowMessageActions(selectedMessages.size > 0)
  }, [selectedMessages])

  const handleSendMessage = async () => {
    console.log('🔍 handleSendMessage appelé')
    console.log('📝 Message:', message.trim())
    console.log('💬 activeChatSession:', activeChatSession)
    console.log('🆔 sellerId:', sellerId)
    console.log('📊 État de la session:', { sessionCreated, isOpen })
    
    // Vérifier si nous avons tous les éléments nécessaires
    if (!message.trim()) {
      console.log('❌ Message vide')
      return
    }
    
    if (!activeChatSession) {
      console.log('❌ Pas de session active, tentative de création...')
      // Essayer de créer une session si elle n'existe pas
      if (sellerId && sellerName) {
        try {
          const sessionId = await createChatSession(sellerId, sellerName, sellerAvatar)
          console.log('🆕 Session créée en urgence:', sessionId)
          openChatSession(sessionId)
          
          // Attendre un peu et réessayer
          setTimeout(() => {
            if (activeChatSession) {
              console.log('🔄 Réessai d\'envoi après création de session')
              void handleSendMessage()
            }
          }, 100)
          return
        } catch (error) {
          console.error('❌ Erreur lors de la création d\'urgence de session:', error)
          return
        }
      } else {
        console.log('❌ Impossible de créer une session: sellerId ou sellerName manquant')
        return
      }
    }
    
    // Si on arrive ici, on a une session active
    console.log('📤 Envoi du message:', message.trim())
    const messageId = `msg-${Date.now()}`
    try {
      const payloadProduct = pinnedProduct ?? product

      if (payloadProduct) {
        sendMessage(message.trim(), 'product', payloadProduct)
      } else {
        sendMessage(message.trim(), 'text')
      }
      setMessage('')
      setShowEmojis(false)
      setShowQuickReplies(false)
      
      // Simuler la progression du statut du message
      simulateMessageStatus(messageId)
      console.log('✅ Message envoyé avec succès')
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojis(false)
  }

  const handleQuickReply = (reply: string) => {
    setMessage(reply)
    setShowQuickReplies(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && activeChatSession) {
      console.log('📎 Upload du fichier:', file.name)
      // Ici vous pouvez implémenter la logique d'upload
      sendMessage(`Fichier joint: ${file.name}`, 'document', undefined, file)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && activeChatSession) {
      console.log('🖼️ Upload de l\'image:', file.name)
      // Ici vous pouvez implémenter la logique d'upload d'image
      sendMessage(`Image jointe: ${file.name}`, 'image', undefined, file)
    }
  }

  const formatDuration = (ms?: number) => {
    const total = Math.max(0, Math.floor((ms ?? 0) / 1000))
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  const beginRecording = async () => {
    try {
      if (!activeChatSession) {
        console.log('❌ Enregistrement audio: aucune session active')
        return
      }

      if (mediaRecorderRef.current) {
        console.log('⚠️ Enregistrement déjà en cours')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordingStreamRef.current = stream
      recordingChunksRef.current = []

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordingChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        try {
          const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          if (blob.size <= 0) return
          const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
          await sendMessage('Message audio', 'document', undefined, file)
        } catch (error) {
          console.error('❌ Erreur envoi audio:', error)
        } finally {
          recordingChunksRef.current = []
        }
      }

      recorder.start()
      setIsRecording(true)
      setIsRecordingPaused(false)
      recordingPausedRef.current = false
      recordingAccumulatedRef.current = 0
      recordingStartRef.current = Date.now()
      setRecordingMs(0)

      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      recordingIntervalRef.current = window.setInterval(() => {
        if (!mediaRecorderRef.current) return
        if (recordingPausedRef.current) return
        const elapsed = Math.max(0, recordingAccumulatedRef.current + (Date.now() - recordingStartRef.current))
        setRecordingMs(elapsed)
      }, 250)
      console.log('🎤 Début de l\'enregistrement')
    } catch (error) {
      console.error('❌ Permission micro / MediaRecorder indisponible:', error)
      setIsRecording(false)
      setIsRecordingPaused(false)
      setRecordingMs(0)
      mediaRecorderRef.current = null
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop())
        recordingStreamRef.current = null
      }
    }
  }

  const stopRecording = () => {
    try {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
    } finally {
      setIsRecording(false)
      setIsRecordingPaused(false)
      recordingPausedRef.current = false
      mediaRecorderRef.current = null
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop())
        recordingStreamRef.current = null
      }
      if (recordingIntervalRef.current) {
        window.clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      console.log('⏹️ Fin de l\'enregistrement')
    }
  }

  const togglePauseRecording = () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || !isRecording) return
    try {
      if (isRecordingPaused) {
        recorder.resume()
        recordingStartRef.current = Date.now()
        setIsRecordingPaused(false)
        recordingPausedRef.current = false
        return
      }

      if (recorder.state === 'recording') {
        recorder.pause()
        recordingAccumulatedRef.current = recordingAccumulatedRef.current + Math.max(0, Date.now() - recordingStartRef.current)
        setIsRecordingPaused(true)
        recordingPausedRef.current = true
      }
    } catch (e) {
      console.error('❌ Erreur pause/reprise enregistrement:', e)
    }
  }

  // Gestion de la sélection des messages
  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessages)
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId)
    } else {
      newSelection.add(messageId)
    }
    setSelectedMessages(newSelection)
  }

  const selectAllMessages = () => {
    if (messages) {
      const allIds = messages.map(msg => msg.id || `msg-${messages.indexOf(msg)}`)
      setSelectedMessages(new Set(allIds))
    }
  }

  const deselectAllMessages = () => {
    setSelectedMessages(new Set())
  }

  // Actions sur les messages sélectionnés
  const markSelectedAsRead = () => {
    selectedMessages.forEach(messageId => {
      try {
        markMessageAsRead(messageId)
        applyMessageLabel(messageId, 'Lu')
        console.log('✅ Message marqué comme lu:', messageId)
      } catch (error) {
        console.error('❌ Erreur lors du marquage comme lu:', error)
      }
    })
    setSelectedMessages(new Set())
  }

  const markSelectedAsUnread = () => {
    selectedMessages.forEach(messageId => {
      try {
        updateMessageStatus(messageId, 'isRead', false)
        applyMessageLabel(messageId, 'Non lu')
        console.log('✅ Message marqué comme non lu:', messageId)
      } catch (error) {
        console.error('❌ Erreur lors du marquage comme non lu:', error)
      }
    })
    setSelectedMessages(new Set())
  }

  const deleteSelectedMessages = () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedMessages.size} message(s) ?`)) {
      selectedMessages.forEach(messageId => {
        try {
          // Ici vous pouvez implémenter la logique de suppression
          applyMessageLabel(messageId, 'Supprimé')
          console.log('🗑️ Message supprimé:', messageId)
        } catch (error) {
          console.error('❌ Erreur lors de la suppression:', error)
        }
      })
      setSelectedMessages(new Set())
    }
  }

  const archiveSelectedMessages = () => {
    selectedMessages.forEach(messageId => {
      try {
        archiveMessage(messageId)
        applyMessageLabel(messageId, 'Archivé')
        console.log('📦 Message archivé:', messageId)
      } catch (error) {
        console.error('❌ Erreur lors de l\'archivage:', error)
      }
    })
    setSelectedMessages(new Set())
  }

  const markSelectedAsUrgent = () => {
    selectedMessages.forEach(messageId => {
      try {
        markMessageAsUrgent(messageId)
        applyMessageLabel(messageId, 'Urgent')
        console.log('🚨 Message marqué comme urgent:', messageId)
      } catch (error) {
        console.error('❌ Erreur lors du marquage urgent:', error)
      }
    })
    setSelectedMessages(new Set())
  }

  const markSelectedToResolve = () => {
    selectedMessages.forEach(messageId => {
      try {
        markMessageToResolve(messageId)
        applyMessageLabel(messageId, 'À résoudre')
        console.log('✅ Message marqué à résoudre:', messageId)
      } catch (error) {
        console.error('❌ Erreur lors du marquage à résoudre:', error)
      }
    })
    setSelectedMessages(new Set())
  }

  const copySelectedMessages = () => {
    const selectedTexts = Array.from(selectedMessages).map(messageId => {
      const message = messages?.find(msg => (msg.id || `msg-${messages.indexOf(msg)}`) === messageId)
      return message?.content || ''
    }).filter(text => text.trim())
    
    if (selectedTexts.length > 0) {
      const textToCopy = selectedTexts.join('\n\n')
      navigator.clipboard.writeText(textToCopy).then(() => {
        selectedMessages.forEach(messageId => {
          applyMessageLabel(messageId, 'Copié')
        })
        console.log('📋 Messages copiés dans le presse-papiers')
        setSelectedMessages(new Set())
      }).catch(error => {
        console.error('❌ Erreur lors de la copie:', error)
      })
    }
  }

  const handleTransferMessages = () => {
    if (transferTarget) {
      const targetSeller = availableSellers.find(seller => seller.id === transferTarget)
      selectedMessages.forEach(messageId => {
        try {
          // Ici vous pouvez implémenter la logique de transfert
          applyMessageLabel(messageId, `Transféré vers ${targetSeller?.name || 'Vendeur'}`)
          console.log(`📤 Message ${messageId} transféré vers ${transferTarget}`)
        } catch (error) {
          console.error('❌ Erreur lors du transfert:', error)
        }
      })
      setSelectedMessages(new Set())
      setShowTransferModal(false)
      setTransferTarget('')
    }
  }

  const handleViewProductDetails = (product: any) => {
    setSelectedProduct(product)
    setShowProductDetails(true)
    console.log('📋 Affichage des détails du produit:', product.name)
  }
  
  // Fonction pour épingler un produit depuis l'historique
  const pinProductFromHistory = (product: any) => {
    console.log('📌 Épinglage d\'un produit depuis l\'historique:', product.name)
    updatePinnedProduct(product)
  }

  // Fonction pour gérer le statut des messages
  const updateMessageStatusState = (messageId: string, status: 'sent' | 'delivered' | 'read') => {
    setMessageStatuses(prev => new Map(prev).set(messageId, status))
  }

  // Fonction pour simuler la progression du statut des messages
  const simulateMessageStatus = (messageId: string) => {
    // Message envoyé immédiatement
    updateMessageStatusState(messageId, 'sent')
    
    // Simuler la livraison après 1 seconde
    setTimeout(() => {
      updateMessageStatusState(messageId, 'delivered')
    }, 1000)
    
    // Simuler la lecture après 3 secondes (si le vendeur est en ligne)
    setTimeout(() => {
      updateMessageStatusState(messageId, 'read')
    }, 3000)
  }

  // Fonction pour appliquer un label à un message
  const applyMessageLabel = (messageId: string, label: string) => {
    setMessageLabels(prev => new Map(prev).set(messageId, label))
  }
  
  // Fonction pour gérer le changement de produit épinglé
  const updatePinnedProduct = (newProduct: any) => {
    console.log('📌 Mise à jour du produit épinglé:', newProduct?.name)
    
    // Si un produit était déjà épinglé, l'ajouter à l'historique
    if (pinnedProduct) {
      console.log('📚 Ajout du produit précédent à l\'historique:', pinnedProduct.name)
      setProductHistory(prev => {
        // Vérifier si le produit n'est pas déjà dans l'historique
        const exists = prev.some(p => p.id === pinnedProduct.id)
        if (!exists) {
          return [...prev, pinnedProduct]
        }
        return prev
      })
    }
    
    // Définir le nouveau produit comme épinglé
    setPinnedProduct(newProduct)
    
    // Si le nouveau produit est dans l'historique, le retirer
    if (newProduct) {
      setProductHistory(prev => prev.filter(p => p.id !== newProduct.id))
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Styles CSS personnalisés pour les animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .product-card {
          animation: slideInUp 0.6s ease-out, fadeIn 0.6s ease-out;
        }
        
        .product-card:hover {
          animation: pulse 2s infinite;
        }
        
        .action-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .action-button:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        }
        
                 .action-button:active {
           transform: translateY(-1px) scale(1.02);
         }
         
         /* Styles pour les indicateurs de statut des messages */
         .status-indicator {
           transition: all 0.3s ease-in-out;
         }
         
         .status-indicator.sent {
           animation: fadeIn 0.5s ease-out;
         }
         
         .status-indicator.delivered {
           animation: slideInRight 0.5s ease-out;
         }
         
         .status-indicator.read {
           animation: pulse 1s ease-out;
         }
         
                   @keyframes slideInRight {
            from {
              transform: translateX(-10px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          /* Styles pour les labels des messages */
          .message-label {
            animation: slideInUp 0.4s ease-out, fadeIn 0.4s ease-out;
          }
          
          .message-label:hover {
            transform: scale(1.05);
            transition: transform 0.2s ease-in-out;
          }
       `}</style>
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent hideCloseButton className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Titre caché pour l'accessibilité */}
        <DialogTitle className="sr-only">
          Chat avec {sellerName}
        </DialogTitle>
        
        {/* En-tête du chat - Ancien design restauré */}
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 border-b border-orange-200 flex-shrink-0">
          {/* Effet de brillance en arrière-plan */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar du vendeur avec animation moderne */}
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:ring-orange-200 transition-all duration-300">
                  {sellerAvatar ? (
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={sellerAvatar} alt={sellerName} />
                      <AvatarFallback className="text-orange-600 font-bold text-lg">
                        {sellerName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <span className="text-orange-600 font-bold text-lg">
                      {sellerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              {/* Indicateur de statut animé */}
              {presenceKey && (
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                    isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                  } ${isSellerOnline ? 'animate-ping' : ''}`}
                ></div>
              )}
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isSellerOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
              ></div>
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              {/* Informations du vendeur améliorées */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white drop-shadow-sm">
                    {sellerName}
                  </h3>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/30 animate-pulse">
                    <span
                      className={`h-2 w-2 rounded-full mr-1.5 ${
                        isSellerOnline ? 'bg-green-400' : 'bg-gray-300'
                      } ${isSellerOnline ? 'animate-ping' : ''}`}
                    ></span>
                    {isSellerOnline ? 'En ligne' : 'Hors ligne'}
                  </Badge>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="flex items-center space-x-4 text-white/90 text-sm mt-1">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-300" />
                    <span>
                      {vendorSummary ? `${vendorSummary.averageRating.toFixed(1)}/5` : '4.8/5'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {(() => {
                        const secs = vendorSummary?.avgResponseSeconds
                        if (typeof secs !== 'number') return 'Répond en 2h'
                        const minutes = Math.max(1, Math.round(secs / 60))
                        if (minutes < 60) return `Répond en ~${minutes} min`
                        const hours = Math.round(minutes / 60)
                        return `Répond en ~${hours} h`
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bouton fermer */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Barre d'actions pour les messages sélectionnés */}
        {showMessageActions && (
          <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 border-b border-orange-200 p-3 flex-shrink-0">
            <div className="space-y-3">
              {/* En-tête avec compteur et désélection */}
              <div className="flex items-center justify-between">
                                 <span className="text-sm font-medium text-orange-800">
                   {selectedMessages.size} message(s) sélectionné(s)
                 </span>
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={deselectAllMessages}
                   className="text-orange-600 hover:text-orange-800"
                 >
                   <XCircle className="h-4 w-4 mr-1" />
                   Désélectionner
                 </Button>
              </div>
              
              {/* Actions disposées verticalement en grille */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markSelectedAsRead}
                  className="text-green-600 border-green-300 hover:bg-green-50 justify-start"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Marquer lu
                </Button>
                
                                 <Button
                   variant="outline"
                   size="sm"
                   onClick={markSelectedAsUnread}
                   className="text-orange-600 border-orange-300 hover:bg-orange-50 justify-start"
                 >
                   <EyeOff className="h-4 w-4 mr-2" />
                   Marquer non lu
                 </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markSelectedAsUrgent}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50 justify-start"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Urgent
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markSelectedToResolve}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50 justify-start"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  À résoudre
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copySelectedMessages}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 justify-start"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
                
                                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setShowTransferModal(true)}
                   className="text-orange-600 border-orange-300 hover:bg-orange-50 justify-start"
                 >
                   <Share2 className="h-4 w-4 mr-2" />
                   Transférer
                 </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={archiveSelectedMessages}
                  className="text-yellow-600 border-yellow-300 hover:bg-yellow-50 justify-start"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deleteSelectedMessages}
                  className="text-red-600 border-red-300 hover:bg-red-50 justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}

                 {/* Produit épinglé en haut de la discussion */}
         {pinnedProduct && (
           <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
             <div className="flex items-center justify-between mb-3">
               <div className="flex items-center space-x-2">
                 <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                   <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                   </svg>
                 </div>
                 <span className="text-sm font-medium text-gray-700">Produit épinglé</span>
               </div>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => updatePinnedProduct(null)}
                 className="text-gray-500 hover:text-gray-700"
               >
                 <X className="h-4 w-4" />
               </Button>
             </div>
             
             {/* Carte du produit épinglé */}
             <div className="product-card p-4 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-lg border border-orange-200 shadow-lg">
               <div className="flex items-start space-x-4">
                 <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
                   <img 
                     src={pinnedProduct.image || "/placeholder.svg"} 
                     alt={pinnedProduct.name}
                     className="w-full h-full object-cover"
                   />
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-semibold text-gray-900 text-sm mb-2">{pinnedProduct.name}</h4>
                   <div className="flex items-center space-x-3 mb-3">
                     <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-md shadow-sm">
                       <span className="text-xs text-gray-500">Prix:</span>
                       <span className="text-sm font-bold text-gray-900">{pinnedProduct.price} F CFA</span>
                     </div>
                     <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-md shadow-sm">
                       <span className="text-xs text-gray-500">Points:</span>
                       <span className="text-sm font-bold text-orange-600">{pinnedProduct.pointsPrice || '150'}</span>
                     </div>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Button
                       variant="outline"
                       size="sm"
                       className="action-button text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                       onClick={() => {
                         console.log('🛒 Ajouter au panier (produit épinglé):', pinnedProduct.name)
                         if (typeof window !== 'undefined') {
                           window.dispatchEvent(
                             new CustomEvent('openCartModal', {
                               detail: { product: pinnedProduct }
                             })
                           )
                         }
                       }}
                     >
                       <ShoppingCart className="h-4 w-4 mr-1" />
                       Ajouter au panier
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="action-button text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                       onClick={() => handleViewProductDetails(pinnedProduct)}
                     >
                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                       </svg>
                       Voir détails
                     </Button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
         
         {/* Historique des produits référencés */}
         {productHistory.length > 0 && (
           <div className="bg-gray-100 border-b border-gray-200 p-3 flex-shrink-0">
             <div className="flex items-center space-x-2 mb-2">
               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span className="text-xs font-medium text-gray-600">Produits précédemment référencés ({productHistory.length})</span>
             </div>
             <div className="flex space-x-2 overflow-x-auto pb-2">
               {productHistory.map((product, index) => (
                 <div 
                   key={product.id || index} 
                   className="flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200"
                   onClick={() => pinProductFromHistory(product)}
                   title={`Cliquer pour épingler ${product.name}`}
                 >
                   <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:border-orange-300 transition-colors">
                     <img 
                       src={product.image || "/placeholder.svg"} 
                       alt={product.name}
                       className="w-full h-full object-cover"
                     />
                   </div>
                   <div className="text-xs text-gray-500 mt-1 text-center max-w-[48px] truncate hover:text-orange-600 transition-colors">
                     {product.name}
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}
         
         {/* Zone des messages - Scrollable */}
         <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0">
          {messages && messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const messageId = msg.id || `msg-${index}`
                const isSelected = selectedMessages.has(messageId)
                
                return (
                  <div
                    key={`${messageId}-${index}`}
                    className={`flex items-start space-x-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Checkbox de sélection */}
                    <div className="mt-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleMessageSelection(messageId)}
                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                    </div>
                    
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      } ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                    >
                                             {msg.type === 'product' && msg.product && (
                         <div className="product-card mb-3 p-4 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-lg border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                           <div className="flex items-start space-x-4">
                             <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 transform hover:scale-105 transition-transform duration-200">
                               <img 
                                 src={msg.product.image || "/placeholder.svg"} 
                                 alt={msg.product.name}
                                 className="w-full h-full object-cover"
                               />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="font-semibold text-gray-900 text-sm mb-2 hover:text-orange-600 transition-colors duration-200">{msg.product.name}</h4>
                               <div className="flex items-center space-x-3 mb-3">
                                 <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                   <span className="text-xs text-gray-500">Prix:</span>
                                   <span className="text-sm font-bold text-gray-900">{msg.product.price} F CFA</span>
                                 </div>
                                 <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-md shadow-sm">
                                   <span className="text-xs text-gray-500">Points:</span>
                                   <span className="text-sm font-bold text-orange-600">{msg.product.pointsPrice || '150'}</span>
                                 </div>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   className="action-button text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 hover:border-green-400"
                                   onClick={() => {
                                     // Ouvrir le modal panier du header
                                     console.log('🛒 Ajouter au panier:', msg.product.name)
                                     // Ici vous pouvez dispatcher un événement pour ouvrir le modal panier
                                     if (typeof window !== 'undefined') {
                                       window.dispatchEvent(new CustomEvent('openCartModal', { 
                                         detail: { product: msg.product } 
                                       }))
                                     }
                                   }}
                                 >
                                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                   </svg>
                                   Ajouter au panier
                                 </Button>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   className="action-button text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                   onClick={() => handleViewProductDetails(msg.product)}
                                 >
                                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                   </svg>
                                   Voir détails
                                 </Button>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}
                      
                      {msg.type === 'image' && (
                        <div className="mb-2">
                          <img 
                            src={msg.imageUrl || "/placeholder.svg"} 
                            alt="Image jointe"
                            className="max-w-full h-auto rounded"
                          />
                        </div>
                      )}
                      
                      {msg.type === 'document' && (
                        <div className="mb-2 p-2 bg-gray-100 rounded border flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{msg.fileName || 'Document'}</span>
                          {msg.fileUrl ? (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex"
                            >
                              <Download className="h-4 w-4 text-gray-600 cursor-pointer hover:text-blue-600" />
                            </a>
                          ) : (
                            <Download className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}

                      {msg.type === 'document' && String((msg as any)?.fileType ?? '').startsWith('audio/') && msg.fileUrl && (
                        <div className="mb-2">
                          <audio controls src={msg.fileUrl} className="w-full" />
                        </div>
                      )}
                      
                                             <p className="text-sm">{msg.content}</p>
                       
                       {/* Label d'action appliquée au message */}
                       {messageLabels.get(messageId) && (
                         <div className="mt-2 mb-1 message-label">
                           <Badge 
                             variant="secondary" 
                             className="text-xs px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200 font-medium"
                           >
                             {messageLabels.get(messageId)}
                           </Badge>
                         </div>
                       )}
                       
                       <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${
                          msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp || new Date().toLocaleTimeString()}
                        </p>
                        
                        {/* Indicateurs de statut des messages (uniquement pour les messages utilisateur) */}
                        {msg.sender === 'user' && (
                          <div className={`flex items-center space-x-1 status-indicator ${
                            messageStatuses.get(messageId) === 'read' 
                              ? 'read' 
                              : messageStatuses.get(messageId) === 'delivered' 
                              ? 'delivered' 
                              : 'sent'
                          }`}>
                            {/* Indicateur de statut avec traits colorés */}
                            <div className="flex items-center space-x-0.5">
                              {/* Trait 1 - Toujours visible (envoyé) */}
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                              
                              {/* Trait 2 - Visible si livré ou lu */}
                              {messageStatuses.get(messageId) === 'delivered' || messageStatuses.get(messageId) === 'read' ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-transparent border border-gray-300 border-dashed"></div>
                              )}
                              
                              {/* Trait 3 - Visible si lu (vert) */}
                              {messageStatuses.get(messageId) === 'read' ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                              ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-transparent border border-gray-300 border-dashed"></div>
                              )}
                            </div>
                            
                            {/* Texte de statut avec icône */}
                            <div className="flex items-center space-x-1">
                              {/* Icône de statut */}
                              {messageStatuses.get(messageId) === 'read' ? (
                                <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : messageStatuses.get(messageId) === 'delivered' ? (
                                <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                              )}
                              
                              {/* Texte de statut */}
                              <span className={`text-xs font-medium ${
                                messageStatuses.get(messageId) === 'read' 
                                  ? 'text-green-400' 
                                  : messageStatuses.get(messageId) === 'delivered' 
                                  ? 'text-gray-400' 
                                  : 'text-gray-300'
                              }`}>
                                {messageStatuses.get(messageId) === 'read' 
                                  ? 'Lu' 
                                  : messageStatuses.get(messageId) === 'delivered' 
                                  ? 'Livré' 
                                  : 'Envoyé'
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Commencez la conversation avec {sellerName}</p>
            </div>
          )}
        </div>

        {/* Zone de saisie - Fixe en bas */}
        <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
          {/* Barre d'outils */}
          <div className="flex items-center space-x-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickReplies(!showQuickReplies)}
              className="text-gray-600 hover:text-blue-600"
            >
              <Reply className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojis(!showEmojis)}
              className="text-gray-600 hover:text-blue-600"
            >
              <Smile className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAttachments(!showAttachments)}
              className="text-gray-600 hover:text-blue-600"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onPointerDown={(e) => {
                e.preventDefault()
                if (isRecording) return
                void beginRecording()
              }}
              className={`text-gray-600 hover:text-blue-600 ${isRecording ? 'text-red-600' : ''}`}
              title={isRecording ? 'Enregistrement en cours' : 'Enregistrer un message vocal'}
            >
              <Mic className="h-4 w-4" />
            </Button>

            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200">
                  <span className="relative inline-flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                  </span>
                  <span className="text-xs font-semibold text-red-700">REC</span>
                  <span className="text-xs font-mono text-red-700">{formatDuration(recordingMs)}</span>
                  {isRecordingPaused && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">PAUSE</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePauseRecording}
                  className="h-8"
                  title={isRecordingPaused ? 'Reprendre' : 'Pause'}
                >
                  {isRecordingPaused ? 'Reprendre' : 'Pause'}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopRecording}
                  className="h-8"
                  title="Stop"
                >
                  Stop
                </Button>
              </div>
            )}
          </div>

          {/* Réponses rapides */}
          {showQuickReplies && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-2 gap-2">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs h-auto py-2 px-3 text-left justify-start"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Emojis */}
          {showEmojis && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-10 gap-1 max-h-32 overflow-y-auto">
                {popularEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="text-xl hover:bg-gray-200 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pièces jointes */}
          {showAttachments && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="justify-start"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Ajouter une image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ajouter un document
                </Button>
              </div>
            </div>
          )}

          {/* Zone de saisie principale */}
          <div className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1"
            />
                         <Button
               onClick={handleSendMessage}
               disabled={!message.trim()}
               className="bg-orange-500 hover:bg-orange-600"
             >
               <Send className="h-4 w-4" />
             </Button>
          </div>

          {/* Inputs cachés pour les fichiers */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
          />
          <input
            ref={imageInputRef}
            type="file"
            onChange={handleImageUpload}
            className="hidden"
            accept="image/*"
          />
        </div>

        {/* Modal de transfert */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Transférer les messages</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sélectionnez le vendeur vers lequel transférer {selectedMessages.size} message(s)
              </p>
              
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {availableSellers.map((seller) => (
                  <label key={seller.id} className="flex items-center space-x-3 cursor-pointer">
                                         <input
                       type="radio"
                       name="transferTarget"
                       value={seller.id}
                       checked={transferTarget === seller.id}
                       onChange={(e) => setTransferTarget(e.target.value)}
                       className="text-orange-600"
                     />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={seller.avatar} alt={seller.name} />
                      <AvatarFallback className="text-xs">
                        {seller.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{seller.name}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransferModal(false)
                    setTransferTarget('')
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                                 <Button
                   onClick={handleTransferMessages}
                   disabled={!transferTarget}
                   className="flex-1 bg-orange-500 hover:bg-orange-600"
                 >
                   Transférer
                 </Button>
              </div>
            </div>
          </div>
                 )}

         {/* Modal de détails du produit */}
         {showProductDetails && selectedProduct && (
           <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
             <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-bold text-gray-900">Détails du Produit</h3>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setShowProductDetails(false)}
                   className="text-gray-500 hover:text-gray-700"
                 >
                   <X className="h-5 w-5" />
                 </Button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Image du produit */}
                 <div className="space-y-4">
                   <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                     <img 
                       src={selectedProduct.image || "/placeholder.svg"} 
                       alt={selectedProduct.name}
                       className="w-full h-full object-cover"
                     />
                   </div>
                   
                   {/* Boutons d'action */}
                   <div className="flex flex-col space-y-3">
                     <Button
                       className="w-full bg-green-600 hover:bg-green-700 text-white"
                       onClick={() => {
                         console.log('🛒 Ajouter au panier:', selectedProduct.name)
                         if (typeof window !== 'undefined') {
                           window.dispatchEvent(new CustomEvent('openCartModal', { 
                             detail: { product: selectedProduct } 
                           }))
                         }
                         setShowProductDetails(false)
                       }}
                     >
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                       </svg>
                       Ajouter au Panier
                     </Button>
                     
                     <Button
                       variant="outline"
                       className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                       onClick={() => {
                         // Ici vous pouvez ajouter la logique pour contacter le vendeur
                         console.log('💬 Contacter le vendeur pour:', selectedProduct.name)
                         setShowProductDetails(false)
                       }}
                     >
                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                       </svg>
                       Contacter le Vendeur
                     </Button>
                   </div>
                 </div>
                 
                 {/* Informations du produit */}
                 <div className="space-y-4">
                   <div>
                     <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedProduct.name}</h4>
                     <p className="text-gray-600 text-sm">{selectedProduct.description || 'Aucune description disponible.'}</p>
                   </div>
                   
                   {/* Prix */}
                   <div className="space-y-2">
                     <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                       <span className="text-sm font-medium text-gray-600">Prix en F CFA:</span>
                       <span className="text-lg font-bold text-gray-900">{selectedProduct.price} F CFA</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                       <span className="text-sm font-medium text-gray-600">Prix en Points:</span>
                       <span className="text-lg font-bold text-orange-600">{selectedProduct.pointsPrice || '150'} points</span>
                     </div>
                   </div>
                   
                   {/* Caractéristiques */}
                   <div className="space-y-2">
                     <h5 className="font-semibold text-gray-900">Caractéristiques</h5>
                     <div className="grid grid-cols-2 gap-2 text-sm">
                       <div className="flex items-center space-x-2">
                         <span className="text-gray-500">Catégorie:</span>
                         <span className="font-medium">{selectedProduct.category || 'Non spécifiée'}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <span className="text-gray-500">Stock:</span>
                         <span className="font-medium">{selectedProduct.stock || 'Disponible'}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <span className="text-gray-500">Vendeur:</span>
                         <span className="font-medium">{sellerName}</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <span className="text-gray-500">Note:</span>
                         <span className="font-medium">
                          {vendorSummary ? `${vendorSummary.averageRating.toFixed(1)}/5 ⭐` : '4.8/5 ⭐'}
                        </span>
                      </div>
                     </div>
                   </div>
                   
                   {/* Description détaillée */}
                   <div>
                     <h5 className="font-semibold text-gray-900 mb-2">Description Détaillée</h5>
                     <p className="text-gray-600 text-sm leading-relaxed">
                       {selectedProduct.description || 'Ce produit est disponible dans notre boutique. Contactez le vendeur pour plus d\'informations sur les spécifications techniques, la garantie et les conditions de livraison.'}
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
       </DialogContent>
     </Dialog>
     </>
   )
 }
