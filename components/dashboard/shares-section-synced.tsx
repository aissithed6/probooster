"use client"

/**
 * Section Partages Synchronisée avec Supabase
 * Pour le tableau de bord CLIENT
 */

import { useMemo, useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Share2, TrendingUp, Eye, Award, Download, RefreshCw,
  Target, Zap, DollarSign, Trophy, Crown, Copy, ExternalLink
} from 'lucide-react'
import { FaWhatsapp, FaFacebook, FaXTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useShareEngagement } from '@/contexts/ShareEngagementContext'
import { ShareEngagementProvider } from '@/contexts/ShareEngagementContext'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'
import { EditableMessagesService, type EditableMessage } from '@/lib/services/editable-messages-service'
import { ShareEngagementService } from '@/lib/services/share-engagement-service'
import { getClientAccessTokenSafe, supabase } from '@/lib/supabase'
import {
  ShareDetailsDialog,
  type ShareDetailsDialogInteraction,
  type ShareDetailsDialogShare
} from '@/components/shares/share-details-dialog'

interface SharesSectionSyncedProps {
  userId: string
}

/**
 * Charge des aperçus produits via l'API publique (Supabase Admin) pour contourner d'éventuelles règles RLS.
 */
async function fetchPublicProductsByIds(
  productIds: string[]
): Promise<Array<{ id: string; name: string; imageUrl: string; vendorId: string; sellerName: string; sellerAvatar: string }>> {
  try {
    const ids = (productIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 50)
    if (ids.length === 0) return []

    const res = await fetch(`/api/public/products/list?ids=${encodeURIComponent(ids.join(','))}&includeInactive=true`, {
      method: 'GET',
      cache: 'no-store'
    })

    const json = await res.json().catch(() => null)
    const items = json?.data?.items
    if (!Array.isArray(items)) return []

    return items
      .map((row: any) => {
        const id = String(row?.id ?? '').trim()
        if (!id) return null
        const name = String(row?.name ?? '').trim() || 'Produit'
        const imageUrl = String(row?.image ?? '').trim()
        const vendorId = String(row?.vendorId ?? '').trim()
        const sellerName = String(row?.sellerName ?? '').trim()
        const sellerAvatar = String(row?.sellerAvatar ?? '').trim()
        return { id, name, imageUrl, vendorId, sellerName, sellerAvatar }
      })
      .filter(Boolean) as Array<{ id: string; name: string; imageUrl: string; vendorId: string; sellerName: string; sellerAvatar: string }>
  } catch {
    return []
  }
}

type VendorPreview = {
  id: string
  userId: string
  name: string
  avatarUrl: string
}

type PublicVendorListItem = {
  id: string
  userId?: string
  name: string
  avatar: string
  shortCode?: string
}

type ProductPreview = {
  id: string
  name: string
  imageUrl: string
  vendorId: string
  sellerName?: string
  sellerAvatar?: string
}

type PeriodKey = '7d' | '30d' | 'all'

/**
 * Résout la meilleure image produit possible depuis un enregistrement `user_products`.
 */
function resolveProductImageUrl(row: any): string {
  const main = typeof row?.main_image === 'string' ? String(row.main_image).trim() : ''
  if (main) return main
  const images = Array.isArray(row?.images) ? row.images : []
  const first = images.find((x: any) => typeof x === 'string' && String(x).trim().length > 0)
  return typeof first === 'string' ? String(first).trim() : ''
}

/**
 * Copie une URL de partage dans le presse-papiers (best effort).
 */
async function copyShareLink(url: string) {
  try {
    const value = String(url ?? '').trim()
    if (!value) return
    await navigator.clipboard.writeText(value)
  } catch {
    // noop
  }
}

/**
 * Construit un nom vendeur lisible à partir d'une ligne `user_profiles`.
 */
function resolveVendorName(profile: any): string {
  const preferences = profile?.preferences && typeof profile.preferences === 'object' && !Array.isArray(profile.preferences)
    ? (profile.preferences as any)
    : null
  const vendorPublic = preferences?.vendor_public && typeof preferences.vendor_public === 'object' && !Array.isArray(preferences.vendor_public)
    ? (preferences.vendor_public as any)
    : null
  const shopName = typeof vendorPublic?.shop_name === 'string' ? String(vendorPublic.shop_name).trim() : ''
  if (shopName) return shopName

  const first = typeof profile?.first_name === 'string' ? String(profile.first_name).trim() : ''
  const last = typeof profile?.last_name === 'string' ? String(profile.last_name).trim() : ''
  const full = [first, last].filter(Boolean).join(' ').trim()
  if (full) return full

  const shortCode = typeof profile?.short_code === 'string' ? String(profile.short_code).trim() : ''
  if (shortCode) return shortCode

  return 'Vendeur'
}

/**
 * Charge un mapping (id -> {name, avatar}) côté serveur pour contourner d'éventuelles règles RLS.
 */
