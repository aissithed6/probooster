"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, Package, Truck, CheckCircle, Clock, AlertTriangle, Eye, DollarSign, Shield, CreditCard,
  MapPin, User, Calendar, TrendingUp, Filter, Search, Download, RefreshCw, Star, Mail, Phone,
  FileText, ArrowLeftRight, CheckCircle2, XCircle, Plus, Settings, Smartphone, Zap, Target, Edit, Trash2,
  UserCheck, Users, Wallet, Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useNotifications } from '@/components/ui/modern-notification'
import { SuperAdminOrderService } from '@/lib/services/super-admin-order-service'
import { SuperAdminDashboardService } from '@/lib/services/super-admin-dashboard-service'
import { isProductEligibleForFreeShippingLabel, type FreeShippingConfig } from '@/lib/utils/free-shipping-eligibility'
import { useMoney } from '@/lib/hooks/use-money'
import { ClientAuthService } from '@/lib/services/client-auth-service'

// Interfaces complètes
interface Order {
  id: string
  orderNumber: string
  customerId?: string
  customer: {
    name: string
    email: string
    phone: string
    address: string
  }
  vendor: {
    id: string
    name: string
    commissionRate: number
  }
  products: Array<{
    id: string
    name: string
    quantity: number
    price: number
    total: number
    warranty?: string
    returnPolicy?: string
    productId?: string
    vendorId?: string
    categoryIds?: string[]
  }>
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'delayed'
  totalAmount: number
  shippingAddress: string
  paymentMethod: 'mobile_money' | 'card' | 'bank_transfer' | 'cash'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  createdAt: string
  updatedAt: string
  deliveryDate?: string
  returnReason?: string
  returnStatus?: 'pending' | 'approved' | 'rejected' | 'completed'
  commission: number
  pointsEarned: number
  clientValidation: boolean
  clientValidationDate?: string
  deliveryTracking?: string
  notes?: string
  deliveries?: Array<{
    id: string
    status: string
    eta?: string | null
    dispatched_at?: string | null
    delivered_at?: string | null
    cancelled_at?: string | null
    created_at?: string | null
  }>
  deliveryOption?: string
}

interface PaymentRequest {
  id: string
  vendorId: string
  vendorName: string
  orderIds: string[]
  totalAmount: number
  commissionAmount: number
  netAmount: number
  status: 'pending' | 'approved' | 'rejected' | 'deleted' | 'edited'
  paymentMethod: string
  bankDetails?: string
  mobileNumber?: string
  createdAt: string
  processedAt?: string
  notes?: string
  rejectionReason?: string
  rejectionDate?: string
  rejectionBy?: string
  editHistory?: Array<{
    date: string
    by: string
    changes: string
  }>
}

interface PaymentMethod {
  id: string
  name: string
  type: 'mobile_money' | 'card' | 'bank_transfer' | 'cash'
  isActive: boolean
  fees: number
  processingTime: string
  supportedCurrencies: string[]
}

const FALLBACK_CUSTOMER_NAME = 'Client inconnu'
const FALLBACK_VENDOR_NAME = 'Vendeur inconnu'

/**
 * Formatte un objet adresse (JSON ou chaîne) en libellé lisible pour l’interface.
 */
function formatShippingAddress(address: unknown): string {
  if (!address) {
    return 'Adresse non renseignée'
  }

  if (typeof address === 'string') {
    const trimmed = address.trim()

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        return formatShippingAddress(parsed)
      } catch {
        return trimmed
      }
    }

    return trimmed
  }

  if (typeof address === 'object' && address !== null) {
    const candidate = address as Record<string, unknown>

    const parts: string[] = []
    const pushPart = (value: unknown) => {
      if (typeof value !== 'string') return
      const trimmed = value.trim()
      if (!trimmed) return
      parts.push(trimmed)
    }

    pushPart((candidate as any)?.customer_email)
    pushPart((candidate as any)?.customerEmail)
    pushPart((candidate as any)?.customer_phone)
    pushPart((candidate as any)?.customerPhone)

    const deliveryRaw =
      (candidate as any)?.delivery_address ??
      (candidate as any)?.deliveryAddress ??
      null

    if (typeof deliveryRaw === 'string') {
      const trimmed = deliveryRaw.trim()
      if (trimmed.length > 0) parts.push(trimmed)
    }

    if (deliveryRaw && typeof deliveryRaw === 'object') {
      const deliveryObj = deliveryRaw as Record<string, unknown>
      const deliveryParts = [
        deliveryObj.street,
        deliveryObj.address,
        deliveryObj.line1,
        deliveryObj.line2,
        deliveryObj.city,
        deliveryObj.state,
        deliveryObj.region,
        deliveryObj.country,
        deliveryObj.postalCode,
        deliveryObj.postal_code
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      if (deliveryParts.length > 0) {
        parts.push(deliveryParts.join(', '))
      }
    }

    const legacyParts = [
      candidate.street,
      candidate.address,
      candidate.line1,
      candidate.line2,
      candidate.city,
      candidate.state,
      candidate.region,
      candidate.country,
      candidate.postalCode,
      candidate.postal_code
    ]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

    if (legacyParts.length > 0) {
      parts.push(legacyParts.join(', '))
    }

    if (parts.length > 0) {
      return parts.join(', ')
    }

    return 'Adresse non renseignée'
  }

  return 'Adresse non renseignée'
}

/**
 * Transforme la réponse brute de l’API en structure de commande attendue par l’UI.
 */
