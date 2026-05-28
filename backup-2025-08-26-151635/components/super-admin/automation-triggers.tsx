"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Zap, Play, Pause, Settings, Clock, CheckCircle, AlertTriangle, Users, 
  ShoppingCart, MessageCircle, TrendingUp, Bell, Plus, Edit, Trash2, 
  Eye, Filter, Download, Upload, RefreshCw, BarChart3, Timer, 
  Workflow, Cpu, Database, Shield, Globe, Mail, Smartphone, 
  Calendar, Target, ArrowRight, ChevronDown, ChevronUp, Search, XCircle
} from 'lucide-react'
import { useNotifications } from '@/components/ui/modern-notification'

// Interfaces pour l'automatisation
interface AutomationTrigger {
  id: string
  name: string
  description: string
  event: string
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  status: 'active' | 'paused' | 'draft' | 'error'
  priority: 'low' | 'medium' | 'high' | 'critical'
  executions: number
  lastExecution: string
  successRate: number
  createdAt: string
  updatedAt: string
  tags: string[]
  isRecurring: boolean
  schedule?: string
  maxExecutions?: number
  timeout: number
  retryCount: number
  retryDelay: number
}

interface AutomationCondition {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: string | number | boolean
  logicalOperator?: 'and' | 'or'
}

interface AutomationAction {
  id: string
  type: 'email' | 'sms' | 'notification' | 'webhook' | 'database' | 'api_call' | 'file_operation' | 'system_command'
  name: string
  config: Record<string, any>
  order: number
  isActive: boolean
}

interface AutomationExecution {
  id: string
  triggerId: string
  triggerName: string
  status: 'success' | 'failed' | 'running' | 'cancelled'
  startTime: string
  endTime?: string
  duration: number
  errorMessage?: string
  retryCount: number
  data: Record<string, any>
}

interface AutomationStats {
  totalTriggers: number
  activeTriggers: number
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  totalErrors: number
  last24Hours: {
    executions: number
    errors: number
    newTriggers: number
  }
}

// Nouvelles interfaces pour l'Analytics
interface AnalyticsReport {
  id: string
  name: string
  description: string
  format: string[]
  schedule: string
  isEnabled: boolean
  lastGenerated?: string
  recipients: string[]
}

interface AnalyticsExport {
  id: string
  period: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  downloadUrl?: string
  fileSize?: string
}

interface AnalyticsPrediction {
  metric: string
  currentValue: number
  predictedValue: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  factors: string[]
}

interface AnalyticsError {
  id: string
  error: string
  count: number
  impact: 'Élevé' | 'Moyen' | 'Faible'
  solution: string
  priority: 'Critique' | 'Élevée' | 'Moyenne' | 'Faible'
  lastOccurrence: string
  affectedTriggers: string[]
}

