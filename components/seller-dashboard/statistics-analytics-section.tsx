"use client"

import React, { useEffect, useMemo, useState } from 'react'
import {
  TrendingUp,
  BarChart3,
  Zap,
  Download,
  RefreshCw,
  Star,
  Share2,
  Coins,
  Award,
  ShoppingCart,
  Lightbulb,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnalyticsExportFormatMenu } from './analytics-export-format-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { SimpleNotification } from '@/components/ui/notification'

import AnalyticsDashboard from './analytics-dashboard'
import AdvancedAnalytics from './advanced-analytics'
import AnalyticsActions from './analytics-actions'
import { ClientAuthService } from '@/lib/services/client-auth-service'
import { useVendorAnalytics } from '@/lib/hooks/use-vendor-analytics'
import { supabase } from '@/lib/supabase'
import type { SellerOrder, SellerProduct, SellerRevenue, SellerStats } from '@/lib/services/seller-dashboard-service'
import {
  buildSyncedAdvancedMetrics,
  buildSyncedInsights,
  buildSyncedOptimizations,
  buildSyncedTopCardSummary,
  buildVendorAnalyticsExportFile,
  buildLocalAnalyticsFallback,
  mergeAnalyticsWithDashboardRevenue,
  type VendorAnalyticsExportFileFormat,
  type VendorAnalyticsPeriod
} from '@/lib/vendor-analytics'

const LAST_FULL_REPORT_FORMAT_KEY = 'vendor-full-report-format'

interface ReputationSnapshot {
  overallRating: number
  totalReviews: number
}

interface StatisticsAnalyticsSectionProps {
  vendorId?: string
  /** Données CA déjà correctes (onglet Chiffre d'affaires) — source de vérité pour les cartes. */
  dashboardRevenue?: SellerRevenue | null
  dashboardStats?: SellerStats | null
  /** Commandes vendeur (onglet Commandes) — utilisées si le CA dashboard n'est pas encore hydraté. */
  orders?: SellerOrder[]
  /** Même source que l'onglet Avis & Réputation (`computeReputationStats`). */
  reputation?: ReputationSnapshot | null
  products?: SellerProduct[]
  onExportData: (type: string, format: string) => void
  onViewProductDetails: (productId: string) => void
  onViewCustomerProfile: (customerId: string) => void
  onViewDetailedReport: (metric: string) => void
}

