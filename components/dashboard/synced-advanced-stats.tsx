"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  Target,
  RefreshCw,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Star,
  Share2,
  Eye,
  Package,
  Gift
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

interface SyncedAdvancedStatsProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedAdvancedStats({ data, isLoading, onRefresh }: SyncedAdvancedStatsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  // Calculer les statistiques avancées basées sur les vraies données
  const calculateAdvancedStats = () => {
    if (!data) return null

    const now = new Date()
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[selectedPeriod]

    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)

    // Filtrer les données par période
    const periodOrders = data.orders.filter(order => 
      new Date(order.created_at) >= periodStart
    )

    const periodProducts = data.products.filter(product => 
      new Date(product.created_at) >= periodStart
    )

    // Statistiques des commandes
    const totalOrders = periodOrders.length
    const totalRevenue = periodOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Statistiques des produits
    const totalProducts = periodProducts.length
    const activeProducts = periodProducts.filter(p => p.is_active).length
    const totalProductSales = periodProducts.reduce((sum, p) => sum + (p.total_sales || 0), 0)
    const totalProductRevenue = periodProducts.reduce((sum, p) => sum + (p.total_revenue || 0), 0)
    
    // Statistiques des points de fidélité
    const loyaltyPoints = data.loyaltyPoints
    const pointsEarned = loyaltyPoints?.points_earned || 0
    const pointsSpent = loyaltyPoints?.points_spent || 0
    const pointsBalance = loyaltyPoints?.points_balance || 0
    const fcfaValue = loyaltyPoints?.fcfa_value || 0
    
    // Statistiques des interactions
    const totalShares = periodProducts.reduce((sum, p) => sum + (p.total_shares || 0), 0)
    const totalReviews = periodProducts.reduce((sum, p) => sum + (p.total_reviews || 0), 0)
    const avgRating = periodProducts.filter(p => p.rating > 0).length > 0 
      ? periodProducts.filter(p => p.rating > 0).reduce((sum, p) => sum + (p.rating || 0), 0) / periodProducts.filter(p => p.rating > 0).length
      : 0

    // Tendances (simulation basée sur les données)
    const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000)
    const previousPeriodOrders = data.orders.filter(order => 
      new Date(order.created_at) >= previousPeriodStart && new Date(order.created_at) < periodStart
    )
    const previousRevenue = previousPeriodOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const orderGrowth = previousPeriodOrders.length > 0 
      ? ((totalOrders - previousPeriodOrders.length) / previousPeriodOrders.length) * 100 
      : 0

    return {
      orders: {
        total: totalOrders,
        revenue: totalRevenue,
        avgValue: avgOrderValue,
        growth: orderGrowth
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        sales: totalProductSales,
        revenue: totalProductRevenue
      },
      loyalty: {
        earned: pointsEarned,
        spent: pointsSpent,
        balance: pointsBalance,
        fcfaValue: fcfaValue
      },
      engagement: {
        shares: totalShares,
        reviews: totalReviews,
        rating: avgRating
      },
      trends: {
        revenueGrowth: revenueGrowth,
        orderGrowth: orderGrowth
      }
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    } else if (value < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />
    }
    return <Activity className="w-4 h-4 text-gray-600" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return '7 derniers jours'
      case '30d': return '30 derniers jours'
      case '90d': return '90 derniers jours'
      case '1y': return '1 an'
      default: return '30 derniers jours'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistiques Avancées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stats = calculateAdvancedStats()

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistiques Avancées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune donnée disponible</p>
            <p className="text-sm">Commencez à utiliser la plateforme pour générer des statistiques</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistiques Avancées
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {['7d', '30d', '90d', '1y'].map((period) => (
                <Button
                  key={period}
                  size="sm"
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  onClick={() => setSelectedPeriod(period as any)}
                  className="h-7 px-2 text-xs"
                >
                  {period}
                </Button>
              ))}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="h-8 px-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardTitle>
        <p className="text-sm text-gray-500">
          Période: {getPeriodLabel(selectedPeriod)}
        </p>
      </CardHeader>
      <CardContent>
        {/* Statistiques des commandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-blue-700">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">Commandes</span>
                </div>
                {getTrendIcon(stats.orders.growth)}
              </div>
              <div className="text-2xl font-bold text-blue-900 mb-1">
                {stats.orders.total.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={getTrendColor(stats.orders.growth)}>
                  {formatPercentage(stats.orders.growth)}
                </span>
                <span className="text-blue-600">vs période précédente</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-green-700">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Chiffre d'affaires</span>
                </div>
                {getTrendIcon(stats.trends.revenueGrowth)}
              </div>
              <div className="text-2xl font-bold text-green-900 mb-1">
                {formatCurrency(stats.orders.revenue)}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={getTrendColor(stats.trends.revenueGrowth)}>
                  {formatPercentage(stats.trends.revenueGrowth)}
                </span>
                <span className="text-green-600">vs période précédente</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-purple-700">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-medium">Valeur moyenne</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-900 mb-1">
                {formatCurrency(stats.orders.avgValue)}
              </div>
              <div className="text-sm text-purple-600">
                Par commande
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques des produits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-orange-700">
                  <Package className="w-5 h-5" />
                  <span className="text-sm font-medium">Produits</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-900 mb-1">
                {stats.products.total}
              </div>
              <div className="text-sm text-orange-600">
                {stats.products.active} actifs
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Star className="w-5 h-5" />
                  <span className="text-sm font-medium">Note moyenne</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-900 mb-1">
                {stats.engagement.rating.toFixed(1)}/5
              </div>
              <div className="text-sm text-indigo-600">
                {stats.engagement.reviews} avis
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-teal-700">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Partages</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-teal-900 mb-1">
                {stats.engagement.shares.toLocaleString()}
              </div>
              <div className="text-sm text-teal-600">
                Total des partages
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques des points de fidélité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-700">
                  <Gift className="w-5 h-5" />
                  <span className="text-sm font-medium">Points de fidélité</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-900 mb-1">
                {stats.loyalty.balance.toLocaleString()}
              </div>
              <div className="text-sm text-amber-600">
                Valeur: {formatCurrency(stats.loyalty.fcfaValue)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-rose-700">
                  <Activity className="w-5 h-5" />
                  <span className="text-sm font-medium">Activité</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-rose-900 mb-1">
                {stats.loyalty.earned.toLocaleString()}
              </div>
              <div className="text-sm text-rose-600">
                Gagnés / {stats.loyalty.spent.toLocaleString()} dépensés
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques et visualisations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution des ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Graphique des ventes</p>
                  <p className="text-sm">Intégration avec une bibliothèque de graphiques</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Répartition des produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <PieChart className="w-12 h-12 mx-auto mb-2" />
                  <p>Graphique circulaire</p>
                  <p className="text-sm">Répartition par catégorie et statut</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Analyse des performances</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Ces statistiques vous aident à comprendre vos performances et à identifier les opportunités d'amélioration.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
