"use client"

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Info,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  User,
  X
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useNotifications } from "@/components/ui/modern-notification"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"

const DeliveryTrackingMap = dynamic(() => import("@/components/deliveries/DeliveryTrackingMap"), { ssr: false })
const DeliveryChatReplacement = dynamic(
  () => import("@/components/chat/DeliveryChatReplacement").then((m) => m.DeliveryChatReplacement),
  { ssr: false }
)
import {
  normalizeCoordinates,
  SuperAdminDeliveryRecord,
  SuperAdminDeliveryService,
  SuperAdminDeliveryStatus
} from "@/lib/services/super-admin-delivery-service"
import { SuperAdminOrderService } from "@/lib/services/super-admin-order-service"
import { getClientAccessToken, supabase } from '@/lib/supabase'

interface OrderChoice {
  id: string
  label: string
  customerId: string | null
  vendorId: string | null
}

const DELIVERY_STATUS_CONFIG: Record<SuperAdminDeliveryStatus, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  confirmed: { label: "Confirmée", tone: "border-blue-200 bg-blue-50 text-blue-700" },
  preparing: { label: "En préparation", tone: "border-purple-200 bg-purple-50 text-purple-700" },
  ready_for_pickup: { label: "Prête", tone: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  in_transit: { label: "En transit", tone: "border-sky-200 bg-sky-50 text-sky-700" },
  out_for_delivery: { label: "En cours de livraison", tone: "border-orange-200 bg-orange-50 text-orange-700" },
  delayed: { label: "Retard", tone: "border-amber-200 bg-amber-50 text-amber-700" },
  delivered: { label: "Livrée", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failed: { label: "Échec", tone: "border-rose-200 bg-rose-50 text-rose-700" },
  cancelled: { label: "Annulée", tone: "border-gray-200 bg-gray-50 text-gray-600" }
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-rose-500/10 text-rose-600",
  high: "bg-orange-500/10 text-orange-600",
  medium: "bg-blue-500/10 text-blue-600",
  low: "bg-emerald-500/10 text-emerald-600"
}

/**
 * Formatte une date ISO en texte lisible pour l'interface.
 */
function formatDate(value?: string | null): string {
  if (!value) {
    return "—"
  }

  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value))
  } catch {
    return value
  }
}

/**
 * Calcule le libellé lisible d'une progression de livraison.
 */
function formatProgressLabel(progress: number): string {
  if (progress >= 100) {
    return "Finalisé"
  }
  if (progress >= 75) {
    return "Quasi livré"
  }
  if (progress >= 50) {
    return "Mi-parcours"
  }
  if (progress >= 25) {
    return "Démarré"
  }
  return "Planifié"
}

/**
 * Section de gestion complète des livraisons côté super administrateur.
 */
