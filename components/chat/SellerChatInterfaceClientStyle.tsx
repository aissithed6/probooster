'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useChatContext } from '@/lib/chat-context-supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SellerDashboardApi } from '@/lib/services/seller-dashboard-service.api'
import type { SharedProduct } from '@/lib/types/shared-product'
import {
  Archive,
  Check,
  Coins,
  Info,
  Mic,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Paperclip,
  Play,
  Search,
  Send,
  Settings,
  Smile,
  Star,
  Square,
  Trash2,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/**
 * UI Chat vendeur alignée sur le style du dashboard client.
 * Objectif: supprimer les problèmes de layout "coupé" en utilisant une structure flex simple + scroll natif,
 * tout en conservant les fonctionnalités existantes via useChatContext.
 */
export const SellerChatInterfaceClientStyle: React.FC = () => {
  const {
    chatSessions,
    activeChatSession,
    messages,
    createChatSession,
    openChatSession,
    closeChatSession,
    sendMessage,
    addProductToChat,
    addFileToChat,
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
    setActiveTab
  } = useChatContext()

  const { toast } = useToast()

  const [chatInput, setChatInput] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedTransferSeller, setSelectedTransferSeller] = useState<string | null>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])

  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingPausedRef = useRef(false)

  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [sellerProducts, setSellerProducts] = useState<SharedProduct[]>([])
  const [sellerProductsCount, setSellerProductsCount] = useState<number>(0)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const [isProductInfoOpen, setIsProductInfoOpen] = useState(false)
  const [productInfoLoading, setProductInfoLoading] = useState(false)
  const [productInfoError, setProductInfoError] = useState<string | null>(null)
  const [productInfoData, setProductInfoData] = useState<any>(null)

  const productInfoCacheRef = useRef<Map<string, any>>(new Map())
  const productInfoAbortRef = useRef<AbortController | null>(null)
  const productInfoActiveIdRef = useRef<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const formatRecordingTime = (seconds: number) => {
    const s = Math.max(0, Number(seconds) || 0)
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }

  const startRecording = async () => {
    if (isRecording) return
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
          addFileToChat(file)
        } finally {
          try {
            recorder.stream.getTracks().forEach((t) => t.stop())
          } catch {
            // ignore
          }
          setAudioChunks([])
          setRecordingTime(0)
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setAudioChunks(chunks)
      setIsRecording(true)
      setRecordingPaused(false)
      recordingPausedRef.current = false

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      recordingIntervalRef.current = setInterval(() => {
        if (recordingPausedRef.current) return
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Impossible de démarrer l’enregistrement.'
      toast({ title: 'Microphone', description: msg, variant: 'destructive' })
      setIsRecording(false)
      setRecordingPaused(false)
      recordingPausedRef.current = false
      setMediaRecorder(null)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorder || !isRecording) return
    try {
      mediaRecorder.stop()
    } catch {
      // ignore
    }
    setIsRecording(false)
    setRecordingPaused(false)
    recordingPausedRef.current = false
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
  }

  const toggleRecordingPause = () => {
    if (!mediaRecorder || !isRecording) return
    try {
      if (recordingPaused) {
        mediaRecorder.resume()
        setRecordingPaused(false)
        recordingPausedRef.current = false
      } else {
        mediaRecorder.pause()
        setRecordingPaused(true)
        recordingPausedRef.current = true
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
      try {
        mediaRecorder?.stream?.getTracks?.().forEach((t: any) => t.stop())
      } catch {
        // ignore
      }
    }
  }, [mediaRecorder])

  /**
   * Assure que le scroll suit les nouveaux messages dans la conversation active.
   */
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ block: 'end' })
    } catch {
      // ignore
    }
  }, [messages.length, activeChatSession?.id])

  const filteredSessions = useMemo(() => {
    const q = String(searchQuery ?? '').toLowerCase().trim()
    if (!q) return chatSessions
    return chatSessions.filter((s) => {
      const name = String(s.sellerName ?? '').toLowerCase()
      const last = String(s.lastMessage ?? '').toLowerCase()
      return name.includes(q) || last.includes(q)
    })
  }, [chatSessions, searchQuery])

  const uniqueMessages = useMemo(() => {
    const list = Array.isArray(messages) ? messages : []
    if (list.length === 0) return []

    // Supabase realtime / refresh peut parfois pousser des doublons (même id).
    // On déduplique pour garantir des keys React stables.
    const seen = new Set<string>()
    const out: typeof list = []
    for (const msg of list) {
      const id = String((msg as any)?.id ?? '')
      if (id && seen.has(id)) continue
      if (id) seen.add(id)
      out.push(msg)
    }
    return out
  }, [messages])

  const isProductFallbackText = (text: string): boolean => {
    const t = String(text ?? '').trim()
    if (!t) return true
    if (t === 'Produit partagé') return true
    if (t.startsWith('Produit: ')) return true
    return false
  }

  /**
   * Extrait un texte “humain” associé à un message produit.
   * On tente d'abord de décoder le contenu brut encodé `__product__:` si disponible.
   */
  const extractProductTextForDisplay = (message: any): string => {
    const candidates = [
      message?.rawContent,
      message?.originalContent,
      message?.dbContent,
      message?.content
    ]

    for (const c of candidates) {
      const raw = String(c ?? '')
      if (!raw) continue

      // Si on a le contenu DB encodé, on extrait le texte utilisateur.
      if (raw.startsWith('__product__:')) {
        try {
          const jsonPart = raw.slice('__product__:'.length)
          const parsed = JSON.parse(jsonPart)
          const text = typeof parsed?.text === 'string' ? String(parsed.text) : ''
          if (text.trim()) return text
        } catch {
          // ignore
        }
      }

      // Sinon, on considère que le champ est déjà un texte affichable.
      if (raw.trim()) return raw
    }

    return ''
  }

  /**
   * Vérifie qu'une URL est exploitable pour un <img />.
   */
  const isUsableUrl = (value: any): boolean => {
    const s = String(value ?? '').trim()
    if (!s) return false
    if (s.startsWith('http://') || s.startsWith('https://')) return true
    if (s.startsWith('/')) return true
    return false
  }

  /**
   * Détermine si un mime correspond à un média supporté par un lecteur natif.
   */
  const getMediaKindFromMime = (mime: unknown): 'audio' | 'video' | null => {
    const m = String(mime ?? '').trim().toLowerCase()
    if (!m) return null
    if (m.startsWith('audio/')) return 'audio'
    if (m.startsWith('video/')) return 'video'
    return null
  }

  /**
   * Normalise une miniature produit pour l'affichage.
   */
  const getProductThumbnail = (p: SharedProduct): string => {
    const direct = String((p as any)?.mainImage ?? '').trim()
    if (direct) return direct
    const gallery = Array.isArray((p as any)?.galleryImages) ? (p as any).galleryImages : []
    if (gallery.length > 0 && typeof gallery[0] === 'string' && gallery[0].trim()) return gallery[0].trim()
    const media = Array.isArray((p as any)?.media) ? (p as any).media : []
    const mediaImage = media.find((m: any) => String(m?.type ?? '').toLowerCase() === 'image' && String(m?.path ?? '').trim())
    if (mediaImage?.path) return String(mediaImage.path).trim()
    return '/placeholder.jpg'
  }

  /**
   * Extrait un nombre depuis différents formats (number / string) avec fallback.
   */
  const toFiniteNumber = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const normalized = value.replace(/\s/g, '').replace(',', '.')
      const n = Number(normalized)
      return Number.isFinite(n) ? n : null
    }
    return null
  }

  /**
   * Résout le prix à afficher pour un produit (supporte camelCase + snake_case + metadata).
   */
  const getProductDisplayPrice = (p: SharedProduct): number | null => {
    const anyP = p as any

    const sale =
      toFiniteNumber(p.salePrice) ??
      toFiniteNumber(anyP.sale_price) ??
      toFiniteNumber(anyP.salePriceCfa) ??
      toFiniteNumber(anyP.sale_price_cfa) ??
      toFiniteNumber((p.metadata as any)?.salePrice) ??
      toFiniteNumber((p.metadata as any)?.sale_price)

    if (sale !== null) return sale

    const base =
      toFiniteNumber(p.price) ??
      toFiniteNumber(anyP.price_cfa) ??
      toFiniteNumber(anyP.unitPrice) ??
      toFiniteNumber(anyP.unit_price) ??
      toFiniteNumber((p.metadata as any)?.price) ??
      toFiniteNumber((p.metadata as any)?.price_cfa)

    return base
  }

  /**
   * Charge les produits du vendeur authentifié pour l'onglet Produits.
   */
  const loadSellerProducts = async (signal?: AbortSignal) => {
    setIsLoadingProducts(true)
    try {
      const res = await SellerDashboardApi.getProducts(
        {
          search: productSearchQuery.trim() || undefined,
          limit: 50,
          offset: 0
        },
        signal
      )
      setSellerProducts(Array.isArray(res?.items) ? res.items : [])
      setSellerProductsCount(typeof res?.count === 'number' ? res.count : 0)
    } catch (error) {
      setSellerProducts([])
      setSellerProductsCount(0)
      const msg = error instanceof Error ? error.message : 'Impossible de charger les produits.'
      toast({ title: 'Erreur', description: msg, variant: 'destructive' })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (activeTab !== 'produits') return

    const controller = new AbortController()
    const t = setTimeout(() => {
      void loadSellerProducts(controller.signal)
    }, 250)

    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [activeTab, productSearchQuery])

  /**
   * Envoie le message texte dans la conversation active.
   */
  const handleSend = () => {
    const value = chatInput.trim()
    if (!value || !activeChatSession) return
    sendMessage(value)
    setChatInput('')
  }

  /**
   * Ouvre le sélecteur de fichiers.
   */
  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  /**
   * Upload de fichier via le contexte.
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !activeChatSession) return
    addFileToChat(file)
  }

  /**
   * Ajoute un produit dans la conversation active.
   */
  const handleProductClick = (product: SharedProduct) => {
    if (!activeChatSession) {
      toast({
        title: 'Action impossible',
        description: 'Sélectionnez une conversation avant de partager un produit.',
        variant: 'destructive'
      })
      return
    }
    addProductToChat(product)
  }

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
      String(anyP?.metadata?.thumbnail ?? '').trim() ||
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
   * Ouvre l'overlay d'informations produit instantanément (cache/snapshot), puis recharge en arrière-plan
   * les données réelles via l'API publique.
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

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Colonne gauche */}
      <div className="w-[360px] min-w-[320px] max-w-[420px] border-r border-gray-200 bg-white flex flex-col min-h-0">
        {/* Header gauche */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                <MessageCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Conversations</div>
                <div className="text-xs text-gray-500">Clients & administration</div>
              </div>
            </div>
          </div>

          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>

          {/* Tabs style client */}
          <div className="mt-3 grid grid-cols-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('conversations')}
              className={`h-9 rounded-md text-sm font-medium transition-all ${
                activeTab === 'conversations'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Conversations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('produits')}
              className={`h-9 rounded-md text-sm font-medium transition-all ${
                activeTab === 'produits'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Produits
            </button>
          </div>
        </div>

        {/* Contenu gauche */}
        {activeTab === 'conversations' ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-2">
            <div className="space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">Aucune conversation</div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === activeChatSession?.id
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => openChatSession(session.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                          <AvatarImage src={session.sellerAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                            {String(session.sellerName || 'C').charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-gray-900 truncate">{session.sellerName}</div>
                            {session.unreadCount > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                {session.unreadCount}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-1 text-sm text-gray-600 line-clamp-2 break-words">
                            {session.lastMessage || 'Aucun message'}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un produit..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="mb-3 text-xs text-gray-500">
              {isLoadingProducts ? 'Recherche en cours...' : `${sellerProductsCount} produit(s) trouvé(s)`}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {isLoadingProducts ? (
                <div className="py-10 text-center text-sm text-gray-500">Chargement des produits...</div>
              ) : sellerProducts.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">Aucun produit trouvé</div>
              ) : (
                sellerProducts.map((product) => {
                  const thumb = getProductThumbnail(product)
                  const resolvedPrice = getProductDisplayPrice(product)
                  const vendorName = String((product as any)?.vendorName ?? (product as any)?.vendor_name ?? 'Votre boutique')
                  const points = Math.round(Number(resolvedPrice ?? 0) * 10)

                  return (
                    <Card key={product.id} className="border-gray-100 hover:border-orange-200 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{product.name}</div>
                            <div className="mt-1 text-xs text-gray-500 truncate">{vendorName}</div>
                            <div className="mt-2 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-orange-600">
                                  {resolvedPrice === null ? '—' : `${resolvedPrice} F CFA`}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  {points} pts
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleProductClick({
                                  ...product,
                                  metadata: {
                                    ...(product.metadata ?? {}),
                                    thumbnail: thumb
                                  }
                                })}
                              >
                                Partager
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panneau droit */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-white">
        {activeChatSession ? (
          <>
            {/* Header conversation */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 border-2 border-orange-200 bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                    <AvatarImage src={activeChatSession.sellerAvatar} />
                    <AvatarFallback>{String(activeChatSession.sellerName || 'C').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{activeChatSession.sellerName}</div>
                    <div className="text-xs text-gray-600 truncate">Conversation synchronisée</div>
                  </div>
                </div>

                <div className="relative">
                  <Button variant="ghost" size="sm" onClick={() => setShowMoreMenu((v) => !v)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>

                  {showMoreMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[220px] z-50">
                      <button
                        onClick={() => {
                          toast({
                            title: 'Conversation marquée',
                            description: 'Cette conversation a été marquée comme importante.',
                            variant: 'default'
                          })
                          setShowMoreMenu(false)
                        }}
                        className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left text-sm"
                      >
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        Marquer comme important
                      </button>

                      <button
                        onClick={() => {
                          toast({
                            title: 'Conversation archivée',
                            description: 'Cette conversation a été archivée.',
                            variant: 'default'
                          })
                          setShowMoreMenu(false)
                        }}
                        className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left text-sm"
                      >
                        <Archive className="w-4 h-4 mr-2 text-blue-500" />
                        Archiver
                      </button>

                      <button
                        onClick={() => {
                          toast({
                            title: 'À régler',
                            description: 'Fonctionnalité à venir.',
                            variant: 'default'
                          })
                          setShowMoreMenu(false)
                        }}
                        className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left text-sm"
                      >
                        <Settings className="w-4 h-4 mr-2 text-orange-500" />
                        À régler
                      </button>

                      <div className="border-t border-gray-200 my-1" />

                      <button
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir fermer cette conversation ?')) {
                            closeChatSession()
                          }
                          setShowMoreMenu(false)
                        }}
                        className="flex items-center w-full p-2 hover:bg-red-50 rounded text-left text-sm text-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Fermer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions sélection */}
            {selectedMessageIds.length > 0 && (
              <div className="border-b border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-gray-700">
                    {selectedMessageIds.length} message(s) sélectionné(s)
                  </div>
                  <Button variant="ghost" size="sm" onClick={deselectAllMessages}>
                    <X className="h-3 w-3 mr-2" />
                    Désélectionner
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button variant="outline" size="sm" onClick={archiveSelectedMessages}>
                    <Archive className="h-3 w-3 mr-2" />
                    Archiver
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowTransferModal(true)}>
                    <Check className="h-3 w-3 mr-2" />
                    Transférer
                  </Button>
                  <Button variant="destructive" size="sm" onClick={deleteSelectedMessages}>
                    <Trash2 className="h-3 w-3 mr-2" />
                    Supprimer
                  </Button>
                  <Button variant="outline" size="sm" onClick={selectAllMessages}>
                    <Check className="h-3 w-3 mr-2" />
                    Tout sélectionner
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 p-4">
              <div className="space-y-4">
                {uniqueMessages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMessageIds.includes(message.id)}
                      onChange={() => toggleMessageSelection(message.id)}
                      className="mt-2"
                    />

                    <div className={`flex-1 min-w-0 ${message.sender === 'user' ? 'text-right' : ''}`}>
                      {message.type === 'text' && (
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-sm border ${
                            message.sender === 'user'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-900 border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                        </div>
                      )}

                      {message.type === 'image' && (
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-sm border ${
                            message.sender === 'user'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-900 border-gray-200'
                          }`}
                        >
                          {String(message.content ?? '').trim() ? (
                            <p className="text-sm whitespace-pre-wrap break-words mb-2">{String(message.content ?? '')}</p>
                          ) : null}
                          {isUsableUrl((message as any).imageUrl) ? (
                            <a
                              href={String((message as any).imageUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                              title="Ouvrir l'image"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={String((message as any).imageUrl)}
                                alt="Image"
                                className="max-h-72 w-auto max-w-full rounded-lg border border-white/20 object-contain"
                                loading="lazy"
                              />
                            </a>
                          ) : (
                            <div className="text-sm opacity-90">Image</div>
                          )}
                        </div>
                      )}

                      {message.type === 'document' && (
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-sm border ${
                            message.sender === 'user'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-900 border-gray-200'
                          }`}
                        >
                          {String(message.content ?? '').trim() ? (
                            <p className="text-sm whitespace-pre-wrap break-words mb-2">{String(message.content ?? '')}</p>
                          ) : null}
                          {isUsableUrl((message as any).fileUrl) ? (
                            <a
                              href={String((message as any).fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-sm underline ${message.sender === 'user' ? 'text-white' : 'text-blue-600'}`}
                              title="Ouvrir le fichier"
                            >
                              {String((message as any).fileName ?? '').trim() || 'Fichier'}
                            </a>
                          ) : (
                            <div className="text-sm opacity-90">Fichier</div>
                          )}

                          {(() => {
                            const mediaKind = getMediaKindFromMime((message as any)?.fileType)
                            const url = String((message as any)?.fileUrl ?? '').trim()
                            if (!mediaKind || !url) return null
                            if (mediaKind === 'audio') {
                              return (
                                <div className="mt-3">
                                  <audio controls src={url} className="w-full" />
                                </div>
                              )
                            }
                            return (
                              <div className="mt-3">
                                <video controls src={url} className="w-full max-h-80 rounded-lg bg-black/10" />
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {message.type === 'product' && message.product && (
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-2xl shadow-sm border ${
                            message.sender === 'user'
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white text-gray-900 border-gray-200'
                          }`}
                        >
                          {(() => {
                            const text = extractProductTextForDisplay(message)
                            if (isProductFallbackText(text)) return null
                            return <p className="text-sm whitespace-pre-wrap break-words mb-2">{text}</p>
                          })()}
                          <div className="text-xs opacity-90 mb-2">Produit partagé</div>
                          <div className="rounded-lg overflow-hidden border border-gray-200 bg-white text-gray-900">
                            <div className="flex gap-3 p-3">
                              <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    (message.product as any)?.metadata?.thumbnail ||
                                    (Array.isArray((message.product as any)?.images) && (message.product as any).images?.[0]) ||
                                    (message.product as any)?.image ||
                                    '/placeholder.jpg'
                                  }
                                  alt={(message.product as any)?.name || 'Produit'}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate">
                                  {String((message.product as any)?.name ?? 'Produit')}
                                </div>
                                <div className="mt-1 text-sm text-orange-600 font-semibold">
                                  {String((message.product as any)?.price ?? '')}
                                </div>
                              </div>

                              <div className="flex items-start">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const pid = String((message.product as any)?.id ?? '').trim()
                                    if (!pid) return
                                    void openProductInfo(pid, message.product)
                                  }}
                                  title="Informations"
                                  className="h-8 w-8 p-0"
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-1 text-xs text-gray-500">
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAttachmentMenu((v) => !v)
                      setShowEmojiPicker(false)
                    }}
                    className="p-2"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[220px] z-50">
                      <div className="text-sm font-medium text-gray-700 mb-2">Ajouter une pièce jointe</div>
                      <div className="space-y-1">
                        <button
                          onClick={triggerFileSelect}
                          className="flex items-center w-full p-2 hover:bg-gray-50 rounded text-left"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <Paperclip className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Document</div>
                            <div className="text-xs text-gray-500">Ajouter un fichier</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEmojiPicker((v) => !v)
                    setShowAttachmentMenu(false)
                  }}
                  className="p-2"
                >
                  <Smile className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (!activeChatSession) return
                    void startRecording()
                  }}
                  className="p-2"
                  title="Enregistrer un audio"
                >
                  <Mic className="h-5 w-5" />
                </Button>

                {isRecording ? (
                  <div className="flex-1 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-medium text-orange-700">REC</span>
                      <span className="text-sm text-orange-700">{formatRecordingTime(recordingTime)}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={toggleRecordingPause} className="h-8 w-8 p-0" title={recordingPaused ? 'Reprendre' : 'Pause'}>
                        {recordingPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={stopRecording} className="h-8 w-8 p-0" title="Stop">
                        <Square className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Tapez votre message..."
                    className="flex-1"
                  />
                )}

                <Button
                  onClick={handleSend}
                  disabled={!chatInput.trim() || isRecording}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>

              {showEmojiPicker && (
                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="grid grid-cols-10 gap-2">
                    {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '😊', '😉', '😍', '😘', '😎', '🤩', '🥳', '😡', '😭'].map(
                      (emoji, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setChatInput((prev) => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                          className="w-8 h-8 text-xl hover:bg-gray-100 rounded"
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />

            {showTransferModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold mb-4">Transférer les messages</h3>
                  <div className="space-y-2">
                    <Input
                      placeholder="ID vendeur cible..."
                      value={selectedTransferSeller ?? ''}
                      onChange={(e) => setSelectedTransferSeller(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!selectedTransferSeller) return
                        transferSelectedMessages(selectedTransferSeller)
                        setShowTransferModal(false)
                      }}
                    >
                      Transférer
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setShowTransferModal(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-900">Aucune conversation active</div>
              <div className="text-sm text-gray-500">Sélectionnez une conversation pour commencer</div>
            </div>
          </div>
        )}
      </div>

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
                        <span className="font-semibold text-indigo-700">{productInfoData.sale_price} XOF</span>
                        {typeof productInfoData?.price === 'number' && productInfoData.price > 0 ? (
                          <span className="ml-2 text-gray-500 line-through">{productInfoData.price} XOF</span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="font-semibold text-indigo-700">{productInfoData?.price ?? 0} XOF</span>
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
                          ? '0 XOF'
                          : (productInfoData?.shipping?.shipping_cost ?? null) == null
                            ? '—'
                            : `${productInfoData.shipping.shipping_cost} XOF`}
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

          <div className="flex items-center justify-end">
            <Button type="button" variant="outline" onClick={() => setIsProductInfoOpen(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
