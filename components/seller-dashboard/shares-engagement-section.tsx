
"use client"

import { useState } from 'react'
import { useMoney } from '@/lib/hooks/use-money'
import { 
  Share2, TrendingUp, Users, Eye, BarChart3, Download, Filter,
  Search, Heart, Star, Target, Award, Zap, DollarSign,
  ArrowUp, ArrowDown, Minus, Crown, Medal, Trophy,
  Globe, Package, CheckCircle, Rocket, TrendingDown,
  Copy, Mail, FileText, BarChart3 as BarChart3Icon, Settings, RefreshCw, User, AlertTriangle
} from 'lucide-react'

// Icônes officielles des réseaux sociaux
import { FaWhatsapp, FaFacebook, FaXTwitter } from 'react-icons/fa6'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

// Import du système de notifications modernes
import { useNotifications, NotificationContainer } from '@/components/ui/modern-notification'

export default function SharesEngagementSection() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [showViralStrategyModal, setShowViralStrategyModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv')
  const [showOptimizationModal, setShowOptimizationModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sortBy, setSortBy] = useState<'shares' | 'views' | 'engagement' | 'revenue' | 'viralScore'>('shares')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  // Hook de notifications modernes
  const { addNotification } = useNotifications()

  // Données mock complètes pour la section partages et engagement
  const mockData = {
    totalShares: 567,
    totalViews: 12450,
    totalEngagement: 2340,
    totalRevenue: 1250000,
    viralCoefficient: 7.8,
    averageReach: 850,
    
    // Classement des produits par nombre de partages
    productsByShares: [
      {
        id: 1,
        name: "Smartphone Galaxy S24",
        image: "/placeholder.jpg",
        shares: 67,
        views: 1450,
        engagement: 289,
        revenue: 180000,
        viralScore: 8.5,
        category: "Électronique",
        trending: 'up' as const,
        lastShareDate: "2024-01-20",
        usersWhoShared: [
          { id: '1', name: 'Kouassi Jean', points: 45, avatar: '/placeholder.jpg' },
          { id: '2', name: 'Traoré Fatou', points: 38, avatar: '/placeholder.jpg' },
          { id: '3', name: 'Koné Moussa', points: 32, avatar: '/placeholder.jpg' }
        ]
      },
      {
        id: 2,
        name: "Casque Bluetooth Pro",
        image: "/placeholder.jpg",
        shares: 45,
        views: 890,
        engagement: 156,
        revenue: 95000,
        viralScore: 7.2,
        category: "Audio",
        trending: 'up' as const,
        lastShareDate: "2024-01-19",
        usersWhoShared: [
          { id: '1', name: 'Kouassi Jean', points: 45, avatar: '/placeholder.jpg' },
          { id: '4', name: 'Diallo Aminata', points: 28, avatar: '/placeholder.jpg' }
        ]
      },
      {
        id: 3,
        name: "Montre Connectée Sport",
        image: "/placeholder.jpg",
        shares: 38,
        views: 720,
        engagement: 134,
        revenue: 78000,
        viralScore: 6.8,
        category: "Électronique",
        trending: 'stable' as const,
        lastShareDate: "2024-01-18",
        usersWhoShared: [
          { id: '2', name: 'Traoré Fatou', points: 38, avatar: '/placeholder.jpg' },
          { id: '5', name: 'Ouattara Issouf', points: 25, avatar: '/placeholder.jpg' }
        ]
      }
    ],
    
    // Statistiques par réseau social
    socialNetworkStats: [
      {
        platform: 'Facebook',
        shares: 234,
        views: 5200,
        engagement: 890,
        revenue: 450000,
        growth: 15,
        topUsers: [
          { name: 'Kouassi Jean', shares: 23, points: 230 },
          { name: 'Traoré Fatou', shares: 18, points: 180 }
        ]
      },
      {
        platform: 'Instagram',
        shares: 189,
        views: 4100,
        engagement: 720,
        revenue: 380000,
        growth: 22,
        topUsers: [
          { name: 'Koné Moussa', shares: 19, points: 190 },
          { name: 'Diallo Aminata', shares: 15, points: 150 }
        ]
      },
      {
        platform: 'Twitter',
        shares: 144,
        views: 3150,
        engagement: 730,
        revenue: 420000,
        growth: 8,
        topUsers: [
          { name: 'Ouattara Issouf', shares: 16, points: 160 },
          { name: 'Kouassi Jean', shares: 14, points: 140 }
        ]
      }
    ],
    
    // Top utilisateurs par engagement
    topUsers: [
      {
        id: '1',
        name: 'Kouassi Jean',
        avatar: '/placeholder.jpg',
        totalShares: 45,
        totalViews: 890,
        totalEngagement: 234,
        totalRevenue: 125000,
        pointsEarned: 450,
        rank: 1,
        badge: 'Champion',
        favoriteProducts: ['Smartphone Galaxy S24', 'Casque Bluetooth Pro'],
        socialInfluence: 95
      },
      {
        id: '2',
        name: 'Traoré Fatou',
        avatar: '/placeholder.jpg',
        totalShares: 38,
        totalViews: 720,
        totalEngagement: 189,
        totalRevenue: 98000,
        pointsEarned: 380,
        rank: 2,
        badge: 'Influenceur',
        favoriteProducts: ['Montre Connectée Sport'],
        socialInfluence: 87
      },
      {
        id: '3',
        name: 'Koné Moussa',
        avatar: '/placeholder.jpg',
        totalShares: 32,
        totalViews: 650,
        totalEngagement: 156,
        totalRevenue: 87000,
        pointsEarned: 320,
        rank: 3,
        badge: 'Actif',
        favoriteProducts: ['Smartphone Galaxy S24'],
        socialInfluence: 79
      }
    ]
  }

  const { formatMoney: formatCurrency } = useMoney()

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPoints = (points: number) => {
    return `${points.toLocaleString()} points`
  }

  const getViralScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getViralScoreIcon = (score: number) => {
    if (score >= 8) return <Zap className="w-4 h-4 text-green-600" />
    if (score >= 6) return <TrendingUp className="w-4 h-4 text-yellow-600" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const getTrendingIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />
      default: return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank <= 3) return <Medal className="w-5 h-5 text-orange-500" />
    if (rank <= 10) return <Trophy className="w-5 h-5 text-blue-500" />
    return <Star className="w-4 h-4 text-gray-500" />
  }

  const getPlatformIcon = (iconName: string) => {
    switch (iconName) {
      case 'Facebook':
        return <FaFacebook className="w-5 h-5 text-blue-600" />
      case 'Instagram':
        return <Globe className="w-5 h-5 text-pink-600" />
      case 'Twitter':
        return <FaXTwitter className="w-5 h-5 text-blue-400" />
      default:
        return <Globe className="w-5 h-5 text-gray-600" />
    }
  }

  // Filtres et recherche
  const filteredProducts = mockData.productsByShares.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = mockData.topUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fonctions pour les fonctionnalités des boutons
  const handleExportData = (format: 'csv' | 'pdf' | 'excel') => {
    setExportFormat(format)
    setShowExportModal(true)
  }

  const executeExport = () => {
    addNotification({ 
  type: 'info', 
  title: 'Export en cours', 
  message: 'Export des données en ${exportFormat.toUpperCase()} en cours...' 
})

    // Simulation de l'export
    setTimeout(() => {
      addNotification({ 
  type: 'success', 
  title: 'Export réussi', 
  message: 'Données exportées en ${exportFormat.toUpperCase()} avec succès !' 
})
      setShowExportModal(false)
    }, 2000)
  }

  const handleRefreshData = async () => {
    setIsRefreshing(true)
    addNotification({ 
  type: 'info', 
  title: 'Actualisation', 
  message: 'Actualisation des données en cours...' 
})

    // Simulation de l'actualisation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsRefreshing(false)
    addNotification({ 
  type: 'success', 
  title: 'Actualisation réussie', 
  message: 'Toutes les données ont été actualisées !' 
})
  }

  const handleViralStrategyOptimization = (product: any) => {
    setSelectedProduct(product)
    setShowViralStrategyModal(true)
  }

  const handleOptimizeViralStrategy = () => {
    if (!selectedProduct) return

    addNotification({ 
  type: 'info', 
  title: 'Optimisation en cours', 
  message: 'Optimisation de la stratégie virale pour ${selectedProduct.name}...' 
})

    // Simulation de l'optimisation
    setTimeout(() => {
      addNotification({ 
  type: 'success', 
  title: 'Optimisation réussie', 
  message: 'Stratégie virale optimisée pour ${selectedProduct.name} !' 
})
      setShowViralStrategyModal(false)
    }, 2000)
  }

  const handleBoostProduct = (product: { id: number; name: string; category: string; shares: number; views: number; engagement: number; revenue: number; viralScore: number }) => {
    addNotification({ 
  type: 'info', 
  title: 'Boost en cours', 
  message: 'Boost du produit ${product.name} en cours...' 
})

    // Simulation du boost
    setTimeout(() => {
      addNotification({ 
  type: 'success', 
  title: 'Boost réussi', 
  message: 'Le produit ${product.name} a été boosté avec succès !' 
})
    }, 1500)
  }

  const handleShareData = (platform: string, data: any) => {
    const shareText = `📊 Données de partages et engagement Probooster\n📈 ${data.title}\n💰 Revenus: ${formatCurrency(data.revenue)}\n📱 Partages: ${formatNumber(data.shares)}\n\n⚠️ Note: Les partages des statistiques ne sont pas récompensés en points.`
    
    let shareLink = ''
    let platformName = ''
    
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`
        platformName = 'WhatsApp'
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`
        platformName = 'Facebook'
        break
      case 'x':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&hashtags=Probooster,Analytics`
        platformName = 'X (Twitter)'
        break
      case 'copy':
        navigator.clipboard.writeText(shareText).then(() => {
          addNotification({ 
  type: 'success', 
  title: 'Copié !', 
  message: 'Données copiées dans le presse-papiers' 
})
        }).catch(() => {
          addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de copier dans le presse-papiers' 
})
        })
        return
      case 'link':
        const linkText = `${window.location.href} - ${data.title}`
        navigator.clipboard.writeText(linkText).then(() => {
          addNotification({ 
  type: 'success', 
  title: 'Lien copié !', 
  message: 'Lien copié dans le presse-papiers' 
})
        }).catch(() => {
          addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de copier le lien' 
})
        })
        return
    }
    
    if (shareLink) {
      addNotification({ 
  type: 'info', 
  title: 'Partage', 
  message: 'Ouverture de ${platformName}...' 
})
      
      const newWindow = window.open(shareLink, '_blank', 'width=600,height=400')
      if (newWindow) {
        setTimeout(() => {
          addNotification({ 
  type: 'success', 
  title: 'Partagé !', 
  message: 'Données partagées sur ${platformName}' 
})
        }, 1000)
      }
    }
  }

  const handleViewUserDetails = (user: any) => {
    setSelectedUser(user)
    addNotification({ 
  type: 'info', 
  title: 'Détails utilisateur', 
  message: 'Affichage des détails de ${user.name}' 
})
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addNotification({ 
  type: 'success', 
  title: 'Copié !', 
  message: '${label} copié dans le presse-papiers' 
})
    }).catch(() => {
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de copier ${label}' 
})
    })
  }

  // Fonctions de tri et filtrage
  const handleSort = (field: 'shares' | 'views' | 'engagement' | 'revenue' | 'viralScore') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
    
    addNotification({
      type: 'info',
      title: 'Tri appliqué',
      message: `Trié par ${field} (${sortOrder === 'asc' ? 'croissant' : 'décroissant'})`
    })
  }

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category)
    addNotification({
      type: 'info',
      title: 'Filtre appliqué',
      message: `Catégorie sélectionnée : ${category === 'all' ? 'Toutes' : category}`
    })
  }

  const handleDateRangeChange = (range: '7d' | '30d' | '90d' | '1y') => {
    setDateRange(range)
    addNotification({
      type: 'info',
      title: 'Période changée',
      message: `Période sélectionnée : ${range === '7d' ? '7 jours' : range === '30d' ? '30 jours' : range === '90d' ? '90 jours' : '1 an'}`
    })
  }

  // Données filtrées et triées
  const getFilteredAndSortedProducts = () => {
    let filtered = mockData.productsByShares
    
    // Filtrage par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    // Tri
    filtered.sort((a, b) => {
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }

  const getFilteredAndSortedUsers = () => {
    let filtered = mockData.topUsers
    
    // Tri
    filtered.sort((a, b) => {
      let aValue: number
      let bValue: number
      
      switch (sortBy) {
        case 'shares':
          aValue = a.totalShares
          bValue = b.totalShares
          break
        case 'views':
          aValue = a.totalViews
          bValue = b.totalViews
          break
        case 'engagement':
          aValue = a.totalEngagement
          bValue = b.totalEngagement
          break
        case 'revenue':
          aValue = a.totalRevenue
          bValue = b.totalRevenue
          break
        case 'viralScore':
          aValue = a.socialInfluence
          bValue = b.socialInfluence
          break
        default:
          aValue = a.totalShares
          bValue = b.totalShares
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{color: '#535455'}}>
            Partages & Engagement
          </h1>
          <p className="text-gray-600 mt-2">
            Suivi détaillé des partages et analyse de l'engagement utilisateur
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                <strong>Note importante :</strong> Les partages des statistiques et données d'analyse ne sont pas récompensés en points. 
                Seuls les partages de produits individuels génèrent des points de fidélité.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Filtres et tri */}
          <div className="flex items-center space-x-2">
            <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="Électronique">Électronique</SelectItem>
                <SelectItem value="Audio">Audio</SelectItem>
                <SelectItem value="Mode">Mode</SelectItem>
                <SelectItem value="Maison">Maison</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
                <SelectItem value="90d">90 jours</SelectItem>
                <SelectItem value="1y">1 an</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => handleSort(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shares">Partages</SelectItem>
                <SelectItem value="views">Vues</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="revenue">Revenus</SelectItem>
                <SelectItem value="viralScore">Score viral</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>

          <Button 
            onClick={handleRefreshData}
            disabled={isRefreshing}
            variant="outline"
            className="border-gray-200 hover:border-orange-300 hover:bg-orange-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                style={{backgroundColor: '#ff6600'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8533'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter Données
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem onClick={() => handleExportData('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportData('excel')}>
                <BarChart3Icon className="w-4 h-4 mr-2" />
                Export Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Barre d'état des filtres */}
      {(selectedCategory !== 'all' || sortBy !== 'shares' || sortOrder !== 'desc' || dateRange !== '30d') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className="font-medium text-blue-800">Filtres actifs :</span>
              {selectedCategory !== 'all' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Catégorie: {selectedCategory}
                </Badge>
              )}
              {sortBy !== 'shares' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Tri: {sortBy} ({sortOrder === 'asc' ? '↑' : '↓'})
                </Badge>
              )}
              {dateRange !== '30d' && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Période: {dateRange === '7d' ? '7 jours' : dateRange === '90d' ? '90 jours' : '1 an'}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('all')
                setSortBy('shares')
                setSortOrder('desc')
                setDateRange('30d')
                addNotification({ 
  type: 'info', 
  title: 'Filtres réinitialisés', 
  message: 'Tous les filtres ont été remis à zéro' 
})
              }}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Réinitialiser
            </Button>
          </div>
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center justify-between">
              <div className="flex items-center">
                <Share2 className="w-4 h-4 mr-2" />
                Total Partages
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-blue-700 hover:bg-blue-200"
                    title="Options de partage"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => handleShareData('copy', { title: 'Total Partages', revenue: mockData.totalShares, shares: mockData.totalShares })}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier les données
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('whatsapp', { title: 'Total Partages', revenue: mockData.totalShares, shares: mockData.totalShares })}>
                    <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                    Partager sur WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('facebook', { title: 'Total Partages', revenue: mockData.totalShares, shares: mockData.totalShares })}>
                    <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
                    Partager sur Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('x', { title: 'Total Partages', revenue: mockData.totalShares, shares: mockData.totalShares })}>
                    <FaXTwitter className="w-4 h-4 mr-2 text-black" />
                    Partager sur X (Twitter)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('link', { title: 'Total Partages', revenue: mockData.totalShares, shares: mockData.totalShares })}>
                    <Globe className="w-4 h-4 mr-2 text-gray-600" />
                    Copier le lien
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-900">{formatNumber(mockData.totalShares)}</div>
              <div className="text-green-600 text-sm font-medium">+12%</div>
            </div>
            <p className="text-xs text-blue-600 mt-2">Ce mois</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center justify-between">
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Vues Totales
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-green-700 hover:bg-green-200"
                    title="Options de partage"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => handleShareData('copy', { title: 'Total Vues', revenue: mockData.totalViews, shares: mockData.totalViews })}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier les données
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('whatsapp', { title: 'Total Vues', revenue: mockData.totalViews, shares: mockData.totalViews })}>
                    <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                    Partager sur WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('facebook', { title: 'Total Vues', revenue: mockData.totalViews, shares: mockData.totalViews })}>
                    <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
                    Partager sur Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('x', { title: 'Total Vues', revenue: mockData.totalViews, shares: mockData.totalViews })}>
                    <FaXTwitter className="w-4 h-4 mr-2 text-black" />
                    Partager sur X (Twitter)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('link', { title: 'Total Vues', revenue: mockData.totalViews, shares: mockData.totalViews })}>
                    <Globe className="w-4 h-4 mr-2 text-gray-600" />
                    Copier le lien
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-900">{formatNumber(mockData.totalViews)}</div>
              <div className="text-green-600 text-sm font-medium">+8%</div>
            </div>
            <p className="text-xs text-green-600 mt-2">Ce mois</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center justify-between">
              <div className="flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Engagement
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-purple-700 hover:bg-purple-200"
                    title="Options de partage"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => handleShareData('copy', { title: 'Total Engagement', revenue: mockData.totalEngagement, shares: mockData.totalEngagement })}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier les données
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('whatsapp', { title: 'Total Engagement', revenue: mockData.totalEngagement, shares: mockData.totalEngagement })}>
                    <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                    Partager sur WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('facebook', { title: 'Total Engagement', revenue: mockData.totalEngagement, shares: mockData.totalEngagement })}>
                    <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
                    Partager sur Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('x', { title: 'Total Engagement', revenue: mockData.totalEngagement, shares: mockData.totalEngagement })}>
                    <FaXTwitter className="w-4 h-4 mr-2 text-black" />
                    Partager sur X (Twitter)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('link', { title: 'Total Engagement', revenue: mockData.totalEngagement, shares: mockData.totalEngagement })}>
                    <Globe className="w-4 h-4 mr-2 text-gray-600" />
                    Copier le lien
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-900">{formatNumber(mockData.totalEngagement)}</div>
              <div className="text-green-600 text-sm font-medium">+15%</div>
            </div>
            <p className="text-xs text-purple-600 mt-2">Ce mois</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Revenus Générés
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-orange-700 hover:bg-orange-200"
                    title="Options de partage"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuItem onClick={() => handleShareData('copy', { title: 'Total Revenus', revenue: mockData.totalRevenue, shares: mockData.totalRevenue })}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier les données
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('whatsapp', { title: 'Total Revenus', revenue: mockData.totalRevenue, shares: mockData.totalRevenue })}>
                    <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
                    Partager sur WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('facebook', { title: 'Total Revenus', revenue: mockData.totalRevenue, shares: mockData.totalRevenue })}>
                    <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
                    Partager sur Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('x', { title: 'Total Revenus', revenue: mockData.totalRevenue, shares: mockData.totalRevenue })}>
                    <FaXTwitter className="w-4 h-4 mr-2 text-black" />
                    Partager sur X (Twitter)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareData('link', { title: 'Total Revenus', revenue: mockData.totalRevenue, shares: mockData.totalRevenue })}>
                    <Globe className="w-4 h-4 mr-2 text-gray-600" />
                    Copier le lien
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(mockData.totalRevenue)}</div>
              <div className="text-green-600 text-sm font-medium">+20%</div>
            </div>
            <p className="text-xs text-orange-600 mt-2">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques avancées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" style={{color: '#ff6600'}} />
              <span>Coefficient Viral</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{color: '#ff6600'}}>
                {mockData.viralCoefficient.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Partages par vue</p>
              <Progress value={(mockData.viralCoefficient / 10) * 100} className="mt-2" />
              <div className="flex items-center justify-center mt-2">
                <Zap className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-xs text-gray-600">Potentiel viral élevé</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" style={{color: '#ff6600'}} />
              <span>Portée Moyenne</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{color: '#ff6600'}}>
                {formatNumber(mockData.averageReach)}
              </div>
              <p className="text-sm text-gray-600">Vues par partage</p>
              <Progress value={(mockData.averageReach / 1000) * 100} className="mt-2" />
              <div className="flex items-center justify-center mt-2">
                <Globe className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-xs text-gray-600">Portée étendue</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" style={{color: '#ff6600'}} />
              <span>Score d'Engagement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2" style={{color: '#ff6600'}}>
                {((mockData.totalEngagement / mockData.totalViews) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Taux d'engagement</p>
              <Progress value={(mockData.totalEngagement / mockData.totalViews) * 100} className="mt-2" />
              <div className="flex items-center justify-center mt-2">
                <Heart className="w-4 h-4 text-red-500 mr-1" />
                <span className="text-xs text-gray-600">Engagement élevé</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation des onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Package className="w-4 h-4 mr-2" />
            Par Produit
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="platforms" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Globe className="w-4 h-4 mr-2" />
            Plateformes
          </TabsTrigger>
          <TabsTrigger value="viral" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Zap className="w-4 h-4 mr-2" />
            Analyse Virale
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top performeurs avec classement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Crown className="w-5 h-5 mr-2" style={{color: '#ff6600'}} />
                  Top Performeurs
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" style={{backgroundColor: '#ff6600'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8533'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}>
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    <DropdownMenuItem onClick={() => handleExportData('csv')}>
                      <FileText className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportData('excel')}>
                      <BarChart3Icon className="w-4 h-4 mr-2" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                      <FileText className="w-4 h-4 mr-2" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
              <CardDescription>Utilisateurs avec le meilleur engagement et partages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.topUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        {getRankBadge(user.rank)}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.favoriteProducts.length} produits partagés</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {user.badge}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatPoints(user.pointsEarned)} gagnés
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">{formatNumber(user.totalShares)}</p>
                          <p className="text-gray-500">Partages</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatNumber(user.totalViews)}</p>
                          <p className="text-gray-500">Vues</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatNumber(user.totalEngagement)}</p>
                          <p className="text-gray-500">Engagement</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(user.totalRevenue)}</p>
                          <p className="text-gray-500">Revenus</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Graphique d'évolution avec métriques avancées */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Partages et Engagement</CardTitle>
              <CardDescription>Progression sur les 30 derniers jours avec analyse virale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Graphique d'évolution des partages et engagement</p>
                  <p className="text-sm text-gray-400 mt-2">Intégration avec Chart.js ou Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Par Produit */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Classement des Produits par Partages</span>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuItem onClick={() => handleExportData('csv')}>
                        <FileText className="w-4 h-4 mr-2" />
                        CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportData('excel')}>
                        <BarChart3Icon className="w-4 h-4 mr-2" />
                        Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredAndSortedProducts().map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-medium text-lg">{product.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                            {getTrendingIcon(product.trending)}
                            <span className="text-xs text-gray-500">
                              {new Date(product.lastShareDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            {getViralScoreIcon(product.viralScore)}
                            <span className={`text-sm font-medium ${getViralScoreColor(product.viralScore)}`}>
                              Score viral: {product.viralScore}/10
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-lg">{formatNumber(product.shares)}</p>
                            <p className="text-gray-500">Partages</p>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{formatNumber(product.views)}</p>
                            <p className="text-gray-500">Vues</p>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{formatNumber(product.engagement)}</p>
                            <p className="text-gray-500">Engagement</p>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{formatCurrency(product.revenue)}</p>
                            <p className="text-gray-500">Revenus</p>
                          </div>
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViralStrategyOptimization(product)}
                              className="w-full"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Optimiser
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleBoostProduct(product)}
                              style={{backgroundColor: '#ff6600'}}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8533'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
                              className="w-full"
                            >
                              <Rocket className="w-3 h-3 mr-1" />
                              Booster
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Utilisateurs ayant partagé ce produit */}
                    <div className="border-t pt-4">
                      <h5 className="font-medium mb-3 text-gray-700">
                        Utilisateurs ayant partagé ce produit ({product.usersWhoShared.length})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {product.usersWhoShared.map((user) => (
                          <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                              <p className="text-xs text-gray-500">{formatPoints(user.points)} gagnés</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Engagement des Utilisateurs</span>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un utilisateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuItem onClick={() => handleExportData('csv')}>
                        <FileText className="w-4 h-4 mr-2" />
                        CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportData('excel')}>
                        <BarChart3Icon className="w-4 h-4 mr-2" />
                        Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportData('pdf')}>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredAndSortedUsers().map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                          {getRankBadge(user.rank)}
                        </div>
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-lg">{user.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {user.badge}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Influence: {user.socialInfluence}/100
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              Produits favoris: {user.favoriteProducts.join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="grid grid-cols-6 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-lg">{formatNumber(user.totalShares)}</p>
                            <p className="text-gray-500">Partages</p>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{formatNumber(user.totalViews)}</p>
                            <p className="text-gray-500">Vues</p>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{formatNumber(user.totalEngagement)}</p>
                            <p className="text-gray-500">Engagement</p>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{formatCurrency(user.totalRevenue)}</p>
                            <p className="text-gray-500">Revenus</p>
                          </div>
                          <div>
                            <p className="font-medium text-lg">{formatPoints(user.pointsEarned)}</p>
                            <p className="text-gray-500">Points gagnés</p>
                          </div>
                          <div className="space-y-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewUserDetails(user)}
                              className="w-full"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Détails
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleShareData('copy', { title: `Profil de ${user.name}`, revenue: user.totalRevenue, shares: user.totalShares })}
                              className="w-full"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Partager
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plateformes */}
        <TabsContent value="platforms" className="space-y-6">
          {/* Statistiques par réseau social */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockData.socialNetworkStats.map((platform) => (
              <Card key={platform.platform} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {getPlatformIcon(platform.platform)}
                    <span>{platform.platform}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatNumber(platform.shares)}
                        </div>
                        <div className="text-sm text-gray-500">Partages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {formatNumber(platform.views)}
                        </div>
                        <div className="text-sm text-gray-500">Vues</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Engagement</span>
                        <span className="font-medium">{formatNumber(platform.engagement)}</span>
                      </div>
                      <Progress value={(platform.engagement / Math.max(...mockData.socialNetworkStats.map(p => p.engagement))) * 100} />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(platform.revenue)}
                      </div>
                      <div className="text-sm text-gray-500">Revenus générés</div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span>Croissance</span>
                      <span className={`font-medium ${platform.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {platform.growth >= 0 ? '+' : ''}{platform.growth}%
                      </span>
                    </div>

                    {/* Top utilisateurs par plateforme */}
                    <div className="border-t pt-3">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Top utilisateurs</h6>
                      <div className="space-y-2">
                        {platform.topUsers.map((user, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="truncate">{user.name}</span>
                            <div className="flex items-center space-x-2">
                              <span>{user.shares} partages</span>
                              <span className="text-gray-500">({formatPoints(user.points)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Boutons d'action pour la plateforme */}
                    <div className="border-t pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShareData('copy', { title: `Statistiques ${platform.platform}`, revenue: platform.revenue, shares: platform.shares })}
                          className="text-xs"
                          title="Copier les données"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copier
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShareData('link', { title: `Statistiques ${platform.platform}`, revenue: platform.revenue, shares: platform.shares })}
                          className="text-xs"
                          title="Copier le lien"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Lien
                        </Button>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleShareData('whatsapp', { title: `Statistiques ${platform.platform}`, revenue: platform.revenue, shares: platform.shares })}
                          className="flex-1 text-green-600 hover:bg-green-100"
                          title="Partager sur WhatsApp"
                        >
                          <FaWhatsapp className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleShareData('facebook', { title: `Statistiques ${platform.platform}`, revenue: platform.revenue, shares: platform.shares })}
                          className="flex-1 text-blue-600 hover:bg-blue-100"
                          title="Partager sur Facebook"
                        >
                          <FaFacebook className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleShareData('x', { title: `Statistiques ${platform.platform}`, revenue: platform.revenue, shares: platform.shares })}
                          className="flex-1 text-black hover:bg-gray-100"
                          title="Partager sur X (Twitter)"
                        >
                          <FaXTwitter className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Graphique de comparaison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des Plateformes</CardTitle>
              <CardDescription>Performance relative par plateforme avec analyse de marché</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Graphique de comparaison des plateformes</p>
                  <p className="text-sm text-gray-400 mt-2">Intégration avec Chart.js ou Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyse Virale */}
        <TabsContent value="viral" className="space-y-6">
          {/* Produits viraux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" style={{color: '#ff6600'}} />
                <span>Produits Viraux</span>
              </CardTitle>
              <CardDescription>Analyse des produits avec le plus fort potentiel viral</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.productsByShares.filter(p => p.viralScore >= 7).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-red-500">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            Score viral: {product.viralScore}/10
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium">{formatNumber(product.shares)}</p>
                          <p className="text-gray-500">Partages</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatNumber(product.views)}</p>
                          <p className="text-gray-500">Vues</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatNumber(product.engagement)}</p>
                          <p className="text-gray-500">Engagement</p>
                        </div>
                        <div>
                          <Button 
                            size="sm" 
                            onClick={() => handleBoostProduct(product)}
                            style={{backgroundColor: '#ff6600'}}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8533'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
                          >
                            <Rocket className="w-3 h-3 mr-1" />
                            Booster
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShareData('copy', { title: product.name, revenue: product.revenue, shares: product.shares })}
                            className="w-full"
                            title="Copier les données"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copier
                          </Button>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleShareData('whatsapp', { title: product.name, revenue: product.revenue, shares: product.shares })}
                              className="flex-1 text-green-600 hover:bg-green-100"
                              title="Partager sur WhatsApp"
                            >
                              <FaWhatsapp className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleShareData('facebook', { title: product.name, revenue: product.revenue, shares: product.shares })}
                              className="flex-1 text-blue-600 hover:bg-blue-100"
                              title="Partager sur Facebook"
                            >
                              <FaFacebook className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleShareData('x', { title: product.name, revenue: product.revenue, shares: product.shares })}
                              className="flex-1 text-black hover:bg-gray-100"
                              title="Partager sur X (Twitter)"
                            >
                              <FaXTwitter className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tendances virales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" style={{color: '#ff6600'}} />
                <span>Tendances Virales</span>
              </CardTitle>
              <CardDescription>Évolution des coefficients viraux par période</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Graphique des tendances virales</p>
                  <p className="text-sm text-gray-400 mt-2">Intégration avec Chart.js ou Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommandations d'optimisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" style={{color: '#ff6600'}} />
                <span>Recommandations d'Optimisation Virale</span>
              </CardTitle>
              <CardDescription>Stratégies pour améliorer le potentiel viral de vos produits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900">Optimisation des Images</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Images haute qualité pour réseaux sociaux</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Formats optimisés (1:1, 16:9)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Textes et logos intégrés</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShareData('copy', { title: 'Guide Optimisation Images', revenue: 0, shares: 0 })}
                      className="w-full"
                      title="Copier les conseils"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copier les Conseils
                    </Button>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleShareData('whatsapp', { title: 'Guide Optimisation Images', revenue: 0, shares: 0 })}
                        className="flex-1 text-green-600 hover:bg-green-100"
                        title="Partager sur WhatsApp"
                      >
                        <FaWhatsapp className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleShareData('facebook', { title: 'Guide Optimisation Images', revenue: 0, shares: 0 })}
                        className="flex-1 text-blue-600 hover:bg-blue-100"
                        title="Partager sur Facebook"
                      >
                        <FaFacebook className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleShareData('x', { title: 'Guide Optimisation Images', revenue: 0, shares: 0 })}
                        className="flex-1 text-black hover:bg-gray-100"
                        title="Partager sur X (Twitter)"
                      >
                        <FaXTwitter className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900">Contenu Engageant</h5>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Hashtags pertinents et populaires</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Descriptions accrocheuses</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Vidéos et stories</span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShareData('copy', { title: 'Guide Contenu Engageant', revenue: 0, shares: 0 })}
                      className="w-full"
                      title="Copier les conseils"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copier les Conseils
                    </Button>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleShareData('whatsapp', { title: 'Guide Contenu Engageant', revenue: 0, shares: 0 })}
                        className="flex-1 text-green-600 hover:bg-green-100"
                        title="Partager sur WhatsApp"
                      >
                        <FaWhatsapp className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleShareData('facebook', { title: 'Guide Contenu Engageant', revenue: 0, shares: 0 })}
                        className="flex-1 text-blue-600 hover:bg-blue-100"
                        title="Partager sur Facebook"
                      >
                        <FaFacebook className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleShareData('x', { title: 'Guide Contenu Engageant', revenue: 0, shares: 0 })}
                        className="flex-1 text-black hover:bg-gray-100"
                        title="Partager sur X (Twitter)"
                      >
                        <FaXTwitter className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal d'export des données */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exporter les Données</DialogTitle>
            <DialogDescription>
              Choisissez le format d'export pour télécharger vos données de partages et engagement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
                className="flex flex-col items-center space-y-2 p-4 h-auto"
                style={{backgroundColor: exportFormat === 'csv' ? '#ff6600' : undefined}}
              >
                <FileText className="w-8 h-8" />
                <span>CSV</span>
              </Button>
              <Button
                variant={exportFormat === 'excel' ? 'default' : 'outline'}
                onClick={() => setExportFormat('excel')}
                className="flex flex-col items-center space-y-2 p-4 h-auto"
                style={{backgroundColor: exportFormat === 'excel' ? '#ff6600' : undefined}}
              >
                <BarChart3Icon className="w-8 h-8" />
                <span>Excel</span>
              </Button>
              <Button
                variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                onClick={() => setExportFormat('pdf')}
                className="flex flex-col items-center space-y-2 p-4 h-auto"
                style={{backgroundColor: exportFormat === 'pdf' ? '#ff6600' : undefined}}
              >
                <FileText className="w-8 h-8" />
                <span>PDF</span>
              </Button>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={executeExport}
                style={{backgroundColor: '#ff6600'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8533'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
              >
                Exporter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'optimisation de stratégie virale */}
      <Dialog open={showViralStrategyModal} onOpenChange={setShowViralStrategyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" style={{color: '#ff6600'}} />
              <span>Optimisation de la Stratégie Virale</span>
            </DialogTitle>
            <DialogDescription>
              Optimisez la stratégie virale pour {selectedProduct?.name} et améliorez son potentiel de partage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedProduct && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Produit sélectionné : {selectedProduct.name}</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Score viral actuel</p>
                    <p className="font-medium text-lg">{selectedProduct.viralScore}/10</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Partages actuels</p>
                    <p className="font-medium text-lg">{formatNumber(selectedProduct.shares)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Engagement</p>
                    <p className="font-medium text-lg">{formatNumber(selectedProduct.engagement)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h5 className="font-medium">Recommandations d'optimisation :</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Images optimisées</p>
                      <p className="text-sm text-gray-500">Formats 1:1 et 16:9 pour réseaux sociaux</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Hashtags populaires</p>
                      <p className="text-sm text-gray-500">Utilisez des hashtags tendance</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Contenu engageant</p>
                      <p className="text-sm text-gray-500">Descriptions accrocheuses</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Vidéos et stories</p>
                      <p className="text-sm text-gray-500">Contenu multimédia</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowViralStrategyModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleOptimizeViralStrategy}
                style={{backgroundColor: '#ff6600'}}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8533'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
              >
                <Zap className="w-4 h-4 mr-2" />
                Optimiser la Stratégie
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de détails utilisateur */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" style={{color: '#ff6600'}} />
              <span>Détails de l'Utilisateur</span>
            </DialogTitle>
            <DialogDescription>
              Informations détaillées sur l'engagement et les performances de {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary">{selectedUser.badge}</Badge>
                    <Badge variant="outline">Influence: {selectedUser.socialInfluence}/100</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold" style={{color: '#ff6600'}}>{formatNumber(selectedUser.totalShares)}</p>
                  <p className="text-sm text-gray-500">Total Partages</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold" style={{color: '#ff6600'}}>{formatNumber(selectedUser.totalViews)}</p>
                  <p className="text-sm text-gray-500">Total Vues</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold" style={{color: '#ff6600'}}>{formatNumber(selectedUser.totalEngagement)}</p>
                  <p className="text-sm text-gray-500">Engagement</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold" style={{color: '#ff6600'}}>{formatPoints(selectedUser.pointsEarned)}</p>
                  <p className="text-sm text-gray-500">Points Gagnés</p>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Produits favoris :</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.favoriteProducts.map((product: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Fermer
                </Button>
                <Button 
                  onClick={() => handleShareData('copy', { title: `Profil de ${selectedUser.name}`, revenue: selectedUser.totalRevenue, shares: selectedUser.totalShares })}
                  style={{backgroundColor: '#ff6600'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8533'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le Profil
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Container des notifications modernes */}
      <NotificationContainer />
    </div>
  )
}
