"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Share2,
  Zap,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  Download,
  Copy,
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ClientAuthService } from '@/lib/services/client-auth-service'
import { ShareDetailsDialog } from '@/components/shares/share-details-dialog'

type SharesSummary = {
  totals: {
    shares: number
    interactions: number
    pointsFromShares: number
    pointsFromInteractions: number
    pointsTotal: number
  }
  byPlatform: Array<{ platform: string; shares: number; points: number }>
  byInteractionType: Array<{ type: string; count: number }>
}

type SharesListItem = {
  id: string
  createdAt: string
  platform: string
  shareUrl: string
  pointsEarned: number
  shareUserId: string
  shareUserName: string
  shareUserAvatar: string
  shareUserRole: string
  productId: string
  productName: string
  productImage: string
  productVendorId: string
  productVendorName: string
  interactionsCount: number
  interactionTypes: Record<string, number>
  pointsFromInteractions: number
}

type SharesListResponse = {
  rows: SharesListItem[]
  page: number
  pageSize: number
}

type InteractionRow = {
  id: string
  createdAt: string
  type: string
  shareId: string
  shareUserId: string
  productId: string
  platform: string
  ip: string
  userAgent: string
  referrer: string
}

type InteractionsResponse = {
  rows: InteractionRow[]
  page: number
  pageSize: number
}

const PLATFORM_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Toutes' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'X / Twitter' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'email', label: 'Email' },
  { value: 'copy', label: 'Copie lien' }
]

const INTERACTION_TYPE_OPTIONS: Array<{ value: string; label: string; icon: any }> = [
  { value: 'all', label: 'Tous', icon: Zap },
  { value: 'view', label: 'Vues', icon: Eye },
  { value: 'click', label: 'Clics', icon: MousePointerClick },
  { value: 'conversion', label: 'Conversions', icon: TrendingUp },
  { value: 'purchase', label: 'Achats', icon: ShoppingCart }
]

function safeToIso(value: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString()
}

/**
 * Convertit une date de fin de filtre en borne haute inclusive.
 * Un <input type="date"> renvoie "yyyy-mm-dd" (minuit) : on l'étend à la fin de la journée
 * (23:59:59.999) pour ne pas exclure toutes les données de ce jour.
 */
