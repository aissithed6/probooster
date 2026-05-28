"use client"

import { useState, useEffect } from 'react'
import { 
  Trophy, TrendingUp, TrendingDown, Target, Award, Crown, Medal, 
  BarChart3, Users, Eye, Share2, ShoppingCart, Star, Zap, 
  Calendar, Filter, Download, RefreshCw, ArrowUp, ArrowDown,
  Minus, TrendingUp2, TrendingDown2, Activity, Target as TargetIcon,
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
import RankingCharts from './ranking-charts'
import RankingNotifications from './ranking-notifications'

// Types pour la section classement
interface RankingData {
  id: string
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

interface RankingMetrics {
  totalVendors: number
  currentPosition: number
  topPosition: number
  improvement: number
  categoryPosition: number
  globalTrend: 'rising' | 'falling' | 'stable'
  nextMilestone: string
  estimatedTimeToNextRank: string
}

interface RankingFilters {
  category: string
  timeRange: string
  sortBy: string
  showOnlyCompetitors: boolean
  minRating: number
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
  
  // États pour les objectifs et recommandations
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [showObjectiveModal, setShowObjectiveModal] = useState(false)
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null)
  const [editingRecommendation, setEditingRecommendation] = useState<AIRecommendation | null>(null)

  // Initialiser les données au chargement du composant
  useEffect(() => {
    setObjectives(mockObjectives)
    setRecommendations(mockRecommendations)
  }, [])

  // Données mock pour les objectifs et milestones
  const mockObjectives: Objective[] = [
    {
      id: '1',
      title: 'Maintenir la 1ère place',
      description: 'Conserver la position de leader dans le classement global',
      target: 1,
      current: 1,
      unit: 'position',
      status: 'completed',
      priority: 'high',
      deadline: '2024-12-31',
      category: 'ranking',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      title: 'Augmenter les partages de 20%',
      description: 'Améliorer l\'engagement social pour plus de visibilité',
      target: 20,
      current: 15,
      unit: '%',
      status: 'in_progress',
      priority: 'medium',
      deadline: '2024-03-31',
      category: 'marketing',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '3',
      title: 'Atteindre 1000 vues/jour',
      description: 'Augmenter la visibilité quotidienne des produits',
      target: 1000,
      current: 600,
      unit: 'vues/jour',
      status: 'in_progress',
      priority: 'medium',
      deadline: '2024-06-30',
      category: 'visibility',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '4',
      title: 'Améliorer la note moyenne à 4.8',
      description: 'Augmenter la satisfaction client globale',
      target: 4.8,
      current: 4.5,
      unit: 'note',
      status: 'in_progress',
      priority: 'high',
      deadline: '2024-04-30',
      category: 'customer_service',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    }
  ]

  // Données mock pour les recommandations IA
  const mockRecommendations: AIRecommendation[] = [
    {
      id: '1',
      title: 'Optimiser les descriptions SEO',
      description: 'Améliorez vos chances de classement en optimisant les descriptions produits',
      category: 'seo',
      priority: 'high',
      impact: 'high',
      effort: 'medium',
      status: 'pending',
      estimatedValue: '+15% de visibilité',
      estimatedTime: '2-3 semaines',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      title: 'Augmenter les partages sociaux',
      description: 'Créez plus d\'engagement en multipliant les partages sur les réseaux sociaux',
      category: 'marketing',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      status: 'pending',
      estimatedValue: '+10% de partages',
      estimatedTime: '1-2 semaines',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '3',
      title: 'Améliorer la satisfaction client',
      description: 'Augmentez vos notes en améliorant le service client et la qualité des produits',
      category: 'customer_service',
      priority: 'high',
      impact: 'high',
      effort: 'high',
      status: 'pending',
      estimatedValue: '+20% de satisfaction',
      estimatedTime: '4-6 semaines',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: '4',
      title: 'Optimiser les prix de la catégorie Mode',
      description: 'Analysez la concurrence et ajustez vos prix pour la catégorie Mode',
      category: 'pricing',
      priority: 'medium',
      impact: 'medium',
      effort: 'low',
      status: 'pending',
      estimatedValue: '+12% de CA',
      estimatedTime: '1 semaine',
      createdAt: '2024-01-15T00:00:00Z'
    }
  ]

  // Données mock pour les classements
  const mockRankingData: RankingData[] = [
    {
      id: '1',
      vendorName: 'TechPro Solutions',
      vendorAvatar: '/avatars/techpro.jpg',
      vendorCategory: 'Électronique',
      salesVolume: 1247,
      salesRank: 1,
      sharesCount: 567,
      sharesRank: 2,
      viewsCount: 8900,
      viewsRank: 1,
      overallRank: 1,
      previousRank: 1,
      rating: 4.9,
      totalProducts: 24,
      totalRevenue: 1250000,
      trend: 'up',
      performance: 98.5,
      badges: ['Top Vendeur', 'Excellence', 'Innovation'],
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      vendorName: 'Digital World',
      vendorAvatar: '/avatars/digitalworld.jpg',
      vendorCategory: 'Électronique',
      salesVolume: 1156,
      salesRank: 2,
      sharesCount: 623,
      sharesRank: 1,
      viewsCount: 8200,
      viewsRank: 2,
      overallRank: 2,
      previousRank: 3,
      rating: 4.8,
      totalProducts: 31,
      totalRevenue: 1180000,
      trend: 'up',
      performance: 95.2,
      badges: ['Partage Leader', 'Qualité'],
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: '3',
      vendorName: 'Smart Gadgets',
      vendorAvatar: '/avatars/smartgadgets.jpg',
      vendorCategory: 'Électronique',
      salesVolume: 987,
      salesRank: 3,
      sharesCount: 445,
      sharesRank: 3,
      viewsCount: 7500,
      viewsRank: 3,
      overallRank: 3,
      previousRank: 2,
      rating: 4.7,
      totalProducts: 28,
      totalRevenue: 980000,
      trend: 'down',
      performance: 89.8,
      badges: ['Vue Leader'],
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: '4',
      vendorName: 'Innovation Hub',
      vendorAvatar: '/avatars/innovationhub.jpg',
      vendorCategory: 'Électronique',
      salesVolume: 856,
      salesRank: 4,
      sharesCount: 389,
      sharesRank: 4,
      viewsCount: 6800,
      viewsRank: 4,
      overallRank: 4,
      previousRank: 5,
      rating: 4.6,
      totalProducts: 22,
      totalRevenue: 850000,
      trend: 'up',
      performance: 82.3,
      badges: ['Émergent'],
      lastUpdated: '2024-01-15T10:30:00Z'
    },
    {
      id: '5',
      vendorName: 'Future Tech',
      vendorAvatar: '/avatars/futuretech.jpg',
      vendorCategory: 'Électronique',
      salesVolume: 789,
      salesRank: 5,
      sharesCount: 312,
      sharesRank: 5,
      viewsCount: 6200,
      viewsRank: 5,
      overallRank: 5,
      previousRank: 4,
      rating: 4.5,
      totalProducts: 19,
      totalRevenue: 780000,
      trend: 'down',
      performance: 76.8,
      badges: ['Stable'],
      lastUpdated: '2024-01-15T10:30:00Z'
    }
  ]

  const mockMetrics: RankingMetrics = {
    totalVendors: 156,
    currentPosition: 1,
    topPosition: 1,
    improvement: 0,
    categoryPosition: 1,
    globalTrend: 'rising',
    nextMilestone: 'Maintenir la 1ère place',
    estimatedTimeToNextRank: 'Maintenu'
  }

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
    setIsLoading(true)
    
    // Simuler un refresh avec notifications
    setTimeout(() => {
      setIsLoading(false)
      
      // Simuler la récupération de nouvelles données
      const newData = mockRankingData.map(vendor => ({
        ...vendor,
        lastUpdated: new Date().toISOString()
      }))
      
      // Mettre à jour les données
      // setRankingData(newData) // En production, ceci mettrait à jour l'état global
      
      addNotification({ 
  type: 'success', 
  title: 'Données actualisées', 
  message: 'Le classement a été mis à jour avec les dernières données' 
})
    }, 1500)
  }

  const handleExport = (type: string) => {
    setIsLoading(true)
    
    // Simuler l'export avec différents formats
    setTimeout(() => {
      setIsLoading(false)
      
      let exportData = ''
      let fileName = ''
      
      switch (type) {
        case 'csv':
          exportData = generateCSVExport()
          fileName = `classement_vendeurs_${new Date().toISOString().split('T')[0]}.csv`
          break
        case 'excel':
          exportData = generateExcelExport()
          fileName = `classement_vendeurs_${new Date().toISOString().split('T')[0]}.xlsx`
          break
        case 'pdf':
          exportData = generatePDFExport()
          fileName = `classement_vendeurs_${new Date().toISOString().split('T')[0]}.pdf`
          break
        default:
          exportData = generateCSVExport()
          fileName = `classement_vendeurs_${new Date().toISOString().split('T')[0]}.csv`
      }
      
      // Simuler le téléchargement
      downloadFile(exportData, fileName, type)
      
      addNotification({ 
  type: 'success', 
  title: 'Export réussi', 
  message: 'Le classement a été exporté en ${type.toUpperCase()} et téléchargé' 
})
    }, 2000)
  }
  
  // Fonction pour générer l'export CSV
  const generateCSVExport = () => {
    const headers = ['Position', 'Vendeur', 'Catégorie', 'Ventes', 'Partages', 'Vues', 'Note', 'Performance', 'Tendance']
    const rows = filteredRankings.map((vendor, index) => [
      index + 1,
      vendor.vendorName,
      vendor.vendorCategory,
      vendor.salesVolume,
      vendor.sharesCount,
      vendor.viewsCount,
      vendor.rating,
      `${vendor.performance}%`,
      vendor.trend
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }
  
  // Fonction pour générer l'export Excel (simulation)
  const generateExcelExport = () => {
    // En production, utiliser une vraie bibliothèque comme xlsx
    return generateCSVExport() // Pour l'instant, retourner CSV
  }
  
  // Fonction pour générer l'export PDF (simulation)
  const generatePDFExport = () => {
    // En production, utiliser une vraie bibliothèque comme jsPDF
    return generateCSVExport() // Pour l'instant, retourner CSV
  }
  
  // Fonction pour télécharger le fichier
  const downloadFile = (content: string, fileName: string, type: string) => {
    const blob = new Blob([content], { 
      type: type === 'csv' ? 'text/csv' : 
            type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
            'application/pdf'
    })
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const filteredRankings = mockRankingData.filter(vendor => {
    if (selectedCategory !== 'all' && vendor.vendorCategory !== selectedCategory) return false
    if (showCompetitors && vendor.id === '1') return false
    if (vendor.rating < minRating) return false
    return true
  }).sort((a, b) => {
    switch (sortBy) {
      case 'sales':
        return b.salesVolume - a.salesVolume
      case 'shares':
        return b.sharesCount - a.sharesCount
      case 'views':
        return b.viewsCount - a.viewsCount
      case 'rating':
        return b.rating - a.rating
      case 'performance':
        return b.performance - a.performance
      default:
        return a.overallRank - b.overallRank
    }
  })
  
  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    setSelectedCategory('all')
    setTimeRange('month')
    setSortBy('overall')
    setShowCompetitors(false)
    setMinRating(0)
    
    addNotification({ 
  type: 'info', 
  title: 'Filtres réinitialisés', 
  message: 'Tous les filtres ont été remis à zéro' 
})
  }
  
  // Fonction pour appliquer des filtres avancés
  const handleApplyAdvancedFilters = () => {
    const activeFilters = []
    if (selectedCategory !== 'all') activeFilters.push(`Catégorie: ${selectedCategory}`)
    if (timeRange !== 'month') activeFilters.push(`Période: ${timeRange}`)
    if (sortBy !== 'overall') activeFilters.push(`Tri: ${sortBy}`)
    if (showCompetitors) activeFilters.push('Concurrents visibles')
    if (minRating > 0) activeFilters.push(`Note min: ${minRating}`)
    
    addNotification({
      type: 'success',
      title: 'Filtres appliqués',
      message: `Filtres actifs: ${activeFilters.join(', ')}`
    })
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
    if (editingObjective) {
      // Modifier un objectif existant
      setObjectives(prev => prev.map(obj => obj.id === objective.id ? objective : obj))
      addNotification({
        type: 'success',
        title: 'Objectif modifié',
        message: `L'objectif "${objective.title}" a été modifié avec succès`
      })
    } else {
      // Ajouter un nouvel objectif
      const newObjective = {
        ...objective,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setObjectives(prev => [...prev, newObjective])
      addNotification({
        type: 'success',
        title: 'Nouvel objectif créé',
        message: `L'objectif "${objective.title}" a été créé avec succès`
      })
    }
    setShowObjectiveModal(false)
    setEditingObjective(null)
  }
  
  const handleDeleteObjective = (id: string) => {
    const objective = objectives.find(obj => obj.id === id)
    if (objective) {
      setObjectives(prev => prev.filter(obj => obj.id !== id))
      addNotification({
        type: 'success',
        title: 'Objectif supprimé',
        message: `L'objectif "${objective.title}" a été supprimé`
      })
    }
  }
  
  const handleUpdateObjectiveProgress = (id: string, newProgress: number) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id === id) {
        const updated = { ...obj, current: newProgress, updatedAt: new Date().toISOString() }
        // Mettre à jour le statut automatiquement
        if (newProgress >= obj.target) {
          updated.status = 'completed'
        } else if (newProgress > 0) {
          updated.status = 'in_progress'
        } else {
          updated.status = 'not_started'
        }
        return updated
      }
      return obj
    }))
    
    const objective = objectives.find(obj => obj.id === id)
    if (objective) {
      addNotification({
        type: 'success',
        title: 'Progrès mis à jour',
        message: `Le progrès de "${objective.title}" a été mis à jour à ${newProgress} ${objective.unit}`
      })
    }
  }
  
  // Fonctions pour les recommandations IA
  const handleGenerateNewRecommendations = () => {
    setIsLoading(true)
    
    // Simuler la génération de nouvelles recommandations IA
    setTimeout(() => {
      const newRecommendations: AIRecommendation[] = [
        {
          id: Date.now().toString(),
          title: 'Optimiser les images produits',
          description: 'Compressez et optimisez vos images pour améliorer le temps de chargement',
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
          id: (Date.now() + 1).toString(),
          title: 'Lancer des campagnes saisonnières',
          description: 'Préparez des campagnes marketing pour les périodes de forte demande',
          category: 'marketing',
          priority: 'high',
          impact: 'high',
          effort: 'medium',
          status: 'pending',
          estimatedValue: '+25% de ventes',
          estimatedTime: '3-4 semaines',
          createdAt: new Date().toISOString()
        }
      ]
      
      setRecommendations(prev => [...prev, ...newRecommendations])
      setIsLoading(false)
      
      addNotification({ 
  type: 'success', 
  title: 'Nouvelles recommandations générées', 
  message: '${newRecommendations.length} nouvelles recommandations IA ont été créées pour améliorer votre classement' 
})
    }, 3000)
  }
  
  const handleSaveRecommendations = () => {
    // Sauvegarder dans localStorage
    localStorage.setItem('aiRecommendations', JSON.stringify(recommendations))
    
    addNotification({ 
  type: 'success', 
  title: 'Recommandations sauvegardées', 
  message: '${recommendations.length} recommandations IA ont été sauvegardées pour référence future' 
})
  }
  
  const handleApplyRecommendation = (id: string) => {
    const recommendation = recommendations.find(rec => rec.id === id)
    if (recommendation) {
      setRecommendations(prev => prev.map(rec => 
        rec.id === id ? { ...rec, status: 'applied', appliedAt: new Date().toISOString() } : rec
      ))
      
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
      setRecommendations(prev => prev.map(rec => 
        rec.id === id ? { ...rec, status: 'dismissed', dismissedAt: new Date().toISOString() } : rec
      ))
      
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
      setRecommendations(prev => prev.map(rec => 
        rec.id === id ? { ...rec, status: 'completed' } : rec
      ))
      
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
            <div className="text-3xl font-bold text-yellow-800 mb-2">
              #{mockMetrics.currentPosition}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-yellow-600">Sur {mockMetrics.totalVendors} vendeurs</span>
            </div>
            <Progress value={100 - (mockMetrics.currentPosition / mockMetrics.totalVendors) * 100} className="mt-3 bg-yellow-100" />
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
              #{mockMetrics.categoryPosition}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-blue-600">Électronique</span>
            </div>
            <Progress value={100 - (mockMetrics.categoryPosition / 25) * 100} className="mt-3 bg-blue-100" />
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
            <div className="text-3xl font-bold text-green-800 mb-2">
              {mockRankingData[0].performance}%
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-green-600">Excellente</span>
            </div>
            <Progress value={mockRankingData[0].performance} className="mt-3 bg-green-100" />
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
            <div className="text-3xl font-bold text-purple-800 mb-2">
              {mockMetrics.globalTrend === 'rising' ? '↗️' : mockMetrics.globalTrend === 'falling' ? '↘️' : '→'}
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-purple-600 capitalize">{mockMetrics.globalTrend}</span>
            </div>
            <div className="text-xs text-purple-500 mt-2">
              {mockMetrics.nextMilestone}
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
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
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
              <div className="space-y-4">
                {filteredRankings.slice(0, 10).map((vendor, index) => (
                  <div
                    key={vendor.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-lg ${
                      vendor.id === '1' 
                        ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-lg">
                        {getRankBadge(vendor.overallRank)}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={vendor.vendorAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {vendor.vendorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{vendor.vendorName}</h3>
                            {vendor.id === '1' && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                Vous
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{vendor.vendorCategory}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {vendor.badges.map((badge, badgeIndex) => (
                              <Badge key={badgeIndex} variant="outline" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{vendor.salesVolume}</div>
                        <div className="text-sm text-gray-500">Ventes</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{vendor.sharesCount}</div>
                        <div className="text-sm text-gray-500">Partages</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{vendor.viewsCount}</div>
                        <div className="text-sm text-gray-500">Vues</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{vendor.rating}</div>
                        <div className="text-sm text-gray-500">Note</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getPerformanceColor(vendor.performance)}`}>
                          {vendor.performance}%
                        </div>
                        <div className="text-sm text-gray-500">Performance</div>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-1">
                        <Badge className={`${getTrendColor(vendor.trend)}`}>
                          {getTrendIcon(vendor.trend)}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          {vendor.trend === 'up' ? '+2' : vendor.trend === 'down' ? '-1' : '0'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {filteredRankings
                  .sort((a, b) => b.salesVolume - a.salesVolume)
                  .slice(0, 10)
                  .map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={vendor.vendorAvatar} />
                            <AvatarFallback className="bg-green-500 text-white">
                              {vendor.vendorName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{vendor.vendorName}</h3>
                            <p className="text-sm text-gray-500">{vendor.vendorCategory}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">{vendor.salesVolume}</div>
                          <div className="text-sm text-gray-500">Ventes</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(vendor.totalRevenue)}
                          </div>
                          <div className="text-sm text-gray-500">CA</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{vendor.totalProducts}</div>
                          <div className="text-sm text-gray-500">Produits</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
              <div className="space-y-4">
                {filteredRankings
                  .sort((a, b) => b.sharesCount - a.sharesCount)
                  .slice(0, 10)
                  .map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={vendor.vendorAvatar} />
                            <AvatarFallback className="bg-blue-500 text-white">
                              {vendor.vendorName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{vendor.vendorName}</h3>
                            <p className="text-sm text-gray-500">{vendor.vendorCategory}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">{vendor.sharesCount}</div>
                          <div className="text-sm text-gray-500">Partages</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{vendor.viewsCount}</div>
                          <div className="text-sm text-gray-500">Vues</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{vendor.rating}</div>
                          <div className="text-sm text-gray-500">Note</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
              <div className="space-y-4">
                {filteredRankings
                  .sort((a, b) => b.viewsCount - a.viewsCount)
                  .slice(0, 10)
                  .map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={vendor.vendorAvatar} />
                            <AvatarFallback className="bg-purple-500 text-white">
                              {vendor.vendorName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">{vendor.vendorName}</h3>
                            <p className="text-sm text-gray-500">{vendor.vendorCategory}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">{vendor.viewsCount}</div>
                          <div className="text-sm text-gray-500">Vues</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{vendor.sharesCount}</div>
                          <div className="text-sm text-gray-500">Partages</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">{vendor.rating}</div>
                          <div className="text-sm text-gray-500">Note</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
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
                      <span>{Math.round((objective.current / objective.target) * 100)}%</span>
              </div>
                    <Progress 
                      value={(objective.current / objective.target) * 100} 
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
              <span>Recommandations IA</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateNewRecommendations()}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Générer
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
                  <Select defaultValue={editingObjective?.priority || 'medium'}>
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
                  const priority = (document.querySelector('select')?.value as 'low' | 'medium' | 'high') || 'medium'
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
