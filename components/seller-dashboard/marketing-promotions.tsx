"use client"

import { useState, useEffect, useRef } from 'react'
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
  SpecialPromotionsManager,
  BoostingPricingManager,
  DEFAULT_BOOSTING_PRICING_CONFIG,
  type BoostingService,
  type BoostingCampaign,
  type Promotion,
  type BoostingPricingConfig,
  type SpecialPromotion
} from '@/lib/services/marketing-service'

const BOOSTING_PRICING_CACHE_KEY = 'boosting-pricing-config-cache'
const BOOSTING_PRICING_BROADCAST_KEY = 'boosting-pricing-config-broadcast'

/**
 * Composant Marketing & Promotions - Version Propre
 * 100% synchronisé avec Supabase
 * Aucune donnée de démo
 */
export default function MarketingPromotionsClean() {
  // Hooks
  const { addNotification } = useNotifications()
  const { user } = useAuth()
  
  // Vérification que c'est le nouveau composant
  console.log('🎉 NOUVEAU COMPOSANT PROPRE CHARGÉ - Version 100% Supabase')
  
  // États principaux - Tous initialisés vides
  const [activeTab, setActiveTab] = useState('overview')
  const [campaigns, setCampaigns] = useState<BoostingCampaign[]>([])
  const [services, setServices] = useState<BoostingService[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [specialPromotions, setSpecialPromotions] = useState<SpecialPromotion[]>([])
  const [servicePricing, setServicePricing] = useState<BoostingPricingConfig>(DEFAULT_BOOSTING_PRICING_CONFIG)
  const [loading, setLoading] = useState(false)
  const lastPricingHashRef = useRef<string>('')
  
  // États pour l'analyse - Tous à 0
  const [analyticsData, setAnalyticsData] = useState({
    campaigns: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      conversionRate: 0,
      roas: 0,
      spend: 0,
      revenue: 0
    },
    promotions: {
      usage: 0,
      revenue: 0,
      averageOrderValue: 0
    }
  })

  // Chargement des données au montage
  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return

    /**
     * Lit la configuration Boostage Pro depuis le cache localStorage (si disponible).
     */
    const readCachedPricingConfig = (): BoostingPricingConfig | null => {
      try {
        const raw = window.localStorage.getItem(BOOSTING_PRICING_CACHE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        const candidate = parsed?.config ?? parsed
        if (!candidate || typeof candidate !== 'object') return null
        return JSON.parse(JSON.stringify(candidate)) as BoostingPricingConfig
      } catch {
        return null
      }
    }

    /**
     * Applique la configuration reçue (événement) au state local.
     */
    const handleConfigUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ config?: BoostingPricingConfig }>
      const next = customEvent?.detail?.config
      if (next) {
        setServicePricing(JSON.parse(JSON.stringify(next)) as BoostingPricingConfig)
      }
    }

    /**
     * Réagit aux mises à jour depuis d'autres onglets (storage event).
     */
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BOOSTING_PRICING_BROADCAST_KEY) return
      const cached = readCachedPricingConfig()
      if (cached) {
        setServicePricing(JSON.parse(JSON.stringify(cached)) as BoostingPricingConfig)
        return
      }

      BoostingPricingManager.getConfig()
        .then((config) => setServicePricing(JSON.parse(JSON.stringify(config)) as BoostingPricingConfig))
        .catch(() => null)
    }

    window.addEventListener('boosting-pricing-config-updated', handleConfigUpdated)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('boosting-pricing-config-updated', handleConfigUpdated)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false
    let intervalId: number | undefined

    const refreshPricingConfig = async () => {
      try {
        const config = await BoostingPricingManager.getConfig()
        if (cancelled) return

        const nextHash = JSON.stringify(config)
        if (nextHash === lastPricingHashRef.current) return
        lastPricingHashRef.current = nextHash

        setServicePricing(JSON.parse(JSON.stringify(config)) as BoostingPricingConfig)
      } catch {
        // ignore
      }
    }

    const handleFocus = () => {
      void refreshPricingConfig()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshPricingConfig()
      }
    }

    void refreshPricingConfig()
    intervalId = window.setInterval(() => {
      void refreshPricingConfig()
    }, 20000)

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      if (typeof intervalId === 'number') {
        window.clearInterval(intervalId)
      }
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Charger les données depuis Supabase UNIQUEMENT
  const loadData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Charger les services disponibles
      const servicesData = await BoostingServiceManager.getActiveServices()
      setServices(servicesData || [])

      // Charger les campagnes (filtrage côté client par vendeur)
      const allCampaigns = await BoostingCampaignManager.getAllCampaigns()
      const campaignsData = (allCampaigns || []).filter((c: any) => c.vendor_id === user.id)
      setCampaigns(campaignsData)

      // Charger les promotions
      const promotionsData = await PromotionManager.getAllPromotions()
      setPromotions(promotionsData || [])

      // Charger les promotions spéciales (globales)
      const specials = await SpecialPromotionsManager.getAllSpecialPromotions()
      setSpecialPromotions((specials || []).filter(sp => sp.is_active && new Date(sp.end_date).getTime() >= Date.now()))

      // Charger la configuration tarifaire Boostage Pro
      const pricingConfig = await BoostingPricingManager.getConfig()
      setServicePricing(JSON.parse(JSON.stringify(pricingConfig)) as BoostingPricingConfig)

      // Calculer les analytics depuis les données réelles
      calculateAnalytics(campaignsData || [], promotionsData || [])

      addNotification({
        type: 'success',
        title: 'Données chargées',
        message: 'Les données ont été chargées depuis Supabase'
      })
    } catch (error) {
      console.error('Erreur chargement:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du chargement des données'
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculer les analytics depuis les données réelles UNIQUEMENT
  const calculateAnalytics = (campaignsData: BoostingCampaign[], promotionsData: Promotion[]) => {
    // Campagnes actives
    const activeCampaigns = campaignsData.filter(c => c.status === 'active')
    
    // Métriques campagnes - DEPUIS SUPABASE UNIQUEMENT
    const totalImpressions = activeCampaigns.reduce((sum, c) => sum + (c.performance?.impressions || 0), 0)
    const totalClicks = activeCampaigns.reduce((sum, c) => sum + (c.performance?.clicks || 0), 0)
    const totalConversions = activeCampaigns.reduce((sum, c) => sum + (c.performance?.conversions || 0), 0)
    const totalSpend = activeCampaigns.reduce((sum, c) => sum + (c.total_cost || 0), 0)
    const totalRevenue = activeCampaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0)
    
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
    const roas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0
    
    // Métriques promotions - DEPUIS SUPABASE UNIQUEMENT
    const activePromotions = promotionsData.filter(p => p.status === 'active')
    const totalUsage = activePromotions.reduce((sum, p) => sum + (p.used_count || 0), 0)
    
    setAnalyticsData({
      campaigns: {
        impressions: totalImpressions,
        clicks: totalClicks,
        conversions: totalConversions,
        ctr: parseFloat(ctr.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        roas: parseFloat(roas.toFixed(2)),
        spend: totalSpend,
        revenue: totalRevenue
      },
      promotions: {
        usage: totalUsage,
        revenue: 0, // Sera calculé depuis promotion_usage
        averageOrderValue: 0
      }
    })
  }

  // Fonction pour formater les prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getServiceStartingPrice = (service: BoostingService) => {
    switch (service.type) {
      case 'recommendation':
        return formatPrice(servicePricing.recommendation.homePage)
      case 'banner': {
        const base = servicePricing.recommendation.homePage
        const estimated = Math.max(
          0,
          Math.round(base * servicePricing.banner.multiplier + servicePricing.banner.animationFee)
        )
        return formatPrice(estimated)
      }
      case 'whatsapp':
        return formatPrice(servicePricing.whatsapp.baseCost)
      default:
        return formatPrice(service.base_price)
    }
  }

  const renderServicePricingDetails = (service: BoostingService) => {
    if (service.type === 'recommendation') {
      return (
        <div className="pt-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Page d'accueil</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.recommendation.homePage)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Page produit</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.recommendation.productPage)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Meilleures ventes</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.recommendation.bestSellers)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Nouvelles arrivées</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.recommendation.newArrivals)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Page vendeur</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.recommendation.vendorPage)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-blue-700">
            <span>Réduction multi-pages</span>
            <span className="font-semibold">{servicePricing.recommendation.multiPageDiscount}%</span>
          </div>
        </div>
      )
    }

    if (service.type === 'banner') {
      const base = servicePricing.recommendation.homePage
      const estimated = Math.max(
        0,
        Math.round(base * servicePricing.banner.multiplier + servicePricing.banner.animationFee)
      )

      return (
        <div className="pt-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Coût estimé / jour</span>
            <span className="font-semibold text-gray-900">{formatPrice(estimated)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Multiplicateur</span>
            <span className="font-semibold text-gray-900">×{servicePricing.banner.multiplier}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Frais animation</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.banner.animationFee)}</span>
          </div>
        </div>
      )
    }

    if (service.type === 'whatsapp') {
      return (
        <div className="pt-3 space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Coût base / msg</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.whatsapp.baseCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Majoration pays</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.whatsapp.countryCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Majoration âge</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.whatsapp.ageCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Majoration profession</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.whatsapp.professionCost)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Ciblage Probooster</span>
            <span className="font-semibold text-gray-900">{formatPrice(servicePricing.whatsapp.proboosterCost)}</span>
          </div>
        </div>
      )
    }

    return null
  }

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const config = {
      active: { variant: 'default', color: 'bg-green-100 text-green-800', text: 'Active' },
      pending: { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800', text: 'En attente' },
      paused: { variant: 'secondary', color: 'bg-gray-100 text-gray-800', text: 'En pause' },
      completed: { variant: 'outline', color: 'bg-blue-100 text-blue-800', text: 'Terminée' },
      rejected: { variant: 'destructive', color: 'bg-red-100 text-red-800', text: 'Rejetée' }
    }[status] || { variant: 'outline', color: 'bg-gray-100 text-gray-800', text: status }

    return (
      <Badge variant={config.variant as any} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-orange-600" />
            Marketing & Promotions
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez vos promotions, campagnes et services publicitaires
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
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
                      {formatPrice(campaigns.reduce((sum, c) => sum + (c.total_cost || 0), 0))}
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
            {services.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Zap className="h-12 w-12" />
                  <p className="text-lg font-medium">Aucun service disponible</p>
                  <p className="text-sm">Les services de boostage apparaîtront ici</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <Switch checked={service.is_active} disabled />
                      </div>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">À partir de</span>
                          <span className="font-bold text-green-600">{getServiceStartingPrice(service)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Modèle:</span>
                          <Badge variant="outline" className="text-xs">
                            {service.pricing_model === 'per_page_day' ? 'Page × Jour' : 
                             service.pricing_model === 'per_message_country' ? 'Message × Pays' : 'Fixe'}
                          </Badge>
                        </div>
                        {service.features && service.features.length > 0 && (
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
                        )}

                        {renderServicePricingDetails(service)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Onglet Campagnes */}
        <TabsContent value="campaigns" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mes Campagnes de Boostage</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Campagne
              </Button>
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
                            <h4 className="font-semibold text-lg">{campaign.productName || 'Campagne'}</h4>
                            {getStatusBadge(campaign.status)}
                            <Badge variant="outline" className="capitalize">
                              {campaign.type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Début:</span>
                              <p className="font-medium">{campaign.start_date || 'Non défini'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Fin:</span>
                              <p className="font-medium">{campaign.end_date || 'Non défini'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Durée:</span>
                              <p className="font-medium">{campaign.duration || 0} jours</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Coût:</span>
                              <p className="font-medium text-green-600">{formatPrice(campaign.total_cost || 0)}</p>
                            </div>
                          </div>

                          {campaign.performance && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h5 className="font-medium mb-2">Performance</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Impressions:</span>
                                  <p className="font-medium">{campaign.performance.impressions?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Clics:</span>
                                  <p className="font-medium">{campaign.performance.clicks?.toLocaleString() || 0}</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">CTR:</span>
                                  <p className="font-medium">{campaign.performance.ctr || 0}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-600">Conversions:</span>
                                  <p className="font-medium">{campaign.performance.conversions || 0}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
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
                {/* Recommandation Ciblée */}
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

                {/* Bannière Visuelle */}
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

                {/* WhatsApp Marketing */}
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
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                <Zap className="h-5 w-5 mr-2" />
                Créer une Campagne de Boostage
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Onglet Promotions */}
        <TabsContent value="promotions" className="mt-6">
          <div className="space-y-6">
            {/* Promotions Spéciales (globales) - Lecture seule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Promotions Spéciales (globales)
                </CardTitle>
                <CardDescription>Ces blocs sont gérés par le Super Admin et s'affichent chez les clients.</CardDescription>
              </CardHeader>
              <CardContent>
                {specialPromotions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Aucune promotion spéciale active.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {specialPromotions.map((sp) => (
                      <Card key={sp.id} className="overflow-hidden border">
                        <div
                          className="h-20"
                          style={{ background: `linear-gradient(135deg, ${sp.gradient_from}, ${sp.gradient_to})` }}
                        />
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{sp.title}</CardTitle>
                            <Badge variant={sp.is_active ? 'default' : 'secondary'}>
                              {sp.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <CardDescription>Fin: {new Date(sp.end_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {sp.description && (
                            <p className="text-sm text-gray-700">{sp.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mes Promotions</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Promotion
              </Button>
            </div>

            {/* Liste des promotions */}
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
                        {promotion.discount_type === 'percentage' 
                          ? `${promotion.discount_value}% de réduction` 
                          : `${formatPrice(promotion.discount_value)} de réduction`}
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
            {/* En-tête */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Centre d'Analyse Marketing</h3>
                  <p className="text-gray-600 mt-2">
                    Analyses détaillées et insights professionnels pour optimiser vos campagnes
                  </p>
                </div>
                <Button variant="outline" onClick={() => calculateAnalytics(campaigns, promotions)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>

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
            <Card>
              <CardHeader>
                <CardTitle>Métriques Détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CTR (Taux de clic):</span>
                    <div className="flex items-center gap-3">
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

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de conversion:</span>
                    <div className="flex items-center gap-3">
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

            {/* Message si pas de données */}
            {campaigns.length === 0 && (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <BarChart3 className="h-12 w-12" />
                  <p className="text-lg font-medium">Aucune donnée d'analyse</p>
                  <p className="text-sm">Créez des campagnes pour voir vos statistiques ici</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
