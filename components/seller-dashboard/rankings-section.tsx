"use client"

import { useState } from 'react'
import { useMoney } from '@/lib/hooks/use-money'
import { 
  Trophy, TrendingUp, TrendingDown, Target, Award, BarChart3, 
  Users, Star, Eye, ArrowUp, ArrowDown, Minus, Calendar,
  Filter, Download, RefreshCw, Zap, Crown, Medal
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RankingData {
  currentRank: number
  previousRank: number
  totalVendors: number
  category: string
  score: number
  maxScore: number
  metrics: {
    sales: number
    shares: number
    visits: number
    rating: number
    responseTime: number
    customerSatisfaction: number
  }
  evolution: {
    sales: number
    shares: number
    visits: number
    rating: number
  }
  competitors: Array<{
    id: string
    name: string
    avatar: string
    rank: number
    score: number
    sales: number
    rating: number
    isCompetitor: boolean
  }>
  history: Array<{
    date: string
    rank: number
    score: number
    sales: number
  }>
  categories: Array<{
    name: string
    rank: number
    totalVendors: number
    score: number
  }>
}

interface RankingsSectionProps {
  rankingData: RankingData
}

export default function RankingsSection({ rankingData }: RankingsSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')

  const { formatMoney: formatCurrency } = useMoney()

  const getRankChange = () => {
    const change = rankingData.previousRank - rankingData.currentRank
    if (change > 0) return { value: change, direction: 'up', color: 'text-green-600' }
    if (change < 0) return { value: Math.abs(change), direction: 'down', color: 'text-red-600' }
    return { value: 0, direction: 'stable', color: 'text-gray-600' }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-500" />
    return <Trophy className="w-5 h-5 text-gray-400" />
  }

  const rankChange = getRankChange()

  return (
    <div className="space-y-6">
      {/* En-tête avec classement principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classement principal */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-orange-600" />
                <span>Classement Global</span>
              </span>
              <div className="flex items-center space-x-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="quarter">Ce trimestre</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {getRankIcon(rankingData.currentRank)}
                  <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {rankingData.currentRank}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-900">
                    #{rankingData.currentRank}
                  </div>
                  <div className="text-sm text-orange-700">
                    sur {rankingData.totalVendors} vendeurs
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    {rankChange.direction === 'up' && <ArrowUp className="w-4 h-4 text-green-600" />}
                    {rankChange.direction === 'down' && <ArrowDown className="w-4 h-4 text-red-600" />}
                    {rankChange.direction === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
                    <span className={`text-sm font-medium ${rankChange.color}`}>
                      {rankChange.value > 0 ? `+${rankChange.value}` : rankChange.value === 0 ? 'Stable' : `-${rankChange.value}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-900">
                  {rankingData.score.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700">points</div>
                <Progress value={(rankingData.score / rankingData.maxScore) * 100} className="w-32 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score détaillé */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>Score Détaillé</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ventes</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{rankingData.metrics.sales}</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Partages</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{rankingData.metrics.shares}</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Visites</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{rankingData.metrics.visits}</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Note</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{rankingData.metrics.rating}/5</span>
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation des onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="competitors">Concurrents</TabsTrigger>
          <TabsTrigger value="categories">Par Catégorie</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Évolution Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-900">
                    +{rankingData.evolution.sales}%
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-green-600 mt-2">vs période précédente</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Évolution Partages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-900">
                    +{rankingData.evolution.shares}%
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 mt-2">vs période précédente</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Évolution Visites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-purple-900">
                    +{rankingData.evolution.visits}%
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-xs text-purple-600 mt-2">vs période précédente</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-700">Évolution Note</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-yellow-900">
                    +{rankingData.evolution.rating}%
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-xs text-yellow-600 mt-2">vs période précédente</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique de performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Performance Globale</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </CardTitle>
              <CardDescription>Analyse de votre performance par métrique</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ventes</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={85} className="w-32" />
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Partages</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={72} className="w-32" />
                    <span className="text-sm font-medium">72%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visites</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={68} className="w-32" />
                    <span className="text-sm font-medium">68%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Satisfaction Client</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={92} className="w-32" />
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Concurrents */}
        <TabsContent value="competitors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Top 10 Concurrents</span>
                <div className="flex items-center space-x-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrer par catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="electronics">Électronique</SelectItem>
                      <SelectItem value="fashion">Mode</SelectItem>
                      <SelectItem value="home">Maison</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrer
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Comparaison avec vos principaux concurrents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingData.competitors.map((competitor, index) => (
                  <div key={competitor.id} className={`flex items-center justify-between p-4 rounded-lg border ${
                    competitor.isCompetitor ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-600">#{competitor.rank}</span>
                        {getRankIcon(competitor.rank)}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={competitor.avatar} />
                        <AvatarFallback>{competitor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{competitor.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatCurrency(competitor.sales)}</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                            <span>{competitor.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{competitor.score.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Par Catégorie */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankingData.categories.map((category) => (
              <Card key={category.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.name}</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      #{category.rank}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Classement</span>
                      <span className="font-medium">#{category.rank} / {category.totalVendors}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Score</span>
                      <span className="font-medium">{category.score.toLocaleString()}</span>
                    </div>
                    <Progress value={(category.rank / category.totalVendors) * 100} className="w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Évolution du Classement</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </CardTitle>
              <CardDescription>Historique de votre positionnement sur 12 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rankingData.history.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">#{entry.rank}</div>
                        <div className="text-xs text-gray-500">Position</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{entry.score.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatCurrency(entry.sales)}</div>
                        <div className="text-xs text-gray-500">Ventes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{new Date(entry.date).toLocaleDateString('fr-FR')}</div>
                      <div className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
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

