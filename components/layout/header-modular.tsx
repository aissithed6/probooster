"use client"

import { useMemo, useState, useEffect, useRef, useCallback, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, ChevronDown, Gift, Heart, ShoppingCart, User, ChevronLeft, ChevronRight, Home, ShoppingBag, Grid, Flame, Sparkles, Store, Headphones, Lock, Truck, LogOut, Settings, CreditCard, Bell, Package, MapPin, Clock, CheckCircle, X, Share2, Coins, Star, BarChart3, Shield, Trash2, Zap, Smartphone, RefreshCw, Phone, Mail, Minus, Plus, Calculator, Info, Calendar, MessageCircle, MessageSquare, FileText, Download, Copy, Printer, HelpCircle, Save, Globe, ArrowLeft, ArrowRight, Volume2, RotateCcw, AlertTriangle, List, BookOpen, Send, Users, Building, Car, Camera, Music, Gamepad2, Palette, Wrench, Hammer, Drill, Ruler, Microscope, TestTube, Atom, Dna, Leaf, Flower, Sun, Moon, Cloud, Wind, Rainbow, Umbrella, Snowflake, Droplets, Waves, Fish, Bird, Cat, Dog, Rabbit, Mouse, Rat, Turtle, Shell, Diamond, Bone, Eye, Glasses, Shirt, Wallet, Backpack, Briefcase, Bed, Table, Apple, Play, Smile, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CartService,
  WishlistService
} from "@/lib/services"
import { ClientDeliveryService, type ClientDelivery } from "@/lib/services/client-delivery-service"
import { ClientPointsService } from "@/lib/services/client-points-service"
import { useAuth } from "@/contexts/AuthContext"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { usePublicGlobalSettings } from "@/contexts/PublicGlobalSettingsContext"

// Import des composants enfants modulaires
import HeaderCart from "./header-cart"
import HeaderWishlist from "./header-wishlist"
import HeaderCompare from "./header-compare"
import HeaderDelivery from "./header-delivery"

