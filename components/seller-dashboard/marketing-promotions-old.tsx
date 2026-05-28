"use client"

import { useState, useEffect } from 'react'
import {
  Megaphone, Target, TrendingUp, Calendar, DollarSign,
  Users, BarChart3, Settings, Play, Pause, StopCircle,
  Edit, Trash2, Eye, Download, RefreshCw, Star,
  MessageCircle, Image, Zap, Globe, Smartphone, Plus,
  CheckCircle, XCircle, Clock, Gift, Tag, Percent,
  CreditCard, ShoppingCart, UserCheck, MapPin, Crown,
  MousePointer, PieChart, Activity, Users2
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNotifications } from '@/components/ui/modern-notification'
import { useAuth } from '@/contexts/AuthContext'

// Import des services Supabase
import {
  BoostingServiceManager,
  BoostingCampaignManager,
  BoostingPerformanceManager,
  PromotionManager,
  type BoostingService as BoostingServiceType,
  type BoostingCampaign as BoostingCampaignType,
  type BoostingPerformance as BoostingPerformanceType,
  type Promotion as PromotionType
} from '@/lib/services/marketing-service'

// Utilisation des types Supabase uniquement
// Les interfaces locales ont été supprimées pour éviter les conflits de types

export default function MarketingPromotions() {
  // Hooks
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  
  // États principaux
  const [activeTab, setActiveTab] = useState('overview')
  const [activeSubTab, setActiveSubTab] = useState('campaigns')
  const [campaigns, setCampaigns] = useState<BoostingCampaignType[]>([])
  const [services, setServices] = useState<BoostingServiceType[]>([])
  const [promotions, setPromotions] = useState<PromotionType[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<BoostingCampaignType | null>(null)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // États pour l'analyse
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('campaigns')
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30days')
  const [analyticsData, setAnalyticsData] = useState({
    campaigns: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversionRate: 0,
      roas: 0,
      spend: 0,
      revenue: 0,
      averageOrderValue: 0,
      customerLifetimeValue: 0
    },
    promotions: {
      usage: 0,
      revenue: 0,
      averageOrderValue: 0,
      customerAcquisition: 0,
      retention: 0,
      repeatPurchaseRate: 0,
      discountEfficiency: 0
    }
  })

  // Chargement des données au montage
  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  // Charger les données depuis Supabase
  const loadData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Charger les services disponibles
      const servicesData = await BoostingServiceManager.getActiveServices()
      setServices(servicesData)

      // Charger les campagnes du vendeur
      const campaignsData = await BoostingCampaignManager.getVendorCampaigns(user.id)
      setCampaigns(campaignsData)

      // Charger les performances pour chaque campagne
      for (const campaign of campaignsData) {
        const performances = await BoostingPerformanceManager.getCampaignPerformance(campaign.id)
        // Calculer les totaux
        if (performances.length > 0) {
          const totals = performances.reduce((acc, perf) => ({
            impressions: acc.impressions + perf.impressions,
            clicks: acc.clicks + perf.clicks,
            conversions: acc.conversions + perf.conversions,
            revenue: acc.revenue + perf.revenue
          }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0 })
          
          // Mettre à jour la campagne avec les performances
          setCampaigns(prev => prev.map(c => 
            c.id === campaign.id 
              ? { 
                  ...c, 
                  performance: {
                    impressions: totals.impressions,
                    clicks: totals.clicks,
                    conversions: totals.conversions,
                    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
                    conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
                  }
                }
              : c
          ))
        }
      }

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

  // Recalculer l'analyse quand les données changent
  useEffect(() => {
    if (campaigns.length > 0 || promotions.length > 0) {
      calculateAnalytics()
    }
  }, [campaigns, promotions])

  // Fonction pour calculer les données d'analyse
  const calculateAnalytics = () => {
    console.log('Calcul des données d\'analyse...')
    console.log('Campagnes:', campaigns)
    console.log('Promotions:', promotions)
    
    // Calcul des données des campagnes
    const activeCampaigns = campaigns.filter(c => c.status === 'active')
    const totalImpressions = activeCampaigns.reduce((sum, c) => sum + (c.performance?.impressions || 0), 0)
    const totalClicks = activeCampaigns.reduce((sum, c) => sum + (c.performance?.clicks || 0), 0)
    const totalConversions = activeCampaigns.reduce((sum, c) => sum + (c.performance?.conversions || 0), 0)
    const totalSpend = activeCampaigns.reduce((sum, c) => sum + c.total_cost, 0)
    
    console.log('Métriques campagnes:', { totalImpressions, totalClicks, totalConversions, totalSpend })
    
    // Calcul des métriques avancées
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    
    // Revenue réel depuis les performances (pas de simulation)
    const revenue = activeCampaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0)
    const roas = totalSpend > 0 ? (revenue / totalSpend) : 0
    const averageOrderValue = totalConversions > 0 ? revenue / totalConversions : 0
    const customerLifetimeValue = 0 // Sera calculé depuis les données réelles
    
    // Calcul des données des promotions
    const activePromotions = promotions.filter(p => p.status === 'active')
    const totalUsage = activePromotions.reduce((sum, p) => sum + p.used_count, 0)
    
    // Revenue réel depuis promotion_usage (pas de simulation)
    const totalPromoRevenue = 0 // Sera calculé depuis promotion_usage
    const averageOrderValuePromo = 0
    const customerAcquisition = 0 // Sera calculé depuis les données réelles
    const retention = 0 // Sera calculé depuis les données réelles
    const repeatPurchaseRate = 0
    const discountEfficiency = 0
    
    console.log('Métriques promotions:', { totalUsage, totalPromoRevenue, customerAcquisition, retention })
    
    const analyticsResult = {
      campaigns: {
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        ctr: parseFloat(ctr.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
        spend: totalSpend,
        revenue: revenue,
        averageOrderValue: averageOrderValue,
        customerLifetimeValue: customerLifetimeValue
      },
      promotions: {
        usage: totalUsage,
        revenue: totalPromoRevenue,
        averageOrderValue: averageOrderValuePromo,
        customerAcquisition: customerAcquisition,
        retention: retention,
        repeatPurchaseRate: parseFloat(repeatPurchaseRate.toFixed(2)),
        discountEfficiency: parseFloat(discountEfficiency.toFixed(2))
      }
    }
    
    console.log('Résultat analyse:', analyticsResult)
    setAnalyticsData(analyticsResult)
  }

  // ============================================
  // FONCTIONS DE GESTION DES CAMPAGNES VENDEUR
  // ============================================

  const handleCreateCampaign = async (campaignData: {
    product_id: string
    service_id: string
    type: 'recommendation' | 'banner' | 'whatsapp'
    target_pages: string[]
    duration: number
    total_cost: number
  }) => {
    if (!user?.id) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Vous devez être connecté pour créer une campagne'
      })
      return
    }

    setLoading(true)
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + campaignData.duration)

      const newCampaign = await BoostingCampaignManager.createCampaign({
        vendor_id: user.id,
        product_id: campaignData.product_id,
        service_id: campaignData.service_id,
        type: campaignData.type,
        status: 'pending',
        start_date: null,
        end_date: endDate.toISOString(),
        target_pages: campaignData.target_pages,
        duration: campaignData.duration,
        total_cost: campaignData.total_cost,
        payment_status: 'pending',
        payment_id: null,
        payment_method: null,
        rejection_reason: null
      })

      if (newCampaign) {
        setCampaigns([...campaigns, newCampaign])
        addNotification({
          type: 'success',
          title: 'Campagne Créée',
          message: 'Votre campagne a été créée et est en attente d\'approbation'
        })
        setIsCampaignModalOpen(false)
      }
    } catch (error) {
      console.error('Erreur création campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création de la campagne'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePauseCampaign = async (campaignId: string) => {
    setLoading(true)
    try {
      const success = await BoostingCampaignManager.pauseCampaign(campaignId)
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Mise en Pause',
          message: 'Votre campagne a été mise en pause'
        })
        loadData()
      }
    } catch (error) {
      console.error('Erreur pause campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise en pause'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResumeCampaign = async (campaignId: string) => {
    setLoading(true)
    try {
      const success = await BoostingCampaignManager.resumeCampaign(campaignId)
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Campagne Reprise',
          message: 'Votre campagne a été reprise'
        })
        loadData()
      }
    } catch (error) {
      console.error('Erreur reprise campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la reprise'
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonction loadMockData supprimée - Les données viennent maintenant de Supabase via loadData()

  // Fonction de formatage des prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price)
  }

  // Fonction pour actualiser les campagnes depuis Supabase
  const refreshCampaigns = async () => {
    setLoading(true)
    try {
      await loadData()
      addNotification({
        type: 'success',
        title: 'Campagnes Actualisées',
        message: 'Les campagnes ont été actualisées avec succès',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'actualisation',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary', text: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
      pending: { variant: 'secondary', text: 'En Attente', color: 'bg-yellow-100 text-yellow-800' },
      active: { variant: 'default', text: 'Active', color: 'bg-green-100 text-green-800' },
      paused: { variant: 'secondary', text: 'En Pause', color: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'default', text: 'Terminée', color: 'bg-gray-100 text-gray-800' },
      rejected: { variant: 'destructive', text: 'Rejetée', color: 'bg-red-100 text-red-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    
    return (
      <Badge variant={config.variant as any} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Marketing et Promotion</h2>
            <p className="text-gray-600 mt-2">
              Boostez vos produits et créez des campagnes promotionnelles efficaces
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refreshCampaigns} disabled={isLoadingCampaigns}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
              {isLoadingCampaigns ? 'Actualisation...' : 'Actualiser'}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="boosting-pro">Boostage Pro</TabsTrigger>
          <TabsTrigger value="promotions">Promotions</TabsTrigger>
          <TabsTrigger value="analytics">Analyse</TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'Ensemble */}
        <TabsContent value="overview" className="mt-6">
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
                    <p className="text-sm font-medium text-green-600">Investissement Total</p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatPrice(campaigns.reduce((sum, c) => sum + c.total_cost, 0))}
                    </p>
                    <p className="text-sm text-green-700 mt-1">Total investi</p>
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
                      <Switch checked={service.is_active} />
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Campagnes */}
        <TabsContent value="campaigns" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mes Campagnes de Boostage</h3>
              <Button onClick={() => setIsCampaignModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Campagne
              </Button>
            </div>

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
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Liste des campagnes */}
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Target className="h-12 w-12" />
                    <p className="text-lg font-medium">Aucune campagne</p>
                    <p className="text-sm">Créez votre première campagne de boostage pour commencer</p>
                  </div>
                </Card>
              ) : (
                campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-semibold text-lg">{campaign.productName}</h4>
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline" className="capitalize">
                            {campaign.type}
                          </Badge>
                          {/* Badge pour indiquer si la campagne a été créée par le Super Admin */}
                          {!campaign.id.startsWith('c') && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                              <Crown className="h-3 w-3 mr-1" />
                              Super Admin
                            </Badge>
                          )}
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
                        {campaign.status === 'draft' && (
                          <Button size="sm" onClick={() => handleCampaignSubmission(campaign)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Soumettre
                          </Button>
                        )}
                        
                        {campaign.status === 'active' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleCampaignStatusChange(campaign.id, 'paused')}>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleCampaignStatusChange(campaign.id, 'completed')}>
                              <StopCircle className="h-4 w-4 mr-1" />
                              Terminer
                            </Button>
                          </>
                        )}

                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
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
                    Système modulaire, intelligent et orienté résultats pour la promotion efficace de vos produits
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
                    <div className="space-y-2 text-xs text-gray-600">
                      <div>• Affichage sur pages stratégiques</div>
                      <div>• Tarification par page et par jour</div>
                      <div>• Ciblage précis des visiteurs</div>
                      <div>• Statistiques détaillées</div>
                      <div className="pt-2 font-medium text-blue-600">
                        {services.find(s => s.type === 'recommendation') 
                          ? `À partir de ${formatPrice(services.find(s => s.type === 'recommendation')?.base_price || 0)}`
                          : 'Service disponible'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Image className="h-5 w-5 text-green-600" />
                      Bannière Visuelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Bannières miniatures animées pour maximiser la conversion
                    </p>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div>• Bannières visuelles attractives</div>
                      <div>• Animations discrètes</div>
                      <div>• Optimisation conversion</div>
                      <div>• Calendrier configurable</div>
                      <div className="pt-2 font-medium text-green-600">
                        {services.find(s => s.type === 'banner') 
                          ? `À partir de ${formatPrice(services.find(s => s.type === 'banner')?.base_price || 0)}`
                          : 'Service disponible'}
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
                      Campagnes ultra-ciblées avec ciblage socio-démographique
                    </p>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div>• Ciblage pays, âge, profession</div>
                      <div>• Messages personnalisés</div>
                      <div>• Clients Probooster ciblés</div>
                      <div>• Paiement FeexPay</div>
                      <div className="pt-2 font-medium text-purple-600">
                        {services.find(s => s.type === 'whatsapp') 
                          ? `À partir de ${formatPrice(services.find(s => s.type === 'whatsapp')?.base_price || 0)}`
                          : 'Service disponible'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Bouton pour créer une nouvelle campagne */}
            <div className="text-center">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700" onClick={() => setIsCampaignModalOpen(true)}>
                <Zap className="h-5 w-5 mr-2" />
                Créer une Campagne de Boostage
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Onglet Promotions (Système existant) */}
        <TabsContent value="promotions" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mes Promotions</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Promotion
              </Button>
            </div>

            {/* Liste des promotions existantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {promotions.length === 0 ? (
                <Card className="col-span-2 p-8 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Gift className="h-12 w-12" />
                    <p className="text-lg font-medium">Aucune promotion</p>
                    <p className="text-sm">Les promotions actives apparaîtront ici</p>
                  </div>
                </Card>
              ) : (
                promotions.map((promotion) => (
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
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Analyse */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* En-tête de l'analyse */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Centre d'Analyse Marketing</h3>
                  <p className="text-gray-600 mt-2">
                    Analyses détaillées et insights professionnels pour optimiser vos campagnes et promotions
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={analyticsPeriod} onValueChange={setAnalyticsPeriod}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">7 derniers jours</SelectItem>
                      <SelectItem value="30days">30 derniers jours</SelectItem>
                      <SelectItem value="90days">90 derniers jours</SelectItem>
                      <SelectItem value="1year">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={calculateAnalytics}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </div>
            </div>

            {/* Sous-onglets de l'analyse */}
            <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="campaigns">Analyse des Campagnes</TabsTrigger>
                <TabsTrigger value="promotions">Analyse des Promotions</TabsTrigger>
              </TabsList>

              {/* Sous-onglet Analyse des Campagnes */}
              <TabsContent value="campaigns" className="mt-6">
                <div className="space-y-6">
                  {/* KPIs des campagnes */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Eye className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {analyticsData.campaigns.impressions.toLocaleString()}
                        </p>
                        <p className="text-sm text-blue-700">Impressions</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <MousePointer className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {analyticsData.campaigns.clicks.toLocaleString()}
                        </p>
                        <p className="text-sm text-green-700">Clics</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Target className="h-8 w-8 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          {analyticsData.campaigns.conversions.toLocaleString()}
                        </p>
                        <p className="text-sm text-purple-700">Conversions</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <TrendingUp className="h-8 w-8 text-orange-600" />
                        </div>
                        <p className="text-2xl font-bold text-orange-900">
                          {analyticsData.campaigns.roas.toFixed(2)}x
                        </p>
                        <p className="text-sm text-orange-700">ROAS</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Métriques détaillées */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Performance des Campagnes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">CTR (Taux de clic)</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(analyticsData.campaigns.ctr, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-blue-600">
                                {analyticsData.campaigns.ctr}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Taux de Conversion</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(analyticsData.campaigns.conversionRate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-green-600">
                                {analyticsData.campaigns.conversionRate}%
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {formatPrice(analyticsData.campaigns.spend)}
                              </p>
                              <p className="text-xs text-gray-600">Investissement Total</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-purple-600">
                                {formatPrice(analyticsData.campaigns.revenue)}
                              </p>
                              <p className="text-xs text-gray-600">Revenus Générés</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          Évolution des Performances
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48 flex items-center justify-center">
                          <div className="text-center text-gray-500">
                            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Aucune donnée d'évolution disponible</p>
                            <p className="text-xs mt-1">Les données apparaîtront après les premières conversions</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-4">
                          Évolution des conversions sur 7 jours
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analyse par type de campagne */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-purple-600" />
                        Performance par Type de Campagne
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['recommendation', 'banner', 'whatsapp'].map((type) => {
                          const typeCampaigns = campaigns.filter(c => c.type === type)
                          const totalSpend = typeCampaigns.reduce((sum, c) => sum + c.total_cost, 0)
                          const totalImpressions = typeCampaigns.reduce((sum, c) => sum + (c.performance?.impressions || 0), 0)
                          
                          return (
                            <div key={type} className="text-center p-4 border rounded-lg">
                              <h4 className="font-semibold capitalize mb-3">{type}</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Campagnes:</span>
                                  <span className="font-medium">{typeCampaigns.length}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Investissement:</span>
                                  <span className="font-medium">{formatPrice(totalSpend)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Impressions:</span>
                                  <span className="font-medium">{totalImpressions.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Sous-onglet Analyse des Promotions */}
              <TabsContent value="promotions" className="mt-6">
                <div className="space-y-6">
                  {/* KPIs des promotions */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Gift className="h-8 w-8 text-pink-600" />
                        </div>
                        <p className="text-2xl font-bold text-pink-900">
                          {analyticsData.promotions.usage.toLocaleString()}
                        </p>
                        <p className="text-sm text-pink-700">Utilisations</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="h-8 w-8 text-indigo-600" />
                        </div>
                        <p className="text-2xl font-bold text-indigo-900">
                          {formatPrice(analyticsData.promotions.revenue)}
                        </p>
                        <p className="text-sm text-indigo-700">Revenus</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <ShoppingCart className="h-8 w-8 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-bold text-emerald-900">
                          {formatPrice(analyticsData.promotions.averageOrderValue)}
                        </p>
                        <p className="text-sm text-emerald-700">Panier Moyen</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Users2 className="h-8 w-8 text-amber-600" />
                        </div>
                        <p className="text-2xl font-bold text-amber-900">
                          {analyticsData.promotions.customerAcquisition}
                        </p>
                        <p className="text-sm text-amber-700">Nouveaux Clients</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Analyse détaillée des promotions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-pink-600" />
                          Efficacité des Promotions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {promotions.filter(p => p.status === 'active').map((promotion) => {
                            const usageRate = (promotion.used_count / promotion.usage_limit) * 100
                            return (
                              <div key={promotion.id} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{promotion.name}</span>
                                  <span className="text-sm text-gray-600">
                                    {promotion.used_count}/{promotion.usage_limit}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-pink-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${usageRate}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Taux d'utilisation: {usageRate.toFixed(1)}%
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <PieChart className="h-5 w-5 text-indigo-600" />
                          Répartition des Clients
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                              <span className="text-sm">Nouveaux Clients</span>
                            </div>
                            <span className="font-medium text-blue-600">
                              {analyticsData.promotions.customerAcquisition}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                              <span className="text-sm">Clients Existants</span>
                            </div>
                            <span className="font-medium text-green-600">
                              {analyticsData.promotions.retention}
                            </span>
                          </div>
                          <div className="pt-4 border-t">
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-900">
                                {((analyticsData.promotions.customerAcquisition / analyticsData.promotions.usage) * 100).toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-600">Taux d'acquisition</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Graphique d'évolution des promotions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        Évolution des Utilisations de Promotions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">Aucune donnée d'évolution disponible</p>
                          <p className="text-xs mt-1">Les données apparaîtront après utilisation des promotions</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-4">
                        Évolution des utilisations de promotions sur 4 semaines
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