function mapApiOrderToOrder(order: any): Order {
  const products = Array.isArray(order?.order_items)
    ? order.order_items.map((item: any, index: number) => ({
        id: item?.id ?? `${order?.id ?? 'order'}-item-${index}`,
        name: item?.product_name ?? `Produit ${index + 1}`,
        quantity: Number(item?.quantity ?? 0),
        price: Number(item?.unit_price ?? 0),
        total: Number(item?.total_price ?? (item?.unit_price ?? 0) * (item?.quantity ?? 0)),
        warranty:
          typeof item?.product_warranty === 'string'
            ? item.product_warranty
            : typeof item?.warranty === 'string'
              ? item.warranty
              : undefined,
        returnPolicy:
          typeof item?.product_return_policy === 'string'
            ? item.product_return_policy
            : typeof item?.return_policy === 'string'
              ? item.return_policy
              : typeof item?.returnPolicy === 'string'
                ? item.returnPolicy
                : undefined,
        productId: typeof item?.product_id === 'string' ? item.product_id : undefined,
        vendorId: typeof item?.product_vendor_id === 'string' ? item.product_vendor_id : undefined,
        categoryIds: Array.isArray(item?.product_category_ids) ? item.product_category_ids.map(String).filter(Boolean) : undefined
      }))
    : Array.isArray(order?.items)
      ? order.items.map((item: any, index: number) => ({
          id: item?.id ?? `${order?.id ?? 'order'}-item-${index}`,
          name: item?.name ?? `Produit ${index + 1}`,
          quantity: Number(item?.quantity ?? 0),
          price: Number(item?.price ?? 0),
          total: Number(item?.total ?? (item?.price ?? 0) * (item?.quantity ?? 0))
        }))
      : []

  return {
    id: String(order?.id ?? ''),
    orderNumber:
      order?.order_number ??
      (typeof order?.id === 'string' && order.id.length > 0 ? `ORDER-${String(order.id).slice(0, 8)}` : 'Commande sans numéro'),
    customerId: typeof order?.customer_id === 'string' ? order.customer_id : undefined,
    customer: {
      name: order?.customer_name ?? FALLBACK_CUSTOMER_NAME,
      email: order?.customer_email ?? 'contact@inconnu.com',
      phone: order?.customer_phone ?? '—',
      address: formatShippingAddress(order?.shipping_address)
    },
    vendor: {
      id: order?.vendor_id ?? 'unknown_vendor',
      name: order?.vendor_name ?? order?.vendor_id ?? FALLBACK_VENDOR_NAME,
      commissionRate: Number(order?.vendor_commission_rate ?? 0)
    },
    products,
    status: (order?.status ?? 'pending') as Order['status'],
    totalAmount: Number(order?.total_amount ?? 0),
    shippingAddress: formatShippingAddress(order?.shipping_address),
    paymentMethod: (order?.payment_method ?? 'cash') as Order['paymentMethod'],
    paymentStatus: (order?.payment_status ?? 'pending') as Order['paymentStatus'],
    createdAt: order?.created_at ?? new Date().toISOString(),
    updatedAt: order?.updated_at ?? order?.created_at ?? new Date().toISOString(),
    deliveryDate: order?.delivery_date ?? undefined,
    returnReason: order?.return_reason ?? undefined,
    returnStatus: order?.return_status ?? undefined,
    commission: Number(order?.commission_amount ?? 0),
    pointsEarned: Number(order?.points_earned ?? 0),
    clientValidation: Boolean(order?.client_validation ?? false),
    clientValidationDate: order?.client_validation_date ?? undefined,
    deliveryTracking: order?.delivery_tracking ?? undefined,
    notes: order?.notes ?? undefined,
    deliveries: Array.isArray(order?.deliveries)
      ? order.deliveries
          .map((row: any) => ({
            id: String(row?.id ?? ''),
            status: String(row?.status ?? ''),
            eta: row?.eta ?? null,
            dispatched_at: row?.dispatched_at ?? null,
            delivered_at: row?.delivered_at ?? null,
            cancelled_at: row?.cancelled_at ?? null,
            created_at: row?.created_at ?? null
          }))
          .filter((row: any) => typeof row.id === 'string' && row.id.length > 0)
      : []
    ,
    deliveryOption: typeof order?.delivery_option === 'string'
      ? order.delivery_option
      : typeof order?.deliveryOption === 'string'
        ? order.deliveryOption
        : undefined
  }
}

/**
 * Determine si la commande requiert une livraison physique (le client a choisi la livraison).
 */
function orderRequiresDelivery(order: Order): boolean {
  const deliveryOption = String((order as any)?.deliveryOption ?? (order as any)?.delivery_option ?? '').trim().toLowerCase()
  if (deliveryOption === 'none' || deliveryOption === 'no_delivery') {
    return false
  }

  const shipping = String(order.shippingAddress ?? '').trim().toLowerCase()
  if (!shipping) return false

  if (shipping.includes('retrait') || shipping.includes('pickup') || shipping.includes('point relais')) {
    return false
  }

  return true
}

/**
 * Normalise l'etat de livraison d'une commande pour l'UI.
 */
function resolveDeliveryUiState(order: Order): 'delivered' | 'scheduled' | 'needs_delivery' | 'none' {
  if (!orderRequiresDelivery(order)) {
    return 'none'
  }

  if (order.status === 'delivered') {
    return 'delivered'
  }

  const deliveries = Array.isArray(order.deliveries) ? order.deliveries : []
  const active = deliveries.find((d) => {
    const status = String(d.status ?? '').toLowerCase()
    return status.length > 0 && status !== 'cancelled' && status !== 'failed'
  })

  if (!active) {
    return 'needs_delivery'
  }

  const deliveryStatus = String(active.status ?? '').toLowerCase()
  if (deliveryStatus === 'delivered') {
    return 'delivered'
  }

  return 'scheduled'
}

type OrderManagementProps = {
  prefetchedOrders?: any[]
}

