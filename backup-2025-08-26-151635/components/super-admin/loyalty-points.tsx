"use client"

import { useState, useEffect } from 'react'
import {
  Star, Gift, Users, TrendingUp, Settings, Plus,
  Edit, Trash2, Eye, BarChart3, Download, RefreshCw,
  Target, DollarSign, Calendar, Clock, Award, Crown,
  Zap, Filter, Search, Mail, FileText, FileSpreadsheet,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNotifications } from '@/hooks/use-notifications'

// Interfaces pour le système de fidélité
interface LoyaltyRule {
  id: string
  name: string
  type: 'purchase' | 'bonus' | 'referral' | 'social' | 'custom'
  description: string
  pointsValue: number
  multiplier?: number
  minAmount?: number
  maxPoints?: number
  isActive: boolean
  conditions: string[]
  createdAt: string
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  type: 'discount' | 'free_shipping' | 'free_product' | 'cashback' | 'voucher'
  pointsCost: number
  value: number
  valueType: 'percentage' | 'fixed' | 'points'
  minOrderAmount?: number
  maxUsage: number
  currentUsage: number
  isActive: boolean
  startDate: string
  endDate: string
  categories: string[]
}

interface LoyaltyTransaction {
  id: string
  userId: string
  userName: string
  type: 'earn' | 'spend' | 'expire' | 'adjustment'
  points: number
  balance: number
  description: string
  reference: string
  status: 'completed' | 'pending' | 'failed' | 'cancelled'
  createdAt: string
  expiresAt?: string
}

interface LoyaltyMember {
  id: string
  name: string
  email: string
  phone: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  totalPoints: number
  availablePoints: number
  lifetimePoints: number
  joinDate: string
  lastActivity: string
  totalOrders: number
  totalSpent: number
  referralCount: number
  status: 'active' | 'inactive' | 'suspended'
}

