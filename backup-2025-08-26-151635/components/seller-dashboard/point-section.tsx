"use client"

import { useState } from 'react'
import { 
  Coins, TrendingUp, TrendingDown, DollarSign, Download, Filter,
  Search, Gift, History, Wallet, Target, BarChart3,
  ArrowUp, ArrowDown, Minus, RefreshCw, Copy, ExternalLink,
  Calendar, Users, Star, Zap, Clock, CheckCircle, XCircle,
  Sparkles, Crown, Trophy, PiggyBank, Rocket, 
  Activity, PieChart, LineChart, BarChart,
  Smartphone, CreditCard, Banknote, QrCode, Share2,
  Heart, Star as StarIcon, Eye, EyeOff, Settings,
  Bell, AlertCircle, Info, HelpCircle, ChevronRight,
  ChevronLeft, Plus, Minus as MinusIcon, RotateCcw,
  Globe
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PointData {
  balance: number
  totalEarned: number
  totalSpent: number
  totalTransferred: number
  conversionRate: number
  exchangeRate: number
  pendingRequests: number
  
  // Nouvelles données pour le suivi des partages
  sharesData: {
    totalShares: number
    sharesThisMonth: number
    pointsFromShares: number
    viralScore: number
    topSharedProducts: Array<{
      id: string
      name: string
      image: string
      shares: number
      points: number
      revenue: number
      isOwnProduct: boolean
    }>
    socialNetworkStats: {
      facebook: { shares: number; points: number; engagement: number }
      instagram: { shares: number; points: number; engagement: number }
      twitter: { shares: number; points: number; engagement: number }
      whatsapp: { shares: number; points: number; engagement: number }
      linkedin: { shares: number; points: number; engagement: number }
    }
    userEngagement: Array<{
      id: string
      name: string
      avatar: string
      totalShares: number
      pointsEarned: number
      lastShareDate: string
      favoriteCategories: string[]
      engagementScore: number
    }>
  }
  
  history: Array<{
    id: string
    type: 'earned' | 'spent' | 'transferred' | 'exchanged' | 'bonus' | 'share_bonus'
    amount: number
    description: string
    timestamp: string
    status: 'completed' | 'pending' | 'failed'
    source?: string
    recipient?: string
    productId?: string
    socialNetwork?: string
    shareType?: 'product' | 'category' | 'campaign'
  }>
  
  topEarners: Array<{
    id: string
    name: string
    avatar: string
    points: number
    shares: number
    revenue: number
    engagementScore: number
    favoriteCategories: string[]
  }>
  
  exchangeHistory: Array<{
    id: string
    fromCurrency: string
    toCurrency: string
    amount: number
    rate: number
    timestamp: string
    status: string
    fees: number
  }>
  
  withdrawalRequests: Array<{
    id: string
    amount: number
    method: string
    status: 'pending' | 'approved' | 'rejected'
    timestamp: string
    processedAt?: string
    feexPayTransactionId?: string
  }>
  
  // Nouvelles données pour l'analyse prédictive
  predictiveAnalytics: {
    nextMonthPrediction: number
    growthTrend: 'increasing' | 'decreasing' | 'stable'
    recommendedActions: string[]
    marketOpportunities: Array<{
      category: string
      potentialPoints: number
      difficulty: 'low' | 'medium' | 'high'
    }>
  }
}

interface PointSectionProps {
  pointData: PointData
  onTransferPoints: (recipientId: string, amount: number) => void
  onExchangePoints: (fromCurrency: string, toCurrency: string, amount: number) => void
  onRequestWithdrawal: (amount: number, method: string) => void
  onExportHistory: (type: string) => void
}

export default function PointSection({
  pointData,
  onTransferPoints,
  onExchangePoints,
  onRequestWithdrawal,
  onExportHistory
}: PointSectionProps) {
  const [showBalance, setShowBalance] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  
  // États pour les notifications et la gestion d'erreurs
  const [notifications, setNotifications] = useState<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    timestamp: Date
  }>>([])
  const [error, setError] = useState<string | null>(null)

  const [transferData, setTransferData] = useState({
    recipientId: '',
    amount: 0,
    message: ''
  })

  const [exchangeData, setExchangeData] = useState({
    fromCurrency: 'Points',
    toCurrency: 'XOF',
    amount: 0
  })

  const [withdrawalData, setWithdrawalData] = useState({
    amount: 0,
    method: 'Mobile Money',
    phoneNumber: '',
    accountName: ''
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earned': return 'text-green-600'
      case 'spent': return 'text-red-600'
      case 'transferred': return 'text-blue-600'
      case 'exchanged': return 'text-purple-600'
      case 'bonus': return 'text-amber-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earned': return <TrendingUp className="w-4 h-4" />
      case 'spent': return <TrendingDown className="w-4 h-4" />
      case 'transferred': return <ArrowUp className="w-4 h-4" />
      case 'exchanged': return <ArrowUp className="w-4 h-4" />
      case 'bonus': return <Gift className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'approved': return 'text-green-600'
      case 'rejected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': return <XCircle className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const handleTransfer = async () => {
    if (!transferData.recipientId || transferData.amount <= 0) {
      setError('Veuillez remplir tous les champs correctement')
      return
    }

    if (transferData.amount > pointData.balance) {
      setError('Solde insuffisant pour effectuer ce transfert')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onTransferPoints(transferData.recipientId, transferData.amount)
      setShowTransferModal(false)
      setTransferData({ recipientId: '', amount: 0, message: '' })
      
      addNotification('success', 'Transfert réussi', `${formatNumber(transferData.amount)} points transférés avec succès`)
    } catch (err) {
      setError('Erreur lors du transfert')
      addNotification('error', 'Erreur', 'Impossible d\'effectuer le transfert')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExchange = async () => {
    if (exchangeData.amount <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }

    if (exchangeData.amount > pointData.balance) {
      setError('Solde insuffisant pour effectuer cet échange')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onExchangePoints(exchangeData.fromCurrency, exchangeData.toCurrency, exchangeData.amount)
      setShowExchangeModal(false)
      setExchangeData({ fromCurrency: 'Points', toCurrency: 'XOF', amount: 0 })
      
      addNotification('success', 'Échange réussi', `${formatNumber(exchangeData.amount)} points échangés avec succès`)
    } catch (err) {
      setError('Erreur lors de l\'échange')
      addNotification('error', 'Erreur', 'Impossible d\'effectuer l\'échange')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdrawal = async () => {
    if (withdrawalData.amount <= 0) {
      setError('Veuillez saisir un montant valide')
      return
    }

    if (withdrawalData.amount > pointData.balance) {
      setError('Solde insuffisant pour effectuer ce retrait')
      return
    }

    if (withdrawalData.method === 'Mobile Money' && !withdrawalData.phoneNumber) {
      setError('Veuillez saisir le numéro de téléphone pour Mobile Money')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onRequestWithdrawal(withdrawalData.amount, withdrawalData.method)
      setShowWithdrawalModal(false)
      setWithdrawalData({ amount: 0, method: 'Mobile Money', phoneNumber: '', accountName: '' })
      
      addNotification('success', 'Demande de retrait envoyée', 'Votre demande de retrait a été enregistrée et sera traitée sous 24h')
    } catch (err) {
      setError('Erreur lors de la demande de retrait')
      addNotification('error', 'Erreur', 'Impossible d\'enregistrer la demande de retrait')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (type: string) => {
    try {
      setIsLoading(true)
      
      if (type === 'csv') {
        // Export CSV avec toutes les données
        const csvData = [
          ['Type', 'Montant', 'Description', 'Date', 'Statut', 'Réseau Social', 'Type de Partage'],
          ...pointData.history.map(item => [
            item.type,
            item.amount.toString(),
            item.description,
            new Date(item.timestamp).toLocaleDateString('fr-FR'),
            item.status,
            item.socialNetwork || '',
            item.shareType || ''
          ])
        ]
        
        const csvContent = csvData.map(row => row.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `historique-points-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        
        addNotification('success', 'Export réussi', 'Fichier CSV téléchargé avec succès')
      } else if (type === 'pdf') {
        // Export PDF (simulation)
        addNotification('info', 'Export PDF', 'Fonctionnalité PDF en cours de développement')
      }
      
      onExportHistory(type)
    } catch (err) {
      setError('Erreur lors de l\'export')
      addNotification('error', 'Erreur', 'Impossible d\'exporter les données')
    } finally {
      setIsLoading(false)
    }
  }

  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    }
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification('success', 'Copié !', 'Solde copié dans le presse-papiers')
    } catch (err) {
      addNotification('error', 'Erreur', 'Impossible de copier dans le presse-papiers')
    }
  }

  // Actions rapides
  const quickActions = [
    {
      id: 'transfer',
      title: 'Transférer',
      description: 'Envoyer des points',
      icon: <ArrowUp className="w-6 h-6" />,
      color: 'text-blue-600',
      gradient: 'from-blue-500 to-blue-600',
      action: () => setShowTransferModal(true)
    },
    {
      id: 'exchange',
      title: 'Échanger',
      description: 'Convertir en devise',
      icon: <ArrowUp className="w-6 h-6" />,
      color: 'text-purple-600',
      gradient: 'from-purple-500 to-purple-600',
      action: () => setShowExchangeModal(true)
    },
    {
      id: 'withdrawal',
      title: 'Retirer',
      description: 'Demande de retrait',
      icon: <Banknote className="w-6 h-6" />,
      color: 'text-green-600',
      gradient: 'from-green-500 to-green-600',
      action: () => setShowWithdrawalModal(true)
    },
    {
      id: 'share',
      title: 'Partager',
      description: 'Partager mon solde',
      icon: <Share2 className="w-6 h-6" />,
      color: 'text-orange-600',
      gradient: 'from-orange-500 to-orange-600',
      action: () => copyToClipboard(`Mon solde de points: ${formatNumber(pointData.balance)}`)
    }
  ]

  return (
    <div className="space-y-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg border-l-4 min-w-80 transform transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
              notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
              'bg-blue-50 border-blue-400 text-blue-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm mt-1">{notification.message}</p>
                <p className="text-xs mt-2 opacity-70">
                  {notification.timestamp.toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Affichage des erreurs globales */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </Button>
          </div>
        </div>
      )}

             {/* Header avec solde principal */}
       <div className="relative">
         <Card className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white border-0 shadow-2xl" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00, #cc4d00)' }}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Mon Portefeuille de Points</h2>
                  <p className="text-white/80">Gérez vos points et récompenses</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white hover:bg-white/20"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettingsModal(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {showBalance ? formatNumber(pointData.balance) : '••••••'}
                </div>
                <p className="text-white/80">Points disponibles</p>
                <div className="mt-2 text-sm text-white/60">
                  ≈ {showBalance ? formatCurrency(pointData.balance * pointData.exchangeRate) : '••••••'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{formatNumber(pointData.totalEarned)}</div>
                <p className="text-white/80">Total gagnés</p>
                                   <div className="mt-2 flex items-center justify-center space-x-1">
                     <TrendingUp className="w-4 h-4" style={{ color: '#ff6600' }} />
                     <span className="text-sm" style={{ color: '#ff6600' }}>+{formatNumber(pointData.totalEarned - pointData.totalSpent)}</span>
                   </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{pointData.pendingRequests}</div>
                <p className="text-white/80">Demandes en attente</p>
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Clock className="w-3 h-3 mr-1" />
                    En cours
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.id}
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={action.action}
          >
            <CardContent className="p-6 text-center">
                             <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
                {action.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="space-y-6">
                 <TabsList className="grid w-full grid-cols-7 rounded-xl p-1" style={{ backgroundColor: '#f5f5f5' }}>
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex items-center space-x-2">
            <Share2 className="w-4 h-4" />
            <span>Partages</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Historique</span>
          </TabsTrigger>
          <TabsTrigger value="top-earners" className="flex items-center space-x-2">
            <Crown className="w-4 h-4" />
            <span>Top Gagnants</span>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex items-center space-x-2">
            <Banknote className="w-4 h-4" />
            <span>Retraits</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <PieChart className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Prédictions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Évolution du Solde</CardTitle>
              <CardDescription>Performance de vos points sur 30 jours</CardDescription>
            </CardHeader>
            <CardContent>
                               <div className="h-64 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fff5f0, #f0f0f0)' }}>
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                  <p className="text-gray-500">Graphique d'évolution</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shares" className="space-y-6">
          {/* Statistiques des partages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Partages</p>
                    <p className="text-3xl font-bold">{pointData.sharesData?.totalShares || 0}</p>
                  </div>
                  <Share2 className="h-12 w-12 text-green-200" />
                </div>
                <p className="text-green-100 text-xs mt-2">Ce mois: {pointData.sharesData?.sharesThisMonth || 0}</p>
              </CardContent>
            </Card>

                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Points des Partages</p>
                    <p className="text-3xl font-bold">{formatNumber(pointData.sharesData?.pointsFromShares || 0)}</p>
                  </div>
                  <Coins className="h-12 w-12 text-blue-200" />
                </div>
                <p className="text-blue-100 text-xs mt-2">Gagnés via partages</p>
              </CardContent>
            </Card>

                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #cc4d00)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Score Viral</p>
                    <p className="text-3xl font-bold">{pointData.sharesData?.viralScore || 0}</p>
                  </div>
                  <Zap className="h-12 w-12 text-purple-200" />
                </div>
                <p className="text-purple-100 text-xs mt-2">Potentiel viral</p>
              </CardContent>
            </Card>

                         <Card className="text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Engagement</p>
                    <p className="text-3xl font-bold">{(pointData.sharesData?.socialNetworkStats?.facebook?.engagement || 0) + (pointData.sharesData?.socialNetworkStats?.instagram?.engagement || 0)}%</p>
                  </div>
                  <Users className="h-12 w-12 text-orange-200" />
                </div>
                <p className="text-orange-100 text-xs mt-2">Taux moyen</p>
              </CardContent>
            </Card>
          </div>

          {/* Produits les plus partagés */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Produits les Plus Partagés</span>
              </CardTitle>
              <CardDescription>Classement par nombre de partages et points générés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointData.sharesData?.topSharedProducts?.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-gray-500 text-xs">IMG</span>
                          )}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{product.name}</p>
                          {product.isOwnProduct && (
                            <Badge variant="outline" className="text-xs">Mon produit</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{product.shares} partages</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatNumber(product.points)}</div>
                      <p className="text-sm text-gray-500">points gagnés</p>
                      {!product.isOwnProduct && (
                        <p className="text-xs text-blue-600 mt-1">✓ Points valides</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistiques par réseau social */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <span>Performance par Réseau Social</span>
              </CardTitle>
              <CardDescription>Analyse détaillée de l'engagement sur chaque plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(pointData.sharesData?.socialNetworkStats || {}).map(([network, stats]) => (
                  <div key={network} className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
                      {network === 'facebook' && <span className="text-lg">📘</span>}
                      {network === 'instagram' && <span className="text-lg">📷</span>}
                      {network === 'twitter' && <span className="text-lg">🐦</span>}
                      {network === 'whatsapp' && <span className="text-lg">💬</span>}
                      {network === 'linkedin' && <span className="text-lg">💼</span>}
                    </div>
                    <h3 className="font-semibold capitalize mb-2">{network}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">{stats.shares} partages</p>
                      <p className="text-green-600 font-medium">{formatNumber(stats.points)} points</p>
                      <p className="text-blue-600">{stats.engagement}% engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engagement des utilisateurs */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span>Engagement des Utilisateurs</span>
              </CardTitle>
              <CardDescription>Utilisateurs les plus actifs dans le partage de vos produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointData.sharesData?.userEngagement?.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{user.totalShares} partages</span>
                          <span>•</span>
                          <span>Score: {user.engagementScore}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user.favoriteCategories.slice(0, 3).map((category, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatNumber(user.pointsEarned)}</div>
                      <p className="text-sm text-gray-500">points gagnés</p>
                      <p className="text-xs text-gray-400">
                        Dernier partage: {new Date(user.lastShareDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Historique des Transactions</CardTitle>
              <CardDescription>Suivi complet de vos activités</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Rechercher une transaction..." className="pl-10" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrer par type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="earned">Gagnés</SelectItem>
                      <SelectItem value="spent">Dépensés</SelectItem>
                      <SelectItem value="transferred">Transférés</SelectItem>
                      <SelectItem value="exchanged">Échangés</SelectItem>
                      <SelectItem value="share_bonus">Bonus partages</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => handleExport('history')}>
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('pdf')}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {pointData.history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${getTypeColor(item.type)} bg-opacity-10`}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-500">
                              {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                            </p>
                            {item.socialNetwork && (
                              <Badge variant="outline" className="text-xs">
                                {item.socialNetwork}
                              </Badge>
                            )}
                            {item.shareType && (
                              <Badge variant="outline" className="text-xs">
                                {item.shareType === 'product' ? 'Produit' : 
                                 item.shareType === 'category' ? 'Catégorie' : 'Campagne'}
                              </Badge>
                            )}
                          </div>
                          {item.type === 'share_bonus' && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ Points gagnés sur partage d'autrui
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.amount > 0 ? '+' : ''}{formatNumber(item.amount)} points
                        </div>
                        <Badge variant="secondary" className={`mt-1 ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                        {item.source && (
                          <p className="text-xs text-gray-500 mt-1">
                            Source: {item.source}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-earners" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top Gagnants de Points</CardTitle>
              <CardDescription>Classement des meilleurs gagnants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointData.topEarners.map((earner, index) => (
                  <div key={earner.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={earner.avatar} />
                          <AvatarFallback>{earner.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                                                 {index < 3 && (
                           <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
                             {index + 1}
                           </div>
                         )}
                      </div>
                      <div>
                        <p className="font-medium">{earner.name}</p>
                        <p className="text-sm text-gray-500">{earner.shares} partages</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatNumber(earner.points)}</div>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Demandes de Retrait</CardTitle>
              <CardDescription>Suivi de vos demandes de retrait</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointData.withdrawalRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getStatusColor(request.status)} bg-opacity-10`}>
                        {getStatusIcon(request.status)}
                      </div>
                      <div>
                        <p className="font-medium">{formatNumber(request.amount)} points</p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.timestamp).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                                             <div className="flex items-center space-x-2">
                         {request.method === 'Mobile Money' && <Smartphone className="w-4 h-4 text-gray-400" />}
                         {request.method === 'Carte Bancaire' && <CreditCard className="w-4 h-4 text-gray-400" />}
                         <span className="text-sm text-gray-600">{request.method} (via FeexPay)</span>
                       </div>
                      <Badge variant="secondary" className={`mt-1 ${getStatusColor(request.status)}`}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Évolution des Points</CardTitle>
              </CardHeader>
              <CardContent>
                                 <div className="h-48 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fff5f0, #f0f0f0)' }}>
                  <div className="text-center">
                    <BarChart className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-500">Graphique d'évolution</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Répartition</CardTitle>
              </CardHeader>
              <CardContent>
                                 <div className="h-48 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)' }}>
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                    <p className="text-gray-500">Graphique de répartition</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          {/* Prédictions IA */}
                     <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #535455)' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-yellow-300" />
                <span>Prédictions IA pour le Prochain Mois</span>
              </CardTitle>
              <CardDescription className="text-indigo-100">
                Analyse prédictive basée sur vos données et tendances du marché
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{formatNumber(pointData.predictiveAnalytics?.nextMonthPrediction || 0)}</div>
                  <p className="text-indigo-100">Points prédits</p>
                                     <div className="mt-2 flex items-center justify-center space-x-1">
                     {pointData.predictiveAnalytics?.growthTrend === 'increasing' && <TrendingUp className="w-4 h-4" style={{ color: '#ff6600' }} />}
                     {pointData.predictiveAnalytics?.growthTrend === 'decreasing' && <TrendingDown className="w-4 h-4" style={{ color: '#ff6600' }} />}
                     {pointData.predictiveAnalytics?.growthTrend === 'stable' && <Minus className="w-4 h-4" style={{ color: '#ff6600' }} />}
                     <span className="text-sm text-indigo-100 capitalize">
                       {pointData.predictiveAnalytics?.growthTrend || 'stable'}
                     </span>
                   </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{pointData.predictiveAnalytics?.recommendedActions?.length || 0}</div>
                  <p className="text-indigo-100">Actions recommandées</p>
                  <div className="mt-2">
                                         <Badge variant="secondary" className="text-white border-white/30" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                       <Sparkles className="w-3 h-3 mr-1" />
                       IA Optimisée
                     </Badge>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{pointData.predictiveAnalytics?.marketOpportunities?.length || 0}</div>
                  <p className="text-indigo-100">Opportunités marché</p>
                  <div className="mt-2">
                                         <Badge variant="secondary" className="text-white border-white/30" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                       <Target className="w-3 h-3 mr-1" />
                       Détectées
                     </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions recommandées par l'IA */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <span>Actions Recommandées par l'IA</span>
              </CardTitle>
              <CardDescription>Recommandations personnalisées pour optimiser vos gains de points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointData.predictiveAnalytics?.recommendedActions?.map((action, index) => (
                                     <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg" style={{ background: 'linear-gradient(135deg, #fff5f0, #f0f0f0)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #ff6600, #535455)' }}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{action}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Recommandation IA
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Opportunités du marché */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-500" />
                <span>Opportunités du Marché</span>
              </CardTitle>
              <CardDescription>Catégories et segments avec le plus grand potentiel de gains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pointData.predictiveAnalytics?.marketOpportunities?.map((opportunity, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{opportunity.category}</h4>
                      <Badge 
                        variant={
                          opportunity.difficulty === 'low' ? 'default' :
                          opportunity.difficulty === 'medium' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {opportunity.difficulty === 'low' ? 'Facile' :
                         opportunity.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Potentiel:</span>
                        <span className="font-semibold text-green-600">{formatNumber(opportunity.potentialPoints)} points</span>
                      </div>
                      <Progress 
                        value={(opportunity.potentialPoints / 10000) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de transfert */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transférer des Points</DialogTitle>
            <DialogDescription>
              Envoyez des points à un autre utilisateur
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Destinataire</Label>
              <Input
                id="recipient"
                placeholder="ID ou email du destinataire"
                value={transferData.recipientId}
                onChange={(e) => setTransferData({ ...transferData, recipientId: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="amount">Montant</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Nombre de points"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTransferModal(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleTransfer}
              disabled={!transferData.recipientId || transferData.amount <= 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Transfert en cours...
                </>
              ) : (
                'Transférer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'échange */}
      <Dialog open={showExchangeModal} onOpenChange={setShowExchangeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Échanger des Points</DialogTitle>
            <DialogDescription>
              Convertissez vos points en devise
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="exchange-amount">Montant en points</Label>
              <Input
                id="exchange-amount"
                type="number"
                placeholder="Nombre de points à échanger"
                value={exchangeData.amount}
                onChange={(e) => setExchangeData({ ...exchangeData, amount: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="exchange-currency">Devise de destination</Label>
              <Select 
                value={exchangeData.toCurrency} 
                onValueChange={(value) => setExchangeData({ ...exchangeData, toCurrency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                  <SelectItem value="USD">USD (Dollar US)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExchangeModal(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleExchange}
              disabled={exchangeData.amount <= 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Échange en cours...
                </>
              ) : (
                'Échanger'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de retrait */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Demande de Retrait</DialogTitle>
            <DialogDescription>
              Retirez vos points en devise
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdrawal-amount">Montant en points</Label>
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder="Nombre de points à retirer"
                value={withdrawalData.amount}
                onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: parseInt(e.target.value) || 0 })}
              />
            </div>
            
            <div>
              <Label htmlFor="withdrawal-method">Méthode de paiement</Label>
              <Select 
                value={withdrawalData.method} 
                onValueChange={(value) => setWithdrawalData({ ...withdrawalData, method: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mobile Money">Mobile Money (via FeexPay)</SelectItem>
                  <SelectItem value="Carte Bancaire">Carte Bancaire (via FeexPay)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawalModal(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleWithdrawal}
              disabled={withdrawalData.amount <= 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Demande en cours...
                </>
              ) : (
                'Demander le retrait'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal des paramètres */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres</DialogTitle>
            <DialogDescription>
              Personnalisez votre expérience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Afficher le solde</Label>
                  <p className="text-xs text-gray-500">Masquer ou afficher votre solde</p>
                </div>
                <Switch 
                  checked={showBalance} 
                  onCheckedChange={setShowBalance}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Notifications</Label>
                  <p className="text-xs text-gray-500">Recevoir des notifications</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSettingsModal(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
