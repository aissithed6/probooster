"use client"

import { useMemo, useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, BarChart3, LineChart, PieChart,
  Calendar, Target, Award, Crown, Medal, Trophy, Share2, Star
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getClientSessionSafe, supabase } from '@/lib/supabase'

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

  const [trendData, setTrendData] = useState<RankingTrend[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([])
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis[]>([])

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

  const fetchJson = async (url: string) => {
    const resp = await fetch(url, { credentials: 'include' })
    const body = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      const msg = typeof (body as any)?.error === 'string' ? (body as any).error : 'Erreur réseau.'
      throw new Error(msg)
    }
    return body
  }

  const loadCategoryPerformance = async (range: string) => {
    try {
      const body = await fetchJson(`/api/vendor/rankings/categories?range=${encodeURIComponent(range)}`)
      const rows = Array.isArray((body as any)?.data) ? ((body as any).data as any[]) : []
      setCategoryPerformance(
        rows.map((r: any) => ({
          category: String(r?.category ?? 'N/A'),
          currentRank: Number(r?.currentRank ?? 0),
          previousRank: Number(r?.previousRank ?? 0),
          improvement: Number(r?.improvement ?? 0),
          totalVendors: Number(r?.totalVendors ?? 0),
          marketShare: Number(r?.marketShare ?? 0)
        }))
      )
    } catch {
      setCategoryPerformance([])
    }
  }

  const loadCompetitors = async (range: string) => {
    try {
      const body = await fetchJson(`/api/vendor/rankings/competitors?range=${encodeURIComponent(range)}&limit=5`)
      const rows = Array.isArray((body as any)?.data) ? ((body as any).data as any[]) : []
      setCompetitorAnalysis(
        rows.map((r: any) => ({
          competitorName: String(r?.competitorName ?? 'Concurrent'),
          currentRank: Number(r?.currentRank ?? 0),
          previousRank: Number(r?.previousRank ?? 0),
          rankChange: Number(r?.rankChange ?? 0),
          performanceGap: Number(r?.performanceGap ?? 0),
          strengths: Array.isArray(r?.strengths) ? (r.strengths as any[]).map((x) => String(x)) : [],
          weaknesses: Array.isArray(r?.weaknesses) ? (r.weaknesses as any[]).map((x) => String(x)) : [],
          recommendations: Array.isArray(r?.recommendations) ? (r.recommendations as any[]).map((x) => String(x)) : []
        }))
      )
    } catch {
      setCompetitorAnalysis([])
    }
  }

  const mapRowToTrend = (row: any): RankingTrend => {
    const get = (camel: string, snake?: string) => (row?.[camel] ?? (snake ? row?.[snake] : undefined))
    return {
      date: String(get('createdAt', 'created_at') ?? get('date') ?? new Date().toISOString()),
      overallRank: Number(get('overallRank', 'overall_rank') ?? get('rank') ?? 0),
      salesRank: Number(get('salesRank', 'sales_rank') ?? 0),
      sharesRank: Number(get('sharesRank', 'shares_rank') ?? 0),
      viewsRank: Number(get('viewsRank', 'views_rank') ?? 0),
      performance: Number(get('performance') ?? get('score') ?? 0)
    }
  }

  const getDaysForRange = (range: string) => {
    if (range === 'week') return 7
    if (range === 'month') return 31
    if (range === 'quarter') return 92
    if (range === 'year') return 366
    return 31
  }

  const loadTrends = async (range: string) => {
    try {
      const body = await fetchJson(`/api/vendor/rankings?range=${encodeURIComponent(range)}`)
      const rows = Array.isArray((body as any)?.data) ? ((body as any).data as any[]) : []
      const days = getDaysForRange(range)
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000

      const mapped = rows
        .map(mapRowToTrend)
        .filter((t) => {
          const time = new Date(t.date).getTime()
          return Number.isFinite(time) ? time >= cutoff : true
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setTrendData(mapped)
    } catch {
      setTrendData([])
    }
  }

  useEffect(() => {
    void loadTrends(selectedTimeRange)
    void loadCategoryPerformance(selectedTimeRange)
    void loadCompetitors(selectedTimeRange)
  }, [selectedTimeRange])

  useEffect(() => {
    let disposed = false
    let debounceId: number | undefined
    let channel: any = null

    const debouncedReload = (fn: () => void) => {
      if (debounceId) window.clearTimeout(debounceId)
      debounceId = window.setTimeout(() => {
        if (!disposed) fn()
      }, 250)
    }

    const safeReload = () => {
      void loadTrends(selectedTimeRange)
      void loadCategoryPerformance(selectedTimeRange)
      void loadCompetitors(selectedTimeRange)
    }

    void (async () => {
      const session = await getClientSessionSafe()
      const vendorId = session?.user?.id
      if (!vendorId || disposed) return

      channel = supabase
        .channel(`realtime:vendor-ranking-charts:${vendorId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rankings', filter: `user_id=eq.${vendorId}` },
          () => debouncedReload(safeReload)
        )
        .subscribe()
    })()

    const onFocus = () => {
      debouncedReload(safeReload)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      disposed = true
      if (debounceId) window.clearTimeout(debounceId)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      if (channel) supabase.removeChannel(channel)
    }
  }, [selectedTimeRange])

  const effectiveTrendData = useMemo(() => {
    return trendData
  }, [trendData])

  const effectiveCategoryPerformance = useMemo(() => {
    return categoryPerformance
  }, [categoryPerformance])

  const effectiveCompetitorAnalysis = useMemo(() => {
    return competitorAnalysis
  }, [competitorAnalysis])

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
                {effectiveTrendData.map((trend, index) => (
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
                {effectiveCategoryPerformance.map((category, index) => (
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
                {effectiveCompetitorAnalysis.map((competitor, index) => (
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


