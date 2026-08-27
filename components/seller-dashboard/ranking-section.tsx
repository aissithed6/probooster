"use client"

import { useMemo, useState, useEffect } from 'react'
import { 
  Trophy, TrendingUp, TrendingDown, Target, Award, Crown, Medal, 
  BarChart3, Users, Eye, Share2, ShoppingCart, Star, Zap, 
  Calendar, Filter, Download, RefreshCw, ArrowUp, ArrowDown,
  Minus, Activity, Target as TargetIcon,
  Bell, CheckCircle, Plus, Edit, Clock, Trash2, Package
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useNotifications } from '@/components/ui/modern-notification'
import { getClientSessionSafe, supabase } from '@/lib/supabase'
import RankingCharts from './ranking-charts'
import RankingNotifications from './ranking-notifications'

// Types pour la section classement
interface RankingData {
  id: string
  userId: string
  vendorName: string
  vendorAvatar: string
  vendorCategory: string
  salesVolume: number
  salesRank: number
  sharesCount: number
  sharesRank: number
  viewsCount: number
  viewsRank: number
  overallRank: number
  categoryRank: number
  previousRank: number
  rating: number
  totalProducts: number
  totalRevenue: number
  trend: 'up' | 'down' | 'stable'
  performance: number // Pourcentage de performance
  badges: string[]
  lastUpdated: string
}

interface CategoryRanking {
  category: string
  rankings: RankingData[]
  totalVendors: number
  averagePerformance: number
}

// Interface pour les objectifs et milestones
interface Objective {
  id: string
  title: string
  description: string
  target: number
  current: number
  unit: string
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  deadline: string
  category: string
  createdAt: string
  updatedAt: string
}

// Interface pour les recommandations IA
interface AIRecommendation {
  id: string
  title: string
  description: string
  category: 'seo' | 'marketing' | 'customer_service' | 'product' | 'pricing'
  priority: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
  status: 'pending' | 'applied' | 'dismissed' | 'completed'
  estimatedValue: string
  estimatedTime: string
  createdAt: string
  appliedAt?: string
  dismissedAt?: string
}