export default function DeliveryManagement(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addNotification } = useNotifications()

  const SELECT_NONE_VALUE = '__none__'

  const [activeTab, setActiveTab] = useState<'config' | 'deliveries' | 'free_shipping'>('deliveries')

  const [isLoadingDeliveryConfig, setIsLoadingDeliveryConfig] = useState(false)
  const [isSavingDeliveryConfig, setIsSavingDeliveryConfig] = useState(false)
  const [globalSettingsBase, setGlobalSettingsBase] = useState<Record<string, unknown>>({})
  const [deliveryConfig, setDeliveryConfig] = useState({
    shippingCostAggregationDefault: 'max' as 'max' | 'sum',
    allowCustomerShippingAggregationOverride: true
  })

  type PickupPoint = {
    id: string
    name: string
    address: string
    city: string
    district: string
    priceXof: number
  }

  type PickupConfig = {
    enabled: boolean
    points: PickupPoint[]
  }

  const [pickupConfig, setPickupConfig] = useState<PickupConfig>({ enabled: false, points: [] })
  const [newPickupPoint, setNewPickupPoint] = useState<Omit<PickupPoint, 'id'>>({
    name: '',
    address: '',
    city: '',
    district: '',
    priceXof: 0
  })

  type FreeShippingRuleScope = 'cart_total' | 'eligible_items'

  type FreeShippingRule = {
    id: string
    isActive: boolean
    priority: number
    title: string
    mode: 'standard'
    scope: FreeShippingRuleScope
    minEligibleSubtotalXof: number | null
    minEligibleQty: number | null
    vendorIds: string[]
    productIds: string[]
    categoryIds: string[]
    zone: 'local' | 'regional' | 'national' | 'international' | '*'
    localDistrict: string | '*'
    department: string | '*'
    city: string | '*'
    arrondissement: string | '*'
    district: string | '*'
  }

  type FreeShippingConfig = {
    enabled: boolean
    rules: FreeShippingRule[]
  }

  const [freeShippingConfig, setFreeShippingConfig] = useState<FreeShippingConfig>({ enabled: false, rules: [] })

  type CategoryOption = { id: string; name: string; parentId: string | null }
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  type ProductOption = { id: string; name: string; vendorId: string | null }
  const [productSuggestions, setProductSuggestions] = useState<ProductOption[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  type VendorOption = { id: string; label: string }
  const [vendorSuggestions, setVendorSuggestions] = useState<VendorOption[]>([])
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)

  const [productSearch, setProductSearch] = useState('')
  const [vendorSearch, setVendorSearch] = useState('')
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false)
  const [isVendorPickerOpen, setIsVendorPickerOpen] = useState(false)
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)

  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false)
  const [editRuleId, setEditRuleId] = useState<string | null>(null)
  const [editRuleDraft, setEditRuleDraft] = useState<FreeShippingRule | null>(null)
  const [editProductSearch, setEditProductSearch] = useState('')
  const [editVendorSearch, setEditVendorSearch] = useState('')
  const [editCategorySearch, setEditCategorySearch] = useState('')
  const [isEditProductPickerOpen, setIsEditProductPickerOpen] = useState(false)
  const [isEditVendorPickerOpen, setIsEditVendorPickerOpen] = useState(false)
  const [isEditCategoryPickerOpen, setIsEditCategoryPickerOpen] = useState(false)

  const [categorySearch, setCategorySearch] = useState('')
  const filteredCategoryOptions = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return categoryOptions
    return categoryOptions.filter((cat) => cat.name.toLowerCase().includes(query))
  }, [categoryOptions, categorySearch])

  const filteredEditCategoryOptions = useMemo(() => {
    const query = editCategorySearch.trim().toLowerCase()
    if (!query) return categoryOptions
    return categoryOptions.filter((cat) => cat.name.toLowerCase().includes(query))
  }, [categoryOptions, editCategorySearch])

  /**
   * Exécute un fetch vers les endpoints Super Admin en injectant explicitement le token Supabase.
   * Objectif: éviter les 401 "Token Supabase manquant" quand les cookies ne sont pas visibles côté route handler.
   */
  const fetchSuperAdmin = useCallback(
    async (path: string, init?: RequestInit) => {
      let accessToken = getClientAccessToken()

      if (!accessToken) {
        try {
          const { data } = await supabase.auth.getSession()
          accessToken = data?.session?.access_token ?? null
        } catch {
          accessToken = null
        }
      }

      if (!accessToken) {
        throw new Error('Session Supabase manquante ou expirée. Veuillez vous reconnecter.')
      }

      const headers = new Headers(init?.headers ?? {})
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }

      return fetch(path, {
        ...init,
        headers,
        credentials: 'include',
        cache: 'no-store'
      })
    },
    []
  )

  /**
   * Charge une liste de produits (typeahead) pour la sélection dans les règles livraison gratuite.
   */
  const loadProductOptions = useCallback(
    async (search: string) => {
      try {
        setIsLoadingProducts(true)
        const params = new URLSearchParams()
        if (search.trim().length > 0) params.set('search', search.trim())
        params.set('limit', '20')

        const resp = await fetchSuperAdmin(`/api/super-admin/products?${params.toString()}`, {
          method: 'GET'
        })

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}))
          throw new Error(body?.error ?? 'Impossible de charger les produits.')
        }

        const json = await resp.json().catch(() => ({}))
        const payload = (json as any)?.data
        const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : []

        setProductSuggestions(
          (items ?? [])
            .filter(Boolean)
            .map((row: any) => ({
              id: String(row?.id ?? ''),
              name: String(row?.name ?? '').trim() || String(row?.title ?? '').trim() || 'Produit',
              vendorId: row?.vendor_id ? String(row.vendor_id) : null
            }))
            .filter((row: ProductOption) => row.id.length > 0)
        )
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Produits',
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      } finally {
        setIsLoadingProducts(false)
      }
    },
    [addNotification, fetchSuperAdmin]
  )

  /**
   * Charge une liste de vendeurs (typeahead) via /api/super-admin/users.
   */
  const loadVendorOptions = useCallback(
    async (search: string) => {
      try {
        setIsLoadingVendors(true)
        const params = new URLSearchParams()
        params.set('role', 'vendor')
        params.set('limit', '20')
        if (search.trim().length > 0) params.set('search', search.trim())

        const resp = await fetchSuperAdmin(`/api/super-admin/users?${params.toString()}`, {
          method: 'GET'
        })

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}))
          throw new Error(body?.error ?? 'Impossible de charger les vendeurs.')
        }

        const json = await resp.json().catch(() => ({}))
        const data = (json as any)?.data
        const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []

        setVendorSuggestions(
          (items ?? [])
            .filter(Boolean)
            .map((row: any) => {
              const id = String(row?.id ?? '')
              const email = String(row?.email ?? '').trim()
              const rawName = String(row?.name ?? '').trim()
              const first = String(row?.firstName ?? row?.first_name ?? '').trim()
              const last = String(row?.lastName ?? row?.last_name ?? '').trim()
              const composedName = `${first} ${last}`.trim()
              const name = rawName || composedName
              const label = name.length > 0 ? `${name}${email ? ` — ${email}` : ''}` : email || id
              return { id, label }
            })
            .filter((row: VendorOption) => row.id.length > 0)
        )
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Vendeurs',
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      } finally {
        setIsLoadingVendors(false)
      }
    },
    [addNotification]
  )

  useEffect(() => {
    let active = true
    const t = window.setTimeout(() => {
      if (!active) return
      void loadProductOptions(productSearch)
    }, 250)
    return () => {
      active = false
      window.clearTimeout(t)
    }
  }, [loadProductOptions, productSearch])

  useEffect(() => {
    let active = true
    const t = window.setTimeout(() => {
      if (!active) return
      void loadProductOptions(editProductSearch)
    }, 250)
    return () => {
      active = false
      window.clearTimeout(t)
    }
  }, [editProductSearch, loadProductOptions])

  useEffect(() => {
    let active = true
    const t = window.setTimeout(() => {
      if (!active) return
      void loadVendorOptions(vendorSearch)
    }, 250)
    return () => {
      active = false
      window.clearTimeout(t)
    }
  }, [loadVendorOptions, vendorSearch])

  useEffect(() => {
    let active = true
    const t = window.setTimeout(() => {
      if (!active) return
      void loadVendorOptions(editVendorSearch)
    }, 250)
    return () => {
      active = false
      window.clearTimeout(t)
    }
  }, [editVendorSearch, loadVendorOptions])

  const [newFreeShippingRule, setNewFreeShippingRule] = useState<Omit<FreeShippingRule, 'id'>>({
    isActive: true,
    priority: 100,
    title: 'Règle livraison gratuite',
    mode: 'standard',
    scope: 'eligible_items',
    minEligibleSubtotalXof: null,
    minEligibleQty: null,
    vendorIds: [],
    productIds: [],
    categoryIds: [],
    zone: '*',
    localDistrict: '*',
    department: '*',
    city: '*',
    arrondissement: '*',
    district: '*'
  })

  /**
   * Charge les catégories produits (Super Admin) pour permettre une sélection par nom.
   */
  const loadCategoryOptions = useCallback(async () => {
    try {
      setIsLoadingCategories(true)
      const resp = await fetchSuperAdmin('/api/super-admin/categories?includeInactive=false', {
        method: 'GET'
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Impossible de charger les catégories.')
      }

      const json = await resp.json().catch(() => ({}))
      const items = (json as any)?.data?.items
      if (!Array.isArray(items)) {
        setCategoryOptions([])
        return
      }

      setCategoryOptions(
        items
          .filter(Boolean)
          .map((row: any) => ({
            id: String(row?.id ?? ''),
            name: String(row?.name ?? 'Catégorie'),
            parentId: row?.parent_id ? String(row.parent_id) : null
          }))
          .filter((row: CategoryOption) => row.id.length > 0)
      )
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Catégories produits',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsLoadingCategories(false)
    }
  }, [addNotification, fetchSuperAdmin])

  /**
   * Ouvre le modal d'édition d'une règle livraison gratuite.
   */
  const openEditFreeShippingRule = useCallback(
    (rule: FreeShippingRule) => {
      setEditRuleId(rule.id)
      setEditRuleDraft(rule)
      setEditProductSearch('')
      setEditVendorSearch('')
      setEditCategorySearch('')
      setIsEditRuleOpen(true)
      void loadCategoryOptions()
    },
    [loadCategoryOptions]
  )

  /**
   * Ajoute une règle de livraison gratuite au state local (persistée à la sauvegarde globale).
   */
  const handleAddFreeShippingRule = useCallback(() => {
    setFreeShippingConfig((prev) => {
      const id = `fs_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      const rule: FreeShippingRule = { id, ...newFreeShippingRule }
      return {
        ...prev,
        rules: [rule, ...prev.rules]
      }
    })
  }, [newFreeShippingRule])

  /**
   * Met à jour une règle de livraison gratuite.
   */
  const handleUpdateFreeShippingRule = useCallback((id: string, patch: Partial<FreeShippingRule>) => {
    setFreeShippingConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => (r.id === id ? { ...r, ...patch } : r))
    }))
  }, [])

  /**
   * Supprime une règle de livraison gratuite.
   */
  const handleRemoveFreeShippingRule = useCallback((id: string) => {
    setFreeShippingConfig((prev) => ({
      ...prev,
      rules: prev.rules.filter((r) => r.id !== id)
    }))
  }, [])

  type DeliveryPricingModel =
    | 'zone'
    | 'quantity'
    | 'weight'
    | 'zone_quantity'
    | 'zone_weight'
    | 'zone_quantity_weight'

  type DeliveryPriceType = 'fixed' | 'per_unit'
  type DeliveryPriceUnit = 'order' | 'item' | 'kg'

  type DeliveryGeo = {
    local: {
      city: string
      districts: string[]
    }
    national: {
      country: string
      departments: {
        name: string
        cities: {
          name: string
          arrondissements: {
            name: string
            districts: string[]
          }[]
        }[]
      }[]
    }
  }

  type DeliveryRule = {
    id: string
    isActive: boolean
    mode: 'standard' | 'express'
    zone: 'local' | 'regional' | 'national' | 'international'

    /**
     * Ciblage géographique: la règle peut s'appliquer à une zone entière (*) ou à un chemin précis.
     * - Local: localDistrict
     * - National: department/city/arrondissement/district
     */
    localDistrict: string | '*'
    department: string | '*'
    city: string | '*'
    arrondissement: string | '*'
    district: string | '*'

    pricingModel: DeliveryPricingModel
    priceType: DeliveryPriceType
    unit: DeliveryPriceUnit
    currency: string
    minQty: number | null
    maxQty: number | null
    minWeightKg: number | null
    maxWeightKg: number | null
    price: number
    etaMinDays: number | null
    etaMaxDays: number | null
  }

  const [deliveryRules, setDeliveryRules] = useState<DeliveryRule[]>([])
  const [deliveryGeo, setDeliveryGeo] = useState<DeliveryGeo>({
    local: { city: 'Abomey-Calavi', districts: [] },
    national: { country: 'Bénin', departments: [] }
  })

  const [importGeoJson, setImportGeoJson] = useState('')

  const [geoSearchScope, setGeoSearchScope] = useState<'local' | 'national'>('local')
  const [geoSearchQuery, setGeoSearchQuery] = useState('')
  const [geoSearchResults, setGeoSearchResults] = useState<{ label: string; displayName: string }[]>([])
  const [isGeoSearching, setIsGeoSearching] = useState(false)

  const [newLocalDistrict, setNewLocalDistrict] = useState('')
  const [newDepartmentName, setNewDepartmentName] = useState('')
  const [selectedDepartmentName, setSelectedDepartmentName] = useState('')
  const [newCityName, setNewCityName] = useState('')
  const [selectedCityName, setSelectedCityName] = useState('')
  const [newArrondissementName, setNewArrondissementName] = useState('')
  const [selectedArrondissementName, setSelectedArrondissementName] = useState('')
  const [newNationalDistrict, setNewNationalDistrict] = useState('')
  const [newDeliveryRule, setNewDeliveryRule] = useState<Omit<DeliveryRule, 'id'>>({
    isActive: true,
    mode: 'standard',
    zone: 'local',

    localDistrict: '*',
    department: '*',
    city: '*',
    arrondissement: '*',
    district: '*',

    pricingModel: 'zone',
    priceType: 'fixed',
    unit: 'order',
    currency: 'XOF',
    minQty: null,
    maxQty: null,
    minWeightKg: null,
    maxWeightKg: null,
    price: 0,
    etaMinDays: null,
    etaMaxDays: null
  })
  const [deliveries, setDeliveries] = useState<SuperAdminDeliveryRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  type DriverSuggestion = {
    id: string
    user_id: string
    first_name: string | null
    last_name: string | null
    avatar_url?: string | null
    phone: string | null
    whatsapp: string | null
    transport_mode: string | null
    vehicle_plate: string | null
    vehicle_color: string | null
    neighborhood: string | null
    rating: number | null
    completed_deliveries: number
  }

  const [driverSuggestions, setDriverSuggestions] = useState<DriverSuggestion[]>([])
  const [isLoadingDriverSuggestions, setIsLoadingDriverSuggestions] = useState(false)

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [orderFilter, setOrderFilter] = useState<string>("all")

  const [selectedDelivery, setSelectedDelivery] = useState<SuperAdminDeliveryRecord | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<SuperAdminDeliveryRecord | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeletingDelivery, setIsDeletingDelivery] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [deliveryProofs, setDeliveryProofs] = useState<Array<{ id: string; public_url: string | null; created_at: string | null }>>([])
  const [isLoadingProofs, setIsLoadingProofs] = useState(false)

    const driverPoint = useMemo(() => {
    const coords = normalizeCoordinates(selectedDelivery?.coordinates)
    if (!coords) return null
    return { lat: coords.lat, lng: coords.lng, label: 'Livreur' }
  }, [selectedDelivery?.coordinates])

  const destinationPoint = useMemo(() => {
    const coords = normalizeCoordinates((selectedDelivery as any)?.destinationCoordinates)
    if (!coords) return null
    return { lat: coords.lat, lng: coords.lng, label: 'Client' }
  }, [(selectedDelivery as any)?.destinationCoordinates])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingDeliveryId, setEditingDeliveryId] = useState<string | null>(null)

  type SimpleOption = { id: string; name: string }
  const [carrierOptions, setCarrierOptions] = useState<SimpleOption[]>([])
  const [shippingMethodOptions, setShippingMethodOptions] = useState<SimpleOption[]>([])
  const [isLoadingCarrierOptions, setIsLoadingCarrierOptions] = useState(false)
  const [isLoadingShippingMethodOptions, setIsLoadingShippingMethodOptions] = useState(false)
  const [orderChoices, setOrderChoices] = useState<OrderChoice[]>([])
  const [isLoadingOrderChoices, setIsLoadingOrderChoices] = useState(false)

  const [selectedOrderCoordinates, setSelectedOrderCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  const [newDeliveryForm, setNewDeliveryForm] = useState({
    orderId: "",
    customerId: "",
    vendorId: "",
    status: "pending" as SuperAdminDeliveryStatus,
    priority: "medium",
    eta: "",
    dispatchedAt: "",
    deliveredAt: "",
    cancelledAt: "",
    currentLocation: "",
    progressPercent: "",
    liveLat: "",
    liveLng: "",
    trackingNumber: "",
    shippingMethodId: "",
    carrierId: "",
    driverId: "",
    driverName: "",
    driverPhone: "",
    driverVehicle: "",
    metadataJson: ""
  })

  /**
   * Charge les méthodes de livraison et transporteurs disponibles (pour création/édition).
   */
  const loadDeliveryOptionLists = useCallback(async () => {
    try {
      setIsLoadingCarrierOptions(true)
      setIsLoadingShippingMethodOptions(true)

      const [carrierResp, methodResp] = await Promise.all([
        fetchSuperAdmin('/api/super-admin/carriers', { method: 'GET' }),
        fetchSuperAdmin('/api/super-admin/shipping-methods', { method: 'GET' })
      ])

      if (carrierResp.ok) {
        const json = await carrierResp.json().catch(() => ({}))
        const list = Array.isArray((json as any)?.data) ? (json as any).data : []
        setCarrierOptions(
          list
            .map((row: any) => ({ id: String(row?.id ?? ''), name: String(row?.name ?? '').trim() }))
            .filter((row: SimpleOption) => row.id.length > 0)
        )
      } else {
        const body = await carrierResp.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Impossible de charger les transporteurs.')
      }

      if (methodResp.ok) {
        const json = await methodResp.json().catch(() => ({}))
        const list = Array.isArray((json as any)?.data) ? (json as any).data : []
        setShippingMethodOptions(
          list
            .map((row: any) => ({ id: String(row?.id ?? ''), name: String(row?.name ?? '').trim() }))
            .filter((row: SimpleOption) => row.id.length > 0)
        )
      } else {
        const body = await methodResp.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Impossible de charger les méthodes de livraison.')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Options livraison',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsLoadingCarrierOptions(false)
      setIsLoadingShippingMethodOptions(false)
    }
  }, [addNotification, fetchSuperAdmin])

  /**
   * Génère un numéro de suivi lisible côté Super Admin.
   */
  const generateTrackingNumber = useCallback(() => {
    const ts = Date.now().toString(36).toUpperCase()
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase()
    return `DLV-${ts}-${rnd}`
  }, [])

  const plannedOrderNumber = useMemo(() => {
    const raw = searchParams?.get('orderNumber')
    return raw ? String(raw).trim() : ''
  }, [searchParams])

  const selectedOrderChoice = useMemo(() => {
    if (!newDeliveryForm.orderId) return null
    return orderChoices.find((o) => o.id === newDeliveryForm.orderId) ?? null
  }, [newDeliveryForm.orderId, orderChoices])

  useEffect(() => {
    if (!isCreateOpen) return
    setNewDeliveryForm((prev) => {
      if (prev.trackingNumber?.trim().length > 0) return prev
      return { ...prev, trackingNumber: generateTrackingNumber() }
    })
  }, [generateTrackingNumber, isCreateOpen])

  /**
   * Construit un libellé lisible pour l'UI à partir d'une suggestion livreur.
   */
  const formatDriverSuggestionLabel = useCallback((driver: DriverSuggestion): string => {
    const name = `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim() || 'Livreur'
    const phone = driver.phone ?? driver.whatsapp
    const vehicle = [driver.transport_mode, driver.vehicle_plate].filter(Boolean).join(' • ')
    const zone = driver.neighborhood ? ` — ${driver.neighborhood}` : ''
    const details = [phone, vehicle].filter(Boolean).join(' — ')
    return `${name}${zone}${details ? ` (${details})` : ''}`
  }, [])

  useEffect(() => {
    void loadCategoryOptions()
  }, [loadCategoryOptions])

  /**
   * Charge des suggestions de livreurs disponibles en fonction de la commande sélectionnée.
   */
  const loadDriverSuggestions = useCallback(
    async (orderId: string) => {
      if (!orderId) {
        setDriverSuggestions([])
        return
      }

      try {
        setIsLoadingDriverSuggestions(true)
        const response = await fetchSuperAdmin(
          `/api/super-admin/drivers/suggestions?orderId=${encodeURIComponent(orderId)}`,
          {
            method: 'GET'
          }
        )

        if (!response.ok) {
          throw new Error('Impossible de charger les suggestions de livreurs.')
        }

        const payload = (await response.json()) as {
          data?: DriverSuggestion[]
          meta?: {
            city?: string | null
            neighborhood?: string | null
            shouldFilterZone?: boolean
            counts?: { total?: number; afterZone?: number; suggested?: number }
          }
        }

        const suggested = payload.data ?? []
        setDriverSuggestions(suggested)

        if (suggested.length === 0) {
          const city = payload.meta?.city ?? null
          const neighborhood = payload.meta?.neighborhood ?? null
          const total = payload.meta?.counts?.total
          const afterZone = payload.meta?.counts?.afterZone
          const suggestedCount = payload.meta?.counts?.suggested

          const zoneLabel = [city, neighborhood].filter(Boolean).join(' / ')
          const countsLabel =
            [
              typeof total === 'number' ? `total=${total}` : null,
              typeof afterZone === 'number' ? `aprèsZone=${afterZone}` : null,
              typeof suggestedCount === 'number' ? `suggestions=${suggestedCount}` : null
            ]
              .filter(Boolean)
              .join(', ') || null

          addNotification({
            type: 'warning',
            title: 'Suggestions livreurs',
            message:
              `Aucun livreur suggéré${zoneLabel ? ` (zone: ${zoneLabel})` : ''}.` +
              (countsLabel ? ` (${countsLabel})` : '') +
              ` Vérifie: statut approuvé/actif, is_available=true, et disponibilité (créneau en cours).`
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        setDriverSuggestions([])
        addNotification({
          type: 'warning',
          title: 'Suggestions livreurs',
          message
        })
      } finally {
        setIsLoadingDriverSuggestions(false)
      }
    },
    [addNotification, fetchSuperAdmin]
  )

  /**
   * Exporte deliveryGeo en JSON (pour préparer un pré-remplissage complet côté Super Admin).
   */
  const handleExportGeoJson = useCallback(() => {
    try {
      setImportGeoJson(JSON.stringify(deliveryGeo, null, 2))
      addNotification({
        type: 'success',
        title: 'Zones & quartiers',
        message: 'JSON exporté dans la zone de texte.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Zones & quartiers',
        message: error instanceof Error ? error.message : 'Export impossible.'
      })
    }
  }, [addNotification, deliveryGeo])

  /**
   * Importe deliveryGeo depuis un JSON collé (permet d'injecter la liste exhaustive des quartiers/arrondissements du Bénin).
   */
  const handleImportGeoJson = useCallback(() => {
    try {
      const parsed = JSON.parse(importGeoJson)
      if (!parsed || typeof parsed !== 'object') throw new Error('JSON invalide')
      setDeliveryGeo(parsed as DeliveryGeo)
      addNotification({
        type: 'success',
        title: 'Zones & quartiers',
        message: 'JSON importé. Pensez à cliquer sur Sauvegarder.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Zones & quartiers',
        message: error instanceof Error ? error.message : 'Import impossible.'
      })
    }
  }, [addNotification, importGeoJson])

  /**
   * Pré-remplit la liste des départements du Bénin (sans villes/arrondissements/quartiers).
   */
  const handlePrefillBeninDepartments = useCallback(() => {
    const departments = [
      'Alibori',
      'Atacora',
      'Atlantique',
      'Borgou',
      'Collines',
      'Couffo',
      'Donga',
      'Littoral',
      'Mono',
      'Ouémé',
      'Plateau',
      'Zou'
    ]

    setDeliveryGeo((prev) => {
      const existing = new Set(prev.national.departments.map((d) => d.name.toLowerCase()))
      const toAdd = departments.filter((d) => !existing.has(d.toLowerCase())).map((name) => ({ name, cities: [] }))
      if (toAdd.length === 0) return prev
      return {
        ...prev,
        national: {
          ...prev.national,
          departments: [...toAdd, ...prev.national.departments]
        }
      }
    })

    addNotification({
      type: 'success',
      title: 'Zones & quartiers',
      message: 'Départements du Bénin ajoutés. Tu peux ensuite ajouter les villes/arrondissements.'
    })
  }, [addNotification])

  /**
   * Recherche des suggestions de quartiers/lieux via l'API publique (proxy Nominatim).
   */
  const handleGeoSearch = useCallback(async () => {
    const q = String(geoSearchQuery ?? '').trim()
    if (q.length === 0) {
      setGeoSearchResults([])
      return
    }

    try {
      setIsGeoSearching(true)
      const city = geoSearchScope === 'local' ? deliveryGeo.local.city : selectedCityName
      const resp = await fetch(
        `/api/public/geo-suggest?q=${encodeURIComponent(q)}&country=${encodeURIComponent(deliveryGeo.national.country)}&city=${encodeURIComponent(city)}`,
        { method: 'GET', cache: 'no-store' }
      )

      const json = resp.ok ? await resp.json().catch(() => ({})) : {}
      const raw = (json as any)?.data
      const list = Array.isArray(raw)
        ? raw
            .map((r: any) => ({
              label: String(r?.label ?? '').trim(),
              displayName: String(r?.displayName ?? '').trim()
            }))
            .filter((r: any) => r.label.length > 0)
        : []

      setGeoSearchResults(list.slice(0, 12))
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Recherche quartiers',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsGeoSearching(false)
    }
  }, [addNotification, deliveryGeo.local.city, deliveryGeo.national.country, geoSearchQuery, geoSearchScope, selectedCityName])

  /**
   * Ajoute une suggestion (quartier) dans la configuration locale ou nationale.
   */
  const handleAddGeoSuggestion = useCallback(
    (label: string) => {
      const name = String(label ?? '').trim()
      if (name.length === 0) return

      if (geoSearchScope === 'local') {
        setDeliveryGeo((prev) => {
          const exists = prev.local.districts.some((d) => d.toLowerCase() === name.toLowerCase())
          if (exists) return prev
          return { ...prev, local: { ...prev.local, districts: [name, ...prev.local.districts] } }
        })

        addNotification({
          type: 'success',
          title: 'Recherche quartiers',
          message: `Quartier ajouté (local) : ${name}`
        })
        return
      }

      // national
      if (selectedDepartmentName.trim().length === 0 || selectedCityName.trim().length === 0 || selectedArrondissementName.trim().length === 0) {
        addNotification({
          type: 'warning',
          title: 'Recherche quartiers',
          message: 'Sélectionne d’abord Département, Ville et Arrondissement.'
        })
        return
      }

      setDeliveryGeo((prev) => {
        const deptName = selectedDepartmentName
        const cityName = selectedCityName
        const arrName = selectedArrondissementName

        return {
          ...prev,
          national: {
            ...prev.national,
            departments: prev.national.departments.map((d) => {
              if (d.name !== deptName) return d
              return {
                ...d,
                cities: d.cities.map((c) => {
                  if (c.name !== cityName) return c
                  return {
                    ...c,
                    arrondissements: c.arrondissements.map((a) => {
                      if (a.name !== arrName) return a
                      const exists = a.districts.some((x) => x.toLowerCase() === name.toLowerCase())
                      if (exists) return a
                      return { ...a, districts: [name, ...a.districts] }
                    })
                  }
                })
              }
            })
          }
        }
      })

      addNotification({
        type: 'success',
        title: 'Recherche quartiers',
        message: `Quartier ajouté (national) : ${name}`
      })
    },
    [
      addNotification,
      geoSearchScope,
      selectedArrondissementName,
      selectedCityName,
      selectedDepartmentName
    ]
  )

  const vendorOptions = useMemo(() => {
    const ids = new Map<string, string>()
    deliveries.forEach(delivery => {
      if (delivery.vendorId) {
        ids.set(delivery.vendorId, delivery.vendorId)
      }
    })
    return Array.from(ids.values())
  }, [deliveries])

  const orderOptions = useMemo(() => deliveries.map(delivery => delivery.orderId), [deliveries])

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(delivery => {
      const matchesStatus = statusFilter === "all" || delivery.status === statusFilter
      const matchesVendor = vendorFilter === "all" || delivery.vendorId === vendorFilter
      const matchesOrder = orderFilter === "all" || delivery.orderId === orderFilter
      const matchesSearch =
        searchTerm.length === 0
          ? true
          : [
              delivery.orderNumber,
              delivery.trackingNumber,
              delivery.driver?.name,
              delivery.currentLocation
            ]
              .filter(Boolean)
              .some(value => value?.toLowerCase().includes(searchTerm.toLowerCase()))

      return matchesStatus && matchesVendor && matchesOrder && matchesSearch
    })
  }, [deliveries, statusFilter, vendorFilter, orderFilter, searchTerm])

  const statusStats = useMemo(() => {
    return deliveries.reduce(
      (acc, delivery) => {
        acc.total += 1
        acc.byStatus[delivery.status] = (acc.byStatus[delivery.status] ?? 0) + 1
        if (delivery.status === "delivered") {
          acc.delivered += 1
        }
        if (delivery.status === "delayed" || delivery.status === "failed") {
          acc.issues += 1
        }
        return acc
      },
      {
        total: 0,
        delivered: 0,
        issues: 0,
        byStatus: {} as Record<SuperAdminDeliveryStatus, number>
      }
    )
  }, [deliveries])

  /**
   * Charge les livraisons depuis l'API avec gestion des erreurs et notifications.
   */
  const loadDeliveries = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadingError(null)
      const data = await SuperAdminDeliveryService.list()
      setDeliveries(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      setLoadingError(message)
      addNotification({
        type: "error",
        title: "Chargement des livraisons",
        message
      })
    } finally {
      setIsLoading(false)
    }
  }, [addNotification])

  /**
   * Charge les commandes éligibles pour faciliter la création d'une livraison.
   */
  const loadOrderChoices = useCallback(async () => {
    try {
      setIsLoadingOrderChoices(true)
      const response: any = await SuperAdminOrderService.list({ limit: 100 })

      const rawOrders: any[] = (() => {
        if (Array.isArray(response)) return response
        if (Array.isArray(response?.data)) return response.data
        if (Array.isArray(response?.items)) return response.items
        if (Array.isArray(response?.data?.items)) return response.data.items
        return []
      })()

      if (rawOrders.length === 0) {
        setOrderChoices([])
        return
      }

      const mapped = rawOrders
        .map((order: any) => {
          const id = String(order?.id ?? '').trim()
          if (!id) return null
          const orderNumberRaw = String(order?.order_number ?? '').trim()
          const orderNumber = orderNumberRaw.length > 0 ? orderNumberRaw : `CMD-${id.slice(0, 8).toUpperCase()}`
          const customerName = String(order?.customer_name ?? '').trim()
          const itemsRaw = Array.isArray(order?.items)
            ? order.items
            : Array.isArray(order?.order_items)
              ? order.order_items
              : []

          const productNames = (itemsRaw as any[])
            .map((it) => String(it?.product_name ?? it?.name ?? '').trim())
            .filter((x) => x.length > 0)

          const productsLabel = productNames.length > 0
            ? productNames.slice(0, 3).join(', ') + (productNames.length > 3 ? '…' : '')
            : ''

          const customerId = order?.customer_id ? String(order.customer_id).trim() : null
          const vendorId = order?.vendor_id ? String(order.vendor_id).trim() : null

          return {
            id,
            label: `${orderNumber}${productsLabel ? ` — ${productsLabel}` : ''}${customerName ? ` — ${customerName}` : ''}`,
            customerId,
            vendorId
          }
        })
        .filter(Boolean) as OrderChoice[]

      setOrderChoices(mapped)
    } catch (error) {
      console.error('❌ Impossible de récupérer les commandes disponibles', error)
      setOrderChoices([])
      addNotification({
        type: 'error',
        title: 'Chargement des commandes',
        message: error instanceof Error ? error.message : 'Impossible de charger les commandes à livrer.'
      })
    } finally {
      setIsLoadingOrderChoices(false)
    }
  }, [addNotification])

  useEffect(() => {
    void loadDeliveries()
  }, [loadDeliveries])

  useEffect(() => {
    let active = true

    const loadConfig = async () => {
      try {
        setIsLoadingDeliveryConfig(true)
        const resp = await fetchSuperAdmin('/api/super-admin/settings?scopes=global', {
          method: 'GET'
        })

        const json = resp.ok ? await resp.json().catch(() => ({})) : {}
        const data = (json as any)?.data
        const record = Array.isArray(data) ? data.find((row: any) => row?.scope === 'global') : null
        const settings = record?.settings ?? {}
        const cfg = (settings as any)?.deliveryConfig ?? {}
        const rulesRaw: unknown = (settings as any)?.deliveryRules ?? []
        const geoRaw: unknown = (settings as any)?.deliveryGeo ?? {}
        const freeShippingRaw: unknown = (settings as any)?.freeShippingConfig
        const pickupRaw: unknown = (settings as any)?.pickupConfig ?? (cfg as any)?.pickupConfig

        const next = {
          shippingCostAggregationDefault: cfg?.shippingCostAggregationDefault === 'sum' ? 'sum' : 'max',
          allowCustomerShippingAggregationOverride: cfg?.allowCustomerShippingAggregationOverride !== false
        }

        const normalizePickupConfig = (raw: unknown): PickupConfig => {
          const fallback: PickupConfig = { enabled: false, points: [] }
          if (!raw || typeof raw !== 'object') return fallback
          const enabled = (raw as any)?.enabled === true
          const pointsRaw = Array.isArray((raw as any)?.points) ? (raw as any).points : []
          const points = pointsRaw
            .filter(Boolean)
            .map((p: any) => {
              const id = String(p?.id ?? '').trim()
              const name = String(p?.name ?? '').trim()
              const address = String(p?.address ?? '').trim()
              const city = String(p?.city ?? '').trim()
              const district = String(p?.district ?? '').trim()
              const priceXof = typeof p?.priceXof === 'number' ? p.priceXof : Number(p?.priceXof ?? 0) || 0
              return {
                id: id.length > 0 ? id : `pickup_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                name: name || 'Point relais',
                address,
                city,
                district,
                priceXof: Number.isFinite(priceXof) ? Math.max(0, Math.ceil(priceXof)) : 0
              } satisfies PickupPoint
            })
            .filter((p: PickupPoint) => Boolean(p.id) && Boolean(p.name))
          return { enabled, points }
        }

        const normalizeRules = (raw: unknown): DeliveryRule[] => {
          if (!Array.isArray(raw)) return []
          return (raw as any[])
            .filter(Boolean)
            .map((r) => {
              const id = String(r?.id ?? '')
              return {
                id: id.length > 0 ? id : `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                isActive: r?.isActive !== false,
                mode: r?.mode === 'express' ? 'express' : 'standard',
                zone:
                  r?.zone === 'international'
                    ? 'international'
                    : r?.zone === 'national'
                      ? 'national'
                      : r?.zone === 'regional'
                        ? 'regional'
                        : 'local',

                localDistrict: String(r?.localDistrict ?? '*') || '*',
                department: String(r?.department ?? '*') || '*',
                city: String(r?.city ?? '*') || '*',
                arrondissement: String(r?.arrondissement ?? '*') || '*',
                district: String(r?.district ?? '*') || '*',

                pricingModel:
                  r?.pricingModel === 'quantity'
                    ? 'quantity'
                    : r?.pricingModel === 'weight'
                      ? 'weight'
                      : r?.pricingModel === 'zone_quantity'
                        ? 'zone_quantity'
                        : r?.pricingModel === 'zone_weight'
                          ? 'zone_weight'
                          : r?.pricingModel === 'zone_quantity_weight'
                            ? 'zone_quantity_weight'
                            : 'zone',
                priceType: r?.priceType === 'per_unit' ? 'per_unit' : 'fixed',
                unit: r?.unit === 'kg' ? 'kg' : r?.unit === 'item' ? 'item' : 'order',
                currency: String(r?.currency ?? 'XOF') || 'XOF',
                minQty: typeof r?.minQty === 'number' ? r.minQty : r?.minQty == null ? null : Number(r.minQty) || null,
                maxQty: typeof r?.maxQty === 'number' ? r.maxQty : r?.maxQty == null ? null : Number(r.maxQty) || null,
                minWeightKg: typeof r?.minWeightKg === 'number' ? r.minWeightKg : r?.minWeightKg == null ? null : Number(r.minWeightKg) || null,
                maxWeightKg: typeof r?.maxWeightKg === 'number' ? r.maxWeightKg : r?.maxWeightKg == null ? null : Number(r.maxWeightKg) || null,
                price: typeof r?.price === 'number' ? r.price : Number(r?.price) || 0,
                etaMinDays: typeof r?.etaMinDays === 'number' ? r.etaMinDays : r?.etaMinDays == null ? null : Number(r.etaMinDays) || null,
                etaMaxDays: typeof r?.etaMaxDays === 'number' ? r.etaMaxDays : r?.etaMaxDays == null ? null : Number(r.etaMaxDays) || null
              } satisfies DeliveryRule
            })
        }

        /**
         * Normalise la structure deliveryGeo pour garantir un objet conforme à DeliveryGeo.
         */
        const normalizeGeo = (raw: unknown): DeliveryGeo => {
          const fallback: DeliveryGeo = {
            local: { city: 'Abomey-Calavi', districts: [] },
            national: { country: 'Bénin', departments: [] }
          }

          if (!raw || typeof raw !== 'object') return fallback

          const localRaw = (raw as any)?.local
          const nationalRaw = (raw as any)?.national

          const localCity = typeof localRaw?.city === 'string' ? localRaw.city : fallback.local.city
          const localDistricts = Array.isArray(localRaw?.districts)
            ? localRaw.districts.map((x: any) => String(x)).filter((x: string) => x.trim().length > 0)
            : fallback.local.districts

          const country = typeof nationalRaw?.country === 'string' ? nationalRaw.country : fallback.national.country
          const departments = Array.isArray(nationalRaw?.departments)
            ? nationalRaw.departments
                .filter(Boolean)
                .map((d: any) => {
                  const name = String(d?.name ?? '').trim()
                  const cities = Array.isArray(d?.cities)
                    ? d.cities
                        .filter(Boolean)
                        .map((c: any) => {
                          const cityName = String(c?.name ?? '').trim()
                          const arrondissements = Array.isArray(c?.arrondissements)
                            ? c.arrondissements
                                .filter(Boolean)
                                .map((a: any) => {
                                  const arrName = String(a?.name ?? '').trim()
                                  const districts = Array.isArray(a?.districts)
                                    ? a.districts
                                        .map((x: any) => String(x))
                                        .map((x: string) => x.trim())
                                        .filter((x: string) => x.length > 0)
                                    : []
                                  return { name: arrName, districts }
                                })
                                .filter((a: any) => String(a?.name ?? '').trim().length > 0)
                            : []
                          return { name: cityName, arrondissements }
                        })
                        .filter((c: any) => String(c?.name ?? '').trim().length > 0)
                    : []
                  return { name, cities }
                })
                .filter((d: any) => String(d?.name ?? '').trim().length > 0)
            : fallback.national.departments

          return {
            local: {
              city: String(localCity).trim().length > 0 ? localCity : fallback.local.city,
              districts: localDistricts
            },
            national: {
              country: String(country).trim().length > 0 ? country : fallback.national.country,
              departments
            }
          }
        }

        if (active) {
          setGlobalSettingsBase(settings)
          setDeliveryConfig(next)
          setDeliveryRules(normalizeRules(rulesRaw))
          setDeliveryGeo(normalizeGeo(geoRaw))
          setPickupConfig(normalizePickupConfig(pickupRaw))
          setFreeShippingConfig(() => {
            const raw = freeShippingRaw && typeof freeShippingRaw === 'object' ? (freeShippingRaw as any) : {}
            const enabled = raw?.enabled === true
            const rules = Array.isArray(raw?.rules) ? raw.rules : []
            const normalizedRules: FreeShippingRule[] = rules
              .filter(Boolean)
              .map((r: any) => {
                const id = String(r?.id ?? '')
                return {
                  id: id.length > 0 ? id : `fs_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                  isActive: r?.isActive !== false,
                  priority: typeof r?.priority === 'number' ? r.priority : Number(r?.priority ?? 100) || 100,
                  title: String(r?.title ?? 'Règle livraison gratuite') || 'Règle livraison gratuite',
                  mode: 'standard',
                  scope: r?.scope === 'cart_total' ? 'cart_total' : 'eligible_items',
                  minEligibleSubtotalXof:
                    typeof r?.minEligibleSubtotalXof === 'number'
                      ? r.minEligibleSubtotalXof
                      : r?.minEligibleSubtotalXof == null
                        ? null
                        : Number(r?.minEligibleSubtotalXof) || null,
                  minEligibleQty:
                    typeof r?.minEligibleQty === 'number'
                      ? r.minEligibleQty
                      : r?.minEligibleQty == null
                        ? null
                        : Number(r?.minEligibleQty) || null,
                  vendorIds: Array.isArray(r?.vendorIds) ? r.vendorIds.map((x: any) => String(x)).filter(Boolean) : [],
                  productIds: Array.isArray(r?.productIds) ? r.productIds.map((x: any) => String(x)).filter(Boolean) : [],
                  categoryIds: Array.isArray(r?.categoryIds) ? r.categoryIds.map((x: any) => String(x)).filter(Boolean) : [],
                  zone:
                    r?.zone === 'local' || r?.zone === 'regional' || r?.zone === 'national' || r?.zone === 'international'
                      ? r.zone
                      : '*',
                  localDistrict: String(r?.localDistrict ?? '*') || '*',
                  department: String(r?.department ?? '*') || '*',
                  city: String(r?.city ?? '*') || '*',
                  arrondissement: String(r?.arrondissement ?? '*') || '*',
                  district: String(r?.district ?? '*') || '*'
                } satisfies FreeShippingRule
              })
            return { enabled, rules: normalizedRules }
          })
        }
      } catch (error) {
        console.error('Erreur chargement deliveryConfig:', error)
      } finally {
        if (active) setIsLoadingDeliveryConfig(false)
      }
    }

    void loadConfig()

    return () => {
      active = false
    }
  }, [])

  const handleSaveDeliveryConfig = useCallback(async () => {
    try {
      setIsSavingDeliveryConfig(true)

      const normalizedPickupConfig: PickupConfig = {
        ...(pickupConfig as any),
        enabled:
          (pickupConfig as any)?.enabled === true || (Array.isArray((pickupConfig as any)?.points) && (pickupConfig as any).points.length > 0),
        points: Array.isArray((pickupConfig as any)?.points) ? (pickupConfig as any).points : []
      }

      const mergedSettings: Record<string, unknown> = {
        ...(globalSettingsBase ?? {}),
        deliveryConfig: {
          ...(deliveryConfig as any),
          pickupConfig: normalizedPickupConfig
        },
        pickupConfig: normalizedPickupConfig,
        deliveryRules,
        deliveryGeo,
        freeShippingConfig
      }

      const resp = await fetchSuperAdmin('/api/super-admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'global',
          settings: {
            ...mergedSettings
          }
        })
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body?.error ?? 'Impossible de sauvegarder la configuration.')
      }

      addNotification({
        type: 'success',
        title: 'Configuration livraisons',
        message: 'Configuration sauvegardée.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Configuration livraisons',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    } finally {
      setIsSavingDeliveryConfig(false)
    }
  }, [addNotification, deliveryConfig, deliveryGeo, deliveryRules, fetchSuperAdmin, freeShippingConfig, globalSettingsBase, pickupConfig])

  const handleAddPickupPoint = useCallback(() => {
    const name = String(newPickupPoint?.name ?? '').trim()
    if (name.length === 0) return
    setPickupConfig((prev) => {
      const id = `pickup_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      const nextPoint: PickupPoint = {
        id,
        name,
        address: String(newPickupPoint?.address ?? '').trim(),
        city: String(newPickupPoint?.city ?? '').trim(),
        district: String(newPickupPoint?.district ?? '').trim(),
        priceXof: Math.max(0, Math.ceil(Number(newPickupPoint?.priceXof ?? 0) || 0))
      }
      return { ...prev, points: [nextPoint, ...(Array.isArray(prev.points) ? prev.points : [])] }
    })
    setNewPickupPoint({ name: '', address: '', city: '', district: '', priceXof: 0 })
  }, [newPickupPoint])

  const handleUpdatePickupPoint = useCallback((id: string, patch: Partial<PickupPoint>) => {
    setPickupConfig((prev) => {
      const points = Array.isArray(prev.points) ? prev.points : []
      return {
        ...prev,
        points: points.map((p) => (p.id === id ? { ...p, ...patch } : p))
      }
    })
  }, [])

  const handleRemovePickupPoint = useCallback((id: string) => {
    setPickupConfig((prev) => {
      const points = Array.isArray(prev.points) ? prev.points : []
      return { ...prev, points: points.filter((p) => p.id !== id) }
    })
  }, [])

  /**
   * Ajoute un quartier à la zone locale (Calavi).
   */
  const handleAddLocalDistrict = useCallback(() => {
    const name = String(newLocalDistrict ?? '').trim()
    if (name.length === 0) return
    setDeliveryGeo((prev) => {
      const exists = prev.local.districts.some((d) => d.toLowerCase() === name.toLowerCase())
      if (exists) return prev
      return { ...prev, local: { ...prev.local, districts: [name, ...prev.local.districts] } }
    })
    setNewLocalDistrict('')
  }, [newLocalDistrict])

  /**
   * Supprime un quartier local.
   */
  const handleRemoveLocalDistrict = useCallback((district: string) => {
    setDeliveryGeo((prev) => ({
      ...prev,
      local: { ...prev.local, districts: prev.local.districts.filter((d) => d !== district) }
    }))
  }, [])

  /**
   * Ajoute un département (niveau national).
   */
  const handleAddDepartment = useCallback(() => {
    const name = String(newDepartmentName ?? '').trim()
    if (name.length === 0) return
    setDeliveryGeo((prev) => {
      const exists = prev.national.departments.some((d) => d.name.toLowerCase() === name.toLowerCase())
      if (exists) return prev
      return {
        ...prev,
        national: {
          ...prev.national,
          departments: [{ name, cities: [] }, ...prev.national.departments]
        }
      }
    })
    setNewDepartmentName('')
    setSelectedDepartmentName(name)
  }, [newDepartmentName])

  /**
   * Ajoute une ville dans un département sélectionné.
   */
  const handleAddCity = useCallback(() => {
    const deptName = String(selectedDepartmentName ?? '').trim()
    const cityName = String(newCityName ?? '').trim()
    if (deptName.length === 0 || cityName.length === 0) return
    setDeliveryGeo((prev) => {
      return {
        ...prev,
        national: {
          ...prev.national,
          departments: prev.national.departments.map((d) => {
            if (d.name !== deptName) return d
            const exists = d.cities.some((c) => c.name.toLowerCase() === cityName.toLowerCase())
            if (exists) return d
            return { ...d, cities: [{ name: cityName, arrondissements: [] }, ...d.cities] }
          })
        }
      }
    })
    setNewCityName('')
    setSelectedCityName(cityName)
  }, [newCityName, selectedDepartmentName])

  /**
   * Ajoute un arrondissement dans une ville sélectionnée.
   */
  const handleAddArrondissement = useCallback(() => {
    const deptName = String(selectedDepartmentName ?? '').trim()
    const cityName = String(selectedCityName ?? '').trim()
    const arrName = String(newArrondissementName ?? '').trim()
    if (deptName.length === 0 || cityName.length === 0 || arrName.length === 0) return

    setDeliveryGeo((prev) => {
      return {
        ...prev,
        national: {
          ...prev.national,
          departments: prev.national.departments.map((d) => {
            if (d.name !== deptName) return d
            return {
              ...d,
              cities: d.cities.map((c) => {
                if (c.name !== cityName) return c
                const exists = c.arrondissements.some((a) => a.name.toLowerCase() === arrName.toLowerCase())
                if (exists) return c
                return { ...c, arrondissements: [{ name: arrName, districts: [] }, ...c.arrondissements] }
              })
            }
          })
        }
      }
    })
    setNewArrondissementName('')
    setSelectedArrondissementName(arrName)
  }, [newArrondissementName, selectedCityName, selectedDepartmentName])

  /**
   * Ajoute un quartier national au chemin sélectionné (département/ville/arrondissement).
   */
  const handleAddNationalDistrict = useCallback(() => {
    const deptName = String(selectedDepartmentName ?? '').trim()
    const cityName = String(selectedCityName ?? '').trim()
    const arrName = String(selectedArrondissementName ?? '').trim()
    const districtName = String(newNationalDistrict ?? '').trim()
    if (deptName.length === 0 || cityName.length === 0 || arrName.length === 0 || districtName.length === 0) return

    setDeliveryGeo((prev) => {
      return {
        ...prev,
        national: {
          ...prev.national,
          departments: prev.national.departments.map((d) => {
            if (d.name !== deptName) return d
            return {
              ...d,
              cities: d.cities.map((c) => {
                if (c.name !== cityName) return c
                return {
                  ...c,
                  arrondissements: c.arrondissements.map((a) => {
                    if (a.name !== arrName) return a
                    const exists = a.districts.some((x) => x.toLowerCase() === districtName.toLowerCase())
                    if (exists) return a
                    return { ...a, districts: [districtName, ...a.districts] }
                  })
                }
              })
            }
          })
        }
      }
    })

    setNewNationalDistrict('')
  }, [newNationalDistrict, selectedArrondissementName, selectedCityName, selectedDepartmentName])

  /**
   * Supprime un quartier national d'un arrondissement.
   */
  const handleRemoveNationalDistrict = useCallback(
    (deptName: string, cityName: string, arrName: string, district: string) => {
      setDeliveryGeo((prev) => {
        return {
          ...prev,
          national: {
            ...prev.national,
            departments: prev.national.departments.map((d) => {
              if (d.name !== deptName) return d
              return {
                ...d,
                cities: d.cities.map((c) => {
                  if (c.name !== cityName) return c
                  return {
                    ...c,
                    arrondissements: c.arrondissements.map((a) => {
                      if (a.name !== arrName) return a
                      return { ...a, districts: a.districts.filter((x) => x !== district) }
                    })
                  }
                })
              }
            })
          }
        }
      })
    },
    []
  )

  /**
   * Convertit une valeur texte en nombre nullable ("" => null), pour les champs min/max (poids/quantité/délai).
   */
  const parseNullableNumber = (value: string): number | null => {
    const trimmed = String(value ?? '').trim()
    if (trimmed.length === 0) return null
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : null
  }

  /**
   * Parse une liste d'identifiants (UUID) depuis un champ texte (séparateur: virgule).
   */
  const parseIdList = (value: string): string[] => {
    const raw = String(value ?? '')
    if (raw.trim().length === 0) return []
    return raw
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
  }

  /**
   * Ajoute une règle de livraison au state local (sera persistée lors de la sauvegarde globale).
   */
  const handleAddDeliveryRule = useCallback(() => {
    setDeliveryRules((prev) => {
      const id = `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      const rule: DeliveryRule = { id, ...newDeliveryRule }
      return [rule, ...prev]
    })
  }, [newDeliveryRule])

  /**
   * Met à jour une règle existante (édition inline).
   */
  const handleUpdateRule = useCallback((id: string, patch: Partial<DeliveryRule>) => {
    setDeliveryRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  /**
   * Supprime une règle du state local.
   */
  const handleRemoveRule = useCallback((id: string) => {
    setDeliveryRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  useEffect(() => {
    if (isCreateOpen) {
      void loadOrderChoices()
    }
  }, [isCreateOpen, loadOrderChoices])

  useEffect(() => {
    if (!isCreateOpen) return
    if (!newDeliveryForm.orderId) return
    if (orderChoices.length === 0) return

    const choice = orderChoices.find((order) => order.id === newDeliveryForm.orderId) ?? null
    if (!choice) return

    setNewDeliveryForm((prev) => {
      const nextCustomerId = choice.customerId ?? ''
      const nextVendorId = choice.vendorId ?? ''
      if (prev.customerId === nextCustomerId && prev.vendorId === nextVendorId) return prev
      return {
        ...prev,
        customerId: nextCustomerId,
        vendorId: nextVendorId
      }
    })
  }, [isCreateOpen, newDeliveryForm.orderId, orderChoices])

  useEffect(() => {
    if (!isCreateOpen) return
    void loadDeliveryOptionLists()
  }, [isCreateOpen, loadDeliveryOptionLists])

  useEffect(() => {
    const shouldOpen = searchParams?.get('createDelivery')
    if (shouldOpen !== '1') return

    const orderId = searchParams?.get('orderId') ?? ''
    const customerId = searchParams?.get('customerId') ?? ''

    if (!orderId || !customerId) {
      return
    }

    setIsCreateOpen(true)

    setNewDeliveryForm((prev) => ({
      ...prev,
      orderId,
      customerId,
      vendorId: prev.vendorId,
      status: 'pending'
    }))

    void loadDriverSuggestions(orderId)

    void (async () => {
      try {
        const order = await SuperAdminOrderService.get(orderId)
        const row = (order as any)?.data ?? order
        const lat = row?.shipping_lat
        const lng = row?.shipping_lng
        if (typeof lat === 'number' && typeof lng === 'number') {
          setSelectedOrderCoordinates({ lat, lng })
        } else {
          setSelectedOrderCoordinates(null)
        }
      } catch {
        setSelectedOrderCoordinates(null)
      }
    })()

    const next = new URLSearchParams(searchParams.toString())
    next.delete('createDelivery')
    next.delete('orderId')
    next.delete('orderNumber')
    next.delete('customerId')
    const query = next.toString()
    router.replace(query ? `/super-admin-dashboard?${query}` : '/super-admin-dashboard')
  }, [loadDriverSuggestions, router, searchParams])

  /**
   * Soumet la création d'une nouvelle livraison via le service API.
   */
  const handleCreateDelivery = useCallback(async () => {
    try {
      if (!newDeliveryForm.orderId || !newDeliveryForm.customerId) {
        addNotification({
          type: "warning",
          title: "Création impossible",
          message: "Sélectionnez la commande et le client associés."
        })
        return
      }

      setIsCreating(true)

      const payload = {
        orderId: newDeliveryForm.orderId,
        customerId: newDeliveryForm.customerId,
        vendorId: newDeliveryForm.vendorId || null,
        status: newDeliveryForm.status,
        priority: newDeliveryForm.priority,
        eta: newDeliveryForm.eta || null,
        dispatchedAt: newDeliveryForm.dispatchedAt || null,
        deliveredAt: newDeliveryForm.deliveredAt || null,
        cancelledAt: newDeliveryForm.cancelledAt || null,
        currentLocation: newDeliveryForm.currentLocation || null,
        progressPercent:
          newDeliveryForm.progressPercent.trim().length > 0 ? Number(newDeliveryForm.progressPercent) : null,
        liveLat: newDeliveryForm.liveLat.trim().length > 0 ? Number(newDeliveryForm.liveLat) : null,
        liveLng: newDeliveryForm.liveLng.trim().length > 0 ? Number(newDeliveryForm.liveLng) : null,
        trackingNumber: newDeliveryForm.trackingNumber || null,
        shippingMethodId:
          newDeliveryForm.shippingMethodId && newDeliveryForm.shippingMethodId !== '__none__'
            ? newDeliveryForm.shippingMethodId
            : null,
        carrierId:
          newDeliveryForm.carrierId && newDeliveryForm.carrierId !== '__none__' ? newDeliveryForm.carrierId : null,
        driverId: newDeliveryForm.driverId || null,
        driver: {
          name: newDeliveryForm.driverName || null,
          phone: newDeliveryForm.driverPhone || null,
          vehiclePlate: newDeliveryForm.driverVehicle || null
        },
        metadata: newDeliveryForm.metadataJson.trim().length > 0 ? JSON.parse(newDeliveryForm.metadataJson) : null
      }

      if (isEditing && editingDeliveryId) {
        await SuperAdminDeliveryService.update(editingDeliveryId, payload)
      } else {
        await SuperAdminDeliveryService.create(payload)
      }

      addNotification({
        type: "success",
        title: isEditing ? "Livraison modifiée" : "Livraison créée",
        message: isEditing
          ? "La livraison a été modifiée avec succès."
          : "La livraison a été créée et planifiée avec succès."
      })

      setIsCreateOpen(false)
      setIsEditing(false)
      setEditingDeliveryId(null)
      setNewDeliveryForm({
        orderId: "",
        customerId: "",
        vendorId: "",
        status: "pending",
        priority: "medium",
        eta: "",
        dispatchedAt: "",
        deliveredAt: "",
        cancelledAt: "",
        currentLocation: "",
        progressPercent: "",
        liveLat: "",
        liveLng: "",
        trackingNumber: "",
        shippingMethodId: "",
        carrierId: "",
        driverId: "",
        driverName: "",
        driverPhone: "",
        driverVehicle: "",
        metadataJson: ""
      })

      await loadDeliveries()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création"
      addNotification({
        type: "error",
        title: isEditing ? "Modification échouée" : "Création échouée",
        message
      })
    } finally {
      setIsCreating(false)
    }
  }, [addNotification, editingDeliveryId, isEditing, loadDeliveries, newDeliveryForm])

  /**
   * Met une livraison en attente d'acceptation (pending).
   */
  const handleMarkAwaitingAcceptance = useCallback(
    async (delivery: SuperAdminDeliveryRecord) => {
      try {
        if (!delivery?.id) return

        if (delivery.status === 'pending') {
          addNotification({
            type: 'info',
            title: "En attente d'acceptation",
            message: "Cette livraison est déjà en attente d'acceptation du livreur."
          })
          return
        }

        await SuperAdminDeliveryService.update(delivery.id, { status: 'pending' })
        addNotification({
          type: 'success',
          title: "En attente d'acceptation",
          message: "Statut mis à jour: en attente d'acceptation du livreur."
        })
        await loadDeliveries()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        addNotification({
          type: 'error',
          title: "Action impossible",
          message
        })
      }
    },
    [addNotification, loadDeliveries]
  )

  /**
   * Ouvre le formulaire en mode édition.
   */
  const handleEditDelivery = useCallback(
    (delivery: SuperAdminDeliveryRecord) => {
      if (!delivery?.id) return

      setIsEditing(true)
      setEditingDeliveryId(delivery.id)

      setNewDeliveryForm({
        orderId: delivery.orderId ?? '',
        customerId: delivery.customerId ?? '',
        vendorId: delivery.vendorId ?? '',
        status: delivery.status,
        priority: delivery.priority ?? 'medium',
        eta: delivery.eta ? String(delivery.eta).slice(0, 16) : '',
        dispatchedAt: delivery.dispatchedAt ? String(delivery.dispatchedAt).slice(0, 16) : '',
        deliveredAt: delivery.deliveredAt ? String(delivery.deliveredAt).slice(0, 16) : '',
        cancelledAt: delivery.cancelledAt ? String(delivery.cancelledAt).slice(0, 16) : '',
        currentLocation: delivery.currentLocation ?? '',
        progressPercent: typeof delivery.progressPercent === 'number' ? String(delivery.progressPercent) : '',
        liveLat: delivery.coordinates ? String(delivery.coordinates.lat) : '',
        liveLng: delivery.coordinates ? String(delivery.coordinates.lng) : '',
        trackingNumber: delivery.trackingNumber ?? '',
        shippingMethodId: delivery.shippingMethod?.id ?? SELECT_NONE_VALUE,
        carrierId: delivery.carrier?.id ?? SELECT_NONE_VALUE,
        driverId: (delivery as any)?.driverId ?? '',
        driverName: delivery.driver?.name ?? '',
        driverPhone: delivery.driver?.phone ?? '',
        driverVehicle: delivery.driver?.vehiclePlate ?? '',
        metadataJson: delivery.metadata ? JSON.stringify(delivery.metadata, null, 2) : ''
      })

      setIsCreateOpen(true)
    },
    []
  )

  /**
   * Supprime une livraison (confirmation stylée via dialog).
   */
  const handleDeleteDelivery = useCallback(
    async (delivery: SuperAdminDeliveryRecord) => {
      try {
        if (!delivery?.id) return
        if (deleteConfirmTarget?.id !== delivery.id) {
          setDeleteConfirmTarget(delivery)
          setIsDeleteConfirmOpen(true)
          return
        }

        setIsDeletingDelivery(true)
        await SuperAdminDeliveryService.remove(delivery.id)
        addNotification({
          type: 'success',
          title: 'Livraison supprimée',
          message: 'La livraison a été supprimée.'
        })

        if (selectedDelivery?.id === delivery.id) {
          setIsDetailsOpen(false)
          setSelectedDelivery(null)
        }

        await loadDeliveries()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue'
        addNotification({
          type: 'error',
          title: 'Suppression échouée',
          message
        })
      } finally {
        setIsDeletingDelivery(false)
        setIsDeleteConfirmOpen(false)
        setDeleteConfirmTarget(null)
      }
    },
    [addNotification, loadDeliveries, selectedDelivery?.id, deleteConfirmTarget?.id]
  )

  const handleSelectOrderChoice = useCallback(
    (orderId: string) => {
      setNewDeliveryForm(prev => ({
        ...prev,
        orderId,
        customerId: orderChoices.find(order => order.id === orderId)?.customerId ?? "",
        trackingNumber: prev.trackingNumber?.trim().length > 0 ? prev.trackingNumber : generateTrackingNumber(),
        driverId: "",
        driverName: "",
        driverPhone: "",
        driverVehicle: ""
      }))
      void loadDriverSuggestions(orderId)

      void (async () => {
        try {
          const order = await SuperAdminOrderService.get(orderId)
          const row = (order as any)?.data ?? order
          const lat = row?.shipping_lat
          const lng = row?.shipping_lng
          if (typeof lat === 'number' && typeof lng === 'number') {
            setSelectedOrderCoordinates({ lat, lng })
          } else {
            setSelectedOrderCoordinates(null)
          }
        } catch {
          setSelectedOrderCoordinates(null)
        }
      })()
    },
    [generateTrackingNumber, loadDriverSuggestions, orderChoices]
  )

  /**
   * Sélectionne un livreur suggéré et pré-remplit les informations.
   */
  const handleSelectDriverSuggestion = useCallback(
    (driverId: string) => {
      const selected = driverSuggestions.find(driver => driver.user_id === driverId)
      setNewDeliveryForm(prev => ({
        ...prev,
        driverId,
        driverName: selected ? `${selected.first_name ?? ''} ${selected.last_name ?? ''}`.trim() : prev.driverName,
        driverPhone: selected ? selected.phone ?? selected.whatsapp ?? '' : prev.driverPhone,
        driverVehicle: selected ? [selected.transport_mode, selected.vehicle_plate].filter(Boolean).join(' ') : prev.driverVehicle
      }))
    },
    [driverSuggestions]
  )

  const openDetails = useCallback((delivery: SuperAdminDeliveryRecord) => {
    setSelectedDelivery(delivery)
    setIsDetailsOpen(true)
  }, [])

  /**
   * Charge les preuves photo associées à une livraison.
   */
  const loadDeliveryProofs = useCallback(
    async (deliveryId: string) => {
      if (!deliveryId) return
      try {
        setIsLoadingProofs(true)
        const response = await fetchSuperAdmin(`/api/super-admin/deliveries/${encodeURIComponent(deliveryId)}/proofs`, {
          method: 'GET'
        })
        const json = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(json?.error ?? 'Impossible de charger les preuves.')
        }
        setDeliveryProofs((json?.data ?? []) as any)
      } catch {
        setDeliveryProofs([])
      } finally {
        setIsLoadingProofs(false)
      }
    },
    [fetchSuperAdmin]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des livraisons</h2>
          <p className="text-sm text-gray-600">
            Supervisez, configurez et suivez en temps réel toutes les livraisons de la marketplace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => void loadDeliveries()} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualiser
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-sm transition hover:from-orange-600 hover:to-yellow-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle livraison
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value === 'config' ? 'config' : value === 'free_shipping' ? 'free_shipping' : 'deliveries')
        }
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration des options de livraison</TabsTrigger>
          <TabsTrigger value="free_shipping">
                        Livraison gratuite
                        {(() => {
                          const count = Array.isArray(freeShippingConfig?.rules) ? freeShippingConfig.rules.filter(rule => rule?.active !== false).length : 0
                          return count > 0 ? (
                            <Badge variant="secondary" className="ml-2">{count}</Badge>
                          ) : null
                        })()}
                      </TabsTrigger>
          <TabsTrigger value="deliveries">Gestion des livraisons</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 text-sm text-orange-900">
            <div className="font-semibold">Ordre recommandé</div>
            <div className="mt-1 text-orange-800/90">
              1) Paramètres globaux
              {' '}→{' '}2) Zones & quartiers
              {' '}→{' '}3) Règles de prix (zone / quantité / poids)
            </div>
            <div className="mt-2 text-xs text-orange-800/80">
              Astuce: commencez par définir les zones/quartiers, puis créez les règles (cela évite de créer des règles sans ciblage).
            </div>
          </div>

          <Card className="border border-orange-200 bg-orange-50/40 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-orange-900">1) Paramètres globaux (panier)</CardTitle>
                <p className="text-sm text-orange-700/80">
                  Contrôle la logique de calcul du coût affiché au panier quand plusieurs articles ont des frais (mode max vs somme), et si le client peut changer.
                </p>
              </div>
              <Button onClick={() => void handleSaveDeliveryConfig()} disabled={isLoadingDeliveryConfig || isSavingDeliveryConfig}>
                {isSavingDeliveryConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sauvegarder
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Calcul des frais (par commande)</Label>
                <Select
                  value={deliveryConfig.shippingCostAggregationDefault}
                  onValueChange={(value) =>
                    setDeliveryConfig((prev) => ({
                      ...prev,
                      shippingCostAggregationDefault: value === 'sum' ? 'sum' : 'max'
                    }))
                  }
                  disabled={isLoadingDeliveryConfig}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="max">Max (recommandé)</SelectItem>
                    <SelectItem value="sum">Somme</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-orange-800/80">
                  Max évite de cumuler des frais par article. Somme correspond à plusieurs colis facturés séparément.
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Date de dispatch
                    <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={newDeliveryForm.dispatchedAt}
                    onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, dispatchedAt: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Date livrée
                    <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={newDeliveryForm.deliveredAt}
                    onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, deliveredAt: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Date annulée
                    <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={newDeliveryForm.cancelledAt}
                    onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, cancelledAt: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Localisation actuelle
                    <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                  </Label>
                  <Input
                    placeholder="Ex: Cotonou, Akpakpa"
                    value={newDeliveryForm.currentLocation}
                    onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, currentLocation: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Progression (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newDeliveryForm.progressPercent}
                    onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, progressPercent: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Live latitude</Label>
                  <Input
                    inputMode="decimal"
                    value={newDeliveryForm.liveLat}
                    onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, liveLat: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Live longitude</Label>
                  <Input
                    inputMode="decimal"
                    value={newDeliveryForm.liveLng}
                    onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, liveLng: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Metadata (JSON)</Label>
                <Textarea
                  placeholder='{"notes":"..."}'
                  value={newDeliveryForm.metadataJson}
                  onChange={(event) => setNewDeliveryForm((prev) => ({ ...prev, metadataJson: event.target.value }))}
                  className="min-h-28 border-gray-300 font-mono text-xs focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label>Autoriser le client à changer</Label>
                <Select
                  value={deliveryConfig.allowCustomerShippingAggregationOverride ? 'yes' : 'no'}
                  onValueChange={(value) =>
                    setDeliveryConfig((prev) => ({
                      ...prev,
                      allowCustomerShippingAggregationOverride: value === 'yes'
                    }))
                  }
                  disabled={isLoadingDeliveryConfig}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Oui</SelectItem>
                    <SelectItem value="no">Non</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-orange-800/80">
                  Recommandé: Non si c'est le site qui gère la livraison (politique cohérente et simple).
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">Point Relais (retrait)</CardTitle>
              <p className="text-sm text-gray-600">
                Activez le retrait en point relais et gérez la liste des points (prix par point).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Activer Point Relais</Label>
                  <Select
                    value={pickupConfig.enabled ? 'yes' : 'no'}
                    onValueChange={(v) => setPickupConfig((prev) => ({ ...prev, enabled: v === 'yes' }))}
                    disabled={isLoadingDeliveryConfig}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Oui</SelectItem>
                      <SelectItem value="no">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={newPickupPoint.name} onChange={(e) => setNewPickupPoint((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input value={newPickupPoint.city} onChange={(e) => setNewPickupPoint((p) => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Prix (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={String(newPickupPoint.priceXof ?? 0)}
                    onChange={(e) => setNewPickupPoint((p) => ({ ...p, priceXof: Number(e.target.value ?? 0) || 0 }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Adresse</Label>
                  <Input value={newPickupPoint.address} onChange={(e) => setNewPickupPoint((p) => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Quartier</Label>
                  <Input value={newPickupPoint.district} onChange={(e) => setNewPickupPoint((p) => ({ ...p, district: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleAddPickupPoint} disabled={isLoadingDeliveryConfig || !pickupConfig.enabled}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un point relais
                </Button>
              </div>

              <div className="space-y-3">
                {(pickupConfig.points ?? []).length === 0 ? (
                  <div className="text-sm text-gray-500">Aucun point relais.</div>
                ) : (
                  <div className="space-y-2">
                    {(pickupConfig.points ?? []).map((p) => (
                      <div key={p.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="grid gap-3 md:grid-cols-5">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Nom</Label>
                            <Input value={p.name} onChange={(e) => handleUpdatePickupPoint(p.id, { name: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Ville</Label>
                            <Input value={p.city} onChange={(e) => handleUpdatePickupPoint(p.id, { city: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Quartier</Label>
                            <Input value={p.district} onChange={(e) => handleUpdatePickupPoint(p.id, { district: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-600">Prix (FCFA)</Label>
                            <Input
                              type="number"
                              min={0}
                              value={String(p.priceXof ?? 0)}
                              onChange={(e) => handleUpdatePickupPoint(p.id, { priceXof: Number(e.target.value ?? 0) || 0 })}
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <Button variant="outline" onClick={() => handleRemovePickupPoint(p.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-1 md:col-span-5">
                            <Label className="text-xs text-gray-600">Adresse</Label>
                            <Input value={p.address} onChange={(e) => handleUpdatePickupPoint(p.id, { address: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">2) Zones & quartiers (Bénin)</CardTitle>
              <p className="text-sm text-gray-600">
                Configurez les quartiers de la zone locale (Calavi) et la hiérarchie nationale (département → ville → arrondissement → quartier).
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm font-semibold text-gray-900">Import / Export (pré-remplissage)</CardTitle>
                  <p className="text-xs text-gray-600">
                    Pour insérer toute la liste d'Abomey-Calavi et du Bénin, colle un JSON ici (ou exporte le modèle, puis complète-le).
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={importGeoJson} onChange={(e) => setImportGeoJson(e.target.value)} className="min-h-[180px]" />
                  <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                    <Button variant="outline" onClick={handleExportGeoJson}>
                      Exporter JSON
                    </Button>
                    <Button variant="outline" onClick={handleImportGeoJson} disabled={importGeoJson.trim().length === 0}>
                      Importer JSON
                    </Button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Conseil: exportez d'abord le modèle, complétez-le, puis réimportez-le.
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-sm font-semibold text-gray-900">Recherche quartiers (hybride)</CardTitle>
                  <p className="text-xs text-gray-600">
                    Recherche assistée pour récupérer des quartiers et les ajouter dans la config. Nécessite une connexion Internet.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Cible</Label>
                      <Select value={geoSearchScope} onValueChange={(v: string) => setGeoSearchScope(v === 'national' ? 'national' : 'local')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">Local (Abomey-Calavi)</SelectItem>
                          <SelectItem value="national">National (arrondissement sélectionné)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Recherche</Label>
                      <div className="flex gap-2">
                        <Input value={geoSearchQuery} onChange={(e) => setGeoSearchQuery(e.target.value)} placeholder="Ex: Tokan, Agori, ..." />
                        <Button variant="outline" onClick={() => void handleGeoSearch()} disabled={isGeoSearching}>
                          {isGeoSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Rechercher
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {geoSearchResults.length === 0 ? (
                          <div className="text-xs text-gray-500">Aucune suggestion.</div>
                        ) : (
                          geoSearchResults.map((r) => (
                            <Button key={`${r.label}-${r.displayName}`} variant="outline" size="sm" onClick={() => handleAddGeoSuggestion(r.label)}>
                              {r.label}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={handlePrefillBeninDepartments}>
                      Pré-remplir départements du Bénin
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-gray-200">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-gray-900">Local — {deliveryGeo.local.city}</CardTitle>
                    <p className="text-xs text-gray-600">Ajoutez ici les quartiers de Calavi (ex: Bido Cécil, etc.).</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input value={newLocalDistrict} onChange={(e) => setNewLocalDistrict(e.target.value)} placeholder="Nouveau quartier" />
                      <Button onClick={handleAddLocalDistrict} variant="outline">
                        Ajouter
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {deliveryGeo.local.districts.length === 0 ? (
                        <div className="text-xs text-gray-500">Aucun quartier local.</div>
                      ) : (
                        deliveryGeo.local.districts.map((d) => (
                          <Button key={d} variant="outline" size="sm" onClick={() => handleRemoveLocalDistrict(d)}>
                            {d}
                          </Button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader className="space-y-1">
                    <CardTitle className="text-sm font-semibold text-gray-900">National — {deliveryGeo.national.country}</CardTitle>
                    <p className="text-xs text-gray-600">Définissez Départements → Villes → Arrondissements → Quartiers.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input value={newDepartmentName} onChange={(e) => setNewDepartmentName(e.target.value)} placeholder="Nouveau département" />
                      <Button onClick={handleAddDepartment} variant="outline">
                        Ajouter
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Département</Label>
                      <Select value={selectedDepartmentName} onValueChange={(v: string) => {
                        setSelectedDepartmentName(v)
                        setSelectedCityName('')
                        setSelectedArrondissementName('')
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryGeo.national.departments.map((d) => (
                            <SelectItem key={d.name} value={d.name}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Ville</Label>
                        <div className="flex gap-2">
                          <Input value={newCityName} onChange={(e) => setNewCityName(e.target.value)} placeholder="Nouvelle ville" />
                          <Button onClick={handleAddCity} variant="outline" disabled={selectedDepartmentName.trim().length === 0}>
                            Ajouter
                          </Button>
                        </div>
                        <Select value={selectedCityName} onValueChange={(v: string) => {
                          setSelectedCityName(v)
                          setSelectedArrondissementName('')
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryGeo.national.departments
                              .find((d) => d.name === selectedDepartmentName)
                              ?.cities.map((c) => (
                                <SelectItem key={c.name} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              )) ?? null}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Arrondissement</Label>
                        <div className="flex gap-2">
                          <Input value={newArrondissementName} onChange={(e) => setNewArrondissementName(e.target.value)} placeholder="Nouvel arrondissement" />
                          <Button
                            onClick={handleAddArrondissement}
                            variant="outline"
                            disabled={selectedDepartmentName.trim().length === 0 || selectedCityName.trim().length === 0}
                          >
                            Ajouter
                          </Button>
                        </div>
                        <Select value={selectedArrondissementName} onValueChange={(v: string) => setSelectedArrondissementName(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryGeo.national.departments
                              .find((d) => d.name === selectedDepartmentName)
                              ?.cities.find((c) => c.name === selectedCityName)
                              ?.arrondissements.map((a) => (
                                <SelectItem key={a.name} value={a.name}>
                                  {a.name}
                                </SelectItem>
                              )) ?? null}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Quartier</Label>
                      <div className="flex gap-2">
                        <Input value={newNationalDistrict} onChange={(e) => setNewNationalDistrict(e.target.value)} placeholder="Nouveau quartier" />
                        <Button
                          onClick={handleAddNationalDistrict}
                          variant="outline"
                          disabled={
                            selectedDepartmentName.trim().length === 0 ||
                            selectedCityName.trim().length === 0 ||
                            selectedArrondissementName.trim().length === 0
                          }
                        >
                          Ajouter
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(deliveryGeo.national.departments
                          .find((d) => d.name === selectedDepartmentName)
                          ?.cities.find((c) => c.name === selectedCityName)
                          ?.arrondissements.find((a) => a.name === selectedArrondissementName)
                          ?.districts ??
                          [])
                          .map((d) => (
                            <Button
                              key={d}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRemoveNationalDistrict(selectedDepartmentName, selectedCityName, selectedArrondissementName, d)
                              }
                            >
                              {d}
                            </Button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-xs text-gray-500">
                N'oubliez pas de cliquer sur "Sauvegarder" en haut pour enregistrer définitivement.
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">3) Règles de livraison (prix & délais)</CardTitle>
              <p className="text-sm text-gray-600">
                Définissez les règles (modes, zones, modèles de tarification, tranches et délais). Ces règles seront synchronisées et consommées
                par le panier/checkout. Les règles basées sur le poids pourront être désactivées si un produit n'a pas de poids.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-4">
                <div className="text-sm font-semibold text-gray-900">Créer une nouvelle règle</div>
                <div className="mt-1 text-xs text-gray-600">
                  Le ciblage utilise <span className="font-semibold">*</span> pour signifier “Tous”. Plus votre règle est précise, plus elle est prioritaire.
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select value={newDeliveryRule.mode} onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, mode: v === 'express' ? 'express' : 'standard' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <Select
                      value={newDeliveryRule.zone}
                      onValueChange={(v: string) =>
                        setNewDeliveryRule((p) => ({
                          ...p,
                          zone: v === 'international' ? 'international' : v === 'national' ? 'national' : v === 'regional' ? 'regional' : 'local',
                          // reset ciblage quand la zone change
                          localDistrict: '*',
                          department: '*',
                          city: '*',
                          arrondissement: '*',
                          district: '*'
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="regional">Régional</SelectItem>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-600">
                      Local = Abomey-Calavi. National = hiérarchie Département/Ville/Arrondissement/Quartier. International = hors pays.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Modèle</Label>
                    <Select
                      value={newDeliveryRule.pricingModel}
                      onValueChange={(v: string) =>
                        setNewDeliveryRule((p) => ({
                          ...p,
                          pricingModel:
                            v === 'quantity'
                              ? 'quantity'
                              : v === 'weight'
                                ? 'weight'
                                : v === 'zone_quantity'
                                  ? 'zone_quantity'
                                  : v === 'zone_weight'
                                    ? 'zone_weight'
                                    : v === 'zone_quantity_weight'
                                      ? 'zone_quantity_weight'
                                      : 'zone'
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zone">Zone</SelectItem>
                        <SelectItem value="quantity">Quantité</SelectItem>
                        <SelectItem value="weight">Poids</SelectItem>
                        <SelectItem value="zone_quantity">Zone + Quantité</SelectItem>
                        <SelectItem value="zone_weight">Zone + Poids</SelectItem>
                        <SelectItem value="zone_quantity_weight">Zone + Quantité + Poids</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-600">
                      Modèle = sur quoi on calcule le prix. Exemple: "Zone + Quantité" applique un prix selon la zone et la quantité.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Actif</Label>
                    <Select value={newDeliveryRule.isActive ? 'yes' : 'no'} onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, isActive: v === 'yes' }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Oui</SelectItem>
                        <SelectItem value="no">Non</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-4">
                    <Label>Ciblage (zone/quartier)</Label>
                    <div className="text-xs text-gray-600">Choisissez précisément la zone. Par défaut, <span className="font-semibold">*</span> = Tous.</div>
                    {newDeliveryRule.zone === 'local' ? (
                      <Select
                        value={newDeliveryRule.localDistrict}
                        onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, localDistrict: v || '*' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Tous les quartiers (Abomey-Calavi)</SelectItem>
                          {deliveryGeo.local.districts.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : newDeliveryRule.zone === 'national' ? (
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Département</Label>
                          <Select value={newDeliveryRule.department} onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, department: v || '*', city: '*', arrondissement: '*', district: '*' }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">Tous</SelectItem>
                              {deliveryGeo.national.departments.map((d) => (
                                <SelectItem key={d.name} value={d.name}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Ville</Label>
                          <Select
                            value={newDeliveryRule.city}
                            onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, city: v || '*', arrondissement: '*', district: '*' }))}
                            disabled={newDeliveryRule.department === '*'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">Tous</SelectItem>
                              {(deliveryGeo.national.departments.find((d) => d.name === newDeliveryRule.department)?.cities ?? []).map((c) => (
                                <SelectItem key={c.name} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Arrondissement</Label>
                          <Select
                            value={newDeliveryRule.arrondissement}
                            onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, arrondissement: v || '*', district: '*' }))}
                            disabled={newDeliveryRule.department === '*' || newDeliveryRule.city === '*'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">Tous</SelectItem>
                              {(deliveryGeo.national.departments
                                .find((d) => d.name === newDeliveryRule.department)
                                ?.cities.find((c) => c.name === newDeliveryRule.city)
                                ?.arrondissements ??
                                [])
                                .map((a) => (
                                  <SelectItem key={a.name} value={a.name}>
                                    {a.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Quartier</Label>
                          <Select
                            value={newDeliveryRule.district}
                            onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, district: v || '*' }))}
                            disabled={newDeliveryRule.department === '*' || newDeliveryRule.city === '*' || newDeliveryRule.arrondissement === '*'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">Tous</SelectItem>
                              {(deliveryGeo.national.departments
                                .find((d) => d.name === newDeliveryRule.department)
                                ?.cities.find((c) => c.name === newDeliveryRule.city)
                                ?.arrondissements.find((a) => a.name === newDeliveryRule.arrondissement)
                                ?.districts ??
                                [])
                                .map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">Ciblage par quartier: disponible pour Local et National.</div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Type de prix</Label>
                    <Select
                      value={newDeliveryRule.priceType}
                      onValueChange={(v: string) => setNewDeliveryRule((p) => ({ ...p, priceType: v === 'per_unit' ? 'per_unit' : 'fixed' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixe</SelectItem>
                        <SelectItem value="per_unit">Par unité</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-600">Fixe = un montant unique. Par unité = multiplié (commande/article/kg).</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Unité</Label>
                    <Select
                      value={newDeliveryRule.unit}
                      onValueChange={(v: string) =>
                        setNewDeliveryRule((p) => ({
                          ...p,
                          unit: v === 'kg' ? 'kg' : v === 'item' ? 'item' : 'order'
                        }))
                      }
                      disabled={newDeliveryRule.priceType !== 'per_unit'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">Commande</SelectItem>
                        <SelectItem value="item">Article</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Input value={newDeliveryRule.currency} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, currency: e.target.value }))} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Quantité min</Label>
                    <Input value={newDeliveryRule.minQty ?? ''} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, minQty: parseNullableNumber(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantité max</Label>
                    <Input value={newDeliveryRule.maxQty ?? ''} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, maxQty: parseNullableNumber(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min poids (kg)</Label>
                    <Input value={newDeliveryRule.minWeightKg ?? ''} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, minWeightKg: parseNullableNumber(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max poids (kg)</Label>
                    <Input value={newDeliveryRule.maxWeightKg ?? ''} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, maxWeightKg: parseNullableNumber(e.target.value) }))} />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Prix</Label>
                    <Input type="number" value={newDeliveryRule.price} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, price: Number(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Délai min (jours)</Label>
                    <Input value={newDeliveryRule.etaMinDays ?? ''} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, etaMinDays: parseNullableNumber(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Délai max (jours)</Label>
                    <Input value={newDeliveryRule.etaMaxDays ?? ''} onChange={(e) => setNewDeliveryRule((p) => ({ ...p, etaMaxDays: parseNullableNumber(e.target.value) }))} />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button onClick={handleAddDeliveryRule}>
                      Ajouter une règle
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {deliveryRules.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucune règle enregistrée.</div>
                ) : (
                  deliveryRules.map((rule) => (
                    <Card key={rule.id} className="border-gray-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {rule.mode.toUpperCase()} • {rule.zone.toUpperCase()} • {rule.pricingModel} • {rule.priceType}{rule.priceType === 'per_unit' ? `/${rule.unit}` : ''}
                            {rule.zone === 'local' ? ` • ${rule.localDistrict}` : rule.zone === 'national' ? ` • ${rule.department}/${rule.city}/${rule.arrondissement}/${rule.district}` : ''}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.isActive ? 'default' : 'secondary'}>{rule.isActive ? 'Active' : 'Inactive'}</Badge>
                            <Button variant="outline" size="sm" onClick={() => handleRemoveRule(rule.id)}>
                              Supprimer
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Actif</Label>
                            <Select value={rule.isActive ? 'yes' : 'no'} onValueChange={(v: string) => handleUpdateRule(rule.id, { isActive: v === 'yes' })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yes">Oui</SelectItem>
                                <SelectItem value="no">Non</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={rule.priceType}
                              onValueChange={(v: string) => handleUpdateRule(rule.id, { priceType: v === 'per_unit' ? 'per_unit' : 'fixed' })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">Fixe</SelectItem>
                                <SelectItem value="per_unit">Par unité</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Unité</Label>
                            <Select
                              value={rule.unit}
                              onValueChange={(v: string) =>
                                handleUpdateRule(rule.id, {
                                  unit: v === 'kg' ? 'kg' : v === 'item' ? 'item' : 'order'
                                })
                              }
                              disabled={rule.priceType !== 'per_unit'}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="order">Commande</SelectItem>
                                <SelectItem value="item">Article</SelectItem>
                                <SelectItem value="kg">Kg</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Prix</Label>
                            <Input type="number" value={rule.price} onChange={(e) => handleUpdateRule(rule.id, { price: Number(e.target.value) || 0 })} />
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Devise</Label>
                            <Input value={rule.currency} onChange={(e) => handleUpdateRule(rule.id, { currency: e.target.value })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Délai min (j)</Label>
                            <Input value={rule.etaMinDays ?? ''} onChange={(e) => handleUpdateRule(rule.id, { etaMinDays: parseNullableNumber(e.target.value) })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Délai max (j)</Label>
                            <Input value={rule.etaMaxDays ?? ''} onChange={(e) => handleUpdateRule(rule.id, { etaMaxDays: parseNullableNumber(e.target.value) })} />
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantité min</Label>
                            <Input value={rule.minQty ?? ''} onChange={(e) => handleUpdateRule(rule.id, { minQty: parseNullableNumber(e.target.value) })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Quantité max</Label>
                            <Input value={rule.maxQty ?? ''} onChange={(e) => handleUpdateRule(rule.id, { maxQty: parseNullableNumber(e.target.value) })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Min poids (kg)</Label>
                            <Input value={rule.minWeightKg ?? ''} onChange={(e) => handleUpdateRule(rule.id, { minWeightKg: parseNullableNumber(e.target.value) })} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max poids (kg)</Label>
                            <Input value={rule.maxWeightKg ?? ''} onChange={(e) => handleUpdateRule(rule.id, { maxWeightKg: parseNullableNumber(e.target.value) })} />
                          </div>
                        </div>

                        <Separator />
                        <div className="text-xs text-gray-500">
                          N'oubliez pas de cliquer sur "Sauvegarder" en haut pour enregistrer définitivement.
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-900">Ciblage géographique (zones)</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Zone</Label>
                    <Select
                      value={newFreeShippingRule.zone}
                      onValueChange={(value) =>
                        setNewFreeShippingRule((p) => ({
                          ...p,
                          zone:
                            value === 'local' || value === 'regional' || value === 'national' || value === 'international'
                              ? value
                              : '*'
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="*">Toutes</SelectItem>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="regional">Régional</SelectItem>
                        <SelectItem value="national">National</SelectItem>
                        <SelectItem value="international">International</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-gray-500">Utilisez "Toutes" pour ne pas filtrer par zone.</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Quartier local (si Zone=Local)</Label>
                    <Input
                      value={String(newFreeShippingRule.localDistrict)}
                      onChange={(e) => setNewFreeShippingRule((p) => ({ ...p, localDistrict: (e.target.value.trim() || '*') as any }))}
                      placeholder="* ou Ex: Tokan"
                    />
                    <div className="text-xs text-gray-500">"*" = tous les quartiers.</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Département (si Zone=National)</Label>
                    <Input
                      value={String(newFreeShippingRule.department)}
                      onChange={(e) => setNewFreeShippingRule((p) => ({ ...p, department: (e.target.value.trim() || '*') as any }))}
                      placeholder="* ou Ex: Atlantique"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ville</Label>
                    <Input
                      value={String(newFreeShippingRule.city)}
                      onChange={(e) => setNewFreeShippingRule((p) => ({ ...p, city: (e.target.value.trim() || '*') as any }))}
                      placeholder="* ou Ex: Cotonou"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Arrondissement</Label>
                    <Input
                      value={String(newFreeShippingRule.arrondissement)}
                      onChange={(e) => setNewFreeShippingRule((p) => ({ ...p, arrondissement: (e.target.value.trim() || '*') as any }))}
                      placeholder="* ou Ex: 5e"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quartier (national)</Label>
                    <Input
                      value={String(newFreeShippingRule.district)}
                      onChange={(e) => setNewFreeShippingRule((p) => ({ ...p, district: (e.target.value.trim() || '*') as any }))}
                      placeholder="* ou Ex: Zogbo"
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Note: si vous laissez un niveau à "*", la règle s’applique à tous les sous-niveaux.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="free_shipping" className="space-y-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 text-sm text-emerald-900">
            <div className="font-semibold">Règles de livraison gratuite (Standard uniquement)</div>
            <div className="mt-1 text-emerald-800/90">
              La gratuité s’applique uniquement au mode <span className="font-semibold">Standard</span>. Le mode Express reste payant.
            </div>
            <div className="mt-2 text-xs text-emerald-800/80">
              Astuce: utilisez une <span className="font-semibold">priorité</span> faible pour les règles générales et une priorité plus haute pour les exceptions.
            </div>
            <div className="mt-2 text-xs text-emerald-800/80">
              Pour cibler <span className="font-semibold">tous les produits</span>, laissez les champs Produits/Catégories/Vendeurs vides et gardez Zone = "Toutes".
            </div>
          </div>

          <Card className="border border-emerald-200 bg-emerald-50/40 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-emerald-900">Activation globale</CardTitle>
                <p className="text-sm text-emerald-700/80">Active/désactive la livraison gratuite sur toute la plateforme.</p>
              </div>
              <Button onClick={() => void handleSaveDeliveryConfig()} disabled={isLoadingDeliveryConfig || isSavingDeliveryConfig}>
                {isSavingDeliveryConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sauvegarder
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Livraison gratuite</Label>
                <Select
                  value={freeShippingConfig.enabled ? 'yes' : 'no'}
                  onValueChange={(value) => setFreeShippingConfig((prev) => ({ ...prev, enabled: value === 'yes' }))}
                  disabled={isLoadingDeliveryConfig}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Activée</SelectItem>
                    <SelectItem value="no">Désactivée</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-emerald-800/80">
                  Si désactivé, aucune règle ne peut rendre la livraison gratuite.
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre de règles</Label>
                <div className="rounded-md border bg-white px-3 py-2 text-sm text-gray-700">
                  {freeShippingConfig.rules.length}
                </div>
                <div className="text-xs text-emerald-800/80">
                  Les règles sont évaluées par priorité (plus petit = plus prioritaire).
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">Créer une nouvelle règle</CardTitle>
              <p className="text-sm text-gray-600">
                Ciblez une catégorie (par nom), des produits, ou des vendeurs. Les IDs sont stockés en base pour rester fiables.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={newFreeShippingRule.title} onChange={(e) => setNewFreeShippingRule((p) => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Input
                    type="number"
                    value={String(newFreeShippingRule.priority)}
                    onChange={(e) =>
                      setNewFreeShippingRule((p) => ({
                        ...p,
                        priority: Number(e.target.value || 0) || 0
                      }))
                    }
                  />
                  <div className="text-xs text-gray-500">Plus petit = appliqué en premier (ex: 10 avant 100).</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Portée du seuil</Label>
                  <Select
                    value={newFreeShippingRule.scope}
                    onValueChange={(value) => setNewFreeShippingRule((p) => ({ ...p, scope: value === 'cart_total' ? 'cart_total' : 'eligible_items' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eligible_items">Items éligibles (recommandé)</SelectItem>
                      <SelectItem value="cart_total">Total panier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Activer la règle</Label>
                  <Select
                    value={newFreeShippingRule.isActive ? 'yes' : 'no'}
                    onValueChange={(value) => setNewFreeShippingRule((p) => ({ ...p, isActive: value === 'yes' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Active</SelectItem>
                      <SelectItem value="no">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Seuil montant (XOF)</Label>
                  <Input
                    inputMode="numeric"
                    value={newFreeShippingRule.minEligibleSubtotalXof == null ? '' : String(newFreeShippingRule.minEligibleSubtotalXof)}
                    onChange={(e) =>
                      setNewFreeShippingRule((p) => ({
                        ...p,
                        minEligibleSubtotalXof: parseNullableNumber(e.target.value)
                      }))
                    }
                    placeholder="Ex: 20000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seuil quantité (items)</Label>
                  <Input
                    inputMode="numeric"
                    value={newFreeShippingRule.minEligibleQty == null ? '' : String(newFreeShippingRule.minEligibleQty)}
                    onChange={(e) =>
                      setNewFreeShippingRule((p) => ({
                        ...p,
                        minEligibleQty: parseNullableNumber(e.target.value)
                      }))
                    }
                    placeholder="Ex: 3"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-900">Ciblage (Produits / Vendeurs)</div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Produits</Label>
                    <Popover open={isProductPickerOpen} onOpenChange={setIsProductPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {newFreeShippingRule.productIds.length === 0
                            ? 'Sélectionner des produits'
                            : `${newFreeShippingRule.productIds.length} produit(s) sélectionné(s)`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher un produit..."
                            value={productSearch}
                            onValueChange={setProductSearch}
                          />
                          <CommandList>
                            <CommandEmpty>{isLoadingProducts ? 'Chargement...' : 'Aucun produit trouvé.'}</CommandEmpty>
                            <CommandGroup heading="Produits">
                              {(productSuggestions ?? []).slice(0, 20).map((p) => {
                                const isSelected = newFreeShippingRule.productIds.includes(p.id)
                                return (
                                  <CommandItem
                                    key={p.id}
                                    value={p.name}
                                    onSelect={() => {
                                      setNewFreeShippingRule((prev) => ({
                                        ...prev,
                                        productIds: isSelected
                                          ? prev.productIds.filter((x) => x !== p.id)
                                          : [p.id, ...prev.productIds]
                                      }))
                                    }}
                                  >
                                    <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    <div className="flex flex-col">
                                      <span className="text-sm text-gray-900">{p.name}</span>
                                      <span className="text-xs text-gray-500">{p.id}</span>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {newFreeShippingRule.productIds.length === 0 ? (
                      <div className="text-xs text-gray-500">Laissez vide pour ne pas filtrer par produits.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {newFreeShippingRule.productIds.map((id) => {
                          const name = productSuggestions.find((p) => p.id === id)?.name ?? id
                          return (
                            <Badge key={id} variant="secondary" className="gap-2">
                              {name}
                              <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-900"
                                onClick={() => setNewFreeShippingRule((p) => ({ ...p, productIds: p.productIds.filter((x) => x !== id) }))}
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Vendeurs</Label>
                    <Popover open={isVendorPickerOpen} onOpenChange={setIsVendorPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {newFreeShippingRule.vendorIds.length === 0
                            ? 'Sélectionner des vendeurs'
                            : `${newFreeShippingRule.vendorIds.length} vendeur(s) sélectionné(s)`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher un vendeur..."
                            value={vendorSearch}
                            onValueChange={setVendorSearch}
                          />
                          <CommandList>
                            <CommandEmpty>{isLoadingVendors ? 'Chargement...' : 'Aucun vendeur trouvé.'}</CommandEmpty>
                            <CommandGroup heading="Vendeurs">
                              {(vendorSuggestions ?? []).slice(0, 20).map((v) => {
                                const isSelected = newFreeShippingRule.vendorIds.includes(v.id)
                                return (
                                  <CommandItem
                                    key={v.id}
                                    value={v.label}
                                    onSelect={() => {
                                      setNewFreeShippingRule((prev) => ({
                                        ...prev,
                                        vendorIds: isSelected
                                          ? prev.vendorIds.filter((x) => x !== v.id)
                                          : [v.id, ...prev.vendorIds]
                                      }))
                                    }}
                                  >
                                    <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    <div className="flex flex-col">
                                      <span className="text-sm text-gray-900">{v.label}</span>
                                      <span className="text-xs text-gray-500">{v.id}</span>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {newFreeShippingRule.vendorIds.length === 0 ? (
                      <div className="text-xs text-gray-500">Laissez vide pour ne pas filtrer par vendeurs.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {newFreeShippingRule.vendorIds.map((id) => {
                          const label = vendorSuggestions.find((v) => v.id === id)?.label ?? id
                          return (
                            <Badge key={id} variant="secondary" className="gap-2">
                              {label}
                              <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-900"
                                onClick={() => setNewFreeShippingRule((p) => ({ ...p, vendorIds: p.vendorIds.filter((x) => x !== id) }))}
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-gray-900">Ciblage par catégories</div>
                    <div className="text-xs text-gray-500">Sélection par nom (stockage UUID). Vous pouvez ajouter plusieurs catégories.</div>
                  </div>
                  <Button variant="outline" onClick={() => void loadCategoryOptions()} disabled={isLoadingCategories}>
                    {isLoadingCategories ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Actualiser catégories
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Recherche</Label>
                    <Input value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} placeholder="Ex: Électronique, Mode, ..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Ajouter une catégorie</Label>
                    <Popover open={isCategoryPickerOpen} onOpenChange={setIsCategoryPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          Choisir une catégorie
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher une catégorie..." value={categorySearch} onValueChange={setCategorySearch} />
                          <CommandList>
                            <CommandEmpty>{isLoadingCategories ? 'Chargement...' : 'Aucune catégorie trouvée.'}</CommandEmpty>
                            <CommandGroup heading="Catégories">
                              {filteredCategoryOptions.slice(0, 50).map((cat) => {
                                const isSelected = newFreeShippingRule.categoryIds.includes(cat.id)
                                return (
                                  <CommandItem
                                    key={cat.id}
                                    value={cat.name}
                                    onSelect={() => {
                                      setNewFreeShippingRule((p) => ({
                                        ...p,
                                        categoryIds: isSelected
                                          ? p.categoryIds.filter((x) => x !== cat.id)
                                          : [cat.id, ...p.categoryIds]
                                      }))
                                    }}
                                  >
                                    <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    <span className="text-sm text-gray-900">{cat.name}</span>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="text-xs text-gray-500">Tape quelques lettres, puis sélectionne dans la liste.</div>
                  </div>
                </div>

                {newFreeShippingRule.categoryIds.length === 0 ? (
                  <div className="text-xs text-gray-500">Aucune catégorie sélectionnée.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {newFreeShippingRule.categoryIds.map((id) => {
                      const name = categoryOptions.find((c) => c.id === id)?.name ?? id
                      return (
                        <Badge key={id} variant="secondary" className="gap-2">
                          {name}
                          <button
                            type="button"
                            className="text-xs text-gray-600 hover:text-gray-900"
                            onClick={() => setNewFreeShippingRule((p) => ({ ...p, categoryIds: p.categoryIds.filter((x) => x !== id) }))}
                          >
                            ×
                          </button>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                <Button
                  onClick={handleAddFreeShippingRule}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter la règle
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-emerald-200 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900">Règles existantes</CardTitle>
              <p className="text-sm text-gray-600">Active/désactivez, ajustez la priorité et supprimez si besoin.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {freeShippingConfig.rules.length === 0 ? (
                <div className="text-sm text-gray-600">Aucune règle définie.</div>
              ) : (
                <div className="space-y-3">
                  {freeShippingConfig.rules
                    .slice()
                    .sort((a, b) => a.priority - b.priority)
                    .map((rule) => (
                      <div key={rule.id} className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-gray-900">{rule.title}</div>
                              <Badge className={rule.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}>
                                {rule.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="secondary">Priorité {rule.priority}</Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                              Portée: {rule.scope === 'cart_total' ? 'Total panier' : 'Items éligibles'}
                              {rule.minEligibleSubtotalXof != null ? ` — Seuil: ${rule.minEligibleSubtotalXof} XOF` : ''}
                              {rule.minEligibleQty != null ? ` — Qté: ${rule.minEligibleQty}` : ''}
                              {rule.zone && rule.zone !== '*' ? ` — Zone: ${rule.zone}` : ''}
                              {Array.isArray(rule.vendorIds) && rule.vendorIds.length > 0 ? ` — Vendeurs: ${rule.vendorIds.length}` : ''}
                              {Array.isArray(rule.productIds) && rule.productIds.length > 0 ? ` — Produits: ${rule.productIds.length}` : ''}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <Button
                              variant="outline"
                              onClick={() => handleUpdateFreeShippingRule(rule.id, { isActive: !rule.isActive })}
                            >
                              {rule.isActive ? 'Désactiver' : 'Activer'}
                            </Button>
                            <Button variant="outline" onClick={() => openEditFreeShippingRule(rule)}>
                              Modifier
                            </Button>
                            <Button variant="destructive" onClick={() => handleRemoveFreeShippingRule(rule.id)}>
                              Supprimer
                            </Button>
                          </div>
                        </div>

                        {Array.isArray(rule.categoryIds) && rule.categoryIds.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {rule.categoryIds.map((id) => (
                              <Badge key={id} variant="secondary">
                                {categoryOptions.find((c) => c.id === id)?.name ?? id}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isEditRuleOpen} onOpenChange={setIsEditRuleOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden p-0">
              <div className="flex max-h-[85vh] flex-col">
                <div className="sticky top-0 z-10 border-b bg-white/95 px-6 py-4 backdrop-blur">
                  <DialogHeader className="space-y-1">
                    <DialogTitle>Modifier la règle</DialogTitle>
                    <DialogDescription>
                      Modifie le ciblage et les conditions. La sélection se fait par nom, mais les UUID sont enregistrés.
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {editRuleDraft ? (
                    <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={editRuleDraft.title}
                        onChange={(e) => setEditRuleDraft((p) => (p ? { ...p, title: e.target.value } : p))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <Input
                        type="number"
                        value={editRuleDraft.priority}
                        onChange={(e) =>
                          setEditRuleDraft((p) => (p ? { ...p, priority: Number(e.target.value || 0) } : p))
                        }
                      />
                      <div className="text-xs text-gray-500">Plus petit = plus prioritaire.</div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Portée du seuil</Label>
                      <Select
                        value={editRuleDraft.scope}
                        onValueChange={(value) =>
                          setEditRuleDraft((p) => (p ? { ...p, scope: value === 'cart_total' ? 'cart_total' : 'eligible_items' } : p))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eligible_items">Items éligibles</SelectItem>
                          <SelectItem value="cart_total">Total panier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Select
                        value={editRuleDraft.zone ?? '*'}
                        onValueChange={(value) => setEditRuleDraft((p) => (p ? { ...p, zone: value } : p))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="*">Toutes les zones</SelectItem>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="national">National</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Seuil (montant XOF)</Label>
                      <Input
                        type="number"
                        value={editRuleDraft.minEligibleSubtotalXof ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value
                          setEditRuleDraft((p) => (p ? { ...p, minEligibleSubtotalXof: raw.trim() === '' ? null : Number(raw) } : p))
                        }}
                        placeholder="Ex: 5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Seuil (quantité)</Label>
                      <Input
                        type="number"
                        value={editRuleDraft.minEligibleQty ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value
                          setEditRuleDraft((p) => (p ? { ...p, minEligibleQty: raw.trim() === '' ? null : Number(raw) } : p))
                        }}
                        placeholder="Ex: 3"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-gray-900">Produits</div>
                    <Popover open={isEditProductPickerOpen} onOpenChange={setIsEditProductPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {editRuleDraft.productIds.length === 0
                            ? 'Sélectionner des produits'
                            : `${editRuleDraft.productIds.length} produit(s) sélectionné(s)`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher un produit..."
                            value={editProductSearch}
                            onValueChange={setEditProductSearch}
                          />
                          <CommandList>
                            <CommandEmpty>{isLoadingProducts ? 'Chargement...' : 'Aucun produit trouvé.'}</CommandEmpty>
                            <CommandGroup heading="Produits">
                              {(productSuggestions ?? []).slice(0, 20).map((p) => {
                                const isSelected = editRuleDraft.productIds.includes(p.id)
                                return (
                                  <CommandItem
                                    key={p.id}
                                    value={p.name}
                                    onSelect={() => {
                                      setEditRuleDraft((prev) => {
                                        if (!prev) return prev
                                        return {
                                          ...prev,
                                          productIds: isSelected
                                            ? prev.productIds.filter((x) => x !== p.id)
                                            : [p.id, ...prev.productIds]
                                        }
                                      })
                                    }}
                                  >
                                    <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    <div className="flex flex-col">
                                      <span className="text-sm text-gray-900">{p.name}</span>
                                      <span className="text-xs text-gray-500">{p.id}</span>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {editRuleDraft.productIds.length === 0 ? (
                      <div className="text-xs text-gray-500">Laissez vide pour ne pas filtrer par produits.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {editRuleDraft.productIds.map((id) => {
                          const name = productSuggestions.find((p) => p.id === id)?.name ?? id
                          return (
                            <Badge key={id} variant="secondary" className="gap-2">
                              {name}
                              <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-900"
                                onClick={() =>
                                  setEditRuleDraft((p) => (p ? { ...p, productIds: p.productIds.filter((x) => x !== id) } : p))
                                }
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-gray-900">Vendeurs</div>
                    <Popover open={isEditVendorPickerOpen} onOpenChange={setIsEditVendorPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {editRuleDraft.vendorIds.length === 0
                            ? 'Sélectionner des vendeurs'
                            : `${editRuleDraft.vendorIds.length} vendeur(s) sélectionné(s)`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher un vendeur..."
                            value={editVendorSearch}
                            onValueChange={setEditVendorSearch}
                          />
                          <CommandList>
                            <CommandEmpty>{isLoadingVendors ? 'Chargement...' : 'Aucun vendeur trouvé.'}</CommandEmpty>
                            <CommandGroup heading="Vendeurs">
                              {(vendorSuggestions ?? []).slice(0, 20).map((v) => {
                                const isSelected = editRuleDraft.vendorIds.includes(v.id)
                                return (
                                  <CommandItem
                                    key={v.id}
                                    value={v.label}
                                    onSelect={() => {
                                      setEditRuleDraft((prev) => {
                                        if (!prev) return prev
                                        return {
                                          ...prev,
                                          vendorIds: isSelected
                                            ? prev.vendorIds.filter((x) => x !== v.id)
                                            : [v.id, ...prev.vendorIds]
                                        }
                                      })
                                    }}
                                  >
                                    <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    <div className="flex flex-col">
                                      <span className="text-sm text-gray-900">{v.label}</span>
                                      <span className="text-xs text-gray-500">{v.id}</span>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {editRuleDraft.vendorIds.length === 0 ? (
                      <div className="text-xs text-gray-500">Laissez vide pour ne pas filtrer par vendeurs.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {editRuleDraft.vendorIds.map((id) => {
                          const label = vendorSuggestions.find((v) => v.id === id)?.label ?? id
                          return (
                            <Badge key={id} variant="secondary" className="gap-2">
                              {label}
                              <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-900"
                                onClick={() =>
                                  setEditRuleDraft((p) => (p ? { ...p, vendorIds: p.vendorIds.filter((x) => x !== id) } : p))
                                }
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-gray-900">Catégories</div>
                    <Popover open={isEditCategoryPickerOpen} onOpenChange={setIsEditCategoryPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {editRuleDraft.categoryIds.length === 0
                            ? 'Sélectionner des catégories'
                            : `${editRuleDraft.categoryIds.length} catégorie(s) sélectionnée(s)`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Rechercher une catégorie..."
                            value={editCategorySearch}
                            onValueChange={setEditCategorySearch}
                          />
                          <CommandList>
                            <CommandEmpty>{isLoadingCategories ? 'Chargement...' : 'Aucune catégorie trouvée.'}</CommandEmpty>
                            <CommandGroup heading="Catégories">
                              {filteredEditCategoryOptions.slice(0, 50).map((cat) => {
                                const isSelected = editRuleDraft.categoryIds.includes(cat.id)
                                return (
                                  <CommandItem
                                    key={cat.id}
                                    value={cat.name}
                                    onSelect={() => {
                                      setEditRuleDraft((prev) => {
                                        if (!prev) return prev
                                        return {
                                          ...prev,
                                          categoryIds: isSelected
                                            ? prev.categoryIds.filter((x) => x !== cat.id)
                                            : [cat.id, ...prev.categoryIds]
                                        }
                                      })
                                    }}
                                  >
                                    <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                    <span className="text-sm text-gray-900">{cat.name}</span>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {editRuleDraft.categoryIds.length === 0 ? (
                      <div className="text-xs text-gray-500">Laissez vide pour ne pas filtrer par catégories.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {editRuleDraft.categoryIds.map((id) => {
                          const name = categoryOptions.find((c) => c.id === id)?.name ?? id
                          return (
                            <Badge key={id} variant="secondary" className="gap-2">
                              {name}
                              <button
                                type="button"
                                className="text-xs text-gray-600 hover:text-gray-900"
                                onClick={() =>
                                  setEditRuleDraft((p) => (p ? { ...p, categoryIds: p.categoryIds.filter((x) => x !== id) } : p))
                                }
                              >
                                ×
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                  ) : null}
                </div>

                <div className="sticky bottom-0 z-10 border-t bg-white/95 px-6 py-4 backdrop-blur">
                  <DialogFooter className="gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditRuleOpen(false)
                        setEditRuleId(null)
                        setEditRuleDraft(null)
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => {
                        if (!editRuleDraft || !editRuleId) return
                        const { id, ...patch } = editRuleDraft
                        handleUpdateFreeShippingRule(editRuleId, patch)
                        setIsEditRuleOpen(false)
                        setEditRuleId(null)
                        setEditRuleDraft(null)
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700"
                    >
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-blue-200 bg-blue-50/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Livraisons actives</CardTitle>
                <Truck className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{statusStats.total}</div>
                <p className="text-xs text-blue-700/80">Surveillance continue et suivi multi-acteurs</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Livraisons livrées</CardTitle>
                <PackageCheck className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">{statusStats.delivered}</div>
                <p className="text-xs text-emerald-700/80">Total des livraisons finalisées</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-amber-700">Surveillances critiques</CardTitle>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">{statusStats.issues}</div>
                <p className="text-xs text-amber-700/80">Retards ou incidents en cours</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="space-y-2 border-b border-gray-100 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Filtrer et orchestrer</CardTitle>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher (commande, tracking, livreur…)"
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {(Object.keys(DELIVERY_STATUS_CONFIG) as SuperAdminDeliveryStatus[]).map(status => (
                      <SelectItem key={status} value={status}>
                        {DELIVERY_STATUS_CONFIG[status].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vendeur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les vendeurs</SelectItem>
                    {vendorOptions.map(vendorId => (
                      <SelectItem key={vendorId} value={vendorId}>
                        {vendorId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Commande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les commandes</SelectItem>
                    {orderOptions.map(orderId => (
                      <SelectItem key={orderId} value={orderId}>
                        {orderId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-[540px] overflow-auto">
                {isLoading ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Chargement des livraisons…</span>
                  </div>
                ) : loadingError ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                    <span>{loadingError}</span>
                  </div>
                ) : filteredDeliveries.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
                    <Truck className="h-7 w-7" />
                    <span>Aucune livraison à afficher avec ces critères.</span>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredDeliveries.map(delivery => (
                      <div
                        key={delivery.id}
                        onClick={() => openDetails(delivery)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          openDetails(delivery)
                        }}
                        role="button"
                        tabIndex={0}
                        className="flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-gray-50"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`border ${DELIVERY_STATUS_CONFIG[delivery.status].tone}`}>
                              {DELIVERY_STATUS_CONFIG[delivery.status].label}
                            </Badge>
                            <Badge className={`text-xs capitalize ${PRIORITY_COLORS[delivery.priority] ?? PRIORITY_COLORS.medium}`}>
                              Priorité {delivery.priority}
                            </Badge>
                            {delivery.trackingNumber ? (
                              <Badge variant="outline" className="text-xs text-gray-600">
                                Tracking {delivery.trackingNumber}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-2 md:items-end">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>Créée le {formatDate(delivery.createdAt)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {delivery.status !== 'pending' ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    void handleMarkAwaitingAcceptance(delivery)
                                  }}
                                >
                                  En attente d'acceptation
                                </Button>
                              ) : null}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  handleEditDelivery(delivery)
                                }}
                              >
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  void handleDeleteDelivery(delivery)
                                }}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-xs uppercase text-gray-500">Commande</p>
                            <p className="font-semibold text-gray-900">#{delivery.orderNumber ?? delivery.orderId}</p>
                            <p className="text-xs text-gray-500">Client: {delivery.customerName ?? delivery.customerId ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-500">Livreur</p>
                            <p className="font-medium text-gray-900">{delivery.driver?.name ?? "Non assigné"}</p>
                            <p className="text-xs text-gray-500">{delivery.driver?.phone ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-500">Progression</p>
                            <p className="font-medium text-gray-900">{delivery.progressPercent}%</p>
                            <p className="text-xs text-gray-500">{formatProgressLabel(delivery.progressPercent)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-500">Localisation</p>
                            <p className="flex items-center gap-1 font-medium text-gray-900">
                              <MapPin className="h-4 w-4 text-orange-500" />
                              {delivery.currentLocation ?? "—"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Adresse:{' '}
                              {typeof delivery.deliveryAddress === 'string' && delivery.deliveryAddress.trim().length > 0
                                ? delivery.deliveryAddress
                                : '—'}
                            </p>
                            <p className="text-xs text-gray-500">ETA: {formatDate(delivery.eta)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog
            open={isDetailsOpen}
            onOpenChange={(open) => {
              setIsDetailsOpen(open)
              if (!open) {
                setSelectedDelivery(null)
                setDeliveryProofs([])
                setIsChatOpen(false)
              }
            }}
          >
            <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <Truck className="h-5 w-5 text-orange-500" />
                  Détails de la livraison
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Visualisez la chronologie, les affectations et les paramètres avancés de la livraison.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1">
                {selectedDelivery ? (
                  <div className="space-y-6 pr-2">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Tracking</h3>
                      <Badge variant="outline" className="text-xs text-gray-600">
                        Carte
                      </Badge>
                    </div>
                    <DeliveryTrackingMap driverPoint={driverPoint} destinationPoint={destinationPoint} />
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Coordonnées destination</span>
                        <span className="font-medium text-gray-900">
                          {destinationPoint ? `${destinationPoint.lat.toFixed(5)}, ${destinationPoint.lng.toFixed(5)}` : '—'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-gray-500">Adresse</span>
                        <span className="text-right font-medium text-gray-900">{selectedDelivery.deliveryAddress ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Heure (ETA)</span>
                        <span className="font-medium text-gray-900">{formatDate(selectedDelivery.eta)}</span>
                      </div>
                    </div>
                  </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Commande</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        #{selectedDelivery.orderNumber ?? selectedDelivery.orderId}
                      </h3>
                    </div>
                    <Badge className={`border ${DELIVERY_STATUS_CONFIG[selectedDelivery.status].tone}`}>
                      {DELIVERY_STATUS_CONFIG[selectedDelivery.status].label}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <dl className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <dt>Client</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.customerName ?? selectedDelivery.customerId ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Vendeur</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.vendorName ?? selectedDelivery.vendorId ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Tracking</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.trackingNumber ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Progression</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.progressPercent}%</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Livreur</p>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedDelivery.driver?.name ?? "Non assigné"}
                      </h3>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  </div>
                  <Separator className="my-3" />
                  <dl className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <dt>Téléphone</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.driver?.phone ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Immatriculation</dt>
                      <dd className="font-medium text-gray-900">{selectedDelivery.driver?.vehiclePlate ?? "—"}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>ETA</dt>
                      <dd className="font-medium text-gray-900">{formatDate(selectedDelivery.eta)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Dernière mise à jour</dt>
                      <dd className="font-medium text-gray-900">{formatDate(selectedDelivery.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {selectedDelivery.events.length > 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Chronologie de la livraison</h3>
                    <Badge variant="outline" className="text-xs text-gray-600">
                      {selectedDelivery.events.length} évènement(s)
                    </Badge>
                  </div>
                  <ScrollArea className="max-h-72 pr-4">
                    <div className="space-y-4">
                      {selectedDelivery.events.map(event => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {event.status ?? event.type ?? "Mise à jour"}
                              </p>
                              <Badge variant="outline" className="text-xs text-gray-600">
                                {formatDate(event.occurredAt)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{event.description ?? "—"}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              {event.location ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {event.location}
                                </span>
                              ) : null}
                              {event.coordinates ? (
                                <span>
                                  Lat {event.coordinates.lat?.toFixed(4) ?? "—"} / Lng {event.coordinates.lng?.toFixed(4) ?? "—"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-6 text-center text-sm text-gray-500">
                  Aucun évènement enregistré pour cette livraison.
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Preuve de livraison</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!selectedDelivery?.id) return
                      void loadDeliveryProofs(selectedDelivery.id)
                    }}
                    disabled={isLoadingProofs}
                  >
                    {isLoadingProofs ? 'Chargement…' : 'Actualiser'}
                  </Button>
                </div>

                {deliveryProofs.length === 0 ? (
                  <div className="text-sm text-gray-500">Aucune preuve enregistrée pour le moment.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {deliveryProofs
                      .filter((p) => typeof p?.public_url === 'string' && p.public_url)
                      .map((proof) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={proof.id}
                          src={String(proof.public_url)}
                          alt="Preuve de livraison"
                          className="h-44 w-full rounded-lg border border-gray-200 object-cover"
                        />
                      ))}
                  </div>
                )}
              </div>
                  </div>
                ) : null}
              </ScrollArea>

              <DialogFooter>
                {selectedDelivery ? (
                  <Button type="button" variant="outline" onClick={() => setIsChatOpen(true)}>
                    Chat livraison
                  </Button>
                ) : null}
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {selectedDelivery ? (
            <DeliveryChatReplacement
              deliveryInfo={selectedDelivery}
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />
          ) : null}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col bg-gradient-to-br from-white to-gray-50 p-0 shadow-xl">
          <DialogHeader className="border-b border-gray-200 p-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-orange-600">
              <Truck className="h-6 w-6" />
              Planification de livraison
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Configurez la livraison pour la commande{' '}
              <span className="font-semibold text-orange-500">
                {selectedOrderChoice?.label
                  ? selectedOrderChoice.label
                  : plannedOrderNumber
                    ? plannedOrderNumber
                    : newDeliveryForm.orderId
                      ? `#${newDeliveryForm.orderId}`
                      : "(sélectionnez une commande)"}
              </span>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] flex-1 overflow-y-auto p-6 pt-0">
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 text-orange-500" />
                  Commande à livrer
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Select value={newDeliveryForm.orderId} onValueChange={handleSelectOrderChoice}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder="Sélectionner une commande" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      {isLoadingOrderChoices ? (
                        <div className="py-2 text-center text-sm text-gray-500">Chargement des commandes...</div>
                      ) : orderChoices.length === 0 ? (
                        <div className="py-2 text-center text-sm text-gray-500">Aucune commande disponible</div>
                      ) : (
                        orderChoices.map(order => (
                          <SelectItem key={order.id} value={order.id} className="hover:bg-orange-50 focus:bg-orange-50">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{order.label}</span>
                              <span className="text-xs text-gray-500">ID: {order.id}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 border-gray-300 text-gray-500 transition hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Coordonnées de destination (commande)
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {selectedOrderCoordinates ? (
                    <p>
                      Lat {selectedOrderCoordinates.lat} / Lng {selectedOrderCoordinates.lng}
                    </p>
                  ) : (
                    <p className="text-amber-700">
                      Coordonnées non renseignées sur la commande. La création sera refusée côté API tant que shipping_lat/shipping_lng sont vides.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Info className="h-4 w-4 text-orange-500" />
                    Statut
                  </Label>
                  <Select
                    value={newDeliveryForm.status}
                    onValueChange={(value) => setNewDeliveryForm((prev) => ({ ...prev, status: value as SuperAdminDeliveryStatus }))}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      {(Object.keys(DELIVERY_STATUS_CONFIG) as SuperAdminDeliveryStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {DELIVERY_STATUS_CONFIG[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Truck className="h-4 w-4 text-orange-500" />
                    Méthode
                  </Label>
                  <Select
                    value={newDeliveryForm.shippingMethodId}
                    onValueChange={(value) => setNewDeliveryForm((prev) => ({ ...prev, shippingMethodId: value }))}
                    disabled={isLoadingShippingMethodOptions}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder={isLoadingShippingMethodOptions ? 'Chargement…' : 'Choisir une méthode'} />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      <SelectItem value={SELECT_NONE_VALUE}>Aucune</SelectItem>
                      {shippingMethodOptions.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name || method.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <ShieldCheck className="h-4 w-4 text-orange-500" />
                    Transporteur
                  </Label>
                  <Select
                    value={newDeliveryForm.carrierId}
                    onValueChange={(value) => setNewDeliveryForm((prev) => ({ ...prev, carrierId: value }))}
                    disabled={isLoadingCarrierOptions}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder={isLoadingCarrierOptions ? 'Chargement…' : 'Choisir un transporteur'} />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      <SelectItem value={SELECT_NONE_VALUE}>Aucun</SelectItem>
                      {carrierOptions.map((carrier) => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.name || carrier.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Date de livraison estimée
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="datetime-local"
                    value={newDeliveryForm.eta}
                    onChange={event => setNewDeliveryForm(prev => ({ ...prev, eta: event.target.value }))}
                    className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Niveau de priorité
                  </Label>
                  <Select
                    value={newDeliveryForm.priority}
                    onValueChange={value => setNewDeliveryForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-200 shadow-lg">
                      <SelectItem value="low" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Basse priorité</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>Moyenne priorité</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          <span>Haute priorité</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="critical" className="hover:bg-orange-50 focus:bg-orange-50">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span>Urgence critique</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Package className="h-4 w-4 text-orange-500" />
                  Numéro de suivi
                  <span className="text-xs font-normal text-gray-400">(optionnel)</span>
                </Label>
                <Input
                  placeholder="Ex: 1Z999AA1234567890"
                  value={newDeliveryForm.trackingNumber}
                  onChange={event => setNewDeliveryForm(prev => ({ ...prev, trackingNumber: event.target.value }))}
                  className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4 text-orange-500" />
                    Informations du livreur
                  </h3>
                  <span className="text-xs text-gray-400">Optionnel</span>
                </div>

                <div className="space-y-4 rounded-xl border border-orange-100 bg-orange-50/30 p-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-600">Livreur suggéré (auto)</Label>
                    <Select value={newDeliveryForm.driverId} onValueChange={handleSelectDriverSuggestion}>
                      <SelectTrigger className="h-10 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20">
                        <SelectValue
                          placeholder={
                            isLoadingDriverSuggestions
                              ? 'Chargement des livreurs…'
                              : driverSuggestions.length > 0
                                ? 'Choisir un livreur disponible'
                                : newDeliveryForm.orderId
                                  ? 'Aucun livreur suggéré'
                                  : 'Choisir d\'abord une commande'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200 shadow-lg">
                        {driverSuggestions.length === 0 ? (
                          <div className="py-2 text-center text-sm text-gray-500">
                            {newDeliveryForm.orderId ? 'Aucun livreur disponible pour cette zone.' : 'Sélectionnez une commande.'}
                          </div>
                        ) : (
                          driverSuggestions.map(driver => (
                            <SelectItem
                              key={driver.user_id}
                              value={driver.user_id}
                              className="hover:bg-orange-50 focus:bg-orange-50"
                            >
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 overflow-hidden rounded-full border border-gray-200 bg-white">
                                  {driver.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={driver.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-400">PB</div>
                                  )}
                                </div>
                                <span className="min-w-0 flex-1 truncate">{formatDriverSuggestionLabel(driver)}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="driverName" className="text-xs font-medium text-gray-600">
                        Nom du livreur
                      </Label>
                      <Input
                        id="driverName"
                        placeholder="Jean Dupont"
                        value={newDeliveryForm.driverName}
                        onChange={event => setNewDeliveryForm(prev => ({ ...prev, driverName: event.target.value }))}
                        className="h-10 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="driverPhone" className="text-xs font-medium text-gray-600">
                        Téléphone
                      </Label>
                      <Input
                        id="driverPhone"
                        placeholder="+225 XX XX XX XX"
                        value={newDeliveryForm.driverPhone}
                        onChange={event => setNewDeliveryForm(prev => ({ ...prev, driverPhone: event.target.value }))}
                        className="h-10 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="driverVehicle" className="text-xs font-medium text-gray-600">
                      Détails du véhicule
                    </Label>
                    <Input
                      id="driverVehicle"
                      placeholder="Ex: Moto rouge, 123-AB-456"
                      value={newDeliveryForm.driverVehicle}
                      onChange={event => setNewDeliveryForm(prev => ({ ...prev, driverVehicle: event.target.value }))}
                      className="h-10 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <Info className="mt-0.5 h-5 w-5 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Une notification sera envoyée au client avec les détails de la livraison une fois planifiée.
                </p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateDelivery}
              disabled={!newDeliveryForm.orderId || isCreating}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transition hover:from-orange-600 hover:to-orange-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Planifier la livraison
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression d'une livraison */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => { if (!isDeletingDelivery) setIsDeleteConfirmOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette livraison ?</DialogTitle>
            <DialogDescription>
              {deleteConfirmTarget
                ? `La livraison liée à la commande #${deleteConfirmTarget.orderNumber ?? deleteConfirmTarget.orderId ?? '—'} sera définitivement supprimée. Cette action est irréversible.`
                : 'Cette action est irréversible.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteConfirmOpen(false); setDeleteConfirmTarget(null) }} disabled={isDeletingDelivery}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirmTarget) void handleDeleteDelivery(deleteConfirmTarget) }} disabled={isDeletingDelivery}>
              {isDeletingDelivery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
