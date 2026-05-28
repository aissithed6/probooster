'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageCircle, MapPin, Truck, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface DeliveryChatReplacementProps {
  deliveryInfo: any
  onClose: () => void
  isOpen: boolean
}

type DeliveryChatMessageRow = {
  id: string
  sender_id: string
  content: string
  created_at: string
  message_type?: string | null
  reply_to_message_id?: string | null
  audio_url?: string | null
  audio_duration_ms?: number | null
}

type DeliveryChatReceiptRow = {
  message_id: string
  user_id: string
  delivered_at: string
  read_at: string | null
}

const EMOJI_CANDIDATES = ['😀', '😂', '😍', '🙏', '👍', '👎', '❤️', '🔥', '🎉', '😢', '😡', '✅', '❌', '📦', '📍', '🚚', '📞']

export const DeliveryChatReplacement: React.FC<DeliveryChatReplacementProps> = ({
  deliveryInfo,
  onClose,
  isOpen
}) => {
  const { toast } = useToast()

  const orderId = useMemo(() => {
    const direct = deliveryInfo?.orderId ?? deliveryInfo?.order_id ?? deliveryInfo?.orders?.id ?? ''
    return String(direct ?? '').trim()
  }, [deliveryInfo])

  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [accessToken, setAccessToken] = useState<string>('')

  const [deliveryConversationId, setDeliveryConversationId] = useState('')
  const [isOpeningDeliveryChat, setIsOpeningDeliveryChat] = useState(false)
  const [openDeliveryChatError, setOpenDeliveryChatError] = useState<string>('')
  const [deliveryMessages, setDeliveryMessages] = useState<
    Array<DeliveryChatMessageRow>
  >([])
  const [deliveryChatInput, setDeliveryChatInput] = useState('')

  const [receiptByMessageId, setReceiptByMessageId] = useState<Map<string, Array<DeliveryChatReceiptRow>>>(new Map())

  const [replyTo, setReplyTo] = useState<{ messageId: string; senderLabel: string; preview: string } | null>(null)

  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())

  const [isRecording, setIsRecording] = useState(false)
  const [recordingMs, setRecordingMs] = useState(0)
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)

  const [participants, setParticipants] = useState<Array<{ userId: string; displayName: string; role: string }>>([])

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)
  const hasPerformedInitialScrollRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaChunksRef = useRef<BlobPart[]>([])
  const recordingStartRef = useRef<number>(0)
  const recordingAccumulatedRef = useRef<number>(0)
  const recordingPausedRef = useRef<boolean>(false)
  const recordingIntervalRef = useRef<number | null>(null)

  // Si la livraison change, on réinitialise la conversation pour déclencher une ouverture instantanée.
  useEffect(() => {
    hasPerformedInitialScrollRef.current = false
    setDeliveryConversationId('')
    setOpenDeliveryChatError('')
    setDeliveryMessages([])
    setParticipants([])
    setReceiptByMessageId(new Map())
    setReplyTo(null)
    setIsSelectMode(false)
    setSelectedMessageIds(new Set())
  }, [orderId])

  /**
   * Formate une date pour l'affichage dans le chat.
   */
  const formatChatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Ouvrir automatiquement le chat de groupe dès que le composant est affiché.
  useEffect(() => {
    if (!isOpen) return
    if (!orderId) return
    if (deliveryConversationId) return
    if (isOpeningDeliveryChat) return

    void openDeliveryGroupChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, orderId, deliveryConversationId, isOpeningDeliveryChat])

  /**
   * Ouvre le chat livraison réel (conversation de groupe liée à orderId).
   * Le backend crée/récupère la conversation et garantit les participants (client/vendeur/livreur si défini).
   */
  const openDeliveryGroupChat = async () => {
    if (!orderId) {
      toast({
        title: 'Chat indisponible',
        description: "Cette livraison n'est pas liée à une commande valide.",
        variant: 'destructive'
      })
      return
    }

    setIsOpeningDeliveryChat(true)
    setOpenDeliveryChatError('')
    try {
      let token = accessToken
      if (!token) {
        const { data: sessionData } = await supabase.auth.getSession()
        token = String(sessionData.session?.access_token ?? '')
      }
      if (!token) throw new Error('Authentification requise.')

      const res = await fetch('/api/chat/delivery-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ orderId })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Impossible de démarrer le chat livraison.'))
      }

      const conversationId = String(json?.data?.conversationId ?? '').trim()
      if (!conversationId) {
        throw new Error('Conversation livraison introuvable.')
      }

      const serverParticipants = Array.isArray(json?.data?.participants) ? (json.data.participants as any[]) : []
      if (serverParticipants.length > 0) {
        setParticipants(
          serverParticipants
            .map((p) => ({
              userId: String(p?.userId ?? p?.user_id ?? ''),
              role: String(p?.role ?? p?.role_in_conversation ?? ''),
              displayName: String(p?.displayName ?? p?.display_name ?? '').trim()
            }))
            .filter((p) => Boolean(p.userId))
        )
      }

      hasPerformedInitialScrollRef.current = false
      setDeliveryConversationId(conversationId)
    } catch (error) {
      console.error('Erreur openDeliveryGroupChat:', error)
      setOpenDeliveryChatError(error instanceof Error ? error.message : 'Impossible de démarrer le chat livraison.')
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de démarrer le chat livraison.',
        variant: 'destructive'
      })
    } finally {
      setIsOpeningDeliveryChat(false)
    }
  }

  /**
   * Charge les participants de la conversation et résout leurs noms.
   */
  const loadParticipants = async (conversationId: string) => {
    const { data: participantRows, error: participantError } = await supabase
      .from('delivery_chat_participants')
      .select('user_id, role_in_conversation')
      .eq('conversation_id', conversationId)

    if (participantError) {
      throw participantError
    }

    const rows = (participantRows ?? []) as Array<{ user_id: string; role_in_conversation: string }>
    const ids = Array.from(new Set(rows.map((r) => String(r.user_id)).filter(Boolean)))

    let profileById = new Map<string, { first_name: string | null; last_name: string | null; short_code: string | null }>()
    let userById = new Map<string, { email: string | null }>()

    if (ids.length > 0) {
      const [profilesResult, usersResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('user_id, first_name, last_name, short_code')
          .in('user_id', ids),
        supabase
          .from('users')
          .select('id, email')
          .in('id', ids)
      ])

      profileById = new Map(
        (profilesResult.data ?? []).map((p: any) => [
          String(p.user_id),
          {
            first_name: p.first_name ?? null,
            last_name: p.last_name ?? null,
            short_code: p.short_code ?? null
          }
        ])
      )

      userById = new Map((usersResult.data ?? []).map((u: any) => [String(u.id), { email: u.email ?? null }]))
    }

    const roleLabel = (role: string) => {
      const r = String(role ?? '').toLowerCase()
      if (r === 'vendor' || r === 'seller') return 'Vendeur'
      if (r === 'client' || r === 'customer') return 'Client'
      if (r === 'driver' || r === 'livreur') return 'Livreur'
      if (r === 'super_admin') return 'Admin'
      return 'Utilisateur'
    }

    setParticipants(
      rows.map((r) => {
        const userId = String(r.user_id)
        const profile = profileById.get(userId)
        const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
        const shortCode = String(profile?.short_code ?? '').trim()
        const email = String(userById.get(userId)?.email ?? '').trim()
        const emailLabel = email.includes('@') ? email.split('@')[0] : ''
        const fallback = `${roleLabel(r.role_in_conversation)} ${userId.slice(0, 6)}`
        const displayName =
          fullName.length > 0
            ? fullName
            : shortCode.length > 0
              ? shortCode
              : emailLabel.length > 0
                ? emailLabel
                : fallback

        return { userId, role: String(r.role_in_conversation), displayName }
      })
    )
  }

  /**
   * Charge les messages de la conversation livraison.
   */
  const loadDeliveryMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('delivery_chat_messages')
      .select('id, sender_id, content, created_at, message_type, reply_to_message_id, audio_url, audio_duration_ms')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    setDeliveryMessages((data ?? []) as any)
  }

  /**
   * Charge les receipts (delivered/read) des messages.
   */
  const loadReceipts = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('delivery_chat_message_receipts')
      .select('message_id, user_id, delivered_at, read_at')
      .eq('conversation_id', conversationId)

    if (error) throw error

    const map = new Map<string, Array<DeliveryChatReceiptRow>>()
    ;(data ?? []).forEach((r: any) => {
      const messageId = String(r.message_id)
      const next: DeliveryChatReceiptRow = {
        message_id: messageId,
        user_id: String(r.user_id),
        delivered_at: String(r.delivered_at),
        read_at: r.read_at ? String(r.read_at) : null
      }
      const arr = map.get(messageId) ?? []
      arr.push(next)
      map.set(messageId, arr)
    })

    setReceiptByMessageId(map)
  }

  /**
   * Marque en "lu" les messages reçus (receipt read_at) pour l'utilisateur courant.
   */
  const markMessagesAsRead = async (conversationId: string, userId: string, messages: Array<DeliveryChatMessageRow>) => {
    if (!conversationId || !userId) return
    const ids = messages
      .filter((m) => m.sender_id !== userId)
      .map((m) => m.id)

    if (ids.length === 0) return

    const { error } = await supabase
      .from('delivery_chat_message_receipts')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .in('message_id', ids)
      .is('read_at', null)

    if (error) {
      // best-effort
      console.error('Erreur markMessagesAsRead:', error)
    }
  }

  /**
   * Envoie un message dans la conversation livraison.
   */
  const sendDeliveryMessage = async () => {
    const conversationId = deliveryConversationId
    const content = deliveryChatInput.trim()
    if (!conversationId || !content) return

    const { data: sessionData } = await supabase.auth.getSession()
    const senderId = sessionData.session?.user?.id

    if (!senderId) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour envoyer un message.',
        variant: 'destructive'
      })
      return
    }

    const { error } = await supabase
      .from('delivery_chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: 'text',
        reply_to_message_id: replyTo?.messageId ?? null
      })

    if (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message.",
        variant: 'destructive'
      })
      return
    }

    setDeliveryChatInput('')
    setReplyTo(null)
  }

  /**
   * Démarre/stoppe l'enregistrement vocal et envoie le message (upload + insert DB).
   */
  const toggleVoiceRecording = async () => {
    try {
      const conversationId = deliveryConversationId
      if (!conversationId) return

      const { data: sessionData } = await supabase.auth.getSession()
      const senderId = sessionData.session?.user?.id
      if (!senderId) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté pour envoyer un message vocal.',
          variant: 'destructive'
        })
        return
      }

      if (!isRecording) {
        if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
          toast({
            title: 'Micro indisponible',
            description: 'Votre navigateur ne supporte pas l’enregistrement audio.',
            variant: 'destructive'
          })
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        mediaChunksRef.current = []
        recordingStartRef.current = Date.now()
        recordingAccumulatedRef.current = 0
        setRecordingMs(0)
        setIsRecordingPaused(false)
        recordingPausedRef.current = false

        if (recordingIntervalRef.current) {
          window.clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }

        recordingIntervalRef.current = window.setInterval(() => {
          if (recordingPausedRef.current) return
          const elapsed = Math.max(0, recordingAccumulatedRef.current + (Date.now() - recordingStartRef.current))
          setRecordingMs(elapsed)
        }, 250)

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            mediaChunksRef.current.push(e.data)
          }
        }

        recorder.onstop = async () => {
          try {
            stream.getTracks().forEach((t) => t.stop())

            if (recordingIntervalRef.current) {
              window.clearInterval(recordingIntervalRef.current)
              recordingIntervalRef.current = null
            }

            const elapsed = Math.max(
              0,
              recordingAccumulatedRef.current + (recordingPausedRef.current ? 0 : (Date.now() - recordingStartRef.current))
            )
            const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
            if (blob.size === 0) return

            const fileExt = recorder.mimeType?.includes('ogg') ? 'ogg' : 'webm'
            const path = `${senderId}/${conversationId}/${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase
              .storage
              .from('chat-attachments')
              .upload(path, blob, { contentType: blob.type, upsert: false })

            if (uploadError) {
              throw uploadError
            }

            const { data: publicData } = supabase.storage.from('chat-attachments').getPublicUrl(path)
            const publicUrl = String(publicData?.publicUrl ?? '').trim()

            const { error: insertError } = await supabase
              .from('delivery_chat_messages')
              .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: '',
                message_type: 'voice',
                audio_url: publicUrl,
                audio_duration_ms: elapsed,
                reply_to_message_id: replyTo?.messageId ?? null
              })

            if (insertError) throw insertError

            setReplyTo(null)
          } catch (e) {
            console.error('Erreur envoi vocal:', e)
            toast({
              title: 'Erreur',
              description: 'Impossible d’envoyer le message vocal.',
              variant: 'destructive'
            })
          }
        }

        recorder.start()
        setIsRecording(true)
        return
      }

      mediaRecorderRef.current?.stop()
      setIsRecording(false)
      setIsRecordingPaused(false)
      recordingPausedRef.current = false
    } catch (e) {
      console.error('toggleVoiceRecording error:', e)
      setIsRecording(false)
      setIsRecordingPaused(false)
      recordingPausedRef.current = false
    }
  }

  /**
   * Met en pause / reprend l'enregistrement vocal.
   */
  const toggleVoicePause = () => {
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
      console.error('toggleVoicePause error:', e)
    }
  }

  // Sécurité: si l'utilisateur ferme le chat pendant un enregistrement, on stoppe proprement.
  useEffect(() => {
    if (isOpen) return

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    } catch {
      // ignore
    }

    if (recordingIntervalRef.current) {
      window.clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }

    setIsRecording(false)
    setRecordingMs(0)
    setIsRecordingPaused(false)
    recordingPausedRef.current = false
  }, [isOpen])

  // Résoudre l'utilisateur courant.
  useEffect(() => {
    let mounted = true
    void supabase.auth.getSession().then(({ data }) => {
      const id = data.session?.user?.id ?? ''
      const token = data.session?.access_token ?? ''
      if (!mounted) return
      setCurrentUserId(String(id))
      setAccessToken(String(token))
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setCurrentUserId(String(session?.user?.id ?? ''))
      setAccessToken(String(session?.access_token ?? ''))
    })

    return () => {
      mounted = false
      try {
        subscription?.subscription?.unsubscribe()
      } catch {
        // ignore
      }
    }
  }, [])

  // Charger et s'abonner aux messages de la conversation livraison
  useEffect(() => {
    if (!deliveryConversationId) return

    hasPerformedInitialScrollRef.current = false

    let mounted = true
    void loadDeliveryMessages(deliveryConversationId).catch((e) => {
      console.error('Erreur loadDeliveryMessages:', e)
      if (mounted) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les messages du chat livraison.',
          variant: 'destructive'
        })
      }
    })

    void loadReceipts(deliveryConversationId).catch((e) => {
      console.error('Erreur loadReceipts:', e)
    })

    void loadParticipants(deliveryConversationId).catch(() => {
      if (mounted) setParticipants([])
    })

    const channel = supabase
      .channel(`delivery_chat_messages_${deliveryConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_chat_messages',
          filter: `conversation_id=eq.${deliveryConversationId}`
        },
        (payload) => {
          const row = payload.new as any
          setDeliveryMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [
              ...prev,
              {
                id: row.id,
                sender_id: row.sender_id,
                content: row.content,
                created_at: row.created_at,
                message_type: row.message_type,
                reply_to_message_id: row.reply_to_message_id,
                audio_url: row.audio_url,
                audio_duration_ms: row.audio_duration_ms
              }
            ]
          })
        }
      )
      .subscribe()

    const receiptChannel = supabase
      .channel(`delivery_chat_receipts_${deliveryConversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_chat_message_receipts',
          filter: `conversation_id=eq.${deliveryConversationId}`
        },
        () => {
          void loadReceipts(deliveryConversationId).catch(() => null)
        }
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      supabase.removeChannel(receiptChannel)
    }
  }, [deliveryConversationId, toast])

  // Marquer les messages comme lus quand ils sont affichés.
  useEffect(() => {
    if (!isOpen) return
    if (!deliveryConversationId) return
    if (!currentUserId) return

    void markMessagesAsRead(deliveryConversationId, currentUserId, deliveryMessages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryMessages.length, isOpen, deliveryConversationId, currentUserId])

  // Scroll auto vers le dernier message.
  useEffect(() => {
    if (!isOpen) return
    const behavior: ScrollBehavior = hasPerformedInitialScrollRef.current ? 'smooth' : 'auto'
    scrollAnchorRef.current?.scrollIntoView({ behavior, block: 'end' })
    hasPerformedInitialScrollRef.current = true
  }, [deliveryMessages.length, isOpen, deliveryConversationId])

  const isDeliveryChatReady = Boolean(deliveryConversationId)

  const participantLine = useMemo(() => {
    if (participants.length === 0) return 'Participants: —'
    const names = participants
      .map((p) => (p.userId === currentUserId ? 'Vous' : p.displayName))
      .slice(0, 4)
    const suffix = participants.length > 4 ? ` +${participants.length - 4}` : ''
    return `Participants: ${names.join(', ')}${suffix}`
  }, [participants, currentUserId])

  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>()
    participants.forEach((p) => map.set(p.userId, p.displayName))
    return map
  }, [participants])

  const messageById = useMemo(() => {
    const map = new Map<string, DeliveryChatMessageRow>()
    deliveryMessages.forEach((m) => map.set(m.id, m))
    return map
  }, [deliveryMessages])

  /**
   * Exporte les messages sélectionnés au format TXT (style "export WhatsApp").
   */
  const exportSelectedAsTxt = () => {
    const ids = Array.from(selectedMessageIds)
    const rows = ids.map((id) => messageById.get(id)).filter(Boolean) as DeliveryChatMessageRow[]
    if (rows.length === 0) return

    const lines = rows.map((m) => {
      const sender = m.sender_id === currentUserId ? 'Vous' : (nameByUserId.get(m.sender_id) ?? m.sender_id.slice(0, 8))
      const time = new Date(m.created_at).toLocaleString()
      if (String(m.message_type ?? 'text').toLowerCase() === 'voice') {
        return `[${time}] ${sender}: [Message vocal] ${m.audio_url ?? ''}`.trim()
      }
      return `[${time}] ${sender}: ${m.content}`
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-livraison-${deliveryInfo?.trackingNumber ?? 'export'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Exporte les messages sélectionnés au format CSV.
   */
  const exportSelectedAsCsv = () => {
    const ids = Array.from(selectedMessageIds)
    const rows = ids.map((id) => messageById.get(id)).filter(Boolean) as DeliveryChatMessageRow[]
    if (rows.length === 0) return

    const escape = (v: string) => `"${String(v).replaceAll('"', '""')}"`
    const header = ['created_at', 'sender', 'message_type', 'content', 'audio_url'].map(escape).join(',')
    const lines = rows.map((m) => {
      const sender = m.sender_id === currentUserId ? 'Vous' : (nameByUserId.get(m.sender_id) ?? m.sender_id.slice(0, 8))
      const mt = String(m.message_type ?? 'text')
      return [
        escape(m.created_at),
        escape(sender),
        escape(mt),
        escape(m.content ?? ''),
        escape(m.audio_url ?? '')
      ].join(',')
    })

    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-livraison-${deliveryInfo?.trackingNumber ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Toggle (ajoute/retire) un message de la sélection multiple.
   */
  const toggleSelection = (id: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /**
   * Quitte le mode sélection et vide la sélection.
   */
  const clearSelection = () => {
    setSelectedMessageIds(new Set())
    setIsSelectMode(false)
  }

  /**
   * Formate une durée en millisecondes vers "m:ss".
   */
  const formatDuration = (ms?: number | null) => {
    const total = Math.max(0, Math.floor((ms ?? 0) / 1000))
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="flex max-h-[90vh] w-[min(960px,95vw)] flex-col overflow-hidden p-0 [&>button]:text-gray-600 [&>button:hover]:text-gray-900 dark:[&>button]:text-gray-200 dark:[&>button:hover]:text-white">
        <DialogHeader className="border-b border-gray-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#0b0f19]">
          <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Chat livraison</DialogTitle>
          <DialogDescription className="sr-only">
            Conversation de groupe liée à cette livraison.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
      {/* Informations de la livraison */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center space-x-3 mb-4">
          <Truck className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Commande #{deliveryInfo.trackingNumber}
            </h3>
            <p className="text-sm text-gray-600">
              Statut: {deliveryInfo.status}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span>{deliveryInfo.currentLocation}</span>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{deliveryInfo.driver?.name}</span>
          </div>
        </div>
      </div>

      {/* Vue chat livraison réel */}
      {isDeliveryChatReady && (
            <div className="flex-1 p-6 flex flex-col space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-gray-700 font-medium">
                Conversation livraison (commande #{deliveryInfo.trackingNumber})
              </div>
              <div className="text-xs text-gray-500">{participantLine}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={
                  (isSelectMode
                    ? 'border-[#ff6600] bg-[#ff6600] text-white hover:bg-[#e55a00] hover:text-white'
                    : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50') +
                  ' dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10'
                }
                onClick={() => {
                  if (isSelectMode) {
                    clearSelection()
                  } else {
                    setIsSelectMode(true)
                  }
                }}
              >
                {isSelectMode ? 'Annuler sélection' : 'Sélectionner'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
                onClick={onClose}
              >
                Fermer
              </Button>
            </div>
          </div>

          {isSelectMode && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
              <div className="text-xs text-gray-600">Sélection: {selectedMessageIds.size}</div>
              <Button type="button" size="sm" variant="outline" disabled={selectedMessageIds.size === 0} onClick={exportSelectedAsTxt}>
                Export TXT
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={selectedMessageIds.size === 0} onClick={exportSelectedAsCsv}>
                Export CSV
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={selectedMessageIds.size === 0}
                onClick={() => {
                  const ids = Array.from(selectedMessageIds)
                  const rows = ids.map((id) => messageById.get(id)).filter(Boolean) as DeliveryChatMessageRow[]
                  const text = rows
                    .map((m) => {
                      const sender = m.sender_id === currentUserId ? 'Vous' : (nameByUserId.get(m.sender_id) ?? m.sender_id.slice(0, 8))
                      const time = new Date(m.created_at).toLocaleString()
                      return `[${time}] ${sender}: ${m.content}`
                    })
                    .join('\n')
                  void navigator.clipboard.writeText(text)
                  toast({ title: 'Copié', description: 'Messages copiés dans le presse-papiers.' })
                }}
              >
                Copier
              </Button>
            </div>
          )}

          <div className="border rounded-lg bg-white flex-1 overflow-hidden">
                <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {deliveryMessages.length === 0 ? (
                  <div className="text-sm text-gray-500">Aucun message</div>
                ) : (
                  deliveryMessages.map((m) => {
                    const isSystem = String(m.message_type ?? 'text').toLowerCase() === 'system'
                    const isMine = !isSystem && currentUserId && m.sender_id === currentUserId
                    const senderName = m.sender_id === currentUserId ? 'Vous' : (nameByUserId.get(m.sender_id) ?? m.sender_id.slice(0, 8))
                    const time = formatChatTime(m.created_at)

                    const receiptRows = receiptByMessageId.get(m.id) ?? []
                    const deliveredCount = receiptRows.length
                    const readCount = receiptRows.filter((r) => Boolean(r.read_at)).length

                    const recipientsTotal = Math.max(0, participants.length - 1)
                    const showDelivered = deliveredCount > 0
                    const showRead = readCount > 0
                    const tickLabel = !isMine
                      ? ''
                      : showRead
                        ? `✓✓✓ Vu par ${readCount}`
                        : showDelivered
                          ? `✓✓ Reçu` + (recipientsTotal > 1 ? ` • ${deliveredCount}/${recipientsTotal}` : '')
                          : '✓ Envoyé'

                    const myReceipt = !isMine
                      ? receiptRows.find((r) => r.user_id === currentUserId) ?? null
                      : null

                    const isUnreadForMe = Boolean(!isMine && myReceipt && !myReceipt.read_at)

                    const replyTarget = m.reply_to_message_id ? messageById.get(String(m.reply_to_message_id)) : undefined

                    if (isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center py-1">
                          <div className="max-w-[85%] rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                            {m.content}
                          </div>
                        </div>
                      )
                    }

                    const bubble = (
                      <div
                        className={
                          `max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ` +
                          (isMine
                            ? 'bg-emerald-600 text-white rounded-br-sm'
                            : (isUnreadForMe ? 'bg-yellow-50 text-gray-900 rounded-bl-sm border border-yellow-200' : 'bg-gray-100 text-gray-900 rounded-bl-sm'))
                        }
                      >
                        <div className={`text-[11px] ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                          {senderName}
                        </div>

                        {replyTarget && (
                          <div className={`mt-1 rounded-lg px-2 py-1 text-xs ${isMine ? 'bg-white/15' : 'bg-white'}`}>
                            <div className={`${isMine ? 'text-white/90' : 'text-gray-600'} font-medium`}>Réponse à</div>
                            <div className={`${isMine ? 'text-white/80' : 'text-gray-500'} line-clamp-2`}>
                              {String(replyTarget.message_type ?? 'text').toLowerCase() === 'voice'
                                ? '[Message vocal]'
                                : (replyTarget.content || '').slice(0, 120)}
                            </div>
                          </div>
                        )}

                        {String(m.message_type ?? 'text').toLowerCase() === 'voice' ? (
                          <div className="mt-2">
                            <audio controls preload="none" src={m.audio_url ?? undefined} className="w-full" />
                            <div className={`mt-1 text-[11px] ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                              {formatDuration(m.audio_duration_ms)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                        )}

                        <div className={`mt-1 flex items-center justify-end gap-2 text-[11px] ${isMine ? 'text-white/80' : 'text-gray-500'}`}>
                          <span>{time}</span>
                          {!isMine && isUnreadForMe && <span className="font-medium text-yellow-700">Non lu</span>}
                          {isMine && <span title={tickLabel}>{tickLabel}</span>}
                        </div>
                      </div>
                    )

                    return (
                      <ContextMenu key={m.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} cursor-pointer`}
                            onClick={() => {
                              if (isSelectMode) {
                                toggleSelection(m.id)
                              }
                            }}
                          >
                            {isSelectMode && (
                              <div className={`flex items-center ${isMine ? 'order-2 ml-2' : 'mr-2'}`}>
                                <input
                                  type="checkbox"
                                  checked={selectedMessageIds.has(m.id)}
                                  onChange={() => toggleSelection(m.id)}
                                />
                              </div>
                            )}
                            {bubble}
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem
                            onSelect={() => {
                              const preview = String(m.message_type ?? 'text').toLowerCase() === 'voice'
                                ? '[Message vocal]'
                                : (m.content || '').slice(0, 120)
                              setReplyTo({ messageId: m.id, senderLabel: senderName, preview })
                            }}
                          >
                            Répondre
                          </ContextMenuItem>
                          <ContextMenuItem
                            onSelect={() => {
                              const text = String(m.message_type ?? 'text').toLowerCase() === 'voice'
                                ? (m.audio_url ?? '')
                                : (m.content ?? '')
                              void navigator.clipboard.writeText(text)
                              toast({ title: 'Copié', description: 'Contenu copié.' })
                            }}
                          >
                            Copier
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    )
                  })
                )}
                <div ref={scrollAnchorRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              {replyTo && (
                <div className="mb-2 flex items-center justify-between rounded-lg border bg-white p-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-700">Réponse à {replyTo.senderLabel}</div>
                    <div className="text-xs text-gray-500 truncate">{replyTo.preview}</div>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                    Annuler
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline">😀</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-9 gap-2">
                      {EMOJI_CANDIDATES.map((e) => (
                        <button
                          key={e}
                          type="button"
                          className="rounded-md border bg-white p-1 text-base hover:bg-gray-50"
                          onClick={() => setDeliveryChatInput((prev) => `${prev}${e}`)}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Input
                  placeholder={isRecording ? 'Enregistrement en cours…' : 'Écrire un message…'}
                  value={deliveryChatInput}
                  disabled={isRecording}
                  onChange={(e) => setDeliveryChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void sendDeliveryMessage()
                    }
                  }}
                />

                {isRecording ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <span className="relative inline-flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                      </span>
                      <span className="font-semibold">REC</span>
                      <span className="font-mono">{formatDuration(recordingMs)}</span>
                      {isRecordingPaused ? (
                        <span className="ml-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] text-yellow-800">PAUSE</span>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={toggleVoicePause}
                      title={isRecordingPaused ? 'Reprendre' : 'Pause'}
                      className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
                    >
                      {isRecordingPaused ? 'Reprendre' : 'Pause'}
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => void toggleVoiceRecording()}
                      title="Stop"
                    >
                      Stop
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
                    onPointerDown={(e) => {
                      e.preventDefault()
                      void toggleVoiceRecording()
                    }}
                    title="Enregistrer un vocal"
                  >
                    Micro
                  </Button>
                )}

                <Button onClick={() => void sendDeliveryMessage()} className="bg-[#ff6600] hover:bg-[#e55a00] text-white">
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
            </div>
      )}

      {/* Options de chat */}
      {!isDeliveryChatReady && (
            <div className="flex-1 p-6">
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
            <MessageCircle className="h-10 w-10 text-gray-400" />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {openDeliveryChatError
                ? 'Impossible d’ouvrir le chat'
                : isOpeningDeliveryChat
                  ? 'Ouverture du chat…'
                  : 'Initialisation du chat…'}
            </div>

            {openDeliveryChatError ? (
              <div className="max-w-md text-center text-xs text-rose-600 dark:text-rose-300">{openDeliveryChatError}</div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400">Veuillez patienter quelques secondes.</div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                Fermer
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isOpeningDeliveryChat}
                onClick={() => void openDeliveryGroupChat()}
                className="bg-[#ff6600] text-white hover:bg-[#e55a00]"
              >
                Réessayer
              </Button>
            </div>
          </div>
            </div>
      )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
