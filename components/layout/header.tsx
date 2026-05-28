"use client"

import { Heart, Search, ShoppingCart, User, ChevronDown, ChevronLeft, ChevronRight, Home, ShoppingBag, Grid, Flame, Sparkles, Store, Headphones, Lock, Truck, LogOut, Settings, CreditCard, Gift, Bell, Package, MapPin, Clock, CheckCircle, X, Share2, Coins, Star, BarChart3, Shield, Trash2, Zap, Smartphone, RefreshCw, Phone, Mail, Minus, Plus, Calculator, Info, Calendar, MessageCircle, MessageSquare, FileText, Download, Copy, Printer, HelpCircle, Save, Globe, ArrowLeft, ArrowRight, Volume2, RotateCcw, AlertTriangle, List, BookOpen, Send, Users, Building, Car, Camera, Music, Gamepad2, Palette, Wrench, Hammer, Drill, Ruler, Microscope, TestTube, Atom, Dna, Leaf, Flower, Sun, Moon, Cloud, Wind, Rainbow, Umbrella, Snowflake, Droplets, Waves, Fish, Bird, Cat, Dog, Rabbit, Mouse, Rat, Turtle, Shell, Diamond, Bone, Eye, Glasses, Shirt, Wallet, Backpack, Briefcase, Bed, Table, Apple, Play, Smile, Paperclip } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  CartService, 
  WishlistService, 
  DeliveryService, 
  SearchService, 
  NotificationService
} from "@/lib/services"
import { enrichProductWithSpecs } from "@/lib/product-specifications"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { ClientPointsService } from "@/lib/services/client-points-service"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import des composants enfants modulaires
import HeaderCart from "./header-cart"
import HeaderWishlist from "./header-wishlist"
import HeaderUser from "./header-user"
import HeaderCompare from "./header-compare"
import HeaderDelivery from "./header-delivery"

