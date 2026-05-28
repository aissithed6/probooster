"use client"

import React, { useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { SimpleNotification } from '@/components/ui/notification'

import AnalyticsDashboard from './analytics-dashboard'
import AdvancedAnalytics from './advanced-analytics'
import AnalyticsActions from './analytics-actions'
import { useVendorAnalytics } from '@/lib/hooks/use-vendor-analytics'
import { buildVendorAnalyticsExportBlob, type VendorAnalyticsPeriod } from '@/lib/vendor-analytics'

interface StatisticsAnalyticsSectionProps {
  onExportData: (type: string, format: string) => void
  onViewProductDetails: (productId: string) => void
  onViewCustomerProfile: (customerId: string) => void
  onViewDetailedReport: (metric: string) => void
}

export default function StatisticsAnalyticsSection({
  onExportData,
  onViewProductDetails,
  onViewCustomerProfile,
  onViewDetailedReport
}: StatisticsAnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState({ type: 'info', title: '', message: '' })

  const { data: analytics, period, isLoading, error, changePeriod, refresh } = useVendorAnalytics('30d')

  const summary = analytics?.summary
  const revenueFromSeries = (analytics?.salesSeries ?? []).reduce((sum, row) => sum + (Number(row?.revenue ?? 0) || 0), 0)
  const displayedRevenue = Number(summary?.totalRevenue ?? 0) > 0 ? Number(summary?.totalRevenue ?? 0) : revenueFromSeries

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

  const handlePeriodChange = async (next: string) => {
    const p = next as VendorAnalyticsPeriod
    await changePeriod(p)
    showSimpleNotification('success', 'Période mise à jour', `Données chargées pour ${next}.`)
  }

  const handleRefreshData = async () => {
    await refresh()
    showSimpleNotification('success', 'Données actualisées', 'Les statistiques sont synchronisées avec la base de données.')
  }

  const handleExport = (type: string, format: string) => {
    if (!analytics) {
      showSimpleNotification('warning', 'Export impossible', 'Les données ne sont pas encore chargées.')
      return
    }

    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'json'
    const blob = buildVendorAnalyticsExportBlob(analytics, type)
    const date = new Date().toISOString().split('T')[0]
    downloadBlob(blob, `analytics-vendeur-${type}-${date}.${ext}`)
    onExportData(type, format)
    showSimpleNotification('success', 'Export réussi', `Rapport ${type} exporté (${ext}).`)
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
            <Select value={period} onValueChange={(value) => void handlePeriodChange(value)} disabled={isLoading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="90d">3 derniers mois</SelectItem>
                <SelectItem value="1y">1 an</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport('all', 'json')} disabled={!analytics || isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Rapport Complet
            </Button>
            <Button onClick={() => void handleRefreshData()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
                  <p className="text-3xl font-bold text-blue-900">{formatNumber(summary?.totalSales ?? 0)}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {summary?.growthRate != null ? `${summary.growthRate > 0 ? '+' : ''}${summary.growthRate}%` : '—'}
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
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(displayedRevenue)}</p>
                  <span className="text-sm font-medium text-green-600">
                    {summary?.revenueGrowthRate != null ? `${summary.revenueGrowthRate > 0 ? '+' : ''}${summary.revenueGrowthRate}%` : '—'}
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
                  <div className="mt-2">{getPositionBadge(summary?.marketPosition ?? 0)}</div>
                  <p className="text-sm text-purple-600 mt-2">
                    Sur {formatNumber(summary?.totalVendors ?? 0)} vendeur(s)
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
                    <span className="text-3xl font-bold text-yellow-900">{(summary?.averageRating ?? 0).toFixed(1)}</span>
                    <span className="text-lg text-yellow-700">/5</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">{formatNumber(summary?.totalReviews ?? 0)} avis approuvés</p>
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
              <p className="text-xl font-bold">{formatNumber(summary?.totalCustomers ?? 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Taux de conversion</p>
              <p className="text-xl font-bold">{(summary?.conversionRate ?? 0).toFixed(2)}%</p>
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

            <TabsContent value="overview" className="p-6">
              <AnalyticsDashboard
                analytics={analytics}
                isLoading={isLoading}
                period={period}
                onPeriodChange={(p) => void changePeriod(p)}
                onRefresh={refresh}
                onExportData={handleExport}
                onViewProductDetails={onViewProductDetails}
                onViewCustomerProfile={onViewCustomerProfile}
              />
            </TabsContent>

            <TabsContent value="analytics" className="p-6">
              <AdvancedAnalytics
                analytics={analytics}
                isLoading={isLoading}
                onExportInsights={handleExport}
                onViewDetailedReport={onViewDetailedReport}
                onRefresh={refresh}
              />
            </TabsContent>

            <TabsContent value="insights" className="p-6">
              <AnalyticsActions
                analytics={analytics}
                isLoading={isLoading}
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
            <p className="text-gray-600">Exports JSON basés sur vos données réelles en base</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => handleExport('summary', 'json')}>
              <FileText className="w-4 h-4 mr-2" />
              Rapport Synthèse
            </Button>
            <Button variant="outline" onClick={() => handleExport('detailed', 'json')}>
              <Download className="w-4 h-4 mr-2" />
              Données détaillées
            </Button>
            <Button variant="outline" onClick={() => handleExport('insights', 'json')}>
              <Lightbulb className="w-4 h-4 mr-2" />
              Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
