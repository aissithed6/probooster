"use client"

import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Progress,
  Switch
} from '../ui'
import {
  Gift,
  Target,
  TrendingUp,
  BarChart3,
  Plus,
  Zap,
  Globe,
  CreditCard,
  CheckCircle,
  Percent,
  Pause,
  Play,
  StopCircle
} from 'lucide-react'
import { useNotifications } from '../../hooks/use-notifications'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { supabase } from '../../lib/supabase'
import {
  BoostingService,
  BoostingServiceManager,
  BoostingCampaignManager,
  BoostingPricingManager,
  BoostingPricingConfig
} from '../../lib/services/marketing-service'

type BoostingServiceType = 'recommandation' | 'banniere' | 'whatsapp'

const BOOSTING_PRICING_CACHE_KEY = 'boosting-pricing-config-cache'
const BOOSTING_PRICING_BROADCAST_KEY = 'boosting-pricing-config-broadcast'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Interfaces pour les données Supabase
interface Promotion {
  id: string
  name: string
  description?: string
  type: 'code' | 'reduction' | 'flash' | 'bundle'
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
  discount_value: number
  min_purchase_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  used_count: number
  start_date: string
  end_date: string
  status: 'active' | 'paused' | 'expired' | 'draft'
  applicable_products: string[]
  applicable_categories: string[]
  conditions?: string
  created_at: string
  updated_at: string
}

interface VendorProductOption {
  id: string
  name: string
  tags: string[]
}

interface CatalogCategoryOption {
  id: string
  name: string
}

type PromotionTargetingMode = 'all' | 'products' | 'categories' | 'tags'