export default function HeaderModular() {
  const pathname = usePathname()
  const router = useRouter()

  /**
   * Calcule le nombre total d'articles (somme des quantités) à partir du tableau panier.
   */
  const getCartQuantityCount = (items: any[]) => {
    return (items ?? []).reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0)
  }

  /**
   * Détermine si une livraison est considérée comme "en cours".
   */
  const isDeliveryInProgress = (status: string | null | undefined): boolean => {
    if (!status) return true
    return !['delivered', 'cancelled', 'failed'].includes(status)
  }

  /**
   * Calcule les compteurs "livraisons en cours" et "commandes en cours" depuis la liste des livraisons.
   */
  const computeInProgressCounts = (list: any[]) => {
    const safe = Array.isArray(list) ? list : []
    const inProgress = safe.filter((delivery) => isDeliveryInProgress(delivery?.status))
    const deliveriesInProgressCount = inProgress.length
    const orderKeys = new Set<string>()
    for (const delivery of inProgress) {
      const key = String(delivery?.orderNumber ?? delivery?.id ?? '')
      if (key) orderKeys.add(key)
    }
    const ordersInProgressCount = orderKeys.size
    return { deliveriesInProgressCount, ordersInProgressCount }
  }
  
  // Fonction utilitaire pour localStorage sécurisé
  const safeLocalStorage = {
    getItem: (key: string, defaultValue: string = '') => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || defaultValue
      }
      return defaultValue
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    }
  }

  const navigateToDashboardSection = (section: string) => {
    if (typeof window !== 'undefined') {
      router.push(`/dashboard?section=${section}`)
    }
    setShowUserDropdown(false)
  }

  const openDashboardModal = (eventName: string, targetTab?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName))
    }
    if (targetTab) {
      router.push(`/dashboard?section=${targetTab}`)
    }
    setShowUserDropdown(false)
  }

  const handleOpenChat = () => openDashboardModal('openChatModal', 'chat')
  const handleOpenInternalMessages = () => openDashboardModal('openInternalMessageModal', 'messaging')
  const handleOpenPaymentRequest = () => openDashboardModal('openPaymentRequestModal', 'points')
  const handleOpenPointsWithdrawal = () => openDashboardModal('openPointsWithdrawalModal', 'points')
  const handleOpenPointsPurchase = () => openDashboardModal('openPointsPurchaseModal', 'points')
  const handleOpenPointsTransfer = () => openDashboardModal('openPointsTransferModal', 'points')
  const handleOpenPointsExchange = () => openDashboardModal('openPointsExchangeModal', 'points')
  const handleOpenAiRecommendation = () => navigateToDashboardSection('recommendations')
  
  // États avec valeurs par défaut
  const { user, userProfile, loyaltyPoints, signOut } = useAuth()
  const { balance, estimatedValue, basePointValue, configuration } = useClientPoints()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [cartItems, setCartItems] = useState(() => {
    try {
      const cart = CartService.getCart()
      return getCartQuantityCount(Array.isArray(cart) ? cart : [])
    } catch {
      return 0
    }
  })
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const wishlist = WishlistService.getWishlist()
      return Array.isArray(wishlist) ? wishlist.length : 0
    } catch {
      return 0
    }
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState("fcfa")
  const [showCartModal, setShowCartModal] = useState(false)
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareListLength, setCompareListLength] = useState(() => {
    try {
      if (typeof window === 'undefined') return 0
      const stored = window.localStorage?.getItem('compareList')
      const list = stored ? JSON.parse(stored) : []
      return Array.isArray(list) ? list.length : 0
    } catch {
      return 0
    }
  })
  const [deliveryOrdersCount, setDeliveryOrdersCount] = useState(() => {
    try {
      if (typeof window === 'undefined') return 0
      const raw = window.localStorage?.getItem('probooster_client_deliveries_cache')
      const parsed = raw ? JSON.parse(raw) : null
      const deliveries = parsed?.data
      return Array.isArray(deliveries) ? deliveries.length : 0
    } catch {
      return 0
    }
  })
  const [deliveriesInProgressCount, setDeliveriesInProgressCount] = useState(() => {
    try {
      if (typeof window === 'undefined') return 0
      const raw = window.localStorage?.getItem('probooster_client_deliveries_cache')
      const parsed = raw ? JSON.parse(raw) : null
      const deliveries = parsed?.data
      return computeInProgressCounts(Array.isArray(deliveries) ? deliveries : []).deliveriesInProgressCount
    } catch {
      return 0
    }
  })
  const [ordersInProgressCount, setOrdersInProgressCount] = useState(() => {
    try {
      if (typeof window === 'undefined') return 0
      const raw = window.localStorage?.getItem('probooster_client_deliveries_cache')
      const parsed = raw ? JSON.parse(raw) : null
      const deliveries = parsed?.data
      return computeInProgressCounts(Array.isArray(deliveries) ? deliveries : []).ordersInProgressCount
    } catch {
      return 0
    }
  })
  const [isClient, setIsClient] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement | null>(null)
  const [userRole, setUserRole] = useState<'client' | 'vendor' | 'admin' | 'driver'>('client')
  const [userId, setUserId] = useState<string>('USR-0001')
  const [userName, setUserName] = useState<string>('Invité')
  const [chatUnreadCount, setChatUnreadCount] = useState<number>(0)
  const [internalMessageCount, setInternalMessageCount] = useState<number>(0)
  const [sellerRevenue, setSellerRevenue] = useState<number>(0)
  const [sellerPayoutThreshold, setSellerPayoutThreshold] = useState<number>(100000)
  const [showPointsWithdrawalModal, setShowPointsWithdrawalModal] = useState(false)
  const [pointsWithdrawalAmountInput, setPointsWithdrawalAmountInput] = useState<string>("")
  const [pointsWithdrawalMethodId, setPointsWithdrawalMethodId] = useState<string>("")
  const [pointsWithdrawalIdentifier, setPointsWithdrawalIdentifier] = useState<string>("")
  const [pointsWithdrawalError, setPointsWithdrawalError] = useState<string | null>(null)
  const [pointsWithdrawalProcessing, setPointsWithdrawalProcessing] = useState<boolean>(false)
  const [pointsLevel, setPointsLevel] = useState<'bronze' | 'silver' | 'gold' | 'platinum'>('bronze')
  const [isAiRecommendationEnabled, setIsAiRecommendationEnabled] = useState<boolean>(true)
  const [userBalance, setUserBalance] = useState<number>(0)

  const userPoints = balance
  const pointsValue = estimatedValue ?? 0

  const pointsWithdrawalThreshold = useMemo(() => {
    const raw = (configuration?.limits?.withdrawal as any)?.min
    const numeric = Number(raw)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 5000
  }, [configuration?.limits?.withdrawal])

  const withdrawalThreshold = (typeof pointsWithdrawalThreshold === 'number' && Number.isFinite(pointsWithdrawalThreshold))
    ? Number((pointsWithdrawalThreshold * (Number.isFinite(Number(basePointValue)) && Number(basePointValue) > 0 ? Number(basePointValue) : 1)).toFixed(2))
    : 5000

  /**
   * Formate un nombre de points en affichage lisible.
   */
  const formatPointsValue = (value: number) => {
    const numeric = Number(value) || 0
    return `${numeric.toLocaleString()} pts`
  }

  /**
   * Formate un montant FCFA pour l'affichage.
   */
  const formatMoney = (value: number) => {
    const numeric = Number(value) || 0
    return `${numeric.toLocaleString()} F CFA`
  }

  const withdrawalMethods = useMemo(() => {
    const baseCurrency = String(((configuration as any)?.settings?.defaultCurrency ?? 'XOF')).toUpperCase()

    return [
      {
        id: 'mobile-money',
        name: 'Mobile Money',
        description: 'Retrait instantané vers votre portefeuille Mobile Money',
        isActive: true,
        limits: [
          {
            currency: baseCurrency,
            processingTime: 'Instantané (sous 15 minutes)'
          }
        ]
      },
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Transfert sécurisé vers votre compte PayPal',
        isActive: true,
        limits: [
          {
            currency: baseCurrency,
            processingTime: '24 à 48 heures'
          }
        ]
      }
    ]
  }, [configuration])

  const pointsWithdrawalIdentifierConfig = useMemo(() => {
    const selected = withdrawalMethods.find((m: any) => String(m?.id ?? m?.name ?? '') === String(pointsWithdrawalMethodId)) ?? null
    const name = (selected?.name ?? '').toString().toLowerCase()
    const description = (selected?.description ?? '').toString().toLowerCase()
    const methodContext = `${name} ${description}`

    if (methodContext.includes('mobile') || methodContext.includes('wallet') || methodContext.includes('momo') || methodContext.includes('wave')) {
      return {
        label: 'Numéro Mobile Money',
        placeholder: 'Ex: +229 91 50 57 57',
        helper: 'Utilisez le numéro associé à votre compte Mobile Money.',
        required: true,
        type: 'tel' as const
      }
    }

    if (methodContext.includes('paypal')) {
      return {
        label: 'Email PayPal',
        placeholder: 'Ex: nom@exemple.com',
        helper: 'Renseignez l’email de votre compte PayPal.',
        required: true,
        type: 'email' as const
      }
    }

    if (methodContext.includes('carte') || methodContext.includes('card')) {
      return {
        label: 'Référence carte / 4 derniers chiffres',
        placeholder: 'Ex: **** **** **** 1234',
        helper: 'Ajoutez une référence pour identifier la carte ou le compte carte.',
        required: true,
        type: 'text' as const
      }
    }

    if (
      methodContext.includes('banque') ||
      methodContext.includes('bank') ||
      methodContext.includes('rib') ||
      methodContext.includes('iban') ||
      methodContext.includes('compte')
    ) {
      return {
        label: 'RIB / IBAN ou numéro de compte',
        placeholder: 'Ex: BJ12 3456 7890 1234 5678 90',
        helper: 'Renseignez l’identifiant du compte bancaire à créditer.',
        required: true,
        type: 'text' as const
      }
    }

    return {
      label: 'Référence (optionnelle)',
      placeholder: 'Ex: identifiant à associer',
      helper: '',
      required: false,
      type: 'text' as const
    }
  }, [pointsWithdrawalMethodId, withdrawalMethods])

  /**
   * Normalise une saisie numérique (ex: "3 000" -> "3000").
   */
  const sanitizeNumericInput = useCallback((value: string) => {
    return String(value ?? '').replace(/[^0-9.,]/g, '').trim()
  }, [])

  const selectedWithdrawalMethodDetails = useMemo(() => {
    return withdrawalMethods.find((m: any) => String(m?.id ?? m?.name ?? '') === String(pointsWithdrawalMethodId)) ?? null
  }, [pointsWithdrawalMethodId, withdrawalMethods])

  const selectedMethodLimit = useMemo(() => {
    if (!selectedWithdrawalMethodDetails) return null
    const limits = Array.isArray((selectedWithdrawalMethodDetails as any)?.limits)
      ? (selectedWithdrawalMethodDetails as any).limits
      : []
    return limits[0] ?? null
  }, [selectedWithdrawalMethodDetails])

  const withdrawalValue = useMemo(() => {
    const fromConfig = Number((configuration as any)?.settings?.withdrawalValue)
    if (Number.isFinite(fromConfig) && fromConfig > 0) return fromConfig
    const safeBasePointValue = Number(basePointValue)
    return Number.isFinite(safeBasePointValue) && safeBasePointValue > 0 ? safeBasePointValue : 1
  }, [basePointValue, configuration])

  const withdrawalMinPoints = useMemo(() => {
    const raw = (configuration?.limits?.withdrawal as any)?.min
    const numeric = Number(raw)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 1000
  }, [configuration?.limits?.withdrawal])

  const withdrawalAmountValue = useMemo(() => {
    const sanitized = sanitizeNumericInput(pointsWithdrawalAmountInput).replace(',', '.')
    return Number(sanitized) || 0
  }, [pointsWithdrawalAmountInput, sanitizeNumericInput])

  const withdrawalFee = useMemo(() => 0, [])
  const withdrawalTotal = useMemo(() => Number(withdrawalAmountValue.toFixed(2)), [withdrawalAmountValue])
  const withdrawalPayout = useMemo(() => Number((withdrawalAmountValue * withdrawalValue).toFixed(2)), [withdrawalAmountValue, withdrawalValue])

  const withdrawalLimitMessage = useMemo(() => {
    if (withdrawalAmountValue <= 0) {
      return null
    }

    const globalLimits = (configuration?.limits?.withdrawal as any) ?? null
    const min = globalLimits?.min
    const max = globalLimits?.max

    if (min !== null && min !== undefined && withdrawalAmountValue < Number(min)) {
      return `Nombre de points minimum à retirer : ${formatPointsValue(Number(min))}`
    }

    if (max !== null && max !== undefined && withdrawalAmountValue > Number(max)) {
      return `Nombre de points maximum à retirer : ${formatPointsValue(Number(max))}`
    }

    const availableBalance = Number(userPoints ?? 0) || 0
    if (withdrawalTotal > availableBalance) {
      return 'Solde insuffisant pour couvrir le retrait et les frais'
    }

    return null
  }, [configuration?.limits?.withdrawal, formatPointsValue, userPoints, withdrawalAmountValue, withdrawalTotal])

  useEffect(() => {
    if (!showPointsWithdrawalModal) return
    setPointsWithdrawalError(null)
    if (!pointsWithdrawalMethodId && withdrawalMethods.length > 0) {
      const first = withdrawalMethods[0]
      setPointsWithdrawalMethodId(String(first?.id ?? first?.name ?? ''))
    }
  }, [showPointsWithdrawalModal, pointsWithdrawalMethodId, withdrawalMethods])

  // Initialisation des services et mise à jour des états
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsClient(true)

    const loggedIn = Boolean(user)
    setIsLoggedIn(loggedIn)

    if (user) {
      const decorativeId = userProfile?.short_code || user.id
      setUserId(decorativeId)
      const fullName = `${userProfile?.first_name ?? ''} ${userProfile?.last_name ?? ''}`.trim()
      setUserName(fullName || user.email || 'Utilisateur')

      const rawRole = user.role as string | undefined
      const metadataRole = (userProfile as unknown as { role?: string } | null)?.role
      const fallbackRole = metadataRole && ['client', 'vendor', 'admin', 'driver'].includes(metadataRole)
        ? (metadataRole as 'client' | 'vendor' | 'admin' | 'driver')
        : undefined
      const normalizedRole: 'client' | 'vendor' | 'admin' | 'driver' = rawRole === 'seller'
        ? 'vendor'
        : rawRole === 'super_admin'
          ? 'admin'
          : rawRole === 'driver'
            ? 'driver'
            : rawRole && ['client', 'vendor', 'admin', 'driver'].includes(rawRole)
              ? (rawRole as 'client' | 'vendor' | 'admin' | 'driver')
              : fallbackRole ?? 'client'
      setUserRole(normalizedRole)

      setUserBalance(typeof pointsValue === 'number' ? pointsValue : 0)
      setSellerRevenue(loyaltyPoints?.points_value ?? 0)
      setSellerPayoutThreshold(loyaltyPoints?.withdrawal_threshold ?? sellerPayoutThreshold)
      setPointsLevel((userProfile?.preferences?.points_level as 'bronze' | 'silver' | 'gold' | 'platinum') || 'bronze')
      setChatUnreadCount(userProfile?.preferences?.chat_unread ?? 0)
      setInternalMessageCount(userProfile?.preferences?.internal_unread ?? 0)
    } else {
      setUserRole('client')
      setUserId('INV-0000')
      setUserName('Invité')
      setUserBalance(0)
      setSellerRevenue(0)
      setChatUnreadCount(0)
      setInternalMessageCount(0)
      setPointsLevel('bronze')
    }

    // Compteurs immédiats: ne pas dépendre du chargement auth.
    // On affiche l'état local (localStorage/mémoire) tout de suite.
    try {
      const cart = CartService.getCart()
      setCartItems(getCartQuantityCount(Array.isArray(cart) ? cart : []))
    } catch {
      setCartItems(0)
    }
    try {
      const wishlist = WishlistService.getWishlist()
      setWishlistItems(Array.isArray(wishlist) ? wishlist.length : 0)
    } catch {
      setWishlistItems(0)
    }

    const aiFlag = localStorage.getItem('probooster_ai_enabled')
    setIsAiRecommendationEnabled(aiFlag !== 'false')

    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      setCompareListLength(Array.isArray(compareList) ? compareList.length : 0)
    } catch (localStorageError) {
      console.error('Erreur localStorage:', localStorageError)
      setCompareListLength(0)
    }

    try {
      const raw = window.localStorage?.getItem('probooster_client_deliveries_cache')
      const parsed = raw ? JSON.parse(raw) : null
      const deliveries = parsed?.data
      const list = Array.isArray(deliveries) ? deliveries : []
      const counts = computeInProgressCounts(list)
      setDeliveryOrdersCount(list.length)
      setDeliveriesInProgressCount(counts.deliveriesInProgressCount)
      setOrdersInProgressCount(counts.ordersInProgressCount)
    } catch {
      setDeliveryOrdersCount(0)
      setDeliveriesInProgressCount(0)
      setOrdersInProgressCount(0)
    }
  }, [user, userProfile, loyaltyPoints, pointsValue, sellerPayoutThreshold])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onCartUpdated = (event: any) => {
      const nextCart = Array.isArray(event?.detail?.cart) ? event.detail.cart : null
      const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
      if (nextCart) {
        setCartItems(nextCount ?? getCartQuantityCount(nextCart))
        return
      }
      try {
        const cartFallback = CartService.getCart()
        setCartItems(getCartQuantityCount(Array.isArray(cartFallback) ? cartFallback : []))
      } catch {
        setCartItems(0)
      }
    }

    const onWishlistUpdated = (event: any) => {
      const nextWishlist = Array.isArray(event?.detail?.wishlist) ? event.detail.wishlist : null
      const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
      if (nextWishlist) {
        setWishlistItems(nextCount ?? nextWishlist.length)
        return
      }
      try {
        const wishlistFallback = WishlistService.getWishlist()
        setWishlistItems(Array.isArray(wishlistFallback) ? wishlistFallback.length : 0)
      } catch {
        setWishlistItems(0)
      }
    }

    const onCompareUpdated = (event: any) => {
      const nextLength = typeof event?.detail?.length === 'number' ? event.detail.length : null
      if (typeof nextLength === 'number') {
        setCompareListLength(nextLength)
        return
      }
      try {
        const stored = localStorage.getItem('compareList')
        const list = stored ? JSON.parse(stored) : []
        setCompareListLength(Array.isArray(list) ? list.length : 0)
      } catch {
        setCompareListLength(0)
      }
    }

    const onDeliveriesUpdated = (event: any) => {
      const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
      const nextDeliveriesInProgressCount = typeof event?.detail?.deliveriesInProgressCount === 'number'
        ? event.detail.deliveriesInProgressCount
        : null
      const nextOrdersInProgressCount = typeof event?.detail?.ordersInProgressCount === 'number'
        ? event.detail.ordersInProgressCount
        : null

      if (typeof nextCount === 'number') {
        setDeliveryOrdersCount(nextCount)
        if (typeof nextDeliveriesInProgressCount === 'number') {
          setDeliveriesInProgressCount(nextDeliveriesInProgressCount)
        }
        if (typeof nextOrdersInProgressCount === 'number') {
          setOrdersInProgressCount(nextOrdersInProgressCount)
        }
        return
      }
      try {
        const raw = window.localStorage?.getItem('probooster_client_deliveries_cache')
        const parsed = raw ? JSON.parse(raw) : null
        const deliveries = parsed?.data
        const list = Array.isArray(deliveries) ? deliveries : []
        const counts = computeInProgressCounts(list)
        setDeliveryOrdersCount(list.length)
        setDeliveriesInProgressCount(counts.deliveriesInProgressCount)
        setOrdersInProgressCount(counts.ordersInProgressCount)
      } catch {
        setDeliveryOrdersCount(0)
        setDeliveriesInProgressCount(0)
        setOrdersInProgressCount(0)
      }
    }

    window.addEventListener('cartUpdated', onCartUpdated as any)
    window.addEventListener('wishlistUpdated', onWishlistUpdated as any)
    window.addEventListener('compareListUpdated', onCompareUpdated as any)
    window.addEventListener('clientDeliveriesUpdated', onDeliveriesUpdated as any)

    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated as any)
      window.removeEventListener('wishlistUpdated', onWishlistUpdated as any)
      window.removeEventListener('compareListUpdated', onCompareUpdated as any)
      window.removeEventListener('clientDeliveriesUpdated', onDeliveriesUpdated as any)
    }
  }, [])

  useEffect(() => {
    if (!showUserDropdown) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown])



  // Calcul du pourcentage de progression
  const progressPercentage = Math.min((pointsValue / (withdrawalThreshold || 1)) * 100, 100)

  // Fonction de recherche
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Logique de recherche
      console.log('Recherche:', searchQuery)
    }
  }

  // Fonction pour gérer la comparaison
  const handleAddToCompare = (item: any) => {
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
      if (!compareList.find((p: any) => p.id === item.id)) {
        if (compareList.length >= 4) {
          alert('Vous ne pouvez comparer que 4 produits maximum !')
          return
        }
        compareList.push(item)
        safeLocalStorage.setItem('compareList', JSON.stringify(compareList))
        setCompareListLength(compareList.length)
        window.dispatchEvent(new CustomEvent('compareListUpdated', { detail: { compareList, length: compareList.length } }))
        NotificationService.showSuccess(`${item.name} ajouté à la comparaison !`)
        // Ouvrir automatiquement le modal de comparaison
        setShowCompareModal(true)
      } else {
        NotificationService.showInfo('Produit déjà dans la comparaison !')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
    }
  }

  const getCompareList = () => {
    try {
      return JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste de comparaison:', error)
      return []
    }
  }

  const removeFromCompare = (productId: number) => {
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
      const updatedList = compareList.filter((item: any) => item.id !== productId)
      safeLocalStorage.setItem('compareList', JSON.stringify(updatedList))
      setCompareListLength(updatedList.length)
      NotificationService.showInfo('Produit retiré de la comparaison')
    } catch (error) {
      console.error('Erreur lors de la suppression de la comparaison:', error)
    }
  }

  // Fonction pour obtenir les produits enrichis avec spécifications techniques
  const getEnrichedCompareList = () => {
    if (!isClient) return []
    
    try {
      const compareList = getCompareList()
      return compareList.map((product: any) => enrichProductWithSpecs(product))
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement des produits:', error)
      return getCompareList()
    }
  }

  const handleLogout = () => {
    if (!isClient) return
    
    try {
      AuthService.logout()
      setIsLoggedIn(false)
      NotificationService.showInfo("Déconnexion réussie")
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const handleWithdrawPoints = () => {
    setPointsWithdrawalError(null)
    setShowPointsWithdrawalModal(true)
  }

  const submitPointsWithdrawal = async () => {
    if (!user?.id) {
      setPointsWithdrawalError('Utilisateur non authentifié')
      return
    }

    if ((configuration as any)?.settings?.withdrawalEnabled === false) {
      setPointsWithdrawalError('La fonctionnalité de retrait est momentanément désactivée.')
      return
    }

    if (withdrawalLimitMessage) {
      setPointsWithdrawalError(withdrawalLimitMessage)
      return
    }

    if (withdrawalAmountValue <= 0) {
      setPointsWithdrawalError('Veuillez saisir un montant valide')
      return
    }

    const selected = selectedWithdrawalMethodDetails
    if (!selected) {
      setPointsWithdrawalError('Veuillez sélectionner une méthode de retrait')
      return
    }

    const identifierValue = pointsWithdrawalIdentifier.trim()
    if (pointsWithdrawalIdentifierConfig.required && identifierValue.length === 0) {
      setPointsWithdrawalError(`Veuillez renseigner ${pointsWithdrawalIdentifierConfig.label.toLowerCase()}`)
      return
    }

    try {
      setPointsWithdrawalProcessing(true)
      setPointsWithdrawalError(null)

      const metadata: Record<string, unknown> = {
        methodId: selected.id,
        methodName: selected.name,
        identifierLabel: pointsWithdrawalIdentifierConfig.label
      }
      if (identifierValue.length > 0) {
        metadata.identifier = identifierValue
      }

      await ClientPointsService.requestWithdrawal(user.id, withdrawalAmountValue, String(selected.id ?? selected.name), metadata)

      setShowPointsWithdrawalModal(false)
      setPointsWithdrawalAmountInput('')
      setPointsWithdrawalIdentifier('')
      NotificationService.showSuccess('Demande de retrait envoyée')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la demande de retrait'
      setPointsWithdrawalError(message)
      NotificationService.showError(message)
    } finally {
      setPointsWithdrawalProcessing(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'client':
        return 'Client'
      case 'vendor':
        return 'Vendeur'
      case 'admin':
        return 'Super Admin'
      case 'driver':
        return 'Livreur'
      default:
        return 'Utilisateur'
    }
  }

  const isSellerPayoutEnabled = sellerRevenue >= sellerPayoutThreshold
  const isPointsWithdrawalEnabled = userPoints >= pointsWithdrawalThreshold

  const renderUserHeader = () => (
    <div className="px-4 pb-3 border-b border-gray-100">
      <p className="text-xs uppercase tracking-wider text-[#ff6600] font-semibold">{getRoleLabel(userRole)}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{userName}</p>
      <p className="text-xs text-gray-500">ID: {userId}</p>
      {(userRole === 'client' || userRole === 'vendor') && (
        <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs text-[#ff6600] flex items-center justify-between">
          <span>Solde</span>
          <strong>{pointsValue.toLocaleString()} F CFA</strong>
        </div>
      )}
      {userRole !== 'admin' && (
        <div className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 flex items-center justify-between">
          <span>Points ({pointsLevel})</span>
          <strong>{userPoints.toLocaleString()}</strong>
        </div>
      )}
    </div>
  )

  const renderMenuButton = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    options?: { badge?: string; disabled?: boolean; description?: string; tone?: 'default' | 'warning' | 'danger' }
  ) => {
    const { badge, disabled, description, tone = 'default' } = options || {}
    const baseClasses = "flex w-full items-center justify-between px-4 py-3 text-sm transition-colors"
    const toneClasses = {
      default: "hover:bg-orange-50 hover:text-[#ff6600] text-gray-700",
      warning: "hover:bg-yellow-50 hover:text-[#ff6600] text-gray-700",
      danger: "hover:bg-red-50 text-red-600"
    }[tone]

    return (
      <button
        type="button"
        className={[baseClasses, toneClasses, disabled ? "opacity-60 cursor-not-allowed" : ""].join(" ")}
        onClick={() => {
          if (disabled) return
          onClick()
        }}
        disabled={disabled}
      >
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-orange-100 text-[#ff6600] flex items-center justify-center">
            {icon}
          </div>
          <div className="flex flex-col items-start">
            <span>{label}</span>
            {description && <span className="text-xs text-gray-400">{description}</span>}
          </div>
        </div>
        {badge && (
          <span className="text-xs font-semibold text-white bg-[#ff6600] rounded-full px-2 py-0.5">
            {badge}
          </span>
        )}
      </button>
    )
  }

  const renderClientMenu = () => (
    <div className="py-1">
      {renderMenuButton(<Home className="h-4 w-4" />, "Tableau de bord", () => navigateToDashboardSection('overview'))}
      {renderMenuButton(<User className="h-4 w-4" />, "Profil", () => navigateToDashboardSection('profile'))}
      {renderMenuButton(
        <MessageCircle className="h-4 w-4" />, "Chat",
        handleOpenChat,
        { badge: chatUnreadCount > 0 ? `${chatUnreadCount}` : undefined, description: chatUnreadCount > 0 ? "Nouveaux messages" : "Aucun nouveau message" }
      )}
      {renderMenuButton(
        <MessageSquare className="h-4 w-4" />, "Messages internes",
        handleOpenInternalMessages,
        { badge: `${internalMessageCount}`, description: "Communications d'équipe" }
      )}
      {renderMenuButton(
        <CreditCard className="h-4 w-4" />, "Demande de paiement",
        handleOpenPaymentRequest,
        { disabled: !isSellerPayoutEnabled, description: `Revenu: ${sellerRevenue.toLocaleString()} F CFA (min ${sellerPayoutThreshold.toLocaleString()})`, tone: isSellerPayoutEnabled ? 'default' : 'warning' }
      )}
      {renderMenuButton(
        <Gift className="h-4 w-4" />, "Retrait de points",
        handleOpenPointsWithdrawal,
        { disabled: !isPointsWithdrawalEnabled, description: `Points: ${userPoints.toLocaleString()} (min ${pointsWithdrawalThreshold.toLocaleString()})`, tone: isPointsWithdrawalEnabled ? 'default' : 'warning' }
      )}
      {renderMenuButton(<Coins className="h-4 w-4" />, "Achat de points", handleOpenPointsPurchase)}
      {renderMenuButton(<Send className="h-4 w-4" />, "Transfert de points", handleOpenPointsTransfer)}
      {renderMenuButton(<RefreshCw className="h-4 w-4" />, "Échange de points", handleOpenPointsExchange)}
      {renderMenuButton(
        <Sparkles className="h-4 w-4" />, "Recommandation IA",
        handleOpenAiRecommendation,
        { disabled: !isAiRecommendationEnabled, description: isAiRecommendationEnabled ? "Suggestions personnalisées" : "Disponible bientôt", tone: isAiRecommendationEnabled ? 'default' : 'warning' }
      )}
      {renderMenuButton(<Settings className="h-4 w-4" />, "Paramètres", () => navigateToDashboardSection('settings'))}
      <div className="my-2 h-px bg-gray-100" />
      {renderMenuButton(<LogOut className="h-4 w-4" />, "Déconnexion", () => { setShowUserDropdown(false); handleLogout() }, { tone: 'danger' })}
    </div>
  )

  const renderSellerMenu = () => (
    <div className="py-1">
      {renderMenuButton(<Home className="h-4 w-4" />, "Tableau de bord", () => navigateToDashboardSection('overview'))}
      {renderMenuButton(<User className="h-4 w-4" />, "Profil", () => navigateToDashboardSection('profile'))}
      {renderMenuButton(
        <MessageCircle className="h-4 w-4" />, "Chat",
        handleOpenChat,
        { badge: chatUnreadCount > 0 ? `${chatUnreadCount}` : undefined, description: chatUnreadCount > 0 ? "Nouveaux messages" : "Aucun nouveau message" }
      )}
      {renderMenuButton(
        <MessageSquare className="h-4 w-4" />, "Messages internes",
        handleOpenInternalMessages,
        { badge: `${internalMessageCount}`, description: "Communications d'équipe" }
      )}
      {renderMenuButton(
        <Gift className="h-4 w-4" />, "Demande de retrait",
        handleOpenPointsWithdrawal,
        { disabled: !isPointsWithdrawalEnabled, description: `Points: ${userPoints.toLocaleString()} (min ${pointsWithdrawalThreshold.toLocaleString()})`, tone: isPointsWithdrawalEnabled ? 'default' : 'warning' }
      )}
      {renderMenuButton(<Coins className="h-4 w-4" />, "Achat de points", handleOpenPointsPurchase)}
      {renderMenuButton(<Send className="h-4 w-4" />, "Transfert de points", handleOpenPointsTransfer)}
      {renderMenuButton(<RefreshCw className="h-4 w-4" />, "Échange de points", handleOpenPointsExchange)}
      {renderMenuButton(<Settings className="h-4 w-4" />, "Paramètres", () => navigateToDashboardSection('settings'))}
      <div className="my-2 h-px bg-gray-100" />
      {renderMenuButton(<LogOut className="h-4 w-4" />, "Déconnexion", () => { setShowUserDropdown(false); handleLogout() }, { tone: 'danger' })}
    </div>
  )

  const renderSuperAdminMenu = () => (
    <div className="py-1">
      {renderMenuButton(<Home className="h-4 w-4" />, "Tableau de bord", () => navigateToDashboardSection('overview'))}
      {renderMenuButton(<Settings className="h-4 w-4" />, "Paramètres", () => navigateToDashboardSection('settings'))}
      <div className="my-2 h-px bg-gray-100" />
      {renderMenuButton(<LogOut className="h-4 w-4" />, "Déconnexion", () => { setShowUserDropdown(false); handleLogout() }, { tone: 'danger' })}
    </div>
  )

  const renderDriverMenu = () => (
    <div className="py-1">
      {renderMenuButton(<Home className="h-4 w-4" />, "Tableau de bord", () => { router.push('/driver-dashboard'); setShowUserDropdown(false) })}
      <div className="my-2 h-px bg-gray-100" />
      {renderMenuButton(<LogOut className="h-4 w-4" />, "Déconnexion", () => { setShowUserDropdown(false); handleLogout() }, { tone: 'danger' })}
    </div>
  )

  const renderUserMenu = () => {
    switch (userRole) {
      case 'client':
        return renderClientMenu()
      case 'vendor':
        return renderSellerMenu()
      case 'admin':
        return renderSuperAdminMenu()
      case 'driver':
        return renderDriverMenu()
      default:
        return renderClientMenu()
    }
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <header className="bg-[#535455] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="animate-pulse bg-gray-600 h-10 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-64 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-48 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-[#535455] text-white fixed-header">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo Probooster */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-12 w-40 max-w-[180px]">
              <Image
                src="/images/logo.png"
                alt="Probooster Logo"
                fill
                sizes="(max-width: 768px) 160px, 180px"
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-6">
            <div className="relative">
              <Input
                type="search"
                placeholder="Rechercher des produits..."
                className="w-full pl-4 pr-12 py-3 rounded-full bg-white text-black border-0 focus:ring-2 focus:ring-[#ff6600] text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#ff6600] hover:bg-[#e55a00] rounded-full h-10 w-10"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-24 bg-gray-600 border-gray-500 text-white rounded-full px-3 py-2">
                <SelectValue />
                <ChevronDown className="h-4 w-4 ml-1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fcfa">F CFA</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="usd">USD</SelectItem>
              </SelectContent>
            </Select>

            {/* Points Display with Progress Bar */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center space-x-2 text-sm bg-gray-600 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-500 transition-colors duration-300">
                  {/* Icône des pièces dorées avec animation haut-bas alternée */}
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    {/* Première pièce (gauche) - Animation vers le haut */}
                    <div className="absolute left-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0s' }}>
                      1
                    </div>
                    {/* Deuxième pièce (droite) avec checkmark - Animation vers le bas */}
                    <div className="absolute right-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0.75s' }}>
                      ✓
                    </div>
                    {/* Effet de brillance subtil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-yellow-200/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs">
                      {userPoints} pts ({pointsValue.toLocaleString()} F CFA)
                    </span>
                    <div className="w-24 mt-1">
                      <Progress value={progressPercentage} className="h-1 bg-gray-500" />
                      <div className="text-xs text-gray-300 mt-1 whitespace-nowrap">
                        {progressPercentage >= 100
                          ? "Retrait disponible"
                          : `${withdrawalThreshold.toLocaleString()} F CFA requis`}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-[#ff6600]" />
                    <span>Mes Points</span>
                  </DialogTitle>
                  <DialogDescription>
                    Gérez vos points de fidélité et consultez votre solde actuel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white">
                    <CardHeader>
                      <CardTitle className="text-xl">Solde Actuel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{userPoints} points</div>
                      <div className="text-sm opacity-90">Valeur: {pointsValue.toLocaleString()} F CFA</div>
                      <Progress value={progressPercentage} className="h-2 bg-white/20 mt-3" />
                      <div className="text-xs mt-2">
                        {progressPercentage >= 100 
                          ? "✅ Retrait disponible" 
                          : `${withdrawalThreshold - pointsValue} F CFA restants pour le retrait`}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {progressPercentage >= 100 && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleWithdrawPoints}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      <HeaderUser isLoggedIn={isLoggedIn} userRole={userRole} userName={userName} userId={userId} userPoints={userPoints} pointsValue={pointsValue} pointsLevel={pointsLevel} onLogout={signOut} chatUnreadCount={chatUnreadCount} internalMessageCount={internalMessageCount} vendorRevenue={sellerRevenue} vendorThreshold={sellerPayoutThreshold} pointsThreshold={pointsWithdrawalThreshold} isAiEnabled={isAiRecommendationEnabled} openModal={openDashboardModal} navigateTo={navigateToDashboardSection} />
                      Retirer mes points
                    </Button>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p>💡 Gagnez des points en partageant des produits sur les réseaux sociaux !</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showPointsWithdrawalModal} onOpenChange={setShowPointsWithdrawalModal}>
              <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Retirer des Points</DialogTitle>
                  <DialogDescription>
                    Convertissez vos points en devise selon la méthode de paiement choisie
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-4 pb-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span>Solde disponible</span>
                        <span className="font-semibold text-[#ff6600]">{formatPointsValue(userPoints)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Valeur estimée</span>
                        <span>{formatMoney(userPoints * (Number((configuration as any)?.settings?.withdrawalValue) || 1))}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="header-withdrawal-amount">Nombre de points à retirer</Label>
                      <Input
                        id="header-withdrawal-amount"
                        type="number"
                        placeholder="Ex: 3 000"
                        value={pointsWithdrawalAmountInput}
                        onChange={(event) => setPointsWithdrawalAmountInput(event.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label>Méthode de paiement</Label>
                      {withdrawalMethods.length > 0 ? (
                        <RadioGroup
                          value={pointsWithdrawalMethodId}
                          onValueChange={(value) => setPointsWithdrawalMethodId(value)}
                          className="grid gap-3"
                        >
                          {withdrawalMethods.map((method: any) => {
                            const methodValue = String(method?.id ?? method?.name ?? '')
                            const isSelected = String(pointsWithdrawalMethodId) === methodValue
                            const limit = Array.isArray(method?.limits) ? method.limits[0] : null
                            return (
                              <div
                                key={methodValue}
                                className={`rounded-lg border ${isSelected ? 'border-[#ff6600] ring-2 ring-[#ff6600]/20' : 'border-gray-200'} bg-white transition-colors`}
                              >
                                <RadioGroupItem value={methodValue} id={`header-method-${methodValue}`} className="sr-only" />
                                <label
                                  htmlFor={`header-method-${methodValue}`}
                                  className="block cursor-pointer p-4 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className={`h-3 w-3 rounded-full border ${isSelected ? 'border-[#ff6600] bg-[#ff6600]' : 'border-gray-300'}`} />
                                      <span className="font-medium text-gray-900">{String(method?.name ?? '')}</span>
                                    </div>
                                    {limit?.processingTime && (
                                      <span className="text-xs text-muted-foreground">{String(limit.processingTime)}</span>
                                    )}
                                  </div>
                                  {method?.description && (
                                    <p className="text-sm text-gray-600">{String(method.description)}</p>
                                  )}

                                  {isSelected && (
                                    <div className="mt-3 space-y-2 border-t border-dashed border-gray-200 pt-3">
                                      <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                                        <span>
                                          {pointsWithdrawalIdentifierConfig.label}
                                          {pointsWithdrawalIdentifierConfig.required && <span className="ml-1 text-[#ff6600]">*</span>}
                                        </span>
                                        {limit?.processingTime && (
                                          <span className="text-xs text-muted-foreground">{String(limit.processingTime)}</span>
                                        )}
                                      </div>
                                      <Input
                                        type={pointsWithdrawalIdentifierConfig.type}
                                        placeholder={pointsWithdrawalIdentifierConfig.placeholder}
                                        value={pointsWithdrawalIdentifier}
                                        onChange={(event) => setPointsWithdrawalIdentifier(event.target.value)}
                                      />
                                      {pointsWithdrawalIdentifierConfig.helper && (
                                        <p className="text-xs text-muted-foreground">{pointsWithdrawalIdentifierConfig.helper}</p>
                                      )}
                                    </div>
                                  )}
                                </label>
                              </div>
                            )
                          })}
                        </RadioGroup>
                      ) : (
                        <Alert variant="default" className="text-sm">
                          <AlertDescription>
                            Aucune méthode de retrait n’est disponible pour le moment.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {Boolean((configuration as any)?.limits?.withdrawal) && (
                      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Min retrait</span>
                          <span>{formatPointsValue(withdrawalMinPoints)}</span>
                        </div>
                        {((configuration as any)?.limits?.withdrawal as any)?.max !== null && ((configuration as any)?.limits?.withdrawal as any)?.max !== undefined && (
                          <div className="flex items-center justify-between">
                            <span>Max retrait</span>
                            <span>{formatPointsValue(Number(((configuration as any)?.limits?.withdrawal as any)?.max))}</span>
                          </div>
                        )}
                        {selectedMethodLimit?.processingTime && (
                          <div className="flex items-center justify-between">
                            <span>Délai estimé</span>
                            <span>{String(selectedMethodLimit.processingTime)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Points saisis</span>
                        <span>{formatPointsValue(withdrawalAmountValue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Frais estimés</span>
                        <span>{formatPointsValue(withdrawalFee)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total débité</span>
                        <span>{formatPointsValue(withdrawalTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span>Paiement estimé</span>
                        <span>{formatMoney(withdrawalPayout)}</span>
                      </div>
                    </div>

                    {withdrawalLimitMessage && (
                      <Alert variant="destructive" className="text-sm">
                        <AlertDescription>{withdrawalLimitMessage}</AlertDescription>
                      </Alert>
                    )}

                    {pointsWithdrawalError && (
                      <Alert variant="destructive" className="text-sm">
                        <AlertDescription>{pointsWithdrawalError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowPointsWithdrawalModal(false)}
                    disabled={pointsWithdrawalProcessing}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={submitPointsWithdrawal}
                    disabled={
                      withdrawalAmountValue <= 0 ||
                      Boolean(withdrawalLimitMessage) ||
                      pointsWithdrawalProcessing ||
                      !selectedWithdrawalMethodDetails
                    }
                  >
                    {pointsWithdrawalProcessing ? 'Demande en cours...' : 'Confirmer le retrait'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* User Avatar */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setShowUserDropdown(prev => !prev)}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff6600] rounded-full"
              >
                <Avatar className="h-8 w-8 group hover:scale-110 transition-transform duration-300 hover:shadow-lg cursor-pointer">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-gray-600 group-hover:bg-[#ff6600] transition-transform durée-300">
                    <User className="h-4 w-4 group-hover:scale-110 transition-transform durée-300 text-white" />
                  </AvatarFallback>
                </Avatar>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white text-gray-700 shadow-2xl ring-1 ring-black/10 py-3 animate-[dropdown-open_160ms_ease-out] origin-top-right z-50">
                  {renderUserHeader()}
                  {renderUserMenu()}
                </div>
              )}
            </div>

            {/* Wishlist - Modal Redesigné */}
            <Dialog open={showWishlistModal} onOpenChange={setShowWishlistModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <Heart className="h-5 w-5 text-red-500 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  {wishlistItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#ff6600] text-xs p-0 flex items-center justify-center animate-bounce">
                      {wishlistItems}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderWishlist />
              </DialogContent>
            </Dialog>

            {/* Panier - Modal Redesigné */}
            <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <ShoppingCart className="h-5 w-5 text-orange-400 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  {cartItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#ff6600] text-xs p-0 flex items-center justify-center animate-bounce">
                      {cartItems}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderCart />
              </DialogContent>
            </Dialog>

            {/* Comparaison - Modal Redesigné */}
            <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  {compareListLength > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-500 text-xs p-0 flex items-center justify-center animate-bounce">
                      {compareListLength}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderCompare />
              </DialogContent>
            </Dialog>

            {/* Livraison - Modal Redesigné */}
            <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <Truck className="h-5 w-5 text-white group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-xs p-0 flex items-center justify-center animate-bounce">
                    <span suppressHydrationWarning>{deliveriesInProgressCount}</span>
                  </Badge>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderDelivery />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t border-gray-600 bg-gray-700">
          <div className="flex items-center justify-center space-x-12 py-4">
            <Link href="/" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Home className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium">Accueil</span>
            </Link>

            <Link href="/products" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/products" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <div className="relative">
                <Lock className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                  pathname === "/products" ? "text-[#ff6600]" : ""
                }`} style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-xs font-medium">Boutique</span>
            </Link>

            <Link href="/categories" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/categories" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Grid className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/categories" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '4s' }} />
              <span className="text-xs font-medium">Catégories</span>
            </Link>

            <Link href="/best-sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/best-sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Flame className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/best-sellers" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '2.5s' }} />
              <span className="text-xs font-medium">Meilleures ventes</span>
            </Link>

            <Link href="/new-arrivals" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/new-arrivals" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Sparkles className={`h-6 w-6 group-hover:animate-bounce transition-transform duration-200 ${
                pathname === "/new-arrivals" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium group-hover:translate-y-1 transition-transform duration-300">Nouveautés</span>
            </Link>

            <Link href="/sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <div className={`rounded-lg p-2 ${
                pathname === "/sellers" ? "bg-[#ff6600]/20" : "bg-gray-600"
              }`}>
                <Store className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 animate-bounce ${
                  pathname === "/sellers" ? "text-[#ff6600]" : "text-[#ff6600]"
                }`} style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-xs font-medium">Vendeurs</span>
            </Link>

            <Link href="/support" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/support" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Headphones className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/support" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium">Support</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