async function fetchPublicVendorList(): Promise<PublicVendorListItem[]> {
  try {
    const res = await fetch('/api/public/vendors/list', { method: 'GET', cache: 'no-store' })
    const json = await res.json().catch(() => null)
    const rows = json?.data
    return Array.isArray(rows)
      ? rows
          .map((x: any) => ({
            id: String(x?.id ?? '').trim(),
            name: String(x?.name ?? '').trim(),
            avatar: String(x?.avatar ?? '').trim(),
            shortCode: typeof x?.shortCode === 'string' ? String(x.shortCode).trim() : undefined
          }))
          .filter((x: any) => x.id && x.name)
      : []
  } catch {
    return []
  }
}

/**
 * Fallback: charge un vendeur individuellement côté serveur (utile si la liste ne suffit pas).
 */
async function fetchPublicVendorProfile(vendorId: string): Promise<PublicVendorListItem | null> {
  try {
    const id = String(vendorId ?? '').trim()
    if (!id) return null
    const res = await fetch(`/api/public/vendors/profile?vendorId=${encodeURIComponent(id)}`, { method: 'GET', cache: 'no-store' })
    const json = await res.json().catch(() => null)
    const data = json?.data
    if (!res.ok || !data) return null
    const canonicalUserId = String(data?.vendorId ?? '').trim()
    const name = String(data?.name ?? '').trim()
    const avatar = String(data?.avatar ?? '').trim()
    if (!name) return null
    return { id, userId: canonicalUserId || undefined, name, avatar }
  } catch {
    return null
  }
}

