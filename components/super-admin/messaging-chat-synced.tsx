"use client"

/**
 * Composant de messagerie interne synchronisé pour SUPER ADMIN
 * Permet d'envoyer des messages à tous les utilisateurs et de gérer la messagerie
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { 
  Mail, Plus, Download, Bell, Clock, Star, Search, Filter, Users,
  Eye, Check, RefreshCw, X, Send, Archive, Trash2, Reply, UserCheck, MessageSquare, Info, ShoppingCart, MoreVertical
} from 'lucide-react'
import { Mic, Paperclip, Smile, Pause, Play, Square } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { useInternalMessaging } from '@/contexts/InternalMessagingContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ClientAuthService } from '@/lib/services/client-auth-service'
import { SuperAdminDashboardService } from '@/lib/services/super-admin-dashboard-service'
import { CartService } from '@/lib/services'
import { ChatService } from '@/lib/services/chat-service'
import { useMoney } from '@/lib/hooks/use-money'

type EncodedProductPayload = {
  product: any
  text?: string
}

type EncodedAttachmentPayload = {
  kind: 'image' | 'video' | 'audio' | 'document' | 'file'
  url: string
  name?: string
  size?: number
  mime?: string
  text?: string
}

function decodeProductMessage(content: string): EncodedProductPayload | null {
  const raw = String(content ?? '')
  const prefix = '__product__:'
  if (!raw.startsWith(prefix)) return null
  const jsonPart = raw.slice(prefix.length)
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
 * Décode un message pièce jointe encodé sous le préfixe `__attachment__:`.
 */
function decodeAttachmentMessage(content: string): EncodedAttachmentPayload | null {
  const raw = String(content ?? '')
  const prefix = '__attachment__:'
  if (!raw.startsWith(prefix)) return null
  const jsonPart = raw.slice(prefix.length)
  try {
    const parsed = JSON.parse(jsonPart)
    if (!parsed || typeof parsed !== 'object') return null
    const kind = String((parsed as any).kind)
    const url = String((parsed as any).url ?? '')
    if (!url) return null

    const mime = typeof (parsed as any).mime === 'string' ? String((parsed as any).mime) : undefined
    const normalizeKind = (input: string): EncodedAttachmentPayload['kind'] => {
      const candidate = String(input ?? '').toLowerCase().trim()
      if (candidate === 'image' || candidate === 'video' || candidate === 'audio' || candidate === 'document' || candidate === 'file') {
        return candidate
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
 * Transforme un contenu DB encodé en contenu "lisible" pour l'UI Super Admin.
 */
function getReadableChatContent(
  content: string
):
  | { kind: 'text'; text: string }
  | { kind: 'product'; text: string; product: any }
  | { kind: 'attachment'; text: string; attachment: EncodedAttachmentPayload } {
  const decoded = decodeProductMessage(content)
  if (decoded?.product) {
    const name = String((decoded.product as any)?.name ?? '').trim()
    const fallback = name ? `Produit: ${name}` : 'Produit partagé'
    return { kind: 'product', text: String(decoded.text ?? '').trim() || fallback, product: decoded.product }
  }

  const attachment = decodeAttachmentMessage(content)
  if (attachment?.url) {
    const base = String(attachment.text ?? '').trim()
    if (base) return { kind: 'attachment', text: base, attachment }
    if (attachment.kind === 'image') return { kind: 'attachment', text: 'Image jointe', attachment }
    if (attachment.kind === 'audio') return { kind: 'attachment', text: 'Audio joint', attachment }
    if (attachment.kind === 'video') return { kind: 'attachment', text: 'Vidéo jointe', attachment }
    if (attachment.kind === 'document') return { kind: 'attachment', text: 'Document joint', attachment }
    return { kind: 'attachment', text: 'Fichier joint', attachment }
  }

  return { kind: 'text', text: String(content ?? '') }
}

/**
 * Normalise le champ DB `attachments` (jsonb) en tableau d'URLs.
 */
function normalizeMessageAttachments(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter((url) => url.length > 0)
  }
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item ?? '').trim())
          .filter((url) => url.length > 0)
      }
    } catch {
      // ignore
    }
    return [raw]
  }
  return []
}