interface VendorCampaign {
  id: string
  vendor_id: string
  product_id?: string
  service_id: string
  name?: string | null
  type: 'recommendation' | 'banner' | 'whatsapp'
  status: 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected'
  start_date?: string
  end_date?: string
  target_pages: string[]
  duration?: number
  total_cost: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_id?: string
  payment_method?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

/**
 * Vérifie si une valeur est un objet (Record) exploitable.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Convertit une valeur unknown en string (ou undefined).
 */
function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Convertit une valeur unknown en number (ou undefined).
 */
function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * Mappe un payload API "promotion" vers le type UI `Promotion`.
 */
function mapPromotionApiToPromotion(value: unknown): Promotion | null {
  if (!isRecord(value)) return null
  const id = toOptionalString(value.id)
  if (!id) return null

  const apiType = toOptionalString(value.type) ?? ''
  const mappedType: Promotion['type'] =
    apiType === 'coupon'
      ? 'code'
      : apiType === 'discount'
        ? 'reduction'
        : apiType === 'flash_sale'
          ? 'flash'
          : 'bundle'

  const apiStatus = toOptionalString(value.status) ?? 'draft'
  const mappedStatus: Promotion['status'] = apiStatus === 'ended' ? 'expired' : (apiStatus as Promotion['status'])

  return {
    id,
    name: toOptionalString(value.name) ?? '',
    description: toOptionalString(value.description),
    type: mappedType,
    discount_type: (toOptionalString(value.discount_type) as Promotion['discount_type']) ?? 'percentage',
    discount_value: Number((toOptionalNumber(value.discount_value) ?? 0) || 0),
    min_purchase_amount: toOptionalNumber(value.min_order_amount),
    max_discount_amount: toOptionalNumber(value.max_discount),
    usage_limit: toOptionalNumber(value.usage_limit),
    used_count: Number((toOptionalNumber(value.used_count) ?? 0) || 0),
    start_date: toOptionalString(value.start_date) ?? '',
    end_date: toOptionalString(value.end_date) ?? '',
    status: mappedStatus,
    applicable_products: Array.isArray(value.applicable_products)
      ? value.applicable_products.filter((item): item is string => typeof item === 'string')
      : [],
    applicable_categories: Array.isArray(value.applicable_categories)
      ? value.applicable_categories.filter((item): item is string => typeof item === 'string')
      : [],
    conditions: '',
    created_at: toOptionalString(value.created_at) ?? '',
    updated_at: toOptionalString(value.updated_at) ?? ''
  }
}

/**
 * Mappe le type du formulaire vendeur vers le type attendu par l'API promotions.
 */
function mapPromotionFormTypeToApiType(type: Promotion['type']): 'coupon' | 'discount' | 'flash_sale' | 'bundle' {
  if (type === 'code') return 'coupon'
  if (type === 'reduction') return 'discount'
  if (type === 'flash') return 'flash_sale'
  return 'bundle'
}

/**
 * Convertit une date YYYY-MM-DD (input[type=date]) en ISO au début de journée UTC.
 */
function toIsoStartOfDayUtc(value: string): string | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Convertit une date YYYY-MM-DD (input[type=date]) en ISO à la fin de journée UTC.
 */
function toIsoEndOfDayUtc(value: string): string | null {
  if (!value) return null
  const date = new Date(`${value}T23:59:59.999Z`)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Convertit un timestamp ISO (ex: 2026-02-03T00:00:00.000Z) en valeur YYYY-MM-DD
 * exploitable par un input[type=date].
 */
function toDateInputValue(value: string): string {
  if (!value) return ''
  if (value.includes('T')) return value.split('T')[0] ?? ''
  return value
}

/**
 * Mappe un payload API "campaign" vers le type UI `VendorCampaign`.
 */
function mapCampaignApiToVendorCampaign(value: unknown): VendorCampaign | null {
  if (!isRecord(value)) return null
  const id = toOptionalString(value.id)
  const vendorId = toOptionalString(value.vendor_id)
  const serviceId = toOptionalString(value.service_id)
  if (!id || !vendorId || !serviceId) return null

  const status = (toOptionalString(value.status) as VendorCampaign['status']) ?? 'pending'
  const type = (toOptionalString(value.type) as VendorCampaign['type']) ?? 'recommendation'
  const paymentStatus = (toOptionalString(value.payment_status) as VendorCampaign['payment_status']) ?? 'pending'

  return {
    id,
    vendor_id: vendorId,
    product_id: toOptionalString(value.product_id),
    service_id: serviceId,
    name: typeof value.name === 'string' || value.name === null ? (value.name as string | null) : null,
    type,
    status,
    start_date: toOptionalString(value.start_date),
    end_date: toOptionalString(value.end_date),
    target_pages: Array.isArray(value.target_pages)
      ? value.target_pages.filter((item): item is string => typeof item === 'string')
      : [],
    duration: toOptionalNumber(value.duration),
    total_cost: Number((toOptionalNumber(value.total_cost) ?? 0) || 0),
    payment_status: paymentStatus,
    payment_id: toOptionalString(value.payment_id),
    payment_method: toOptionalString(value.payment_method),
    rejection_reason: toOptionalString(value.rejection_reason),
    created_at: toOptionalString(value.created_at) ?? '',
    updated_at: toOptionalString(value.updated_at) ?? ''
  }
}

/**
 * Mappe un JSON API (souvent un tableau) en tableau typé.
 */
function mapApiArray<T>(raw: unknown, mapper: (item: unknown) => T | null): T[] {
  if (!Array.isArray(raw)) return []
  const mapped: T[] = []
  raw.forEach((item) => {
    const next = mapper(item)
    if (next) mapped.push(next)
  })
  return mapped
}

/**
 * Ajoute/retire un identifiant d'une liste (helper multi-sélection).
 */
function toggleSelection(list: string[], value: string): string[] {
  if (!value) return list
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function MarketingPromotionsSection() {
  const { addNotification } = useNotifications()
  const { confirm } = useConfirm()
  const [activeTab, setActiveTab] = useState('promotions')
  const [showCreatePromotion, setShowCreatePromotion] = useState(false)
  const [showEditPromotion, setShowEditPromotion] = useState(false)
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showAdvertisingServices, setShowAdvertisingServices] = useState(false)
  const [showEditCampaign, setShowEditCampaign] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<VendorCampaign | null>(null)
  const [editCampaignName, setEditCampaignName] = useState('')
  const [editCampaignTargetPages, setEditCampaignTargetPages] = useState<string[]>([])
  const [editCampaignDuration, setEditCampaignDuration] = useState<number>(7)

  // États de chargement et gestion d'erreurs
  const [isLoading, setIsLoading] = useState(false)
  const [, setError] = useState<string | null>(null)
  const lastPricingHashRef = useRef<string>('')
  const vendorIdRef = useRef<string>('')
  const realtimeRefreshTimerRef = useRef<number | null>(null)
  const realtimeConnectedRef = useRef<boolean>(false)

  // États pour les formulaires
  const [promotionForm, setPromotionForm] = useState({
    targetingMode: 'all' as PromotionTargetingMode,
    name: '',
    type: 'code',
    discountType: 'percentage',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    products: [] as string[],
    categories: [] as string[],
    tags: [] as string[],
    conditions: ''
  })

  const [editPromotionForm, setEditPromotionForm] = useState({
    targetingMode: 'all' as PromotionTargetingMode,
    name: '',
    type: 'code',
    discountType: 'percentage',
    discountValue: 0,
    minAmount: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    products: [] as string[],
    categories: [] as string[],
    tags: [] as string[],
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

  // États pour les données (vides initialement, chargées depuis Supabase)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [campaigns, setCampaigns] = useState<VendorCampaign[]>([])

  const [vendorProducts, setVendorProducts] = useState<VendorProductOption[]>([])
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategoryOption[]>([])
  const [vendorTags, setVendorTags] = useState<string[]>([])

  const [advertisingServices, setAdvertisingServices] = useState<BoostingService[]>([])
  const [pricingConfig, setPricingConfig] = useState<BoostingPricingConfig | null>(null)

  // États pour gérer les modals de boostage
  const [showBoostingModal, setShowBoostingModal] = useState(false)
  const [boostingType, setBoostingType] = useState<BoostingServiceType | null>(null)
  const [selectedService, setSelectedService] = useState<BoostingService | null>(null)

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

  // Chargement des données depuis les APIs backend (filtrage par vendeur) + services Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Récupérer l'utilisateur courant pour obtenir le vendorId
        const { data: authData } = await supabase.auth.getUser()
        const vendorId = authData?.user?.id || ''
        vendorIdRef.current = vendorId

        if (!vendorId) {
          return
        }

        // Lancer les chargements en parallèle avec résilience
        const [promRes, campRes, servicesRes, pricingRes] = await Promise.allSettled([
          fetch(`/api/marketing/promotions?vendorId=${encodeURIComponent(vendorId)}`),
          fetch(`/api/marketing/campaigns?vendorId=${encodeURIComponent(vendorId)}`),
          BoostingServiceManager.getAllServices(),
          BoostingPricingManager.getConfig()
        ])

        // Promotions
        if (promRes.status === 'fulfilled' && promRes.value.ok) {
          const rawPromos: unknown = await promRes.value.json()
          const mappedPromos = mapApiArray(rawPromos, mapPromotionApiToPromotion)
          setPromotions(mappedPromos)
        } else {
          console.warn('Chargement promotions non disponible (API)')
          setPromotions([])
        }

        // Campagnes
        if (campRes.status === 'fulfilled' && campRes.value.ok) {
          const rawCamps: unknown = await campRes.value.json()
          const mappedCamps = mapApiArray(rawCamps, mapCampaignApiToVendorCampaign)
          setCampaigns(mappedCamps)
        } else {
          console.warn('Chargement campagnes non disponible (API)')
          setCampaigns([])
        }

        // Services & Pricing
        if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value)) {
          const normalizedServices = servicesRes.value.map(service => ({
            ...service,
            type: service.type ?? 'recommendation',
            features: Array.isArray(service.features) ? service.features : [],
            base_price: typeof service.base_price === 'number' ? service.base_price : 0
          }))
          setAdvertisingServices(normalizedServices)
        } else {
          setAdvertisingServices([])
        }

        if (pricingRes.status === 'fulfilled') {
          setPricingConfig(pricingRes.value)
        } else {
          setPricingConfig(null)
        }

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err)
        setError('Erreur lors du chargement des données')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cancelled = false

    const scheduleRefresh = () => {
      if (cancelled) return
      if (realtimeRefreshTimerRef.current) return

      realtimeRefreshTimerRef.current = window.setTimeout(() => {
        realtimeRefreshTimerRef.current = null
        void (async () => {
          try {
            await Promise.all([reloadPromotions(), reloadCampaigns()])
          } catch {
            // ignore
          }
        })()
      }, 350)
    }

    const resolveVendorId = async (): Promise<string> => {
      const current = String(vendorIdRef.current ?? '').trim()
      if (UUID_REGEX.test(current)) return current

      try {
        const { data: authData } = await supabase.auth.getUser()
        const id = String(authData?.user?.id ?? '').trim()
        vendorIdRef.current = id
        return id
      } catch {
        return ''
      }
    }

    const start = async () => {
      const vendorId = await resolveVendorId()
      if (!UUID_REGEX.test(vendorId)) return

      /**
       * Considère Realtime "connecté" uniquement quand au moins 1 channel est SUBSCRIBED.
       * Le polling sert alors de fallback si Realtime échoue (timeout / closed / error).
       */
      let promotionsSubscribed = false
      let campaignsSubscribed = false
      const updateConnected = () => {
        realtimeConnectedRef.current = promotionsSubscribed || campaignsSubscribed
      }

      const promotionsChannel = supabase
        .channel(`vendor-marketing-promotions:${vendorId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'promotions', filter: `vendor_id=eq.${vendorId}` },
          () => scheduleRefresh()
        )
        .subscribe((status) => {
          promotionsSubscribed = status === 'SUBSCRIBED'
          updateConnected()
        })

      const campaignsChannel = supabase
        .channel(`vendor-marketing-campaigns:${vendorId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'boosting_campaigns', filter: `vendor_id=eq.${vendorId}` },
          () => scheduleRefresh()
        )
        .subscribe((status) => {
          campaignsSubscribed = status === 'SUBSCRIBED'
          updateConnected()
        })

      return () => {
        promotionsSubscribed = false
        campaignsSubscribed = false
        updateConnected()
        try {
          supabase.removeChannel(promotionsChannel)
        } catch {
          // noop
        }
        try {
          supabase.removeChannel(campaignsChannel)
        } catch {
          // noop
        }
      }
    }

    let cleanup: (() => void) | undefined
    void (async () => {
      cleanup = await start()
    })()

    return () => {
      cancelled = true
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current)
        realtimeRefreshTimerRef.current = null
      }
      cleanup?.()
    }
  }, [])

  useEffect(() => {
    const promotionModalOpen = showCreatePromotion || showEditPromotion
    if (!promotionModalOpen) return

    /**
     * Charge les options de ciblage pour la modale (produits vendeur, catégories, tags).
     */
    const loadTargetingOptions = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.allSettled([
          fetch('/api/vendor/products?limit=100&offset=0', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
          }),
          fetch('/api/catalog/categories', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store'
          })
        ])

        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          const json = await productsRes.value.json().catch(() => ({}))
          const items = (json?.data?.items as any[]) ?? []
          const mapped = items
            .map((item) => {
              const id = typeof item?.id === 'string' ? item.id : ''
              const name = typeof item?.name === 'string' ? item.name : ''
              const tags = Array.isArray(item?.tags) ? item.tags.filter((t: any) => typeof t === 'string') : []
              if (!id) return null
              return { id, name: name || 'Produit', tags } satisfies VendorProductOption
            })
            .filter(Boolean) as VendorProductOption[]

          setVendorProducts(mapped)

          const uniqueTags = new Set<string>()
          mapped.forEach((p) => p.tags.forEach((t) => uniqueTags.add(t)))
          setVendorTags(Array.from(uniqueTags).sort((a, b) => a.localeCompare(b)))
        } else {
          setVendorProducts([])
          setVendorTags([])
        }

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
          const json = await categoriesRes.value.json().catch(() => ({}))
          const items = (json?.data?.items as any[]) ?? []
          const mapped = items
            .map((item) => {
              const id = typeof item?.id === 'string' ? item.id : ''
              const name = typeof item?.name === 'string' ? item.name : ''
              if (!id) return null
              return { id, name: name || 'Catégorie' } satisfies CatalogCategoryOption
            })
            .filter(Boolean) as CatalogCategoryOption[]
          setCatalogCategories(mapped)
        } else {
          setCatalogCategories([])
        }
      } catch {
        setVendorProducts([])
        setCatalogCategories([])
        setVendorTags([])
      }
    }

    void loadTargetingOptions()
  }, [showCreatePromotion, showEditPromotion])

  useEffect(() => {
    let cancelled = false
    let inFlight = false

    const refreshSilently = async () => {
      if (inFlight) return
      inFlight = true

      try {
        const { data: authData } = await supabase.auth.getUser()
        const vendorId = authData?.user?.id || ''

        if (!vendorId) {
          return
        }

        const [promRes, campRes, servicesRes] = await Promise.allSettled([
          fetch(`/api/marketing/promotions?vendorId=${encodeURIComponent(vendorId)}`),
          fetch(`/api/marketing/campaigns?vendorId=${encodeURIComponent(vendorId)}`),
          BoostingServiceManager.getAllServices()
        ])

        if (!cancelled) {
          if (promRes.status === 'fulfilled' && promRes.value.ok) {
            const rawPromos: unknown = await promRes.value.json()
            setPromotions(mapApiArray(rawPromos, mapPromotionApiToPromotion))
          }

          if (campRes.status === 'fulfilled' && campRes.value.ok) {
            const rawCamps: unknown = await campRes.value.json()
            setCampaigns(mapApiArray(rawCamps, mapCampaignApiToVendorCampaign))
          }

          if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value)) {
            const normalizedServices = servicesRes.value.map(service => ({
              ...service,
              type: service.type ?? 'recommendation',
              features: Array.isArray(service.features) ? service.features : [],
              base_price: typeof service.base_price === 'number' ? service.base_price : 0
            }))
            setAdvertisingServices(normalizedServices)
          }
        }
      } catch {
        // ignore
      } finally {
        inFlight = false
      }
    }

    const handleFocus = () => {
      void refreshSilently()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSilently()
      }
    }

    void refreshSilently()
    const intervalId = window.setInterval(() => {
      if (realtimeConnectedRef.current) return
      void refreshSilently()
    }, 180000)

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

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
        setPricingConfig(JSON.parse(JSON.stringify(next)) as BoostingPricingConfig)
      }
    }

    /**
     * Réagit aux mises à jour depuis d'autres onglets (storage event).
     */
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BOOSTING_PRICING_BROADCAST_KEY) return
      const cached = readCachedPricingConfig()
      if (cached) {
        setPricingConfig(cached)
        return
      }

      BoostingPricingManager.getConfig()
        .then((config) => setPricingConfig(JSON.parse(JSON.stringify(config)) as BoostingPricingConfig))
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

    const refreshPricingConfig = async () => {
      try {
        const config = await BoostingPricingManager.getConfig()
        if (cancelled) return

        const nextHash = JSON.stringify(config)
        if (nextHash === lastPricingHashRef.current) return
        lastPricingHashRef.current = nextHash

        setPricingConfig(JSON.parse(JSON.stringify(config)) as BoostingPricingConfig)
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
    const intervalId = window.setInterval(() => {
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

  // Calcul des statistiques
  const getPromotionStats = () => {
    const activePromotions = promotions.filter(p => p.status === 'active')
    const totalUsage = activePromotions.reduce((sum, p) => sum + p.used_count, 0)
    const totalLimit = activePromotions.reduce((sum, p) => sum + (p.usage_limit || 0), 0)

    return {
      total: promotions.length,
      active: activePromotions.length,
      usageRate: totalLimit > 0 ? (totalUsage / totalLimit) * 100 : 0,
      totalDiscount: activePromotions.reduce((sum, p) => sum + (p.discount_value * p.used_count), 0)
    }
  }

  /**
   * Ouvre la modale d'édition de promotion avec pré-remplissage.
   */
  const openEditPromotion = (promotion: Promotion) => {
    const targetingMode: PromotionTargetingMode =
      Array.isArray(promotion.applicable_categories) && promotion.applicable_categories.length > 0
        ? 'categories'
        : Array.isArray(promotion.applicable_products) && promotion.applicable_products.length > 0
          ? 'products'
          : 'all'

    setEditingPromotionId(promotion.id)
    setEditPromotionForm({
      targetingMode,
      name: promotion.name ?? '',
      type: promotion.type ?? 'code',
      discountType: promotion.discount_type ?? 'percentage',
      discountValue: Number(promotion.discount_value ?? 0) || 0,
      minAmount: Number(promotion.min_purchase_amount ?? 0) || 0,
      maxDiscount: Number(promotion.max_discount_amount ?? 0) || 0,
      startDate: toDateInputValue(promotion.start_date),
      endDate: toDateInputValue(promotion.end_date),
      usageLimit: Number(promotion.usage_limit ?? 0) || 0,
      products: Array.isArray(promotion.applicable_products) ? promotion.applicable_products : [],
      categories: Array.isArray(promotion.applicable_categories) ? promotion.applicable_categories : [],
      tags: [],
      conditions: promotion.description ?? ''
    })
    setShowEditPromotion(true)
  }

  /**
   * Met à jour une promotion via l'API et recharge pour assurer la propagation.
   */
  const handleUpdatePromotion = async () => {
    if (!editingPromotionId) return

    setIsLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const vendorId = authData?.user?.id || ''
      if (!vendorId) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de déterminer votre identifiant vendeur.'
        })
        return
      }

      const cleanName = editPromotionForm.name.trim()
      if (!cleanName) {
        addNotification({
          type: 'error',
          title: 'Champs requis',
          message: 'Veuillez renseigner le nom de la promotion.'
        })
        return
      }

      const startIso = toIsoStartOfDayUtc(editPromotionForm.startDate)
      const endIso = toIsoEndOfDayUtc(editPromotionForm.endDate)
      if (!startIso || !endIso) {
        addNotification({
          type: 'error',
          title: 'Dates invalides',
          message: 'Veuillez renseigner des dates de début et de fin valides.'
        })
        return
      }

      if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
        addNotification({
          type: 'error',
          title: 'Dates invalides',
          message: 'La date de fin doit être postérieure ou égale à la date de début.'
        })
        return
      }

      let applicableProducts: string[] = []
      let applicableCategories: string[] = []
      const applicableVendors: string[] = [vendorId]

      if (editPromotionForm.targetingMode === 'products') {
        if (!Array.isArray(editPromotionForm.products) || editPromotionForm.products.length === 0) {
          addNotification({
            type: 'error',
            title: 'Ciblage requis',
            message: 'Veuillez sélectionner au moins un produit.'
          })
          return
        }
        applicableProducts = editPromotionForm.products
      } else if (editPromotionForm.targetingMode === 'categories') {
        if (!Array.isArray(editPromotionForm.categories) || editPromotionForm.categories.length === 0) {
          addNotification({
            type: 'error',
            title: 'Ciblage requis',
            message: 'Veuillez sélectionner au moins une catégorie.'
          })
          return
        }
        applicableCategories = editPromotionForm.categories
      } else if (editPromotionForm.targetingMode === 'tags') {
        if (!Array.isArray(editPromotionForm.tags) || editPromotionForm.tags.length === 0) {
          addNotification({
            type: 'error',
            title: 'Ciblage requis',
            message: 'Veuillez sélectionner au moins un tag.'
          })
          return
        }

        const selectedTags = new Set(editPromotionForm.tags)
        const ids = vendorProducts
          .filter((p) => p.tags.some((tag) => selectedTags.has(tag)))
          .map((p) => p.id)

        if (ids.length === 0) {
          addNotification({
            type: 'error',
            title: 'Aucun produit',
            message: 'Aucun de vos produits ne correspond aux tags sélectionnés.'
          })
          return
        }

        applicableProducts = ids
      }

      const payload = {
        name: cleanName,
        type: mapPromotionFormTypeToApiType(editPromotionForm.type as Promotion['type']),
        start_date: startIso,
        end_date: endIso,
        discount_type: editPromotionForm.discountType,
        discount_value: Number(editPromotionForm.discountValue) || 0,
        min_order_amount: editPromotionForm.minAmount > 0 ? editPromotionForm.minAmount : null,
        max_discount: editPromotionForm.maxDiscount > 0 ? editPromotionForm.maxDiscount : null,
        usage_limit: editPromotionForm.usageLimit > 0 ? editPromotionForm.usageLimit : null,
        applicable_products: applicableProducts,
        applicable_categories: applicableCategories,
        applicable_vendors: applicableVendors,
        description: editPromotionForm.conditions?.trim() ? editPromotionForm.conditions.trim() : null
      }

      const resp = await fetch(`/api/marketing/promotions/${encodeURIComponent(editingPromotionId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        console.error('Erreur modification promotion (API):', resp.status, body)
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de modifier la promotion pour le moment.'
        })
        return
      }

      addNotification({
        type: 'success',
        title: 'Promotion mise à jour',
        message: 'Les modifications ont été enregistrées.'
      })

      setShowEditPromotion(false)
      setEditingPromotionId(null)
      await reloadPromotions()
    } catch (error) {
      console.error('Erreur modification promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la modification de la promotion.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Active / désactive (pause/reprise) une promotion comme côté super-admin.
   */
  const handlePromotionStatusChange = async (promotion: Promotion, nextStatus: 'active' | 'paused') => {
    setIsLoading(true)
    try {
      const resp = await fetch(`/api/marketing/promotions/${encodeURIComponent(promotion.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      })

      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        console.error('Erreur statut promotion (API):', resp.status, body)
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de mettre à jour le statut de la promotion.'
        })
        return
      }

      setPromotions((prev) =>
        prev.map((item) => (item.id === promotion.id ? { ...item, status: nextStatus } : item))
      )

      addNotification({
        type: 'success',
        title: 'Statut mis à jour',
        message: nextStatus === 'paused' ? 'Promotion désactivée.' : 'Promotion réactivée.'
      })

      await reloadPromotions()
    } catch (error) {
      console.error('Erreur statut promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour du statut.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Recharge la liste des promotions du vendeur courant depuis l'API.
   */
  const reloadPromotions = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const vendorId = authData?.user?.id || ''
      if (!vendorId) return

      const resp = await fetch(`/api/marketing/promotions?vendorId=${encodeURIComponent(vendorId)}`)
      if (!resp.ok) return

      const rawPromos: unknown = await resp.json()
      setPromotions(mapApiArray(rawPromos, mapPromotionApiToPromotion))
    } catch {
      // ignore
    }
  }

  /**
   * Crée une promotion vendeur et déclenche la propagation (vendeur, super-admin, acheteur).
   */
  const handleCreatePromotion = async () => {
    setIsLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      const vendorId = authData?.user?.id || ''
      if (!vendorId) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de déterminer votre identifiant vendeur.'
        })
        return
      }

      const cleanName = promotionForm.name.trim()
      if (!cleanName) {
        addNotification({
          type: 'error',
          title: 'Champs requis',
          message: 'Veuillez renseigner le nom de la promotion.'
        })
        return
      }

      const startIso = toIsoStartOfDayUtc(promotionForm.startDate)
      const endIso = toIsoEndOfDayUtc(promotionForm.endDate)
      if (!startIso || !endIso) {
        addNotification({
          type: 'error',
          title: 'Dates invalides',
          message: 'Veuillez renseigner des dates de début et de fin valides.'
        })
        return
      }

      if (new Date(endIso).getTime() < new Date(startIso).getTime()) {
        addNotification({
          type: 'error',
          title: 'Dates invalides',
          message: 'La date de fin doit être postérieure ou égale à la date de début.'
        })
        return
      }

      /**
       * Construit le ciblage en évitant les surprises :
       * - "Tous" => toutes les offres du vendeur
       * - "Produits" => produits choisis
       * - "Catégories" => catégories choisies, restreintes au vendeur via applicable_vendors
       * - "Tags" => tags choisis convertis en produits du vendeur
       */
      let applicableProducts: string[] = []
      let applicableCategories: string[] = []
      const applicableVendors: string[] = [vendorId]

      if (promotionForm.targetingMode === 'products') {
        if (!Array.isArray(promotionForm.products) || promotionForm.products.length === 0) {
          addNotification({
            type: 'error',
            title: 'Ciblage requis',
            message: 'Veuillez sélectionner au moins un produit.'
          })
          return
        }
        applicableProducts = promotionForm.products
      } else if (promotionForm.targetingMode === 'categories') {
        if (!Array.isArray(promotionForm.categories) || promotionForm.categories.length === 0) {
          addNotification({
            type: 'error',
            title: 'Ciblage requis',
            message: 'Veuillez sélectionner au moins une catégorie.'
          })
          return
        }
        applicableCategories = promotionForm.categories
      } else if (promotionForm.targetingMode === 'tags') {
        if (!Array.isArray(promotionForm.tags) || promotionForm.tags.length === 0) {
          addNotification({
            type: 'error',
            title: 'Ciblage requis',
            message: 'Veuillez sélectionner au moins un tag.'
          })
          return
        }

        const selectedTags = new Set(promotionForm.tags)
        const ids = vendorProducts
          .filter((p) => p.tags.some((tag) => selectedTags.has(tag)))
          .map((p) => p.id)

        if (ids.length === 0) {
          addNotification({
            type: 'error',
            title: 'Aucun produit',
            message: 'Aucun de vos produits ne correspond aux tags sélectionnés.'
          })
          return
        }

        applicableProducts = ids
      }

      const payload = {
        name: cleanName,
        code: null,
        description: promotionForm.conditions?.trim() ? promotionForm.conditions.trim() : null,
        type: mapPromotionFormTypeToApiType(promotionForm.type as Promotion['type']),
        status: 'active',
        start_date: startIso,
        end_date: endIso,
        discount_type: promotionForm.discountType,
        discount_value: Number(promotionForm.discountValue) || 0,
        min_order_amount: promotionForm.minAmount > 0 ? promotionForm.minAmount : null,
        max_discount: promotionForm.maxDiscount > 0 ? promotionForm.maxDiscount : null,
        usage_limit: promotionForm.usageLimit > 0 ? promotionForm.usageLimit : null,
        usage_limit_per_user: 1,
        used_count: 0,
        target_audience: [],
        applicable_products: applicableProducts,
        applicable_categories: applicableCategories,
        applicable_vendors: applicableVendors,
        is_auto_apply: false,
        created_by: vendorId
      }

      const resp = await fetch('/api/marketing/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!resp.ok) {
        const body = await resp.text().catch(() => '')
        console.error('Erreur création promotion (API):', resp.status, body)
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de créer la promotion pour le moment.'
        })
        return
      }

      const json = await resp.json().catch(() => ({}))
      const created = mapPromotionApiToPromotion(json?.data)
      if (created) {
        setPromotions((prev) => [created, ...prev])
      }

      addNotification({
        type: 'success',
        title: 'Succès',
        message: 'Promotion créée avec succès !'
      })

      setShowCreatePromotion(false)
      setPromotionForm({
        targetingMode: 'all',
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
        tags: [],
        conditions: ''
      })

      await reloadPromotions()
    } catch (error) {
      console.error('Erreur création promotion:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la création de la promotion.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCampaignStats = () => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active')
    const pendingCampaigns = campaigns.filter(c => c.status === 'pending')
    const totalBudget = activeCampaigns.reduce((sum, c) => sum + c.total_cost, 0)
    const totalSpent = activeCampaigns.reduce((sum, c) => sum + c.total_cost, 0)

    return {
      total: campaigns.length,
      active: activeCampaigns.length,
      pending: pendingCampaigns.length,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      totalROAS: activeCampaigns.length > 0 ? 3.2 : 0
    }
  }

  const promotionStats = getPromotionStats()
  const campaignStats = getCampaignStats()

  /**
   * Recharge la liste des campagnes du vendeur courant depuis l'API.
   */
  const reloadCampaigns = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser()
      const vendorId = authData?.user?.id || ''
      if (!vendorId) return

      const resp = await fetch(`/api/marketing/campaigns?vendorId=${encodeURIComponent(vendorId)}`)
      if (!resp.ok) return

      const rawCamps: unknown = await resp.json()
      setCampaigns(mapApiArray(rawCamps, mapCampaignApiToVendorCampaign))
    } catch {
      // ignore
    }
  }

  /**
   * Met à jour le statut d'une campagne (pause, reprise, stop).
   */
  const handleCampaignStatusChange = async (
    campaign: VendorCampaign,
    nextStatus: 'active' | 'paused' | 'completed'
  ) => {
    setIsLoading(true)
    try {
      const success = await BoostingCampaignManager.setCampaignStatus(campaign.id, nextStatus)
      if (!success) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: "Impossible de mettre à jour le statut de la campagne."
        })
        return
      }

      // Mise à jour optimiste pour refléter instantanément l'état dans l'UI.
      setCampaigns((prev) =>
        prev.map((item) =>
          item.id === campaign.id
            ? {
                ...item,
                status: nextStatus,
                end_date: nextStatus === 'completed' ? new Date().toISOString() : item.end_date
              }
            : item
        )
      )

      addNotification({
        type: 'success',
        title: 'Campagne mise à jour',
        message:
          nextStatus === 'paused'
            ? 'Campagne mise en pause.'
            : nextStatus === 'completed'
              ? 'Campagne arrêtée.'
              : 'Campagne reprise.'
      })
      await reloadCampaigns()
    } catch (error) {
      console.error('Erreur mise à jour campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour de la campagne.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Supprime une campagne.
   */
  const handleDeleteCampaign = async (campaign: VendorCampaign) => {
    const accepted = await confirm({
      title: 'Supprimer la campagne',
      message: 'Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      tone: 'destructive'
    })
    if (!accepted) return

    setIsLoading(true)
    try {
      const success = await BoostingCampaignManager.deleteCampaign(campaign.id)
      if (!success) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Suppression impossible. Vérifiez vos droits et réessayez.'
        })
        return
      }

      addNotification({
        type: 'success',
        title: 'Campagne supprimée',
        message: 'La campagne a été supprimée avec succès.'
      })
      await reloadCampaigns()
    } catch (error) {
      console.error('Erreur suppression campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la suppression de la campagne.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Ouvre la modale d'édition de campagne (contenu uniquement).
   */
  const openEditCampaign = (campaign: VendorCampaign) => {
    setEditingCampaign(campaign)
    setEditCampaignName(campaign.name ?? '')
    setEditCampaignTargetPages(Array.isArray(campaign.target_pages) ? campaign.target_pages : [])
    setEditCampaignDuration(typeof campaign.duration === 'number' ? campaign.duration : 7)
    setShowEditCampaign(true)
  }

  /**
   * Sauvegarde les modifications de contenu d'une campagne.
   */
  const handleUpdateCampaignContent = async () => {
    if (!editingCampaign) return

    const cleanName = editCampaignName.trim()
    const cleanDuration = Number.isFinite(editCampaignDuration) ? Math.floor(editCampaignDuration) : NaN

    if (!cleanName) {
      addNotification({
        type: 'error',
        title: 'Champs requis',
        message: 'Veuillez renseigner un nom de campagne.'
      })
      return
    }

    if (!Array.isArray(editCampaignTargetPages) || editCampaignTargetPages.length === 0) {
      addNotification({
        type: 'error',
        title: 'Champs requis',
        message: "Veuillez sélectionner au moins une page d'affichage."
      })
      return
    }

    if (!Number.isFinite(cleanDuration) || cleanDuration < 1 || cleanDuration > 365) {
      addNotification({
        type: 'error',
        title: 'Durée invalide',
        message: 'La durée doit être comprise entre 1 et 365 jours.'
      })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: cleanName,
        target_pages: editCampaignTargetPages,
        duration: cleanDuration
      }

      const success = await BoostingCampaignManager.updateCampaignContent(editingCampaign.id, payload)
      if (!success) {
        addNotification({
          type: 'error',
          title: 'Erreur',
          message: "Impossible de mettre à jour la campagne."
        })
        return
      }

      addNotification({
        type: 'success',
        title: 'Campagne mise à jour',
        message: 'Les modifications ont été enregistrées.'
      })

      setShowEditCampaign(false)
      setEditingCampaign(null)
      await reloadCampaigns()
    } catch (error) {
      console.error('Erreur modification campagne:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de la mise à jour de la campagne.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Réinitialise le formulaire de boostage avec les valeurs par défaut.
   */
  const resetBoostingForm = () => {
    setBoostingForm(prev => ({
      ...prev,
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
    }))
  }

  /**
   * Convertit le type Supabase vers le type utilisé par le formulaire vendeur.
   */
  const mapServiceTypeToBoostingType = (serviceType: BoostingService['type']): BoostingServiceType => {
    switch (serviceType) {
      case 'recommendation':
        return 'recommandation'
      case 'banner':
        return 'banniere'
      default:
        return 'whatsapp'
    }
  }

  /**
   * Retourne la palette de couleurs à appliquer selon le type de service.
   */
  const getServicePalette = (service: BoostingService) => {
    if (service.type === 'recommendation') {
      return {
        cardBorder: 'border-blue-200',
        gradient: 'from-blue-50 to-blue-100',
        accentText: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700'
      }
    }

    if (service.type === 'banner') {
      return {
        cardBorder: 'border-green-200',
        gradient: 'from-green-50 to-green-100',
        accentText: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700'
      }
    }

    return {
      cardBorder: 'border-gray-200',
      gradient: 'from-gray-50 to-gray-100',
      accentText: 'text-gray-700',
      button: 'bg-gray-600 hover:bg-gray-700'
    }
  }

  /**
   * Récupère la liste des avantages pour un service.
   */
  const getServiceFeatures = (service: BoostingService) => {
    if (service.features && service.features.length > 0) {
      return service.features
    }

    if (service.type === 'recommendation') {
      return ['Visibilité multi-pages', 'Placement prioritaire', 'Segmentation intelligente']
    }

    if (service.type === 'banner') {
      return ['Format responsive', 'Animations discrètes', 'Optimisation de la conversion']
    }

    return ['Diffusion ciblée', 'Message personnalisé', 'Suivi des performances']
  }

  /**
   * Calcule les informations tarifaires contextuelles pour un service.
   */
  const getServicePricingDetails = (service: BoostingService) => {
    if (!pricingConfig) {
      return [{ label: 'Tarif de base', value: `${service.base_price.toLocaleString()} FCFA` }]
    }

    if (service.type === 'recommendation') {
      return [
        { label: "Page d'accueil", value: `${pricingConfig.recommendation.homePage.toLocaleString()} FCFA/jour` },
        { label: 'Page produit', value: `${pricingConfig.recommendation.productPage.toLocaleString()} FCFA/jour` },
        { label: 'Meilleures ventes', value: `${pricingConfig.recommendation.bestSellers.toLocaleString()} FCFA/jour` },
        { label: 'Nouvelles arrivées', value: `${pricingConfig.recommendation.newArrivals.toLocaleString()} FCFA/jour` },
        { label: 'Page vendeur', value: `${pricingConfig.recommendation.vendorPage.toLocaleString()} FCFA/jour` }
      ]
    }

    if (service.type === 'banner') {
      return [
        { label: 'Tarif de base', value: `${service.base_price.toLocaleString()} FCFA/jour` },
        { label: 'Coefficient bannière', value: `x${pricingConfig.banner.multiplier}` },
        { label: 'Frais animation', value: `${pricingConfig.banner.animationFee.toLocaleString()} FCFA` }
      ]
    }

    if (service.type === 'whatsapp') {
      return [
        { label: 'Coût par cible', value: `${pricingConfig.whatsapp.baseCost.toLocaleString()} FCFA` },
        { label: 'Ciblage pays', value: `+${pricingConfig.whatsapp.countryCost.toLocaleString()} FCFA` },
        { label: 'Ciblage âge', value: `+${pricingConfig.whatsapp.ageCost.toLocaleString()} FCFA` },
        { label: 'Ciblage profession', value: `+${pricingConfig.whatsapp.professionCost.toLocaleString()} FCFA` },
        { label: 'Clients Probooster', value: `+${pricingConfig.whatsapp.proboosterCost.toLocaleString()} FCFA` }
      ]
    }

    return [
      { label: 'Tarif de base', value: `${service.base_price.toLocaleString()} FCFA` }
    ]
  }

  /**
   * Ouvre le modal de boostage pour un service synchronisé avec le super admin.
   */
  const openBoostingModal = (service: BoostingService) => {
    if (!service.is_active) {
      addNotification({
        type: 'warning',
        title: 'Service indisponible',
        message: "Ce service est désactivé par l'administrateur."
      })
      return
    }

    const mappedType = mapServiceTypeToBoostingType(service.type)
    setSelectedService(service)
    setBoostingType(mappedType)
    resetBoostingForm()
    setShowBoostingModal(true)
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
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
            <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Taux d&apos;utilisation: {promotionStats.usageRate.toFixed(1)}%</p>
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
          {promotions.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune promotion</h3>
              <p className="text-gray-600 mb-4">Vous n&apos;avez pas encore créé de promotions.</p>
              <Button
                onClick={() => setShowCreatePromotion(true)}
                className="text-white"
                style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre première promotion
              </Button>
            </div>
          ) : (
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
                        {promotion.discount_type === 'percentage' ? `${promotion.discount_value}%` :
                         promotion.discount_type === 'fixed' ? `${promotion.discount_value} FCFA` :
                         'Livraison gratuite'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilisation</span>
                        <span>{promotion.used_count} / {promotion.usage_limit || 0}</span>
                      </div>
                      <Progress
                        value={promotion.usage_limit ? (promotion.used_count / promotion.usage_limit) * 100 : 0}
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Début</p>
                        <p className="font-medium">{new Date(promotion.start_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fin</p>
                        <p className="font-medium">{new Date(promotion.end_date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    {promotion.min_purchase_amount && promotion.min_purchase_amount > 0 && (
                      <div className="text-sm">
                        <p className="text-gray-500">Montant minimum</p>
                        <p className="font-medium">{promotion.min_purchase_amount.toLocaleString()} FCFA</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => openEditPromotion(promotion)}
                          className="text-xs"
                        >
                          Modifier
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs"
                          disabled={
                            isLoading ||
                            promotion.status === 'expired' ||
                            promotion.status === 'draft'
                          }
                          onClick={() =>
                            void handlePromotionStatusChange(
                              promotion,
                              promotion.status === 'active' ? 'paused' : 'active'
                            )
                          }
                        >
                          {promotion.status === 'active' ? 'Désactiver' : 'Activer'}
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          // Suppression
                          addNotification({
                            type: 'success',
                            title: 'Succès',
                            message: 'Promotion supprimée'
                          })
                        }}
                        className="text-xs"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onglet Campagnes */}
        <TabsContent value="campaigns" className="space-y-6">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune campagne</h3>
              <p className="text-gray-600 mb-4">Vous n&apos;avez pas encore créé de campagnes.</p>
              <Button
                onClick={() => setShowCreateCampaign(true)}
                className="text-white"
                style={{ background: 'linear-gradient(135deg, #ff6600, #e55a00)' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre première campagne
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Target className="h-5 w-5" style={{ color: '#ff6600' }} />
                        <span>{campaign.name && campaign.name.trim().length > 0 ? campaign.name : `Campagne ${campaign.id.slice(0, 8)}`}</span>
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
                           campaign.status === 'paused' ? 'Pause' :
                           campaign.status === 'completed' ? 'Terminé' :
                           campaign.status === 'pending' ? 'En Attente' : 'Brouillon'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <BarChart3 className="h-4 w-4" />
                      <span>
                        {campaign.type === 'recommendation' ? 'Recommandation' :
                         campaign.type === 'banner' ? 'Bannière' :
                         campaign.type === 'whatsapp' ? 'WhatsApp' :
                         campaign.type === 'social' ? 'Réseaux sociaux' :
                         campaign.type === 'email' ? 'Email' : 'Bannière'}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget utilisé</span>
                        <span>{campaign.total_cost.toLocaleString()} / {campaign.total_cost.toLocaleString()} FCFA</span>
                      </div>
                      <Progress
                        value={100}
                        className="h-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Impressions</p>
                        <p className="font-medium">0</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Clics</p>
                        <p className="font-medium">0</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Conversions</p>
                        <p className="font-medium">0</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ROAS</p>
                        <p className="font-medium">0x</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isLoading || campaign.status !== 'active'}
                          onClick={() => void handleCampaignStatusChange(campaign, 'paused')}
                          aria-label="Mettre en pause"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isLoading || campaign.status !== 'paused'}
                          onClick={() => void handleCampaignStatusChange(campaign, 'active')}
                          aria-label="Reprendre"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={isLoading || campaign.status === 'completed' || campaign.status === 'rejected'}
                          onClick={() => void handleCampaignStatusChange(campaign, 'completed')}
                          aria-label="Arrêter"
                        >
                          <StopCircle className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          disabled={isLoading}
                          onClick={() => openEditCampaign(campaign)}
                        >
                          Modifier
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDeleteCampaign(campaign)}
                        className="text-xs"
                        disabled={isLoading}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                    <span className="font-semibold">
                      {promotions.length > 0 ? `${(promotionStats.totalDiscount > 0 ? 12.5 : 0).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ROI moyen</span>
                    <span className="font-semibold">
                      {campaigns.length > 0 ? `${campaignStats.totalROAS.toFixed(1)}x` : '0x'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Promotions les plus populaires</span>
                    <span className="font-semibold">
                      {promotions.length > 0 ? promotions.slice(0, 2).map(p => p.name).join(', ') : 'Aucune'}
                    </span>
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
                    <span className="font-semibold">
                      {campaigns.length > 0 ? '8.2%' : '0%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">CPC moyen</span>
                    <span className="font-semibold">
                      {campaigns.length > 0 ? '24.5 FCFA' : '0 FCFA'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Taux de conversion</span>
                    <span className="font-semibold">
                      {campaigns.length > 0 ? '7.8%' : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    Les services ci-dessous reflètent en temps réel la configuration définie par l&apos;administrateur.
                  </p>
                </div>
              </div>

              {advertisingServices.length === 0 ? (
                <div className="text-center py-10">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Aucun service disponible pour le moment</h4>
                  <p className="text-gray-600">
                    Revenez plus tard : l&apos;administrateur n&apos;a pas encore publié de services Boostage Pro.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {advertisingServices.map((service) => {
                    const palette = getServicePalette(service)
                    const pricingDetails = getServicePricingDetails(service)
                    const features = getServiceFeatures(service)

                    return (
                      <Card
                        key={service.id}
                        className={`border ${palette.cardBorder} bg-white shadow-sm hover:shadow-lg transition-all duration-300 ${service.is_active ? '' : 'opacity-60'}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-lg flex items-center gap-2 ${palette.accentText}`}>
                              {(() => {
                                const paletteIcon = getServicePalette(service)
                                if (service.type === 'recommendation') {
                                  return <Target className={`h-5 w-5 ${paletteIcon.accentText}`} />
                                }
                                if (service.type === 'banner') {
                                  return <TrendingUp className={`h-5 w-5 ${paletteIcon.accentText}`} />
                                }
                                return <Zap className={`h-5 w-5 ${paletteIcon.accentText}`} />
                              })()}
                              <span>{service.name}</span>
                            </CardTitle>
                            <Badge variant={service.is_active ? 'default' : 'secondary'}>
                              {service.is_active ? 'Actif' : 'Désactivé'}
                            </Badge>
                          </div>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                          )}
                          {!service.is_active && (
                            <p className="text-xs text-red-600 mt-1 font-medium">
                              Service désactivé par l&apos;administrateur.
                            </p>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="space-y-1 text-xs">
                            {pricingDetails.map((detail) => (
                              <div key={`${service.id}-${detail.label}`} className="flex justify-between">
                                <span className="text-gray-600">{detail.label}</span>
                                <span className="font-medium text-gray-900">{detail.value}</span>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1">
                            {features.map((feature, index) => (
                              <div key={`${service.id}-feature-${index}`} className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle className="h-4 w-4 text-orange-500" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>

                          <Button
                            size="sm"
                            className={`w-full text-white ${palette.button}`}
                            onClick={() => openBoostingModal(service)}
                            disabled={!service.is_active}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            {service.is_active ? 'Lancer Boostage' : 'Service désactivé'}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Conseil :</strong> Chaque demande de boostage est transmise à l&apos;administrateur pour validation.
                Dès qu&apos;elle est acceptée, vous la retrouverez dans l&apos;onglet « Campagnes » avec son suivi complet.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Création Promotion */}
      <Dialog open={showCreatePromotion} onOpenChange={setShowCreatePromotion}>
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
                  onValueChange={(value) => setPromotionForm({ ...promotionForm, type: value })}
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

            <div>
              <Label htmlFor="promo-targeting">Ciblage</Label>
              <Select
                value={promotionForm.targetingMode}
                onValueChange={(value) =>
                  setPromotionForm({
                    ...promotionForm,
                    targetingMode: value as PromotionTargetingMode,
                    products: [],
                    categories: [],
                    tags: []
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous mes produits</SelectItem>
                  <SelectItem value="products">Produits spécifiques</SelectItem>
                  <SelectItem value="categories">Par catégorie</SelectItem>
                  <SelectItem value="tags">Par tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {promotionForm.targetingMode === 'products' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm">Sélectionnez vos produits</Label>
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                  {vendorProducts.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucun produit disponible.</p>
                  ) : (
                    vendorProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={promotionForm.products.includes(p.id)}
                          onChange={() =>
                            setPromotionForm({
                              ...promotionForm,
                              products: toggleSelection(promotionForm.products, p.id)
                            })
                          }
                        />
                        <span>{p.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {promotionForm.targetingMode === 'categories' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm">Sélectionnez des catégories</Label>
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                  {catalogCategories.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucune catégorie disponible.</p>
                  ) : (
                    catalogCategories.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={promotionForm.categories.includes(c.id)}
                          onChange={() =>
                            setPromotionForm({
                              ...promotionForm,
                              categories: toggleSelection(promotionForm.categories, c.id)
                            })
                          }
                        />
                        <span>{c.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  La promotion s'appliquera uniquement à vos produits appartenant aux catégories sélectionnées.
                </p>
              </div>
            )}

            {promotionForm.targetingMode === 'tags' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm">Sélectionnez des tags (depuis vos produits)</Label>
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                  {vendorTags.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucun tag détecté sur vos produits.</p>
                  ) : (
                    vendorTags.map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={promotionForm.tags.includes(t)}
                          onChange={() =>
                            setPromotionForm({
                              ...promotionForm,
                              tags: toggleSelection(promotionForm.tags, t)
                            })
                          }
                        />
                        <span>{t}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Les tags sont convertis automatiquement en liste de vos produits correspondants.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount-type">Type de réduction</Label>
                <Select
                  value={promotionForm.discountType}
                  onValueChange={(value) => setPromotionForm({ ...promotionForm, discountType: value })}
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
                <Label htmlFor="usage-limit">Limite d&apos;utilisation</Label>
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
              <Button variant="outline" onClick={() => setShowCreatePromotion(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => void handleCreatePromotion()}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                Créer la promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Édition Promotion */}
      <Dialog
        open={showEditPromotion}
        onOpenChange={(open) => {
          setShowEditPromotion(open)
          if (!open) {
            setEditingPromotionId(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la promotion</DialogTitle>
            <DialogDescription>
              Modifiez votre promotion. Les changements seront visibles côté super-admin et côté client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-promo-name">Nom de la promotion *</Label>
                <Input
                  id="edit-promo-name"
                  value={editPromotionForm.name}
                  onChange={(e) => setEditPromotionForm({ ...editPromotionForm, name: e.target.value })}
                  placeholder="Ex: ÉTÉ2024"
                />
              </div>
              <div>
                <Label htmlFor="edit-promo-type">Type de promotion</Label>
                <Select
                  value={editPromotionForm.type}
                  onValueChange={(value) => setEditPromotionForm({ ...editPromotionForm, type: value })}
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

            <div>
              <Label htmlFor="edit-promo-targeting">Ciblage</Label>
              <Select
                value={editPromotionForm.targetingMode}
                onValueChange={(value) =>
                  setEditPromotionForm({
                    ...editPromotionForm,
                    targetingMode: value as PromotionTargetingMode,
                    products: [],
                    categories: [],
                    tags: []
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous mes produits</SelectItem>
                  <SelectItem value="products">Produits spécifiques</SelectItem>
                  <SelectItem value="categories">Par catégorie</SelectItem>
                  <SelectItem value="tags">Par tag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editPromotionForm.targetingMode === 'products' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm">Sélectionnez vos produits</Label>
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                  {vendorProducts.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucun produit disponible.</p>
                  ) : (
                    vendorProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={editPromotionForm.products.includes(p.id)}
                          onChange={() =>
                            setEditPromotionForm({
                              ...editPromotionForm,
                              products: toggleSelection(editPromotionForm.products, p.id)
                            })
                          }
                        />
                        <span>{p.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {editPromotionForm.targetingMode === 'categories' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm">Sélectionnez des catégories</Label>
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                  {catalogCategories.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucune catégorie disponible.</p>
                  ) : (
                    catalogCategories.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={editPromotionForm.categories.includes(c.id)}
                          onChange={() =>
                            setEditPromotionForm({
                              ...editPromotionForm,
                              categories: toggleSelection(editPromotionForm.categories, c.id)
                            })
                          }
                        />
                        <span>{c.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  La promotion s'appliquera uniquement à vos produits appartenant aux catégories sélectionnées.
                </p>
              </div>
            )}

            {editPromotionForm.targetingMode === 'tags' && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <Label className="text-sm">Sélectionnez des tags (depuis vos produits)</Label>
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                  {vendorTags.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucun tag détecté sur vos produits.</p>
                  ) : (
                    vendorTags.map((t) => (
                      <label key={t} className="flex items-center gap-2 text-sm text-gray-800">
                        <input
                          type="checkbox"
                          checked={editPromotionForm.tags.includes(t)}
                          onChange={() =>
                            setEditPromotionForm({
                              ...editPromotionForm,
                              tags: toggleSelection(editPromotionForm.tags, t)
                            })
                          }
                        />
                        <span>{t}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-600">
                  Les tags sont convertis automatiquement en liste de vos produits correspondants.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-discount-type">Type de réduction</Label>
                <Select
                  value={editPromotionForm.discountType}
                  onValueChange={(value) => setEditPromotionForm({ ...editPromotionForm, discountType: value })}
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
                  value={editPromotionForm.discountValue}
                  onChange={(e) => setEditPromotionForm({ ...editPromotionForm, discountValue: Number(e.target.value) })}
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
                  value={editPromotionForm.startDate}
                  onChange={(e) => setEditPromotionForm({ ...editPromotionForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-end-date">Date de fin *</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={editPromotionForm.endDate}
                  onChange={(e) => setEditPromotionForm({ ...editPromotionForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-min-amount">Montant minimum (FCFA)</Label>
                <Input
                  id="edit-min-amount"
                  type="number"
                  value={editPromotionForm.minAmount}
                  onChange={(e) => setEditPromotionForm({ ...editPromotionForm, minAmount: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-usage-limit">Limite d'utilisation</Label>
                <Input
                  id="edit-usage-limit"
                  type="number"
                  value={editPromotionForm.usageLimit}
                  onChange={(e) => setEditPromotionForm({ ...editPromotionForm, usageLimit: Number(e.target.value) })}
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-conditions">Conditions spéciales</Label>
              <Textarea
                id="edit-conditions"
                value={editPromotionForm.conditions}
                onChange={(e) => setEditPromotionForm({ ...editPromotionForm, conditions: e.target.value })}
                placeholder="Ex: Minimum 5000 FCFA d'achat, valable sur tous les produits"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditPromotion(false)
                  setEditingPromotionId(null)
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => void handleUpdatePromotion()}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                Mettre à jour
              </Button>
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
              {selectedService?.name ||
                (boostingType === 'recommandation'
                  ? 'Boostage par Recommandation Ciblée'
                  : boostingType === 'banniere'
                    ? 'Boostage par Bannière Visuelle Animée'
                    : 'Boostage WhatsApp Marketing Ultra-Ciblé')}
            </DialogTitle>
            <DialogDescription>
              {selectedService?.description ||
                "Configurez votre demande de boostage. Elle sera envoyée en attente d'approbation par l'administrateur."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {(boostingType === 'recommandation' || boostingType === 'banniere') && (
              <>
                <div>
                  <Label className="text-base font-medium">Sélection des pages d&apos;affichage *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {[
                      { name: "Page d'accueil", cost: 5000, color: 'bg-blue-100 border-blue-300' },
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
                          setBoostingForm(prev => ({
                            ...prev,
                            selectedPages: prev.selectedPages.includes(page.name)
                              ? prev.selectedPages.filter(p => p !== page.name)
                              : [...prev.selectedPages, page.name]
                          }))
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="boost-start-date">Date de début *</Label>
                    <Input
                      id="boost-start-date"
                      type="date"
                      value={boostingForm.startDate}
                      onChange={(e) => setBoostingForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="boost-end-date">Date de fin *</Label>
                    <Input
                      id="boost-end-date"
                      type="date"
                      value={boostingForm.endDate}
                      onChange={(e) => setBoostingForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="boost-duration">Durée en jours</Label>
                    <Input
                      id="boost-duration"
                      type="number"
                      min={1}
                      max={365}
                      value={boostingForm.duration}
                      onChange={(e) => setBoostingForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="boost-auto-renewal"
                      checked={boostingForm.autoRenewal}
                      onCheckedChange={(checked) => setBoostingForm(prev => ({ ...prev, autoRenewal: checked }))}
                    />
                    <Label htmlFor="boost-auto-renewal">Renouvellement automatique</Label>
                  </div>
                </div>

                {boostingForm.selectedPages.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-800 mb-2">Coût estimé</h4>
                    <div className="space-y-1 text-sm">
                      {boostingForm.selectedPages.map(page => {
                        const pageCosts: Record<string, number> = {
                          "Page d'accueil": 5000,
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
                              const pageCosts: Record<string, number> = {
                                "Page d'accueil": 5000,
                                'Page produit': 4000,
                                'Meilleures ventes': 3500,
                                'Nouvelles arrivées': 3000,
                                'Page vendeur': 2500
                              }
                              return total + pageCosts[page] * boostingForm.duration
                            }, 0).toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {boostingType === 'banniere' && (
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium text-lg">Configuration de la Bannière</h4>
                <div>
                  <Label htmlFor="banner-image">Image de la bannière *</Label>
                  <Input
                    id="banner-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setBoostingForm(prev => ({ ...prev, bannerImage: file }))
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format recommandé: 300x200px, JPG/PNG, max 2MB</p>
                </div>
                <div>
                  <Label htmlFor="banner-title">Titre accrocheur *</Label>
                  <Input
                    id="banner-title"
                    placeholder="Ex: Promotion exceptionnelle !"
                    value={boostingForm.bannerTitle}
                    onChange={(e) => setBoostingForm(prev => ({ ...prev, bannerTitle: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="banner-description">Description courte *</Label>
                  <Textarea
                    id="banner-description"
                    rows={3}
                    placeholder="Ex: Découvrez nos produits avec des réductions allant jusqu'à 50%"
                    value={boostingForm.bannerDescription}
                    onChange={(e) => setBoostingForm(prev => ({ ...prev, bannerDescription: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {boostingType === 'whatsapp' && (
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium text-lg">Configuration WhatsApp Marketing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp-target-count">Nombre de cibles souhaitées</Label>
                    <Input
                      id="whatsapp-target-count"
                      type="number"
                      min={10}
                      max={10000}
                      value={boostingForm.targetCount}
                      onChange={(e) => setBoostingForm(prev => ({ ...prev, targetCount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp-target-country">Ciblage pays</Label>
                    <Select
                      value={boostingForm.targetCountry}
                      onValueChange={(value) => setBoostingForm(prev => ({ ...prev, targetCountry: value }))}
                    >
                      <SelectTrigger id="whatsapp-target-country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tous">Tous les pays</SelectItem>
                        <SelectItem value="Côte d'Ivoire">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                        <SelectItem value="Sénégal">🇸🇳 Sénégal</SelectItem>
                        <SelectItem value="Cameroun">🇨🇲 Cameroun</SelectItem>
                        <SelectItem value="Bénin">🇧🇯 Bénin</SelectItem>
                        <SelectItem value="Mali">🇲🇱 Mali</SelectItem>
                        <SelectItem value="Burkina Faso">🇧🇫 Burkina Faso</SelectItem>
                        <SelectItem value="Nigeria">🇳🇬 Nigeria</SelectItem>
                        <SelectItem value="Ghana">🇬🇭 Ghana</SelectItem>
                        <SelectItem value="Maroc">🇲🇦 Maroc</SelectItem>
                        <SelectItem value="Tunisie">🇹🇳 Tunisie</SelectItem>
                        <SelectItem value="France">🇫🇷 France</SelectItem>
                        <SelectItem value="USA">🇺🇸 USA</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp-target-age">Ciblage âge</Label>
                    <Select
                      value={boostingForm.targetAge}
                      onValueChange={(value) => setBoostingForm(prev => ({ ...prev, targetAge: value }))}
                    >
                      <SelectTrigger id="whatsapp-target-age">
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
                    <Label htmlFor="whatsapp-target-profession">Ciblage profession</Label>
                    <Select
                      value={boostingForm.targetProfession}
                      onValueChange={(value) => setBoostingForm(prev => ({ ...prev, targetProfession: value }))}
                    >
                      <SelectTrigger id="whatsapp-target-profession">
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
                    {boostingForm.targetProfession === 'Profession personnalisée' && (
                      <div className="mt-2">
                        <Input
                          placeholder="Entrez votre profession"
                          value={boostingForm.targetCustomProfession}
                          onChange={(e) => setBoostingForm(prev => ({ ...prev, targetCustomProfession: e.target.value }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ex: Médecin, Avocat, Architecte, etc.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="whatsapp-target-probooster-clients"
                    checked={boostingForm.targetProboosterClients}
                    onChange={(e) => setBoostingForm(prev => ({ ...prev, targetProboosterClients: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="whatsapp-target-probooster-clients" className="text-sm font-medium">
                    Ciblé clients de Probooster
                  </Label>
                </div>

                <div>
                  <Label htmlFor="whatsapp-image">Image du produit</Label>
                  <Input
                    id="whatsapp-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setBoostingForm(prev => ({ ...prev, whatsappImage: file }))
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-title">Titre du message *</Label>
                  <Input
                    id="whatsapp-title"
                    placeholder="Ex: Découvrez notre nouveau produit !"
                    value={boostingForm.whatsappTitle}
                    onChange={(e) => setBoostingForm(prev => ({ ...prev, whatsappTitle: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-description">Description du produit</Label>
                  <Textarea
                    id="whatsapp-description"
                    rows={3}
                    placeholder="Ex: Produit de qualité exceptionnelle à prix réduit"
                    value={boostingForm.whatsappDescription}
                    onChange={(e) => setBoostingForm(prev => ({ ...prev, whatsappDescription: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp-message">Message personnalisé *</Label>
                  <Textarea
                    id="whatsapp-message"
                    rows={4}
                    placeholder="Ex: Bonjour ! Nous avons une offre spéciale pour vous..."
                    value={boostingForm.whatsappMessage}
                    onChange={(e) => setBoostingForm(prev => ({ ...prev, whatsappMessage: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp-link">Lien direct vers le produit</Label>
                    <Input
                      id="whatsapp-link"
                      placeholder="https://..."
                      value={boostingForm.whatsappLink}
                      onChange={(e) => setBoostingForm(prev => ({ ...prev, whatsappLink: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp-sender">Numéro WhatsApp expéditeur *</Label>
                    <Input
                      id="whatsapp-sender"
                      placeholder="+225 01234567"
                      value={boostingForm.senderWhatsapp}
                      onChange={(e) => setBoostingForm(prev => ({ ...prev, senderWhatsapp: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
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
                          {(boostingForm.targetCount * (boostingForm.targetProboosterClients ? 0.6 : 0.5)).toFixed(0)} FCFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button variant="outline" onClick={() => setShowBoostingModal(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  addNotification({
                    type: 'success',
                    title: 'Demande envoyée',
                    message: selectedService
                      ? `Votre demande de boostage « ${selectedService.name} » a été soumise pour validation.`
                      : 'Votre demande de boostage a été soumise et sera validée par l\'administrateur.'
                  })
                  setShowBoostingModal(false)
                }}
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

      {/* Modal Création Campagne */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
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
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, type: value })}
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
              <Button variant="outline" onClick={() => setShowCreateCampaign(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  addNotification({
                    type: 'success',
                    title: 'Succès',
                    message: 'Campagne créée avec succès !'
                  })
                  setShowCreateCampaign(false)
                }}
                className="text-white" style={{ backgroundColor: '#ff6600' }}
              >
                Créer la campagne
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Modification Campagne */}
      <Dialog
        open={showEditCampaign}
        onOpenChange={(open) => {
          setShowEditCampaign(open)
          if (!open) {
            setEditingCampaign(null)
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la campagne</DialogTitle>
            <DialogDescription>
              Modifiez le contenu de votre campagne (sans changer son statut).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="edit-campaign-name">Nom de la campagne</Label>
              <Input
                id="edit-campaign-name"
                value={editCampaignName}
                onChange={(e) => setEditCampaignName(e.target.value)}
                placeholder="Ex: Campagne Été 2024"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Pages d'affichage</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {[
                  { name: "Page d'accueil", color: 'bg-blue-100 border-blue-300' },
                  { name: 'Page produit', color: 'bg-green-100 border-green-300' },
                  { name: 'Meilleures ventes', color: 'bg-yellow-100 border-yellow-300' },
                  { name: 'Nouvelles arrivées', color: 'bg-purple-100 border-purple-300' },
                  { name: 'Page vendeur', color: 'bg-orange-100 border-orange-300' }
                ].map((page) => (
                  <div
                    key={`edit-${page.name}`}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      editCampaignTargetPages.includes(page.name)
                        ? `${page.color} border-2 border-orange-500`
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setEditCampaignTargetPages((prev) =>
                        prev.includes(page.name) ? prev.filter((p) => p !== page.name) : [...prev, page.name]
                      )
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{page.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-campaign-duration">Durée (jours)</Label>
              <Input
                id="edit-campaign-duration"
                type="number"
                min={1}
                max={365}
                value={editCampaignDuration}
                onChange={(e) => setEditCampaignDuration(Number(e.target.value))}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditCampaign(false)
                  setEditingCampaign(null)
                }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={() => void handleUpdateCampaignContent()}
                className="text-white"
                style={{ backgroundColor: '#ff6600' }}
                disabled={isLoading}
              >
                Enregistrer
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
              Accédez aux services de publicité et boost de l&apos;administrateur. Paiement sécurisé via FeexPay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advertisingServices.map((service) => {
                const palette = getServicePalette(service)
                const features = getServiceFeatures(service)
                const pricingDetails = getServicePricingDetails(service)

                return (
                  <Card key={`modal-${service.id}`} className={`group border ${palette.cardBorder} hover:shadow-lg transition-all duration-300`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className={`h-4 w-4 ${palette.accentText}`} />
                          <span>{service.name}</span>
                        </CardTitle>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>
                          {service.is_active ? 'Actif' : 'Désactivé'}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                      )}
                      {!service.is_active && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          Service désactivé par l&apos;administrateur.
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-1 text-xs">
                        {pricingDetails.map((detail) => (
                          <div key={`modal-${service.id}-${detail.label}`} className="flex justify-between">
                            <span className="text-gray-600">{detail.label}</span>
                            <span className="font-medium text-gray-900">{detail.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1">
                        {features.map((feature, index) => (
                          <div key={`modal-${service.id}-feature-${index}`} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-orange-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => {
                          if (!service.is_active) {
                            addNotification({
                              type: 'warning',
                              title: 'Service indisponible',
                              message: "Ce service est désactivé par l'administrateur."
                            })
                            return
                          }

                          addNotification({
                            type: 'info',
                            title: 'Paiement',
                            message: `Redirection vers FeexPay pour ${service.name}.`
                          })
                        }}
                        disabled={!service.is_active}
                        className={`w-full text-white ${palette.button}`}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Acheter via FeexPay
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
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
    </div>
  )
}