const renderGuestActions = () => (
  <div className="flex items-center space-x-3">
    <Link
      href="/auth/login"
      className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-[#ff6600] shadow-sm hover:bg-orange-50 transition-colors"
    >
      Connexion
    </Link>
    <Link
      href="/auth/register"
      className="px-5 py-2 rounded-full text-sm font-semibold bg-[#ff6600] text-white shadow-md hover:bg-[#ff5500] transition-colors"
    >
      Inscription
    </Link>
  </div>
)

type UserRole = 'client' | 'vendor' | 'admin' | 'driver'

const getRoleLabel = (role: UserRole) => {
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

type MenuTone = 'default' | 'warning' | 'danger'

const toneClasses: Record<MenuTone, string> = {
  default: "hover:bg-orange-50 hover:text-[#ff6600] text-gray-700",
  warning: "hover:bg-yellow-50 hover:text-[#ff6600] text-gray-700",
  danger: "hover:bg-red-50 text-red-600"
}

const renderMenuButton = (
  icon: ReactNode,
  label: string,
  onClick: () => void,
  options?: { badge?: string; disabled?: boolean; description?: string; tone?: MenuTone }
) => {
  const { badge, disabled, description, tone = 'default' } = options || {}
  const baseClasses = "flex w-full items-center justify-between px-4 py-3 text-sm transition-colors"

  return (
    <button
      type="button"
      className={[baseClasses, toneClasses[tone], disabled ? "opacity-60 cursor-not-allowed" : ""].join(" ")}
      onClick={() => {
        if (!disabled) {
          onClick()
        }
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

export default function HeaderModular({
  initialPointsConfig
}: {
  initialPointsConfig?: { withdrawalValue?: number | null; withdrawalMinPoints?: number | null } | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: publicSettings } = usePublicGlobalSettings()
  
  // Fonction de formatage des nombres pour éviter les erreurs d'hydratation
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  }
  
  // États avec valeurs par défaut
  const { user, userProfile, loyaltyPoints, signOut } = useAuth()
  const { balance, estimatedValue, basePointValue, configuration } = useClientPoints()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPoints, setUserPoints] = useState(() => {
    const initial = Number((loyaltyPoints as any)?.points_balance ?? 0)
    return Number.isFinite(initial) && initial >= 0 ? initial : 0
  })
  const [pointsValue, setPointsValue] = useState(() => {
    const initial = Number((loyaltyPoints as any)?.fcfa_value ?? 0)
    return Number.isFinite(initial) && initial >= 0 ? initial : 0
  })
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState("fcfa")
  const [showCartModal, setShowCartModal] = useState(false)
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareListLength, setCompareListLength] = useState(0)
  const [deliveriesInProgressCount, setDeliveriesInProgressCount] = useState(() => {
    const cached = readDeliveriesCache()
    return computeInProgressCounts(cached).deliveriesInProgressCount
  })
  const [ordersInProgressCount, setOrdersInProgressCount] = useState(() => {
    const cached = readDeliveriesCache()
    return computeInProgressCounts(cached).ordersInProgressCount
  })
  const [isClient, setIsClient] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement | null>(null)
  const [userRole, setUserRole] = useState<UserRole>('client')
  const [userId, setUserId] = useState<string>("INV-0000")
  const [userName, setUserName] = useState<string>("Invité")
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

  const openInlineAuthFromHeader = useCallback(
    (message: string) => {
      setShowCartModal(true)
      try {
        if (typeof window !== 'undefined') {
          window.setTimeout(() => {
            try {
              window.dispatchEvent(
                new CustomEvent('probooster:openCheckoutAuth', {
                  detail: { message }
                })
              )
            } catch {
              // ignore
            }
          }, 0)
        }
      } catch {
        // ignore
      }
    },
    [setShowCartModal]
  )

  const getCartQuantityCount = (items: any[]) => {
    return (items ?? []).reduce((sum, item) => sum + (Number(item?.quantity ?? 0) || 0), 0)
  }

  /**
   * Détermine si une livraison est considérée comme "en cours".
   */
  function isDeliveryInProgress(status: string | null | undefined): boolean {
    if (!status) return true
    return !['delivered', 'cancelled', 'failed'].includes(status)
  }

  /**
   * Calcule les compteurs "livraisons en cours" et "commandes en cours" depuis la liste des livraisons.
   */
  function computeInProgressCounts(list: ClientDelivery[]) {
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

  /**
   * Lit la liste des livraisons depuis le cache localStorage.
   */
  function readDeliveriesCache(): ClientDelivery[] {
    try {
      if (typeof window === 'undefined') return []
      const raw = window.localStorage?.getItem('probooster_client_deliveries_cache')
      const parsed = raw ? JSON.parse(raw) : null
      const list = parsed?.data
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  }

  const isPointsFrozen = Boolean((loyaltyPoints as any)?.is_frozen ?? false)
  const pointsFrozenReason = (((loyaltyPoints as any)?.freeze_reason ?? '') as string).toString().trim()

  /**
   * Formate un nombre de points en affichage lisible.
   */
  const formatPointsValue = useCallback((value: number) => {
    const numeric = Number(value) || 0
    return `${numeric.toLocaleString()} pts`
  }, [])

  /**
   * Formate un montant FCFA (ou devise par défaut) pour l'affichage.
   */
  const formatMoney = useCallback((value: number) => {
    const numeric = Number(value) || 0
    return `${numeric.toLocaleString()} F CFA`
  }, [])

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

  /**
   * Construit la config du champ "identifiant" (ex: numéro Mobile Money) selon la méthode choisie.
   */
  const pointsWithdrawalIdentifierConfig = useMemo(() => {
    const selected = withdrawalMethods.find((m: any) => (m?.id ?? m?.name) === pointsWithdrawalMethodId) ?? null
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

    const availableBalance = Number(balance ?? 0) || 0
    if (withdrawalTotal > availableBalance) {
      return 'Solde insuffisant pour couvrir le retrait et les frais'
    }

    return null
  }, [balance, configuration?.limits?.withdrawal, formatPointsValue, withdrawalAmountValue, withdrawalTotal])

  useEffect(() => {
    if (!showPointsWithdrawalModal) return
    setPointsWithdrawalError(null)
    if (!pointsWithdrawalMethodId && withdrawalMethods.length > 0) {
      const first = withdrawalMethods[0]
      setPointsWithdrawalMethodId(String(first?.id ?? first?.name ?? ''))
    }
  }, [showPointsWithdrawalModal, pointsWithdrawalMethodId, withdrawalMethods])

  /**
   * Ouvre le modal de retrait de points depuis l'entête.
   */
  const openPointsWithdrawalModal = useCallback(() => {
    setPointsWithdrawalError(null)
    setShowPointsWithdrawalModal(true)
  }, [])

  /**
   * Soumet une demande de retrait de points (même backend que le dashboard).
   */
  const submitPointsWithdrawal = useCallback(async () => {
    if (!user?.id) {
      setPointsWithdrawalError('Utilisateur non authentifié')
      return
    }

    if (isPointsFrozen) {
      setPointsWithdrawalError(pointsFrozenReason ? `Compte gelé: ${pointsFrozenReason}` : 'Compte gelé : opération désactivée')
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la demande de retrait'
      setPointsWithdrawalError(message)
    } finally {
      setPointsWithdrawalProcessing(false)
    }
  }, [configuration, isPointsFrozen, pointsFrozenReason, pointsWithdrawalAmountInput, pointsWithdrawalIdentifier, pointsWithdrawalIdentifierConfig.label, pointsWithdrawalIdentifierConfig.required, pointsWithdrawalMethodId, user?.id, withdrawalMethods])

  const resolvedPoints = useMemo(() => balance ?? 0, [balance])
  const resolvedValue = useMemo(() => estimatedValue ?? 0, [estimatedValue])

  const pointsWithdrawalMinPoints = useMemo(() => {
    const initialRaw = Number((initialPointsConfig as any)?.withdrawalMinPoints)
    if (Number.isFinite(initialRaw) && initialRaw > 0) return initialRaw

    const raw = (configuration?.limits?.withdrawal as any)?.min
    const numeric = Number(raw)
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 5000
  }, [configuration?.limits?.withdrawal, initialPointsConfig])

  const withdrawalThresholdValue = useMemo(() => {
    const initialWithdrawalValueRaw = Number((initialPointsConfig as any)?.withdrawalValue)
    const withdrawalValue = Number.isFinite(initialWithdrawalValueRaw) && initialWithdrawalValueRaw > 0
      ? initialWithdrawalValueRaw
      : Number((configuration as any)?.settings?.withdrawalValue)

    const safeWithdrawalValue = Number.isFinite(withdrawalValue) && withdrawalValue > 0
      ? withdrawalValue
      : (() => {
          const safeBasePointValue = Number(basePointValue)
          return Number.isFinite(safeBasePointValue) && safeBasePointValue > 0 ? safeBasePointValue : 1
        })()

    return Number((pointsWithdrawalMinPoints * safeWithdrawalValue).toFixed(2))
  }, [basePointValue, configuration, initialPointsConfig, pointsWithdrawalMinPoints])

  const effectiveWithdrawalValue = useMemo(() => {
    const initialWithdrawalValueRaw = Number((initialPointsConfig as any)?.withdrawalValue)
    const fromInitial = Number.isFinite(initialWithdrawalValueRaw) && initialWithdrawalValueRaw > 0 ? initialWithdrawalValueRaw : NaN
    if (Number.isFinite(fromInitial) && fromInitial > 0) return fromInitial

    const fromConfig = Number((configuration as any)?.settings?.withdrawalValue)
    if (Number.isFinite(fromConfig) && fromConfig > 0) return fromConfig

    const safeBasePointValue = Number(basePointValue)
    return Number.isFinite(safeBasePointValue) && safeBasePointValue > 0 ? safeBasePointValue : 1
  }, [basePointValue, configuration, initialPointsConfig])

  const pointsValueForWithdrawal = useMemo(() => {
    return Number((userPoints * effectiveWithdrawalValue).toFixed(2))
  }, [effectiveWithdrawalValue, userPoints])

  const isSellerPayoutEnabled = sellerRevenue >= sellerPayoutThreshold
  const isPointsWithdrawalEnabled = userPoints >= pointsWithdrawalMinPoints

  const renderUserHeader = () => (
    <div className="px-4 pb-3 border-b border-gray-100">
      <p className="text-xs uppercase tracking-wider text-[#ff6600] font-semibold">{getRoleLabel(userRole)}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{userName}</p>
      <p className="text-xs text-gray-500">ID: {userId}</p>
      {(userRole === 'client' || userRole === 'vendor') && (
        <div className={["mt-3 rounded-xl px-3 py-2 text-xs flex items-center justify-between", isPointsFrozen ? "bg-gray-100 text-gray-600" : "bg-orange-50 text-[#ff6600]"].join(' ')}>
          <span>Solde</span>
          <div className="flex items-center gap-2">
            {isPointsFrozen && (
              <span className="rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-semibold">Gelé</span>
            )}
            <strong className={isPointsFrozen ? 'text-gray-600' : ''}>{formatNumber(pointsValueForWithdrawal)} F CFA</strong>
          </div>
        </div>
      )}
      {userRole !== 'admin' && (
        <div className={["mt-2 rounded-xl px-3 py-2 text-xs flex items-center justify-between", isPointsFrozen ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-600"].join(' ')}>
          <span>Points ({pointsLevel})</span>
          <div className="flex items-center gap-2">
            {isPointsFrozen && (
              <span className="rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-semibold">Gelé</span>
            )}
            <strong className={isPointsFrozen ? 'text-gray-600' : ''}>{userPoints.toLocaleString()}</strong>
          </div>
        </div>
      )}
    </div>
  )

  const renderClientMenu = () => (
    <div className="py-1">
      {renderMenuButton(<Home className="h-4 w-4" />, "Tableau de bord", () => navigateToDashboardSection('overview'))}
      {renderMenuButton(<User className="h-4 w-4" />, "Profil", () => navigateToDashboardSection('profile'))}
      {renderMenuButton(
        <MessageCircle className="h-4 w-4" />, "Chat",
        () => openDashboardModal('openChatModal', 'chat'),
        { badge: chatUnreadCount > 0 ? `${chatUnreadCount}` : undefined, description: chatUnreadCount > 0 ? "Nouveaux messages" : "Aucun nouveau message" }
      )}
      {renderMenuButton(
        <MessageSquare className="h-4 w-4" />, "Messages internes",
        () => openDashboardModal('openInternalMessageModal', 'messaging'),
        { badge: `${internalMessageCount}`, description: "Communications d'équipe" }
      )}
      {renderMenuButton(
        <Gift className="h-4 w-4" />, "Retrait de points",
        () => openDashboardModal('openPointsWithdrawalModal', 'points'),
        {
          disabled: isPointsFrozen || !isPointsWithdrawalEnabled,
          description: isPointsFrozen
            ? (pointsFrozenReason ? `Compte gelé: ${pointsFrozenReason}` : 'Compte gelé : opération désactivée')
            : `Points: ${userPoints.toLocaleString()} (min ${pointsWithdrawalMinPoints.toLocaleString()})`,
          tone: isPointsFrozen ? 'warning' : isPointsWithdrawalEnabled ? 'default' : 'warning'
        }
      )}
      {renderMenuButton(<Coins className="h-4 w-4" />, "Achat de points", () => openDashboardModal('openPointsPurchaseModal', 'points'))}
      {renderMenuButton(
        <Send className="h-4 w-4" />,
        "Transfert de points",
        () => openDashboardModal('openPointsTransferModal', 'points'),
        {
          disabled: isPointsFrozen,
          description: isPointsFrozen
            ? (pointsFrozenReason ? `Compte gelé: ${pointsFrozenReason}` : 'Compte gelé : opération désactivée')
            : undefined,
          tone: isPointsFrozen ? 'warning' : 'default'
        }
      )}
      {renderMenuButton(
        <RefreshCw className="h-4 w-4" />,
        "Échange de points",
        () => openDashboardModal('openPointsExchangeModal', 'points'),
        {
          disabled: isPointsFrozen,
          description: isPointsFrozen
            ? (pointsFrozenReason ? `Compte gelé: ${pointsFrozenReason}` : 'Compte gelé : opération désactivée')
            : undefined,
          tone: isPointsFrozen ? 'warning' : 'default'
        }
      )}
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

  const renderVendorMenu = () => (
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
        () => openDashboardModal('openInternalMessageModal', 'messaging'),
        { badge: `${internalMessageCount}`, description: "Communications d'équipe" }
      )}
      {renderMenuButton(
        <CreditCard className="h-4 w-4" />, "Demande de paiement",
        () => openDashboardModal('openPaymentRequestModal', 'points'),
        { disabled: !isSellerPayoutEnabled, description: `Revenu: ${sellerRevenue.toLocaleString()} F CFA (min ${sellerPayoutThreshold.toLocaleString()})`, tone: isSellerPayoutEnabled ? 'default' : 'warning' }
      )}
      {renderMenuButton(
        <Gift className="h-4 w-4" />, "Retrait de points",
        () => openDashboardModal('openPointsWithdrawalModal', 'points'),
        { disabled: !isPointsWithdrawalEnabled, description: `Points: ${userPoints.toLocaleString()} (min ${pointsWithdrawalMinPoints.toLocaleString()})`, tone: isPointsWithdrawalEnabled ? 'default' : 'warning' }
      )}
      {renderMenuButton(<Coins className="h-4 w-4" />, "Achat de points", () => openDashboardModal('openPointsPurchaseModal', 'points'))}
      {renderMenuButton(<Send className="h-4 w-4" />, "Transfert de points", () => openDashboardModal('openPointsTransferModal', 'points'))}
      {renderMenuButton(<RefreshCw className="h-4 w-4" />, "Échange de points", () => openDashboardModal('openPointsExchangeModal', 'points'))}
      {renderMenuButton(<Settings className="h-4 w-4" />, "Paramètres", () => navigateToDashboardSection('settings'))}
      <div className="my-2 h-px bg-gray-100" />
      {renderMenuButton(<LogOut className="h-4 w-4" />, "Déconnexion", () => { setShowUserDropdown(false); handleLogout() }, { tone: 'danger' })}
    </div>
  )

  const renderAdminMenu = () => (
    <div className="py-1">
      {renderMenuButton(<Home className="h-4 w-4" />, "Tableau de bord", () => navigateToDashboardSection('overview'))}
      {renderMenuButton(<Settings className="h-4 w-4" />, "Paramètres", () => navigateToDashboardSection('settings'))}
      <div className="my-2 h-px bg-gray-100" />
      {renderMenuButton(<LogOut className="h-4 w-4" />, "Déconnexion", () => { setShowUserDropdown(false); handleLogout() }, { tone: 'danger' })}
    </div>
  )

  const renderUserMenu = () => {
    switch (userRole) {
      case 'client':
        return renderClientMenu()
      case 'vendor':
        return renderVendorMenu()
      case 'admin':
        return renderAdminMenu()
      default:
        return renderClientMenu()
    }
  }

  const getDashboardPath = (role: UserRole, section?: string) => {
    const basePath = role === 'vendor'
      ? '/seller-dashboard'
      : role === 'admin'
        ? '/super-admin-dashboard'
        : '/dashboard'
    return section ? `${basePath}?section=${section}` : basePath
  }

  const navigateToDashboardSection = (section: string) => {
    const targetUrl = getDashboardPath(userRole, section)
    router.push(targetUrl)
    setShowUserDropdown(false)
  }

  const openDashboardModal = (eventName: string, section?: string) => {
    if (typeof window !== 'undefined' && userRole === 'client') {
      window.dispatchEvent(new CustomEvent(eventName))
    }
    const targetUrl = getDashboardPath(userRole, section)
    router.push(targetUrl)
    setShowUserDropdown(false)
  }

  const handleOpenChat = () => {
    openDashboardModal('openChatModal', 'chat')
  }

  const handleOpenInternalMessages = () => {
    openDashboardModal('openInternalMessageModal', 'messaging')
  }

  const handleOpenPaymentRequest = () => {
    openDashboardModal('openPaymentRequestModal', 'points')
  }

  const handleOpenPointsWithdrawal = () => {
    openDashboardModal('openPointsWithdrawalModal', 'points')
  }

  const handleOpenPointsPurchase = () => {
    openDashboardModal('openPointsPurchaseModal', 'points')
  }

  const handleOpenPointsTransfer = () => {
    openDashboardModal('openPointsTransferModal', 'points')
  }

  const handleOpenPointsExchange = () => {
    openDashboardModal('openPointsExchangeModal', 'points')
  }

  const handleOpenAiRecommendation = () => {
    navigateToDashboardSection('recommendations')
  }


  // Initialisation des services et mise à jour des états
  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsClient(true)

    const loggedIn = Boolean(user)
    setIsLoggedIn(loggedIn)

    let normalizedRole: UserRole = 'client'

    if (user) {
      const decorativeId = (userProfile as any)?.short_code || user.id
      setUserId(decorativeId)
      const fullName = `${userProfile?.first_name ?? ''} ${userProfile?.last_name ?? ''}`.trim()
      setUserName(fullName || user.email || 'Utilisateur')

      const rawRole = user.role as string | undefined
      const metadataRole = (userProfile as unknown as { role?: string } | null)?.role
      const fallbackRole = metadataRole && ['client', 'vendor', 'admin', 'driver'].includes(metadataRole)
        ? (metadataRole as UserRole)
        : undefined
      normalizedRole = rawRole === 'seller'
        ? 'vendor'
        : rawRole === 'super_admin'
          ? 'admin'
          : rawRole === 'driver'
            ? 'driver'
            : rawRole && ['client', 'vendor', 'admin', 'driver'].includes(rawRole)
              ? (rawRole as UserRole)
              : fallbackRole ?? 'client'
      setUserRole(normalizedRole)

      const ssrBalance = Number((loyaltyPoints as any)?.points_balance ?? NaN)
      const ssrFcfa = Number((loyaltyPoints as any)?.fcfa_value ?? NaN)

      const hasSsrBalance = Number.isFinite(ssrBalance) && ssrBalance >= 0
      const hasSsrFcfa = Number.isFinite(ssrFcfa) && ssrFcfa >= 0

      const clientBalance = Number(resolvedPoints)
      const clientFcfa = Number(resolvedValue)
      const hasClientBalance = Number.isFinite(clientBalance) && clientBalance > 0
      const hasClientFcfa = Number.isFinite(clientFcfa) && clientFcfa > 0

      // Priorité au SSR (évite les valeurs temporaires à 0), sinon fallback vers client si valeur fiable.
      setUserPoints(hasSsrBalance ? ssrBalance : hasClientBalance ? clientBalance : 0)
      setPointsValue(hasSsrFcfa ? ssrFcfa : hasClientFcfa ? clientFcfa : 0)
      setUserBalance(hasSsrFcfa ? ssrFcfa : hasClientFcfa ? clientFcfa : 0)
      setSellerRevenue((loyaltyPoints as any)?.points_value ?? 0)
      setSellerPayoutThreshold(loyaltyPoints?.withdrawal_threshold ?? sellerPayoutThreshold)
      // Pas d'état local pour le seuil: on utilise directement withdrawalThresholdValue (évite mismatch SSR/client).
      setPointsLevel((userProfile?.preferences?.points_level as 'bronze' | 'silver' | 'gold' | 'platinum') || 'bronze')
      setChatUnreadCount(userProfile?.preferences?.chat_unread ?? 0)
      setInternalMessageCount(userProfile?.preferences?.internal_unread ?? 0)
    } else {
      setUserRole('client')
      setUserId('INV-0000')
      setUserName('Invité')
      setUserPoints(0)
      setPointsValue(0)
      setUserBalance(0)
      setSellerRevenue(0)
      setChatUnreadCount(0)
      setInternalMessageCount(0)
      setPointsLevel('bronze')
    }

    // Initialisation immédiate des compteurs (sans attendre d'événements)
    if (loggedIn && normalizedRole === 'client') {
      const cart = CartService.getCart()
      const wishlist = WishlistService.getWishlist()
      setCartItems(getCartQuantityCount(Array.isArray(cart) ? cart : []))
      setWishlistItems(Array.isArray(wishlist) ? wishlist.length : 0)
    } else {
      setCartItems(0)
      setWishlistItems(0)
    }

    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      setCompareListLength(Array.isArray(compareList) ? compareList.length : 0)
    } catch {
      setCompareListLength(0)
    }

    /**
     * Synchronisation instantanée des compteurs du header.
     * Source: événements émis par les services/hooks (cartUpdated, wishlistUpdated, compareListUpdated).
     */
    const onCartUpdated = (event: any) => {
      try {
        const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
        if (nextCount != null) {
          setCartItems(nextCount)
          return
        }
        const nextCart = Array.isArray(event?.detail?.cart) ? event.detail.cart : CartService.getCart()
        setCartItems(getCartQuantityCount(Array.isArray(nextCart) ? nextCart : []))
      } catch {
        // ignore
      }
    }

    const onWishlistUpdated = (event: any) => {
      try {
        const nextCount = typeof event?.detail?.count === 'number' ? event.detail.count : null
        if (nextCount != null) {
          setWishlistItems(nextCount)
          return
        }
        const nextWishlist = Array.isArray(event?.detail?.wishlist) ? event.detail.wishlist : WishlistService.getWishlist()
        setWishlistItems(Array.isArray(nextWishlist) ? nextWishlist.length : 0)
      } catch {
        // ignore
      }
    }

    const onCompareListUpdated = (event: any) => {
      try {
        const nextLength = typeof event?.detail?.length === 'number'
          ? event.detail.length
          : Array.isArray(event?.detail?.compareList)
            ? event.detail.compareList.length
            : null
        if (nextLength != null) {
          setCompareListLength(nextLength)
          return
        }
        const stored = localStorage.getItem('compareList')
        const parsed = stored ? JSON.parse(stored) : []
        setCompareListLength(Array.isArray(parsed) ? parsed.length : 0)
      } catch {
        // ignore
      }
    }

    window.addEventListener('cartUpdated', onCartUpdated as any)
    window.addEventListener('wishlistUpdated', onWishlistUpdated as any)
    window.addEventListener('compareListUpdated', onCompareListUpdated as any)
    
    const onDeliveriesUpdated = (event: any) => {
      const nextDeliveriesInProgressCount = typeof event?.detail?.deliveriesInProgressCount === 'number'
        ? event.detail.deliveriesInProgressCount
        : null
      const nextOrdersInProgressCount = typeof event?.detail?.ordersInProgressCount === 'number'
        ? event.detail.ordersInProgressCount
        : null

      if (typeof nextDeliveriesInProgressCount === 'number') {
        setDeliveriesInProgressCount(nextDeliveriesInProgressCount)
      }
      if (typeof nextOrdersInProgressCount === 'number') {
        setOrdersInProgressCount(nextOrdersInProgressCount)
      }

      if (typeof nextDeliveriesInProgressCount !== 'number' || typeof nextOrdersInProgressCount !== 'number') {
        const cached = readDeliveriesCache()
        const counts = computeInProgressCounts(cached)
        setDeliveriesInProgressCount(counts.deliveriesInProgressCount)
        setOrdersInProgressCount(counts.ordersInProgressCount)
      }
    }

    window.addEventListener('clientDeliveriesUpdated', onDeliveriesUpdated as any)

    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated as any)
      window.removeEventListener('wishlistUpdated', onWishlistUpdated as any)
      window.removeEventListener('compareListUpdated', onCompareListUpdated as any)
      window.removeEventListener('clientDeliveriesUpdated', onDeliveriesUpdated as any)
    }
  }, [resolvedPoints, resolvedValue, sellerPayoutThreshold, user, userProfile, loyaltyPoints, withdrawalThresholdValue])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user) return

    const cached = readDeliveriesCache()
    const cachedCounts = computeInProgressCounts(cached)
    setDeliveriesInProgressCount(cachedCounts.deliveriesInProgressCount)
    setOrdersInProgressCount(cachedCounts.ordersInProgressCount)

    if (cached.length > 0) {
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const resp = await ClientDeliveryService.list()
        const list = Array.isArray(resp?.data) ? resp.data : []
        if (cancelled) return

        const counts = computeInProgressCounts(list)
        try {
          window.localStorage?.setItem('probooster_client_deliveries_cache', JSON.stringify({
            data: list,
            cachedAt: Date.now()
          }))
        } catch {
          // ignore
        }

        window.dispatchEvent(new CustomEvent('clientDeliveriesUpdated', {
          detail: {
            count: list.length,
            deliveriesInProgressCount: counts.deliveriesInProgressCount,
            ordersInProgressCount: counts.ordersInProgressCount
          }
        }))
      } catch {
        // ignore
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [user])

  // Gestion de la fermeture du menu utilisateur lors d'un clic extérieur
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

  // Écouter les mises à jour de la liste de comparaison
  useEffect(() => {
    const handleCompareListUpdate = (event: CustomEvent) => {
      const { compareList, length } = event.detail
      setCompareListLength(length)
    }

    // Ajouter l'écouteur d'événement
    window.addEventListener('compareListUpdated', handleCompareListUpdate as EventListener)

    // Nettoyer l'écouteur d'événement
    return () => {
      window.removeEventListener('compareListUpdated', handleCompareListUpdate as EventListener)
    }
  }, [])

  // Écouter l'événement pour ouvrir le modal panier depuis le dashboard
  useEffect(() => {
    const handleOpenCartModal = () => {
      setShowCartModal(true)
    }

    // Ajouter l'écouteur d'événement
    window.addEventListener('openCartModal', handleOpenCartModal)

    // Nettoyer l'écouteur d'événement
    return () => {
      window.removeEventListener('openCartModal', handleOpenCartModal)
    }
  }, [])

  // Calcul du pourcentage de progression
  const progressPercentage = Math.min((pointsValueForWithdrawal / (withdrawalThresholdValue || 1)) * 100, 100)

  // Fonction de recherche
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Logique de recherche
      console.log('Recherche:', searchQuery)
    }
  }

  // Fonction pour gérer la comparaison
  const handleAddToCompare = (item: any) => {
    if (typeof window === 'undefined') return

    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      if (!compareList.find((p: any) => p.id === item.id)) {
        if (compareList.length >= 4) {
          alert('Vous ne pouvez comparer que 4 produits maximum !')
          return
        }
        compareList.push(item)
        localStorage.setItem('compareList', JSON.stringify(compareList))
        setCompareListLength(compareList.length)
        alert(`${item.name} ajouté à la comparaison !`)
        setShowCompareModal(true)
      } else {
        alert('Produit déjà dans la comparaison !')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
    }
  }

  const getCompareList = () => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      return userProfile?.preferences?.compare_list ?? []
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste de comparaison:', error)
      return []
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      setIsLoggedIn(false)
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const handleWithdrawPoints = () => {
    try {
      openPointsWithdrawalModal()
    } catch {
      // ignore
    }
  }

  // Afficher le header immédiatement avec des valeurs par défaut
  // Les données seront mises à jour de manière asynchrone

  const hideUserActions = pathname?.startsWith('/auth')
  const resolvedLoggedIn = Boolean(user)

  useEffect(() => {
    const initialBalance = Number((loyaltyPoints as any)?.points_balance ?? 0)
    const initialFcfa = Number((loyaltyPoints as any)?.fcfa_value ?? 0)
    if (Number.isFinite(initialBalance) && initialBalance >= 0) {
      setUserPoints(initialBalance)
    }
    if (Number.isFinite(initialFcfa) && initialFcfa >= 0) {
      setPointsValue(initialFcfa)
    }
  }, [loyaltyPoints])

  /**
   * Résout un chemin de logo sûr pour next/image.
   */
  const resolvedLogoSrc = useMemo(() => {
    const candidate = (publicSettings?.siteConfig?.logoUrl ?? '').trim()
    if (!candidate) return "/images/logo.png"
    return candidate
  }, [publicSettings?.siteConfig?.logoUrl])

  /**
   * Indique si l'on peut utiliser next/image (chemin local). Pour les data: et http(s), on utilise <img>.
   */
  const canUseNextImageForLogo = useMemo(() => {
    return resolvedLogoSrc.startsWith('/')
  }, [resolvedLogoSrc])

  /**
   * Résout le nom du site (fallback "Probooster").
   */
  const resolvedSiteName = useMemo(() => {
    return (publicSettings?.siteConfig?.siteName ?? 'Probooster').toString().trim() || 'Probooster'
  }, [publicSettings?.siteConfig?.siteName])

  return (
    <header className="bg-[#535455] text-white fixed-header">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-2">
            {canUseNextImageForLogo ? (
              <Image
                src={resolvedLogoSrc}
                alt={`${resolvedSiteName} Logo`}
                width={120}
                height={40}
                className="w-[120px] h-[40px]"
                style={{ width: "120px", height: "40px" }}
                priority
              />
            ) : (
              <img
                src={resolvedLogoSrc || '/images/logo.png'}
                alt={`${resolvedSiteName} Logo`}
                className="w-[120px] h-[40px] object-contain"
                style={{ width: "120px", height: "40px" }}
              />
            )}
          </Link>

          <div className="mx-6 flex-1 max-w-xl">
            <div className="relative">
              <Input
                type="search"
                placeholder="Rechercher des produits..."
                className="w-full rounded-full border-0 bg-white px-4 py-3 text-base text-black focus:ring-2 focus:ring-[#ff6600]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 transform rounded-full bg-[#ff6600] hover:bg-[#e55a00]"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {hideUserActions ? (
              renderGuestActions()
            ) : resolvedLoggedIn ? (
              <>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-24 rounded-full border-gray-500 bg-gray-600 px-3 py-2 text-white">
                    <SelectValue />
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fcfa">F CFA</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="usd">USD</SelectItem>
                  </SelectContent>
                </Select>

                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex cursor-pointer items-center space-x-2 rounded-lg bg-gray-600 px-3 py-2 text-sm hover:bg-gray-500 transition-colors duration-300">
                      <div className="relative flex h-7 w-7 items-center justify-center">
                        <div className="absolute left-0 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-xs font-bold text-yellow-900 shadow-lg">
                          1
                        </div>
                        <div className="absolute right-0 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-xs font-bold text-yellow-900 shadow-lg">
                          ✓
                        </div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/20 via-transparent to-yellow-200/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs">
                          {userPoints} pts ({formatNumber(pointsValueForWithdrawal)} F CFA)
                        </span>
                        <div className="mt-1 w-24">
                          <Progress value={progressPercentage} className="h-1 bg-gray-500" />
                          <div className="mt-1 whitespace-nowrap text-xs text-gray-300">
                            {progressPercentage >= 100
                              ? 'Retrait disponible'
                              : `${formatNumber(withdrawalThresholdValue)} F CFA requis`}
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
                          <div className="mb-2 text-3xl font-bold">{userPoints} points</div>
                          <div className="text-sm opacity-90">Valeur: {formatNumber(pointsValueForWithdrawal)} F CFA</div>
                          <Progress value={progressPercentage} className="mt-3 h-2 bg-white/20" />
                          <div className="mt-2 text-xs">
                            {progressPercentage >= 100
                              ? '✅ Retrait disponible'
                              : `${formatNumber(Math.max(0, withdrawalThresholdValue - pointsValueForWithdrawal))} F CFA restants pour le retrait`}
                          </div>
                        </CardContent>
                      </Card>
                      {progressPercentage >= 100 && (
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleWithdrawPoints}>
                          <CreditCard className="mr-2 h-4 w-4" />
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
                            <span className="font-semibold text-[#ff6600]">{formatPointsValue(resolvedPoints)}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Valeur estimée</span>
                            <span>{formatMoney(resolvedPoints * (Number((configuration as any)?.settings?.withdrawalValue) || 1))}</span>
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

                <Dialog
                  open={showWishlistModal}
                  onOpenChange={(nextOpen) => {
                    if (nextOpen && !isLoggedIn) {
                      openInlineAuthFromHeader('Connectez-vous pour accéder à votre liste de souhaits.')
                      return
                    }
                    setShowWishlistModal(nextOpen)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="group relative rounded-full text-white transition-all duration-300 hover:scale-110 hover:bg-[#ff6600] hover:text-white hover:shadow-lg">
                      <Heart className="h-5 w-5 text-red-500 transition-all duration-300 group-hover:scale-110 group-hover:animate-pulse" />
                      {wishlistItems > 0 && (
                        <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6600] p-0 text-xs animate-bounce">
                          {wishlistItems}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Ma Liste de Souhaits</DialogTitle>
                    </DialogHeader>
                    <HeaderWishlist />
                  </DialogContent>
                </Dialog>

                <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="group relative rounded-full text-white transition-all duration-300 hover:scale-110 hover:bg-[#ff6600] hover:text-white hover:shadow-lg">
                      <ShoppingCart className="h-5 w-5 text-orange-400 transition-all duration-300 group-hover:scale-110 group-hover:animate-pulse" />
                      {cartItems > 0 && (
                        <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6600] p-0 text-xs animate-bounce">
                          {cartItems}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Mon Panier</DialogTitle>
                    </DialogHeader>
                    <HeaderCart />
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={showCompareModal}
                  onOpenChange={(nextOpen) => {
                    if (nextOpen && !isLoggedIn) {
                      openInlineAuthFromHeader('Connectez-vous pour accéder à la comparaison de produits.')
                      return
                    }
                    setShowCompareModal(nextOpen)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="group relative rounded-full text-white transition-all duration-300 hover:scale-110 hover:bg-[#ff6600] hover:text-white hover:shadow-lg">
                      <BarChart3 className="h-5 w-5 text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:animate-pulse" />
                      {compareListLength > 0 && (
                        <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 p-0 text-xs animate-bounce">
                          {compareListLength}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Comparaison de Produits</DialogTitle>
                    </DialogHeader>
                    <HeaderCompare />
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={showDeliveryModal}
                  onOpenChange={(nextOpen) => {
                    if (nextOpen && !isLoggedIn) {
                      openInlineAuthFromHeader('Connectez-vous pour accéder au suivi de livraison.')
                      return
                    }
                    setShowDeliveryModal(nextOpen)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="group relative rounded-full text-white transition-all duration-300 hover:scale-110 hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:shadow-lg">
                      <Truck className="h-5 w-5 text-white transition-transform duration-300 group-hover:scale-110 group-hover:animate-pulse" />
                      <Badge className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0 text-xs animate-bounce">
                        <span suppressHydrationWarning>{deliveriesInProgressCount}</span>
                      </Badge>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Suivi de Livraison</DialogTitle>
                    </DialogHeader>
                    <HeaderDelivery />
                  </DialogContent>
                </Dialog>

                <div className="relative" ref={userDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserDropdown((prev) => !prev)}
                    className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6600] focus-visible:ring-offset-2"
                  >
                    <Avatar className="group h-8 w-8 cursor-pointer transition-transform duration-300 hover:scale-110 hover:shadow-lg">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gray-600 transition-transform duration-300 group-hover:bg-[#ff6600]">
                        <User className="h-4 w-4 text-white transition-transform duration-300 group-hover:scale-110" />
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-3 w-72 max-h-[75vh] overflow-y-auto rounded-2xl bg-white py-3 pr-1 text-gray-700 shadow-2xl ring-1 ring-black/10 animate-[dropdown-open_160ms_ease-out] origin-top-right z-50">
                      {renderUserHeader()}
                      {renderUserMenu()}
                    </div>
                  )}
                </div>
              </>
            ) : (
              renderGuestActions()
            )}
          </div>
        </div>

        <nav className="border-t border-gray-600 bg-gray-700">
          <div className="flex items-center justify-center space-x-12 py-4">
            <Link
              href="/"
              className={`flex flex-col items-center space-y-1 transition-colors group ${
                pathname === '/' ? 'text-[#ff6600]' : 'text-white hover:text-[#ff6600]'
              }`}
            >
              <Home
                className={`h-6 w-6 transition-transform duration-200 group-hover:scale-110 ${
                  pathname === '/' ? 'text-[#ff6600]' : ''
                }`}
              />
              <span className="text-xs font-medium">Accueil</span>
            </Link>

            <Link
              href="/products"
              className={`flex flex-col items-center space-y-1 transition-colors group ${
                pathname === '/products' ? 'text-[#ff6600]' : 'text-white hover:text-[#ff6600]'
              }`}
            >
              <div className="relative">
                <Lock
                  className={`h-6 w-6 transition-transform duration-200 group-hover:scale-110 ${
                    pathname === '/products' ? 'text-[#ff6600]' : ''
                  }`}
                />
              </div>
              <span className="text-xs font-medium">Boutique</span>
            </Link>

            <Link
              href="/categories"
              className={`flex flex-col items-center space-y-1 transition-colors group ${
                pathname === '/categories' ? 'text-[#ff6600]' : 'text-white hover:text-[#ff6600]'
              }`}
            >
              <Grid
                className={`h-6 w-6 transition-transform duration-200 group-hover:scale-110 ${
                  pathname === '/categories' ? 'text-[#ff6600]' : ''
                }`}
              />
              <span className="text-xs font-medium">Catégories</span>
            </Link>

            <Link
              href="/best-sellers"
              className={`flex flex-col items-center space-y-1 transition-colors group ${
                pathname === '/best-sellers' ? 'text-[#ff6600]' : 'text-white hover:text-[#ff6600]'
              }`}
            >
              <Flame
                className={`h-6 w-6 transition-transform duration-200 group-hover:scale-110 ${
                  pathname === '/best-sellers' ? 'text-[#ff6600]' : ''
                }`}
              />
              <span className="text-xs font-medium">Meilleures ventes</span>
            </Link>

            <Link
              href="/new-arrivals"
              className={`flex flex-col items-center space-y-1 transition-colors group ${
                pathname === '/new-arrivals' ? 'text-[#ff6600]' : 'text-white hover:text-[#ff6600]'
              }`}
            >
              <Sparkles
                className={`h-6 w-6 transition-transform duration-200 group-hover:animate-bounce ${
                  pathname === '/new-arrivals' ? 'text-[#ff6600]' : ''
                }`}
              />
              <span className="text-xs font-medium transition-transform duration-300 group-hover:translate-y-1">
                Nouveautés
              </span>
            </Link>

            <Link
              href="/sellers"
              className={`flex flex-col items-center space-y-1 transition-colors group ${
                pathname === '/sellers' ? 'text-[#ff6600]' : 'text-white hover:text-[#ff6600]'
              }`}
            >
              <div className={`rounded-lg p-2 ${pathname === '/sellers' ? 'bg-[#ff6600]/20' : 'bg-gray-600'}`}>
                <Store
                  className={`h-6 w-6 transition-transform duration-200 group-hover:scale-110 ${
                    pathname === '/sellers' ? 'text-[#ff6600]' : ''
                  } animate-bounce`}
                  style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}
                />
              </div>
              <span className="text-xs font-medium">Vendeurs</span>
            </Link>

            <Link
              href="/support"
              className={`flex flex-col items-center space-y-1 transition-colors group ${
                pathname === '/support' ? 'text-[#ff6600]' : 'text-white hover:text-[#ff6600]'
              }`}
            >
              <Headphones
                className={`h-6 w-6 transition-transform duration-200 group-hover:scale-110 ${
                  pathname === '/support' ? 'text-[#ff6600]' : ''
                }`}
              />
              <span className="text-xs font-medium">Support</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
