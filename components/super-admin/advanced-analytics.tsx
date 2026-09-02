"use client"

import { useState, useEffect } from 'react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, TrendingUp, Users, ShoppingCart, DollarSign, Activity, Download, 
  Filter, Calendar, PieChart, LineChart, Target, CheckCircle, Eye, Settings,
  RefreshCw, FileText, Mail, Clock, AlertTriangle
} from 'lucide-react'
import { useNotifications } from '@/components/ui/modern-notification'

function resolveCategoryColorClass(categoryId: string): string {
  const palette = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-lime-500',
    'bg-orange-500'
  ]

  const raw = typeof categoryId === 'string' ? categoryId : ''
  if (!raw) return 'bg-gray-500'

  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  }
  return palette[hash % palette.length] ?? 'bg-gray-500'
}

function resolvePaletteColorClass(key: string): string {
  const palette = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-amber-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-lime-500',
    'bg-orange-500'
  ]

  const raw = typeof key === 'string' ? key : ''
  if (!raw) return 'bg-gray-500'

  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
  }
  return palette[hash % palette.length] ?? 'bg-gray-500'
}

// Interfaces pour les données d'analytics
interface PeriodOption {
  value: string
  label: string
  description: string
}

interface ExportOption {
  id: string
  type: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  downloadUrl?: string
  fileSize?: string
}

interface ReportConfig {
  id: string
  name: string
  description: string
  type: string
  period: string
  format: string
  sections: string[]
  schedule?: {
    enabled: boolean
    frequency: string
    time: string
    recipients: string[]
  }
  isActive: boolean
}

interface AdvancedAnalyticsApiResponse {
  period: {
    key: string
    startIso: string
    endIso: string
    compareStartIso: string
    compareEndIso: string
  }
  kpis: {
    growthPercent: number
    activeUsers: number
    ordersCount: number
    revenue: number
  }
  sales: {
    revenue: number
    ordersCount: number
    uniqueCustomers: number
    avgOrderValue: number
    compare: {
      revenue: number
      ordersCount: number
      uniqueCustomers: number
      avgOrderValue: number
    }
    changePercent: {
      revenue: number
      ordersCount: number
      uniqueCustomers: number
      avgOrderValue: number
    }
  }
  users: {
    activeCustomers: number
    newUsers: number
    compare: {
      activeCustomers: number
      newUsers: number
    }
    changePercent: {
      activeCustomers: number
      newUsers: number
    }
    countries: Array<{ label: string; count: number; percent: number }>
  }
  visits: {
    pageViews: number
    compare: {
      pageViews: number
    }
    changePercent: {
      pageViews: number
    }
    conversionRate: number
    compareConversionRate: number
    conversionRateChangePercent: number
  }
  reviews: {
    averageRating: number
    reviewCount: number
    compare: {
      averageRating: number
      reviewCount: number
    }
    changePercent: {
      averageRating: number
      reviewCount: number
    }
  }
  webVitals: {
    pageLoad: {
      p75LcpMs: number | null
      p75InpMs: number | null
      p75Cls: number | null
      coreWebVitalsStatus: 'good' | 'needs-improvement' | 'poor' | null
    }
    compare: {
      pageLoad: {
        p75LcpMs: number | null
        p75InpMs: number | null
        p75Cls: number | null
        coreWebVitalsStatus: 'good' | 'needs-improvement' | 'poor' | null
      }
    }
    changePercent: {
      p75LcpMs: number
    }
  }
  uptime: {
    availabilityPercent: number
    avgLatencyMs: number | null
    totalChecks: number
    compare: {
      availabilityPercent: number
      avgLatencyMs: number | null
      totalChecks: number
    }
    changePercent: {
      availabilityPercent: number
      avgLatencyMs: number
      totalChecks: number
    }
  }
  salesByCategory: Array<{
    categoryId: string
    name: string
    revenue: number
    orders: number
    sharePercent: number
  }>
  topProducts: Array<{
    productId: string
    name: string
    categoryId: string | null
    categoryName: string | null
    revenue: number
    sales: number
    growthPercent: number
  }>
  system: {
    activeConnections: number | null
    storageUsedBytes: number | null
  }
  timeseries: Array<{
    date: string
    revenue: number
    orders: number
  }>
}