function safeToEndOfDayIso(value: string): string {
  if (!value) return ''
  const raw = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T23:59:59.999Z`)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return safeToIso(raw)
}

function formatDateTimeFr(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPlatformBadgeClass(platform: string): string {
  const p = String(platform || '').toLowerCase().trim()
  if (p === 'whatsapp') return 'bg-green-100 text-green-700'
  if (p === 'facebook') return 'bg-blue-100 text-blue-700'
  if (p === 'instagram') return 'bg-pink-100 text-pink-700'
  if (p === 'linkedin') return 'bg-sky-100 text-sky-700'
  if (p === 'twitter') return 'bg-slate-100 text-slate-700'
  if (p === 'tiktok') return 'bg-neutral-100 text-neutral-800'
  if (p === 'email') return 'bg-amber-100 text-amber-800'
  if (p === 'copy') return 'bg-violet-100 text-violet-800'
  return 'bg-gray-100 text-gray-700'
}

function buildCsv(rows: Array<Array<string | number>>): string {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const raw = String(cell ?? '')
          const escaped = raw.replace(/"/g, '""')
          return `"${escaped}"`
        })
        .join(',')
    )
    .join('\n')
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
/**
 * Section Super Admin: Partages & Engagements.
 * Centralise tous les partages (clients + vendeurs) + interactions (vues/clics/conversions/achats),
 * avec filtres, liste détaillée, analytics et export.
 */
export default function SharesEngagementSuperAdmin() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'partages' | 'interactions'>('analytics')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<SharesSummary | null>(null)
  const [shares, setShares] = useState<SharesListResponse>({ rows: [], page: 1, pageSize: 25 })
  const [interactions, setInteractions] = useState<InteractionsResponse>({ rows: [], page: 1, pageSize: 25 })

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [platform, setPlatform] = useState('all')
  const [search, setSearch] = useState('')

  const [userId, setUserId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [productId, setProductId] = useState('')

  const [interactionType, setInteractionType] = useState('all')

  const [pageShares, setPageShares] = useState(1)
  const [pageInteractions, setPageInteractions] = useState(1)

  const [shareDetailsOpen, setShareDetailsOpen] = useState(false)
  const [selectedShare, setSelectedShare] = useState<SharesListItem | null>(null)
  const [shareInteractions, setShareInteractions] = useState<InteractionRow[]>([])
  const [isLoadingShareInteractions, setIsLoadingShareInteractions] = useState(false)
  const [shareInteractionsError, setShareInteractionsError] = useState<string | null>(null)

  const [copiedShareId, setCopiedShareId] = useState<string | null>(null)
  const copiedResetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copiedResetTimerRef.current) {
        window.clearTimeout(copiedResetTimerRef.current)
        copiedResetTimerRef.current = null
      }
    }
  }, [])

  const copyShareUrl = useCallback(async (share: SharesListItem) => {
    try {
      const url = String(share?.shareUrl ?? '').trim()
      if (!url) return
      await navigator.clipboard.writeText(url)
      setCopiedShareId(String(share?.id ?? ''))

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
  }, [])

  const lastFetchId = useRef(0)
  const searchDebounceRef = useRef<number | null>(null)

  const filtersKey = useMemo(() => {
    return JSON.stringify({ startDate, endDate, platform, search, userId, vendorId, productId, interactionType })
  }, [startDate, endDate, platform, search, userId, vendorId, productId, interactionType])

  /** Construit les query params standardisés pour les endpoints Super Admin. */
  const buildParams = useCallback(
    (opts: { kind: 'summary' | 'shares' | 'interactions'; page?: number; pageSize?: number }) => {
      const params = new URLSearchParams()

      const start = safeToIso(startDate)
      const end = safeToEndOfDayIso(endDate)

      if (start) params.set('start', start)
      if (end) params.set('end', end)

      if (platform && platform !== 'all') params.set('platform', platform)

      if (opts.kind === 'shares') {
        params.set('page', String(opts.page ?? 1))
        params.set('pageSize', String(opts.pageSize ?? 25))
        if (search.trim().length >= 2) params.set('search', search.trim())
        if (userId.trim()) params.set('userId', userId.trim())
        if (vendorId.trim()) params.set('vendorId', vendorId.trim())
        if (productId.trim()) params.set('productId', productId.trim())
      }

      if (opts.kind === 'interactions') {
        params.set('page', String(opts.page ?? 1))
        params.set('pageSize', String(opts.pageSize ?? 25))
        if (interactionType && interactionType !== 'all') params.set('type', interactionType)
      }

      return params
    },
    [startDate, endDate, platform, search, userId, vendorId, productId, interactionType]
  )

  /**
   * Charge analytics + liste partages + interactions.
   * Best effort pour une UI fluide: on garde l’écran réactif et on ignore les réponses obsolètes.
   */
  const refreshAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const fetchId = ++lastFetchId.current

    try {
      const headers = await ClientAuthService.buildAuthHeaders()

      const summaryParams = buildParams({ kind: 'summary' })
      const sharesParams = buildParams({ kind: 'shares', page: pageShares, pageSize: shares.pageSize })
      const interactionsParams = buildParams({ kind: 'interactions', page: pageInteractions, pageSize: interactions.pageSize })

      const [summaryRes, sharesRes, interactionsRes] = await Promise.all([
        fetch(`/api/super-admin/shares/summary?${summaryParams.toString()}`, { headers, cache: 'no-store' }),
        fetch(`/api/super-admin/shares/list?${sharesParams.toString()}`, { headers, cache: 'no-store' }),
        fetch(`/api/super-admin/shares/interactions?${interactionsParams.toString()}`, { headers, cache: 'no-store' })
      ])

      const summaryJson = await summaryRes.json().catch(() => null)
      const sharesJson = await sharesRes.json().catch(() => null)
      const interactionsJson = await interactionsRes.json().catch(() => null)

      if (fetchId !== lastFetchId.current) return

      // Remonte l'erreur métier des routes (401/500) au lieu d'afficher des cartes à 0 silencieusement.
      const firstRouteError =
        (!summaryRes.ok && typeof summaryJson?.error === 'string' && summaryJson.error) ||
        (!sharesRes.ok && typeof sharesJson?.error === 'string' && sharesJson.error) ||
        (!interactionsRes.ok && typeof interactionsJson?.error === 'string' && interactionsJson.error) ||
        null
      setError(firstRouteError ? `Erreur serveur : ${String(firstRouteError)}` : null)

      if (!summaryRes.ok) {
        setSummary(null)
      } else {
        setSummary((summaryJson?.data ?? null) as SharesSummary | null)
      }

      const sharesData = (sharesJson?.data ?? null) as SharesListResponse | null
      if (sharesRes.ok && sharesData?.rows) {
        setShares(sharesData)
      } else {
        setShares((prev) => ({ ...prev, rows: [] }))
      }

      const interactionsData = (interactionsJson?.data ?? null) as InteractionsResponse | null
      if (interactionsRes.ok && interactionsData?.rows) {
        setInteractions(interactionsData)
      } else {
        setInteractions((prev) => ({ ...prev, rows: [] }))
      }
    } catch (e) {
      if (fetchId !== lastFetchId.current) return
      const message = e instanceof Error ? e.message : 'Erreur lors du chargement.'
      setError(message)
    } finally {
      if (fetchId !== lastFetchId.current) return
      setIsLoading(false)
    }
  }, [buildParams, pageShares, pageInteractions, shares.pageSize, interactions.pageSize])

  /**
   * Charge les interactions détaillées pour un partage (modal).
   * On charge large (200) pour donner une vue complète sans multipages (suffisant pour la plupart des cas).
   */
  const loadShareInteractions = useCallback(async (shareId: string) => {
    const sid = String(shareId || '').trim()
    if (!sid) return

    setIsLoadingShareInteractions(true)
    setShareInteractionsError(null)

    try {
      const headers = await ClientAuthService.buildAuthHeaders()
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('pageSize', '200')
      params.set('shareId', sid)

      const res = await fetch(`/api/super-admin/shares/interactions?${params.toString()}`, {
        method: 'GET',
        headers,
        cache: 'no-store'
      })

      const json = await res.json().catch(() => null)
      const rows = (json?.data?.rows ?? []) as InteractionRow[]

      if (!res.ok) {
        setShareInteractions([])
        const message =
          (typeof json?.error === 'string' && json.error) ||
          (json?.error && typeof json.error?.message === 'string' && json.error.message) ||
          "Impossible de charger les interactions."
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
  }, [])

  /** Ouvre le modal et charge les interactions de manière fluide. */
  const openShareDetails = useCallback(
    async (share: SharesListItem) => {
      setSelectedShare(share)
      setShareDetailsOpen(true)
      setShareInteractions([])
      void loadShareInteractions(share.id)
    },
    [loadShareInteractions]
  )

  useEffect(() => {
    if (!shareDetailsOpen) {
      setSelectedShare(null)
      setShareInteractions([])
      setShareInteractionsError(null)
      setIsLoadingShareInteractions(false)
    }
  }, [shareDetailsOpen])

  /** Réinitialise les pages quand les filtres changent. */
  useEffect(() => {
    setPageShares(1)
    setPageInteractions(1)
  }, [filtersKey])

  /** Déclenche un refresh à chaque changement de page/filtre, avec debounce pour la recherche. */
  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }

    // Si la recherche est en train d’être tapée, on debouce.
    if (search.trim().length >= 2) {
      searchDebounceRef.current = window.setTimeout(() => {
        searchDebounceRef.current = null
        void refreshAll()
      }, 300)
      return
    }

    void refreshAll()
  }, [refreshAll, pageShares, pageInteractions, filtersKey])

  /**
   * Récupère TOUTES les pages d'un endpoint paginé (plafond de sécurité à 5000 lignes)
   * afin d'exporter le jeu complet filtré et non la seule page affichée.
   */
  const fetchAllPagedRows = useCallback(
    async (kind: 'shares' | 'interactions', maxRows = 5000): Promise<Array<Record<string, any>>> => {
      const pageSize = 100
      const all: Array<Record<string, any>> = []
      const headers = await ClientAuthService.buildAuthHeaders()

      for (let page = 1; all.length < maxRows; page += 1) {
        const params = buildParams({ kind, page, pageSize })
        const endpoint = kind === 'shares' ? '/api/super-admin/shares/list' : '/api/super-admin/shares/interactions'
        const res = await fetch(`${endpoint}?${params.toString()}`, { headers, cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (!res.ok) {
          const message = (typeof json?.error === 'string' && json.error) || 'Erreur lors de la récupération des données.'
          throw new Error(String(message))
        }
        const rows = (json?.data?.rows ?? []) as Array<Record<string, any>>
        all.push(...rows)
        if (rows.length < pageSize) break
      }

      return all.slice(0, maxRows)
    },
    [buildParams]
  )

  /** Export CSV des partages enrichis (nom user / produit / vendeur / points / interactions) — jeu complet filtré. */
  const exportSharesCsv = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const allRows = await fetchAllPagedRows('shares')

      const header = ['Date', 'Plateforme', 'Utilisateur', 'Rôle', 'Produit', 'Vendeur', 'Points partage', 'Interactions', 'Points interactions', 'URL']
      const rows = allRows.map((s: any) => [
        formatDateTimeFr(String(s?.createdAt ?? '')),
        String(s?.platform ?? ''),
        String(s?.shareUserName ?? ''),
        String(s?.shareUserRole ?? ''),
        String(s?.productName ?? ''),
        String(s?.productVendorName ?? ''),
        Number(s?.pointsEarned ?? 0),
        Number(s?.interactionsCount ?? 0),
        Number(s?.pointsFromInteractions ?? 0),
        String(s?.shareUrl ?? '')
      ])

      const csv = buildCsv([header, ...rows])
      downloadCsv(`super-admin-partages-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'export CSV des partages.")
    } finally {
      setIsLoading(false)
    }
  }, [fetchAllPagedRows])

  /** Export CSV des interactions — jeu complet filtré. */
  const exportInteractionsCsv = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const allRows = await fetchAllPagedRows('interactions')

      const header = ['Date', 'Type', 'Plateforme', 'ShareId', 'UserId partage', 'ProductId', 'IP', 'Referrer']
      const rows = allRows.map((r: any) => [
        formatDateTimeFr(String(r?.createdAt ?? '')),
        String(r?.type ?? ''),
        String(r?.platform ?? ''),
        String(r?.shareId ?? ''),
        String(r?.shareUserId ?? ''),
        String(r?.productId ?? ''),
        String(r?.ip ?? ''),
        String(r?.referrer ?? '')
      ])

      const csv = buildCsv([header, ...rows])
      downloadCsv(`super-admin-interactions-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'export CSV des interactions.")
    } finally {
      setIsLoading(false)
    }
  }, [fetchAllPagedRows])

  const totals = summary?.totals ?? {
    shares: 0,
    interactions: 0,
    pointsFromShares: 0,
    pointsFromInteractions: 0,
    pointsTotal: 0
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Share2 className="h-6 w-6 text-indigo-700" />
              <span className="text-indigo-900">Partages & Engagements</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refreshAll()}
                disabled={isLoading}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="text-indigo-700">
            Centralisation complète des partages et de toutes les interactions (clients + vendeurs), synchronisée avec la base.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card className="bg-white/70 border-indigo-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700">Partages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-indigo-900">{totals.shares}</div>
                  <Share2 className="h-7 w-7 text-indigo-600" />
                </div>
                <p className="text-xs text-indigo-700 mt-2">Total (période filtrée)</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 border-emerald-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-emerald-900">{totals.interactions}</div>
                  <Zap className="h-7 w-7 text-emerald-600" />
                </div>
                <p className="text-xs text-emerald-700 mt-2">Vues, clics, conversions, achats</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 border-amber-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">Points partages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-amber-900">{totals.pointsFromShares}</div>
                  <BarChart3 className="h-7 w-7 text-amber-600" />
                </div>
                <p className="text-xs text-amber-700 mt-2">Points gagnés pour partage</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 border-fuchsia-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-fuchsia-700">Points total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-fuchsia-900">{totals.pointsTotal}</div>
                  <TrendingUp className="h-7 w-7 text-fuchsia-600" />
                </div>
                <p className="text-xs text-fuchsia-700 mt-2">Partages + engagements</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Début</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fin</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Plateforme</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Recherche (utilisateur / produit / email)</label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ex: Jean, iphone, gmail..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filtres avancés (IDs)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID" />
                <Input value={vendorId} onChange={(e) => setVendorId(e.target.value)} placeholder="Vendor ID" />
                <Input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Product ID" />
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Filter className="h-3 w-3" />
                Optionnel: utile pour les audits précis.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-semibold text-red-700">Erreur de chargement</div>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="partages">Partages (détails)</TabsTrigger>
          <TabsTrigger value="interactions">Engagements (interactions)</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Répartition par plateforme
                </CardTitle>
                <CardDescription>Partages et points générés par réseau</CardDescription>
              </CardHeader>
              <CardContent>
                {(summary?.byPlatform ?? []).length === 0 ? (
                  <div className="text-sm text-gray-500">Aucune donnée.</div>
                ) : (
                  <div className="space-y-3">
                    {summary?.byPlatform.map((row) => (
                      <div key={row.platform} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2">
                          <Badge className={getPlatformBadgeClass(row.platform)}>{row.platform}</Badge>
                          <span className="text-sm text-gray-700">{row.shares} partages</span>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700">{row.points} pts</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-emerald-600" />
                  Interactions par type
                </CardTitle>
                <CardDescription>Vues, clics, conversions, achats</CardDescription>
              </CardHeader>
              <CardContent>
                {(summary?.byInteractionType ?? []).length === 0 ? (
                  <div className="text-sm text-gray-500">Aucune donnée.</div>
                ) : (
                  <div className="space-y-3">
                    {summary?.byInteractionType.map((row) => (
                      <div key={row.type} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <span className="text-sm font-medium text-gray-800">{row.type}</span>
                        <Badge className="bg-emerald-100 text-emerald-700">{row.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="partages" className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-gray-600">
              Page {pageShares} · {shares.rows.length} éléments affichés
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void exportSharesCsv()}
                disabled={isLoading}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {shares.rows.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-6 text-sm text-gray-600">Aucun partage trouvé pour les filtres actuels.</CardContent>
              </Card>
            ) : (
              shares.rows.map((s) => (
                <Card
                  key={s.id}
                  className="border-slate-200 hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => void openShareDetails(s)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={s.shareUserAvatar || undefined} alt={s.shareUserName} />
                          <AvatarFallback className="bg-indigo-600 text-white text-xs">
                            {String(s.shareUserName || 'U').slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 truncate">{s.shareUserName}</p>
                            {s.shareUserRole ? (
                              <Badge variant="outline" className="border-gray-300 text-gray-700">
                                {s.shareUserRole}
                              </Badge>
                            ) : null}
                            <Badge className={getPlatformBadgeClass(s.platform)}>{s.platform}</Badge>
                          </div>

                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTimeFr(s.createdAt)} · ID {s.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                            {s.productImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.productImage} alt={s.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="text-xs text-gray-400">Img</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[420px]">{s.productName}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[420px]">Vendeur: {s.productVendorName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge className="bg-amber-100 text-amber-800">+{s.pointsEarned} pts</Badge>
                        <Badge className="bg-emerald-100 text-emerald-700">{s.interactionsCount} interactions</Badge>
                        {s.pointsFromInteractions > 0 ? (
                          <Badge className="bg-fuchsia-100 text-fuchsia-800">+{s.pointsFromInteractions} pts</Badge>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void copyShareUrl(s)
                          }}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          {copiedShareId === s.id ? (
                            <span className="text-xs font-medium text-emerald-700">Copié</span>
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            window.open(s.shareUrl, '_blank', 'noopener,noreferrer')
                          }}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50"
                        >
                          Ouvrir lien
                        </Button>
                      </div>
                    </div>

                    {Object.keys(s.interactionTypes || {}).length > 0 ? (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500">Détail interactions:</span>
                        {Object.entries(s.interactionTypes)
                          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                          .map(([t, c]) => (
                            <Badge key={t} variant="outline" className="border-slate-300 text-slate-700">
                              {t}: {c}
                            </Badge>
                          ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageShares((p) => Math.max(1, p - 1))}
              disabled={pageShares <= 1 || isLoading}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageShares((p) => p + 1)}
              disabled={isLoading || shares.rows.length < shares.pageSize}
            >
              Suivant
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type d’interaction</label>
                  <Select value={interactionType} onValueChange={setInteractionType}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERACTION_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void exportInteractionsCsv()}
                    disabled={isLoading}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {interactions.rows.length === 0 ? (
              <Card className="border-slate-200">
                <CardContent className="p-6 text-sm text-gray-600">Aucune interaction trouvée pour les filtres actuels.</CardContent>
              </Card>
            ) : (
              interactions.rows.map((r) => (
                <Card key={r.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-emerald-100 text-emerald-700">{r.type}</Badge>
                          <Badge className={getPlatformBadgeClass(r.platform)}>{r.platform || 'platform'}</Badge>
                          <span className="text-sm text-gray-700">{formatDateTimeFr(r.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Share {r.shareId.slice(0, 8)} · User {r.shareUserId.slice(0, 8)} · Product {r.productId.slice(0, 8)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {r.ip ? <Badge variant="outline" className="border-slate-300 text-slate-700">IP: {r.ip}</Badge> : null}
                        {r.referrer ? (
                          <Badge variant="outline" className="border-slate-300 text-slate-700 max-w-[520px] truncate">
                            Ref: {r.referrer}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageInteractions((p) => Math.max(1, p - 1))}
              disabled={pageInteractions <= 1 || isLoading}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageInteractions((p) => p + 1)}
              disabled={isLoading || interactions.rows.length < interactions.pageSize}
            >
              Suivant
            </Button>
          </div>
        </TabsContent>
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