export default function AutomationTriggers() {
  // États pour la gestion des automatisations
  const [triggers, setTriggers] = useState<AutomationTrigger[]>([])
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [stats, setStats] = useState<AutomationStats>({
    totalTriggers: 0,
    activeTriggers: 0,
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0,
    totalErrors: 0,
    last24Hours: { executions: 0, errors: 0, newTriggers: 0 }
  })
  
  // États pour les modals et actions
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [selectedTrigger, setSelectedTrigger] = useState<AutomationTrigger | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  
  // États pour les filtres avancés
  const [advancedFilters, setAdvancedFilters] = useState({
    eventType: 'all',
    executionRange: 'all',
    successRateRange: 'all',
    dateRange: 'all',
    tags: [] as string[],
    isRecurring: 'all'
  })
  const [isLoading, setIsLoading] = useState(false)
  
  // États pour l'Analytics
  const [analyticsReports, setAnalyticsReports] = useState<AnalyticsReport[]>([])
  const [analyticsExports, setAnalyticsExports] = useState<AnalyticsExport[]>([])
  const [analyticsPredictions, setAnalyticsPredictions] = useState<AnalyticsPrediction[]>([])
  const [analyticsErrors, setAnalyticsErrors] = useState<AnalyticsError[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<AnalyticsReport | null>(null)
  const [selectedExport, setSelectedExport] = useState<AnalyticsExport | null>(null)
  const [selectedError, setSelectedError] = useState<AnalyticsError | null>(null)
  const [reportRecipients, setReportRecipients] = useState('emails@exemple.com')
  const [reportTime, setReportTime] = useState('8:00')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  
  // États pour les boutons Exporter et Actualiser
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExportingTriggers, setIsExportingTriggers] = useState(false)
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false)
  const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] = useState(false)
  const [showDetailedPredictionsModal, setShowDetailedPredictionsModal] = useState(false)
  const [showExportProgressModal, setShowExportProgressModal] = useState(false)

  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  // Charger les données au montage
  useEffect(() => {
    loadMockData()
  }, [])

  // Fonction pour charger les données de démonstration
  const loadMockData = () => {
    const mockTriggers: AutomationTrigger[] = [
      {
        id: '1',
        name: 'Nouvelle Commande',
        description: 'Automatisation déclenchée lors de la création d\'une nouvelle commande',
        event: 'order.created',
        conditions: [
          { id: '1', field: 'order.total', operator: 'greater_than', value: 10000 }
        ],
        actions: [
          { id: '1', type: 'email', name: 'Email de confirmation', config: { template: 'order_confirmation' }, order: 1, isActive: true },
          { id: '2', type: 'notification', name: 'Notification admin', config: { channel: 'admin_dashboard' }, order: 2, isActive: true }
        ],
        status: 'active',
        priority: 'high',
        executions: 156,
        lastExecution: '2024-01-15T10:30:00Z',
        successRate: 98.7,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        tags: ['commande', 'email', 'notification'],
        isRecurring: false,
        timeout: 30,
        retryCount: 3,
        retryDelay: 300
      },
      {
        id: '2',
        name: 'Stock Faible',
        description: 'Alerte automatique quand le stock d\'un produit est faible',
        event: 'stock.low',
        conditions: [
          { id: '1', field: 'stock.quantity', operator: 'less_than', value: 5 }
        ],
        actions: [
          { id: '1', type: 'email', name: 'Alerte stock', config: { template: 'low_stock_alert' }, order: 1, isActive: true },
          { id: '2', type: 'sms', name: 'SMS urgent', config: { phone: '+22501234567' }, order: 2, isActive: true }
        ],
        status: 'active',
        priority: 'critical',
        executions: 23,
        lastExecution: '2024-01-15T09:15:00Z',
        successRate: 100,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T09:15:00Z',
        tags: ['stock', 'alerte', 'urgent'],
        isRecurring: true,
        schedule: '0 */6 * * *', // Toutes les 6 heures
        maxExecutions: 100,
        timeout: 15,
        retryCount: 2,
        retryDelay: 600
      }
    ]

    const mockExecutions: AutomationExecution[] = [
      {
        id: '1',
        triggerId: '1',
        triggerName: 'Nouvelle Commande',
        status: 'success',
        startTime: '2024-01-15T10:30:00Z',
        endTime: '2024-01-15T10:30:01Z',
        duration: 1.2,
        retryCount: 0,
        data: { orderId: '12345', customerEmail: 'client@example.com' }
      },
      {
        id: '2',
        triggerId: '2',
        triggerName: 'Stock Faible',
        status: 'success',
        startTime: '2024-01-15T09:15:00Z',
        endTime: '2024-01-15T09:15:00Z',
        duration: 0.8,
        retryCount: 0,
        data: { productId: '789', currentStock: 3 }
      }
    ]

    setTriggers(mockTriggers)
    setExecutions(mockExecutions)
    updateStats(mockTriggers, mockExecutions)
    
    // Données de démonstration pour l'Analytics
    const mockAnalyticsReports: AnalyticsReport[] = [
      {
        id: '1',
        name: 'Rapport Quotidien',
        description: 'Résumé des performances du jour',
        format: ['PDF', 'Excel'],
        schedule: 'Tous les jours à 8h',
        isEnabled: true,
        lastGenerated: '2024-01-15T08:00:00Z',
        recipients: ['admin@exemple.com', 'superadmin@exemple.com']
      },
      {
        id: '2',
        name: 'Rapport Hebdomadaire',
        description: 'Analyse complète de la semaine',
        format: ['PDF', 'Excel'],
        schedule: 'Tous les lundis à 9h',
        isEnabled: true,
        lastGenerated: '2024-01-15T09:00:00Z',
        recipients: ['admin@exemple.com', 'superadmin@exemple.com']
      },
      {
        id: '3',
        name: 'Rapport Mensuel',
        description: 'Synthèse mensuelle détaillée',
        format: ['PDF', 'Excel', 'CSV'],
        schedule: '1er du mois à 10h',
        isEnabled: true,
        lastGenerated: '2024-01-01T10:00:00Z',
        recipients: ['admin@exemple.com', 'superadmin@exemple.com']
      },
      {
        id: '4',
        name: 'Rapport Trimestriel',
        description: 'Analyse stratégique trimestrielle',
        format: ['PDF', 'PowerPoint'],
        schedule: 'Début de trimestre',
        isEnabled: false,
        recipients: ['superadmin@exemple.com']
      },
      {
        id: '5',
        name: 'Rapport Annuel',
        description: 'Bilan annuel complet',
        format: ['PDF', 'PowerPoint', 'Excel'],
        schedule: 'Début d\'année',
        isEnabled: false,
        recipients: ['superadmin@exemple.com']
      }
    ]

    const mockAnalyticsExports: AnalyticsExport[] = [
      {
        id: '1',
        period: '24h',
        format: 'CSV',
        status: 'completed',
        createdAt: '2024-01-15T07:00:00Z',
        completedAt: '2024-01-15T07:02:00Z',
        downloadUrl: '/exports/analytics-24h.csv',
        fileSize: '2.3 MB'
      },
      {
        id: '2',
        period: '7 jours',
        format: 'Excel',
        status: 'completed',
        createdAt: '2024-01-15T06:00:00Z',
        completedAt: '2024-01-15T06:05:00Z',
        downloadUrl: '/exports/analytics-7days.xlsx',
        fileSize: '15.7 MB'
      },
      {
        id: '3',
        period: '30 jours',
        format: 'PDF',
        status: 'processing',
        createdAt: '2024-01-15T05:00:00Z'
      }
    ]

    const mockAnalyticsPredictions: AnalyticsPrediction[] = [
      {
        metric: 'Exécutions',
        currentValue: 45,
        predictedValue: 53,
        confidence: 0.87,
        trend: 'up',
        factors: ['Optimisation des algorithmes', 'Mise à jour des serveurs']
      },
      {
        metric: 'Taux de Succès',
        currentValue: 92.3,
        predictedValue: 94.1,
        confidence: 0.92,
        trend: 'up',
        factors: ['Amélioration de la validation', 'Cache intelligent']
      },
      {
        metric: 'Temps d\'Exécution',
        currentValue: 2.3,
        predictedValue: 2.1,
        confidence: 0.78,
        trend: 'down',
        factors: ['Optimisation des requêtes', 'Compression des données']
      }
    ]

    const mockAnalyticsErrors: AnalyticsError[] = [
      {
        id: '1',
        error: 'Timeout d\'exécution',
        count: 23,
        impact: 'Élevé',
        solution: 'Augmenter le timeout et implémenter une logique de retry intelligente',
        priority: 'Critique',
        lastOccurrence: '2024-01-15T10:30:00Z',
        affectedTriggers: ['Webhook API', 'Synchronisation Base']
      },
      {
        id: '2',
        error: 'Erreur de connexion API',
        count: 18,
        impact: 'Moyen',
        solution: 'Vérifier la connectivité et implémenter un circuit breaker',
        priority: 'Élevée',
        lastOccurrence: '2024-01-15T09:45:00Z',
        affectedTriggers: ['Intégration Externe', 'Webhook Callback']
      },
      {
        id: '3',
        error: 'Données manquantes',
        count: 15,
        impact: 'Faible',
        solution: 'Renforcer la validation des données d\'entrée',
        priority: 'Moyenne',
        lastOccurrence: '2024-01-15T08:20:00Z',
        affectedTriggers: ['Validation Commande', 'Traitement Produit']
      },
      {
        id: '4',
        error: 'Limite de mémoire',
        count: 12,
        impact: 'Élevé',
        solution: 'Optimiser l\'utilisation de la mémoire et implémenter un système de nettoyage',
        priority: 'Élevée',
        lastOccurrence: '2024-01-15T07:15:00Z',
        affectedTriggers: ['Traitement Lourd', 'Analyse Données']
      },
      {
        id: '5',
        error: 'Erreur de validation',
        count: 8,
        impact: 'Faible',
        solution: 'Corriger la logique de validation et ajouter des tests',
        priority: 'Faible',
        lastOccurrence: '2024-01-15T06:30:00Z',
        affectedTriggers: ['Validation Formulaire', 'Contrôle Accès']
      }
    ]

    setAnalyticsReports(mockAnalyticsReports)
    setAnalyticsExports(mockAnalyticsExports)
    setAnalyticsPredictions(mockAnalyticsPredictions)
    setAnalyticsErrors(mockAnalyticsErrors)
  }

  // Fonction pour actualiser les données (bouton Actualiser)
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      // Simulation d'une actualisation des données
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simuler la mise à jour des statistiques en temps réel
      const updatedStats = {
        ...stats,
        totalExecutions: stats.totalExecutions + Math.floor(Math.random() * 10),
        successRate: Math.min(100, stats.successRate + (Math.random() > 0.5 ? 0.1 : -0.1)),
        averageExecutionTime: Math.max(0.1, stats.averageExecutionTime + (Math.random() - 0.5) * 0.2),
        last24Hours: {
          executions: stats.last24Hours.executions + Math.floor(Math.random() * 5),
          errors: Math.max(0, stats.last24Hours.errors + (Math.random() > 0.7 ? 1 : 0)),
          newTriggers: stats.last24Hours.newTriggers + (Math.random() > 0.8 ? 1 : 0)
        }
      }
      
      setStats(updatedStats)
      
      // Simuler la mise à jour des déclencheurs
      const updatedTriggers = triggers.map(trigger => ({
        ...trigger,
        executions: trigger.executions + Math.floor(Math.random() * 3),
        lastExecution: new Date().toISOString(),
        successRate: Math.min(100, trigger.successRate + (Math.random() > 0.5 ? 0.5 : -0.5))
      }))
      
      setTriggers(updatedTriggers)
      
      // Mettre à jour les statistiques
      updateStats(updatedTriggers, executions)
      
              addNotification({
          type: 'success',
          title: 'Données actualisées',
          message: 'Les données ont été actualisées avec succès !'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur d\'actualisation',
          message: 'Erreur lors de l\'actualisation des données'
        })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fonction pour exporter les déclencheurs (bouton Exporter)
  const exportTriggers = async () => {
    setIsExportingTriggers(true)
    try {
      // Simulation de l'export
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Créer un fichier CSV avec les données des déclencheurs
      const csvContent = generateTriggersCSV(filteredTriggers)
      
      // Télécharger le fichier
      downloadCSV(csvContent, `declencheurs-automatisation-${new Date().toISOString().split('T')[0]}.csv`)
      
      // Ajouter l'export à l'historique des exports
      const newExport: AnalyticsExport = {
        id: Date.now().toString(),
        period: 'Tous les déclencheurs',
        format: 'CSV',
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        downloadUrl: '#',
        fileSize: `${Math.round(csvContent.length / 1024)} KB`
      }
      
      setAnalyticsExports(prev => [newExport, ...prev])
      
              addNotification({
          type: 'success',
          title: 'Export terminé',
          message: 'Export des déclencheurs terminé avec succès !'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur d\'export',
          message: 'Erreur lors de l\'export des déclencheurs'
        })
    } finally {
      setIsExportingTriggers(false)
    }
  }

  // Fonction pour générer le contenu CSV des déclencheurs
  const generateTriggersCSV = (triggers: AutomationTrigger[]) => {
    const headers = [
      'ID', 'Nom', 'Description', 'Événement', 'Statut', 'Priorité', 
      'Exécutions', 'Taux de Succès', 'Dernière Exécution', 'Créé le', 'Tags'
    ]
    
    const rows = triggers.map(trigger => [
      trigger.id,
      trigger.name,
      trigger.description,
      trigger.event,
      trigger.status,
      trigger.priority,
      trigger.executions,
      `${trigger.successRate}%`,
      formatDate(trigger.lastExecution),
      formatDate(trigger.createdAt),
      trigger.tags.join(', ')
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  // Fonction pour appliquer les filtres avancés
  const applyAdvancedFilters = () => {
    // Fermer le modal
    setShowAdvancedFiltersModal(false)
    
    // Appliquer les filtres (la logique sera dans filteredTriggers)
    addNotification({
      type: 'success',
      title: 'Filtres appliqués',
      message: 'Filtres avancés appliqués avec succès !'
    })
  }

  // Fonction pour réinitialiser les filtres avancés
  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      eventType: 'all',
      executionRange: 'all',
      successRateRange: 'all',
      dateRange: 'all',
      tags: [],
      isRecurring: 'all'
    })
    addNotification({
      type: 'info',
      title: 'Filtres réinitialisés',
      message: 'Filtres avancés réinitialisés !'
    })
  }

  // Fonction pour télécharger un fichier CSV
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

  // Fonction pour exporter dans différents formats
  const exportInFormat = async (format: 'csv' | 'excel' | 'json') => {
    setIsExportingTriggers(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      let content: string
      let filename: string
      let mimeType: string
      
      switch (format) {
        case 'csv':
          content = generateTriggersCSV(filteredTriggers)
          filename = `declencheurs-${new Date().toISOString().split('T')[0]}.csv`
          mimeType = 'text/csv;charset=utf-8;'
          break
        case 'json':
          content = JSON.stringify(filteredTriggers, null, 2)
          filename = `declencheurs-${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
          break
        case 'excel':
          // Simulation d'export Excel (en réalité, on génère un CSV avec extension .xlsx)
          content = generateTriggersCSV(filteredTriggers)
          filename = `declencheurs-${new Date().toISOString().split('T')[0]}.xlsx`
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        default:
          throw new Error('Format non supporté')
      }
      
      const blob = new Blob([content], { type: mimeType })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
              addNotification({
          type: 'success',
          title: 'Export terminé',
          message: `Export ${format.toUpperCase()} terminé avec succès !`
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur d\'export',
          message: `Erreur lors de l'export ${format.toUpperCase()}`
        })
    } finally {
      setIsExportingTriggers(false)
    }
  }

  // Fonction pour mettre à jour les statistiques
  const updateStats = (triggers: AutomationTrigger[], executions: AutomationExecution[]) => {
    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.status === 'success').length
    const totalErrors = executions.filter(e => e.status === 'failed').length
    const averageExecutionTime = executions.length > 0 
      ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length 
      : 0

    setStats({
      totalTriggers: triggers.length,
      activeTriggers: triggers.filter(t => t.status === 'active').length,
      totalExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      averageExecutionTime,
      totalErrors,
      last24Hours: {
        executions: executions.filter(e => {
          const executionTime = new Date(e.startTime)
          const now = new Date()
          return (now.getTime() - executionTime.getTime()) <= 24 * 60 * 60 * 1000
        }).length,
        errors: executions.filter(e => {
          const executionTime = new Date(e.startTime)
          const now = new Date()
          return e.status === 'failed' && (now.getTime() - executionTime.getTime()) <= 24 * 60 * 60 * 1000
        }).length,
        newTriggers: triggers.filter(t => {
          const creationTime = new Date(t.createdAt)
          const now = new Date()
          return (now.getTime() - creationTime.getTime()) <= 24 * 60 * 60 * 1000
        }).length
      }
    })
  }

  // Fonctions pour l'Analytics
  const toggleReportStatus = (reportId: string) => {
    setAnalyticsReports(prev => prev.map(report => ({
      ...report,
      isEnabled: report.id === reportId ? !report.isEnabled : report.isEnabled
    })))
  }

  const generateReport = async (reportId: string) => {
    setIsGeneratingReport(true)
    try {
      // Simulation de génération de rapport
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mettre à jour la date de dernière génération
      setAnalyticsReports(prev => prev.map(report => ({
        ...report,
        lastGenerated: report.id === reportId ? new Date().toISOString() : report.lastGenerated
      })))
      
              addNotification({
          type: 'success',
          title: 'Rapport généré',
          message: `Rapport "${analyticsReports.find(r => r.id === reportId)?.name}" généré avec succès !`
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Erreur de génération',
          message: 'Erreur lors de la génération du rapport'
        })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const exportData = async (period: string, format: string) => {
    setIsExporting(true)
    try {
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Créer un nouvel export
      const newExport: AnalyticsExport = {
        id: Date.now().toString(),
        period,
        format,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        downloadUrl: `/exports/analytics-${period.toLowerCase()}.${format.toLowerCase()}`,
        fileSize: `${Math.random() * 20 + 5} MB`
      }
      
      setAnalyticsExports(prev => [newExport, ...prev])
              addNotification({
          type: 'success',
          title: 'Export terminé',
          message: `Export ${period} en format ${format} terminé avec succès !`
        })
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
    const exportItem = analyticsExports.find(e => e.id === exportId)
    if (exportItem && exportItem.downloadUrl) {
      // Simulation de téléchargement
      const link = document.createElement('a')
      link.href = exportItem.downloadUrl
      link.download = `analytics-${exportItem.period}-${exportItem.format}.${exportItem.format.toLowerCase()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      addNotification({
        type: 'info',
        title: 'Téléchargement',
        message: 'Téléchargement démarré !'
      })
    }
  }

  const updateReportSettings = (reportId: string, field: keyof AnalyticsReport, value: any) => {
    setAnalyticsReports(prev => prev.map(report => ({
      ...report,
      [field]: report.id === reportId ? value : report[field]
    })))
  }

  const saveReportConfiguration = () => {
    // Sauvegarder la configuration des rapports
    setAnalyticsReports(prev => prev.map(report => ({
      ...report,
      recipients: reportRecipients.split(',').map(email => email.trim()),
      schedule: reportTime
    })))
    addNotification({
      type: 'success',
      title: 'Configuration sauvegardée',
      message: 'Configuration des rapports sauvegardée !'
    })
  }

  const viewErrorDetails = (error: AnalyticsError) => {
    setSelectedError(error)
    setShowErrorDetailsModal(true)
  }

  const viewPredictionDetails = (prediction: AnalyticsPrediction) => {
    setShowPredictionModal(true)
  }

  // Fonctions pour les recommandations d'amélioration
  const handleOptimizationAction = (action: string, type: string) => {
    let message = ''
    let notificationType: 'success' | 'info' | 'warning' = 'info'
    
    switch (action) {
      case 'configurer':
        switch (type) {
          case 'timeouts':
            // Ajuster automatiquement les timeouts des triggers
            setTriggers(prev => prev.map(trigger => ({
              ...trigger,
              timeout: Math.min(trigger.timeout * 1.2, 300)
            })))
            message = 'Timeouts des triggers ajustés automatiquement'
            notificationType = 'success'
            break
          case 'retry':
            // Ajuster les paramètres de retry
            setTriggers(prev => prev.map(trigger => ({
              ...trigger,
              retryCount: Math.min(trigger.retryCount + 1, 5),
              retryDelay: Math.min(trigger.retryDelay * 1.1, 60)
            })))
            message = 'Paramètres de retry optimisés'
            notificationType = 'success'
            break
          default:
            message = `Configuration de ${type} en cours...`
        }
        break
        
      case 'optimiser':
        switch (type) {
          case 'mémoire':
            // Simuler l'optimisation de la mémoire
            const memoryOptimized = Math.floor(Math.random() * 20) + 10
            message = `Optimisation mémoire terminée. Gain: ${memoryOptimized}%`
            notificationType = 'success'
            break
          case 'performance':
            // Simuler l'optimisation des performances
            const perfOptimized = Math.floor(Math.random() * 15) + 8
            message = `Optimisation performance terminée. Amélioration: ${perfOptimized}%`
            notificationType = 'success'
            break
          default:
            message = `Optimisation de ${type} en cours...`
        }
        break
        
      case 'sécuriser':
        switch (type) {
          case 'validation':
            // Simuler la sécurisation des validations
            message = 'Validations de sécurité renforcées'
            notificationType = 'success'
            break
          case 'authentification':
            // Simuler la sécurisation de l'authentification
            message = 'Système d\'authentification sécurisé'
            notificationType = 'success'
            break
          default:
            message = `Sécurisation de ${type} en cours...`
        }
        break
        
      case 'voir':
        // Ouvrir les détails d'optimisation
        message = `Affichage des détails d'optimisation pour ${type}`
        break
        
      case 'analyser':
        // Analyser les performances
        const analysisResult = Math.random() > 0.5 ? 'optimal' : 'améliorable'
        message = `Analyse terminée. État: ${analysisResult}`
        notificationType = analysisResult === 'optimal' ? 'success' : 'warning'
        break
        
      default:
        message = `Action "${action}" sur "${type}" en cours...`
    }
    
    addNotification({
      type: notificationType,
      title: 'Action d\'optimisation',
      message: message
    })
  }

  const viewOptimizationDetails = (type: string) => {
    // Générer un rapport d'optimisation détaillé
    const optimizationReport = {
      type: type,
      timestamp: new Date().toISOString(),
      currentMetrics: {
        averageExecutionTime: stats.averageExecutionTime,
        successRate: stats.successRate,
        totalErrors: stats.totalErrors,
        activeTriggers: stats.activeTriggers
      },
      recommendations: [
        {
          priority: 'high',
          action: 'Augmenter le timeout des triggers lents',
          impact: 'Réduire les erreurs de timeout',
          effort: 'Faible'
        },
        {
          priority: 'medium',
          action: 'Optimiser la logique des conditions',
          impact: 'Améliorer les performances',
          effort: 'Moyen'
        },
        {
          priority: 'low',
          action: 'Ajouter des logs de debug',
          impact: 'Faciliter le diagnostic',
          effort: 'Faible'
        }
      ],
      estimatedImprovement: Math.floor(Math.random() * 25) + 15
    }
    
    // Convertir en JSON et télécharger
    const reportContent = JSON.stringify(optimizationReport, null, 2)
    const blob = new Blob([reportContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport-optimisation-${type}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      type: 'success',
      title: 'Rapport d\'optimisation',
      message: `Rapport d'optimisation pour ${type} téléchargé avec succès`
    })
  }

  // Fonction pour la maintenance préventive
  const performPreventiveMaintenance = () => {
    // Simuler une maintenance préventive complète
    const maintenanceTasks = [
      'Nettoyage des logs obsolètes',
      'Optimisation de la base de données',
      'Vérification de l\'intégrité des triggers',
      'Mise à jour des métriques de performance',
      'Analyse des tendances d\'erreur'
    ]
    
    // Mettre à jour les statistiques
    setStats(prev => ({
      ...prev,
      totalErrors: Math.max(0, prev.totalErrors - Math.floor(Math.random() * 3)),
      successRate: Math.min(100, prev.successRate + Math.floor(Math.random() * 2)),
      averageExecutionTime: Math.max(0.1, prev.averageExecutionTime * 0.95)
    }))
    
    // Créer un rapport de maintenance
    const maintenanceReport = {
      timestamp: new Date().toISOString(),
      tasks: maintenanceTasks,
      results: {
        logsCleaned: Math.floor(Math.random() * 100) + 50,
        databaseOptimized: true,
        triggersVerified: triggers.length,
        performanceImproved: Math.floor(Math.random() * 15) + 5
      }
    }
    
    // Télécharger le rapport
    const reportContent = JSON.stringify(maintenanceReport, null, 2)
    const blob = new Blob([reportContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport-maintenance-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      type: 'success',
      title: 'Maintenance terminée',
      message: 'Maintenance préventive terminée avec succès. Rapport téléchargé.'
    })
  }

  // Fonction pour l'analyse de sécurité
  const performSecurityAnalysis = () => {
    // Simuler une analyse de sécurité
    const securityIssues = [
      { level: 'low', description: 'Permissions trop larges sur 3 triggers', count: 3 },
      { level: 'medium', description: 'Validation des données insuffisante', count: 2 },
      { level: 'high', description: 'Aucune vulnérabilité critique détectée', count: 0 }
    ]
    
    const securityScore = Math.floor(Math.random() * 20) + 80 // Score entre 80-100
    
    // Créer un rapport de sécurité
    const securityReport = {
      timestamp: new Date().toISOString(),
      overallScore: securityScore,
      issues: securityIssues,
      recommendations: [
        'Restreindre les permissions des triggers utilisateur',
        'Ajouter des validations de données plus strictes',
        'Implémenter un système de journalisation des accès'
      ]
    }
    
    // Télécharger le rapport
    const reportContent = JSON.stringify(securityReport, null, 2)
    const blob = new Blob([reportContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport-securite-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      type: securityScore >= 90 ? 'success' : 'warning',
      title: 'Analyse de sécurité',
      message: `Analyse terminée. Score de sécurité: ${securityScore}/100`
    })
  }

  // Fonctions pour les actions recommandées dans la modal des erreurs
  const viewDetailedLogs = (errorId: string) => {
    const error = analyticsErrors.find(e => e.id === errorId)
    if (error) {
      // Simuler l'affichage des logs détaillés
      const logs = [
        `[${new Date().toISOString()}] ERREUR: ${error.error}`,
        `[${new Date().toISOString()}] Stack trace: TypeError: Cannot read property 'length' of undefined`,
        `[${new Date().toISOString()}] Fichier: automation-trigger.js:127`,
        `[${new Date().toISOString()}] Ligne: 127`,
        `[${new Date().toISOString()}] Contexte: Exécution du trigger ${error.affectedTriggers[0] || 'inconnu'}`,
        `[${new Date().toISOString()}] Variables: { userId: 12345, orderId: "ORD-789", status: "pending" }`
      ]
      
      // Créer un modal temporaire pour afficher les logs
      const logContent = logs.join('\n')
      const blob = new Blob([logContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `logs-erreur-${errorId}.txt`
      link.click()
      URL.revokeObjectURL(url)
      
      addNotification({
        type: 'success',
        title: 'Logs téléchargés',
        message: `Logs détaillés de l'erreur ${errorId} téléchargés avec succès`
      })
    }
  }

  const restartTriggers = (errorId: string) => {
    const error = analyticsErrors.find(e => e.id === errorId)
    if (error) {
      // Simuler la relance des triggers
      const affectedTriggers = error.affectedTriggers
      
      // Mettre à jour le statut des triggers
      setTriggers(prev => prev.map(trigger => 
        affectedTriggers.includes(trigger.name) 
          ? { ...trigger, status: 'active' as const }
          : trigger
      ))
      
      // Mettre à jour les exécutions
      setExecutions(prev => prev.map(exec => 
        exec.triggerId && affectedTriggers.some(name => 
          triggers.find(t => t.id === exec.triggerId)?.name === name
        )
          ? { ...exec, status: 'running' as const, startTime: new Date().toISOString() }
          : exec
      ))
      
      addNotification({
        type: 'success',
        title: 'Triggers relancés',
        message: `${affectedTriggers.length} trigger(s) relancé(s) avec succès`
      })
    }
  }

  const adjustConfiguration = (errorId: string) => {
    const error = analyticsErrors.find(e => e.id === errorId)
    if (error) {
      // Simuler l'ajustement automatique de la configuration
      const affectedTriggers = error.affectedTriggers
      
      // Ajuster les timeouts et retry counts
      setTriggers(prev => prev.map(trigger => 
        affectedTriggers.includes(trigger.name) 
          ? { 
              ...trigger, 
              timeout: Math.min(trigger.timeout * 1.5, 300), // Augmenter le timeout
              retryCount: Math.min(trigger.retryCount + 1, 5), // Augmenter les tentatives
              retryDelay: Math.min(trigger.retryDelay * 1.2, 60) // Augmenter le délai
            }
          : trigger
      ))
      
      addNotification({
        type: 'success',
        title: 'Configuration ajustée',
        message: `Configuration automatiquement ajustée pour ${affectedTriggers.length} trigger(s)`
      })
    }
  }

  const markErrorAsResolved = (errorId: string) => {
    addNotification({
      type: 'success',
      title: 'Erreur résolue',
      message: `Erreur ${errorId} marquée comme résolue`
    })
    setShowErrorDetailsModal(false)
  }

  // Fonctions pour la modal des prédictions
  const viewMorePredictionDetails = () => {
    // Ouvrir le modal des détails détaillés
    setShowDetailedPredictionsModal(true)
    
    addNotification({
      type: 'info',
      title: 'Détails affichés',
      message: 'Affichage des détails complets des prédictions'
    })
  }

  const exportPredictionData = () => {
    // Ouvrir le modal de progression d'export
    setShowExportProgressModal(true)
    
    // Simuler un processus d'export avec progression
    setTimeout(() => {
      // Créer un fichier CSV avec toutes les données de prédiction
      const csvHeaders = ['Métrique', 'Valeur Actuelle', 'Valeur Prédite', 'Confiance (%)', 'Tendance', 'Timestamp']
      const csvRows = analyticsPredictions.map(p => [
        p.metric,
        p.currentValue,
        p.predictedValue,
        (p.confidence * 100).toFixed(1),
        p.trend === 'up' ? 'Hausse' : p.trend === 'down' ? 'Baisse' : 'Stable',
        new Date().toISOString()
      ])
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')
      
      // Ajouter l'en-tête BOM pour Excel
      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `donnees-predictions-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
      
      // Fermer le modal et afficher la notification
      setShowExportProgressModal(false)
      addNotification({
        type: 'success',
        title: 'Données exportées',
        message: 'Données de prédiction exportées en CSV avec succès'
      })
    }, 2000) // Simuler 2 secondes de traitement
  }

  // Fonctions pour la modal de configuration des rapports
  const saveReportConfigurationModal = () => {
    if (selectedReport) {
      // Validation des données
      if (!selectedReport.name.trim()) {
        addNotification({
          type: 'error',
          title: 'Erreur de validation',
          message: 'Le nom du rapport est obligatoire'
        })
        return
      }
      
      if (selectedReport.format.length === 0) {
        addNotification({
          type: 'error',
          title: 'Erreur de validation',
          message: 'Au moins un format d\'export doit être sélectionné'
        })
        return
      }
      
      // Mettre à jour le rapport avec les nouvelles données
      const updatedReport = {
        ...selectedReport,
        updatedAt: new Date().toISOString()
      }
      
      setAnalyticsReports(prev => prev.map(report => 
        report.id === selectedReport.id ? updatedReport : report
      ))
      
      // Mettre à jour le rapport sélectionné
      setSelectedReport(updatedReport)
      
      addNotification({
        type: 'success',
        title: 'Configuration sauvegardée',
        message: `Configuration du rapport "${updatedReport.name}" sauvegardée avec succès`
      })
      
      setShowReportModal(false)
    }
  }

  const deleteReport = (reportId: string) => {
    const report = analyticsReports.find(r => r.id === reportId)
    if (report) {
      // Vérifier si le rapport est actuellement en cours de génération
      if (isGeneratingReport && selectedReport?.id === reportId) {
        addNotification({
          type: 'error',
          title: 'Suppression impossible',
          message: 'Impossible de supprimer un rapport en cours de génération'
        })
        return
      }
      
      // Supprimer le rapport
      setAnalyticsReports(prev => prev.filter(r => r.id !== reportId))
      
      // Si c'était le rapport sélectionné, le désélectionner
      if (selectedReport?.id === reportId) {
        setSelectedReport(null)
      }
      
      addNotification({
        type: 'success',
        title: 'Rapport supprimé',
        message: `Rapport "${report.name}" supprimé avec succès`
      })
      
      setShowReportModal(false)
    }
  }

  // Fonctions utilitaires
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: 'default',
      paused: 'secondary',
      draft: 'outline',
      error: 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>
      {status === 'active' ? 'Actif' : 
       status === 'paused' ? 'En pause' : 
       status === 'draft' ? 'Brouillon' : 'Erreur'}
    </Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      critical: 'destructive'
    }
    const colors: Record<string, string> = {
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    }
    return <Badge variant={variants[priority] || 'outline'} className={colors[priority]}>
      {priority === 'low' ? 'Faible' : 
       priority === 'medium' ? 'Moyenne' : 
       priority === 'high' ? 'Élevée' : 'Critique'}
    </Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 1) return `${Math.round(seconds * 1000)}ms`
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
  }

  // Fonctions d'action
  const toggleTriggerStatus = (triggerId: string) => {
    setTriggers(prev => prev.map(t => 
      t.id === triggerId 
        ? { ...t, status: t.status === 'active' ? 'paused' : 'active' }
        : t
    ))
  }

  const deleteTrigger = (triggerId: string) => {
    setTriggers(prev => prev.filter(t => t.id !== triggerId))
  }

  const createNewTrigger = () => {
    setSelectedTrigger(null)
    setShowCreateModal(true)
  }

  const editTrigger = (trigger: AutomationTrigger) => {
    setSelectedTrigger(trigger)
    setShowEditModal(true)
  }

  const viewExecution = (execution: AutomationExecution) => {
    setSelectedExecution(execution)
    setShowExecutionModal(true)
  }

  // Filtrage des déclencheurs
  const filteredTriggers = triggers.filter(trigger => {
    const matchesSearch = trigger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trigger.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || trigger.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || trigger.priority === priorityFilter
    
    // Filtres avancés
    const matchesEventType = advancedFilters.eventType === 'all' || 
                            (advancedFilters.eventType === 'order' && trigger.event.includes('order')) ||
                            (advancedFilters.eventType === 'user' && trigger.event.includes('user')) ||
                            (advancedFilters.eventType === 'product' && trigger.event.includes('product'))
    
    const matchesExecutionRange = advancedFilters.executionRange === 'all' ||
                                 (advancedFilters.executionRange === 'low' && trigger.executions < 50) ||
                                 (advancedFilters.executionRange === 'medium' && trigger.executions >= 50 && trigger.executions < 200) ||
                                 (advancedFilters.executionRange === 'high' && trigger.executions >= 200)
    
    const matchesSuccessRate = advancedFilters.successRateRange === 'all' ||
                              (advancedFilters.successRateRange === 'low' && trigger.successRate < 80) ||
                              (advancedFilters.successRateRange === 'medium' && trigger.successRate >= 80 && trigger.successRate < 95) ||
                              (advancedFilters.successRateRange === 'high' && trigger.successRate >= 95)
    
    const matchesDateRange = advancedFilters.dateRange === 'all' ||
                            (advancedFilters.dateRange === 'recent' && new Date(trigger.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
                            (advancedFilters.dateRange === 'old' && new Date(trigger.createdAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    
    const matchesTags = advancedFilters.tags.length === 0 || 
                       advancedFilters.tags.some(tag => trigger.tags.includes(tag))
    
    const matchesRecurring = advancedFilters.isRecurring === 'all' ||
                            (advancedFilters.isRecurring === 'yes' && trigger.isRecurring) ||
                            (advancedFilters.isRecurring === 'no' && !trigger.isRecurring)
    
    return matchesSearch && matchesStatus && matchesPriority && 
           matchesEventType && matchesExecutionRange && matchesSuccessRate && 
           matchesDateRange && matchesTags && matchesRecurring
  })

  return (
    <div className="space-y-6">
      {/* En-tête avec actions principales */}
      <div className="bg-gradient-to-r from-orange-50 to-gray-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Automatisation & Déclencheurs</h2>
            <p className="text-gray-600 mt-2">
              Création et gestion des automatisations intelligentes basées sur des événements système
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowStatsModal(true)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistiques
            </Button>
            <Button 
              onClick={createNewTrigger}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Déclencheur
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTriggers}</p>
                <p className="text-sm text-gray-600">Total déclencheurs</p>
                <p className="text-xs text-green-600">+{stats.last24Hours.newTriggers} aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeTriggers}</p>
                <p className="text-sm text-gray-600">Déclencheurs actifs</p>
                <p className="text-xs text-green-600">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Taux de succès</p>
                <p className="text-xs text-purple-600">Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(stats.averageExecutionTime)}</p>
                <p className="text-sm text-gray-600">Temps moyen</p>
                <p className="text-xs text-orange-600">Exécution</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées 24h */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Exécutions 24h</p>
                <p className="text-2xl font-bold text-blue-900">{stats.last24Hours.executions}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Total exécutions</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalExecutions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Erreurs 24h</p>
                <p className="text-2xl font-bold text-red-900">{stats.last24Hours.errors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des déclencheurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowExportOptionsModal(true)}
              disabled={isExportingTriggers}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Actualisation...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="triggers">Déclencheurs</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="executions">Exécutions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* Vue d'ensemble des déclencheurs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  Déclencheurs Récents
                </CardTitle>
                <CardDescription>
                  Activité des 7 derniers jours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTriggers.slice(0, 5).map((trigger) => (
                    <div key={trigger.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          trigger.status === 'active' ? 'bg-green-100' :
                          trigger.status === 'paused' ? 'bg-yellow-100' :
                          trigger.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <Zap className={`h-5 w-5 ${
                            trigger.status === 'active' ? 'text-green-600' :
                            trigger.status === 'paused' ? 'text-yellow-600' :
                            trigger.status === 'error' ? 'text-red-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{trigger.name}</p>
                          <p className="text-sm text-gray-600">{trigger.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(trigger.status)}
                            {getPriorityBadge(trigger.priority)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{trigger.executions}</p>
                        <p className="text-xs text-gray-500">exécutions</p>
                        <p className="text-xs text-gray-500">{formatDate(trigger.lastExecution)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Performance des Automatisations
                </CardTitle>
                <CardDescription>
                  Statistiques de performance détaillées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</p>
                      <p className="text-sm text-blue-800">Taux de succès</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{stats.activeTriggers}</p>
                      <p className="text-sm text-green-800">Déclencheurs actifs</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Temps d'exécution moyen</span>
                      <span className="text-sm font-medium">{formatDuration(stats.averageExecutionTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total des exécutions</span>
                      <span className="text-sm font-medium">{stats.totalExecutions.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Erreurs totales</span>
                      <span className="text-sm font-medium text-red-600">{stats.totalErrors}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphique d'activité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Activité des 24 Dernières Heures
              </CardTitle>
              <CardDescription>
                Suivi en temps réel des exécutions et performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Graphique d'activité en temps réel</p>
                  <p className="text-sm">Intégration avec Chart.js ou Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Déclencheurs */}
        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    Gestion des Déclencheurs
                  </CardTitle>
                  <CardDescription>
                    Création, modification et surveillance des déclencheurs d'automatisation
                    {filteredTriggers.length !== triggers.length && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({filteredTriggers.length} sur {triggers.length} déclencheurs)
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAdvancedFiltersModal(true)}
                    className={Object.values(advancedFilters).some(value => 
                      value !== 'all' && (Array.isArray(value) ? value.length > 0 : true)
                    ) ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres avancés
                    {Object.values(advancedFilters).some(value => 
                      value !== 'all' && (Array.isArray(value) ? value.length > 0 : true)
                    ) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Actifs
                      </Badge>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportTriggers}
                    disabled={isExportingTriggers}
                  >
                    {isExportingTriggers ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Export en cours...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Exporter
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTriggers.map((trigger) => (
                  <div key={trigger.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            trigger.status === 'active' ? 'bg-green-100' :
                            trigger.status === 'paused' ? 'bg-yellow-100' :
                            trigger.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                            <Zap className={`h-6 w-6 ${
                              trigger.status === 'active' ? 'text-green-600' :
                              trigger.status === 'paused' ? 'text-yellow-600' :
                              trigger.status === 'error' ? 'text-red-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">{trigger.name}</h3>
                              {getStatusBadge(trigger.status)}
                              {getPriorityBadge(trigger.priority)}
                            </div>
                            <p className="text-gray-600 mb-2">{trigger.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Événement: <code className="bg-gray-100 px-2 py-1 rounded">{trigger.event}</code></span>
                              <span>Exécutions: {trigger.executions.toLocaleString()}</span>
                              <span>Succès: {trigger.successRate.toFixed(1)}%</span>
                              <span>Dernière exécution: {formatDate(trigger.lastExecution)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Conditions et Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-gray-700">Conditions</h4>
                            <div className="space-y-2">
                              {trigger.conditions.map((condition) => (
                                <div key={condition.id} className="bg-gray-50 p-2 rounded text-sm">
                                  <span className="font-medium">{condition.field}</span>
                                  <span className="mx-2 text-gray-500">{condition.operator}</span>
                                  <span className="font-medium">{String(condition.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-2 text-gray-700">Actions</h4>
                            <div className="space-y-2">
                              {trigger.actions.map((action) => (
                                <div key={action.id} className="bg-blue-50 p-2 rounded text-sm">
                                  <span className="font-medium">{action.name}</span>
                                  <span className="text-gray-500"> ({action.type})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Tags et métadonnées */}
                        <div className="flex items-center gap-2 mb-3">
                          {trigger.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {trigger.isRecurring && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              <Timer className="h-3 w-3 mr-1" />
                              Récurrent
                            </Badge>
                          )}
                        </div>

                        {/* Configuration technique */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                          <div>
                            <span className="font-medium">Timeout:</span> {trigger.timeout}s
                          </div>
                          <div>
                            <span className="font-medium">Tentatives:</span> {trigger.retryCount}
                          </div>
                          <div>
                            <span className="font-medium">Délai retry:</span> {trigger.retryDelay}s
                          </div>
                          <div>
                            <span className="font-medium">Créé:</span> {formatDate(trigger.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant={trigger.status === 'active' ? 'outline' : 'default'}
                          onClick={() => toggleTriggerStatus(trigger.id)}
                          className="w-full"
                        >
                          {trigger.status === 'active' ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activer
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editTrigger(trigger)}
                          className="w-full"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewExecution(executions.find(e => e.triggerId === trigger.id) || executions[0])}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTrigger(trigger.id)}
                          className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTriggers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Aucun déclencheur trouvé</p>
                    <p className="text-sm">Créez votre premier déclencheur d'automatisation</p>
                    <Button onClick={createNewTrigger} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un déclencheur
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evenements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Événements Système</CardTitle>
              <CardDescription>
                Surveillance des événements déclencheurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 1, type: "order", event: "Commande créée", user: "Marie L.", details: "Commande #12345", time: "Il y a 2 min", status: "processed" },
                  { id: 2, type: "payment", event: "Paiement échoué", user: "Pierre D.", details: "Carte refusée", time: "Il y a 5 min", status: "failed" },
                  { id: 3, type: "user", event: "Nouveau vendeur", user: "Jean M.", details: "TechStore Pro", time: "Il y a 15 min", status: "pending" },
                  { id: 4, type: "stock", event: "Stock faible", user: "Système", details: "iPhone 15 Pro - 3 unités", time: "Il y a 1h", status: "alert" }
                ].map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        event.type === 'order' ? 'bg-blue-100' :
                        event.type === 'payment' ? 'bg-yellow-100' :
                        event.type === 'user' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {event.type === 'order' && <ShoppingCart className="h-5 w-5 text-blue-600" />}
                        {event.type === 'payment' && <TrendingUp className="h-5 w-5 text-yellow-600" />}
                        {event.type === 'user' && <Users className="h-5 w-5 text-green-600" />}
                        {event.type === 'stock' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium">{event.event}</p>
                        <p className="text-sm text-gray-600">{event.user} - {event.details}</p>
                        <p className="text-xs text-gray-500">{event.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={event.status === 'processed' ? 'default' : 
                                event.status === 'failed' ? 'destructive' : 
                                event.status === 'pending' ? 'secondary' : 'outline'}
                      >
                        {event.status === 'processed' ? 'Traité' : 
                         event.status === 'failed' ? 'Échoué' : 
                         event.status === 'pending' ? 'En attente' : 'Alerte'}
                      </Badge>
                      <Button size="sm" variant="outline">Voir</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique d'Exécution</CardTitle>
              <CardDescription>
                Suivi des exécutions et performances des automatisations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: 1, trigger: "Nouvelle Commande", execution: "Email envoyé", duration: "1.2s", status: "success", time: "Il y a 2 min" },
                  { id: 2, trigger: "Stock Faible", execution: "SMS envoyé", duration: "0.8s", status: "success", time: "Il y a 5 min" },
                  { id: 3, trigger: "Paiement Échoué", execution: "Retry programmé", duration: "2.1s", status: "success", time: "Il y a 10 min" },
                  { id: 4, trigger: "Nouveau Vendeur", execution: "Email d'approbation", duration: "1.5s", status: "failed", time: "Il y a 15 min" }
                ].map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{execution.trigger}</p>
                      <p className="text-sm text-gray-600">{execution.execution}</p>
                      <p className="text-xs text-gray-500">{execution.time} - Durée: {execution.duration}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={execution.status === 'success' ? 'default' : 'destructive'}>
                        {execution.status === 'success' ? 'Succès' : 'Échec'}
                      </Badge>
                      <Button size="sm" variant="outline">Détails</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-purple-600" />
                Workflows d'Automatisation
              </CardTitle>
              <CardDescription>
                Création et gestion de workflows complexes avec conditions multiples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Workflow Builder */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Créer un Workflow</h3>
                  <p className="text-gray-600 mb-4">
                    Construisez des workflows complexes avec des conditions multiples et des actions en chaîne
                  </p>
                  <Button onClick={createNewTrigger} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Workflow
                  </Button>
                </div>

                {/* Workflows existants */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Workflows Actifs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Workflow Commande</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Commande créée</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span>Vérification stock</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span>Email confirmation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span>Notification admin</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Workflow Vendeur</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Inscription vendeur</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span>Vérification documents</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span>Approbation admin</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <span>Email de bienvenue</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Événements */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Événements Système
              </CardTitle>
              <CardDescription>
                Surveillance et gestion des événements déclencheurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        execution.status === 'success' ? 'bg-green-100' :
                        execution.status === 'failed' ? 'bg-red-100' :
                        execution.status === 'running' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {execution.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {execution.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                        {execution.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-600" />}
                        {execution.status === 'cancelled' && <XCircle className="h-5 w-5 text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-medium">{execution.triggerName}</p>
                        <p className="text-sm text-gray-600">ID: {execution.id}</p>
                        <p className="text-xs text-gray-500">{formatDate(execution.startTime)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={execution.status === 'success' ? 'default' : 
                                       execution.status === 'failed' ? 'destructive' : 
                                       execution.status === 'running' ? 'secondary' : 'outline'}>
                          {execution.status === 'success' ? 'Succès' : 
                           execution.status === 'failed' ? 'Échec' : 
                           execution.status === 'running' ? 'En cours' : 'Annulé'}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDuration(execution.duration)}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => viewExecution(execution)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Exécutions */}
        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Historique d'Exécution
              </CardTitle>
              <CardDescription>
                Suivi détaillé des exécutions et performances des automatisations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {executions.filter(e => e.status === 'success').length}
                    </p>
                    <p className="text-sm text-green-800">Exécutions réussies</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {executions.filter(e => e.status === 'failed').length}
                    </p>
                    <p className="text-sm text-red-800">Exécutions échouées</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatDuration(executions.reduce((sum, e) => sum + e.duration, 0) / executions.length)}
                    </p>
                    <p className="text-sm text-blue-800">Temps moyen</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {executions.map((execution) => (
                    <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{execution.triggerName}</h4>
                          <Badge variant={execution.status === 'success' ? 'default' : 
                                         execution.status === 'failed' ? 'destructive' : 
                                         execution.status === 'running' ? 'secondary' : 'outline'}>
                            {execution.status === 'success' ? 'Succès' : 
                             execution.status === 'failed' ? 'Échec' : 
                             execution.status === 'running' ? 'En cours' : 'Annulé'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(execution.startTime)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Durée:</span> {formatDuration(execution.duration)}
                        </div>
                        <div>
                          <span className="font-medium">Tentatives:</span> {execution.retryCount}
                        </div>
                        <div>
                          <span className="font-medium">ID:</span> {execution.id}
                        </div>
                        <div>
                          <span className="font-medium">Déclencheur:</span> {execution.triggerId}
                        </div>
                      </div>

                      {execution.errorMessage && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          <strong>Erreur:</strong> {execution.errorMessage}
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => viewExecution(execution)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir détails
                        </Button>
                        <Button size="sm" variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Relancer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Vue d'ensemble des Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Taux de Succès Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">
                  +2.1% vs mois dernier
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Exécutions 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.last24Hours.executions}</div>
                <p className="text-xs text-gray-500 mt-1">
                  +15% vs hier
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Temps Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatDuration(stats.averageExecutionTime)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  -8% vs mois dernier
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Erreurs 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.last24Hours.errors}</div>
                <p className="text-xs text-gray-500 mt-1">
                  -12% vs hier
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques et Tendances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique des Exécutions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Tendances des Exécutions (7 jours)
                </CardTitle>
                <CardDescription>
                  Évolution du nombre d'exécutions et du taux de succès
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Simulation de graphique avec des barres */}
                  <div className="space-y-3">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => {
                      const executions = [45, 52, 48, 61, 58, 42, 38][index]
                      const successRate = [92, 89, 94, 87, 91, 95, 88][index]
                      const height = (executions / 70) * 100
                      
                      return (
                        <div key={day} className="flex items-center gap-3">
                          <div className="w-12 text-sm text-gray-600">{day}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${height}%` }}
                            />
                          </div>
                          <div className="w-16 text-right">
                            <div className="text-sm font-medium">{executions}</div>
                            <div className="text-xs text-gray-500">{successRate}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total: {[45, 52, 48, 61, 58, 42, 38].reduce((a, b) => a + b, 0)} exécutions</span>
                    <span>Moyenne: {([45, 52, 48, 61, 58, 42, 38].reduce((a, b) => a + b, 0) / 7).toFixed(0)}/jour</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graphique des Performances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Performance par Type de Trigger
                </CardTitle>
                <CardDescription>
                  Taux de succès et temps d'exécution par catégorie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'Email', success: 95, time: 2.3, count: 156 },
                    { type: 'SMS', success: 87, time: 1.8, count: 89 },
                    { type: 'Webhook', success: 92, time: 4.1, count: 234 },
                    { type: 'Notification', success: 98, time: 0.8, count: 445 },
                    { type: 'API Call', success: 83, time: 6.2, count: 67 }
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{item.success}%</div>
                          <div className="text-xs text-gray-500">Succès</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{item.time}s</div>
                          <div className="text-xs text-gray-500">Temps</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">{item.count}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analyse Détaillée des Erreurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Analyse des Erreurs et Défaillances
              </CardTitle>
              <CardDescription>
                Diagnostic approfondi des problèmes et recommandations d'amélioration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Top des Erreurs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Top 5 des Erreurs</h4>
                    <div className="space-y-3">
                      {analyticsErrors.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-red-500' : 
                              index === 1 ? 'bg-orange-500' : 
                              index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{item.error}</div>
                              <div className="text-sm text-gray-600">{item.solution}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium text-red-600">{item.count}</div>
                              <Badge variant={item.impact === 'Élevé' ? 'destructive' : 
                                             item.impact === 'Moyen' ? 'secondary' : 'outline'}>
                                {item.impact}
                              </Badge>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewErrorDetails(item)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Détails
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Répartition par Priorité</h4>
                    <div className="space-y-4">
                      {[
                        { priority: 'Critique', count: 8, color: 'bg-red-500', percentage: 15 },
                        { priority: 'Élevée', count: 23, color: 'bg-orange-500', percentage: 42 },
                        { priority: 'Moyenne', count: 18, color: 'bg-yellow-500', percentage: 33 },
                        { priority: 'Faible', count: 6, color: 'bg-green-500', percentage: 10 }
                      ].map((item) => (
                        <div key={item.priority} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.priority}</span>
                            <span className="text-sm text-gray-600">{item.count} erreurs</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${item.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-gray-500">{item.percentage}% du total</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Recommandations d'Amélioration */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Recommandations d'Amélioration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Optimisation des Timeouts</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        Augmenter les timeouts pour les opérations longues et implémenter une logique de retry intelligente.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleOptimizationAction('configurer', 'timeouts')}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configurer
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => viewOptimizationDetails('timeouts')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Gestion de la Mémoire</span>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        Optimiser l'utilisation de la mémoire et implémenter un système de nettoyage automatique.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleOptimizationAction('optimiser', 'mémoire')}
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Optimiser
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => viewOptimizationDetails('mémoire')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Validation des Données</span>
                      </div>
                      <p className="text-sm text-purple-700 mb-3">
                        Renforcer la validation des données d'entrée et ajouter des contrôles de sécurité.
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleOptimizationAction('sécuriser', 'validation')}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Sécuriser
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => viewOptimizationDetails('validation')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analyse des Tendances et Prédictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Tendances et Prédictions
              </CardTitle>
              <CardDescription>
                Analyse prédictive basée sur les données historiques et tendances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Métriques Prédictives */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-lg mb-2">Croissance Prévue</h4>
                    <div className="text-3xl font-bold text-blue-600 mb-2">+18%</div>
                    <p className="text-sm text-gray-600 mb-3">
                      Augmentation prévue des exécutions le mois prochain
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewPredictionDetails(analyticsPredictions[0])}
                      className="w-full"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Voir Détails
                    </Button>
                  </div>
                  
                  <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="font-medium text-lg mb-2">Amélioration Succès</h4>
                    <div className="text-3xl font-bold text-green-600 mb-2">+5.2%</div>
                    <p className="text-sm text-gray-600 mb-3">
                      Amélioration prévue du taux de succès
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewPredictionDetails(analyticsPredictions[1])}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Voir Détails
                    </Button>
                  </div>
                  
                  <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <Timer className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-lg mb-2">Optimisation Temps</h4>
                    <div className="text-3xl font-bold text-purple-600 mb-2">-12%</div>
                    <p className="text-sm text-gray-600 mb-3">
                      Réduction prévue du temps d'exécution moyen
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewPredictionDetails(analyticsPredictions[2])}
                      className="w-full"
                    >
                      <Timer className="h-4 w-4 mr-2" />
                      Voir Détails
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Graphique de Prédiction */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Prédiction des Exécutions (30 jours)</h4>
                  <div className="space-y-3">
                    {Array.from({ length: 30 }, (_, i) => {
                      const baseValue = 45
                      const trend = Math.sin(i * 0.2) * 10 + (i * 0.5)
                      const predictedValue = Math.max(0, Math.round(baseValue + trend))
                      
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-16 text-sm text-gray-600">Jour {i + 1}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (predictedValue / 60) * 100)}%` }}
                            />
                          </div>
                          <div className="w-20 text-right">
                            <div className="text-sm font-medium">{predictedValue}</div>
                            <div className="text-xs text-gray-500">prévu</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Facteurs d'Influence */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Facteurs d'Influence sur les Performances</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h5 className="font-medium text-blue-800">Facteurs Positifs</h5>
                      <div className="space-y-2">
                        {[
                          { text: 'Optimisation des algorithmes (+15% performance)', impact: 15, type: 'algorithme' },
                          { text: 'Mise à jour des serveurs (+8% vitesse)', impact: 8, type: 'serveur' },
                          { text: 'Amélioration de la validation (+5% succès)', impact: 5, type: 'validation' },
                          { text: 'Cache intelligent (+12% temps de réponse)', impact: 12, type: 'cache' }
                        ].map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>{factor.text}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                +{factor.impact}%
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleOptimizationAction('voir', factor.type)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h5 className="font-medium text-red-800">Facteurs Négatifs</h5>
                      <div className="space-y-2">
                        {[
                          { text: 'Charge serveur élevée (-8% performance)', impact: 8, type: 'charge' },
                          { text: 'Latence réseau (-5% vitesse)', impact: 5, type: 'réseau' },
                          { text: 'Données volumineuses (-12% temps)', impact: 12, type: 'données' },
                          { text: 'Erreurs de validation (-3% succès)', impact: 3, type: 'validation' }
                        ].map((factor, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                            <div className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span>{factor.text}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-xs">
                                -{factor.impact}%
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleOptimizationAction('analyser', factor.type)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rapports et Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-gray-600" />
                Rapports et Export de Données
              </CardTitle>
              <CardDescription>
                Génération de rapports détaillés et export des données d'analyse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Types de Rapports */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Rapports Disponibles</h4>
                    <div className="space-y-3">
                      {analyticsReports.map((report) => (
                        <div key={report.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{report.name}</h5>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{report.format.join(', ')}</Badge>
                              <Switch 
                                checked={report.isEnabled}
                                onCheckedChange={() => toggleReportStatus(report.id)}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{report.schedule}</span>
                            </div>
                            {report.lastGenerated && (
                              <div className="text-xs text-gray-500">
                                Dernier: {formatDate(report.lastGenerated)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => generateReport(report.id)}
                              disabled={isGeneratingReport}
                              className="flex-1"
                            >
                              {isGeneratingReport ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Génération...
                                </>
                              ) : (
                                <>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  Générer
                                </>
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedReport(report)
                                setShowReportModal(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Actions d'Export</h4>
                    <div className="space-y-3">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => exportData('24h', 'CSV')}
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
                            Exporter Données 24h
                          </>
                        )}
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => exportData('7 jours', 'Excel')}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Données 7 jours
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => exportData('30 jours', 'PDF')}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Données 30 jours
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => exportData('90 jours', 'Excel')}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Données 90 jours
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => exportData('Année', 'PDF')}
                        disabled={isExporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exporter Données Année
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h5 className="font-medium">Formats d'Export</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => exportData('7 jours', 'CSV')}
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          CSV
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => exportData('7 jours', 'Excel')}
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Excel
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => exportData('7 jours', 'PDF')}
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => exportData('7 jours', 'JSON')}
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          JSON
                        </Button>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h5 className="font-medium">Exports Récents</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {analyticsExports.slice(0, 5).map((exportItem) => (
                          <div key={exportItem.id} className="flex items-center justify-between p-2 border border-gray-200 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant={exportItem.status === 'completed' ? 'default' : 
                                             exportItem.status === 'processing' ? 'secondary' : 
                                             exportItem.status === 'failed' ? 'destructive' : 'outline'}>
                                {exportItem.status === 'completed' ? 'Terminé' : 
                                 exportItem.status === 'processing' ? 'En cours' : 
                                 exportItem.status === 'failed' ? 'Échec' : 'En attente'}
                              </Badge>
                              <span>{exportItem.period} - {exportItem.format}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {exportItem.status === 'completed' && exportItem.downloadUrl && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => downloadExport(exportItem.id)}
                                  className="h-6 px-2"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              )}
                              <span className="text-gray-500">
                                {exportItem.fileSize || formatDate(exportItem.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration des Rapports */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Configuration des Rapports Automatiques</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Rapports Quotidiens</label>
                          <p className="text-xs text-gray-600">Envoi automatique par email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Rapports Hebdomadaires</label>
                          <p className="text-xs text-gray-600">Envoi automatique par email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Rapports Mensuels</label>
                          <p className="text-xs text-gray-600">Envoi automatique par email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alertes de Performance</label>
                          <p className="text-xs text-gray-600">Notifications en cas de baisse</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Heure d'Envoi</label>
                        <Select value={reportTime} onValueChange={setReportTime}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="6:00">6h00</SelectItem>
                            <SelectItem value="7:00">7h00</SelectItem>
                            <SelectItem value="8:00">8h00</SelectItem>
                            <SelectItem value="9:00">9h00</SelectItem>
                            <SelectItem value="10:00">10h00</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Destinataires</label>
                        <Input 
                          placeholder="emails@exemple.com"
                          value={reportRecipients}
                          onChange={(e) => setReportRecipients(e.target.value)}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">Séparer par des virgules</p>
                      </div>
                      
                      <Button 
                        onClick={saveReportConfiguration}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sauvegarder Configuration
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings" className="space-y-6">
          {/* Configuration Générale */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Configuration Générale des Déclencheurs
              </CardTitle>
              <CardDescription>
                Paramètres globaux et configuration avancée du système d'automatisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Paramètres Système</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Mode debug</label>
                        <p className="text-xs text-gray-600">Activer les logs détaillés</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Exécution parallèle</label>
                        <p className="text-xs text-gray-600">Autoriser plusieurs exécutions simultanées</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Limite de tentatives</label>
                        <p className="text-xs text-gray-600">Max 3 tentatives par déclencheur</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Performance</h4>
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Temps d'exécution max</span>
                        <span className="text-sm text-gray-600">30 secondes</span>
                      </div>
                      <input type="range" min="10" max="60" defaultValue="30" className="w-full" />
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Limite de mémoire</span>
                        <span className="text-sm text-gray-600">512 MB</span>
                      </div>
                      <input type="range" min="256" max="1024" defaultValue="512" className="w-full" />
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Délai entre tentatives</span>
                        <span className="text-sm text-gray-600">5 minutes</span>
                      </div>
                      <input type="range" min="1" max="60" defaultValue="5" className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration des Triggers Produits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Configuration des Triggers sur Cartes Produits
              </CardTitle>
              <CardDescription>
                Paramétrage des déclencheurs automatiques sur les cartes et pages produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Triggers de Vue Produit */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Triggers de Vue Produit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Popup Produit Populaire</label>
                          <p className="text-xs text-gray-600">Afficher un popup pour les produits populaires</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Recommandations Automatiques</label>
                          <p className="text-xs text-gray-600">Afficher des produits similaires</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Mise en Évidence Stock</label>
                          <p className="text-xs text-gray-600">Souligner les produits en stock limité</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil de Popularité</label>
                        <Input 
                          type="number" 
                          defaultValue="100" 
                          className="w-full"
                          placeholder="Nombre minimum de vues"
                        />
                        <p className="text-xs text-gray-500">Nombre minimum de vues pour déclencher le popup</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Délai d'Affichage</label>
                        <Input 
                          type="number" 
                          defaultValue="30" 
                          className="w-full"
                          placeholder="Secondes"
                        />
                        <p className="text-xs text-gray-500">Temps avant affichage des recommandations</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Triggers d'Interaction Produit */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Triggers d'Interaction</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Ajout Panier</label>
                          <p className="text-xs text-gray-600">Notification lors de l'ajout au panier</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Suggestion Accessoires</label>
                          <p className="text-xs text-gray-600">Proposer des accessoires complémentaires</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Prix</label>
                          <p className="text-xs text-gray-600">Notifier les changements de prix</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre d'Accessoires</label>
                        <Input 
                          type="number" 
                          defaultValue="3" 
                          className="w-full"
                          min="1"
                          max="6"
                        />
                        <p className="text-xs text-gray-500">Nombre max d'accessoires à suggérer</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil de Variation Prix</label>
                        <Input 
                          type="number" 
                          defaultValue="10" 
                          className="w-full"
                          placeholder="Pourcentage"
                        />
                        <p className="text-xs text-gray-500">Variation de prix pour déclencher l'alerte</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration des Popups */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Configuration des Popups</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Animation par Défaut</label>
                      <Select defaultValue="fade">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fade">Fondu</SelectItem>
                          <SelectItem value="slide">Glissement</SelectItem>
                          <SelectItem value="bounce">Rebond</SelectItem>
                          <SelectItem value="none">Aucune</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Type d'animation des popups</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Durée d'Affichage</label>
                      <Input 
                        type="number" 
                        defaultValue="5000" 
                        className="w-full"
                        min="1000"
                        max="30000"
                        step="1000"
                      />
                      <p className="text-xs text-gray-500">Temps d'affichage en millisecondes</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Position par Défaut</label>
                      <Select defaultValue="center">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Haut Gauche</SelectItem>
                          <SelectItem value="top-center">Haut Centre</SelectItem>
                          <SelectItem value="top-right">Haut Droite</SelectItem>
                          <SelectItem value="center">Centre</SelectItem>
                          <SelectItem value="bottom-left">Bas Gauche</SelectItem>
                          <SelectItem value="bottom-center">Bas Centre</SelectItem>
                          <SelectItem value="bottom-right">Bas Droite</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Position d'affichage des popups</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration des Recommandations */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Configuration des Recommandations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre de Produits</label>
                        <Input 
                          type="number" 
                          defaultValue="4" 
                          className="w-full"
                          min="1"
                          max="10"
                        />
                        <p className="text-xs text-gray-500">Nombre max de produits recommandés</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Délai d'Affichage</label>
                        <Input 
                          type="number" 
                          defaultValue="30" 
                          className="w-full"
                          min="5"
                          max="120"
                          step="5"
                        />
                        <p className="text-xs text-gray-500">Temps avant affichage en secondes</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Critère de Tri</label>
                        <Select defaultValue="popularity">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="popularity">Popularité</SelectItem>
                            <SelectItem value="relevance">Pertinence</SelectItem>
                            <SelectItem value="price-low">Prix croissant</SelectItem>
                            <SelectItem value="price-high">Prix décroissant</SelectItem>
                            <SelectItem value="rating">Note</SelectItem>
                            <SelectItem value="recent">Récent</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">Critère de tri des recommandations</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Filtre Catégorie</label>
                        <Select defaultValue="same">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same">Même catégorie</SelectItem>
                            <SelectItem value="related">Catégories liées</SelectItem>
                            <SelectItem value="all">Toutes catégories</SelectItem>
                            <SelectItem value="custom">Personnalisé</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">Filtre des catégories pour recommandations</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration des Alertes */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Configuration des Alertes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Stock Faible</label>
                          <p className="text-xs text-gray-600">Notifier quand le stock est faible</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Prix Réduit</label>
                          <p className="text-xs text-gray-600">Notifier les réductions de prix</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Nouveau Produit</label>
                          <p className="text-xs text-gray-600">Notifier les nouveaux produits</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil Stock Faible</label>
                        <Input 
                          type="number" 
                          defaultValue="5" 
                          className="w-full"
                          min="1"
                          max="20"
                        />
                        <p className="text-xs text-gray-500">Nombre d'unités pour déclencher l'alerte</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil Réduction Prix</label>
                        <Input 
                          type="number" 
                          defaultValue="15" 
                          className="w-full"
                          placeholder="Pourcentage"
                        />
                        <p className="text-xs text-gray-500">Pourcentage minimum de réduction</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration des Triggers d'Incitation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Configuration des Triggers d'Incitation
              </CardTitle>
              <CardDescription>
                Paramétrage des déclencheurs pour augmenter l'engagement et les conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Triggers d'Engagement */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Triggers d'Engagement</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Abandon Panier</label>
                          <p className="text-xs text-gray-600">Popup lors de la sortie avec panier non vide</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Incitation Défilement</label>
                          <p className="text-xs text-gray-600">Afficher du contenu selon la profondeur</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Rappel Visiteur</label>
                          <p className="text-xs text-gray-600">Offres spéciales pour visiteurs de retour</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil Défilement</label>
                        <Input 
                          type="number" 
                          defaultValue="70" 
                          className="w-full"
                          min="10"
                          max="100"
                          step="10"
                        />
                        <p className="text-xs text-gray-500">Pourcentage de défilement pour déclencher</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Délai Sortie</label>
                        <Input 
                          type="number" 
                          defaultValue="3" 
                          className="w-full"
                          min="1"
                          max="10"
                        />
                        <p className="text-xs text-gray-500">Secondes avant déclenchement sortie</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration des Offres */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Configuration des Offres</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Réduction Maximum</label>
                      <Input 
                        type="number" 
                        defaultValue="25" 
                        className="w-full"
                        min="5"
                        max="50"
                        step="5"
                      />
                      <p className="text-xs text-gray-500">Pourcentage maximum de réduction</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fréquence des Offres</label>
                      <Input 
                        type="number" 
                        defaultValue="3" 
                        className="w-full"
                        min="1"
                        max="10"
                      />
                      <p className="text-xs text-gray-500">Offres max par utilisateur</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Durée de Validité</label>
                      <Input 
                        type="number" 
                        defaultValue="24" 
                        className="w-full"
                        min="1"
                        max="168"
                      />
                      <p className="text-xs text-gray-500">Heures de validité des offres</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration des Notifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Configuration des Notifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Notifications Push</label>
                          <p className="text-xs text-gray-600">Activer les notifications push</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Notifications Email</label>
                          <p className="text-xs text-gray-600">Activer les notifications email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Notifications SMS</label>
                          <p className="text-xs text-gray-600">Activer les notifications SMS</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fréquence Max</label>
                        <Input 
                          type="number" 
                          defaultValue="2" 
                          className="w-full"
                          min="1"
                          max="5"
                        />
                        <p className="text-xs text-gray-500">Notifications max par jour</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Heures d'Envoi</label>
                        <Select defaultValue="9-21">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9-21">9h - 21h</SelectItem>
                            <SelectItem value="8-22">8h - 22h</SelectItem>
                            <SelectItem value="24h">24h/24</SelectItem>
                            <SelectItem value="custom">Personnalisé</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">Plage horaire d'envoi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de création/édition de déclencheur */}
      <Dialog open={showCreateModal || showEditModal} onOpenChange={(open) => {
        if (!open) {
          setShowCreateModal(false)
          setShowEditModal(false)
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {selectedTrigger ? 'Modifier le déclencheur' : 'Nouveau déclencheur'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="triggerName">Nom du déclencheur</Label>
                <Input
                  id="triggerName"
                  placeholder="Ex: Nouvelle Commande"
                  defaultValue={selectedTrigger?.name}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerEvent">Événement déclencheur</Label>
                <Select defaultValue={selectedTrigger?.event || 'order.created'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order.created">Commande créée</SelectItem>
                    <SelectItem value="order.updated">Commande mise à jour</SelectItem>
                    <SelectItem value="order.cancelled">Commande annulée</SelectItem>
                    <SelectItem value="stock.low">Stock faible</SelectItem>
                    <SelectItem value="payment.failed">Paiement échoué</SelectItem>
                    <SelectItem value="payment.success">Paiement réussi</SelectItem>
                    <SelectItem value="user.registered">Utilisateur inscrit</SelectItem>
                    <SelectItem value="vendor.approved">Vendeur approuvé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerDescription">Description</Label>
              <Textarea
                id="triggerDescription"
                placeholder="Description détaillée du déclencheur"
                rows={3}
                defaultValue={selectedTrigger?.description}
              />
            </div>

            {/* Priorité et statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="triggerPriority">Priorité</Label>
                <Select defaultValue={selectedTrigger?.priority || 'medium'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerStatus">Statut initial</Label>
                <Select defaultValue={selectedTrigger?.status || 'draft'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="paused">En pause</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Configuration technique */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="triggerTimeout">Timeout (secondes)</Label>
                <Input
                  id="triggerTimeout"
                  type="number"
                  min="1"
                  max="300"
                  defaultValue={selectedTrigger?.timeout || 30}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerRetryCount">Nombre de tentatives</Label>
                <Input
                  id="triggerRetryCount"
                  type="number"
                  min="0"
                  max="10"
                  defaultValue={selectedTrigger?.retryCount || 3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerRetryDelay">Délai entre tentatives (secondes)</Label>
                <Input
                  id="triggerRetryDelay"
                  type="number"
                  min="1"
                  max="3600"
                  defaultValue={selectedTrigger?.retryDelay || 300}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="triggerTags">Tags</Label>
              <Input
                id="triggerTags"
                placeholder="Ex: commande, email, notification (séparés par des virgules)"
                defaultValue={selectedTrigger?.tags.join(', ')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false)
              setShowEditModal(false)
            }}>
              Annuler
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              {selectedTrigger ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation d'exécution */}
      <Dialog open={showExecutionModal} onOpenChange={setShowExecutionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de l'exécution
            </DialogTitle>
          </DialogHeader>
          
          {selectedExecution && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Déclencheur</Label>
                  <p className="text-sm">{selectedExecution.triggerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Statut</Label>
                  <Badge variant={selectedExecution.status === 'success' ? 'default' : 
                                 selectedExecution.status === 'failed' ? 'destructive' : 
                                 selectedExecution.status === 'running' ? 'secondary' : 'outline'}>
                    {selectedExecution.status === 'success' ? 'Succès' : 
                     selectedExecution.status === 'failed' ? 'Échec' : 
                     selectedExecution.status === 'running' ? 'En cours' : 'Annulé'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Début</Label>
                  <p className="text-sm">{formatDate(selectedExecution.startTime)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Durée</Label>
                  <p className="text-sm">{formatDuration(selectedExecution.duration)}</p>
                </div>
              </div>
              
              {selectedExecution.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <Label className="text-sm font-medium text-red-800">Message d'erreur</Label>
                  <p className="text-sm text-red-700 mt-1">{selectedExecution.errorMessage}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Données d'exécution</Label>
                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedExecution.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal des statistiques */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Statistiques Détaillées
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.totalTriggers}</p>
                <p className="text-sm text-blue-800">Total déclencheurs</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.activeTriggers}</p>
                <p className="text-sm text-green-800">Déclencheurs actifs</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.successRate.toFixed(1)}%</p>
                <p className="text-sm text-purple-800">Taux de succès</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{formatDuration(stats.averageExecutionTime)}</p>
                <p className="text-sm text-orange-800">Temps moyen</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Activité 24h</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Exécutions:</span>
                    <span className="font-medium">{stats.last24Hours.executions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erreurs:</span>
                    <span className="font-medium text-red-600">{stats.last24Hours.errors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nouveaux déclencheurs:</span>
                    <span className="font-medium">{stats.last24Hours.newTriggers}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total exécutions:</span>
                    <span className="font-medium">{stats.totalExecutions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erreurs totales:</span>
                    <span className="font-medium text-red-600">{stats.totalErrors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps moyen:</span>
                    <span className="font-medium">{formatDuration(stats.averageExecutionTime)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium mb-2">Répartition</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Actifs:</span>
                    <span className="font-medium text-green-600">{stats.activeTriggers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En pause:</span>
                    <span className="font-medium text-yellow-600">{stats.totalTriggers - stats.activeTriggers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En erreur:</span>
                    <span className="font-medium text-red-600">{triggers.filter(t => t.status === 'error').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuration des rapports */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Configuration du Rapport
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportName">Nom du rapport</Label>
                  <Input 
                    id="reportName" 
                    value={selectedReport.name}
                    onChange={(e) => updateReportSettings(selectedReport.id, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportSchedule">Programmation</Label>
                  <Input 
                    id="reportSchedule" 
                    value={selectedReport.schedule}
                    onChange={(e) => updateReportSettings(selectedReport.id, 'schedule', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportDescription">Description</Label>
                <Textarea 
                  id="reportDescription" 
                  value={selectedReport.description}
                  onChange={(e) => updateReportSettings(selectedReport.id, 'description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Formats supportés</Label>
                <div className="flex items-center gap-2">
                  {['PDF', 'Excel', 'CSV', 'PowerPoint'].map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`format-${format}`}
                        checked={selectedReport.format.includes(format)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateReportSettings(selectedReport.id, 'format', [...selectedReport.format, format])
                          } else {
                            updateReportSettings(selectedReport.id, 'format', selectedReport.format.filter(f => f !== format))
                          }
                        }}
                      />
                      <label htmlFor={`format-${format}`} className="text-sm">{format}</label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportRecipients">Destinataires</Label>
                <Input 
                  id="reportRecipients" 
                  value={selectedReport.recipients.join(', ')}
                  onChange={(e) => updateReportSettings(selectedReport.id, 'recipients', e.target.value.split(',').map(email => email.trim()))}
                  placeholder="email1@exemple.com, email2@exemple.com"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="reportEnabled" 
                  checked={selectedReport.isEnabled}
                  onCheckedChange={(checked) => updateReportSettings(selectedReport.id, 'isEnabled', checked)}
                />
                <Label htmlFor="reportEnabled">Rapport activé</Label>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => deleteReport(selectedReport?.id || '')}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
                <Button variant="outline" onClick={() => setShowReportModal(false)}>
                  Fermer
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={saveReportConfigurationModal}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails des erreurs */}
      <Dialog open={showErrorDetailsModal} onOpenChange={setShowErrorDetailsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Détails de l'Erreur
            </DialogTitle>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-lg">{selectedError.error}</h4>
                    <p className="text-sm text-gray-600">{selectedError.solution}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Nombre d'occurrences:</span>
                      <Badge variant="destructive">{selectedError.count}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Impact:</span>
                      <Badge variant={selectedError.impact === 'Élevé' ? 'destructive' : 
                                     selectedError.impact === 'Moyen' ? 'secondary' : 'outline'}>
                        {selectedError.impact}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Priorité:</span>
                      <Badge variant={selectedError.priority === 'Critique' ? 'destructive' : 
                                     selectedError.priority === 'Élevée' ? 'secondary' : 
                                     selectedError.priority === 'Moyenne' ? 'outline' : 'default'}>
                        {selectedError.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Dernière occurrence:</span>
                      <span className="text-sm text-gray-600">{formatDate(selectedError.lastOccurrence)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="font-medium">Triggers affectés</h5>
                  <div className="space-y-2">
                    {selectedError.affectedTriggers.map((trigger, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">{trigger}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium">Actions recommandées</h5>
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => viewDetailedLogs(selectedError?.id || '')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir les logs détaillés
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => restartTriggers(selectedError?.id || '')}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Relancer les triggers
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => adjustConfiguration(selectedError?.id || '')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Ajuster la configuration
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowErrorDetailsModal(false)}>
                  Fermer
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => markErrorAsResolved(selectedError?.id || '')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Marquer comme résolu
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails des prédictions */}
      <Dialog open={showPredictionModal} onOpenChange={setShowPredictionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Analyse Prédictive
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Section des statistiques générales */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-lg text-purple-800 mb-3">Vue d'ensemble des prédictions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">8.7</div>
                  <div className="text-sm text-gray-600">Score de précision</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">94%</div>
                  <div className="text-sm text-gray-600">Confiance moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+12%</div>
                  <div className="text-sm text-gray-600">Amélioration prévue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">7 jours</div>
                  <div className="text-sm text-gray-600">Horizon de prédiction</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-lg">Métriques Prédictives Détaillées</h4>
              <div className="space-y-4">
                {analyticsPredictions.map((prediction, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">{prediction.metric}</h5>
                      <Badge variant={prediction.trend === 'up' ? 'default' : 
                                     prediction.trend === 'down' ? 'secondary' : 'outline'}>
                        {prediction.trend === 'up' ? '↗ Hausse' : 
                         prediction.trend === 'down' ? '↘ Baisse' : '→ Stable'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{prediction.currentValue}</div>
                        <div className="text-sm text-gray-600">Valeur actuelle</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{prediction.predictedValue}</div>
                        <div className="text-sm text-gray-600">Valeur prédite</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Confiance:</span>
                        <span className="text-sm font-medium">{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${prediction.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h6 className="font-medium text-sm mb-2">Facteurs d'influence:</h6>
                      <div className="space-y-1">
                        {prediction.factors.map((factor, factorIndex) => (
                          <div key={factorIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section des tendances historiques */}
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Tendances Historiques</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dernière semaine</span>
                    <span className="text-green-600 font-medium">+5.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dernier mois</span>
                    <span className="text-blue-600 font-medium">+12.8%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dernier trimestre</span>
                    <span className="text-purple-600 font-medium">+28.4%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section des recommandations d'amélioration */}
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Recommandations d'Amélioration</h4>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-green-800">Optimiser les horaires de déclenchement</h6>
                      <p className="text-sm text-green-600 mt-1">
                        Les analyses montrent que les déclenchements entre 9h-11h ont 23% plus de succès.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-blue-800">Augmenter la fréquence des notifications</h6>
                      <p className="text-sm text-blue-600 mt-1">
                        Une augmentation de 15% de la fréquence pourrait améliorer l'engagement de 8%.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-purple-800">Personnaliser les conditions de déclenchement</h6>
                      <p className="text-sm text-purple-600 mt-1">
                        L'ajout de conditions basées sur l'historique utilisateur pourrait augmenter la précision de 12%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section des alertes et risques */}
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Alertes et Risques Identifiés</h4>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-yellow-800">Surcharge potentielle du système</h6>
                      <p className="text-sm text-yellow-600 mt-1">
                        Risque de surcharge détecté pour les prochains 3 jours lors des pics d'activité.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-red-800">Déclencheurs obsolètes détectés</h6>
                      <p className="text-sm text-red-600 mt-1">
                        3 déclencheurs n'ont pas été utilisés depuis plus de 30 jours et pourraient être désactivés.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section des prochaines actions suggérées */}
            <div className="space-y-4 pb-4">
              <h4 className="font-medium text-lg">Prochaines Actions Suggérées</h4>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-sm">Réviser les paramètres des déclencheurs à faible performance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-sm">Implémenter les recommandations d'optimisation horaire</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-sm">Planifier une maintenance préventive pour éviter la surcharge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                    <span className="text-sm">Archiver ou réactiver les déclencheurs obsolètes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section des actions de maintenance et sécurité */}
            <div className="space-y-4 pb-4">
              <h4 className="font-medium text-lg">Actions de Maintenance et Sécurité</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Settings className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-green-800">Maintenance Préventive</h6>
                      <p className="text-sm text-green-600 mt-1">
                        Exécuter une maintenance préventive complète du système
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={performPreventiveMaintenance}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Lancer la maintenance
                  </Button>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h6 className="font-medium text-blue-800">Analyse de Sécurité</h6>
                      <p className="text-sm text-blue-600 mt-1">
                        Effectuer une analyse complète de la sécurité du système
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={performSecurityAnalysis}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Analyser la sécurité
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" onClick={() => setShowPredictionModal(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={viewMorePredictionDetails}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Voir plus de détails
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={exportPredictionData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter les données
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des filtres avancés */}
      <Dialog open={showAdvancedFiltersModal} onOpenChange={setShowAdvancedFiltersModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Filtres Avancés des Déclencheurs
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Type d'événement</Label>
                  <Select 
                    value={advancedFilters.eventType} 
                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, eventType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="order">Commandes</SelectItem>
                      <SelectItem value="user">Utilisateurs</SelectItem>
                      <SelectItem value="product">Produits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="executionRange">Plage d'exécutions</Label>
                  <Select 
                    value={advancedFilters.executionRange} 
                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, executionRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les plages</SelectItem>
                      <SelectItem value="low">Faible (&lt; 50)</SelectItem>
                      <SelectItem value="medium">Moyenne (50-200)</SelectItem>
                      <SelectItem value="high">Élevée (&gt; 200)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="successRateRange">Taux de succès</Label>
                  <Select 
                    value={advancedFilters.successRateRange} 
                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, successRateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les taux</SelectItem>
                      <SelectItem value="low">Faible (&lt; 80%)</SelectItem>
                      <SelectItem value="medium">Moyen (80-95%)</SelectItem>
                      <SelectItem value="high">Élevé (&gt; 95%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Colonne droite */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dateRange">Plage de dates</Label>
                  <Select 
                    value={advancedFilters.dateRange} 
                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les dates</SelectItem>
                      <SelectItem value="recent">Récent (&lt; 7 jours)</SelectItem>
                      <SelectItem value="old">Ancien (&gt; 30 jours)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="isRecurring">Déclencheurs récurrents</Label>
                  <Select 
                    value={advancedFilters.isRecurring} 
                    onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, isRecurring: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="yes">Récurrents uniquement</SelectItem>
                      <SelectItem value="no">Non récurrents uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags spécifiques</Label>
                  <div className="space-y-2">
                    {['commande', 'email', 'notification', 'webhook', 'api'].map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`tag-${tag}`}
                          checked={advancedFilters.tags.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                tags: [...prev.tags, tag]
                              }))
                            } else {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                tags: prev.tags.filter(t => t !== tag)
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`tag-${tag}`} className="text-sm capitalize">
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Résumé des filtres actifs */}
            <div className="space-y-3">
              <h4 className="font-medium">Filtres actifs</h4>
              <div className="flex flex-wrap gap-2">
                {advancedFilters.eventType !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Type: {advancedFilters.eventType}
                  </Badge>
                )}
                {advancedFilters.executionRange !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Exécutions: {advancedFilters.executionRange}
                  </Badge>
                )}
                {advancedFilters.successRateRange !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Succès: {advancedFilters.successRateRange}
                  </Badge>
                )}
                {advancedFilters.dateRange !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Date: {advancedFilters.dateRange}
                  </Badge>
                )}
                {advancedFilters.isRecurring !== 'all' && (
                  <Badge variant="outline" className="text-xs">
                    Récurrent: {advancedFilters.isRecurring}
                  </Badge>
                )}
                {advancedFilters.tags.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Tags: {advancedFilters.tags.join(', ')}
                  </Badge>
                )}
                {Object.values(advancedFilters).every(value => 
                  value === 'all' || (Array.isArray(value) && value.length === 0)
                ) && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    Aucun filtre actif
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={resetAdvancedFilters}>
                Réinitialiser
              </Button>
              <Button variant="outline" onClick={() => setShowAdvancedFiltersModal(false)}>
                Annuler
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={applyAdvancedFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Appliquer les Filtres
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'options d'export */}
      <Dialog open={showExportOptionsModal} onOpenChange={setShowExportOptionsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-emerald-600" />
              Options d'Export des Déclencheurs
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Formats d'Export Disponibles</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all"
                  onClick={() => exportInFormat('csv')}
                  disabled={isExportingTriggers}
                >
                  <Download className="h-6 w-6 text-blue-600" />
                  <span>CSV</span>
                  <span className="text-xs text-gray-500">Format standard</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all"
                  onClick={() => exportInFormat('excel')}
                  disabled={isExportingTriggers}
                >
                  <Download className="h-6 w-6 text-green-600" />
                  <span>Excel</span>
                  <span className="text-xs text-gray-500">Format tableur</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 hover:shadow-md transition-all"
                  onClick={() => exportInFormat('json')}
                  disabled={isExportingTriggers}
                >
                  <Download className="h-6 w-6 text-purple-600" />
                  <span>JSON</span>
                  <span className="text-xs text-gray-500">Format API</span>
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Export Rapide</h4>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={exportTriggers}
                disabled={isExportingTriggers}
              >
                {isExportingTriggers ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter en CSV (Format par défaut)
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-lg">Informations d'Export</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Déclencheurs à exporter</div>
                  <div className="text-2xl font-bold text-blue-600">{filteredTriggers.length}</div>
                  <div className="text-gray-500">Total filtré</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">Dernier export</div>
                  <div className="text-sm text-gray-600">
                    {analyticsExports.length > 0 ? formatDate(analyticsExports[0].createdAt) : 'Aucun'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowExportOptionsModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des détails détaillés des prédictions */}
      <Dialog open={showDetailedPredictionsModal} onOpenChange={setShowDetailedPredictionsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Détails Complets des Prédictions
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Résumé exécutif */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-medium text-xl text-purple-800 mb-4">Résumé Exécutif</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{analyticsPredictions.length}</div>
                  <div className="text-sm text-gray-600">Métriques analysées</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {(analyticsPredictions.reduce((sum, p) => sum + p.confidence, 0) / analyticsPredictions.length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Confiance moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {analyticsPredictions.filter(p => p.trend === 'up').length}
                  </div>
                  <div className="text-sm text-gray-600">Tendances positives</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {analyticsPredictions.filter(p => p.trend === 'down').length}
                  </div>
                  <div className="text-sm text-gray-600">Tendances négatives</div>
                </div>
              </div>
            </div>

            {/* Analyse détaillée par métrique */}
            <div className="space-y-6">
              <h4 className="font-medium text-xl">Analyse Détaillée par Métrique</h4>
              {analyticsPredictions.map((prediction, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-lg">{prediction.metric}</h5>
                    <Badge variant={prediction.trend === 'up' ? 'default' : 
                                   prediction.trend === 'down' ? 'secondary' : 'outline'}>
                      {prediction.trend === 'up' ? '↗ Hausse' : 
                       prediction.trend === 'down' ? '↘ Baisse' : '→ Stable'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{prediction.currentValue}</div>
                      <div className="text-sm text-gray-600">Valeur actuelle</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{prediction.predictedValue}</div>
                      <div className="text-sm text-gray-600">Valeur prédite</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{(prediction.confidence * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Niveau de confiance</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Barre de confiance:</span>
                      <span className="text-sm font-medium">{(prediction.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${prediction.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommandations d'action */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-medium text-xl text-green-800 mb-4">Recommandations d'Action</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h6 className="font-medium text-green-800">Surveiller les métriques en baisse</h6>
                    <p className="text-sm text-green-600">Mettre en place des alertes pour les tendances négatives</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h6 className="font-medium text-green-800">Capitaliser sur les tendances positives</h6>
                    <p className="text-sm text-green-600">Renforcer les facteurs qui contribuent aux améliorations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h6 className="font-medium text-green-800">Ajuster les modèles de prédiction</h6>
                    <p className="text-sm text-green-600">Optimiser les algorithmes pour améliorer la précision</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t mt-6">
            <Button variant="outline" onClick={() => setShowDetailedPredictionsModal(false)}>
              Fermer
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                // Télécharger le rapport détaillé
                const detailedReport = {
                  title: 'Rapport Détaillé des Prédictions',
                  date: new Date().toLocaleDateString('fr-FR'),
                  summary: {
                    totalMetrics: analyticsPredictions.length,
                    averageConfidence: (analyticsPredictions.reduce((sum, p) => sum + p.confidence, 0) / analyticsPredictions.length * 100).toFixed(1),
                    trendAnalysis: analyticsPredictions.filter(p => p.trend === 'up').length > analyticsPredictions.filter(p => p.trend === 'down').length ? 'Positif' : 'Négatif'
                  },
                  predictions: analyticsPredictions.map(p => ({
                    metric: p.metric,
                    currentValue: p.currentValue,
                    predictedValue: p.predictedValue,
                    confidence: (p.confidence * 100).toFixed(1) + '%',
                    trend: p.trend === 'up' ? '↗ Hausse' : p.trend === 'down' ? '↘ Baisse' : '→ Stable'
                  }))
                }
                
                const reportContent = JSON.stringify(detailedReport, null, 2)
                const blob = new Blob([reportContent], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `rapport-predictions-detaille-${new Date().toISOString().split('T')[0]}.json`
                link.click()
                URL.revokeObjectURL(url)
                
                addNotification({
                  type: 'success',
                  title: 'Rapport téléchargé',
                  message: 'Rapport détaillé téléchargé avec succès'
                })
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le rapport
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de progression de l'export */}
      <Dialog open={showExportProgressModal} onOpenChange={setShowExportProgressModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Export en cours...
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto">
                <RefreshCw className="w-full h-full text-green-600 animate-spin" />
              </div>
              <div>
                <h4 className="font-medium text-lg">Préparation de l'export</h4>
                <p className="text-sm text-gray-600">
                  Génération du fichier CSV avec {analyticsPredictions.length} métriques...
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all duration-1000" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-gray-500">Traitement en cours...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
