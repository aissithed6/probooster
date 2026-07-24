"use client"

import React, { useEffect, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  Activity,
  Target,
  Zap,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Users,
  ShoppingCart,
  X,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  resolveVendorReportExportType,
  type VendorAnalyticsData,
  type VendorAnalyticsPeriod
} from '@/lib/vendor-analytics'
import { AnalyticsExportFormatMenu } from './analytics-export-format-menu'

const EXPORT_MODAL_TYPE_MAP: Record<string, string> = {
  all: 'all',
  sales: 'ventes',
  analytics: 'detailed',
  insights: 'insights'
}

const ADVANCED_FILTERS_STORAGE_KEY = 'vendor-advanced-analytics-filters'

interface AdvancedAnalyticsProps {
  analytics: VendorAnalyticsData | null
  isLoading: boolean
  period: VendorAnalyticsPeriod
  onPeriodChange: (period: VendorAnalyticsPeriod) => Promise<void> | void
  onExportInsights: (type: string, format: string) => void
  onViewDetailedReport: (metric: string) => void
  onRefresh: () => Promise<void>
}

function periodToFilterTimeframe(period: VendorAnalyticsPeriod): string {
  if (period === '7d') return 'week'
  if (period === '90d') return 'quarter'
  if (period === '1y') return 'year'
  return 'month'
}

function timeframeToPeriod(timeframe: string): VendorAnalyticsPeriod {
  if (timeframe === 'week') return '7d'
  if (timeframe === 'quarter') return '90d'
  if (timeframe === 'year') return '1y'
  return '30d'
}

