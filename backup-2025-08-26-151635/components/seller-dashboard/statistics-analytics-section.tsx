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
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SimpleNotification } from '@/components/ui/notification'

// Import des composants de statistiques
import AnalyticsDashboard from './analytics-dashboard'
import AdvancedAnalytics from './advanced-analytics'
import AnalyticsActions from './analytics-actions'

// Types pour les données de synthèse
interface SummaryMetrics {
  totalSales: number
  totalRevenue: number
  totalCustomers: number
  averageRating: number
  totalShares: number
  totalPoints: number
  growthRate: number
  marketPosition: number
}

interface StatisticsAnalyticsSectionProps {
  onExportData: (type: string, format: string) => void
  onViewProductDetails: (productId: number) => void
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
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isLoading, setIsLoading] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState({ type: 'info', title: '', message: '' })

  // Données de synthèse mockées
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics>({
    totalSales: 12450,
    totalRevenue: 156780,
    totalCustomers: 234,
    averageRating: 4.6,
    totalShares: 1234,
    totalPoints: 5670,
    growthRate: 14.2,
    marketPosition: 3
  })

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

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge className="bg-yellow-100 text-yellow-800">🥇 1er</Badge>
    if (position === 2) return <Badge className="bg-gray-100 text-gray-800">🥈 2ème</Badge>
    if (position === 3) return <Badge className="bg-orange-100 text-orange-800">🥉 3ème</Badge>
    return <Badge variant="secondary">{position}ème</Badge>
  }

  // FONCTIONS D'ACTION AVEC NOTIFICATIONS SIMPLES
  const showSimpleNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotificationData({ type, title, message })
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 4000)
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    setIsLoading(true)
    
    showSimpleNotification('info', 'Changement de période', `Mise à jour des données pour la période: ${period}`)
    
    // Simuler le chargement des données
    setTimeout(() => {
      setIsLoading(false)
      showSimpleNotification('success', 'Données mises à jour', 'Les données ont été actualisées avec succès')
    }, 1000)
  }

  const handleExport = (type: string, format: string) => {
    showSimpleNotification('info', 'Export en cours', `Export des données ${type} en format ${format}...`)
    
    // Simuler l'export
    setTimeout(() => {
      onExportData(type, format)
      showSimpleNotification('success', 'Export réussi', `Données ${type} exportées en ${format} avec succès`)
    }, 1500)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    showSimpleNotification('info', 'Changement d\'onglet', `Affichage de l'onglet: ${tab === 'overview' ? 'Vue d\'ensemble' : tab === 'analytics' ? 'Analytics Avancées' : 'Insights IA'}`)
  }

  const handleRefreshData = () => {
    setIsLoading(true)
    showSimpleNotification('info', 'Actualisation', 'Actualisation des données en cours...')
    
    // Simuler le rafraîchissement
    setTimeout(() => {
      setIsLoading(false)
      showSimpleNotification('success', 'Données actualisées', 'Toutes les données ont été actualisées avec succès')
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Notification simple */}
      {showNotification && (
        <SimpleNotification
          type={notificationData.type as 'success' | 'error' | 'warning' | 'info'}
          title={notificationData.title}
          message={notificationData.message}
          onClose={() => setShowNotification(false)}
        />
      )}
      
      {/* En-tête principal avec métriques de synthèse */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Statistiques & Analyses</h1>
            <p className="text-xl text-gray-600">Tableau de bord complet pour optimiser vos performances et prendre des décisions éclairées</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
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
            <Button variant="outline" onClick={() => handleExport('all', 'pdf')}>
              <Download className="w-4 h-4 mr-2" />
              Rapport Complet
            </Button>
            <Button onClick={handleRefreshData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Métriques de synthèse rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ventes totales */}
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Ventes Totales</p>
                  <p className="text-3xl font-bold text-blue-900">{formatNumber(summaryMetrics.totalSales)}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+{summaryMetrics.growthRate}%</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-200 rounded-full">
                  <ShoppingCart className="w-8 h-8 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chiffre d'affaires */}
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Chiffre d'Affaires</p>
                  <p className="text-3xl font-bold text-green-900">{formatCurrency(summaryMetrics.totalRevenue)}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">+{summaryMetrics.growthRate}%</span>
                  </div>
                </div>
                <div className="p-4 bg-green-200 rounded-full">
                  <TrendingUp className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Position sur le marché */}
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Position Marché</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {getPositionBadge(summaryMetrics.marketPosition)}
                  </div>
                  <p className="text-sm text-purple-600 mt-2">Sur 150+ vendeurs</p>
                </div>
                <div className="p-4 bg-purple-200 rounded-full">
                  <Award className="w-8 h-8 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Note moyenne */}
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Note Moyenne</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <span className="text-3xl font-bold text-yellow-900">{summaryMetrics.averageRating}</span>
                    <span className="text-lg text-yellow-700">/5</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(summaryMetrics.averageRating) ? 'text-yellow-500 fill-current' : 'text-yellow-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-yellow-200 rounded-full">
                  <Star className="w-8 h-8 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques secondaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Partages totaux */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Share2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Partages Totaux</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(summaryMetrics.totalShares)}</p>
                  </div>
                </div>
                <Progress value={80} className="w-20 h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Points gagnés */}
          <Card className="hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Coins className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Points Gagnés</p>
                    <p className="text-xl font-bold text-gray-900">{formatNumber(summaryMetrics.totalPoints)}</p>
                  </div>
                </div>
                <Progress value={60} className="w-20 h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onglets principaux */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-16">
              <TabsTrigger value="overview" className="flex items-center space-x-2 text-base font-medium">
                <BarChart3 className="w-5 h-5" />
                <span>Vue d'ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2 text-base font-medium">
                <TrendingUp className="w-5 h-5" />
                <span>Analytics Avancées</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center space-x-2 text-base font-medium">
                <Zap className="w-5 h-5" />
                <span>Insights IA</span>
              </TabsTrigger>
            </TabsList>

            {/* Contenu de l'onglet Vue d'ensemble */}
            <TabsContent value="overview" className="p-6">
              <AnalyticsDashboard
                onExportData={handleExport}
                onViewProductDetails={onViewProductDetails}
                onViewCustomerProfile={onViewCustomerProfile}
              />
            </TabsContent>

            {/* Contenu de l'onglet Analytics Avancées */}
            <TabsContent value="analytics" className="p-6">
              <AdvancedAnalytics
                onExportInsights={handleExport}
                onViewDetailedReport={onViewDetailedReport}
              />
            </TabsContent>

            {/* Contenu de l'onglet Insights IA */}
            <TabsContent value="insights" className="p-6">
              <AnalyticsActions />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions finales et exports */}
      <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Générer des Rapports</h3>
              <p className="text-gray-600">Exportez vos données et générez des rapports détaillés pour vos équipes</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleExport('summary', 'pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                Rapport Synthèse
              </Button>
              <Button variant="outline" onClick={() => handleExport('detailed', 'excel')}>
                <Download className="w-4 h-4 mr-2" />
                Données Détaillées
              </Button>
              <Button variant="outline" onClick={() => handleExport('insights', 'pdf')}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Insights IA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