export default function OrderManagement({ prefetchedOrders }: OrderManagementProps) {
  const router = useRouter()
  const { addNotification } = useNotifications()
  const { formatMoney } = useMoney()
  const [orders, setOrders] = useState<Order[]>([])
  const ordersRef = useRef<Order[]>([])
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const handleConfirmCashPayment = async (order: Order) => {
    if (!order?.id) return

    const snapshot = ordersRef.current.map((o) => ({ ...o }))
    setIsActionLoading(true)

    setOrders((prev) =>
      prev.map((entry) =>
        entry.id === order.id
          ? {
              ...entry,
              paymentStatus: 'paid'
            }
          : entry
      )
    )

    try {
      const updated = await SuperAdminOrderService.update(order.id, { paymentStatus: 'paid' })
      setOrders((prev) => prev.map((entry) => (entry.id === order.id ? mapApiOrderToOrder(updated) : entry)))

      addNotification({
        type: 'success',
        title: 'Paiement confirmé',
        message: 'Le paiement en espèces a été marqué comme payé.',
        duration: 4000
      })
    } catch (error) {
      console.error('❌ Confirmation paiement cash échouée', error)
      setOrders(snapshot)

      addNotification({
        type: 'error',
        title: 'Erreur',
        message: "Impossible de confirmer le paiement en espèces.",
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const hasSeededPrefetchRef = useRef(false)

  useEffect(() => {
    ordersRef.current = orders
  }, [orders])
  
  // États pour le modal de demande de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null)
  
  // États pour le modal harmonisé (même que tableau de bord vendeur)
  const [sellerSearchOpen, setSellerSearchOpen] = useState(false)
  const [sellerSearchValue, setSellerSearchValue] = useState('')
  const [animateModal, setAnimateModal] = useState(false)
  const [animateContent, setAnimateContent] = useState(false)
  
  // Données de paiement harmonisées
  const [paymentData, setPaymentData] = useState({
    orderId: '',
    amount: 0,
    paymentMethod: '',
    accountNumber: '',
    accountName: '',
    bankName: '',
    phoneNumber: '',
    notes: '',
    sellerEmail: '',
    sellerName: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false)
  const [disputeData, setDisputeData] = useState({
    type: 'delivery_issue',
    subject: '',
    description: '',
    priority: 'normal',
    assignedTo: '',
    resolution: '',
    notes: ''
  })
  const [activeTab, setActiveTab] = useState('orders')

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)

  // États pour la configuration
  const [commissionRates, setCommissionRates] = useState({
    default: 10,
    electronics: 12,
    clothing: 8,
    food: 5,
    beauty: 15,
    sports: 7,
    books: 6,
    home: 9
  })

  const [commissionFixed, setCommissionFixed] = useState({
    enabled: false,
    amount: 5000
  })

  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed' | 'hybrid'>('percentage')

  const [paymentFrequencies, setPaymentFrequencies] = useState({
    daily: false,
    weekly: false,
    monthly: true,
    quarterly: false
  })

  // ============================================================
  // Persistance de la configuration (commissions + fréquences)
  // via super_admin_settings (scope 'global')
  // ============================================================
  const ORDERS_SETTINGS_KEY = 'orders_section'

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const cfg = await SuperAdminDashboardService.getGlobalSettings()
        if (cancelled) return
        const section = ((cfg as Record<string, any>)?.[ORDERS_SETTINGS_KEY] ?? {}) as Record<string, any>

        if (section.commissionRates) setCommissionRates((prev) => ({ ...prev, ...section.commissionRates }))
        if (section.commissionFixed) setCommissionFixed((prev) => ({ ...prev, ...section.commissionFixed }))
        if (section.commissionType) setCommissionType(section.commissionType)
        if (section.paymentFrequencies) setPaymentFrequencies((prev) => ({ ...prev, ...section.paymentFrequencies }))
      } catch {
        // silencieux : valeurs par défaut conservées
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const persistOrdersConfig = useCallback(
    async (next: {
      commissionRates?: typeof commissionRates
      commissionFixed?: typeof commissionFixed
      commissionType?: typeof commissionType
      paymentFrequencies?: typeof paymentFrequencies
    }) => {
      try {
        const current = ((await SuperAdminDashboardService.getGlobalSettings()) as Record<string, any>) ?? {}
        const section = { ...(current[ORDERS_SETTINGS_KEY] ?? {}) }

        if (next.commissionRates) section.commissionRates = next.commissionRates
        if (next.commissionFixed) section.commissionFixed = next.commissionFixed
        if (next.commissionType) section.commissionType = next.commissionType
        if (next.paymentFrequencies) section.paymentFrequencies = next.paymentFrequencies

        await SuperAdminDashboardService.updateSettings('global', {
          ...current,
          [ORDERS_SETTINGS_KEY]: section
        })
      } catch (error) {
        console.error('❌ Impossible de sauvegarder la configuration commandes', error)
        addNotification({
          type: 'error',
          title: 'Sauvegarde échouée',
          message: "La configuration n'a pas pu être enregistrée en base.",
          duration: 5000
        })
      }
    },
    [addNotification]
  )

  // Sauvegarde automatique (debounce 800 ms) à chaque modification de configuration
  useEffect(() => {
    const timer = setTimeout(() => {
      void persistOrdersConfig({ commissionRates, commissionFixed, commissionType, paymentFrequencies })
    }, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commissionRates, commissionFixed, commissionType, paymentFrequencies])


  const disputeTypes = [
    { value: 'delivery_issue', label: 'Problème de livraison' },
    { value: 'payment_issue', label: 'Problème de paiement' },
    { value: 'product_issue', label: 'Produit non conforme' },
    { value: 'customer_claim', label: 'Réclamation client' },
    { value: 'other', label: 'Autre litige' }
  ]

  // États pour les retours et réclamations
  const [returns, setReturns] = useState<Order[]>([])
  const [selectedReturn, setSelectedReturn] = useState<Order | null>(null)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  
  // États pour les demandes de paiement
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  
  const [freeShippingConfig, setFreeShippingConfig] = useState<FreeShippingConfig | null>(null)

  /**
   * Charge la configuration publique de livraison (incluant les règles de livraison gratuite).
   */
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const resp = await fetch('/api/public/delivery-config', { method: 'GET', cache: 'no-store' }).catch(() => null)
        if (!resp?.ok) return
        const json = await resp.json().catch(() => null)
        const cfg = (json as any)?.data?.freeShippingConfig ?? null
        if (!cancelled) {
          setFreeShippingConfig(cfg)
        }
      } catch {
        // ignore
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Détermine si une ligne produit est éligible au badge selon les règles Super Admin uniquement.
   */
  const isOrderProductFreeShippingEligible = useCallback(
    (p: Order['products'][number]): boolean => {
      const productId = String((p as any)?.productId ?? '').trim()
      if (!productId) return false

      return isProductEligibleForFreeShippingLabel({
        productId,
        vendorId: typeof (p as any)?.vendorId === 'string' ? (p as any).vendorId : '',
        categoryIds: Array.isArray((p as any)?.categoryIds) ? (p as any).categoryIds : [],
        freeShippingConfig
      })
    },
    [freeShippingConfig]
  )

  /**
   * Détermine si une commande contient au moins un produit éligible.
   */
  const isOrderFreeShippingEligible = useCallback(
    (order: Order): boolean => {
      const products = Array.isArray(order?.products) ? order.products : []
      return products.some((p) => isOrderProductFreeShippingEligible(p))
    },
    [isOrderProductFreeShippingEligible]
  )
  
  // Vendeurs réels chargés depuis la base (table users, rôle vendeur)
  const [realSellers, setRealSellers] = useState<Array<{ id: string; name: string; email: string; phone: string }>>([])

  useEffect(() => {
    let cancelled = false
    const loadSellers = async () => {
      try {
        const sellers = await SuperAdminDashboardService.getUsers({ role: 'seller', limit: 500 })
        if (!cancelled) {
          setRealSellers(
            (Array.isArray(sellers) ? sellers : []).map((s: any) => ({
              id: String(s.id ?? ''),
              name: String(s.fullName ?? s.full_name ?? s.name ?? s.email ?? 'Vendeur'),
              email: String(s.email ?? ''),
              phone: String(s.phone ?? s.phoneNumber ?? '')
            })).filter((s) => s.id)
          )
        }
      } catch {
        // silencieux : la recherche vendeur reste utilisable avec la liste vide
      }
    }
    void loadSellers()
    return () => {
      cancelled = true
    }
  }, [])

  // Vendeurs filtrés pour la recherche
  const filteredSellers = realSellers.filter(seller =>
    seller.name.toLowerCase().includes(sellerSearchValue.toLowerCase()) ||
    seller.email.toLowerCase().includes(sellerSearchValue.toLowerCase())
  )
  
  // Fonction pour sélectionner un vendeur
  const handleSellerSelect = (seller: any) => {
    setPaymentData(prev => ({
      ...prev,
      sellerEmail: seller.email,
      sellerName: seller.name
    }))
    setSellerSearchOpen(false)
  }

  const [isLoading, setIsLoading] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const loadFinancePaymentRequests = useCallback(async () => {
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const resp = await fetch('/api/finance/payment-requests', {
        method: 'GET',
        headers: authHeaders,
        cache: 'no-store'
      }).catch(() => null)

      if (!resp?.ok) return
      const data = await resp.json().catch(() => [])
      const rows = Array.isArray(data) ? data : []

      setPaymentRequests(
        rows.map((r: any) => ({
          id: String(r.id),
          vendorId: String(r.vendorId ?? ''),
          vendorName: String(r.vendorName ?? ''),
          orderIds: Array.isArray(r.orderIds) ? r.orderIds.map((x: any) => String(x)) : [],
          totalAmount: Number(r.totalAmount ?? 0),
          commissionAmount: Number(r.commissionAmount ?? 0),
          netAmount: Number(r.netAmount ?? 0),
          status: (r.status ?? 'pending') as any,
          paymentMethod: String(r.paymentMethod ?? ''),
          bankDetails: r.bankDetails ? String(r.bankDetails) : undefined,
          mobileNumber: r.mobileNumber ? String(r.mobileNumber) : undefined,
          createdAt: String(r.createdAt ?? ''),
          processedAt: r.processedAt ? String(r.processedAt) : undefined,
          notes: r.notes ? String(r.notes) : undefined
        }))
      )
    } catch {
      // silencieux: ne pas bloquer l'affichage commandes si finance indisponible
    }
  }, [])

  /**
   * Charge la liste des commandes depuis l’API super admin et met à jour l’état local.
   */
  const loadOrders = useCallback(async (options?: { showSpinner?: boolean }) => {
    const showSpinner = options?.showSpinner ?? true
    if (showSpinner) {
      setIsLoading(true)
    }
    try {
      const apiOrders = await SuperAdminOrderService.list({ limit: 200 })
      const normalizedOrders = Array.isArray(apiOrders) ? apiOrders.map(mapApiOrderToOrder) : []

      setOrders(normalizedOrders)
      setReturns(normalizedOrders.filter((order) => order.status === 'returned'))
      setLoadingError(null)
    } catch (error) {
      console.error('❌ Impossible de charger les commandes super admin', error)
      setLoadingError(error instanceof Error ? error.message : 'Erreur de chargement des commandes.')
      addNotification({
        type: 'error',
        title: 'Chargement échoué',
        message: "Impossible de récupérer les commandes. Veuillez réessayer plus tard.",
        duration: 5000
      })
    } finally {
      if (showSpinner) {
        setIsLoading(false)
      }
    }
  }, [addNotification])

  useEffect(() => {
    const seeded = Boolean(prefetchedOrders && Array.isArray(prefetchedOrders))

    if (seeded && !hasSeededPrefetchRef.current) {
      hasSeededPrefetchRef.current = true
      const normalized = prefetchedOrders!.map(mapApiOrderToOrder)
      setOrders(normalized)
      setReturns(normalized.filter((order) => order.status === 'returned'))

      // Refresh silencieux en arrière-plan.
      setTimeout(() => {
        void loadOrders({ showSpinner: false })
      }, 0)
      return
    }

    if (!seeded && (!ordersRef.current || ordersRef.current.length === 0)) {
      void loadOrders({ showSpinner: true })
    }
  }, [prefetchedOrders, loadOrders])

  useEffect(() => {
    // Chargement non bloquant des demandes de paiement pour la carte KPI.
    void loadFinancePaymentRequests()
  }, [loadFinancePaymentRequests])

  const openDeleteConfirm = (order: Order) => {
    setOrderToDelete(order)
    setIsDeleteConfirmOpen(true)
  }

  const handleDeleteOrder = async () => {
    if (!orderToDelete?.id) return

    setIsActionLoading(true)
    try {
      await SuperAdminOrderService.delete(orderToDelete.id)
      setOrders((previous) => previous.filter((o) => o.id !== orderToDelete.id))
      setReturns((previous) => previous.filter((o) => o.id !== orderToDelete.id))
      addNotification({
        type: 'success',
        title: 'Commande supprimée',
        message: `Commande ${orderToDelete.orderNumber} supprimée.`,
        duration: 4000
      })
      setIsDeleteConfirmOpen(false)
      setOrderToDelete(null)
    } catch (error) {
      console.error('❌ Impossible de supprimer la commande', error)
      addNotification({
        type: 'error',
        title: 'Suppression échouée',
        message: "Impossible de supprimer la commande. Réessayez.",
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  /**
   * Redirige vers la section Livraisons et ouvre automatiquement le modal de planification.
   */
  const handleCreateDelivery = async (order: Order) => {
    if (!order?.id) return

    if (!order.customerId) {
      addNotification({
        type: 'error',
        title: 'Livraison impossible',
        message: 'Identifiant client manquant pour programmer la livraison.',
        duration: 5000
      })
      return
    }

    const params = new URLSearchParams({
      section: 'deliveries',
      createDelivery: '1',
      orderId: order.id,
      orderNumber: String(order.orderNumber ?? ''),
      customerId: order.customerId
    })

    router.push(`/super-admin-dashboard?${params.toString()}`)
  }

  const formatPrice = (price: number) => {
    return formatMoney(price)
  }

  /**
   * Met à jour le statut d’une commande côté API avec retour optimiste sur l’interface.
   */
  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const snapshot = orders.map((order) => ({ ...order }))

    setOrders((previous) =>
      previous.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date().toLocaleString() }
          : order
      )
    )

    try {
      await SuperAdminOrderService.update(orderId, { status: newStatus })
      addNotification({
        type: 'success',
        title: 'Statut modifié',
        message: `La commande a été mise à jour avec le statut « ${newStatus} ».`,
        duration: 4000
      })
    } catch (error) {
      console.error('❌ Impossible de mettre à jour le statut de la commande', error)
      setOrders(snapshot)
      addNotification({
        type: 'error',
        title: 'Mise à jour échouée',
        message: "La modification du statut n'a pas pu être appliquée. Veuillez réessayer.",
        duration: 5000
      })
    }
  }

  const handleClientValidation = async (orderId: string) => {
    const snapshot = orders.map((order) => ({ ...order }))

    // Mise à jour optimiste
    setOrders(orders.map(order =>
      order.id === orderId ? {
        ...order,
        clientValidation: true,
        clientValidationDate: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      } : order
    ))

    try {
      // Persistance en base via l'API super admin
      const updatedOrder = await SuperAdminOrderService.update(orderId, {
        clientValidation: true,
        clientValidationDate: new Date().toISOString()
      })

      setOrders((previous) => previous.map((entry) => (entry.id === orderId ? mapApiOrderToOrder(updatedOrder) : entry)))
      setReturns((previous) => previous.map((entry) => (entry.id === orderId ? mapApiOrderToOrder(updatedOrder) : entry)))

      addNotification({
        type: 'success',
        title: 'Validation Client',
        message: 'La livraison a été validée par le client avec succès.',
        duration: 4000
      })
    } catch (error) {
      console.error('❌ Impossible de valider la livraison côté client', error)
      setOrders(snapshot)
      addNotification({
        type: 'error',
        title: 'Validation échouée',
        message: "La validation client n'a pas pu être enregistrée. Veuillez réessayer.",
        duration: 5000
      })
    }
  }

  const handlePaymentRequestApproval = async (requestId: string, approved: boolean) => {
    setIsActionLoading(true)
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const resp = await fetch(`/api/finance/payment-requests/${requestId}/${approved ? 'approve' : 'reject'}`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: approved ? undefined : JSON.stringify({ reason: 'Décision manuelle du super admin' }),
        cache: 'no-store'
      })
      const payload = await resp.json().catch(() => null)
      if (!resp.ok) {
        throw new Error(payload?.error ?? 'Échec de la décision de paiement.')
      }

      setPaymentRequests(paymentRequests.map(request =>
        request.id === requestId ? {
          ...request,
          status: approved ? ('approved' as any) : ('rejected' as any),
          processedAt: new Date().toLocaleString()
        } : request
      ))
      // Resynchronisation avec la base (timeline, statuts réels)
      void loadFinancePaymentRequests()

      addNotification({
        type: approved ? 'success' : 'error',
        title: approved ? 'Demande Approuvée' : 'Demande Rejetée',
        message: approved ? 'La demande de paiement a été approuvée avec succès.' : 'La demande de paiement a été rejetée.',
        duration: 5000
      })
    } catch (error) {
      console.error('❌ Impossible de traiter la demande de paiement', error)
      addNotification({
        type: 'error',
        title: 'Opération échouée',
        message: error instanceof Error ? error.message : 'La décision de paiement n’a pas pu être enregistrée.',
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePaymentRequestRejection = async (requestId: string, reason: string) => {
    setIsActionLoading(true)
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const resp = await fetch(`/api/finance/payment-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
        cache: 'no-store'
      })
      const payload = await resp.json().catch(() => null)
      if (!resp.ok) {
        throw new Error(payload?.error ?? 'Échec du rejet de la demande.')
      }

      setPaymentRequests(paymentRequests.map(request =>
        request.id === requestId ? {
          ...request,
          status: 'rejected' as any,
          processedAt: new Date().toLocaleString(),
          notes: reason
        } : request
      ))
      void loadFinancePaymentRequests()

      addNotification({
        type: 'warning',
        title: 'Demande Rejetée',
        message: `La demande de paiement a été rejetée. Motif: ${reason}`,
        duration: 5000
      })
    } catch (error) {
      console.error('❌ Impossible de rejeter la demande de paiement', error)
      addNotification({
        type: 'error',
        title: 'Rejet échoué',
        message: error instanceof Error ? error.message : 'Le rejet n’a pas pu être enregistré.',
        duration: 5000
      })
    } finally {
      setIsRejectionModalOpen(false)
      setRejectionReason('')
      setIsActionLoading(false)
    }
  }

  const handlePaymentRequestDeletion = async (requestId: string) => {
    setIsActionLoading(true)
    try {
      const authHeaders = await ClientAuthService.buildAuthHeaders()
      const resp = await fetch(`/api/finance/payment-requests/${requestId}`, {
        method: 'DELETE',
        headers: authHeaders,
        cache: 'no-store'
      })
      const payload = await resp.json().catch(() => null)
      if (!resp.ok) {
        throw new Error(payload?.error ?? 'Échec de la suppression de la demande.')
      }

      setPaymentRequests(paymentRequests.filter(request => request.id !== requestId))
      void loadFinancePaymentRequests()

      addNotification({
        type: 'info',
        title: 'Demande Supprimée',
        message: 'La demande de paiement a été supprimée avec succès.',
        duration: 5000
      })
    } catch (error) {
      console.error('❌ Impossible de supprimer la demande de paiement', error)
      addNotification({
        type: 'error',
        title: 'Suppression échouée',
        message: error instanceof Error ? error.message : 'La suppression n’a pas pu être enregistrée.',
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePaymentRequestEdit = (requestId: string) => {
    // Logique pour éditer la demande de paiement
    addNotification({
      type: 'info',
      title: 'Édition de Demande',
      message: 'La demande de paiement est en cours d\'édition.',
      duration: 5000
    })
  }

  // Gestion des retours et réclamations
  const handleReturnApproval = async (orderId: string, approved: boolean, reason?: string) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return

    const orderItems = (order as any)?.items as any[] | undefined

    if (!orderItems || orderItems.length === 0) {
      addNotification({
        type: 'error',
        title: 'Retour impossible',
        message: "Impossible d'initier un retour sans lignes de commande.",
        duration: 5000
      })
      return
    }

    const snapshot = orders.map((item) => ({ ...item }))
    setIsActionLoading(true)

    try {
      const returnPayload = {
        reason: reason ?? order.returnReason ?? (approved ? 'Retour approuvé' : 'Retour rejeté'),
        status: approved ? 'approved' : 'rejected',
        items: orderItems.map((item: any) => ({
          orderItemId: item.id,
          quantity: item.quantity,
          refundAmount: item.total_price,
          metadata: {}
        }))
      }

      const updatedOrder = await SuperAdminOrderService.createReturn(orderId, returnPayload)

      setOrders((previous) => previous.map((entry) => (entry.id === orderId ? mapApiOrderToOrder(updatedOrder) : entry)))
      setReturns((previous) => previous.map((entry) => (entry.id === orderId ? mapApiOrderToOrder(updatedOrder) : entry)))

      addNotification({
        type: approved ? 'success' : 'warning',
        title: approved ? 'Retour approuvé' : 'Retour rejeté',
        message: approved ? 'Le retour a été approuvé via l’API.' : 'Le retour a été rejeté via l’API.',
        duration: 4000
      })
    } catch (error) {
      console.error('❌ Impossible de traiter le retour', error)
      setOrders(snapshot)
      addNotification({
        type: 'error',
        title: 'Retour échoué',
        message: "Le retour n'a pas pu être mis à jour. Veuillez réessayer.",
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const openDisputeModal = (order: Order) => {
    setSelectedOrder(order)
    setDisputeData({
      type: 'delivery_issue',
      subject: `Litige sur ${order.orderNumber}`,
      description: '',
      priority: 'normal',
      assignedTo: '',
      resolution: '',
      notes: ''
    })
    setIsDisputeModalOpen(true)
  }

  const submitDispute = async () => {
    if (!selectedOrder) return

    if (!disputeData.subject || disputeData.subject.trim().length < 3) {
      addNotification({
        type: 'warning',
        title: 'Sujet requis',
        message: 'Merci de renseigner un sujet pour le litige.',
        duration: 4000
      })
      return
    }

    setIsActionLoading(true)

    try {
      const payload = {
        type: disputeData.type,
        subject: disputeData.subject,
        description: disputeData.description,
        priority: disputeData.priority,
        assignedTo: disputeData.assignedTo || null,
        resolution: disputeData.resolution || null,
        metadata: disputeData.notes ? { notes: disputeData.notes } : {}
      }

      const updatedOrder = await SuperAdminOrderService.createDispute(selectedOrder.id, payload)
      setOrders((previous) => previous.map((entry) => (entry.id === selectedOrder.id ? mapApiOrderToOrder(updatedOrder) : entry)))

      addNotification({
        type: 'success',
        title: 'Litige enregistré',
        message: 'Le litige a été ouvert avec succès.',
        duration: 5000
      })

      setIsDisputeModalOpen(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error('❌ Impossible de créer le litige', error)
      addNotification({
        type: 'error',
        title: 'Litige échoué',
        message: "Le litige n'a pas pu être enregistré. Veuillez réessayer.",
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReturnProcessing = async (orderId: string) => {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return

    const orderItems = (order as any)?.items as any[] | undefined

    const snapshot = orders.map((item) => ({ ...item }))
    setIsActionLoading(true)

    try {
      const updatedOrder = await SuperAdminOrderService.createReturn(orderId, {
        status: 'completed',
        reason: order.returnReason ?? 'Retour traité',
        resolution: 'completed',
        items: (orderItems ?? []).map((item: any) => ({
          orderItemId: item.id,
          quantity: item.quantity,
          refundAmount: item.total_price,
          metadata: {}
        }))
      })

      setOrders((previous) => previous.map((entry) => (entry.id === orderId ? mapApiOrderToOrder(updatedOrder) : entry)))
      setReturns((previous) => previous.map((entry) => (entry.id === orderId ? mapApiOrderToOrder(updatedOrder) : entry)))

      addNotification({
        type: 'success',
        title: 'Retour traité',
        message: 'Le retour a été marqué comme traité via l’API.',
        duration: 4000
      })
    } catch (error) {
      console.error('❌ Impossible de finaliser le retour', error)
      setOrders(snapshot)
      addNotification({
        type: 'error',
        title: 'Traitement échoué',
        message: "Le retour n'a pas pu être finalisé. Veuillez réessayer.",
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Calcul automatique des commissions
  const calculateCommission = (order: Order) => {
    if (commissionType === 'fixed') {
      return commissionFixed.amount
    }
    
    if (commissionType === 'hybrid') {
      const fixedAmount = commissionFixed.amount
      const percentageAmount = Math.round(order.totalAmount * (commissionRates.default / 100))
      return Math.max(fixedAmount, percentageAmount)
    }
    
    // Commission par pourcentage avec catégories
    let categoryRate = commissionRates.default
    
    const productName = order.products[0]?.name.toLowerCase()
    if (productName.includes('phone') || productName.includes('laptop') || productName.includes('macbook')) {
      categoryRate = commissionRates.electronics
    } else if (productName.includes('shirt') || productName.includes('dress') || productName.includes('pants')) {
      categoryRate = commissionRates.clothing
    } else if (productName.includes('food') || productName.includes('drink') || productName.includes('snack')) {
      categoryRate = commissionRates.food
    } else if (productName.includes('makeup') || productName.includes('perfume') || productName.includes('cream')) {
      categoryRate = commissionRates.beauty
    } else if (productName.includes('ball') || productName.includes('shoes') || productName.includes('equipment')) {
      categoryRate = commissionRates.sports
    } else if (productName.includes('book') || productName.includes('magazine')) {
      categoryRate = commissionRates.books
    } else if (productName.includes('furniture') || productName.includes('decoration')) {
      categoryRate = commissionRates.home
    }
    
    return Math.round(order.totalAmount * (categoryRate / 100))
  }

  // Ouvrir le modal de demande de paiement
  const openPaymentRequestModal = (order: Order) => {
    setSelectedOrderForPayment(order)
    setShowPaymentModal(true)
    
    // Initialiser les données de paiement
    setPaymentData({
      orderId: order.id,
      amount: order.totalAmount - order.commission,
      paymentMethod: '',
      accountNumber: '',
      accountName: '',
      bankName: '',
      phoneNumber: '',
      notes: '',
      sellerEmail: order.vendor.name, // Utiliser le nom du vendeur de la commande
      sellerName: order.vendor.name
    })
    
    // Démarrer les animations
    setAnimateModal(true)
    setTimeout(() => setAnimateContent(true), 100)
  }

  // Créer une nouvelle demande de paiement
  const createPaymentRequest = async (vendorId: string, orderIds: string[]) => {
    const vendorOrders = orders.filter(order => 
      order.vendor.id === vendorId && 
      orderIds.includes(order.id) && 
      order.clientValidation && 
      order.paymentStatus === 'paid'
    )
    
    if (vendorOrders.length === 0) {
      addNotification({
        type: 'warning',
        title: 'Aucune commande éligible',
        message: 'Sélectionnez des commandes payées et validées par le client pour générer un paiement.',
        duration: 4000
      })
      return
    }

    const snapshot = orders.map((item) => ({ ...item }))
    setIsActionLoading(true)

    try {
      const paymentPayload = {
        provider: paymentData.paymentMethod || 'bank_transfer',
        reference: paymentData.accountNumber ?? null,
        amount: paymentData.amount,
        metadata: {
          accountName: paymentData.accountName,
          bankName: paymentData.bankName,
          phoneNumber: paymentData.phoneNumber,
          notes: paymentData.notes
        }
      }

      const updatedOrder = await SuperAdminOrderService.createPayment(vendorOrders[0].id, paymentPayload)

      setOrders((previous) => previous.map((entry) => (entry.id === updatedOrder.id ? mapApiOrderToOrder(updatedOrder) : entry)))

      addNotification({
        type: 'success',
        title: 'Paiement enregistré',
        message: 'Le paiement a été enregistré avec succès via l’API.',
        duration: 5000
      })

      setShowPaymentModal(false)
      setSelectedOrderForPayment(null)
    } catch (error) {
      console.error('❌ Impossible de créer le paiement', error)
      setOrders(snapshot)
      addNotification({
        type: 'error',
        title: 'Paiement échoué',
        message: "L'enregistrement du paiement a échoué. Veuillez réessayer.",
        duration: 5000
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmée' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En traitement' },
      shipped: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Expédiée' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Livrée' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulée' },
      returned: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Retournée' },
      delayed: { bg: 'bg-red-100', text: 'text-red-800', label: 'En retard' }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.pending
    return <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>{statusConfig.label}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const config = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Commande en attente' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Commande payée' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Paiement échoué' },
      refunded: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Paiement remboursé' }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.pending
    return <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>{statusConfig.label}</Badge>
  }

  // Filtrage des commandes
  const filteredOrders = orders.filter(order => {
    if (searchTerm && !order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) return false
    if (vendorFilter !== 'all' && order.vendor.name !== vendorFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Commandes</p>
                <p className="text-2xl font-bold text-blue-900">{orders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatPrice(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Commissions</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatPrice(orders.reduce((sum, order) => sum + order.commission, 0))}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Demandes Paiement</p>
                <p className="text-2xl font-bold text-purple-900">
                  {paymentRequests.filter(pr => pr.status === 'pending').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Commandes & Ventes</TabsTrigger>
          <TabsTrigger value="returns">Retours & Réclamations</TabsTrigger>
        </TabsList>

        {/* Onglet Commandes & Ventes */}
        <TabsContent value="orders" className="mt-6">
          <div className="space-y-4">
            {/* Filtres avancés */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Rechercher par numéro de commande, client ou vendeur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="processing">En traitement</SelectItem>
                      <SelectItem value="shipped">Expédiée</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                      <SelectItem value="returned">Retournée</SelectItem>
                      <SelectItem value="delayed">En retard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les paiements</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="failed">Échoué</SelectItem>
                      <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={vendorFilter} onValueChange={setVendorFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Vendeur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les vendeurs</SelectItem>
                      <SelectItem value="TechStore Pro">TechStore Pro</SelectItem>
                      <SelectItem value="Electronics Plus">Electronics Plus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste des commandes */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">Commande #{order.orderNumber}</h3>
                            {getStatusBadge(order.status)}
                            {getPaymentStatusBadge(order.paymentStatus)}
                            {isOrderFreeShippingEligible(order) && (
                              <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                Livraison gratuite
                              </Badge>
                            )}
                            {order.clientValidation && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Validée Client
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-700 mb-1">
                            <span className="font-medium">
                              {order.products?.[0]?.name ?? 'Produit'}
                            </span>
                            {order.products.length > 1 && (
                              <span className="text-gray-500">{' '}+{order.products.length - 1} autres</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{order.customer.name}</span> • 
                            <span>{order.vendor.name}</span> • 
                            <span>{order.products.length} produit(s)</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{formatPrice(order.totalAmount)}</span> • 
                            <span>Commission: {formatPrice(order.commission)}</span> • 
                            <span>Créée le {order.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {(() => {
                          const state = resolveDeliveryUiState(order)

                          if (state === 'delivered') {
                            return (
                              <Badge className="bg-green-100 text-green-800">
                                <Truck className="h-3 w-3 mr-1" />
                                Livré
                              </Badge>
                            )
                          }

                          if (state === 'scheduled') {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="h-8 px-2 text-xs opacity-60"
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                <span className="hidden lg:inline">Livraison programmée</span>
                                <span className="lg:hidden">Programmée</span>
                              </Button>
                            )
                          }

                          if (state === 'needs_delivery') {
                            return (
                              <Button
                                size="sm"
                                onClick={() => handleCreateDelivery(order)}
                                disabled={isActionLoading}
                                className="h-8 px-2 text-xs bg-orange-600 hover:bg-orange-700 animate-pulse"
                                title="Cette commande nécessite la création d'une livraison"
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                <span className="hidden lg:inline">Créer livraison</span>
                                <span className="lg:hidden">Livraison</span>
                              </Button>
                            )
                          }

                          return null
                        })()}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                          setSelectedOrder(order)
                          setIsViewModalOpen(true)
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        {String(order.paymentMethod ?? '').toLowerCase() === 'cash' && String(order.paymentStatus ?? '').toLowerCase() === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleConfirmCashPayment(order)}
                            disabled={isActionLoading}
                            className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                            title="Confirmer que le paiement en espèces a été effectué"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="hidden lg:inline">Paiement effectué</span>
                            <span className="lg:hidden">Payé</span>
                          </Button>
                        )}

                        <Select onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}>
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmée</SelectItem>
                            <SelectItem value="processing">En traitement</SelectItem>
                            <SelectItem value="shipped">Expédiée</SelectItem>
                            <SelectItem value="delivered">Livrée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                            <SelectItem value="returned">Retournée</SelectItem>
                            <SelectItem value="delayed">En retard</SelectItem>
                          </SelectContent>
                        </Select>
                        {order.status === 'delivered' && !order.clientValidation && (
                          <Button 
                            size="sm" 
                            onClick={() => handleClientValidation(order.id)}
                            className="h-8 px-2 text-xs bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="hidden lg:inline">Valider Client</span>
                            <span className="lg:hidden">Valider</span>
                          </Button>
                        )}
                        {order.status === 'delivered' && order.clientValidation && order.paymentStatus === 'paid' && (
                          <Button 
                            size="sm" 
                            onClick={() => openPaymentRequestModal(order)}
                            className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            <span className="hidden lg:inline">Demande Paiement</span>
                            <span className="lg:hidden">Paiement</span>
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDisputeModal(order)}
                          className="h-8 px-2 text-xs flex items-center gap-1"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span className="hidden lg:inline">Litige</span>
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteConfirm(order)}
                          disabled={isActionLoading}
                          className="h-8 px-2 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden lg:inline">Supprimer</span>
                        </Button>
                      </div>
                    </div>

                    {order.notes && String(order.notes).trim().length > 0 && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        <strong>Mentions spéciales:</strong> {order.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Onglet Retours & Réclamations */}
        <TabsContent value="returns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Retours et Réclamations</CardTitle>
              <CardDescription>
                Suivi des produits retournés et traitement des réclamations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.filter(order => order.status === 'returned' || order.returnStatus).map((order) => (
                  <Card key={order.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            <Badge variant="outline" className="text-orange-600">
                              {order.returnStatus === 'pending' ? 'En attente' : 
                               order.returnStatus === 'approved' ? 'Approuvé' : 
                               order.returnStatus === 'rejected' ? 'Rejeté' : 'Traité'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Client:</strong> {order.customer.name}</div>
                            <div><strong>Produit:</strong> {order.products[0]?.name}</div>
                            <div><strong>Raison:</strong> {order.returnReason || 'Non spécifiée'}</div>
                            <div><strong>Date:</strong> {order.updatedAt}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.returnStatus === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleReturnApproval(order.id, true)}
                                className="bg-green-600 hover:bg-green-700"
                                disabled={isActionLoading}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReturnApproval(order.id, false)}
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </>
                          )}
                          {order.returnStatus === 'approved' && (
                            <Button 
                              size="sm" 
                              onClick={() => handleReturnProcessing(order.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={isActionLoading}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Traiter
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {orders.filter(order => order.status === 'returned' || order.returnStatus).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun retour enregistré
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de visualisation de commande */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 bg-gradient-to-r from-orange-600 to-amber-500 text-white">
            <DialogTitle className="text-xl font-bold">Détails de la Commande</DialogTitle>
            <DialogDescription className="text-white/90">
              Consultez les informations clés, le client et les montants.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 px-6 py-6 bg-gradient-to-br from-white to-orange-50/40">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-orange-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-900">Informations de la commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Numéro</span>
                      <span className="font-semibold text-gray-900">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Montant</span>
                      <span className="font-semibold text-gray-900">{formatPrice(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Commission</span>
                      <span className="font-semibold text-gray-900">{formatPrice(selectedOrder.commission)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Statut</span>
                      <span>{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Paiement</span>
                      <span className="font-medium text-gray-900">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Statut paiement</span>
                      <span>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-gray-900">Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Nom</span>
                      <span className="font-semibold text-gray-900">{selectedOrder.customer.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium text-gray-900">{selectedOrder.customer.email}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-gray-600">Téléphone</span>
                      <span className="font-medium text-gray-900">{selectedOrder.customer.phone}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-gray-600 pt-0.5">Adresse</span>
                      <span className="font-medium text-gray-900 text-right break-words max-w-[22rem]">
                        {selectedOrder.customer.address}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-emerald-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-gray-900">Produits</CardTitle>
                  <CardDescription>
                    {(selectedOrder.products ?? []).length} article(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(selectedOrder.products ?? []).length === 0 ? (
                      <div className="text-sm text-gray-600">Aucun produit.</div>
                    ) : (
                      (selectedOrder.products ?? []).map((p, idx) => (
                        <div key={`${p.id}-${idx}`} className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-white">
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{p.name}</div>
                            {(String((p as any)?.warranty ?? '').trim() || String((p as any)?.returnPolicy ?? '').trim()) && (
                              <div className="mt-1 text-xs text-slate-600">
                                {String((p as any)?.warranty ?? '').trim() && (
                                  <span>
                                    <span className="font-medium">Garantie:</span> {String((p as any)?.warranty ?? '').trim()}
                                  </span>
                                )}
                                {String((p as any)?.warranty ?? '').trim() && String((p as any)?.returnPolicy ?? '').trim() ? (
                                  <span className="mx-2">•</span>
                                ) : null}
                                {String((p as any)?.returnPolicy ?? '').trim() && (
                                  <span>
                                    <span className="font-medium">Retours:</span> {String((p as any)?.returnPolicy ?? '').trim()}
                                  </span>
                                )}
                              </div>
                            )}
                            {isOrderProductFreeShippingEligible(p) && (
                              <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                Livraison gratuite
                              </div>
                            )}
                            <div className="text-xs text-slate-500">Qté: {p.quantity} · PU: {formatPrice(Number(p.price ?? 0))}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">{formatPrice(Number(p.total ?? (Number(p.price ?? 0) * Number(p.quantity ?? 0))))}</div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-4 border-t border-orange-100">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Fermer
                </Button>
                {selectedOrder.status === 'delivered' && !selectedOrder.clientValidation && (
                  <Button 
                    onClick={() => {
                      handleClientValidation(selectedOrder.id)
                      setIsViewModalOpen(false)
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider Livraison Client
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer la commande ?</DialogTitle>
            <DialogDescription>
              Cette action est définitive. La commande et ses éléments associés seront supprimés.
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-gray-700">
            <div><strong>Commande:</strong> {orderToDelete?.orderNumber ?? '—'}</div>
            <div><strong>Client:</strong> {orderToDelete?.customer?.name ?? '—'}</div>
            <div><strong>Vendeur:</strong> {orderToDelete?.vendor?.name ?? '—'}</div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isActionLoading}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={isActionLoading}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Litige */}
      <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ouvrir un litige</DialogTitle>
            <DialogDescription>
              Déclarez un problème pour alerter les équipes support et juridiques.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type de litige</Label>
                <Select value={disputeData.type} onValueChange={(value) => setDisputeData((prev) => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {disputeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select value={disputeData.priority} onValueChange={(value) => setDisputeData((prev) => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Définir la priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Sujet</Label>
              <Input
                value={disputeData.subject}
                onChange={(event) => setDisputeData((prev) => ({ ...prev, subject: event.target.value }))}
                placeholder="Résumé du litige"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={disputeData.description}
                onChange={(event) => setDisputeData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Détails du problème rencontré"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Assigné à</Label>
                <Input
                  value={disputeData.assignedTo}
                  onChange={(event) => setDisputeData((prev) => ({ ...prev, assignedTo: event.target.value }))}
                  placeholder="ID ou nom du collaborateur"
                />
              </div>
              <div>
                <Label>Résolution proposée</Label>
                <Input
                  value={disputeData.resolution}
                  onChange={(event) => setDisputeData((prev) => ({ ...prev, resolution: event.target.value }))}
                  placeholder="Solution envisagée"
                />
              </div>
            </div>
            <div>
              <Label>Notes internes</Label>
              <Textarea
                value={disputeData.notes}
                onChange={(event) => setDisputeData((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Informations complémentaires pour le support"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisputeModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submitDispute} disabled={isActionLoading}>
              Soumettre le litige
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Demande de Paiement Vendeur - Harmonisé avec le tableau de bord vendeur */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className={`max-w-2xl transition-all ${animateModal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <DialogHeader className="space-y-4 pb-4 border-b border-[#ff6600] flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#ff6600]/20 rounded-full animate-pulse">
                <DollarSign className="w-6 h-6 text-[#ff6600]" />
              </div>
              <div>
                <DialogTitle className="text-xl text-[#ff6600] font-bold">Demande de Paiement Vendeur</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Remplissez les informations pour effectuer une demande de paiement
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className={`space-y-6 overflow-y-auto flex-1 pr-2 ${animateContent ? 'opacity-100 transition-all duration-300' : 'opacity-0'}`}>
            {selectedOrderForPayment && (
              <div className={`p-4 bg-gradient-to-r from-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-lg border border-[#3b82f6] ${animateContent ? 'opacity-100 transition-all duration-300' : 'opacity-0'}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <Package className="w-5 h-5 text-[#3b82f6]" />
                  <h3 className="font-semibold text-[#3b82f6]">Informations de la Commande</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Commande :</span>
                      <span className="font-bold text-[#3b82f6]">{selectedOrderForPayment.orderNumber}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Montant à recevoir :</span>
                      <span className="text-lg font-bold text-[#10b981]">
                        {formatPrice(selectedOrderForPayment.totalAmount - selectedOrderForPayment.commission)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Client :</span>
                      <span className="font-semibold">{selectedOrderForPayment.customer.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Email client :</span>
                      <span className="text-sm text-gray-600">{selectedOrderForPayment.customer.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <UserCheck className="w-5 h-5 text-[#ff6600]" />
                <h3 className="font-semibold text-[#ff6600]">Informations du Vendeur</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellerSearch">Email/Nom du Vendeur *</Label>
                <Popover open={sellerSearchOpen} onOpenChange={setSellerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sellerSearchOpen}
                      className="w-full justify-between"
                    >
                      {paymentData.sellerEmail ? (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{paymentData.sellerEmail}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">{paymentData.sellerName}</span>
                        </div>
                      ) : (
                        "Rechercher un vendeur..."
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Tapez le nom ou l'email du vendeur..." 
                        value={sellerSearchValue}
                        onValueChange={setSellerSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>Aucun vendeur trouvé.</CommandEmpty>
                        <CommandGroup>
                          {filteredSellers.map((seller) => (
                            <CommandItem
                              key={seller.id}
                              value={`${seller.name} ${seller.email}`}
                              onSelect={() => handleSellerSelect(seller)}
                            >
                              <div className="flex items-center space-x-2 w-full">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {seller.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-medium">{seller.name}</div>
                                  <div className="text-sm text-gray-500">{seller.email}</div>
                                </div>
                                <Mail className="w-4 h-4 text-gray-400" />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Separator />
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="w-5 h-5 text-[#10b981]" />
                <h3 className="font-semibold text-[#10b981]">Mode de Paiement</h3>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Mode de paiement *</Label>
                <Select 
                  value={paymentData.paymentMethod} 
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un mode de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile Money (via FeexPay)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_card">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 w-4" />
                        <span>Carte Bancaire (via FeexPay)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 w-4" />
                        <span>Virement Bancaire</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentData.paymentMethod === 'mobile_money' && (
                <div className="opacity-100 transition-all duration-200">
                  <Label htmlFor="phoneNumber">Numéro de téléphone *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Ex: +225 0701234567"
                    value={paymentData.phoneNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
              )}
              {paymentData.paymentMethod === 'bank_transfer' && (
                <div className="space-y-3 opacity-100 transition-all duration-200">
                  <div>
                    <Label htmlFor="bankName">Nom de la banque *</Label>
                    <Input
                      id="bankName"
                      placeholder="Ex: BICICI, SGB, NSIA..."
                      value={paymentData.bankName}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, bankName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Numéro de compte *</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Numéro de compte bancaire"
                      value={paymentData.accountNumber}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informations supplémentaires pour l'administrateur..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end space-x-2 pt-4 border-t border-[#ff6600] flex-shrink-0 bg-white">
            <Button 
              variant="outline" 
              onClick={() => setIsPaymentModalOpen(false)}
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => createPaymentRequest(selectedOrderForPayment?.vendor.id ?? '', selectedOrderForPayment ? [selectedOrderForPayment.id] : [])}
              disabled={!selectedOrderForPayment || isActionLoading}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Créer la Demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