export default function MessagingChatSynced() {
  const { confirm: confirmDialog } = useConfirm()
  const { toast } = useToast()
  const { user } = useAuth()
  const { formatMoney } = useMoney()
  const {
    messages,
    sentMessages,
    isLoading,
    receivedMessages,
    unreadCount,
    isSyncing,
    sendMessage,
    replyToMessage,
    markAsRead,
    markAllAsRead,
    archiveMessage,
    deleteMessage,
    toggleImportant,
    updateMessage,
    getParticipantInfo,
    refreshMessages
  } = useInternalMessaging()

  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [newMessageSubject, setNewMessageSubject] = useState('')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [newMessageCategory, setNewMessageCategory] = useState('general')
  const [newMessagePriority, setNewMessagePriority] = useState('normal')
  const [recipientType, setRecipientType] = useState<'all' | 'vendors' | 'clients' | 'specific'>('specific')
  const [specificRecipientId, setSpecificRecipientId] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('general')
  const [editPriority, setEditPriority] = useState('normal')
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [messageTypeFilter, setMessageTypeFilter] = useState<'all' | 'received' | 'sent'>('all')
  
  const [participantInfo, setParticipantInfo] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState<'internal' | 'chat'>('internal')

  const chatRealtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const refreshSessionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatSessionsRef = useRef<SuperAdminChatSession[]>([])

  type SuperAdminChatSession = {
    id: string
    participant1: { id: string; name: string; email: string; role: string | null }
    participant2: { id: string; name: string; email: string; role: string | null }
    isActive: boolean
    createdAt: string
    lastMessageAt: string | null
    lastMessagePreview: string
    lastMessageSenderName: string | null
    lastMessageCreatedAt: string | null
  }

  /**
   * Modération: suppression définitive d'un message.
   */
  const handleModerateHardDeleteMessage = async (chatId: string, messageId: string) => {
    if (!chatId || !messageId) return

    if (!accepted) return

    try {
      const response = await fetch(`/api/super-admin/chats/${chatId}/messages`, {
        method: 'PATCH',
        credentials: 'include',
        headers: await ClientAuthService.buildAuthHeaders(),
        body: JSON.stringify({ action: 'hard_delete', messageId })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Suppression définitive échouée.')
      }

      await loadChatMessages(chatId)
    } catch (error) {
      console.error('Erreur modération hard delete:', error)
    }
  }

  const handleSendChatReply = async () => {
    const chatId = String(selectedChatId ?? '').trim()
    const content = String(chatReplyInput ?? '').trim()
    if (!chatId || !content) return

    setIsSendingChatReply(true)
    try {
      const res = await fetch(`/api/super-admin/chats/${encodeURIComponent(chatId)}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(await ClientAuthService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, messageType: 'text' })
      })

      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        let fallbackText = ''
        if (!payload) {
          fallbackText = await res.text().catch(() => '')
        }

        console.error('Réponse POST /messages (super admin) non OK:', {
          status: res.status,
          statusText: res.statusText,
          payload,
          fallbackText
        })

        throw new Error(payload?.error ?? fallbackText ?? 'Envoi échoué.')
      }

      setChatReplyInput('')

      // Append immédiat (le Realtime le fera aussi, mais ça évite la latence réseau)
      const inserted = payload?.data
      if (inserted?.id) {
        const nextMsg: SuperAdminChatMessage = {
          id: String(inserted.id),
          chatId,
          senderId: String(inserted.sender_id ?? user?.id ?? ''),
          senderName: 'Boutique',
          senderRole: 'super_admin',
          content: String(inserted.content ?? content),
          messageType: String(inserted.message_type ?? 'text'),
          isRead: Boolean(inserted.is_read ?? false),
          createdAt: String(inserted.created_at ?? new Date().toISOString())
        }

        setChatMessages((prev) => {
          if (prev.some((m) => m.id === nextMsg.id)) return prev
          return [...prev, nextMsg]
        })
      }

      // Best-effort: remonter la conversation et mettre à jour l'aperçu
      void loadChatSessions()
    } catch (error) {
      console.error('Erreur envoi réponse chat super admin:', error)
    } finally {
      setIsSendingChatReply(false)
    }
  }

  const openModerationModal = (chatId: string, userId: string, userName: string) => {
    setModerationChatId(chatId)
    setModerationTargetUserId(userId)
    setModerationTargetUserName(userName)
    setModerationAction('warn')
    setModerationReason('')
    setModerationMuteHours('24')
    setModerationBanHours('168')
    setModerationBanIsPermanent(false)
    setAlsoPostSystemWarning(true)
    setShowModerationModal(true)
    void loadModerationHistory(userId)
  }

  const loadModerationHistory = async (userId: string) => {
    setIsModerationHistoryLoading(true)
    try {
      const response = await fetch(`/api/super-admin/chat-moderation/history?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        credentials: 'include',
        headers: await ClientAuthService.buildAuthHeaders()
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? "Chargement de l'historique échoué")
      }

      setModerationHistorySanctions((payload?.data?.sanctions ?? []) as ModerationSanctionRow[])
      setModerationHistoryWarnings((payload?.data?.warnings ?? []) as ModerationWarningRow[])
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique de modération:", error)
      setModerationHistorySanctions([])
      setModerationHistoryWarnings([])
    } finally {
      setIsModerationHistoryLoading(false)
    }
  }

  const revokeSanction = async (sanctionId: string) => {
    const accepted = await confirmDialog({
      title: 'Révoquer la sanction',
      message: 'Confirmer la révocation (unmute/unban) ?',
      confirmText: 'Révoquer',
      cancelText: 'Annuler',
      variant: 'default'
    })
    if (!accepted) return

    try {
      const response = await fetch('/api/super-admin/chat-moderation/sanctions', {
        method: 'PATCH',
        credentials: 'include',
        headers: await ClientAuthService.buildAuthHeaders(),
        body: JSON.stringify({ sanctionId })
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Révocation échouée')
      }
      if (moderationTargetUserId) {
        await loadModerationHistory(moderationTargetUserId)
      }
    } catch (error) {
      console.error('Erreur lors de la révocation:', error)
    }
  }

  const submitModerationAction = async () => {
    if (!moderationTargetUserId) return

    setIsModerationSubmitting(true)
    try {
      if (moderationAction === 'warn') {
        const response = await fetch('/api/super-admin/chat-moderation/warnings', {
          method: 'POST',
          credentials: 'include',
          headers: await ClientAuthService.buildAuthHeaders(),
          body: JSON.stringify({
            userId: moderationTargetUserId,
            chatId: moderationChatId,
            warningMessage: moderationReason || 'Avertissement',
            alsoPostSystemMessage: alsoPostSystemWarning
          })
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload?.error ?? "Avertissement échoué")
        }
      }

      if (moderationAction === 'mute') {
        const hours = Math.max(1, Number(moderationMuteHours) || 24)
        const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
        const response = await fetch('/api/super-admin/chat-moderation/sanctions', {
          method: 'POST',
          credentials: 'include',
          headers: await ClientAuthService.buildAuthHeaders(),
          body: JSON.stringify({
            userId: moderationTargetUserId,
            sanctionType: 'mute',
            reason: moderationReason || 'Mute',
            expiresAt
          })
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload?.error ?? 'Mute échoué')
        }
      }

      if (moderationAction === 'ban') {
        const expiresAt = moderationBanIsPermanent
          ? null
          : new Date(Date.now() + Math.max(1, Number(moderationBanHours) || 168) * 60 * 60 * 1000).toISOString()

        const response = await fetch('/api/super-admin/chat-moderation/sanctions', {
          method: 'POST',
          credentials: 'include',
          headers: await ClientAuthService.buildAuthHeaders(),
          body: JSON.stringify({
            userId: moderationTargetUserId,
            sanctionType: 'ban',
            reason: moderationReason || 'Ban chat',
            expiresAt
          })
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(payload?.error ?? 'Ban échoué')
        }
      }

      setShowModerationModal(false)
      if (moderationChatId) {
        await loadChatMessages(moderationChatId)
        await loadChatSessions()
      }
      if (moderationTargetUserId) {
        await loadModerationHistory(moderationTargetUserId)
      }
    } catch (error) {
      console.error('Erreur lors de la modération:', error)
    } finally {
      setIsModerationSubmitting(false)
    }
  }

  type SuperAdminChatMessage = {
    id: string
    chatId: string
    senderId: string
    senderName: string
    senderRole: string | null
    content: string
    messageType: string
    isRead: boolean
    createdAt: string
  }

  const [chatSessions, setChatSessions] = useState<SuperAdminChatSession[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<SuperAdminChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isChatMessagesLoading, setIsChatMessagesLoading] = useState(false)
  const [chatReplyInput, setChatReplyInput] = useState('')
  const [isSendingChatReply, setIsSendingChatReply] = useState(false)

  const [showChatEmojiPicker, setShowChatEmojiPicker] = useState(false)
  const [isRecordingChatAudio, setIsRecordingChatAudio] = useState(false)
  const [isChatRecordingPaused, setIsChatRecordingPaused] = useState(false)
  const [chatRecordingTime, setChatRecordingTime] = useState(0)
  const [chatMediaRecorder, setChatMediaRecorder] = useState<MediaRecorder | null>(null)
  const chatRecordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatRecordingPausedRef = useRef(false)
  const chatFileInputRef = useRef<HTMLInputElement | null>(null)

  const formatRecordingTime = (seconds: number) => {
    const s = Math.max(0, Number(seconds) || 0)
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const encodeAttachmentContent = (payload: EncodedAttachmentPayload) => {
    return `__attachment__:${JSON.stringify(payload)}`
  }

  /**
   * Upload une pièce jointe sur Supabase Storage et retourne son URL publique.
   * Aligné sur la logique existante du chat client/vendeur pour éviter toute régression.
   */
  const uploadChatAttachment = async (file: File): Promise<string> => {
    const chatId = String(selectedChatId ?? '').trim()
    if (!chatId) throw new Error('Chat ID manquant')

    const bucket =
      (process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET && process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim())
        ? process.env.NEXT_PUBLIC_SUPABASE_CHAT_UPLOAD_BUCKET.trim()
        : 'chat-uploads'

    const ext = (() => {
      const name = String(file.name ?? '').trim()
      const idx = name.lastIndexOf('.')
      if (idx <= 0) return ''
      return name.slice(idx + 1).toLowerCase()
    })()

    const safeExt = ext ? `.${ext}` : ''
    const path = `chat/${encodeURIComponent(chatId)}/${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`

    const { error } = await ChatService.uploadFileToStorage(bucket, path, file)
    if (error) {
      const anyErr = error as any
      const msg = String(anyErr?.message ?? anyErr?.error ?? anyErr?.toString?.() ?? '')
      throw new Error(msg || 'Upload échoué')
    }

    const url = ChatService.getPublicUrlFromStorage(bucket, path)
    if (!url) {
      throw new Error('URL upload manquante')
    }
    return url
  }

  const sendChatAttachment = async (file: File) => {
    const chatId = String(selectedChatId ?? '').trim()
    if (!chatId) return
    const mime = String(file.type ?? '').toLowerCase().trim()
    const kind: EncodedAttachmentPayload['kind'] = mime.startsWith('image/')
      ? 'image'
      : mime.startsWith('audio/')
        ? 'audio'
        : mime.startsWith('video/')
          ? 'video'
          : 'document'

    setIsSendingChatReply(true)
    try {
      const url = await uploadChatAttachment(file)
      const content = encodeAttachmentContent({
        kind,
        url,
        name: file.name,
        size: file.size,
        mime: file.type
      })

      const res = await fetch(`/api/super-admin/chats/${encodeURIComponent(chatId)}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(await ClientAuthService.buildAuthHeaders()),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, messageType: kind === 'image' ? 'image' : 'file' })
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error ?? 'Envoi échoué')

      const inserted = payload?.data
      if (inserted?.id) {
        const nextMsg: SuperAdminChatMessage = {
          id: String(inserted.id),
          chatId,
          senderId: String(inserted.sender_id ?? user?.id ?? ''),
          senderName: 'Boutique',
          senderRole: 'super_admin',
          content: String(inserted.content ?? content),
          messageType: String(inserted.message_type ?? 'file'),
          isRead: Boolean(inserted.is_read ?? false),
          createdAt: String(inserted.created_at ?? new Date().toISOString())
        }
        setChatMessages((prev) => (prev.some((m) => m.id === nextMsg.id) ? prev : [...prev, nextMsg]))
      }
      void loadChatSessions()
    } catch (error) {
      console.error('Erreur envoi pièce jointe super admin:', error)
    } finally {
      setIsSendingChatReply(false)
    }
  }

  const startChatRecording = async () => {
    if (isRecordingChatAudio) return
    const chatId = String(selectedChatId ?? '').trim()
    if (!chatId) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      recorder.onstop = async () => {
        try {
          const mime = recorder.mimeType || 'audio/webm'
          const blob = new Blob(chunks, { type: mime })
          if (blob.size <= 0) return
          const file = new globalThis.File([blob], `audio_${Date.now()}.webm`, { type: blob.type || mime })
          await sendChatAttachment(file)
        } finally {
          try {
            recorder.stream.getTracks().forEach((t) => t.stop())
          } catch {
            // ignore
          }
          setChatRecordingTime(0)
        }
      }

      recorder.start()
      setChatMediaRecorder(recorder)
      setIsRecordingChatAudio(true)
      setIsChatRecordingPaused(false)
      chatRecordingPausedRef.current = false

      if (chatRecordingIntervalRef.current) clearInterval(chatRecordingIntervalRef.current)
      chatRecordingIntervalRef.current = setInterval(() => {
        if (chatRecordingPausedRef.current) return
        setChatRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Microphone super admin:', error)
      setIsRecordingChatAudio(false)
      setIsChatRecordingPaused(false)
      chatRecordingPausedRef.current = false
      setChatMediaRecorder(null)
    }
  }

  const stopChatRecording = () => {
    if (!chatMediaRecorder || !isRecordingChatAudio) return
    try {
      chatMediaRecorder.stop()
    } catch {
      // ignore
    }
    setIsRecordingChatAudio(false)
    setIsChatRecordingPaused(false)
    chatRecordingPausedRef.current = false
    if (chatRecordingIntervalRef.current) {
      clearInterval(chatRecordingIntervalRef.current)
      chatRecordingIntervalRef.current = null
    }
  }

  const toggleChatRecordingPause = () => {
    if (!chatMediaRecorder || !isRecordingChatAudio) return
    try {
      if (isChatRecordingPaused) {
        chatMediaRecorder.resume()
        setIsChatRecordingPaused(false)
        chatRecordingPausedRef.current = false
      } else {
        chatMediaRecorder.pause()
        setIsChatRecordingPaused(true)
        chatRecordingPausedRef.current = true
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    return () => {
      if (chatRecordingIntervalRef.current) {
        clearInterval(chatRecordingIntervalRef.current)
        chatRecordingIntervalRef.current = null
      }
      try {
        chatMediaRecorder?.stream?.getTracks?.().forEach((t: any) => t.stop())
      } catch {
        // ignore
      }
    }
  }, [chatMediaRecorder])

  const [isProductInfoOpen, setIsProductInfoOpen] = useState(false)
  const [productInfoLoading, setProductInfoLoading] = useState(false)
  const [productInfoError, setProductInfoError] = useState<string | null>(null)
  const [productInfoData, setProductInfoData] = useState<any>(null)

  const productInfoCacheRef = useRef<Map<string, any>>(new Map())
  const productInfoAbortRef = useRef<AbortController | null>(null)
  const productInfoActiveIdRef = useRef<string>('')

  /**
   * Construit un snapshot minimal exploitable immédiatement dans l’overlay,
   * à partir des données déjà présentes dans le message de chat.
   */
  const buildProductSnapshotForOverlay = (product: any): any => {
    if (!product || typeof product !== 'object') return product
    const anyP = product as any
    const images = Array.isArray(anyP?.images) ? anyP.images : []
    const mainImage =
      String(anyP?.image_url ?? anyP?.imageUrl ?? '').trim() ||
      (typeof images[0] === 'string' ? String(images[0]).trim() : '') ||
      String(anyP?.image ?? '').trim()

    return {
      ...anyP,
      media: {
        ...(typeof anyP?.media === 'object' && anyP.media ? anyP.media : {}),
        main_image: String((anyP as any)?.media?.main_image ?? '').trim() || mainImage
      }
    }
  }

  /**
   * Ouvre l’overlay instantanément (cache/snapshot), puis re-synchronise en arrière-plan
   * depuis la base via /api/public/products.
   */
  const openProductInfo = async (productId: string, snapshotProduct?: any) => {
    const pid = String(productId ?? '').trim()
    if (!pid) return

    productInfoActiveIdRef.current = pid
    setIsProductInfoOpen(true)
    setProductInfoError(null)

    const cached = productInfoCacheRef.current.get(pid)
    const snapshot = snapshotProduct ? buildProductSnapshotForOverlay(snapshotProduct) : null
    if (cached) {
      setProductInfoData(cached)
      setProductInfoLoading(false)
    } else if (snapshot) {
      setProductInfoData(snapshot)
      setProductInfoLoading(false)
    } else {
      setProductInfoData(null)
      setProductInfoLoading(true)
    }

    if (productInfoAbortRef.current) {
      try {
        productInfoAbortRef.current.abort()
      } catch {
        // ignore
      }
    }
    const controller = new AbortController()
    productInfoAbortRef.current = controller

    try {
      setProductInfoLoading(true)
      const resp = await fetch(`/api/public/products?id=${encodeURIComponent(pid)}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      })
      const json = resp.ok ? await resp.json().catch(() => null) : null
      const data = json?.data
      if (!data) {
        setProductInfoError('Aucune information produit disponible.')
        return
      }
      productInfoCacheRef.current.set(pid, data)
      if (productInfoActiveIdRef.current === pid) {
        setProductInfoData(data)
      }
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return
      const msg = error instanceof Error ? error.message : 'Impossible de charger les informations produit.'
      setProductInfoError(msg)
    } finally {
      if (productInfoActiveIdRef.current === pid) {
        setProductInfoLoading(false)
      }
    }
  }

  const addProductToCart = (product: any) => {
    const pid = String(product?.id ?? '').trim()
    if (!pid) return
    const name = String(product?.name ?? 'Produit').trim() || 'Produit'
    const images = Array.isArray(product?.images) ? product.images : []
    const image =
      String(product?.image_url ?? product?.imageUrl ?? '').trim() ||
      (typeof images[0] === 'string' ? String(images[0]).trim() : '') ||
      String(product?.image ?? '').trim() ||
      '/placeholder.jpg'
    const seller = String(product?.seller_name ?? product?.sellerName ?? product?.vendorName ?? 'Vendeur').trim() || 'Vendeur'
    const priceRaw = product?.sale_price ?? product?.salePrice ?? product?.price ?? 0
    const price = Number(priceRaw) || 0
    const originalPrice = typeof product?.original_price === 'number' ? product.original_price : (typeof product?.originalPrice === 'number' ? product.originalPrice : undefined)

    const nextCart = CartService.addToCart({
      id: pid,
      name,
      price,
      originalPrice,
      image,
      seller
    })

    if (typeof window !== 'undefined') {
      try {
        const count = (nextCart ?? []).reduce((sum: number, item: any) => sum + (Number(item?.quantity ?? 0) || 0), 0)
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: nextCart, count } }))
      } catch {
        // ignore
      }
    }
  }

  const [showModerationModal, setShowModerationModal] = useState(false)
  const [moderationTargetUserId, setModerationTargetUserId] = useState<string | null>(null)
  const [moderationTargetUserName, setModerationTargetUserName] = useState<string>('')
  const [moderationChatId, setModerationChatId] = useState<string | null>(null)
  const [moderationAction, setModerationAction] = useState<'warn' | 'mute' | 'ban'>('warn')
  const [moderationReason, setModerationReason] = useState('')
  const [moderationMuteHours, setModerationMuteHours] = useState('24')
  const [moderationBanHours, setModerationBanHours] = useState('168')
  const [moderationBanIsPermanent, setModerationBanIsPermanent] = useState(false)
  const [alsoPostSystemWarning, setAlsoPostSystemWarning] = useState(true)
  const [isModerationSubmitting, setIsModerationSubmitting] = useState(false)

  type ModerationSanctionRow = {
    id: string
    sanction_type: 'mute' | 'ban'
    reason: string | null
    expires_at: string | null
    created_at: string
    revoked_at: string | null
  }

  type ModerationWarningRow = {
    id: string
    chat_id: string | null
    warning_message: string
    created_at: string
  }

  const [moderationHistorySanctions, setModerationHistorySanctions] = useState<ModerationSanctionRow[]>([])
  const [moderationHistoryWarnings, setModerationHistoryWarnings] = useState<ModerationWarningRow[]>([])
  const [isModerationHistoryLoading, setIsModerationHistoryLoading] = useState(false)

  // Charger tous les utilisateurs pour l'envoi de messages
  useEffect(() => {
    loadAllUsers()
  }, [])

  useEffect(() => {
    if (activeTab === 'chat') {
      void loadChatSessions()
    }
  }, [activeTab])

  useEffect(() => {
    chatSessionsRef.current = chatSessions
  }, [chatSessions])

  useEffect(() => {
    if (activeTab !== 'chat') {
      if (chatRealtimeChannelRef.current) {
        supabase.removeChannel(chatRealtimeChannelRef.current)
        chatRealtimeChannelRef.current = null
      }
      if (refreshSessionsTimerRef.current) {
        clearTimeout(refreshSessionsTimerRef.current)
        refreshSessionsTimerRef.current = null
      }
      return
    }

    if (chatRealtimeChannelRef.current) {
      supabase.removeChannel(chatRealtimeChannelRef.current)
      chatRealtimeChannelRef.current = null
    }

    const scheduleRefreshSessions = () => {
      if (refreshSessionsTimerRef.current) {
        clearTimeout(refreshSessionsTimerRef.current)
      }
      refreshSessionsTimerRef.current = setTimeout(() => {
        refreshSessionsTimerRef.current = null
        void loadChatSessions()
      }, 150)
    }

    const channel = supabase
      .channel('super-admin-chat-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_chats'
        },
        () => {
          scheduleRefreshSessions()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload: any) => {
          const row = payload?.new
          const chatId = String(row?.chat_id ?? '')
          const senderId = String(row?.sender_id ?? '')
          const content = String(row?.content ?? '')
          const createdAt = String(row?.created_at ?? new Date().toISOString())
          const messageType = String(row?.message_type ?? 'text')
          const messageId = String(row?.id ?? '')

          if (!chatId) {
            scheduleRefreshSessions()
            return
          }

          // Mise à jour immédiate de la liste des conversations (preview + tri)
          setChatSessions((prev) => {
            const existing = prev.find((s) => s.id === chatId)
            if (!existing) {
              // Nouvelle conversation : on refetch rapidement
              scheduleRefreshSessions()
              return prev
            }

            const senderName =
              String(existing.participant1?.id ?? '') === senderId
                ? existing.participant1?.name
                : String(existing.participant2?.id ?? '') === senderId
                  ? existing.participant2?.name
                  : existing.lastMessageSenderName

            const updated = {
              ...existing,
              lastMessageAt: createdAt,
              lastMessageCreatedAt: createdAt,
              lastMessagePreview: content,
              lastMessageSenderName: senderName ?? existing.lastMessageSenderName
            }

            const next = prev.map((s) => (s.id === chatId ? updated : s))
            next.sort((a, b) => {
              const aTime = new Date(a.lastMessageCreatedAt ?? a.lastMessageAt ?? a.createdAt).getTime()
              const bTime = new Date(b.lastMessageCreatedAt ?? b.lastMessageAt ?? b.createdAt).getTime()
              return bTime - aTime
            })
            return next
          })

          // Si la conversation est ouverte, append immédiat du message
          if (selectedChatId && selectedChatId === chatId && messageId) {
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === messageId)) return prev

              const session = chatSessionsRef.current.find((s) => s.id === chatId)
              const senderName =
                session && String(session.participant1?.id ?? '') === senderId
                  ? session.participant1?.name
                  : session && String(session.participant2?.id ?? '') === senderId
                    ? session.participant2?.name
                    : 'Utilisateur'

              const senderRole =
                session && String(session.participant1?.id ?? '') === senderId
                  ? session.participant1?.role
                  : session && String(session.participant2?.id ?? '') === senderId
                    ? session.participant2?.role
                    : null

              const nextMsg = {
                id: messageId,
                chatId,
                senderId,
                senderName,
                senderRole,
                content,
                messageType,
                isRead: false,
                createdAt
              } as any

              return [...prev, nextMsg]
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // rien
        }
      })

    chatRealtimeChannelRef.current = channel

    return () => {
      if (chatRealtimeChannelRef.current) {
        supabase.removeChannel(chatRealtimeChannelRef.current)
        chatRealtimeChannelRef.current = null
      }
      if (refreshSessionsTimerRef.current) {
        clearTimeout(refreshSessionsTimerRef.current)
        refreshSessionsTimerRef.current = null
      }
    }
  }, [activeTab, selectedChatId])

  useEffect(() => {
    if (selectedMessage) {
      const otherUserId = selectedMessage.sender_id === user?.id 
        ? selectedMessage.recipient_id 
        : selectedMessage.sender_id
      loadParticipantInfo(otherUserId)
      
      if (selectedMessage.recipient_id === user?.id && !selectedMessage.is_read) {
        markAsRead(selectedMessage.id)
      }
    }
  }, [selectedMessage])

  /**
   * Charge les utilisateurs via l'API super-admin (bypass RLS) pour alimenter le select "Utilisateur spécifique".
   */
  const loadAllUsers = async () => {
    try {
      const pageSize = 200
      const maxPages = 25
      const collected: any[] = []

      for (let page = 0; page < maxPages; page += 1) {
        const batch = await SuperAdminDashboardService.getUsers({
          limit: pageSize,
          offset: page * pageSize,
          role: 'all',
          status: 'all'
        })

        collected.push(...(batch ?? []))
        if (!batch || batch.length < pageSize) break
      }

      collected.sort((a, b) => String(a?.email ?? '').localeCompare(String(b?.email ?? '')))
      setAllUsers(collected)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      setAllUsers([])
    }
  }

  /**
   * Récupère la liste des destinataires selon le type (tous, vendeurs, clients) via l'API super-admin.
   */
  const fetchRecipientIds = async (kind: 'all' | 'vendors' | 'clients'): Promise<string[]> => {
    const pageSize = 500
    const maxPages = 50
    const ids: string[] = []

    const role = kind === 'vendors' ? 'vendor' : kind === 'clients' ? 'client' : 'all'

    for (let page = 0; page < maxPages; page += 1) {
      const batch = await SuperAdminDashboardService.getUsers({
        limit: pageSize,
        offset: page * pageSize,
        role,
        status: 'all'
      })

      for (const u of batch ?? []) {
        const id = String((u as any)?.id ?? '').trim()
        const uRole = String((u as any)?.role ?? '').trim()
        if (!id) continue
        if (kind === 'all') {
          if (uRole === 'client' || uRole === 'vendor') ids.push(id)
        } else {
          ids.push(id)
        }
      }

      if (!batch || batch.length < pageSize) break
    }

    return ids
  }

  const loadParticipantInfo = async (userId: string) => {
    const info = await getParticipantInfo(userId)
    setParticipantInfo(info)
  }

  /**
   * Charge toutes les conversations (user_chats) pour supervision Super Admin.
   */
  const loadChatSessions = async () => {
    setIsChatLoading(true)
    try {
      const response = await fetch('/api/super-admin/chats?limit=100', {
        method: 'GET',
        credentials: 'include',
        headers: await ClientAuthService.buildAuthHeaders()
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Chargement des conversations échoué.')
      }

      setChatSessions((payload?.data ?? []) as SuperAdminChatSession[])
      const nextSelected = selectedChatId ?? (payload?.data?.[0]?.id as string | undefined)
      if (nextSelected) {
        setSelectedChatId(nextSelected)
        void loadChatMessages(nextSelected)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversations Super Admin:', error)
      setChatSessions([])
    } finally {
      setIsChatLoading(false)
    }
  }

  /**
   * Charge les messages d'une conversation.
   */
  const loadChatMessages = async (chatId: string) => {
    if (!chatId) return
    setIsChatMessagesLoading(true)
    try {
      const response = await fetch(`/api/super-admin/chats/${chatId}/messages?limit=300`, {
        method: 'GET',
        credentials: 'include',
        headers: await ClientAuthService.buildAuthHeaders()
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Chargement des messages échoué.')
      }

      setChatMessages((payload?.data ?? []) as SuperAdminChatMessage[])
    } catch (error) {
      console.error('Erreur lors du chargement des messages chat Super Admin:', error)
      setChatMessages([])
    } finally {
      setIsChatMessagesLoading(false)
    }
  }

  /**
   * Modération: soft delete d'un message (remplacement par un message système).
   */
  const handleModerateSoftDeleteMessage = async (chatId: string, messageId: string) => {
    const accepted = await confirmDialog({
      title: 'Supprimer le message (modération)',
      message: 'Le contenu sera remplacé par un message de modération. Continuer ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    })

    if (!accepted) return

    try {
      const response = await fetch(`/api/super-admin/chats/${chatId}/messages`, {
        method: 'PATCH',
        credentials: 'include',
        headers: await ClientAuthService.buildAuthHeaders(),
        body: JSON.stringify({ action: 'soft_delete', messageId })
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Suppression échouée.')
      }

      await loadChatMessages(chatId)
    } catch (error) {
      console.error('Erreur modération soft delete:', error)
    }
  }

  /** Mappe les priorités UI (normal/urgent) vers les valeurs supportées par l'API super-admin (medium/high/low). */
  const mapSuperAdminPriority = (value: any): 'low' | 'medium' | 'high' => {
    const normalized = String(value ?? '').toLowerCase().trim()
    if (normalized === 'low') return 'low'
    if (normalized === 'high') return 'high'
    if (normalized === 'urgent') return 'high'
    return 'medium'
  }

  const handleSendMessage = async () => {
    if (!newMessageSubject.trim() || !newMessageContent.trim()) {
      return
    }

    setIsSendingMessage(true)

    try {
      const senderId = String(user?.id ?? '').trim()
      if (!senderId) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour envoyer un message.',
          variant: 'destructive'
        })
        setIsSendingMessage(false)
        return
      }

      const payloadBase = {
        senderId,
        subject: newMessageSubject,
        content: newMessageContent,
        priority: mapSuperAdminPriority(newMessagePriority),
        category: String(newMessageCategory ?? '').trim() || null,
        parentMessageId: null as string | null
      }

      if (recipientType === 'all' || recipientType === 'vendors' || recipientType === 'clients') {
        const recipientIds = await fetchRecipientIds(recipientType)

        for (const recipientId of recipientIds) {
          const ok = await SuperAdminDashboardService.sendInternalMessage({
            ...payloadBase,
            recipientId
          })

          if (!ok) {
            throw new Error('Envoi échoué via API super-admin')
          }
        }

        await refreshMessages()

        toast({
          title: 'Message envoyé',
          description: `Message envoyé à ${recipientIds.length} utilisateur(s).`,
          variant: 'default'
        })
      } else {
        // Envoyer à un utilisateur spécifique
        if (!specificRecipientId) {
          toast({
            title: 'Destinataire manquant',
            description: 'Veuillez sélectionner un destinataire.',
            variant: 'destructive'
          })
          setIsSendingMessage(false)
          return
        }

        const ok = await SuperAdminDashboardService.sendInternalMessage({
          ...payloadBase,
          recipientId: specificRecipientId
        })

        if (!ok) {
          throw new Error('Envoi échoué via API super-admin')
        }

        await refreshMessages()

        toast({
          title: 'Message envoyé',
          description: 'Votre message a été envoyé avec succès.',
          variant: 'default'
        })
      }

      setNewMessageSubject('')
      setNewMessageContent('')
      setNewMessageCategory('general')
      setNewMessagePriority('normal')
      setRecipientType('specific')
      setSpecificRecipientId('')
      setShowNewMessageModal(false)
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      const msg = error instanceof Error ? error.message : "Erreur lors de l'envoi du message."
      toast({
        title: 'Erreur',
        description: msg,
        variant: 'destructive'
      })
    }

    setIsSendingMessage(false)
  }

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return

    const senderId = String(selectedMessage?.sender_id ?? '').trim()
    const currentUserId = String(user?.id ?? '').trim()
    if (senderId && currentUserId && senderId === currentUserId) {
      toast({
        title: 'Action interdite',
        description: "Vous ne pouvez pas répondre à un message que vous avez vous-même envoyé.",
        variant: 'destructive'
      })
      return
    }

    setIsReplying(true)

    const success = await replyToMessage(selectedMessage.id, replyContent)

    if (success) {
      setReplyContent('')
      setShowReplyModal(false)
      setShowMessageModal(false)
    }

    setIsReplying(false)
  }

  const handleArchive = async () => {
    if (selectedMessage) {
      await archiveMessage(selectedMessage.id)
      setShowMessageModal(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMessage) return
    const accepted = await confirmDialog({
      title: 'Supprimer le message',
      message: 'Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    })
    if (accepted) {
      await deleteMessage(selectedMessage.id)
      setShowMessageModal(false)
    }
  }

  /**
   * Ouvre le modal d'édition d'un message (uniquement expéditeur).
   */
  const handleOpenEdit = (message: any) => {
    if (!message) return
    setSelectedMessage(message)
    setEditSubject(String(message.subject ?? ''))
    setEditContent(String(message.content ?? ''))
    setEditCategory(String(message.category ?? 'general'))
    setEditPriority(String(message.priority ?? 'normal'))
    setShowEditModal(true)
  }

  /**
   * Sauvegarde l'édition du message (sync DB).
   */
  const handleUpdateMessage = async () => {
    if (!selectedMessage) return
    if (!editSubject.trim() || !editContent.trim()) return

    setIsUpdatingMessage(true)
    const ok = await updateMessage({
      messageId: selectedMessage.id,
      subject: editSubject,
      content: editContent,
      category: editCategory,
      priority: editPriority
    })

    if (ok) {
      await refreshMessages()
      setShowEditModal(false)
    }

    setIsUpdatingMessage(false)
  }

  /**
   * Copie le contenu du message dans le presse-papiers.
   */
  const handleCopyContent = async (message: any) => {
    try {
      const text = String(message?.content ?? '')
      await navigator.clipboard.writeText(text)
      toast({ title: 'Copié', description: 'Contenu copié dans le presse-papiers', variant: 'default' })
    } catch (error) {
      console.warn('Copie impossible:', error)
    }
  }

  const handleOpenMessage = (message: any) => {
    setSelectedMessage(message)
    setShowMessageModal(true)

    try {
      const messageId = String(message?.id ?? '').trim()
      const recipientId = String(message?.recipient_id ?? '').trim()
      const isRead = Boolean(message?.is_read)

      if (messageId && recipientId && recipientId === String(user?.id ?? '').trim() && !isRead) {
        void (async () => {
          await markAsRead(messageId)
          await refreshMessages()
        })()
      }
    } catch {
      // ignore
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(String(dateString ?? ''))
    if (Number.isNaN(date.getTime())) return ''

    const now = new Date()
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    if (sameDay) {
      return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()

    if (isYesterday) {
      return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }

    return date.toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const handleExportMessages = () => {
    const csvContent = [
      ['ID', 'De', 'À', 'Sujet', 'Contenu', 'Date', 'Priorité', 'Catégorie', 'Statut', 'Lu'],
      ...uniqueFilteredMessages.map(msg => [
        msg.id,
        msg.sender_id === user?.id ? 'Vous (Admin)' : 'Utilisateur',
        msg.recipient_id === user?.id ? 'Vous (Admin)' : 'Utilisateur',
        msg.subject,
        msg.content,
        formatDate(msg.created_at),
        msg.priority,
        msg.category,
        msg.status,
        msg.is_read ? 'Oui' : 'Non'
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Messages-Admin-${new Date().toISOString().split('T')[0]}.csv`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getFilteredMessagesByType = () => {
    if (messageTypeFilter === 'received') return receivedMessages
    if (messageTypeFilter === 'sent') return sentMessages
    return messages
  }

  const filteredMessages = getFilteredMessagesByType()
    .filter(msg => {
      const matchesSearch = searchTerm === '' || 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' || msg.category === categoryFilter
      const matchesPriority = priorityFilter === 'all' || msg.priority === priorityFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'unread' && !msg.is_read) ||
        (statusFilter === 'read' && msg.is_read) ||
        msg.status === statusFilter
      
      return matchesSearch && matchesCategory && matchesPriority && matchesStatus
    })

  const uniqueFilteredMessages = (() => {
    const seen = new Set<string>()
    const next: any[] = []
    for (const msg of filteredMessages) {
      const id = String((msg as any)?.id ?? '').trim()
      if (!id) continue
      if (seen.has(id)) continue
      seen.add(id)
      next.push(msg)
    }
    return next
  })()

  return (
    <div className="space-y-6">
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Synchronisation...</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="internal">Messagerie interne</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="internal">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="w-6 h-6 text-purple-600" />
                  <span className="text-purple-800">Messagerie Interne - Administration</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white animate-pulse">
                      {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewMessageModal(true)}
                    className="border-purple-300 text-purple-700 hover:bg-purple-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportMessages}
                    className="border-purple-300 text-purple-700 hover:bg-purple-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="text-purple-700">
                Gérez la messagerie interne de la plateforme - Synchronisé en temps réel
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-900">{messages.length}</div>
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-green-600 mt-2">Tous les messages</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Reçus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-900">{receivedMessages.length}</div>
                  <Bell className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 mt-2">Messages reçus</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-700">Envoyés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-orange-900">{sentMessages.length}</div>
                  <Send className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-xs text-orange-600 mt-2">Messages envoyés</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-700">Non Lus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-red-900">{unreadCount}</div>
                  <Bell className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-xs text-red-600 mt-2">En attente</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-purple-900">{allUsers.length}</div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-xs text-purple-600 mt-2">Total utilisateurs</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filtres et Recherche</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshMessages}
                    className="border-purple-300 text-purple-700 hover:bg-purple-200"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="border-purple-300 text-purple-700 hover:bg-purple-200"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Tout marquer comme lu
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
                  <div className="relative">
                    <Label className="text-sm font-medium mb-2 block">Recherche</Label>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="🔍 Rechercher..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Type</Label>
                    <Select value={messageTypeFilter} onValueChange={(value: any) => setMessageTypeFilter(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="received">Reçus</SelectItem>
                        <SelectItem value="sent">Envoyés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Catégorie</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="technical">Technique</SelectItem>
                        <SelectItem value="billing">Facturation</SelectItem>
                        <SelectItem value="general">Général</SelectItem>
                        <SelectItem value="account">Compte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Priorité</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="low">Basse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Statut</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="unread">Non lu</SelectItem>
                        <SelectItem value="read">Lu</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-sm text-gray-600">{uniqueFilteredMessages.length} message(s) trouvé(s)</div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des messages */}
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Gérez tous les messages de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                  <p className="text-gray-500 mt-2">Chargement...</p>
                </div>
              ) : uniqueFilteredMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun message trouvé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uniqueFilteredMessages.map((message) => (
                    <Card
                      key={message.id}
                      className={`hover:shadow-md transition-shadow ${
                        !message.is_read && message.recipient_id === user?.id
                          ? 'border-l-4 border-l-purple-500 bg-purple-50'
                          : ''
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  message.priority === 'urgent'
                                    ? 'bg-red-500 animate-pulse'
                                    : message.priority === 'high'
                                      ? 'bg-red-500'
                                      : message.priority === 'normal'
                                        ? 'bg-yellow-500'
                                        : 'bg-green-500'
                                }`}
                              ></div>
                              {Boolean((message as any).is_important ?? (message as any).isImportant) && (
                                <Star className="w-4 h-4 text-yellow-500" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {message.category}
                              </Badge>
                              <Badge
                                variant={message.sender_id === user?.id ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {message.sender_id === user?.id ? 'Envoyé' : 'Reçu'}
                              </Badge>
                              {normalizeMessageAttachments((message as any).attachments).length > 0 && (
                                <span className="inline-flex items-center" title="Pièce(s) jointe(s)">
                                  <Paperclip className="w-4 h-4 text-gray-400" />
                                </span>
                              )}
                              {!message.is_read && message.recipient_id === user?.id && (
                                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                                  Non lu
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-purple-300 text-purple-700 hover:bg-purple-200"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenEdit(message)}
                                  disabled={message.sender_id !== user?.id}
                                >
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedMessage(message)
                                    setShowReplyModal(true)
                                  }}
                                  disabled={message.sender_id === user?.id}
                                >
                                  Répondre
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleImportant(message.id, !Boolean(message.is_important))}>
                                  {message.is_important ? 'Retirer important' : 'Marquer important'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => archiveMessage(message.id)}>Archiver</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCopyContent(message)}>Copier le contenu</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedMessage(message)
                                  void handleDelete()
                                }}>
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenMessage(message)}
                              className="border-purple-300 text-purple-700 hover:bg-purple-200"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ouvrir
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal Nouveau Message */}
          <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-600" />
                  Nouveau Message - Administration
                </DialogTitle>
                <DialogDescription>Envoyez un message aux utilisateurs de la plateforme</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipientType">Destinataires</Label>
                  <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="specific">Utilisateur spécifique</SelectItem>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="vendors">Tous les vendeurs</SelectItem>
                      <SelectItem value="clients">Tous les clients</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recipientType === 'specific' && (
                  <div>
                    <Label htmlFor="recipient">Sélectionner un utilisateur</Label>
                    <Select value={specificRecipientId} onValueChange={setSpecificRecipientId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choisir un utilisateur..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.email} ({u.role}) - {(u as any)?.name || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="messageSubject">Sujet *</Label>
                  <Input
                    id="messageSubject"
                    placeholder="Entrez le sujet..."
                    value={newMessageSubject}
                    onChange={(e) => setNewMessageSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="messageCategory">Catégorie</Label>
                    <Select value={newMessageCategory} onValueChange={setNewMessageCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Général</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="technical">Technique</SelectItem>
                        <SelectItem value="billing">Facturation</SelectItem>
                        <SelectItem value="account">Compte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="messagePriority">Priorité</Label>
                    <Select value={newMessagePriority} onValueChange={setNewMessagePriority}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="messageContent">Contenu *</Label>
                  <Textarea
                    id="messageContent"
                    placeholder="Entrez le contenu..."
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    className="mt-1 min-h-[150px]"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewMessageModal(false)} disabled={isSendingMessage}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !newMessageSubject.trim() || !newMessageContent.trim()}
                    className="bg-[#ff6600] hover:bg-[#e65c00]"
                  >
                    {isSendingMessage ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de modification de message */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier le message</DialogTitle>
                <DialogDescription>Modifiez votre message et synchronisez la mise à jour en base.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="editSubject">Sujet *</Label>
                  <Input
                    id="editSubject"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editCategory">Catégorie</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">Général</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="technical">Technique</SelectItem>
                        <SelectItem value="billing">Facturation</SelectItem>
                        <SelectItem value="account">Compte utilisateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="editPriority">Priorité</Label>
                    <Select value={editPriority} onValueChange={setEditPriority}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="normal">Normale</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="editContent">Contenu *</Label>
                  <Textarea
                    id="editContent"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="mt-1 min-h-[150px]"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={isUpdatingMessage}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleUpdateMessage}
                    disabled={isUpdatingMessage || !editSubject.trim() || !editContent.trim()}
                    className="bg-[#ff6600] hover:bg-[#e65c00]"
                  >
                    {isUpdatingMessage ? 'Sauvegarde...' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={showMessageModal}
            onOpenChange={(open: boolean) => {
              setShowMessageModal(open)
              if (!open) {
                setSelectedMessage(null)
                setParticipantInfo(null)
              }
            }}
          >
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Message
                </DialogTitle>
                <DialogDescription>
                  {participantInfo?.name
                    ? `Participant: ${participantInfo.name}`
                    : selectedMessage
                      ? `Participant: ${selectedMessage.sender_id === user?.id ? selectedMessage.recipient_id : selectedMessage.sender_id}`
                      : 'Détails du message'}
                </DialogDescription>
              </DialogHeader>

              {!selectedMessage ? (
                <div className="text-sm text-gray-500">Aucun message sélectionné.</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border bg-white p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-500">Sujet</div>
                        <div className="font-semibold text-gray-900 break-words">{selectedMessage.subject}</div>
                      </div>
                      <div className="text-xs text-gray-500 shrink-0">{formatDate(selectedMessage.created_at)}</div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(selectedMessage)}
                            disabled={selectedMessage.sender_id !== user?.id}
                          >
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setShowReplyModal(true)}
                            disabled={selectedMessage.sender_id === user?.id}
                          >
                            Répondre
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleImportant(selectedMessage.id, !Boolean(selectedMessage.is_important))}
                          >
                            {selectedMessage.is_important ? 'Retirer important' : 'Marquer important'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleArchive}>Archiver</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyContent(selectedMessage)}>Copier le contenu</DropdownMenuItem>
                          <DropdownMenuItem onClick={handleDelete}>Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-3 text-sm text-gray-500">Contenu</div>
                    <div className="mt-1 whitespace-pre-wrap text-gray-800 break-words">{selectedMessage.content}</div>

                    {normalizeMessageAttachments((selectedMessage as any).attachments).length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-gray-500">Pièces jointes</div>
                        <div className="mt-2 space-y-2">
                          {normalizeMessageAttachments((selectedMessage as any).attachments).map((url) => {
                            const lower = url.toLowerCase()
                            const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.includes('image/')
                            return (
                              <div key={url} className="rounded-md border bg-white p-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
                                >
                                  <Paperclip className="w-4 h-4" />
                                  <span>{url}</span>
                                </a>
                                {isImage && (
                                  <div className="mt-2">
                                    <img src={url} alt="Pièce jointe" className="max-h-64 w-auto rounded" />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedMessage.sender_id === user?.id ? 'Envoyé' : 'Reçu'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Priorité: {String(selectedMessage.priority ?? 'normal')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Statut: {String(selectedMessage.status ?? 'active')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Lu: {selectedMessage.is_read ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowMessageModal(false)
                      }}
                    >
                      Fermer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReplyModal(true)
                      }}
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    >
                      Répondre
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleArchive}
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      Archiver
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Répondre</DialogTitle>
                <DialogDescription>
                  {selectedMessage?.subject ? `Sujet: ${selectedMessage.subject}` : 'Envoyer une réponse au message sélectionné.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="replyContent">Votre réponse</Label>
                  <Textarea
                    id="replyContent"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="mt-1 min-h-[140px]"
                    placeholder="Tapez votre réponse..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReplyModal(false)} disabled={isReplying}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleReply}
                    disabled={isReplying || !replyContent.trim() || !selectedMessage}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isReplying ? 'Envoi...' : 'Envoyer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="chat">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                  <span className="text-indigo-800">Chat - Supervision</span>
                  <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                    {chatSessions.length} conversation(s)
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadChatSessions}
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-200"
                  disabled={isChatLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isChatLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Supervisez les conversations client ↔ vendeur. Vous pouvez modérer les messages.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
                <CardDescription>Dernières conversations actives</CardDescription>
              </CardHeader>
              <CardContent>
                {isChatLoading ? (
                  <div className="text-center py-6">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                    <p className="text-gray-500 mt-2">Chargement...</p>
                  </div>
                ) : chatSessions.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Aucune conversation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatSessions.map((session) => {
                      const isSelected = selectedChatId === session.id
                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => {
                            setSelectedChatId(session.id)
                            void loadChatMessages(session.id)
                          }}
                          className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                            isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 line-clamp-1">
                              {session.participant1?.name} ↔ {session.participant2?.name}
                            </div>
                            {!session.isActive && (
                              <Badge variant="secondary" className="text-xs">
                                Inactif
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {session.lastMessageSenderName ? `${session.lastMessageSenderName}: ` : ''}
                            {session.lastMessagePreview || '—'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {session.lastMessageCreatedAt
                              ? formatDate(session.lastMessageCreatedAt)
                              : session.lastMessageAt
                                ? formatDate(session.lastMessageAt)
                                : formatDate(session.createdAt)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Messages</span>
                  {selectedChatId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadChatMessages(selectedChatId)}
                      disabled={isChatMessagesLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isChatMessagesLoading ? 'animate-spin' : ''}`} />
                      Rafraîchir
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedChatId ? 'Historique de la conversation sélectionnée.' : 'Sélectionnez une conversation.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedChatId ? (
                  <div className="text-center py-8 text-gray-500">Aucune conversation sélectionnée</div>
                ) : isChatMessagesLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                    <p className="text-gray-500 mt-2">Chargement...</p>
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Aucun message</div>
                ) : (
                  <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {msg.senderName}
                              {msg.senderRole ? (
                                <span className="text-xs text-gray-500"> ({msg.senderRole})</span>
                              ) : null}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{formatDate(msg.createdAt)}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-amber-300 text-amber-800 hover:bg-amber-50"
                              onClick={() => openModerationModal(msg.chatId, msg.senderId, msg.senderName)}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Sanction
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => handleModerateSoftDeleteMessage(msg.chatId, msg.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Soft
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-700 hover:bg-red-50"
                              onClick={() => handleModerateHardDeleteMessage(msg.chatId, msg.id)}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Hard
                            </Button>
                          </div>
                        </div>

                        {(() => {
                          const readable = getReadableChatContent(msg.content)
                          if (readable.kind === 'attachment') {
                            const a = readable.attachment
                            if (a.kind === 'image') {
                              return (
                                <div className="mt-3">
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{readable.text}</div>
                                  <div className="mt-3">
                                    <a href={a.url} target="_blank" rel="noreferrer" className="inline-block" title="Ouvrir l'image">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={a.url}
                                        alt={a.name || 'Image'}
                                        className="max-h-80 max-w-full rounded-lg border bg-white object-contain"
                                        loading="lazy"
                                      />
                                    </a>
                                  </div>
                                </div>
                              )
                            }

                            if (a.kind === 'audio' || String(a.mime ?? '').toLowerCase().startsWith('audio/')) {
                              return (
                                <div className="mt-3">
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{readable.text}</div>
                                  <div className="mt-3">
                                    <audio controls src={a.url} className="w-full" />
                                  </div>
                                </div>
                              )
                            }

                            if (a.kind === 'video' || String(a.mime ?? '').toLowerCase().startsWith('video/')) {
                              return (
                                <div className="mt-3">
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">{readable.text}</div>
                                  <div className="mt-3">
                                    <video controls src={a.url} className="w-full max-h-80 rounded-lg bg-black/5" />
                                  </div>
                                </div>
                              )
                            }

                            return (
                              <div className="mt-3">
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">{readable.text}</div>
                                <div className="mt-3">
                                  <a
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-indigo-600 underline"
                                    title="Ouvrir le fichier"
                                  >
                                    {String(a.name ?? '').trim() || 'Fichier'}
                                  </a>
                                </div>
                              </div>
                            )
                          }

                          if (readable.kind !== 'product' || !readable.product) {
                            return <div className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{readable.text}</div>
                          }

                          const product = readable.product as any
                          const name = String(product?.name ?? '').trim() || 'Produit'
                          const price = product?.price
                          const currency = String(product?.currency ?? 'XOF')
                          const images = Array.isArray(product?.images) ? product.images : []
                          const imageUrl = typeof images[0] === 'string' ? images[0] : (typeof product?.image === 'string' ? product.image : '')

                          return (
                            <div className="mt-3">
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">{readable.text}</div>
                              <div className="mt-3 border rounded-lg bg-gray-50 p-3 relative">
                                <div className="absolute top-2 right-2 flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const pid = String(product?.id ?? '').trim()
                                      if (!pid) return
                                      void openProductInfo(pid, product)
                                    }}
                                    title="Informations"
                                    className="h-8 w-8 p-0 bg-white"
                                  >
                                    <Info className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addProductToCart(product)}
                                    title="Ajouter au panier"
                                    className="h-8 w-8 p-0 bg-white"
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                  </Button>
                                </div>

                                <div className="flex items-start gap-3 pr-20">
                                  <div className="w-16 h-16 rounded-md bg-white border overflow-hidden flex items-center justify-center">
                                    {imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xs text-gray-400">Image</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>
                                    {price != null && (
                                      <div className="text-sm text-gray-600 mt-1">
                                        {Number(price)} {currency}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })()}

                        {msg.messageType && msg.messageType !== 'text' && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {msg.messageType}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedChatId && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => chatFileInputRef.current?.click()}
                      disabled={isChatMessagesLoading || isSendingChatReply || isRecordingChatAudio}
                      className="h-9 w-9 p-0"
                      title="Ajouter un fichier"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChatEmojiPicker((v) => !v)}
                      disabled={isChatMessagesLoading || isSendingChatReply || isRecordingChatAudio}
                      className="h-9 w-9 p-0"
                      title="Emojis"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        void startChatRecording()
                      }}
                      disabled={isChatMessagesLoading || isSendingChatReply}
                      className="h-9 w-9 p-0"
                      title="Enregistrer un audio"
                    >
                      <Mic className="w-4 h-4" />
                    </Button>

                    {isRecordingChatAudio ? (
                      <div className="flex-1 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-medium text-orange-700">REC</span>
                        <span className="text-sm text-orange-700">{formatRecordingTime(chatRecordingTime)}</span>
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={toggleChatRecordingPause}
                            className="h-8 w-8 p-0"
                            title={isChatRecordingPaused ? 'Reprendre' : 'Pause'}
                          >
                            {isChatRecordingPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={stopChatRecording}
                            className="h-8 w-8 p-0"
                            title="Stop"
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                    <Input
                      value={chatReplyInput}
                      onChange={(e) => setChatReplyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleSendChatReply()
                        }
                      }}
                      placeholder="Répondre en tant que Boutique..."
                      disabled={isChatMessagesLoading || isSendingChatReply}
                    />
                    )}
                    <Button
                      onClick={() => {
                        void handleSendChatReply()
                      }}
                      disabled={isChatMessagesLoading || isSendingChatReply || !chatReplyInput.trim() || isRecordingChatAudio}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Send className={`w-4 h-4 mr-2 ${isSendingChatReply ? 'animate-pulse' : ''}`} />
                      Envoyer
                    </Button>
                  </div>
                )}

                {selectedChatId && showChatEmojiPicker && !isRecordingChatAudio ? (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="grid grid-cols-10 gap-2">
                      {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '😊', '😉', '😍', '😘', '😎', '🤩', '🥳', '😡', '😭'].map(
                        (emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setChatReplyInput((prev) => prev + emoji)
                              setShowChatEmojiPicker(false)
                            }}
                            className="w-8 h-8 text-xl hover:bg-gray-100 rounded"
                          >
                            {emoji}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ) : null}

                <input
                  ref={chatFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    void sendChatAttachment(file)
                    e.target.value = ''
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showModerationModal} onOpenChange={setShowModerationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modération utilisateur</DialogTitle>
            <DialogDescription>
              Appliquer une sanction à {moderationTargetUserName || 'l\'utilisateur sélectionné'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={moderationAction} onValueChange={(v: any) => setModerationAction(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warn">Avertissement</SelectItem>
                  <SelectItem value="mute">Mute (temporaire)</SelectItem>
                  <SelectItem value="ban">Ban chat (définitif)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {moderationAction === 'mute' && (
              <div>
                <Label>Durée du mute (heures)</Label>
                <Input
                  type="number"
                  value={moderationMuteHours}
                  onChange={(e) => setModerationMuteHours(e.target.value)}
                  className="mt-1"
                  min={1}
                />
              </div>
            )}

            {moderationAction === 'ban' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium">Ban définitif</div>
                    <div className="text-xs text-gray-500">Si activé, le ban n'a pas de durée.</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setModerationBanIsPermanent((v) => !v)}>
                    {moderationBanIsPermanent ? 'Oui' : 'Non'}
                  </Button>
                </div>

                {!moderationBanIsPermanent && (
                  <div>
                    <Label>Durée du ban (heures)</Label>
                    <Input
                      type="number"
                      value={moderationBanHours}
                      onChange={(e) => setModerationBanHours(e.target.value)}
                      className="mt-1"
                      min={1}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Raison / Message</Label>
              <Textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                className="mt-1 min-h-[120px]"
                placeholder="Explique la raison (visible côté Super Admin; et optionnellement injectée dans le chat pour les avertissements)."
              />
            </div>

            {moderationAction === 'warn' && (
              <div className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <div className="text-sm font-medium">Message système dans le chat</div>
                  <div className="text-xs text-gray-500">
                    Ajoute un message système visible par le client/vendeur.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAlsoPostSystemWarning((v) => !v)}
                >
                  {alsoPostSystemWarning ? 'Oui' : 'Non'}
                </Button>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModerationModal(false)} disabled={isModerationSubmitting}>
                Annuler
              </Button>
              <Button onClick={submitModerationAction} disabled={isModerationSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
                {isModerationSubmitting ? 'Traitement...' : 'Appliquer'}
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Historique</div>
                  <div className="text-xs text-gray-500">Sanctions et avertissements enregistrés pour cet utilisateur.</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moderationTargetUserId && loadModerationHistory(moderationTargetUserId)}
                  disabled={isModerationHistoryLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isModerationHistoryLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>

              {isModerationHistoryLoading ? (
                <div className="text-sm text-gray-500 mt-3">Chargement...</div>
              ) : (
                <div className="mt-3 space-y-4">
                  <div>
                    <div className="text-sm font-medium">Sanctions</div>
                    {moderationHistorySanctions.length === 0 ? (
                      <div className="text-xs text-gray-500 mt-1">Aucune sanction</div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {moderationHistorySanctions.map((s) => {
                          const active = !s.revoked_at && (!s.expires_at || new Date(s.expires_at).getTime() > Date.now())
                          return (
                            <div key={s.id} className="flex items-start justify-between gap-3 border rounded-lg p-3">
                              <div className="min-w-0">
                                <div className="text-xs text-gray-500">{formatDate(s.created_at)}</div>
                                <div className="text-sm font-medium">
                                  {s.sanction_type.toUpperCase()} {active ? '(active)' : '(inactive)'}
                                </div>
                                <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                                  {s.reason || '—'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Expire: {s.expires_at ? new Date(s.expires_at).toLocaleString('fr-FR') : 'Jamais'}
                                </div>
                              </div>
                              {active ? (
                                <Button variant="outline" size="sm" onClick={() => revokeSanction(s.id)}>
                                  Révoquer
                                </Button>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-medium">Avertissements</div>
                    {moderationHistoryWarnings.length === 0 ? (
                      <div className="text-xs text-gray-500 mt-1">Aucun avertissement</div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {moderationHistoryWarnings.map((w) => (
                          <div key={w.id} className="border rounded-lg p-3">
                            <div className="text-xs text-gray-500">{formatDate(w.created_at)}</div>
                            <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{w.warning_message}</div>
                            {w.chat_id ? (
                              <div className="text-xs text-gray-400 mt-1">Chat: {w.chat_id}</div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isProductInfoOpen} onOpenChange={setIsProductInfoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Informations produit</DialogTitle>
            <DialogDescription>Détails réels (livraison, promotions, conditions)</DialogDescription>
          </DialogHeader>

          {productInfoLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">Chargement...</div>
          ) : productInfoError ? (
            <div className="py-6 text-sm text-red-600">{productInfoError}</div>
          ) : productInfoData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                  {String(productInfoData?.media?.main_image ?? '').trim() ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={String(productInfoData?.media?.main_image)}
                      alt={String(productInfoData?.name ?? 'Produit')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Image</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{String(productInfoData?.name ?? 'Produit')}</div>
                  <div className="text-sm text-gray-600">
                    {typeof productInfoData?.sale_price === 'number' && productInfoData.sale_price > 0 ? (
                      <span>
                        <span className="font-semibold text-indigo-700">{formatMoney(productInfoData.sale_price)}</span>
                        {typeof productInfoData?.price === 'number' && productInfoData.price > 0 ? (
                          <span className="ml-2 text-gray-500 line-through">{formatMoney(productInfoData.price)}</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="font-semibold text-indigo-700">{formatMoney(Number(productInfoData?.price ?? 0) || 0)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="font-medium text-gray-900">Livraison</div>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                      {String(productInfoData?.shipping?.delivery_label ?? '').trim() ? (
                        <div>
                          <span className="text-gray-500">Résumé:</span> {String(productInfoData.shipping.delivery_label)}
                        </div>
                      ) : null}
                      <div>
                        <span className="text-gray-500">Gratuite:</span>{' '}
                        {productInfoData?.shipping?.free_shipping ? 'Oui' : 'Non'}
                      </div>
                      <div>
                        <span className="text-gray-500">Coût:</span>{' '}
                        {productInfoData?.shipping?.free_shipping
                          ? formatMoney(0)
                          : (productInfoData?.shipping?.shipping_cost ?? null) == null
                            ? '—'
                            : formatMoney(Number(productInfoData.shipping.shipping_cost) || 0)}
                      </div>
                      {String(productInfoData?.shipping?.delivery_delay ?? '').trim() ? (
                        <div>
                          <span className="text-gray-500">Délai:</span> {String(productInfoData.shipping.delivery_delay)}
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="font-medium text-gray-900">Promotions</div>
                    <div className="mt-2 text-sm text-gray-700 space-y-1">
                      {productInfoData?.promotion_summary?.is_active && String(productInfoData?.promotion_summary?.summary ?? '').trim() ? (
                        <div>
                          <span className="text-gray-500">Résumé:</span> {String(productInfoData.promotion_summary.summary)}
                        </div>
                      ) : null}

                      {productInfoData?.promotion_settings ? (
                        <>
                          <div>
                            <span className="text-gray-500">Badge:</span>{' '}
                            {String(productInfoData?.promotion_settings?.featured_badge_text ?? '—')}
                          </div>
                          <div>
                            <span className="text-gray-500">Début:</span>{' '}
                            {String(productInfoData?.promotion_settings?.promotion_start_date ?? '—')}
                          </div>
                          <div>
                            <span className="text-gray-500">Fin:</span>{' '}
                            {String(productInfoData?.promotion_settings?.promotion_end_date ?? '—')}
                          </div>
                        </>
                      ) : productInfoData?.promotion_summary?.is_active ? null : (
                        <div className="text-gray-500">Aucune promotion active</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsProductInfoOpen(false)}>
              Fermer
            </Button>
            {productInfoData ? (
              <Button type="button" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => addProductToCart(productInfoData)}>
                Ajouter au panier
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Autres modals identiques à la version vendeur */}
    </div>
  )
}
