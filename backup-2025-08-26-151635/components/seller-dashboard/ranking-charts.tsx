"use client"

import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, BarChart3, LineChart, PieChart,
  Calendar, Target, Award, Crown, Medal, Trophy, Share2, Star
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types pour les graphiques de classement
interface RankingTrend {
  date: string
  overallRank: number
  salesRank: number
  sharesRank: number
  viewsRank: number
  performance: number
}

interface CategoryPerformance {
  category: string
  currentRank: number
  previousRank: number
  improvement: number
  totalVendors: number
  marketShare: number
}

interface CompetitorAnalysis {
  competitorName: string
  currentRank: number
  previousRank: number
  rankChange: number
  performanceGap: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export default function RankingCharts() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('month')
  const [selectedMetric, setSelectedMetric] = useState('overall')
  const [activeChart, setActiveChart] = useState('trend')

  // Données mock pour les tendances
  const mockTrendData: RankingTrend[] = [
    { date: '2024-01-01', overallRank: 3, salesRank: 2, sharesRank: 4, viewsRank: 3, performance: 85.2 },
    { date: '2024-01-08', overallRank: 2, salesRank: 1, sharesRank: 3, viewsRank: 2, performance: 92.1 },
    { date: '2024-01-15', overallRank: 1, salesRank: 1, sharesRank: 2, viewsRank: 1, performance: 98.5 },
  ]

  const mockCategoryPerformance: CategoryPerformance[] = [
    { category: 'Électronique', currentRank: 1, previousRank: 2, improvement: 1, totalVendors: 25, marketShare: 15.2 },
    { category: 'Mode', currentRank: 3, previousRank: 5, improvement: 2, totalVendors: 18, marketShare: 8.7 },
    { category: 'Maison', currentRank: 2, previousRank: 1, improvement: -1, totalVendors: 22, marketShare: 12.1 },
    { category: 'Sport', currentRank: 4, previousRank: 3, improvement: -1, totalVendors: 15, marketShare: 6.8 },
  ]

  const mockCompetitorAnalysis: CompetitorAnalysis[] = [
    {
      competitorName: 'Digital World',
      currentRank: 2,
      previousRank: 3,
      rankChange: 1,
      performanceGap: 3.3,
      strengths: ['Partages élevés', 'Engagement client', 'Innovation produit'],
      weaknesses: ['Stock limité', 'Prix élevés'],
      recommendations: ['Optimiser la gestion des stocks', 'Réduire les prix de 10-15%']
    },
    {
      competitorName: 'Smart Gadgets',
      currentRank: 3,
      previousRank: 2,
      rankChange: -1,
      performanceGap: 8.7,
      strengths: ['Vues élevées', 'Large catalogue'],
      weaknesses: ['Partages faibles', 'Satisfaction client'],
      recommendations: ['Améliorer la stratégie de partage', 'Focus sur la qualité client']
    }
  ]

  const timeRanges = [
    { id: 'week', name: 'Semaine', icon: '📅' },
    { id: 'month', name: 'Mois', icon: '📆' },
    { id: 'quarter', name: 'Trimestre', icon: '📊' },
    { id: 'year', name: 'Année', icon: '🎯' }
  ]

