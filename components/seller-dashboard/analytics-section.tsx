"use client"

import { useState } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Target, Award, Activity,
  Calendar, Filter, Download, RefreshCw, Eye, ArrowUp, ArrowDown,
  Minus, Zap, Crown, Medal, DollarSign, Users, ShoppingCart,
  Package, Star, MessageCircle, Share2, Clock, CheckCircle,
  XCircle, AlertTriangle, PieChart, LineChart, AreaChart
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalOrders: number
    totalCustomers: number
    averageOrderValue: number
    conversionRate: number
    customerRetentionRate: number
    revenueGrowth: number
    orderGrowth: number
    customerGrowth: number
  }
  salesAnalytics: {
    dailySales: Array<{
      date: string
      revenue: number
      orders: number
      customers: number
    }>
    monthlySales: Array<{
      month: string
      revenue: number
      orders: number
      growth: number
    }>
    topProducts: Array<{
      id: string
      name: string
      image: string
      revenue: number
      sales: number
      growth: number
    }>
    salesByCategory: Array<{
      category: string
      revenue: number
      percentage: number
      growth: number
    }>
  }
  customerAnalytics: {
    customerSegments: Array<{
      segment: string
      count: number
      revenue: number
      percentage: number
      growth: number
    }>
    customerLifetime: Array<{
      period: string
      customers: number
      revenue: number
      averageValue: number
    }>
    topCustomers: Array<{
      id: string
      name: string
      avatar: string
      totalSpent: number
      orders: number
      lastOrder: string
      loyalty: number
    }>
    customerBehavior: {
      newCustomers: number
      returningCustomers: number
      churnedCustomers: number
      averageOrderFrequency: number
      averageCustomerLifetime: number
    }
  }
  performanceMetrics: {
    kpis: Array<{
      name: string
      value: number
      target: number
      unit: string
      trend: number
      status: 'excellent' | 'good' | 'average' | 'poor'
    }>
    conversionFunnel: Array<{
      stage: string
      visitors: number
      conversions: number
      rate: number
      dropoff: number
    }>
    productPerformance: Array<{
      id: string
      name: string
      image: string
      views: number
      shares: number
      sales: number
      conversionRate: number
      revenue: number
    }>
  }
  predictiveAnalytics: {
    forecasts: Array<{
      period: string
      predictedRevenue: number
      predictedOrders: number
      confidence: number
      factors: string[]
    }>
    trends: Array<{
      metric: string
      currentValue: number
      predictedValue: number
      confidence: number
      recommendation: string
    }>
    opportunities: Array<{
      id: string
      type: 'product' | 'customer' | 'market' | 'promotion'
      title: string
      description: string
      potentialValue: number
      probability: number
      effort: 'low' | 'medium' | 'high'
    }>
  }
}

interface AnalyticsSectionProps {
  analyticsData: AnalyticsData
  onExportReport: (type: string, period: string) => void
  onViewProductDetails: (productId: number) => void
  onViewCustomerDetails: (customerId: string) => void
  onGenerateInsights: () => void
}

