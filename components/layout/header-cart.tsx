"use client"

import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Share2, 
  BarChart3, 
  Coins, 
  Clock, 
  Package, 
  Truck, 
  Shield, 
  Gift, 
  Star, 
  CreditCard, 
  Calculator, 
  Info, 
  Calendar, 
  MessageCircle, 
  FileText, 
  Download, 
  Copy, 
  Printer, 
  HelpCircle, 
  Save, 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  RotateCcw, 
  AlertTriangle, 
  List, 
  BookOpen, 
  Send, 
  Users, 
  Building, 
  Car, 
  Camera, 
  Music, 
  Gamepad2, 
  Palette, 
  Wrench, 
  Hammer, 
  Drill, 
  Ruler, 
  Microscope, 
  TestTube, 
  Atom, 
  Dna, 
  Leaf, 
  Flower, 
  Sun, 
  Moon, 
  Cloud, 
  Wind, 
  Rainbow, 
  Umbrella, 
  Snowflake, 
  Droplets, 
  Waves, 
  Fish, 
  Bird, 
  Cat, 
  Dog, 
  Rabbit, 
  Mouse, 
  Rat, 
  Turtle, 
  Shell, 
  Diamond, 
  Bone, 
  Eye, 
  Glasses, 
  Shirt, 
  Wallet, 
  Backpack, 
  Briefcase, 
  Bed, 
  Table, 
  Apple, 
  Play, 
  Smile, 
  Paperclip, 
  Heart,
  Sparkles,
  Zap,
  Crown,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2,
  User,
  Smartphone
} from "lucide-react"