export default function AdvancedAnalytics({
  analytics,
  isLoading,
  period,
  onPeriodChange,
  onExportInsights,
  onViewDetailedReport,
  onRefresh
}: AdvancedAnalyticsProps) {
  const advanced = analytics?.advanced
  const insights = analytics?.insights ?? []

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(amount)

  const formatPct = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  const formatPctAbsolute = (value: number) => `${value.toFixed(1)}%`
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState({ type: 'info', title: '', message: '' })

  // États pour les modales
  const [showExportModal, setShowExportModal] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  
  // États pour les modales de rapport
  const [showPerformanceReportModal, setShowPerformanceReportModal] = useState(false)
  const [showCustomerReportModal, setShowCustomerReportModal] = useState(false)
  const [showRevenueReportModal, setShowRevenueReportModal] = useState(false)
  const [showComparisonReportModal, setShowComparisonReportModal] = useState(false)
  const [showPredictiveReportModal, setShowPredictiveReportModal] = useState(false)
  const [showCustomReportModal, setShowCustomReportModal] = useState(false)
  
  // États pour les modales des boutons spécifiques
  const [showSummaryReportModal, setShowSummaryReportModal] = useState(false)
  const [showDetailedDataModal, setShowDetailedDataModal] = useState(false)
  const [showAIInsightsModal, setShowAIInsightsModal] = useState(false)

  // États pour les actions
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // États pour les données des modales
  const [exportOptions, setExportOptions] = useState({
    type: 'all',
    format: 'pdf',
    period: '30d'
  })

  const [filterOptions, setFilterOptions] = useState({
    timeframe: periodToFilterTimeframe(period),
    metric: 'conversion',
    category: 'all'
  })

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADVANCED_FILTERS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as typeof filterOptions
        setFilterOptions((prev) => ({ ...prev, ...parsed, timeframe: periodToFilterTimeframe(period) }))
      }
    } catch {
      // ignore
    }
  }, [period])

  const [reportOptions, setReportOptions] = useState({
    period: 'month',
    includeCharts: true,
    includePredictions: false,
    format: 'pdf'
  })

  const showSimpleNotification = (type: string, title: string, message: string) => {
    setNotificationData({ type, title, message })
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 4000)
  }

  // Fonctions des modales
  const handleExportModal = () => {
    setShowExportModal(true)
  }

  const handleExport = async () => {
    setIsExporting(true)
    const exportType = EXPORT_MODAL_TYPE_MAP[exportOptions.type] ?? exportOptions.type
    onExportInsights(exportType, exportOptions.format)
    showSimpleNotification('success', 'Export réussi', 'Fichier téléchargé avec vos données synchronisées.')
    setShowExportModal(false)
    setIsExporting(false)
  }

  const handleApplyFilters = async () => {
    try {
      sessionStorage.setItem(ADVANCED_FILTERS_STORAGE_KEY, JSON.stringify(filterOptions))
    } catch {
      // ignore
    }
    const nextPeriod = timeframeToPeriod(filterOptions.timeframe)
    onPeriodChange(nextPeriod)
    setShowFiltersModal(false)
  }

  const handleRefreshDirect = async () => {
    setIsRefreshing(true)
    showSimpleNotification('info', 'Actualisation', 'Synchronisation avec la base de données...')
    await onRefresh()
    showSimpleNotification('success', 'Actualisation terminée', 'Analyses avancées à jour.')
    setIsRefreshing(false)
  }

  const handleFiltersModal = () => {
    setShowFiltersModal(true)
  }

  const handleRefreshModal = () => {
    setShowRefreshModal(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    showSimpleNotification('info', 'Actualisation en cours', 'Synchronisation avec la base de données...')
    await onRefresh()
    showSimpleNotification('success', 'Actualisation terminée', 'Analyses mises à jour.')
    setShowRefreshModal(false)
    setIsRefreshing(false)
  }

  const resolveExportFormat = (format: string): 'json' | 'csv' => {
    if (format === 'csv' || format === 'excel') return 'csv'
    return 'json'
  }

  const exportReportQuick = (reportLabel: string, format: 'json' | 'csv' = 'json') => {
    if (!analytics) {
      showSimpleNotification('warning', 'Export impossible', 'Les données ne sont pas encore chargées.')
      return
    }
    const exportKey = resolveVendorReportExportType(reportLabel)
    onExportInsights(exportKey, format)
    const formatLabel = format === 'csv' ? 'CSV' : 'JSON'
    showSimpleNotification(
      'success',
      'Export réussi',
      `Rapport « ${reportLabel} » téléchargé (${formatLabel}, données synchronisées).`
    )
  }

  const closeReportModal = (reportType: string) => {
    switch (reportType) {
      case 'Performance':
        setShowPerformanceReportModal(false)
        break
      case 'Clients':
        setShowCustomerReportModal(false)
        break
      case 'Revenus':
        setShowRevenueReportModal(false)
        break
      case 'Comparatif':
        setShowComparisonReportModal(false)
        break
      case 'Prédictif':
        setShowPredictiveReportModal(false)
        break
      case 'Personnalisé':
        setShowCustomReportModal(false)
        break
      case 'Synthèse':
        setShowSummaryReportModal(false)
        break
      case 'Données Détaillées':
        setShowDetailedDataModal(false)
        break
      case 'Insights IA':
        setShowAIInsightsModal(false)
        break
      default:
        break
    }
  }

  const handleGenerateReport = async (reportType: string) => {
    setIsGeneratingReport(true)
    exportReportQuick(reportType, reportOptions.format)
    onViewDetailedReport(reportType)
    setIsGeneratingReport(false)
    closeReportModal(reportType)
  }

  const renderInsightCards = () => {
    if (insights.length === 0) {
      return (
        <p className="text-sm text-gray-600 col-span-3">
          Aucun insight pour cette période. Les recommandations apparaîtront dès que vous aurez des ventes, avis ou partages.
        </p>
      )
    }

    return insights.map((insight) => {
      const border =
        insight.type === 'positive'
          ? 'border-green-200 bg-green-50'
          : insight.type === 'warning'
            ? 'border-orange-200 bg-orange-50'
            : 'border-red-200 bg-red-50'
      const titleColor =
        insight.type === 'positive'
          ? 'text-green-700'
          : insight.type === 'warning'
            ? 'text-orange-700'
            : 'text-red-700'

      return (
        <div key={insight.id} className={`p-4 rounded-lg border ${border}`}>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white/60 rounded-full">
              {insight.type === 'positive' ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${titleColor}`}>{insight.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Confiance</span>
                <span className="font-medium">{insight.confidence}%</span>
              </div>
              <Progress value={insight.confidence} className="h-2 mt-2" />
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Analyses Avancées & IA</h2>
      <p className="text-gray-600">Insights prédictifs et analyses approfondies pour optimiser vos performances</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ROI */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#ff6600] bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-orange-700">ROI</p>
                <p className="text-2xl font-bold text-orange-900">{formatPctAbsolute(advanced?.roiPercent ?? 0)}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-[#ff6600]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-green-600">{formatPct(advanced?.roiChangePercent ?? 0)}</span>
              <span className="text-sm text-orange-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>
        
        {/* LTV Client */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#3b82f6] bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-blue-700">LTV Client</p>
                <p className="text-xl font-bold text-blue-900">{formatCurrency(advanced?.ltv ?? 0)}</p>
                <p className="text-sm font-medium text-blue-600">({Math.round(advanced?.ltv ?? 0)} pts)</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-green-600">{formatPct(advanced?.ltvChangePercent ?? 0)}</span>
              <span className="text-sm text-blue-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>
        
        {/* CAC */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#8b5cf6] bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-purple-700">CAC</p>
                <p className="text-xl font-bold text-purple-900">{formatCurrency(advanced?.cac ?? 0)}</p>
                <p className="text-sm font-medium text-purple-600">({Math.round(advanced?.cac ?? 0)} pts)</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <Target className="w-5 h-5 text-[#8b5cf6]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-red-600">{formatPct(advanced?.cacChangePercent ?? 0)}</span>
              <span className="text-sm text-purple-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Taux de rétention */}
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#10b981] bg-gradient-to-br from-green-50 to-green-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-green-700">Rétention</p>
                <p className="text-2xl font-bold text-green-900">{(advanced?.retentionRate ?? 0).toFixed(1)}%</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <RefreshCw className="w-5 h-5 text-[#10b981]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-green-600">{formatPct(advanced?.retentionChangePercent ?? 0)}</span>
              <span className="text-sm text-green-600">vs période précédente</span>
            </div>
          </CardContent>
        </Card>
      </div>

             <div className="flex gap-2">
         <Button 
           variant="outline" 
           onClick={handleFiltersModal}
           className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white"
         >
           <Filter className="w-4 h-4 mr-2" />
           Filtres Avancés
         </Button>
         
         <AnalyticsExportFormatMenu
           reportType="insights"
           onExport={onExportInsights}
           disabled={isLoading || !analytics}
           label="Export Insights"
           className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
         />
         
         <Button 
           onClick={() => void handleRefreshDirect()}
           disabled={isLoading || isRefreshing}
           className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
         >
           <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
           Actualiser
         </Button>
       </div>

      {/* Insights prédictifs */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-[#ff6600]" />
            <span>Insights Prédictifs</span>
          </CardTitle>
          <CardDescription>Prévisions et recommandations basées sur l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderInsightCards()}
          </div>
        </CardContent>
      </Card>

      {/* Section Générer Rapport */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#10b981]" />
            <span>Générer Rapport</span>
          </CardTitle>
          <CardDescription>Créez des rapports personnalisés et détaillés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(
              [
                {
                  label: 'Performance',
                  icon: <Activity className="w-6 h-6" />,
                  title: 'Rapport Performance',
                  sub: 'Métriques détaillées',
                  className:
                    'h-auto p-4 flex flex-col items-center space-y-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white'
                },
                {
                  label: 'Clients',
                  icon: <Users className="w-6 h-6" />,
                  title: 'Rapport Clients',
                  sub: 'Analyse comportementale',
                  className:
                    'h-auto p-4 flex flex-col items-center space-y-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white'
                },
                {
                  label: 'Revenus',
                  icon: <TrendingUp className="w-6 h-6" />,
                  title: 'Rapport Revenus',
                  sub: 'Analyse financière',
                  className:
                    'h-auto p-4 flex flex-col items-center space-y-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white'
                },
                {
                  label: 'Comparatif',
                  icon: <LineChart className="w-6 h-6" />,
                  title: 'Rapport Comparatif',
                  sub: 'Évolution temporelle',
                  className:
                    'h-auto p-4 flex flex-col items-center space-y-2 border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white'
                },
                {
                  label: 'Prédictif',
                  icon: <Lightbulb className="w-6 h-6" />,
                  title: 'Rapport Prédictif',
                  sub: 'Prévisions IA',
                  className:
                    'h-auto p-4 flex flex-col items-center space-y-2 border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-white'
                },
                {
                  label: 'Personnalisé',
                  icon: <Zap className="w-6 h-6" />,
                  title: 'Rapport Personnalisé',
                  sub: 'Configuration libre',
                  className:
                    'h-auto p-4 flex flex-col items-center space-y-2 border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white'
                }
              ] as const
            ).map((item) => (
              <AnalyticsExportFormatMenu
                key={item.label}
                reportType={resolveVendorReportExportType(item.label)}
                onExport={onExportInsights}
                disabled={isLoading || !analytics}
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading || !analytics}
                  className={item.className}
                >
                  {item.icon}
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.sub}</span>
                </Button>
              </AnalyticsExportFormatMenu>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section Générer des Rapports - Boutons spécifiques */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#8b5cf6]" />
            <span>Générer des Rapports</span>
          </CardTitle>
          <CardDescription>Exportez vos données et générez des rapports détaillés pour vos équipes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {(
              [
                {
                  label: 'Synthèse',
                  icon: <FileText className="w-6 h-6" />,
                  title: 'Rapport Synthèse',
                  sub: "Vue d'ensemble complète",
                  className:
                    'flex-1 h-auto p-4 flex flex-col items-center space-y-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white'
                },
                {
                  label: 'Données Détaillées',
                  icon: <Download className="w-6 h-6" />,
                  title: 'Données Détaillées',
                  sub: 'Export complet des données',
                  className:
                    'flex-1 h-auto p-4 flex flex-col items-center space-y-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white'
                },
                {
                  label: 'Insights IA',
                  icon: <Lightbulb className="w-6 h-6" />,
                  title: 'Insights IA',
                  sub: 'Analyse prédictive avancée',
                  className:
                    'flex-1 h-auto p-4 flex flex-col items-center space-y-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white'
                }
              ] as const
            ).map((item) => (
              <AnalyticsExportFormatMenu
                key={item.label}
                reportType={resolveVendorReportExportType(item.label)}
                onExport={onExportInsights}
                disabled={isLoading || !analytics}
                contentClassName="w-56"
              >
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading || !analytics}
                  className={item.className}
                >
                  {item.icon}
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-gray-500">{item.sub}</span>
                </Button>
              </AnalyticsExportFormatMenu>
            ))}
          </div>
        </CardContent>
      </Card>

      {showNotification && (
        <div className={`fixed top-4 right-4 z-50 border rounded-lg p-4 shadow-lg max-w-sm ${
          notificationData.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notificationData.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          notificationData.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notificationData.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
               notificationData.type === 'error' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
               notificationData.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> :
               <CheckCircle className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">{notificationData.title}</h4>
              <p className="text-sm">{notificationData.message}</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modale d'export */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600]">Configuration de l'Export</DialogTitle>
            <DialogDescription>
              Personnalisez vos exports de données et rapports
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de données</Label>
                <Select value={exportOptions.type} onValueChange={(value) => setExportOptions(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les données</SelectItem>
                    <SelectItem value="sales">Ventes uniquement</SelectItem>
                    <SelectItem value="analytics">Analytics uniquement</SelectItem>
                    <SelectItem value="insights">Insights IA uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={exportOptions.format} onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale des filtres */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#8b5cf6]">Filtres Avancés</DialogTitle>
            <DialogDescription>
              Configurez des filtres personnalisés pour vos analyses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Période d'analyse</Label>
                <Select value={filterOptions.timeframe} onValueChange={(value) => setFilterOptions(prev => ({ ...prev, timeframe: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Semaine</SelectItem>
                    <SelectItem value="month">Mois</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="year">Année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Métrique principale</Label>
                <Select value={filterOptions.metric} onValueChange={(value) => setFilterOptions(prev => ({ ...prev, metric: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversion">Taux de conversion</SelectItem>
                    <SelectItem value="retention">Rétention client</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="revenue">Chiffre d'affaires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowFiltersModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => void handleApplyFilters()}
                disabled={isLoading}
                className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90"
              >
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale d'actualisation */}
      <Dialog open={showRefreshModal} onOpenChange={setShowRefreshModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#3b82f6]">Actualisation des Données</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir actualiser toutes les analyses avancées ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRefreshModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Actualisation...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Performance */}
      <Dialog open={showPerformanceReportModal} onOpenChange={setShowPerformanceReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#10b981]">Rapport Performance</DialogTitle>
            <DialogDescription>
              Configurez et générez un rapport détaillé sur les performances
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Période d'analyse</Label>
                <Select value={reportOptions.period} onValueChange={(value) => setReportOptions(prev => ({ ...prev, period: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Semaine</SelectItem>
                    <SelectItem value="month">Mois</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="year">Année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPerformanceReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Performance')}
                disabled={isGeneratingReport}
                className="bg-[#10b981] hover:bg-[#10b981]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Clients */}
      <Dialog open={showCustomerReportModal} onOpenChange={setShowCustomerReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#3b82f6]">Rapport Clients</DialogTitle>
            <DialogDescription>
              Analysez le comportement et la fidélité de vos clients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Segment de clients</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    <SelectItem value="new">Nouveaux clients</SelectItem>
                    <SelectItem value="returning">Clients fidèles</SelectItem>
                    <SelectItem value="vip">Clients VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCustomerReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Clients')}
                disabled={isGeneratingReport}
                className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Revenus */}
      <Dialog open={showRevenueReportModal} onOpenChange={setShowRevenueReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600]">Rapport Revenus</DialogTitle>
            <DialogDescription>
              Analysez vos performances financières et votre croissance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de revenus</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les revenus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les revenus</SelectItem>
                    <SelectItem value="product">Revenus produits</SelectItem>
                    <SelectItem value="service">Revenus services</SelectItem>
                    <SelectItem value="subscription">Abonnements</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRevenueReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Revenus')}
                disabled={isGeneratingReport}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Comparatif */}
      <Dialog open={showComparisonReportModal} onOpenChange={setShowComparisonReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#8b5cf6]">Rapport Comparatif</DialogTitle>
            <DialogDescription>
              Comparez vos performances sur différentes périodes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Période de comparaison</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Mois précédent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous_month">Mois précédent</SelectItem>
                    <SelectItem value="previous_quarter">Trimestre précédent</SelectItem>
                    <SelectItem value="previous_year">Année précédente</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowComparisonReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Comparatif')}
                disabled={isGeneratingReport}
                className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <LineChart className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Prédictif */}
      <Dialog open={showPredictiveReportModal} onOpenChange={setShowPredictiveReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#f59e0b]">Rapport Prédictif</DialogTitle>
            <DialogDescription>
              Prédictions et recommandations basées sur l'IA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Horizon de prédiction</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="3 mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_month">1 mois</SelectItem>
                    <SelectItem value="3_months">3 mois</SelectItem>
                    <SelectItem value="6_months">6 mois</SelectItem>
                    <SelectItem value="1_year">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPredictiveReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Prédictif')}
                disabled={isGeneratingReport}
                className="bg-[#f59e0b] hover:bg-[#f59e0b]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Personnalisé */}
      <Dialog open={showCustomReportModal} onOpenChange={setShowCustomReportModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#ef4444]">Rapport Personnalisé</DialogTitle>
            <DialogDescription>
              Créez un rapport entièrement personnalisé selon vos besoins
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre du rapport</Label>
              <Input placeholder="Ex: Analyse complète Q4 2024" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Métriques à inclure</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="sales" defaultChecked />
                    <Label htmlFor="sales">Ventes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="customers" defaultChecked />
                    <Label htmlFor="customers">Clients</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="revenue" defaultChecked />
                    <Label htmlFor="revenue">Revenus</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="analytics" />
                    <Label htmlFor="analytics">Analytics</Label>
                  </div>
                </div>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description personnalisée</Label>
              <Textarea placeholder="Ajoutez des notes ou commentaires pour ce rapport..." />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCustomReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Personnalisé')}
                disabled={isGeneratingReport}
                className="bg-[#ef4444] hover:bg-[#ef4444]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Synthèse */}
      <Dialog open={showSummaryReportModal} onOpenChange={setShowSummaryReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#10b981]">Rapport Synthèse</DialogTitle>
            <DialogDescription>
              Générez un rapport de synthèse complet avec vue d'ensemble
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Période de synthèse</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Mois en cours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mois en cours</SelectItem>
                    <SelectItem value="current_quarter">Trimestre en cours</SelectItem>
                    <SelectItem value="current_year">Année en cours</SelectItem>
                    <SelectItem value="last_12_months">12 derniers mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSummaryReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Synthèse')}
                disabled={isGeneratingReport}
                className="bg-[#10b981] hover:bg-[#10b981]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Données Détaillées */}
      <Dialog open={showDetailedDataModal} onOpenChange={setShowDetailedDataModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#3b82f6]">Données Détaillées</DialogTitle>
            <DialogDescription>
              Exportez l'ensemble de vos données avec options de filtrage avancées
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de données</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les données" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les données</SelectItem>
                    <SelectItem value="sales">Données de vente</SelectItem>
                    <SelectItem value="customers">Données clients</SelectItem>
                    <SelectItem value="products">Données produits</SelectItem>
                    <SelectItem value="analytics">Données analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format d'export</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Excel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Période d'export</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Date de début</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label className="text-sm">Date de fin</Label>
                  <Input type="date" />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDetailedDataModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Données Détaillées')}
                disabled={isGeneratingReport}
                className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Rapport Synthèse */}
      <Dialog open={showSummaryReportModal} onOpenChange={setShowSummaryReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#10b981]">Rapport Synthèse</DialogTitle>
            <DialogDescription>
              Générez un rapport de synthèse complet avec vue d'ensemble
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Période de synthèse</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Mois en cours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mois en cours</SelectItem>
                    <SelectItem value="current_quarter">Trimestre en cours</SelectItem>
                    <SelectItem value="current_year">Année en cours</SelectItem>
                    <SelectItem value="last_12_months">12 derniers mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format du rapport</Label>
                <Select value={reportOptions.format} onValueChange={(value) => setReportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSummaryReportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Synthèse')}
                disabled={isGeneratingReport}
                className="bg-[#10b981] hover:bg-[#10b981]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale Insights IA */}
      <Dialog open={showAIInsightsModal} onOpenChange={setShowAIInsightsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#ff6600]">Insights IA</DialogTitle>
            <DialogDescription>
              Analyse prédictive avancée et recommandations personnalisées
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type d'analyse IA</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Analyse prédictive" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="predictive">Analyse prédictive</SelectItem>
                    <SelectItem value="behavioral">Analyse comportementale</SelectItem>
                    <SelectItem value="sentiment">Analyse de sentiment</SelectItem>
                    <SelectItem value="optimization">Optimisation automatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Horizon de prédiction</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="6 mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_month">1 mois</SelectItem>
                    <SelectItem value="3_months">3 mois</SelectItem>
                    <SelectItem value="6_months">6 mois</SelectItem>
                    <SelectItem value="1_year">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Métriques à analyser</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="sales_prediction" defaultChecked />
                    <Label htmlFor="sales_prediction">Prédiction des ventes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="customer_churn" defaultChecked />
                    <Label htmlFor="customer_churn">Risque de churn</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="market_trends" />
                    <Label htmlFor="market_trends">Tendances du marché</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="optimization" />
                    <Label htmlFor="optimization">Recommandations d'optimisation</Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAIInsightsModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleGenerateReport('Insights IA')}
                disabled={isGeneratingReport}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
              >
                {isGeneratingReport ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