export default function AnalyticsSection({
  analyticsData,
  onExportReport,
  onViewProductDetails,
  onViewCustomerDetails,
  onGenerateInsights
}: AnalyticsSectionProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (trend < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistiques & Analyses</h2>
          <p className="text-gray-600">Analyses avancées et insights pour optimiser vos performances</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => onGenerateInsights()}>
            <Zap className="w-4 h-4 mr-2" />
            Générer Insights
          </Button>
          <Button variant="outline" onClick={() => onExportReport('pdf', timeRange)}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sales">Ventes</TabsTrigger>
          <TabsTrigger value="customers">Clients</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictive">Prédictif</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Chiffre d'Affaires</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {formatCurrency(analyticsData.overview.totalRevenue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-green-600">
                      {getTrendIcon(analyticsData.overview.revenueGrowth)}
                      {Math.abs(analyticsData.overview.revenueGrowth)}%
                    </div>
                    <p className="text-xs text-orange-600 mt-1">vs période précédente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Commandes</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {formatNumber(analyticsData.overview.totalOrders)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-green-600">
                      {getTrendIcon(analyticsData.overview.orderGrowth)}
                      {Math.abs(analyticsData.overview.orderGrowth)}%
                    </div>
                    <p className="text-xs text-blue-600 mt-1">vs période précédente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Clients</p>
                    <p className="text-2xl font-bold text-green-800">
                      {formatNumber(analyticsData.overview.totalCustomers)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-green-600">
                      {getTrendIcon(analyticsData.overview.customerGrowth)}
                      {Math.abs(analyticsData.overview.customerGrowth)}%
                    </div>
                    <p className="text-xs text-green-600 mt-1">vs période précédente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Panier Moyen</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {formatCurrency(analyticsData.overview.averageOrderValue)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-purple-600">
                      {analyticsData.overview.conversionRate}%
                    </div>
                    <p className="text-xs text-purple-600 mt-1">taux de conversion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques et métriques détaillées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution des ventes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Évolution des Ventes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.salesAnalytics.monthlySales.slice(-6).map((item) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.month}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{formatCurrency(item.revenue)}</span>
                        <span className="text-sm text-gray-500">{item.orders} commandes</span>
                        <div className="flex items-center text-sm">
                          {getTrendIcon(item.growth)}
                          {Math.abs(item.growth)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top produits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Top Produits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.salesAnalytics.topProducts.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                         onClick={() => onViewProductDetails(product.id)}>
                      <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sales} ventes</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(product.revenue)}</p>
                        <div className="flex items-center text-xs text-green-600">
                          {getTrendIcon(product.growth)}
                          {Math.abs(product.growth)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Ventes */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventes par catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Ventes par Catégorie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.salesAnalytics.salesByCategory.map((category) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-sm font-medium">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{formatCurrency(category.revenue)}</span>
                        <span className="text-sm text-gray-500">{category.percentage}%</span>
                        <div className="flex items-center text-sm">
                          {getTrendIcon(category.growth)}
                          {Math.abs(category.growth)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Évolution quotidienne */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Évolution Quotidienne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.salesAnalytics.dailySales.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">{formatCurrency(day.revenue)}</span>
                        <span className="text-sm text-gray-500">{day.orders} commandes</span>
                        <span className="text-sm text-gray-500">{day.customers} clients</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segments de clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Segments de Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.customerAnalytics.customerSegments.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{segment.segment}</p>
                        <p className="text-xs text-gray-500">{formatNumber(segment.count)} clients</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(segment.revenue)}</p>
                        <p className="text-xs text-gray-500">{segment.percentage}% du CA</p>
                        <div className="flex items-center text-xs">
                          {getTrendIcon(segment.growth)}
                          {Math.abs(segment.growth)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2" />
                  Top Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.customerAnalytics.topCustomers.slice(0, 5).map((customer) => (
                    <div key={customer.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                         onClick={() => onViewCustomerDetails(customer.id)}>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={customer.avatar} />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-gray-500">{customer.orders} commandes</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(customer.totalSpent)}</p>
                        <div className="flex items-center text-xs">
                          <Star className="w-3 h-3 text-yellow-400 mr-1" />
                          {customer.loyalty} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comportement des clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Comportement des Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(analyticsData.customerAnalytics.customerBehavior.newCustomers)}
                  </p>
                  <p className="text-sm text-gray-600">Nouveaux clients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(analyticsData.customerAnalytics.customerBehavior.returningCustomers)}
                  </p>
                  <p className="text-sm text-gray-600">Clients fidèles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {analyticsData.customerAnalytics.customerBehavior.averageOrderFrequency}
                  </p>
                  <p className="text-sm text-gray-600">Fréquence moyenne</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData.customerAnalytics.customerBehavior.averageCustomerLifetime}
                  </p>
                  <p className="text-sm text-gray-600">Durée de vie (mois)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* KPIs de performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Indicateurs de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performanceMetrics.kpis.map((kpi) => (
                    <div key={kpi.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{kpi.name}</span>
                        <Badge className={`text-xs ${getStatusColor(kpi.status)}`}>
                          {kpi.status === 'excellent' && 'Excellent'}
                          {kpi.status === 'good' && 'Bon'}
                          {kpi.status === 'average' && 'Moyen'}
                          {kpi.status === 'poor' && 'Faible'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">
                          {kpi.value}{kpi.unit}
                        </span>
                        <div className="flex items-center text-sm">
                          {getTrendIcon(kpi.trend)}
                          {Math.abs(kpi.trend)}%
                        </div>
                      </div>
                      <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                      <p className="text-xs text-gray-500">Objectif: {kpi.target}{kpi.unit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Entonnoir de conversion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Entonnoir de Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performanceMetrics.conversionFunnel.map((stage, index) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{stage.stage}</span>
                        <span className="text-sm text-gray-500">{stage.rate}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatNumber(stage.visitors)} visiteurs</span>
                        <span>{formatNumber(stage.conversions)} conversions</span>
                        {stage.dropoff > 0 && (
                          <span className="text-red-500">-{stage.dropoff}%</span>
                        )}
                      </div>
                      <Progress value={stage.rate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance des produits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Performance des Produits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Produit</th>
                      <th className="text-right py-2">Vues</th>
                      <th className="text-right py-2">Partages</th>
                      <th className="text-right py-2">Ventes</th>
                      <th className="text-right py-2">Taux</th>
                      <th className="text-right py-2">CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.performanceMetrics.productPerformance.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewProductDetails(product.id)}>
                        <td className="py-3">
                          <div className="flex items-center space-x-3">
                            <img src={product.image} alt={product.name} className="w-8 h-8 rounded object-cover" />
                            <span className="text-sm font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 text-sm">{formatNumber(product.views)}</td>
                        <td className="text-right py-3 text-sm">{formatNumber(product.shares)}</td>
                        <td className="text-right py-3 text-sm">{formatNumber(product.sales)}</td>
                        <td className="text-right py-3 text-sm">{product.conversionRate}%</td>
                        <td className="text-right py-3 text-sm font-medium">{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prédictif */}
        <TabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prévisions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Prévisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.predictiveAnalytics.forecasts.map((forecast) => (
                    <div key={forecast.period} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{forecast.period}</span>
                        <Badge className="text-xs">
                          {forecast.confidence}% confiance
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>CA prévu:</span>
                          <span className="font-medium">{formatCurrency(forecast.predictedRevenue)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Commandes prévues:</span>
                          <span className="font-medium">{formatNumber(forecast.predictedOrders)}</span>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600">Facteurs clés:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {forecast.factors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tendances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Tendances & Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.predictiveAnalytics.trends.map((trend) => (
                    <div key={trend.metric} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{trend.metric}</span>
                        <Badge className="text-xs">
                          {trend.confidence}% confiance
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Actuel: {trend.currentValue}</span>
                        <span>Prévu: {trend.predictedValue}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">{trend.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opportunités */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Opportunités Identifiées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.predictiveAnalytics.opportunities.map((opportunity) => (
                  <div key={opportunity.id} className="p-4 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`text-xs ${getEffortColor(opportunity.effort)}`}>
                        {opportunity.effort === 'low' && 'Faible effort'}
                        {opportunity.effort === 'medium' && 'Effort moyen'}
                        {opportunity.effort === 'high' && 'Effort élevé'}
                      </Badge>
                      <span className="text-xs text-gray-500">{opportunity.probability}%</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{opportunity.title}</h4>
                    <p className="text-xs text-gray-600 mb-3">{opportunity.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-600">
                        +{formatCurrency(opportunity.potentialValue)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {opportunity.type === 'product' && 'Produit'}
                        {opportunity.type === 'customer' && 'Client'}
                        {opportunity.type === 'market' && 'Marché'}
                        {opportunity.type === 'promotion' && 'Promotion'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