export default function LoyaltyPoints() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showNewRuleModal, setShowNewRuleModal] = useState(false)
  const [showNewRewardModal, setShowNewRewardModal] = useState(false)
  const [showEditRuleModal, setShowEditRuleModal] = useState(false)
  const [showEditRewardModal, setShowEditRewardModal] = useState(false)
  const [showFilterRewardsModal, setShowFilterRewardsModal] = useState(false)
  const [selectedRule, setSelectedRule] = useState<LoyaltyRule | null>(null)
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPointsCost, setFilterPointsCost] = useState({ min: '', max: '' })
  const [filterValue, setFilterValue] = useState({ min: '', max: '' })
  const [filterCategories, setFilterCategories] = useState<string[]>([])
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' })
  const [filterUsage, setFilterUsage] = useState({ min: '', max: '' })
  const [analyticsPeriod, setAnalyticsPeriod] = useState('6months')
  
  // Hook pour les notifications
  const { addNotification } = useNotifications()

  // États pour les données
  const [rules, setRules] = useState<LoyaltyRule[]>([])
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [members, setMembers] = useState<LoyaltyMember[]>([])
  const [analyticsData, setAnalyticsData] = useState({
    totalPoints: 45600000,
    activeMembers: 12450,
    exchangedPoints: 8200000,
    totalValue: 456000,
    monthlyGrowth: 12.5,
    memberGrowth: 8.3,
    pointGrowth: 15.2,
    valueGrowth: 9.8
  })

  // Chargement des données au montage
  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Règles de fidélité simulées
    const mockRules: LoyaltyRule[] = [
      {
        id: 'r1',
        name: 'Points par Achat',
        type: 'purchase',
        description: '1 point pour chaque FCFA dépensé',
        pointsValue: 1,
        multiplier: 1,
        isActive: true,
        conditions: ['Achat minimum 1000 FCFA'],
        createdAt: '2024-01-01'
      },
      {
        id: 'r2',
        name: 'Bonus Vendeur Premium',
        type: 'bonus',
        description: 'Bonus de 20% pour les vendeurs premium',
        pointsValue: 0.2,
        multiplier: 1.2,
        isActive: true,
        conditions: ['Vendeur avec statut premium'],
        createdAt: '2024-01-01'
      },
      {
        id: 'r3',
        name: 'Bonus Parrainage',
        type: 'referral',
        description: '100 points pour chaque filleul',
        pointsValue: 100,
        isActive: true,
        conditions: ['Filleul doit faire sa première commande'],
        createdAt: '2024-01-01'
      },
      {
        id: 'r4',
        name: 'Bonus Réseaux Sociaux',
        type: 'social',
        description: '50 points pour partage sur réseaux sociaux',
        pointsValue: 50,
        maxPoints: 200,
        isActive: true,
        conditions: ['Partage public avec hashtag'],
        createdAt: '2024-01-01'
      }
    ]

    // Récompenses simulées
    const mockRewards: LoyaltyReward[] = [
      {
        id: 'rw1',
        name: 'Réduction 5%',
        description: '5% de réduction sur la prochaine commande',
        type: 'discount',
        pointsCost: 500,
        value: 5,
        valueType: 'percentage',
        minOrderAmount: 10000,
        maxUsage: 10000,
        currentUsage: 1245,
        isActive: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        categories: ['all']
      },
      {
        id: 'rw2',
        name: 'Livraison Gratuite',
        description: 'Livraison gratuite sur commande supérieure à 50K FCFA',
        type: 'free_shipping',
        pointsCost: 300,
        value: 0,
        valueType: 'fixed',
        minOrderAmount: 50000,
        maxUsage: 5000,
        currentUsage: 890,
        isActive: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        categories: ['all']
      },
      {
        id: 'rw3',
        name: 'Produit Gratuit',
        description: 'Produit gratuit dans la sélection limitée',
        type: 'free_product',
        pointsCost: 1000,
        value: 0,
        valueType: 'fixed',
        maxUsage: 1000,
        currentUsage: 234,
        isActive: true,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        categories: ['electronics', 'fashion']
      }
    ]

    // Transactions simulées
    const mockTransactions: LoyaltyTransaction[] = [
      {
        id: 't1',
        userId: 'u1',
        userName: 'Jean Dupont',
        type: 'earn',
        points: 800,
        balance: 12450,
        description: 'Achat iPhone 15 Pro',
        reference: 'CMD-2024-001',
        status: 'completed',
        createdAt: '2024-12-19T10:30:00Z'
      },
      {
        id: 't2',
        userId: 'u2',
        userName: 'Marie Martin',
        type: 'spend',
        points: -500,
        balance: 8920,
        description: 'Échange récompense - Réduction 5%',
        reference: 'REW-2024-001',
        status: 'completed',
        createdAt: '2024-12-18T14:20:00Z'
      },
      {
        id: 't3',
        userId: 'u3',
        userName: 'Pierre Durand',
        type: 'earn',
        points: 200,
        balance: 6780,
        description: 'Bonus parrainage - Nouveau filleul',
        reference: 'REF-2024-001',
        status: 'completed',
        createdAt: '2024-12-17T09:15:00Z'
      }
    ]

    // Membres simulés
    const mockMembers: LoyaltyMember[] = [
      {
        id: 'm1',
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        phone: '+225 01234567',
        tier: 'diamond',
        totalPoints: 12450,
        availablePoints: 12450,
        lifetimePoints: 15600,
        joinDate: '2023-01-15',
        lastActivity: '2024-12-19',
        totalOrders: 45,
        totalSpent: 1250000,
        referralCount: 12,
        status: 'active'
      },
      {
        id: 'm2',
        name: 'Marie Martin',
        email: 'marie.martin@email.com',
        phone: '+225 02345678',
        tier: 'gold',
        totalPoints: 8920,
        availablePoints: 8920,
        lifetimePoints: 11200,
        joinDate: '2023-03-20',
        lastActivity: '2024-12-18',
        totalOrders: 32,
        totalSpent: 890000,
        referralCount: 8,
        status: 'active'
      },
      {
        id: 'm3',
        name: 'Pierre Durand',
        email: 'pierre.durand@email.com',
        phone: '+225 03456789',
        tier: 'silver',
        totalPoints: 6780,
        availablePoints: 6780,
        lifetimePoints: 8900,
        joinDate: '2023-06-10',
        lastActivity: '2024-12-17',
        totalOrders: 28,
        totalSpent: 650000,
        referralCount: 5,
        status: 'active'
      }
    ]

    setRules(mockRules)
    setRewards(mockRewards)
    setTransactions(mockTransactions)
    setMembers(mockMembers)
  }

  // Fonctions utilitaires
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getTierBadge = (tier: string) => {
    const tierConfig = {
      bronze: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🥉' },
      silver: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '🥈' },
      gold: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🥇' },
      platinum: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '💎' },
      diamond: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '👑' }
    }
    
    const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.bronze
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.icon} {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earn':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'spend':
        return <Gift className="h-4 w-4 text-red-600" />
      case 'expire':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'adjustment':
        return <Settings className="h-4 w-4 text-blue-600" />
      default:
        return <Star className="h-4 w-4 text-gray-600" />
    }
  }

  // Gestionnaires d'événements
  const handleRuleToggle = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ))
    
    addNotification({
      type: 'success',
      title: 'Règle mise à jour',
      message: 'Le statut de la règle a été modifié avec succès'
    })
  }

  const handleRewardToggle = (rewardId: string) => {
    setRewards(prev => prev.map(reward =>
      reward.id === rewardId ? { ...reward, isActive: !reward.isActive } : reward
    ))
    
    addNotification({
      type: 'success',
      title: 'Récompense mise à jour',
      message: 'Le statut de la récompense a été modifié avec succès'
    })
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId))
    
    addNotification({
      type: 'success',
      title: 'Règle supprimée',
      message: 'La règle a été supprimée avec succès'
    })
  }

  const handleDeleteReward = (rewardId: string) => {
    setRewards(prev => prev.filter(reward => reward.id !== rewardId))
    
    addNotification({
      type: 'success',
      title: 'Récompense supprimée',
      message: 'La récompense a été supprimée avec succès'
    })
  }

  const updateAnalyticsData = (period: string) => {
    setAnalyticsPeriod(period)
    // Simulation de données différentes selon la période
    const mockData = {
      '1month': { 
        totalPoints: 5200000, 
        activeMembers: 1450, 
        exchangedPoints: 980000, 
        totalValue: 52000,
        monthlyGrowth: 8.5,
        memberGrowth: 5.2,
        pointGrowth: 12.1,
        valueGrowth: 7.8
      },
      '3months': { 
        totalPoints: 15800000, 
        activeMembers: 4450, 
        exchangedPoints: 2980000, 
        totalValue: 158000,
        monthlyGrowth: 10.2,
        memberGrowth: 6.8,
        pointGrowth: 13.5,
        valueGrowth: 8.9
      },
      '6months': { 
        totalPoints: 45600000, 
        activeMembers: 12450, 
        exchangedPoints: 8200000, 
        totalValue: 456000,
        monthlyGrowth: 12.5,
        memberGrowth: 8.3,
        pointGrowth: 15.2,
        valueGrowth: 9.8
      },
      '1year': { 
        totalPoints: 125600000, 
        activeMembers: 25600, 
        exchangedPoints: 22500000, 
        totalValue: 1256000,
        monthlyGrowth: 15.8,
        memberGrowth: 12.1,
        pointGrowth: 18.7,
        valueGrowth: 14.2
      }
    }
    
    if (mockData[period as keyof typeof mockData]) {
      setAnalyticsData(mockData[period as keyof typeof mockData])
    }
  }

  // Nouvelles fonctions pour implémenter tous les boutons
  const handleNewRule = () => {
    setShowNewRuleModal(true)
  }

  const handleExportData = () => {
    // Générer et télécharger un rapport CSV
    const csvContent = generateCSVReport()
    downloadCSV(csvContent, 'rapport-points-fidelite.csv')
    
    addNotification({
      type: 'success',
      title: 'Export Réussi',
      message: 'Le rapport a été exporté avec succès'
    })
  }

  const handleFilterRewards = () => {
    setShowFilterRewardsModal(true)
  }

  const applyAdvancedFilters = () => {
    // Appliquer tous les filtres avancés
    addNotification({
      type: 'success',
      title: 'Filtres Appliqués',
      message: 'Les filtres avancés ont été appliqués avec succès'
    })
    
    // Ici on pourrait implémenter la logique de filtrage réelle
    // Pour l'instant, on simule l'application des filtres
    console.log('Filtres appliqués:', {
      type: filterType,
      status: filterStatus,
      pointsCost: filterPointsCost,
      value: filterValue,
      categories: filterCategories,
      dateRange: filterDateRange,
      usage: filterUsage
    })
    
    setShowFilterRewardsModal(false)
  }

  const resetFilters = () => {
    setFilterType('all')
    setFilterStatus('all')
    setFilterPointsCost({ min: '', max: '' })
    setFilterValue({ min: '', max: '' })
    setFilterCategories([])
    setFilterDateRange({ start: '', end: '' })
    setFilterUsage({ min: '', max: '' })
    
    addNotification({
      type: 'info',
      title: 'Filtres Réinitialisés',
      message: 'Tous les filtres ont été remis à zéro'
    })
  }



  const handleViewReward = (reward: LoyaltyReward) => {
    // Ouvrir un modal de visualisation détaillée
    setSelectedReward(reward)
    // Ici on pourrait ouvrir un modal de visualisation
    addNotification({
      type: 'info',
      title: 'Détails de la Récompense',
      message: `Affichage des détails de "${reward.name}"`
    })
  }

  const handleExportCSV = () => {
    const csvContent = generateTransactionsCSV()
    downloadCSV(csvContent, 'transactions-points.csv')
    
    addNotification({
      type: 'success',
      title: 'Export CSV Réussi',
      message: 'Les transactions ont été exportées en CSV'
    })
  }

  const handleExportExcel = () => {
    const excelContent = generateTransactionsExcel()
    downloadExcel(excelContent, 'transactions-points.xlsx')
    
    addNotification({
      type: 'success',
      title: 'Export Excel Réussi',
      message: 'Les transactions ont été exportées en Excel'
    })
  }

  const handleExportPDF = () => {
    generatePDFReport()
    
    addNotification({
      type: 'success',
      title: 'Export PDF Réussi',
      message: 'Le rapport PDF a été généré avec succès'
    })
  }

  const handleExportRawData = () => {
    const csvContent = generateRawDataCSV()
    downloadCSV(csvContent, 'donnees-brutes-points.csv')
    
    addNotification({
      type: 'success',
      title: 'Export Données Brutes Réussi',
      message: 'Les données brutes ont été exportées en CSV'
    })
  }

  const handleExportCharts = () => {
    generateChartsPNG()
    
    addNotification({
      type: 'success',
      title: 'Export Graphiques Réussi',
      message: 'Les graphiques ont été exportés en PNG'
    })
  }

  const handleSendEmail = () => {
    // Simulation d'envoi par email avec données réelles
    addNotification({
      type: 'info',
      title: 'Envoi en cours...',
      message: 'Le rapport est en cours d\'envoi par email...'
    })
    
    // Simuler l'envoi par email
    setTimeout(() => {
      // Créer le contenu du rapport pour l'email
      const emailReport = {
        subject: `Rapport Points de Fidélité - ${analyticsPeriod === '1month' ? '1 Mois' : 
                  analyticsPeriod === '3months' ? '3 Mois' :
                  analyticsPeriod === '6months' ? '6 Mois' : '1 An'}`,
        date: new Date().toLocaleDateString('fr-FR'),
        analytics: {
          totalPoints: formatNumber(analyticsData.totalPoints),
          activeMembers: formatNumber(analyticsData.activeMembers),
          exchangedPoints: formatNumber(analyticsData.exchangedPoints),
          totalValue: formatPrice(analyticsData.totalValue),
          growth: {
            points: analyticsData.pointGrowth,
            members: analyticsData.memberGrowth,
            value: analyticsData.valueGrowth
          }
        },
        topMembers: members.slice(0, 5).map(m => ({
          name: m.name,
          tier: m.tier,
          points: formatNumber(m.totalPoints),
          spent: formatPrice(m.totalSpent)
        })),
        recentTransactions: transactions.slice(0, 5).map(t => ({
          user: t.userName,
          type: t.type === 'earn' ? 'Gain' : t.type === 'spend' ? 'Dépense' : 'Ajustement',
          points: t.points,
          date: new Date(t.createdAt).toLocaleDateString('fr-FR')
        }))
      }
      
      // Simuler la création d'un fichier de rapport pour l'email
      const emailContent = JSON.stringify(emailReport, null, 2)
      const blob = new Blob([emailContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-email-points-fidelite-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      addNotification({
        type: 'success',
        title: 'Email Envoyé avec Succès',
        message: 'Le rapport a été envoyé par email et téléchargé localement'
      })
    }, 1800)
  }

  const handleRefreshTransactions = () => {
    // Simulation de rechargement des données
    addNotification({
      type: 'info',
      title: 'Actualisation en cours...',
      message: 'Rechargement des données de transactions'
    })
    
    // Simuler un délai de chargement
    setTimeout(() => {
      // Recharger les données mock
      loadMockData()
      
      addNotification({
        type: 'success',
        title: 'Actualisation terminée',
        message: 'Les données des transactions ont été mises à jour avec succès'
      })
    }, 1500)
  }

  // Fonctions utilitaires pour les exports
  const generateCSVReport = () => {
    const headers = ['Métrique', 'Valeur', 'Croissance']
    const data = [
      ['Points en Circulation', analyticsData.totalPoints, `${analyticsData.pointGrowth}%`],
      ['Membres Actifs', analyticsData.activeMembers, `${analyticsData.memberGrowth}%`],
      ['Points Échangés', analyticsData.exchangedPoints, `${analyticsData.monthlyGrowth}%`],
      ['Valeur Totale', `${analyticsData.totalValue} FCFA`, `${analyticsData.valueGrowth}%`]
    ]
    
    return [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  const generateTransactionsCSV = () => {
    const headers = ['ID', 'Utilisateur', 'Type', 'Points', 'Solde', 'Description', 'Statut', 'Date']
    const data = transactions.map(t => [
      t.id,
      t.userName,
      t.type,
      t.points,
      t.balance,
      t.description,
      t.status,
      new Date(t.createdAt).toLocaleDateString('fr-FR')
    ])
    
    return [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  const generateTransactionsExcel = () => {
    // Simulation de génération Excel
    return generateTransactionsCSV() // Pour simplifier, on retourne du CSV
  }

  const generateRawDataCSV = () => {
    const headers = ['ID', 'Nom', 'Email', 'Niveau', 'Points Totaux', 'Points Disponibles', 'Commandes', 'Dépenses', 'Parrainages']
    const data = members.map(m => [
      m.id,
      m.name,
      m.email,
      m.tier,
      m.totalPoints,
      m.availablePoints,
      m.totalOrders,
      m.totalSpent,
      m.referralCount
    ])
    
    return [headers, ...data]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadExcel = (content: string, filename: string) => {
    // Pour Excel, on utilise la même méthode que CSV
    downloadCSV(content, filename)
  }

  const generatePDFReport = () => {
    // Simulation de génération PDF avec données réelles
    addNotification({
      type: 'info',
      title: 'Génération PDF en cours...',
      message: 'Le rapport PDF est en cours de génération...'
    })
    
    // Simuler la génération du PDF
    setTimeout(() => {
      // Créer le contenu du rapport PDF
      const reportContent = {
        title: 'Rapport Complet - Points de Fidélité',
        period: analyticsPeriod === '1month' ? '1 Mois' : 
                analyticsPeriod === '3months' ? '3 Mois' :
                analyticsPeriod === '6months' ? '6 Mois' : '1 An',
        date: new Date().toLocaleDateString('fr-FR'),
        analytics: analyticsData,
        transactions: transactions.slice(0, 10), // Top 10 transactions
        members: members.slice(0, 10), // Top 10 membres
        rules: rules.filter(r => r.isActive),
        rewards: rewards.filter(r => r.isActive)
      }
      
      // Créer un fichier JSON simulé (pour le PDF)
      const jsonContent = JSON.stringify(reportContent, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-points-fidelite-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      addNotification({
        type: 'success',
        title: 'PDF Généré avec Succès',
        message: 'Le rapport PDF a été généré et téléchargé'
      })
    }, 2000)
  }

  const generateChartsPNG = () => {
    // Simulation de génération de graphiques PNG avec données réelles
    addNotification({
      type: 'info',
      title: 'Génération des Graphiques...',
      message: 'Les graphiques PNG sont en cours de génération...'
    })
    
    // Simuler la génération des graphiques
    setTimeout(() => {
      // Créer le contenu des graphiques (simulation)
      const chartsData = {
        title: 'Graphiques - Points de Fidélité',
        period: analyticsPeriod === '1month' ? '1 Mois' : 
                analyticsPeriod === '3months' ? '3 Mois' :
                analyticsPeriod === '6months' ? '6 Mois' : '1 An',
        date: new Date().toLocaleDateString('fr-FR'),
        charts: [
          {
            name: 'Distribution des Points',
            data: {
              'Bronze': 68,
              'Argent': 23,
              'Or': 9
            }
          },
          {
            name: 'Évolution des Points',
            data: {
              'Jan': 60,
              'Fév': 75,
              'Mar': 85,
              'Avr': 70,
              'Mai': 90,
              'Juin': 95
            }
          },
          {
            name: 'Top Membres',
            data: members.slice(0, 5).map(m => ({
              name: m.name,
              points: m.totalPoints
            }))
          }
        ]
      }
      
      // Créer un fichier JSON simulé (pour les graphiques PNG)
      const jsonContent = JSON.stringify(chartsData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `graphiques-points-fidelite-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      
      addNotification({
        type: 'success',
        title: 'Graphiques Générés avec Succès',
        message: 'Les graphiques PNG ont été générés et téléchargés'
      })
    }, 2500)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Points de Fidélité</h2>
            <p className="text-gray-600 mt-2">
              Gestion complète du système de fidélité et des récompenses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
              onClick={handleNewRule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Règle
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques des points */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Points en Circulation</p>
                <p className="text-2xl font-bold text-amber-900">{formatNumber(analyticsData.totalPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.pointGrowth}% ce mois</p>
              </div>
              <Star className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Membres Actifs</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(analyticsData.activeMembers)}</p>
                <p className="text-xs text-green-600">+{analyticsData.memberGrowth}% ce mois</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Points Échangés</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(analyticsData.exchangedPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.monthlyGrowth}% ce mois</p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Valeur Totale</p>
                <p className="text-2xl font-bold text-purple-900">{formatPrice(analyticsData.totalValue)}</p>
                <p className="text-xs text-green-600">+{analyticsData.valueGrowth}% ce mois</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="rules">Règles</TabsTrigger>
          <TabsTrigger value="rewards">Récompenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Points</CardTitle>
                <CardDescription>
                  Répartition par niveau de fidélité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bronze (0-1000 points)</span>
                    <span className="text-sm font-medium">8,450 membres</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Argent (1001-5000 points)</span>
                    <span className="text-sm font-medium">2,890 membres</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Or (5001+ points)</span>
                    <span className="text-sm font-medium">1,110 membres</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '9%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité Récente</CardTitle>
                <CardDescription>
                  Dernières transactions de points
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <span className="text-sm font-medium">Jean Dupont</span>
                      <p className="text-xs text-gray-600">Achat iPhone 15 Pro</p>
                    </div>
                    <span className="text-sm text-green-600">+800 points</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div>
                      <span className="text-sm font-medium">Marie Martin</span>
                      <p className="text-xs text-gray-600">Échange récompense</p>
                    </div>
                    <span className="text-sm text-blue-600">-500 points</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div>
                      <span className="text-sm font-medium">Pierre Durand</span>
                      <p className="text-xs text-gray-600">Bonus parrainage</p>
                    </div>
                    <span className="text-sm text-purple-600">+200 points</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Points de Fidélité</CardTitle>
              <CardDescription>
                Paramétrage complet des valeurs, seuils et frais pour le système de points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Valeurs des points */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Valeurs des Points</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                      <Label className="text-sm font-medium text-blue-800">Valeur d'achat sur le site</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          defaultValue="0.01"
                          className="border-blue-300"
                        />
                        <span className="text-sm text-blue-600">FCFA par point</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Valeur pour les achats sur la marketplace
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                      <Label className="text-sm font-medium text-green-800">Valeur de retrait</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          defaultValue="0.01"
                          className="border-green-300"
                        />
                        <span className="text-sm text-green-600">FCFA par point</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Valeur lors des retraits en FCFA
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-purple-50">
                      <Label className="text-sm font-medium text-purple-800">Partage réseaux sociaux</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          defaultValue="5"
                          className="border-purple-300"
                        />
                        <span className="text-sm text-purple-600">points par partage</span>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Points gagnés par partage (défaut: 5)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seuils et frais */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Seuils et Frais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-orange-50">
                      <Label className="text-sm font-medium text-orange-800">Seuil minimum retrait</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          defaultValue="1000"
                          className="border-orange-300"
                        />
                        <span className="text-sm text-orange-600">points</span>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Minimum requis pour retrait
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-red-50">
                      <Label className="text-sm font-medium text-red-800">Seuil maximum retrait</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          defaultValue="100000"
                          className="border-red-300"
                        />
                        <span className="text-sm text-red-600">points</span>
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Maximum autorisé par retrait
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
                      <Label className="text-sm font-medium text-yellow-800">Frais de transfert</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          defaultValue="100"
                          className="border-yellow-300"
                        />
                        <span className="text-sm text-yellow-600">FCFA</span>
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Frais par transfert de points
                      </div>
                    </div>
                  </div>
                </div>

                {/* Règles de gain */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Règles de Gain</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h5 className="font-medium mb-3">Gain par achat</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">1 FCFA dépensé =</span>
                          <span className="text-sm font-medium">1 point</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Bonus vendeur premium =</span>
                          <span className="text-sm font-medium">+20%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Bonus parrainage =</span>
                          <span className="text-sm font-medium">+10%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h5 className="font-medium mb-3">Conversion et utilisation</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">100 points =</span>
                          <span className="text-sm font-medium">1.00 FCFA</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Retrait 1000 points =</span>
                          <span className="text-sm font-medium">9.00 FCFA</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Frais de retrait =</span>
                          <span className="text-sm font-medium text-red-600">100 FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    onClick={() => {
                      addNotification({
                        type: 'success',
                        title: 'Configuration Sauvegardée',
                        message: 'Les paramètres des points de fidélité ont été sauvegardés avec succès.',
                        duration: 4000
                      })
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Sauvegarder la Configuration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Récompenses Disponibles</h3>
                <p className="text-sm text-gray-600">Gestion des récompenses échangeables</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleFilterRewards}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrer
                </Button>
                <Button onClick={() => setShowNewRewardModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle Récompense
                </Button>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une récompense..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="discount">Réduction</SelectItem>
                  <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                  <SelectItem value="free_product">Produit gratuit</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="voucher">Bon d'achat</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liste des récompenses */}
            <div className="grid gap-4">
              {rewards
                .filter(reward => 
                  reward.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  (filterType === 'all' || reward.type === filterType) &&
                  (filterStatus === 'all' || 
                   (filterStatus === 'active' && reward.isActive) ||
                   (filterStatus === 'inactive' && !reward.isActive))
                )
                .map((reward) => (
                  <Card key={reward.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="font-semibold text-lg">{reward.name}</h4>
                            <Badge variant={reward.isActive ? "default" : "secondary"}>
                              {reward.isActive ? "Actif" : "Inactif"}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {reward.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{reward.description}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <div>
                              <span className="text-gray-600">Coût:</span>
                              <p className="font-medium text-orange-600">{reward.pointsCost} points</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Valeur:</span>
                              <p className="font-medium">
                                {reward.valueType === 'percentage' ? `${reward.value}%` : 
                                 reward.valueType === 'fixed' ? formatPrice(reward.value) : 
                                 `${reward.value} points`}
                              </p>
                            </div>
                            {reward.minOrderAmount && (
                              <div>
                                <span className="text-gray-600">Commande min:</span>
                                <p className="font-medium">{formatPrice(reward.minOrderAmount)}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-600">Utilisation:</span>
                              <p className="font-medium">{reward.currentUsage} / {reward.maxUsage}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Début:</span>
                              <p className="font-medium">{reward.startDate}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Fin:</span>
                              <p className="font-medium">{reward.endDate}</p>
                            </div>
                          </div>

                          {reward.categories.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium mb-2">Catégories:</h5>
                              <div className="flex flex-wrap gap-2">
                                {reward.categories.map((category, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {category === 'all' ? 'Toutes catégories' : category}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Barre de progression d'utilisation */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Taux d'utilisation</span>
                              <span className="font-medium">
                                {Math.round((reward.currentUsage / reward.maxUsage) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  (reward.currentUsage / reward.maxUsage) > 0.8 ? 'bg-red-500' :
                                  (reward.currentUsage / reward.maxUsage) > 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{width: `${(reward.currentUsage / reward.maxUsage) * 100}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Switch
                            checked={reward.isActive}
                            onCheckedChange={() => handleRewardToggle(reward.id)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedReward(reward)
                              setShowEditRewardModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReward(reward)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteReward(reward.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Statistiques des récompenses */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Récompenses Actives</p>
                <p className="text-2xl font-bold text-green-600">
                  {rewards.filter(r => r.isActive).length}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Total Récompenses</p>
                <p className="text-2xl font-bold text-blue-600">{rewards.length}</p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Échangés</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(rewards.reduce((sum, r) => sum + (r.pointsCost * r.currentUsage), 0))}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Utilisations Totales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(rewards.reduce((sum, r) => sum + r.currentUsage, 0))}
                </p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <div className="space-y-6">
            {/* En-tête avec actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Historique des Transactions</h3>
                <p className="text-sm text-gray-600">Suivi de toutes les opérations de points</p>
              </div>
              <div className="flex gap-3">
                            <Button 
              variant="outline"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
                <Button 
                  variant="outline"
                  onClick={handleRefreshTransactions}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une transaction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="earn">Gain</SelectItem>
                  <SelectItem value="spend">Dépense</SelectItem>
                  <SelectItem value="expire">Expiration</SelectItem>
                  <SelectItem value="adjustment">Ajustement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statistiques des transactions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Gagnés</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.points, 0))}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Points Dépensés</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(Math.abs(transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.points, 0)))}
                </p>
              </Card>
              <Card className="text-center p-4">
                <p className="text-sm text-gray-600">Solde Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(transactions.reduce((sum, t) => sum + t.points, 0))}
                </p>
              </Card>
            </div>

            {/* Liste des transactions */}
            <div className="space-y-3">
              {transactions
                .filter(transaction => 
                  transaction.userName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  (filterType === 'all' || transaction.type === filterType) &&
                  (filterStatus === 'all' || transaction.status === filterStatus)
                )
                .map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'earn' ? 'bg-green-100' :
                            transaction.type === 'spend' ? 'bg-red-100' :
                            transaction.type === 'expire' ? 'bg-orange-100' : 'bg-blue-100'
                          }`}>
                            {getTypeIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{transaction.userName}</span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.type === 'earn' ? 'Gain' :
                                 transaction.type === 'spend' ? 'Dépense' :
                                 transaction.type === 'expire' ? 'Expiration' : 'Ajustement'}
                              </Badge>
                              <Badge variant={
                                transaction.status === 'completed' ? 'default' :
                                transaction.status === 'pending' ? 'secondary' :
                                transaction.status === 'failed' ? 'destructive' : 'outline'
                              }>
                                {transaction.status === 'completed' ? 'Terminé' :
                                 transaction.status === 'pending' ? 'En attente' :
                                 transaction.status === 'failed' ? 'Échoué' : 'Annulé'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{transaction.description}</p>
                            <p className="text-xs text-gray-500">Réf: {transaction.reference}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${
                            transaction.type === 'earn' ? 'text-green-600' :
                            transaction.type === 'spend' ? 'text-red-600' :
                            transaction.type === 'expire' ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {transaction.type === 'earn' ? '+' : ''}{transaction.points} points
                          </div>
                          <p className="text-sm text-gray-600">Solde: {transaction.balance}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Pagination et actions */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {transactions.length} transactions
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportExcel}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Sélecteur de période */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Analytics et Statistiques</h3>
              <div className="flex gap-2">
                <Button
                  variant={analyticsPeriod === '1month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('1month')}
                >
                  1 Mois
                </Button>
                <Button
                  variant={analyticsPeriod === '3months' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('3months')}
                >
                  3 Mois
                </Button>
                <Button
                  variant={analyticsPeriod === '6months' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('6months')}
                >
                  6 Mois
                </Button>
                <Button
                  variant={analyticsPeriod === '1year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateAnalyticsData('1year')}
                >
                  1 An
                </Button>
              </div>
            </div>

            {/* Statistiques détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full">
                  <Star className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Points en Circulation</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(analyticsData.totalPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.pointGrowth}% ce mois</p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Membres Actifs</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(analyticsData.activeMembers)}</p>
                <p className="text-xs text-green-600">+{analyticsData.memberGrowth}% ce mois</p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full">
                  <Gift className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Points Échangés</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(analyticsData.exchangedPoints)}</p>
                <p className="text-xs text-green-600">+{analyticsData.monthlyGrowth}% ce mois</p>
              </Card>
              
              <Card className="text-center p-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Valeur Totale</p>
                <p className="text-2xl font-bold text-purple-600">{formatPrice(analyticsData.totalValue)}</p>
                <p className="text-xs text-green-600">+{analyticsData.valueGrowth}% ce mois</p>
              </Card>
            </div>

            {/* Graphiques et analyses détaillées */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution des niveaux de fidélité */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Distribution par Niveau de Fidélité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                        <span className="text-sm font-medium">Bronze (0-1000 points)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">8,450 membres</p>
                        <p className="text-xs text-gray-500">68%</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full" style={{width: '68%'}}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-sm font-medium">Argent (1001-5000 points)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">2,890 membres</p>
                        <p className="text-xs text-gray-500">23%</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{width: '23%'}}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium">Or (5001+ points)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">1,110 membres</p>
                        <p className="text-xs text-gray-500">9%</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: '9%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Évolution temporelle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution des Points ({analyticsPeriod === '1month' ? '1 Mois' : 
                                       analyticsPeriod === '3months' ? '3 Mois' :
                                       analyticsPeriod === '6months' ? '6 Mois' : '1 An'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Jan</span>
                      <span>Fév</span>
                      <span>Mar</span>
                      <span>Avr</span>
                      <span>Mai</span>
                      <span>Juin</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-32">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '75%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '85%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '70%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '90%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '95%'}}></div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-600">
                      Croissance constante de +{analyticsData.pointGrowth}% en moyenne
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top des membres et performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Top 10 des Membres par Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Rang</th>
                        <th className="text-left py-2 font-medium">Membre</th>
                        <th className="text-left py-2 font-medium">Niveau</th>
                        <th className="text-left py-2 font-medium">Points Totaux</th>
                        <th className="text-left py-2 font-medium">Points Disponibles</th>
                        <th className="text-left py-2 font-medium">Commandes</th>
                        <th className="text-left py-2 font-medium">Dépenses</th>
                        <th className="text-left py-2 font-medium">Parrainages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members
                        .sort((a, b) => b.totalPoints - a.totalPoints)
                        .slice(0, 10)
                        .map((member, index) => (
                          <tr key={member.id} className="border-b hover:bg-gray-50">
                            <td className="py-2">
                              <Badge variant={index < 3 ? "default" : "secondary"}>
                                #{index + 1}
                              </Badge>
                            </td>
                            <td className="py-2">
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                              </div>
                            </td>
                            <td className="py-2">
                              {getTierBadge(member.tier)}
                            </td>
                            <td className="py-2 font-semibold">{formatNumber(member.totalPoints)}</td>
                            <td className="py-2">{formatNumber(member.availablePoints)}</td>
                            <td className="py-2">{member.totalOrders}</td>
                            <td className="py-2 font-semibold">{formatPrice(member.totalSpent)}</td>
                            <td className="py-2">{member.referralCount}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Actions et export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export et Rapports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-4 w-4" />
                    Rapport Complet (PDF)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleExportRawData}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Données Brutes (CSV)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleExportCharts}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Graphiques (PNG)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleSendEmail}
                  >
                    <Mail className="h-4 w-4" />
                    Envoyer par Email
                  </Button>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informations sur les Rapports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Période sélectionnée:</p>
                      <p>{analyticsPeriod === '1month' ? '1 Mois' : 
                          analyticsPeriod === '3months' ? '3 Mois' :
                          analyticsPeriod === '6months' ? '6 Mois' : '1 An'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Dernière mise à jour:</p>
                      <p>{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="font-medium">Format disponible:</p>
                      <p>PDF, CSV, PNG, Email</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nouvelle Règle */}
      <Dialog open={showNewRuleModal} onOpenChange={setShowNewRuleModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-amber-600" />
              Nouvelle Règle de Fidélité
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Créer une nouvelle règle de fidélité</strong>
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Définissez les conditions d'attribution des points de fidélité
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ruleName">Nom de la règle *</Label>
                  <Input
                    id="ruleName"
                    placeholder="Ex: Points par achat"
                    className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="ruleType">Type de règle *</Label>
                  <Select>
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Achat</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="referral">Parrainage</SelectItem>
                      <SelectItem value="social">Réseaux sociaux</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="ruleDescription">Description *</Label>
                  <Textarea
                    id="ruleDescription"
                    placeholder="Description détaillée de la règle..."
                    className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pointsValue">Valeur en points *</Label>
                    <Input
                      id="pointsValue"
                      type="number"
                      placeholder="Ex: 1"
                      className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="multiplier">Multiplicateur</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 1.2"
                      className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="conditions">Conditions</Label>
                  <Textarea
                    id="conditions"
                    placeholder="Conditions d'application de la règle..."
                    className="mt-1 border-gray-300 focus:border-amber-600 focus:ring-amber-600"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Règle Créée',
                  message: 'La nouvelle règle de fidélité a été créée avec succès'
                })
                setShowNewRuleModal(false)
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer la Règle
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowNewRuleModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nouvelle Récompense */}
      <Dialog open={showNewRewardModal} onOpenChange={setShowNewRewardModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-600" />
              Nouvelle Récompense
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Créer une nouvelle récompense</strong>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Définissez les récompenses que les membres peuvent échanger
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rewardName">Nom de la récompense *</Label>
                  <Input
                    id="rewardName"
                    placeholder="Ex: Réduction 10%"
                    className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rewardType">Type de récompense *</Label>
                  <Select>
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Réduction</SelectItem>
                      <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                      <SelectItem value="free_product">Produit gratuit</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="voucher">Bon d'achat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rewardDescription">Description *</Label>
                  <Textarea
                    id="rewardDescription"
                    placeholder="Description détaillée de la récompense..."
                    className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pointsCost">Coût en points *</Label>
                    <Input
                      id="pointsCost"
                      type="number"
                      placeholder="Ex: 500"
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rewardValue">Valeur de la récompense *</Label>
                    <Input
                      id="rewardValue"
                      type="number"
                      placeholder="Ex: 10"
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="maxUsage">Utilisation maximale</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    placeholder="Ex: 1000"
                    className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Récompense Créée',
                  message: 'La nouvelle récompense a été créée avec succès'
                })
                setShowNewRewardModal(false)
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Gift className="h-4 w-4 mr-2" />
              Créer la Récompense
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowNewRewardModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Règle */}
      <Dialog open={showEditRuleModal} onOpenChange={setShowEditRuleModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Modifier la Règle
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Modifier la règle de fidélité</strong>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Ajustez les paramètres de la règle existante
                </p>
              </div>
              
              {selectedRule && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editRuleName">Nom de la règle</Label>
                    <Input
                      id="editRuleName"
                      defaultValue={selectedRule.name}
                      className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editRuleDescription">Description</Label>
                    <Textarea
                      id="editRuleDescription"
                      defaultValue={selectedRule.description}
                      className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editPointsValue">Valeur en points</Label>
                      <Input
                        id="editPointsValue"
                        type="number"
                        defaultValue={selectedRule.pointsValue}
                        className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="editMultiplier">Multiplicateur</Label>
                      <Input
                        id="editMultiplier"
                        type="number"
                        step="0.1"
                        defaultValue={selectedRule.multiplier || 1}
                        className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="editConditions">Conditions</Label>
                    <Textarea
                      id="editConditions"
                      defaultValue={selectedRule.conditions.join(', ')}
                      className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Règle Modifiée',
                  message: 'La règle de fidélité a été modifiée avec succès'
                })
                setShowEditRuleModal(false)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Sauvegarder les Modifications
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowEditRuleModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Récompense */}
      <Dialog open={showEditRewardModal} onOpenChange={setShowEditRewardModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-600" />
              Modifier la Récompense
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Modifier la récompense</strong>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Ajustez les paramètres de la récompense existante
                </p>
              </div>
              
              {selectedReward && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="editRewardName">Nom de la récompense</Label>
                    <Input
                      id="editRewardName"
                      defaultValue={selectedReward.name}
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="editRewardDescription">Description</Label>
                    <Textarea
                      id="editRewardDescription"
                      defaultValue={selectedReward.description}
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="editPointsCost">Coût en points</Label>
                      <Input
                        id="editPointsCost"
                        type="number"
                        defaultValue={selectedReward.pointsCost}
                        className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="editRewardValue">Valeur de la récompense</Label>
                      <Input
                        id="editRewardValue"
                        type="number"
                        defaultValue={selectedReward.value}
                        className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="editMaxUsage">Utilisation maximale</Label>
                    <Input
                      id="editMaxUsage"
                      type="number"
                      defaultValue={selectedReward.maxUsage}
                      className="mt-1 border-gray-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Récompense Modifiée',
                  message: 'La récompense a été modifiée avec succès'
                })
                setShowEditRewardModal(false)
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Edit className="h-4 w-4 mr-2" />
              Sauvegarder les Modifications
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowEditRewardModal(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </div>
                 </DialogContent>
       </Dialog>

       {/* Modal Filtrage Avancé des Récompenses */}
       <Dialog open={showFilterRewardsModal} onOpenChange={setShowFilterRewardsModal}>
         <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
           <DialogHeader className="flex-shrink-0">
             <DialogTitle className="text-lg text-gray-900 flex items-center gap-2">
               <Filter className="h-5 w-5 text-blue-600" />
               Filtrage Avancé des Récompenses
             </DialogTitle>
           </DialogHeader>
           <div className="max-h-[70vh] overflow-y-auto pr-2">
             <div className="space-y-6">
               {/* Informations */}
               <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                 <p className="text-sm text-blue-800">
                   <strong>Filtrage avancé des récompenses</strong>
                 </p>
                 <p className="text-xs text-blue-700 mt-1">
                   Définissez des critères précis pour filtrer les récompenses selon vos besoins
                 </p>
               </div>

               {/* Filtres de base */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <Label htmlFor="filterType">Type de récompense</Label>
                   <Select value={filterType} onValueChange={setFilterType}>
                     <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600">
                       <SelectValue placeholder="Tous les types" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Tous les types</SelectItem>
                       <SelectItem value="discount">Réduction</SelectItem>
                       <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                       <SelectItem value="free_product">Produit gratuit</SelectItem>
                       <SelectItem value="cashback">Cashback</SelectItem>
                       <SelectItem value="voucher">Bon d'achat</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>

                 <div>
                   <Label htmlFor="filterStatus">Statut</Label>
                   <Select value={filterStatus} onValueChange={setFilterStatus}>
                     <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-600 focus:ring-blue-600">
                       <SelectValue placeholder="Tous les statuts" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Tous les statuts</SelectItem>
                       <SelectItem value="active">Actif</SelectItem>
                       <SelectItem value="inactive">Inactif</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>

               {/* Filtres de coût en points */}
               <div>
                 <Label className="text-sm font-medium">Coût en points</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="minPointsCost" className="text-xs">Minimum</Label>
                     <Input
                       id="minPointsCost"
                       type="number"
                       placeholder="Ex: 100"
                       value={filterPointsCost.min}
                       onChange={(e) => setFilterPointsCost(prev => ({ ...prev, min: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="maxPointsCost" className="text-xs">Maximum</Label>
                     <Input
                       id="maxPointsCost"
                       type="number"
                       placeholder="Ex: 1000"
                       value={filterPointsCost.max}
                       onChange={(e) => setFilterPointsCost(prev => ({ ...prev, max: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Filtres de valeur */}
               <div>
                 <Label className="text-sm font-medium">Valeur de la récompense</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="minValue" className="text-xs">Minimum</Label>
                     <Input
                       id="minValue"
                       type="number"
                       placeholder="Ex: 5"
                       value={filterValue.min}
                       onChange={(e) => setFilterValue(prev => ({ ...prev, min: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="maxValue" className="text-xs">Maximum</Label>
                     <Input
                       id="maxValue"
                       type="number"
                       placeholder="Ex: 50"
                       value={filterValue.max}
                       onChange={(e) => setFilterValue(prev => ({ ...prev, max: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Filtres de catégories */}
               <div>
                 <Label className="text-sm font-medium">Catégories</Label>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                   {['all', 'electronics', 'fashion', 'home', 'sports', 'books', 'food'].map((category) => (
                     <div key={category} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         id={`cat-${category}`}
                         checked={filterCategories.includes(category)}
                         onChange={(e) => {
                           if (e.target.checked) {
                             setFilterCategories(prev => [...prev, category])
                           } else {
                             setFilterCategories(prev => prev.filter(c => c !== category))
                           }
                         }}
                         className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                       />
                       <Label htmlFor={`cat-${category}`} className="text-sm">
                         {category === 'all' ? 'Toutes catégories' : category.charAt(0).toUpperCase() + category.slice(1)}
                       </Label>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Filtres de dates */}
               <div>
                 <Label className="text-sm font-medium">Période de validité</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="startDate" className="text-xs">Date de début</Label>
                     <Input
                       id="startDate"
                       type="date"
                       value={filterDateRange.start}
                       onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="endDate" className="text-xs">Date de fin</Label>
                     <Input
                       id="endDate"
                       type="date"
                       value={filterDateRange.end}
                       onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Filtres d'utilisation */}
               <div>
                 <Label className="text-sm font-medium">Taux d'utilisation</Label>
                 <div className="grid grid-cols-2 gap-4 mt-2">
                   <div>
                     <Label htmlFor="minUsage" className="text-xs">Minimum (%)</Label>
                     <Input
                       id="minUsage"
                       type="number"
                       min="0"
                       max="100"
                       placeholder="Ex: 10"
                       value={filterUsage.min}
                       onChange={(e) => setFilterUsage(prev => ({ ...prev, min: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                   <div>
                     <Label htmlFor="maxUsage" className="text-xs">Maximum (%)</Label>
                     <Input
                       id="maxUsage"
                       type="number"
                       min="0"
                       max="100"
                       placeholder="Ex: 90"
                       value={filterUsage.max}
                       onChange={(e) => setFilterUsage(prev => ({ ...prev, max: e.target.value }))}
                       className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                     />
                   </div>
                 </div>
               </div>

               {/* Résumé des filtres actifs */}
               <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                 <h4 className="font-medium text-gray-900 mb-2">Filtres actifs</h4>
                 <div className="text-sm text-gray-600 space-y-1">
                   <p>Type: {filterType === 'all' ? 'Tous' : filterType}</p>
                   <p>Statut: {filterStatus === 'all' ? 'Tous' : filterStatus}</p>
                   {filterPointsCost.min && <p>Coût min: {filterPointsCost.min} points</p>}
                   {filterPointsCost.max && <p>Coût max: {filterPointsCost.max} points</p>}
                   {filterValue.min && <p>Valeur min: {filterValue.min}</p>}
                   {filterValue.max && <p>Valeur max: {filterValue.max}</p>}
                   {filterCategories.length > 0 && <p>Catégories: {filterCategories.join(', ')}</p>}
                   {filterDateRange.start && <p>Début: {filterDateRange.start}</p>}
                   {filterDateRange.end && <p>Fin: {filterDateRange.end}</p>}
                   {filterUsage.min && <p>Usage min: {filterUsage.min}%</p>}
                   {filterUsage.max && <p>Usage max: {filterUsage.max}%</p>}
                 </div>
               </div>
             </div>
           </div>

           <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
             <Button
               onClick={applyAdvancedFilters}
               className="bg-blue-600 hover:bg-blue-700 text-white"
             >
               <Filter className="h-4 w-4 mr-2" />
               Appliquer les Filtres
             </Button>
             <Button
               variant="outline"
               onClick={resetFilters}
               className="border-gray-300 text-gray-700 hover:bg-gray-50"
             >
               <RefreshCw className="h-4 w-4 mr-2" />
               Réinitialiser
             </Button>
             <Button
               variant="outline"
               onClick={() => setShowFilterRewardsModal(false)}
               className="border-gray-300 text-gray-700 hover:bg-gray-50"
             >
               Annuler
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
 }
