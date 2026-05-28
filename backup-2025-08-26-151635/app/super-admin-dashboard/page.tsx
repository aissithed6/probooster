"use client"

import { useState, useEffect } from 'react'
import { 
  Users, Package, ShoppingCart, DollarSign, 
  TrendingUp, Settings, Bell, MessageSquare,
  Star, Gift, Target, BarChart3, Shield,
  Globe, Zap, Database, Activity, Eye,
  Plus, Search, Filter, MoreHorizontal,
  CheckCircle, AlertTriangle, Clock,
  Heart, Share2, CreditCard, Truck,
  FileText, Lock, Mail, Smartphone, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

// Composants des sections
import SuperAdminOverview from '@/components/super-admin/overview-section'
import UserManagement from '@/components/super-admin/user-management'
import ProductManagement from '@/components/super-admin/product-management'
import OrderManagement from '@/components/super-admin/order-management'
import FinancialManagement from '@/components/super-admin/financial-management'
import MarketingPromotions from '@/components/super-admin/marketing-promotions'
import LoyaltyPoints from '@/components/super-admin/loyalty-points'
import MessagingChat from '@/components/super-admin/messaging-chat'
import ReviewsReputation from '@/components/super-admin/reviews-reputation'
import NotificationsAlerts from '@/components/super-admin/notifications-alerts'
import GlobalSettings from '@/components/super-admin/global-settings'
import AutomationTriggers from '@/components/super-admin/automation-triggers'
import AdvancedAnalytics from '@/components/super-admin/advanced-analytics'
import DesignUX from '@/components/super-admin/design-ux'

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  
  // États pour les modals
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [showMessagesModal, setShowMessagesModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
  // États pour les actions des modals
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showForwardModal, setShowForwardModal] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [replyContent, setReplyContent] = useState('')
  const [forwardRecipient, setForwardRecipient] = useState('')
  const [forwardMessage, setForwardMessage] = useState('')
  const [isReplying, setIsReplying] = useState(false)
  const [isForwarding, setIsForwarding] = useState(false)

  // États globaux pour le super admin
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalVendors: 0,
    pendingVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalPoints: 0,
    unreadMessages: 0,
    systemAlerts: 0
  })

  // Données mock pour les alertes système
  const [systemAlerts, setSystemAlerts] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Serveur de base de données surchargé',
      message: 'Le serveur principal connaît une charge critique (95% CPU)',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      priority: 'high',
      status: 'active'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Espace disque faible',
      message: 'Il reste seulement 15% d\'espace libre sur le serveur de fichiers',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      priority: 'medium',
      status: 'active'
    },
    {
      id: 3,
      type: 'info',
      title: 'Mise à jour de sécurité disponible',
      message: 'Nouvelle version 2.1.4 avec corrections de sécurité',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      priority: 'low',
      status: 'pending'
    },
    {
      id: 4,
      type: 'critical',
      title: 'Tentative d\'intrusion détectée',
      message: '5 tentatives de connexion échouées depuis l\'IP 192.168.1.100',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      priority: 'high',
      status: 'active'
    },
    {
      id: 5,
      type: 'warning',
      title: 'Synchronisation des données en retard',
      message: 'La dernière synchronisation remonte à 2 heures',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      priority: 'medium',
      status: 'active'
    },
    {
      id: 6,
      type: 'info',
      title: 'Sauvegarde automatique terminée',
      message: 'Sauvegarde complète de la base de données réussie',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      priority: 'low',
      status: 'resolved'
    },
    {
      id: 7,
      type: 'warning',
      title: 'Temps de réponse élevé',
      message: 'Le temps de réponse moyen dépasse 3 secondes',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      priority: 'medium',
      status: 'active'
    },
    {
      id: 8,
      type: 'critical',
      title: 'Service de paiement interrompu',
      message: 'Le service de traitement des paiements est temporairement indisponible',
      timestamp: new Date(Date.now() - 150000).toISOString(),
      priority: 'high',
      status: 'active'
    }
  ])

  // Données mock pour les messages non lus
  const [unreadMessages, setUnreadMessages] = useState([
    {
      id: 1,
      from: 'Support Client',
      subject: 'Demande d\'assistance urgente',
      message: 'Un client signale un problème de paiement critique...',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      priority: 'high',
      category: 'support',
      isRead: false
    },
    {
      id: 2,
      from: 'Équipe Technique',
      subject: 'Rapport de maintenance',
      message: 'Maintenance planifiée pour le serveur principal...',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      priority: 'medium',
      category: 'technical',
      isRead: false
    },
    {
      id: 3,
      from: 'Direction',
      subject: 'Réunion stratégique',
      message: 'Préparation de la réunion mensuelle...',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      priority: 'low',
      category: 'management',
      isRead: false
    }
  ])

  // Données mock pour les équipes et destinataires
  const [teams] = useState([
    { id: 1, name: 'Support Client', email: 'support@probooster.com' },
    { id: 2, name: 'Équipe Technique', email: 'tech@probooster.com' },
    { id: 3, name: 'Direction', email: 'direction@probooster.com' },
    { id: 4, name: 'Marketing', email: 'marketing@probooster.com' },
    { id: 5, name: 'Finance', email: 'finance@probooster.com' },
    { id: 6, name: 'Ressources Humaines', email: 'rh@probooster.com' }
  ])

  // Chargement des statistiques globales
  useEffect(() => {
    const loadGlobalStats = async () => {
      setIsLoading(true)
      try {
        // Simulation de chargement des données
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setGlobalStats({
          totalUsers: 15420,
          activeUsers: 12850,
          totalVendors: 1250,
          pendingVendors: 45,
          totalProducts: 45680,
          totalOrders: 8920,
          totalRevenue: 125000000,
          totalPoints: 45600000,
          unreadMessages: 156,
          systemAlerts: 8
        })
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGlobalStats()
  }, [])

  // Fonctions de gestion des alertes et messages
  const handleAlertAction = (alertId: number, action: 'resolve' | 'ignore' | 'escalate') => {
    console.log(`Action ${action} sur l'alerte ${alertId}`)
    
    // Mise à jour du statut de l'alerte
    if (action === 'resolve') {
      setSystemAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ))
      // Mettre à jour les statistiques globales
      setGlobalStats(prev => ({ ...prev, systemAlerts: prev.systemAlerts - 1 }))
    } else if (action === 'ignore') {
      setSystemAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'ignored' } : alert
      ))
      // Mettre à jour les statistiques globales
      setGlobalStats(prev => ({ ...prev, systemAlerts: prev.systemAlerts - 1 }))
    } else if (action === 'escalate') {
      // Logique d'escalade - notifier les administrateurs supérieurs
      console.log(`Alerte ${alertId} escaladée vers l'équipe de direction`)
      alert(`Alerte ${alertId} escaladée avec succès`)
    }
  }

  const handleMessageAction = (messageId: number, action: 'read' | 'reply' | 'forward' | 'delete') => {
    const message = unreadMessages.find(m => m.id === messageId)
    if (!message) return

    if (action === 'read') {
      // Marquer le message comme lu
      setUnreadMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, isRead: true } : m
      ))
      // Mettre à jour les statistiques globales
      setGlobalStats(prev => ({ ...prev, unreadMessages: prev.unreadMessages - 1 }))
      alert(`Message "${message.subject}" marqué comme lu`)
    } else if (action === 'reply') {
      // Ouvrir le modal de réponse
      setSelectedMessage(message)
      setReplyContent('')
      setShowReplyModal(true)
    } else if (action === 'forward') {
      // Ouvrir le modal de transfert
      setSelectedMessage(message)
      setForwardRecipient('')
      setForwardMessage(message.message)
      setShowForwardModal(true)
    } else if (action === 'delete') {
      // Supprimer le message
      if (confirm(`Êtes-vous sûr de vouloir supprimer le message "${message.subject}" ?`)) {
        setUnreadMessages(prev => prev.filter(m => m.id !== messageId))
        // Mettre à jour les statistiques globales
        setGlobalStats(prev => ({ ...prev, unreadMessages: prev.unreadMessages - 1 }))
        alert(`Message "${message.subject}" supprimé avec succès`)
      }
    }
  }

  // Fonctions pour les modals de réponse et transfert
  const handleReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return
    
    setIsReplying(true)
    try {
      // Simulation d'envoi de réponse
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert(`Réponse envoyée avec succès à ${selectedMessage.from}`)
      setShowReplyModal(false)
      setSelectedMessage(null)
      setReplyContent('')
      
      // Marquer le message comme lu après réponse
      setUnreadMessages(prev => prev.map(m => 
        m.id === selectedMessage.id ? { ...m, isRead: true } : m
      ))
      setGlobalStats(prev => ({ ...prev, unreadMessages: prev.unreadMessages - 1 }))
    } catch (error) {
      alert('Erreur lors de l\'envoi de la réponse')
    } finally {
      setIsReplying(false)
    }
  }

  const handleForward = async () => {
    if (!selectedMessage || !forwardRecipient.trim() || !forwardMessage.trim()) return
    
    setIsForwarding(true)
    try {
      // Simulation d'envoi du transfert
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert(`Message transféré avec succès à ${forwardRecipient}`)
      setShowForwardModal(false)
      setSelectedMessage(null)
      setForwardRecipient('')
      setForwardMessage('')
    } catch (error) {
      alert('Erreur lors du transfert du message')
    } finally {
      setIsForwarding(false)
    }
  }

  const handleMarkAllAlertsAsRead = () => {
    if (confirm('Marquer toutes les alertes comme lues ?')) {
      setSystemAlerts(prev => prev.map(alert => ({ ...alert, status: 'resolved' })))
      setGlobalStats(prev => ({ ...prev, systemAlerts: 0 }))
      alert('Toutes les alertes ont été marquées comme lues')
    }
  }

  const handleMarkAllMessagesAsRead = () => {
    if (confirm('Marquer tous les messages comme lus ?')) {
      setUnreadMessages(prev => prev.map(message => ({ ...message, isRead: true })))
      setGlobalStats(prev => ({ ...prev, unreadMessages: 0 }))
      alert('Tous les messages ont été marqués comme lus')
    }
  }

  const handleConfigSave = (configData: any) => {
    console.log('Configuration sauvegardée:', configData)
    // Ici on pourrait implémenter la logique réelle
  }

  // Configuration des sections avec icônes et descriptions
  const sections = [
    {
      id: 'overview',
      title: 'Vue d\'Ensemble',
      icon: BarChart3,
      description: 'Tableau de bord principal et KPIs',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'users',
      title: 'Gestion Utilisateurs',
      icon: Users,
      description: 'CRUD, approbations, rôles et permissions',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'products',
      title: 'Gestion Produits',
      icon: Package,
      description: 'Catalogue, création, édition et modération',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'orders',
      title: 'Commandes & Ventes',
      icon: ShoppingCart,
      description: 'Suivi des commandes et paiements',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'financial',
      title: 'Gestion Financière',
      icon: DollarSign,
      description: 'Commissions, points et retraits',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'marketing',
      title: 'Marketing & Promos',
      icon: Target,
      description: 'Campagnes, coupons et offres',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'loyalty',
      title: 'Points & Fidélité',
      icon: Star,
      description: 'Système de fidélité et récompenses',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'messaging',
      title: 'Messagerie & Chat',
      icon: MessageSquare,
      description: 'Modération et synchronisation',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'reviews',
      title: 'Avis & Réputation',
      icon: Star,
      description: 'Modération et gestion des avis',
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Alertes et notifications push',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'settings',
      title: 'Configuration',
      icon: Settings,
      description: 'Paramètres globaux et sécurité',
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'automation',
      title: 'Automatisation',
      icon: Zap,
      description: 'Déclencheurs et règles automatiques',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'analytics',
      title: 'Analyses',
      icon: Activity,
      description: 'Statistiques et rapports avancés',
      color: 'from-violet-500 to-violet-600'
    },
    {
      id: 'design',
      title: 'Design & UX',
      icon: Eye,
      description: 'Interface et expérience utilisateur',
      color: 'from-rose-500 to-rose-600'
    }
  ]

  // Fonction pour rendre le contenu de la section active
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return <SuperAdminOverview stats={globalStats} />
      case 'users':
        return <UserManagement />
      case 'products':
        return <ProductManagement />
      case 'orders':
        return <OrderManagement />
      case 'financial':
        return <FinancialManagement />
      case 'marketing':
        return <MarketingPromotions />
      case 'loyalty':
        return <LoyaltyPoints />
      case 'messaging':
        return <MessagingChat />
      case 'reviews':
        return <ReviewsReputation />
      case 'notifications':
        return <NotificationsAlerts />
      case 'settings':
        return <GlobalSettings />
      case 'automation':
        return <AutomationTriggers />
      case 'analytics':
        return <AdvancedAnalytics />
      case 'design':
        return <DesignUX />
      default:
        return <SuperAdminOverview stats={globalStats} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête du tableau de bord */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tableau de Bord Super Administrateur</h1>
                <p className="text-sm text-gray-600">Gestion totale et contrôle exhaustif de la marketplace</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAlertsModal(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {globalStats.systemAlerts} Alertes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowMessagesModal(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {globalStats.unreadMessages} Messages
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowConfigModal(true)}
                className="hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques globales en temps réel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Utilisateurs Actifs</p>
                  <p className="text-2xl font-bold text-blue-900">{globalStats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-blue-700">Sur {globalStats.totalUsers.toLocaleString()} total</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold text-green-900">{(globalStats.totalRevenue / 1000000).toFixed(1)}M FCFA</p>
                  <p className="text-xs text-green-700">+12.5% ce mois</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Points en Circulation</p>
                  <p className="text-2xl font-bold text-orange-900">{(globalStats.totalPoints / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-orange-700">Fidélité active</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Commandes en Cours</p>
                  <p className="text-2xl font-bold text-purple-900">{globalStats.totalOrders.toLocaleString()}</p>
                  <p className="text-xs text-purple-700">Ce mois</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Vendeurs en Attente</p>
                  <p className="text-2xl font-bold text-red-900">{globalStats.pendingVendors}</p>
                  <p className="text-xs text-red-700">Approbation requise</p>
                </div>
                <Package className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Layout principal avec barre latérale et contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-6">
          {/* Barre latérale gauche */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections d'Administration</h3>
              
              <div className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg` 
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : `bg-gradient-to-r ${section.color} text-white`
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                            {section.title}
                          </p>
                          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* En-tête de la section active */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const activeSectionData = sections.find(s => s.id === activeSection)
                    const IconComponent = activeSectionData?.icon
                    return (
                      <>
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${activeSectionData?.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{activeSectionData?.title}</h2>
                      </>
                    )
                  })()}
                </div>
                <p className="text-gray-600">{sections.find(s => s.id === activeSection)?.description}</p>
              </div>

              {/* Contenu de la section */}
              <div className="min-h-[600px]">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal des Alertes Système */}
      <Dialog open={showAlertsModal} onOpenChange={setShowAlertsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#ff6600]" />
              Alertes Système ({systemAlerts.length})
            </DialogTitle>
            <DialogDescription>
              Gérez et surveillez toutes les alertes système en temps réel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${
                alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                alert.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={alert.type === 'critical' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                        {alert.type === 'critical' ? 'Critique' : alert.type === 'warning' ? 'Avertissement' : 'Info'}
                      </Badge>
                      <Badge variant="outline" className={
                        alert.priority === 'high' ? 'border-red-300 text-red-700' :
                        alert.priority === 'medium' ? 'border-orange-300 text-orange-700' :
                        'border-blue-300 text-blue-700'
                      }>
                        {alert.priority === 'high' ? 'Haute' : alert.priority === 'medium' ? 'Moyenne' : 'Basse'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {alert.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'resolve')}
                          className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Résoudre
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'ignore')}
                          className="text-[#535455] border-[#535455] hover:bg-[#535455]/10"
                        >
                          Ignorer
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAlertAction(alert.id, 'escalate')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      Escalader
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowAlertsModal(false)}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Fermer
            </Button>
            <Button 
              onClick={handleMarkAllAlertsAsRead}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              Tout marquer comme lu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des Messages */}
      <Dialog open={showMessagesModal} onOpenChange={setShowMessagesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#ff6600]" />
              Messages ({unreadMessages.length})
            </DialogTitle>
            <DialogDescription>
              Gérez vos messages et communications internes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {unreadMessages.map((message) => (
              <div key={message.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={
                        message.priority === 'high' ? 'border-red-300 text-red-700' :
                        message.priority === 'medium' ? 'border-orange-300 text-orange-700' :
                        'border-blue-300 text-blue-700'
                      }>
                        {message.priority === 'high' ? 'Urgent' : message.priority === 'medium' ? 'Important' : 'Normal'}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        {message.category === 'support' ? 'Support' : message.category === 'technical' ? 'Technique' : 'Direction'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{message.subject}</h4>
                    <p className="text-sm text-gray-600 mb-2">De: {message.from}</p>
                    <p className="text-sm text-gray-600">{message.message}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'read')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Marquer lu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'reply')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Répondre
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'forward')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Transférer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMessageAction(message.id, 'delete')}
                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600]/10"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowMessagesModal(false)}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Fermer
            </Button>
            <Button 
              onClick={handleMarkAllMessagesAsRead}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              Tout marquer comme lu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configuration */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#ff6600]" />
              Configuration Système
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres globaux de la marketplace
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
            {/* Paramètres de sécurité */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Sécurité</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Authentification à deux facteurs</p>
                    <p className="text-sm text-gray-500">Obligatoire pour tous les administrateurs</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sessions multiples</p>
                    <p className="text-sm text-gray-500">Autoriser plusieurs connexions simultanées</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Audit des actions</p>
                    <p className="text-sm text-gray-500">Enregistrer toutes les actions administratives</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Paramètres de performance */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Cache système</p>
                    <p className="text-sm text-gray-500">Activer le cache pour améliorer les performances</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Compression des données</p>
                    <p className="text-sm text-gray-500">Compresser les données pour économiser la bande passante</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Paramètres de maintenance */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Maintenance</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Mode maintenance</p>
                    <p className="text-sm text-gray-500">Activer le mode maintenance pour les mises à jour</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sauvegarde automatique</p>
                    <p className="text-sm text-gray-500">Sauvegarde automatique toutes les heures</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Paramètres de notifications */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Alertes par email</p>
                    <p className="text-sm text-gray-500">Recevoir les alertes système par email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notifications push</p>
                    <p className="text-sm text-gray-500">Activer les notifications push en temps réel</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Rapports quotidiens</p>
                    <p className="text-sm text-gray-500">Envoyer des rapports quotidiens par email</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>

            {/* Paramètres de sécurité avancée */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Sécurité Avancée</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Chiffrement des données</p>
                    <p className="text-sm text-gray-500">Chiffrer toutes les données sensibles</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Détection d'intrusion</p>
                    <p className="text-sm text-gray-500">Système de détection d'intrusion automatique</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sauvegarde chiffrée</p>
                    <p className="text-sm text-gray-500">Chiffrer les sauvegardes automatiques</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowConfigModal(false)}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => {
                handleConfigSave({ security: true, performance: true, maintenance: false })
                setShowConfigModal(false)
              }}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              Sauvegarder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Réponse */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#ff6600]" />
              Répondre au message
            </DialogTitle>
            <DialogDescription>
              Répondez au message de {selectedMessage?.from}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{selectedMessage?.subject}</h4>
              <p className="text-sm text-gray-600 mb-2">De: {selectedMessage?.from}</p>
              <p className="text-sm text-gray-600">{selectedMessage?.message}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Votre réponse</label>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tapez votre réponse..."
                className="min-h-[128px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowReplyModal(false)
                setSelectedMessage(null)
                setReplyContent('')
              }}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleReply}
              disabled={!replyContent.trim() || isReplying}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              {isReplying ? 'Envoi...' : 'Envoyer la réponse'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Transfert */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#ff6600]" />
              Transférer le message
            </DialogTitle>
            <DialogDescription>
              Transférez ce message à un autre destinataire
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{selectedMessage?.subject}</h4>
              <p className="text-sm text-gray-600 mb-2">De: {selectedMessage?.from}</p>
              <p className="text-sm text-gray-600">{selectedMessage?.message}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Destinataire</label>
              <Select value={forwardRecipient} onValueChange={setForwardRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un destinataire" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name} ({team.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message (optionnel)</label>
              <Textarea
                value={forwardMessage}
                onChange={(e) => setForwardMessage(e.target.value)}
                placeholder="Ajoutez un message d'accompagnement..."
                className="min-h-[96px]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowForwardModal(false)
                setSelectedMessage(null)
                setForwardRecipient('')
                setForwardMessage('')
              }}
              className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleForward}
              disabled={!forwardRecipient.trim() || isForwarding}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              {isForwarding ? 'Transfert...' : 'Transférer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
