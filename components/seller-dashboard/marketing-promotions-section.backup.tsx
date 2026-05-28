"use client"
import MarketingPromotionsClean from './marketing-promotions'
export default function MarketingPromotionsSection() { return <MarketingPromotionsClean /> }
/*
// Wrapper pour garder la compatibilité avec la page
  price: number
  duration: string
  features: string[]
  type: 'boost' | 'featured' | 'banner' | 'email' | 'social'
  status: 'available' | 'unavailable'
}

export default function MarketingPromotionsSection() {
  const { addNotification } = useNotifications()
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState('promotions')
  const [showCreatePromotion, setShowCreatePromotion] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showAdvertisingServices, setShowAdvertisingServices] = useState(false)
  
  // États de chargement et gestion d'erreurs
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // États pour les formulaires
  const [promotionForm, setPromotionForm] = useState({
    name: '',
    type: 'code',
    discountType: 'percentage',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    products: [],
    categories: [],
    conditions: ''
  })
  
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'social',
    budget: 0,
    startDate: '',
    endDate: '',
    targetAudience: [],
    channels: []
  })

  // Données simulées
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      name: 'ÉTÉ2024',
      type: 'code',
      discountType: 'percentage',
      discountValue: 20,
      minAmount: 5000,
      maxDiscount: 10000,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      usageLimit: 500,
      usedCount: 127,
      status: 'active',
      products: ['iPhone 15', 'Samsung Galaxy'],
      categories: ['Électronique'],
      conditions: 'Minimum 5000 FCFA d\'achat',
      createdAt: '2024-05-15',
      updatedAt: '2024-06-01'
    }
  ])

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Campagne Été 2024',
      type: 'social',
      status: 'active',
      budget: 50000,
      spent: 32450,
      impressions: 15420,
      clicks: 1234,
      conversions: 89,
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      targetAudience: ['18-35 ans', 'Intéressés par la mode'],
      channels: ['Facebook', 'Instagram'],
      performance: {
        ctr: 8.0,
        cpc: 26.3,
        roas: 3.2,
        conversionRate: 7.2
      }
    }
  ])

  const [advertisingServices] = useState<AdvertisingService[]>([
    {
      id: '1',
      name: 'Boost Produit Premium',
      description: 'Mise en avant de votre produit en tête de liste pendant 7 jours',
      price: 15000,
      duration: '7 jours',
      features: ['Position premium', 'Visibilité maximale', 'Analytics détaillés'],
      type: 'boost',
      status: 'available'
    }
  ])

  // États pour gérer les modals de boostage
  const [showBoostingModal, setShowBoostingModal] = useState(false)
  const [boostingType, setBoostingType] = useState<'recommandation' | 'banniere' | 'whatsapp' | null>(null)
  
  // États pour les formulaires de boostage
  const [boostingForm, setBoostingForm] = useState({
    // Recommandation et Bannière
    selectedPages: [] as string[],
    startDate: '',
    endDate: '',
    duration: 7,
    autoRenewal: false,
    
    // Bannière spécifique
    bannerImage: null as File | null,
    bannerTitle: '',
    bannerDescription: '',
    
    // WhatsApp spécifique
    targetCount: 100,
    targetCountry: 'Tous',
    targetAge: 'Tous',
    targetProfession: 'Tous',
    targetCustomProfession: '',
    targetInterests: [] as string[],
    whatsappImage: null as File | null,
    whatsappMessage: '',
    whatsappTitle: '',
    whatsappDescription: '',
    whatsappLink: '',
    senderWhatsapp: '',
    targetProboosterClients: false
  })

  // Validation des formulaires
  const validatePromotionForm = () => {
    if (!promotionForm.name.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom de la promotion est obligatoire'
      })
      return false
    }
    
    if (promotionForm.discountValue <= 0) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La valeur de réduction doit être supérieure à 0'
      })
      return false
    }
    
    if (!promotionForm.startDate) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La date de début est obligatoire'
      })
      return false
    }
    
    if (!promotionForm.endDate) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La date de fin est obligatoire'
      })
      return false
    }
    
    const startDate = new Date(promotionForm.startDate)
    const endDate = new Date(promotionForm.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (startDate < today) {
      addNotification({
        type: 'error',
        title: 'Erreur de dates',
        message: 'La date de début ne peut pas être dans le passé'
      })
      return false
    }
    
    if (startDate >= endDate) {
      addNotification({
        type: 'error',
        title: 'Erreur de dates',
        message: 'La date de fin doit être postérieure à la date de début'
      })
      return false
    }
    
    if (promotionForm.usageLimit <= 0) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'La limite d\'utilisation doit être supérieure à 0'
      })
      return false
    }
    
    return true
  }
  
  const validateCampaignForm = () => {
    if (!campaignForm.name.trim()) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le nom de la campagne est obligatoire'
      })
      return false
    }
    
    if (campaignForm.budget <= 0) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Le budget doit être supérieur à 0'
      })
      return false
    }
    
    if (campaignForm.startDate && campaignForm.endDate) {
      const startDate = new Date(campaignForm.startDate)
      const endDate = new Date(campaignForm.endDate)
      
      if (startDate >= endDate) {
        addNotification({
          type: 'error',
          title: 'Erreur de dates',
          message: 'La date de fin doit être postérieure à la date de début'
        })
        return false
      }
    }
    
    return true
  }

  // Fonctions de gestion
  const createPromotion = async () => {
    if (!validatePromotionForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newPromotion: Promotion = {
        id: Date.now().toString(),
        ...promotionForm,
        type: promotionForm.type as 'code' | 'reduction' | 'flash' | 'bundle',
        discountType: promotionForm.discountType as 'percentage' | 'fixed' | 'free_shipping',
        status: 'draft',
        usedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      setPromotions([...promotions, newPromotion])
      setShowCreatePromotion(false)
      setPromotionForm({
        name: '',
        type: 'code',
        discountType: 'percentage',
        discountValue: 0,
        minAmount: 0,
        maxDiscount: 0,
        startDate: '',
        endDate: '',
        usageLimit: 100,
        products: [],
        categories: [],
        conditions: ''
      })

      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Promotion créée avec succès !'
      })
    } catch (err) {
      setError('Erreur lors de la création de la promotion')
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création de la promotion'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createCampaign = async () => {
    if (!validateCampaignForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Simulation d'une API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        ...campaignForm,
        type: campaignForm.type as 'social' | 'email' | 'push' | 'banner',
        status: 'draft',
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        performance: {
          ctr: 0,
          cpc: 0,
          roas: 0,
          conversionRate: 0
        }
      }

      setCampaigns([...campaigns, newCampaign])
      setShowCreateCampaign(false)
      setCampaignForm({
        name: '',
        type: 'social',
        budget: 0,
        startDate: '',
        endDate: '',
        targetAudience: [],
        channels: []
      })

      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Campagne créée avec succès !'
      })
    } catch (err) {
      setError('Erreur lors de la création de la campagne')
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création de la campagne'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const purchaseAdvertisingService = (service: AdvertisingService) => {
    addNotification({
      type: 'info',
      title: 'Paiement',
      message: `Redirection vers FeexPay pour le paiement de ${service.name} (${service.price} FCFA)`
    })
    
    setTimeout(() => {
      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Service publicitaire acheté avec succès !'
      })
    }, 2000)
  }

  // Fonction pour ouvrir le modal de boostage
  const openBoostingModal = (type: 'recommandation' | 'banniere' | 'whatsapp') => {
    setBoostingType(type)
    setShowBoostingModal(true)
    
    // Réinitialiser le formulaire
    setBoostingForm({
      selectedPages: [],
      startDate: '',
      endDate: '',
      duration: 7,
      autoRenewal: false,
      bannerImage: null,
      bannerTitle: '',
      bannerDescription: '',
      targetCount: 100,
      targetCountry: 'Tous',
      targetAge: 'Tous',
      targetProfession: 'Tous',
      targetCustomProfession: '',
      targetInterests: [],
      whatsappImage: null,
      whatsappMessage: '',
      whatsappTitle: '',
      whatsappDescription: '',
      whatsappLink: '',
      senderWhatsapp: '',
      targetProboosterClients: false
    })
  }

  // Fonction pour créer un boostage et l'envoyer en attente d'approbation
  const createBoostingCampaign = () => {
    if (!boostingType) return

    // Validation du formulaire selon le type
    if (boostingType === 'recommandation' || boostingType === 'banniere') {
      if (boostingForm.selectedPages.length === 0) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Veuillez sélectionner au moins une page'
        })
        return
      }
      if (!boostingForm.startDate || !boostingForm.endDate) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Veuillez sélectionner les dates de début et de fin'
        })
        return
      }
    }

    if (boostingType === 'banniere') {
      if (!boostingForm.bannerTitle || !boostingForm.bannerDescription) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Veuillez remplir le titre et la description de la bannière'
        })
        return
      }
    }

    if (boostingType === 'whatsapp') {
      if (!boostingForm.whatsappMessage || !boostingForm.senderWhatsapp) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Veuillez remplir le message et le numéro WhatsApp'
        })
        return
      }
    }

    // Calcul du coût selon le type et les paramètres
    let cost = 0
    let pages: string[] = []
    
    if (boostingType === 'recommandation' || boostingType === 'banniere') {
      pages = boostingForm.selectedPages
      const pageCosts: { [key: string]: number } = {
        'Page d\'accueil': 5000,
        'Page produit': 4000,
        'Meilleures ventes': 3500,
        'Nouvelles arrivées': 3000,
        'Page vendeur': 2500
      }
      cost = pages.reduce((total, page) => total + pageCosts[page], 0) * boostingForm.duration
    } else if (boostingType === 'whatsapp') {
      cost = boostingForm.targetCount * 0.5 // 0.5 FCFA par cible
      pages = ['WhatsApp']
    }

    const newBoostingCampaign: Campaign = {
      id: Date.now().toString(),
      name: `Boostage ${boostingType.charAt(0).toUpperCase() + boostingType.slice(1)} - ${pages.join(', ')}`,
      type: 'boostage',
      status: 'pending', // Statut en attente d'approbation
      budget: cost,
      spent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      startDate: boostingForm.startDate,
      endDate: boostingForm.endDate,
      targetAudience: ['Tous les visiteurs'],
      channels: pages,
      performance: {
        ctr: 0,
        cpc: 0,
        roas: 0,
        conversionRate: 0
      },
      boostageType: boostingType,
      boostagePages: pages,
      boostageDuration: boostingForm.duration,
      boostageCost: cost,
      boostageRemainingDays: boostingForm.duration,
      boostagePerformance: {
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0
      }
    }

    setCampaigns([...campaigns, newBoostingCampaign])
    setShowBoostingModal(false)
    
    addNotification({
      type: 'success',
      title: 'Demande de boostage envoyée',
      message: `Votre demande de boostage ${boostingType} a été envoyée en attente d'approbation par l'administrateur`
    })

      title: 'Succès',
      message: 'Promotion supprimée avec succès'
    })
  }
}

const updatePromotionStatus = (id: string, status: Promotion['status']) => {
  setPromotions(promotions.map(p => 
    p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
  ))
  addNotification({
    type: 'success',
    title: 'Succès',
    message: `Statut de la promotion mis à jour : ${status}`
  })
}

// Fonctions de gestion des campagnes
const deleteCampaign = async (id: string) => {
  const accepted = await confirm({
    title: 'Supprimer la campagne',
    message: 'Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    tone: 'destructive'
  })
  if (accepted) {
    setCampaigns(campaigns.filter(c => c.id !== id))
    addNotification({
      type: 'success',
      title: 'Succès',
      message: `Statut de la campagne mis à jour : ${status}`
    })
  }

  // Fonction de réinitialisation des formulaires
  const resetPromotionForm = () => {
    setPromotionForm({
      name: '',
      type: 'code',
      discountType: 'percentage',
      discountValue: 0,
      minAmount: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 100,
      products: [],
      categories: [],
      conditions: ''
    })
    setError(null)
  }

  const resetCampaignForm = () => {
    setCampaignForm({
      name: '',
      type: 'social',
      budget: 0,
      startDate: '',
      endDate: '',
      targetAudience: [],
      channels: []
    })
    setError(null)
  }

  // Calcul des statistiques
  const getPromotionStats = () => {
    const activePromotions = promotions.filter(p => p.status === 'active')
    const totalUsage = activePromotions.reduce((sum, p) => sum + p.usedCount, 0)
    const totalLimit = activePromotions.reduce((sum, p) => sum + p.usageLimit, 0)
    
    return {
      total: promotions.length,
      active: activePromotions.length,
      usageRate: totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0,
      totalDiscount: activePromotions.reduce((sum, p) => sum + (p.discountValue * p.usedCount), 0)
    }
  }

  const getCampaignStats = () => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active')
    const pendingCampaigns = campaigns.filter(c => c.status === 'pending')
    const totalBudget = activeCampaigns.reduce((sum, c) => sum + c.budget, 0)
    const totalSpent = activeCampaigns.reduce((sum, c) => sum + c.spent, 0)
    
    return {
      total: campaigns.length,
      active: activeCampaigns.length,
      pending: pendingCampaigns.length,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      totalROAS: activeCampaigns.reduce((sum, c) => sum + c.performance.roas, 0) / activeCampaigns.length || 0
    }
  }

  const promotionStats = getPromotionStats()
  const campaignStats = getCampaignStats()

    // Simulation de l'évolution en temps réel des boostages (seulement ceux approuvés)
  useEffect(() => {
    const interval = setInterval(() => {
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => {
          if (campaign.type === 'boostage' && campaign.status === 'active') {
            // Simuler l'augmentation des performances
            const randomViews = Math.floor(Math.random() * 10) + 1
            const randomClicks = Math.floor(Math.random() * 3) + 1
            const randomConversions = Math.random() > 0.7 ? 1 : 0
            const randomRevenue = randomConversions * (Math.random() * 1000 + 500)

            return {
              ...campaign,
              impressions: campaign.impressions + randomViews,
              clicks: campaign.clicks + randomClicks,
              conversions: campaign.conversions + randomConversions,
              boostagePerformance: {
                views: (campaign.boostagePerformance?.views || 0) + randomViews,
                clicks: (campaign.boostagePerformance?.clicks || 0) + randomClicks,
                conversions: (campaign.boostagePerformance?.conversions || 0) + randomConversions,
                revenue: (campaign.boostagePerformance?.revenue || 0) + randomRevenue
              },
              performance: {
                ctr: campaign.clicks > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
                cpc: campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0,
                roas: campaign.spent > 0 ? (campaign.boostagePerformance?.revenue || 0) / campaign.spent : 0,
                conversionRate: campaign.impressions > 0 ? (campaign.conversions / campaign.impressions) * 100 : 0
              }
            }
          }
          return campaign
        })
      )
    }, 5000) // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Affichage des erreurs globales */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-5 w-5 text-red-400">⚠️</div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
      
      {/* En-tête avec statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Promotions Actives</p>
                <p className="text-3xl font-bold">{promotionStats.active}</p>
              </div>
              <Gift className="h-12 w-12" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            </div>
            <Progress value={promotionStats.usageRate} className="mt-4" style={{ backgroundColor: 'rgba(255, 102, 0, 0.3)' }} />
            <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Taux d'utilisation: {promotionStats.usageRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

                 <Card className="text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
           <CardContent className="p-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Campagnes Actives</p>
                 <p className="text-3xl font-bold">{campaignStats.active}</p>
                 {campaignStats.pending > 0 && (
                   <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                     {campaignStats.pending} en attente
                   </p>
                 )}
               </div>
               <Target className="h-12 w-12" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
             </div>
             <Progress value={campaignStats.budgetUtilization} className="mt-4" style={{ backgroundColor: 'rgba(83, 84, 85, 0.3)' }} />
             <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Budget utilisé: {campaignStats.budgetUtilization.toFixed(1)}%</p>
           </CardContent>
         </Card>

        <Card className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #cc4d00)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>ROAS Moyen</p>
                <p className="text-3xl font-bold">{campaignStats.totalROAS.toFixed(1)}x</p>
              </div>
              <TrendingUp className="h-12 w-12" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Retour sur investissement</p>
          </CardContent>
        </Card>

        <Card className="text-white" style={{ background: 'linear-gradient(135deg, #535455, #404142)' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Réduction Totale</p>
                <p className="text-3xl font-bold">{promotionStats.totalDiscount.toLocaleString()}</p>
              </div>
              <Percent className="h-12 w-12" style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>FCFA de réductions</p>
          </CardContent>
        </Card>
      </div>

      {/* Titre et actions principales */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketing & Promotions</h1>
          <p className="text-gray-600 mt-2">Gérez vos promotions, campagnes et services publicitaires</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowCreatePromotion(true)}
            className="text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Promotion
          </Button>
                     <Button 
             onClick={() => setActiveTab('boosting-pro')}
             variant="outline"
             className="border-orange-500 text-orange-600 hover:bg-orange-50"
             disabled={isLoading}
           >
             <Zap className="w-4 h-4 mr-2" />
             Boostage Pro
           </Button>
          <Button 
            onClick={() => setShowAdvertisingServices(true)}
            variant="outline"
            className="border-gray-500 text-gray-600 hover:bg-gray-50"
          >
            <Globe className="w-4 h-4 mr-2" />
            Services Publicitaires
          </Button>
        </div>
      </div>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                 <TabsList className="grid w-full grid-cols-3">
           <TabsTrigger value="promotions" className="flex items-center space-x-2">
             <Gift className="w-4 h-4" />
             <span>Promotions</span>
             <Badge variant="secondary">{promotions.length}</Badge>
           </TabsTrigger>
           <TabsTrigger value="campaigns" className="flex items-center space-x-2">
             <Target className="w-4 h-4" />
             <span>Campagnes</span>
             <Badge variant="secondary">{campaigns.length}</Badge>
           </TabsTrigger>
           <TabsTrigger value="analytics" className="flex items-center space-x-2">
             <BarChart3 className="w-4 h-4" />
             <span>Analytics</span>
           </TabsTrigger>
         </TabsList>

        {/* Onglet Promotions */}
        <TabsContent value="promotions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {promotions.map((promotion) => (
              <Card key={promotion.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Gift className="h-5 w-5" style={{ color: '#ff6600' }} />
                      <span>{promotion.name}</span>
                    </CardTitle>
                    <Badge 
                      variant={
                        promotion.status === 'active' ? 'default' :
                        promotion.status === 'paused' ? 'secondary' :
                        promotion.status === 'expired' ? 'destructive' : 'outline'
                      }
                    >
                      {promotion.status === 'active' ? 'Actif' :
                       promotion.status === 'paused' ? 'Pausé' :
                       promotion.status === 'expired' ? 'Expiré' : 'Brouillon'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Percent className="h-4 w-4" />
                    <span>
                      {promotion.discountType === 'percentage' ? `${promotion.discountValue}%` :
                       promotion.discountType === 'fixed' ? `${promotion.discountValue} FCFA` :
                       'Livraison gratuite'}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilisation</span>
                      <span>{promotion.usedCount} / {promotion.usageLimit}</span>
                    </div>
                    <Progress 
                      value={(promotion.usedCount / promotion.usageLimit) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Début</p>
                      <p className="font-medium">{new Date(promotion.startDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fin</p>
                      <p className="font-medium">{new Date(promotion.endDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  
                  {promotion.minAmount && promotion.minAmount > 0 && (
                    <div className="text-sm">
                      <p className="text-gray-500">Montant minimum</p>
                      <p className="font-medium">{promotion.minAmount.toLocaleString()} FCFA</p>
                    </div>
                  )}
                  
                  {/* Actions rapides */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePromotionStatus(promotion.id, promotion.status === 'active' ? 'paused' : 'active')}
                        className="text-xs"
                      >
                        {promotion.status === 'active' ? 'Pauser' : 'Activer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePromotionStatus(promotion.id, 'draft')}
                        className="text-xs"
                      >
                        Brouillon
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deletePromotion(promotion.id)}
                      className="text-xs"
                    >
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Campagnes */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Target className="h-5 w-5" style={{ color: '#ff6600' }} />
                      <span>{campaign.name}</span>
                    </CardTitle>
                    <Badge 
                      variant={
                        campaign.status === 'active' ? 'default' :
                        campaign.status === 'paused' ? 'secondary' :
                        campaign.status === 'completed' ? 'outline' :
                        campaign.status === 'pending' ? 'secondary' : 'secondary'
                      }
                    >
                      {campaign.status === 'active' ? 'Actif' :
                       campaign.status === 'paused' ? 'Pausé' :
                       campaign.status === 'completed' ? 'Terminé' :
                       campaign.status === 'pending' ? 'En Attente' : 'Brouillon'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BarChart3 className="h-4 w-4" />
                    <span>{campaign.type === 'social' ? 'Réseaux sociaux' :
                           campaign.type === 'email' ? 'Email' :
                           campaign.type === 'push' ? 'Push' : 'Bannière'}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget utilisé</span>
                      <span>{campaign.spent.toLocaleString()} / {campaign.budget.toLocaleString()} FCFA</span>
                    </div>
                    <Progress 
                      value={(campaign.spent / campaign.budget) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Impressions</p>
                      <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Clics</p>
                      <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Conversions</p>
                      <p className="font-medium">{campaign.conversions}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROAS</p>
                      <p className="font-medium">{campaign.performance.roas.toFixed(1)}x</p>
                    </div>
                  </div>
                  
                  {/* Actions rapides */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCampaignStatus(campaign.id, campaign.status === 'active' ? 'paused' : 'active')}
                        className="text-xs"
                      >
                        {campaign.status === 'active' ? 'Pauser' : 'Activer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCampaignStatus(campaign.id, 'draft')}
                        className="text-xs"
                      >
                        Brouillon
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCampaign(campaign.id)}
                      className="text-xs"
                    >
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
                 </TabsContent>

         {/* Onglet Campagnes */}
         <TabsContent value="campaigns" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {campaigns.map((campaign) => (
               <Card key={campaign.id} className="group hover:shadow-lg transition-all duration-300">
                 <CardHeader className="pb-3">
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-lg flex items-center space-x-2">
                       <Target className="h-5 w-5" style={{ color: '#ff6600' }} />
                       <span>{campaign.name}</span>
                     </CardTitle>
                     <div className="flex items-center gap-2">
                       <Badge 
                         variant={
                           campaign.status === 'active' ? 'default' :
                           campaign.status === 'paused' ? 'secondary' :
                           campaign.status === 'completed' ? 'outline' :
                           campaign.status === 'pending' ? 'secondary' : 'secondary'
                         }
                       >
                         {campaign.status === 'active' ? 'Actif' :
                          campaign.status === 'paused' ? 'Pausé' :
                          campaign.status === 'completed' ? 'Terminé' :
                          campaign.status === 'pending' ? 'En Attente' : 'Brouillon'}
                       </Badge>
                       {campaign.type === 'boostage' && campaign.status === 'active' && (
                         <Badge variant="destructive" className="animate-pulse">
                           <div className="flex items-center gap-1">
                             <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                             LIVE
                           </div>
                         </Badge>
                     <BarChart3 className="h-4 w-4" />
                     <span>
                       {campaign.type === 'boostage' ? 'Boostage Pro' :
                        campaign.type === 'social' ? 'Réseaux sociaux' :
                        campaign.type === 'email' ? 'Email' :
                        campaign.type === 'push' ? 'Push' : 'Bannière'}
                     </span>
                     {campaign.type === 'boostage' && campaign.boostageType && (
                       <Badge variant="outline" className="text-xs">
                         {campaign.boostageType === 'recommandation' ? 'Recommandation' :
                          campaign.boostageType === 'banniere' ? 'Bannière' : 'WhatsApp'}
                       </Badge>
                     )}
                   </div>
                 </CardHeader>
                 
                 <CardContent className="space-y-4">
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>Budget utilisé</span>
                       <span>{campaign.spent.toLocaleString()} / {campaign.budget.toLocaleString()} FCFA</span>
                     </div>
                     <Progress 
                       value={(campaign.spent / campaign.budget) * 100} 
                       className="h-2"
                     />
                   </div>

                   {/* Informations spécifiques aux boostages */}
                   {campaign.type === 'boostage' && campaign.boostageType && (
                     <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                       <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                         <Zap className="h-4 w-4" />
                         Détails du Boostage
                       </div>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                         <div>
                           <span className="text-orange-600">Type:</span>
                           <span className="ml-1 font-medium">
                             {campaign.boostageType === 'recommandation' ? 'Recommandation' :
                              campaign.boostageType === 'banniere' ? 'Bannière' : 'WhatsApp'}
                           </span>
                         </div>
                         <div>
                           <span className="text-orange-600">Pages:</span>
                           <span className="ml-1 font-medium">{campaign.boostagePages?.join(', ')}</span>
                         </div>
                         <div>
                           <span className="text-orange-600">Durée:</span>
                           <span className="ml-1 font-medium">{campaign.boostageDuration} jours</span>
                         </div>
                         <div>
                           <span className="text-orange-600">Coût:</span>
                           <span className="ml-1 font-medium">{campaign.boostageCost?.toLocaleString()} FCFA</span>
                         </div>
                       </div>
                     </div>
                   )}
                   
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <p className="text-gray-500">Impressions</p>
                       <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
                     </div>
                     <div>
                       <p className="text-gray-500">Clics</p>
                       <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                     </div>
                     <div>
                       <p className="text-gray-500">Conversions</p>
                       <p className="font-medium">{campaign.conversions}</p>
                     </div>
                     <div>
                       <p className="text-gray-500">ROAS</p>
                       <p className="font-medium">{campaign.performance.roas.toFixed(1)}x</p>
                     </div>
                   </div>
                   
                   {/* Actions rapides */}
                   <div className="flex items-center justify-between pt-4 border-t">
                     <div className="flex space-x-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => updateCampaignStatus(campaign.id, campaign.status === 'active' ? 'paused' : 'active')}
                         className="text-xs"
                       >
                         {campaign.status === 'active' ? 'Pauser' : 'Activer'}
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => updateCampaignStatus(campaign.id, 'draft')}
                         className="text-xs"
                       >
                         Brouillon
                       </Button>
                     </div>
                     <Button
                       size="sm"
                       variant="destructive"
                       onClick={() => deleteCampaign(campaign.id)}
                       className="text-xs"
                     >
                       Supprimer
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </TabsContent>

         {/* Onglet Boostage Pro */}
        <TabsContent value="boosting-pro" className="space-y-6">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-8 w-8 text-orange-600" />
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
                     <div className="space-y-2 text-xs mb-4">
                       <div className="flex justify-between">
                         <span>Page d'accueil:</span>
                         <span className="font-medium">5,000 FCFA/jour</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Page produit:</span>
                         <span className="font-medium">4,000 FCFA/jour</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Meilleures ventes:</span>
                         <span className="font-medium">3,500 FCFA/jour</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Nouvelles arrivées:</span>
                         <span className="font-medium">3,000 FCFA/jour</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Page vendeur:</span>
                         <span className="font-medium">2,500 FCFA/jour</span>
                       </div>
                     </div>
                     <Button 
                       size="sm" 
                       className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                       onClick={() => openBoostingModal('recommandation')}
                     >
                       <Zap className="h-4 w-4 mr-2" />
                       Lancer Boostage
                     </Button>
                   </CardContent>
                 </Card>

                                 <Card className="bg-white border-orange-200">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-lg flex items-center gap-2">
                       <Target className="h-5 w-5 text-green-600" />
                       Bannière Visuelle
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm text-gray-600 mb-3">
                       Bannières miniatures animées pour maximiser la conversion
                     </p>
                     <div className="space-y-2 text-xs mb-4">
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
                     </div>
                     <Button 
                       size="sm" 
                       className="w-full bg-green-600 hover:bg-green-700 text-white"
                       onClick={() => openBoostingModal('banniere')}
                     >
                       <Zap className="h-4 w-4 mr-2" />
                       Lancer Boostage
                     </Button>
                   </CardContent>
                 </Card>

                                 <Card className="bg-white border-orange-200">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-lg flex items-center gap-2">
                       <Target className="h-5 w-5 text-purple-600" />
                       WhatsApp Marketing
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <p className="text-sm text-gray-600 mb-3">
                       Campagnes ultra-ciblées avec ciblage socio-démographique
                     </p>
                     <div className="space-y-2 text-xs mb-4">
                       <div className="flex justify-between">
                         <span>Ciblage pays:</span>
                         <span className="font-medium">100 FCFA</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Ciblage âge:</span>
                         <span className="font-medium">50 FCFA</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Ciblage profession:</span>
                         <span className="font-medium">75 FCFA</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Paiement FeexPay</span>
                       </div>
                     </div>
                     <Button 
                       size="sm" 
                       className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                       onClick={() => openBoostingModal('whatsapp')}
                     >
                       <Zap className="h-4 w-4 mr-2" />
                       Lancer Boostage
                     </Button>
                   </CardContent>
                 </Card>
              </div>
            </div>

                         {/* Note d'information */}
             <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
               <p className="text-sm text-blue-700">
                 💡 <strong>Conseil :</strong> Chaque boostage lancé sera automatiquement affiché dans l'onglet "Campagnes" 
                 avec un suivi en temps réel de ses performances. Cliquez sur "Lancer Boostage" pour commencer !
               </p>
             </div>
          </div>
        </TabsContent>

        {/* Onglet Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span>Performance des Promotions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de conversion moyen</span>
                    <span className="font-semibold">12.5%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ROI moyen</span>
                    <span className="font-semibold">3.2x</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Promotions les plus populaires</span>
                    <span className="font-semibold">ÉTÉ2024, FLASH50</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-500" />
                  <span>Performance des Campagnes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CTR moyen</span>
                    <span className="font-semibold">8.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CPC moyen</span>
                    <span className="font-semibold">24.5 FCFA</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de conversion</span>
                    <span className="font-semibold">7.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Création Promotion */}
      <Dialog open={showCreatePromotion} onOpenChange={(open) => {
        if (!isLoading) {
          setShowCreatePromotion(open)
          if (!open) resetPromotionForm()
        }
      }}>
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
                setShowCreatePromotion(false)
                resetPromotionForm()
              }} disabled={isLoading}>
                Annuler
              </Button>
              <Button onClick={createPromotion} className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  'Créer la promotion'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Création Campagne */}
      <Dialog open={showCreateCampaign} onOpenChange={(open) => {
        if (!isLoading) {
          setShowCreateCampaign(open)
          if (!open) resetCampaignForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle campagne</DialogTitle>
            <DialogDescription>
              Configurez votre campagne marketing avec tous les paramètres nécessaires
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign-name">Nom de la campagne *</Label>
                <Input
                  id="campaign-name"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                  placeholder="Ex: Campagne Été 2024"
                />
              </div>
              <div>
                <Label htmlFor="campaign-type">Type de campagne</Label>
                <Select 
                  value={campaignForm.type} 
                  onValueChange={(value) => setCampaignForm({...campaignForm, type: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Réseaux sociaux</SelectItem>
                    <SelectItem value="email">Email marketing</SelectItem>
                    <SelectItem value="push">Notifications push</SelectItem>
                    <SelectItem value="banner">Bannières publicitaires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="campaign-budget">Budget (FCFA) *</Label>
                <Input
                  id="campaign-budget"
                  type="number"
                  value={campaignForm.budget}
                  onChange={(e) => setCampaignForm({...campaignForm, budget: Number(e.target.value)})}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label htmlFor="campaign-start">Date de début</Label>
                <Input
                  id="campaign-start"
                  type="date"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({...campaignForm, startDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="campaign-end">Date de fin</Label>
              <Input
                id="campaign-end"
                type="date"
                value={campaignForm.endDate}
                onChange={(e) => setCampaignForm({...campaignForm, endDate: e.target.value})}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowCreateCampaign(false)
                resetCampaignForm()
              }} disabled={isLoading}>
                Annuler
              </Button>
              <Button onClick={createCampaign} className="text-white" style={{ backgroundColor: '#ff6600' }} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  'Créer la campagne'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Services Publicitaires */}
      <Dialog open={showAdvertisingServices} onOpenChange={setShowAdvertisingServices}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Services Publicitaires</DialogTitle>
            <DialogDescription>
              Accédez aux services de publicité et boost de l'administrateur. Paiement sécurisé via FeexPay.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisingServices.map((service) => (
                <Card key={service.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant={service.status === 'available' ? 'default' : 'secondary'}>
                        {service.status === 'available' ? 'Disponible' : 'Indisponible'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold" style={{ color: '#ff6600' }}>
                        {service.price.toLocaleString()} FCFA
                      </span>
                      <span className="text-sm text-gray-500">{service.duration}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Fonctionnalités :</p>
                      <ul className="space-y-1">
                        {service.features.map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4" style={{ color: '#ff6600' }} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button
                      onClick={() => purchaseAdvertisingService(service)}
                      disabled={service.status !== 'available'}
                      className="w-full text-white" style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Acheter via FeexPay
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="border rounded-lg p-4" style={{ backgroundColor: '#f0f0f0', borderColor: '#535455' }}>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 mt-0.5" style={{ color: '#ff6600' }} />
                <div>
                  <h4 className="font-medium" style={{ color: '#535455' }}>Paiement sécurisé</h4>
                  <p className="text-sm mt-1" style={{ color: '#535455' }}>
                    Tous les paiements sont traités de manière sécurisée via FeexPay. 
                    Nous acceptons les cartes de crédit et le mobile money pour votre commodité.
                  </p>
                </div>
              </div>
            </div>
          </div>
                 </DialogContent>
       </Dialog>

       {/* Modal de Boostage Pro */}
       <Dialog open={showBoostingModal} onOpenChange={setShowBoostingModal}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Zap className="h-6 w-6 text-orange-600" />
               {boostingType === 'recommandation' && 'Boostage par Recommandation Ciblée'}
               {boostingType === 'banniere' && 'Boostage par Bannière Visuelle Animée'}
               {boostingType === 'whatsapp' && 'Boostage WhatsApp Marketing Ultra-Ciblé'}
             </DialogTitle>
             <DialogDescription>
               Configurez votre demande de boostage. Elle sera envoyée en attente d'approbation par l'administrateur.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-6">
             {/* Formulaire Recommandation et Bannière */}
             {(boostingType === 'recommandation' || boostingType === 'banniere') && (
               <>
                 {/* Sélection des pages */}
                 <div>
                   <Label className="text-base font-medium">Sélection des pages d'affichage *</Label>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                     {[
                       { name: 'Page d\'accueil', cost: 5000, color: 'bg-blue-100 border-blue-300' },
                       { name: 'Page produit', cost: 4000, color: 'bg-green-100 border-green-300' },
                       { name: 'Meilleures ventes', cost: 3500, color: 'bg-yellow-100 border-yellow-300' },
                       { name: 'Nouvelles arrivées', cost: 3000, color: 'bg-purple-100 border-purple-300' },
                       { name: 'Page vendeur', cost: 2500, color: 'bg-orange-100 border-orange-300' }
                     ].map((page) => (
                       <div
                         key={page.name}
                         className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                           boostingForm.selectedPages.includes(page.name)
                             ? `${page.color} border-2 border-orange-500`
                             : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                         }`}
                         onClick={() => {
                           const newPages = boostingForm.selectedPages.includes(page.name)
                             ? boostingForm.selectedPages.filter(p => p !== page.name)
                             : [...boostingForm.selectedPages, page.name]
                           setBoostingForm({ ...boostingForm, selectedPages: newPages })
                         }}
                       >
                         <div className="flex items-center justify-between">
                           <span className="font-medium text-sm">{page.name}</span>
                           <span className="text-xs text-gray-600">{page.cost.toLocaleString()} FCFA/jour</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Calendrier */}
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="start-date">Date de début *</Label>
                     <Input
                       id="start-date"
                       type="date"
                       value={boostingForm.startDate}
                       onChange={(e) => setBoostingForm({...boostingForm, startDate: e.target.value})}
                     />
                   </div>
                   <div>
                     <Label htmlFor="end-date">Date de fin *</Label>
                     <Input
                       id="end-date"
                       type="date"
                       value={boostingForm.endDate}
                       onChange={(e) => setBoostingForm({...boostingForm, endDate: e.target.value})}
                     />
                   </div>
                 </div>

                 {/* Durée et renouvellement automatique */}
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="duration">Durée en jours</Label>
                     <Input
                       id="duration"
                       type="number"
                       min="1"
                       max="365"
                       value={boostingForm.duration}
                       onChange={(e) => setBoostingForm({...boostingForm, duration: Number(e.target.value)})}
                     />
                   </div>
                   <div className="flex items-center space-x-2">
                                            <Switch
                         id="auto-renewal"
                         checked={boostingForm.autoRenewal}
                         onCheckedChange={(checked: boolean) => setBoostingForm({...boostingForm, autoRenewal: checked})}
                       />
                     <Label htmlFor="auto-renewal">Renouvellement automatique</Label>
                   </div>
                 </div>

                 {/* Calcul du coût estimé */}
                 {boostingForm.selectedPages.length > 0 && (
                   <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                     <h4 className="font-medium text-orange-800 mb-2">Coût estimé</h4>
                     <div className="space-y-1 text-sm">
                       {boostingForm.selectedPages.map(page => {
                         const pageCosts: { [key: string]: number } = {
                           'Page d\'accueil': 5000,
                           'Page produit': 4000,
                           'Meilleures ventes': 3500,
                           'Nouvelles arrivées': 3000,
                           'Page vendeur': 2500
                         }
                         const cost = pageCosts[page] * boostingForm.duration
                         return (
                           <div key={page} className="flex justify-between">
                             <span>{page}:</span>
                             <span className="font-medium">{cost.toLocaleString()} FCFA</span>
                           </div>
                         )
                       })}
                       <div className="border-t pt-2 mt-2">
                         <div className="flex justify-between font-bold">
                           <span>Total ({boostingForm.duration} jours):</span>
                           <span className="text-orange-600">
                             {boostingForm.selectedPages.reduce((total, page) => {
                               const pageCosts: { [key: string]: number } = {
                                 'Page d\'accueil': 5000,
                                 'Page produit': 4000,
                                 'Meilleures ventes': 3500,
                                 'Nouvelles arrivées': 3000,
                                 'Page vendeur': 2500
                               }
                               return total + (pageCosts[page] * boostingForm.duration)
                             }, 0).toLocaleString()} FCFA
                           </span>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </>
             )}

             {/* Formulaire spécifique à la Bannière */}
             {boostingType === 'banniere' && (
               <>
                 <div className="border-t pt-6">
                   <h4 className="font-medium text-lg mb-4">Configuration de la Bannière</h4>
                   
                   <div className="space-y-4">
                     <div>
                       <Label htmlFor="banner-image">Image de la bannière *</Label>
                       <Input
                         id="banner-image"
                         type="file"
                         accept="image/*"
                         onChange={(e) => {
                           const file = e.target.files?.[0]
                           if (file) setBoostingForm({...boostingForm, bannerImage: file})
                         }}
                       />
                       <p className="text-xs text-gray-500 mt-1">
                         Format recommandé: 300x200px, JPG/PNG, max 2MB
                       </p>
                     </div>

                     <div>
                       <Label htmlFor="banner-title">Titre accrocheur *</Label>
                       <Input
                         id="banner-title"
                         placeholder="Ex: Promotion exceptionnelle !"
                         value={boostingForm.bannerTitle}
                         onChange={(e) => setBoostingForm({...boostingForm, bannerTitle: e.target.value})}
                       />
                     </div>

                     <div>
                       <Label htmlFor="banner-description">Description courte *</Label>
                       <Textarea
                         id="banner-description"
                         placeholder="Ex: Découvrez nos produits avec des réductions allant jusqu'à 50%"
                         rows={3}
                         value={boostingForm.bannerDescription}
                         onChange={(e) => setBoostingForm({...boostingForm, bannerDescription: e.target.value})}
                       />
                     </div>
                   </div>
                 </div>
               </>
             )}

             {/* Formulaire spécifique au WhatsApp */}
             {boostingType === 'whatsapp' && (
               <>
                 <div className="border-t pt-6">
                   <h4 className="font-medium text-lg mb-4">Configuration WhatsApp Marketing</h4>
                   
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label htmlFor="target-count">Nombre de cibles souhaitées</Label>
                       <Input
                         id="target-count"
                         type="number"
                         min="10"
                         max="10000"
                         value={boostingForm.targetCount}
                         onChange={(e) => setBoostingForm({...boostingForm, targetCount: Number(e.target.value)})}
                       />
                     </div>
                     <div>
                       <Label htmlFor="target-country">Ciblage pays</Label>
                       <Select 
                         value={boostingForm.targetCountry} 
                         onValueChange={(value) => setBoostingForm({...boostingForm, targetCountry: value})}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Tous">Tous les pays</SelectItem>
                           
                           {/* Afrique */}
                           <SelectItem value="africa" disabled className="font-semibold text-gray-500">🌍 AFRIQUE</SelectItem>
                           <SelectItem value="Algérie">🇩🇿 Algérie</SelectItem>
                           <SelectItem value="Angola">🇦🇴 Angola</SelectItem>
                           <SelectItem value="Bénin">🇧🇯 Bénin</SelectItem>
                           <SelectItem value="Botswana">🇧🇼 Botswana</SelectItem>
                           <SelectItem value="Burkina Faso">🇧🇫 Burkina Faso</SelectItem>
                           <SelectItem value="Burundi">🇧🇮 Burundi</SelectItem>
                           <SelectItem value="Cameroun">🇨🇲 Cameroun</SelectItem>
                           <SelectItem value="Cap-Vert">🇨🇻 Cap-Vert</SelectItem>
                           <SelectItem value="République centrafricaine">🇨🇫 République centrafricaine</SelectItem>
                           <SelectItem value="Tchad">🇹🇩 Tchad</SelectItem>
                           <SelectItem value="Comores">🇰🇲 Comores</SelectItem>
                           <SelectItem value="Congo">🇨🇬 Congo</SelectItem>
                           <SelectItem value="RD Congo">🇨🇩 RD Congo</SelectItem>
                           <SelectItem value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</SelectItem>
                           <SelectItem value="Djibouti">🇩🇯 Djibouti</SelectItem>
                           <SelectItem value="Égypte">🇪🇬 Égypte</SelectItem>
                           <SelectItem value="Guinée équatoriale">🇬🇶 Guinée équatoriale</SelectItem>
                           <SelectItem value="Érythrée">🇪🇷 Érythrée</SelectItem>
                           <SelectItem value="Éthiopie">🇪🇹 Éthiopie</SelectItem>
                           <SelectItem value="Gabon">🇬🇦 Gabon</SelectItem>
                           <SelectItem value="Gambie">🇬🇲 Gambie</SelectItem>
                           <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                           <SelectItem value="Guinée">🇬🇳 Guinée</SelectItem>
                           <SelectItem value="Guinée-Bissau">🇬🇼 Guinée-Bissau</SelectItem>
                           <SelectItem value="Kenya">🇰🇪 Kenya</SelectItem>
                           <SelectItem value="Lesotho">🇱🇸 Lesotho</SelectItem>
                           <SelectItem value="Liberia">🇱🇷 Liberia</SelectItem>
                           <SelectItem value="Libye">🇱🇾 Libye</SelectItem>
                           <SelectItem value="Madagascar">🇲🇬 Madagascar</SelectItem>
                           <SelectItem value="Malawi">🇲🇼 Malawi</SelectItem>
                           <SelectItem value="Mali">🇲🇱 Mali</SelectItem>
                           <SelectItem value="Mauritanie">🇲🇷 Mauritanie</SelectItem>
                           <SelectItem value="Maurice">🇲🇺 Maurice</SelectItem>
                           <SelectItem value="Maroc">🇲🇦 Maroc</SelectItem>
                           <SelectItem value="Mozambique">🇲🇿 Mozambique</SelectItem>
                           <SelectItem value="Namibie">🇳🇦 Namibie</SelectItem>
                           <SelectItem value="Niger">🇳🇪 Niger</SelectItem>
                           <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                           <SelectItem value="Rwanda">🇷🇼 Rwanda</SelectItem>
                           <SelectItem value="Sao Tomé-et-Principe">🇸🇹 Sao Tomé-et-Principe</SelectItem>
                           <SelectItem value="Sénégal">🇸🇳 Sénégal</SelectItem>
                           <SelectItem value="Seychelles">🇸🇨 Seychelles</SelectItem>
                           <SelectItem value="Sierra Leone">🇸🇱 Sierra Leone</SelectItem>
                           <SelectItem value="Somalie">🇸🇴 Somalie</SelectItem>
                           <SelectItem value="Afrique du Sud">🇿🇦 Afrique du Sud</SelectItem>
                           <SelectItem value="Soudan du Sud">🇸🇸 Soudan du Sud</SelectItem>
                           <SelectItem value="Soudan">🇸🇩 Soudan</SelectItem>
                           <SelectItem value="Eswatini">🇸🇿 Eswatini</SelectItem>
                           <SelectItem value="Tanzanie">🇹🇿 Tanzanie</SelectItem>
                           <SelectItem value="Togo">🇹🇬 Togo</SelectItem>
                           <SelectItem value="Tunisie">🇹🇳 Tunisie</SelectItem>
                           <SelectItem value="Ouganda">🇺🇬 Ouganda</SelectItem>
                           <SelectItem value="Zambie">🇿🇲 Zambie</SelectItem>
                           <SelectItem value="Zimbabwe">🇿🇼 Zimbabwe</SelectItem>
                           
                           {/* Amérique */}
                           <SelectItem value="america" disabled className="font-semibold text-gray-500">🌎 AMÉRIQUE</SelectItem>
                           <SelectItem value="Argentine">🇦🇷 Argentine</SelectItem>
                           <SelectItem value="Bolivie">🇧🇴 Bolivie</SelectItem>
                           <SelectItem value="Brésil">🇧🇷 Brésil</SelectItem>
                           <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                           <SelectItem value="Chili">🇨🇱 Chili</SelectItem>
                           <SelectItem value="Colombie">🇨🇴 Colombie</SelectItem>
                           <SelectItem value="Costa Rica">🇨🇷 Costa Rica</SelectItem>
                           <SelectItem value="Cuba">🇨🇺 Cuba</SelectItem>
                           <SelectItem value="République dominicaine">🇩🇴 République dominicaine</SelectItem>
                           <SelectItem value="Équateur">🇪🇨 Équateur</SelectItem>
                           <SelectItem value="El Salvador">🇸🇻 El Salvador</SelectItem>
                           <SelectItem value="Guatemala">🇬🇹 Guatemala</SelectItem>
                           <SelectItem value="Guyana">🇬🇾 Guyana</SelectItem>
                           <SelectItem value="Haïti">🇭🇹 Haïti</SelectItem>
                           <SelectItem value="Honduras">🇭🇳 Honduras</SelectItem>
                           <SelectItem value="Jamaïque">🇯🇲 Jamaïque</SelectItem>
                           <SelectItem value="Mexique">🇲🇽 Mexique</SelectItem>
                           <SelectItem value="Nicaragua">🇳🇮 Nicaragua</SelectItem>
                           <SelectItem value="Panama">🇵🇦 Panama</SelectItem>
                           <SelectItem value="Paraguay">🇵🇾 Paraguay</SelectItem>
                           <SelectItem value="Pérou">🇵🇪 Pérou</SelectItem>
                           <SelectItem value="Suriname">🇸🇷 Suriname</SelectItem>
                           <SelectItem value="Uruguay">🇺🇾 Uruguay</SelectItem>
                           <SelectItem value="États-Unis">🇺🇸 États-Unis</SelectItem>
                           <SelectItem value="Venezuela">🇻🇪 Venezuela</SelectItem>
                           
                           {/* Asie */}
                           <SelectItem value="asia" disabled className="font-semibold text-gray-500">🌏 ASIE</SelectItem>
                           <SelectItem value="Afghanistan">🇦🇫 Afghanistan</SelectItem>
                           <SelectItem value="Arménie">🇦🇲 Arménie</SelectItem>
                           <SelectItem value="Azerbaïdjan">🇦🇿 Azerbaïdjan</SelectItem>
                           <SelectItem value="Bahreïn">🇧🇭 Bahreïn</SelectItem>
                           <SelectItem value="Bangladesh">🇧🇩 Bangladesh</SelectItem>
                           <SelectItem value="Bhoutan">🇧🇹 Bhoutan</SelectItem>
                           <SelectItem value="Brunei">🇧🇳 Brunei</SelectItem>
                           <SelectItem value="Cambodge">🇰🇭 Cambodge</SelectItem>
                           <SelectItem value="Chine">🇨🇳 Chine</SelectItem>
                           <SelectItem value="Chypre">🇨🇾 Chypre</SelectItem>
                           <SelectItem value="Géorgie">🇬🇪 Géorgie</SelectItem>
                           <SelectItem value="Inde">🇮🇳 Inde</SelectItem>
                           <SelectItem value="Indonésie">🇮🇩 Indonésie</SelectItem>
                           <SelectItem value="Iran">🇮🇷 Iran</SelectItem>
                           <SelectItem value="Irak">🇮🇶 Irak</SelectItem>
                           <SelectItem value="Israël">🇮🇱 Israël</SelectItem>
                           <SelectItem value="Japon">🇯🇵 Japon</SelectItem>
                           <SelectItem value="Jordanie">🇯🇴 Jordanie</SelectItem>
                           <SelectItem value="Kazakhstan">🇰🇿 Kazakhstan</SelectItem>
                           <SelectItem value="Koweït">🇰🇼 Koweït</SelectItem>
                           <SelectItem value="Kirghizistan">🇰🇬 Kirghizistan</SelectItem>
                           <SelectItem value="Laos">🇱🇦 Laos</SelectItem>
                           <SelectItem value="Liban">🇱🇧 Liban</SelectItem>
                           <SelectItem value="Malaisie">🇲🇾 Malaisie</SelectItem>
                           <SelectItem value="Maldives">🇲🇻 Maldives</SelectItem>
                           <SelectItem value="Mongolie">🇲🇳 Mongolie</SelectItem>
                           <SelectItem value="Myanmar">🇲🇲 Myanmar</SelectItem>
                           <SelectItem value="Népal">🇳🇵 Népal</SelectItem>
                           <SelectItem value="Oman">🇴🇲 Oman</SelectItem>
                           <SelectItem value="Pakistan">🇵🇰 Pakistan</SelectItem>
                           <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
                           <SelectItem value="Qatar">🇶🇦 Qatar</SelectItem>
                           <SelectItem value="Arabie saoudite">🇸🇦 Arabie saoudite</SelectItem>
                           <SelectItem value="Singapour">🇸🇬 Singapour</SelectItem>
                           <SelectItem value="Sri Lanka">🇱🇰 Sri Lanka</SelectItem>
                           <SelectItem value="Syrie">🇸🇾 Syrie</SelectItem>
                           <SelectItem value="Taïwan">🇹🇼 Taïwan</SelectItem>
                           <SelectItem value="Tadjikistan">🇹🇯 Tadjikistan</SelectItem>
                           <SelectItem value="Thaïlande">🇹🇭 Thaïlande</SelectItem>
                           <SelectItem value="Turquie">🇹🇷 Turquie</SelectItem>
                           <SelectItem value="Turkménistan">🇹🇲 Turkménistan</SelectItem>
                           <SelectItem value="Émirats arabes unis">🇦🇪 Émirats arabes unis</SelectItem>
                           <SelectItem value="Ouzbékistan">🇺🇿 Ouzbékistan</SelectItem>
                           <SelectItem value="Vietnam">🇻🇳 Vietnam</SelectItem>
                           <SelectItem value="Yémen">🇾🇪 Yémen</SelectItem>
                           
                           {/* Europe */}
                           <SelectItem value="europe" disabled className="font-semibold text-gray-500">🇪🇺 EUROPE</SelectItem>
                           <SelectItem value="Albanie">🇦🇱 Albanie</SelectItem>
                           <SelectItem value="Andorre">🇦🇩 Andorre</SelectItem>
                           <SelectItem value="Autriche">🇦🇹 Autriche</SelectItem>
                           <SelectItem value="Belgique">🇧🇪 Belgique</SelectItem>
                           <SelectItem value="Bosnie-Herzégovine">🇧🇦 Bosnie-Herzégovine</SelectItem>
                           <SelectItem value="Bulgarie">🇧🇬 Bulgarie</SelectItem>
                           <SelectItem value="Croatie">🇭🇷 Croatie</SelectItem>
                           <SelectItem value="République tchèque">🇨🇿 République tchèque</SelectItem>
                           <SelectItem value="Danemark">🇩🇰 Danemark</SelectItem>
                           <SelectItem value="Estonie">🇪🇪 Estonie</SelectItem>
                           <SelectItem value="Finlande">🇫🇮 Finlande</SelectItem>
                           <SelectItem value="France">🇫🇷 France</SelectItem>
                           <SelectItem value="Allemagne">🇩🇪 Allemagne</SelectItem>
                           <SelectItem value="Grèce">🇬🇷 Grèce</SelectItem>
                           <SelectItem value="Hongrie">🇭🇺 Hongrie</SelectItem>
                           <SelectItem value="Islande">🇮🇸 Islande</SelectItem>
                           <SelectItem value="Irlande">🇮🇪 Irlande</SelectItem>
                           <SelectItem value="Italie">🇮🇹 Italie</SelectItem>
                           <SelectItem value="Lettonie">🇱🇻 Lettonie</SelectItem>
                           <SelectItem value="Liechtenstein">🇱🇮 Liechtenstein</SelectItem>
                           <SelectItem value="Lituanie">🇱🇹 Lituanie</SelectItem>
                           <SelectItem value="Luxembourg">🇱🇺 Luxembourg</SelectItem>
                           <SelectItem value="Malte">🇲🇹 Malte</SelectItem>
                           <SelectItem value="Moldavie">🇲🇩 Moldavie</SelectItem>
                           <SelectItem value="Monaco">🇲🇨 Monaco</SelectItem>
                           <SelectItem value="Monténégro">🇲🇪 Monténégro</SelectItem>
                           <SelectItem value="Pays-Bas">🇳🇱 Pays-Bas</SelectItem>
                           <SelectItem value="Macédoine du Nord">🇲🇰 Macédoine du Nord</SelectItem>
                           <SelectItem value="Norvège">🇳🇴 Norvège</SelectItem>
                           <SelectItem value="Pologne">🇵🇱 Pologne</SelectItem>
                           <SelectItem value="Portugal">🇵🇹 Portugal</SelectItem>
                           <SelectItem value="Roumanie">🇷🇴 Roumanie</SelectItem>
                           <SelectItem value="Russie">🇷🇺 Russie</SelectItem>
                           <SelectItem value="Saint-Marin">🇸🇲 Saint-Marin</SelectItem>
                           <SelectItem value="Serbie">🇷🇸 Serbie</SelectItem>
                           <SelectItem value="Slovaquie">🇸🇰 Slovaquie</SelectItem>
                           <SelectItem value="Slovénie">🇸🇮 Slovénie</SelectItem>
                           <SelectItem value="Espagne">🇪🇸 Espagne</SelectItem>
                           <SelectItem value="Suède">🇸🇪 Suède</SelectItem>
                           <SelectItem value="Suisse">🇨🇭 Suisse</SelectItem>
                           <SelectItem value="Ukraine">🇺🇦 Ukraine</SelectItem>
                           <SelectItem value="Royaume-Uni">🇬🇧 Royaume-Uni</SelectItem>
                           <SelectItem value="Vatican">🇻🇦 Vatican</SelectItem>
                           
                           {/* Océanie */}
                           <SelectItem value="oceania" disabled className="font-semibold text-gray-500">🌊 OCÉANIE</SelectItem>
                           <SelectItem value="Australie">🇦🇺 Australie</SelectItem>
                           <SelectItem value="Fidji">🇫🇯 Fidji</SelectItem>
                           <SelectItem value="Kiribati">🇰🇮 Kiribati</SelectItem>
                           <SelectItem value="Îles Marshall">🇲🇭 Îles Marshall</SelectItem>
                           <SelectItem value="Micronésie">🇫🇲 Micronésie</SelectItem>
                           <SelectItem value="Nauru">🇳🇷 Nauru</SelectItem>
                           <SelectItem value="Nouvelle-Zélande">🇳🇿 Nouvelle-Zélande</SelectItem>
                           <SelectItem value="Palaos">🇵🇼 Palaos</SelectItem>
                           <SelectItem value="Papouasie-Nouvelle-Guinée">🇵🇬 Papouasie-Nouvelle-Guinée</SelectItem>
                           <SelectItem value="Samoa">🇼🇸 Samoa</SelectItem>
                           <SelectItem value="Îles Salomon">🇸🇧 Îles Salomon</SelectItem>
                           <SelectItem value="Tonga">🇹🇴 Tonga</SelectItem>
                           <SelectItem value="Tuvalu">🇹🇻 Tuvalu</SelectItem>
                           <SelectItem value="Vanuatu">🇻🇺 Vanuatu</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-4">
                     <div>
                       <Label htmlFor="target-age">Ciblage âge</Label>
                       <Select 
                         value={boostingForm.targetAge} 
                         onValueChange={(value) => setBoostingForm({...boostingForm, targetAge: value})}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Tous">Tous âges</SelectItem>
                           <SelectItem value="18-25">18-25 ans</SelectItem>
                           <SelectItem value="26-35">26-35 ans</SelectItem>
                           <SelectItem value="36-45">36-45 ans</SelectItem>
                           <SelectItem value="46+">46+ ans</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <Label htmlFor="target-profession">Ciblage profession</Label>
                       <Select 
                         value={boostingForm.targetProfession} 
                         onValueChange={(value) => setBoostingForm({...boostingForm, targetProfession: value})}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Tous">Toutes professions</SelectItem>
                           <SelectItem value="Étudiant">Étudiant</SelectItem>
                           <SelectItem value="Salarié">Salarié</SelectItem>
                           <SelectItem value="Entrepreneur">Entrepreneur</SelectItem>
                           <SelectItem value="Retraité">Retraité</SelectItem>
                           <SelectItem value="Profession personnalisée">Profession personnalisée</SelectItem>
                         </SelectContent>
                       </Select>
                       
                       {/* Champ pour la profession personnalisée */}
                       {boostingForm.targetProfession === 'Profession personnalisée' && (
                         <div className="mt-2">
                           <Input
                             placeholder="Entrez votre profession"
                             value={boostingForm.targetCustomProfession}
                             onChange={(e) => setBoostingForm({...boostingForm, targetCustomProfession: e.target.value})}
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
                         id="target-probooster-clients"
                         checked={boostingForm.targetProboosterClients || false}
                         onChange={(e) => setBoostingForm({...boostingForm, targetProboosterClients: e.target.checked})}
                         className="rounded"
                       />
                       <Label htmlFor="target-probooster-clients" className="text-sm font-medium">Ciblé clients de Probooster</Label>
                     </div>
                     <p className="text-xs text-gray-500 mt-1">
                       Permet de cibler spécifiquement les utilisateurs actifs de la plateforme Probooster
                     </p>
                   </div>

                   <div className="mt-4">
                     <Label htmlFor="whatsapp-image">Image du produit</Label>
                     <Input
                       id="whatsapp-image"
                       type="file"
                       accept="image/*"
                       onChange={(e) => {
                         const file = e.target.files?.[0]
                         if (file) setBoostingForm({...boostingForm, whatsappImage: file})
                       }}
                     />
                   </div>

                   <div className="mt-4">
                     <Label htmlFor="whatsapp-title">Titre du message *</Label>
                       <Input
                         id="whatsapp-title"
                         placeholder="Ex: Découvrez notre nouveau produit !"
                         value={boostingForm.whatsappTitle}
                         onChange={(e) => setBoostingForm({...boostingForm, whatsappTitle: e.target.value})}
                       />
                   </div>

                   <div className="mt-4">
                     <Label htmlFor="whatsapp-description">Description du produit</Label>
                     <Textarea
                       id="whatsapp-description"
                       placeholder="Ex: Produit de qualité exceptionnelle à prix réduit"
                       rows={3}
                       value={boostingForm.whatsappDescription}
                       onChange={(e) => setBoostingForm({...boostingForm, whatsappDescription: e.target.value})}
                     />
                   </div>

                   <div className="mt-4">
                     <Label htmlFor="whatsapp-message">Message personnalisé *</Label>
                     <Textarea
                       id="whatsapp-message"
                       placeholder="Ex: Bonjour ! Nous avons une offre spéciale pour vous..."
                       rows={4}
                       value={boostingForm.whatsappMessage}
                       onChange={(e) => setBoostingForm({...boostingForm, whatsappMessage: e.target.value})}
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4 mt-4">
                     <div>
                       <Label htmlFor="whatsapp-link">Lien direct vers le produit</Label>
                       <Input
                         id="whatsapp-link"
                         placeholder="https://..."
                         value={boostingForm.whatsappLink}
                         onChange={(e) => setBoostingForm({...boostingForm, whatsappLink: e.target.value})}
                       />
                     </div>
                     <div>
                       <Label htmlFor="sender-whatsapp">Numéro WhatsApp expéditeur *</Label>
                       <Input
                         id="sender-whatsapp"
                         placeholder="+225 01234567"
                         value={boostingForm.senderWhatsapp}
                         onChange={(e) => setBoostingForm({...boostingForm, senderWhatsapp: e.target.value})}
                       />
                     </div>
                   </div>

                   {/* Calcul du coût WhatsApp */}
                   <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
                     <h4 className="font-medium text-purple-800 mb-2">Coût estimé WhatsApp</h4>
                     <div className="space-y-1 text-sm">
                       <div className="flex justify-between">
                         <span>Nombre de cibles:</span>
                         <span>{boostingForm.targetCount.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span>Coût par cible:</span>
                         <span>0.5 FCFA</span>
                       </div>
                       {boostingForm.targetProboosterClients && (
                         <div className="flex justify-between">
                           <span>Bonus ciblage Probooster:</span>
                           <span className="text-green-600">+0.1 FCFA</span>
                         </div>
                       )}
                       <div className="border-t pt-2 mt-2">
                         <div className="flex justify-between font-bold">
                           <span>Total:</span>
                           <span className="text-purple-600">
                             {boostingForm.targetProboosterClients 
                               ? ((boostingForm.targetCount * 0.6).toFixed(0))
                               : (boostingForm.targetCount * 0.5).toFixed(0)
                             } FCFA
                           </span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </>
             )}

             {/* Actions */}
             <div className="flex justify-end space-x-3 pt-6 border-t">
               <Button variant="outline" onClick={() => setShowBoostingModal(false)}>
                 Annuler
               </Button>
                                <Button 
                   onClick={createBoostingCampaign}
                   className="bg-orange-600 hover:bg-orange-700 text-white"
                   disabled={
                     (boostingType === 'recommandation' || boostingType === 'banniere') && 
                     (boostingForm.selectedPages.length === 0 || !boostingForm.startDate || !boostingForm.endDate)
                   }
                 >
                   <Zap className="h-4 w-4 mr-2" />
                   Envoyer la Demande
                 </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
 }

*/