import { FormEvent, useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import {
  computeDeliveryPriceFromRule,
  selectBestDeliveryRule,
  type DeliveryRule
} from "@/lib/utils/delivery-rule-matcher"

import { usePathname, useRouter } from "next/navigation"

import { supabase } from '@/lib/supabase'

import { trackAutomationEvent } from '@/lib/client-automation-events'

import { ClientPointsService } from '@/lib/services/client-points-service'
import { useClientPoints } from '@/lib/hooks/use-client-points'
import { useMoney } from "@/lib/hooks/use-money"

// Import des services corrigés
import { 
  CartService, 
  WishlistService, 
  PointsService, 
  DeliveryService, 
  AuthService, 
  SearchService,
  initializeServices 
} from "@/lib/services"

// Import du hook de notifications modernes
import { useNotifications } from "@/components/ui/modern-notification"

import { EditableMessagesBanner } from "@/components/messages/EditableMessagesBanner"

export default function HeaderCart() {
  const router = useRouter()
  const pathname = usePathname()
  const { formatMoney } = useMoney()
  // Hook de notifications modernes
  const { addNotification } = useNotifications()

  const { user, signIn, signUp } = useAuth()

  const cartRefreshTokenRef = useRef(0)

  const feexpayAutoVerifyTimeoutRef = useRef<number | null>(null)
  const feexpayAutoVerifyIntervalRef = useRef<number | null>(null)
  const feexpayAutoVerifyInFlightRef = useRef(false)

  const { balance, estimatedValue, purchaseValue, refresh: refreshClientPoints } = useClientPoints()

  /**
   * Affiche une notification de succès.
   */
  const showSuccess = (message: string) => {
    addNotification({ type: 'success', title: 'Succès', message })
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  /**
   * Normalise une règle de livraison gratuite issue de la DB (compat camelCase + snake_case).
   */
  const normalizeFreeShippingRule = (raw: any): FreeShippingRule => {
    return {
      id: String(raw?.id ?? ''),
      isActive: raw?.isActive ?? raw?.is_active ?? raw?.active,
      priority: typeof raw?.priority === 'number' ? raw.priority : Number(raw?.priority ?? 100) || 100,
      title: typeof raw?.title === 'string' ? raw.title : undefined,
      mode: 'standard',
      scope: raw?.scope === 'cart_total' || raw?.scope === 'eligible_items' ? raw.scope : 'eligible_items',
      minEligibleSubtotalXof:
        typeof raw?.minEligibleSubtotalXof === 'number'
          ? raw.minEligibleSubtotalXof
          : raw?.minEligibleSubtotalXof == null
            ? (typeof raw?.min_eligible_subtotal_xof === 'number'
                ? raw.min_eligible_subtotal_xof
                : raw?.min_eligible_subtotal_xof == null
                  ? null
                  : Number(raw?.min_eligible_subtotal_xof) || null)
            : Number(raw?.minEligibleSubtotalXof) || null,
      minEligibleQty:
        typeof raw?.minEligibleQty === 'number'
          ? raw.minEligibleQty
          : raw?.minEligibleQty == null
            ? (typeof raw?.min_eligible_qty === 'number'
                ? raw.min_eligible_qty
                : raw?.min_eligible_qty == null
                  ? null
                  : Number(raw?.min_eligible_qty) || null)
            : Number(raw?.minEligibleQty) || null,
      vendorIds: Array.isArray(raw?.vendorIds)
        ? raw.vendorIds.map((x: any) => String(x)).filter(Boolean)
        : Array.isArray(raw?.vendor_ids)
          ? raw.vendor_ids.map((x: any) => String(x)).filter(Boolean)
          : Array.isArray(raw?.vendors)
            ? raw.vendors.map((x: any) => String(x)).filter(Boolean)
            : [],
      productIds: Array.isArray(raw?.productIds)
        ? raw.productIds.map((x: any) => String(x)).filter(Boolean)
        : Array.isArray(raw?.product_ids)
          ? raw.product_ids.map((x: any) => String(x)).filter(Boolean)
          : Array.isArray(raw?.products)
            ? raw.products.map((x: any) => String(x)).filter(Boolean)
            : [],
      categoryIds: Array.isArray(raw?.categoryIds)
        ? raw.categoryIds.map((x: any) => String(x)).filter(Boolean)
        : Array.isArray(raw?.category_ids)
          ? raw.category_ids.map((x: any) => String(x)).filter(Boolean)
          : Array.isArray(raw?.categories)
            ? raw.categories.map((x: any) => String(x)).filter(Boolean)
            : [],
      zone:
        raw?.zone === 'local' || raw?.zone === 'regional' || raw?.zone === 'national' || raw?.zone === 'international' || raw?.zone === '*'
          ? raw.zone
          : '*',
      localDistrict: typeof raw?.localDistrict === 'string' ? raw.localDistrict : typeof raw?.local_district === 'string' ? raw.local_district : '*',
      department: typeof raw?.department === 'string' ? raw.department : '*',
      city: typeof raw?.city === 'string' ? raw.city : '*',
      arrondissement: typeof raw?.arrondissement === 'string' ? raw.arrondissement : '*',
      district: typeof raw?.district === 'string' ? raw.district : '*'
    } as FreeShippingRule
  }

  /**
   * Affiche une notification d'information.
   */
  const showInfo = (message: string) => {
    addNotification({ type: 'info', title: 'Info', message })
  }

  /**
   * Affiche une notification d'erreur.
   */
  const showError = (message: string) => {
    addNotification({ type: 'error', title: 'Erreur', message })
  }

  /**
   * Vérifie la session Supabase de manière fiable (fallback si les états UI ne sont pas encore synchronisés).
   */
  const requireSupabaseSession = async (message: string): Promise<boolean> => {
    try {
      if (isLoggedIn || Boolean(user)) return true

      const sessionRes = await supabase.auth.getSession().catch(() => null)
      const accessToken = sessionRes?.data?.session?.access_token
      if (accessToken) {
        setIsLoggedIn(true)
        return true
      }
    } catch {
      // best-effort
    }

    showError(message)
    openInlineAuthStep(message)
    return false
  }

  /**
   * Exige une session utilisateur avant les actions sensibles (commande).
   */
  const ensureAuthenticated = (message: string): boolean => {
    if (isLoggedIn || Boolean(user)) return true
    showError(message)

    openInlineAuthStep(message)
    return false
  }

  /**
   * Option A: interdit l'ouverture du panier si non connecté.
   */
  const ensureAuthenticatedForCartOpen = (message: string): boolean => {
    if (isLoggedIn || Boolean(user)) return true
    showError(message)

    openInlineAuthStep(message)
    return false
  }
  
  // États avec valeurs par défaut
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPoints, setUserPoints] = useState(0)
  const [pointsValue, setPointsValue] = useState(0)
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    if (!isClient) return
    setIsLoggedIn((prev) => (prev ? true : Boolean(user)))
  }, [isClient, user])
  
  // États pour le modal du panier
  const [showCartModal, setShowCartModal] = useState(false)
  const [cartItemsData, setCartItemsData] = useState<any[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("standard")
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)
  const [showDeferredModal, setShowDeferredModal] = useState(false)
  const [installmentPlan, setInstallmentPlan] = useState(3)
  const [deferredDays, setDeferredDays] = useState(30)
  const [installmentDetails, setInstallmentDetails] = useState<any>(null)
  const [deferredDetails, setDeferredDetails] = useState<any>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderStep, setOrderStep] = useState<number>(1)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [showMobileMoneyPaymentModal, setShowMobileMoneyPaymentModal] = useState(false)
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("mobile_money")
  const [paymentStep, setPaymentStep] = useState(1)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [isInitializingOnlinePayment, setIsInitializingOnlinePayment] = useState(false)
  const [isVerifyingOnlinePayment, setIsVerifyingOnlinePayment] = useState(false)
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState(user?.email || "")
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState("standard")
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("standard")
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<any>(null)
  const [promoError, setPromoError] = useState("")
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [deliveryStep, setDeliveryStep] = useState(1)
  const [deliveryCity, setDeliveryCity] = useState("")
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("")
  const [deliveryCountry, setDeliveryCountry] = useState("Côte d'Ivoire")
  const [deliveryPhone, setDeliveryPhone] = useState("")
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<'standard' | 'express' | 'none'>('standard')
  const [selectedDeliveryZone, setSelectedDeliveryZone] = useState<'local' | 'national' | 'regional' | 'international'>('local')
  const [isScheduledDelivery, setIsScheduledDelivery] = useState(false)
  const [deliveryInstructions, setDeliveryInstructions] = useState("")
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState("")
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState("")

  const lastTrackedDeliveryLocationRef = useRef<string | null>(null)

  const [mobileMoneyCountryCode, setMobileMoneyCountryCode] = useState('+229')
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('')
  const [mobileMoneyOwnerName, setMobileMoneyOwnerName] = useState('')
  const [mobileMoneyNetwork, setMobileMoneyNetwork] = useState<'mtn' | 'moov' | 'celtiis' | 'coris'>('mtn')

  const [onlinePaymentStatusMessage, setOnlinePaymentStatusMessage] = useState<string>('')

  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')

  const [cashReceiverIsMe, setCashReceiverIsMe] = useState(true)
  const [cashReceiverName, setCashReceiverName] = useState('')
  const [cashReceiverPhone, setCashReceiverPhone] = useState('')

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authPromptMessage, setAuthPromptMessage] = useState<string>('')
  const [authEmail, setAuthEmail] = useState<string>('')
  const [authPassword, setAuthPassword] = useState<string>('')
  const [authFirstName, setAuthFirstName] = useState<string>('')
  const [authLastName, setAuthLastName] = useState<string>('')
  const [authPhone, setAuthPhone] = useState<string>('')
  const [authConfirmPassword, setAuthConfirmPassword] = useState<string>('')
  const [authAcceptTerms, setAuthAcceptTerms] = useState<boolean>(true)
  const [authError, setAuthError] = useState<string>('')
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false)

  /**
   * Ouvre la modale de commande directement sur l'étape Connexion/Inscription.
   * Utilisé aussi par d'autres composants du header via un événement global.
   */
  const openInlineAuthStep = useCallback((message: string) => {
    setShowOrderModal(true)
    setOrderStep(0)
    setAuthPromptMessage(message)
  }, [])

  /**
   * Optimistic UI: à l'ouverture du modal, on lit immédiatement le panier depuis localStorage.
   * Objectif: délai d'affichage = 0 même si des refresh/fetch (offres, produits) prennent du temps.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!showCartModal) return

    try {
      const immediate = CartService.getCart()
      setCartItemsData(immediate)
      setCartItems(getCartQuantityCount(immediate))
    } catch {
      // ignore
    }
  }, [showCartModal])

  /**
   * Listener global: permet au header (wishlist/compare/livraison) de déclencher
   * l'étape Connexion/Inscription sans navigation.
   */
  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent
      const message = String((custom as any)?.detail?.message ?? '').trim()
      openInlineAuthStep(message || 'Connectez-vous pour continuer.')
    }

    if (typeof window === 'undefined') return
    window.addEventListener('probooster:openCheckoutAuth', handler)
    return () => window.removeEventListener('probooster:openCheckoutAuth', handler)
  }, [openInlineAuthStep])

  useEffect(() => {
    if (!showOrderModal) return
    if (orderStep !== 0) return
    setAuthEmail((prev) => (prev.trim() ? prev : String(customerEmail || user?.email || '').trim()))
  }, [customerEmail, orderStep, showOrderModal, user?.email])

  useEffect(() => {
    if (!showOrderModal) return
    setAuthError('')
  }, [authMode, showOrderModal, orderStep])

  useEffect(() => {
    if (!showOrderModal) return
    if (orderStep !== 0) return
    if (!user?.id) return
    setShowOrderModal(true)
    setOrderStep(1)
  }, [orderStep, showOrderModal, user?.id])

  const handleInlineLogin = useCallback(
    async (event?: FormEvent) => {
      if (event) event.preventDefault()
      try {
        setIsAuthLoading(true)
        setAuthError('')

        const email = String(authEmail || '').trim()
        const password = String(authPassword || '').trim()
        if (!email || !password) {
          setAuthError('Veuillez renseigner email et mot de passe.')
          return
        }

        const { error } = await signIn(email, password)
        if (error) {
          setAuthError(error.message || 'Identifiants invalides.')
          return
        }

        setCustomerEmail(email)
        showSuccess('Connexion réussie. Vous pouvez continuer votre commande.')
        setOrderStep(1)
      } catch {
        setAuthError('Impossible de se connecter. Réessayez.')
      } finally {
        setIsAuthLoading(false)
      }
    },
    [authEmail, authPassword, signIn]
  )

  const handleInlineRegister = useCallback(
    async (event?: FormEvent) => {
      if (event) event.preventDefault()
      try {
        setIsAuthLoading(true)
        setAuthError('')

        const email = String(authEmail || '').trim()
        const password = String(authPassword || '').trim()
        const confirmPassword = String(authConfirmPassword || '').trim()
        const firstName = String(authFirstName || '').trim()
        const lastName = String(authLastName || '').trim()
        const phone = String(authPhone || '').trim()

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
          setAuthError('Veuillez remplir tous les champs obligatoires.')
          return
        }
        if (password !== confirmPassword) {
          setAuthError('Les mots de passe ne correspondent pas.')
          return
        }
        if (!authAcceptTerms) {
          setAuthError("Veuillez accepter les conditions d'utilisation.")
          return
        }

        const profile = {
          first_name: firstName,
          last_name: lastName,
          phone
        }

        const { error } = await signUp(email, password, profile, 'client')
        if (error) {
          setAuthError(error.message || "Impossible de créer le compte.")
          return
        }

        setCustomerEmail(email)
        showSuccess('Compte créé. Vous pouvez continuer votre commande.')
        setOrderStep(1)
      } catch {
        setAuthError("Impossible de créer le compte. Réessayez.")
      } finally {
        setIsAuthLoading(false)
      }
    },
    [authAcceptTerms, authConfirmPassword, authEmail, authFirstName, authLastName, authPassword, authPhone, signUp]
  )

  // Pré-remplir la description avec les infos du panier
  const generatePaymentDescription = (): string => {
    if (!cartItemsData || cartItemsData.length === 0) return "Paiement Probooster"
    
    const items = cartItemsData.map(item => `${item.name} (${item.quantity}x)`).join(', ')
    const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    return `Commande Probooster: ${items} - Total: ${formatMoney(total)}`
  }

  const defaultPaymentDescription = useMemo(() => generatePaymentDescription(), [cartItemsData])

  const [paymentDescription, setPaymentDescription] = useState(defaultPaymentDescription)

  useEffect(() => {
    setPaymentDescription((prev) => {
      const prevTrim = String(prev ?? '').trim()
      if (!prevTrim) return defaultPaymentDescription

      const isAuto = prevTrim === 'Paiement Probooster' || prevTrim.startsWith('Commande Probooster:')
      return isAuto ? defaultPaymentDescription : prev
    })
  }, [defaultPaymentDescription])

  // Coordonnées GPS (uniquement requises pour produits physiques)
  const [shippingLat, setShippingLat] = useState<string>("")
  const [shippingLng, setShippingLng] = useState<string>("")
  const [isDetectingGps, setIsDetectingGps] = useState(false)
  const [requiresShippingCoords, setRequiresShippingCoords] = useState(false)

  const noDeliverySelected = selectedDeliveryOption === 'none'

  const isValidEmail = (value: string): boolean => {
    const v = String(value ?? '').trim()
    if (!v) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }

  const canProceedOrderStep1 = useMemo(() => {
    if (!noDeliverySelected && requiresShippingCoords) {
      const lat = Number(shippingLat)
      const lng = Number(shippingLng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
    }

    return true
  }, [customerEmail, customerPhone, deliveryAddress, noDeliverySelected, requiresShippingCoords, shippingLat, shippingLng])

  const canProceedOrderStep3 = useMemo(() => {
    const methodOk = selectedPaymentOption === 'mobile_money' || selectedPaymentOption === 'card' || selectedPaymentOption === 'cash'
    if (!methodOk) return false

    if (selectedPaymentOption === 'mobile_money') {
      const codeOk = String(mobileMoneyCountryCode ?? '').trim().length > 0
      const phoneOk = String(mobileMoneyPhone ?? '').trim().length > 0
      const networkOk = String(mobileMoneyNetwork ?? '').trim().length > 0
      return codeOk && phoneOk && networkOk
    }

    if (selectedPaymentOption === 'card') {
      const nOk = String(cardNumber ?? '').trim().length >= 12
      const expOk = String(cardExpiry ?? '').trim().length > 0
      const cvvOk = String(cardCvv ?? '').trim().length >= 3
      return nOk && expOk && cvvOk
    }

    if (selectedPaymentOption === 'cash') {
      if (cashReceiverIsMe) return true
      const nameOk = String(cashReceiverName ?? '').trim().length > 0
      const phoneOk = String(cashReceiverPhone ?? '').trim().length > 0
      return nameOk && phoneOk
    }

    return false
  }, [cardCvv, cardExpiry, cardNumber, cashReceiverIsMe, cashReceiverName, cashReceiverPhone, mobileMoneyCountryCode, mobileMoneyNetwork, mobileMoneyPhone, selectedPaymentOption])

  const [allowInstallmentPayment, setAllowInstallmentPayment] = useState(true)
  const [allowDeferredPayment, setAllowDeferredPayment] = useState(true)

  const [isCartFreeShipping, setIsCartFreeShipping] = useState(false)
  const [cartShippingBaseCost, setCartShippingBaseCost] = useState(0)
  const [allowedDeliveryMethods, setAllowedDeliveryMethods] = useState<string[]>(['standard', 'express'])

  const [activeFreeShippingRule, setActiveFreeShippingRule] = useState<any | null>(null)
  const [freeShippingRuleByProductId, setFreeShippingRuleByProductId] = useState<Record<string, any>>({})

  const PRODUCT_STATS_CACHE_KEY = 'probooster_product_stats_cache_v1'

  const [availablePromotions, setAvailablePromotions] = useState<any[]>([])
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false)

  const [shippingCostAggregation, setShippingCostAggregation] = useState<'max' | 'sum'>('max')
  const [shippingCostAggregationDefault, setShippingCostAggregationDefault] = useState<'max' | 'sum'>('max')
  const [allowCustomerShippingAggregationOverride, setAllowCustomerShippingAggregationOverride] = useState(false)
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRule[]>([])
  const [deliveryGeo, setDeliveryGeo] = useState<any>({})
  const [pickupConfig, setPickupConfig] = useState<any | null>(null)
  const [selectedPickupPointId, setSelectedPickupPointId] = useState('')

  type FreeShippingRuleScope = 'cart_total' | 'eligible_items'

  type FreeShippingRule = {
    id: string
    isActive: boolean
    priority: number
    title?: string
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

  /**
   * Retourne le libellé affiché au client pour expliquer la méthode de calcul des frais par commande.
   */
  const getShippingAggregationLabel = (aggregation: 'max' | 'sum') => {
    if (aggregation === 'sum') return 'Somme des frais (plusieurs colis)'
    return 'Frais non cumulés (un seul frais appliqué par commande)'
  }

  const effectiveShippingAggregation = allowCustomerShippingAggregationOverride ? shippingCostAggregation : shippingCostAggregationDefault

  const [geoLocalDistrict, setGeoLocalDistrict] = useState('')
  const [geoDepartment, setGeoDepartment] = useState('')
  const [geoCity, setGeoCity] = useState('')
  const [geoArrondissement, setGeoArrondissement] = useState('')
  const [geoDistrict, setGeoDistrict] = useState('')
  const [geoCountry, setGeoCountry] = useState('')
  const [geoRegionDepartment, setGeoRegionDepartment] = useState('')

  /**
   * Tracking best-effort des changements de localisation (zone/ville/district) côté checkout.
   */
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return

      const payload = {
        zone: selectedDeliveryZone,
        method: selectedDeliveryMethod,
        geoLocalDistrict: geoLocalDistrict || null,
        geoDepartment: geoDepartment || null,
        geoCity: geoCity || null,
        geoArrondissement: geoArrondissement || null,
        geoDistrict: geoDistrict || null,
        geoCountry: geoCountry || null,
        geoRegionDepartment: geoRegionDepartment || null,
        deliveryCity: deliveryCity || null
      }

      const key = JSON.stringify(payload)
      if (lastTrackedDeliveryLocationRef.current === key) return
      lastTrackedDeliveryLocationRef.current = key

      void trackAutomationEvent({
        eventType: 'delivery.location_updated',
        entityType: 'delivery',
        entityId: null,
        payload,
        sourceUi: 'header_cart_delivery',
        dedupeKey: `pb_auto_event:delivery.location_updated:${selectedDeliveryZone}:${geoDepartment}:${geoCity}:${geoDistrict}`,
        dedupeTtlMs: 30 * 1000
      })
    } catch {
      // best-effort
    }
  }, [
    selectedDeliveryZone,
    selectedDeliveryMethod,
    geoLocalDistrict,
    geoDepartment,
    geoCity,
    geoArrondissement,
    geoDistrict,
    geoCountry,
    geoRegionDepartment,
    deliveryCity
  ])
  const [perProductShipping, setPerProductShipping] = useState<
    Array<{
      productId: string
      name: string | null
      freeShipping: boolean
      productFreeShipping: boolean
      shippingCost: number
      shippingClass: string | null
      weightKg: number | null
      vendorId?: string | null
      categoryIds?: string[]
    }>
  >([])

  const [cartWeightKg, setCartWeightKg] = useState<number | null>(null)

  /**
   * Charge la configuration livraison (publique) définie par le super-admin.
   */
  useEffect(() => {
    let active = true

    const loadDeliveryConfig = async () => {
      try {
        const resp = await fetch('/api/public/delivery-config', { cache: 'no-store' }).catch(() => null)
        const json = resp && resp.ok ? await resp.json().catch(() => ({})) : {}
        const config = (json as any)?.data ?? null
        if (!active || !config) return

        const defaultAggregation = config?.shippingCostAggregationDefault === 'sum' ? 'sum' : 'max'
        const allowOverride = Boolean(config?.allowCustomerShippingAggregationOverride)
        const nextRules = Array.isArray(config?.deliveryRules) ? (config.deliveryRules as any[]) : []
        const nextGeo = config?.deliveryGeo && typeof config.deliveryGeo === 'object' ? config.deliveryGeo : {}
        const nextFreeShipping = config?.freeShippingConfig && typeof config.freeShippingConfig === 'object'
          ? (config.freeShippingConfig as any)
          : null
        const nextPickup = config?.pickupConfig && typeof config.pickupConfig === 'object' ? (config.pickupConfig as any) : null

        setShippingCostAggregationDefault(defaultAggregation)
        setAllowCustomerShippingAggregationOverride(allowOverride)
        setShippingCostAggregation((prev) => {
          if (allowOverride) return prev
          return defaultAggregation
        })
        setDeliveryRules(
          nextRules.map((r: any) => {
            return {
              ...r,
              country: typeof r?.country === 'string' ? r.country : '*',
              regionDepartment: typeof r?.regionDepartment === 'string' ? r.regionDepartment : '*',
              localDistrict: typeof r?.localDistrict === 'string' ? r.localDistrict : '*',
              department: typeof r?.department === 'string' ? r.department : '*',
              city: typeof r?.city === 'string' ? r.city : '*',
              arrondissement: typeof r?.arrondissement === 'string' ? r.arrondissement : '*',
              district: typeof r?.district === 'string' ? r.district : '*'
            }
          }) as DeliveryRule[]
        )
        setDeliveryGeo(nextGeo)
        setPickupConfig(nextPickup)

        setSelectedPickupPointId((prev) => {
          const points = Array.isArray(nextPickup?.points) ? nextPickup.points : []
          if (prev && points.some((p: any) => String(p?.id ?? '') === prev)) return prev
          const first = points[0]
          const firstId = first ? String((first as any)?.id ?? '').trim() : ''
          return firstId
        })

        setFreeShippingConfig(() => {
          const enabled = Boolean(nextFreeShipping?.enabled)
          const rawRules = Array.isArray(nextFreeShipping?.rules) ? nextFreeShipping.rules : []
          const rules: FreeShippingRule[] = rawRules.filter(Boolean).map((r: any) => {
            const rule = normalizeFreeShippingRule(r)
            return {
              ...rule,
              id: rule.id || `fs_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              isActive: rule.isActive !== false
            }
          })
          return { enabled, rules }
        })
      } catch {
        // ignore
      }
    }

    void loadDeliveryConfig()

    // Retard = 0 + mise à jour automatique quand le Super Admin change: refresh léger pendant le modal.
    const intervalId = typeof window !== 'undefined' && showCartModal
      ? window.setInterval(() => {
          void loadDeliveryConfig()
        }, 5000)
      : null

    return () => {
      active = false
      if (intervalId != null && typeof window !== 'undefined') {
        window.clearInterval(intervalId)
      }
    }
  }, [showCartModal])

  const pickupPoints = useMemo(() => {
    const rawPoints = Array.isArray((pickupConfig as any)?.points) ? (pickupConfig as any).points : []
    const enabledRaw = (pickupConfig as any)?.enabled === true
    const hasPoints = rawPoints.length > 0
    const enabled = enabledRaw || hasPoints

    return {
      enabled,
      points: rawPoints
        .filter(Boolean)
        .map((p: any) => {
          const id = String(p?.id ?? '').trim()
          const name = String(p?.name ?? '').trim()
          return {
            id,
            name,
            address: String(p?.address ?? '').trim(),
            city: String(p?.city ?? '').trim(),
            district: String(p?.district ?? '').trim(),
            priceXof: typeof p?.priceXof === 'number' ? p.priceXof : Number(p?.priceXof ?? 0) || 0
          }
        })
        .filter((p: any) => Boolean(p.id) && Boolean(p.name))
    }
  }, [pickupConfig])

  const selectedPickupPoint = useMemo(() => {
    const points = pickupPoints.points
    if (!selectedPickupPointId) return points[0] ?? null
    return points.find((p: any) => p.id === selectedPickupPointId) ?? (points[0] ?? null)
  }, [pickupPoints.points, selectedPickupPointId])

  useEffect(() => {
    if (selectedDeliveryOption !== 'pickup') return
    if (pickupPoints.points.length > 0) return
    setSelectedDeliveryOption(selectedDeliveryMethod === 'express' ? 'express' : 'standard')
  }, [pickupPoints.enabled, pickupPoints.points.length, selectedDeliveryMethod, selectedDeliveryOption])

  const pickupShippingCost = useMemo(() => {
    if (selectedDeliveryOption !== 'pickup') return 0
    const p = selectedPickupPoint
    const cost = p && typeof p.priceXof === 'number' ? p.priceXof : 0
    return Math.max(0, Math.ceil(Number(cost) || 0))
  }, [selectedDeliveryOption, selectedPickupPoint])

  const getBaseShippingPriceByMode = useCallback(
    (mode: 'standard' | 'express'): number | null => {
      const rules = Array.isArray(deliveryRules) ? deliveryRules : []
      const active = rules.filter((r: any) => r && r?.isActive !== false && r?.mode === mode)
      if (active.length === 0) return null
      const sorted = [...active].sort((a: any, b: any) => (Number(a?.price ?? 0) || 0) - (Number(b?.price ?? 0) || 0))
      const best = sorted[0]
      const price = typeof best?.price === 'number' ? best.price : Number(best?.price ?? 0) || 0
      return Number.isFinite(price) ? Math.max(0, Math.ceil(price)) : null
    },
    [deliveryRules]
  )

  const standardBasePrice = useMemo(() => getBaseShippingPriceByMode('standard'), [getBaseShippingPriceByMode])
  const expressBasePrice = useMemo(() => getBaseShippingPriceByMode('express'), [getBaseShippingPriceByMode])
  const pickupBasePrice = useMemo(() => {
    const points = pickupPoints.points
    if (points.length === 0) return null
    const min = Math.min(...points.map((p: any) => Number(p.priceXof ?? 0) || 0))
    return Number.isFinite(min) ? Math.max(0, Math.ceil(min)) : null
  }, [pickupPoints.points])

  const DELIVERY_STORAGE_KEY = 'probooster_delivery_checkout_v1'

  /**
   * Charge les préférences livraison depuis le localStorage (si disponibles).
   */
  useEffect(() => {
    if (!isClient) return

    try {
      const raw = localStorage.getItem(DELIVERY_STORAGE_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw) as any
      const zone = parsed?.zone
      const method = parsed?.method
      const aggregation = parsed?.aggregation

      // Infos adresse/phone (provenant du modal livraisons)
      const savedAddress = typeof parsed?.deliveryAddress === 'string' ? parsed.deliveryAddress : ''
      const savedCity = typeof parsed?.deliveryCity === 'string' ? parsed.deliveryCity : ''
      const savedPhone = typeof parsed?.deliveryPhone === 'string' ? parsed.deliveryPhone : ''
      const savedInstructions = typeof parsed?.deliveryInstructions === 'string' ? parsed.deliveryInstructions : ''
      const savedPreferredDate = typeof parsed?.preferredDeliveryDate === 'string' ? parsed.preferredDeliveryDate : ''
      const savedTimeSlot = typeof parsed?.deliveryTimeSlot === 'string' ? parsed.deliveryTimeSlot : ''

      if ((['local', 'national', 'regional', 'international'] as const).includes(zone)) {
        setSelectedDeliveryZone(zone)
      }

      if (method === 'express' || method === 'standard') {
        setSelectedDeliveryMethod(method as 'standard' | 'express')
        setSelectedDeliveryOption(method)
      }

      if (allowCustomerShippingAggregationOverride && (aggregation === 'sum' || aggregation === 'max')) {
        setShippingCostAggregation(aggregation)
      }

      // Préremplissage du modal commande depuis la config livraison sauvegardée.
      if (savedAddress) {
        setDeliveryAddress(savedAddress)
      }
      if (savedPhone) {
        setCustomerPhone((prev) => (prev ? prev : savedPhone))
        setDeliveryPhone(savedPhone)
      }
      if (savedCity) {
        setDeliveryCity(savedCity)
      }
      if (savedInstructions) {
        setDeliveryInstructions(savedInstructions)
      }
      if (savedPreferredDate) {
        setPreferredDeliveryDate(savedPreferredDate)
      }
      if (savedTimeSlot) {
        setDeliveryTimeSlot(savedTimeSlot)
      }

      setGeoLocalDistrict(typeof parsed?.geoLocalDistrict === 'string' ? parsed.geoLocalDistrict : '')
      setGeoDepartment(typeof parsed?.geoDepartment === 'string' ? parsed.geoDepartment : '')
      setGeoCity(typeof parsed?.geoCity === 'string' ? parsed.geoCity : '')
      setGeoArrondissement(typeof parsed?.geoArrondissement === 'string' ? parsed.geoArrondissement : '')
      setGeoDistrict(typeof parsed?.geoDistrict === 'string' ? parsed.geoDistrict : '')
      setGeoCountry(typeof parsed?.geoCountry === 'string' ? parsed.geoCountry : '')
      setGeoRegionDepartment(typeof parsed?.geoRegionDepartment === 'string' ? parsed.geoRegionDepartment : '')
    } catch {
      // ignore
    }
  }, [isClient, allowCustomerShippingAggregationOverride])

  /**
   * Si l'override client est interdit, on force l'agrégation au défaut super-admin.
   */
  useEffect(() => {
    if (allowCustomerShippingAggregationOverride) return
    setShippingCostAggregation(shippingCostAggregationDefault)
  }, [allowCustomerShippingAggregationOverride, shippingCostAggregationDefault])

  const getCartQuantityCount = (items: any[]) => {
    return (items ?? []).reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0)
  }

  // Initialisation des services et mise à jour des états
  useEffect(() => {
    setIsClient(true)

    let mounted = true

    const refresh = () => {
      // Affichage immédiat (optimistic UI) : on applique instantanément l'état localStorage.
      // La synchronisation des offres/prix est ensuite appliquée en arrière-plan.
      try {
        const immediate = CartService.getCart()
        setCartItemsData(immediate)
        setCartItems(getCartQuantityCount(immediate))
      } catch {
        // ignore
      }

      const tokenAtStart = cartRefreshTokenRef.current
      void CartService.syncDiscountedItemsWithOffers().then((synced) => {
        if (!mounted || !Array.isArray(synced)) return
        if (tokenAtStart !== cartRefreshTokenRef.current) return

        try {
          if (typeof window !== 'undefined' && window.localStorage?.getItem('probooster_debug_cart') === 'true') {
            console.log('[CartDebug] HeaderCart:refreshApply', {
              tokenAtStart,
              tokenNow: cartRefreshTokenRef.current,
              count: (synced ?? []).reduce((sum: number, it: any) => sum + (Number(it?.quantity ?? 0) || 0), 0),
              ids: (synced ?? []).map((x: any) => String(x?.id ?? '')).slice(0, 20)
            })
          }
        } catch {
          // ignore
        }
        setCartItemsData(synced)
        setCartItems(getCartQuantityCount(synced))
      })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    const onCartUpdated = (event: any) => {
      cartRefreshTokenRef.current += 1
      const nextCart = Array.isArray(event?.detail?.cart) ? event.detail.cart : null
      const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null

      try {
        if (typeof window !== 'undefined' && window.localStorage?.getItem('probooster_debug_cart') === 'true') {
          console.log('[CartDebug] HeaderCart:onCartUpdated', {
            token: cartRefreshTokenRef.current,
            hasDetailCart: Boolean(nextCart),
            detailCount: nextCount,
            ids: (nextCart ?? []).map((x: any) => String(x?.id ?? '')).slice(0, 20)
          })
        }
      } catch {
        // ignore
      }
      if (nextCart) {
        setCartItemsData(nextCart)
        setCartItems(nextCount ?? getCartQuantityCount(nextCart))
      } else {
        const cart = CartService.getCart()
        setCartItemsData(cart)
        setCartItems(getCartQuantityCount(cart))
      }
    }

    const onWishlistUpdated = (event: any) => {
      const nextWishlist = Array.isArray(event?.detail?.wishlist) ? event.detail.wishlist : null
      const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
      if (nextWishlist) {
        setWishlistItems(nextCount ?? nextWishlist.length)
        return
      }
      const wishlist = WishlistService.getWishlist()
      setWishlistItems(Array.isArray(wishlist) ? wishlist.length : 0)
    }

    /**
     * Ouvre le modal panier depuis n'importe où (ex: modal achat points) et permet
     * de pré-sélectionner une option de paiement.
     */
    const onOpenCartRequested = (event: any) => {
      if (!ensureAuthenticatedForCartOpen('Connectez-vous pour accéder au panier.')) {
        return
      }
      try {
        const paymentOption = String(event?.detail?.paymentOption ?? '').trim()
        if (paymentOption) {
          setSelectedPaymentOption(paymentOption)
        }
        setShowCartModal(true)
      } catch {
        setShowCartModal(true)
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('cartUpdated', onCartUpdated as any)
    window.addEventListener('wishlistUpdated', onWishlistUpdated as any)
    window.addEventListener('probooster:open-cart', onOpenCartRequested as any)

    const onStorage = (event: StorageEvent) => {
      try {
        if (!event) return
        if (event.key !== 'probooster_cart_version') return
        const cart = CartService.getCart()
        setCartItemsData(cart)
        setCartItems(getCartQuantityCount(cart))
      } catch {
        // ignore
      }
    }

    window.addEventListener('storage', onStorage as any)
    
    try {
      // Ajouter des données de test si le panier est vide (uniquement si explicitement activé)
      const currentCart = CartService.getCart()
      const enableTestData = localStorage.getItem('probooster_enable_test_data') === 'true'
      if (enableTestData && currentCart.length === 0) {
        const testProducts = [
          {
            id: 1,
            name: "Smartphone Dernière Génération",
            price: 299000,
            image: "/placeholder.svg",
            seller: "TechStore Pro",
            category: "electronics",
            rating: 4.8,
            quantity: 1
          }
        ]
        
        testProducts.forEach(product => {
          CartService.addToCart(product)
        })
        
        console.log('Données de test ajoutées au panier')
      }
      
      // Mettre à jour les états après l'initialisation des services
      setIsLoggedIn(AuthService.isLoggedIn())
      setCartItems(getCartQuantityCount(CartService.getCart()))
      setWishlistItems(WishlistService.getWishlist().length)
      
      // Charger les données des services
      setCartItemsData(CartService.getCart())

      refresh()
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services:', error)
    }

    return () => {
      mounted = false
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('cartUpdated', onCartUpdated as any)
      window.removeEventListener('wishlistUpdated', onWishlistUpdated as any)
      window.removeEventListener('probooster:open-cart', onOpenCartRequested as any)
      window.removeEventListener('storage', onStorage as any)
    }
  }, [])

  useEffect(() => {
    if (!isClient) return

    const nextPoints = Number(balance ?? 0)
    setUserPoints(Number.isFinite(nextPoints) && nextPoints >= 0 ? nextPoints : 0)

    const nextValue = Number(estimatedValue ?? 0)
    setPointsValue(Number.isFinite(nextValue) && nextValue >= 0 ? nextValue : 0)
  }, [balance, estimatedValue, isClient])

  /**
   * Applique immédiatement la config/solde points à l'ouverture du modal panier.
   * Objectif: retard = 0 et prise en compte des changements Super Admin sans refresh page.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!showCartModal) return

    // Refresh immédiat dès l'ouverture.
    try {
      void refreshClientPoints()
    } catch {
      // ignore
    }

    // Polling léger tant que le modal est ouvert (config Super Admin peut changer).
    const intervalId = window.setInterval(() => {
      try {
        void refreshClientPoints()
      } catch {
        // ignore
      }
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [refreshClientPoints, showCartModal])

  /**
   * Détermine si le panier contient au moins un produit physique.
   * Stratégie: on interroge l'API publique /api/public/products pour les IDs UUID.
   */
  useEffect(() => {
    let active = true

    /**
     * Met à jour les informations livraison/paiement en interrogeant les produits du panier.
     */
    const refreshRequiresCoords = async () => {
      try {
        const ids = Array.isArray(cartItemsData) ? cartItemsData.map((it) => String(it?.id ?? '')).filter(Boolean) : []
        const uuidIds = ids.filter((id) => UUID_REGEX.test(id))
        if (uuidIds.length === 0) {
          if (active) setRequiresShippingCoords(false)
          if (active) {
            setAllowInstallmentPayment(true)
            setAllowDeferredPayment(true)
            setIsCartFreeShipping(false)
            setCartShippingBaseCost(0)
            setAllowedDeliveryMethods(['standard', 'express'])
            setPerProductShipping([])
            setCartWeightKg(null)
          }
          return
        }

        const results = await Promise.all(
          uuidIds.map(async (id) => {
            const resp = await fetch(`/api/public/products?id=${encodeURIComponent(id)}`, { cache: 'no-store' }).catch(() => null)
            const json = resp && resp.ok ? await resp.json().catch(() => ({})) : {}
            return (json as any)?.data ?? null
          })
        )

        const cartItemsArray = Array.isArray(cartItemsData) ? cartItemsData : []
        const cartSubtotalXof = cartItemsArray.reduce((acc: number, item: any) => {
          const price = typeof item?.price === 'number' ? item.price : Number(item?.price ?? 0) || 0
          const qty = Number(item?.quantity ?? 0) || 0
          if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return acc
          return acc + price * qty
        }, 0)
        const cartQuantity = cartItemsArray.reduce((acc: number, item: any) => {
          const qty = Number(item?.quantity ?? 0) || 0
          if (!Number.isFinite(qty) || qty <= 0) return acc
          return acc + qty
        }, 0)

        const isStandardMode = selectedDeliveryMethod !== 'express'

        const requires =
          selectedDeliveryOption !== 'none' &&
          results.some((p) => p && !Boolean((p as any).is_virtual) && !Boolean((p as any).is_downloadable))

        const allowInstallment = results.some((p) => Boolean((p as any)?.payment_settings?.installment_payment))
        const allowDeferred = results.some((p) => Boolean((p as any)?.payment_settings?.deferred_payment))

        const perProduct = results
          .map((p, idx) => {
            const row = p as any
            const shipping = row?.shipping
            const productId = uuidIds[idx] ?? String(row?.id ?? '')
            const name = typeof row?.name === 'string' ? row.name : null
            const productFreeShipping = Boolean(shipping?.free_shipping)
            const rawCost = typeof shipping?.shipping_cost === 'number'
              ? shipping.shipping_cost
              : Number(shipping?.shipping_cost ?? 0) || 0
            const shippingClass = typeof shipping?.shipping_class === 'string' ? shipping.shipping_class : null

            const vendorId = typeof row?.vendor_id === 'string' ? row.vendor_id : null
            const categoryIds = Array.isArray(row?.category_ids)
              ? row.category_ids.map((x: any) => String(x)).filter(Boolean)
              : []

            const rawWeight = typeof shipping?.weight === 'number'
              ? shipping.weight
              : shipping?.weight == null
                ? null
                : Number(shipping?.weight ?? 0) || null
            const weightKg = typeof rawWeight === 'number' && Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : null

            return {
              productId,
              name,
              freeShipping: false,
              productFreeShipping,
              shippingCost: Number.isFinite(rawCost) ? rawCost : 0,
              shippingClass,
              weightKg,
              vendorId,
              categoryIds
            }
          })
          .filter((row) => Boolean(row.productId))

        const shippingRows = perProduct

        /**
         * Applique les règles de livraison gratuite super-admin sur les lignes produit (standard uniquement).
         */
        const applyFreeShippingRules = () => {
          if (!isStandardMode) {
            if (active) {
              setFreeShippingRuleByProductId({})
            }
            return new Set<string>()
          }
          if (!freeShippingConfig?.enabled) {
            if (active) {
              setFreeShippingRuleByProductId({})
            }
            return new Set<string>()
          }

          const rules = Array.isArray(freeShippingConfig?.rules) ? freeShippingConfig.rules : []
          if (rules.length === 0) {
            if (active) {
              setFreeShippingRuleByProductId({})
            }
            return new Set<string>()
          }

          const zoneMatches = (rule: FreeShippingRule): boolean => {
            if (!rule || rule.zone === '*') return true
            if (rule.zone !== selectedDeliveryZone) return false

            if (rule.zone === 'local') {
              if (rule.localDistrict && rule.localDistrict !== '*') {
                return String(geoLocalDistrict ?? '').trim().toLowerCase() === String(rule.localDistrict).trim().toLowerCase()
              }
              return true
            }

            if (rule.zone === 'national') {
              const deptOk = !rule.department || rule.department === '*' || String(geoDepartment ?? '').trim().toLowerCase() === String(rule.department).trim().toLowerCase()
              const cityOk = !rule.city || rule.city === '*' || String(geoCity ?? '').trim().toLowerCase() === String(rule.city).trim().toLowerCase()
              const arrOk = !rule.arrondissement || rule.arrondissement === '*' || String(geoArrondissement ?? '').trim().toLowerCase() === String(rule.arrondissement).trim().toLowerCase()
              const distOk = !rule.district || rule.district === '*' || String(geoDistrict ?? '').trim().toLowerCase() === String(rule.district).trim().toLowerCase()
              return deptOk && cityOk && arrOk && distOk
            }

            return true
          }

          const intersects = (a: string[], b: string[]): boolean => {
            if (a.length === 0 || b.length === 0) return false
            const setB = new Set(b)
            return a.some((x) => setB.has(x))
          }

          const allProductIds = shippingRows.map((r: any) => String(r.productId)).filter(Boolean)

          const sorted = rules
            .filter((r) => r && r.isActive !== false)
            .slice()
            .sort((a, b) => (Number(a.priority ?? 100) || 100) - (Number(b.priority ?? 100) || 100))

          // Mapping des règles potentielles (condition exacte) par produit, même si le seuil n'est pas atteint.
          const potentialMapping: Record<string, any> = {}

          for (const rule of sorted) {
            if (!zoneMatches(rule)) continue

            const hasProductFilter = Array.isArray(rule.productIds) && rule.productIds.length > 0
            const hasVendorFilter = Array.isArray(rule.vendorIds) && rule.vendorIds.length > 0
            const hasCategoryFilter = Array.isArray(rule.categoryIds) && rule.categoryIds.length > 0
            const hasAnyTarget = hasProductFilter || hasVendorFilter || hasCategoryFilter

            const eligibleRows = shippingRows.filter((row: any) => {
              if (hasProductFilter && !rule.productIds.includes(String(row.productId))) return false
              if (hasVendorFilter && !rule.vendorIds.includes(String(row.vendorId ?? ''))) return false
              if (hasCategoryFilter && !intersects(rule.categoryIds, Array.isArray(row.categoryIds) ? row.categoryIds : [])) return false
              return true
            })

            if (hasAnyTarget && eligibleRows.length === 0) continue

            const eligibleProductIds = (hasAnyTarget ? eligibleRows : shippingRows).map((r: any) => String(r.productId)).filter(Boolean)
            if (eligibleProductIds.length === 0) continue

            // 1) On garde la règle prioritaire qui cible chaque produit pour afficher la condition exacte.
            eligibleProductIds.forEach((pid) => {
              const key = String(pid)
              if (!potentialMapping[key]) {
                potentialMapping[key] = rule
              }
            })

            const eligibleIdSet = new Set(eligibleProductIds)

            const eligibleSubtotalXof = cartItemsArray.reduce((acc: number, item: any) => {
              const pid = String(item?.id ?? '')
              if (!eligibleIdSet.has(pid)) return acc
              const price = typeof item?.price === 'number' ? item.price : Number(item?.price ?? 0) || 0
              const qty = Number(item?.quantity ?? 0) || 0
              if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return acc
              return acc + price * qty
            }, 0)

            const eligibleQty = cartItemsArray.reduce((acc: number, item: any) => {
              const pid = String(item?.id ?? '')
              if (!eligibleIdSet.has(pid)) return acc
              const qty = Number(item?.quantity ?? 0) || 0
              if (!Number.isFinite(qty) || qty <= 0) return acc
              return acc + qty
            }, 0)

            const scopeSubtotal = rule.scope === 'cart_total' ? cartSubtotalXof : eligibleSubtotalXof
            const scopeQty = rule.scope === 'cart_total' ? cartQuantity : eligibleQty

            if (typeof rule.minEligibleSubtotalXof === 'number' && Number.isFinite(rule.minEligibleSubtotalXof)) {
              if (scopeSubtotal < rule.minEligibleSubtotalXof) continue
            }
            if (typeof rule.minEligibleQty === 'number' && Number.isFinite(rule.minEligibleQty)) {
              if (scopeQty < rule.minEligibleQty) continue
            }

            const shouldApplyToAll = rule.scope === 'cart_total' && !hasAnyTarget
            const nextIdsList = shouldApplyToAll ? allProductIds : eligibleProductIds
            const nextIds = new Set<string>(nextIdsList)
            if (active) {
              setActiveFreeShippingRule(rule)
              setFreeShippingRuleByProductId(potentialMapping)
            }
            return nextIds
          }

          if (active) {
            setActiveFreeShippingRule(null)
            setFreeShippingRuleByProductId(potentialMapping)
          }
          return new Set<string>()
        }

        const freeByConfigIds = applyFreeShippingRules()
        const shippingRowsWithFree = shippingRows.map((row: any) => {
          const isFree = isStandardMode && (freeByConfigIds.has(String(row.productId)) || Boolean(row.productFreeShipping))
          return {
            ...row,
            freeShipping: isFree
          }
        })

        const allFree = shippingRowsWithFree.length > 0 && shippingRowsWithFree.every((s: any) => Boolean(s?.freeShipping))
        const nonFreeCosts = shippingRowsWithFree
          .filter((s: any) => !Boolean(s?.freeShipping))
          .map((s: any) => (typeof s?.shippingCost === 'number' ? s.shippingCost : Number(s?.shippingCost ?? 0) || 0))
          .filter((v: any) => typeof v === 'number' && Number.isFinite(v) && v > 0)

        const maxCost = nonFreeCosts.length > 0 ? Math.max(...nonFreeCosts) : 0
        const sumCost = nonFreeCosts.reduce((acc: number, value: number) => acc + value, 0)
        const baseCost = shippingCostAggregation === 'sum' ? sumCost : maxCost

        const classes = shippingRowsWithFree
          .map((s: any) => (typeof s?.shippingClass === 'string' ? String(s.shippingClass).toLowerCase() : ''))
          .filter(Boolean)

        const rules = Array.isArray(deliveryRules) ? deliveryRules : []
        const hasExpressRule = rules.some((r: any) => r && r?.isActive !== false && r?.mode === 'express')

        const allowPickup = pickupPoints.points.length > 0

        const nextAllowedMethods = Array.from(
          new Set(['standard', ...(hasExpressRule ? ['express'] : []), ...(allowPickup ? ['pickup'] : [])])
        )

        if (active) {
          setRequiresShippingCoords(requires)
          setAllowInstallmentPayment(allowInstallment)
          setAllowDeferredPayment(allowDeferred)
          setIsCartFreeShipping(allFree)
          setCartShippingBaseCost(baseCost)
          setAllowedDeliveryMethods(nextAllowedMethods)
          setPerProductShipping(shippingRowsWithFree)

          try {
            const weightById = new Map<string, number | null>()
            shippingRowsWithFree.forEach((row: any) => {
              weightById.set(String(row.productId), row.weightKg ?? null)
            })
            const items = Array.isArray(cartItemsData) ? cartItemsData : []
            const totalWeight = items.reduce((acc: number, item: any) => {
              const pid = String(item?.id ?? '')
              const w = weightById.get(pid)
              const qty = Number(item?.quantity ?? 0) || 0
              if (typeof w !== 'number' || !Number.isFinite(w) || w <= 0) return acc
              if (!Number.isFinite(qty) || qty <= 0) return acc
              return acc + w * qty
            }, 0)

            setCartWeightKg(totalWeight > 0 ? totalWeight : null)
          } catch {
            setCartWeightKg(null)
          }

          if (!requires) {
            setShippingLat('')
            setShippingLng('')
          }

          if (!allowInstallment) {
            setShowInstallmentModal(false)
            setInstallmentDetails(null)
          }

          if (!allowDeferred) {
            setShowDeferredModal(false)
            setDeferredDetails(null)
          }
        }
      } catch (error) {
        console.warn('[HeaderCart] impossible de déterminer si coords requis:', error)
        if (active) {
          setRequiresShippingCoords(false)
          setAllowInstallmentPayment(true)
          setAllowDeferredPayment(true)
          setIsCartFreeShipping(false)
          setCartShippingBaseCost(0)
          setAllowedDeliveryMethods(['standard', 'scheduled', 'express', 'premium'])
          setPerProductShipping([])
          setCartWeightKg(null)
        }
      }
    }

    void refreshRequiresCoords()

    return () => {
      active = false
    }
  }, [cartItemsData, freeShippingConfig, geoArrondissement, geoCity, geoDepartment, geoDistrict, geoLocalDistrict, selectedDeliveryMethod, selectedDeliveryZone])

  useEffect(() => {
    const methods = Array.isArray(allowedDeliveryMethods) ? allowedDeliveryMethods : []
    if (methods.length === 0) return

    if (selectedDeliveryOption === 'none') {
      if (selectedDeliveryMethod !== 'none') {
        setSelectedDeliveryMethod('none')
      }
      return
    }

    if (!methods.includes(selectedDeliveryMethod)) {
      const fallback: 'standard' | 'express' = methods.includes('express') ? 'express' : 'standard'
      setSelectedDeliveryMethod(fallback)
      setSelectedDeliveryOption((prev) => (prev === 'pickup' ? prev : fallback))
    }
  }, [allowedDeliveryMethods, selectedDeliveryMethod, selectedDeliveryOption])

  /**
   * Recalcule le coût de base (par commande) quand la stratégie change.
   */
  useEffect(() => {
    const rows = Array.isArray(perProductShipping) ? perProductShipping : []
    if (rows.length === 0) {
      setCartShippingBaseCost(0)
      return
    }

    const nonFreeCosts = rows
      .filter((row) => !Boolean(row?.freeShipping))
      .map((row) => (typeof row?.shippingCost === 'number' ? row.shippingCost : Number(row?.shippingCost ?? 0) || 0))
      .filter((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)

    const maxCost = nonFreeCosts.length > 0 ? Math.max(...nonFreeCosts) : 0
    const sumCost = nonFreeCosts.reduce((acc, value) => acc + value, 0)

    setCartShippingBaseCost(shippingCostAggregation === 'sum' ? sumCost : maxCost)
  }, [perProductShipping, shippingCostAggregation])

  useEffect(() => {
    let active = true

    const loadPromotions = async () => {
      try {
        if (!showPromoModal) return
        setIsLoadingPromotions(true)
        const resp = await fetch('/api/public/promotions', { cache: 'no-store' }).catch(() => null)
        const raw = resp && resp.ok ? await resp.json().catch(() => []) : []
        const list = Array.isArray(raw) ? raw : []
        if (active) {
          setAvailablePromotions(list)
        }
      } catch (error) {
        console.warn('[HeaderCart] impossible de charger promotions:', error)
        if (active) {
          setAvailablePromotions([])
        }
      } finally {
        if (active) setIsLoadingPromotions(false)
      }
    }

    void loadPromotions()

    return () => {
      active = false
    }
  }, [showPromoModal])

  /**
   * Auto-détection des coordonnées via GPS navigateur.
   */
  const handleDetectGps = async () => {
    try {
      if (!requiresShippingCoords) return
      if (typeof window === 'undefined' || !navigator?.geolocation) {
        showError('La géolocalisation n\'est pas disponible sur cet appareil/navigateur.')
        return
      }

      setIsDetectingGps(true)
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setShippingLat(String(pos.coords.latitude))
            setShippingLng(String(pos.coords.longitude))
            resolve()
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
        )
      })

      showSuccess('Coordonnées GPS détectées et ajoutées.')
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message : 'Impossible de récupérer la position.'
      showError(message)
    } finally {
      setIsDetectingGps(false)
    }
  }

  const cartReviewHydrationKey = useMemo(() => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const ids = (Array.isArray(cartItemsData) ? cartItemsData : [])
      .map((it: any) => String(it?.id ?? '').trim())
      .filter((id: string) => UUID_REGEX.test(id))

    return Array.from(new Set(ids)).sort().join('|')
  }, [cartItemsData])

  const effectivePointsValue = useMemo(() => {
    // Valeur d'1 point en FCFA (source de vérité Super Admin: purchaseValue)
    const rate = Number(purchaseValue)
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1
    return userPoints * safeRate
  }, [purchaseValue, userPoints])

  const pointsProgressTarget = useMemo(() => {
    const items = Array.isArray(cartItemsData) ? cartItemsData : []
    const total = items.reduce((sum: number, item: any) => {
      const price = typeof item?.price === 'number' ? item.price : Number(item?.price ?? 0) || 0
      const qty = Number(item?.quantity ?? 0) || 0
      if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return sum
      return sum + price * qty
    }, 0)

    const target = Number(total)
    return Number.isFinite(target) && target > 0 ? target : 1
  }, [cartItemsData])

  // Calcul du pourcentage de progression
  const progressPercentage = useMemo(() => {
    return Math.min((effectivePointsValue / pointsProgressTarget) * 100, 100)
  }, [effectivePointsValue, pointsProgressTarget])

  // Suggestions de produits complémentaires générées par IA
  const getAISuggestions = () => {
    if (cartItemsData.length === 0) return []
    
    const categories = [...new Set(cartItemsData.map(item => item.category))]
    const suggestions = []
    
    if (categories.includes('electronics')) {
      suggestions.push(
        { id: 'sug1', name: 'Coque de Protection Premium', price: 15000, image: '/placeholder.svg', seller: 'ProtectStore', category: 'accessories', rating: 4.9 },
        { id: 'sug2', name: 'Chargeur Rapide 65W', price: 25000, image: '/placeholder.svg', seller: 'PowerTech', category: 'accessories', rating: 4.7 },
        { id: 'sug3', name: 'Écouteurs Sans Fil Pro', price: 45000, image: '/placeholder.svg', seller: 'AudioPro', category: 'accessories', rating: 4.8 }
      )
    }
    
    if (categories.includes('fashion')) {
      suggestions.push(
        { id: 'sug4', name: 'Sac à Dos Élégant', price: 35000, image: '/placeholder.svg', seller: 'StyleStore', category: 'accessories', rating: 4.6 },
        { id: 'sug5', name: 'Montre Connectée', price: 85000, image: '/placeholder.svg', seller: 'TechWatch', category: 'accessories', rating: 4.5 }
      )
    }
    
    return suggestions.slice(0, 3) // Limiter à 3 suggestions
  }

  // Fonction pour ajouter une suggestion au panier
  const handleAddSuggestion = (suggestion: any) => {
    if (!isClient) return
    
    try {
      CartService.addToCart(suggestion)
      setCartItems(CartService.getCart().length)
      setCartItemsData(CartService.getCart())
      showSuccess(`${suggestion.name} ajouté au panier !`)
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la suggestion:', error)
      showError('Erreur lors de l\'ajout au panier')
    }
  }

  // Fonctions de gestion du panier
  const handleRemoveFromCart = (itemId: number) => {
    if (!isClient) return
    
    try {
      const item = cartItemsData.find(item => item.id === itemId)
      if (item) {
        CartService.removeFromCart(itemId)
        setCartItems(CartService.getCart().length)
        setCartItemsData(CartService.getCart())
        showInfo(`${item.name} retiré du panier`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
      showError('Erreur lors de la suppression du produit')
    }
  }

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (!isClient) return
    
    try {
      if (newQuantity <= 0) {
        handleRemoveFromCart(itemId)
        return
      }
      
      CartService.updateQuantity(itemId, newQuantity)
      setCartItemsData(CartService.getCart())
      showSuccess('Quantité mise à jour')
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error)
      showError('Erreur lors de la mise à jour')
    }
  }

  const handleAddToWishlist = (itemId: number) => {
    if (!isClient) return
    
    try {
      const item = cartItemsData.find(item => item.id === itemId)
      if (item) {
        const already = WishlistService.isInWishlist(itemId)
        if (already) {
          WishlistService.removeFromWishlist(itemId)
          showInfo(`${item.name} retiré des favoris`)
        } else {
          WishlistService.addToWishlist(item)
          showSuccess(`${item.name} ajouté aux favoris`)
        }

        const next = WishlistService.getWishlist()
        setWishlistItems(Array.isArray(next) ? next.length : 0)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error)
      showError('Erreur lors de l\'ajout aux favoris')
    }
  }

  /**
   * Hydrate les produits du panier avec les stats (note + compteur d'avis) depuis la base.
   * Affichage instantané: on lit un cache localStorage immédiatement, puis on rafraîchit via l'API.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!showCartModal) return

    let cancelled = false

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    const readCache = (): Record<string, any> => {
      try {
        const raw = window.localStorage.getItem(PRODUCT_STATS_CACHE_KEY)
        const parsed = raw ? JSON.parse(raw) : {}
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        return {}
      }
    }

    const writeCache = (next: Record<string, any>) => {
      try {
        window.localStorage.setItem(PRODUCT_STATS_CACHE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
    }

    const applyStatsToCart = (statsById: Record<string, any>) => {
      setCartItemsData((prev) => {
        const items = Array.isArray(prev) ? prev : []
        return items.map((it: any) => {
          const id = String(it?.id ?? '').trim()
          const cached = id ? statsById[id] : null
          if (!cached) return it
          return {
            ...it,
            rating: typeof cached?.average_rating === 'number' ? cached.average_rating : it.rating,
            reviewCount: typeof cached?.review_count === 'number' ? cached.review_count : (it as any).reviewCount
          }
        })
      })
    }

    const hydrate = async () => {
      const cache = readCache()
      applyStatsToCart(cache)

      const uniqueIds = cartReviewHydrationKey
        ? cartReviewHydrationKey.split('|').map((x) => x.trim()).filter(Boolean)
        : []

      if (uniqueIds.length === 0) return

      const results = await Promise.all(
        uniqueIds.map(async (id) => {
          const resp = await fetch(`/api/public/products?id=${encodeURIComponent(id)}`, { cache: 'no-store' }).catch(() => null)
          const json = resp && resp.ok ? await resp.json().catch(() => ({})) : {}
          const data = (json as any)?.data ?? null
          const stats = data?.stats ?? null
          const average_rating = typeof stats?.average_rating === 'number' ? stats.average_rating : Number(stats?.average_rating ?? NaN)
          const review_count = typeof stats?.review_count === 'number' ? stats.review_count : Number(stats?.review_count ?? NaN)
          return {
            id,
            average_rating: Number.isFinite(average_rating) ? Number(average_rating) : null,
            review_count: Number.isFinite(review_count) ? Number(review_count) : null
          }
        })
      )

      if (cancelled) return

      const nextCache = { ...cache }
      results.forEach((row) => {
        if (!row?.id) return
        if (typeof row.average_rating !== 'number' && typeof row.review_count !== 'number') return
        nextCache[row.id] = {
          average_rating: typeof row.average_rating === 'number' ? row.average_rating : (nextCache[row.id]?.average_rating ?? null),
          review_count: typeof row.review_count === 'number' ? row.review_count : (nextCache[row.id]?.review_count ?? null),
          ts: Date.now()
        }
      })

      writeCache(nextCache)
      applyStatsToCart(nextCache)
    }

    void hydrate()

    return () => {
      cancelled = true
    }
  }, [showCartModal, cartReviewHydrationKey])

  // Fonctions pour le paiement fractionné
  const calculateInstallmentPlan = (total: number, months: number) => {
    const monthlyPayment = Math.ceil(total / months)
    const lastPayment = total - (monthlyPayment * (months - 1))
    
    const plan = {
      total,
      months,
      monthlyPayment,
      lastPayment,
      payments: Array(months).fill(monthlyPayment).map((payment, index) => 
        index === months - 1 ? lastPayment : payment
      ),
      dates: Array(months).fill(null).map((_, index) => {
        const date = new Date()
        date.setMonth(date.getMonth() + index + 1)
        return date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      })
    }
    
    return plan
  }

  const handleInstallmentPayment = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      showError('Votre panier est vide')
      return
    }
    
    try {
      const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const plan = calculateInstallmentPlan(total, installmentPlan)
      setInstallmentDetails(plan)
      setShowInstallmentModal(true)
      showInfo('Plan de paiement fractionné calculé !')
    } catch (error) {
      console.error('Erreur lors du calcul du paiement fractionné:', error)
      showError('Erreur lors du calcul du paiement fractionné')
    }
  }

  // Fonctions pour le paiement différé
  const calculateDeferredPayment = (total: number, days: number) => {
    const deferredTotal = Math.ceil(total * 1.15) // 15% d'intérêts
    const dailyInterest = (deferredTotal - total) / days
    
    const plan = {
      originalTotal: total,
      deferredTotal,
      days,
      dailyInterest,
      totalInterest: deferredTotal - total,
      finalDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
    
    return plan
  }

  const handleDeferredPayment = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      showError('Votre panier est vide')
      return
    }
    
    try {
      const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const plan = calculateDeferredPayment(total, deferredDays)
      setDeferredDetails(plan)
      setShowDeferredModal(true)
      showInfo('Plan de paiement différé calculé !')
    } catch (error) {
      console.error('Erreur lors du calcul du paiement différé:', error)
      showError('Erreur lors du calcul du paiement différé')
    }
  }

  // Fonction pour confirmer le paiement fractionné
  const handleConfirmInstallment = () => {
    if (!installmentDetails) return
    
    try {
      showSuccess('Paiement fractionné confirmé !')
      setShowInstallmentModal(false)

      // Ne pas créer la commande ici: on ouvre le modal commande pour compléter les infos.
      setOrderStep(1)
      setShowOrderModal(true)
      showInfo('Veuillez compléter les informations de commande pour finaliser.')
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error)
      showError('Erreur lors de la confirmation du paiement')
    }
  }

  // Fonction pour confirmer le paiement différé
  const handleConfirmDeferred = () => {
    if (!deferredDetails) return
    
    try {
      showSuccess('Paiement différé confirmé !')
      setShowDeferredModal(false)

      // Ne pas créer la commande ici: on ouvre le modal commande pour compléter les infos.
      setOrderStep(1)
      setShowOrderModal(true)
      showInfo('Veuillez compléter les informations de commande pour finaliser.')
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error)
      showError('Erreur lors de la confirmation du paiement')
    }
  }

  // Fonction pour passer la commande
  const handlePlaceOrder = async () => {
    if (!(await requireSupabaseSession('Connectez-vous pour passer une commande.'))) return

    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      showError('Votre panier est vide')
      return
    }
    
    if (
      requiresShippingCoords &&
      selectedDeliveryOption !== 'none' &&
      (!shippingLat ||
        !shippingLng ||
        !Number.isFinite(Number(shippingLat)) ||
        !Number.isFinite(Number(shippingLng)))
    ) {
      showInfo(
        'Veuillez activer votre GPS pour détecter les coordonnées, ou saisir Latitude/Longitude manuellement (produit physique).'
      )
      setShowOrderModal(true)
      return
    }
    
    try {
      // Récupérer les détails de paiement sélectionnés
      const paymentDetails = {
        method: selectedPaymentMethod,
        usePoints: usePoints,
        pointsUsed: pointsToUse,
        pointsDiscount: pointsDiscount,
        finalTotal: finalTotal,
        finalTotalPoints: finalTotalPoints,
        installmentPlan: installmentDetails ? {
          type: 'installment',
          months: installmentPlan,
          monthlyPayment: installmentDetails.monthlyPayment,
          totalPayments: installmentDetails.total
        } : null,
        deferredPlan: deferredDetails ? {
          type: 'deferred',
          days: deferredDays,
          originalTotal: deferredDetails.originalTotal,
          finalTotal: deferredDetails.deferredTotal,
          interest: deferredDetails.totalInterest
        } : null
      }
      
      const order = {
        id: `ORDER_${Date.now()}`,
        items: cartItemsData,
        total: cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryAddress,
        customerPhone,
        customerEmail,
        deliveryOption: selectedDeliveryOption,
        paymentDetails,
        orderDate: new Date().toISOString(),
        status: 'pending'
      }
      
      setOrderDetails(order)
      setShowOrderModal(true)
      showSuccess('Commande créée avec succès !')
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error)
      showError('Erreur lors de la création de la commande')
    }
  }

  // Fonction pour finaliser le paiement
  const handleFinalizePayment = async () => {
    if (!(await requireSupabaseSession('Connectez-vous pour finaliser le paiement.'))) return

    if (!isClient) {
      showError('Aucune commande à payer')
      return
    }

    if (!orderDetails) {
      showInfo('Veuillez d\'abord créer la commande (renseigner la livraison) avant de finaliser le paiement.')
      setShowOrderModal(true)
      setOrderStep(1)
      return
    }
    
    try {
      const submitOrderToServer = async (opts?: { overridePaymentStatus?: string; overrideStatus?: string }) => {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

        const itemsPayload = Array.isArray(cartItemsData)
          ? cartItemsData.map((item) => ({
              productId: String(item?.id ?? ''),
              quantity: Number(item?.quantity ?? 1),
              unitPrice: Number(item?.price ?? 0),
              originalUnitPrice:
                typeof item?.originalPrice === 'number'
                  ? item.originalPrice
                  : Number(item?.originalPrice ?? item?.price ?? 0),
              appliedOffer: item?.appliedOffer ?? null
            }))
          : []

        const allProductIdsAreUuid = itemsPayload.length > 0 && itemsPayload.every((i) => UUID_REGEX.test(i.productId))

        const sessionRes = await supabase.auth.getSession().catch(() => null)
        const accessToken = sessionRes?.data?.session?.access_token

        // Fallback rétrocompatible (mode démo) si pas de session Supabase ou produits non UUID.
        if (!allProductIdsAreUuid || !accessToken) {
          console.warn('⚠️ Checkout en mode démo (pas de session ou IDs produits non UUID).')
          showSuccess('Commande confirmée !')
          setShowOrderModal(false)
          setShowMobileMoneyPaymentModal(false)
          setShowCardPaymentModal(false)

          try {
            CartService.clearCart()
          } catch {
            // silencieux
          }
          setCartItemsData([])
          setCartItems(0)

          setUsePoints(false)
          setPointsToUse(0)
          setInstallmentDetails(null)
          setDeferredDetails(null)
          return
        }

        const resp = await fetch('/api/client/orders', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Bearer ${accessToken}`
          },
          cache: 'no-store',
          body: JSON.stringify({
            items: itemsPayload,
            shareRefByProductId: (() => {
              try {
                if (typeof window === 'undefined' || !window.sessionStorage) return null
                const raw = window.sessionStorage.getItem('share_ref_by_product_id')
                if (!raw) return null
                const obj = JSON.parse(raw)
                return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null
              } catch {
                return null
              }
            })(),
            currency: 'XOF',
            paymentMethod: selectedPaymentOption || 'standard',
            paymentStatus: opts?.overridePaymentStatus ?? 'completed',
            status: opts?.overrideStatus ?? 'confirmed',
            paymentOption: selectedPaymentOption,
            deliveryOption: selectedDeliveryOption,
            pointsUsed: usePoints ? pointsToUse : 0,
            pointsDiscount: pointsDiscount,
            finalTotal: grandTotal,
            delivery: {
              zone: selectedDeliveryZone,
              method: selectedDeliveryMethod,
              aggregation: shippingCostAggregation,
              geoLocalDistrict,
              geoDepartment,
              geoCity,
              geoArrondissement,
              geoDistrict,
              geoCountry,
              geoRegionDepartment
            },
            shippingLat: requiresShippingCoords ? Number(shippingLat) : null,
            shippingLng: requiresShippingCoords ? Number(shippingLng) : null,
            shippingAddress: {
              delivery_address: deliveryAddress,
              customer_phone: customerPhone,
              customer_email: customerEmail
            },
            billingAddress: null,
            notes: null
          })
        }).catch(() => null)

        if (!resp || !resp.ok) {
          const body = resp ? await resp.text().catch(() => '') : ''
          console.error('❌ Création commande server échouée:', resp?.status, body)
          showError('Impossible de confirmer la commande. Veuillez réessayer.')
          return
        }

        const json = await resp.json().catch(() => ({}))
        const serverOrders = (json as any)?.data
        if (Array.isArray(serverOrders) && serverOrders.length > 0) {
          setOrderDetails((prev: any) => (prev ? { ...prev, serverOrders } : prev))
        }

        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('clientOrdersUpdated', { detail: { orders: serverOrders ?? [] } }))
            window.dispatchEvent(new CustomEvent('clientDeliveriesRefresh'))
          }
        } catch {
          // silencieux
        }

        showSuccess('Commande confirmée !')
        setShowOrderModal(false)
        setShowMobileMoneyPaymentModal(false)
        setShowCardPaymentModal(false)

        // Vider le panier après commande réussie
        try {
          CartService.clearCart()
        } catch {
          // silencieux
        }
        setCartItemsData([])
        setCartItems(0)

        // Réinitialiser les états de paiement
        setUsePoints(false)
        setPointsToUse(0)
        setInstallmentDetails(null)
        setDeferredDetails(null)
      }

      // Créer le paiement en fonction du plan sélectionné
      let paymentAmount = orderDetails.total
      let paymentDescriptionComputed = 'Paiement standard'
      
      if (orderDetails.paymentDetails) {
        const details = orderDetails.paymentDetails
        
        if (details.installmentPlan) {
          paymentAmount = details.installmentPlan.monthlyPayment
          paymentDescriptionComputed = `Paiement fractionné - 1ère mensualité de ${details.installmentPlan.months} mois`
        } else if (details.deferredPlan) {
          paymentAmount = details.deferredPlan.finalTotal
          paymentDescriptionComputed = `Paiement différé - Échéance dans ${details.deferredPlan.days} jours`
        } else if (details.usePoints) {
          paymentAmount = details.finalTotal
          paymentDescriptionComputed = `Paiement avec ${details.pointsUsed.toLocaleString()} points utilisés`
        }
      }
      
      const payment = {
        id: `PAY_${Date.now()}`,
        orderId: orderDetails.id,
        amount: paymentAmount,
        originalAmount: orderDetails.total,
        method: selectedPaymentOption || 'standard',
        description: (String(paymentDescription || '').trim() || paymentDescriptionComputed),
        paymentDetails: orderDetails.paymentDetails,
        status: 'processing',
        date: new Date().toISOString()
      }
      
      setPaymentDetails(payment)

      if ((selectedPaymentOption || 'standard') === 'mobile_money') {
        setShowMobileMoneyPaymentModal(true)
      }

      if ((selectedPaymentOption || 'standard') === 'card') {
        setShowCardPaymentModal(true)
      }

      // Paiement à la livraison: on crée la commande immédiatement et on marque le paiement comme en attente.
      if ((selectedPaymentOption || 'standard') === 'cash') {
        void submitOrderToServer({ overridePaymentStatus: 'pending', overrideStatus: 'confirmed' })
        return
      }

      // Paiement en ligne: initialiser FeexPay (mock) puis attendre la vérification utilisateur.
      if ((selectedPaymentOption || 'standard') === 'mobile_money' || (selectedPaymentOption || 'standard') === 'card') {
        void initializeFeexPayOnlinePayment({ force: false })

        return
      }

      showError('Méthode de paiement non supportée.')
      
    } catch (error) {
      console.error('Erreur lors de la finalisation du paiement:', error)
      showError('Erreur lors de la finalisation du paiement')
    }
  }

  /**
   * Initialise un paiement FeexPay (mobile money / carte) et démarre le polling de vérification.
   */
  const initializeFeexPayOnlinePayment = async ({ force }: { force: boolean }) => {
    if (isInitializingOnlinePayment) {
      return
    }

    if (!force && paymentDetails?.feexpay?.reference) {
      return
    }

    if (feexpayAutoVerifyTimeoutRef.current) {
      window.clearTimeout(feexpayAutoVerifyTimeoutRef.current)
      feexpayAutoVerifyTimeoutRef.current = null
    }
    if (feexpayAutoVerifyIntervalRef.current) {
      window.clearInterval(feexpayAutoVerifyIntervalRef.current)
      feexpayAutoVerifyIntervalRef.current = null
    }

    setIsInitializingOnlinePayment(true)
    try {
      try {
        void trackAutomationEvent({
          eventType: 'checkout.started',
          entityType: 'checkout',
          entityId: null,
          payload: {
            paymentOption: selectedPaymentOption || null,
            deliveryOption: selectedDeliveryOption || null,
            amount: paymentDetails?.amount ?? orderDetails?.total ?? 0,
            currency: 'XOF',
            zone: selectedDeliveryZone,
            method: selectedDeliveryMethod
          },
          sourceUi: 'header_cart_checkout'
        })
      } catch {
        // best-effort
      }

      const sessionRes = await supabase.auth.getSession().catch(() => null)
      const accessToken = sessionRes?.data?.session?.access_token
      if (!accessToken) {
        ensureAuthenticated('Session expirée. Veuillez vous reconnecter.')
        return
      }

      const controller = new AbortController()
      const timeoutMsRaw = Number((process as any)?.env?.NEXT_PUBLIC_FEEXPAY_TIMEOUT_MS ?? 60000)
      const timeoutMs = Number.isFinite(timeoutMsRaw) && timeoutMsRaw > 0 ? timeoutMsRaw : 60000
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      setOnlinePaymentStatusMessage('Initialisation du paiement…')

      const resp = await fetch('/api/client/payments/feexpay/initialize', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`
        },
        cache: 'no-store',
        body: JSON.stringify({
          amount: paymentDetails?.amount ?? orderDetails?.total ?? 0,
          currency: 'XOF',
          method: selectedPaymentOption,
          network: selectedPaymentOption === 'mobile_money' ? mobileMoneyNetwork : null,
          customerPhone: selectedPaymentOption === 'mobile_money'
            ? `${String(mobileMoneyCountryCode || '').trim()}${String(mobileMoneyPhone || '').trim()}`
            : (customerPhone || null),
          customerEmail: customerEmail || null,
          description: (String(paymentDescription || '').trim() || String(paymentDetails?.description ?? '').trim() || 'Paiement standard'),
          metadata: {
            source: 'header_cart_checkout',
            orderId: orderDetails?.id ?? null,
            customerName: mobileMoneyOwnerName || undefined
          }
        }),
        signal: controller.signal
      }).catch((err) => {
        if (err && typeof err === 'object' && (err as any)?.name === 'AbortError') {
          return null
        }
        throw err
      })

      clearTimeout(timeout)

      if (!resp) {
        showError('Le paiement est trop lent à initialiser. Réessayez dans quelques instants.')
        setOnlinePaymentStatusMessage('Initialisation trop lente. Réessayez.')
        return
      }

      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        if (resp.status === 504) {
          const msg = (json as any)?.error || 'FeexPay ne répond pas (timeout). Réessayez.'
          showError(msg)
          setOnlinePaymentStatusMessage(msg)
          return
        }
        const msg = (json as any)?.error || 'Impossible d\'initialiser le paiement FeexPay.'
        showError(msg)
        setOnlinePaymentStatusMessage(msg)
        return
      }

      const reference = typeof (json as any)?.reference === 'string' ? (json as any).reference : ''
      if (!reference) {
        showError('Référence de paiement manquante.')
        setOnlinePaymentStatusMessage('Référence de paiement manquante.')
        return
      }

      const networkRequested = typeof (json as any)?.networkRequested === 'string' ? (json as any).networkRequested : null
      const networkResolved = typeof (json as any)?.networkResolved === 'string' ? (json as any).networkResolved : null

      const paymentUrl = typeof (json as any)?.paymentUrl === 'string' ? (json as any).paymentUrl : null

      setPaymentDetails((prev: any) => ({
        ...(prev ?? {}),
        feexpay: {
          ...(prev?.feexpay ?? {}),
          reference,
          status: (json as any)?.status ?? 'pending',
          mode: (json as any)?.mode ?? null,
          paymentUrl,
          networkRequested,
          networkResolved
        }
      }))

      void startFeexPayAutoVerify(reference)

      const netHint = networkResolved && networkRequested && networkResolved !== networkRequested
        ? ` (réseau demandé: ${networkRequested}, envoyé: ${networkResolved})`
        : networkResolved
          ? ` (réseau: ${networkResolved})`
          : ''

      showSuccess(`Paiement FeexPay initialisé (réf: ${reference}). Veuillez finaliser le paiement pour confirmer la commande.${netHint}`)
      setOnlinePaymentStatusMessage(`En attente de validation du paiement… Réf: ${reference}${netHint}`)
    } catch (error) {
      console.error('Erreur init FeexPay:', error)
      showError('Erreur lors de l\'initialisation du paiement FeexPay.')
      setOnlinePaymentStatusMessage('Erreur lors de l\'initialisation du paiement FeexPay.')
    } finally {
      setIsInitializingOnlinePayment(false)
    }
  }

  /**
   * Vérifie le paiement FeexPay (mock) puis soumet la commande au serveur.
   */
  const handleVerifyAndConfirmOnlinePayment = async () => {
    if (feexpayAutoVerifyTimeoutRef.current) {
      window.clearTimeout(feexpayAutoVerifyTimeoutRef.current)
      feexpayAutoVerifyTimeoutRef.current = null
    }
    if (feexpayAutoVerifyIntervalRef.current) {
      window.clearInterval(feexpayAutoVerifyIntervalRef.current)
      feexpayAutoVerifyIntervalRef.current = null
    }

    if (!paymentDetails?.feexpay?.reference) {
      showError('Référence de paiement manquante.')
      return
    }

    if ((selectedPaymentOption || 'standard') !== 'mobile_money' && (selectedPaymentOption || 'standard') !== 'card') {
      showError('Aucun paiement en ligne à vérifier.')
      return
    }

    setIsVerifyingOnlinePayment(true)
    try {
      const sessionRes = await supabase.auth.getSession().catch(() => null)
      const accessToken = sessionRes?.data?.session?.access_token
      if (!accessToken) {
        ensureAuthenticated('Session expirée. Veuillez vous reconnecter.')
        return
      }

      const resp = await fetch('/api/client/payments/feexpay/verify', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`
        },
        cache: 'no-store',
        body: JSON.stringify({ reference: String(paymentDetails.feexpay.reference) })
      })

      const json = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        showError((json as any)?.error || 'Impossible de vérifier le paiement.')
        return
      }

      const paid = Boolean((json as any)?.paid)
      const statusRaw = typeof (json as any)?.status === 'string' ? (json as any).status : ''
      const status = statusRaw.trim().toUpperCase()

      const phoneFallback = `${String(mobileMoneyCountryCode || '').trim()}${String(mobileMoneyPhone || '').trim()}`
      const payerLabel = String(mobileMoneyOwnerName || '').trim() || String(phoneFallback || '').trim() || String(customerPhone || '').trim() || 'ce numéro'

      const isTerminalFailure = status === 'FAILED' || status === 'CANCELLED' || status === 'CANCELED' || status === 'EXPIRED' || status === 'REJECTED'
      if (isTerminalFailure) {
        const msg = `Paiement décliné par le titulaire du numéro ${payerLabel}. Veuillez réessayer ou contacter le titulaire.`
        setOnlinePaymentStatusMessage(msg)
        showError(msg)
        return
      }

      if (!paid) {
        setOnlinePaymentStatusMessage('Paiement non confirmé pour le moment…')
        showInfo('Paiement non confirmé pour le moment. Réessayez.')
        return
      }

      setOnlinePaymentStatusMessage('Paiement effectué. Confirmation de la commande en cours…')

      // Rejouer la création commande en marquant le paiement completed.
      // NOTE: on réutilise la logique existante en relançant handleFinalizePayment n'est pas possible.
      // Ici on ferme le modal paiement et on clique Confirmer commande => mais on doit soumettre directement.
      // Pour éviter de dupliquer tout le code, on déclenche le submit via le bouton Confirmer commande (handleFinalizePayment)
      // n'est pas accessible. Donc: on appelle l'API /api/client/orders ici avec paymentStatus completed.
      const itemsPayload = Array.isArray(cartItemsData)
        ? cartItemsData.map((item) => ({
            productId: String(item?.id ?? ''),
            quantity: Number(item?.quantity ?? 1),
            unitPrice: Number(item?.price ?? 0),
            originalUnitPrice:
              typeof item?.originalPrice === 'number'
                ? item.originalPrice
                : Number(item?.originalPrice ?? item?.price ?? 0),
            appliedOffer: item?.appliedOffer ?? null
          }))
        : []

      const allProductIdsAreUuid = itemsPayload.length > 0 && itemsPayload.every((i) => UUID_REGEX.test(i.productId))
      if (!allProductIdsAreUuid) {
        showInfo('Paiement validé (mock). Mode démo: confirmation locale de la commande.')
        showSuccess('Commande confirmée !')
        setShowOrderModal(false)
        setShowMobileMoneyPaymentModal(false)
        setShowCardPaymentModal(false)
        try {
          CartService.clearCart()
        } catch {
          // ignore
        }
        setCartItemsData([])
        setCartItems(0)
        setUsePoints(false)
        setPointsToUse(0)
        setInstallmentDetails(null)
        setDeferredDetails(null)
        return
      }

      const orderResp = await fetch('/api/client/orders', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`
        },
        cache: 'no-store',
        body: JSON.stringify({
          items: itemsPayload,
          currency: 'XOF',
          paymentMethod: selectedPaymentOption || 'standard',
          paymentStatus: 'completed',
          status: 'confirmed',
          paymentOption: selectedPaymentOption,
          deliveryOption: selectedDeliveryOption,
          pointsUsed: usePoints ? pointsToUse : 0,
          pointsDiscount: pointsDiscount,
          finalTotal: grandTotal,
          delivery: {
            zone: selectedDeliveryZone,
            method: selectedDeliveryMethod,
            aggregation: shippingCostAggregation,
            geoLocalDistrict,
            geoDepartment,
            geoCity,
            geoArrondissement,
            geoDistrict,
            geoCountry,
            geoRegionDepartment
          },
          shippingLat: requiresShippingCoords ? Number(shippingLat) : null,
          shippingLng: requiresShippingCoords ? Number(shippingLng) : null,
          shippingAddress: {
            delivery_address: deliveryAddress,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            metadata: {
              feexpay_reference: String(paymentDetails.feexpay.reference)
            }
          },
          billingAddress: null,
          notes: null
        })
      }).catch(() => null)

      if (!orderResp || !orderResp.ok) {
        const bodyTxt = orderResp ? await orderResp.text().catch(() => '') : ''
        console.error('❌ Création commande server échouée après verify:', orderResp?.status, bodyTxt)
        showError('Paiement validé, mais impossible de confirmer la commande. Veuillez contacter le support.')
        return
      }

      const orderJson = await orderResp.json().catch(() => ({}))
      const serverOrders = (orderJson as any)?.data
      if (Array.isArray(serverOrders) && serverOrders.length > 0) {
        setOrderDetails((prev: any) => (prev ? { ...prev, serverOrders } : prev))
      }

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('clientOrdersUpdated', { detail: { orders: serverOrders ?? [] } }))
          window.dispatchEvent(new CustomEvent('clientDeliveriesRefresh'))
        }
      } catch {
        // ignore
      }

      showSuccess('Commande confirmée !')
      setShowOrderModal(false)
      setShowMobileMoneyPaymentModal(false)
      setShowCardPaymentModal(false)

      setOnlinePaymentStatusMessage('')

      try {
        router.push('/dashboard/orders')
      } catch {
        // ignore
      }

      try {
        CartService.clearCart()
      } catch {
        // ignore
      }
      setCartItemsData([])
      setCartItems(0)

      setUsePoints(false)
      setPointsToUse(0)
      setInstallmentDetails(null)
      setDeferredDetails(null)
    } catch (error) {
      console.error('Erreur verify FeexPay:', error)
      showError('Erreur lors de la vérification du paiement.')
    } finally {
      setIsVerifyingOnlinePayment(false)
    }
  }

  const startFeexPayAutoVerify = async (reference: string) => {
    const ref = String(reference ?? '').trim()
    if (!ref) return

    if (feexpayAutoVerifyTimeoutRef.current) {
      window.clearTimeout(feexpayAutoVerifyTimeoutRef.current)
      feexpayAutoVerifyTimeoutRef.current = null
    }

    if (feexpayAutoVerifyIntervalRef.current) {
      window.clearInterval(feexpayAutoVerifyIntervalRef.current)
      feexpayAutoVerifyIntervalRef.current = null
    }

    const intervalMs = 6000
    const maxDurationMs = 90000

    feexpayAutoVerifyTimeoutRef.current = window.setTimeout(() => {
      if (feexpayAutoVerifyIntervalRef.current) {
        window.clearInterval(feexpayAutoVerifyIntervalRef.current)
        feexpayAutoVerifyIntervalRef.current = null
      }
      feexpayAutoVerifyTimeoutRef.current = null

      setOnlinePaymentStatusMessage('Paiement non confirmé. Si vous avez décliné l\'USSD, veuillez réessayer ou contacter le titulaire.')
    }, maxDurationMs)

    feexpayAutoVerifyIntervalRef.current = window.setInterval(() => {
      void (async () => {
        try {
          if (feexpayAutoVerifyInFlightRef.current) return
          feexpayAutoVerifyInFlightRef.current = true

          const sessionRes = await supabase.auth.getSession().catch(() => null)
          const accessToken = sessionRes?.data?.session?.access_token
          if (!accessToken) return

          const resp = await fetch('/api/client/payments/feexpay/verify', {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              authorization: `Bearer ${accessToken}`
            },
            cache: 'no-store',
            body: JSON.stringify({ reference: ref })
          }).catch(() => null)

          if (!resp || !resp.ok) return
          const json = await resp.json().catch(() => ({}))
          const paid = Boolean((json as any)?.paid)
          const statusRaw = typeof (json as any)?.status === 'string' ? (json as any).status : ''
          const status = statusRaw.trim().toUpperCase()

          const isTerminalFailure = status === 'FAILED' || status === 'CANCELLED' || status === 'CANCELED' || status === 'EXPIRED' || status === 'REJECTED'
          if (isTerminalFailure) {
            if (feexpayAutoVerifyTimeoutRef.current) {
              window.clearTimeout(feexpayAutoVerifyTimeoutRef.current)
              feexpayAutoVerifyTimeoutRef.current = null
            }
            if (feexpayAutoVerifyIntervalRef.current) {
              window.clearInterval(feexpayAutoVerifyIntervalRef.current)
              feexpayAutoVerifyIntervalRef.current = null
            }

            const phoneFallback = `${String(mobileMoneyCountryCode || '').trim()}${String(mobileMoneyPhone || '').trim()}`
            const payerLabel = String(mobileMoneyOwnerName || '').trim() || String(phoneFallback || '').trim() || String(customerPhone || '').trim() || 'ce numéro'
            const msg = `Paiement décliné par le titulaire du numéro ${payerLabel}. Veuillez réessayer ou contacter le titulaire.`
            setOnlinePaymentStatusMessage(msg)
            showError(msg)
            return
          }

          if (!paid) {
            setOnlinePaymentStatusMessage('En attente de validation du paiement…')
            return
          }

          if (feexpayAutoVerifyTimeoutRef.current) {
            window.clearTimeout(feexpayAutoVerifyTimeoutRef.current)
            feexpayAutoVerifyTimeoutRef.current = null
          }
          if (feexpayAutoVerifyIntervalRef.current) {
            window.clearInterval(feexpayAutoVerifyIntervalRef.current)
            feexpayAutoVerifyIntervalRef.current = null
          }

          void handleVerifyAndConfirmOnlinePayment()
        } catch {
          // silencieux
        } finally {
          feexpayAutoVerifyInFlightRef.current = false
        }
      })()
    }, intervalMs)
  }

  useEffect(() => {
    return () => {
      if (feexpayAutoVerifyTimeoutRef.current) {
        window.clearTimeout(feexpayAutoVerifyTimeoutRef.current)
        feexpayAutoVerifyTimeoutRef.current = null
      }
      if (feexpayAutoVerifyIntervalRef.current) {
        window.clearInterval(feexpayAutoVerifyIntervalRef.current)
        feexpayAutoVerifyIntervalRef.current = null
      }
    }
  }, [])

  // Fonction pour utiliser les points
  const handleUsePoints = (amount: number) => {
    if (!isClient) return
    
    try {
      if (amount <= userPoints) {
        setPointsToUse(amount)
        setUsePoints(true)
        showSuccess(`${amount} points utilisés`)
      } else {
        showError('Points insuffisants')
      }
    } catch (error) {
      console.error('Erreur lors de l\'utilisation des points:', error)
    }
  }

  // Fonction pour calculer la réduction avec les points
  const calculatePointsDiscount = () => {
    if (!usePoints || pointsToUse === 0) return 0
    // Option A: 1 point = purchaseValue FCFA
    const rate = Number(purchaseValue)
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1
    return Math.min(pointsToUse * safeRate, cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0))
  }

  // Fonction pour convertir FCFA en points
  const convertFCFAToPoints = (fcfAmount: number) => {
    // Option A: points = FCFA / purchaseValue
    const rate = Number(purchaseValue)
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1
    return Math.round(fcfAmount / safeRate)
  }

  // Fonction pour convertir points en FCFA
  const convertPointsToFCFA = (points: number) => {
    // Option A: FCFA = points * purchaseValue
    const rate = Number(purchaseValue)
    const safeRate = Number.isFinite(rate) && rate > 0 ? rate : 1
    return points * safeRate
  }

  // Calcul du total final
  const cartTotal = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartTotalPoints = convertFCFAToPoints(cartTotal)
  const pointsDiscount = calculatePointsDiscount()
  const finalTotal = Math.max(0, cartTotal - pointsDiscount)
  const finalTotalPoints = convertFCFAToPoints(finalTotal)

  // Fonction pour gérer le changement de mode de paiement
  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method)
    // Réinitialiser les points à utiliser quand on change de mode
    if (method !== 'mixed') {
      setPointsToUse(0)
    }
  }

  // Fonction pour appliquer un code promo
  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoError("Veuillez saisir un code promo")
      return
    }

    const promo = (availablePromotions ?? []).find((p: any) => {
      const code = typeof p?.code === 'string' ? p.code : ''
      return code.toUpperCase() === promoCode.toUpperCase().trim()
    })
    
    if (!promo) {
      setPromoError("Code promo invalide ou expiré")
      return
    }

    const minAmount = typeof promo?.min_order_amount === 'number'
      ? promo.min_order_amount
      : promo?.min_order_amount != null
        ? Number(promo.min_order_amount)
        : null

    if (typeof minAmount === 'number' && Number.isFinite(minAmount) && cartTotal < minAmount) {
      setPromoError(`Montant minimum requis: ${formatMoney(minAmount)}`)
      return
    }

    // Appliquer le code promo
    setAppliedPromo(promo)
    setPromoError("")
    setPromoCode("")
    
    showSuccess(`Code promo ${promo.code} appliqué avec succès !`)
    
    // Fermer le modal après un délai
    setTimeout(() => {
      setShowPromoModal(false)
    }, 1500)
  }

  // Fonction pour supprimer un code promo
  const handleRemovePromo = () => {
    setAppliedPromo(null)
    showInfo("Code promo supprimé")
  }

  // Calcul de la réduction promo
  const calculatePromoDiscount = () => {
    if (!appliedPromo) return 0
    
    const discountType = typeof (appliedPromo as any)?.discount_type === 'string' ? (appliedPromo as any).discount_type : ''
    const discountValue = typeof (appliedPromo as any)?.discount_value === 'number'
      ? (appliedPromo as any).discount_value
      : Number((appliedPromo as any)?.discount_value ?? 0) || 0

    if (discountType === 'free_shipping') {
      return 0
    }

    if (discountType === 'percentage') {
      return (cartTotal * discountValue) / 100
    }

    return discountValue
  }

  // Total final avec promo
  const finalTotalWithPromo = Math.max(0, finalTotal - calculatePromoDiscount())
  const finalTotalWithPromoPoints = convertFCFAToPoints(finalTotalWithPromo)

  // Fonctions pour la gestion des livraisons
  const handleDeliveryMethodChange = (method: string) => {
    setSelectedDeliveryMethod(method === 'express' ? 'express' : 'standard')
  }

  const isFreeShippingEffective =
    selectedDeliveryMethod !== 'express' &&
    (Boolean(isCartFreeShipping) || String((appliedPromo as any)?.discount_type ?? '') === 'free_shipping')

  const freeShippingByProductId = useMemo(() => {
    const rows = Array.isArray(perProductShipping) ? perProductShipping : []
    const map = new Map<string, boolean>()
    rows.forEach((row: any) => {
      const pid = String(row?.productId ?? '').trim()
      if (!pid) return
      map.set(pid, Boolean(row?.freeShipping))
    })
    return map
  }, [perProductShipping])

  /**
   * Calcule le coût livraison (live) selon les règles super-admin + zone/mode + quantité.
   */
  const calculateDeliveryCost = (method: string) => {
    const cartQty = getCartQuantityCount(cartItemsData)
    const candidateMode = method === 'express' ? 'express' : 'standard'

    const canApplyFreeShipping =
      method !== 'express' &&
      (Boolean(isCartFreeShipping) || String((appliedPromo as any)?.discount_type ?? '') === 'free_shipping')

    const zone = selectedDeliveryZone
    const geoTarget =
      zone === 'international'
        ? {
            country: geoCountry || (typeof deliveryCountry === 'string' ? deliveryCountry : null)
          }
        : zone === 'regional'
          ? {
              regionDepartment: geoRegionDepartment || geoDepartment || null
            }
          : zone === 'national'
            ? {
                department: geoDepartment || null,
                city: geoCity || null,
                arrondissement: geoArrondissement || null,
                district: geoDistrict || null
              }
            : {
                localDistrict: geoLocalDistrict || (typeof deliveryAddress === 'string' ? deliveryAddress : null)
              }

    const bestRule = selectBestDeliveryRule(deliveryRules, {
      mode: candidateMode,
      zone,
      geo: geoTarget as any,
      quantity: cartQty,
      weightKg: cartWeightKg
    })

    const baseCost = bestRule
      ? computeDeliveryPriceFromRule(bestRule, {
          orderUnits: 1,
          itemUnits: cartQty,
          weightKg: cartWeightKg
        })
      : Number(cartShippingBaseCost) || 0

    return canApplyFreeShipping ? 0 : Math.ceil(baseCost)
  }

  const shippingCost = useMemo(() => {
    if (selectedDeliveryOption === 'none') return 0
    if (!requiresShippingCoords) return 0
    if (selectedDeliveryOption === 'pickup') return pickupShippingCost
    return calculateDeliveryCost(selectedDeliveryMethod)
  }, [
    selectedDeliveryMethod,
    selectedDeliveryOption,
    requiresShippingCoords,
    pickupShippingCost,
    selectedDeliveryZone,
    geoLocalDistrict,
    geoDepartment,
    geoCity,
    geoArrondissement,
    geoDistrict,
    geoCountry,
    geoRegionDepartment,
    deliveryCountry,
    deliveryAddress,
    isFreeShippingEffective,
    deliveryRules,
    cartItemsData,
    cartShippingBaseCost,
    cartWeightKg
  ])

  const shippingCostPoints = useMemo(() => {
    return convertFCFAToPoints(shippingCost)
  }, [shippingCost])

  const grandTotal = useMemo(() => {
    return Math.max(0, finalTotalWithPromo + shippingCost)
  }, [finalTotalWithPromo, shippingCost])

  const grandTotalPoints = useMemo(() => {
    return convertFCFAToPoints(grandTotal)
  }, [grandTotal])

  /**
   * Persiste la configuration livraison (localStorage) + tente une synchronisation côté serveur.
   */
  const persistDeliveryCheckoutPreferences = async () => {
    if (typeof window === 'undefined') return
    const payload = {
      zone: selectedDeliveryZone,
      method: selectedDeliveryMethod,
      aggregation: shippingCostAggregation,

      deliveryAddress,
      deliveryCity,
      deliveryPhone,
      deliveryInstructions,
      preferredDeliveryDate,
      deliveryTimeSlot,

      geoLocalDistrict,
      geoDepartment,
      geoCity,
      geoArrondissement,
      geoDistrict,
      geoCountry,
      geoRegionDepartment,
      updatedAt: new Date().toISOString()
    }

    try {
      localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }

    try {
      const sessionRes = await supabase.auth.getSession().catch(() => null)
      const accessToken = sessionRes?.data?.session?.access_token
      if (!accessToken) return

      await fetch('/api/client/deliveries/preferences', {
        method: 'PATCH',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`
        },
        cache: 'no-store',
        body: JSON.stringify({
          metadata: {
            checkout: payload
          }
        })
      }).catch(() => null)
    } catch {
      // ignore
    }
  }

  const getDeliveryTime = (method: string) => {
    if (isScheduledDelivery) return 'Date choisie par vous'
    return method === 'express' ? '1-2 jours ouvrés' : '3-5 jours ouvrés'
  }

  const generateDeliveryCalendar = () => {
    const calendar = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Exclure les dimanches
      if (date.getDay() !== 0) {
        calendar.push({
          date: date,
          formatted: date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          available: true,
          timeSlots: ['09:00-12:00', '14:00-17:00', '18:00-21:00']
        })
      }
    }
    
    return calendar
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        {/* En-tête moderne avec gradient orange */}
        <DialogHeader className="mb-8">
          <div className="relative">
            {/* Fond avec effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 rounded-2xl opacity-10"></div>
            <div className="relative bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <ShoppingCart className="h-8 w-8 text-white animate-pulse" />
                    </div>
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      Mon Panier
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                      Gérez vos produits et finalisez vos achats en toute sécurité
                    </DialogDescription>
                  </div>
                  
                  {/* Bouton Codes Promo */}
                  <div className="ml-4">
                    <Button
                      onClick={() => setShowPromoModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group border-0"
                    >
                      <Gift className="h-4 w-4 mr-2 group-hover:animate-bounce group-hover:scale-110 transition-all duration-300" />
                      <span className="font-semibold">Codes Promo</span>
                      <Badge className="ml-2 bg-white/20 text-white text-xs animate-pulse">
                        - X%
                      </Badge>
                    </Button>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    {cartItems}
                  </div>
                  <div className="text-sm text-gray-600">
                    {cartItems === 1 ? 'article' : 'articles'} sélectionné{cartItems > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mb-6">
          <EditableMessagesBanner location="wishlist" />
        </div>

        {(Array.isArray(cartItemsData) ? cartItemsData : []).length === 0 ? (
          // Panier vide avec design moderne
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="h-12 w-12 text-orange-400" />
              </div>
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 to-yellow-200/50 rounded-full animate-ping"></div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Votre panier est vide</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Commencez à explorer notre catalogue et ajoutez vos produits préférés à votre panier
            </p>
            
            <Button 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
              onClick={() => {
                showInfo('Redirection vers le catalogue...')
                setTimeout(() => {
                  window.location.href = '/products'
                }, 1000)
              }}
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-spin transition-all duration-300" />
              Commencer les achats
            </Button>
          </div>
        ) : (
          // Contenu du panier avec design moderne
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Section gauche : Articles du panier */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Package className="h-5 w-5 text-orange-600" />
                    <span>Vos Articles ({getCartQuantityCount(cartItemsData)})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItemsData.map((item, index) => (
                    <Card key={`cart-item-${item.id}-${index}`} className="group hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-orange-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-1">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          {/* Image du produit */}
                          <div className="relative">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 group-hover:shadow-lg transition-all duration-300">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                              />
                            </div>
                            <Badge className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2 py-1 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Package className="h-3 w-3 mr-1 fill-current" />
                              Panier
                            </Badge>
                          </div>
                          
                          {/* Informations du produit */}
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Vendeur: {item.seller}
                              </p>
                              {(String(item?.warranty ?? '').trim() || String(item?.returnPolicy ?? '').trim()) && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {String(item?.warranty ?? '').trim() && (
                                    <span>
                                      <span className="font-medium">Garantie:</span> {String(item?.warranty ?? '').trim()}
                                    </span>
                                  )}
                                  {String(item?.warranty ?? '').trim() && String(item?.returnPolicy ?? '').trim() ? (
                                    <span className="mx-2">•</span>
                                  ) : null}
                                  {String(item?.returnPolicy ?? '').trim() && (
                                    <span>
                                      <span className="font-medium">Retours:</span> {String(item?.returnPolicy ?? '').trim()}
                                    </span>
                                  )}
                                </p>
                              )}
                              {freeShippingByProductId.get(String(item.id)) && (
                                <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                  Livraison gratuite
                                </div>
                              )}
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">
                                  {(() => {
                                    const raw = (item as any)?.rating
                                    const n = typeof raw === 'number' ? raw : Number(raw ?? NaN)
                                    if (Number.isFinite(n) && n > 0) return n.toFixed(1)
                                    return '—'
                                  })()}
                                </span>
                                {(() => {
                                  const raw = (item as any)?.reviewCount
                                  const n = typeof raw === 'number' ? raw : Number(raw ?? NaN)
                                  if (!Number.isFinite(n) || n < 0) return null
                                  return <span className="text-xs text-gray-500">({n})</span>
                                })()}
                              </div>
                            </div>
                            
                            {/* Contrôle des quantités */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="h-8 w-8 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                              >
                                <Minus className="h-4 w-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-300 group-hover:animate-pulse" />
                              </Button>
                              <span className="w-12 text-center font-medium text-gray-900">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                              >
                                <Plus className="h-4 w-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-300 group-hover:animate-bounce" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Prix et actions */}
                          <div className="text-right space-y-3">
                            <div>
                              <p className="font-bold text-lg text-orange-600">
                                {formatMoney(item.price * item.quantity)}
                              </p>
                              <p className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                                <Coins className="h-3 w-3 text-yellow-500" />
                                <span>{convertFCFAToPoints(item.price * item.quantity).toLocaleString()} pts</span>
                              </p>
                              <p className="text-xs text-gray-400">
                                {formatMoney(item.price)} l'unité
                              </p>
                            </div>
                            
                            {/* Actions rapides */}
                            <div className="flex flex-col space-y-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddToWishlist(item.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                                title={WishlistService.isInWishlist(item.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                              >
                                <Heart
                                  className="h-4 w-4 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300"
                                  fill={WishlistService.isInWishlist(item.id) ? 'currentColor' : 'none'}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                                title="Retirer du panier"
                              >
                                <Trash2 className="h-4 w-4 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Suggestions IA */}
              {showSuggestions && getAISuggestions().length > 0 && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                      <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                      <span>Suggestions IA</span>
                      <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                        Nouveau
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">Produits complémentaires recommandés pour vous</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {getAISuggestions().map((suggestion, index) => (
                        <Card key={`ai-suggestion-${suggestion.id}-${index}`} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-blue-200 overflow-hidden transform hover:scale-105 active:scale-95 hover:-translate-y-1">
                          <CardContent className="p-4">
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mx-auto group-hover:shadow-lg transition-all duration-300">
                                <Image
                                  src={suggestion.image}
                                  alt={suggestion.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                                  {suggestion.name}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">{suggestion.seller}</p>
                                <div className="flex items-center justify-center space-x-1 mt-1">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600">{suggestion.rating}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="font-bold text-orange-600 text-sm">
                                  {formatMoney(suggestion.price)}
                                </p>
                                <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  <span>{convertFCFAToPoints(suggestion.price).toLocaleString()} pts</span>
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddSuggestion(suggestion)}
                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group hover:shadow-lg"
                                >
                                  <Plus className="h-3 w-3 mr-1 group-hover:animate-bounce group-hover:scale-110 transition-all duration-300" />
                                  Ajouter
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Section droite : Résumé de la commande */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-orange-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Calculator className="h-5 w-5 text-orange-600" />
                    <span>Résumé de la commande</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Détails des prix */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total:</span>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{formatMoney(cartTotal)}</div>
                        <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                          <Coins className="h-3 w-3" />
                          <span>{cartTotalPoints.toLocaleString()} pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Méthode de calcul des frais (par commande)</div>
                      <div className="text-xs text-gray-600">
                        {getShippingAggregationLabel(effectiveShippingAggregation)}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Livraison:</span>
                      <span className="font-medium">
                        {isFreeShippingEffective
                          ? 'Gratuite'
                          : `${formatMoney(shippingCost)}`}
                      </span>
                    </div>
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Réduction points:</span>
                        <div className="text-right">
                          <div className="font-medium">-{formatMoney(pointsDiscount)}</div>
                          <div className="text-xs flex items-center justify-end space-x-1">
                            <Coins className="h-3 w-3" />
                            <span>-{convertFCFAToPoints(pointsDiscount).toLocaleString()} pts</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Réduction code promo */}
                    {appliedPromo && (
                      <div className="flex justify-between text-sm text-purple-600">
                        <span className="flex items-center space-x-1">
                          <Gift className="h-3 w-3" />
                          <span>Code promo {appliedPromo.code}:</span>
                        </span>
                        <div className="text-right">
                          <div className="font-medium">-{formatMoney(calculatePromoDiscount())}</div>
                          <div className="text-xs flex items-center justify-end space-x-1">
                            <Coins className="h-3 w-3" />
                            <span>-{convertFCFAToPoints(calculatePromoDiscount()).toLocaleString()} pts</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleRemovePromo}
                            className="text-xs text-purple-500 hover:text-purple-700 hover:bg-purple-50 p-1 h-auto mt-1 transform hover:scale-110 active:scale-95 transition-all duration-300"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total final:</span>
                        <div className="text-right">
                          <div className="text-orange-600">{formatMoney(grandTotal)}</div>
                          <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                            <Coins className="h-4 w-4" />
                            <span>{grandTotalPoints.toLocaleString()} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points utilisateur */}
                  <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Coins className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-purple-900 flex items-center space-x-1">
                            <Coins className="h-4 w-4 text-yellow-500 group-hover:animate-pulse transition-all duration-300" />
                            <span>Mes Points: {userPoints.toLocaleString()}</span>
                          </p>
                          <p className="text-sm text-purple-700">Valeur: {formatMoney(effectivePointsValue)}</p>
                        </div>
                      </div>
                      <Progress value={progressPercentage} className="mt-3 h-2" />
                      <p className="text-xs text-purple-600 mt-1">
                        {formatMoney(effectivePointsValue)} / {formatMoney(pointsProgressTarget)}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Mode de paiement */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-orange-600" />
                      <span>Mode de paiement</span>
                    </h4>
                    
                    <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 group cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all duration-300">
                          <RadioGroupItem value="standard" id="standard" className="group-hover:scale-110 transition-transform duration-300" />
                          <Label htmlFor="standard" className="text-sm font-medium cursor-pointer group-hover:text-orange-600 transition-colors duration-300">
                            Paiement standard
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 group cursor-pointer hover:bg-yellow-50 p-2 rounded-lg transition-all duration-300">
                          <RadioGroupItem value="points" id="points" className="group-hover:scale-110 transition-transform duration-300" />
                          <Label htmlFor="points" className="text-sm font-medium cursor-pointer group-hover:text-yellow-600 transition-colors duration-300">
                            Acheter avec points
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 group cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-all duration-300">
                          <RadioGroupItem value="mixed" id="mixed" className="group-hover:scale-110 transition-transform duration-300" />
                          <Label htmlFor="mixed" className="text-sm font-medium cursor-pointer group-hover:text-blue-600 transition-colors duration-300">
                            Paiement mixte
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Détails du paiement standard */}
                  {selectedPaymentMethod === 'standard' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-orange-600" />
                        <span>Paiement standard</span>
                      </h4>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total à payer:</span>
                        <span className="text-orange-600">{formatMoney(grandTotal)}</span>
                      </div>
                      <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                        <Coins className="h-4 w-4" />
                        <span>{grandTotalPoints.toLocaleString()} pts</span>
                      </div>
                    </div>
                  )}

                  {/* Détails du paiement avec points */}
                  {selectedPaymentMethod === 'points' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-yellow-600" />
                        <span>Paiement avec points</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Total de la commande:</span>
                          <div className="text-right">
                            <div className="font-medium">{formatMoney(finalTotal)}</div>
                            <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{finalTotalPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Vos points disponibles:</span>
                          <div className="text-right">
                            <div className="font-medium text-purple-600">{userPoints.toLocaleString()}</div>
                            <div className="text-xs text-purple-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{userPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                        {userPoints >= finalTotalPoints ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="flex items-center space-x-2 text-green-700">
                              <CheckCircle className="h-4 w-4 group-hover:animate-bounce transition-all duration-300" />
                              <span className="font-medium">Paiement possible avec vos points !</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Il vous restera {userPoints - finalTotalPoints} points après l'achat
                            </p>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="flex items-center space-x-2 text-red-700">
                              <AlertCircle className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                              <span className="font-medium">Points insuffisants</span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              Il vous manque {finalTotalPoints - userPoints} points pour finaliser l'achat
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Détails du paiement mixte */}
                  {selectedPaymentMethod === 'mixed' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-orange-600" />
                        <span>Paiement mixte</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Total de la commande:</span>
                          <div className="text-right">
                            <div className="font-medium">{formatMoney(finalTotal)}</div>
                            <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{finalTotalPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Sélecteur de points à utiliser */}
                        <div className="space-y-2">
                          <Label htmlFor="pointsToUse" className="text-sm font-medium">
                            Points à utiliser (max: {Math.min(userPoints, finalTotalPoints)})
                          </Label>
                          <div className="flex space-x-2">
                            <Input
                              id="pointsToUse"
                              type="number"
                              min="0"
                              max={Math.min(userPoints, finalTotalPoints)}
                              value={pointsToUse}
                              onChange={(e) => setPointsToUse(Number(e.target.value))}
                              className="flex-1"
                              placeholder="0"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPointsToUse(Math.min(userPoints, finalTotalPoints))}
                              className="px-3 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                            >
                              <span className="group-hover:animate-pulse transition-all duration-300">Max</span>
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Valeur: {formatMoney(convertPointsToFCFA(pointsToUse))}
                          </p>
                        </div>

                        {/* Calcul du paiement mixte */}
                        {pointsToUse > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="flex justify-between text-sm">
                              <span>Paiement en points:</span>
                              <div className="text-right">
                                <div className="font-medium text-blue-600">-{formatMoney(convertPointsToFCFA(pointsToUse))}</div>
                                <div className="text-xs text-blue-600 flex items-center justify-end space-x-1">
                                  <Coins className="h-3 w-3 group-hover:animate-pulse transition-all duration-300" />
                                  <span>-{pointsToUse.toLocaleString()} pts</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                              <span>Reste à payer:</span>
                              <div className="text-right">
                                <div className="text-orange-600">{formatMoney(Math.max(0, finalTotal - convertPointsToFCFA(pointsToUse)))}</div>
                                <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                                  <Coins className="h-3 w-3 group-hover:animate-pulse transition-all duration-300" />
                                  <span>{Math.max(0, finalTotalPoints - pointsToUse).toLocaleString()} pts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Offre spéciale */}
                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Gift className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h5 className="font-medium text-green-900">Offre spéciale!</h5>
                          <p className="text-sm text-green-700">
                            {(() => {
                              const promoFree = String((appliedPromo as any)?.discount_type ?? '') === 'free_shipping'
                              if (promoFree) {
                                return 'Livraison gratuite: appliquée via votre code promo.'
                              }

                              const buildRuleText = (rule: any) => {
                                if (!rule) return ''
                                const minSubtotal = typeof rule?.minEligibleSubtotalXof === 'number' && Number.isFinite(rule.minEligibleSubtotalXof)
                                  ? rule.minEligibleSubtotalXof
                                  : null
                                const minQty = typeof rule?.minEligibleQty === 'number' && Number.isFinite(rule.minEligibleQty)
                                  ? rule.minEligibleQty
                                  : null

                                const parts: string[] = []
                                if (minSubtotal != null) {
                                  parts.push(`dès ${formatMoney(Math.round(minSubtotal))}`)
                                }
                                if (minQty != null) {
                                  parts.push(`${minQty} article${minQty > 1 ? 's' : ''} minimum`)
                                }

                                const zone = typeof rule?.zone === 'string' && rule.zone !== '*' ? String(rule.zone) : null
                                if (zone) parts.push(`zone ${zone}`)

                                if (rule?.zone === 'local' && typeof rule?.localDistrict === 'string' && rule.localDistrict !== '*') {
                                  parts.push(String(rule.localDistrict))
                                }
                                if (rule?.zone === 'national') {
                                  if (typeof rule?.department === 'string' && rule.department !== '*') parts.push(String(rule.department))
                                  if (typeof rule?.city === 'string' && rule.city !== '*') parts.push(String(rule.city))
                                  if (typeof rule?.arrondissement === 'string' && rule.arrondissement !== '*') parts.push(String(rule.arrondissement))
                                  if (typeof rule?.district === 'string' && rule.district !== '*') parts.push(String(rule.district))
                                }

                                return parts.filter(Boolean).join(' • ')
                              }

                              const cartRows = Array.isArray(cartItemsData) ? cartItemsData : []
                              const uniqueCartIds = Array.from(new Set(cartRows.map((it: any) => String(it?.id ?? '')).filter(Boolean)))

                              const entries = uniqueCartIds.map((pid) => {
                                const rule = (freeShippingRuleByProductId as any)?.[String(pid)] ?? null
                                const row = (Array.isArray(perProductShipping) ? perProductShipping : []).find((r: any) => String(r?.productId ?? '') === String(pid))
                                const productHasFree = Boolean(row?.productFreeShipping)

                                if (rule) {
                                  const txt = buildRuleText(rule)
                                  return { pid, txt: txt || 'condition super-admin' }
                                }

                                if (productHasFree) {
                                  return { pid, txt: 'ce produit est en livraison gratuite' }
                                }

                                return { pid, txt: '' }
                              }).filter((e) => Boolean(e.txt))

                              if (entries.length === 0) {
                                return 'Livraison gratuite: non applicable.'
                              }

                              if (entries.length === 1) {
                                return `Livraison gratuite: ${entries[0].txt}`
                              }

                              const nameById = new Map<string, string>()
                              cartRows.forEach((it: any) => {
                                const pid = String(it?.id ?? '')
                                const name = typeof it?.name === 'string' ? it.name : ''
                                if (pid && name) nameById.set(pid, name)
                              })

                              return `Livraison gratuite: ${entries
                                .map((e) => {
                                  const name = nameById.get(String(e.pid))
                                  return name ? `${name}: ${e.txt}` : e.txt
                                })
                                .join(' | ')}`
                            })()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bouton Gérer les livraisons */}
                  <div className="space-y-3">
                    {requiresShippingCoords ? (
                      <Button
                        onClick={() => setShowDeliveryModal(true)}
                        className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group border-0"
                      >
                        <Truck className="h-5 w-5 mr-2 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300" />
                        <span className="font-semibold">Gérer les livraisons</span>
                        <Badge className="ml-2 bg-white/20 text-white text-xs animate-pulse">
                          Nouveau
                        </Badge>
                      </Button>
                    ) : null}
                    
                    {/* Boutons d'action */}
                    <div className="grid grid-cols-2 gap-3">
                      {allowInstallmentPayment ? (
                        <Button
                          variant="outline"
                          onClick={handleInstallmentPayment}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group h-auto py-3 px-4"
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <CreditCard className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                            <span className="text-xs font-medium leading-tight">Paiement<br />fractionné</span>
                          </div>
                        </Button>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-600">
                          Non disponible
                        </div>
                      )}

                      {allowDeferredPayment ? (
                        <Button
                          variant="outline"
                          onClick={handleDeferredPayment}
                          className="border-purple-200 text-purple-600 hover:bg-blue-50 hover:border-purple-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group h-auto py-3 px-4"
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <Clock className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                            <span className="text-xs font-medium leading-tight">Paiement<br />différé</span>
                          </div>
                        </Button>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs text-slate-600">
                          Non disponible
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={handlePlaceOrder}
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2 group-hover:animate-bounce transition-all duration-300" />
                      {selectedPaymentMethod === 'points' ? (
                        <div className="text-center">
                          <div>Commander avec {grandTotalPoints.toLocaleString()} points</div>
                          <div className="text-sm opacity-90">({formatMoney(grandTotal)})</div>
                        </div>
                      ) : selectedPaymentMethod === 'mixed' && pointsToUse > 0 ? (
                        <div className="text-center">
                          <div>Commander maintenant</div>
                          <div className="text-sm opacity-90">
                            {pointsToUse} pts + {formatMoney(Math.max(0, grandTotal - convertPointsToFCFA(pointsToUse)))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div>Commander maintenant</div>
                          <div className="text-sm opacity-90">{formatMoney(grandTotal)}</div>
                        </div>
                      )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          showInfo('Redirection vers le catalogue...')
                          setTimeout(() => {
                            window.location.href = '/products'
                          }, 1000)
                        }}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce transition-all duration-300" />
                        Plus D'achats
                      </Button>
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                             variant="outline"
                             className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group w-full"
                           >
                             <Share2 className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                             Partager
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent className="w-64 p-2 bg-white border-green-200 shadow-xl rounded-xl">
                           <div className="space-y-2">
                             {/* En-tête du menu */}
                             <div className="text-center py-2 border-b border-gray-100">
                               <h4 className="font-semibold text-gray-900">Partager votre panier</h4>
                               <p className="text-xs text-gray-500">Choisissez votre réseau préféré</p>
                             </div>
                             
                             {/* Réseaux sociaux */}
                             <div className="grid grid-cols-2 gap-2">
                               {/* WhatsApp */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                   const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
                                   window.open(whatsappUrl, '_blank')
                                   showSuccess('Partage WhatsApp lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 hover:text-green-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <MessageCircle className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">WhatsApp</p>
                                   <p className="text-xs text-gray-500">Partage instantané</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Facebook */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}`
                                   const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`
                                   window.open(facebookUrl, '_blank')
                                   showSuccess('Partage Facebook lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Facebook className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Facebook</p>
                                   <p className="text-xs text-gray-500">Partage social</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Twitter/X */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster ! 💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts) 📦 ${cartItems} article${cartItems > 1 ? 's' : ''}`
                                   const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`
                                   window.open(twitterUrl, '_blank')
                                   showSuccess('Partage Twitter lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Twitter className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Twitter</p>
                                   <p className="text-xs text-gray-500">Partage rapide</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Instagram */}
                              <DropdownMenuItem 
                                onClick={() => {
                                  const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                  navigator.clipboard.writeText(shareText)
                                  showSuccess('Texte copié ! Collez-le dans votre story Instagram')
                                }}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-pink-50 hover:text-pink-700 cursor-pointer transition-all duration-300 group/item"
                              >
                                 <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Instagram className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Instagram</p>
                                   <p className="text-xs text-gray-500">Story & posts</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* LinkedIn */}
                              <DropdownMenuItem 
                                onClick={() => {
                                  const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent('Mon Panier Probooster')}&summary=${encodeURIComponent(shareText)}`
                                  window.open(linkedinUrl, '_blank')
                                  showSuccess('Partage LinkedIn lancé !')
                                }}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-300 group/item"
                              >
                                 <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Linkedin className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">LinkedIn</p>
                                   <p className="text-xs text-gray-500">Réseau pro</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Email */}
                              <DropdownMenuItem 
                                onClick={() => {
                                  const shareText = `🛒 Mon panier Probooster !\n\n💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}\n\nDécouvrez mes produits sélectionnés !`
                                  const emailUrl = `mailto:?subject=Mon Panier Probooster&body=${encodeURIComponent(shareText)}`
                                  window.open(emailUrl)
                                  showSuccess('Email de partage lancé !')
                                }}
                                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 hover:text-gray-700 cursor-pointer transition-all duration-300 group/item"
                              >
                                 <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Mail className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Email</p>
                                   <p className="text-xs text-gray-500">Partage par mail</p>
                                 </div>
                               </DropdownMenuItem>
                             </div>

                             {/* Séparateur */}
                             <div className="border-t border-gray-100 my-2"></div>

                             {/* Option Copier */}
                            <DropdownMenuItem 
                              onClick={() => {
                                const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                navigator.clipboard.writeText(shareText)
                                showSuccess('Panier copié dans le presse-papiers !')
                              }}
                              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 hover:text-orange-700 cursor-pointer transition-all duration-300 group/item"
                            >
                               <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                 <Copy className="h-4 w-4 text-white" />
                               </div>
                               <div>
                                 <p className="font-medium text-sm">Copier le lien</p>
                                 <p className="text-xs text-gray-500">Presse-papiers</p>
                               </div>
                             </DropdownMenuItem>

                             {/* Option Partage Natif */}
                            <DropdownMenuItem 
                              onClick={() => {
                                const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${formatMoney(grandTotal)} (${grandTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                if (navigator.share) {
                                  navigator.share({
                                    title: 'Mon Panier Probooster',
                                    text: shareText,
                                    url: window.location.origin
                                  }).then(() => {
                                    showSuccess('Partage réussi !')
                                  }).catch(() => {
                                    showError('Partage annulé')
                                  })
                                } else {
                                  navigator.clipboard.writeText(shareText)
                                  showSuccess('Partage natif non disponible, copié dans le presse-papiers !')
                                }
                              }}
                              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition-all duration-300 group/item"
                            >
                               <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                 <Share2 className="h-4 w-4 text-white" />
                               </div>
                               <div>
                                 <p className="font-medium text-sm">Partage natif</p>
                                 <p className="text-xs text-gray-500">Options système</p>
                               </div>
                             </DropdownMenuItem>
                           </div>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </div>

                  {/* Sécurité et méthodes de paiement */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Paiement 100% sécurisé</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span>Mobile Money • Carte bancaire</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>



      {/* Modal Paiement Fractionné */}
      {showInstallmentModal && installmentDetails && (
        <Dialog open={showInstallmentModal} onOpenChange={setShowInstallmentModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-2xl font-bold text-blue-600">
                <CreditCard className="h-6 w-6" />
                <span>Paiement Fractionné</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Répartissez votre paiement sur {installmentDetails.months} mois
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Résumé de la commande */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-blue-900">Total de la commande</h4>
                      <p className="text-sm text-blue-700">{cartItems} article{cartItems > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatMoney(installmentDetails.total)}
                      </div>
                      <div className="text-sm text-blue-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(installmentDetails.total).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Détails du plan */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span>Plan de Paiement sur {installmentDetails.months} Mois</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Paiement Mensuel</h5>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatMoney(installmentDetails.monthlyPayment)}
                      </div>
                      <div className="text-sm text-blue-600 flex items-center space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(installmentDetails.monthlyPayment).toLocaleString()} pts</span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-2">Dernier Paiement</h5>
                      <div className="text-2xl font-bold text-green-600">
                        {formatMoney(installmentDetails.lastPayment)}
                      </div>
                      <div className="text-sm text-green-600 flex items-center space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(installmentDetails.lastPayment).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendrier des paiements */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Calendrier des Paiements</h5>
                    <div className="space-y-2">
                      {installmentDetails.payments.map((payment: number, index: number) => (
                        <div key={`installment-payment-${index}-${payment}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {installmentDetails.dates[index]}
                              </p>
                              <p className="text-sm text-gray-500">
                                {index === installmentDetails.months - 1 ? 'Dernier paiement' : `${index + 1}ème mensualité`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {formatMoney(payment)}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{convertFCFAToPoints(payment).toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conditions et avantages */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <h5 className="font-medium text-green-900 mb-3 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Avantages du Paiement Fractionné</span>
                  </h5>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Aucun intérêt supplémentaire</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Flexibilité de paiement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Validation immédiate de la commande</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInstallmentModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmInstallment}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmer le Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={showMobileMoneyPaymentModal}
        onOpenChange={(open) => {
          setShowMobileMoneyPaymentModal(open)
          if (!open) {
            setOnlinePaymentStatusMessage('')
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-2xl font-bold text-orange-600">
              <CreditCard className="h-6 w-6" />
              <span>Paiement Mobile Money</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Finalisez votre paiement avant la confirmation de la commande.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Méthode:</span>
                  <span className="font-medium">{String(selectedPaymentOption || 'standard')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Montant:</span>
                  <span className="font-bold text-orange-600">{Number(paymentDetails?.amount ?? 0).toLocaleString()} FCFA</span>
                </div>
                {paymentDetails?.feexpay?.reference ? (
                  <div className="flex justify-between text-sm">
                    <span>Référence FeexPay:</span>
                    <span className="font-mono text-xs">{String(paymentDetails.feexpay.reference)}</span>
                  </div>
                ) : null}
                {paymentDetails?.feexpay?.paymentUrl ? (
                  <div className="text-xs text-gray-600 break-all">
                    {String(paymentDetails.feexpay.paymentUrl)}
                  </div>
                ) : null}
                {isInitializingOnlinePayment ? (
                  <div className="text-xs text-gray-600">Initialisation du paiement…</div>
                ) : null}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowMobileMoneyPaymentModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </Button>

              {(selectedPaymentOption === 'mobile_money' || selectedPaymentOption === 'card') ? (
                <Button
                  onClick={() => void handleVerifyAndConfirmOnlinePayment()}
                  disabled={isInitializingOnlinePayment || isVerifyingOnlinePayment || !paymentDetails?.feexpay?.reference}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  {isVerifyingOnlinePayment ? 'Vérification…' : 'Vérifier et confirmer'}
                </Button>
              ) : null}
            </div>

            {onlinePaymentStatusMessage ? (
              <div className="text-xs text-gray-700 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">{onlinePaymentStatusMessage}</div>
                  {(onlinePaymentStatusMessage.toLowerCase().includes('décliné') || onlinePaymentStatusMessage.toLowerCase().includes('expir')) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isInitializingOnlinePayment}
                      onClick={() => void initializeFeexPayOnlinePayment({ force: true })}
                      className="h-7 px-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Réessayer
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {paymentDetails?.feexpay?.paymentUrl ? (
              <Button
                onClick={() => {
                  try {
                    const url = String(paymentDetails.feexpay.paymentUrl)
                    if (url) {
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }
                  } catch {
                    // ignore
                  }
                }}
                variant="outline"
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Ouvrir la page de paiement
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCardPaymentModal} onOpenChange={setShowCardPaymentModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-2xl font-bold text-orange-600">
              <CreditCard className="h-6 w-6" />
              <span>Paiement Carte bancaire</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Finalisez votre paiement avant la confirmation de la commande.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Méthode:</span>
                  <span className="font-medium">{String(selectedPaymentOption || 'standard')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Montant:</span>
                  <span className="font-bold text-orange-600">{Number(paymentDetails?.amount ?? 0).toLocaleString()} FCFA</span>
                </div>
                {paymentDetails?.feexpay?.reference ? (
                  <div className="flex justify-between text-sm">
                    <span>Référence FeexPay:</span>
                    <span className="font-mono text-xs">{String(paymentDetails.feexpay.reference)}</span>
                  </div>
                ) : null}
                {paymentDetails?.feexpay?.paymentUrl ? (
                  <div className="text-xs text-gray-600 break-all">
                    {String(paymentDetails.feexpay.paymentUrl)}
                  </div>
                ) : null}
                {isInitializingOnlinePayment ? (
                  <div className="text-xs text-gray-600">Initialisation du paiement…</div>
                ) : null}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCardPaymentModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Fermer
              </Button>

              {(selectedPaymentOption === 'mobile_money' || selectedPaymentOption === 'card') ? (
                <Button
                  onClick={() => void handleVerifyAndConfirmOnlinePayment()}
                  disabled={isInitializingOnlinePayment || isVerifyingOnlinePayment || !paymentDetails?.feexpay?.reference}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  {isVerifyingOnlinePayment ? 'Vérification…' : 'Vérifier et confirmer'}
                </Button>
              ) : null}
            </div>

            {paymentDetails?.feexpay?.paymentUrl ? (
              <Button
                onClick={() => {
                  try {
                    const url = String(paymentDetails.feexpay.paymentUrl)
                    if (url) {
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }
                  } catch {
                    // ignore
                  }
                }}
                variant="outline"
                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                Ouvrir la page de paiement
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Paiement Différé */}
      {showDeferredModal && deferredDetails && (
        <Dialog open={showDeferredModal} onOpenChange={setShowDeferredModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-2xl font-bold text-purple-600">
                <Clock className="h-6 w-6" />
                <span>Paiement Différé</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Payez dans {deferredDetails.days} jours avec un délai de grâce
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Résumé de la commande */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-purple-900">Total de la commande</h4>
                      <p className="text-sm text-purple-700">{cartItems} article{cartItems > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {deferredDetails.originalTotal.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-purple-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(deferredDetails.originalTotal).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Détails du plan différé */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    <span>Détails du Paiement Différé</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h5 className="font-medium text-purple-900 mb-2">Montant Original</h5>
                      <div className="text-2xl font-bold text-purple-600">
                        {deferredDetails.originalTotal.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-purple-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(deferredDetails.originalTotal).toLocaleString()} pts</span>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h5 className="font-medium text-red-900 mb-2">Montant Final</h5>
                      <div className="text-2xl font-bold text-red-600">
                        {deferredDetails.deferredTotal.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-red-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(deferredDetails.deferredTotal).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Détails des intérêts */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h5 className="font-medium text-yellow-900 mb-3 flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Détails des Intérêts</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-yellow-700 font-medium">Intérêts Totaux</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {deferredDetails.totalInterest.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-yellow-700 font-medium">Intérêts Quotidiens</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {deferredDetails.dailyInterest.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-yellow-700 font-medium">Taux Effectif</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {Math.round(((deferredDetails.deferredTotal / deferredDetails.originalTotal) - 1) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calendrier de paiement */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Échéance de Paiement</h5>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-purple-900">Date Limite</p>
                          <p className="text-sm text-purple-700">Paiement complet requis</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-purple-600">
                            {deferredDetails.finalDate}
                          </div>
                          <div className="text-sm text-purple-600">
                            Dans {deferredDetails.days} jours
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conditions et avertissements */}
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-4">
                  <h5 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Conditions et Avertissements</span>
                  </h5>
                  <ul className="space-y-2 text-sm text-orange-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Intérêts de 15% appliqués après le délai</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Paiement complet requis à l'échéance</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Pas de paiement partiel autorisé</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeferredModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmDeferred}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <Clock className="h-4 w-4 mr-2" />
                Confirmer le Délai
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Commande */}
      {showOrderModal && (
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-3xl font-bold text-orange-600">
                <ShoppingCart className="h-8 w-8" />
                <span>Finaliser votre Commande</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-lg">
                Complétez vos informations et confirmez votre commande
              </DialogDescription>
            </DialogHeader>

            <div className="pt-2">
              <EditableMessagesBanner location="checkout" />
            </div>
            
            <div className="space-y-8">
              {orderStep === 0 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                        <User className="h-5 w-5 text-orange-600" />
                        <span>Connexion requise</span>
                      </CardTitle>
                      <CardDescription>
                        {authPromptMessage || 'Connectez-vous ou créez un compte pour continuer le paiement.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant={authMode === 'login' ? 'default' : 'outline'}
                          className={authMode === 'login' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-200 text-orange-700'}
                          onClick={() => setAuthMode('login')}
                        >
                          Se connecter
                        </Button>
                        <Button
                          type="button"
                          variant={authMode === 'register' ? 'default' : 'outline'}
                          className={authMode === 'register' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-orange-200 text-orange-700'}
                          onClick={() => setAuthMode('register')}
                        >
                          Créer un compte
                        </Button>
                      </div>

                      {authError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {authError}
                        </div>
                      ) : null}

                      {authMode === 'login' ? (
                        <form onSubmit={handleInlineLogin} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="inline-login-email">Email</Label>
                            <Input
                              id="inline-login-email"
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="votre@email.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inline-login-password">Mot de passe</Label>
                            <Input
                              id="inline-login-password"
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="Votre mot de passe"
                            />
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white"
                            disabled={isAuthLoading}
                          >
                            {isAuthLoading ? 'Connexion…' : 'Continuer'}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={handleInlineRegister} className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="inline-register-firstName">Prénom</Label>
                              <Input
                                id="inline-register-firstName"
                                value={authFirstName}
                                onChange={(e) => setAuthFirstName(e.target.value)}
                                placeholder="Votre prénom"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inline-register-lastName">Nom</Label>
                              <Input
                                id="inline-register-lastName"
                                value={authLastName}
                                onChange={(e) => setAuthLastName(e.target.value)}
                                placeholder="Votre nom"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="inline-register-email">Email</Label>
                            <Input
                              id="inline-register-email"
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="votre@email.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="inline-register-phone">Téléphone</Label>
                            <Input
                              id="inline-register-phone"
                              value={authPhone}
                              onChange={(e) => setAuthPhone(e.target.value)}
                              placeholder="+225 0123456789"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="inline-register-password">Mot de passe</Label>
                              <Input
                                id="inline-register-password"
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="inline-register-confirm">Confirmation</Label>
                              <Input
                                id="inline-register-confirm"
                                type="password"
                                value={authConfirmPassword}
                                onChange={(e) => setAuthConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="inline-register-terms"
                              checked={authAcceptTerms}
                              onCheckedChange={(checked) => setAuthAcceptTerms(Boolean(checked))}
                            />
                            <Label htmlFor="inline-register-terms" className="text-sm">
                              J'accepte les conditions d'utilisation
                            </Label>
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white"
                            disabled={isAuthLoading}
                          >
                            {isAuthLoading ? 'Création…' : 'Continuer'}
                          </Button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Étapes de la commande */}
              {orderStep !== 0 && (
                <div className="flex items-center justify-center space-x-4 mb-6">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={`order-step-${step}`} className="flex items-center space-x-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                        orderStep >= step 
                          ? 'bg-orange-500 text-white shadow-lg scale-110' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`w-16 h-1 rounded-full transition-all duration-300 ${
                          orderStep > step ? 'bg-orange-500' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Étape 1: Informations de livraison */}
              {orderStep === 1 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-blue-900">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <span>Informations de Livraison</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700">
                            Adresse de livraison
                          </Label>
                          <Input
                            id="deliveryAddress"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="123 Rue Principale, Ville, Pays"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
                            Téléphone
                          </Label>
                          <Input
                            id="customerPhone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+225 0123456789"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerEmail" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      {requiresShippingCoords ? (
                        <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-orange-600" />
                              <p className="text-sm font-medium text-orange-900">
                                Coordonnées GPS de livraison (obligatoire pour produits physiques)
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isDetectingGps}
                              onClick={() => void handleDetectGps()}
                              className="border-orange-200 bg-white text-orange-700 hover:bg-orange-100"
                            >
                              {isDetectingGps ? 'Détection…' : 'Détecter ma position'}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="shippingLat" className="text-sm font-medium text-orange-900">
                                Latitude *
                              </Label>
                              <Input
                                id="shippingLat"
                                value={shippingLat}
                                onChange={(e) => setShippingLat(e.target.value)}
                                placeholder="ex: 5.345678"
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="shippingLng" className="text-sm font-medium text-orange-900">
                                Longitude *
                              </Label>
                              <Input
                                id="shippingLng"
                                value={shippingLng}
                                onChange={(e) => setShippingLng(e.target.value)}
                                placeholder="ex: -4.012345"
                                className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                          </div>

                          <p className="text-xs text-orange-800">
                            Astuce: si l'adresse de livraison est différente de votre position actuelle, saisissez manuellement les coordonnées.
                          </p>
                        </div>
                      ) : null}
 
                      {/* Options de livraison */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Mode de livraison</Label>
                        <RadioGroup
                          value={selectedDeliveryOption}
                          onValueChange={(v) => {
                            setSelectedDeliveryOption(v)
                            if (v === 'none') {
                              setSelectedDeliveryMethod('standard')
                              setRequiresShippingCoords(false)
                              setShippingLat('')
                              setShippingLng('')
                              return
                            }
                            if (v === 'express') {
                              setSelectedDeliveryMethod('express')
                              return
                            }
                            if (v === 'pickup') {
                              setSelectedDeliveryMethod('standard')
                              return
                            }
                            setSelectedDeliveryMethod('standard')
                          }}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="standard" id="standard" />
                              <Label htmlFor="standard" className="cursor-pointer">
                                <div className="font-medium">Livraison Standard</div>
                                <div className="text-sm text-gray-500">
                                  3-5 jours ouvrés{standardBasePrice != null ? ` • ${standardBasePrice.toLocaleString()} FCFA` : ''}
                                </div>
                              </Label>
                            </div>

                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="express" id="express" />
                              <Label htmlFor="express" className="cursor-pointer">
                                <div className="font-medium">Livraison Express</div>
                                <div className="text-sm text-gray-500">
                                  1-2 jours ouvrés{expressBasePrice != null ? ` • ${expressBasePrice.toLocaleString()} FCFA` : ''}
                                </div>
                              </Label>
                            </div>

                            {(() => {
                              const pickupAvailable = pickupPoints.enabled && pickupPoints.points.length > 0
                              return (
                                <div
                                  className={`flex items-center space-x-2 p-3 border border-gray-200 rounded-lg transition-all duration-300 ${
                                    pickupAvailable
                                      ? 'hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                                      : 'opacity-60 cursor-not-allowed'
                                  }`}
                                >
                                  <RadioGroupItem value="pickup" id="pickup" disabled={!pickupAvailable} />
                                  <Label htmlFor="pickup" className={pickupAvailable ? 'cursor-pointer' : 'cursor-not-allowed'}>
                                    <div className="font-medium">Point Relais</div>
                                    <div className="text-sm text-gray-500">
                                      {pickupAvailable
                                        ? `Retrait en magasin${pickupBasePrice != null ? ` • dès ${pickupBasePrice.toLocaleString()} FCFA` : ''}`
                                        : 'Indisponible'}
                                    </div>
                                  </Label>
                                </div>
                              )
                            })()}

                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="none" id="none" />
                              <Label htmlFor="none" className="cursor-pointer">
                                <div className="font-medium">Pas de livraison</div>
                                <div className="text-sm text-gray-500">Produit numérique / retrait libre • 0 FCFA</div>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>

                        {selectedDeliveryOption === 'pickup' && pickupPoints.enabled && pickupPoints.points.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Choisir un point relais</Label>
                            <Select value={selectedPickupPoint?.id ?? ''} onValueChange={(v) => setSelectedPickupPointId(String(v ?? ''))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent>
                                {pickupPoints.points.map((p: any) => {
                                  const label = `${p.name}${p.city ? ` • ${p.city}` : ''}${p.priceXof ? ` • ${Math.ceil(p.priceXof).toLocaleString()} FCFA` : ''}`
                                  return (
                                    <SelectItem key={`pickup-${p.id}`} value={p.id}>
                                      {label}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                      </div>
                      
                      {/* Résumé des options de paiement sélectionnées */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                        <h5 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-orange-600" />
                          <span>Options de Paiement Sélectionnées</span>
                        </h5>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-orange-700">Mode de paiement:</span>
                            <span className="font-medium text-orange-900">
                              {selectedPaymentMethod === 'points' ? 'Paiement avec Points' :
                               selectedPaymentMethod === 'mixed' ? 'Paiement Mixte' :
                               selectedPaymentMethod === 'fcf' ? 'Paiement FCFA' : 'Standard'}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-orange-700">Mode de livraison:</span>
                            <span className="font-medium text-orange-900">
                              {selectedDeliveryOption === 'express'
                                ? `Express${shippingCost > 0 ? ` • ${shippingCost.toLocaleString()} FCFA` : ''}`
                                : selectedDeliveryOption === 'pickup'
                                  ? `Point Relais${shippingCost > 0 ? ` • ${shippingCost.toLocaleString()} FCFA` : ' • 0 FCFA'}`
                                  : selectedDeliveryOption === 'none'
                                    ? 'Pas de livraison • 0 FCFA'
                                  : `Standard${shippingCost > 0 ? ` • ${shippingCost.toLocaleString()} FCFA` : ''}`}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-yellow-700">
                            <span>Frais de livraison (pts):</span>
                            <span className="font-medium">{shippingCostPoints.toLocaleString()} pts</span>
                          </div>
                          
                          {usePoints && (
                            <div className="flex justify-between items-center text-green-700">
                              <span>Points à utiliser:</span>
                              <span className="font-medium">
                                {pointsToUse.toLocaleString()} pts
                              </span>
                            </div>
                          )}
                          
                          {installmentDetails && (
                            <div className="flex justify-between items-center text-blue-700">
                              <span>Paiement fractionné:</span>
                              <span className="font-medium">
                                {installmentPlan} mois - {installmentDetails.monthlyPayment.toLocaleString()} FCFA/mois
                              </span>
                            </div>
                          )}
                          
                          {deferredDetails && (
                            <div className="flex justify-between items-center text-purple-700">
                              <span>Paiement différé:</span>
                              <span className="font-medium">
                                {deferredDays} jours - {deferredDetails.deferredTotal.toLocaleString()} FCFA
                              </span>
                            </div>
                          )}
                          
                          <div className="pt-2 border-t border-orange-200">
                            <div className="flex justify-between items-center font-medium">
                              <span>Total à payer:</span>
                              <span className="text-lg text-orange-600">
                                {grandTotal.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{grandTotalPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Étape 2: Résumé de la commande */}
              {orderStep === 2 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-green-900">
                        <Package className="h-5 w-5 text-green-600" />
                        <span>Résumé de votre Commande</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Articles commandés */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Articles commandés ({cartItems})</h4>
                        {cartItemsData.map((item, index) => (
                          <div key={`order-item-${item.id}-${index}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                                {freeShippingByProductId.get(String(item.id)) && (
                                  <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    Livraison gratuite
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {(item.price * item.quantity).toLocaleString()} FCFA
                              </p>
                              <p className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                                <Coins className="h-3 w-3" />
                                <span>{convertFCFAToPoints(item.price * item.quantity).toLocaleString()} pts</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Détails des prix */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sous-total:</span>
                          <span className="font-medium">{cartTotal.toLocaleString()} FCFA</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                          <Coins className="h-3 w-3" />
                          <span>{cartTotalPoints.toLocaleString()} pts</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Livraison:</span>
                          <span className="font-medium">
                            {isFreeShippingEffective ? 'Gratuite' : `${shippingCost.toLocaleString()} FCFA`}
                          </span>
                        </div>
                        
                        {pointsDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Réduction points:</span>
                            <span className="font-medium">-{pointsDiscount.toLocaleString()} FCFA</span>
                          </div>
                        )}
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-orange-600">{finalTotal.toLocaleString()} FCFA</span>
                          </div>
                          <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                            <Coins className="h-3 w-3" />
                            <span>{finalTotalPoints.toLocaleString()} pts</span>
                          </div>
                        </div>
                        
                        {/* Informations de paiement sélectionnées */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                              <CreditCard className="h-4 w-4" />
                              <span>Mode de Paiement Sélectionné</span>
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Méthode:</span>
                                <span className="font-medium text-blue-700">
                                  {orderDetails.paymentDetails.method === 'points' ? 'Paiement avec Points' :
                                   orderDetails.paymentDetails.method === 'mixed' ? 'Paiement Mixte' :
                                   orderDetails.paymentDetails.method === 'fcf' ? 'Paiement FCFA' : 'Standard'}
                                </span>
                              </div>
                              
                              {orderDetails.paymentDetails.usePoints && (
                                <div className="flex justify-between text-green-700">
                                  <span>Points utilisés:</span>
                                  <span className="font-medium">
                                    {orderDetails.paymentDetails.pointsUsed.toLocaleString()} pts
                                  </span>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="flex justify-between text-purple-700">
                                  <span>Paiement fractionné:</span>
                                  <span className="font-medium">
                                    {orderDetails.paymentDetails.installmentPlan.months} mois
                                  </span>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="flex justify-between text-orange-700">
                                  <span>Paiement différé:</span>
                                  <span className="font-medium">
                                    {orderDetails.paymentDetails.deferredPlan.days} jours
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Étape 3: Confirmation et paiement */}
              {orderStep === 3 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                        <span>Confirmation et Paiement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Récapitulatif final */}
                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <h5 className="font-medium text-orange-900 mb-3">Récapitulatif de la commande</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><span className="font-medium">Adresse:</span> {deliveryAddress}</p>
                            <p><span className="font-medium">Téléphone:</span> {customerPhone}</p>
                            <p><span className="font-medium">Email:</span> {customerEmail}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Livraison:</span> {selectedDeliveryOption}</p>
                            <p><span className="font-medium">Paiement:</span> {selectedPaymentMethod}</p>
                            <p><span className="font-medium">Total:</span> {finalTotal.toLocaleString()} FCFA</p>
                            <p className="text-yellow-600 flex items-center space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{finalTotalPoints.toLocaleString()} pts</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Détails du plan de paiement sélectionné */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-4 pt-4 border-t border-orange-200">
                            <h6 className="font-medium text-orange-800 mb-2">Plan de Paiement</h6>
                            <div className="space-y-2 text-sm">
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <div className="flex items-center space-x-2 text-blue-700">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-medium">Paiement Fractionné</span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                                    <div>
                                      <span className="text-blue-600">Mensualité:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.monthlyPayment.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Durée:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.months} mois</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <div className="flex items-center space-x-2 text-purple-700">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Paiement Différé</span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                                    <div>
                                      <span className="text-blue-600">Montant final:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.finalTotal.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Délai:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.days} jours</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.usePoints && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center space-x-2 text-green-700">
                                    <Coins className="h-4 w-4" />
                                    <span className="font-medium">Points Utilisés</span>
                                  </div>
                                  <div className="mt-2 text-xs">
                                    <div className="mb-1">
                                      <span className="text-green-600">Points appliqués:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.pointsUsed.toLocaleString()} pts</div>
                                    </div>
                                    <div>
                                      <span className="text-green-600">Économies:</span>
                                      <div className="font-bold">-{orderDetails.paymentDetails.pointsDiscount.toLocaleString()} FCFA</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Méthodes de paiement */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Méthode de paiement</Label>
                        <RadioGroup value={selectedPaymentOption} onValueChange={setSelectedPaymentOption}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="mobile_money" id="mobile_money" />
                              <Label htmlFor="mobile_money" className="cursor-pointer">
                                <div className="font-medium">Mobile Money</div>
                                <div className="text-sm text-gray-500">MTN, Moov, Celtiis, Coris (Bénin)</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="card" id="card" />
                              <Label htmlFor="card" className="cursor-pointer">
                                <div className="font-medium">Carte Bancaire</div>
                                <div className="text-sm text-gray-500">Visa, Mastercard</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="cash" id="cash" />
                              <Label htmlFor="cash" className="cursor-pointer">
                                <div className="font-medium">Paiement à la livraison</div>
                                <div className="text-sm text-gray-500">Espèces ou carte</div>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      {selectedPaymentOption === 'mobile_money' ? (
                        <div className="mt-4 space-y-4 rounded-lg border border-orange-200 bg-white p-4">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Réseau Mobile Money *</Label>
                            <RadioGroup value={mobileMoneyNetwork} onValueChange={(v) => setMobileMoneyNetwork(v as any)}>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                                  <RadioGroupItem value="mtn" id="mm_mtn" />
                                  <Label htmlFor="mm_mtn" className="cursor-pointer">
                                    <div className="font-medium">MTN</div>
                                    <div className="text-xs text-gray-500">Bénin</div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                                  <RadioGroupItem value="moov" id="mm_moov" />
                                  <Label htmlFor="mm_moov" className="cursor-pointer">
                                    <div className="font-medium">Moov</div>
                                    <div className="text-xs text-gray-500">Bénin</div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                                  <RadioGroupItem value="celtiis" id="mm_celtiis" />
                                  <Label htmlFor="mm_celtiis" className="cursor-pointer">
                                    <div className="font-medium">Celtiis</div>
                                    <div className="text-xs text-gray-500">Bénin</div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                                  <RadioGroupItem value="coris" id="mm_coris" />
                                  <Label htmlFor="mm_coris" className="cursor-pointer">
                                    <div className="font-medium">Coris</div>
                                    <div className="text-xs text-gray-500">Bénin</div>
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mmCountryCode" className="text-sm font-medium text-gray-700">Indicatif *</Label>
                              <Input
                                id="mmCountryCode"
                                value={mobileMoneyCountryCode}
                                onChange={(e) => setMobileMoneyCountryCode(e.target.value)}
                                placeholder="+225"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mmPhone" className="text-sm font-medium text-gray-700">Numéro Mobile Money *</Label>
                              <Input
                                id="mmPhone"
                                value={mobileMoneyPhone}
                                onChange={(e) => setMobileMoneyPhone(e.target.value)}
                                placeholder="0123456789"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mmOwner" className="text-sm font-medium text-gray-700">Nom et prénoms</Label>
                            <Input
                              id="mmOwner"
                              value={mobileMoneyOwnerName}
                              onChange={(e) => setMobileMoneyOwnerName(e.target.value)}
                              placeholder="Nom et prénoms"
                              className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mmDescription" className="text-sm font-medium text-gray-700">Description</Label>
                            <Textarea
                              id="mmDescription"
                              value={paymentDescription}
                              onChange={(e) => setPaymentDescription(e.target.value)}
                              placeholder="Détails de la commande..."
                              rows={3}
                              className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 resize-none"
                            />
                          </div>
                        </div>
                      ) : null}

                      {selectedPaymentOption === 'card' ? (
                        <div className="mt-4 space-y-4 rounded-lg border border-orange-200 bg-white p-4">
                          <div className="space-y-2">
                            <Label htmlFor="cardHolder" className="text-sm font-medium text-gray-700">Nom sur la carte (optionnel)</Label>
                            <Input
                              id="cardHolder"
                              value={cardHolderName}
                              onChange={(e) => setCardHolderName(e.target.value)}
                              placeholder="Nom complet"
                              className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Numéro de carte *</Label>
                            <Input
                              id="cardNumber"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="XXXX XXXX XXXX XXXX"
                              className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="cardExpiry" className="text-sm font-medium text-gray-700">Expiration (MM/AA) *</Label>
                              <Input
                                id="cardExpiry"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12/27"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cardCvv" className="text-sm font-medium text-gray-700">CVV *</Label>
                              <Input
                                id="cardCvv"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                placeholder="123"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {selectedPaymentOption === 'cash' ? (
                        <div className="mt-4 space-y-4 rounded-lg border border-orange-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-4">
                            <Label className="text-sm font-medium text-gray-700">Le receveur du paiement est moi</Label>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCashReceiverIsMe((v) => !v)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {cashReceiverIsMe ? 'Oui' : 'Non'}
                            </Button>
                          </div>
                          {!cashReceiverIsMe ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="cashName" className="text-sm font-medium text-gray-700">Nom du receveur *</Label>
                                <Input
                                  id="cashName"
                                  value={cashReceiverName}
                                  onChange={(e) => setCashReceiverName(e.target.value)}
                                  placeholder="Nom et prénom"
                                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cashPhone" className="text-sm font-medium text-gray-700">Téléphone du receveur *</Label>
                                <Input
                                  id="cashPhone"
                                  value={cashReceiverPhone}
                                  onChange={(e) => setCashReceiverPhone(e.target.value)}
                                  placeholder="+225 0123456789"
                                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Conditions et sécurité */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Sécurité et Conditions</p>
                            <ul className="space-y-1 text-xs">
                              <li>• Vos données sont protégées et chiffrées</li>
                              <li>• Aucun prélèvement avant validation</li>
                              <li>• Droit de rétractation de 14 jours</li>
                              <li>• Support client disponible 24/7</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Étape 4: Récapitulatif final et validation */}
              {orderStep === 4 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-green-900">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Validation Finale de la Commande</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Résumé complet de la commande */}
                      <div className="bg-white p-6 rounded-lg border border-green-200">
                        <h5 className="font-medium text-green-900 mb-4 text-lg">Récapitulatif Complet</h5>
                        
                        {/* Informations de livraison */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h6 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                            <Truck className="h-4 w-4" />
                            <span>Informations de Livraison</span>
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><span className="font-medium">Adresse:</span> {deliveryAddress}</p>
                              <p><span className="font-medium">Téléphone:</span> {customerPhone}</p>
                              <p><span className="font-medium">Email:</span> {customerEmail}</p>
                            </div>
                            <div>
                              <p><span className="font-medium">Mode:</span> {selectedDeliveryOption}</p>
                              <p><span className="font-medium">Délai estimé:</span> 
                                {selectedDeliveryOption === 'express' ? '1-2 jours' : 
                                 selectedDeliveryOption === 'pickup' ? 'Immédiat' : '3-5 jours'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Résumé des articles */}
                        <div className="mb-6">
                          <h6 className="font-medium text-green-900 mb-3">Articles Commandés</h6>
                          <div className="space-y-2">
                            {cartItemsData.map((item, index) => (
                              <div key={`final-order-item-${item.id}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{item.name} x{item.quantity}</span>
                                <span className="font-medium text-sm">
                                  {(item.price * item.quantity).toLocaleString()} FCFA
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Détails financiers */}
                        <div className="border-t pt-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Sous-total:</span>
                              <span className="font-medium">{cartTotal.toLocaleString()} FCFA</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{cartTotalPoints.toLocaleString()} pts</span>
                            </div>
                            
                            {pointsDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Réduction points:</span>
                                <span className="font-medium">-{pointsDiscount.toLocaleString()} FCFA</span>
                              </div>
                            )}
                            
                            <div className="border-t pt-2">
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total Final:</span>
                                <span className="text-green-600">{finalTotal.toLocaleString()} FCFA</span>
                              </div>
                              <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                                <Coins className="h-3 w-3" />
                                <span>{finalTotalPoints.toLocaleString()} pts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Détails du plan de paiement sélectionné */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <h6 className="font-medium text-green-900 mb-3">Plan de Paiement Sélectionné</h6>
                            <div className="space-y-3">
                              {/* Mode de paiement */}
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-2 text-blue-700 mb-2">
                                  <CreditCard className="h-4 w-4" />
                                  <span className="font-medium">Mode de Paiement</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-blue-600">Type:</span>
                                  <span className="font-medium ml-2">
                                    {orderDetails.paymentDetails.method === 'points' ? 'Paiement avec Points' :
                                     orderDetails.paymentDetails.method === 'mixed' ? 'Paiement Mixte' :
                                     orderDetails.paymentDetails.method === 'fcf' ? 'Paiement FCFA' : 'Standard'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Paiement fractionné */}
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <div className="flex items-center space-x-2 text-purple-700 mb-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-medium">Paiement Fractionné</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-purple-600">Mensualité:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.monthlyPayment.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-purple-600">Durée:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.months} mois</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Paiement différé */}
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                  <div className="flex items-center space-x-2 text-orange-700 mb-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Paiement Différé</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-orange-600">Montant final:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.finalTotal.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-orange-600">Délai:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.days} jours</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Points utilisés */}
                              {orderDetails.paymentDetails.usePoints && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center space-x-2 text-green-700 mb-2">
                                    <Coins className="h-4 w-4" />
                                    <span className="font-medium">Points Utilisés</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-green-600">Points appliqués:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.pointsUsed.toLocaleString()} pts</div>
                                    </div>
                                    <div>
                                      <span className="text-green-600">Économies:</span>
                                      <div className="font-bold">-{orderDetails.paymentDetails.pointsDiscount.toLocaleString()} FCFA</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                                              {/* Calcul final du montant à payer */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <h6 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                              <Calculator className="h-4 w-4" />
                              <span>Calcul Final du Paiement</span>
                            </h6>
                            <div className="space-y-3">
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="bg-white p-3 rounded-lg border border-orange-200">
                                  <div className="text-center">
                                    <p className="text-sm text-orange-700 mb-2">Montant de la 1ère mensualité</p>
                                    <div className="text-2xl font-bold text-orange-600">
                                      {orderDetails.paymentDetails.installmentPlan.monthlyPayment.toLocaleString()} FCFA
                                    </div>
                                    <div className="text-sm text-yellow-600 flex items-center justify-center space-x-1 mt-1">
                                      <Coins className="h-3 w-3" />
                                      <span>{convertFCFAToPoints(orderDetails.paymentDetails.installmentPlan.monthlyPayment).toLocaleString()} pts</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                      Puis {orderDetails.paymentDetails.installmentPlan.months - 1} mensualités de même montant
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-white p-3 rounded-lg border border-orange-200">
                                  <div className="text-center">
                                    <p className="text-sm text-orange-700 mb-2">Montant à payer dans {orderDetails.paymentDetails.deferredPlan.days} jours</p>
                                    <div className="text-2xl font-bold text-orange-600">
                                      {orderDetails.paymentDetails.deferredPlan.finalTotal.toLocaleString()} FCFA
                                    </div>
                                    <div className="text-sm text-yellow-600 flex items-center justify-center space-x-1 mt-1">
                                      <Coins className="h-3 w-3" />
                                      <span>{convertFCFAToPoints(orderDetails.paymentDetails.deferredPlan.finalTotal).toLocaleString()} pts</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                      Intérêts: +{orderDetails.paymentDetails.deferredPlan.interest.toLocaleString()} FCFA
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.usePoints && !orderDetails.paymentDetails.installmentPlan && !orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-white p-3 rounded-lg border border-orange-200">
                                  <div className="text-center">
                                    <p className="text-sm text-orange-700 mb-2">Montant final à payer</p>
                                    <div className="text-2xl font-bold text-orange-600">
                                      {orderDetails.paymentDetails.finalTotal.toLocaleString()} FCFA
                                    </div>
                                    <div className="text-sm text-yellow-600 flex items-center justify-center space-x-1 mt-1">
                                      <Coins className="h-3 w-3" />
                                      <span>{convertFCFAToPoints(orderDetails.paymentDetails.finalTotal).toLocaleString()} pts</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                      Après application de {orderDetails.paymentDetails.pointsUsed.toLocaleString()} points
                                    </p>
                                  </div>
                                </div>
                              )}

                              {!orderDetails.paymentDetails.installmentPlan &&
                                !orderDetails.paymentDetails.deferredPlan &&
                                !orderDetails.paymentDetails.usePoints && (
                                  <div className="bg-white p-3 rounded-lg border border-orange-200">
                                    <div className="text-center">
                                      <p className="text-sm text-orange-700 mb-2">Montant final à payer</p>
                                      <div className="text-2xl font-bold text-orange-600">
                                        {Number(orderDetails.paymentDetails.finalTotal ?? 0).toLocaleString()} FCFA
                                      </div>
                                      <div className="text-sm text-yellow-600 flex items-center justify-center space-x-1 mt-1">
                                        <Coins className="h-3 w-3" />
                                        <span>
                                          {Number(orderDetails.paymentDetails.finalTotalPoints ?? convertFCFAToPoints(Number(orderDetails.paymentDetails.finalTotal ?? 0))).toLocaleString()} pts
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                        
                        {/* Avertissement final */}
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                              <p className="font-medium mb-1">Important</p>
                              <p>En confirmant cette commande, vous acceptez les conditions de vente et de livraison. 
                              Aucun prélèvement ne sera effectué avant la validation de votre commande.</p>
                            </div>
                          </div>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation entre étapes */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setOrderStep(Math.max(1, orderStep - 1))}
                  disabled={orderStep === 1}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                
                <div className="flex space-x-3">
                  {orderStep < 4 ? (
                    <Button
                      onClick={() => {
                        if (orderStep === 1 && !canProceedOrderStep1) {
                          showInfo(
                            requiresShippingCoords
                              ? 'Veuillez renseigner une adresse, un téléphone et un email valides avant de continuer.'
                              : 'Veuillez renseigner un téléphone et un email valides avant de continuer.'
                          )
                          return
                        }

                        if (orderStep === 3 && !canProceedOrderStep3) {
                          showInfo('Veuillez sélectionner une méthode de paiement et compléter les informations requises.')
                          return
                        }

                        // Construire la commande au moment d’entrer sur l’étape de confirmation (étape 4)
                        // afin d’éviter le reset à l’étape 1 au clic sur "Confirmer la Commande".
                        if (orderStep === 3) {
                          try {
                            const paymentDetails = {
                              method: selectedPaymentMethod,
                              usePoints: usePoints,
                              pointsUsed: pointsToUse,
                              pointsDiscount: pointsDiscount,
                              finalTotal: finalTotal,
                              finalTotalPoints: finalTotalPoints,
                              installmentPlan: installmentDetails
                                ? {
                                    type: 'installment',
                                    months: installmentPlan,
                                    monthlyPayment: installmentDetails.monthlyPayment,
                                    totalPayments: installmentDetails.total
                                  }
                                : null,
                              deferredPlan: deferredDetails
                                ? {
                                    type: 'deferred',
                                    days: deferredDays,
                                    originalTotal: deferredDetails.originalTotal,
                                    finalTotal: deferredDetails.deferredTotal,
                                    interest: deferredDetails.totalInterest
                                  }
                                : null
                            }

                            const nextOrder = {
                              id: orderDetails?.id ?? `ORDER_${Date.now()}`,
                              items: cartItemsData,
                              total: cartItemsData.reduce((sum, item) => sum + item.price * item.quantity, 0),
                              deliveryAddress,
                              customerPhone,
                              customerEmail,
                              deliveryOption: selectedDeliveryOption,
                              paymentDetails,
                              orderDate: orderDetails?.orderDate ?? new Date().toISOString(),
                              status: orderDetails?.status ?? 'pending'
                            }

                            setOrderDetails(nextOrder)
                          } catch (e) {
                            console.error('Erreur lors de la préparation de la commande (étape 4):', e)
                            showError('Erreur lors de la préparation de la commande')
                            return
                          }
                        }

                        setOrderStep(orderStep + 1)
                      }}
                      disabled={(orderStep === 1 && !canProceedOrderStep1) || (orderStep === 3 && !canProceedOrderStep3)}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      Suivant
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinalizePayment}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-semibold transform hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmer la Commande
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal des Codes Promo */}
      <Dialog open={showPromoModal} onOpenChange={setShowPromoModal}>
        <DialogContent className="max-w-md max-h-[98vh] bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-2xl overflow-hidden">
          {/* En-tête fixe */}
          <DialogHeader className="text-center pb-3 border-b border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="relative mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Gift className="h-7 w-7 text-white animate-bounce" />
              </div>
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full animate-ping"></div>
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Codes Promo
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Entrez votre code promo pour bénéficier de réductions exclusives
            </DialogDescription>
          </DialogHeader>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4 max-h-[calc(98vh-140px)]">
            {/* Saisie du code promo */}
            <div className="space-y-3">
              <Label htmlFor="promoCode" className="text-sm font-medium text-gray-700">
                Code promo
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Ex: WELCOME20"
                  className="flex-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <Button
                  onClick={handleApplyPromo}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 transform hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Message d'erreur */}
              {promoError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{promoError}</span>
                </div>
              )}
            </div>

            {/* Codes promo disponibles */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-center text-sm">Codes disponibles</h4>
              <div className="grid grid-cols-2 gap-2">
                {isLoadingPromotions ? (
                  <div className="col-span-2 text-center text-xs text-gray-600">Chargement…</div>
                ) : (availablePromotions ?? []).filter((p: any) => typeof p?.code === 'string' && p.code.trim().length > 0).length === 0 ? (
                  <div className="col-span-2 text-center text-xs text-gray-600">Aucun code promo disponible.</div>
                ) : (
                  (availablePromotions ?? [])
                    .filter((p: any) => typeof p?.code === 'string' && p.code.trim().length > 0)
                    .slice(0, 6)
                    .map((promo: any, idx: number) => {
                      const code = String(promo.code || '').toUpperCase()
                      const min = typeof promo?.min_order_amount === 'number' ? promo.min_order_amount : promo?.min_order_amount != null ? Number(promo.min_order_amount) : null
                      const dtype = String(promo?.discount_type ?? '')
                      const dval = typeof promo?.discount_value === 'number' ? promo.discount_value : Number(promo?.discount_value ?? 0) || 0

                      const label = dtype === 'percentage'
                        ? `-${dval}%`
                        : dtype === 'fixed'
                          ? `-${dval.toLocaleString()} FCFA`
                          : dtype === 'free_shipping'
                            ? 'Livraison offerte'
                            : 'Promo'

                      const hint = typeof min === 'number' && Number.isFinite(min) && min > 0
                        ? `Sur ${min.toLocaleString()}+ FCFA`
                        : 'Conditions selon promo'

                      return (
                        <Card
                          key={`promo-card-${code}-${idx}`}
                          className="border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                          onClick={() => {
                            setPromoCode(code)
                            setPromoError('')
                          }}
                        >
                          <CardContent className="p-2 text-center">
                            <div className="text-base font-bold text-purple-600">{code}</div>
                            <div className="text-xs text-gray-600">{label} · {hint}</div>
                          </CardContent>
                        </Card>
                      )
                    })
                )}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="text-xs text-purple-800">
                  <p className="font-medium mb-1">Comment ça marche ?</p>
                  <ul className="space-y-1">
                    <li>• Entrez votre code promo dans le champ ci-dessus</li>
                    <li>• La réduction sera automatiquement appliquée</li>
                    <li>• Un seul code promo par commande</li>
                    <li>• Les codes sont valides sur les montants minimums indiqués</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de page fixe avec bouton fermer */}
          <div className="border-t border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-4">
            <Button
              onClick={() => setShowPromoModal(false)}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Gestion des Livraisons */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* En-tête du modal */}
          <DialogHeader className="text-center pb-4 border-b border-orange-200">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Truck className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  Gestion des Livraisons
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Configurez votre adresse et choisissez vos options de livraison
                </DialogDescription>
              </div>
            </div>
            
            {/* Étapes de livraison */}
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={`delivery-step-${step}`} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    deliveryStep >= step 
                      ? 'bg-orange-500 text-white shadow-lg scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 rounded-full transition-all duration-300 ${
                      deliveryStep > step ? 'bg-orange-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          {/* Contenu du modal */}
          <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[60vh]">
            {/* Étape 1: Adresse + Mode + Zone */}
            {deliveryStep === 1 && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <span>Adresse de Livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700">
                          Adresse complète *
                        </Label>
                        <Input
                          id="deliveryAddress"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="123 Rue Principale, Quartier"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryCity" className="text-sm font-medium text-gray-700">
                          Ville *
                        </Label>
                        <Input
                          id="deliveryCity"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="Abidjan"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Mode de livraison *</Label>
                        <Select
                          value={selectedDeliveryOption === 'pickup' ? 'pickup' : selectedDeliveryMethod}
                          onValueChange={(v) => {
                            if (v === 'pickup') {
                              setSelectedDeliveryOption('pickup')
                              setSelectedDeliveryMethod('standard')
                              return
                            }
                            const next = v === 'express' ? 'express' : 'standard'
                            setSelectedDeliveryMethod(next)
                            setSelectedDeliveryOption(next)
                          }}
                        >
                          <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                            {pickupPoints.enabled && pickupPoints.points.length > 0 ? (
                              <SelectItem value="pickup">Point Relais</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedDeliveryOption === 'pickup' && pickupPoints.enabled && pickupPoints.points.length > 0 ? (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Point relais *</Label>
                          <Select
                            value={selectedPickupPoint?.id ?? ''}
                            onValueChange={(v) => setSelectedPickupPointId(String(v ?? ''))}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Sélectionner un point" />
                            </SelectTrigger>
                            <SelectContent>
                              {pickupPoints.points.map((p: any) => {
                                const label = `${p.name}${p.city ? ` • ${p.city}` : ''}${p.priceXof ? ` • ${Math.ceil(p.priceXof).toLocaleString()} FCFA` : ''}`
                                return (
                                  <SelectItem key={`delivery-pickup-${p.id}`} value={p.id}>
                                    {label}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Zone de couverture *</Label>
                        <Select
                          value={selectedDeliveryZone}
                          onValueChange={(v) => {
                            const next = (['local', 'national', 'regional', 'international'] as const).includes(v as any)
                              ? (v as any)
                              : 'local'
                            setSelectedDeliveryZone(next)
                            setGeoLocalDistrict('')
                            setGeoDepartment('')
                            setGeoCity('')
                            setGeoArrondissement('')
                            setGeoDistrict('')
                            setGeoCountry('')
                            setGeoRegionDepartment('')
                          }}
                        >
                          <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="regional">Régional</SelectItem>
                            <SelectItem value="international">International</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {selectedDeliveryZone === 'local' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Quartier (Local)</Label>
                          <Select value={geoLocalDistrict} onValueChange={setGeoLocalDistrict}>
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Sélectionner un quartier" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray((deliveryGeo as any)?.local?.districts)
                                ? (deliveryGeo as any).local.districts.map((d: any) => (
                                    <SelectItem key={`local-d-${String(d)}`} value={String(d)}>
                                      {String(d)}
                                    </SelectItem>
                                  ))
                                : null}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    {selectedDeliveryZone === 'regional' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Département (Régional)</Label>
                          <Select value={geoRegionDepartment} onValueChange={setGeoRegionDepartment}>
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Sélectionner un département" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray((deliveryGeo as any)?.national?.departments)
                                ? (deliveryGeo as any).national.departments.map((dep: any) => (
                                    <SelectItem key={`reg-dep-${String(dep?.name ?? '')}`} value={String(dep?.name ?? '')}>
                                      {String(dep?.name ?? '')}
                                    </SelectItem>
                                  ))
                                : null}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    {selectedDeliveryZone === 'international' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Pays (International)</Label>
                          <Input
                            value={geoCountry}
                            onChange={(e) => setGeoCountry(e.target.value)}
                            placeholder="Bénin"
                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    ) : null}

                    {selectedDeliveryZone === 'national' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Département (National)</Label>
                            <Select
                              value={geoDepartment}
                              onValueChange={(v) => {
                                setGeoDepartment(v)
                                setGeoCity('')
                                setGeoArrondissement('')
                                setGeoDistrict('')
                              }}
                            >
                              <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                                <SelectValue placeholder="Sélectionner un département" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray((deliveryGeo as any)?.national?.departments)
                                  ? (deliveryGeo as any).national.departments.map((dep: any) => (
                                      <SelectItem key={`dep-${String(dep?.name ?? '')}`} value={String(dep?.name ?? '')}>
                                        {String(dep?.name ?? '')}
                                      </SelectItem>
                                    ))
                                  : null}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Ville (National)</Label>
                          <Select
                            value={geoCity}
                            onValueChange={(v) => {
                              setGeoCity(v)
                              setGeoArrondissement('')
                              setGeoDistrict('')
                            }}
                            disabled={!geoDepartment}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Sélectionner une ville" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const deps = Array.isArray((deliveryGeo as any)?.national?.departments)
                                  ? (deliveryGeo as any).national.departments
                                  : []
                                const dep = deps.find((d: any) => String(d?.name ?? '') === geoDepartment)
                                const cities = Array.isArray(dep?.cities) ? dep.cities : []
                                return cities.map((c: any) => (
                                  <SelectItem key={`city-${String(c?.name ?? '')}`} value={String(c?.name ?? '')}>
                                    {String(c?.name ?? '')}
                                  </SelectItem>
                                ))
                              })()}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Arrondissement (National)</Label>
                          <Select
                            value={geoArrondissement}
                            onValueChange={(v) => {
                              setGeoArrondissement(v)
                              setGeoDistrict('')
                            }}
                            disabled={!geoCity}
                          >
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Sélectionner un arrondissement" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const deps = Array.isArray((deliveryGeo as any)?.national?.departments)
                                  ? (deliveryGeo as any).national.departments
                                  : []
                                const dep = deps.find((d: any) => String(d?.name ?? '') === geoDepartment)
                                const cities = Array.isArray(dep?.cities) ? dep.cities : []
                                const city = cities.find((c: any) => String(c?.name ?? '') === geoCity)
                                const arrs = Array.isArray(city?.arrondissements) ? city.arrondissements : []
                                return arrs.map((a: any) => (
                                  <SelectItem key={`arr-${String(a?.name ?? '')}`} value={String(a?.name ?? '')}>
                                    {String(a?.name ?? '')}
                                  </SelectItem>
                                ))
                              })()}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Quartier (National)</Label>
                          <Select value={geoDistrict} onValueChange={setGeoDistrict} disabled={!geoArrondissement}>
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Sélectionner un quartier" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const deps = Array.isArray((deliveryGeo as any)?.national?.departments)
                                  ? (deliveryGeo as any).national.departments
                                  : []
                                const dep = deps.find((d: any) => String(d?.name ?? '') === geoDepartment)
                                const cities = Array.isArray(dep?.cities) ? dep.cities : []
                                const city = cities.find((c: any) => String(c?.name ?? '') === geoCity)
                                const arrs = Array.isArray(city?.arrondissements) ? city.arrondissements : []
                                const arr = arrs.find((a: any) => String(a?.name ?? '') === geoArrondissement)
                                const districts = Array.isArray(arr?.districts) ? arr.districts : []
                                return districts.map((d: any) => (
                                  <SelectItem key={`dist-${String(d)}`} value={String(d)}>
                                    {String(d)}
                                  </SelectItem>
                                ))
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      </div>
                    ) : null}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryPostalCode" className="text-sm font-medium text-gray-700">
                          Code postal
                        </Label>
                        <Input
                          id="deliveryPostalCode"
                          value={deliveryPostalCode}
                          onChange={(e) => setDeliveryPostalCode(e.target.value)}
                          placeholder="225"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryCountry" className="text-sm font-medium text-gray-700">
                          Pays
                        </Label>
                        <Input
                          id="deliveryCountry"
                          value={deliveryCountry}
                          onChange={(e) => setDeliveryCountry(e.target.value)}
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryPhone" className="text-sm font-medium text-gray-700">
                          Téléphone *
                        </Label>
                        <Input
                          id="deliveryPhone"
                          value={deliveryPhone}
                          onChange={(e) => setDeliveryPhone(e.target.value)}
                          placeholder="+225 0123456789"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deliveryInstructions" className="text-sm font-medium text-gray-700">
                        Instructions de livraison
                      </Label>
                      <Input
                        id="deliveryInstructions"
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="Code d'accès, étage, repères..."
                        className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Étape 2: Résumé + Calcul + Programmation */}
            {deliveryStep === 2 && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                      <Truck className="h-5 w-5 text-orange-600" />
                      <span>Programmation de la Livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Card className="bg-white border-orange-200">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Mode</span>
                          <span className="font-medium text-gray-900">{selectedDeliveryMethod === 'express' ? 'Express' : 'Standard'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Zone</span>
                          <span className="font-medium text-gray-900">
                            {selectedDeliveryZone === 'local'
                              ? 'Local'
                              : selectedDeliveryZone === 'national'
                                ? 'National'
                                : selectedDeliveryZone === 'regional'
                                  ? 'Régional'
                                  : 'International'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Coût</span>
                          <span className="font-medium text-gray-900">
                            {isFreeShippingEffective ? 'Gratuite' : `${shippingCost.toLocaleString()} FCFA`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Délai</span>
                          <span className="font-medium text-gray-900">{getDeliveryTime(selectedDeliveryMethod)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Calcul du coût (commande)</Label>
                        <Card className="border-orange-200 bg-white">
                          <CardContent className="p-3 text-xs text-gray-700">
                            {getShippingAggregationLabel(effectiveShippingAggregation)}
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Détail par produit</Label>
                        <Card className="border-orange-200 bg-white">
                          <CardContent className="p-3 space-y-2">
                            {(perProductShipping ?? []).length === 0 ? (
                              <div className="text-xs text-gray-600">Aucun produit physique détecté.</div>
                            ) : (
                              (perProductShipping ?? []).slice(0, 6).map((row) => (
                                <div key={`ship-row-${row.productId}`} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-700 truncate pr-2">{row.name ?? row.productId}</span>
                                  <span className="font-medium text-gray-900">
                                    {row.freeShipping ? 'Gratuit' : `${(row.shippingCost || 0).toLocaleString()} FCFA`}
                                  </span>
                                </div>
                              ))
                            )}
                            {(perProductShipping ?? []).length > 6 && (
                              <div className="text-[11px] text-gray-500">+{(perProductShipping ?? []).length - 6} autres produits…</div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Card
                      className={`border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        isScheduledDelivery ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => setIsScheduledDelivery(true)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Livraison programmée</div>
                            <div className="text-sm text-gray-600">Date choisie par vous</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {shippingCost.toLocaleString()} FCFA
                          </div>
                          <div className="text-xs text-gray-500">Sélectionnez pour choisir une date</div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Étape 3: Calendrier de livraison */}
            {deliveryStep === 3 && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <span>Calendrier de Livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sélecteur de date */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Date de livraison préférée
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preferredDeliveryDate" className="text-sm font-medium text-gray-700">
                            Date
                          </Label>
                          <Input
                            id="preferredDeliveryDate"
                            type="date"
                            value={preferredDeliveryDate}
                            onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryTimeSlot" className="text-sm font-medium text-gray-700">
                            Créneau horaire
                          </Label>
                          <Select value={deliveryTimeSlot} onValueChange={setDeliveryTimeSlot}>
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Choisir un créneau" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="09:00-12:00">Matin (09:00-12:00)</SelectItem>
                              <SelectItem value="14:00-17:00">Après-midi (14:00-17:00)</SelectItem>
                              <SelectItem value="18:00-21:00">Soirée (18:00-21:00)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Calendrier dynamique */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Dates disponibles (30 prochains jours)</h5>
                      <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                        {generateDeliveryCalendar().map((day, index) => (
                          <div
                            key={`delivery-day-${day.date.toISOString().split('T')[0]}-${index}`}
                            className={`p-2 text-center rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                              preferredDeliveryDate === day.date.toISOString().split('T')[0]
                                ? 'border-orange-500 bg-orange-100 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                            onClick={() => setPreferredDeliveryDate(day.date.toISOString().split('T')[0])}
                          >
                            <div className="text-xs font-medium">{day.date.getDate()}</div>
                            <div className="text-xs text-gray-500">{day.date.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Résumé final */}
                    <Card className="bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h5 className="font-medium text-orange-900">Résumé de votre livraison</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Mode: <span className="font-medium text-orange-700">{selectedDeliveryMethod === 'express' ? 'Express' : 'Standard'}</span></p>
                              <p className="text-gray-700">Délai: <span className="font-medium text-orange-700">
                                {getDeliveryTime(selectedDeliveryMethod)}
                              </span></p>
                              <p className="text-gray-600">Coût: <span className="font-medium text-orange-700">
                                {shippingCost.toLocaleString()} FCFA
                              </span></p>
                            </div>
                            <div>
                              <p className="text-gray-600">Date: <span className="font-medium text-orange-700">
                                {preferredDeliveryDate ? new Date(preferredDeliveryDate).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                }) : 'Non définie'}
                              </span></p>
                              <p className="text-gray-600">Créneau: <span className="font-medium text-orange-700">
                                {deliveryTimeSlot || 'Non défini'}
                              </span></p>
                              <p className="text-gray-600">Total: <span className="font-medium text-orange-700">
                                {grandTotal.toLocaleString()} FCFA
                              </span></p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Navigation entre étapes */}
          <div className="flex justify-between pt-6 border-t border-orange-200 bg-white sticky bottom-0">
            <Button
              variant="outline"
              onClick={() => setDeliveryStep(Math.max(1, deliveryStep - 1))}
              disabled={deliveryStep === 1}
              className="px-6 py-2 border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            
            <div className="flex space-x-3">
              {deliveryStep < 3 ? (
                <Button
                  onClick={() => {
                    if (deliveryStep === 2 && !isScheduledDelivery) {
                      showInfo('Veuillez sélectionner la livraison programmée pour choisir une date.')
                      return
                    }
                    setDeliveryStep(deliveryStep + 1)
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    void (async () => {
                      void persistDeliveryCheckoutPreferences()
                      showSuccess('Configuration de livraison enregistrée !')

                      // Préremplissage commande: si le client n'a pas encore renseigné son téléphone, on reprend celui du modal livraisons.
                      if (String(customerPhone ?? '').trim().length === 0 && String(deliveryPhone ?? '').trim().length > 0) {
                        setCustomerPhone(String(deliveryPhone).trim())
                      }

                      setShowDeliveryModal(false)
                      setDeliveryStep(1)
                    })()
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-lg font-semibold transform hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirmer la Livraison
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
