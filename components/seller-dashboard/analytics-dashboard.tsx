"use client"

import React, { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  Zap,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Users,
  ShoppingCart,
  Star,
  Share2,
  Coins,
  Award,
  FileText,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Types pour les données
interface SalesData {
  period: string
  sales: number
  revenue: number
  growth: number
}

interface ProductPerformance {
  id: string
  name: string
  sales: number
  revenue: number
  rating: number
  shares: number
  growth: number
}

interface SocialMediaStats {
  platform: string
  followers: number
  engagement: number
  reach: number
  growth: number
}

import type { VendorAnalyticsData, VendorAnalyticsPeriod } from '@/lib/vendor-analytics'

interface AnalyticsDashboardProps {
  analytics: VendorAnalyticsData | null
  isLoading: boolean
  period: VendorAnalyticsPeriod
  onPeriodChange: (period: VendorAnalyticsPeriod) => void
  onRefresh: () => Promise<void>
  onExportData: (type: string, format: string) => void
  onViewProductDetails: (productId: string) => void
  onViewCustomerProfile: (customerId: string) => void
}

export default function AnalyticsDashboard({
  analytics,
  isLoading,
  period: selectedPeriod,
  onPeriodChange,
  onRefresh,
  onExportData,
  onViewProductDetails,
  onViewCustomerProfile
}: AnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState('sales')
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState({ type: 'info', title: '', message: '' })

  // États pour les modals et actions
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductPerformance | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [selectedReportType, setSelectedReportType] = useState<string>('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const salesData: SalesData[] = (analytics?.salesSeries ?? []).map((row) => ({
    period: row.period,
    sales: row.sales,
    revenue: row.revenue,
    growth: row.growth
  }))

  const productPerformance: ProductPerformance[] = (analytics?.topProducts ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sales: p.sales,
    revenue: p.revenue,
    rating: p.rating,
    shares: p.shares,
    growth: p.growth
  }))

  const socialMediaStats: SocialMediaStats[] = (analytics?.sharePlatforms ?? []).map((p) => ({
    platform: p.platform,
    followers: p.shares,
    engagement: p.engagement,
    reach: p.reach,
    growth: p.growth
  }))

  const overview = analytics?.overview
  const summary = analytics?.summary
  const maxSales = Math.max(...salesData.map((item) => item.sales), 1)
  const customersSample = analytics?.customersSample ?? []
  const revenueFromSeries = salesData.reduce((sum, item) => sum + (Number(item.revenue ?? 0) || 0), 0)
  const displayedRevenue = Number(summary?.totalRevenue ?? 0) > 0 ? Number(summary?.totalRevenue ?? 0) : revenueFromSeries

  const selectedCustomerData = customersSample.find((c) => c.id === selectedCustomer) ?? null

  // Fonctions utilitaires
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // NOUVELLE FONCTION : Conversion en points pour les montants
  const convertToPoints = (value: number) => {
    // 1 XOF = 1 point
    return Math.round(value)
  }

  // NOUVELLE FONCTION : Affichage double (devise CFA + points) pour les montants uniquement
  const displayAmountWithPoints = (amount: number) => {
    const points = convertToPoints(amount)
    return `${formatCurrency(amount)} (${formatNumber(points)} pts)`
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Activity className="w-4 h-4 text-gray-600" />
  }

  // FONCTIONS D'ACTION AVEC NOTIFICATIONS MODERNES
  const showSimpleNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotificationData({ type, title, message })
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 4000)
  }

  const handlePeriodChange = (nextPeriod: string) => {
    void onPeriodChange(nextPeriod as VendorAnalyticsPeriod)
    showSimpleNotification('info', 'Changement de période', `Mise à jour des données pour la période: ${nextPeriod}`)
  }

  const handleMetricChange = (metric: string) => {
    setSelectedMetric(metric)
    showSimpleNotification('info', 'Métrique changée', `Affichage des données pour: ${metric}`)
  }

  const handleViewProductDetailsLocal = (productId: string) => {
    const product = productPerformance.find((p) => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setShowProductModal(true)
    }
    onViewProductDetails(productId)
  }

  const handleViewCustomerProfileLocal = (customerId: string) => {
    setSelectedCustomer(customerId)
    setShowCustomerModal(true)
    onViewCustomerProfile(customerId)
  }

  const handleRefreshData = async () => {
    showSimpleNotification('info', 'Actualisation', 'Synchronisation avec la base de données...')
    await onRefresh()
    showSimpleNotification('success', 'Données actualisées', 'Les statistiques sont à jour.')
  }

  const handleGenerateReport = (type: string) => {
    onExportData(type === 'ventes' ? 'summary' : 'detailed', 'json')
    showSimpleNotification('success', 'Rapport généré', `Export JSON du rapport ${type}.`)
  }

  const handleExportDataLocal = (type: string, format: string) => {
    onExportData(type, format === 'pdf' || format === 'excel' ? 'json' : format)
    showSimpleNotification('success', 'Export lancé', `Export ${type} en cours.`)
  }

  return (
    <div className="space-y-6">
      {/* Notification simple */}
      {showNotification && (
        <div className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg max-w-sm ${
          notificationData.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notificationData.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          notificationData.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notificationData.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
               notificationData.type === 'error' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
               notificationData.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
               <CheckCircle className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">{notificationData.title}</h4>
              <p className="text-sm">{notificationData.message}</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* En-tête avec filtres et actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vue d'Ensemble Analytics</h2>
          <p className="text-sm text-gray-600">Tableau de bord complet de vos performances et métriques clés</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedMetric} onValueChange={handleMetricChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Métrique" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Ventes</SelectItem>
              <SelectItem value="revenue">Chiffre d'affaires</SelectItem>
              <SelectItem value="customers">Clients</SelectItem>
              <SelectItem value="engagement">Engagement</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventes totales */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#ff6600] bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-orange-700">Ventes Totales</p>
                <p className="text-2xl font-bold text-orange-900">{formatNumber(summary?.totalSales ?? salesData.reduce((sum, item) => sum + item.sales, 0))}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <ShoppingCart className="w-5 h-5 text-[#ff6600]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getGrowthIcon(overview?.salesGrowthRate ?? summary?.growthRate ?? 0)}
              <span className="text-sm font-medium text-green-600">{formatPercentage(overview?.salesGrowthRate ?? summary?.growthRate ?? 0)}</span>
              <span className="text-sm text-orange-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Chiffre d'affaires */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#3b82f6] bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-blue-700">Chiffre d'Affaires</p>
                <p className="text-xl font-bold text-blue-900">{displayAmountWithPoints(displayedRevenue)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getGrowthIcon(overview?.revenueGrowthRate ?? summary?.revenueGrowthRate ?? 0)}
              <span className="text-sm font-medium text-green-600">{formatPercentage(overview?.revenueGrowthRate ?? summary?.revenueGrowthRate ?? 0)}</span>
              <span className="text-sm text-blue-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Clients actifs */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#8b5cf6] bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-purple-700">Clients Actifs</p>
                <p className="text-2xl font-bold text-purple-900">{formatNumber(overview?.activeCustomers ?? summary?.totalCustomers ?? 0)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Users className="w-5 h-5 text-[#8b5cf6]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getGrowthIcon(overview?.customersGrowthRate ?? 0)}
              <span className="text-sm font-medium text-green-600">{formatPercentage(overview?.customersGrowthRate ?? 0)}</span>
              <span className="text-sm text-purple-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Taux de conversion */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#10b981] bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-green-700">Taux de Conversion</p>
                <p className="text-2xl font-bold text-green-900">{(overview?.conversionRate ?? summary?.conversionRate ?? 0).toFixed(2)}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="w-5 h-5 text-[#10b981]" />
              </div>
            </div>
            <Progress value={Math.min(100, overview?.conversionRate ?? summary?.conversionRate ?? 0)} className="h-2 mb-2 bg-green-100" />
            <div className="flex items-center space-x-2">
              {getGrowthIcon(overview?.conversionGrowthRate ?? 0)}
              <span className="text-sm font-medium text-green-600">{formatPercentage(overview?.conversionGrowthRate ?? 0)}</span>
              <span className="text-sm text-green-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et visualisations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="w-5 h-5 text-blue-600" />
              <span>Évolution des Ventes</span>
            </CardTitle>
            <CardDescription>Progression mensuelle de vos ventes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {salesData.map((item, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div
                    className="w-8 bg-blue-500 rounded-t-sm transition-all duration-300 hover:scale-110 cursor-pointer"
                    style={{ height: `${(item.sales / maxSales) * 200}px` }}
                    onClick={() => productPerformance[0] && handleViewProductDetailsLocal(productPerformance[0].id)}
                  />
                  <span className="text-xs text-gray-600">{item.period}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Ventes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance des produits */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span>Performance des Produits</span>
            </CardTitle>
            <CardDescription>Top 3 des produits les plus performants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productPerformance.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Star className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{displayAmountWithPoints(product.revenue)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatNumber(product.sales)}</p>
                      <p className="text-xs text-gray-500">ventes</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProductDetailsLocal(product.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Réseaux sociaux et engagement */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-[#8b5cf6]" />
            <span>Réseaux Sociaux & Engagement</span>
          </CardTitle>
          <CardDescription>Performance de vos plateformes sociales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {socialMediaStats.map((platform) => (
              <div key={platform.platform} className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 mb-2">{platform.platform}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-[#3b82f6]">{formatNumber(platform.followers)}</p>
                    <p className="text-sm text-gray-500">Partages</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#10b981]">{platform.engagement}%</p>
                    <p className="text-sm text-gray-500">Engagement</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#8b5cf6]">{formatNumber(platform.reach)}</p>
                    <p className="text-sm text-gray-500">Portée</p>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    {getGrowthIcon(platform.growth)}
                    <span className={`text-sm font-medium ${platform.growth > 0 ? 'text-green-600' : platform.growth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatPercentage(platform.growth)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides */}
      <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#3b82f6]/10 to-[#8b5cf6]/10 border border-[#3b82f6]/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions Rapides</h3>
              <p className="text-gray-600">Accédez rapidement aux fonctionnalités essentielles</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleGenerateReport('ventes')}
                className="flex items-center space-x-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              >
                <FileText className="w-4 h-4" />
                <span>Rapport Ventes</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleGenerateReport('performance')}
                className="flex items-center space-x-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Rapport Performance</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleExportDataLocal('summary', 'json')}
                className="flex items-center space-x-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleExportDataLocal('detailed', 'json')}
                className="flex items-center space-x-2 border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white"
              >
                <FileText className="w-4 h-4" />
                <span>Export Excel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Détails Produit */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-[#10b981]" />
              <span>Détails du Produit</span>
            </DialogTitle>
            <DialogDescription>
              Informations détaillées et performances du produit
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-600">ID: {selectedProduct.id}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ventes</span>
                      <span className="font-medium">{formatNumber(selectedProduct.sales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Chiffre d'affaires</span>
                      <span className="font-medium">{displayAmountWithPoints(selectedProduct.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Note</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">{selectedProduct.rating}/5</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Partages</span>
                      <span className="font-medium">{formatNumber(selectedProduct.shares)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Croissance</span>
                      <span className={`font-medium ${selectedProduct.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(selectedProduct.growth)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Objectif de vente</span>
                          <span>250</span>
                        </div>
                        <Progress value={(selectedProduct.sales / 250) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Objectif de revenus</span>
                          <span>{displayAmountWithPoints(40000)}</span>
                        </div>
                        <Progress value={(selectedProduct.revenue / 40000) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-[#3b82f6]/10 rounded-lg border border-[#3b82f6]/20">
                    <h4 className="font-medium text-[#3b82f6] mb-2">Actions Recommandées</h4>
                    <ul className="text-sm text-[#3b82f6] space-y-1">
                      <li>• Augmenter la visibilité sur les réseaux sociaux</li>
                      <li>• Optimiser le prix selon la concurrence</li>
                      <li>• Améliorer la description du produit</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowProductModal(false)}>
                  Fermer
                </Button>
                <Button 
                  onClick={() => {
                    showSimpleNotification('info', 'Action', 'Fonctionnalité d\'édition à implémenter')
                  }}
                  className="bg-[#10b981] hover:bg-[#10b981]/90"
                >
                  Modifier le Produit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Profil Client */}
      <Dialog open={showCustomerModal} onOpenChange={setShowCustomerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#8b5cf6]" />
              <span>Profil Client</span>
            </DialogTitle>
            <DialogDescription>
              Informations détaillées et historique du client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedCustomerData?.name ?? `Client ${selectedCustomer}`}</h3>
                  <p className="text-sm text-gray-600">ID: {selectedCustomer}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Commandes</span>
                    <span className="font-medium">{formatNumber(selectedCustomerData?.ordersCount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total dépensé</span>
                    <span className="font-medium">{displayAmountWithPoints(selectedCustomerData?.totalSpent ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Dernière commande</span>
                    <span className="font-medium">
                      {selectedCustomerData?.lastOrderAt
                        ? new Date(selectedCustomerData.lastOrderAt).toLocaleDateString('fr-FR')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Statut</span>
                    <Badge className={selectedCustomerData?.isRepeat ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30' : 'bg-gray-100 text-gray-700'}>
                      {selectedCustomerData?.isRepeat ? 'Client fidèle' : 'Nouveau client'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Préférences</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Produits technologiques</p>
                    <p>• Paiement par carte</p>
                    <p>• Livraison express</p>
                  </div>
                </div>
                <div className="p-4 bg-[#8b5cf6]/10 rounded-lg border border-[#8b5cf6]/20">
                  <h4 className="font-medium text-[#8b5cf6] mb-2">Engagement</h4>
                  <div className="space-y-2 text-sm text-[#8b5cf6]">
                    <p>• Newsletter: Oui</p>
                    <p>• Notifications: Oui</p>
                    <p>• Avis laissés: 8</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCustomerModal(false)}>
                Fermer
              </Button>
              <Button 
                onClick={() => {
                  showSimpleNotification('info', 'Action', 'Fonctionnalité de contact à implémenter')
                }}
                className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90"
              >
                Contacter le Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Génération de Rapport */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#3b82f6]" />
              <span>Générer un Rapport</span>
            </DialogTitle>
            <DialogDescription>
              Configurez et générez votre rapport personnalisé
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Type de rapport</label>
                <p className="text-lg font-semibold text-gray-900 capitalize">{selectedReportType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Période</label>
                <Select value={selectedPeriod} onValueChange={(v) => onPeriodChange(v as VendorAnalyticsPeriod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="90d">3 derniers mois</SelectItem>
                    <SelectItem value="1y">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Format</label>
                <div className="flex space-x-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white"
                    onClick={() => handleGenerateReport(selectedReportType || 'summary')}
                    disabled={isLoading}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white"
                    onClick={() => handleGenerateReport(selectedReportType || 'summary')}
                    disabled={isLoading}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </div>
            {isGeneratingReport && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#3b82f6]" />
                  <span className="text-sm text-gray-600">Génération en cours...</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport(selectedReportType || 'summary')}
                disabled={isLoading}
                className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
              >
                {isGeneratingReport ? 'Génération...' : 'Générer le Rapport'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