export default function AdvancedAnalytics() {
  // États pour les fonctionnalités
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isLoading, setIsLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AdvancedAnalyticsApiResponse | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  
  // États pour les modales
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  
  // États pour les modales des rapports spécifiques
  const [showSalesReportModal, setShowSalesReportModal] = useState(false)
  const [showUsersReportModal, setShowUsersReportModal] = useState(false)
  const [showProductsReportModal, setShowProductsReportModal] = useState(false)
  const [showPerformanceReportModal, setShowPerformanceReportModal] = useState(false)
  const [showMarketingReportModal, setShowMarketingReportModal] = useState(false)
  const [showCompleteReportModal, setShowCompleteReportModal] = useState(false)
  
  // États pour les données
  const [exportHistory, setExportHistory] = useState<ExportOption[]>([])
  const [reports, setReports] = useState<ReportConfig[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  // États pour la génération des rapports spécifiques
  const [isGeneratingSalesReport, setIsGeneratingSalesReport] = useState(false)
  const [isGeneratingUsersReport, setIsGeneratingUsersReport] = useState(false)
  const [isGeneratingProductsReport, setIsGeneratingProductsReport] = useState(false)
  const [isGeneratingPerformanceReport, setIsGeneratingPerformanceReport] = useState(false)
  const [isGeneratingMarketingReport, setIsGeneratingMarketingReport] = useState(false)
  const [isGeneratingCompleteReport, setIsGeneratingCompleteReport] = useState(false)
  
  // États pour les formulaires
  const [exportConfig, setExportConfig] = useState({
    type: 'all',
    format: 'pdf',
    dateRange: 'custom',
    startDate: '',
    endDate: '',
    includeCharts: true,
    includeRawData: false
  })

  const normalizeExportFormat = (format: string): 'csv' | 'pdf' => {
    const value = String(format ?? '').toLowerCase().trim()
    return value === 'csv' ? 'csv' : 'pdf'
  }

  const normalizeExportType = (type: string): 'all' | 'sales' | 'users' => {
    const value = String(type ?? '').toLowerCase().trim()
    if (value === 'sales') return 'sales'
    if (value === 'users') return 'users'
    return 'all'
  }
  
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    type: 'sales',
    period: '30d',
    format: 'pdf',
    sections: ['overview', 'sales', 'users'],
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      recipients: ['admin@exemple.com']
    }
  })

  // Configurations spécifiques pour chaque type de rapport
  const [salesReportConfig, setSalesReportConfig] = useState({
    period: '30d',
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    metrics: ['revenue', 'orders', 'conversion', 'trends'],
    groupBy: 'category',
    comparison: 'previous_period'
  })

  const [usersReportConfig, setUsersReportConfig] = useState({
    period: '30d',
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    metrics: ['active_users', 'new_users', 'engagement', 'demographics'],
    groupBy: 'age_group',
    comparison: 'previous_period'
  })

  const [productsReportConfig, setProductsReportConfig] = useState({
    period: '30d',
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    metrics: ['sales_volume', 'revenue', 'performance', 'inventory'],
    groupBy: 'category',
    comparison: 'previous_period'
  })

  const [performanceReportConfig, setPerformanceReportConfig] = useState({
    period: '30d',
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    metrics: ['page_load', 'api_response', 'uptime', 'errors'],
    groupBy: 'service',
    comparison: 'previous_period'
  })

  const [marketingReportConfig, setMarketingReportConfig] = useState({
    period: '30d',
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    metrics: ['campaign_performance', 'roi', 'conversion', 'reach'],
    groupBy: 'campaign_type',
    comparison: 'previous_period'
  })

  const [completeReportConfig, setCompleteReportConfig] = useState({
    period: '30d',
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    sections: ['overview', 'sales', 'users', 'products', 'performance', 'marketing'],
    executive_summary: true,
    recommendations: true
  })

  // Options de période
  const periodOptions: PeriodOption[] = [
    { value: '7d', label: '7 derniers jours', description: 'Données de la semaine passée' },
    { value: '30d', label: '30 derniers jours', description: 'Données du mois passé' },
    { value: '90d', label: '3 derniers mois', description: 'Données trimestrielles' },
    { value: '6m', label: '6 derniers mois', description: 'Données semestrielles' },
    { value: '1y', label: '1 an', description: 'Données annuelles' },
    { value: 'custom', label: 'Période personnalisée', description: 'Choisir des dates spécifiques' }
  ]

  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()
  const { confirm } = useConfirm()

  /**
   * Formate une valeur numérique en string (avec séparateur FR).
   */
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(Number.isFinite(value) ? value : 0)
  }

  /**
   * Formate un montant FCFA.
   */
  const formatFcfa = (value: number) => {
    const n = Number.isFinite(value) ? value : 0
    return `${formatNumber(Math.round(n))} FCFA`
  }

  /**
   * Formate une taille en octets (ko/Mo/Go) lisible.
   */
  const formatBytes = (bytes: number) => {
    const n = Number.isFinite(bytes) ? bytes : 0
    if (n <= 0) return '0 o'
    const units = ['o', 'Ko', 'Mo', 'Go', 'To']
    const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)))
    const value = n / Math.pow(1024, i)
    return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[i]}`
  }

  /**
   * Charge les analytics depuis l'API Super Admin.
   */
  const loadAdvancedAnalytics = async (period: string, startDate?: string, endDate?: string) => {
    setIsLoading(true)
    setAnalyticsError(null)
    try {
      let url = `/api/super-admin/advanced-analytics?period=${encodeURIComponent(period)}`
      if (period === 'custom') {
        if (startDate) url += `&start=${encodeURIComponent(startDate)}`
        if (endDate) url += `&end=${encodeURIComponent(endDate)}`
      }
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors du chargement des analytics.'
        throw new Error(msg)
      }

      const data = (json as any)?.data as AdvancedAnalyticsApiResponse | undefined
      if (!data) {
        throw new Error('Réponse API invalide (data manquant).')
      }

      setAnalyticsData(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue.'
      setAnalyticsError(message)
      addNotification({
        type: 'error',
        title: 'Analytics',
        message
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Charger les analytics à l'initialisation et lors du changement de période.
  useEffect(() => {
    if (selectedPeriod === 'custom') {
      void loadAdvancedAnalytics('custom', exportConfig.startDate || undefined, exportConfig.endDate || undefined)
    } else {
      void loadAdvancedAnalytics(selectedPeriod)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])

  // Charger l'historique export + rapports depuis l'API (pas de données mock)
  useEffect(() => {
    const load = async () => {
      try {
        const [exportsRes, reportsRes] = await Promise.all([
          fetch('/api/super-admin/analytics-exports?limit=30', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }),
          fetch('/api/super-admin/analytics-reports?limit=200', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
        ])

        const exportsJson = await exportsRes.json().catch(() => null)
        if (exportsRes.ok) {
          const items = ((exportsJson as any)?.data ?? []) as ExportOption[]
          setExportHistory(Array.isArray(items) ? items : [])
        }

        const reportsJson = await reportsRes.json().catch(() => null)
        if (reportsRes.ok) {
          const items = ((reportsJson as any)?.data ?? []) as ReportConfig[]
          setReports(Array.isArray(items) ? items : [])
        }
      } catch {
        // Pas bloquant
      }
    }

    void load()
  }, [])

  // Fonctions pour la gestion des périodes
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    addNotification({
      type: 'success',
      title: 'Période mise à jour',
      message: `Données mises à jour pour la période: ${periodOptions.find(p => p.value === period)?.label}`
    })
  }

  const openPeriodModal = () => {
    setShowPeriodModal(true)
  }

  // Fonctions pour l'export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const safeFormat = normalizeExportFormat(exportConfig.format)
      const safeType = normalizeExportType(exportConfig.type)
      const res = await fetch('/api/super-admin/analytics-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: safeType,
          format: safeFormat,
          period: selectedPeriod,
          startDate: exportConfig.startDate || null,
          endDate: exportConfig.endDate || null,
          includeCharts: exportConfig.includeCharts,
          includeRawData: exportConfig.includeRawData
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : "Erreur lors de l'export"
        throw new Error(msg)
      }

      const newExport = (json as any)?.data as ExportOption | undefined
      if (newExport) {
        setExportHistory((prev) => [newExport, ...prev])
        if (newExport.downloadUrl) {
          window.open(newExport.downloadUrl, '_blank')
        }
      }
      addNotification({
        type: 'success',
        title: 'Export terminé',
        message: 'Export terminé avec succès !'
      })
      setShowExportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Erreur lors de l\'export'
      })
    } finally {
      setIsExporting(false)
    }
  }

  const downloadExport = (exportId: string) => {
    const exportItem = exportHistory.find(e => e.id === exportId)
    if (exportItem && exportItem.downloadUrl) {
      window.open(exportItem.downloadUrl, '_blank')
      addNotification({
        type: 'info',
        title: 'Téléchargement',
        message: 'Téléchargement démarré !'
      })
    }
  }

  // Fonctions pour les rapports
  const handleCreateReport = async () => {
    setIsGeneratingReport(true)
    try {
      const newReport: ReportConfig = {
        id: Date.now().toString(),
        name: reportConfig.name,
        description: reportConfig.description,
        type: reportConfig.type,
        period: reportConfig.period,
        format: reportConfig.format,
        sections: reportConfig.sections,
        schedule: reportConfig.schedule,
        isActive: true
      }

      const res = await fetch('/api/super-admin/analytics-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la création du rapport'
        throw new Error(msg)
      }

      const created = (json as any)?.data as ReportConfig | undefined
      setReports((prev) => [created ?? newReport, ...prev])
      addNotification({
        type: 'success',
        title: 'Rapport créé',
        message: 'Nouveau rapport créé avec succès !'
      })
      setShowReportModal(false)
      
      // Réinitialiser le formulaire
      setReportConfig({
        name: '',
        description: '',
        type: 'sales',
        period: '30d',
        format: 'pdf',
        sections: ['overview', 'sales', 'users'],
        schedule: {
          enabled: false,
          frequency: 'weekly',
          time: '09:00',
          recipients: ['admin@exemple.com']
        }
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de création',
        message: 'Erreur lors de la création du rapport'
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const toggleReportStatus = async (reportId: string) => {
    const next = reports.find((r) => r.id === reportId)
    if (!next) return

    const isActive = !next.isActive
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, isActive } : r)))

    try {
      const res = await fetch(`/api/super-admin/analytics-reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String((json as any)?.error ?? 'Échec de la mise à jour'))
      }
      addNotification({
        type: 'success',
        title: 'Rapport',
        message: isActive ? 'Rapport activé.' : 'Rapport désactivé.'
      })
    } catch (error) {
      // Revenir à l'état persistant en base en cas d'échec.
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, isActive: next.isActive } : r)))
      addNotification({
        type: 'error',
        title: 'Rapport',
        message: error instanceof Error ? error.message : "Impossible de modifier le rapport."
      })
    }
  }

  const deleteReport = async (reportId: string) => {
    const accepted = await confirm({
      title: 'Supprimer le rapport',
      message: 'Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    try {
      const res = await fetch(`/api/super-admin/analytics-reports/${encodeURIComponent(reportId)}`, {
        method: 'DELETE'
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la suppression'
        throw new Error(msg)
      }

      setReports(prev => prev.filter(report => report.id !== reportId))
      addNotification({
        type: 'success',
        title: 'Rapport supprimé',
        message: 'Le rapport a été supprimé avec succès.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de suppression',
        message: 'Erreur lors de la suppression du rapport'
      })
    }
  }

  // Fonctions pour la génération des rapports spécifiques
  const generateSalesReport = async () => {
    setIsGeneratingSalesReport(true)
    try {
      const safeFormat = normalizeExportFormat(salesReportConfig.format)
      const res = await fetch('/api/super-admin/analytics-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'sales',
          format: safeFormat,
          period: salesReportConfig.period,
          includeCharts: salesReportConfig.includeCharts,
          includeRawData: salesReportConfig.includeRawData
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la génération du rapport des ventes'
        throw new Error(msg)
      }

      const item = (json as any)?.data as ExportOption | undefined
      if (item) {
        setExportHistory((prev) => [item, ...prev])
        if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank')
        }
      }

      addNotification({ type: 'success', title: 'Rapport des ventes', message: 'Rapport des ventes généré avec succès !' })
      setShowSalesReportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Erreur lors de la génération du rapport des ventes'
      })
    } finally {
      setIsGeneratingSalesReport(false)
    }
  }

  const generateUsersReport = async () => {
    setIsGeneratingUsersReport(true)
    try {
      const safeFormat = normalizeExportFormat(usersReportConfig.format)
      const res = await fetch('/api/super-admin/analytics-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'users',
          format: safeFormat,
          period: usersReportConfig.period,
          includeCharts: usersReportConfig.includeCharts,
          includeRawData: usersReportConfig.includeRawData
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la génération du rapport des utilisateurs'
        throw new Error(msg)
      }

      const item = (json as any)?.data as ExportOption | undefined
      if (item) {
        setExportHistory((prev) => [item, ...prev])
        if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank')
        }
      }

      addNotification({ type: 'success', title: 'Rapport des utilisateurs', message: 'Rapport des utilisateurs généré avec succès !' })
      setShowUsersReportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Erreur lors de la génération du rapport des utilisateurs'
      })
    } finally {
      setIsGeneratingUsersReport(false)
    }
  }

  const generateProductsReport = async () => {
    setIsGeneratingProductsReport(true)
    try {
      const safeFormat = normalizeExportFormat(productsReportConfig.format)
      const res = await fetch('/api/super-admin/analytics-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'all',
          format: safeFormat,
          period: productsReportConfig.period,
          includeCharts: productsReportConfig.includeCharts,
          includeRawData: productsReportConfig.includeRawData
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la génération du rapport des produits'
        throw new Error(msg)
      }

      const item = (json as any)?.data as ExportOption | undefined
      if (item) {
        setExportHistory((prev) => [item, ...prev])
        if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank')
        }
      }

      addNotification({ type: 'success', title: 'Rapport des produits', message: 'Rapport des produits généré avec succès !' })
      setShowProductsReportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Erreur lors de la génération du rapport des produits'
      })
    } finally {
      setIsGeneratingProductsReport(false)
    }
  }

  const generatePerformanceReport = async () => {
    setIsGeneratingPerformanceReport(true)
    try {
      const res = await fetch('/api/super-admin/analytics-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'all',
          format: 'pdf',
          period: '30d',
          includeCharts: true,
          includeRawData: false
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la génération du rapport de performance'
        throw new Error(msg)
      }

      const item = (json as any)?.data as ExportOption | undefined
      if (item) {
        setExportHistory((prev) => [item, ...prev])
        if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank')
        }
      }

      addNotification({ type: 'success', title: 'Rapport de performance', message: 'Rapport de performance généré avec succès !' })
      setShowPerformanceReportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Erreur lors de la génération du rapport de performance'
      })
    } finally {
      setIsGeneratingPerformanceReport(false)
    }
  }

  const generateMarketingReport = async () => {
    setIsGeneratingMarketingReport(true)
    try {
      const res = await fetch('/api/super-admin/analytics-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'all',
          format: 'pdf',
          period: '30d',
          includeCharts: true,
          includeRawData: false
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la génération du rapport marketing'
        throw new Error(msg)
      }

      const item = (json as any)?.data as ExportOption | undefined
      if (item) {
        setExportHistory((prev) => [item, ...prev])
        if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank')
        }
      }

      addNotification({ type: 'success', title: 'Rapport marketing', message: 'Rapport marketing généré avec succès !' })
      setShowMarketingReportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Erreur lors de la génération du rapport marketing'
      })
    } finally {
      setIsGeneratingMarketingReport(false)
    }
  }

  const generateCompleteReport = async () => {
    setIsGeneratingCompleteReport(true)
    try {
      const res = await fetch('/api/super-admin/analytics-exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exportType: 'all',
          format: 'pdf',
          period: '30d',
          includeCharts: true,
          includeRawData: false
        })
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (json as any)?.error ? String((json as any).error) : 'Erreur lors de la génération du rapport complet'
        throw new Error(msg)
      }

      const item = (json as any)?.data as ExportOption | undefined
      if (item) {
        setExportHistory((prev) => [item, ...prev])
        if (item.downloadUrl) {
          window.open(item.downloadUrl, '_blank')
        }
      }

      addNotification({ type: 'success', title: 'Rapport complet', message: 'Rapport complet généré avec succès !' })
      setShowCompleteReportModal(false)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de génération',
        message: 'Erreur lors de la génération du rapport complet'
      })
    } finally {
      setIsGeneratingCompleteReport(false)
    }
  }

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Statistiques & Analyses Avancées</h2>
            <p className="text-gray-600 mt-2">
              Tableaux de bord complets, visualisations graphiques et analyses détaillées
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline"
              onClick={openPeriodModal}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Période ({periodOptions.find(p => p.value === selectedPeriod)?.label || '30 jours'})
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => setShowReportModal(true)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Nouveau Rapport
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">
                  {analyticsData ? `${analyticsData.kpis.growthPercent >= 0 ? '+' : ''}${analyticsData.kpis.growthPercent.toFixed(1)}%` : '--'}
                </p>
                <p className="text-sm text-gray-600">Croissance mensuelle</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{analyticsData ? formatNumber(analyticsData.kpis.activeUsers) : '--'}</p>
                <p className="text-sm text-gray-600">Utilisateurs actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{analyticsData ? formatNumber(analyticsData.kpis.ordersCount) : '--'}</p>
                <p className="text-sm text-gray-600">Commandes ce mois</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{analyticsData ? formatFcfa(analyticsData.kpis.revenue) : '--'}</p>
                <p className="text-sm text-gray-600">Chiffre d'affaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="ventes">Ventes</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="rapports">Rapports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Ventes</CardTitle>
                <CardDescription>
                  Tendances mensuelles et prévisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsError ? (
                  <div className="text-sm text-red-600">{analyticsError}</div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const points = (analyticsData?.timeseries ?? []).slice(-3)
                      const max = points.reduce((acc, p) => Math.max(acc, p.revenue), 0)
                      if (points.length === 0) {
                        return <div className="text-sm text-gray-600">Aucune donnée disponible.</div>
                      }
                      return points.map((p) => {
                        const pct = max > 0 ? Math.round((p.revenue / max) * 100) : 0
                        return (
                          <div key={p.date} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{p.date}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-sm text-gray-600">{pct}%</span>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des Ventes</CardTitle>
                <CardDescription>
                  Par catégorie et région
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsError ? (
                  <div className="text-sm text-red-600">{analyticsError}</div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const rows = (analyticsData?.salesByCategory ?? []).slice(0, 3)
                      if (rows.length === 0) {
                        return <div className="text-sm text-gray-600">Aucune donnée disponible.</div>
                      }
                      return rows.map((row, idx) => (
                        <div key={row.categoryId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 ${resolveCategoryColorClass(row.categoryId)} rounded-full`}></div>
                            <span className="text-sm">{row.name}</span>
                          </div>
                          <span className="text-sm font-medium">{row.sharePercent}%</span>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métriques Clés</CardTitle>
              <CardDescription>
                Indicateurs de performance principaux
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData ? `${analyticsData.visits.conversionRate.toFixed(2)}%` : '--'}
                  </p>
                  <p className="text-sm text-gray-600">Taux de conversion</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData
                      ? `${Number.isFinite(analyticsData.reviews.averageRating) ? analyticsData.reviews.averageRating.toFixed(1) : '0.0'}/5`
                      : '--'}
                  </p>
                  <p className="text-sm text-gray-600">Note moyenne</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData && analyticsData.webVitals.pageLoad.p75LcpMs != null
                      ? `${analyticsData.webVitals.pageLoad.p75LcpMs}ms`
                      : '--'}
                  </p>
                  <p className="text-sm text-gray-600">Temps de chargement</p>
                  <p className="text-xs text-gray-500">
                    {analyticsData && analyticsData.webVitals.pageLoad.p75LcpMs != null
                      ? `${analyticsData.webVitals.changePercent.p75LcpMs >= 0 ? '+' : ''}${analyticsData.webVitals.changePercent.p75LcpMs.toFixed(1)}% vs période précédente`
                      : '--'}
                  </p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {analyticsData && analyticsData.uptime.totalChecks > 0
                      ? `${analyticsData.uptime.availabilityPercent.toFixed(1)}%`
                      : '--'}
                  </p>
                  <p className="text-sm text-gray-600">Disponibilité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ventes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Ventes</CardTitle>
              <CardDescription>
                Détails des performances commerciales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">Ventes Totales</p>
                    <p className="text-sm text-gray-600">Ce mois vs mois précédent</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${analyticsData && analyticsData.sales.changePercent.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analyticsData ? `${analyticsData.sales.changePercent.revenue >= 0 ? '+' : ''}${analyticsData.sales.changePercent.revenue.toFixed(1)}%` : '--'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {analyticsData
                        ? `${formatFcfa(analyticsData.sales.revenue)} vs ${formatFcfa(analyticsData.sales.compare.revenue)}`
                        : '--'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-lg font-medium">Commandes</p>
                    <p className="text-3xl font-bold text-blue-600">{analyticsData ? formatNumber(analyticsData.sales.ordersCount) : '--'}</p>
                    <p className="text-sm text-gray-600">
                      {analyticsData
                        ? `${analyticsData.sales.changePercent.ordersCount >= 0 ? '+' : ''}${analyticsData.sales.changePercent.ordersCount.toFixed(1)}% vs période précédente`
                        : '--'}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-lg font-medium">Panier Moyen</p>
                    <p className="text-3xl font-bold text-green-600">{analyticsData ? formatFcfa(analyticsData.sales.avgOrderValue) : '--'}</p>
                    <p className="text-sm text-gray-600">
                      {analyticsData
                        ? `${analyticsData.sales.changePercent.avgOrderValue >= 0 ? '+' : ''}${analyticsData.sales.changePercent.avgOrderValue.toFixed(1)}% vs période précédente`
                        : '--'}
                    </p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-lg font-medium">Clients Uniques</p>
                    <p className="text-3xl font-bold text-purple-600">{analyticsData ? formatNumber(analyticsData.sales.uniqueCustomers) : '--'}</p>
                    <p className="text-sm text-gray-600">
                      {analyticsData
                        ? `${analyticsData.sales.changePercent.uniqueCustomers >= 0 ? '+' : ''}${analyticsData.sales.changePercent.uniqueCustomers.toFixed(1)}% vs période précédente`
                        : '--'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilisateurs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyse des Utilisateurs</CardTitle>
              <CardDescription>
                Comportement et engagement des utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Démographie</h4>
                  <div className="space-y-3">
                    {analyticsError ? (
                      <div className="text-sm text-red-600">{analyticsError}</div>
                    ) : (analyticsData?.users?.countries ?? []).length === 0 ? (
                      <div className="text-sm text-gray-600">Aucune donnée démographique disponible.</div>
                    ) : (
                      (analyticsData?.users?.countries ?? []).slice(0, 3).map((row, idx) => {
                        return (
                          <div key={`${row.label}-${idx}`} className="flex items-center justify-between">
                            <span className="text-sm">{row.label}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`${resolvePaletteColorClass(row.label)} h-2 rounded-full`}
                                  style={{ width: `${row.percent}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{row.percent}%</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Engagement</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">Clients actifs</span>
                      <span className="font-medium">{analyticsData ? formatNumber(analyticsData.users.activeCustomers) : '--'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">Nouveaux utilisateurs</span>
                      <span className="font-medium">{analyticsData ? formatNumber(analyticsData.users.newUsers) : '--'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm">Variation (nouveaux)</span>
                      <span className={`font-medium ${analyticsData && analyticsData.users.changePercent.newUsers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsData
                          ? `${analyticsData.users.changePercent.newUsers >= 0 ? '+' : ''}${analyticsData.users.changePercent.newUsers.toFixed(1)}%`
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="produits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance des Produits</CardTitle>
              <CardDescription>
                Analyse des produits les plus performants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(analyticsData?.topProducts ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucune donnée produit disponible</p>
                ) : (
                  (analyticsData?.topProducts ?? []).map((product) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {product.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.categoryName ?? 'Sans catégorie'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Ventes</p>
                          <p className="font-medium">{formatNumber(product.sales)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Revenus</p>
                          <p className="font-medium">{formatFcfa(product.revenue)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Croissance</p>
                          <p className={`font-medium ${
                            product.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {product.growthPercent >= 0 ? '+' : ''}{product.growthPercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Système</CardTitle>
              <CardDescription>
                Métriques techniques et performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Web</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Temps de chargement</span>
                      <span className="font-medium">
                        {analyticsData && analyticsData.webVitals.pageLoad.p75LcpMs != null
                          ? `${analyticsData.webVitals.pageLoad.p75LcpMs}ms`
                          : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Évolution vs période précédente</span>
                      <span className="text-sm text-gray-600">
                        {analyticsData && analyticsData.webVitals.pageLoad.p75LcpMs != null
                          ? `${analyticsData.webVitals.changePercent.p75LcpMs >= 0 ? '+' : ''}${analyticsData.webVitals.changePercent.p75LcpMs.toFixed(1)}%`
                          : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Core Web Vitals</span>
                      <Badge variant="default">
                        {(() => {
                          const status = analyticsData?.webVitals?.pageLoad?.coreWebVitalsStatus ?? null
                          if (status === 'good') return 'Bon'
                          if (status === 'needs-improvement') return 'Moyen'
                          if (status === 'poor') return 'Mauvais'
                          return '--'
                        })()}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Disponibilité</span>
                      <span className="font-medium">
                        {analyticsData && analyticsData.uptime.totalChecks > 0
                          ? `${analyticsData.uptime.availabilityPercent.toFixed(1)}%`
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Base de Données</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Temps de réponse</span>
                      <span className="font-medium">
                        {analyticsData && analyticsData.uptime.totalChecks > 0 && analyticsData.uptime.avgLatencyMs != null
                          ? `${analyticsData.uptime.avgLatencyMs}ms`
                          : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connexions actives</span>
                      <span className="font-medium">
                        {analyticsData && analyticsData.system.activeConnections != null
                          ? formatNumber(analyticsData.system.activeConnections)
                          : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Espace utilisé</span>
                      <span className="font-medium">
                        {analyticsData && analyticsData.system.storageUsedBytes != null
                          ? formatBytes(analyticsData.system.storageUsedBytes)
                          : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rapports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Génération de Rapports</CardTitle>
              <CardDescription>
                Création et export de rapports personnalisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all hover:border-emerald-300"
                  onClick={() => setShowSalesReportModal(true)}
                >
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <span>Rapport Ventes</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all hover:border-blue-300"
                  onClick={() => setShowUsersReportModal(true)}
                >
                  <Users className="h-6 w-6 text-green-600" />
                  <span>Rapport Utilisateurs</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all hover:border-purple-300"
                  onClick={() => setShowProductsReportModal(true)}
                >
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                  <span>Rapport Produits</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all hover:border-orange-300"
                  onClick={() => setShowPerformanceReportModal(true)}
                >
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  <span>Rapport Performance</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all hover:border-red-300"
                  onClick={() => setShowMarketingReportModal(true)}
                >
                  <Target className="h-6 w-6 text-red-600" />
                  <span>Rapport Marketing</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all hover:border-emerald-300"
                  onClick={() => setShowCompleteReportModal(true)}
                >
                  <Activity className="h-6 w-6 text-emerald-600" />
                  <span>Rapport Complet</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de sélection de période */}
      <Dialog open={showPeriodModal} onOpenChange={setShowPeriodModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Sélection de la Période d'Analyse
            </DialogTitle>
            <DialogDescription>
              Choisissez la période pour laquelle vous souhaitez afficher les données
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {periodOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                    selectedPeriod === option.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                  onClick={() => handlePeriodChange(option.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{option.label}</h4>
                    {selectedPeriod === option.value && (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              ))}
            </div>
            
            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-4 p-4 border border-emerald-200 rounded-lg bg-emerald-50">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={exportConfig.startDate}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={exportConfig.endDate}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPeriodModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setShowPeriodModal(false)
                  if (selectedPeriod === 'custom') {
                    void loadAdvancedAnalytics('custom', exportConfig.startDate || undefined, exportConfig.endDate || undefined)
                  }
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'export */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" />
              Exporter les Données d'Analyse
            </DialogTitle>
            <DialogDescription>
              Configurez et exportez vos données selon vos besoins
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration de l'Export</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="exportType">Type de données</Label>
                    <Select 
                      value={exportConfig.type} 
                      onValueChange={(value) => setExportConfig(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Données complètes</SelectItem>
                        <SelectItem value="sales">Données de ventes</SelectItem>
                        <SelectItem value="users">Analytics utilisateurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Format d'export</Label>
                    <Select 
                      value={exportConfig.format} 
                      onValueChange={(value) => setExportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeCharts"
                        checked={exportConfig.includeCharts}
                        onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeCharts: checked }))}
                      />
                      <Label htmlFor="includeCharts">Inclure les graphiques</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeRawData"
                        checked={exportConfig.includeRawData}
                        onCheckedChange={(checked) => setExportConfig(prev => ({ ...prev, includeRawData: checked }))}
                      />
                      <Label htmlFor="includeRawData">Inclure les données brutes</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Historique des Exports</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {exportHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucun export récent</p>
                  ) : (
                    exportHistory.map((exportItem) => (
                      <div key={exportItem.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            exportItem.status === 'completed' ? 'bg-green-500' :
                            exportItem.status === 'processing' ? 'bg-yellow-500' :
                            exportItem.status === 'failed' ? 'bg-red-500' : 'bg-gray-500'
                          }`} />
                          <div>
                            <p className="text-sm font-medium">{exportItem.type}</p>
                            <p className="text-xs text-gray-500">{formatDate(exportItem.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={exportItem.status === 'completed' ? 'default' : 
                                         exportItem.status === 'processing' ? 'secondary' : 'destructive'}>
                            {exportItem.status === 'completed' ? 'Terminé' : 
                             exportItem.status === 'processing' ? 'En cours' : 'Échec'}
                          </Badge>
                          {exportItem.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => downloadExport(exportItem.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Lancer l'Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport des ventes */}
      <Dialog open={showSalesReportModal} onOpenChange={setShowSalesReportModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Rapport des Ventes
            </DialogTitle>
            <DialogDescription>
              Configurez et générez un rapport détaillé sur les performances de ventes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration du Rapport</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="salesPeriod">Période d'analyse</Label>
                    <Select 
                      value={salesReportConfig.period} 
                      onValueChange={(value) => setSalesReportConfig(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="90d">3 derniers mois</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salesFormat">Format du rapport</Label>
                    <Select 
                      value={salesReportConfig.format} 
                      onValueChange={(value) => setSalesReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salesGroupBy">Grouper par</Label>
                    <Select 
                      value={salesReportConfig.groupBy} 
                      onValueChange={(value) => setSalesReportConfig(prev => ({ ...prev, groupBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="category">Catégorie</SelectItem>
                        <SelectItem value="region">Région</SelectItem>
                        <SelectItem value="vendor">Vendeur</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Métriques à Inclure</h4>
                
                <div className="space-y-3">
                  {['revenue', 'orders', 'conversion', 'trends'].map((metric) => (
                    <div key={metric} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`sales-${metric}`}
                        checked={salesReportConfig.metrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSalesReportConfig(prev => ({
                              ...prev,
                              metrics: [...prev.metrics, metric]
                            }))
                          } else {
                            setSalesReportConfig(prev => ({
                              ...prev,
                              metrics: prev.metrics.filter(m => m !== metric)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`sales-${metric}`} className="capitalize">
                        {metric === 'revenue' ? 'Chiffre d\'affaires' :
                         metric === 'orders' ? 'Commandes' :
                         metric === 'conversion' ? 'Taux de conversion' : 'Tendances'}
                      </Label>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="salesIncludeCharts"
                        checked={salesReportConfig.includeCharts}
                        onCheckedChange={(checked) => setSalesReportConfig(prev => ({ ...prev, includeCharts: checked }))}
                      />
                      <Label htmlFor="salesIncludeCharts">Inclure les graphiques</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="salesIncludeRawData"
                        checked={salesReportConfig.includeRawData}
                        onCheckedChange={(checked) => setSalesReportConfig(prev => ({ ...prev, includeRawData: checked }))}
                      />
                      <Label htmlFor="salesIncludeRawData">Inclure les données brutes</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowSalesReportModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={generateSalesReport}
                disabled={isGeneratingSalesReport}
              >
                {isGeneratingSalesReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Générer le Rapport
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport des utilisateurs */}
      <Dialog open={showUsersReportModal} onOpenChange={setShowUsersReportModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Rapport des Utilisateurs
            </DialogTitle>
            <DialogDescription>
              Analysez le comportement et l'engagement des utilisateurs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration du Rapport</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="usersPeriod">Période d'analyse</Label>
                    <Select 
                      value={usersReportConfig.period} 
                      onValueChange={(value) => setUsersReportConfig(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="90d">3 derniers mois</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="usersFormat">Format du rapport</Label>
                    <Select 
                      value={usersReportConfig.format} 
                      onValueChange={(value) => setUsersReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="usersGroupBy">Grouper par</Label>
                    <Select 
                      value={usersReportConfig.groupBy} 
                      onValueChange={(value) => setUsersReportConfig(prev => ({ ...prev, groupBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="age_group">Groupe d'âge</SelectItem>
                        <SelectItem value="region">Région</SelectItem>
                        <SelectItem value="device">Appareil</SelectItem>
                        <SelectItem value="activity">Niveau d'activité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Métriques à Inclure</h4>
                
                <div className="space-y-3">
                  {['active_users', 'new_users', 'engagement', 'demographics'].map((metric) => (
                    <div key={metric} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`users-${metric}`}
                        checked={usersReportConfig.metrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUsersReportConfig(prev => ({
                              ...prev,
                              metrics: [...prev.metrics, metric]
                            }))
                          } else {
                            setUsersReportConfig(prev => ({
                              ...prev,
                              metrics: prev.metrics.filter(m => m !== metric)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`users-${metric}`} className="capitalize">
                        {metric === 'active_users' ? 'Utilisateurs actifs' :
                         metric === 'new_users' ? 'Nouveaux utilisateurs' :
                         metric === 'engagement' ? 'Engagement' : 'Démographie'}
                      </Label>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="usersIncludeCharts"
                        checked={usersReportConfig.includeCharts}
                        onCheckedChange={(checked) => setUsersReportConfig(prev => ({ ...prev, includeCharts: checked }))}
                      />
                      <Label htmlFor="usersIncludeCharts">Inclure les graphiques</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="usersIncludeRawData"
                        checked={usersReportConfig.includeRawData}
                        onCheckedChange={(checked) => setUsersReportConfig(prev => ({ ...prev, includeRawData: checked }))}
                      />
                      <Label htmlFor="usersIncludeRawData">Inclure les données brutes</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowUsersReportModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={generateUsersReport}
                disabled={isGeneratingUsersReport}
              >
                {isGeneratingUsersReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Générer le Rapport
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport des produits */}
      <Dialog open={showProductsReportModal} onOpenChange={setShowProductsReportModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              Rapport des Produits
            </DialogTitle>
            <DialogDescription>
              Analysez la performance et l'inventaire des produits
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration du Rapport</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="productsPeriod">Période d'analyse</Label>
                    <Select 
                      value={productsReportConfig.period} 
                      onValueChange={(value) => setProductsReportConfig(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="90d">3 derniers mois</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="productsFormat">Format du rapport</Label>
                    <Select 
                      value={productsReportConfig.format} 
                      onValueChange={(value) => setProductsReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="productsGroupBy">Grouper par</Label>
                    <Select 
                      value={productsReportConfig.groupBy} 
                      onValueChange={(value) => setProductsReportConfig(prev => ({ ...prev, groupBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="category">Catégorie</SelectItem>
                        <SelectItem value="vendor">Vendeur</SelectItem>
                        <SelectItem value="price_range">Fourchette de prix</SelectItem>
                        <SelectItem value="rating">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Métriques à Inclure</h4>
                
                <div className="space-y-3">
                  {['sales_volume', 'revenue', 'performance', 'inventory'].map((metric) => (
                    <div key={metric} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`products-${metric}`}
                        checked={productsReportConfig.metrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProductsReportConfig(prev => ({
                              ...prev,
                              metrics: [...prev.metrics, metric]
                            }))
                          } else {
                            setProductsReportConfig(prev => ({
                              ...prev,
                              metrics: prev.metrics.filter(m => m !== metric)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`products-${metric}`} className="capitalize">
                        {metric === 'sales_volume' ? 'Volume de ventes' :
                         metric === 'revenue' ? 'Revenus' :
                         metric === 'performance' ? 'Performance' : 'Inventaire'}
                      </Label>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="productsIncludeCharts"
                        checked={productsReportConfig.includeCharts}
                        onCheckedChange={(checked) => setProductsReportConfig(prev => ({ ...prev, includeCharts: checked }))}
                      />
                      <Label htmlFor="productsIncludeCharts">Inclure les graphiques</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="productsIncludeRawData"
                        checked={productsReportConfig.includeRawData}
                        onCheckedChange={(checked) => setProductsReportConfig(prev => ({ ...prev, includeRawData: checked }))}
                      />
                      <Label htmlFor="productsIncludeRawData">Inclure les données brutes</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowProductsReportModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={generateProductsReport}
                disabled={isGeneratingProductsReport}
              >
                {isGeneratingProductsReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Générer le Rapport
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport de performance */}
      <Dialog open={showPerformanceReportModal} onOpenChange={setShowPerformanceReportModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Rapport de Performance
            </DialogTitle>
            <DialogDescription>
              Surveillez les performances techniques et système
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration du Rapport</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="performancePeriod">Période d'analyse</Label>
                    <Select 
                      value={performanceReportConfig.period} 
                      onValueChange={(value) => setPerformanceReportConfig(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="90d">3 derniers mois</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="performanceFormat">Format du rapport</Label>
                    <Select 
                      value={performanceReportConfig.format} 
                      onValueChange={(value) => setPerformanceReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="performanceGroupBy">Grouper par</Label>
                    <Select 
                      value={performanceReportConfig.groupBy} 
                      onValueChange={(value) => setPerformanceReportConfig(prev => ({ ...prev, groupBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="region">Région</SelectItem>
                        <SelectItem value="time">Période</SelectItem>
                        <SelectItem value="severity">Sévérité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Métriques à Inclure</h4>
                
                <div className="space-y-3">
                  {['page_load', 'api_response', 'uptime', 'errors'].map((metric) => (
                    <div key={metric} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`performance-${metric}`}
                        checked={performanceReportConfig.metrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPerformanceReportConfig(prev => ({
                              ...prev,
                              metrics: [...prev.metrics, metric]
                            }))
                          } else {
                            setPerformanceReportConfig(prev => ({
                              ...prev,
                              metrics: prev.metrics.filter(m => m !== metric)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`performance-${metric}`} className="capitalize">
                        {metric === 'page_load' ? 'Temps de chargement' :
                         metric === 'api_response' ? 'Temps de réponse API' :
                         metric === 'uptime' ? 'Disponibilité' : 'Erreurs'}
                      </Label>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="performanceIncludeCharts"
                        checked={performanceReportConfig.includeCharts}
                        onCheckedChange={(checked) => setPerformanceReportConfig(prev => ({ ...prev, includeCharts: checked }))}
                      />
                      <Label htmlFor="performanceIncludeCharts">Inclure les graphiques</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="performanceIncludeRawData"
                        checked={performanceReportConfig.includeRawData}
                        onCheckedChange={(checked) => setPerformanceReportConfig(prev => ({ ...prev, includeRawData: checked }))}
                      />
                      <Label htmlFor="performanceIncludeRawData">Inclure les données brutes</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPerformanceReportModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={generatePerformanceReport}
                disabled={isGeneratingPerformanceReport}
              >
                {isGeneratingPerformanceReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Générer le Rapport
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport marketing */}
      <Dialog open={showMarketingReportModal} onOpenChange={setShowMarketingReportModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              Rapport Marketing
            </DialogTitle>
            <DialogDescription>
              Analysez l'efficacité des campagnes marketing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration du Rapport</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="marketingPeriod">Période d'analyse</Label>
                    <Select 
                      value={marketingReportConfig.period} 
                      onValueChange={(value) => setMarketingReportConfig(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="90d">3 derniers mois</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marketingFormat">Format du rapport</Label>
                    <Select 
                      value={marketingReportConfig.format} 
                      onValueChange={(value) => setMarketingReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marketingGroupBy">Grouper par</Label>
                    <Select 
                      value={marketingReportConfig.groupBy} 
                      onValueChange={(value) => setMarketingReportConfig(prev => ({ ...prev, groupBy: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="campaign_type">Type de campagne</SelectItem>
                        <SelectItem value="channel">Canal</SelectItem>
                        <SelectItem value="audience">Audience</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Métriques à Inclure</h4>
                
                <div className="space-y-3">
                  {['campaign_performance', 'roi', 'conversion', 'reach'].map((metric) => (
                    <div key={metric} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`marketing-${metric}`}
                        checked={marketingReportConfig.metrics.includes(metric)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMarketingReportConfig(prev => ({
                              ...prev,
                              metrics: [...prev.metrics, metric]
                            }))
                          } else {
                            setMarketingReportConfig(prev => ({
                              ...prev,
                              metrics: prev.metrics.filter(m => m !== metric)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`marketing-${metric}`} className="capitalize">
                        {metric === 'campaign_performance' ? 'Performance des campagnes' :
                         metric === 'roi' ? 'ROI' :
                         metric === 'conversion' ? 'Taux de conversion' : 'Portée'}
                      </Label>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="marketingIncludeCharts"
                        checked={marketingReportConfig.includeCharts}
                        onCheckedChange={(checked) => setMarketingReportConfig(prev => ({ ...prev, includeCharts: checked }))}
                      />
                      <Label htmlFor="marketingIncludeCharts">Inclure les graphiques</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="marketingIncludeRawData"
                        checked={marketingReportConfig.includeRawData}
                        onCheckedChange={(checked) => setMarketingReportConfig(prev => ({ ...prev, includeRawData: checked }))}
                      />
                      <Label htmlFor="marketingIncludeRawData">Inclure les données brutes</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowMarketingReportModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={generateMarketingReport}
                disabled={isGeneratingMarketingReport}
              >
                {isGeneratingMarketingReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    Générer le Rapport
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal du rapport complet */}
      <Dialog open={showCompleteReportModal} onOpenChange={setShowCompleteReportModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Rapport Complet
            </DialogTitle>
            <DialogDescription>
              Rapport exhaustif combinant toutes les métriques et analyses
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration du Rapport</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="completePeriod">Période d'analyse</Label>
                    <Select 
                      value={completeReportConfig.period} 
                      onValueChange={(value) => setCompleteReportConfig(prev => ({ ...prev, period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="90d">3 derniers mois</SelectItem>
                        <SelectItem value="1y">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="completeFormat">Format du rapport</Label>
                    <Select 
                      value={completeReportConfig.format} 
                      onValueChange={(value) => setCompleteReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Sections à Inclure</h4>
                
                <div className="space-y-3">
                  {['overview', 'sales', 'users', 'products', 'performance', 'marketing'].map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`complete-${section}`}
                        checked={completeReportConfig.sections.includes(section)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCompleteReportConfig(prev => ({
                              ...prev,
                              sections: [...prev.sections, section]
                            }))
                          } else {
                            setCompleteReportConfig(prev => ({
                              ...prev,
                              sections: prev.sections.filter(s => s !== section)
                            }))
                          }
                        }}
                      />
                      <Label htmlFor={`complete-${section}`} className="capitalize">
                        {section === 'overview' ? 'Vue d\'ensemble' :
                         section === 'sales' ? 'Ventes' :
                         section === 'users' ? 'Utilisateurs' :
                         section === 'products' ? 'Produits' :
                         section === 'performance' ? 'Performance' : 'Marketing'}
                      </Label>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="completeExecutiveSummary"
                        checked={completeReportConfig.executive_summary}
                        onCheckedChange={(checked) => setCompleteReportConfig(prev => ({ ...prev, executive_summary: checked }))}
                      />
                      <Label htmlFor="completeExecutiveSummary">Résumé exécutif</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="completeRecommendations"
                        checked={completeReportConfig.recommendations}
                        onCheckedChange={(checked) => setCompleteReportConfig(prev => ({ ...prev, recommendations: checked }))}
                      />
                      <Label htmlFor="completeRecommendations">Recommandations</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCompleteReportModal(false)}>
                Fermer
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={generateCompleteReport}
                disabled={isGeneratingCompleteReport}
              >
                {isGeneratingCompleteReport ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Générer le Rapport Complet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de création de rapport */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Créer un Nouveau Rapport
            </DialogTitle>
            <DialogDescription>
              Configurez un rapport personnalisé avec des options de planification automatique
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Configuration du Rapport</h4>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="reportName">Nom du rapport</Label>
                    <Input
                      id="reportName"
                      placeholder="Ex: Rapport mensuel des ventes"
                      value={reportConfig.name}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reportDescription">Description</Label>
                    <Textarea
                      id="reportDescription"
                      placeholder="Décrivez le contenu et l'objectif de ce rapport"
                      value={reportConfig.description}
                      onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="reportType">Type</Label>
                      <Select 
                        value={reportConfig.type} 
                        onValueChange={(value) => setReportConfig(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Ventes</SelectItem>
                          <SelectItem value="users">Utilisateurs</SelectItem>
                          <SelectItem value="products">Produits</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="complete">Complet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reportPeriod">Période</Label>
                      <Select 
                        value={reportConfig.period} 
                        onValueChange={(value) => setReportConfig(prev => ({ ...prev, period: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">7 jours</SelectItem>
                          <SelectItem value="30d">30 jours</SelectItem>
                          <SelectItem value="90d">3 mois</SelectItem>
                          <SelectItem value="1y">1 an</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reportFormat">Format</Label>
                    <Select 
                      value={reportConfig.format} 
                      onValueChange={(value) => setReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="powerpoint">PowerPoint</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-lg border-b pb-2">Planification Automatique</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="scheduleEnabled"
                      checked={reportConfig.schedule.enabled}
                      onCheckedChange={(checked) => setReportConfig(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, enabled: checked }
                      }))}
                    />
                    <Label htmlFor="scheduleEnabled">Activer la génération automatique</Label>
                  </div>
                  
                  {reportConfig.schedule.enabled && (
                    <div className="space-y-3 p-3 border border-emerald-200 rounded-lg bg-emerald-50">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="frequency">Fréquence</Label>
                          <Select 
                            value={reportConfig.schedule.frequency} 
                            onValueChange={(value) => setReportConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, frequency: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Quotidien</SelectItem>
                              <SelectItem value="weekly">Hebdomadaire</SelectItem>
                              <SelectItem value="monthly">Mensuel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="time">Heure d'envoi</Label>
                          <Input
                            id="time"
                            type="time"
                            value={reportConfig.schedule.time}
                            onChange={(e) => setReportConfig(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule, time: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="recipients">Destinataires (emails)</Label>
                        <Input
                          id="recipients"
                          placeholder="email1@exemple.com, email2@exemple.com"
                          value={reportConfig.schedule.recipients.join(', ')}
                          onChange={(e) => setReportConfig(prev => ({
                            ...prev,
                            schedule: { 
                              ...prev.schedule, 
                              recipients: e.target.value.split(',').map(email => email.trim())
                            }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-lg border-b pb-2">Rapports Existants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-48 overflow-y-auto">
                {reports.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4 col-span-2">Aucun rapport configuré</p>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{report.name}</h5>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={report.isActive}
                            onCheckedChange={() => void toggleReportStatus(report.id)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteReport(report.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{report.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{report.type} • {report.period}</span>
                        <Badge variant="outline" className="text-xs">
                          {report.format.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" onClick={() => setShowReportModal(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleCreateReport}
              disabled={isGeneratingReport || !reportConfig.name}
            >
              {isGeneratingReport ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Créer le Rapport
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
