"use client"

/**
 * Section Partages et Engagement Synchronisée avec Supabase
 * Pour le tableau de bord VENDEUR
 */

 
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import {
  Copy,
  ExternalLink,
  Share2,
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  Download,
  Star,
  Target,
  Award,
  Zap,
  DollarSign,
  Crown,
  RefreshCw
} from 'lucide-react'
import { FaWhatsapp, FaFacebook, FaXTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useShareEngagement } from '@/contexts/ShareEngagementContext'
import { ShareEngagementProvider } from '@/contexts/ShareEngagementContext'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'
import { getClientAccessTokenSafe } from '@/lib/supabase'
import {
  ShareDetailsDialog,
  type ShareDetailsDialogInteraction,
  type ShareDetailsDialogShare
} from '@/components/shares/share-details-dialog'

interface SharesEngagementSectionProps {
  vendorId: string
}

type ProductPreview = {
  id: string
  name: string
  imageUrl: string
}

type UserPreview = {
  id: string
  name: string
  avatarUrl: string
}

/**
 * Hook utilitaire: enrichit une liste de partages avec des previews (produit/client)
 * via des routes API server-side (contourne RLS).
 */
function useSharePreviews(shares: any[]) {
  const [productPreviewById, setProductPreviewById] = useState<Record<string, ProductPreview>>({})
  const [userPreviewById, setUserPreviewById] = useState<Record<string, UserPreview>>({})

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const missingProductIds = Array.from(
        new Set(
          (shares ?? [])
            .map((s: any) => String(s?.product_id ?? '').trim())
            .filter((id) => id.length > 0)
            .filter((id) => !productPreviewById[id])
        )
      ).slice(0, 50)

      const missingUserIds = Array.from(
        new Set(
          (shares ?? [])
            .map((s: any) => String(s?.user_id ?? '').trim())
            .filter((id) => id.length > 0)
            .filter((id) => !userPreviewById[id])
        )
      ).slice(0, 80)

      if (missingProductIds.length > 0) {
        const products = await fetchPublicProductsByIds(missingProductIds)
        if (!cancelled && products.length > 0) {
          setProductPreviewById((prev) => {
            const next = { ...prev }
            for (const p of products) {
              next[p.id] = p
            }
            return next
          })
        }
      }

      if (missingUserIds.length > 0) {
        const users = await fetchPublicUsersByIds(missingUserIds)
        if (!cancelled && users.length > 0) {
          setUserPreviewById((prev) => {
            const next = { ...prev }
            for (const u of users) {
              next[u.id] = u
            }
            return next
          })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [shares, productPreviewById, userPreviewById])

  return { productPreviewById, userPreviewById }
}

/**
 * Récupère les infos publiques produit (nom + image) via l'API server-side pour contourner RLS.
 */
async function fetchPublicProductsByIds(productIds: string[]): Promise<ProductPreview[]> {
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
        return { id, name, imageUrl }
      })
      .filter(Boolean) as ProductPreview[]
  } catch {
    return []
  }
}

/**
 * Récupère un aperçu public des clients (nom + avatar) via l'API server-side pour contourner RLS.
 */
async function fetchPublicUsersByIds(userIds: string[]): Promise<UserPreview[]> {
  try {
    const ids = (userIds ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 80)
    if (ids.length === 0) return []
    const res = await fetch(`/api/public/users/preview?ids=${encodeURIComponent(ids.join(','))}`, {
      method: 'GET',
      cache: 'no-store'
    })
    const json = await res.json().catch(() => null)
    const items = json?.data
    if (!Array.isArray(items)) return []
    return items
      .map((row: any) => {
        const id = String(row?.id ?? '').trim()
        if (!id) return null
        const name = String(row?.name ?? '').trim() || 'Client'
        const avatarUrl = String(row?.avatar ?? '').trim()
        return { id, name, avatarUrl }
      })
      .filter(Boolean) as UserPreview[]
  } catch {
    return []
  }
}