export default function StatisticsAnalyticsSection({
  vendorId = '',
  dashboardRevenue,
  dashboardStats,
  orders = [],
  reputation,
  products = [],
  onExportData,
  onViewProductDetails,
  onViewCustomerProfile,
  onViewDetailedReport
}: StatisticsAnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState({ type: 'info', title: '', message: '' })
  const [fetchedRevenue, setFetchedRevenue] = useState<SellerRevenue | null>(null)
  const [fetchedStats, setFetchedStats] = useState<SellerStats | null>(null)
  const [rankingSnapshot, setRankingSnapshot] = useState<{ position: number; totalVendors: number } | null>(null)
  const [totalProductViews, setTotalProductViews] = useState(0)
  const [isExportingReport, setIsExportingReport] = useState(false)

  const effectiveRevenue = useMemo(() => {
    const local = dashboardRevenue
    const hasLocal =
      Number(local?.totalRevenue ?? 0) > 0 ||
      Number(local?.totalRevenue30Days ?? 0) > 0 ||
      (Array.isArray(local?.salesEvolution) && local!.salesEvolution!.length > 0)
    if (hasLocal) return local
    return fetchedRevenue ?? local ?? null
  }, [dashboardRevenue, fetchedRevenue])

  const effectiveStats = useMemo(() => {
    if (dashboardStats && (dashboardStats.ranking > 0 || dashboardStats.totalVendors > 0)) {
      return dashboardStats
    }
    return fetchedStats ?? dashboardStats ?? null
  }, [dashboardStats, fetchedStats])

  useEffect(() => {
    const needsRevenue =
      !effectiveRevenue ||
      (Number(effectiveRevenue.totalRevenue ?? 0) <= 0 &&
        Number(effectiveRevenue.totalRevenue30Days ?? 0) <= 0 &&
        (!Array.isArray(effectiveRevenue.salesEvolution) || effectiveRevenue.salesEvolution.length === 0))
    const needsStats = !effectiveStats || (effectiveStats.ranking <= 0 && effectiveStats.totalVendors <= 0)
    if (!needsRevenue && !needsStats) return

    void (async () => {
      try {
        const headers = await ClientAuthService.buildAuthHeaders()
        const response = await fetch('/api/vendor/dashboard', {
          method: 'GET',
          headers,
          credentials: 'include',
          cache: 'no-store'
        })
        if (!response.ok) return
        const payload = await response.json().catch(() => ({}))
        const data = payload?.data ?? payload
        if (needsRevenue && data?.revenue) setFetchedRevenue(data.revenue as SellerRevenue)
        if (needsStats && data?.stats) setFetchedStats(data.stats as SellerStats)
      } catch {
        // ignore
      }
    })()
  }, [effectiveRevenue, effectiveStats])

  /** Classement : API Classements (`/api/vendor/rankings/leaderboard`) — source réelle. */
  useEffect(() => {
    if (!vendorId) return
    void (async () => {
      try {
        const headers = await ClientAuthService.buildAuthHeaders()
        const response = await fetch(
          '/api/vendor/rankings/leaderboard?metric=overall&limit=500&range=month',
          { method: 'GET', headers, credentials: 'include', cache: 'no-store' }
        )
        if (!response.ok) return
        const payload = await response.json().catch(() => ({}))
        const rows = Array.isArray(payload?.data) ? payload.data : []
        let position = 0
        for (const row of rows) {
          const uid = String(row?.user_id ?? row?.userId ?? '').trim()
          if (uid && uid === vendorId) {
            const raw =
              row?.overall_rank ?? row?.overallRank ?? row?.rank ?? row?.ranking ?? row?.score ?? 0
            position = Number(raw) || 0
            break
          }
        }
        setRankingSnapshot({ position, totalVendors: rows.length })
      } catch {
        // ignore
      }
    })()
  }, [vendorId])

  /** Vues produits : table `product_statistics` (base réelle). */
  useEffect(() => {
    const productIds = products.map((p) => String(p?.id ?? '')).filter(Boolean)
    if (productIds.length === 0) {
      setTotalProductViews(0)
      return
    }
    void (async () => {
      try {
        const { data } = await supabase
          .from('product_statistics')
          .select('total_views')
          .in('product_id', productIds as any)
        const sum = (data ?? []).reduce((acc, row) => acc + (Number((row as any)?.total_views ?? 0) || 0), 0)
        setTotalProductViews(sum)
      } catch {
        setTotalProductViews(0)
      }
    })()
  }, [products])

  const {
    data: analytics,
    period,
    isLoading,
    isRefreshing,
    error,
    trustApiForPeriod,
    changePeriod,
    refresh
  } = useVendorAnalytics('30d', effectiveRevenue)

  const ordersForMetrics = useMemo(
    () =>
      orders.map((o) => ({
        orderDate: o.orderDate,
        status: o.status,
        totalAmount: o.totalAmount,
        products: o.products?.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: p.quantity
        })),
        customerEmail: o.customerEmail,
        customerName: o.customerName
      })),
    [orders]
  )

  const productsForMetrics = useMemo(
    () => products.map((p) => ({ id: p.id, name: p.name })),
    [products]
  )

  const analyticsMerged = useMemo(() => {
    if (!analytics) return null
    return mergeAnalyticsWithDashboardRevenue(analytics, effectiveRevenue ?? null, period, {
      orders: ordersForMetrics,
      products: productsForMetrics,
      trustApi: trustApiForPeriod
    })
  }, [analytics, effectiveRevenue, period, ordersForMetrics, productsForMetrics, trustApiForPeriod])

  /** API analytics indisponible (échec fetch) → repli local sur CA dashboard + commandes. */
  const analyticsUnavailable = !isLoading && !analyticsMerged
  const fallbackAnalytics = useMemo(
    () =>
      analyticsUnavailable
        ? buildLocalAnalyticsFallback({
            period,
            revenue: effectiveRevenue ?? null,
            orders: ordersForMetrics,
            products: productsForMetrics,
            stats: effectiveStats ?? null,
            reputation: reputation ?? null,
            rankingSnapshot,
            totalProductViews
          })
        : null,
    [
      analyticsUnavailable,
      period,
      effectiveRevenue,
      ordersForMetrics,
      productsForMetrics,
      effectiveStats,
      reputation,
      rankingSnapshot,
      totalProductViews
    ]
  )

  const analyticsSource = analyticsMerged ?? fallbackAnalytics

  const topCards = useMemo(
    () =>
      buildSyncedTopCardSummary({
        period,
        analyticsSummary: analyticsSource?.summary ?? null,
        revenue: effectiveRevenue,
        stats: effectiveStats,
        orders: ordersForMetrics,
        reputation: reputation ?? null,
        rankingSnapshot,
        totalProductViews,
        trustApi: trustApiForPeriod
      }),
    [
      analyticsSource?.summary,
      effectiveRevenue,
      effectiveStats,
      orders,
      period,
      reputation,
      rankingSnapshot,
      totalProductViews,
      trustApiForPeriod
    ]
  )

  const analyticsForUi = useMemo(() => {
    if (!analyticsSource) return null
    return {
      ...analyticsSource,
      summary: {
        ...analyticsSource.summary,
        totalRevenue: topCards.totalRevenue,
        totalSales: topCards.totalSales,
        growthRate: topCards.growthRate,
        revenueGrowthRate: topCards.revenueGrowthRate,
        marketPosition: topCards.marketPosition,
        totalVendors: topCards.totalVendors,
        averageRating: topCards.averageRating,
        totalReviews: topCards.totalReviews,
        totalCustomers: topCards.activeCustomers,
        conversionRate: topCards.conversionRate
      },
      overview: {
        ...analyticsSource.overview,
        activeCustomers: topCards.activeCustomers,
        conversionRate: topCards.conversionRate
      },
      advanced: buildSyncedAdvancedMetrics({
        period,
        apiAdvanced: analyticsSource.advanced,
        orders: ordersForMetrics,
        totalRevenue: topCards.totalRevenue,
        activeCustomers: topCards.activeCustomers
      }),
      insights: buildSyncedInsights({
        summary: {
          ...analyticsSource.summary,
          totalRevenue: topCards.totalRevenue,
          totalSales: topCards.totalSales,
          totalShares: analyticsSource.summary.totalShares,
          conversionRate: topCards.conversionRate,
          growthRate: topCards.growthRate
        },
        apiInsights: analyticsSource.insights,
        growthRate: topCards.growthRate
      }),
      optimizations: buildSyncedOptimizations({
        summary: {
          ...analyticsSource.summary,
          totalRevenue: topCards.totalRevenue,
          totalSales: topCards.totalSales,
          averageRating: topCards.averageRating,
          totalShares: analyticsSource.summary.totalShares,
          conversionRate: topCards.conversionRate
        },
        topProducts: analyticsSource.topProducts,
        apiOptimizations: analyticsSource.optimizations
      })
    }
  }, [analyticsSource, topCards, ordersForMetrics, period])

  const isInitialLoad = isLoading && !analyticsForUi
  const summary = analyticsForUi?.summary

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount)

  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num)

  const getPositionBadge = (position: number) => {
    if (position <= 0) return <Badge variant="secondary">—</Badge>
    if (position === 1) return <Badge className="bg-yellow-100 text-yellow-800">🥇 1er</Badge>
    if (position === 2) return <Badge className="bg-gray-100 text-gray-800">🥈 2ème</Badge>
    if (position === 3) return <Badge className="bg-orange-100 text-orange-800">🥉 3ème</Badge>
    return <Badge variant="secondary">{position}ème</Badge>
  }

  const showSimpleNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotificationData({ type, title, message })
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 4000)
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handlePeriodChange = (next: string) => {
    changePeriod(next as VendorAnalyticsPeriod)
  }

  const handleRefreshData = async () => {
    await refresh()
    showSimpleNotification('success', 'Données actualisées', 'Les statistiques sont synchronisées avec la base de données.')
  }

  const handleExport = async (type: string, format: string) => {
    if (!analyticsForUi) {
      showSimpleNotification('warning', 'Export impossible', 'Les données ne sont pas encore chargées.')
      return
    }

    const resolvedFormat: VendorAnalyticsExportFileFormat =
      format === 'pdf' ? 'pdf' : format === 'csv' || format === 'excel' ? 'csv' : 'json'

    try {
      if (type === 'all') {
        setIsExportingReport(true)
        try {
          sessionStorage.setItem(LAST_FULL_REPORT_FORMAT_KEY, resolvedFormat)
        } catch {
          // ignore
        }
      }

      const { blob, extension } = await buildVendorAnalyticsExportFile(
        analyticsForUi,
        type,
        resolvedFormat
      )
      const date = new Date().toISOString().split('T')[0]
      downloadBlob(blob, `analytics-vendeur-${type}-${date}.${extension}`)
      onExportData(type, extension)

      const formatLabel =
        extension === 'pdf' ? 'PDF' : extension === 'csv' ? 'CSV (Excel)' : 'JSON'
      showSimpleNotification(
        'success',
        'Export réussi',
        `Rapport téléchargé avec vos données synchronisées (${formatLabel}).`
      )
    } catch (err) {
      showSimpleNotification(
        'error',
        'Export échoué',
        err instanceof Error ? err.message : 'Impossible de générer le fichier.'
      )
    } finally {
      setIsExportingReport(false)
    }
  }

  return (
    <div className="space-y-6">
      {showNotification && (
        <SimpleNotification
          type={notificationData.type as 'success' | 'error' | 'warning' | 'info'}
          title={notificationData.title}
          message={notificationData.message}
          onClose={() => setShowNotification(false)}
        />
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Statistiques & Analyses</h1>
            <p className="text-xl text-gray-600">
              Données synchronisées avec vos commandes, avis approuvés, partages et classement
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={handlePeriodChange} disabled={isInitialLoad}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">3 derniers mois</SelectItem>
                <SelectItem value="1y">1 an</SelectItem>
                <SelectItem value="2y">2 ans</SelectItem>
                <SelectItem value="3y">3 ans</SelectItem>
              </SelectContent>
            </Select>
            <AnalyticsExportFormatMenu
              reportType="all"
              onExport={handleExport}
              disabled={!analyticsForUi || isInitialLoad || isExportingReport}
            >
              <Button variant="outline" disabled={!analyticsForUi || isInitialLoad || isExportingReport}>
                <Download className={`w-4 h-4 mr-2 ${isExportingReport ? 'animate-pulse' : ''}`} />
                Rapport Complet
              </Button>
            </AnalyticsExportFormatMenu>
            <Button onClick={() => void handleRefreshData()} disabled={isInitialLoad}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Ventes (période)</p>
                  <p className="text-3xl font-bold text-blue-900">{formatNumber(topCards.totalSales)}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {topCards.growthRate !== 0 ? `${topCards.growthRate > 0 ? '+' : ''}${topCards.growthRate}%` : '—'}
                    </span>
                  </div>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Chiffre d&apos;affaires</p>
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(topCards.totalRevenue)}</p>
                  <span className="text-sm font-medium text-green-600">
                    {topCards.revenueGrowthRate !== 0
                      ? `${topCards.revenueGrowthRate > 0 ? '+' : ''}${topCards.revenueGrowthRate}%`
                      : '—'}
                  </span>
                </div>
                <TrendingUp className="w-8 h-8 text-green-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Position Marché</p>
                  <div className="mt-2">{getPositionBadge(topCards.marketPosition)}</div>
                  <p className="text-sm text-purple-600 mt-2">
                    Sur {formatNumber(topCards.totalVendors)} vendeur(s)
                  </p>
                </div>
                <Award className="w-8 h-8 text-purple-700" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Note moyenne</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <span className="text-3xl font-bold text-yellow-900">{topCards.averageRating.toFixed(1)}</span>
                    <span className="text-lg text-yellow-700">/5</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">{formatNumber(topCards.totalReviews)} avis approuvés</p>
                </div>
                <Star className="w-8 h-8 text-yellow-700" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Partages</p>
                  <p className="text-xl font-bold">{formatNumber(summary?.totalShares ?? 0)}</p>
                </div>
              </div>
              <Progress value={summary?.sharesProgress ?? 0} className="w-20 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Points fidélité</p>
                  <p className="text-xl font-bold">{formatNumber(summary?.totalPoints ?? 0)}</p>
                </div>
              </div>
              <Progress value={summary?.pointsProgress ?? 0} className="w-20 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Clients actifs</p>
              <p className="text-xl font-bold">{formatNumber(topCards.activeCustomers)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Taux de conversion</p>
              <p className="text-xl font-bold">{topCards.conversionRate.toFixed(2)}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-16">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Vue d&apos;ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Analytics Avancées</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Insights IA</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-6 min-w-0 overflow-x-hidden">
              <AnalyticsDashboard
                analytics={analyticsForUi}
                isLoading={isInitialLoad}
                period={period}
                onPeriodChange={changePeriod}
                onRefresh={refresh}
                onExportData={handleExport}
                onViewProductDetails={onViewProductDetails}
                onViewCustomerProfile={onViewCustomerProfile}
              />
            </TabsContent>

            <TabsContent value="analytics" className="p-6">
              <AdvancedAnalytics
                analytics={analyticsForUi}
                isLoading={isInitialLoad}
                period={period}
                onPeriodChange={changePeriod}
                onExportInsights={handleExport}
                onViewDetailedReport={onViewDetailedReport}
                onRefresh={refresh}
              />
            </TabsContent>

            <TabsContent value="insights" className="p-6">
              <AnalyticsActions
                analytics={analyticsForUi}
                isLoading={isInitialLoad}
                onExport={handleExport}
                onRefresh={refresh}
                onViewProductDetails={onViewProductDetails}
                onViewDetailedReport={onViewDetailedReport}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Générer des rapports</h3>
            <p className="text-gray-600">
              Choisissez PDF, CSV ou JSON — données synchronisées (base + dashboard)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AnalyticsExportFormatMenu
              reportType="summary"
              onExport={handleExport}
              disabled={!analyticsForUi || isInitialLoad}
              label="Rapport Synthèse"
            />
            <AnalyticsExportFormatMenu
              reportType="detailed"
              onExport={handleExport}
              disabled={!analyticsForUi || isInitialLoad}
              label="Données détaillées"
            />
            <AnalyticsExportFormatMenu
              reportType="insights"
              onExport={handleExport}
              disabled={!analyticsForUi || isInitialLoad}
              label="Insights"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
