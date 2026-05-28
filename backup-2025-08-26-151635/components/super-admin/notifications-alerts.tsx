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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, AlertTriangle, CheckCircle, Settings, Users, ShoppingCart, MessageCircle, TrendingUp, Globe, Smartphone,
  Search, Filter, Download, Upload, Play, Pause, Volume2, Shield, 
  TrendingDown, Calendar, Clock, Mail, Phone, MapPin, 
  Heart, Share2, Bookmark, MoreHorizontal, Zap, Target, Eye, Trash2, Edit, Copy, Plus, PlayCircle
} from 'lucide-react'
import { useNotifications } from '@/components/ui/modern-notification'

// Interfaces pour le système de notifications et alertes
interface Notification {
  id: string
  type: 'order' | 'user' | 'payment' | 'alert' | 'system' | 'marketing' | 'security'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  date: string
  recipient: string
  recipientType: 'user' | 'vendor' | 'admin' | 'all'
  channel: 'push' | 'email' | 'sms' | 'in-app'
  category: string
  tags: string[]
  metadata?: Record<string, any>
  readAt?: string
  deliveredAt?: string
}

interface Alert {
  id: string
  title: string
  description: string
  type: 'critical' | 'warning' | 'info' | 'success'
  category: 'stock' | 'payment' | 'security' | 'performance' | 'user' | 'system'
  active: boolean
  conditions: AlertCondition[]
  actions: AlertAction[]
  schedule: AlertSchedule
  recipients: string[]
  lastTriggered?: string
  triggerCount: number
}

interface AlertCondition {
  id: string
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals'
  value: string | number
  logicalOperator?: 'AND' | 'OR'
}

interface AlertAction {
  id: string
  type: 'notification' | 'email' | 'sms' | 'webhook' | 'system_action'
  config: Record<string, any>
  enabled: boolean
}

interface AlertSchedule {
  enabled: boolean
  timezone: string
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  maxPerDay?: number
}

interface NotificationStats {
  totalSent: number
  totalDelivered: number
  totalRead: number
  deliveryRate: number
  readRate: number
  averageDeliveryTime: number
  channelBreakdown: Record<string, number>
  priorityBreakdown: Record<string, number>
  dailyTrends: Array<{ date: string; count: number }>
  monthlyGrowth: number
}

