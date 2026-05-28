"use client"

import { useState, useEffect } from 'react'
import { 
  Users, Package, ShoppingCart, DollarSign, 
  TrendingUp, Settings, Bell, MessageSquare,
  Star, Gift, Target, BarChart3, Shield,
  Globe, Zap, Database, Activity, Eye,
  Plus, Search, Filter, MoreHorizontal,
  CheckCircle, AlertTriangle, Clock,
  Heart, Share2, CreditCard, Truck,
  FileText, Lock, Mail, Smartphone,
  RefreshCw, Download, Upload, Play,
  Pause, RotateCw, ArrowUpRight,
  ArrowDownRight, Minus, Calendar, MapPin,
  TrendingDown, AlertCircle, Wifi, WifiOff,
  Server, HardDrive, Cloud, Cpu,
  Network, Globe2, Mailbox,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface OverviewStats {
  totalUsers: number
  activeUsers: number
  totalVendors: number
  pendingVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalPoints: number
  unreadMessages: number
  systemAlerts: number
}

interface SystemStatus {
  database: 'online' | 'offline' | 'warning'
  api: 'online' | 'offline' | 'warning'
  payment: 'online' | 'offline' | 'warning'
  email: 'online' | 'offline' | 'warning'
  sms: 'online' | 'offline' | 'warning'
  server: 'online' | 'offline' | 'warning'
  network: 'online' | 'offline' | 'warning'
}

interface RecentActivity {
  id: string
  type: 'user' | 'order' | 'payment' | 'alert' | 'system' | 'security' | 'performance'
  message: string
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'completed' | 'failed'
  category: 'success' | 'warning' | 'error' | 'info'
}

interface PerformanceMetric {
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  target: number
  unit: string
  description: string
}

interface SystemResource {
  name: string
  current: number
  max: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
}

export default function SuperAdminOverview({ stats }: { stats: OverviewStats }) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'online',
    api: 'online',
    payment: 'online',
    email: 'online',
    sms: 'online',
    server: 'online',
    network: 'online'
  })

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [systemResources, setSystemResources] = useState<SystemResource[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSystemAlert, setShowSystemAlert] = useState(false)
  const [systemAlertMessage, setSystemAlertMessage] = useState('')
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)
  const [showPerformanceModal, setShowPerformanceModal] = useState(false)
  const [showActivityLog, setShowActivityLog] = useState(false)
  const [showSystemResources, setShowSystemResources] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')

  // Chargement des données
  useEffect(() => {
    loadOverviewData()
    const interval = setInterval(loadOverviewData, 30000) // Actualisation toutes les 30 secondes
    return () => clearInterval(interval)
  }, [])

  const loadOverviewData = async () => {
    setIsRefreshing(true)
    try {
      // Simulation de chargement des données
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Données des activités récentes
      setRecentActivities([
        {
          id: '1',
          type: 'user',
          message: 'Nouveau vendeur en attente d\'approbation',
          timestamp: new Date().toISOString(),
          priority: 'medium',
          status: 'pending',
          category: 'info'
        },
        {
          id: '2',
          type: 'order',
          message: 'Commande de 150.000 FCFA traitée avec succès',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          priority: 'low',
          status: 'completed',
          category: 'success'
        },
        {
          id: '3',
          type: 'payment',
          message: 'Paiement en attente de confirmation',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          priority: 'high',
          status: 'pending',
          category: 'warning'
        },
        {
          id: '4',
          type: 'security',
          message: 'Tentative de connexion suspecte détectée',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          priority: 'critical',
          status: 'pending',
          category: 'error'
        },
        {
          id: '5',
          type: 'system',
          message: 'Sauvegarde automatique terminée avec succès',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          priority: 'low',
          status: 'completed',
          category: 'success'
        },
        {
          id: '6',
          type: 'performance',
          message: 'Optimisation des requêtes base de données',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          priority: 'medium',
          status: 'completed',
          category: 'info'
        }
      ])

      // Métriques de performance
      setPerformanceMetrics([
        {
          name: 'Temps de réponse API',
          value: 245,
          change: -12,
          trend: 'up',
          target: 300,
          unit: 'ms',
          description: 'Temps moyen de réponse des API'
        },
        {
          name: 'Taux de conversion',
          value: 3.2,
          change: 0.8,
          trend: 'up',
          target: 3.0,
          unit: '%',
          description: 'Pourcentage de visiteurs qui passent commande'
        },
        {
          name: 'Taux d\'erreur',
          value: 0.15,
          change: -0.05,
          trend: 'up',
          target: 0.2,
          unit: '%',
          description: 'Pourcentage d\'erreurs système'
        },
        {
          name: 'Satisfaction utilisateur',
          value: 4.6,
          change: 0.1,
          trend: 'up',
          target: 4.5,
          unit: '/5',
          description: 'Note moyenne des utilisateurs'
        },
        {
          name: 'Uptime système',
          value: 99.8,
          change: 0.2,
          trend: 'up',
          target: 99.5,
          unit: '%',
          description: 'Disponibilité du système'
        }
      ])

      // Ressources système
      setSystemResources([
        {
          name: 'CPU',
          current: 45,
          max: 100,
          unit: '%',
          status: 'normal'
        },
        {
          name: 'Mémoire RAM',
          current: 78,
          max: 100,
          unit: '%',
          status: 'warning'
        },
        {
          name: 'Stockage',
          current: 62,
          max: 100,
          unit: '%',
          status: 'normal'
        },
        {
          name: 'Bande passante',
          current: 35,
          max: 100,
          unit: '%',
          status: 'normal'
        }
      ])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fonctionnalités des boutons
  const handleRefreshData = async () => {
    await loadOverviewData()
  }

  const handleSystemAlert = () => {
    setShowSystemAlert(true)
  }

  const sendSystemAlert = async () => {
    try {
      // Simulation d'envoi d'alerte
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowSystemAlert(false)
      setSystemAlertMessage('')
      // Ici on pourrait ajouter une notification de succès
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte:', error)
    }
  }

  const toggleMaintenanceMode = async () => {
    try {
      setMaintenanceMode(!maintenanceMode)
      // Simulation de changement de mode maintenance
      await new Promise(resolve => setTimeout(resolve, 1000))
      setShowMaintenanceModal(false)
    } catch (error) {
      console.error('Erreur lors du changement de mode maintenance:', error)
    }
  }

  const startBackup = async () => {
    try {
      setBackupProgress(0)
      setShowBackupModal(true)
      
      // Simulation de progression de sauvegarde
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setShowBackupModal(false), 1000)
            return 100
          }
          return prev + 10
        })
      }, 200)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  const exportOverviewData = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Ici on pourrait implémenter la vraie logique d'export
      console.log(`Export ${format} en cours...`)
      
      // Simulation de téléchargement
      const data = `Données de la vue d'ensemble - ${new Date().toLocaleDateString()}`
      const blob = new Blob([data], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `overview-${format}.${format === 'excel' ? 'xlsx' : format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  // Nouvelles fonctionnalités pour tous les boutons
  const handlePerformanceClick = () => {
    setShowPerformanceModal(true)
  }

  const handleActivityLogClick = () => {
    setShowActivityLog(true)
  }

  const handleSystemResourcesClick = () => {
    setShowSystemResources(true)
  }

  const handleDatabaseStatusClick = () => {
    // Simuler un changement de statut de la base de données
    setSystemStatus(prev => ({
      ...prev,
      database: prev.database === 'online' ? 'warning' : 'online'
    }))
  }

  const handleApiStatusClick = () => {
    // Simuler un changement de statut de l'API
    setSystemStatus(prev => ({
      ...prev,
      api: prev.api === 'online' ? 'warning' : 'online'
    }))
  }

  const handlePaymentStatusClick = () => {
    // Simuler un changement de statut du système de paiement
    setSystemStatus(prev => ({
      ...prev,
      payment: prev.payment === 'online' ? 'warning' : 'online'
    }))
  }

  const handleEmailStatusClick = () => {
    // Simuler un changement de statut du système d'email
    setSystemStatus(prev => ({
      ...prev,
      email: prev.email === 'online' ? 'warning' : 'online'
    }))
  }

  const handleCpuOptimization = () => {
    // Simuler une optimisation du CPU
    setSystemResources(prev => 
      prev.map(resource => 
        resource.name === 'CPU' 
          ? { ...resource, current: Math.max(20, resource.current - 15) }
          : resource
      )
    )
  }

  const handleRamOptimization = () => {
    // Simuler une optimisation de la RAM
    setSystemResources(prev => 
      prev.map(resource => 
        resource.name === 'Mémoire RAM' 
          ? { ...resource, current: Math.max(30, resource.current - 20) }
          : resource
      )
    )
  }

  const handleStorageCleanup = () => {
    // Simuler un nettoyage du stockage
    setSystemResources(prev => 
      prev.map(resource => 
        resource.name === 'Stockage' 
          ? { ...resource, current: Math.max(40, resource.current - 15) }
          : resource
      )
    )
  }

  const handleBandwidthOptimization = () => {
    // Simuler une optimisation de la bande passante
    setSystemResources(prev => 
      prev.map(resource => 
        resource.name === 'Bande passante' 
          ? { ...resource, current: Math.max(25, resource.current - 10) }
          : resource
      )
    )
  }

  const handleMetricDetailClick = (metricIndex: number) => {
    // Ouvrir le modal de performance avec focus sur la métrique spécifique
    setShowPerformanceModal(true)
    // Ici on pourrait ajouter un état pour mettre en évidence la métrique sélectionnée
  }

  const handleActivityDetailClick = (activityId: string) => {
    // Ouvrir le modal d'activité avec focus sur l'activité spécifique
    setShowActivityLog(true)
    // Ici on pourrait ajouter un état pour mettre en évidence l'activité sélectionnée
  }

  const handleResourceDetailClick = (resourceIndex: number) => {
    // Ouvrir le modal des ressources système avec focus sur la ressource spécifique
    setShowSystemResources(true)
    // Ici on pourrait ajouter un état pour mettre en évidence la ressource sélectionnée
  }

  const handleQuickExport = () => {
    // Export rapide en CSV
    exportOverviewData('csv')
  }

  const handleQuickBackup = () => {
    // Sauvegarde rapide
    startBackup()
  }

  const handleSystemHealthCheck = async () => {
    try {
      setIsRefreshing(true)
      // Simulation d'une vérification de santé du système
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mettre à jour tous les statuts
      setSystemStatus({
        database: 'online',
        api: 'online',
        payment: 'online',
        email: 'online',
        sms: 'online',
        server: 'online',
        network: 'online'
      })
      
      // Optimiser les ressources
      setSystemResources(prev => 
        prev.map(resource => ({
          ...resource,
          current: Math.max(20, resource.current - 10),
          status: resource.current < 70 ? 'normal' : resource.current < 85 ? 'warning' : 'critical'
        }))
      )
      
      setIsRefreshing(false)
    } catch (error) {
      console.error('Erreur lors de la vérification de santé:', error)
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100 border-green-200'
      case 'offline': return 'text-red-600 bg-red-100 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'info': return <Info className="h-4 w-4 text-blue-600" />
      default: return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getResourceStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la vue d'ensemble */}
      <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#535455]/10 border border-[#ff6600]/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vue d'Ensemble du Système</h2>
            <p className="text-gray-600 mt-2">
              Tableau de bord principal avec métriques en temps réel et contrôles système
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              onClick={handleRefreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button
              onClick={handlePerformanceClick}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance
            </Button>
            <Button
              onClick={handleActivityLogClick}
              variant="outline"
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Journal
            </Button>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="border-[#ff6600]/20 bg-gradient-to-br from-[#ff6600]/5 to-[#ff6600]/10 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => handleMetricDetailClick(0)}
          title="Cliquer pour voir les détails des utilisateurs"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
                <p className="text-3xl font-bold text-[#ff6600]">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +{((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% du total
                </p>
              </div>
              <div className="p-3 bg-[#ff6600]/10 rounded-full">
                <Users className="h-12 w-12 text-[#ff6600]" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#ff6600]/20">
              <Button
                size="sm"
                variant="ghost"
                className="text-[#ff6600] hover:bg-[#ff6600]/10 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSystemHealthCheck()
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Actualiser
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-[#535455]/20 bg-gradient-to-br from-[#535455]/5 to-[#535455]/10 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => handleMetricDetailClick(1)}
          title="Cliquer pour voir les détails du chiffre d'affaires"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                <p className="text-3xl font-bold text-[#535455]">{(stats.totalRevenue / 1000000).toFixed(1)}M FCFA</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% ce mois
                </p>
              </div>
              <div className="p-3 bg-[#535455]/10 rounded-full">
                <TrendingUp className="h-12 w-12 text-[#535455]" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#535455]/20">
              <Button
                size="sm"
                variant="ghost"
                className="text-[#535455] hover:bg-[#535455]/10 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleQuickExport()
                }}
              >
                <Download className="h-3 w-3 mr-1" />
                Exporter
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-[#ff6600]/20 bg-gradient-to-br from-[#ff6600]/5 to-[#ff6600]/10 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => handleMetricDetailClick(2)}
          title="Cliquer pour voir les détails des commandes"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commandes</p>
                <p className="text-3xl font-bold text-[#ff6600]">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +8.2% cette semaine
                </p>
              </div>
              <div className="p-3 bg-[#ff6600]/10 rounded-full">
                <ShoppingCart className="h-12 w-12 text-[#ff6600]" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#ff6600]/20">
              <Button
                size="sm"
                variant="ghost"
                className="text-[#ff6600] hover:bg-[#ff6600]/10 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleActivityLogClick()
                }}
              >
                <Activity className="h-3 w-3 mr-1" />
                Voir activités
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-[#535455]/20 bg-gradient-to-br from-[#535455]/5 to-[#535455]/10 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => handleMetricDetailClick(3)}
          title="Cliquer pour voir les détails des points fidélité"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Points Fidélité</p>
                <p className="text-3xl font-bold text-[#535455]">{(stats.totalPoints / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +15.3% ce mois
                </p>
              </div>
              <div className="p-3 bg-[#535455]/10 rounded-full">
                <Star className="h-12 w-12 text-[#535455]" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-[#535455]/20">
              <Button
                size="sm"
                variant="ghost"
                className="text-[#535455] hover:bg-[#535455]/10 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePerformanceClick()
                }}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Performance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statut du Système */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-[#ff6600]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#ff6600]">
              <Shield className="h-5 w-5" />
              Statut du Système
            </CardTitle>
            <CardDescription>État en temps réel de tous les services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`p-3 rounded-lg border ${getStatusColor(systemStatus.database)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={handleDatabaseStatusClick}
                title="Cliquer pour tester le statut"
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm font-medium">Base de données</span>
                </div>
                <Badge className="mt-2" variant={systemStatus.database === 'online' ? 'default' : 'destructive'}>
                  {systemStatus.database === 'online' ? 'En ligne' : systemStatus.database === 'warning' ? 'Attention' : 'Hors ligne'}
                </Badge>
              </div>
              <div 
                className={`p-3 rounded-lg border ${getStatusColor(systemStatus.api)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={handleApiStatusClick}
                title="Cliquer pour tester le statut"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">API</span>
                </div>
                <Badge className="mt-2" variant={systemStatus.api === 'online' ? 'default' : 'destructive'}>
                  {systemStatus.api === 'online' ? 'En ligne' : systemStatus.api === 'warning' ? 'Attention' : 'Hors ligne'}
                </Badge>
              </div>
              <div 
                className={`p-3 rounded-lg border ${getStatusColor(systemStatus.payment)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={handlePaymentStatusClick}
                title="Cliquer pour tester le statut"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">Paiement</span>
                </div>
                <Badge className="mt-2" variant={systemStatus.payment === 'online' ? 'default' : 'destructive'}>
                  {systemStatus.payment === 'online' ? 'En ligne' : systemStatus.payment === 'warning' ? 'Attention' : 'Hors ligne'}
                </Badge>
              </div>
              <div 
                className={`p-3 rounded-lg border ${getStatusColor(systemStatus.email)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={handleEmailStatusClick}
                title="Cliquer pour tester le statut"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <Badge className="mt-2" variant={systemStatus.email === 'online' ? 'default' : 'destructive'}>
                  {systemStatus.email === 'online' ? 'En ligne' : systemStatus.email === 'warning' ? 'Attention' : 'Hors ligne'}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSystemHealthCheck}
                size="sm"
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Vérifier la santé
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contrôles Système */}
        <Card className="border-[#535455]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#535455]">
              <Settings className="h-5 w-5" />
              Contrôles Système
            </CardTitle>
            <CardDescription>Actions et maintenance du système</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSystemAlert}
                variant="outline"
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                size="sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Alerte
              </Button>
              <Button
                onClick={toggleMaintenanceMode}
                variant="outline"
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                size="sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                Maintenance
              </Button>
              <Button
                onClick={handleQuickBackup}
                variant="outline"
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                size="sm"
              >
                <Database className="h-4 w-4 mr-2" />
                Sauvegarde
              </Button>
              <Button
                onClick={handleQuickExport}
                variant="outline"
                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de Performance */}
      <Card className="border-[#ff6600]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#ff6600]">
            <BarChart3 className="h-5 w-5" />
            Métriques de Performance
          </CardTitle>
          <CardDescription>Indicateurs clés de performance du système</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.slice(0, 6).map((metric, index) => (
              <div 
                key={index} 
                className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow hover:border-[#ff6600]/50"
                onClick={() => handleMetricDetailClick(index)}
                title="Cliquer pour voir les détails"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{metric.name}</h4>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{metric.value}{metric.unit}</span>
                    <span>Objectif: {metric.target}{metric.unit}</span>
                  </div>
                  <Progress value={(metric.value / metric.target) * 100} className="w-full h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activités Récentes */}
      <Card className="border-[#535455]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#535455]">
            <Activity className="h-5 w-5" />
            Activités Récentes
          </CardTitle>
          <CardDescription>Dernières actions et événements système</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivities.slice(0, 5).map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:shadow-md transition-shadow hover:border-[#535455]/50"
                onClick={() => handleActivityDetailClick(activity.id)}
                title="Cliquer pour voir les détails"
              >
                <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                  {getCategoryIcon(activity.category)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(activity.priority)}>
                    {activity.priority === 'low' ? 'Faible' :
                     activity.priority === 'medium' ? 'Moyenne' :
                     activity.priority === 'high' ? 'Élevée' : 'Critique'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ressources Système */}
      <Card className="border-[#ff6600]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#ff6600]">
            <Cpu className="h-5 w-5" />
            Ressources Système
          </CardTitle>
          <CardDescription>Utilisation des ressources en temps réel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemResources.map((resource, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{resource.name}</span>
                  <span className={`text-sm font-medium ${getResourceStatusColor(resource.status)}`}>
                    {resource.current}{resource.unit} / {resource.max}{resource.unit}
                  </span>
                </div>
                <Progress value={(resource.current / resource.max) * 100} className="w-full" />
                <div className="text-xs text-gray-500 text-center">
                  {((resource.current / resource.max) * 100).toFixed(1)}% utilisé
                </div>
                <div className="flex gap-2">
                  {resource.name === 'CPU' && (
                    <Button
                      onClick={handleCpuOptimization}
                      size="sm"
                      variant="outline"
                      className="text-xs border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Optimiser
                    </Button>
                  )}
                  {resource.name === 'Mémoire RAM' && (
                    <Button
                      onClick={handleRamOptimization}
                      size="sm"
                      variant="outline"
                      className="text-xs border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Optimiser
                    </Button>
                  )}
                  {resource.name === 'Stockage' && (
                    <Button
                      onClick={handleStorageCleanup}
                      size="sm"
                      variant="outline"
                      className="text-xs border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Nettoyer
                    </Button>
                  )}
                  {resource.name === 'Bande passante' && (
                    <Button
                      onClick={handleBandwidthOptimization}
                      size="sm"
                      variant="outline"
                      className="text-xs border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Optimiser
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button
              onClick={handleSystemResourcesClick}
              variant="outline"
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voir toutes les ressources
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      
      {/* Modal Alerte Système */}
      {showSystemAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Alerte Système
            </h3>
            <Textarea
              placeholder="Message d'alerte..."
              value={systemAlertMessage}
              onChange={(e) => setSystemAlertMessage(e.target.value)}
              className="mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={sendSystemAlert} className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white">
                Envoyer
              </Button>
              <Button onClick={() => setShowSystemAlert(false)} variant="outline">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mode Maintenance */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Mode Maintenance
            </h3>
            <p className="text-gray-600 mb-4">
              {maintenanceMode 
                ? 'Le mode maintenance est actuellement actif. Les utilisateurs ne peuvent pas accéder au site.'
                : 'Activer le mode maintenance pour empêcher l\'accès des utilisateurs au site.'
              }
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={toggleMaintenanceMode}
                className={maintenanceMode 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-[#ff6600] hover:bg-[#ff6600]/90 text-white'
                }
              >
                {maintenanceMode ? 'Désactiver' : 'Activer'}
              </Button>
              <Button onClick={() => setShowMaintenanceModal(false)} variant="outline">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sauvegarde */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-[#ff6600]" />
              Sauvegarde en cours...
            </h3>
            <div className="space-y-4">
              <Progress value={backupProgress} className="w-full" />
              <p className="text-sm text-gray-600">{backupProgress}% terminé</p>
              {backupProgress === 100 && (
                <div className="text-green-600 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                  Sauvegarde terminée avec succès !
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Performance */}
      {showPerformanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#ff6600]" />
              Métriques de Performance Détaillées
            </h3>
            <div className="space-y-6">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{metric.name}</h4>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Valeur actuelle: {metric.value}{metric.unit}</span>
                      <span>Objectif: {metric.target}{metric.unit}</span>
                    </div>
                    <Progress value={(metric.value / metric.target) * 100} className="w-full" />
                    <div className="text-xs text-gray-500 text-center">
                      {((metric.value / metric.target) * 100).toFixed(1)}% de l'objectif atteint
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowPerformanceModal(false)} variant="outline">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Journal d'Activité */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#ff6600]" />
              Journal d'Activité Complet
            </h3>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getPriorityColor(activity.priority)}`}>
                        {getCategoryIcon(activity.category)}
                      </div>
                      <div>
                        <p className="font-medium">{activity.message}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(activity.priority)}>
                        {activity.priority === 'low' ? 'Faible' :
                         activity.priority === 'medium' ? 'Moyenne' :
                         activity.priority === 'high' ? 'Élevée' : 'Critique'}
                      </Badge>
                      <Badge variant="outline">
                        {activity.status === 'pending' ? 'En attente' :
                         activity.status === 'completed' ? 'Terminé' : 'Échoué'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowActivityLog(false)} variant="outline">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ressources Système */}
      {showSystemResources && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[#535455]" />
              Ressources Système
            </h3>
            <div className="space-y-4">
              {systemResources.map((resource, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{resource.name}</span>
                    <span className={`text-sm font-medium ${getResourceStatusColor(resource.status)}`}>
                      {resource.current}{resource.unit} / {resource.max}{resource.unit}
                    </span>
                  </div>
                  <Progress value={(resource.current / resource.max) * 100} className="w-full" />
                  <div className="text-xs text-gray-500 text-center">
                    {((resource.current / resource.max) * 100).toFixed(1)}% utilisé
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowSystemResources(false)} variant="outline">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