export default function RankingSection() {
  const { addNotification } = useNotifications()
  
  const [activeTab, setActiveTab] = useState('overall')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [timeRange, setTimeRange] = useState('month')
  const [sortBy, setSortBy] = useState('overall')
  const [showCompetitors, setShowCompetitors] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [vendorRankings, setVendorRankings] = useState<RankingData[]>([])
  const [leaderboard, setLeaderboard] = useState<RankingData[]>([])

  const categoryIdToMatchers = useMemo(() => {
    return {
      all: ['all'],
      electronics: ['electronics', 'électronique', 'electronique', 'high-tech', 'high tech', 'tech'],
      fashion: ['fashion', 'mode', 'vêtements', 'vetements', 'habillement'],
      home: ['home', 'maison', 'jardin', 'maison & jardin', 'maison et jardin'],
      sports: ['sports', 'sport', 'loisirs'],
      beauty: ['beauty', 'beauté', 'beaute', 'santé', 'sante'],
      books: ['books', 'livres', 'médias', 'medias'],
      automotive: ['automotive', 'auto', 'automobile', 'véhicule', 'vehicule']
    } as Record<string, string[]>
  }, [])

  const filteredLeaderboard = useMemo(() => {
    const byRating = leaderboard.filter((r) => (minRating > 0 ? Number(r.rating ?? 0) >= minRating : true))

    const selectedMatchers = categoryIdToMatchers[selectedCategory] ?? [selectedCategory]
    const byCategory =
      selectedCategory !== 'all'
        ? byRating.filter((r) => {
            const cat = String(r.vendorCategory ?? '').toLowerCase()
            return selectedMatchers.some((m) => m !== 'all' && cat.includes(String(m).toLowerCase()))
          })
        : byRating

    const vendorUserId = String(vendorRankings?.[0]?.userId ?? '')
    const byCompetitors = showCompetitors
      ? byCategory
      : byCategory.filter((r) => {
          // Si on ne peut pas identifier le vendeur, on ne filtre pas.
          if (!vendorUserId) return true
          return String(r.userId ?? '') === vendorUserId
        })

    return byCompetitors
  }, [leaderboard, minRating, selectedCategory, categoryIdToMatchers, showCompetitors, vendorRankings])
  
  // États pour les objectifs et recommandations
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [showObjectiveModal, setShowObjectiveModal] = useState(false)
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const [editingRecommendation, setEditingRecommendation] = useState<AIRecommendation | null>(null)
  const [objectivePriority, setObjectivePriority] = useState<'low' | 'medium' | 'high'>('medium')

  const safeParseJson = (value: unknown) => {
    if (!value) return null
    if (typeof value === 'object') return value
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    }
    return null
  }

  const mapRankingRow = (row: any): RankingData => {
    const get = (camel: string, snake?: string) => (row?.[camel] ?? (snake ? row?.[snake] : undefined))
    const userId = String(get('userId', 'user_id') ?? '')
    const vendorName = String(get('vendorName', 'vendor_name') ?? get('name') ?? get('vendor') ?? 'Vendeur')
    const vendorAvatar = String(get('vendorAvatar', 'vendor_avatar') ?? get('avatar') ?? '')
    const vendorCategory = String(get('vendorCategory', 'vendor_category') ?? get('category') ?? 'N/A')

    const overallRank = Number(get('overallRank', 'overall_rank') ?? get('rank') ?? 0)
    const categoryRank = Number(get('categoryRank', 'category_rank') ?? 0)
    const previousRank = Number(get('previousRank', 'previous_rank') ?? 0)

    const salesRank = Number(get('salesRank', 'sales_rank') ?? 0)
    const sharesRank = Number(get('sharesRank', 'shares_rank') ?? 0)
    const viewsRank = Number(get('viewsRank', 'views_rank') ?? 0)

    const salesVolume = Number(get('salesVolume', 'sales_volume') ?? 0)
    const sharesCount = Number(get('sharesCount', 'shares_count') ?? 0)
    const viewsCount = Number(get('viewsCount', 'views_count') ?? 0)
    const rating = Number(get('rating') ?? 0)
    const totalProducts = Number(get('totalProducts', 'total_products') ?? 0)
    const totalRevenue = Number(get('totalRevenue', 'total_revenue') ?? 0)

    const trendRaw = String(get('trend') ?? '').toLowerCase()
    const trend: 'up' | 'down' | 'stable' = trendRaw === 'up' || trendRaw === 'down' || trendRaw === 'stable' ? trendRaw : 'stable'

    const performance = Number(get('performance') ?? get('score') ?? 0)
    const badgesRaw = get('badges')
    const badgesParsed = safeParseJson(badgesRaw)
    const badges = Array.isArray(badgesParsed) ? badgesParsed.map((b) => String(b)) : Array.isArray(badgesRaw) ? badgesRaw.map((b: any) => String(b)) : []

    const lastUpdated = String(get('lastUpdated', 'last_updated') ?? get('updated_at') ?? get('created_at') ?? new Date().toISOString())

    return {
      id: String(row?.id ?? ''),
      userId,
      vendorName,
      vendorAvatar,
      vendorCategory,
      salesVolume: Number.isFinite(salesVolume) ? salesVolume : 0,
      salesRank: Number.isFinite(salesRank) ? salesRank : 0,
      sharesCount: Number.isFinite(sharesCount) ? sharesCount : 0,
      sharesRank: Number.isFinite(sharesRank) ? sharesRank : 0,
      viewsCount: Number.isFinite(viewsCount) ? viewsCount : 0,
      viewsRank: Number.isFinite(viewsRank) ? viewsRank : 0,
      overallRank: Number.isFinite(overallRank) ? overallRank : 0,
      categoryRank: Number.isFinite(categoryRank) ? categoryRank : 0,
      previousRank: Number.isFinite(previousRank) ? previousRank : 0,
      rating: Number.isFinite(rating) ? rating : 0,
      totalProducts: Number.isFinite(totalProducts) ? totalProducts : 0,
      totalRevenue: Number.isFinite(totalRevenue) ? totalRevenue : 0,
      trend,
      performance: Number.isFinite(performance) ? performance : 0,
      badges,
      lastUpdated
    }
  }

  const fetchJson = async (url: string, init?: RequestInit) => {
    const resp = await fetch(url, { credentials: 'include', ...(init ?? {}) })
    const body = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      const msg = typeof (body as any)?.error === 'string' ? (body as any).error : 'Erreur réseau.'
      throw new Error(msg)
    }
    return body
  }

  const loadVendorRankings = async (range?: string) => {
    const r = String(range ?? timeRange ?? 'month')
    const body = await fetchJson(`/api/vendor/rankings?range=${encodeURIComponent(r)}`)
    const rows = Array.isArray((body as any)?.data) ? ((body as any).data as any[]) : []
    setVendorRankings(rows.map(mapRankingRow))
  }

  const getMetricForTab = (tab: string) => {
    if (tab === 'sales') return 'sales'
    if (tab === 'shares') return 'shares'
    if (tab === 'views') return 'views'
    return 'overall'
  }

  const loadLeaderboard = async (metric: string, range?: string) => {
    const r = String(range ?? timeRange ?? 'month')
    const body = await fetchJson(
      `/api/vendor/rankings/leaderboard?metric=${encodeURIComponent(metric)}&limit=10&range=${encodeURIComponent(r)}`
    )
    const rows = Array.isArray((body as any)?.data) ? ((body as any).data as any[]) : []
    setLeaderboard(rows.map(mapRankingRow))
  }

  const loadObjectives = async () => {
    const body = await fetchJson('/api/vendor/ranking-objectives')
    const rows = Array.isArray((body as any)?.data) ? ((body as any).data as any[]) : []
    setObjectives(
      rows.map((r: any) => {
        const data = (r as any)?.data ?? {}
        return {
          id: String((r as any)?.id ?? ''),
          title: String((data as any)?.title ?? ''),
          description: String((data as any)?.description ?? ''),
          target: Number((data as any)?.target ?? 0),
          current: Number((data as any)?.current ?? 0),
          unit: String((data as any)?.unit ?? ''),
          status: ((data as any)?.status as any) ?? 'not_started',
          priority: ((data as any)?.priority as any) ?? 'medium',
          deadline: String((data as any)?.deadline ?? ''),
          category: String((data as any)?.category ?? 'general'),
          createdAt: String((r as any)?.created_at ?? new Date().toISOString()),
          updatedAt: String((r as any)?.updated_at ?? new Date().toISOString())
        }
      })
    )
  }

  const loadRecommendations = async () => {
    const body = await fetchJson('/api/vendor/ranking-recommendations')
    const rows = Array.isArray((body as any)?.data) ? ((body as any).data as any[]) : []
    setRecommendations(
      rows.map((r: any) => {
        const data = (r as any)?.data ?? {}
        return {
          id: String((r as any)?.id ?? ''),
          title: String((data as any)?.title ?? ''),
          description: String((data as any)?.description ?? ''),
          category: ((data as any)?.category as any) ?? 'seo',
          priority: ((data as any)?.priority as any) ?? 'low',
          impact: ((data as any)?.impact as any) ?? 'low',
          effort: ((data as any)?.effort as any) ?? 'low',
          status: ((data as any)?.status as any) ?? 'pending',
          estimatedValue: String((data as any)?.estimatedValue ?? ''),
          estimatedTime: String((data as any)?.estimatedTime ?? ''),
          createdAt: String((r as any)?.created_at ?? new Date().toISOString()),
          appliedAt: (data as any)?.appliedAt,
          dismissedAt: (data as any)?.dismissedAt
        }
      })
    )
  }

  const loadAll = async (metric: string, range?: string) => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadVendorRankings(range),
        loadLeaderboard(metric, range),
        loadObjectives(),
        loadRecommendations()
      ])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAll(getMetricForTab(activeTab), timeRange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('rankingFilterConfig')
      if (!savedConfig) return
      const config = JSON.parse(savedConfig)
      setSelectedCategory(config.selectedCategory || 'all')
      setTimeRange(config.timeRange || 'month')
      setSortBy(config.sortBy || 'overall')
      setShowCompetitors(Boolean(config.showCompetitors || false))
      setMinRating(Number(config.minRating || 0))
    } catch {
      // silencieux
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === 'charts' || activeTab === 'notifications') return
    void loadLeaderboard(getMetricForTab(activeTab), timeRange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, timeRange])

  useEffect(() => {
    let disposed = false
    let debounceId: number | undefined
    let channel: any = null

    const debouncedReload = (fn: () => void) => {
      if (debounceId) window.clearTimeout(debounceId)
      debounceId = window.setTimeout(() => {
        if (!disposed) fn()
      }, 250)
    }

    void (async () => {
      const session = await getClientSessionSafe()
      const vendorId = session?.user?.id
      if (!vendorId || disposed) return

      const safeReloadAll = () => {
        if (activeTab === 'charts' || activeTab === 'notifications') return
        void Promise.all([
          loadVendorRankings(timeRange),
          loadLeaderboard(getMetricForTab(activeTab), timeRange),
          loadObjectives(),
          loadRecommendations()
        ]).catch(() => {})
      }

      channel = supabase
        .channel(`realtime:vendor-rankings:${vendorId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rankings', filter: `user_id=eq.${vendorId}` },
          () => debouncedReload(safeReloadAll)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vendor_ranking_objectives', filter: `vendor_id=eq.${vendorId}` },
          () => debouncedReload(() => void loadObjectives().catch(() => {}))
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'vendor_ranking_recommendations', filter: `vendor_id=eq.${vendorId}` },
          () => debouncedReload(() => void loadRecommendations().catch(() => {}))
        )
        .subscribe()
    })()

    const onFocus = () => {
      debouncedReload(() => {
        if (activeTab === 'charts' || activeTab === 'notifications') return
        void Promise.all([
          loadVendorRankings(timeRange),
          loadLeaderboard(getMetricForTab(activeTab), timeRange),
          loadObjectives(),
          loadRecommendations()
        ]).catch(() => {})
      })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      if (debounceId) window.clearTimeout(debounceId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      if (channel) supabase.removeChannel(channel)
    }
  }, [activeTab, timeRange])

  useEffect(() => {
    if (!showObjectiveModal) return
    setObjectivePriority(editingObjective?.priority ?? 'medium')
  }, [showObjectiveModal, editingObjective])

  const categories = [
    { id: 'all', name: 'Toutes les catégories', icon: '🏆' },
    { id: 'electronics', name: 'Électronique', icon: '📱' },
    { id: 'fashion', name: 'Mode', icon: '👗' },
    { id: 'home', name: 'Maison & Jardin', icon: '🏠' },
    { id: 'sports', name: 'Sport & Loisirs', icon: '⚽' },
    { id: 'beauty', name: 'Beauté & Santé', icon: '💄' },
    { id: 'books', name: 'Livres & Médias', icon: '📚' },
    { id: 'automotive', name: 'Automobile', icon: '🚗' }
  ]

  const timeRanges = [
    { id: 'week', name: 'Cette semaine', icon: '📅' },
    { id: 'month', name: 'Ce mois', icon: '📆' },
    { id: 'quarter', name: 'Ce trimestre', icon: '📊' },
    { id: 'year', name: 'Cette année', icon: '🎯' }
  ]

  const sortOptions = [
    { id: 'overall', name: 'Classement global', icon: '🏆' },
    { id: 'sales', name: 'Volume des ventes', icon: '💰' },
    { id: 'shares', name: 'Nombre de partages', icon: '📤' },
    { id: 'views', name: 'Nombre de vues', icon: '👁️' },
    { id: 'rating', name: 'Note moyenne', icon: '⭐' },
    { id: 'performance', name: 'Performance', icon: '📈' }
  ]

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'stable':
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>
  }

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600'
    if (performance >= 80) return 'text-blue-600'
    if (performance >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleRefresh = () => {
    void (async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          loadVendorRankings(timeRange),
          loadLeaderboard(getMetricForTab(activeTab), timeRange)
        ])
        addNotification({
          type: 'success',
          title: 'Données actualisées',
          message: 'Le classement a été mis à jour avec les dernières données.'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: error instanceof Error ? error.message : 'Impossible d\'actualiser les données.'
        })
      } finally {
        setIsLoading(false)
      }
    })()
  }

  const handleExport = (type: string) => {
    const rows = filteredLeaderboard
    if (!rows || rows.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Aucune donnée',
        message: 'Aucune donnée à exporter pour le moment.'
      })
      return
    }

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }

    void (async () => {
      setIsLoading(true)
      try {
        if (type === 'csv') {
          const headers = ['Rang', 'Vendeur', 'Catégorie', 'Performance', 'Note', 'Ventes', 'Partages', 'Vues']
          const lines = [headers.join(',')]
          for (const r of rows) {
            const line = [
              r.overallRank,
              `"${String(r.vendorName).replace(/"/g, '""')}"`,
              `"${String(r.vendorCategory).replace(/"/g, '""')}"`,
              r.performance,
              r.rating,
              r.salesVolume,
              r.sharesCount,
              r.viewsCount
            ].join(',')
            lines.push(line)
          }
          downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `classements_${activeTab}.csv`)
        } else if (type === 'excel') {
          const xlsx = await import('xlsx')
          const data = rows.map((r) => ({
            Rang: r.overallRank,
            Vendeur: r.vendorName,
            Catégorie: r.vendorCategory,
            Performance: r.performance,
            Note: r.rating,
            Ventes: r.salesVolume,
            Partages: r.sharesCount,
            Vues: r.viewsCount
          }))
          const ws = xlsx.utils.json_to_sheet(data)
          const wb = xlsx.utils.book_new()
          xlsx.utils.book_append_sheet(wb, ws, 'Classements')
          const array = xlsx.write(wb, { type: 'array', bookType: 'xlsx' })
          downloadBlob(
            new Blob([array], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
            `classements_${activeTab}.xlsx`
          )
        } else if (type === 'pdf') {
          const { jsPDF } = await import('jspdf')
          const autoTable = (await import('jspdf-autotable')) as any
          const doc = new jsPDF({ orientation: 'landscape' })
          doc.setFontSize(14)
          doc.text(`Classements - ${activeTab}`, 14, 14)
          const head = [['Rang', 'Vendeur', 'Catégorie', 'Performance', 'Note', 'Ventes', 'Partages', 'Vues']]
          const body = rows.map((r) => [
            String(r.overallRank),
            r.vendorName,
            r.vendorCategory,
            String(r.performance),
            String(r.rating),
            String(r.salesVolume),
            String(r.sharesCount),
            String(r.viewsCount)
          ])
          autoTable.default(doc, { head, body, startY: 20, styles: { fontSize: 9 } })
          downloadBlob(doc.output('blob'), `classements_${activeTab}.pdf`)
        } else {
          addNotification({
            type: 'warning',
            title: 'Format inconnu',
            message: 'Format d\'export non supporté.'
          })
        }
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Export impossible',
          message: error instanceof Error ? error.message : 'Erreur lors de la génération du fichier.'
        })
      } finally {
        setIsLoading(false)
        setExportMenuOpen(false)
      }
    })()
  }
  

  
  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    setSelectedCategory('all')
    setTimeRange('month')
    setSortBy('overall')
    setShowCompetitors(false)
    setMinRating(0)

    try {
      localStorage.removeItem('rankingFilterConfig')
    } catch {
      // silencieux
    }
    
    addNotification({ 
  type: 'info', 
  title: 'Filtres réinitialisés', 
  message: 'Tous les filtres ont été remis à zéro' 
})
  }
  
  // Fonction pour appliquer des filtres avancés
  const handleApplyAdvancedFilters = () => {
    void (async () => {
      setIsLoading(true)
      try {
        // On synchronise réellement le leaderboard avec le tri demandé.
        // Backend: /leaderboard trie selon metric.
        await loadLeaderboard(String(sortBy || 'overall'), timeRange)

        const activeFilters: string[] = []
        if (selectedCategory !== 'all') activeFilters.push(`Catégorie: ${selectedCategory}`)
        if (timeRange !== 'month') activeFilters.push(`Période: ${timeRange}`)
        if (sortBy !== 'overall') activeFilters.push(`Tri: ${sortBy}`)
        if (showCompetitors) activeFilters.push('Concurrents visibles')
        if (minRating > 0) activeFilters.push(`Note min: ${minRating}`)

        addNotification({
          type: 'success',
          title: 'Filtres appliqués',
          message: activeFilters.length > 0 ? `Filtres actifs: ${activeFilters.join(', ')}` : 'Aucun filtre actif.'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: error instanceof Error ? error.message : 'Impossible d\'appliquer les filtres.'
        })
      } finally {
        setIsLoading(false)
      }
    })()
  }
  
  // Fonction pour sauvegarder la configuration des filtres
  const handleSaveFilterConfig = () => {
    const filterConfig = {
      selectedCategory,
      timeRange,
      sortBy,
      showCompetitors,
      minRating,
      timestamp: new Date().toISOString()
    }
    
    localStorage.setItem('rankingFilterConfig', JSON.stringify(filterConfig))
    
    addNotification({ 
  type: 'success', 
  title: 'Configuration sauvegardée', 
  message: 'Vos préférences de filtres ont été sauvegardées' 
})
  }
  
  // Fonction pour charger la configuration des filtres
  const handleLoadFilterConfig = () => {
    const savedConfig = localStorage.getItem('rankingFilterConfig')
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setSelectedCategory(config.selectedCategory || 'all')
        setTimeRange(config.timeRange || 'month')
        setSortBy(config.sortBy || 'overall')
        setShowCompetitors(config.showCompetitors || false)
        setMinRating(config.minRating || 0)
        
        addNotification({ 
  type: 'success', 
  title: 'Configuration chargée', 
  message: 'Vos préférences de filtres ont été restaurées' 
})
      } catch (error) {
        addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de charger la configuration sauvegardée' 
})
      }
    } else {
      addNotification({
        type: 'warning',
        title: 'Aucune configuration',
        message: 'Aucune configuration de filtres n\'a été sauvegardée'
      })
    }
  }
  
  // Fonctions pour les objectifs et milestones
  const handleAddObjective = () => {
    setEditingObjective(null)
    setShowObjectiveModal(true)
  }
  
  const handleEditObjectives = () => {
    if (objectives.length > 0) {
      setEditingObjective(objectives[0]) // Éditer le premier objectif comme exemple
      setShowObjectiveModal(true)
    } else {
      addNotification({
        type: 'warning',
        title: 'Aucun objectif',
        message: 'Aucun objectif à modifier. Créez d\'abord un objectif.'
      })
    }
  }
  
  const handleViewAllObjectives = () => {
    addNotification({
      type: 'info',
      title: 'Tous les objectifs',
      message: `Vous avez ${objectives.length} objectif(s) actif(s). ${objectives.filter(o => o.status === 'completed').length} objectif(s) atteint(s).`
    })
  }
  
  const handleSaveObjective = (objective: Objective) => {
    void (async () => {
      setIsLoading(true)
      try {
        const payload = {
          title: objective.title,
          description: objective.description,
          target: objective.target,
          current: objective.current,
          unit: objective.unit,
          status: objective.status,
          priority: objective.priority,
          deadline: objective.deadline,
          category: objective.category
        }

        if (editingObjective?.id) {
          await fetchJson(`/api/vendor/ranking-objectives/${encodeURIComponent(editingObjective.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload })
          })
          addNotification({
            type: 'success',
            title: 'Objectif modifié',
            message: `L'objectif "${objective.title}" a été modifié avec succès.`
          })
        } else {
          await fetchJson('/api/vendor/ranking-objectives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payload })
          })
          addNotification({
            type: 'success',
            title: 'Nouvel objectif créé',
            message: `L'objectif "${objective.title}" a été créé avec succès.`
          })
        }

        await loadObjectives()
        setShowObjectiveModal(false)
        setEditingObjective(null)
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: error instanceof Error ? error.message : 'Impossible de sauvegarder l\'objectif.'
        })
      } finally {
        setIsLoading(false)
      }
    })()
  }
  
  const handleDeleteObjective = (id: string) => {
    void (async () => {
      const objective = objectives.find(obj => obj.id === id)
      if (!objective) return
      setIsLoading(true)
      try {
        await fetchJson(`/api/vendor/ranking-objectives/${encodeURIComponent(id)}`, { method: 'DELETE' })
        await loadObjectives()
        addNotification({
          type: 'success',
          title: 'Objectif supprimé',
          message: `L'objectif "${objective.title}" a été supprimé.`
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: error instanceof Error ? error.message : 'Impossible de supprimer l\'objectif.'
        })
      } finally {
        setIsLoading(false)
      }
    })()
  }
  
  const handleUpdateObjectiveProgress = (id: string, newProgress: number) => {
    void (async () => {
      const objective = objectives.find(obj => obj.id === id)
      if (!objective) return

      const updated: Objective = {
        ...objective,
        current: newProgress,
        updatedAt: new Date().toISOString(),
        status:
          newProgress >= objective.target
            ? 'completed'
            : newProgress > 0
              ? 'in_progress'
              : 'not_started'
      }

      setObjectives(prev => prev.map(obj => (obj.id === id ? updated : obj)))

      try {
        await fetchJson(`/api/vendor/ranking-objectives/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              title: updated.title,
              description: updated.description,
              target: updated.target,
              current: updated.current,
              unit: updated.unit,
              status: updated.status,
              priority: updated.priority,
              deadline: updated.deadline,
              category: updated.category
            }
          })
        })

        addNotification({
          type: 'success',
          title: 'Progrès mis à jour',
          message: `Le progrès de "${objective.title}" a été mis à jour à ${newProgress} ${objective.unit}.`
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: error instanceof Error ? error.message : 'Impossible de sauvegarder le progrès.'
        })
      }
    })()
  }
  
  // Fonctions pour les recommandations IA
  const handleGenerateNewRecommendations = () => {
    setIsLoading(true)
    
    // Simuler la génération de nouvelles recommandations IA avec étapes progressives
    const steps = [
      'Analyse des données de performance...',
      'Évaluation de la concurrence...',
      'Génération des recommandations personnalisées...',
      'Optimisation des suggestions...',
      'Finalisation des recommandations...'
    ]
    
    let currentStep = 0
    const stepInterval = setInterval(() => {
      if (currentStep < steps.length) {
        addNotification({
          type: 'info',
          title: 'Génération en cours',
          message: steps[currentStep]
        })
        currentStep++
      } else {
        clearInterval(stepInterval)
        
        // Générer les nouvelles recommandations
        const newRecommendations: AIRecommendation[] = [
          {
            id: `rec-${Date.now()}-1`,
            title: 'Optimiser les images produits',
            description: 'Compressez et optimisez vos images pour améliorer le temps de chargement et l\'expérience utilisateur. Utilisez des formats modernes comme WebP et implémentez le lazy loading.',
            category: 'seo',
            priority: 'medium',
            impact: 'medium',
            effort: 'low',
            status: 'pending',
            estimatedValue: '+8% de performance',
            estimatedTime: '1 semaine',
            createdAt: new Date().toISOString()
          },
          {
            id: `rec-${Date.now()}-2`,
            title: 'Lancer des campagnes saisonnières',
            description: 'Préparez des campagnes marketing ciblées pour les périodes de forte demande. Analysez les tendances saisonnières et créez du contenu adapté.',
            category: 'marketing',
            priority: 'high',
            impact: 'high',
            effort: 'medium',
            status: 'pending',
            estimatedValue: '+25% de ventes',
            estimatedTime: '3-4 semaines',
            createdAt: new Date().toISOString()
          },
          {
            id: `rec-${Date.now()}-3`,
            title: 'Améliorer la réactivité mobile',
            description: 'Optimisez votre site pour les appareils mobiles. Améliorez la vitesse de chargement et l\'ergonomie sur mobile pour augmenter le taux de conversion.',
            category: 'seo',
            priority: 'high',
            impact: 'high',
            effort: 'medium',
            status: 'pending',
            estimatedValue: '+15% de conversion mobile',
            estimatedTime: '2-3 semaines',
            createdAt: new Date().toISOString()
          },
          {
            id: `rec-${Date.now()}-4`,
            title: 'Créer du contenu de qualité',
            description: 'Développez du contenu informatif et engageant pour votre audience. Utilisez des mots-clés pertinents et créez des articles qui répondent aux questions de vos clients.',
            category: 'marketing',
            priority: 'medium',
            impact: 'medium',
            effort: 'high',
            status: 'pending',
            estimatedValue: '+12% de trafic organique',
            estimatedTime: '4-6 semaines',
            createdAt: new Date().toISOString()
          },
          {
            id: `rec-${Date.now()}-5`,
            title: 'Optimiser les fiches produits',
            description: 'Améliorez vos descriptions de produits avec des informations détaillées, des images de qualité et des avis clients authentiques pour augmenter la confiance.',
            category: 'product',
            priority: 'medium',
            impact: 'medium',
            effort: 'low',
            status: 'pending',
            estimatedValue: '+10% de conversion produit',
            estimatedTime: '1-2 semaines',
            createdAt: new Date().toISOString()
          }
        ]
        
        void (async () => {
          try {
            for (const rec of newRecommendations) {
              await fetchJson('/api/vendor/ranking-recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: rec })
              })
            }
            await loadRecommendations()
          } catch {
            setRecommendations(prev => [...prev, ...newRecommendations])
          }
        })()
        setIsLoading(false)
        
        addNotification({
          type: 'success',
          title: 'Recommandations IA générées avec succès !',
          message: `${newRecommendations.length} nouvelles recommandations personnalisées ont été créées pour améliorer votre classement et vos performances.`
        })
        
        // Notification de suivi après 5 secondes
        setTimeout(() => {
          addNotification({
            type: 'info',
            title: 'Prochaines étapes',
            message: 'Consultez vos nouvelles recommandations et commencez par celles qui ont le plus d\'impact et nécessitent le moins d\'effort.'
          })
        }, 5000)
      }
    }, 800)
  }

  // Fonction pour afficher un indicateur de progression
  const getProgressIndicator = () => {
    if (!isLoading) return null
    
    return (
      <div className="flex items-center space-x-2 text-sm text-blue-600">
        <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <span>Génération des recommandations IA...</span>
      </div>
    )
  }
  
  const handleSaveRecommendations = () => {
    void (async () => {
      setIsLoading(true)
      try {
        await loadRecommendations()
        addNotification({
          type: 'success',
          title: 'Recommandations synchronisées',
          message: `${recommendations.length} recommandation(s) affichée(s).`
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: error instanceof Error ? error.message : 'Impossible de synchroniser les recommandations.'
        })
      } finally {
        setIsLoading(false)
      }
    })()
  }
  
  const handleApplyRecommendation = (id: string) => {
    const recommendation = recommendations.find(rec => rec.id === id)
    if (recommendation) {
      const updated = { ...recommendation, status: 'applied' as const, appliedAt: new Date().toISOString() }
      setRecommendations(prev => prev.map(rec => (rec.id === id ? updated : rec)))
      void fetchJson(`/api/vendor/ranking-recommendations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updated })
      }).catch(() => {})
      
      addNotification({
        type: 'success',
        title: 'Recommandation appliquée',
        message: `La recommandation "${recommendation.title}" a été appliquée. Impact estimé: ${recommendation.estimatedValue}`
      })
    }
  }
  
  const handleDismissRecommendation = (id: string) => {
    const recommendation = recommendations.find(rec => rec.id === id)
    if (recommendation) {
      const updated = { ...recommendation, status: 'dismissed' as const, dismissedAt: new Date().toISOString() }
      setRecommendations(prev => prev.map(rec => (rec.id === id ? updated : rec)))
      void fetchJson(`/api/vendor/ranking-recommendations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updated })
      }).catch(() => {})
      
      addNotification({
        type: 'warning',
        title: 'Recommandation ignorée',
        message: `La recommandation "${recommendation.title}" a été ignorée`
      })
    }
  }
  
  const handleViewAllRecommendations = () => {
    setShowRecommendationModal(true)
  }
  
  const handleCompleteRecommendation = (id: string) => {
    const recommendation = recommendations.find(rec => rec.id === id)
    if (recommendation) {
      const updated = { ...recommendation, status: 'completed' as const }
      setRecommendations(prev => prev.map(rec => (rec.id === id ? updated : rec)))
      void fetchJson(`/api/vendor/ranking-recommendations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updated })
      }).catch(() => {})
      
      addNotification({
        type: 'success',
        title: 'Recommandation terminée',
        message: `La recommandation "${recommendation.title}" a été marquée comme terminée`
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-yellow-800">
              <Trophy className="w-5 h-5" />
              <span className="text-sm">Position Globale</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-800 mb-2">#{vendorRankings[0]?.overallRank ?? 0}</div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-yellow-600">Top 10 (leaderboard)</span>
            </div>
            <Progress value={vendorRankings[0]?.performance ?? 0} className="mt-3 bg-yellow-100" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Target className="w-5 h-5" />
              <span className="text-sm">Position Catégorie</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800 mb-2">
              #{(vendorRankings[0]?.categoryRank && vendorRankings[0]?.categoryRank > 0) ? vendorRankings[0].categoryRank : (vendorRankings[0]?.overallRank ?? 0)}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-blue-600">{vendorRankings[0]?.vendorCategory ?? 'N/A'}</span>
            </div>
            <Progress value={vendorRankings[0]?.performance ?? 0} className="mt-3 bg-blue-100" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800 mb-2">{vendorRankings[0]?.performance ?? 0}%</div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">Score global</span>
            </div>
            <Progress value={vendorRankings[0]?.performance ?? 0} className="mt-3 bg-green-100" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Zap className="w-5 h-5" />
              <span className="text-sm">Tendance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-800 mb-2">{vendorRankings[0]?.trend === 'up' ? '↗' : vendorRankings[0]?.trend === 'down' ? '↘' : '→'}</div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-purple-600 capitalize">{vendorRankings[0]?.trend ?? 'stable'}</span>
            </div>
            <div className="text-xs text-purple-500 mt-2">
              Dernière mise à jour: {vendorRankings[0]?.lastUpdated ? new Date(vendorRankings[0].lastUpdated).toLocaleDateString('fr-FR') : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et contrôles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Filtres et Contrôles</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetFilters}
              >
                <Filter className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleApplyAdvancedFilters}
              >
                <Target className="w-4 h-4 mr-2" />
                Appliquer
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSaveFilterConfig}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLoadFilterConfig}
              >
                <Clock className="w-4 h-4 mr-2" />
                Charger
              </Button>
              
              <div className="relative">
              <Button variant="outline" size="sm" onClick={() => setExportMenuOpen((v) => !v)} disabled={isLoading}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
                {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Export CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📈 Export Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📄 Export PDF
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeRange">Période</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map(range => (
                    <SelectItem key={range.id} value={range.id}>
                      <span className="mr-2">{range.icon}</span>
                      {range.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortBy">Trier par</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      <span className="mr-2">{option.icon}</span>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="competitors"
                checked={showCompetitors}
                onCheckedChange={setShowCompetitors}
              />
              <Label htmlFor="competitors">Voir concurrents</Label>
            </div>

            <div>
              <Label htmlFor="minRating">Note min.</Label>
              <Input
                id="minRating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets de classement */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overall" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span>Global</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Ventes</span>
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Partages</span>
          </TabsTrigger>
          <TabsTrigger value="views" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Vues</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Graphiques</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Alertes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Classement Global - Top 10</span>
              </CardTitle>
              <CardDescription>
                Positionnement global basé sur les performances globales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((vendor) => (
                    <div key={vendor.id || vendor.vendorName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 w-16">
                          {getRankBadge(vendor.overallRank)}
                        </div>
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={vendor.vendorAvatar} />
                          <AvatarFallback>{vendor.vendorName?.[0] ?? 'V'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                          <div className="text-xs text-gray-500">{vendor.vendorCategory}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${getPerformanceColor(vendor.performance)}`}>{vendor.performance}%</div>
                        <div className="text-xs text-gray-500">Note: {vendor.rating}/5</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun classement disponible</h3>
                  <p className="text-gray-500">Aucune donnée leaderboard n'est disponible pour le moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-green-500" />
                <span>Classement par Volume de Ventes</span>
              </CardTitle>
              <CardDescription>
                Top 10 des vendeurs par volume de ventes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((vendor) => (
                    <div key={vendor.id || vendor.vendorName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 text-sm font-semibold text-gray-700">#{vendor.salesRank || vendor.overallRank}</div>
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={vendor.vendorAvatar} />
                          <AvatarFallback>{vendor.vendorName?.[0] ?? 'V'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                          <div className="text-xs text-gray-500">{vendor.vendorCategory}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(vendor.totalRevenue)}</div>
                        <div className="text-xs text-gray-500">Ventes: {vendor.salesVolume}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun classement de ventes disponible</h3>
                  <p className="text-gray-500">Aucune donnée leaderboard n'est disponible pour le moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shares" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-blue-500" />
                <span>Classement par Partages</span>
              </CardTitle>
              <CardDescription>
                Top 10 des vendeurs par nombre de partages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((vendor) => (
                    <div key={vendor.id || vendor.vendorName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 text-sm font-semibold text-gray-700">#{vendor.sharesRank || vendor.overallRank}</div>
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={vendor.vendorAvatar} />
                          <AvatarFallback>{vendor.vendorName?.[0] ?? 'V'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                          <div className="text-xs text-gray-500">{vendor.vendorCategory}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">Partages: {vendor.sharesCount}</div>
                        <div className="text-xs text-gray-500">Perf: {vendor.performance}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Share2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun classement par partages disponible</h3>
                  <p className="text-gray-500">Aucune donnée leaderboard n'est disponible pour le moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="views" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-purple-500" />
                <span>Classement par Vues</span>
              </CardTitle>
              <CardDescription>
                Top 10 des vendeurs par nombre de vues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((vendor) => (
                    <div key={vendor.id || vendor.vendorName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 text-sm font-semibold text-gray-700">#{vendor.viewsRank || vendor.overallRank}</div>
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={vendor.vendorAvatar} />
                          <AvatarFallback>{vendor.vendorName?.[0] ?? 'V'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{vendor.vendorName}</div>
                          <div className="text-xs text-gray-500">{vendor.vendorCategory}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">Vues: {vendor.viewsCount}</div>
                        <div className="text-xs text-gray-500">Perf: {vendor.performance}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun classement par vues disponible</h3>
                  <p className="text-gray-500">Aucune donnée leaderboard n'est disponible pour le moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <RankingCharts />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <RankingNotifications />
        </TabsContent>
      </Tabs>

      {/* Analyse comparative et insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Target className="w-5 h-5 text-indigo-500" />
              <span>Objectifs et Milestones</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddObjective()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditObjectives()}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {objectives.slice(0, 3).map((objective) => (
                <div key={objective.id} className="space-y-2">
              <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{objective.title}</span>
                        <Badge 
                          className={`${
                            objective.status === 'completed' ? 'bg-green-100 text-green-800' :
                            objective.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            objective.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {objective.status === 'completed' ? 'Atteint' :
                           objective.status === 'in_progress' ? 'En cours' :
                           objective.status === 'overdue' ? 'En retard' :
                           'Non commencé'}
                        </Badge>
                        <Badge 
                          className={`${
                            objective.priority === 'high' ? 'bg-red-100 text-red-800' :
                            objective.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          } text-xs`}
                        >
                          {objective.priority === 'high' ? 'Élevée' :
                           objective.priority === 'medium' ? 'Moyenne' :
                           'Faible'}
                        </Badge>
              </div>
                      <p className="text-xs text-gray-600 mt-1">{objective.description}</p>
              </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateObjectiveProgress(objective.id, Math.min(objective.current + 1, objective.target))}
                        className="text-xs h-6 px-2"
                        disabled={objective.status === 'completed'}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteObjective(objective.id)}
                        className="text-xs h-6 px-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Progression: {objective.current} / {objective.target} {objective.unit}</span>
                      <span>{objective.target > 0 ? Math.round((objective.current / objective.target) * 100) : 0}%</span>
              </div>
                    <Progress 
                      value={objective.target > 0 ? (objective.current / objective.target) * 100 : 0} 
                      className={`${
                        objective.status === 'completed' ? 'bg-green-100' :
                        objective.status === 'in_progress' ? 'bg-yellow-100' :
                        objective.status === 'overdue' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewAllObjectives()}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir tous les objectifs
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Activity className="w-5 h-5 text-green-500" />
              <div className="flex flex-col space-y-2">
                <span>Recommandations IA</span>
                {getProgressIndicator()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateNewRecommendations()}
                  disabled={isLoading}
                  className={`transition-all duration-300 ${
                    isLoading 
                      ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-not-allowed' 
                      : 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                  }`}
                >
                  <Zap className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Génération...' : 'Générer'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSaveRecommendations()}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((recommendation) => (
                <div 
                  key={recommendation.id} 
                  className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                    recommendation.status === 'applied' ? 'bg-green-50 border-green-200' :
                    recommendation.status === 'dismissed' ? 'bg-gray-50 border-gray-200' :
                    recommendation.status === 'completed' ? 'bg-blue-50 border-blue-200' :
                    recommendation.category === 'seo' ? 'bg-blue-50 border-blue-200' :
                    recommendation.category === 'marketing' ? 'bg-green-50 border-green-200' :
                    recommendation.category === 'customer_service' ? 'bg-purple-50 border-purple-200' :
                    recommendation.category === 'product' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 mt-0.5 ${
                      recommendation.category === 'seo' ? 'text-blue-500' :
                      recommendation.category === 'marketing' ? 'text-green-500' :
                      recommendation.category === 'customer_service' ? 'text-purple-500' :
                      recommendation.category === 'product' ? 'text-orange-500' :
                      'text-yellow-500'
                    }`}>
                      {recommendation.category === 'seo' ? <Zap className="w-5 h-5" /> :
                       recommendation.category === 'marketing' ? <Share2 className="w-5 h-5" /> :
                       recommendation.category === 'customer_service' ? <Star className="w-5 h-5" /> :
                       recommendation.category === 'product' ? <Package className="w-5 h-5" /> :
                       <Target className="w-5 h-5" />}
                </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-800">{recommendation.title}</p>
                        <Badge 
                          className={`${
                            recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                            recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          } text-xs`}
                        >
                          {recommendation.priority === 'high' ? 'Élevée' :
                           recommendation.priority === 'medium' ? 'Moyenne' :
                           'Faible'}
                        </Badge>
                        <Badge 
                          className={`${
                            recommendation.status === 'applied' ? 'bg-green-100 text-green-800' :
                            recommendation.status === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                            recommendation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          } text-xs`}
                        >
                          {recommendation.status === 'applied' ? 'Appliquée' :
                           recommendation.status === 'dismissed' ? 'Ignorée' :
                           recommendation.status === 'completed' ? 'Terminée' :
                           'En attente'}
                        </Badge>
              </div>
              
                      <p className="text-xs text-gray-600 mb-2">{recommendation.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                <div>
                          <span className="font-medium">Impact:</span> {recommendation.impact}
                </div>
                        <div>
                          <span className="font-medium">Effort:</span> {recommendation.effort}
              </div>
                <div>
                          <span className="font-medium">Valeur:</span> {recommendation.estimatedValue}
                </div>
                        <div>
                          <span className="font-medium">Temps:</span> {recommendation.estimatedTime}
              </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {recommendation.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApplyRecommendation(recommendation.id)}
                              className="text-xs h-6 px-2 bg-green-50 hover:bg-green-100 text-green-700"
                            >
                              Appliquer
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDismissRecommendation(recommendation.id)}
                              className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                            >
                              Ignorer
                            </Button>
                          </>
                        )}
                        
                        {recommendation.status === 'applied' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCompleteRecommendation(recommendation.id)}
                            className="text-xs h-6 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
                          >
                            Marquer terminée
                          </Button>
                        )}
                        
                        {recommendation.status === 'dismissed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApplyRecommendation(recommendation.id)}
                            className="text-xs h-6 px-2 bg-green-50 hover:bg-green-100 text-green-700"
                          >
                            Réactiver
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewAllRecommendations()}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir toutes les recommandations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal pour ajouter/modifier un objectif */}
      {showObjectiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingObjective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="objectiveTitle">Titre</Label>
                <Input
                  id="objectiveTitle"
                  defaultValue={editingObjective?.title || ''}
                  placeholder="Ex: Atteindre 1000 ventes/mois"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="objectiveDescription">Description</Label>
                <Input
                  id="objectiveDescription"
                  defaultValue={editingObjective?.description || ''}
                  placeholder="Description détaillée de l'objectif"
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="objectiveTarget">Objectif</Label>
                  <Input
                    id="objectiveTarget"
                    type="number"
                    defaultValue={editingObjective?.target || ''}
                    placeholder="1000"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="objectiveUnit">Unité</Label>
                  <Input
                    id="objectiveUnit"
                    defaultValue={editingObjective?.unit || ''}
                    placeholder="ventes/mois"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="objectivePriority">Priorité</Label>
                  <Select value={objectivePriority} onValueChange={(v) => setObjectivePriority(v as 'low' | 'medium' | 'high')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="objectiveDeadline">Date limite</Label>
                  <Input
                    id="objectiveDeadline"
                    type="date"
                    defaultValue={editingObjective?.deadline?.split('T')[0] || ''}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowObjectiveModal(false)
                  setEditingObjective(null)
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  // Récupérer les valeurs des champs et créer l'objectif
                  const title = (document.getElementById('objectiveTitle') as HTMLInputElement)?.value
                  const description = (document.getElementById('objectiveDescription') as HTMLInputElement)?.value
                  const target = parseFloat((document.getElementById('objectiveTarget') as HTMLInputElement)?.value || '0')
                  const unit = (document.getElementById('objectiveUnit') as HTMLInputElement)?.value
                  const priority = objectivePriority
                  const deadline = (document.getElementById('objectiveDeadline') as HTMLInputElement)?.value
                  
                  if (title && description && target > 0 && unit && deadline) {
                    const objective: Objective = {
                      id: editingObjective?.id || '',
                      title,
                      description,
                      target,
                      current: editingObjective?.current || 0,
                      unit,
                      status: editingObjective?.status || 'not_started',
                      priority,
                      deadline: new Date(deadline).toISOString(),
                      category: 'general',
                      createdAt: editingObjective?.createdAt || new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }
                    handleSaveObjective(objective)
                  } else {
                    addNotification({ 
  type: 'error', 
  title: 'Champs manquants', 
  message: 'Veuillez remplir tous les champs obligatoires' 
})
                  }
                }}
              >
                {editingObjective ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pour les recommandations IA */}
      {showRecommendationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Toutes les recommandations IA</h3>
            
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <div 
                  key={recommendation.id}
                  className={`p-4 rounded-lg border-2 ${
                    recommendation.status === 'applied' ? 'bg-green-50 border-green-200' :
                    recommendation.status === 'dismissed' ? 'bg-gray-50 border-gray-200' :
                    recommendation.status === 'completed' ? 'bg-blue-50 border-blue-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">{recommendation.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                      
                      <div className="grid grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                        <div>
                          <span className="font-medium">Priorité:</span> {recommendation.priority}
                        </div>
                        <div>
                          <span className="font-medium">Impact:</span> {recommendation.impact}
                        </div>
                        <div>
                          <span className="font-medium">Effort:</span> {recommendation.effort}
                        </div>
                        <div>
                          <span className="font-medium">Valeur:</span> {recommendation.estimatedValue}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Temps estimé:</span> {recommendation.estimatedTime}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {recommendation.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApplyRecommendation(recommendation.id)}
                            className="text-xs h-6 px-2 bg-green-50 hover:bg-green-100 text-green-700"
                          >
                            Appliquer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissRecommendation(recommendation.id)}
                            className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                          >
                            Ignorer
                          </Button>
                        </>
                      )}
                      
                      {recommendation.status === 'applied' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompleteRecommendation(recommendation.id)}
                          className="text-xs h-6 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700"
                        >
                          Terminer
                        </Button>
                      )}
                      
                      {recommendation.status === 'dismissed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApplyRecommendation(recommendation.id)}
                          className="text-xs h-6 px-2 bg-green-50 hover:bg-green-100 text-green-700"
                        >
                          Réactiver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRecommendationModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Fonction utilitaire pour formater la monnaie
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