function SharesSectionContent({ userId }: SharesSectionSyncedProps) {
  const { privacyPrefs } = useUserPreferences()
  const {
    shares,
    analytics,
    isLoading,
    isSyncing,
    refreshShares,
    refreshAnalytics
  } = useShareEngagement()

  const [shareTipsMessage, setShareTipsMessage] = useState<EditableMessage | null>(null)
  const [adminPointsConfig, setAdminPointsConfig] = useState<{
    purchaseValue: number
    socialShareValue: number
    socialSharePerNetwork: Record<string, number>
  } | null>(null)

  const [period, setPeriod] = useState<PeriodKey>('7d')
  const [productPreviewById, setProductPreviewById] = useState<Record<string, ProductPreview>>({})
  const [vendorPreviewById, setVendorPreviewById] = useState<Record<string, VendorPreview>>({})

  const [shareDetailsOpen, setShareDetailsOpen] = useState(false)
  const [selectedShare, setSelectedShare] = useState<ShareDetailsDialogShare | null>(null)
  const [shareInteractions, setShareInteractions] = useState<ShareDetailsDialogInteraction[]>([])
  const [isLoadingShareInteractions, setIsLoadingShareInteractions] = useState(false)
  const [shareInteractionsError, setShareInteractionsError] = useState<string | null>(null)

  const [copiedShareId, setCopiedShareId] = useState<string | null>(null)
  const copiedResetTimerRef = useRef<number | null>(null)

  const loadShareInteractions = async (shareId: string) => {
    const sid = String(shareId || '').trim()
    if (!sid) return

    setIsLoadingShareInteractions(true)
    setShareInteractionsError(null)

    try {
      const params = new URLSearchParams()
      params.set('shareId', sid)

      const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
      const headers: Record<string, string> = {}
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const res = await fetch(`/api/shares/interactions?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store',
        headers
      })

      const json = await res.json().catch(() => null)
      const rows = (json?.data?.rows ?? []) as ShareDetailsDialogInteraction[]

      if (!res.ok) {
        setShareInteractions([])
        const message =
          (typeof json?.error === 'string' && json.error) ||
          (json?.error && typeof json.error?.message === 'string' && json.error.message) ||
          'Impossible de charger les interactions.'
        setShareInteractionsError(message)
        return
      }

      setShareInteractions(Array.isArray(rows) ? rows : [])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Impossible de charger les interactions.'
      setShareInteractions([])
      setShareInteractionsError(message)
    } finally {
      setIsLoadingShareInteractions(false)
    }
  }

  const openShareDetails = (share: any) => {
    const shareId = String(share?.id ?? '').trim()
    if (!shareId) return

    const productId = String(share?.product_id ?? '').trim()
    const productName = productPreviewById[productId]?.name || `Produit #${productId.substring(0, 8)}`
    const productImage = productPreviewById[productId]?.imageUrl || ''
    const vendorName = productPreviewById[productId]?.sellerName || ''

    const mapped: ShareDetailsDialogShare = {
      id: shareId,
      createdAt: String(share?.created_at ?? ''),
      platform: String(share?.platform ?? ''),
      shareUrl: String(share?.share_url ?? ''),
      pointsEarned: Number(share?.points_earned ?? 0),
      shareUserName: 'Vous',
      shareUserAvatar: '',
      productId,
      productName,
      productImage,
      productVendorName: vendorName,
      interactionsCount: 0,
      interactionTypes: {},
      pointsFromInteractions: 0
    }

    setSelectedShare(mapped)
    setShareDetailsOpen(true)
    setShareInteractions([])
    void loadShareInteractions(shareId)
  }

  useEffect(() => {
    if (!shareDetailsOpen) {
      setSelectedShare(null)
      setShareInteractions([])
      setShareInteractionsError(null)
      setIsLoadingShareInteractions(false)
    }
  }, [shareDetailsOpen])

  useEffect(() => {
    return () => {
      if (copiedResetTimerRef.current) {
        window.clearTimeout(copiedResetTimerRef.current)
        copiedResetTimerRef.current = null
      }
    }
  }, [])

  // Copie + enregistrement track-only (copy) pour permettre de tracer les interactions même sans gain de points.
  const handleCopyShareLink = async (share: any) => {
    try {
      const shareId = String(share?.id ?? '').trim()
      const productId = String(share?.product_id ?? '').trim()
      const shareUrl = String(share?.share_url ?? '').trim()
      if (!shareUrl) return

      try {
        const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        await fetch('/api/shares/record', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId,
            vendorId: '',
            platform: 'copy',
            shareUrl,
            awardPoints: false
          }),
          cache: 'no-store'
        }).catch(() => null)
      } catch {
        // noop
      }

      await navigator.clipboard.writeText(shareUrl)
      setCopiedShareId(shareId || shareUrl)

      if (copiedResetTimerRef.current) {
        window.clearTimeout(copiedResetTimerRef.current)
      }
      copiedResetTimerRef.current = window.setTimeout(() => {
        setCopiedShareId(null)
        copiedResetTimerRef.current = null
      }, 1200)
    } catch {
      // noop
    }
  }

  // Charger le message des conseils
  useEffect(() => {
    const loadMessage = async () => {
      const message = await EditableMessagesService.getMessageByKey('share_tips')
      setShareTipsMessage(message)
    }
    
    loadMessage()

    // S'abonner aux changements du message
    const unsubscribe = EditableMessagesService.subscribeToMessage('share_tips', (message) => {
      setShareTipsMessage(message)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadPointsConfig = async () => {
      try {
        const cfg = await ShareEngagementService.getAdminPointsConfig()
        if (!isMounted) return
        setAdminPointsConfig(cfg)
      } catch {
        if (!isMounted) return
        setAdminPointsConfig(null)
      }
    }

    loadPointsConfig()

    let channel: any
    try {
      channel = supabase
        .channel('client-share-tips-points-config')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'point_settings' }, () => {
          loadPointsConfig()
        })
        .subscribe()
    } catch {
      // noop
    }

    return () => {
      isMounted = false
      try {
        if (channel) {
          supabase.removeChannel(channel)
        }
      } catch {
        // noop
      }
    }
  }, [])

  const handleRefresh = async () => {
    await Promise.all([refreshShares(), refreshAnalytics()])
  }

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Plateforme', 'Produit', 'Points'],
      ...shares.map(share => [
        new Date(share.created_at).toLocaleDateString('fr-FR'),
        share.platform,
        share.product_id,
        share.points_earned
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Mes-Partages-${new Date().toISOString().split('T')[0]}.csv`
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <FaFacebook className="w-5 h-5 text-blue-600" />
      case 'twitter': return <FaXTwitter className="w-5 h-5 text-black" />
      case 'whatsapp': return <FaWhatsapp className="w-5 h-5 text-green-600" />
      case 'instagram': return <FaInstagram className="w-5 h-5 text-pink-600" />
      case 'linkedin': return <FaLinkedin className="w-5 h-5 text-blue-700" />
      default: return <Share2 className="w-5 h-5" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-100 text-blue-700'
      case 'twitter': return 'bg-gray-100 text-gray-700'
      case 'whatsapp': return 'bg-green-100 text-green-700'
      case 'instagram': return 'bg-pink-100 text-pink-700'
      case 'linkedin': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  /**
   * Calcule la date de début (inclus) en fonction de la période sélectionnée.
   */
  const periodStartDate = useMemo(() => {
    if (period === 'all') return null
    const now = Date.now()
    const days = period === '7d' ? 7 : 30
    return new Date(now - days * 24 * 60 * 60 * 1000)
  }, [period])

  /**
   * Filtre des partages selon la période (pour les onglets Produits / Vendeurs / Statistiques).
   */
  const sharesInPeriod = useMemo(() => {
    if (!periodStartDate) return shares
    const startMs = periodStartDate.getTime()
    return shares.filter((s) => {
      const t = new Date(s.created_at).getTime()
      return Number.isFinite(t) && t >= startMs
    })
  }, [periodStartDate, shares])

  const productAggRows = useMemo(() => {
    type Agg = {
      productId: string
      totalShares: number
      pointsEarned: number
      lastSharedAt: string
      byPlatform: Record<string, number>
      vendorId: string
    }

    const map = new Map<string, Agg>()
    for (const share of sharesInPeriod) {
      const pid = String(share.product_id ?? '').trim()
      if (!pid) continue
      const platform = String(share.platform ?? '').trim().toLowerCase()
      const points = Math.max(0, Number(share.points_earned ?? 0) || 0)
      const vendorId = String(share.vendor_id ?? '').trim()
      const createdAt = String(share.created_at ?? '').trim()

      const existing = map.get(pid)
      if (!existing) {
        map.set(pid, {
          productId: pid,
          totalShares: 1,
          pointsEarned: points,
          lastSharedAt: createdAt,
          byPlatform: platform ? { [platform]: 1 } : {},
          vendorId
        })
        continue
      }

      existing.totalShares += 1
      existing.pointsEarned += points
      if (platform) {
        existing.byPlatform[platform] = (existing.byPlatform[platform] || 0) + 1
      }
      if (createdAt && (!existing.lastSharedAt || new Date(createdAt).getTime() > new Date(existing.lastSharedAt).getTime())) {
        existing.lastSharedAt = createdAt
      }
      if (!existing.vendorId && vendorId) {
        existing.vendorId = vendorId
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const ta = new Date(a.lastSharedAt).getTime()
      const tb = new Date(b.lastSharedAt).getTime()
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0)
    })
  }, [sharesInPeriod])

  const vendorAggRows = useMemo(() => {
    type Agg = {
      vendorId: string
      distinctProducts: number
      totalShares: number
      pointsEarned: number
      lastSharedAt: string
      productIds: Set<string>
      sampleProductId: string
    }

    const map = new Map<string, Agg>()
    for (const share of sharesInPeriod) {
      const pid = String(share.product_id ?? '').trim()
      const vendorIdResolved = (pid && productPreviewById[pid]?.vendorId)
        ? String(productPreviewById[pid]?.vendorId ?? '').trim()
        : String(share.vendor_id ?? '').trim()

      if (!vendorIdResolved) continue
      const points = Math.max(0, Number(share.points_earned ?? 0) || 0)
      const createdAt = String(share.created_at ?? '').trim()

      const existing = map.get(vendorIdResolved)
      if (!existing) {
        const set = new Set<string>()
        if (pid) set.add(pid)
        map.set(vendorIdResolved, {
          vendorId: vendorIdResolved,
          distinctProducts: set.size,
          totalShares: 1,
          pointsEarned: points,
          lastSharedAt: createdAt,
          productIds: set,
          sampleProductId: pid
        })
        continue
      }

      existing.totalShares += 1
      existing.pointsEarned += points
      if (pid) existing.productIds.add(pid)
      existing.distinctProducts = existing.productIds.size
      if (createdAt && (!existing.lastSharedAt || new Date(createdAt).getTime() > new Date(existing.lastSharedAt).getTime())) {
        existing.lastSharedAt = createdAt
      }

      if (!existing.sampleProductId && pid) {
        existing.sampleProductId = pid
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.pointsEarned !== a.pointsEarned) return b.pointsEarned - a.pointsEarned
      return b.totalShares - a.totalShares
    })
  }, [sharesInPeriod, productPreviewById])

  const statsForPeriod = useMemo(() => {
    const totalShares = sharesInPeriod.length
    const pointsEarned = sharesInPeriod.reduce((sum, s) => sum + (Number(s.points_earned ?? 0) || 0), 0)
    const uniqueProducts = new Set(sharesInPeriod.map((s) => String(s.product_id ?? '').trim()).filter(Boolean)).size
    const uniqueVendors = new Set(sharesInPeriod.map((s) => String(s.vendor_id ?? '').trim()).filter(Boolean)).size

    const byPlatform: Record<string, number> = {}
    for (const s of sharesInPeriod) {
      const p = String(s.platform ?? '').trim().toLowerCase()
      if (!p) continue
      byPlatform[p] = (byPlatform[p] || 0) + 1
    }

    const bestPlatform = Object.entries(byPlatform).sort(([, a], [, b]) => b - a)[0]?.[0] || ''

    return {
      totalShares,
      pointsEarned,
      uniqueProducts,
      uniqueVendors,
      byPlatform,
      bestPlatform
    }
  }, [sharesInPeriod])

  useEffect(() => {
    let cancelled = false

    const loadLookups = async () => {
      let vendorIdsDiscovered: string[] = []

      const missingProductIds = productAggRows
        .map((r) => r.productId)
        .filter((id) => id && !productPreviewById[id])
        .slice(0, 50)

      const missingVendorIds = vendorAggRows
        .map((r) => r.vendorId)
        .filter((id) => id && !vendorPreviewById[id])
        .slice(0, 50)

      if (missingProductIds.length === 0 && missingVendorIds.length === 0) return

      try {
        if (missingProductIds.length > 0) {
          const { data: products } = await supabase
            .from('user_products')
            .select('id, name, main_image, images, vendor_id')
            .in('id', missingProductIds)
            .limit(50)

          if (!cancelled && Array.isArray(products)) {
            vendorIdsDiscovered = products
              .map((row: any) => (typeof row?.vendor_id === 'string' ? String(row.vendor_id).trim() : ''))
              .filter((id: string) => id.length > 0)

            setProductPreviewById((prev) => {
              const next = { ...prev }
              for (const row of products) {
                const id = typeof (row as any)?.id === 'string' ? String((row as any).id).trim() : ''
                if (!id) continue
                const name = typeof (row as any)?.name === 'string' ? String((row as any).name).trim() : 'Produit'
                const vendorId = typeof (row as any)?.vendor_id === 'string' ? String((row as any).vendor_id).trim() : ''
                const imageUrl = resolveProductImageUrl(row)
                next[id] = { id, name, vendorId, imageUrl }
              }
              return next
            })
          }
        }
      } catch {
        // noop
      }

      if (!cancelled && missingProductIds.length > 0) {
        const stillMissingProducts = missingProductIds.filter((id) => id && !productPreviewById[id]).slice(0, 50)
        if (stillMissingProducts.length > 0) {
          const apiProducts = await fetchPublicProductsByIds(stillMissingProducts)
          if (!cancelled && apiProducts.length > 0) {
            vendorIdsDiscovered = [...vendorIdsDiscovered, ...apiProducts.map((p) => p.vendorId).filter(Boolean)]
            setProductPreviewById((prev) => {
              const next = { ...prev }
              for (const p of apiProducts) {
                if (!p.id) continue
                next[p.id] = {
                  id: p.id,
                  name: p.name,
                  vendorId: p.vendorId,
                  imageUrl: p.imageUrl,
                  sellerName: p.sellerName,
                  sellerAvatar: p.sellerAvatar
                }
              }
              return next
            })

            setVendorPreviewById((prev) => {
              const next = { ...prev }
              for (const p of apiProducts) {
                const vid = String(p.vendorId ?? '').trim()
                if (!vid) continue
                const name = String(p.sellerName ?? '').trim()
                if (!name) continue
                const existingName = String(next[vid]?.name ?? '').trim()
                const canOverride = !existingName || existingName.toLowerCase().startsWith('vendeur')
                if (!canOverride) continue
                next[vid] = {
                  id: vid,
                  userId: vid,
                  name,
                  avatarUrl: String(p.sellerAvatar ?? '').trim()
                }
              }
              return next
            })
          }
        }
      }

      try {
        const toFetch = Array.from(new Set([...missingVendorIds, ...vendorIdsDiscovered]))
          .filter((id) => id && !vendorPreviewById[id])
          .slice(0, 80)

        if (toFetch.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, user_id, first_name, last_name, short_code, preferences, avatar_url')
            .or(`user_id.in.(${toFetch.join(',')}),id.in.(${toFetch.join(',')})`)
            .limit(80)

          if (!cancelled && Array.isArray(profiles)) {
            setVendorPreviewById((prev) => {
              const next = { ...prev }
              for (const profile of profiles) {
                const profileId = typeof (profile as any)?.id === 'string' ? String((profile as any).id).trim() : ''
                const userId = typeof (profile as any)?.user_id === 'string' ? String((profile as any).user_id).trim() : ''
                if (!profileId && !userId) continue

                const entry: VendorPreview = {
                  id: userId || profileId,
                  userId: userId,
                  name: resolveVendorName(profile),
                  avatarUrl: typeof (profile as any)?.avatar_url === 'string' ? String((profile as any).avatar_url).trim() : ''
                }

                if (userId) next[userId] = entry
                if (profileId) next[profileId] = entry
              }
              return next
            })
          }

          const stillMissing = toFetch.filter((id) => !vendorPreviewById[id])
          if (!cancelled && stillMissing.length > 0) {
            const list = await fetchPublicVendorList()
            const byId = new Map<string, PublicVendorListItem>()
            for (const v of list) {
              if (v?.id) byId.set(v.id, { ...v, userId: v.id })
              if (v?.shortCode) byId.set(v.shortCode, { ...v, userId: v.id })
            }

            const remaining = stillMissing.filter((id) => !byId.has(id)).slice(0, 10)
            const profilesFallback = await Promise.all(remaining.map((id) => fetchPublicVendorProfile(id)))
            for (const item of profilesFallback) {
              if (item && !byId.has(item.id)) {
                byId.set(item.id, item)
              }
            }

            if (!cancelled) {
              setVendorPreviewById((prev) => {
                const next = { ...prev }
                for (const id of stillMissing) {
                  if (next[id]) continue
                  const row = byId.get(id)
                  if (!row) continue
                  next[id] = {
                    id: row.id,
                    userId: row.userId || row.id,
                    name: row.name,
                    avatarUrl: row.avatar
                  }
                }
                return next
              })
            }
          }

          if (!cancelled) {
            const stillMissingNames = stillMissing.filter((id) => {
              const entry = vendorPreviewById[id]
              return !entry || !String(entry.name ?? '').trim()
            })

            if (stillMissingNames.length > 0) {
              const productIdsForHint = productAggRows
                .map((r) => r.productId)
                .filter(Boolean)
                .slice(0, 30)

              if (productIdsForHint.length > 0) {
                const hintProducts = await fetchPublicProductsByIds(productIdsForHint)
                if (!cancelled && hintProducts.length > 0) {
                  setVendorPreviewById((prev) => {
                    const next = { ...prev }
                    for (const p of hintProducts) {
                      const vid = String(p.vendorId ?? '').trim()
                      const name = String(p.sellerName ?? '').trim()
                      if (!vid || !name) continue
                      const existingName = String(next[vid]?.name ?? '').trim()
                      const canOverride = !existingName || existingName.toLowerCase().startsWith('vendeur')
                      if (!canOverride) continue
                      next[vid] = {
                        id: vid,
                        userId: vid,
                        name,
                        avatarUrl: String(p.sellerAvatar ?? '').trim()
                      }
                    }
                    return next
                  })
                }
              }
            }
          }
        }
      } catch {
        // noop
      }
    }

    void loadLookups()
    return () => {
      cancelled = true
    }
  }, [productAggRows, productPreviewById, vendorAggRows, vendorPreviewById])

  useEffect(() => {
    let cancelled = false

    const fillVendorNamesFromProducts = async () => {
      const productIds: string[] = []

      for (const row of vendorAggRows.slice(0, 50)) {
        const existingName = String(vendorPreviewById[row.vendorId]?.name ?? '').trim()
        const needsName = !existingName || existingName.toLowerCase().startsWith('vendeur')
        if (!needsName) continue

        const pid = String(row.sampleProductId ?? '').trim()
        if (!pid) continue

        const preview = productPreviewById[pid]
        const hintName = String(preview?.sellerName ?? '').trim()
        if (hintName) continue

        productIds.push(pid)
      }

      const uniqueProductIds = Array.from(new Set(productIds)).slice(0, 30)
      if (uniqueProductIds.length === 0) return

      const items = await fetchPublicProductsByIds(uniqueProductIds)
      if (cancelled || items.length === 0) return

      setProductPreviewById((prev) => {
        const next = { ...prev }
        for (const p of items) {
          const id = String(p.id ?? '').trim()
          if (!id) continue
          const existing = next[id]
          if (!existing) continue
          next[id] = {
            ...existing,
            sellerName: String(p.sellerName ?? '').trim() || existing.sellerName,
            sellerAvatar: String(p.sellerAvatar ?? '').trim() || existing.sellerAvatar
          }
        }
        return next
      })

      setVendorPreviewById((prev) => {
        const next = { ...prev }
        for (const p of items) {
          const vid = String(p.vendorId ?? '').trim()
          const name = String(p.sellerName ?? '').trim()
          if (!vid || !name) continue
          const existingName = String(next[vid]?.name ?? '').trim()
          const canOverride = !existingName || existingName.toLowerCase().startsWith('vendeur')
          if (!canOverride) continue
          next[vid] = {
            id: vid,
            userId: vid,
            name,
            avatarUrl: String(p.sellerAvatar ?? '').trim()
          }
        }
        return next
      })
    }

    void fillVendorNamesFromProducts()
    return () => {
      cancelled = true
    }
  }, [vendorAggRows, vendorPreviewById, productPreviewById])

  const mainStatsSection = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-700">Total Partages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-blue-900">
              {analytics?.total_shares || 0}
            </div>
            <Share2 className="w-10 h-10 text-blue-600" />
          </div>
          <p className="text-xs text-blue-600 mt-2">Produits partagés</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-700">Points Gagnés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-green-900">
              {analytics?.total_points_earned || 0}
            </div>
            <Award className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-xs text-green-600 mt-2">Points accumulés</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-700">Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-orange-900">
              {analytics?.total_interactions || 0}
            </div>
            <Eye className="w-10 h-10 text-orange-600" />
          </div>
          <p className="text-xs text-orange-600 mt-2">Vues et clics</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-purple-700">Taux Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold text-purple-900">
              {(analytics?.conversion_rate ?? 0).toFixed(1)}%
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
          <p className="text-xs text-purple-600 mt-2">Conversions</p>
        </CardContent>
      </Card>
    </div>
  )

  const sharesByPlatformSection = (
    <Card className="dark:border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-orange-600" />
          <span>Partages par Plateforme</span>
        </CardTitle>
        <CardDescription className="dark:text-gray-300">Vos plateformes préférées pour partager</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(analytics?.shares_by_platform || {}).length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Aucun partage pour le moment</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Commencez à partager des produits pour gagner des points!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(analytics?.shares_by_platform || {})
              .sort(([, a], [, b]) => b - a)
              .map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getPlatformIcon(platform)}
                    <div>
                      <p className="font-medium capitalize text-gray-900 dark:text-gray-100">{platform}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {((count / (analytics?.total_shares || 1)) * 100).toFixed(0)}% de vos partages
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Progress 
                      value={(count / (analytics?.total_shares || 1)) * 100} 
                      className="w-32"
                    />
                    <Badge className={getPlatformColor(platform)}>
                      {count}
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const shareImpactSection = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <span>Impact de vos Partages</span>
        </CardTitle>
        <CardDescription>Statistiques d'engagement sur vos partages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <Eye className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-900">
              {analytics?.interactions_by_type.view || 0}
            </div>
            <p className="text-xs text-blue-600 mt-1">Vues</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-900">
              {analytics?.interactions_by_type.click || 0}
            </div>
            <p className="text-xs text-green-600 mt-1">Clics</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
            <Zap className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-900">
              {analytics?.interactions_by_type.conversion || 0}
            </div>
            <p className="text-xs text-orange-600 mt-1">Conversions</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
            <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-900">
              {analytics?.interactions_by_type.purchase || 0}
            </div>
            <p className="text-xs text-purple-600 mt-1">Achats</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const shareHistorySection = (
    <Card className="dark:border-gray-800">
      <CardHeader>
        <CardTitle className="dark:text-gray-100">Historique des Partages</CardTitle>
        <CardDescription className="dark:text-gray-300">Vos derniers partages de produits</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-green-500" />
            <p className="text-gray-500 dark:text-gray-400 mt-2">Chargement...</p>
          </div>
        ) : shares.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Aucun partage pour le moment</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Partagez des produits pour gagner des points!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.slice(0, 15).map((share) => (
              <div
                key={share.id}
                role="button"
                tabIndex={0}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-950/40 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all cursor-pointer"
                onClick={() => openShareDetails(share)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openShareDetails(share)
                  }
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white dark:bg-gray-900/60 rounded-lg shadow-sm">
                    {getPlatformIcon(share.platform)}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {productPreviewById[String(share.product_id ?? '').trim()]?.name || 'Produit partagé'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(share.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-gray-700"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void handleCopyShareLink(share)
                    }}
                  >
                    {copiedShareId === String((share as any)?.id ?? '') ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <span className="text-xs font-medium">Copié</span>
                      </span>
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 dark:border-gray-700"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const url = String((share as any)?.share_url ?? '').trim()
                      if (url) window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Badge className={getPlatformColor(share.platform)}>
                    {share.platform}
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 font-semibold dark:bg-green-950/40 dark:text-green-200">
                    +{share.points_earned} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  const shareTipsSection = (
    shareTipsMessage && (
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">{shareTipsMessage.title || 'Gagnez Plus de Points!'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const content = String(shareTipsMessage.content || '')
            const filtered = content
              .split('\n')
              .filter((line) => {
                const l = line.toLowerCase()
                if (!l.trim()) return false
                if (l.includes('facebook')) return false
                if (l.includes('instagram')) return false
                if (l.includes('linkedin')) return false
                if (l.includes('twitter')) return false
                if (l.includes('whatsapp')) return false
                if (l.includes('bonus')) return false
                return true
              })
              .join('\n')
              .trim()

            if (!filtered) return null

            return (
              <div className="space-y-2 text-sm text-yellow-800 whitespace-pre-wrap">
                {filtered}
              </div>
            )
          })()}

          {adminPointsConfig && (
            <div className="mt-4 space-y-1 text-sm text-yellow-900">
              {(() => {
                const perNetwork = adminPointsConfig.socialSharePerNetwork || {}

                const facebook = perNetwork.facebook ?? adminPointsConfig.socialShareValue ?? 0
                const instagram = perNetwork.instagram ?? adminPointsConfig.socialShareValue ?? 0
                const linkedin = perNetwork.linkedin ?? adminPointsConfig.socialShareValue ?? 0
                const twitter = perNetwork.twitter ?? perNetwork.x ?? adminPointsConfig.socialShareValue ?? 0
                const whatsapp = perNetwork.whatsapp ?? adminPointsConfig.socialShareValue ?? 0

                const bonus = adminPointsConfig.purchaseValue ?? 0

                return (
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Facebook & Instagram</span>
                        <FaFacebook className="w-4 h-4 text-blue-600" />
                        <FaInstagram className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="font-semibold">{facebook === instagram ? facebook : `${facebook} / ${instagram}`} pts</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Linkedin</span>
                        <FaLinkedin className="w-4 h-4 text-blue-700" />
                      </div>
                      <span className="font-semibold">{linkedin} pts</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Twitter</span>
                        <FaXTwitter className="w-4 h-4 text-black" />
                      </div>
                      <span className="font-semibold">{twitter} pts</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">WhatsApp</span>
                        <FaWhatsapp className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-semibold">{whatsapp} pts</span>
                    </div>

                    <div className="pt-2 border-t border-yellow-200 flex items-center justify-between gap-3">
                      <span className="font-medium">Bonus</span>
                      <span className="font-semibold">+{bonus} pts si quelqu'un achète via votre lien</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    )
  )

  const periodSelect = (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-gray-600">Période</div>
      <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Choisir" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">7 derniers jours</SelectItem>
          <SelectItem value="30d">30 derniers jours</SelectItem>
          <SelectItem value="all">Depuis toujours</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const productsSharedSection = (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Produits partagés</CardTitle>
            <CardDescription>1 ligne par produit (agrégé) • synchronisé</CardDescription>
          </div>
          {periodSelect}
        </div>
      </CardHeader>
      <CardContent>
        {productAggRows.length === 0 ? (
          <div className="text-center py-10">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun produit partagé sur cette période</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Plateformes</TableHead>
                <TableHead>Partages</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Dernier partage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productAggRows.slice(0, 50).map((row) => {
                const product = productPreviewById[row.productId]
                const name = product?.name || `Produit ${row.productId.slice(0, 8)}`
                const imageUrl = product?.imageUrl || ''
                return (
                  <TableRow key={row.productId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden border">
                          {imageUrl ? (
                            <Image src={imageUrl} alt={name} width={40} height={40} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          <div className="text-xs text-gray-500">
                            <Link className="text-green-700 hover:underline" href={`/product/${row.productId}`}>
                              Voir la fiche
                            </Link>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(row.byPlatform)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([platform, count]) => (
                            <Badge key={platform} className={getPlatformColor(platform)}>
                              {platform}: {count}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700">{row.totalShares}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">+{row.pointsEarned} pts</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {row.lastSharedAt ? new Date(row.lastSharedAt).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )

  const vendorsSharedSection = (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Vendeurs partagés</CardTitle>
            <CardDescription>Vos vendeurs les plus partagés • synchronisé</CardDescription>
          </div>
          {periodSelect}
        </div>
      </CardHeader>
      <CardContent>
        {vendorAggRows.length === 0 ? (
          <div className="text-center py-10">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun vendeur sur cette période</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendeur</TableHead>
                <TableHead>Produits partagés</TableHead>
                <TableHead>Total partages</TableHead>
                <TableHead>Points gagnés</TableHead>
                <TableHead>Dernier partage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorAggRows.slice(0, 50).map((row) => {
                const vendor = vendorPreviewById[row.vendorId]
                const hintProduct = row.sampleProductId ? productPreviewById[row.sampleProductId] : undefined
                const hintName = String(hintProduct?.sellerName ?? '').trim()
                const name = vendor?.name || hintName || `Vendeur ${row.vendorId.slice(0, 8)}`
                const avatarUrl = vendor?.avatarUrl || ''
                const vendorLinkId = vendor?.userId || row.vendorId
                return (
                  <TableRow key={row.vendorId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden border">
                          {avatarUrl ? (
                            <Image src={avatarUrl} alt={name} width={40} height={40} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          <div className="text-xs text-gray-500">
                            <Link className="text-green-700 hover:underline" href={`/seller/${vendorLinkId}`}>
                              Voir le vendeur
                            </Link>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700">{row.distinctProducts}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700">{row.totalShares}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">+{row.pointsEarned} pts</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {row.lastSharedAt ? new Date(row.lastSharedAt).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )

  const statsSection = (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>Résumé sur la période sélectionnée</CardDescription>
            </div>
            {periodSelect}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Partages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{statsForPeriod.totalShares}</div>
                <p className="text-xs text-blue-600 mt-2">Sur la période</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{statsForPeriod.pointsEarned}</div>
                <p className="text-xs text-green-600 mt-2">Points gagnés</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Produits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{statsForPeriod.uniqueProducts}</div>
                <p className="text-xs text-purple-600 mt-2">Produits uniques</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-700">Vendeurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{statsForPeriod.uniqueVendors}</div>
                <p className="text-xs text-orange-600 mt-2">Vendeurs uniques</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Plateformes</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {statsForPeriod.bestPlatform ? `Top: ${statsForPeriod.bestPlatform}` : '—'}
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {Object.entries(statsForPeriod.byPlatform)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([platform, count]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/40 rounded-lg border dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      {getPlatformIcon(platform)}
                      <div className="font-medium capitalize text-gray-900 dark:text-gray-100">{platform}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={(count / Math.max(1, statsForPeriod.totalShares)) * 100} className="w-40" />
                      <Badge className={getPlatformColor(platform)}>{count}</Badge>
                    </div>
                  </div>
                ))}
              {Object.keys(statsForPeriod.byPlatform).length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée plateforme sur cette période.</div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Indicateur de synchronisation */}
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Synchronisation...</span>
        </div>
      )}

      {/* En-tête */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Share2 className="w-6 h-6 text-green-600" />
              <span className="text-green-800">Mes Partages</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                className="border-green-300 text-green-700 hover:bg-green-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-green-300 text-green-700 hover:bg-green-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-green-700">
            Suivez vos partages et gagnez des points - Synchronisé en temps réel
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="plateformes" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="plateformes">Partages par Plateforme</TabsTrigger>
          <TabsTrigger value="impact">Impact de vos Partages</TabsTrigger>
          <TabsTrigger value="historique">Historique des Partages</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="vendeurs">Vendeurs</TabsTrigger>
          {privacyPrefs.shareStats ? <TabsTrigger value="stats">Statistiques</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="plateformes" className="space-y-6">
          {mainStatsSection}
          {sharesByPlatformSection}
          {shareImpactSection}
          {shareHistorySection}
          {shareTipsSection}
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          {shareImpactSection}
        </TabsContent>

        <TabsContent value="historique" className="space-y-6">
          {shareHistorySection}
        </TabsContent>

        <TabsContent value="produits" className="space-y-6">
          {productsSharedSection}
        </TabsContent>

        <TabsContent value="vendeurs" className="space-y-6">
          {vendorsSharedSection}
        </TabsContent>

        {privacyPrefs.shareStats ? (
          <TabsContent value="stats" className="space-y-6">
            {statsSection}
          </TabsContent>
        ) : null}
      </Tabs>

      <ShareDetailsDialog
        open={shareDetailsOpen}
        onOpenChange={setShareDetailsOpen}
        share={selectedShare}
        interactions={shareInteractions}
        isLoadingInteractions={isLoadingShareInteractions}
        interactionsError={shareInteractionsError}
        onRetryLoadInteractions={selectedShare ? () => void loadShareInteractions(selectedShare.id) : undefined}
      />
    </div>
  )
}

// Wrapper avec Provider
export default function SharesSectionSynced({ userId }: SharesSectionSyncedProps) {
  return (
    <ShareEngagementProvider userId={userId} mode="user">
      <SharesSectionContent userId={userId} />
    </ShareEngagementProvider>
  )
}
