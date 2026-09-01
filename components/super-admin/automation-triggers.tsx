"use client"

import { useState, useEffect, useRef } from 'react'
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

interface AutomationEvent {
  id: string
  source: string
  eventType: string
  entityType: string
  entityId: string
  actorUserId: string
  payload: Record<string, any>
  createdAt: string
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
  const [events, setEvents] = useState<AutomationEvent[]>([])
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

  const searchDebounceRef = useRef<number | null>(null)
  const lastSearchSentRef = useRef<string>('')
  
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
  
  // États pour les boutons Exporter et Actualiser
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExportingTriggers, setIsExportingTriggers] = useState(false)
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false)
  const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] = useState(false)
  

  const [isSavingTrigger, setIsSavingTrigger] = useState(false)
  const [isDeletingTrigger, setIsDeletingTrigger] = useState(false)

  // États réels pour Analytics (API) et Paramètres persistés
  const [automationAnalytics, setAutomationAnalytics] = useState<any>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [analyticsErrors, setAnalyticsErrors] = useState<AnalyticsError[]>([])
  const [showErrorDetailsModal, setShowErrorDetailsModal] = useState(false)
  const [selectedError, setSelectedError] = useState<AnalyticsError | null>(null)
  const [globalSettings, setGlobalSettings] = useState<Record<string, any>>({})
  const [automationSettings, setAutomationSettings] = useState<Record<string, any>>({})
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false)

  const [triggerForm, setTriggerForm] = useState({
    name: '',
    event: 'order.created',
    description: '',
    priority: 'medium' as AutomationTrigger['priority'],
    status: 'draft' as AutomationTrigger['status'],
    timeout: 30,
    retryCount: 3,
    retryDelay: 300,
    tags: ''
  })

  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  // Charger les données au montage
  useEffect(() => {
    void loadAutomations()
  }, [])

  /**
   * Déclenche une recherche DB (via API) lorsque l'utilisateur saisit un texte.
   * Debounce pour éviter le spam réseau.
   */
  useEffect(() => {
    const q = searchTerm.trim()

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current)
      searchDebounceRef.current = null
    }

    // Si l'utilisateur efface, on recharge immédiatement la liste complète.
    if (!q) {
      if (lastSearchSentRef.current !== '') {
        lastSearchSentRef.current = ''
        void loadAutomations()
      }
      return
    }

    searchDebounceRef.current = window.setTimeout(() => {
      if (lastSearchSentRef.current === q) return
      lastSearchSentRef.current = q
      void loadAutomations()
    }, 350)

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = null
      }
    }
  }, [searchTerm])

  useEffect(() => {
    if (activeTab === 'events') {
      void loadAutomationEvents()
    }
    if (activeTab === 'executions') {
      void loadAutomationExecutions()
    }
    if (activeTab === 'analytics') {
      void loadAutomationAnalytics()
    }
    if (activeTab === 'settings') {
      void loadAutomationSettings()
    }
  }, [activeTab])

  /**
   * Charge les analytics réels depuis l'API super-admin.
   */
  const loadAutomationAnalytics = async () => {
    setIsLoadingAnalytics(true)
    try {
      const res = await fetch('/api/super-admin/automation-analytics?days=30', { method: 'GET' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Impossible de charger les analytics')
      }

      setAutomationAnalytics(json?.data ?? null)

      const topErrors = Array.isArray(json?.data?.topErrors) ? json.data.topErrors : []
      setAnalyticsErrors(
        topErrors.map((e: any, idx: number) => ({
          id: `err-${idx + 1}`,
          error: String(e?.message ?? 'Erreur'),
          count: Number(e?.count ?? 0),
          impact: 'Moyen',
          solution: 'Consulter les logs et corriger la cause racine',
          priority: 'Moyenne',
          lastOccurrence: String(e?.lastOccurrence ?? new Date().toISOString()),
          affectedTriggers: []
        }))
      )
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Analytics',
        message: e instanceof Error ? e.message : "Erreur lors du chargement des analytics"
      })
      setAutomationAnalytics(null)
      setAnalyticsErrors([])
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  /**
   * Charge les paramètres persistés (scope global) et extrait `settings.automation`.
   */
  const loadAutomationSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const res = await fetch('/api/super-admin/settings?scopes=global', { method: 'GET' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Impossible de charger les paramètres')
      }

      const record = Array.isArray(json?.data) ? json.data.find((r: any) => r?.scope === 'global') : null
      const settingsObj = (record && typeof record.settings === 'object' && record.settings) ? record.settings : {}
      setGlobalSettings(settingsObj)

      const nextAutomation = (settingsObj as any)?.automation && typeof (settingsObj as any).automation === 'object' ? (settingsObj as any).automation : {}
      setAutomationSettings(nextAutomation)
      setHasLoadedSettings(true)
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Paramètres',
        message: e instanceof Error ? e.message : "Erreur lors du chargement des paramètres"
      })
      setGlobalSettings({})
      setAutomationSettings({})
      setHasLoadedSettings(false)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  /**
   * Met à jour un paramètre d'automatisation (simple key-value).
   */
  const setAutoSetting = (key: string, value: any) => {
    setAutomationSettings((prev) => ({ ...prev, [key]: value }))
  }

  /**
   * Récupère un paramètre d'automatisation avec fallback.
   */
  const getAutoSetting = <T,>(key: string, fallback: T): T => {
    const v = (automationSettings as any)?.[key]
    return (typeof v === 'undefined' ? fallback : (v as T))
  }

  /**
   * Sauvegarde les paramètres d'automatisation dans `super_admin_settings` (scope global).
   */
  const saveAutomationSettings = async () => {
    if (!hasLoadedSettings) {
      addNotification({
        type: 'warning',
        title: 'Paramètres',
        message: 'Impossible de sauvegarder : les paramètres n\'ont pas été chargés (risque d\'écrasement).'
      })
      return
    }
    setIsSavingSettings(true)
    try {
      const payload = {
        scope: 'global',
        settings: {
          ...globalSettings,
          automation: automationSettings
        }
      }

      const res = await fetch('/api/super-admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Sauvegarde échouée')
      }

      const updatedSettings = json?.data?.settings && typeof json.data.settings === 'object' ? json.data.settings : payload.settings
      setGlobalSettings(updatedSettings)
      setAutomationSettings((updatedSettings as any)?.automation && typeof (updatedSettings as any).automation === 'object' ? (updatedSettings as any).automation : {})

      addNotification({
        type: 'success',
        title: 'Paramètres',
        message: 'Paramètres sauvegardés avec succès'
      })
    } catch (e) {
      addNotification({
        type: 'error',
        title: 'Paramètres',
        message: e instanceof Error ? e.message : 'Erreur lors de la sauvegarde'
      })
    } finally {
      setIsSavingSettings(false)
    }
  }

  /**
   * Mappe une ligne DB `automations` vers le format UI `AutomationTrigger`.
   */
  const mapAutomationRowToTrigger = (row: any): AutomationTrigger => {
    const conditionsObj = (row?.trigger_conditions && typeof row.trigger_conditions === 'object') ? row.trigger_conditions : {}
    const actionObj = (row?.action_config && typeof row.action_config === 'object') ? row.action_config : {}

    const statusFromCfg = typeof (conditionsObj as any)?.status === 'string' ? String((conditionsObj as any).status) : undefined
    const derivedStatus: AutomationTrigger['status'] = (() => {
      if (statusFromCfg === 'draft' || statusFromCfg === 'error') return statusFromCfg
      if (row?.is_active === true) return 'active'
      if (row?.is_active === false) return 'paused'
      return 'draft'
    })()

    const priorityFromCfg = typeof (conditionsObj as any)?.priority === 'string' ? String((conditionsObj as any).priority) : undefined
    const derivedPriority: AutomationTrigger['priority'] = (() => {
      if (priorityFromCfg === 'low' || priorityFromCfg === 'medium' || priorityFromCfg === 'high' || priorityFromCfg === 'critical') {
        return priorityFromCfg
      }
      return 'medium'
    })()

    const event = typeof row?.trigger_type === 'string' && row.trigger_type.trim() ? row.trigger_type : 'order.created'
    const conditions = Array.isArray((conditionsObj as any)?.conditions) ? (conditionsObj as any).conditions : []
    const actions = Array.isArray((actionObj as any)?.actions)
      ? (actionObj as any).actions
      : row?.action_type
        ? [{ id: '1', type: row.action_type, name: row.action_type, config: actionObj ?? {}, order: 1, isActive: true }]
        : []
    const tags = Array.isArray((conditionsObj as any)?.tags) ? (conditionsObj as any).tags : []

    const timeout = Number((conditionsObj as any)?.timeout ?? 30) || 30
    const retryCount = Number((conditionsObj as any)?.retryCount ?? 3) || 0
    const retryDelay = Number((conditionsObj as any)?.retryDelay ?? 300) || 0

    return {
      id: String(row?.id ?? ''),
      name: String(row?.name ?? ''),
      description: row?.description ? String(row.description) : '',
      event,
      conditions,
      actions,
      status: derivedStatus,
      priority: derivedPriority,
      executions: Number((conditionsObj as any)?.executions ?? 0) || 0,
      lastExecution: typeof (conditionsObj as any)?.lastExecution === 'string' ? String((conditionsObj as any).lastExecution) : '',
      successRate: Number((conditionsObj as any)?.successRate ?? 0) || 0,
      createdAt: typeof row?.created_at === 'string' ? row.created_at : '',
      updatedAt: typeof row?.updated_at === 'string' ? row.updated_at : '',
      tags,
      isRecurring: Boolean((conditionsObj as any)?.isRecurring ?? false),
      schedule: typeof (conditionsObj as any)?.schedule === 'string' ? String((conditionsObj as any).schedule) : undefined,
      maxExecutions: typeof (conditionsObj as any)?.maxExecutions === 'number' ? (conditionsObj as any).maxExecutions : undefined,
      timeout,
      retryCount,
      retryDelay
    }
  }

  /**
   * Charge les automations depuis l'API super-admin (source unique de vérité).
   */
  const loadAutomations = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.set('q', searchTerm.trim())
      params.set('limit', '200')
      params.set('offset', '0')

      const res = await fetch(`/api/super-admin/automations?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store'
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Chargement des automatisations échoué'))
      }

      const rows = Array.isArray(json?.data) ? json.data : []
      const nextTriggers = rows.map(mapAutomationRowToTrigger)

      setTriggers(nextTriggers)
      updateStats(nextTriggers, executions)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Automatisation',
        message: error instanceof Error ? error.message : 'Erreur de chargement.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const mapEventRowToEvent = (row: any): AutomationEvent => {
    const payload = row?.payload && typeof row.payload === 'object' ? row.payload : {}
    return {
      id: String(row?.id ?? ''),
      source: String(row?.source ?? 'system'),
      eventType: String(row?.event_type ?? ''),
      entityType: row?.entity_type ? String(row.entity_type) : '',
      entityId: row?.entity_id ? String(row.entity_id) : '',
      actorUserId: row?.actor_user_id ? String(row.actor_user_id) : '',
      payload,
      createdAt: row?.created_at ? String(row.created_at) : ''
    }
  }

  const mapExecutionRowToExecution = (row: any): AutomationExecution => {
    const triggerId = row?.automation_id ? String(row.automation_id) : ''
    const triggerName = triggers.find((t) => t.id === triggerId)?.name ?? 'Automatisation'

    const startedAt = row?.started_at ? String(row.started_at) : ''
    const finishedAt = row?.finished_at ? String(row.finished_at) : ''

    const durationMsRaw = row?.duration_ms
    const durationMs = typeof durationMsRaw === 'number' ? durationMsRaw : Number(durationMsRaw ?? NaN)
    const durationFromMs = Number.isFinite(durationMs) ? Math.max(0, durationMs) / 1000 : null

    const durationFromDates = (() => {
      if (!startedAt || !finishedAt) return null
      const s = new Date(startedAt).getTime()
      const e = new Date(finishedAt).getTime()
      if (!Number.isFinite(s) || !Number.isFinite(e)) return null
      const diff = e - s
      return diff >= 0 ? diff / 1000 : null
    })()

    const duration = durationFromMs ?? durationFromDates ?? 0

    const statusRaw = typeof row?.status === 'string' ? row.status.toLowerCase().trim() : 'pending'
    const status: AutomationExecution['status'] =
      statusRaw === 'success' || statusRaw === 'completed'
        ? 'success'
        : statusRaw === 'failed' || statusRaw === 'error'
          ? 'failed'
          : statusRaw === 'cancelled'
            ? 'cancelled'
            : 'running'

    const output = row?.output && typeof row.output === 'object' ? row.output : {}

    return {
      id: String(row?.id ?? ''),
      triggerId,
      triggerName,
      status,
      startTime: startedAt,
      endTime: finishedAt || undefined,
      duration,
      errorMessage: row?.error_message ? String(row.error_message) : undefined,
      retryCount: 0,
      data: output
    }
  }

  const loadAutomationEvents = async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '200')
      params.set('offset', '0')
      const res = await fetch(`/api/super-admin/automation-events?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store'
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Chargement des événements échoué'))
      }

      const rows = Array.isArray(json?.data) ? json.data : []
      setEvents(rows.map(mapEventRowToEvent))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Automatisation',
        message: error instanceof Error ? error.message : 'Erreur de chargement des événements.'
      })
    }
  }

  const loadAutomationExecutions = async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '200')
      params.set('offset', '0')
      const res = await fetch(`/api/super-admin/automation-executions?${params.toString()}`, {
        method: 'GET',
        cache: 'no-store'
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Chargement des exécutions échoué'))
      }

      const rows = Array.isArray(json?.data) ? json.data : []
      const mapped = rows.map(mapExecutionRowToExecution)
      setExecutions(mapped)
      updateStats(triggers, mapped)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Automatisation',
        message: error instanceof Error ? error.message : 'Erreur de chargement des exécutions.'
      })
    }
  }

  // Fonction pour actualiser les données (bouton Actualiser)
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      // Recharge toujours la source de vérité principale.
      await loadAutomations()

      // Recharge aussi les données du tab actif pour synchroniser UI/DB.
      if (activeTab === 'events') {
        await loadAutomationEvents()
      }
      if (activeTab === 'executions') {
        await loadAutomationExecutions()
      }
      if (activeTab === 'analytics') {
        await loadAutomationAnalytics()
      }
      if (activeTab === 'settings') {
        await loadAutomationSettings()
      }

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
      // Créer un fichier CSV avec les données des déclencheurs
      const csvContent = generateTriggersCSV(filteredTriggers)
      
      // Télécharger le fichier
      downloadCSV(csvContent, `declencheurs-automatisation-${new Date().toISOString().split('T')[0]}.csv`)

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
          // Export Excel: CSV compatible tableur (sans prétendre générer un vrai .xlsx).
          content = generateTriggersCSV(filteredTriggers)
          filename = `declencheurs-${new Date().toISOString().split('T')[0]}.csv`
          mimeType = 'text/csv;charset=utf-8;'
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

    const now = new Date()
    const newTriggers24h = triggers.filter((t) => {
      if (!t.createdAt) return false
      const created = new Date(t.createdAt)
      if (!Number.isFinite(created.getTime())) return false
      return (now.getTime() - created.getTime()) <= 24 * 60 * 60 * 1000
    }).length

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
        newTriggers: newTriggers24h
      }
    })
  }

  // Fonctions pour les recommandations d'amélioration
  const handleOptimizationAction = (action: string, type: string) => {
    let message = ''
    let notificationType: 'success' | 'info' | 'warning' = 'info'
    
    switch (action) {
      case 'configurer':
        message = `La configuration de ${type} doit être gérée côté backend (non disponible).`
        notificationType = 'warning'
        break
        
      case 'optimiser':
        message = `L'optimisation de ${type} nécessite un backend de maintenance (non disponible).`
        notificationType = 'warning'
        break
        
      case 'sécuriser':
        message = `La sécurisation de ${type} nécessite un backend de sécurité (non disponible).`
        notificationType = 'warning'
        break
        
      case 'voir':
        message = `Les détails d'optimisation pour ${type} nécessitent un backend d'analyse (non disponible).`
        notificationType = 'warning'
        break
        
      default:
        message = `Action "${action}" non disponible (backend requis).`
        notificationType = 'warning'
    }
    
    addNotification({
      type: notificationType,
      title: 'Action d\'optimisation',
      message: message
    })
  }

  const viewOptimizationDetails = (type: string) => {
    addNotification({
      type: 'warning',
      title: 'Optimisation',
      message: 'Non disponible : nécessite un backend d\'analyse/optimisation.'
    })
  }

  // Fonction pour la maintenance préventive
  const performPreventiveMaintenance = () => {
    addNotification({
      type: 'warning',
      title: 'Maintenance',
      message: 'Fonctionnalité non disponible (backend de maintenance requis).'
    })
  }

  // Fonction pour l'analyse de sécurité
  const performSecurityAnalysis = () => {
    addNotification({
      type: 'warning',
      title: 'Sécurité',
      message: 'Fonctionnalité non disponible (backend d\'analyse requis).'
    })
  }

  /**
   * Ouvre la modal de détails pour une erreur analytics.
   */
  const viewErrorDetails = (error: AnalyticsError) => {
    setSelectedError(error)
    setShowErrorDetailsModal(true)
  }

  // Fonctions pour les actions recommandées dans la modal des erreurs
  const viewDetailedLogs = (errorId: string) => {
    const error = analyticsErrors.find(e => e.id === errorId)
    if (error) {
      addNotification({
        type: 'warning',
        title: 'Logs',
        message: 'Non disponible : implémenter un endpoint de logs (exécutions) côté backend.'
      })
    }
  }

  const restartTriggers = (errorId: string) => {
    const error = analyticsErrors.find(e => e.id === errorId)
    if (error) {
      addNotification({
        type: 'warning',
        title: 'Relance',
        message: 'Non disponible : nécessite un endpoint backend pour relancer une automation.'
      })
    }
  }

  const adjustConfiguration = (errorId: string) => {
    const error = analyticsErrors.find(e => e.id === errorId)
    if (error) {
      addNotification({
        type: 'warning',
        title: 'Configuration',
        message: 'Non disponible : nécessite un backend d\'auto-tuning.'
      })
    }
  }

  const markErrorAsResolved = (errorId: string) => {
    addNotification({
      type: 'success',
      title: 'Erreur résolue',
      message: `Fenêtre fermée. La résolution réelle doit être suivie côté exécutions/logs.`
    })
    setShowErrorDetailsModal(false)
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
  /**
   * Active/Pause une automation en DB.
   */
  const toggleTriggerStatus = async (triggerId: string) => {
    const trigger = triggers.find((t) => t.id === triggerId)
    if (!trigger) return

    try {
      const nextStatus: AutomationTrigger['status'] = trigger.status === 'active' ? 'paused' : 'active'
      const isActive = nextStatus === 'active'
      const payload = {
        id: trigger.id,
        name: trigger.name,
        description: trigger.description,
        trigger_type: trigger.event,
        trigger_conditions: {
          conditions: trigger.conditions,
          tags: trigger.tags,
          priority: trigger.priority,
          status: nextStatus,
          timeout: trigger.timeout,
          retryCount: trigger.retryCount,
          retryDelay: trigger.retryDelay,
          isRecurring: trigger.isRecurring,
          schedule: trigger.schedule,
          maxExecutions: trigger.maxExecutions
        },
        action_type: 'multi',
        action_config: { actions: trigger.actions },
        is_active: isActive
      }

      const res = await fetch('/api/super-admin/automations', {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Mise à jour échouée'))
      }

      const updated = mapAutomationRowToTrigger(json?.data)
      setTriggers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      updateStats(triggers.map((t) => (t.id === updated.id ? updated : t)), executions)
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Automatisation',
        message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour.'
      })
    }
  }

  /**
   * Supprime une automation en DB.
   */
  const deleteTrigger = async (triggerId: string) => {
    if (isDeletingTrigger) return
    setIsDeletingTrigger(true)
    try {
      const res = await fetch('/api/super-admin/automations', {
        method: 'DELETE',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: triggerId })
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Suppression échouée'))
      }

      setTriggers((prev) => prev.filter((t) => t.id !== triggerId))
      updateStats(triggers.filter((t) => t.id !== triggerId), executions)
      addNotification({ type: 'success', title: 'Automatisation', message: 'Déclencheur supprimé.' })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Automatisation',
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression.'
      })
    } finally {
      setIsDeletingTrigger(false)
    }
  }

  const createNewTrigger = () => {
    setSelectedTrigger(null)
    setTriggerForm({
      name: '',
      event: 'order.created',
      description: '',
      priority: 'medium',
      status: 'draft',
      timeout: 30,
      retryCount: 3,
      retryDelay: 300,
      tags: ''
    })
    setShowCreateModal(true)
  }

  const editTrigger = (trigger: AutomationTrigger) => {
    setSelectedTrigger(trigger)
    setTriggerForm({
      name: trigger.name,
      event: trigger.event,
      description: trigger.description,
      priority: trigger.priority,
      status: trigger.status,
      timeout: trigger.timeout,
      retryCount: trigger.retryCount,
      retryDelay: trigger.retryDelay,
      tags: Array.isArray(trigger.tags) ? trigger.tags.join(', ') : ''
    })
    setShowEditModal(true)
  }

  /**
   * Crée ou met à jour un déclencheur en base.
   */
  const saveTrigger = async () => {
    if (isSavingTrigger) return

    const name = triggerForm.name.trim()
    const description = triggerForm.description.trim()
    const event = triggerForm.event
    if (!name) {
      addNotification({ type: 'error', title: 'Validation', message: 'Le nom du déclencheur est requis.' })
      return
    }
    if (!event) {
      addNotification({ type: 'error', title: 'Validation', message: "L'événement déclencheur est requis." })
      return
    }

    setIsSavingTrigger(true)
    try {
      const tags = triggerForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const isActive = triggerForm.status === 'active'

      const payload = {
        ...(selectedTrigger?.id ? { id: selectedTrigger.id } : {}),
        name,
        description: description.length > 0 ? description : null,
        trigger_type: event,
        trigger_conditions: {
          conditions: selectedTrigger?.conditions ?? [],
          tags,
          priority: triggerForm.priority,
          status: triggerForm.status,
          timeout: Number(triggerForm.timeout ?? 30) || 30,
          retryCount: Number(triggerForm.retryCount ?? 0) || 0,
          retryDelay: Number(triggerForm.retryDelay ?? 0) || 0,
          isRecurring: selectedTrigger?.isRecurring ?? false,
          schedule: selectedTrigger?.schedule,
          maxExecutions: selectedTrigger?.maxExecutions
        },
        action_type: 'multi',
        action_config: { actions: selectedTrigger?.actions ?? [] },
        is_active: isActive
      }

      const res = await fetch('/api/super-admin/automations', {
        method: selectedTrigger?.id ? 'PUT' : 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(String(json?.error ?? 'Sauvegarde échouée'))
      }

      const saved = mapAutomationRowToTrigger(json?.data)

      setTriggers((prev) => {
        const exists = prev.some((t) => t.id === saved.id)
        return exists ? prev.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...prev]
      })
      setShowCreateModal(false)
      setShowEditModal(false)
      setSelectedTrigger(null)
      addNotification({
        type: 'success',
        title: 'Automatisation',
        message: selectedTrigger?.id ? 'Déclencheur mis à jour.' : 'Déclencheur créé.'
      })
      void loadAutomations()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Automatisation',
        message: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.'
      })
    } finally {
      setIsSavingTrigger(false)
    }
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

                <div className="text-center py-10 text-gray-500">
                  <p className="text-lg font-medium">Aucun workflow</p>
                  <p className="text-sm">Les workflows seront listés ici dès que la gestion backend sera activée.</p>
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
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{event.eventType}</p>
                        <p className="text-sm text-gray-600">{event.entityType ? `${event.entityType}: ${event.entityId || '-'}` : '—'}</p>
                        <p className="text-xs text-gray-500">{formatDate(event.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{event.source}</Badge>
                    </div>
                  </div>
                ))}

                {events.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    <p className="text-lg font-medium">Aucun événement</p>
                    <p className="text-sm">Les événements apparaîtront ici dès qu'ils seront enregistrés par le système.</p>
                  </div>
                )}
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
                      {formatDuration(executions.length > 0 ? executions.reduce((sum, e) => sum + e.duration, 0) / executions.length : 0)}
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
          {isLoadingAnalytics && (
            <Card>
              <CardContent className="p-6">
                <div className="text-sm text-gray-600">Chargement des analytics...</div>
              </CardContent>
            </Card>
          )}

          {/* Vue d'ensemble des Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Taux de Succès Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{(automationAnalytics?.totals?.successRate ?? stats.successRate).toFixed(1)}%</div>
                <p className="text-xs text-gray-500 mt-1">Comparaison non disponible</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Exécutions 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{automationAnalytics?.totals?.last24Hours?.executions ?? stats.last24Hours.executions}</div>
                <p className="text-xs text-gray-500 mt-1">Comparaison non disponible</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Temps Moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatDuration(((automationAnalytics?.totals?.averageExecutionTimeMs ?? stats.averageExecutionTime) / 1000) || 0)}</div>
                <p className="text-xs text-gray-500 mt-1">Comparaison non disponible</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Erreurs 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{automationAnalytics?.totals?.last24Hours?.errors ?? stats.last24Hours.errors}</div>
                <p className="text-xs text-gray-500 mt-1">Comparaison non disponible</p>
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
                  {/* Données réelles: tendances 7 jours */}
                  <div className="space-y-3">
                    {(Array.isArray(automationAnalytics?.trends7d) ? automationAnalytics.trends7d : []).map((point: any) => {
                      const executionsValue = Number(point?.executions ?? 0)
                      const successRateValue = Number(point?.successRate ?? 0)
                      const max = Math.max(1, ...(Array.isArray(automationAnalytics?.trends7d) ? automationAnalytics.trends7d.map((p: any) => Number(p?.executions ?? 0)) : [1]))
                      const height = (executionsValue / max) * 100
                      const label = typeof point?.date === 'string' ? point.date.slice(5) : ''

                      return (
                        <div key={String(point?.date ?? label)} className="flex items-center gap-3">
                          <div className="w-12 text-sm text-gray-600">{label}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${height}%` }}
                            />
                          </div>
                          <div className="w-16 text-right">
                            <div className="text-sm font-medium">{executionsValue}</div>
                            <div className="text-xs text-gray-500">{successRateValue}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Total: {(Array.isArray(automationAnalytics?.trends7d) ? automationAnalytics.trends7d : []).reduce((acc: number, p: any) => acc + Number(p?.executions ?? 0), 0)} exécutions
                    </span>
                    <span>
                      Moyenne: {(
                        (Array.isArray(automationAnalytics?.trends7d) ? automationAnalytics.trends7d : []).reduce((acc: number, p: any) => acc + Number(p?.executions ?? 0), 0) /
                        Math.max(1, (Array.isArray(automationAnalytics?.trends7d) ? automationAnalytics.trends7d.length : 0))
                      ).toFixed(0)}/jour
                    </span>
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
                  {(Array.isArray(automationAnalytics?.performanceByTriggerType) ? automationAnalytics.performanceByTriggerType : []).map((item: any) => (
                    <div key={String(item?.triggerType ?? 'unknown')} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{String(item?.triggerType ?? 'unknown')}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{Number(item?.successRate ?? 0)}%</div>
                          <div className="text-xs text-gray-500">Succès</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{(Number(item?.avgDurationMs ?? 0) / 1000).toFixed(1)}s</div>
                          <div className="text-xs text-gray-500">Temps</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">{Number(item?.total ?? 0)}</div>
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
                      {(() => {
                        const counts = (Array.isArray(automationAnalytics?.topErrors) ? automationAnalytics.topErrors : []).map((e: any) => Number(e?.count ?? 0))
                        const total = counts.reduce((a: number, b: number) => a + b, 0)
                        const buckets = [
                          { priority: 'Critique', color: 'bg-red-500', min: 20 },
                          { priority: 'Élevée', color: 'bg-orange-500', min: 10 },
                          { priority: 'Moyenne', color: 'bg-yellow-500', min: 3 },
                          { priority: 'Faible', color: 'bg-green-500', min: 1 }
                        ]
                        const bucketCounts = buckets.map((b) => ({ ...b, count: counts.filter((c: number) => c >= b.min).length }))
                        return bucketCounts.map((item) => {
                          const percentage = total ? Math.round((item.count / Math.max(1, bucketCounts.reduce((acc, x) => acc + x.count, 0))) * 100) : 0
                          return { priority: item.priority, count: item.count, color: item.color, percentage }
                        })
                      })().map((item: any) => (
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Principaux types d'événements
              </CardTitle>
              <CardDescription>
                Basé sur les événements réellement enregistrés (30 jours)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(automationAnalytics?.topEventTypes) && automationAnalytics.topEventTypes.length > 0 ? (
                  <div className="space-y-3">
                    {automationAnalytics.topEventTypes.slice(0, 8).map((item: any) => (
                      <div key={String(item?.eventType ?? 'unknown')} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <div className="font-medium">{String(item?.eventType ?? 'unknown')}</div>
                        </div>
                        <div className="text-sm text-gray-700">{Number(item?.count ?? 0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">Aucun événement disponible pour le moment.</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">Événements (24h)</div>
                    <div className="text-lg font-semibold">{Number(automationAnalytics?.totals?.last24Hours?.events ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">Exécutions (24h)</div>
                    <div className="text-lg font-semibold">{Number(automationAnalytics?.totals?.last24Hours?.executions ?? 0).toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600">Erreurs (24h)</div>
                    <div className="text-lg font-semibold text-red-600">{Number(automationAnalytics?.totals?.last24Hours?.errors ?? 0).toLocaleString()}</div>
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
              <div className="space-y-2">
                <div className="text-sm text-gray-700">
                  Cette fonctionnalité nécessite un backend dédié (génération de fichiers, stockage, historique d'exports).
                </div>
                <div className="text-sm text-gray-600">
                  Pour l'instant, l'onglet Analytics affiche uniquement des données réelles calculées depuis Supabase.
                </div>
                <div className="pt-2">
                  <Button variant="outline" disabled className="w-full">
                    Export / Rapports (non disponible)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paramètres */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="font-medium">Paramètres persistés</div>
                <div className="text-sm text-gray-600">
                  {isLoadingSettings ? 'Chargement...' : 'Ces réglages sont sauvegardés dans Supabase (scope global).'}
                </div>
              </div>
              <Button onClick={saveAutomationSettings} disabled={isLoadingSettings || isSavingSettings}>
                {isSavingSettings ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>

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
                      <Switch checked={getAutoSetting('debugMode', false)} onCheckedChange={(v) => setAutoSetting('debugMode', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Exécution parallèle</label>
                        <p className="text-xs text-gray-600">Autoriser plusieurs exécutions simultanées</p>
                      </div>
                      <Switch checked={getAutoSetting('parallelExecution', true)} onCheckedChange={(v) => setAutoSetting('parallelExecution', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Limite de tentatives</label>
                        <p className="text-xs text-gray-600">Max 3 tentatives par déclencheur</p>
                      </div>
                      <Switch checked={getAutoSetting('retryLimitEnabled', true)} onCheckedChange={(v) => setAutoSetting('retryLimitEnabled', v)} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Performance</h4>
                  <div className="space-y-3">
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Temps d'exécution max</span>
                        <span className="text-sm text-gray-600">{getAutoSetting('maxExecutionSeconds', 30)} secondes</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="60"
                        value={getAutoSetting('maxExecutionSeconds', 30)}
                        onChange={(e) => setAutoSetting('maxExecutionSeconds', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Limite de mémoire</span>
                        <span className="text-sm text-gray-600">{getAutoSetting('memoryLimitMb', 512)} MB</span>
                      </div>
                      <input
                        type="range"
                        min="256"
                        max="1024"
                        value={getAutoSetting('memoryLimitMb', 512)}
                        onChange={(e) => setAutoSetting('memoryLimitMb', Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Délai entre tentatives</span>
                        <span className="text-sm text-gray-600">{getAutoSetting('retryDelayMinutes', 5)} minutes</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={getAutoSetting('retryDelayMinutes', 5)}
                        onChange={(e) => setAutoSetting('retryDelayMinutes', Number(e.target.value))}
                        className="w-full"
                      />
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
                        <Switch checked={getAutoSetting('productPopupPopularEnabled', true)} onCheckedChange={(v) => setAutoSetting('productPopupPopularEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Recommandations Automatiques</label>
                          <p className="text-xs text-gray-600">Afficher des produits similaires</p>
                        </div>
                        <Switch checked={getAutoSetting('productAutoRecommendationsEnabled', true)} onCheckedChange={(v) => setAutoSetting('productAutoRecommendationsEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Mise en Évidence Stock</label>
                          <p className="text-xs text-gray-600">Souligner les produits en stock limité</p>
                        </div>
                        <Switch checked={getAutoSetting('productLowStockHighlightEnabled', true)} onCheckedChange={(v) => setAutoSetting('productLowStockHighlightEnabled', v)} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil de Popularité</label>
                        <Input 
                          type="number" 
                          value={getAutoSetting('productPopularityThreshold', 100)}
                          onChange={(e) => setAutoSetting('productPopularityThreshold', Number(e.target.value))}
                          className="w-full"
                          placeholder="Nombre minimum de vues"
                        />
                        <p className="text-xs text-gray-500">Nombre minimum de vues pour déclencher le popup</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Délai d'Affichage</label>
                        <Input 
                          type="number" 
                          value={getAutoSetting('productRecommendationsDelaySeconds', 30)}
                          onChange={(e) => setAutoSetting('productRecommendationsDelaySeconds', Number(e.target.value))}
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
                        <Switch checked={getAutoSetting('productAddToCartAlertEnabled', true)} onCheckedChange={(v) => setAutoSetting('productAddToCartAlertEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Suggestion Accessoires</label>
                          <p className="text-xs text-gray-600">Proposer des accessoires complémentaires</p>
                        </div>
                        <Switch checked={getAutoSetting('productAccessorySuggestionsEnabled', true)} onCheckedChange={(v) => setAutoSetting('productAccessorySuggestionsEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Prix</label>
                          <p className="text-xs text-gray-600">Notifier les changements de prix</p>
                        </div>
                        <Switch checked={getAutoSetting('productPriceAlertEnabled', true)} onCheckedChange={(v) => setAutoSetting('productPriceAlertEnabled', v)} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nombre d'Accessoires</label>
                        <Input 
                          type="number" 
                          value={String(getAutoSetting('productAccessoryMaxCount', 3))}
                          onChange={(e) => setAutoSetting('productAccessoryMaxCount', Number(e.target.value ?? 0) || 0)}
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
                          value={String(getAutoSetting('productPriceVariationThresholdPercent', 10))}
                          onChange={(e) => setAutoSetting('productPriceVariationThresholdPercent', Number(e.target.value ?? 0) || 0)}
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
                      <Select value={String(getAutoSetting('productPopupAnimation', 'fade'))} onValueChange={(v) => setAutoSetting('productPopupAnimation', v)}>
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
                        value={String(getAutoSetting('productPopupDisplayMs', 5000))}
                        onChange={(e) => setAutoSetting('productPopupDisplayMs', Number(e.target.value ?? 0) || 0)}
                        className="w-full"
                        min="1000"
                        max="30000"
                        step="1000"
                      />
                      <p className="text-xs text-gray-500">Temps d'affichage en millisecondes</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Position par Défaut</label>
                      <Select value={String(getAutoSetting('productPopupPosition', 'center'))} onValueChange={(v) => setAutoSetting('productPopupPosition', v)}>
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
                          value={String(getAutoSetting('productRecommendationsMaxProducts', 4))}
                          onChange={(e) => setAutoSetting('productRecommendationsMaxProducts', Number(e.target.value ?? 0) || 0)}
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
                          value={String(getAutoSetting('productRecommendationsDisplayDelaySeconds', 30))}
                          onChange={(e) => setAutoSetting('productRecommendationsDisplayDelaySeconds', Number(e.target.value ?? 0) || 0)}
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
                        <Select value={String(getAutoSetting('productRecommendationsSort', 'popularity'))} onValueChange={(v) => setAutoSetting('productRecommendationsSort', v)}>
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
                        <Select value={String(getAutoSetting('productRecommendationsCategoryFilter', 'same'))} onValueChange={(v) => setAutoSetting('productRecommendationsCategoryFilter', v)}>
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
                        <Switch checked={getAutoSetting('productLowStockAlertEnabled', true)} onCheckedChange={(v) => setAutoSetting('productLowStockAlertEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Prix Réduit</label>
                          <p className="text-xs text-gray-600">Notifier les réductions de prix</p>
                        </div>
                        <Switch checked={getAutoSetting('productDiscountAlertEnabled', true)} onCheckedChange={(v) => setAutoSetting('productDiscountAlertEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Alerte Nouveau Produit</label>
                          <p className="text-xs text-gray-600">Notifier les nouveaux produits</p>
                        </div>
                        <Switch checked={getAutoSetting('productNewProductAlertEnabled', true)} onCheckedChange={(v) => setAutoSetting('productNewProductAlertEnabled', v)} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil Stock Faible</label>
                        <Input 
                          type="number" 
                          value={String(getAutoSetting('productLowStockThreshold', 5))}
                          onChange={(e) => setAutoSetting('productLowStockThreshold', Number(e.target.value ?? 0) || 0)}
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
                          value={String(getAutoSetting('productDiscountThresholdPercent', 15))}
                          onChange={(e) => setAutoSetting('productDiscountThresholdPercent', Number(e.target.value ?? 0) || 0)}
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
                        <Switch checked={getAutoSetting('engagementCartAbandonAlertEnabled', true)} onCheckedChange={(v) => setAutoSetting('engagementCartAbandonAlertEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Incitation Défilement</label>
                          <p className="text-xs text-gray-600">Afficher du contenu selon la profondeur</p>
                        </div>
                        <Switch checked={getAutoSetting('engagementScrollIncentiveEnabled', true)} onCheckedChange={(v) => setAutoSetting('engagementScrollIncentiveEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Rappel Visiteur</label>
                          <p className="text-xs text-gray-600">Offres spéciales pour visiteurs de retour</p>
                        </div>
                        <Switch checked={getAutoSetting('engagementReturnVisitorReminderEnabled', true)} onCheckedChange={(v) => setAutoSetting('engagementReturnVisitorReminderEnabled', v)} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Seuil Défilement</label>
                        <Input 
                          type="number" 
                          value={String(getAutoSetting('engagementScrollThresholdPercent', 70))}
                          onChange={(e) => setAutoSetting('engagementScrollThresholdPercent', Number(e.target.value ?? 0) || 0)}
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
                          value={String(getAutoSetting('engagementExitDelaySeconds', 3))}
                          onChange={(e) => setAutoSetting('engagementExitDelaySeconds', Number(e.target.value ?? 0) || 0)}
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
                        value={String(getAutoSetting('offerMaxDiscountPercent', 25))}
                        onChange={(e) => setAutoSetting('offerMaxDiscountPercent', Number(e.target.value ?? 0) || 0)}
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
                        value={String(getAutoSetting('offerMaxPerUser', 3))}
                        onChange={(e) => setAutoSetting('offerMaxPerUser', Number(e.target.value ?? 0) || 0)}
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
                        value={String(getAutoSetting('offerValidityHours', 24))}
                        onChange={(e) => setAutoSetting('offerValidityHours', Number(e.target.value ?? 0) || 0)}
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
                        <Switch checked={getAutoSetting('notificationsPushEnabled', true)} onCheckedChange={(v) => setAutoSetting('notificationsPushEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Notifications Email</label>
                          <p className="text-xs text-gray-600">Activer les notifications email</p>
                        </div>
                        <Switch checked={getAutoSetting('notificationsEmailEnabled', true)} onCheckedChange={(v) => setAutoSetting('notificationsEmailEnabled', v)} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium">Notifications SMS</label>
                          <p className="text-xs text-gray-600">Activer les notifications SMS</p>
                        </div>
                        <Switch checked={getAutoSetting('notificationsSmsEnabled', false)} onCheckedChange={(v) => setAutoSetting('notificationsSmsEnabled', v)} />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fréquence Max</label>
                        <Input 
                          type="number" 
                          value={String(getAutoSetting('notificationsMaxPerDay', 2))}
                          onChange={(e) => setAutoSetting('notificationsMaxPerDay', Number(e.target.value ?? 0) || 0)}
                          className="w-full"
                          min="1"
                          max="5"
                        />
                        <p className="text-xs text-gray-500">Notifications max par jour</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Heures d'Envoi</label>
                        <Select value={String(getAutoSetting('notificationsSendWindow', '9-21'))} onValueChange={(v) => setAutoSetting('notificationsSendWindow', v)}>
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
                  value={triggerForm.name}
                  onChange={(e) => setTriggerForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerEvent">Événement déclencheur</Label>
                <Select value={triggerForm.event} onValueChange={(value) => setTriggerForm((prev) => ({ ...prev, event: value }))}>
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
                value={triggerForm.description}
                onChange={(e) => setTriggerForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Priorité et statut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="triggerPriority">Priorité</Label>
                <Select
                  value={triggerForm.priority}
                  onValueChange={(value) =>
                    setTriggerForm((prev) => ({ ...prev, priority: value as AutomationTrigger['priority'] }))
                  }
                >
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
                <Select
                  value={triggerForm.status}
                  onValueChange={(value) =>
                    setTriggerForm((prev) => ({ ...prev, status: value as AutomationTrigger['status'] }))
                  }
                >
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
                  value={String(triggerForm.timeout)}
                  onChange={(e) => setTriggerForm((prev) => ({ ...prev, timeout: Number(e.target.value ?? 0) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerRetryCount">Nombre de tentatives</Label>
                <Input
                  id="triggerRetryCount"
                  type="number"
                  min="0"
                  max="10"
                  value={String(triggerForm.retryCount)}
                  onChange={(e) => setTriggerForm((prev) => ({ ...prev, retryCount: Number(e.target.value ?? 0) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="triggerRetryDelay">Délai entre tentatives (secondes)</Label>
                <Input
                  id="triggerRetryDelay"
                  type="number"
                  min="1"
                  max="3600"
                  value={String(triggerForm.retryDelay)}
                  onChange={(e) => setTriggerForm((prev) => ({ ...prev, retryDelay: Number(e.target.value ?? 0) || 0 }))}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="triggerTags">Tags</Label>
              <Input
                id="triggerTags"
                placeholder="Ex: commande, email, notification (séparés par des virgules)"
                value={triggerForm.tags}
                onChange={(e) => setTriggerForm((prev) => ({ ...prev, tags: e.target.value }))}
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
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => void saveTrigger()} disabled={isSavingTrigger}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSavingTrigger ? 'Sauvegarde...' : selectedTrigger ? 'Modifier' : 'Créer'}
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
                  <span>CSV (Excel)</span>
                  <span className="text-xs text-gray-500">Compatible tableur</span>
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
                  <div className="text-sm text-gray-600">Non disponible</div>
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
    </div>
  )
}