  const metrics = [
    { id: 'overall', name: 'Classement global', icon: '🏆' },
    { id: 'sales', name: 'Ventes', icon: '💰' },
    { id: 'shares', name: 'Partages', icon: '📤' },
    { id: 'views', name: 'Vues', icon: '👁️' },
    { id: 'performance', name: 'Performance', icon: '📈' }
  ]

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-100'
    if (rank <= 3) return 'text-orange-600 bg-orange-100'
    if (rank <= 10) return 'text-blue-600 bg-blue-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (improvement < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <span className="text-gray-400">→</span>
  }

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600'
    if (improvement < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      {/* Contrôles des graphiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span>Visualisations Avancées</span>
          </CardTitle>
          <CardDescription>
            Analysez vos performances et comparez-vous à la concurrence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium">Période</label>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
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
              <label className="text-sm font-medium">Métrique</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map(metric => (
                    <SelectItem key={metric.id} value={metric.id}>
                      <span className="mr-2">{metric.icon}</span>
                      {metric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets des graphiques */}
      <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend" className="flex items-center space-x-2">
            <LineChart className="w-4 h-4" />
            <span>Tendances</span>
          </TabsTrigger>
          <TabsTrigger value="category" className="flex items-center space-x-2">
            <PieChart className="w-4 h-4" />
            <span>Catégories</span>
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Concurrence</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span>Évolution du Classement</span>
              </CardTitle>
              <CardDescription>
                Suivi de votre position dans le temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTrendData.map((trend, index) => (
                  <div key={trend.date} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium text-gray-600">
                        {new Date(trend.date).toLocaleDateString('fr-FR')}
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getRankColor(trend.overallRank)} px-2 py-1 rounded`}>
                            #{trend.overallRank}
                          </div>
                          <div className="text-xs text-gray-500">Global</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getRankColor(trend.salesRank)} px-2 py-1 rounded`}>
                            #{trend.salesRank}
                          </div>
                          <div className="text-xs text-gray-500">Ventes</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getRankColor(trend.sharesRank)} px-2 py-1 rounded`}>
                            #{trend.sharesRank}
                          </div>
                          <div className="text-xs text-gray-500">Partages</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getRankColor(trend.viewsRank)} px-2 py-1 rounded`}>
                            #{trend.viewsRank}
                          </div>
                          <div className="text-xs text-gray-500">Vues</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{trend.performance}%</div>
                      <div className="text-xs text-gray-500">Performance</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-blue-500" />
                <span>Performance par Catégorie</span>
              </CardTitle>
              <CardDescription>
                Analysez votre positionnement dans chaque catégorie
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCategoryPerformance.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold">
                        #{category.currentRank}
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.category}</h3>
                        <p className="text-sm text-gray-500">
                          {category.totalVendors} vendeurs • {category.marketShare}% de part de marché
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          {category.previousRank}
                        </div>
                        <div className="text-xs text-gray-500">Position précédente</div>
                      </div>
                      
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${getImprovementColor(category.improvement)}`}>
                          {getImprovementIcon(category.improvement)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.improvement > 0 ? `+${category.improvement}` : category.improvement}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {((1 - category.currentRank / category.totalVendors) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Percentile</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-red-500" />
                <span>Analyse de la Concurrence</span>
              </CardTitle>
              <CardDescription>
                Identifiez vos forces et faiblesses par rapport à la concurrence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockCompetitorAnalysis.map((competitor, index) => (
                  <div key={competitor.competitorName} className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold">
                          #{competitor.currentRank}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{competitor.competitorName}</h3>
                          <p className="text-sm text-gray-500">
                            Écart de performance: {competitor.performanceGap}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {competitor.previousRank}
                          </div>
                          <div className="text-xs text-gray-500">Position précédente</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${getImprovementColor(competitor.rankChange)}`}>
                            {getImprovementIcon(competitor.rankChange)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {competitor.rankChange > 0 ? `+${competitor.rankChange}` : competitor.rankChange}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Forces</h4>
                        <ul className="space-y-1">
                          {competitor.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-green-600 flex items-center space-x-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-red-700 mb-2">Faiblesses</h4>
                        <ul className="space-y-1">
                          {competitor.weaknesses.map((weakness, idx) => (
                            <li key={idx} className="text-sm text-red-600 flex items-center space-x-2">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">Recommandations</h4>
                        <ul className="space-y-1">
                          {competitor.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-600 flex items-center space-x-2">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Résumé des insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>Insights et Recommandations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Points Forts</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <Crown className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">1ère place globale maintenue</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Performance en hausse constante</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Leadership dans la catégorie Électronique</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Actions Prioritaires</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Augmenter les partages sociaux de 25%</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Star className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Maintenir la note client au-dessus de 4.8</span>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">Atteindre 10 000 vues/jour d'ici 3 mois</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