function SharesHeader() {
  const {
    shares,
    isLoading,
    isSyncing,
    refreshShares,
    refreshAnalytics
  } = useShareEngagement()

  const searchParams = useSearchParams()

  const handleRefresh = async () => {
    await Promise.all([refreshShares(), refreshAnalytics()])
  }

  const handleExport = () => {
    void (async () => {
      try {
        const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
        const headers: Record<string, string> = {}
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const params = new URLSearchParams()
        const start = String(searchParams?.get('start') ?? '').trim()
        const end = String(searchParams?.get('end') ?? '').trim()
        const platform = String(searchParams?.get('platform') ?? '').trim()
        if (start) params.set('start', start)
        if (end) params.set('end', end)
        if (platform) params.set('platform', platform)

        const endpointUrl = params.toString() ? `/api/vendor/shares/export?${params.toString()}` : '/api/vendor/shares/export'

        const res = await fetch(endpointUrl, {
          method: 'GET',
          cache: 'no-store',
          headers
        })

        if (!res.ok) {
          return
        }

        const blob = await res.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `Partages-Vendeur-${new Date().toISOString().split('T')[0]}.zip`
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      } catch {
        // noop
      }
    })()
  }

  return (
    <>
      {isSyncing && (
        <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Synchronisation...</span>
        </div>
      )}

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Share2 className="w-6 h-6 text-purple-600" />
              <span className="text-purple-800">Partages et Engagement</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-purple-300 text-purple-700 hover:bg-purple-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-purple-300 text-purple-700 hover:bg-purple-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Suivez les partages de vos produits en temps réel
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  )
}

