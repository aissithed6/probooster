"use client"

import { useState } from 'react'
import { 
  Share2, TrendingUp, Users, Eye, BarChart3, Download, Filter,
  Search, Facebook, Twitter, Instagram, MessageCircle, Heart,
  Star, Target, Award, Zap, Calendar, MapPin, DollarSign,
  ArrowUp, ArrowDown, Minus, RefreshCw, ExternalLink, Copy, TrendingDown
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ShareData {
  totalShares: number
  totalViews: number
  totalEngagement: number
  totalRevenue: number
  viralCoefficient: number
  averageReach: number
  topPerformers: Array<{
    id: string
    name: string
    avatar: string
    shares: number
    views: number
    engagement: number
    revenue: number
    products: string[]
  }>
  sharesByPlatform: Array<{
    platform: string
    shares: number
    views: number
    engagement: number
    revenue: number
    icon: any
    color: string
  }>
  sharesByProduct: Array<{
    id: string
    name: string
    image: string
    shares: number
    views: number
    engagement: number
    revenue: number
    viralScore: number
  }>
  sharesByPeriod: Array<{
    date: string
    shares: number
    views: number
    engagement: number
    revenue: number
  }>
  userEngagement: Array<{
    id: string
    name: string
    avatar: string
    email: string
    shares: number
    views: number
    engagement: number
    revenue: number
    lastActivity: string
    isActive: boolean
  }>
}

interface SharesSectionProps {
  shareData: ShareData
  onExportData: (type: string) => void
  onViewUserDetails: (userId: string) => void
  onViewProductDetails: (productId: string) => void
}

export default function SharesSection({
  shareData,
  onExportData,
  onViewUserDetails,
  onViewProductDetails
}: SharesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [periodFilter, setPeriodFilter] = useState('month')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
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

  const filteredProducts = shareData.sharesByProduct.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUsers = shareData.userEngagement.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Total Partages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-900">{formatNumber(shareData.totalShares)}</div>
              <Share2 className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-blue-600 mt-2">+12% ce mois</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Vues Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-900">{formatNumber(shareData.totalViews)}</div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">+8% ce mois</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-900">{formatNumber(shareData.totalEngagement)}</div>
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-purple-600 mt-2">+15% ce mois</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Revenus Générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(shareData.totalRevenue)}</div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-600 mt-2">+20% ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Métriques avancées */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Coefficient Viral</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {shareData.viralCoefficient.toFixed(2)}
              </div>
              <p className="text-sm text-gray-600">Partages par vue</p>
              <Progress value={(shareData.viralCoefficient / 10) * 100} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>Portée Moyenne</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatNumber(shareData.averageReach)}
              </div>
              <p className="text-sm text-gray-600">Vues par partage</p>
              <Progress value={(shareData.averageReach / 1000) * 100} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span>Score d'Engagement</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {((shareData.totalEngagement / shareData.totalViews) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Taux d'engagement</p>
              <Progress value={(shareData.totalEngagement / shareData.totalViews) * 100} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation des onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Par Produit</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="platforms">Plateformes</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top performeurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Top Performeurs</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </CardTitle>
              <CardDescription>Utilisateurs avec le meilleur engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shareData.topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={performer.avatar} />
                          <AvatarFallback>{performer.name[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <h4 className="font-medium">{performer.name}</h4>
                        <p className="text-sm text-gray-500">{performer.products.length} produits partagés</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">{formatNumber(performer.shares)}</p>
                          <p className="text-gray-500">Partages</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatNumber(performer.views)}</p>
                          <p className="text-gray-500">Vues</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(performer.revenue)}</p>
                          <p className="text-gray-500">Revenus</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Graphique d'évolution */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Partages</CardTitle>
              <CardDescription>Progression sur les 30 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Graphique d'évolution des partages</p>
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
                <span>Performance par Produit</span>
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
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Semaine</SelectItem>
                      <SelectItem value="month">Mois</SelectItem>
                      <SelectItem value="quarter">Trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {getViralScoreIcon(product.viralScore)}
                          <span className={`text-sm font-medium ${getViralScoreColor(product.viralScore)}`}>
                            Score viral: {product.viralScore}/10
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-4 gap-6 text-sm">
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
                          <p className="font-medium">{formatCurrency(product.revenue)}</p>
                          <p className="text-gray-500">Revenus</p>
                        </div>
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
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs text-gray-500">
                            {user.isActive ? 'Actif' : 'Inactif'} • Dernière activité: {new Date(user.lastActivity).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="grid grid-cols-4 gap-6 text-sm">
                        <div>
                          <p className="font-medium">{formatNumber(user.shares)}</p>
                          <p className="text-gray-500">Partages</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatNumber(user.views)}</p>
                          <p className="text-gray-500">Vues</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatNumber(user.engagement)}</p>
                          <p className="text-gray-500">Engagement</p>
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(user.revenue)}</p>
                          <p className="text-gray-500">Revenus</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => onViewUserDetails(user.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plateformes */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shareData.sharesByPlatform.map((platform) => (
              <Card key={platform.platform} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <platform.icon className={`w-5 h-5 ${platform.color}`} />
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
                      <Progress value={(platform.engagement / Math.max(...shareData.sharesByPlatform.map(p => p.engagement))) * 100} />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(platform.revenue)}
                      </div>
                      <div className="text-sm text-gray-500">Revenus générés</div>
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
              <CardDescription>Performance relative par plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Graphique de comparaison des plateformes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