export default function NotificationsAlerts() {
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()
  
  // États pour la gestion des notifications
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    totalSent: 1247,
    totalDelivered: 1230,
    totalRead: 1156,
    deliveryRate: 98.5,
    readRate: 93.9,
    averageDeliveryTime: 2.3,
    channelBreakdown: {
      push: 456,
      email: 567,
      sms: 124,
      'in-app': 100
    },
    priorityBreakdown: {
      low: 234,
      medium: 567,
      high: 346,
      critical: 100
    },
    dailyTrends: [
      { date: '2024-12-19', count: 45 },
      { date: '2024-12-18', count: 52 },
      { date: '2024-12-17', count: 38 },
      { date: '2024-12-16', count: 41 }
    ],
    monthlyGrowth: 12.5
  })

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // États pour les modals
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateNotificationModal, setShowCreateNotificationModal] = useState(false)
  const [showGlobalConfigModal, setShowGlobalConfigModal] = useState(false)
  const [showEditEmailModal, setShowEditEmailModal] = useState(false)
  const [showEditEmailMarketingModal, setShowEditEmailMarketingModal] = useState(false)
  const [showActionConfigModal, setShowActionConfigModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<any>(null)
  const [selectedEmailMarketing, setSelectedEmailMarketing] = useState<any>(null)
  const [selectedAction, setSelectedAction] = useState<AlertAction | null>(null)

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [notificationsPerPage] = useState(10)

  // Chargement des données au montage
  useEffect(() => {
    loadMockData()
  }, [])

  // Fonction pour charger les données mock
  const loadMockData = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'order',
        title: 'Nouvelle commande',
        message: 'Commande #12345 reçue pour 25,000 FCFA',
        priority: 'high',
        status: 'sent',
        date: '2024-12-19T10:30:00Z',
        recipient: 'admin@probooster.com',
        recipientType: 'admin',
        channel: 'push',
        category: 'Ventes',
        tags: ['commande', 'nouvelle', 'vente'],
        metadata: { orderId: '12345', amount: 25000, currency: 'FCFA' }
      },
      {
        id: '2',
        type: 'user',
        title: 'Nouveau vendeur',
        message: 'Jean Dupont a rejoint la plateforme avec 15 produits',
        priority: 'medium',
        status: 'pending',
        date: '2024-12-19T10:15:00Z',
        recipient: 'admin@probooster.com',
        recipientType: 'admin',
        channel: 'email',
        category: 'Utilisateurs',
        tags: ['vendeur', 'nouveau', 'inscription'],
        metadata: { vendorId: 'v123', productCount: 15, location: 'Paris' }
      },
      {
        id: '3',
        type: 'payment',
        title: 'Paiement reçu',
        message: 'Paiement de 150,000 FCFA confirmé pour la commande #12344',
        priority: 'low',
        status: 'delivered',
        date: '2024-12-19T09:45:00Z',
        recipient: 'admin@probooster.com',
        recipientType: 'admin',
        channel: 'push',
        category: 'Paiements',
        tags: ['paiement', 'confirmé', 'commande'],
        metadata: { orderId: '12344', amount: 150000, currency: 'FCFA', method: 'Mobile Money' }
      },
      {
        id: '4',
        type: 'alert',
        title: 'Stock faible',
        message: 'iPhone 15 Pro - Plus que 5 unités en stock',
        priority: 'high',
        status: 'sent',
        date: '2024-12-19T09:30:00Z',
        recipient: 'admin@probooster.com',
        recipientType: 'admin',
        channel: 'email',
        category: 'Stock',
        tags: ['stock', 'faible', 'produit'],
        metadata: { productId: 'p123', currentStock: 5, threshold: 10 }
      },
      {
        id: '5',
        type: 'security',
        title: 'Connexion suspecte',
        message: 'Tentative de connexion depuis une nouvelle localisation',
        priority: 'critical',
        status: 'sent',
        date: '2024-12-19T09:15:00Z',
        recipient: 'admin@probooster.com',
        recipientType: 'admin',
        channel: 'push',
        category: 'Sécurité',
        tags: ['sécurité', 'connexion', 'suspect'],
        metadata: { ipAddress: '192.168.1.100', location: 'Lyon', device: 'Mobile' }
      }
    ]

    const mockAlerts: Alert[] = [
      {
        id: '1',
        title: 'Stock critique',
        description: 'Produits avec stock inférieur à 5 unités',
        type: 'warning',
        category: 'stock',
        active: true,
        conditions: [
          { id: 'c1', field: 'stock', operator: 'less_than', value: 5 }
        ],
        actions: [
          { id: 'a1', type: 'notification', config: { channel: 'push', priority: 'high' }, enabled: true },
          { id: 'a2', type: 'email', config: { template: 'stock_alert', recipients: ['admin@probooster.com'] }, enabled: true }
        ],
        schedule: {
          enabled: true,
          timezone: 'Europe/Paris',
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          frequency: 'immediate',
          maxPerDay: 10
        },
        recipients: ['admin@probooster.com', 'stock@probooster.com'],
        triggerCount: 23
      },
      {
        id: '2',
        title: 'Paiements échoués',
        description: 'Plus de 3 échecs de paiement consécutifs',
        type: 'critical',
        category: 'payment',
        active: true,
        conditions: [
          { id: 'c2', field: 'payment_failures', operator: 'greater_than', value: 3 }
        ],
        actions: [
          { id: 'a3', type: 'notification', config: { channel: 'push', priority: 'critical' }, enabled: true },
          { id: 'a4', type: 'system_action', config: { action: 'suspend_user', duration: '24h' }, enabled: true }
        ],
        schedule: {
          enabled: true,
          timezone: 'Europe/Paris',
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          frequency: 'immediate',
          maxPerDay: 5
        },
        recipients: ['admin@probooster.com', 'security@probooster.com'],
        triggerCount: 7
      }
    ]

    setNotifications(mockNotifications)
    setAlerts(mockAlerts)
  }

  // Fonctions utilitaires
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `Il y a ${diffInMinutes} min`
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  const getTypeIcon = (type: string) => {
    const iconConfig = {
      order: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
      user: { icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
      payment: { icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
      system: { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100' },
      marketing: { icon: Target, color: 'text-pink-600', bg: 'bg-pink-100' },
      security: { icon: Shield, color: 'text-orange-600', bg: 'bg-orange-100' }
    }
    
    const config = iconConfig[type as keyof typeof iconConfig] || iconConfig.system
    const IconComponent = config.icon
    
    return { IconComponent, color: config.color, bg: config.bg }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Faible' },
      medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Moyenne' },
      high: { color: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Élevée' },
      critical: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Critique' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low
    
    return (
      <Badge variant="outline" className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'outline',
      sent: 'secondary',
      delivered: 'default',
      read: 'default',
      failed: 'destructive'
    }
    const colors: Record<string, string> = {
      pending: 'text-yellow-600',
      sent: 'text-blue-600',
      delivered: 'text-green-600',
      read: 'text-gray-600',
      failed: 'text-red-600'
    }
    return <Badge variant={variants[status] || 'outline'} className={colors[status]}>
      {status === 'pending' ? 'En attente' : 
       status === 'sent' ? 'Envoyée' : 
       status === 'delivered' ? 'Livrée' : 
       status === 'read' ? 'Lue' : 'Échouée'}
    </Badge>
  }

  // Fonction pour exporter les notifications
  const exportNotifications = () => {
    const csvHeaders = ['Type', 'Titre', 'Message', 'Priorité', 'Statut', 'Date', 'Destinataire', 'Canal', 'Catégorie']
    const csvRows = filteredNotifications.map(notification => [
      notification.type,
      notification.title,
      notification.message,
      notification.priority,
      notification.status,
      notification.date,
      notification.recipient,
      notification.channel,
      notification.category
    ])
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `notifications-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      type: 'success',
      title: 'Export réussi',
      message: `${filteredNotifications.length} notifications exportées en CSV`
    })
  }

  // Fonction pour dupliquer une notification
  const duplicateNotification = (notification: Notification) => {
    const duplicatedNotification = {
      ...notification,
      id: `dup_${Date.now()}`,
      title: `${notification.title} (Copie)`,
      date: new Date().toISOString(),
      status: 'pending' as const
    }
    
    setNotifications(prev => [duplicatedNotification, ...prev])
    
    addNotification({
      type: 'success',
      title: 'Notification dupliquée',
      message: 'La notification a été dupliquée avec succès'
    })
  }

  // Fonction pour envoyer une notification
  const sendNotification = (notification: Notification) => {
    setNotifications(prev => prev.map(n => 
      n.id === notification.id 
        ? { ...n, status: 'sent' as const, date: new Date().toISOString() }
        : n
    ))
    
    addNotification({
      type: 'success',
      title: 'Notification envoyée',
      message: 'La notification a été envoyée avec succès'
    })
  }

  // Fonction pour réessayer l'envoi d'une notification
  const retryNotification = (notification: Notification) => {
    setNotifications(prev => prev.map(n => 
      n.id === notification.id 
        ? { ...n, status: 'pending' as const }
        : n
    ))
    
    addNotification({
      type: 'info',
      title: 'Nouvelle tentative',
      message: 'La notification sera renvoyée automatiquement'
    })
  }

  // Fonction pour marquer une notification comme lue
  const markAsRead = (notification: Notification) => {
    setNotifications(prev => prev.map(n => 
      n.id === notification.id 
        ? { ...n, status: 'read' as const, readAt: new Date().toISOString() }
        : n
    ))
    
    addNotification({
      type: 'success',
      title: 'Notification lue',
      message: 'La notification a été marquée comme lue'
    })
  }

  // Fonction pour supprimer une notification
  const deleteNotification = (notification: Notification) => {
    setNotifications(prev => prev.filter(n => n.id !== notification.id))
    
    addNotification({
      type: 'success',
      title: 'Notification supprimée',
      message: 'La notification a été supprimée avec succès'
    })
  }

  // Fonction pour exporter les alertes
  const exportAlerts = () => {
    const csvHeaders = ['Titre', 'Description', 'Type', 'Catégorie', 'Statut', 'Fréquence', 'Déclenchements', 'Destinataires']
    const csvRows = alerts.map(alert => [
      alert.title,
      alert.description,
      alert.type,
      alert.category,
      alert.active ? 'Active' : 'Inactive',
      alert.schedule.frequency,
      alert.triggerCount,
      alert.recipients.length
    ])
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `alertes-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    addNotification({
      type: 'success',
      title: 'Export réussi',
      message: `${alerts.length} alertes exportées en CSV`
    })
  }

  // Fonction pour activer/désactiver une alerte
  const toggleAlertStatus = (alert: Alert) => {
    setAlerts(prev => prev.map(a => 
      a.id === alert.id 
        ? { ...a, active: !a.active }
        : a
    ))
    
    addNotification({
      type: 'success',
      title: `Alerte ${!alert.active ? 'activée' : 'désactivée'}`,
      message: `L'alerte "${alert.title}" a été ${!alert.active ? 'activée' : 'désactivée'}`
    })
  }

  // Fonction pour configurer une action d'alerte
  const configureAlertAction = (action: AlertAction) => {
    setSelectedAction(action)
    setShowActionConfigModal(true)
  }

  // Fonction pour ajouter une action d'alerte
  const addAlertAction = () => {
    if (selectedAlert) {
      const newAction: AlertAction = {
        id: `action_${Date.now()}`,
        type: 'notification',
        config: {},
        enabled: true
      }
      
      setAlerts(prev => prev.map(a => 
        a.id === selectedAlert.id 
          ? { ...a, actions: [...a.actions, newAction] }
          : a
      ))
      
      addNotification({
        type: 'success',
        title: 'Action ajoutée',
        message: 'Une nouvelle action a été ajoutée à l\'alerte'
      })
    }
  }

  // Fonction pour ajouter une condition d'alerte
  const addAlertCondition = () => {
    if (selectedAlert) {
      const newCondition: AlertCondition = {
        id: `condition_${Date.now()}`,
        field: 'stock',
        operator: 'less_than',
        value: 10
      }
      
      setAlerts(prev => prev.map(a => 
        a.id === selectedAlert.id 
          ? { ...a, conditions: [...a.conditions, newCondition] }
          : a
      ))
      
      // Mettre à jour le selectedAlert aussi
      setSelectedAlert(prev => prev ? {
        ...prev,
        conditions: [...prev.conditions, newCondition]
      } : null)
      
      addNotification({
        type: 'success',
        title: 'Condition ajoutée',
        message: 'Une nouvelle condition a été ajoutée à l\'alerte'
      })
    }
  }

  // Fonction pour supprimer une condition d'alerte
  const removeAlertCondition = (conditionId: string) => {
    if (selectedAlert) {
      setAlerts(prev => prev.map(a => 
        a.id === selectedAlert.id 
          ? { ...a, conditions: a.conditions.filter(c => c.id !== conditionId) }
          : a
      ))
      
      addNotification({
        type: 'success',
        title: 'Condition supprimée',
        message: 'La condition a été supprimée de l\'alerte'
      })
    }
  }

  // Fonction pour sauvegarder une alerte
  const saveAlert = () => {
    if (selectedAlert) {
      setAlerts(prev => prev.map(a => 
        a.id === selectedAlert.id 
          ? { ...selectedAlert, updatedAt: new Date().toISOString() }
          : a
      ))
      
      addNotification({
        type: 'success',
        title: 'Alerte sauvegardée',
        message: 'L\'alerte a été sauvegardée avec succès'
      })
      
      setShowAlertModal(false)
    } else {
      // Créer une nouvelle alerte
      const newAlert: Alert = {
        id: `alert_${Date.now()}`,
        title: 'Nouvelle Alerte',
        description: 'Description de la nouvelle alerte',
        type: 'info',
        category: 'system',
        active: true,
        conditions: [],
        actions: [],
        schedule: {
          enabled: true,
          timezone: 'Europe/Paris',
          quietHours: { enabled: false, start: '22:00', end: '08:00' },
          frequency: 'immediate'
        },
        recipients: [],
        triggerCount: 0
      }
      
      setAlerts(prev => [newAlert, ...prev])
      
      addNotification({
        type: 'success',
        title: 'Alerte créée',
        message: 'La nouvelle alerte a été créée avec succès'
      })
      
      setShowAlertModal(false)
    }
  }

  // Fonction pour supprimer une alerte
  const deleteAlert = (alert: Alert) => {
    setAlerts(prev => prev.filter(a => a.id !== alert.id))
    
    addNotification({
      type: 'success',
      title: 'Alerte supprimée',
      message: 'L\'alerte a été supprimée avec succès'
    })
  }

  // Fonction pour tester une alerte
  const testAlert = (alert: Alert) => {
    addNotification({
      type: 'info',
      title: 'Test d\'alerte',
      message: `Test de l'alerte "${alert.title}" en cours...`
    })
    
    // Simuler le test
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Test réussi',
        message: `L'alerte "${alert.title}" fonctionne correctement`
      })
    }, 2000)
  }

  // Fonction pour créer une notification
  const createNotification = () => {
    const newNotification: Notification = {
      id: `notif_${Date.now()}`,
      type: 'system',
      title: 'Nouvelle Notification',
      message: 'Contenu de la nouvelle notification',
      priority: 'medium',
      status: 'pending',
      date: new Date().toISOString(),
      recipient: 'admin@exemple.com',
      recipientType: 'admin',
      channel: 'email',
      category: 'Système',
      tags: ['nouveau'],
      metadata: {}
    }
    
    setNotifications(prev => [newNotification, ...prev])
    
    addNotification({
      type: 'success',
      title: 'Notification créée',
      message: 'La nouvelle notification a été créée avec succès'
    })
    
    setShowCreateModal(false)
  }

  // Fonction pour sauvegarder une notification
  const saveNotification = () => {
    if (selectedNotification) {
      setNotifications(prev => prev.map(n => 
        n.id === selectedNotification.id 
          ? { ...selectedNotification, updatedAt: new Date().toISOString() }
          : n
      ))
      
      addNotification({
        type: 'success',
        title: 'Notification sauvegardée',
        message: 'La notification a été sauvegardée avec succès'
      })
      
      setShowCreateModal(false)
    }
  }

  // Filtrage des notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter
    const matchesChannel = channelFilter === 'all' || notification.channel === channelFilter
    
    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesChannel
  })

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage)
  const currentNotifications = filteredNotifications.slice(
    (currentPage - 1) * notificationsPerPage,
    currentPage * notificationsPerPage
  )

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications & Alertes</h2>
            <p className="text-gray-600 mt-2">
              Gestion intelligente des notifications et système d'alertes personnalisables
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => setShowGlobalConfigModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Button>
        </div>
      </div>

      {/* Statistiques principales améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{stats.totalSent.toLocaleString()}</p>
                  <p className="text-sm text-purple-600">Notifications envoyées</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-purple-600 mb-1">+{stats.monthlyGrowth}%</div>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{stats.priorityBreakdown.critical}</p>
                  <p className="text-sm text-red-600">Alertes critiques</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-red-600 mb-1">{stats.priorityBreakdown.high}</div>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.deliveryRate}%</p>
                  <p className="text-sm text-green-600">Taux de livraison</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 mb-1">{stats.readRate}%</div>
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalDelivered.toLocaleString()}</p>
                  <p className="text-sm text-blue-600">Livrées avec succès</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-blue-600 mb-1">{stats.averageDeliveryTime}min</div>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres Avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <Input
                id="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="order">Commandes</SelectItem>
                  <SelectItem value="user">Utilisateurs</SelectItem>
                  <SelectItem value="payment">Paiements</SelectItem>
                  <SelectItem value="alert">Alertes</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="security">Sécurité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priorité</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes priorités" />
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

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="read">Lue</SelectItem>
                  <SelectItem value="failed">Échouée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel">Canal</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous canaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous canaux</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="in-app">In-App</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Période</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes périodes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="push">Notifications Push</TabsTrigger>
          <TabsTrigger value="email">Emails</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications Système</CardTitle>
                  <CardDescription>
                    Gestion des notifications automatiques et manuelles ({filteredNotifications.length} résultats)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportNotifications}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => duplicateNotification(notifications[0])}>
                    <Copy className="h-4 w-4 mr-2" />
                    Dupliquer
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setShowCreateNotificationModal(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Nouvelle Notification
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentNotifications.map((notification) => {
                  const { IconComponent, color, bg } = getTypeIcon(notification.type)
                  
                  return (
                    <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                            <IconComponent className={`h-6 w-6 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              {getPriorityBadge(notification.priority)}
                              {getStatusBadge(notification.status)}
                              <Badge variant="outline" className="text-xs">
                                {notification.channel}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(notification.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {notification.recipient}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {notification.category}
                              </span>
                            </div>

                            <p className="text-gray-700 mb-3 leading-relaxed">{notification.message}</p>

                            {/* Tags et métadonnées */}
                            <div className="flex items-center gap-2 mb-3">
                              {notification.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Métadonnées si disponibles */}
                            {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                <h5 className="font-medium text-sm mb-2">Détails techniques:</h5>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {Object.entries(notification.metadata).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="text-gray-600">{key}:</span>
                                      <span className="font-medium">{String(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedNotification(notification)
                              setShowNotificationModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedNotification(notification)
                              setShowCreateModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          {notification.status === 'pending' && (
                            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => sendNotification(notification)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Envoyer
                            </Button>
                          )}
                          {notification.status === 'failed' && (
                            <Button size="sm" variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => retryNotification(notification)}>
                              <Zap className="h-4 w-4 mr-1" />
                              Réessayer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Affichage de {((currentPage - 1) * notificationsPerPage) + 1} à {Math.min(currentPage * notificationsPerPage, filteredNotifications.length)} sur {filteredNotifications.length} notifications
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}

                {currentNotifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune notification trouvée</p>
                    <p className="text-sm">Ajustez vos filtres ou créez une nouvelle notification</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Système d'Alertes</CardTitle>
                  <CardDescription>
                    Configuration et gestion des alertes automatiques ({alerts.length} alertes configurées)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportAlerts}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setShowAlertModal(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Nouvelle Alerte
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-medium text-gray-900">{alert.title}</h4>
                          <Badge 
                            variant={alert.type === 'critical' ? 'destructive' : 
                                   alert.type === 'warning' ? 'secondary' : 
                                   alert.type === 'info' ? 'outline' : 'default'}
                          >
                            {alert.type === 'critical' ? 'Critique' : 
                             alert.type === 'warning' ? 'Avertissement' : 
                             alert.type === 'info' ? 'Information' : 'Succès'}
                          </Badge>
                          <Badge variant={alert.active ? 'default' : 'outline'}>
                            {alert.active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.category}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-4">{alert.description}</p>

                        {/* Conditions */}
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-2 text-gray-700">Conditions de déclenchement:</h5>
                          <div className="space-y-2">
                            {alert.conditions.map((condition, index) => (
                              <div key={condition.id} className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600">Si</span>
                                <Badge variant="outline" className="text-xs">
                                  {condition.field}
                                </Badge>
                                <span className="text-gray-600">
                                  {condition.operator === 'equals' ? '=' :
                                   condition.operator === 'greater_than' ? '>' :
                                   condition.operator === 'less_than' ? '<' :
                                   condition.operator === 'contains' ? 'contient' : '≠'}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {condition.value}
                                </Badge>
                                {condition.logicalOperator && (
                                  <Badge variant="outline" className="text-xs">
                                    {condition.logicalOperator}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mb-4">
                          <h5 className="font-medium text-sm mb-2 text-gray-700">Actions automatiques:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {alert.actions.map((action) => (
                              <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {action.type === 'notification' ? 'Notification' :
                                     action.type === 'email' ? 'Email' :
                                     action.type === 'sms' ? 'SMS' :
                                     action.type === 'webhook' ? 'Webhook' : 'Action Système'}
                                  </Badge>
                                  <Switch 
                                    checked={action.enabled} 
                                    className="scale-75"
                                  />
                                </div>
                                <Button size="sm" variant="outline" onClick={() => configureAlertAction(action)}>
                                  <Settings className="h-3 w-3 mr-1" />
                                  Config
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Planification et statistiques */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{alert.triggerCount}</div>
                            <div className="text-sm text-gray-600">Déclenchements</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">
                              {alert.schedule.frequency === 'immediate' ? 'Immédiat' :
                               alert.schedule.frequency === 'hourly' ? 'Horaire' :
                               alert.schedule.frequency === 'daily' ? 'Quotidien' : 'Hebdomadaire'}
                            </div>
                            <div className="text-xs text-gray-500">Fréquence</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-700">
                              {alert.recipients.length}
                            </div>
                            <div className="text-xs text-gray-500">Destinataires</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAlert(alert)
                            setShowAlertModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAlert(alert)
                            // Ouvrir le modal d'édition d'alerte existant
                            setShowAlertModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          size="sm" 
                          variant={alert.active ? 'outline' : 'default'}
                          className={alert.active ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700'}
                          onClick={() => toggleAlertStatus(alert)}
                        >
                          {alert.active ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Activer
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={addAlertAction}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter une action
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteAlert(alert)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => testAlert(alert)}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Tester
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {alerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Aucune alerte configurée</p>
                    <p className="text-sm">Créez votre première alerte pour surveiller votre plateforme</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Push</CardTitle>
              <CardDescription>
                Gestion des notifications push et configuration des appareils
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Configuration Push</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        <span>Notifications Push</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-green-600" />
                        <span>Alertes critiques</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        <span>Nouveaux messages</span>
                      </div>
                      <input type="checkbox" className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Statistiques Push</h4>
                  <div className="space-y-3">
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">98.5%</p>
                      <p className="text-sm text-gray-600">Taux de livraison</p>
                    </div>
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">2.3min</p>
                      <p className="text-sm text-gray-600">Temps de livraison</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications Email</CardTitle>
              <CardDescription>
                Configuration des emails transactionnels et marketing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Emails Transactionnels</h4>
                  <div className="space-y-3">
                    {[
                      { id: 1, title: "Confirmation de commande", active: true, template: "Commande confirmée" },
                      { id: 2, title: "Expédition", active: true, template: "Produit expédié" },
                      { id: 3, title: "Livraison", active: true, template: "Produit livré" },
                      { id: 4, title: "Facture", active: false, template: "Facture générée" }
                    ].map((email) => (
                      <div key={email.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">{email.title}</p>
                          <p className="text-sm text-gray-600">Template: {email.template}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={email.active ? 'default' : 'outline'}>
                            {email.active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedEmail(email)
                            setShowEditEmailModal(true)
                          }}>Modifier</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Emails Marketing</h4>
                  <div className="space-y-3">
                    {[
                      { id: 1, title: "Newsletter", active: true, frequency: "Hebdomadaire" },
                      { id: 2, title: "Promotions", active: true, frequency: "Quotidienne" },
                      { id: 3, title: "Nouveautés", active: false, frequency: "Mensuelle" }
                    ].map((email) => (
                      <div key={email.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">{email.title}</p>
                          <p className="text-sm text-gray-600">Fréquence: {email.frequency}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={email.active ? 'default' : 'outline'}>
                            {email.active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => {
                            setSelectedEmailMarketing(email)
                            setShowEditEmailMarketingModal(true)
                          }}>Configurer</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Globale</CardTitle>
              <CardDescription>
                Paramètres généraux du système de notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Paramètres Généraux</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Notifications en temps réel</label>
                        <p className="text-xs text-gray-600">Activer les notifications instantanées</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Mode silencieux</label>
                        <p className="text-xs text-gray-600">Désactiver entre 22h et 8h</p>
                      </div>
                      <input type="checkbox" className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Limite quotidienne</label>
                        <p className="text-xs text-gray-600">Max 50 notifications par jour</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Intégrations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <span>Web Push</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <span>Mobile Push</span>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        <span>SMS</span>
                      </div>
                      <input type="checkbox" className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de visualisation de notification */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de la Notification
            </DialogTitle>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Générales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getTypeIcon(selectedNotification.type).bg}`}>
                        {(() => {
                          const { IconComponent, color } = getTypeIcon(selectedNotification.type)
                          return <IconComponent className={`h-8 w-8 ${color}`} />
                        })()}
                      </div>
                      <div>
                        <h4 className="font-medium text-lg">{selectedNotification.title}</h4>
                        <p className="text-gray-600">{selectedNotification.recipient}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPriorityBadge(selectedNotification.priority)}
                          {getStatusBadge(selectedNotification.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Date de création:</span>
                        <span className="font-medium">{formatDate(selectedNotification.date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Canal:</span>
                        <Badge variant="outline">{selectedNotification.channel}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Catégorie:</span>
                        <span className="font-medium">{selectedNotification.category}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Type de destinataire:</span>
                        <span className="font-medium">{selectedNotification.recipientType}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contenu du message */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed text-lg">
                      {selectedNotification.message}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tags et métadonnées */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Métadonnées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Tags */}
                    <div>
                      <h5 className="font-medium mb-2">Tags associés:</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedNotification.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Métadonnées techniques */}
                    {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2">Détails techniques:</h5>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600 font-medium">{key}:</span>
                                <span className="font-mono text-sm">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Informations de livraison */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Envoyée le</div>
                        <div className="font-medium">{formatDate(selectedNotification.date)}</div>
                      </div>
                      {selectedNotification.deliveredAt && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Livrée le</div>
                          <div className="font-medium">{formatDate(selectedNotification.deliveredAt)}</div>
                        </div>
                      )}
                      {selectedNotification.readAt && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Lue le</div>
                          <div className="font-medium">{formatDate(selectedNotification.readAt)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de création/modification d'alerte */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {selectedAlert ? 'Modifier l\'Alerte' : 'Nouvelle Alerte'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de Base</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de l'alerte</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Stock critique"
                      defaultValue={selectedAlert?.title}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select defaultValue={selectedAlert?.category || 'stock'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stock">Stock</SelectItem>
                        <SelectItem value="payment">Paiement</SelectItem>
                        <SelectItem value="security">Sécurité</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="system">Système</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type d'alerte</Label>
                    <Select defaultValue={selectedAlert?.type || 'warning'}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="warning">Avertissement</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                        <SelectItem value="success">Succès</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="active">Statut</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch id="active" defaultChecked={selectedAlert?.active} />
                      <Label htmlFor="active">Alerte active</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez le but de cette alerte..."
                    rows={3}
                    defaultValue={selectedAlert?.description}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conditions de Déclenchement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conditions configurées</span>
                    <Button size="sm" variant="outline" onClick={addAlertCondition}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter une condition
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedAlert?.conditions.map((condition, index) => (
                      <div key={condition.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <Select defaultValue={condition.field}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stock">Stock</SelectItem>
                            <SelectItem value="price">Prix</SelectItem>
                            <SelectItem value="sales">Ventes</SelectItem>
                            <SelectItem value="rating">Note</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select defaultValue={condition.operator}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">=</SelectItem>
                            <SelectItem value="greater_than">&gt;</SelectItem>
                            <SelectItem value="less_than">&lt;</SelectItem>
                            <SelectItem value="contains">contient</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          placeholder="Valeur"
                          className="w-24"
                          defaultValue={String(condition.value)}
                        />
                        
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => removeAlertCondition(condition.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-500">
                        <p>Aucune condition configurée</p>
                        <p className="text-sm">Ajoutez au moins une condition pour déclencher l'alerte</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions Automatiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Actions configurées</span>
                    <Button size="sm" variant="outline" onClick={addAlertAction}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter une action
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedAlert?.actions.map((action) => (
                      <div key={action.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Select defaultValue={action.type}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="notification">Notification</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="webhook">Webhook</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Switch checked={action.enabled} />
                          
                          <span className="text-sm text-gray-600">Activée</span>
                        </div>
                        
                        <Button size="sm" variant="outline" onClick={() => configureAlertAction(action)}>
                          <Settings className="h-4 w-4 mr-1" />
                          Configurer
                        </Button>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-500">
                        <p>Aucune action configurée</p>
                        <p className="text-sm">Ajoutez au moins une action à exécuter</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planification */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Planification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Fréquence</Label>
                    <Select defaultValue={selectedAlert?.schedule.frequency || 'immediate'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immédiat</SelectItem>
                        <SelectItem value="hourly">Horaire</SelectItem>
                        <SelectItem value="daily">Quotidien</SelectItem>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxPerDay">Maximum par jour</Label>
                    <Input
                      id="maxPerDay"
                      type="number"
                      placeholder="10"
                      defaultValue={selectedAlert?.schedule.maxPerDay || 10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    <Select defaultValue={selectedAlert?.schedule.timezone || 'Europe/Paris'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch id="quietHours" defaultChecked={selectedAlert?.schedule.quietHours.enabled} />
                      <Label htmlFor="quietHours">Heures silencieuses</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowAlertModal(false)}>
              Annuler
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={saveAlert}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {selectedAlert ? 'Modifier l\'Alerte' : 'Créer l\'Alerte'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition des emails transactionnels */}
      <Dialog open={showEditEmailModal} onOpenChange={setShowEditEmailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Modifier l'Email Transactionnel
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailTitle">Titre</Label>
                      <Input
                        id="emailTitle"
                        placeholder="Titre de l'email"
                        defaultValue={selectedEmail.title}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailTemplate">Template</Label>
                      <Input
                        id="emailTemplate"
                        placeholder="Nom du template"
                        defaultValue={selectedEmail.template}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailStatus">Statut</Label>
                      <Select defaultValue={selectedEmail.active ? 'active' : 'inactive'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailPriority">Priorité</Label>
                      <Select defaultValue="normal">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="emailSubject">Sujet par défaut</Label>
                    <Input
                      id="emailSubject"
                      placeholder="Sujet de l'email"
                      defaultValue={`${selectedEmail.title} - ProBooster`}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="emailContent">Contenu par défaut</Label>
                    <Textarea
                      id="emailContent"
                      placeholder="Contenu de l'email..."
                      rows={4}
                      defaultValue={`Template pour ${selectedEmail.title.toLowerCase()}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Paramètres d'envoi */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paramètres d'Envoi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailDelay">Délai d'envoi (minutes)</Label>
                      <Input
                        id="emailDelay"
                        type="number"
                        placeholder="0"
                        defaultValue="0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailRetry">Tentatives de renvoi</Label>
                      <Input
                        id="emailRetry"
                        type="number"
                        placeholder="3"
                        defaultValue="3"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emailExpiry">Expiration (heures)</Label>
                      <Input
                        id="emailExpiry"
                        type="number"
                        placeholder="24"
                        defaultValue="24"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch id="emailTracking" defaultChecked />
                        <Label htmlFor="emailTracking">Suivi d'ouverture</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditEmailModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Email modifié',
                  message: `L'email ${selectedEmail?.title} a été modifié avec succès`
                })
                setShowEditEmailModal(false)
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition des emails marketing */}
      <Dialog open={showEditEmailMarketingModal} onOpenChange={setShowEditEmailMarketingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Configurer l'Email Marketing
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmailMarketing && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketingTitle">Titre</Label>
                      <Input
                        id="marketingTitle"
                        placeholder="Titre de l'email"
                        defaultValue={selectedEmailMarketing.title}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingFrequency">Fréquence</Label>
                      <Select defaultValue={selectedEmailMarketing.frequency.toLowerCase()}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quotidienne">Quotidienne</SelectItem>
                          <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                          <SelectItem value="mensuelle">Mensuelle</SelectItem>
                          <SelectItem value="trimestrielle">Trimestrielle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingStatus">Statut</Label>
                      <Select defaultValue={selectedEmailMarketing.active ? 'active' : 'inactive'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actif</SelectItem>
                          <SelectItem value="inactive">Inactif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingType">Type</Label>
                      <Select defaultValue="newsletter">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newsletter">Newsletter</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                          <SelectItem value="nouveaute">Nouveauté</SelectItem>
                          <SelectItem value="evenement">Événement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="marketingSubject">Sujet par défaut</Label>
                    <Input
                      id="marketingSubject"
                      placeholder="Sujet de l'email"
                      defaultValue={`${selectedEmailMarketing.title} - ProBooster`}
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="marketingContent">Contenu par défaut</Label>
                    <Textarea
                      id="marketingContent"
                      placeholder="Contenu de l'email..."
                      rows={4}
                      defaultValue={`Contenu pour ${selectedEmailMarketing.title.toLowerCase()}`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Planification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Planification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketingDay">Jour d'envoi</Label>
                      <Select defaultValue="monday">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Lundi</SelectItem>
                          <SelectItem value="tuesday">Mardi</SelectItem>
                          <SelectItem value="wednesday">Mercredi</SelectItem>
                          <SelectItem value="thursday">Jeudi</SelectItem>
                          <SelectItem value="friday">Vendredi</SelectItem>
                          <SelectItem value="saturday">Samedi</SelectItem>
                          <SelectItem value="sunday">Dimanche</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingTime">Heure d'envoi</Label>
                      <Input
                        id="marketingTime"
                        type="time"
                        defaultValue="09:00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingTimezone">Fuseau horaire</Label>
                      <Select defaultValue="Europe/Paris">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch id="marketingAuto" defaultChecked />
                        <Label htmlFor="marketingAuto">Envoi automatique</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audience */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketingAudience">Audience cible</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les utilisateurs</SelectItem>
                          <SelectItem value="vendors">Vendeurs uniquement</SelectItem>
                          <SelectItem value="buyers">Acheteurs uniquement</SelectItem>
                          <SelectItem value="premium">Utilisateurs premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingSegments">Segments spécifiques</Label>
                      <Input
                        id="marketingSegments"
                        placeholder="Ex: nouveaux_inscrits, clients_actifs"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="marketingExclusions">Exclusions</Label>
                      <Input
                        id="marketingExclusions"
                        placeholder="Ex: clients_inactifs, desabonnes"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditEmailMarketingModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Email configuré',
                  message: `L'email ${selectedEmailMarketing?.title} a été configuré avec succès`
                })
                setShowEditEmailMarketingModal(false)
              }}
            >
              <Target className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuration des actions d'alerte */}
      <Dialog open={showActionConfigModal} onOpenChange={setShowActionConfigModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration de l'Action d'Alerte
            </DialogTitle>
          </DialogHeader>
          
          {selectedAction && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {/* Informations de base */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations de Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actionType">Type d'action</Label>
                      <Select defaultValue={selectedAction.type}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="notification">Notification</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="system_action">Action Système</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="actionStatus">Statut</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch 
                          id="actionStatus" 
                          defaultChecked={selectedAction.enabled}
                        />
                        <Label htmlFor="actionStatus">Action activée</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration spécifique selon le type */}
              {selectedAction.type === 'notification' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration Notification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="notifChannel">Canal</Label>
                          <Select defaultValue="push">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="push">Push</SelectItem>
                              <SelectItem value="in-app">In-App</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="notifPriority">Priorité</Label>
                          <Select defaultValue="high">
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
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notifMessage">Message par défaut</Label>
                        <Textarea
                          id="notifMessage"
                          placeholder="Message de notification..."
                          rows={3}
                          defaultValue="Alerte déclenchée - Action requise"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedAction.type === 'email' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration Email</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="emailTemplate">Template</Label>
                          <Select defaultValue="alert_template">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alert_template">Template d'alerte</SelectItem>
                              <SelectItem value="custom_template">Template personnalisé</SelectItem>
                              <SelectItem value="system_template">Template système</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="emailSubject">Sujet</Label>
                          <Input
                            id="emailSubject"
                            placeholder="Sujet de l'email"
                            defaultValue="Alerte - Action requise"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="emailRecipients">Destinataires</Label>
                        <Input
                          id="emailRecipients"
                          placeholder="admin@probooster.com, support@probooster.com"
                          defaultValue="admin@probooster.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedAction.type === 'webhook' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration Webhook</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="webhookUrl">URL du webhook</Label>
                        <Input
                          id="webhookUrl"
                          placeholder="https://api.exemple.com/webhook"
                          defaultValue="https://api.probooster.com/webhook"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="webhookMethod">Méthode HTTP</Label>
                          <Select defaultValue="POST">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="POST">POST</SelectItem>
                              <SelectItem value="PUT">PUT</SelectItem>
                              <SelectItem value="PATCH">PATCH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="webhookTimeout">Timeout (secondes)</Label>
                          <Input
                            id="webhookTimeout"
                            type="number"
                            placeholder="30"
                            defaultValue="30"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="webhookHeaders">En-têtes personnalisés</Label>
                        <Textarea
                          id="webhookHeaders"
                          placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedAction.type === 'system_action' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration Action Système</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="systemAction">Action à exécuter</Label>
                        <Select defaultValue="suspend_user">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suspend_user">Suspendre l'utilisateur</SelectItem>
                            <SelectItem value="restart_service">Redémarrer le service</SelectItem>
                            <SelectItem value="backup_database">Sauvegarder la base</SelectItem>
                            <SelectItem value="clear_cache">Vider le cache</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="actionDelay">Délai d'exécution (secondes)</Label>
                        <Input
                          id="actionDelay"
                          type="number"
                          placeholder="0"
                          defaultValue="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="actionRetry">Tentatives en cas d'échec</Label>
                        <Input
                          id="actionRetry"
                          type="number"
                          placeholder="3"
                          defaultValue="3"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Paramètres avancés */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Paramètres Avancés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="actionDelay">Délai d'exécution</Label>
                        <Input
                          id="actionDelay"
                          type="number"
                          placeholder="0"
                          defaultValue="0"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="actionRetry">Tentatives</Label>
                        <Input
                          id="actionRetry"
                          type="number"
                          placeholder="3"
                          defaultValue="3"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="actionCondition">Condition d'exécution</Label>
                      <Textarea
                        id="actionCondition"
                        placeholder="Condition personnalisée (optionnel)"
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowActionConfigModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Action configurée',
                  message: `L'action ${selectedAction?.type} a été configurée avec succès`
                })
                setShowActionConfigModal(false)
              }}
            >
              <Settings className="h-4 w-4 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuration globale */}
      <Dialog open={showGlobalConfigModal} onOpenChange={setShowGlobalConfigModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Globale des Notifications
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Paramètres généraux */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paramètres Généraux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Notifications en temps réel</Label>
                        <p className="text-xs text-gray-600">Activer les notifications instantanées</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Mode silencieux</Label>
                        <p className="text-xs text-gray-600">Désactiver entre 22h et 8h</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Limite quotidienne</Label>
                        <p className="text-xs text-gray-600">Max 50 notifications par jour</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxNotifications">Maximum de notifications</Label>
                      <Input
                        id="maxNotifications"
                        type="number"
                        placeholder="50"
                        defaultValue="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <Select defaultValue="Europe/Paris">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intégrations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Intégrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        <span>Web Push</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        <span>Mobile Push</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                        <span>SMS</span>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-orange-600" />
                        <span>Email</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-red-600" />
                        <span>In-App</span>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Templates de Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Template de bienvenue</p>
                      <p className="text-sm text-gray-600">Email de bienvenue pour nouveaux utilisateurs</p>
                    </div>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Template de commande</p>
                      <p className="text-sm text-gray-600">Confirmation de commande</p>
                    </div>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">Template de sécurité</p>
                      <p className="text-sm text-gray-600">Alertes de sécurité</p>
                    </div>
                    <Button size="sm" variant="outline">Modifier</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowGlobalConfigModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={() => {
                addNotification({
                  type: 'success',
                  title: 'Configuration sauvegardée',
                  message: 'La configuration globale a été sauvegardée avec succès'
                })
                setShowGlobalConfigModal(false)
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de création de notification */}
      <Dialog open={showCreateNotificationModal} onOpenChange={setShowCreateNotificationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Créer une Nouvelle Notification
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de Base</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newTitle">Titre</Label>
                    <Input
                      id="newTitle"
                      placeholder="Ex: Notification système"
                      defaultValue="Nouvelle Notification"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newType">Type</Label>
                    <Select defaultValue="system">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Système</SelectItem>
                        <SelectItem value="order">Commande</SelectItem>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="payment">Paiement</SelectItem>
                        <SelectItem value="alert">Alerte</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="security">Sécurité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPriority">Priorité</Label>
                    <Select defaultValue="medium">
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
                    <Label htmlFor="newChannel">Canal</Label>
                    <Select defaultValue="email">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="push">Push</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="in-app">In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="newMessage">Message</Label>
                  <Textarea
                    id="newMessage"
                    placeholder="Contenu de la notification..."
                    rows={3}
                    defaultValue="Contenu de la nouvelle notification"
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="newRecipient">Destinataire</Label>
                  <Input
                    id="newRecipient"
                    placeholder="admin@probooster.com"
                    defaultValue="admin@probooster.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowCreateNotificationModal(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={() => {
                createNotification()
                setShowCreateNotificationModal(false)
              }}
            >
              <Bell className="h-4 w-4 mr-2" />
              Créer la Notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
