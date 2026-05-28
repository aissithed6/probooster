"use client"

import { useState, useEffect } from 'react'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Settings, 
  BarChart3, 
  Trophy, 
  MapPin, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Mail,
  Edit,
  Eye,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  Star,
  Zap,
  ImageIcon,
  MessageCircle,
  RefreshCw,
  Play,
  Pause,
  StopCircle,
  Gift,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useNotifications } from '@/components/ui/modern-notification'
import { useAuth } from '@/contexts/AuthContext'
import BoostingApproval from './boosting-approval'

// Import des services Supabase
import {
  BoostingServiceManager,
  BoostingCampaignManager,
  PromotionManager,
  type BoostingService as BoostingServiceType,
  type BoostingCampaign as BoostingCampaignType,
  type Promotion as PromotionType
} from '@/lib/services/marketing-service'

// Utilisation des types Supabase uniquement
// Les interfaces locales ont été supprimées pour éviter les conflits de types

export default function MarketingPromotions() {
  // Hooks
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  const { confirm } = useConfirm()
  
  // États principaux
  const [activeTab, setActiveTab] = useState('overview')
  const [activeSubTab, setActiveSubTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState<BoostingCampaignType[]>([])
  const [services, setServices] = useState<BoostingServiceType[]>([])
  const [promotions, setPromotions] = useState<PromotionType[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<BoostingCampaignType | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [showNewPromotionModal, setShowNewPromotionModal] = useState(false)
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false)
  const [showBoostingModal, setShowBoostingModal] = useState(false)
  const [boostingType, setBoostingType] = useState<'recommandation' | 'banniere' | 'whatsapp' | null>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState('6months')
  const [analyticsData, setAnalyticsData] = useState({
    totalBoostages: 0,
    totalRevenue: 0,
    activeVendors: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
    revenueGrowth: 0,
    vendorsGrowth: 0,
    conversionGrowth: 0
  })

  // Nouveaux états pour les modals
  const [showServiceConfigModal, setShowServiceConfigModal] = useState(false)
  const [showServiceDetailsModal, setShowServiceDetailsModal] = useState(false)
  const [showServiceStatsModal, setShowServiceStatsModal] = useState(false)
  const [showNewCampaignFormModal, setShowNewCampaignFormModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [selectedService, setSelectedService] = useState<BoostingServiceType | null>(null)
  const [serviceConfig, setServiceConfig] = useState({
    // Configuration par défaut des services (modifiable par l'admin)
    recommendation: {
      homePage: 5000,
      productPage: 4000,
      bestSellers: 3500,
      newArrivals: 3000,
      vendorPage: 2500,
      multiPageDiscount: 15
    },
    banner: {
      multiplier: 0.8,
      animationFee: 500
    },
    whatsapp: {
      baseCost: 25,
      countryCost: 100,
      ageCost: 50,
      professionCost: 75,
      proboosterCost: 10
    }
  })
  const [newCampaignData, setNewCampaignData] = useState({
    vendorName: '',
    serviceType: '',
    targetPages: [] as string[],
    startDate: '',
    endDate: '',
    budget: 0,
    description: '',
    paymentStatus: 'pending',
    // Champs spécifiques WhatsApp
    productLink: '',
    whatsappNumber: '',
    targetCountries: [] as string[],
    targetAgeRange: '',
    targetProfessions: [] as string[],
    targetInterests: [] as string[],
    customProfession: '',
    // Champs spécifiques Bannière
    bannerTitle: '',
    bannerDescription: '',
    bannerImage: null as File | null
  })
  const [exportData, setExportData] = useState({
    format: 'csv',
    dateRange: '30days',
    includePerformance: true
  })
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; category: string }>>([])
  const [boostingForm, setBoostingForm] = useState({
    productName: '',
    productDescription: '',
    targetAudience: {
      countries: [] as string[],
      ageRange: '',
      professions: [] as string[],
      interests: [] as string[]
    },
    budget: 0,
    startDate: '',
    endDate: '',
    messageContent: '',
    targetCustomProfession: ''
  })
  const [whatsappCustomProfession, setWhatsappCustomProfession] = useState('')
  const [targetCustomProfession, setTargetCustomProfession] = useState('')
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('campaigns')

  // Nouvel état pour le modal de détails de campagne
  const [showCampaignDetailsModal, setShowCampaignDetailsModal] = useState(false)

  // États pour les modals de promotion
  const [showEditPromotionModal, setShowEditPromotionModal] = useState(false)
  const [showViewPromotionModal, setShowViewPromotionModal] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionType | null>(null)
  const [promotionForm, setPromotionForm] = useState({
    name: '',
    type: 'code' as 'code' | 'reduction' | 'flash' | 'bundle',
    discountType: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    discountValue: 0,
    startDate: '',
    endDate: '',
    minAmount: 0,
    usageLimit: 100,
    conditions: ''
  })

  // État pour le calcul des coûts
  const [costCalculation, setCostCalculation] = useState({
    days: 7,
    pages: 3,
    whatsappTargets: 100
  })

  // Chargement des données au montage
  useEffect(() => {
    loadData()
  }, [])

  // Recalculer les analytics quand les données changent
  useEffect(() => {
    if (campaigns.length > 0) {
      updateAnalyticsData(analyticsPeriod)
    }
  }, [campaigns, analyticsPeriod])

  // Charger les données depuis Supabase
  const loadData = async () => {
    setLoading(true)
    try {
      // Charger les services
      const servicesData = await BoostingServiceManager.getAllServices()
      setServices(servicesData)

      // Charger les campagnes
      const campaignsData = await BoostingCampaignManager.getAllCampaigns()
      setCampaigns(campaignsData)

      // Charger les promotions
      const promotionsData = await PromotionManager.getAllPromotions()
      setPromotions(promotionsData)

      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Données chargées avec succès'
      })
    } catch (error) {
      console.error('Erreur chargement données:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du chargement des données'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonction loadMockData supprimée - Les données viennent maintenant de Supabase via loadData()

  // ============================================
  // FONCTIONS DE GESTION DES SERVICES
  // ============================================

  const handleCreateService = async (serviceData: {
    name: string
    description: string
    type: 'recommendation' | 'banner' | 'whatsapp'
    base_price: number
    pricing_model: 'per_page_day' | 'per_message_country' | 'fixed'
    features: string[]
  }) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Vous devez être connecté pour créer un service'
      })
      return
    }

    setLoading(true)
    try {
      const newService = await BoostingServiceManager.createService(
        {
          ...serviceData,
          is_active: true,
          created_by: user.id
        },
        user.id
      )

      if (newService) {
        setServices([...services, newService])
        addNotification({
          type: 'success',
          title: 'Service Créé',
          message: 'Le service de boostage a été créé avec succès'
        })
        setShowServiceConfigModal(false)
      }
    } catch (error) {
      console.error('Erreur création service:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création du service'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateService = async (
    serviceId: string,
    updates: Partial<BoostingServiceType>
  ) => {
    setLoading(true)
    try {
      const updated = await BoostingServiceManager.updateService(serviceId, updates)
      
      if (updated) {
        setServices(services.map(s => s.id === serviceId ? updated : s))
        addNotification({
          type: 'success',
          title: 'Service Mis à Jour',
          message: 'Le service a été mis à jour avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur mise à jour service:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour du service'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    const accepted = await confirm({
      title: 'Supprimer le service',
      message: 'Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    setLoading(true)
    try {
      const success = await BoostingServiceManager.deleteService(serviceId)
      
      if (success) {
        setServices(services.filter(s => s.id !== serviceId))
        addNotification({
          type: 'success',
          title: 'Service Supprimé',
          message: 'Le service a été supprimé avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur suppression service:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression du service'
      })
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FONCTIONS DE GESTION DES CAMPAGNES
  // ============================================

  const handleCampaignApproval = async (campaignId: string) => {
    setLoading(true)
    try {
      const success = await BoostingCampaignManager.approveCampaign(campaignId)
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Approuvée',
          message: 'La campagne de boostage a été approuvée et activée'
        })
        loadData() // Recharger pour voir le changement
      }
    } catch (error) {
      console.error('Erreur approbation campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'approbation de la campagne'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignRejection = async (campaignId: string, reason: string) => {
    setLoading(true)
    try {
      const success = await BoostingCampaignManager.rejectCampaign(campaignId, reason)
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Rejetée',
          message: 'La campagne a été rejetée avec succès'
        })
        loadData()
      }
    } catch (error) {
      console.error('Erreur rejet campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du rejet de la campagne'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignStatusChange = async (campaignId: string, newStatus: 'active' | 'paused') => {
    setLoading(true)
    try {
      let success = false
      if (newStatus === 'paused') {
        success = await BoostingCampaignManager.pauseCampaign(campaignId)
      } else {
        success = await BoostingCampaignManager.resumeCampaign(campaignId)
      }
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Statut Modifié',
          message: `La campagne a été ${newStatus === 'paused' ? 'mise en pause' : 'reprise'}`
        })
        loadData()
      }
    } catch (error) {
      console.error('Erreur changement statut:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du changement de statut'
      })
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FONCTIONS DE GESTION DES PROMOTIONS
  // ============================================

  const handleCreatePromotion = async (promotionData: {
    name: string
    code: string | null
    type: 'coupon' | 'discount' | 'flash_sale' | 'bundle'
    discount_type: 'percentage' | 'fixed' | 'free_shipping'
    discount_value: number
    start_date: string
    end_date: string
    applicable_products: string[]
    usage_limit: number
  }) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Vous devez être connecté pour créer une promotion'
      })
      return
    }

    setLoading(true)
    try {
      const newPromotion = await PromotionManager.createPromotion(
        {
          ...promotionData,
          status: 'draft',
          target_audience: [],
          applicable_categories: [],
          applicable_vendors: [],
          is_auto_apply: false,
          description: null,
          min_order_amount: null,
          max_discount: null,
          usage_limit_per_user: 1,
          created_by: user.id
        },
        user.id
      )

      if (newPromotion) {
        setPromotions([...promotions, newPromotion])
        addNotification({
          type: 'success',
          title: 'Promotion Créée',
          message: 'La promotion a été créée avec succès'
        })
        setShowNewPromotionModal(false)
      }
    } catch (error) {
      console.error('Erreur création promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création de la promotion'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePromotion = async (
    promotionId: string,
    updates: Partial<PromotionType>
  ) => {
    setLoading(true)
    try {
      const updated = await PromotionManager.updatePromotion(promotionId, updates)
      
      if (updated) {
        setPromotions(promotions.map(p => p.id === promotionId ? updated : p))
        addNotification({
          type: 'success',
          title: 'Promotion Mise à Jour',
          message: 'La promotion a été mise à jour avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur mise à jour promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour de la promotion'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePromotion = async (promotionId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    
    setLoading(true)
    try {
      const updated = await PromotionManager.updatePromotion(promotionId, {
        status: newStatus as any
      })
      
      if (updated) {
        setPromotions(promotions.map(p => p.id === promotionId ? updated : p))
        addNotification({
          type: 'success',
          title: 'Statut Modifié',
          message: `Promotion ${newStatus === 'active' ? 'activée' : 'désactivée'}`
        })
      }
    } catch (error) {
      console.error('Erreur toggle promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la modification du statut'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
    const accepted = await confirm({
      title: 'Supprimer la promotion',
      message: 'Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    setLoading(true)
    try {
      const success = await PromotionManager.deletePromotion(promotionId)
      
      if (success) {
        setPromotions(promotions.filter(p => p.id !== promotionId))
        addNotification({
          type: 'success',
          title: 'Promotion Supprimée',
          message: 'La promotion a été supprimée avec succès'
        })
      }
    } catch (error) {
      console.error('Erreur suppression promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression de la promotion'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour ouvrir le modal de détails de campagne
  const handleViewCampaignDetails = (campaign: BoostingCampaign) => {
    setSelectedCampaign(campaign)
    setShowCampaignDetailsModal(true)
  }

  // Fonction de formatage des prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price)
  }

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', text: 'En Attente', color: 'bg-yellow-100 text-yellow-800' },
      active: { variant: 'default', text: 'Active', color: 'bg-green-100 text-green-800' },
      paused: { variant: 'secondary', text: 'En Pause', color: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'default', text: 'Terminée', color: 'bg-gray-100 text-gray-800' },
      rejected: { variant: 'destructive', text: 'Rejetée', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <Badge variant={config.variant as any} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  // Fonction pour mettre à jour les données d'analytics
  const updateAnalyticsData = (period: string) => {
    setAnalyticsPeriod(period)
    
    // Calculer les données réelles depuis les campagnes
    const totalBoostages = campaigns.length
    const totalRevenue = campaigns
      .filter(c => c.payment_status === 'paid')
      .reduce((sum, c) => sum + c.total_cost, 0)
    
    // Compter les vendeurs uniques
    const uniqueVendors = new Set(campaigns.map(c => c.vendor_id))
    const activeVendors = uniqueVendors.size
    
    // Calculer le taux de conversion moyen
    const campaignsWithPerf = campaigns.filter(c => c.performance)
    const avgConversionRate = campaignsWithPerf.length > 0
      ? campaignsWithPerf.reduce((sum, c) => sum + (c.performance?.conversionRate || 0), 0) / campaignsWithPerf.length
      : 0
    
    // Croissance réelle (nécessite historique - pour l'instant à 0)
    const monthlyGrowth = 0
    const revenueGrowth = 0
    const vendorsGrowth = 0
    const conversionGrowth = 0
    
    setAnalyticsData({
      totalBoostages,
      totalRevenue,
      activeVendors,
      conversionRate: parseFloat(avgConversionRate.toFixed(2)),
      monthlyGrowth,
      revenueGrowth,
      vendorsGrowth,
      conversionGrowth
    })
  }

  // Fonction pour formater les grands nombres
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Fonction pour générer et télécharger un rapport PDF
  const handleExportPDF = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Génération PDF en cours...',
        message: 'Veuillez patienter pendant la génération du rapport.',
        duration: 3000
      })

      // Simulation de génération PDF
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer le contenu du PDF
      const pdfContent = `
        RAPPORT MENSUEL MARKETING - ${new Date().toLocaleDateString('fr-FR')}
        
        MÉTRIQUES PRINCIPALES:
        - Total Boostages: ${analyticsData.totalBoostages}
        - Revenus Totaux: ${formatPrice(analyticsData.totalRevenue)}
        - Vendeurs Actifs: ${analyticsData.activeVendors}
        - Taux de Conversion: ${analyticsData.conversionRate}%
        
        CROISSANCE:
        - Croissance mensuelle: +${analyticsData.monthlyGrowth}%
        - Croissance des revenus: +${analyticsData.revenueGrowth}%
        - Croissance des vendeurs: +${analyticsData.vendorsGrowth}%
        
        PÉRIODE: ${analyticsPeriod === '1month' ? '1 Mois' : 
                   analyticsPeriod === '3months' ? '3 Mois' :
                   analyticsPeriod === '6months' ? '6 Mois' : '1 An'}
        
        Généré le: ${new Date().toLocaleString('fr-FR')}
      `

      // Créer et télécharger le fichier
      const blob = new Blob([pdfContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-marketing-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        title: 'Export PDF réussi',
        message: 'Le rapport PDF a été généré et téléchargé avec succès.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de la génération du PDF.',
        duration: 4000
      })
    }
  }

  // Fonction pour générer et télécharger les données CSV
  const handleExportCSV = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Génération CSV en cours...',
        message: 'Veuillez patienter pendant la génération des données.',
        duration: 3000
      })

      // Simulation de génération CSV
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Créer le contenu CSV
      const csvContent = `Période,Total Boostages,Revenus Totaux,Vendeurs Actifs,Taux de Conversion,Croissance Mensuelle,Croissance Revenus,Croissance Vendeurs
${analyticsPeriod === '1month' ? '1 Mois' : 
  analyticsPeriod === '3months' ? '3 Mois' :
  analyticsPeriod === '6months' ? '6 Mois' : '1 An'},${analyticsData.totalBoostages},${formatPrice(analyticsData.totalRevenue)},${analyticsData.activeVendors},${analyticsData.conversionRate}%,${analyticsData.monthlyGrowth}%,${analyticsData.revenueGrowth}%,${analyticsData.vendorsGrowth}%`

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `donnees-marketing-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      addNotification({
        type: 'success',
        title: 'Export CSV réussi',
        message: 'Les données CSV ont été générées et téléchargées avec succès.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de la génération du CSV.',
        duration: 4000
      })
    }
  }

  // Fonction pour générer et télécharger les graphiques PNG
  const handleExportPNG = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Génération des graphiques en cours...',
        message: 'Veuillez patienter pendant la génération des graphiques.',
        duration: 3000
      })

      // Simulation de génération PNG
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Créer un canvas pour simuler un graphique
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Fond blanc
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, 800, 600)
        
        // Titre
        ctx.fillStyle = '#1f2937'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Graphiques Marketing - Analytics', 400, 40)
        
        // Sous-titre
        ctx.fillStyle = '#6b7280'
        ctx.font = '16px Arial'
        ctx.fillText(`Période: ${analyticsPeriod === '1month' ? '1 Mois' : 
                                   analyticsPeriod === '3months' ? '3 Mois' :
                                   analyticsPeriod === '6months' ? '6 Mois' : '1 An'}`, 400, 70)
        
        // Graphique en barres simple
        ctx.fillStyle = '#3b82f6'
        ctx.fillRect(100, 150, 80, 200)
        ctx.fillStyle = '#10b981'
        ctx.fillRect(200, 120, 80, 230)
        ctx.fillStyle = '#f59e0b'
        ctx.fillRect(300, 180, 80, 170)
        
        // Labels
        ctx.fillStyle = '#374151'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Boostages', 140, 380)
        ctx.fillText('Revenus', 240, 380)
        ctx.fillText('Vendeurs', 340, 380)
        
        // Légende
        ctx.fillStyle = '#6b7280'
        ctx.font = '12px Arial'
        ctx.textAlign = 'left'
        ctx.fillText(`Total Boostages: ${analyticsData.totalBoostages}`, 500, 200)
        ctx.fillText(`Revenus: ${formatPrice(analyticsData.totalRevenue)}`, 500, 230)
        ctx.fillText(`Vendeurs Actifs: ${analyticsData.activeVendors}`, 500, 260)
        ctx.fillText(`Taux Conversion: ${analyticsData.conversionRate}%`, 500, 290)
      }

      // Convertir le canvas en blob et télécharger
      canvas.toBlob((blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `graphiques-marketing-${analyticsPeriod}-${new Date().toISOString().split('T')[0]}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      }, 'image/png')

      addNotification({
        type: 'success',
        title: 'Export PNG réussi',
        message: 'Les graphiques PNG ont été générés et téléchargés avec succès.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de la génération des graphiques.',
        duration: 4000
      })
    }
  }

  // Fonction pour envoyer les rapports par email
  const handleSendEmail = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Envoi par email en cours...',
        message: 'Veuillez patienter pendant l\'envoi du rapport.',
        duration: 3000
      })

      // Simulation d'envoi email
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Préparer le contenu du rapport
      const reportContent = {
        period: analyticsPeriod,
        totalBoostages: analyticsData.totalBoostages,
        totalRevenue: analyticsData.totalRevenue,
        activeVendors: analyticsData.activeVendors,
        conversionRate: analyticsData.conversionRate,
        monthlyGrowth: analyticsData.monthlyGrowth,
        revenueGrowth: analyticsData.revenueGrowth,
        vendorsGrowth: analyticsData.vendorsGrowth
      }

      // Simuler l'envoi à une liste de destinataires
      const recipients = ['admin@probooster.com', 'marketing@probooster.com', 'analytics@probooster.com']
      
      // Log de l'envoi (simulation)
      console.log('📧 Rapport envoyé par email:', {
        recipients,
        reportContent,
        timestamp: new Date().toISOString()
      })

      addNotification({
        type: 'success',
        title: 'Envoi par email réussi',
        message: `Le rapport a été envoyé avec succès à ${recipients.length} destinataires.`,
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'envoi',
        message: 'Une erreur est survenue lors de l\'envoi par email.',
        duration: 4000
      })
    }
  }

  // Fonction pour activer/désactiver un service de boostage
  const handleServiceToggle = (serviceId: string) => {
    setServices(services.map(service =>
      service.id === serviceId ? { ...service, is_active: !service.is_active } : service
    ))
    
    const service = services.find(s => s.id === serviceId)
    if (service) {
      addNotification({
        type: service.is_active ? 'warning' : 'success',
        title: service.is_active ? 'Service Désactivé' : 'Service Activé',
        message: `Le service "${service.name}" a été ${service.is_active ? 'désactivé' : 'activé'} avec succès.`,
        duration: 4000
      })
    }
  }

  // Fonction pour configurer un service de boostage
  const handleServiceConfigure = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService(service)
      setServiceConfig({
        targetPages: service.type === 'recommendation' ? ['home', 'product', 'best_sellers', 'new_arrivals', 'vendor'] : 
                     service.type === 'banner' ? ['home', 'product', 'best_sellers', 'new_arrivals', 'vendor'] : ['whatsapp'],
        schedule: 'daily',
        budget: service.base_price,
        duration: 7,
        autoReload: false,
        notifications: true
      })
      setShowServiceConfigModal(true)
    }
  }

  // Fonction pour voir les détails d'un service
  const handleServiceViewDetails = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService(service)
      setShowServiceDetailsModal(true)
    }
  }

    // Fonction pour démarrer une campagne de boostage
  const handleStartBoosting = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service && service.is_active) {
      setSelectedService(service)
      setNewCampaignData({
        vendorName: '',
        serviceType: service.type,
        targetPages: service.type === 'recommendation' ? ['home', 'product', 'best_sellers', 'new_arrivals', 'vendor'] : 
                     service.type === 'banner' ? ['home', 'product', 'best_sellers', 'new_arrivals', 'vendor'] : [],
        budget: service.base_price,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: `Campagne de ${service.name}`,
        selectedProduct: '',
        aiReload: false,
        aiReloadFrequency: 'daily',
        bannerImage: null,
        bannerTitle: '',
        shortDescription: '',
        whatsappTargetCount: 100,
        whatsappCountryTarget: 'all',
        whatsappAgeTarget: 'all',
        whatsappProfessionTarget: 'all',
        whatsappCustomProfession: '',
        whatsappProductImage: null,
        whatsappMessageTitle: '',
        whatsappProductDescription: '',
        whatsappProductLink: '',
        whatsappSenderNumber: '+225 01234567',
        targetProboosterClients: false,
        requirePayment: false,
        paymentMethod: 'feexpay',
        paymentStatus: 'pending'
      })
      setShowNewCampaignFormModal(true)
    } else {
      addNotification({
        type: 'warning',
        title: 'Service Non Disponible',
        message: `Le service "${service?.name}" doit être activé avant de pouvoir démarrer une campagne.`,
        duration: 4000
      })
    }
  }

  // Fonction pour arrêter une campagne de boostage
  const handleStopBoosting = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      // Arrêter toutes les campagnes actives pour ce service
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign.type === service.type && campaign.status === 'active' 
            ? { ...campaign, status: 'paused' as any }
            : campaign
        )
      )
      
      addNotification({
        type: 'warning',
        title: 'Campagne Arrêtée',
        message: `Toutes les campagnes de boostage "${service.name}" ont été arrêtées.`,
        duration: 4000
      })
    }
  }

  // Fonction pour voir les statistiques d'un service
  const handleViewServiceStats = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service) {
      setSelectedService(service)
      setShowServiceStatsModal(true)
    }
  }

  // Fonction pour actualiser les données
  const handleRefreshData = () => {
    addNotification({
      type: 'info',
      title: 'Actualisation en cours...',
      message: 'Rechargement des données marketing...',
      duration: 2000
    })
    
    // Recharger les données depuis Supabase
    setTimeout(() => {
      loadData()
      addNotification({
        type: 'success',
        title: 'Actualisation terminée',
        message: 'Les données ont été actualisées avec succès.',
        duration: 3000
      })
    }, 2000)
  }

  // Fonction pour exporter les données
  const handleExportData = () => {
    setExportData({
      format: 'pdf',
      period: analyticsPeriod,
      includeCharts: true,
      includeDetails: true
    })
    setShowExportModal(true)
  }

  // Fonction pour créer une nouvelle campagne
  const handleCreateNewCampaign = () => {
    setNewCampaignData({
      vendorName: '',
      serviceType: '',
      targetPages: [],
      budget: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: '',
      selectedProduct: '',
      aiReload: false,
      aiReloadFrequency: 'daily',
      bannerImage: null,
      bannerTitle: '',
      shortDescription: '',
      whatsappTargetCount: 100,
      whatsappCountryTarget: 'all',
      whatsappAgeTarget: 'all',
      whatsappProfessionTarget: 'all',
      whatsappCustomProfession: '',
      whatsappProductImage: null,
      whatsappMessageTitle: '',
      whatsappProductDescription: '',
      whatsappProductLink: '',
      whatsappSenderNumber: '+225 01234567',
      targetProboosterClients: false,
      requirePayment: false,
      paymentMethod: 'feexpay',
      paymentStatus: 'pending'
    })
    setShowNewCampaignFormModal(true)
  }

  // Fonction pour sauvegarder la configuration d'un service
  const handleSaveServiceConfig = () => {
    if (selectedService) {
      addNotification({
        type: 'success',
        title: 'Configuration Sauvegardée',
        message: `La configuration du service "${selectedService.name}" a été sauvegardée avec succès.`,
        duration: 4000
      })
      setShowServiceConfigModal(false)
    }
  }

    // Fonction pour créer une campagne depuis le formulaire
  const handleCreateCampaignFromForm = () => {
    if (newCampaignData.vendorName && newCampaignData.serviceType) {
      // Validation spécifique pour les bannières
      if (newCampaignData.serviceType === 'banner') {
        if (!newCampaignData.bannerImage) {
          addNotification({
            type: 'error',
            title: 'Image de bannière requise',
            message: 'Veuillez ajouter une image de bannière pour continuer.',
            duration: 4000
          })
          return
        }
        if (!newCampaignData.bannerTitle.trim()) {
          addNotification({
            type: 'error',
            title: 'Titre accrocheur requis',
            message: 'Veuillez saisir un titre accrocheur pour la bannière.',
            duration: 4000
          })
          return
        }
        if (!newCampaignData.shortDescription.trim()) {
          addNotification({
            type: 'error',
            title: 'Description courte requise',
            message: 'Veuillez saisir une description courte pour la bannière.',
            duration: 4000
          })
          return
        }
      }

      // Validation spécifique pour WhatsApp
      if (newCampaignData.serviceType === 'whatsapp') {
        if (!newCampaignData.whatsappMessageTitle.trim()) {
          addNotification({
            type: 'error',
            title: 'Titre du message requis',
            message: 'Veuillez saisir un titre de message pour la campagne WhatsApp.',
            duration: 4000
          })
          return
        }
        if (!newCampaignData.whatsappProductDescription.trim()) {
          addNotification({
            type: 'error',
            title: 'Description du produit requise',
            message: 'Veuillez saisir une description du produit pour la campagne WhatsApp.',
            duration: 4000
          })
          return
        }
        if (newCampaignData.whatsappTargetCount < 1) {
          addNotification({
            type: 'error',
            title: 'Nombre de cibles invalide',
            message: 'Le nombre de cibles doit être supérieur à 0.',
            duration: 4000
          })
          return
        }
      }
      
      // Déterminer le statut de la campagne selon les options de paiement
      let campaignStatus: 'pending' | 'active' = 'pending'
      let paymentStatus: 'pending' | 'paid' | 'failed' = 'pending'
      
      if (!newCampaignData.requirePayment) {
        // Campagne gratuite créée par le super admin - démarre automatiquement
        campaignStatus = 'active'
        paymentStatus = 'paid'
      }
      
      const newCampaign: BoostingCampaign = {
        id: `c${Date.now()}`,
        vendorId: `v${Date.now()}`,
        vendorName: newCampaignData.vendorName,
        type: newCampaignData.serviceType as any,
        status: campaignStatus,
        startDate: newCampaignData.startDate,
        endDate: newCampaignData.endDate,
        targetPages: newCampaignData.targetPages,
        duration: Math.ceil((new Date(newCampaignData.endDate).getTime() - new Date(newCampaignData.startDate).getTime()) / (1000 * 60 * 60 * 24)),
        totalCost: newCampaignData.budget,
        paymentStatus: paymentStatus,
        createdAt: new Date().toISOString().split('T')[0]
      }
      
      setCampaigns(prev => [newCampaign, ...prev])
      
      // Sauvegarder la campagne dans le localStorage pour synchronisation avec le tableau de bord vendeur
      const existingVendorCampaigns = JSON.parse(localStorage.getItem(`vendor_campaigns_${newCampaign.vendorName}`) || '[]')
      const updatedVendorCampaigns = [newCampaign, ...existingVendorCampaigns]
      localStorage.setItem(`vendor_campaigns_${newCampaign.vendorName}`, JSON.stringify(updatedVendorCampaigns))
      
      // Sauvegarder aussi dans la liste globale des campagnes
      const existingGlobalCampaigns = JSON.parse(localStorage.getItem('global_campaigns') || '[]')
      const updatedGlobalCampaigns = [newCampaign, ...existingGlobalCampaigns]
      localStorage.setItem('global_campaigns', JSON.stringify(updatedGlobalCampaigns))
      
      // Notification selon le type de campagne
      if (!newCampaignData.requirePayment) {
        addNotification({
          type: 'success',
          title: 'Campagne Créée et Activée',
          message: `La campagne "${newCampaignData.vendorName}" a été créée et démarrée automatiquement (gratuite).`,
          duration: 5000
        })
      } else {
        addNotification({
          type: 'success',
          title: 'Campagne Créée',
          message: `La campagne "${newCampaignData.vendorName}" a été créée avec succès. Paiement requis via ${newCampaignData.paymentMethod}.`,
          duration: 5000
        })
      }
      
      setShowNewCampaignFormModal(false)
                                                       setNewCampaignData({
         vendorName: '',
         serviceType: '',
         targetPages: [],
         budget: 0,
         startDate: new Date().toISOString().split('T')[0],
         endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
         description: '',
         selectedProduct: '',
         aiReload: false,
         aiReloadFrequency: 'daily',
         bannerImage: null,
         bannerTitle: '',
         shortDescription: '',
         whatsappTargetCount: 100,
         whatsappCountryTarget: 'all',
         whatsappAgeTarget: 'all',
         whatsappProfessionTarget: 'all',
         whatsappCustomProfession: '',
         whatsappProductImage: null,
         whatsappMessageTitle: '',
         whatsappProductDescription: '',
         whatsappProductLink: '',
         whatsappSenderNumber: '+225 01234567',
         targetProboosterClients: false,
         requirePayment: false,
         paymentMethod: 'feexpay',
         paymentStatus: 'pending'
       })
    } else {
      addNotification({
        type: 'error',
        title: 'Erreur de Validation',
        message: 'Veuillez remplir tous les champs obligatoires.',
        duration: 4000
      })
    }
  }

  // Fonction pour gérer l'upload d'image de bannière
  const handleBannerImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        addNotification({
          type: 'error',
          title: 'Type de fichier invalide',
          message: 'Veuillez sélectionner une image (JPG, PNG, GIF, etc.)',
          duration: 4000
        })
        return
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: 'error',
          title: 'Fichier trop volumineux',
          message: 'La taille maximale autorisée est de 5MB',
          duration: 4000
        })
        return
      }
      
      setNewCampaignData(prev => ({ ...prev, bannerImage: file }))
      addNotification({
        type: 'success',
        title: 'Image téléchargée',
        message: `${file.name} a été ajouté avec succès`,
        duration: 3000
      })
    }
  }

  // Fonction pour supprimer l'image de bannière
  const handleRemoveBannerImage = () => {
    setNewCampaignData(prev => ({ ...prev, bannerImage: null }))
    addNotification({
      type: 'info',
      title: 'Image supprimée',
      message: 'L\'image de bannière a été supprimée',
      duration: 3000
    })
  }

  // Fonction pour effectuer l'export
  const handlePerformExport = () => {
    addNotification({
      type: 'info',
      title: 'Export en cours...',
      message: `Génération du rapport ${exportData.format.toUpperCase()}...`,
      duration: 3000
    })
    
    // Simuler l'export
    setTimeout(() => {
      const fileName = `rapport-marketing-${exportData.period}-${new Date().toISOString().split('T')[0]}.${exportData.format}`
      addNotification({
        type: 'success',
        title: 'Export Réussi',
        message: `Le rapport a été généré et téléchargé : ${fileName}`,
        duration: 5000
      })
      setShowExportModal(false)
    }, 3000)
  }

  const handleResetToDefaults = () => {
    setServiceConfig({
      recommendation: {
        homePage: 5000,
        productPage: 4000,
        bestSellers: 3500,
        newArrivals: 3000,
        vendorPage: 2500,
        multiPageDiscount: 15
      },
      banner: {
        multiplier: 0.8,
        animationFee: 500
      },
      whatsapp: {
        baseCost: 25,
        countryCost: 100,
        ageCost: 50,
        professionCost: 75,
        proboosterCost: 10
      }
    })
    
    addNotification({
      type: 'success',
      title: 'Configuration réinitialisée',
      message: 'Les valeurs par défaut ont été restaurées avec succès.',
      duration: 3000
    })
  }

  // Fonctions de calcul des coûts estimés
  const calculateRecommendationCost = () => {
    const baseCost = serviceConfig.recommendation.homePage + 
                    serviceConfig.recommendation.productPage + 
                    serviceConfig.recommendation.bestSellers + 
                    serviceConfig.recommendation.newArrivals + 
                    serviceConfig.recommendation.vendorPage
    
    const totalCost = baseCost * costCalculation.days * (costCalculation.pages / 5)
    const discount = totalCost * (serviceConfig.recommendation.multiPageDiscount / 100)
    return Math.round(totalCost - discount)
  }

  const calculateBannerCost = () => {
    const recommendationCost = calculateRecommendationCost()
    return Math.round(recommendationCost * serviceConfig.banner.multiplier + 
                     serviceConfig.banner.animationFee * costCalculation.days)
  }

  const calculateWhatsAppCost = () => {
    const baseCost = serviceConfig.whatsapp.baseCost
    const countryCost = serviceConfig.whatsapp.countryCost
    const ageCost = serviceConfig.whatsapp.ageCost
    const professionCost = serviceConfig.whatsapp.professionCost
    const proboosterCost = serviceConfig.whatsapp.proboosterCost
    
    return Math.round((baseCost + countryCost + ageCost + professionCost + proboosterCost) * costCalculation.whatsappTargets)
  }

  const calculateTotalCost = () => {
    return calculateRecommendationCost() + calculateBannerCost() + calculateWhatsAppCost()
  }

  // Fonctions pour gérer les promotions
  const resetPromotionForm = () => {
    setPromotionForm({
      name: '',
      type: 'code',
      discountType: 'percentage',
      discountValue: 0,
      startDate: '',
      endDate: '',
      minAmount: 0,
      usageLimit: 100,
      conditions: ''
    })
  }

  const handleEditPromotion = (promotion: PromotionCampaign) => {
    setSelectedPromotion(promotion)
    setPromotionForm({
      name: promotion.name,
      type: promotion.type,
      discountType: promotion.discount_type,
      discountValue: promotion.discount_value,
      startDate: promotion.start_date,
      endDate: promotion.end_date,
      minAmount: promotion.min_order_amount || 0,
      usageLimit: promotion.usage_limit,
      conditions: ''
    })
    setShowEditPromotionModal(true)
  }

  const handleViewPromotion = (promotion: PromotionCampaign) => {
    setSelectedPromotion(promotion)
    setShowViewPromotionModal(true)
  }

  const handleTogglePromotionStatus = async (promotionId: string) => {
    const promotion = promotions.find(p => p.id === promotionId)
    if (promotion) {
      await handleTogglePromotion(promotionId, promotion.status)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Marketing et Promotions</h2>
            <p className="text-gray-600 mt-2">
              Gestion des campagnes publicitaires, boostage et stratégies marketing
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button 
              size="sm"
              onClick={handleCreateNewCampaign}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Campagne
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="boosting-pro">Boostage Pro</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'Ensemble */}
        <TabsContent value="overview" className="mt-6">
          {/* En-tête avec boutons d'action */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Vue d'Ensemble du Marketing</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshData}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportData}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button 
                size="sm"
                onClick={handleCreateNewCampaign}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Campagne
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Campagnes Actives</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {campaigns.filter(c => c.status === 'active').length}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">En cours</p>
                  </div>
                  <Play className="h-12 w-12 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Revenus Boostage</p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatPrice(campaigns.reduce((sum, c) => sum + c.totalCost, 0))}
                    </p>
                    <p className="text-sm text-green-700 mt-1">Total généré</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Promotions Actives</p>
                    <p className="text-3xl font-bold text-purple-900">
                      {promotions.filter(p => p.status === 'active').length}
                    </p>
                    <p className="text-sm text-purple-700 mt-1">En cours</p>
                  </div>
                  <Gift className="h-12 w-12 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services de Boostage */}
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Services de Boostage Disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Switch 
                        checked={service.is_active} 
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Prix de base:</span>
                        <span className="font-bold text-green-600">{formatPrice(service.base_price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Modèle:</span>
                        <Badge variant="outline" className="text-xs">
                          {service.pricing_model === 'per_page_day' ? 'Page × Jour' : 
                           service.pricing_model === 'per_message_country' ? 'Message × Pays' : 'Fixe'}
                        </Badge>
                      </div>
                      <div className="pt-3">
                        <h4 className="text-sm font-medium mb-2">Fonctionnalités:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {service.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <Star className="h-3 w-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Boutons d'action */}
                      <div className="pt-4 space-y-2">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleServiceConfigure(service.id)}
                            className="flex-1 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Configurer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleServiceViewDetails(service.id)}
                            className="flex-1 border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Détails
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewServiceStats(service.id)}
                            className="flex-1 border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Stats
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Campagnes */}
        <TabsContent value="campaigns" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gestion des Campagnes de Boostage</h3>
            </div>

            {/* Sous-onglets pour Campagnes */}
            <Tabs defaultValue="approval" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="approval">Approbation</TabsTrigger>
                <TabsTrigger value="ongoing">Campagnes en cours</TabsTrigger>
              </TabsList>

              {/* Sous-onglet Approbation */}
              <TabsContent value="approval" className="mt-6">
                <BoostingApproval />
              </TabsContent>

              {/* Sous-onglet Campagnes en cours */}
              <TabsContent value="ongoing" className="mt-6">
                <div className="space-y-4">
                  {/* Filtres */}
                  <div className="flex items-center gap-4">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="recommendation">Recommandation</SelectItem>
                        <SelectItem value="banner">Bannière</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">En pause</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Liste des campagnes en cours */}
                  <div className="space-y-4">
                    {campaigns.filter(c => c.status === 'active' || c.status === 'paused').map((campaign) => (
                      <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h4 className="font-semibold text-lg">{campaign.vendorName}</h4>
                                {getStatusBadge(campaign.status)}
                                <Badge variant="outline" className="capitalize">
                                  {campaign.type}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Début:</span>
                                  <p className="font-medium">{campaign.start_date}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Fin:</span>
                                  <p className="font-medium">{campaign.end_date}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Durée:</span>
                                  <p className="font-medium">{campaign.duration} jours</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Coût:</span>
                                  <p className="font-medium text-green-600">{formatPrice(campaign.total_cost)}</p>
                                </div>
                              </div>

                              {campaign.performance && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                  <h5 className="font-medium mb-2">Performance</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Impressions:</span>
                                      <p className="font-medium">{campaign.performance.impressions.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Clics:</span>
                                      <p className="font-medium">{campaign.performance.clicks.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">CTR:</span>
                                      <p className="font-medium">{campaign.performance.ctr}%</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Conversions:</span>
                                      <p className="font-medium">{campaign.performance.conversions}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              {campaign.status === 'active' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => handleCampaignStatusChange(campaign.id, 'paused')} className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white">
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleCampaignStatusChange(campaign.id, 'completed')} className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white">
                                    <StopCircle className="h-4 w-4 mr-1" />
                                    Terminer
                                  </Button>
                                </>
                              )}

                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleViewCampaignDetails(campaign)}
                                className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Onglet Boostage Pro */}
        <TabsContent value="boosting-pro" className="mt-6">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="text-xl font-bold text-orange-800">Système de Boostage Pro</h3>
                  <p className="text-orange-700">
                    Système modulaire, intelligent et orienté résultats pour la promotion efficace des produits
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Recommandation Ciblée
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Affichage stratégique sur 5 pages clés avec tarification flexible
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Page d'accueil:</span>
                        <span className="font-medium">{serviceConfig.recommendation.homePage} FCFA/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Page produit:</span>
                        <span className="font-medium">{serviceConfig.recommendation.productPage} FCFA/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Meilleures ventes:</span>
                        <span className="font-medium">{serviceConfig.recommendation.bestSellers} FCFA/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nouvelles arrivées:</span>
                        <span className="font-medium">{serviceConfig.recommendation.newArrivals} FCFA/jour</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Page vendeur:</span>
                        <span className="font-medium">{serviceConfig.recommendation.vendorPage} FCFA/jour</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-green-600" />
                      Bannière Visuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Bannières miniatures animées pour maximiser la conversion
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Même pages que recommandation</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calendrier configurable</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Animations discrètes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimisation conversion</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Multiplicateur:</span>
                        <span className="font-medium">x{serviceConfig.banner.multiplier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frais animation:</span>
                        <span className="font-medium">{serviceConfig.banner.animationFee} FCFA/jour</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-purple-600" />
                      WhatsApp Marketing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Campagnes ultra-ciblées avec ciblage socio-démographique précis et ciblage clients Probooster
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Ciblage pays:</span>
                        <span className="font-medium">{serviceConfig.whatsapp.countryCost} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ciblage âge:</span>
                        <span className="font-medium">{serviceConfig.whatsapp.ageCost} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ciblage profession:</span>
                        <span className="font-medium">{serviceConfig.whatsapp.professionCost} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ciblage clients Probooster:</span>
                        <span className="font-medium">{serviceConfig.whatsapp.proboosterCost} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coût base:</span>
                        <span className="font-medium">{serviceConfig.whatsapp.baseCost} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paiement FeexPay</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Configuration des tarifs */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration des Tarifs Boostage Pro</CardTitle>
                <CardDescription>
                  Paramétrer les tarifs et règles de calcul pour chaque service de boostage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Recommandation Ciblée */}
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h4 className="font-semibold text-blue-800 mb-3">Recommandation Ciblée</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Page d'accueil (FCFA/jour)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.recommendation.homePage}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            recommendation: {
                              ...prev.recommendation,
                              homePage: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Page produit (FCFA/jour)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.recommendation.productPage}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            recommendation: {
                              ...prev.recommendation,
                              productPage: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Meilleures ventes (FCFA/jour)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.recommendation.bestSellers}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            recommendation: {
                              ...prev.recommendation,
                              bestSellers: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Nouvelles arrivées (FCFA/jour)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.recommendation.newArrivals}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            recommendation: {
                              ...prev.recommendation,
                              newArrivals: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Page vendeur (FCFA/jour)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.recommendation.vendorPage}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            recommendation: {
                              ...prev.recommendation,
                              vendorPage: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Réduction multi-pages (%)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.recommendation.multiPageDiscount}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            recommendation: {
                              ...prev.recommendation,
                              multiPageDiscount: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bannière Visuelle */}
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h4 className="font-semibold text-green-800 mb-3">Bannière Visuelle Animée</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Multiplicateur par rapport à recommandation</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.banner.multiplier}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            banner: {
                              ...prev.banner,
                              multiplier: parseFloat(e.target.value) || 0
                            }
                          }))}
                          step="0.1" 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Frais d'animation (FCFA/jour)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.banner.animationFee}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            banner: {
                              ...prev.banner,
                              animationFee: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Marketing */}
                  <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                    <h4 className="font-semibold text-purple-800 mb-3">WhatsApp Marketing Ultra-Ciblé</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Coût par message (FCFA)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.whatsapp.baseCost}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            whatsapp: {
                              ...prev.whatsapp,
                              baseCost: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Majoration pays (FCFA)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.whatsapp.countryCost}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            whatsapp: {
                              ...prev.whatsapp,
                              countryCost: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Majoration âge (FCFA)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.whatsapp.ageCost}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            whatsapp: {
                              ...prev.whatsapp,
                              ageCost: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Majoration profession (FCFA)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.whatsapp.professionCost}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            whatsapp: {
                              ...prev.whatsapp,
                              professionCost: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <Label>Majoration ciblage Probooster (FCFA)</Label>
                        <Input 
                          type="number" 
                          value={serviceConfig.whatsapp.proboosterCost}
                          onChange={(e) => setServiceConfig(prev => ({
                            ...prev,
                            whatsapp: {
                              ...prev.whatsapp,
                              proboosterCost: parseInt(e.target.value) || 0
                            }
                          }))}
                          className="mt-1" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline"
                      onClick={handleResetToDefaults}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réinitialiser aux valeurs par défaut
                    </Button>
                    <Button 
                      onClick={handleSaveServiceConfig}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Sauvegarder la Configuration
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </TabsContent>

        {/* Onglet Promotions (Système existant) */}
        <TabsContent value="promotions" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gestion des Promotions</h3>
              <Button onClick={() => setShowNewPromotionModal(true)} className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Promotion
              </Button>
            </div>

            {/* Liste des promotions existantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promotions.map((promotion) => (
                <Card key={promotion.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{promotion.name}</CardTitle>
                      <Badge variant={promotion.status === 'active' ? 'default' : 'secondary'}>
                        {promotion.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {promotion.discount_type === 'percentage' ? `${promotion.discount_value}% de réduction` : `${formatPrice(promotion.discount_value)} de réduction`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Début:</span>
                          <p className="font-medium">{promotion.start_date}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Fin:</span>
                          <p className="font-medium">{promotion.end_date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Utilisation:</span>
                        <span className="font-medium">{promotion.used_count} / {promotion.usage_limit}</span>
                      </div>

                      {promotion.min_order_amount && (
                        <div className="text-sm">
                          <span className="text-gray-600">Commande minimum: </span>
                          <span className="font-medium">{formatPrice(promotion.min_order_amount)}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditPromotion(promotion)}
                          className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewPromotion(promotion)}
                          className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Sélecteur de période */}
            <div className="flex items-center gap-4">
              <Label htmlFor="analytics-period">Période d'analyse:</Label>
              <Select value={analyticsPeriod} onValueChange={updateAnalyticsData}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1 Mois</SelectItem>
                  <SelectItem value="3months">3 Mois</SelectItem>
                  <SelectItem value="6months">6 Mois</SelectItem>
                  <SelectItem value="1year">1 An</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Boostages</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalBoostages)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">+{analyticsData.monthlyGrowth}% ce mois</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(analyticsData.totalRevenue)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">+{analyticsData.revenueGrowth}% ce mois</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vendeurs Actifs</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.activeVendors}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">+{analyticsData.vendorsGrowth}% ce mois</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taux de Conversion</p>
                      <p className="text-2xl font-bold text-gray-900">{analyticsData.conversionRate}%</p>
                    </div>
                    <Target className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-xs text-green-600 mt-1">+{analyticsData.conversionGrowth}% ce mois</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques et visualisations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Répartition par type de boostage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Répartition par Type de Boostage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Recommandation Ciblée</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">45.2%</p>
                        <p className="text-xs text-gray-500">+4.2%</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '45.2%'}}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Bannière Visuelle</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">32.8%</p>
                        <p className="text-xs text-gray-500">+3.1%</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '32.8%'}}></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium">WhatsApp Marketing</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">22.0%</p>
                        <p className="text-xs text-gray-500">+1.8%</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '22.0%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Évolution temporelle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution des Boostages (6 mois)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Jan</span>
                      <span>Fév</span>
                      <span>Mar</span>
                      <span>Avr</span>
                      <span>Mai</span>
                      <span>Juin</span>
                    </div>
                    
                    <div className="flex items-end justify-between h-32">
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '75%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '85%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '70%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '90%'}}></div>
                      <div className="w-8 bg-blue-500 rounded-t" style={{height: '95%'}}></div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-600">
                      Croissance constante de +15% en moyenne
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top vendeurs et performances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top 10 Vendeurs par Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Rang</th>
                        <th className="text-left py-2 font-medium">Vendeur</th>
                        <th className="text-left py-2 font-medium">Boostages</th>
                        <th className="text-left py-2 font-medium">Revenus</th>
                        <th className="text-left py-2 font-medium">Taux de Conversion</th>
                        <th className="text-left py-2 font-medium">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {rank: 1, vendor: "TechStore Plus", boostages: 45, revenue: "450K FCFA", conversion: "28.5%", performance: "Excellent"},
                        {rank: 2, vendor: "Mode Elegance", boostages: 38, revenue: "380K FCFA", conversion: "25.2%", performance: "Excellent"},
                        {rank: 3, vendor: "Beaute Naturelle", boostages: 32, revenue: "320K FCFA", conversion: "22.8%", performance: "Très Bien"},
                        {rank: 4, vendor: "Electro Pro", boostages: 28, revenue: "280K FCFA", conversion: "20.1%", performance: "Très Bien"},
                        {rank: 5, vendor: "Sport Elite", boostages: 25, revenue: "250K FCFA", conversion: "18.9%", performance: "Bien"},
                        {rank: 6, vendor: "Maison Deco", boostages: 22, revenue: "220K FCFA", conversion: "17.5%", performance: "Bien"},
                        {rank: 7, vendor: "Tech Mobile", boostages: 20, revenue: "200K FCFA", conversion: "16.8%", performance: "Bien"},
                        {rank: 8, vendor: "Fashion Trend", boostages: 18, revenue: "180K FCFA", conversion: "15.2%", performance: "Moyen"},
                        {rank: 9, vendor: "Home Garden", boostages: 15, revenue: "150K FCFA", conversion: "14.1%", performance: "Moyen"},
                        {rank: 10, vendor: "Auto Parts", boostages: 12, revenue: "120K FCFA", conversion: "12.8%", performance: "Moyen"}
                      ].map((item, index) => (
                        <tr key={item.rank} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            <Badge variant={item.rank <= 3 ? "default" : "secondary"}>
                              #{item.rank}
                            </Badge>
                          </td>
                          <td className="py-2 font-medium">{item.vendor}</td>
                          <td className="py-2">{item.boostages}</td>
                          <td className="py-2 font-semibold">{item.revenue}</td>
                          <td className="py-2">{item.conversion}</td>
                          <td className="py-2">
                            <Badge
                              variant={
                                item.performance === "Excellent" ? "default" :
                                item.performance === "Très Bien" ? "secondary" :
                                item.performance === "Bien" ? "outline" : "destructive"
                              }
                            >
                              {item.performance}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Analyses géographiques et démographiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Performance par Région
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {region: "Abidjan", boostages: 156, revenue: "1.2M FCFA", growth: "+12.5%"},
                      {region: "Bouaké", boostages: 89, revenue: "680K FCFA", growth: "+8.2%"},
                      {region: "San-Pédro", boostages: 67, revenue: "520K FCFA", growth: "+15.3%"},
                      {region: "Korhogo", boostages: 45, revenue: "380K FCFA", growth: "+6.8%"},
                      {region: "Autres", boostages: 123, revenue: "920K FCFA", growth: "+9.1%"}
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.region}</p>
                          <p className="text-sm text-gray-600">{item.boostages} boostages</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{item.revenue}</p>
                          <p className="text-sm text-green-600">{item.growth}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Analyse Démographique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Répartition par Âge</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">18-25 ans</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{width: '35%'}}></div>
                            </div>
                            <span className="text-sm font-medium">35%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">26-35 ans</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '42%'}}></div>
                            </div>
                            <span className="text-sm font-medium">42%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">36-45 ans</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-orange-500 h-2 rounded-full" style={{width: '18%'}}></div>
                            </div>
                            <span className="text-sm font-medium">18%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">45+ ans</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{width: '5%'}}></div>
                            </div>
                            <span className="text-sm font-medium">5%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export et rapports */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export et Rapports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-nowrap gap-4 overflow-x-auto">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleExportPDF}
                  >
                    <FileText className="h-4 w-4" />
                    Rapport Mensuel (PDF)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleExportCSV}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Données Brutes (CSV)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleExportPNG}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Graphiques (PNG)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={handleSendEmail}
                  >
                    <Mail className="h-4 w-4" />
                    Envoyer par Email
                  </Button>
                </div>
                
                {/* Informations supplémentaires */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informations sur les Rapports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Période sélectionnée:</p>
                      <p>{analyticsPeriod === '1month' ? '1 Mois' : 
                          analyticsPeriod === '3months' ? '3 Mois' :
                          analyticsPeriod === '6months' ? '6 Mois' : '1 An'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Dernière mise à jour:</p>
                      <p>{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="font-medium">Format disponible:</p>
                      <p>PDF, CSV, PNG, Email</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Configuration des Services */}
      <Dialog open={showServiceConfigModal} onOpenChange={setShowServiceConfigModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Configuration du Service : {selectedService?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-6">


              {/* Options avancées */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoReload"
                    checked={serviceConfig.autoReload}
                    onChange={(e) => setServiceConfig(prev => ({ ...prev, autoReload: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="autoReload" className="text-sm">Rechargement automatique</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={serviceConfig.notifications}
                    onChange={(e) => setServiceConfig(prev => ({ ...prev, notifications: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="notifications" className="text-sm">Notifications</Label>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button onClick={handleSaveServiceConfig} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Sauvegarder
            </Button>
            <Button variant="outline" onClick={() => setShowServiceConfigModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Détails des Services */}
      <Dialog open={showServiceDetailsModal} onOpenChange={setShowServiceDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Détails du Service : {selectedService?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            {selectedService && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedService.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informations techniques</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Type:</span>
                      <p className="font-medium capitalize">{selectedService.type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Prix de base:</span>
                      <p className="font-medium text-green-600">{formatPrice(selectedService.basePrice)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Modèle de tarification:</span>
                      <p className="font-medium">
                        {selectedService.pricingModel === 'per_page_day' ? 'Page × Jour' : 
                         selectedService.pricingModel === 'per_message_country' ? 'Message × Pays' : 'Fixe'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Statut:</span>
                      <Badge variant={selectedService.isActive ? "default" : "secondary"}>
                        {selectedService.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Fonctionnalités</h4>
                  <ul className="space-y-2">
                    {selectedService.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Star className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistiques d'utilisation</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {campaigns.filter(c => c.type === selectedService.type).length}
                      </p>
                      <p className="text-sm text-gray-600">Campagnes</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {campaigns.filter(c => c.type === selectedService.type && c.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-600">Actives</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {campaigns.filter(c => c.type === selectedService.type).reduce((sum, c) => sum + c.totalCost, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">FCFA générés</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4 sticky bottom-0">
            <Button onClick={() => setShowServiceDetailsModal(false)} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Statistiques des Services */}
      <Dialog open={showServiceStatsModal} onOpenChange={setShowServiceStatsModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Statistiques du Service : {selectedService?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            {selectedService && (
              <div className="space-y-6">
                {/* KPIs principaux */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {campaigns.filter(c => c.type === selectedService.type).length}
                      </p>
                      <p className="text-sm text-gray-600">Total Campagnes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {campaigns.filter(c => c.type === selectedService.type && c.status === 'active').length}
                      </p>
                      <p className="text-sm text-gray-600">Campagnes Actives</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {campaigns.filter(c => c.type === selectedService.type).reduce((sum, c) => sum + c.totalCost, 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Revenus (FCFA)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {campaigns.filter(c => c.type === selectedService.type && c.performance).reduce((sum, c) => sum + (c.performance?.conversionRate || 0), 0) / 
                         Math.max(campaigns.filter(c => c.type === selectedService.type && c.performance).length, 1)}
                      </p>
                      <p className="text-sm text-gray-600">Taux de Conversion (%)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique d'évolution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des campagnes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end justify-between">
                      {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((month, index) => {
                        const monthCampaigns = campaigns.filter(c => c.type === selectedService.type)
                        const height = monthCampaigns.length > 0 ? Math.min(monthCampaigns.length * 20, 200) : 20
                        return (
                          <div key={month} className="flex flex-col items-center">
                            <div 
                              className="w-8 bg-blue-500 rounded-t" 
                              style={{height: `${height}px`}}
                            ></div>
                            <span className="text-xs text-gray-600 mt-2">{month}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Détails des campagnes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dernières campagnes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {campaigns
                        .filter(c => c.type === selectedService.type)
                        .slice(0, 5)
                        .map((campaign) => (
                          <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{campaign.vendorName}</p>
                              <p className="text-sm text-gray-600">
                                {campaign.start_date} - {campaign.end_date}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant={
                                campaign.status === 'active' ? 'default' :
                                campaign.status === 'pending' ? 'secondary' :
                                campaign.status === 'completed' ? 'outline' : 'destructive'
                              }>
                                {campaign.status === 'active' ? 'Active' :
                                 campaign.status === 'pending' ? 'En attente' :
                                 campaign.status === 'completed' ? 'Terminée' : 'Rejetée'}
                              </Badge>
                              <p className="text-sm font-medium mt-1">{formatPrice(campaign.total_cost)}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4 sticky bottom-0">
            <Button onClick={() => setShowServiceStatsModal(false)} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nouvelle Campagne */}
      <Dialog open={showNewCampaignFormModal} onOpenChange={setShowNewCampaignFormModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Créer une Nouvelle Campagne</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Configurez et lancez une nouvelle campagne de boostage pour un vendeur
            </p>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              {/* Sélection du vendeur et Type de service sur la même ligne */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Vendeur</Label>
                  <Select value={newCampaignData.vendorName} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, vendorName: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un vendeur" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Type de service</Label>
                  <Select value={newCampaignData.serviceType} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, serviceType: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommendation">Recommandation Ciblée</SelectItem>
                      <SelectItem value="banner">Bannière Visuelle</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>



              {/* Options spécifiques au service Recommandation */}
              {newCampaignData.serviceType === 'recommendation' && (
                <>
                  {/* Choix du produit */}
                  <div>
                    <Label className="text-sm font-medium">Produit recommandé</Label>
                    <Select value={newCampaignData.selectedProduct} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, selectedProduct: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors
                          .find(v => v.name === newCampaignData.vendorName)
                          ?.products.map((product) => (
                            <SelectItem key={product.id} value={product.name}>
                              {product.name} - {formatPrice(product.price)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calendrier avec relance IA */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="aiReload"
                        checked={newCampaignData.aiReload}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, aiReload: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="aiReload" className="text-sm font-medium">Calendrier précis avec relance automatique par IA</Label>
                    </div>
                    
                    {newCampaignData.aiReload && (
                      <div>
                        <Label className="text-sm font-medium">Fréquence de relance</Label>
                        <Select value={newCampaignData.aiReloadFrequency} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, aiReloadFrequency: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Quotidienne</SelectItem>
                            <SelectItem value="weekly">Hebdomadaire</SelectItem>
                            <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                            <SelectItem value="monthly">Mensuelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Options spécifiques au service Bannière */}
              {newCampaignData.serviceType === 'banner' && (
                <div className="space-y-4">
                  {/* Upload d'image de bannière */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">Image de Bannière</h4>
                    
                    {!newCampaignData.bannerImage ? (
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          id="bannerImage"
                          accept="image/*"
                          onChange={handleBannerImageUpload}
                          className="hidden"
                        />
                        <label htmlFor="bannerImage" className="cursor-pointer">
                          <div className="flex flex-col items-center space-y-2">
                            <ImageIcon className="h-12 w-12 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">
                                Cliquez pour ajouter une image
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                JPG, PNG, GIF jusqu'à 5MB
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                              src={URL.createObjectURL(newCampaignData.bannerImage)}
                              alt="Aperçu bannière"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {newCampaignData.bannerImage.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(newCampaignData.bannerImage.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveBannerImage}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Titre accrocheur */}
                  <div>
                    <Label className="text-sm font-medium">Titre accrocheur</Label>
                    <Input
                      value={newCampaignData.bannerTitle}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, bannerTitle: e.target.value }))}
                      placeholder="Ex: Offre exceptionnelle -50% !"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Titre court et percutant pour attirer l'attention
                    </p>
                  </div>

                  {/* Description courte */}
                  <div>
                    <Label className="text-sm font-medium">Description courte</Label>
                    <Textarea
                      value={newCampaignData.shortDescription}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      placeholder="Description brève et impactante de l'offre"
                      rows={2}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Description concise qui complète le titre (max 100 caractères)
                    </p>
                  </div>

                  {/* Informations sur la configuration */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2">Configuration Bannière</h5>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Affichage sur les pages sélectionnées</li>
                      <li>• Animations discrètes et optimisées</li>
                      <li>• Optimisation automatique de la conversion</li>
                      <li>• Responsive design pour tous les appareils</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Options spécifiques au service WhatsApp - Modal vendeur */}
              {newCampaignData.serviceType === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Configuration WhatsApp Marketing</h4>
                    <p className="text-sm text-green-700">
                      Configurez votre demande de boostage. Elle sera envoyée en attente d'approbation par l'administrateur.
                    </p>
                  </div>

                  {/* Configuration en 2 colonnes */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nombre de cibles souhaitées</Label>
                      <Input
                        type="number"
                        value={newCampaignData.whatsappTargetCount}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappTargetCount: parseInt(e.target.value) || 100 }))}
                        min="1"
                        max="10000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ciblage pays</Label>
                      <Select value={newCampaignData.whatsappCountryTarget} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, whatsappCountryTarget: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les pays</SelectItem>
                          
                          {/* Afrique */}
                          <SelectItem value="africa" disabled className="font-semibold text-gray-500">🌍 AFRIQUE</SelectItem>
                          <SelectItem value="dz">🇩🇿 Algérie</SelectItem>
                          <SelectItem value="ao">🇦🇴 Angola</SelectItem>
                          <SelectItem value="bj">🇧🇯 Bénin</SelectItem>
                          <SelectItem value="bw">🇧🇼 Botswana</SelectItem>
                          <SelectItem value="bf">🇧🇫 Burkina Faso</SelectItem>
                          <SelectItem value="bi">🇧🇮 Burundi</SelectItem>
                          <SelectItem value="cm">🇨🇲 Cameroun</SelectItem>
                          <SelectItem value="cv">🇨🇻 Cap-Vert</SelectItem>
                          <SelectItem value="cf">🇨🇫 République centrafricaine</SelectItem>
                          <SelectItem value="td">🇹🇩 Tchad</SelectItem>
                          <SelectItem value="km">🇰🇲 Comores</SelectItem>
                          <SelectItem value="cg">🇨🇬 Congo</SelectItem>
                          <SelectItem value="cd">🇨🇩 RD Congo</SelectItem>
                          <SelectItem value="ci">🇨🇮 Côte d'Ivoire</SelectItem>
                          <SelectItem value="dj">🇩🇯 Djibouti</SelectItem>
                          <SelectItem value="eg">🇪🇬 Égypte</SelectItem>
                          <SelectItem value="gq">🇬🇶 Guinée équatoriale</SelectItem>
                          <SelectItem value="er">🇪🇷 Érythrée</SelectItem>
                          <SelectItem value="et">🇪🇹 Éthiopie</SelectItem>
                          <SelectItem value="ga">🇬🇦 Gabon</SelectItem>
                          <SelectItem value="gm">🇬🇲 Gambie</SelectItem>
                          <SelectItem value="gh">🇬🇭 Ghana</SelectItem>
                          <SelectItem value="gn">🇬🇳 Guinée</SelectItem>
                          <SelectItem value="gw">🇬🇼 Guinée-Bissau</SelectItem>
                          <SelectItem value="ke">🇰🇪 Kenya</SelectItem>
                          <SelectItem value="ls">🇱🇸 Lesotho</SelectItem>
                          <SelectItem value="lr">🇱🇷 Liberia</SelectItem>
                          <SelectItem value="ly">🇱🇾 Libye</SelectItem>
                          <SelectItem value="mg">🇲🇬 Madagascar</SelectItem>
                          <SelectItem value="mw">🇲🇼 Malawi</SelectItem>
                          <SelectItem value="ml">🇲🇱 Mali</SelectItem>
                          <SelectItem value="mr">🇲🇷 Mauritanie</SelectItem>
                          <SelectItem value="mu">🇲🇺 Maurice</SelectItem>
                          <SelectItem value="ma">🇲🇦 Maroc</SelectItem>
                          <SelectItem value="mz">🇲🇿 Mozambique</SelectItem>
                          <SelectItem value="na">🇳🇦 Namibie</SelectItem>
                          <SelectItem value="ne">🇳🇪 Niger</SelectItem>
                          <SelectItem value="ng">🇳🇬 Nigeria</SelectItem>
                          <SelectItem value="rw">🇷🇼 Rwanda</SelectItem>
                          <SelectItem value="st">🇸🇹 Sao Tomé-et-Principe</SelectItem>
                          <SelectItem value="sn">🇸🇳 Sénégal</SelectItem>
                          <SelectItem value="sc">🇸🇨 Seychelles</SelectItem>
                          <SelectItem value="sl">🇸🇱 Sierra Leone</SelectItem>
                          <SelectItem value="so">🇸🇴 Somalie</SelectItem>
                          <SelectItem value="za">🇿🇦 Afrique du Sud</SelectItem>
                          <SelectItem value="ss">🇸🇸 Soudan du Sud</SelectItem>
                          <SelectItem value="sd">🇸🇩 Soudan</SelectItem>
                          <SelectItem value="sz">🇸🇿 Eswatini</SelectItem>
                          <SelectItem value="tz">🇹🇿 Tanzanie</SelectItem>
                          <SelectItem value="tg">🇹🇬 Togo</SelectItem>
                          <SelectItem value="tn">🇹🇳 Tunisie</SelectItem>
                          <SelectItem value="ug">🇺🇬 Ouganda</SelectItem>
                          <SelectItem value="zm">🇿🇲 Zambie</SelectItem>
                          <SelectItem value="zw">🇿🇼 Zimbabwe</SelectItem>
                          
                          {/* Amérique */}
                          <SelectItem value="america" disabled className="font-semibold text-gray-500">🌎 AMÉRIQUE</SelectItem>
                          <SelectItem value="ar">🇦🇷 Argentine</SelectItem>
                          <SelectItem value="bo">🇧🇴 Bolivie</SelectItem>
                          <SelectItem value="br">🇧🇷 Brésil</SelectItem>
                          <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                          <SelectItem value="cl">🇨🇱 Chili</SelectItem>
                          <SelectItem value="co">🇨🇴 Colombie</SelectItem>
                          <SelectItem value="cr">🇨🇷 Costa Rica</SelectItem>
                          <SelectItem value="cu">🇨🇺 Cuba</SelectItem>
                          <SelectItem value="do">🇩🇴 République dominicaine</SelectItem>
                          <SelectItem value="ec">🇪🇨 Équateur</SelectItem>
                          <SelectItem value="sv">🇸🇻 El Salvador</SelectItem>
                          <SelectItem value="gt">🇬🇹 Guatemala</SelectItem>
                          <SelectItem value="gy">🇬🇾 Guyana</SelectItem>
                          <SelectItem value="ht">🇭🇹 Haïti</SelectItem>
                          <SelectItem value="hn">🇭🇳 Honduras</SelectItem>
                          <SelectItem value="jm">🇯🇲 Jamaïque</SelectItem>
                          <SelectItem value="mx">🇲🇽 Mexique</SelectItem>
                          <SelectItem value="ni">🇳🇮 Nicaragua</SelectItem>
                          <SelectItem value="pa">🇵🇦 Panama</SelectItem>
                          <SelectItem value="py">🇵🇾 Paraguay</SelectItem>
                          <SelectItem value="pe">🇵🇪 Pérou</SelectItem>
                          <SelectItem value="sr">🇸🇷 Suriname</SelectItem>
                          <SelectItem value="uy">🇺🇾 Uruguay</SelectItem>
                          <SelectItem value="us">🇺🇸 États-Unis</SelectItem>
                          <SelectItem value="ve">🇻🇪 Venezuela</SelectItem>
                          
                          {/* Asie */}
                          <SelectItem value="asia" disabled className="font-semibold text-gray-500">🌏 ASIE</SelectItem>
                          <SelectItem value="af">🇦🇫 Afghanistan</SelectItem>
                          <SelectItem value="am">🇦🇲 Arménie</SelectItem>
                          <SelectItem value="az">🇦🇿 Azerbaïdjan</SelectItem>
                          <SelectItem value="bh">🇧🇭 Bahreïn</SelectItem>
                          <SelectItem value="bd">🇧🇩 Bangladesh</SelectItem>
                          <SelectItem value="bt">🇧🇹 Bhoutan</SelectItem>
                          <SelectItem value="bn">🇧🇳 Brunei</SelectItem>
                          <SelectItem value="kh">🇰🇭 Cambodge</SelectItem>
                          <SelectItem value="cn">🇨🇳 Chine</SelectItem>
                          <SelectItem value="cy">🇨🇾 Chypre</SelectItem>
                          <SelectItem value="ge">🇬🇪 Géorgie</SelectItem>
                          <SelectItem value="in">🇮🇳 Inde</SelectItem>
                          <SelectItem value="id">🇮🇩 Indonésie</SelectItem>
                          <SelectItem value="ir">🇮🇷 Iran</SelectItem>
                          <SelectItem value="iq">🇮🇶 Irak</SelectItem>
                          <SelectItem value="il">🇮🇱 Israël</SelectItem>
                          <SelectItem value="jp">🇯🇵 Japon</SelectItem>
                          <SelectItem value="jo">🇯🇴 Jordanie</SelectItem>
                          <SelectItem value="kz">🇰🇿 Kazakhstan</SelectItem>
                          <SelectItem value="kw">🇰🇼 Koweït</SelectItem>
                          <SelectItem value="kg">🇰🇬 Kirghizistan</SelectItem>
                          <SelectItem value="la">🇱🇦 Laos</SelectItem>
                          <SelectItem value="lb">🇱🇧 Liban</SelectItem>
                          <SelectItem value="my">🇲🇾 Malaisie</SelectItem>
                          <SelectItem value="mv">🇲🇻 Maldives</SelectItem>
                          <SelectItem value="mn">🇲🇳 Mongolie</SelectItem>
                          <SelectItem value="mm">🇲🇲 Myanmar</SelectItem>
                          <SelectItem value="np">🇳🇵 Népal</SelectItem>
                          <SelectItem value="om">🇴🇲 Oman</SelectItem>
                          <SelectItem value="pk">🇵🇰 Pakistan</SelectItem>
                          <SelectItem value="ph">🇵🇭 Philippines</SelectItem>
                          <SelectItem value="qa">🇶🇦 Qatar</SelectItem>
                          <SelectItem value="sa">🇸🇦 Arabie saoudite</SelectItem>
                          <SelectItem value="sg">🇸🇬 Singapour</SelectItem>
                          <SelectItem value="lk">🇱🇰 Sri Lanka</SelectItem>
                          <SelectItem value="sy">🇸🇾 Syrie</SelectItem>
                          <SelectItem value="tw">🇹🇼 Taïwan</SelectItem>
                          <SelectItem value="tj">🇹🇯 Tadjikistan</SelectItem>
                          <SelectItem value="th">🇹🇭 Thaïlande</SelectItem>
                          <SelectItem value="tr">🇹🇷 Turquie</SelectItem>
                          <SelectItem value="tm">🇹🇲 Turkménistan</SelectItem>
                          <SelectItem value="ae">🇦🇪 Émirats arabes unis</SelectItem>
                          <SelectItem value="uz">🇺🇿 Ouzbékistan</SelectItem>
                          <SelectItem value="vn">🇻🇳 Vietnam</SelectItem>
                          <SelectItem value="ye">🇾🇪 Yémen</SelectItem>
                          
                          {/* Europe */}
                          <SelectItem value="europe" disabled className="font-semibold text-gray-500">🇪🇺 EUROPE</SelectItem>
                          <SelectItem value="al">🇦🇱 Albanie</SelectItem>
                          <SelectItem value="ad">🇦🇩 Andorre</SelectItem>
                          <SelectItem value="at">🇦🇹 Autriche</SelectItem>
                          <SelectItem value="be">🇧🇪 Belgique</SelectItem>
                          <SelectItem value="ba">🇧🇦 Bosnie-Herzégovine</SelectItem>
                          <SelectItem value="bg">🇧🇬 Bulgarie</SelectItem>
                          <SelectItem value="hr">🇭🇷 Croatie</SelectItem>
                          <SelectItem value="cz">🇨🇿 République tchèque</SelectItem>
                          <SelectItem value="dk">🇩🇰 Danemark</SelectItem>
                          <SelectItem value="ee">🇪🇪 Estonie</SelectItem>
                          <SelectItem value="fi">🇫🇮 Finlande</SelectItem>
                          <SelectItem value="fr">🇫🇷 France</SelectItem>
                          <SelectItem value="de">🇩🇪 Allemagne</SelectItem>
                          <SelectItem value="gr">🇬🇷 Grèce</SelectItem>
                          <SelectItem value="hu">🇭🇺 Hongrie</SelectItem>
                          <SelectItem value="is">🇮🇸 Islande</SelectItem>
                          <SelectItem value="ie">🇮🇪 Irlande</SelectItem>
                          <SelectItem value="it">🇮🇹 Italie</SelectItem>
                          <SelectItem value="lv">🇱🇻 Lettonie</SelectItem>
                          <SelectItem value="li">🇱🇮 Liechtenstein</SelectItem>
                          <SelectItem value="lt">🇱🇹 Lituanie</SelectItem>
                          <SelectItem value="lu">🇱🇺 Luxembourg</SelectItem>
                          <SelectItem value="mt">🇲🇹 Malte</SelectItem>
                          <SelectItem value="md">🇲🇩 Moldavie</SelectItem>
                          <SelectItem value="mc">🇲🇨 Monaco</SelectItem>
                          <SelectItem value="me">🇲🇪 Monténégro</SelectItem>
                          <SelectItem value="nl">🇳🇱 Pays-Bas</SelectItem>
                          <SelectItem value="mk">🇲🇰 Macédoine du Nord</SelectItem>
                          <SelectItem value="no">🇳🇴 Norvège</SelectItem>
                          <SelectItem value="pl">🇵🇱 Pologne</SelectItem>
                          <SelectItem value="pt">🇵🇹 Portugal</SelectItem>
                          <SelectItem value="ro">🇷🇴 Roumanie</SelectItem>
                          <SelectItem value="ru">🇷🇺 Russie</SelectItem>
                          <SelectItem value="sm">🇸🇲 Saint-Marin</SelectItem>
                          <SelectItem value="rs">🇷🇸 Serbie</SelectItem>
                          <SelectItem value="sk">🇸🇰 Slovaquie</SelectItem>
                          <SelectItem value="si">🇸🇮 Slovénie</SelectItem>
                          <SelectItem value="es">🇪🇸 Espagne</SelectItem>
                          <SelectItem value="se">🇸🇪 Suède</SelectItem>
                          <SelectItem value="ch">🇨🇭 Suisse</SelectItem>
                          <SelectItem value="ua">🇺🇦 Ukraine</SelectItem>
                          <SelectItem value="gb">🇬🇧 Royaume-Uni</SelectItem>
                          <SelectItem value="va">🇻🇦 Vatican</SelectItem>
                          
                          {/* Océanie */}
                          <SelectItem value="oceania" disabled className="font-semibold text-gray-500">🌊 OCÉANIE</SelectItem>
                          <SelectItem value="au">🇦🇺 Australie</SelectItem>
                          <SelectItem value="fj">🇫🇯 Fidji</SelectItem>
                          <SelectItem value="ki">🇰🇮 Kiribati</SelectItem>
                          <SelectItem value="mh">🇲🇭 Îles Marshall</SelectItem>
                          <SelectItem value="fm">🇫🇲 Micronésie</SelectItem>
                          <SelectItem value="nr">🇳🇷 Nauru</SelectItem>
                          <SelectItem value="nz">🇳🇿 Nouvelle-Zélande</SelectItem>
                          <SelectItem value="pw">🇵🇼 Palaos</SelectItem>
                          <SelectItem value="pg">🇵🇬 Papouasie-Nouvelle-Guinée</SelectItem>
                          <SelectItem value="ws">🇼🇸 Samoa</SelectItem>
                          <SelectItem value="sb">🇸🇧 Îles Salomon</SelectItem>
                          <SelectItem value="to">🇹🇴 Tonga</SelectItem>
                          <SelectItem value="tv">🇹🇻 Tuvalu</SelectItem>
                          <SelectItem value="vu">🇻🇺 Vanuatu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Ciblage âge</Label>
                      <Select value={newCampaignData.whatsappAgeTarget} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, whatsappAgeTarget: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous âges</SelectItem>
                          <SelectItem value="18-25">18-25 ans</SelectItem>
                          <SelectItem value="26-35">26-35 ans</SelectItem>
                          <SelectItem value="36-45">36-45 ans</SelectItem>
                          <SelectItem value="46-55">46-55 ans</SelectItem>
                          <SelectItem value="55+">55+ ans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ciblage profession</Label>
                      <Select value={newCampaignData.whatsappProfessionTarget} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, whatsappProfessionTarget: value }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes professions</SelectItem>
                          <SelectItem value="etudiant">Étudiant</SelectItem>
                          <SelectItem value="salarie">Salarié</SelectItem>
                          <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                          <SelectItem value="retraite">Retraité</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                          <SelectItem value="custom">Profession personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Champ pour la profession personnalisée */}
                      {newCampaignData.whatsappProfessionTarget === 'custom' && (
                        <div className="mt-2">
                          <Input
                            placeholder="Entrez votre profession"
                            value={newCampaignData.whatsappCustomProfession}
                            onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappCustomProfession: e.target.value }))}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Ex: Médecin, Avocat, Architecte, etc.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nouvelle option : Ciblé clients de Probooster */}
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="target-probooster-clients-admin"
                        checked={newCampaignData.targetProboosterClients || false}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, targetProboosterClients: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="target-probooster-clients-admin" className="text-sm font-medium">Ciblé clients de Probooster</Label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Permet de cibler spécifiquement les utilisateurs actifs de la plateforme Probooster
                    </p>
                  </div>

                  {/* Image du produit */}
                  <div>
                    <Label className="text-sm font-medium">Image du produit</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="whatsappProductImage"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setNewCampaignData(prev => ({ ...prev, whatsappProductImage: file }))
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="whatsappProductImage" className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                          <div className="flex items-center justify-center space-x-2">
                            <ImageIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Choisir un fichier</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {newCampaignData.whatsappProductImage ? newCampaignData.whatsappProductImage.name : 'Aucun fichier choisi'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Titre du message */}
                  <div>
                    <Label className="text-sm font-medium">Titre du message*</Label>
                    <Input
                      value={newCampaignData.whatsappMessageTitle}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappMessageTitle: e.target.value }))}
                      placeholder="Ex: Découvrez notre nouveau produit !"
                      className="mt-1"
                    />
                  </div>

                  {/* Description du produit */}
                  <div>
                    <Label className="text-sm font-medium">Description du produit</Label>
                    <Input
                      value={newCampaignData.whatsappProductDescription}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappProductDescription: e.target.value }))}
                      placeholder="Ex: Produit de qualité exceptionnelle à prix réduit"
                      className="mt-1"
                    />
                  </div>

                  {/* Lien direct vers le produit et Numéro WhatsApp expéditeur sur la même ligne */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Lien direct vers le produit</Label>
                      <Input
                        value={newCampaignData.whatsappProductLink}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappProductLink: e.target.value }))}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Numéro WhatsApp expéditeur *</Label>
                      <Input
                        value={newCampaignData.whatsappSenderNumber}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, whatsappSenderNumber: e.target.value }))}
                        placeholder="+225 01234567"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Numéro de téléphone avec code pays (ex: +225 pour la Côte d'Ivoire)
                      </p>
                    </div>
                  </div>

                  {/* Section Coût estimé WhatsApp */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-medium text-purple-900 mb-3">Coût estimé WhatsApp</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Nombre de cibles:</span>
                        <span className="text-sm font-medium">{newCampaignData.whatsappTargetCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Coût par cible:</span>
                        <span className="text-sm font-medium">0.5 FCFA</span>
                      </div>
                      {newCampaignData.targetProboosterClients && (
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700">Bonus ciblage Probooster:</span>
                          <span className="text-sm font-medium text-green-600">+0.1 FCFA</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-purple-200 pt-2">
                        <span className="text-sm font-bold text-purple-900">Total:</span>
                        <span className="text-sm font-bold text-purple-900">
                          {newCampaignData.targetProboosterClients 
                            ? ((newCampaignData.whatsappTargetCount * 0.6).toFixed(0))
                            : (newCampaignData.whatsappTargetCount * 0.5).toFixed(0)
                          } FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration générale - masquée pour WhatsApp */}
              {newCampaignData.serviceType !== 'whatsapp' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Budget (FCFA)</Label>
                      <Input
                        type="number"
                        value={newCampaignData.budget}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                        placeholder="5000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Budget minimum. Le vendeur pourra l'augmenter dans son tableau de bord.
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de début</Label>
                      <Input
                        type="date"
                        value={newCampaignData.startDate}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de fin</Label>
                      <Input
                        type="date"
                        value={newCampaignData.endDate}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, endDate: e.target.value }))}
                        min={newCampaignData.startDate}
                      />
                    </div>
                  </div>

                  {/* Description - remplacée par Description courte pour les bannières */}
                  {newCampaignData.serviceType !== 'banner' && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <Textarea
                        value={newCampaignData.description}
                        onChange={(e) => setNewCampaignData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Description de la campagne"
                        rows={3}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Options de paiement */}
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-900 mb-3">Options de Paiement</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requirePayment"
                      checked={newCampaignData.requirePayment}
                      onChange={(e) => setNewCampaignData(prev => ({ ...prev, requirePayment: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="requirePayment" className="text-sm font-medium">Appliquer le paiement si le vendeur n'a pas encore réglé</Label>
                  </div>
                  
                  {newCampaignData.requirePayment && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Méthode de paiement</Label>
                        <Select value={newCampaignData.paymentMethod} onValueChange={(value) => setNewCampaignData(prev => ({ ...prev, paymentMethod: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="feexpay">FeexPay (Mobile Money + Carte Bancaire)</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money uniquement</SelectItem>
                            <SelectItem value="card">Carte Bancaire uniquement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <p className="text-sm text-gray-700">
                          <strong>FeexPay</strong> : Agrégateur de paiement acceptant Mobile Money (Moov, MTN, Orange) 
                          et cartes bancaires (Visa, Mastercard) pour un règlement sécurisé.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!newCampaignData.requirePayment && (
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm text-green-700">
                        <strong>Campagne gratuite</strong> : La campagne démarrera automatiquement 
                        sans paiement requis. Aucune approbation supplémentaire nécessaire.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section de calcul automatique des coûts */}
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-3">Calculateur de Coûts Estimés</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nombre de jours</Label>
                    <Input 
                      type="number" 
                      value={costCalculation.days || 7}
                      onChange={(e) => setCostCalculation(prev => ({
                        ...prev,
                        days: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Nombre de pages (Recommandation)</Label>
                    <Input 
                      type="number" 
                      value={costCalculation.pages || 3}
                      onChange={(e) => setCostCalculation(prev => ({
                        ...prev,
                        pages: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      max="5"
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label>Nombre de cibles WhatsApp</Label>
                    <Input 
                      type="number" 
                      value={costCalculation.whatsappTargets || 100}
                      onChange={(e) => setCostCalculation(prev => ({
                        ...prev,
                        whatsappTargets: parseInt(e.target.value) || 0
                      }))}
                      min="1"
                      className="mt-1" 
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded border">
                  <h5 className="font-medium mb-2">Coûts estimés :</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Recommandation ({costCalculation.pages} pages, {costCalculation.days} jours):</span>
                      <span className="font-medium">
                        {calculateRecommendationCost()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bannière (avec multiplicateur):</span>
                      <span className="font-medium">
                        {calculateBannerCost()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>WhatsApp ({costCalculation.whatsappTargets} cibles):</span>
                      <span className="font-medium">
                        {calculateWhatsAppCost()} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-bold">Total estimé:</span>
                      <span className="font-bold text-blue-600">
                        {calculateTotalCost()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button 
                  variant="outline"
                  onClick={handleResetToDefaults}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réinitialiser aux valeurs par défaut
                </Button>
                <Button 
                  onClick={handleSaveServiceConfig}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Sauvegarder la Configuration
                </Button>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action - Corrigés pour être bien visibles */}
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4 sticky bottom-0">
            <Button onClick={handleCreateCampaignFromForm} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Créer la Campagne
            </Button>
            <Button variant="outline" onClick={() => setShowNewCampaignFormModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'Export */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Exporter les Données Marketing</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Format d'export</Label>
                <Select value={exportData.format} onValueChange={(value) => setExportData(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Période</Label>
                <Select value={exportData.period} onValueChange={(value) => setExportData(prev => ({ ...prev, period: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 Mois</SelectItem>
                    <SelectItem value="3months">3 Mois</SelectItem>
                    <SelectItem value="6months">6 Mois</SelectItem>
                    <SelectItem value="1year">1 An</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeCharts"
                    checked={exportData.includeCharts}
                    onChange={(e) => setExportData(prev => ({ ...prev, includeCharts: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeCharts" className="text-sm">Inclure les graphiques</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeDetails"
                    checked={exportData.includeDetails}
                    onChange={(e) => setExportData(prev => ({ ...prev, includeDetails: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="includeDetails" className="text-sm">Inclure les détails complets</Label>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Résumé de l'export</h4>
                <div className="text-sm text-blue-800">
                  <p>• Format: {exportData.format.toUpperCase()}</p>
                  <p>• Période: {exportData.period === '1month' ? '1 Mois' : 
                                   exportData.period === '3months' ? '3 Mois' : 
                                   exportData.period === '6months' ? '6 Mois' : '1 An'}</p>
                  <p>• Graphiques: {exportData.includeCharts ? 'Inclus' : 'Non inclus'}</p>
                  <p>• Détails: {exportData.includeDetails ? 'Complets' : 'Résumés'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button onClick={handlePerformExport} className="flex-1 bg-[#ff6600] hover:bg-[#ff6600]/90">
              Exporter
            </Button>
            <Button variant="outline" onClick={() => setShowExportModal(false)} className="flex-1">
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nouvelle Promotion */}
      <Dialog open={showNewPromotionModal} onOpenChange={setShowNewPromotionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle promotion</DialogTitle>
            <DialogDescription>
              Configurez votre promotion avec tous les paramètres nécessaires
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="promo-name">Nom de la promotion *</Label>
                <Input
                  id="promo-name"
                  value={promotionForm.name}
                  onChange={(e) => setPromotionForm({...promotionForm, name: e.target.value})}
                  placeholder="Ex: ÉTÉ2024"
                />
              </div>
              <div>
                <Label htmlFor="promo-type">Type de promotion</Label>
                <Select 
                  value={promotionForm.type} 
                  onValueChange={(value) => setPromotionForm({...promotionForm, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Code promo</SelectItem>
                    <SelectItem value="reduction">Réduction</SelectItem>
                    <SelectItem value="flash">Flash sale</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount-type">Type de réduction</Label>
                <Select 
                  value={promotionForm.discountType} 
                  onValueChange={(value) => setPromotionForm({...promotionForm, discountType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount-value">Valeur de la réduction *</Label>
                <Input
                  id="discount-value"
                  type="number"
                  value={promotionForm.discountValue}
                  onChange={(e) => setPromotionForm({...promotionForm, discountValue: Number(e.target.value)})}
                  placeholder="20 ou 5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Date de début *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Date de fin *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-amount">Montant minimum (FCFA)</Label>
                <Input
                  id="min-amount"
                  type="number"
                  value={promotionForm.minAmount}
                  onChange={(e) => setPromotionForm({...promotionForm, minAmount: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="usage-limit">Limite d'utilisation</Label>
                <Input
                  id="usage-limit"
                  type="number"
                  value={promotionForm.usageLimit}
                  onChange={(e) => setPromotionForm({...promotionForm, usageLimit: Number(e.target.value)})}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="conditions">Conditions spéciales</Label>
              <Textarea
                id="conditions"
                value={promotionForm.conditions}
                onChange={(e) => setPromotionForm({...promotionForm, conditions: e.target.value})}
                placeholder="Ex: Minimum 5000 FCFA d'achat, valable sur tous les produits"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowNewPromotionModal(false)
                resetPromotionForm()
              }}>
                Annuler
              </Button>
              <Button onClick={handleCreatePromotion} className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                Créer la promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Détails de Campagne */}
      <Dialog open={showCampaignDetailsModal} onOpenChange={setShowCampaignDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Détails de la Campagne</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {selectedCampaign && (
              <div className="space-y-6">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <span>{selectedCampaign.vendorName}</span>
                      {getStatusBadge(selectedCampaign.status)}
                      <Badge variant="outline" className="capitalize">
                        {selectedCampaign.type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date de début</Label>
                        <p className="font-medium">{selectedCampaign.startDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date de fin</Label>
                        <p className="font-medium">{selectedCampaign.endDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Durée</Label>
                        <p className="font-medium">{selectedCampaign.duration} jours</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Coût total</Label>
                        <p className="font-medium text-green-600">{formatPrice(selectedCampaign.totalCost)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pages cibles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pages Cibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedCampaign.targetPages.map((page, index) => (
                        <Badge key={index} variant="secondary">
                          {page === 'home' ? 'Accueil' : 
                           page === 'product' ? 'Produit' : 
                           page === 'best_sellers' ? 'Meilleures Ventes' : 
                           page === 'new_arrivals' ? 'Nouvelles Arrivées' : 
                           page === 'vendeur' ? 'Vendeur' : page}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance (si disponible) */}
                {selectedCampaign.performance && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance de la Campagne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedCampaign.performance.impressions.toLocaleString()}
                          </p>
                          <p className="text-sm text-blue-800">Impressions</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {selectedCampaign.performance.clicks.toLocaleString()}
                          </p>
                          <p className="text-sm text-green-800">Clics</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {selectedCampaign.performance.ctr}%
                          </p>
                          <p className="text-sm text-purple-800">CTR</p>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600">
                            {selectedCampaign.performance.conversions}
                          </p>
                          <p className="text-sm text-orange-800">Conversions</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Métriques détaillées</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Taux de conversion:</span>
                            <p className="font-medium">{selectedCampaign.performance.conversionRate}%</p>
                          </div>
                          <div>
                            <span className="text-gray-600">ROAS estimé:</span>
                            <p className="font-medium">
                              {selectedCampaign.performance.conversions > 0 
                                ? ((selectedCampaign.performance.conversions * 75000) / selectedCampaign.totalCost).toFixed(2)
                                : '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Informations de paiement */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de Paiement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={selectedCampaign.paymentStatus === 'paid' ? 'default' : 
                                selectedCampaign.paymentStatus === 'pending' ? 'secondary' : 'destructive'}
                      >
                        {selectedCampaign.paymentStatus === 'paid' ? 'Payé' : 
                         selectedCampaign.paymentStatus === 'pending' ? 'En attente' : 'Échoué'}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Créé le {selectedCampaign.createdAt}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4 pb-2 flex-shrink-0 bg-white border-t border-gray-100 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCampaignDetailsModal(false)}
              className="flex-1"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Nouvelle Promotion */}
      <Dialog open={showNewPromotionModal} onOpenChange={setShowNewPromotionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle promotion</DialogTitle>
            <DialogDescription>
              Configurez votre promotion avec tous les paramètres nécessaires
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="promo-name">Nom de la promotion *</Label>
                <Input
                  id="promo-name"
                  value={promotionForm.name}
                  onChange={(e) => setPromotionForm({...promotionForm, name: e.target.value})}
                  placeholder="Ex: ÉTÉ2024"
                />
              </div>
              <div>
                <Label htmlFor="promo-type">Type de promotion</Label>
                <Select 
                  value={promotionForm.type} 
                  onValueChange={(value) => setPromotionForm({...promotionForm, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Code promo</SelectItem>
                    <SelectItem value="reduction">Réduction</SelectItem>
                    <SelectItem value="flash">Flash sale</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount-type">Type de réduction</Label>
                <Select 
                  value={promotionForm.discountType} 
                  onValueChange={(value) => setPromotionForm({...promotionForm, discountType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount-value">Valeur de la réduction *</Label>
                <Input
                  id="discount-value"
                  type="number"
                  value={promotionForm.discountValue}
                  onChange={(e) => setPromotionForm({...promotionForm, discountValue: Number(e.target.value)})}
                  placeholder="20 ou 5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Date de début *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Date de fin *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-amount">Montant minimum (FCFA)</Label>
                <Input
                  id="min-amount"
                  type="number"
                  value={promotionForm.minAmount}
                  onChange={(e) => setPromotionForm({...promotionForm, minAmount: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="usage-limit">Limite d'utilisation</Label>
                <Input
                  id="usage-limit"
                  type="number"
                  value={promotionForm.usageLimit}
                  onChange={(e) => setPromotionForm({...promotionForm, usageLimit: Number(e.target.value)})}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="conditions">Conditions spéciales</Label>
              <Textarea
                id="conditions"
                value={promotionForm.conditions}
                onChange={(e) => setPromotionForm({...promotionForm, conditions: e.target.value})}
                placeholder="Ex: Minimum 5000 FCFA d'achat, valable sur tous les produits"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowNewPromotionModal(false)
                resetPromotionForm()
              }}>
                Annuler
              </Button>
              <Button onClick={handleCreatePromotion} className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                Créer la promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition de Promotion */}
      <Dialog open={showEditPromotionModal} onOpenChange={setShowEditPromotionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la promotion</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de la promotion
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-promo-name">Nom de la promotion *</Label>
                <Input
                  id="edit-promo-name"
                  value={promotionForm.name}
                  onChange={(e) => setPromotionForm({...promotionForm, name: e.target.value})}
                  placeholder="Ex: ÉTÉ2024"
                />
              </div>
              <div>
                <Label htmlFor="edit-promo-type">Type de promotion</Label>
                <Select 
                  value={promotionForm.type} 
                  onValueChange={(value) => setPromotionForm({...promotionForm, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="code">Code promo</SelectItem>
                    <SelectItem value="reduction">Réduction</SelectItem>
                    <SelectItem value="flash">Flash sale</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-discount-type">Type de réduction</Label>
                <Select 
                  value={promotionForm.discountType} 
                  onValueChange={(value) => setPromotionForm({...promotionForm, discountType: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed">Montant fixe</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-discount-value">Valeur de la réduction *</Label>
                <Input
                  id="edit-discount-value"
                  type="number"
                  value={promotionForm.discountValue}
                  onChange={(e) => setPromotionForm({...promotionForm, discountValue: Number(e.target.value)})}
                  placeholder="20 ou 5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-start-date">Date de début *</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm({...promotionForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">Date de fin *</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm({...promotionForm, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-min-amount">Montant minimum (FCFA)</Label>
                <Input
                  id="edit-min-amount"
                  type="number"
                  value={promotionForm.minAmount}
                  onChange={(e) => setPromotionForm({...promotionForm, minAmount: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-usage-limit">Limite d'utilisation</Label>
                <Input
                  id="edit-usage-limit"
                  type="number"
                  value={promotionForm.usageLimit}
                  onChange={(e) => setPromotionForm({...promotionForm, usageLimit: Number(e.target.value)})}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-conditions">Conditions spéciales</Label>
              <Textarea
                id="edit-conditions"
                value={promotionForm.conditions}
                onChange={(e) => setPromotionForm({...promotionForm, conditions: e.target.value})}
                placeholder="Ex: Minimum 5000 FCFA d'achat, valable sur tous les produits"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowEditPromotionModal(false)
                setSelectedPromotion(null)
                resetPromotionForm()
              }}>
                Annuler
              </Button>
              <Button onClick={handleUpdatePromotion} className="bg-[#ff6600] hover:bg-[#ff6600]/90">
                Mettre à jour
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualisation de Promotion */}
      <Dialog open={showViewPromotionModal} onOpenChange={setShowViewPromotionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la promotion</DialogTitle>
            <DialogDescription>
              Informations complètes sur la promotion
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromotion && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span>{selectedPromotion.name}</span>
                    <Badge variant={selectedPromotion.status === 'active' ? 'default' : 'secondary'}>
                      {selectedPromotion.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Type de promotion</Label>
                        <p className="font-medium capitalize">{selectedPromotion.type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Type de réduction</Label>
                        <p className="font-medium capitalize">{selectedPromotion.discountType}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Valeur de la réduction</Label>
                        <p className="font-medium text-green-600">
                          {selectedPromotion.discountType === 'percentage' 
                            ? `${selectedPromotion.discountValue}%` 
                            : `${formatPrice(selectedPromotion.discountValue)}`}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Statut</Label>
                        <p className="font-medium capitalize">{selectedPromotion.status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date de début</Label>
                        <p className="font-medium">{selectedPromotion.startDate}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date de fin</Label>
                        <p className="font-medium">{selectedPromotion.endDate}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Utilisation</Label>
                        <p className="font-medium">{selectedPromotion.usedCount} / {selectedPromotion.usageLimit}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Commande minimum</Label>
                        <p className="font-medium">
                          {selectedPromotion.minOrderAmount ? formatPrice(selectedPromotion.minOrderAmount) : 'Aucune'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-600">Créée le</Label>
                      <p className="font-medium">{selectedPromotion.createdAt}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => {
              setShowViewPromotionModal(false)
              setSelectedPromotion(null)
            }}>
              Fermer
            </Button>
            {selectedPromotion && (
              <Button 
                onClick={() => handleEditPromotion(selectedPromotion)}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