function UserSharesPanel({ panel }: { panel: 'plateformes' | 'impact' | 'historique' }) {
  const {
    shares,
    analytics,
    isLoading,
    isSyncing,
    refreshShares,
    refreshAnalytics
  } = useShareEngagement()

  const { productPreviewById, userPreviewById } = useSharePreviews(shares as any[])

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
    const userId = String(share?.user_id ?? '').trim()
    const productName = productPreviewById[productId]?.name || `Produit #${productId.substring(0, 8)}`
    const productImage = productPreviewById[productId]?.imageUrl || ''
    const shareUserName = userPreviewById[userId]?.name || `client #${userId.substring(0, 8)}`
    const shareUserAvatar = userPreviewById[userId]?.avatarUrl || ''

    const mapped: ShareDetailsDialogShare = {
      id: shareId,
      createdAt: String(share?.created_at ?? ''),
      platform: String(share?.platform ?? ''),
      shareUrl: String(share?.share_url ?? ''),
      pointsEarned: Number(share?.points_earned ?? 0),
      shareUserName,
      shareUserAvatar,
      productId,
      productName,
      productImage,
      productVendorName: 'Votre boutique',
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

  const copyShareLink = async (share: any) => {
    try {
      const value = String((share as any)?.share_url ?? '').trim()
      if (!value) return

      const shareId = String((share as any)?.id ?? '').trim()
      const productId = String((share as any)?.product_id ?? '').trim()

      // Best-effort: enregistrer un partage traçable sans points (copy).
      try {
        const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        // NB: vendorId peut être vide; l'API résout le vendeur depuis le produit.
        await fetch('/api/shares/record', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId,
            vendorId: '',
            platform: 'copy',
            shareUrl: value,
            awardPoints: false
          }),
          cache: 'no-store'
        }).catch(() => null)
      } catch {
        // noop
      }

      await navigator.clipboard.writeText(value)
      setCopiedShareId(shareId || value)

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

  const trackVendorOpen = async (shareId: string, interactionType: 'click' | 'open') => {
    try {
      const sid = String(shareId ?? '').trim()
      if (!sid) return

      const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`

      await fetch('/api/shares/track', {
        method: 'POST',
        headers,
        cache: 'no-store',
        body: JSON.stringify({ shareId: sid, interactionType })
      }).catch(() => null)
    } catch {
      // noop
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refreshShares(), refreshAnalytics()])
  }

  const handleExport = () => {
    void (async () => {
      try {
        const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
        const headers: Record<string, string> = {}
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const params = new URLSearchParams()
        const start = String(searchParams?.get('start') ?? '').trim()
        const end = String(searchParams?.get('end') ?? '').trim()
        const platform = String(searchParams?.get('platform') ?? '').trim()
        if (start) params.set('start', start)
        if (end) params.set('end', end)
        if (platform) params.set('platform', platform)

        const endpointUrl = params.toString() ? `/api/vendor/shares/export?${params.toString()}` : '/api/vendor/shares/export'

        const res = await fetch(endpointUrl, {
          method: 'GET',
          cache: 'no-store',
          headers
        })

        if (!res.ok) {
          return
        }

        const blob = await res.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `Partages-Vendeur-${new Date().toISOString().split('T')[0]}.zip`
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      } catch {
        // noop
      }
    })()
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <FaFacebook className="w-4 h-4 text-blue-600" />
      case 'twitter': return <FaXTwitter className="w-4 h-4 text-black" />
      case 'whatsapp': return <FaWhatsapp className="w-4 h-4 text-green-600" />
      case 'instagram': return <FaInstagram className="w-4 h-4 text-pink-600" />
      case 'linkedin': return <FaLinkedin className="w-4 h-4 text-blue-700" />
      default: return <Share2 className="w-4 h-4" />
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

  const mainStatsSection = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-700">Total Partages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-900">
              {analytics?.total_shares || 0}
            </div>
            <Share2 className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-xs text-blue-600 mt-2">Tous les partages</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-green-700">Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-green-900">
              {analytics?.total_interactions || 0}
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-xs text-green-600 mt-2">Vues et clics</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-orange-700">Taux Conversion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-orange-900">
              {(analytics?.conversion_rate ?? 0).toFixed(1)}%
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
          <p className="text-xs text-orange-600 mt-2">Conversions</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-purple-700">Points Générés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-purple-900">
              {analytics?.total_points_earned || 0}
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-xs text-purple-600 mt-2">Points attribués</p>
        </CardContent>
      </Card>
    </div>
  )

  const sharesByPlatformSection = (
    <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          <span>Partages par Plateforme</span>
        </CardTitle>
        <CardDescription>Répartition des partages sur les réseaux sociaux</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(analytics?.shares_by_platform || {}).length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun partage pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(analytics?.shares_by_platform || {})
              .sort(([, a], [, b]) => b - a)
              .map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    {getPlatformIcon(platform)}
                    <span className="font-medium capitalize">{platform}</span>
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

  const interactionsSection = (
    <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-fuchsia-600" />
          <span>Impact des Partages</span>
        </CardTitle>
        <CardDescription>Analyse des interactions sur les partages de vos produits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-700">
                {analytics?.interactions_by_type.view || 0}
              </Badge>
            </div>
            <p className="text-sm font-medium text-blue-900">Vues</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-700">
                {analytics?.interactions_by_type.click || 0}
              </Badge>
            </div>
            <p className="text-sm font-medium text-green-900">Clics</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-700">
                {analytics?.interactions_by_type.conversion || 0}
              </Badge>
            </div>
            <p className="text-sm font-medium text-orange-900">Conversions</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-700">
                {analytics?.interactions_by_type.purchase || 0}
              </Badge>
            </div>
            <p className="text-sm font-medium text-purple-900">Achats</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const recentSharesSection = (
    <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
      <CardHeader>
        <CardTitle>Historique des Partages</CardTitle>
        <CardDescription>Derniers partages de vos produits</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500" />
            <p className="text-gray-500 mt-2">Chargement...</p>
          </div>
        ) : shares.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun partage pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.slice(0, 10).map((share) => (
              <div
                key={share.id}
                role="button"
                tabIndex={0}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => openShareDetails(share)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openShareDetails(share)
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {getPlatformIcon(share.platform)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {productPreviewById[String(share.product_id ?? '').trim()]?.name || `Produit #${String(share.product_id ?? '').substring(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Par {userPreviewById[String(share.user_id ?? '').trim()]?.name || `client #${String(share.user_id ?? '').substring(0, 8)}`} · {' '}
                      {new Date(share.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
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
                    className="border-slate-200"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void copyShareLink(share)
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
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const url = String((share as any)?.share_url ?? '').trim()
                      const shareId = String((share as any)?.id ?? '').trim()
                      if (shareId) {
                        void trackVendorOpen(shareId, 'click')
                        void trackVendorOpen(shareId, 'open')
                      }
                      if (url) window.open(url, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Badge className={getPlatformColor(share.platform)}>
                    {share.platform}
                  </Badge>
                  <Badge className="bg-green-100 text-green-700">
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

  const panelContent = (() => {
    if (panel === 'impact') return interactionsSection
    if (panel === 'historique') return recentSharesSection
    return (
      <>
        {mainStatsSection}
        {sharesByPlatformSection}
        {interactionsSection}
        {recentSharesSection}
      </>
    )
  })()

  return (
    <>
      {panelContent}
      <ShareDetailsDialog
        open={shareDetailsOpen}
        onOpenChange={setShareDetailsOpen}
        share={selectedShare}
        interactions={shareInteractions}
        isLoadingInteractions={isLoadingShareInteractions}
        interactionsError={shareInteractionsError}
        onRetryLoadInteractions={selectedShare ? () => void loadShareInteractions(selectedShare.id) : undefined}
      />
    </>
  )
}

function VendorInsightsPanel() {
  const { shares, analytics } = useShareEngagement()
  const { productPreviewById, userPreviewById } = useSharePreviews(shares as any[])

  const searchParams = useSearchParams()

  const [serverSummary, setServerSummary] = useState<any | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const accessToken = String((await getClientAccessTokenSafe()) ?? '').trim()
        const headers: Record<string, string> = {}
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`

        const params = new URLSearchParams()
        const start = String(searchParams?.get('start') ?? '').trim()
        const end = String(searchParams?.get('end') ?? '').trim()
        const platform = String(searchParams?.get('platform') ?? '').trim()
        if (start) params.set('start', start)
        if (end) params.set('end', end)
        if (platform) params.set('platform', platform)

        const url = params.toString() ? `/api/vendor/shares/summary?${params.toString()}` : '/api/vendor/shares/summary'

        const res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers
        })

        const json = await res.json().catch(() => null)
        if (!res.ok) return
        if (cancelled) return
        setServerSummary(json?.data ?? null)
      } catch {
        // noop
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <FaFacebook className="w-4 h-4 text-blue-600" />
      case 'twitter': return <FaXTwitter className="w-4 h-4 text-black" />
      case 'whatsapp': return <FaWhatsapp className="w-4 h-4 text-green-600" />
      case 'instagram': return <FaInstagram className="w-4 h-4 text-pink-600" />
      case 'linkedin': return <FaLinkedin className="w-4 h-4 text-blue-700" />
      default: return <Share2 className="w-4 h-4" />
    }
  }

  const insightsSection = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Users className="w-5 h-5 text-indigo-700" />
              <span>Top clients partageurs</span>
            </CardTitle>
            <CardDescription className="text-indigo-700">Qui partage le plus vos produits</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const rows = Array.isArray(serverSummary?.topCustomers)
                ? (serverSummary.topCustomers as Array<any>).map((r) => [String(r?.userId ?? ''), Number(r?.shares ?? 0)] as const)
                : (() => {
                    const byUser = new Map<string, number>()
                    for (const s of shares) {
                      byUser.set(s.user_id, (byUser.get(s.user_id) || 0) + 1)
                    }
                    return Array.from(byUser.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
                  })()

              if (rows.length === 0) {
                return <p className="text-sm text-indigo-800">Aucune donnée</p>
              }

              return (
                <div className="space-y-3">
                  {rows.map(([u, c], idx) => (
                    <div key={u} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-indigo-200">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-indigo-600 text-white text-xs">#{idx + 1}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-indigo-900">{userPreviewById[u]?.name || `Client ${u.substring(0, 8)}`}</p>
                          <p className="text-xs text-indigo-700">Partages</p>
                        </div>
                      </div>
                      <Badge className="bg-indigo-600 text-white">{c}</Badge>
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Crown className="w-5 h-5 text-emerald-700" />
              <span>Top produits partagés</span>
            </CardTitle>
            <CardDescription className="text-emerald-700">Vos produits les plus partagés</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const rows = Array.isArray(serverSummary?.topProducts)
                ? (serverSummary.topProducts as Array<any>).map((r) => [String(r?.productId ?? ''), Number(r?.shares ?? 0)] as const)
                : (() => {
                    const byProduct = new Map<string, number>()
                    for (const s of shares) {
                      byProduct.set(s.product_id, (byProduct.get(s.product_id) || 0) + 1)
                    }
                    return Array.from(byProduct.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
                  })()

              if (rows.length === 0) {
                return <p className="text-sm text-emerald-800">Aucune donnée</p>
              }

              return (
                <div className="space-y-3">
                  {rows.map(([p, c]) => (
                    <div key={p} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-emerald-200">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">{productPreviewById[p]?.name || `Produit ${p.substring(0, 8)}`}</p>
                        <p className="text-xs text-emerald-700">Partages</p>
                      </div>
                      <Badge className="bg-emerald-600 text-white">{c}</Badge>
                    </div>
                  ))}
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 border-fuchsia-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-fuchsia-900">
              <Share2 className="w-5 h-5 text-fuchsia-700" />
              <span>Réseaux dominants</span>
            </CardTitle>
            <CardDescription className="text-fuchsia-700">Où vos produits performent le mieux</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics?.shares_by_platform || {}).length === 0 ? (
              <p className="text-sm text-fuchsia-800">Aucune donnée</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(analytics?.shares_by_platform || {})
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([platform, count]) => (
                    <div key={platform} className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-fuchsia-200">
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-semibold text-fuchsia-900">{platform}</span>
                        {getPlatformIcon(platform)}
                      </div>
                      <Badge className="bg-fuchsia-600 text-white">{count}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600" />
            <span>Lecture rapide</span>
          </CardTitle>
          <CardDescription>Une synthèse simple, mais très complète</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
              <p className="text-sm font-semibold text-amber-900">Clients uniques</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{Number(serverSummary?.totals?.uniqueCustomers ?? new Set(shares.map(s => s.user_id)).size)}</p>
              <p className="text-xs text-amber-700 mt-2">Nombre de clients qui ont partagé au moins une fois</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200">
              <p className="text-sm font-semibold text-cyan-900">Produits uniques</p>
              <p className="text-2xl font-bold text-cyan-900 mt-1">{Number(serverSummary?.totals?.uniqueProducts ?? new Set(shares.map(s => s.product_id)).size)}</p>
              <p className="text-xs text-cyan-700 mt-2">Nombre de produits de votre boutique partagés</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
              <p className="text-sm font-semibold text-rose-900">Réseaux utilisés</p>
              <p className="text-2xl font-bold text-rose-900 mt-1">{Object.keys(analytics?.shares_by_platform || {}).length}</p>
              <p className="text-xs text-rose-700 mt-2">Nombre de plateformes où vos produits ont été partagés</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return insightsSection
}

// Wrapper avec Provider
export default function SharesEngagementSectionSynced({ vendorId }: SharesEngagementSectionProps) {
  const { privacyPrefs } = useUserPreferences()
  const [activeTab, setActiveTab] = useState<'plateformes' | 'impact' | 'historique' | 'insights'>('plateformes')
  const headerProvider = (
    <ShareEngagementProvider vendorId={vendorId} mode="vendor">
      <SharesHeader />
    </ShareEngagementProvider>
  )

  return (
    <div className="space-y-6">
      {headerProvider}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="plateformes">Partages par Plateforme</TabsTrigger>
          <TabsTrigger value="impact">Impact de vos Partages</TabsTrigger>
          <TabsTrigger value="historique">Historique des Partages</TabsTrigger>
          {privacyPrefs.shareStats ? <TabsTrigger value="insights">Analyses & Classements</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="plateformes" className="space-y-6">
          <ShareEngagementProvider userId={vendorId} mode="user">
            <UserSharesPanel panel="plateformes" />
          </ShareEngagementProvider>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <ShareEngagementProvider userId={vendorId} mode="user">
            <UserSharesPanel panel="impact" />
          </ShareEngagementProvider>
        </TabsContent>

        <TabsContent value="historique" className="space-y-6">
          <ShareEngagementProvider userId={vendorId} mode="user">
            <UserSharesPanel panel="historique" />
          </ShareEngagementProvider>
        </TabsContent>

        {privacyPrefs.shareStats ? (
          <TabsContent value="insights" className="space-y-6">
            <ShareEngagementProvider vendorId={vendorId} mode="vendor">
              <VendorInsightsPanel />
            </ShareEngagementProvider>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  )
}
