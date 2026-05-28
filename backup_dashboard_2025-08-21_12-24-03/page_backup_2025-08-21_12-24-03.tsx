"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingBag, 
  MessageCircle, 
  Share2, 
  Gift, 
  User, 
  Settings, 
  Bell,
  TrendingUp,
  Package,
  Heart,
  CreditCard,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield,
  Camera,
  Edit3,
  Download,
  Upload,
  Filter,
  Search,
  Plus,
  MoreVertical,
  ChevronRight,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Truck,
  Home,
  Users,
  Activity,
  Zap,
  Target,
  Award,
  Coins,
  Wallet,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Smartphone,
  Globe,
  Wifi,
  WifiOff,
  ShoppingCart,
  Minus,
  Percent,
  Key,
  Trash2,
  AlertTriangle,
  Check,
  Sparkles,
  Tag,
  TrendingDown,
  Send,
  Paperclip,
  Sun,
  Moon,
  Monitor,
  FileText,
  Info,
  Copy,
  Headphones,
  Laptop,
  Gamepad,
  Building,
  ExternalLink,
  Lightbulb,
  HelpCircle,
  Archive,
  QrCode,
  X,
  Pin,
  Video,
  Smile,
  Mic,
  ChevronLeft,
  CheckSquare
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import HeaderCart from '@/components/layout/header-cart'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLocalStorageArray, useLocalStorageNumber } from '@/hooks/use-local-storage'
import { useToast } from '@/hooks/use-toast'
import { Product, CartItem, Order, ChatSession, Seller } from '@/lib/types'
import AdvancedChat from '@/components/chat/advanced-chat'
import { 
  PointsEvolutionChart, 
  SharesDistributionChart, 
  OrdersChart, 
  WeeklyActivityChart, 
  PerformanceRadarChart, 
  RealTimeStats 
} from '@/components/charts/dashboard-charts'
import SystemSettingsSection from '@/components/dashboard/system-settings-section'

// Types spécifiques au dashboard
interface DashboardStats {
  totalOrders: number
  totalPoints: number
  totalShares: number
  totalSpent: number
  activeChats: number
  favoriteSellers: number
}

interface SharedProduct {
  id: string
  productId: number
  productName: string
  productImage: string
  shares: {
    facebook: number
    twitter: number
    whatsapp: number
    instagram: number
  }
  totalShares: number
  pointsEarned: number
  pointsUsed: number
  pointsWithdrawn: number
  pointsAvailable: number
  sharedAt: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  address: string
  city: string
  country: string
  twoFactorEnabled: boolean
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    orders: boolean
    points: boolean
    chat: boolean
    promotions: boolean
  }
  preferences: {
    language: string
    currency: string
    theme: 'light' | 'dark' | 'system'
  }
}

// Nouvelles interfaces pour les recommandations IA
interface AIRecommendation {
  id: string
  type: 'product' | 'seller' | 'promotion'
  title: string
  description: string
  confidence: number
  reason: string
  data: any
  createdAt: string
}

interface RecommendedProduct {
  id: number
  name: string
  price: number
  originalPrice: number
  image: string
  category: string
  rating: number
  reviews: number
  seller: string
  sellerRating: number
  promotion?: {
    type: 'discount' | 'flash' | 'bundle' | 'cashback'
    value: string
    endDate: string
  }
  aiConfidence: number
  aiReason: string
}

interface RecommendedSeller {
  id: string
  name: string
  avatar: string
  rating: number
  totalSales: number
  responseTime: string
  specialties: string[]
  topProducts: number[]
  aiConfidence: number
  aiReason: string
}

// Interface pour les promotions
interface Promotion {
  id: string
  code?: string
  title: string
  description: string
  type: 'discount' | 'flash' | 'bundle' | 'cashback' | 'free_shipping' | 'points_multiplier'
  value: string
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  products: number[]
  categories: string[]
  isActive: boolean
  usageCount: number
  maxUsage?: number
  conditions: string[]
  image?: string
  priority: number
}

// Interface pour les notifications
interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionUrl?: string
  actionText?: string
  priority: 'low' | 'medium' | 'high'
  category: 'orders' | 'points' | 'promotions' | 'system' | 'chat'
}

// Interface pour les messages internes
interface InternalMessage {
  id: string
  from: 'user' | 'admin'
  subject: string
  content: string
  timestamp: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  category: 'support' | 'technical' | 'billing' | 'general'
  attachments?: string[]
  status: 'sent' | 'delivered' | 'read'
}

// Données mockées
const mockStats: DashboardStats = {
  totalOrders: 24,
  totalPoints: 15420,
  totalShares: 89,
  totalSpent: 1250000,
  activeChats: 7,
  favoriteSellers: 12
}

// Données mockées pour les recommandations IA
const mockRecommendedProducts: RecommendedProduct[] = [
  {
    id: 1,
    name: "iPhone 15 Pro Max - 256GB",
    price: 850000,
    originalPrice: 950000,
    image: "/placeholder.jpg",
    category: "Smartphones",
    rating: 4.8,
    reviews: 1247,
    seller: "TechStore Premium",
    sellerRating: 4.9,
    promotion: {
      type: "discount",
      value: "10% de réduction",
      endDate: "2024-01-31"
    },
    aiConfidence: 95,
    aiReason: "Basé sur vos recherches récentes d'iPhone et votre budget"
  },
  {
    id: 2,
    name: "MacBook Air M2 - 13 pouces",
    price: 750000,
    originalPrice: 850000,
    image: "/placeholder.jpg",
    category: "Ordinateurs",
    rating: 4.9,
    reviews: 892,
    seller: "Apple Store Bénin",
    sellerRating: 4.8,
    promotion: {
      type: "flash",
      value: "Flash Sale - 12%",
      endDate: "2024-01-25"
    },
    aiConfidence: 88,
    aiReason: "Recommandé car vous avez consulté des ordinateurs portables"
  },
  {
    id: 3,
    name: "Samsung Galaxy S24 Ultra",
    price: 680000,
    originalPrice: 780000,
    image: "/placeholder.jpg",
    category: "Smartphones",
    rating: 4.7,
    reviews: 567,
    seller: "Mobile World",
    sellerRating: 4.6,
    aiConfidence: 82,
    aiReason: "Alternative premium basée sur vos préférences"
  }
]

const mockRecommendedSellers: RecommendedSeller[] = [
  {
    id: "seller1",
    name: "TechStore Premium",
    avatar: "/placeholder-user.jpg",
    rating: 4.9,
    totalSales: 15420,
    responseTime: "2.3 min",
    specialties: ["Smartphones", "Ordinateurs", "Accessoires"],
    topProducts: [1, 5, 12],
    aiConfidence: 92,
    aiReason: "Excellent vendeur dans vos catégories préférées"
  },
  {
    id: "seller2",
    name: "Apple Store Bénin",
    avatar: "/placeholder-user.jpg",
    rating: 4.8,
    totalSales: 8920,
    responseTime: "1.8 min",
    specialties: ["Apple", "MacBook", "iPhone"],
    topProducts: [2, 8, 15],
    aiConfidence: 89,
    aiReason: "Spécialiste Apple avec des prix compétitifs"
  },
  {
    id: "seller3",
    name: "Mobile World",
    avatar: "/placeholder-user.jpg",
    rating: 4.6,
    totalSales: 6780,
    responseTime: "3.1 min",
    specialties: ["Android", "Samsung", "Accessoires"],
    topProducts: [3, 9, 18],
    aiConfidence: 85,
    aiReason: "Large gamme d'appareils Android"
  }
]

// Données mockées pour les promotions
const mockPromotions: Promotion[] = [
  {
    id: "promo1",
    title: "Flash Sale - Smartphones",
    description: "Jusqu'à 25% de réduction sur tous les smartphones",
    type: "flash",
    value: "25% de réduction",
    minAmount: 50000,
    maxDiscount: 200000,
    startDate: "2024-01-20",
    endDate: "2024-01-25",
    products: [1, 3, 5, 7],
    categories: ["Smartphones"],
    isActive: true,
    usageCount: 1247,
    maxUsage: 5000,
    conditions: ["Minimum d'achat: 50,000 F CFA", "Maximum de réduction: 200,000 F CFA"],
    image: "/placeholder.jpg",
    priority: 1
  },
  {
    id: "promo2",
    title: "Points x2 sur tous les achats",
    description: "Gagnez 2x plus de points fidélité cette semaine",
    type: "points_multiplier",
    value: "Points x2",
    startDate: "2024-01-15",
    endDate: "2024-01-22",
    products: [],
    categories: [],
    isActive: true,
    usageCount: 892,
    conditions: ["Valable sur tous les achats", "Points crédités sous 24h"],
    priority: 2
  },
  {
    id: "promo3",
    title: "Livraison gratuite",
    description: "Livraison gratuite pour toute commande supérieure à 100,000 F CFA",
    type: "free_shipping",
    value: "Livraison gratuite",
    minAmount: 100000,
    startDate: "2024-01-10",
    endDate: "2024-01-31",
    products: [],
    categories: [],
    isActive: true,
    usageCount: 567,
    conditions: ["Minimum d'achat: 100,000 F CFA", "Livraison standard uniquement"],
    priority: 3
  },
  {
    id: "promo4",
    title: "Bundle MacBook + Accessoires",
    description: "MacBook + Souris + Coque + Garantie étendue",
    type: "bundle",
    value: "Économisez 150,000 F CFA",
    startDate: "2024-01-18",
    endDate: "2024-01-28",
    products: [2, 10, 11, 12],
    categories: ["Ordinateurs", "Accessoires"],
    isActive: true,
    usageCount: 234,
    maxUsage: 100,
    conditions: ["Pack complet obligatoire", "Garantie étendue incluse"],
    image: "/placeholder.jpg",
    priority: 1
  }
]

// Données mockées pour les notifications
const mockNotifications: NotificationItem[] = [
  {
    id: "notif1",
    type: "promotion",
    title: "Nouvelle promotion disponible !",
    message: "Flash Sale - 25% de réduction sur les smartphones",
    timestamp: "2024-01-20T10:30:00Z",
    isRead: false,
    actionUrl: "/promotions",
    actionText: "Voir la promotion",
    priority: "high",
    category: "promotions"
  },
  {
    id: "notif2",
    type: "success",
    title: "Commande livrée",
    message: "Votre commande ORD-001 a été livrée avec succès",
    timestamp: "2024-01-19T14:20:00Z",
    isRead: true,
    actionUrl: "/orders",
    actionText: "Voir la commande",
    priority: "medium",
    category: "orders"
  },
  {
    id: "notif3",
    type: "info",
    title: "Points gagnés",
    message: "Vous avez gagné 200 points pour votre partage",
    timestamp: "2024-01-19T09:15:00Z",
    isRead: true,
    actionUrl: "/points",
    actionText: "Voir mes points",
    priority: "low",
    category: "points"
  },
  {
    id: "notif4",
    type: "warning",
    title: "Promotion se termine bientôt",
    message: "La promotion Points x2 se termine dans 2 heures",
    timestamp: "2024-01-18T22:00:00Z",
    isRead: false,
    actionUrl: "/promotions",
    actionText: "En profiter",
    priority: "high",
    category: "promotions"
  }
]

// Données mockées pour les messages internes
const mockInternalMessages: InternalMessage[] = [
  {
    id: "msg1",
    from: "admin",
    subject: "Bienvenue sur Probooster !",
    content: "Nous sommes ravis de vous accueillir sur notre plateforme. N'hésitez pas à nous contacter si vous avez des questions.",
    timestamp: "2024-01-20T08:00:00Z",
    isRead: true,
    priority: "low",
    category: "general",
    status: "read"
  },
  {
    id: "msg2",
    from: "user",
    subject: "Question sur la livraison",
    content: "Bonjour, j'aimerais savoir si la livraison est possible à Cotonou ?",
    timestamp: "2024-01-19T16:30:00Z",
    isRead: false,
    priority: "medium",
    category: "support",
    status: "delivered"
  },
  {
    id: "msg3",
    from: "admin",
    subject: "Réponse : Livraison à Cotonou",
    content: "Oui, nous livrons à Cotonou ! La livraison standard prend 2-3 jours ouvrables.",
    timestamp: "2024-01-19T17:15:00Z",
    isRead: false,
    priority: "medium",
    category: "support",
    status: "sent"
  }
]

const mockSharedProducts: SharedProduct[] = [
  {
    id: '1',
    productId: 1,
    productName: 'iPhone 15 Pro Max',
    productImage: '/placeholder.jpg',
    shares: { facebook: 15, twitter: 8, whatsapp: 12, instagram: 6 },
    totalShares: 41,
    pointsEarned: 820,
    pointsUsed: 300,
    pointsWithdrawn: 200,
    pointsAvailable: 320,
    sharedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    productId: 2,
    productName: 'MacBook Air M2',
    productImage: '/placeholder.jpg',
    shares: { facebook: 22, twitter: 14, whatsapp: 18, instagram: 9 },
    totalShares: 63,
    pointsEarned: 1260,
    pointsUsed: 500,
    pointsWithdrawn: 400,
    pointsAvailable: 360,
    sharedAt: '2024-01-10T14:20:00Z'
  }
]

const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    items: [
      { id: 1, name: 'iPhone 15 Pro Max', price: 450000, image: '/placeholder.jpg', seller: 'TechStore', quantity: 1 }
    ],
    total: 450000,
    status: 'delivered',
    createdAt: '2024-01-15T10:30:00Z',
    pointsUsed: 500,
    deliveryOption: 'Express'
  },
  {
    id: 'ORD-002',
    items: [
      { id: 2, name: 'MacBook Air M2', price: 800000, image: '/placeholder.jpg', seller: 'AppleStore', quantity: 1 }
    ],
    total: 800000,
    status: 'shipped',
    createdAt: '2024-01-10T14:20:00Z',
    pointsUsed: 200,
    deliveryOption: 'Standard'
  }
]

const mockSellers: (Seller & { lastMessage?: string })[] = [
  {
    name: 'TechStore',
    avatar: '/placeholder.jpg',
    rating: 4.8,
    totalSales: 1250,
    responseTime: '2 min',
    location: 'Abidjan',
    phone: '+2250701234567',
    email: 'contact@techstore.ci',
    isOnline: true,
    lastMessage: 'Bonjour ! Le produit est disponible en stock.'
  },
  {
    name: 'AppleStore',
    avatar: '/placeholder.jpg',
    rating: 4.9,
    totalSales: 890,
    responseTime: '5 min',
    location: 'Lagos',
    phone: '+2340801234567',
    email: 'info@applestore.ng',
    isOnline: false,
    lastMessage: 'Merci pour votre commande !'
  },
  {
    name: 'MobileWorld',
    avatar: '/placeholder.jpg',
    rating: 4.7,
    totalSales: 650,
    responseTime: '1 min',
    location: 'Accra',
    phone: '+2330501234567',
    email: 'hello@mobileworld.gh',
    isOnline: true,
    lastMessage: 'Livraison prévue pour demain.'
  }
]

// Données mockées pour les produits du chat
const mockChatProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    image: '/placeholder.jpg',
    price: 450000,
    seller: 'TechStore',
    isPinned: false
  },
  {
    id: 2,
    name: 'Galaxy S24 Ultra',
    image: '/placeholder.jpg',
    price: 380000,
    seller: 'MobileWorld',
    isPinned: false
  },
  {
    id: 3,
    name: 'MacBook Pro M3',
    image: '/placeholder.jpg',
    price: 1200000,
    seller: 'AppleStore',
    isPinned: false
  },
  {
    id: 4,
    name: 'iPad Air',
    image: '/placeholder.jpg',
    price: 280000,
    seller: 'TechStore',
    isPinned: false
  },
  {
    id: 5,
    name: 'AirPods Pro',
    image: '/placeholder.jpg',
    price: 85000,
    seller: 'AppleStore',
    isPinned: false
  }
]

// Données mockées pour les produits de boutique avec promotions
const mockShopProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro Max',
    image: '/placeholder.jpg',
    originalPrice: 520000,
    currentPrice: 450000,
    discount: 13,
    seller: 'TechStore',
    category: 'Smartphones',
    rating: 4.8,
    reviews: 156,
    isPromoted: true,
    promotionEnds: '2024-02-15',
    stock: 8,
    description: 'Le dernier iPhone avec des fonctionnalités avancées'
  },
  {
    id: 2,
    name: 'MacBook Air M2',
    image: '/placeholder.jpg',
    originalPrice: 980000,
    currentPrice: 850000,
    discount: 13,
    seller: 'AppleStore',
    category: 'Ordinateurs',
    rating: 4.9,
    reviews: 89,
    isPromoted: true,
    promotionEnds: '2024-02-20',
    stock: 5,
    description: 'Ordinateur portable ultra-léger et performant'
  },
  {
    id: 3,
    name: 'Samsung Galaxy S24',
    image: '/placeholder.jpg',
    originalPrice: 420000,
    currentPrice: 380000,
    discount: 10,
    seller: 'MobileWorld',
    category: 'Smartphones',
    rating: 4.7,
    reviews: 203,
    isPromoted: true,
    promotionEnds: '2024-02-18',
    stock: 12,
    description: 'Smartphone Android haut de gamme'
  },
  {
    id: 4,
    name: 'iPad Pro 12.9"',
    image: '/placeholder.jpg',
    originalPrice: 650000,
    currentPrice: 580000,
    discount: 11,
    seller: 'TechStore',
    category: 'Tablettes',
    rating: 4.8,
    reviews: 67,
    isPromoted: false,
    promotionEnds: null,
    stock: 15,
    description: 'Tablette professionnelle pour créateurs'
  },
  {
    id: 5,
    name: 'AirPods Max',
    image: '/placeholder.jpg',
    originalPrice: 180000,
    currentPrice: 150000,
    discount: 17,
    seller: 'AppleStore',
    category: 'Audio',
    rating: 4.6,
    reviews: 124,
    isPromoted: true,
    promotionEnds: '2024-02-25',
    stock: 3,
    description: 'Casque audio sans fil premium'
  }
]






// Composant pour les indicateurs de statut des messages
const MessageStatusIndicator = ({ status, messageId, isUserMessage }: { 
  status: 'sending' | 'sent' | 'delivered' | 'read'
  messageId: string
  isUserMessage: boolean
}) => {
  if (!isUserMessage) return null // Les indicateurs ne s'affichent que pour les messages de l'utilisateur
  
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-1 h-3 bg-gray-300 rounded-full animate-pulse"></div>
          </div>
        )
      case 'sent':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12"></div>
          </div>
        )
      case 'delivered':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12"></div>
            <div className="w-0.5 h-3 bg-gray-400 rounded-full transform rotate-12 -ml-1"></div>
          </div>
        )
      case 'read':
        return (
          <div className="flex items-center space-x-0.5">
            <div className="w-0.5 h-3 bg-green-500 rounded-full transform rotate-12"></div>
            <div className="w-0.5 h-3 bg-green-500 rounded-full transform rotate-12 -ml-1"></div>
          </div>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="flex items-center justify-end mt-1">
      {getStatusIcon()}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [showPointsHistory, setShowPointsHistory] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false)
  
  // États pour les informations du profil
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+229 91 50 57 57',
    country: 'Bénin',
    address: '123 Rue de la Paix, Abomey-Calavi, Bénin',
    avatar: '/placeholder.jpg'
  })
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [showMoneyTransferModal, setShowMoneyTransferModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [selectedWithdrawalMethod, setSelectedWithdrawalMethod] = useState<'mobile-money' | 'credit-card' | 'bank-account' | null>(null)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferEmail, setTransferEmail] = useState('')
  const [showAdvancedChat, setShowAdvancedChat] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState('xof') // Default to XOF

  // Nouveaux états pour les nouvelles fonctionnalités
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [newMessageSubject, setNewMessageSubject] = useState('')
  const [newMessageContent, setNewMessageContent] = useState('')
  const [newMessageCategory, setNewMessageCategory] = useState('general')
  const [newMessagePriority, setNewMessagePriority] = useState('medium')
  const [selectedNotificationCategory, setSelectedNotificationCategory] = useState('all')
  const [selectedPromotionType, setSelectedPromotionType] = useState('all')
  const [aiRecommendationFilter, setAiRecommendationFilter] = useState('all')
  
  // États pour la section recommandations IA
  const [showSellerDetailsModal, setShowSellerDetailsModal] = useState(false)
  const [showPromotionDetailsModal, setShowPromotionDetailsModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null)
  
  // États pour les notifications
  const [unreadNotifications, setUnreadNotifications] = useState(3)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  
  // États pour les paramètres
  const [selectedLanguage, setSelectedLanguage] = useState('fr')
  const [selectedTheme, setSelectedTheme] = useState('light')
  const [selectedTimezone, setSelectedTimezone] = useState('africa/lagos')
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [showSessionsModal, setShowSessionsModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  
  // États pour les paramètres de confidentialité
  const [profilePublic, setProfilePublic] = useState(true)
  const [sharePurchaseHistory, setSharePurchaseHistory] = useState(false)
  const [shareStats, setShareStats] = useState(true)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState(true)
  
  // États pour les modales de sécurité
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // États pour les notifications
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    orders: true,
    points: true,
    chat: true,
    promotions: true,
    system: false,
    ai: true
  })
  const [notificationFrequency, setNotificationFrequency] = useState('daily')
  const [notificationStartTime, setNotificationStartTime] = useState('08:00')
  const [notificationEndTime, setNotificationEndTime] = useState('22:00')
  const [showNotificationActions, setShowNotificationActions] = useState<Record<string, boolean>>({})
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  
  // États pour la section CHAT (améliorée)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [selectedChatSeller, setSelectedChatSeller] = useState<string | null>(null)
  const [chatSearchQuery, setChatSearchQuery] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [chatActiveTab, setChatActiveTab] = useState<'conversations' | 'produits'>('conversations')
  const [showChatModal, setShowChatModal] = useState(false)
  const [showShopModal, setShowShopModal] = useState(false)
  const [selectedShopSeller, setSelectedShopSeller] = useState<string | null>(null)
  const [showCartModal, setShowCartModal] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string
    type: 'text' | 'product' | 'image' | 'document'
    content: string
    sender: 'user' | 'seller'
    timestamp: string
    product?: any
    imageUrl?: string
    fileName?: string
    fileSize?: number
    fileType?: string
  }>>([
    {
      id: '1',
      type: 'text',
      content: 'Bonjour ! Je suis intéressé par vos produits. Pouvez-vous me donner plus d\'informations ?',
      sender: 'user',
      timestamp: '10:32'
    }
  ])
  
  // Référence pour la fin des messages
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState(mockNotifications)
  
  // États pour les fonctionnalités du chat
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showCallModal, setShowCallModal] = useState(false)
  const [showVideoCallModal, setShowVideoCallModal] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  
  // États pour la sélection de messages
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([])
  const [showMessageActions, setShowMessageActions] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedTransferSeller, setSelectedTransferSeller] = useState<string | null>(null)
  
  // États pour les statuts des messages
  const [messageStatuses, setMessageStatuses] = useState<{[key: string]: {
    isRead: boolean
    isImportant: boolean
    isUrgent: boolean
    isToResolve: boolean
    isArchived: boolean
  }}>({})
  
  // États pour les statuts d'envoi et de lecture des messages
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState<{[key: string]: {
    status: 'sending' | 'sent' | 'delivered' | 'read'
    timestamp: string
  }}>({})

  
  // État pour les messages internes
  const [internalMessages, setInternalMessages] = useState(mockInternalMessages)
  
  // États pour les mini-modales
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [showPointsDetailsModal, setShowPointsDetailsModal] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [showSpecialPromotionModal, setShowSpecialPromotionModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedSpecialPromotion, setSelectedSpecialPromotion] = useState<any>(null)
  
  // États pour les nouvelles fonctionnalités des commandes
  const [showOrderEvaluationModal, setShowOrderEvaluationModal] = useState(false)
  const [showOrderTrackingModal, setShowOrderTrackingModal] = useState(false)
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null)
  const [evaluationRating, setEvaluationRating] = useState(5)
  const [evaluationComment, setEvaluationComment] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  
  // Hook pour les notifications modernes
  const { toast } = useToast()

  // Fonctions pour la sélection et gestion des messages
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds(prev => {
      if (prev.includes(messageId)) {
        const newSelection = prev.filter(id => id !== messageId)
        setShowMessageActions(newSelection.length > 0)
        return newSelection
      } else {
        const newSelection = [...prev, messageId]
        setShowMessageActions(true)
        return newSelection
      }
    })
  }

  const selectAllMessages = () => {
    const allIds = chatMessages.map(msg => msg.id)
    setSelectedMessageIds(allIds)
    setShowMessageActions(true)
  }

  const deselectAllMessages = () => {
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }

  const markMessagesAsRead = () => {
    selectedMessageIds.forEach(id => updateMessageStatus(id, 'read', true))
    toast({
      title: "Messages marqués comme lus",
      description: `${selectedMessageIds.length} message(s) marqué(s) comme lu(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }

  const markMessagesAsUnread = () => {
    selectedMessageIds.forEach(id => updateMessageStatus(id, 'read', false))
    toast({
      title: "Messages marqués comme non lus",
      description: `${selectedMessageIds.length} message(s) marqué(s) comme non lu(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }

  const deleteSelectedMessages = () => {
    setChatMessages(prev => prev.filter(msg => !selectedMessageIds.includes(msg.id)))
    toast({
      title: "Messages supprimés",
      description: `${selectedMessageIds.length} message(s) supprimé(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }

  const archiveSelectedMessages = () => {
    selectedMessageIds.forEach(id => updateMessageStatus(id, 'archived', true))
    toast({
      title: "Messages archivés",
      description: `${selectedMessageIds.length} message(s) archivé(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }

  const transferMessages = (sellerName: string) => {
    setSelectedTransferSeller(sellerName)
    setShowTransferModal(true)
  }

  const confirmTransfer = () => {
    if (selectedTransferSeller) {
      toast({
        title: "Messages transférés",
        description: `${selectedMessageIds.length} message(s) transféré(s) vers ${selectedTransferSeller}`,
        variant: "default",
      })
      setSelectedMessageIds([])
      setShowMessageActions(false)
      setShowTransferModal(false)
      setSelectedTransferSeller(null)
    }
  }

  const markMessagesAsImportant = () => {
    selectedMessageIds.forEach(id => updateMessageStatus(id, 'important', true))
    toast({
      title: "Messages marqués comme importants",
      description: `${selectedMessageIds.length} message(s) marqué(s) comme important(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }

  const markMessagesAsUrgent = () => {
    selectedMessageIds.forEach(id => updateMessageStatus(id, 'urgent', true))
    toast({
      title: "Messages marqués comme urgents",
      description: `${selectedMessageIds.length} message(s) marqué(s) comme urgent(s)`,
      variant: "default",
    })
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }

  const markMessagesToResolve = () => {
    // Simuler le marquage comme à régler
    toast({
      title: "Messages marqués à régler",
      description: `${selectedMessageIds.length} message(s) marqué(s) à régler`,
      variant: "default",
    })
    
    // Mettre à jour les statuts des messages
    setMessageStatuses(prev => {
      const newStatuses = { ...prev }
      selectedMessageIds.forEach(id => {
        newStatuses[id] = { ...newStatuses[id], isToResolve: true }
      })
      return newStatuses
    })
    
    setSelectedMessageIds([])
    setShowMessageActions(false)
  }
  
  // Fonctions pour gérer les statuts des messages
  const updateMessageStatus = (messageId: string, status: 'read' | 'important' | 'urgent' | 'toResolve' | 'archived', value: boolean) => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        isRead: status === 'read' ? value : (prev[messageId]?.isRead || false),
        isImportant: status === 'important' ? value : (prev[messageId]?.isImportant || false),
        isUrgent: status === 'urgent' ? value : (prev[messageId]?.isUrgent || false),
        isToResolve: status === 'toResolve' ? value : (prev[messageId]?.isToResolve || false),
        isArchived: status === 'archived' ? value : (prev[messageId]?.isArchived || false)
      }
    }))
  }

  // Fonction pour ajouter un produit au chat
  const addProductToChat = (product: any) => {
    // Sélectionner automatiquement le vendeur du produit
    setSelectedChatSeller(product.seller)
    
    const productMessageId = Date.now().toString()
    const introMessageId = (Date.now() + 1).toString()
    
    // Créer le message produit
    const productMessage = {
      id: productMessageId,
      type: 'product' as const,
      content: `Produit référencé : ${product.name}`,
      sender: 'user' as const,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      product: product
    }
    
    // Créer le message d'introduction
    const introMessage = {
      id: introMessageId,
      type: 'text' as const,
      content: `Bonjour ${product.seller} ! 👋 Je suis très intéressé(e) par votre produit "${product.name}". Pourriez-vous me donner plus d'informations sur ses caractéristiques, la disponibilité et les conditions de vente ? Merci d'avance ! 😊`,
      sender: 'user' as const,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      product: null
    }
    
    // Définir les statuts des messages
    const initialStatus = {
      status: 'sending' as const,
      timestamp: new Date().toISOString()
    }
    
    setMessageDeliveryStatus(prev => ({
      ...prev,
      [productMessageId]: initialStatus,
      [introMessageId]: initialStatus
    }))
    
    // Ajouter les deux messages au chat
    setChatMessages(prev => [...prev, productMessage, introMessage])
    
    // Simuler la progression des statuts pour les deux messages
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [productMessageId]: { status: 'sent', timestamp: new Date().toISOString() },
        [introMessageId]: { status: 'sent', timestamp: new Date().toISOString() }
      }))
    }, 500)
    
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [productMessageId]: { status: 'delivered', timestamp: new Date().toISOString() },
        [introMessageId]: { status: 'delivered', timestamp: new Date().toISOString() }
      }))
    }, 1000)
    
    setTimeout(() => {
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [productMessageId]: { status: 'read', timestamp: new Date().toISOString() },
        [introMessageId]: { status: 'read', timestamp: new Date().toISOString() }
      }))
    }, 2000)
    
    // Fermer la modal boutique si elle était ouverte
    setShowShopModal(false)
    
    // Notification de succès
    toast({
      title: "Chat ouvert avec le vendeur !",
      description: `Le chat avec ${product.seller} s'est ouvert avec votre produit référencé`,
      variant: "default",
    })
  }

  // Fonction pour envoyer un message texte
  const sendMessage = () => {
    if (!chatInput.trim() || !selectedChatSeller) return
    
    const messageId = Date.now().toString()
    const newMessage = {
      id: messageId,
      type: 'text' as const,
      content: chatInput.trim(),
      sender: 'user' as const,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      product: null
    }
    
    // Définir le statut initial comme "envoi en cours"
    setMessageDeliveryStatus(prev => ({
      ...prev,
      [messageId]: {
        status: 'sending',
        timestamp: new Date().toISOString()
      }
    }))
    
    setChatMessages(prev => [...prev, newMessage])
    setChatInput('')
    
    // Simuler la progression du statut du message
    setTimeout(() => {
      // Message envoyé (1 trait gris)
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: {
          status: 'sent',
          timestamp: new Date().toISOString()
        }
      }))
    }, 500)
    
    setTimeout(() => {
      // Message reçu par le vendeur (2 traits gris)
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: {
          status: 'delivered',
          timestamp: new Date().toISOString()
        }
      }))
    }, 1000)
    
    // Simuler la frappe du vendeur
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      
      // Message lu par le vendeur (2 traits verts)
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: {
          status: 'read',
          timestamp: new Date().toISOString()
        }
      }))
      
      // Simuler une réponse du vendeur
      const sellerResponse = {
        id: (Date.now() + 1).toString(),
        type: 'text' as const,
        content: 'Merci pour votre message ! Je vais vous répondre dans les plus brefs délais.',
        sender: 'seller' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        product: null
      }
      setChatMessages(prev => [...prev, sellerResponse])
    }, 2000)
  }
  
  // Fonction pour gérer l'enregistrement vocal
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      setRecordingTime(0)
      // Ici on pourrait ajouter la logique pour envoyer l'audio
      toast({
        title: "Message vocal enregistré",
        description: "Votre message vocal a été enregistré et sera envoyé",
        variant: "default",
      })
    } else {
      setIsRecording(true)
      setRecordingTime(0)
      // Démarrer le timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Arrêter après 30 secondes max
      setTimeout(() => {
        setIsRecording(false)
        setRecordingTime(0)
        clearInterval(interval)
      }, 30000)
    }
  }
  
  // Fonction pour gérer les appels
  const handleCall = () => {
    setShowCallModal(true)
    toast({
      title: "Appel en cours...",
      description: `Connexion avec ${selectedChatSeller}`,
      variant: "default",
    })
  }
  
  // Fonction pour gérer les appels vidéo
  const handleVideoCall = () => {
    setShowVideoCallModal(true)
    toast({
      title: "Appel vidéo en cours...",
      description: `Connexion vidéo avec ${selectedChatSeller}`,
      variant: "default",
    })
  }
  
  // Fonction pour gérer le menu du chat
  const handleChatMenu = () => {
    setShowChatMenu(!showChatMenu)
  }
  
  // Effet pour fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.emoji-picker') && !target.closest('.attachment-menu')) {
        setShowEmojiPicker(false)
        setShowAttachmentMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Référence pour l'input de fichier
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Fonction pour gérer l'ajout de fichiers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    const file = files[0]
    
    // Vérifier le type de fichier
    if (file.type.startsWith('image/')) {
      // Gérer l'image
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const messageId = Date.now().toString()
        
        // Créer un message avec l'image
        const imageMessage = {
          id: messageId,
          type: 'image' as const,
          content: `Image: ${file.name}`,
          sender: 'user' as const,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          product: null,
          imageUrl: imageUrl,
          fileName: file.name,
          fileSize: file.size
        }
        
        // Définir le statut initial du message
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: {
            status: 'sending',
            timestamp: new Date().toISOString()
          }
        }))
        
        setChatMessages(prev => [...prev, imageMessage])
        
        // Simuler la progression du statut
        setTimeout(() => {
          setMessageDeliveryStatus(prev => ({
            ...prev,
            [messageId]: { status: 'sent', timestamp: new Date().toISOString() }
          }))
        }, 500)
        
        setTimeout(() => {
          setMessageDeliveryStatus(prev => ({
            ...prev,
            [messageId]: { status: 'delivered', timestamp: new Date().toISOString() }
          }))
        }, 1000)
        
        setTimeout(() => {
          setMessageDeliveryStatus(prev => ({
            ...prev,
            [messageId]: { status: 'read', timestamp: new Date().toISOString() }
          }))
        }, 2000)
        
        // Notification de succès
        toast({
          title: "Image ajoutée !",
          description: `${file.name} a été ajoutée au chat`,
          variant: "default",
        })
      }
      reader.readAsDataURL(file)
    } else if (file.type.includes('document') || file.type.includes('pdf') || file.type.includes('text')) {
      // Gérer le document
      const messageId = Date.now().toString()
      const documentMessage = {
        id: messageId,
        type: 'document' as const,
        content: `Document: ${file.name}`,
        sender: 'user' as const,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        product: null,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
      
      // Définir le statut initial du message
      setMessageDeliveryStatus(prev => ({
        ...prev,
        [messageId]: {
          status: 'sending',
          timestamp: new Date().toISOString()
        }
      }))
      
      setChatMessages(prev => [...prev, documentMessage])
      
      // Simuler la progression du statut
      setTimeout(() => {
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: { status: 'sent', timestamp: new Date().toISOString() }
        }))
      }, 500)
      
      setTimeout(() => {
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: { status: 'delivered', timestamp: new Date().toISOString() }
        }))
      }, 1000)
      
      setTimeout(() => {
        setMessageDeliveryStatus(prev => ({
          ...prev,
          [messageId]: { status: 'read', timestamp: new Date().toISOString() }
        }))
      }, 2000)
      
      // Notification de succès
      toast({
        title: "Document ajouté !",
        description: `${file.name} a été ajouté au chat`,
        variant: "default",
      })
    }
    
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Fermer le menu
    setShowAttachmentMenu(false)
  }
  
  // Fonction pour déclencher la sélection de fichier
  const triggerFileSelect = (fileType: 'image' | 'document') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = fileType === 'image' 
        ? 'image/*' 
        : '.pdf,.doc,.docx,.txt,.rtf'
      fileInputRef.current.click()
    }
  }
  
  // Fonction pour ajouter un produit au panier
  const addToCart = (product: any) => {
    // Créer un item qui correspond au type CartItem
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.currentPrice || product.price,
      image: product.image || '/placeholder.jpg',
      seller: product.seller,
      quantity: 1,
      addedAt: new Date().toISOString()
    }
    
    // Note: Le produit sera ajouté au panier existant via le hook useLocalStorageArray
    // Pour l'instant, on affiche juste une notification de succès
    
    // Ouvrir automatiquement le modal panier du header
    setShowCartModal(true)
    
    // Notification de succès
    toast({
      title: "Produit ajouté au panier !",
      description: `${product.name} a été ajouté à votre panier.`,
      variant: "default",
    })
  }

  // Styles CSS pour les animations
  useEffect(() => {
    // Ajouter les styles CSS pour les animations
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
      
      @keyframes bounce {
        0%, 20%, 53%, 80%, 100% {
          transform: translate3d(0,0,0);
        }
        40%, 43% {
          transform: translate3d(0,-8px,0);
        }
        70% {
          transform: translate3d(0,-4px,0);
        }
        90% {
          transform: translate3d(0,-2px,0);
        }
      }
      
      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }
    `
    document.head.appendChild(style)
    

    
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  // État pour le menu de partage
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [openProductShareMenu, setOpenProductShareMenu] = useState<string | null>(null)
  
  // États pour la section partage
  const [showProductDetailsModal, setShowProductDetailsModal] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<any>(null)
  
  // États pour la section points
  const [showPointsPurchaseModal, setShowPointsPurchaseModal] = useState(false)
  const [selectedPointsOffer, setSelectedPointsOffer] = useState<any>(null)
  
  // États pour le processus de paiement
  const [paymentStep, setPaymentStep] = useState<'selection' | 'details' | 'processing' | 'success' | 'error'>('selection')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mobile-money' | 'bank-transfer' | 'card'>('mobile-money')
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    bankAccount: '',
    accountName: ''
  })
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  
  // Hooks localStorage
  const { value: cartItems } = useLocalStorageArray<CartItem>('cart', [])
  const { value: userPoints, setValue: setUserPoints } = useLocalStorageNumber('userPoints', 15420)

  // États pour les fonctionnalités des promotions
  const [promotionFavorites, setPromotionFavorites] = useState<string[]>([])
  const [promotionAlerts, setPromotionAlerts] = useState<string[]>([])
  const [promotionUsage, setPromotionUsage] = useState<Record<string, number>>({})
  const [appliedPromotions, setAppliedPromotions] = useState<string[]>([])
  const [promotionHistory, setPromotionHistory] = useState<any[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [showProductsModal, setShowProductsModal] = useState(false)

  // États pour les fonctionnalités des produits
  const [productFavorites, setProductFavorites] = useState<string[]>([])
  const [productCart, setProductCart] = useState<any[]>([])
  const [productWishlist, setProductWishlist] = useState<string[]>([])
  const [productShareHistory, setProductShareHistory] = useState<any[]>([])

  // États pour les fonctionnalités des vendeurs
  const [sellerFavorites, setSellerFavorites] = useState<string[]>([])
  const [sellerChatHistory, setSellerChatHistory] = useState<any[]>([])
  const [sellerFollowStatus, setSellerFollowStatus] = useState<Record<string, boolean>>({})

  // États pour les notifications et alertes
  const [showPromotionSuccessModal, setShowPromotionSuccessModal] = useState(false)
  const [showProductAddedModal, setShowProductAddedModal] = useState(false)
  const [showSellerContactModal, setShowSellerContactModal] = useState(false)
  const [showPromotionHistoryModal, setShowPromotionHistoryModal] = useState(false)
  const [selectedItemForShare, setSelectedItemForShare] = useState<any>(null)
  




  useEffect(() => {
    // Simuler le chargement
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Gestionnaire pour fermer le menu des notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.notifications-dropdown')) {
        setShowNotificationsDropdown(false)
      }
    }

    if (showNotificationsDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotificationsDropdown])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'confirmed': return <Clock className="h-4 w-4" />
      case 'pending': return <AlertCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    const currencyMap = {
      'xof': 'XOF',
      'usd': 'USD', 
      'eur': 'EUR'
    }
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyMap[selectedCurrency as keyof typeof currencyMap] || 'XOF'
    }).format(amount)
  }

  // Fonction pour afficher les valeurs en points et en F CFA
  const formatValueWithPoints = (amount: number, showPoints: boolean = true) => {
    const currencyValue = formatCurrency(amount)
    const pointsValue = Math.round(amount * 1.25) // 1 F CFA = 1.25 points (1 point = 0.8 F CFA)
    
    if (showPoints) {
      return (
        <div className="flex flex-col">
          <span className="font-bold">{currencyValue}</span>
          <span className="text-xs text-[#ff6600] font-medium">{pointsValue.toLocaleString()} points</span>
        </div>
      )
    }
    
    return currencyValue
  }

  const setPromotionAlert = (promotionId: string) => {
    setPromotionAlerts(prev => 
      prev.includes(promotionId) 
        ? prev.filter(id => id !== promotionId)
        : [...prev, promotionId]
    )
    
    const hasAlert = promotionAlerts.includes(promotionId)
    toast({
      title: hasAlert ? "Alerte désactivée" : "Alerte activée",
      description: hasAlert 
        ? "Vous ne recevrez plus de notifications pour cette promotion" 
        : "Vous recevrez des notifications pour cette promotion",
      variant: "default",
    })
  }

  // Fonctions pour les produits
  const addProductToCart = (product: any) => {
    // Vérifier si le produit est déjà dans le panier
    if (productCart.some(item => item.id === product.id)) {
      toast({
        title: "Produit déjà dans le panier",
        description: "Ce produit est déjà présent dans votre panier",
        variant: "destructive",
      })
      return
    }

    // Ajouter au panier
    const cartItem = {
      ...product,
      quantity: 1,
      addedAt: new Date()
    }
    setProductCart(prev => [...prev, cartItem])

    // Afficher la modal de confirmation
    setSelectedProduct(product)
    setShowProductAddedModal(true)

    toast({
      title: "Produit ajouté au panier !",
      description: `${product.name} a été ajouté à votre panier`,
      variant: "default",
    })
  }

  const addProductToCartWithPromotion = (product: any, promotion: any) => {
    // Vérifier si le produit est déjà dans le panier
    if (productCart.some(item => item.id === product.id)) {
      toast({
        title: "Produit déjà dans le panier",
        description: "Ce produit est déjà présent dans votre panier",
        variant: "destructive",
      })
      return
    }

    // Ajouter au panier avec la promotion active
    const cartItem = {
      ...product,
      quantity: 1,
      addedAt: new Date(),
      activePromotion: promotion ? {
        code: promotion.code || promotion.id,
        title: promotion.title,
        value: promotion.value,
        type: promotion.type
      } : null
    }
    setProductCart(prev => [...prev, cartItem])

    // Afficher la modal de confirmation
    setSelectedProduct(product)
    setShowProductAddedModal(true)

    toast({
      title: "Produit ajouté avec promotion !",
      description: `${product.name} a été ajouté à votre panier avec la promotion ${promotion?.title || 'active'}`,
      variant: "default",
    })
  }

  const toggleProductFavorite = (productId: string | number) => {
    const productIdStr = productId.toString()
    setProductFavorites(prev => 
      prev.includes(productIdStr) 
        ? prev.filter(id => id !== productIdStr)
        : [...prev, productIdStr]
    )
    
    const isFavorite = productFavorites.includes(productIdStr)
    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFavorite 
        ? "Produit retiré de vos favoris" 
        : "Produit ajouté à vos favoris",
      variant: "default",
    })
  }

  const shareProduct = (item: any) => {
    setSelectedItemForShare(item)
    setShowShareMenu(true)
  }

  const executeShare = (platform: string, item: any) => {
    // Déterminer si c'est un produit ou une promotion
    const isProduct = item.hasOwnProperty('name') && item.hasOwnProperty('category')
    const isPromotion = item.hasOwnProperty('title') && item.hasOwnProperty('code')
    
    let itemUrl = ""
    let message = ""
    let shareRecord = null
    
    if (isProduct) {
      // C'est un produit
      itemUrl = `${window.location.origin}/product/${item.id}`
      message = `Découvrez ce produit incroyable : ${item.name}`
      
      shareRecord = {
        id: Date.now().toString(),
        productId: item.id,
        productName: item.name,
        platform,
        sharedAt: new Date()
      }
    } else if (isPromotion) {
      // C'est une promotion
      itemUrl = `${window.location.origin}/promotions/${item.code}`
      message = `Promotion exceptionnelle : ${item.title} - ${item.description}`
      
      shareRecord = {
        id: Date.now().toString(),
        promotionId: item.code,
        promotionTitle: item.title,
        platform,
        sharedAt: new Date()
      }
    }
    
    let shareUrl = ""
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(itemUrl)}&quote=${encodeURIComponent(message)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(message)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + itemUrl)}`
        break
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(message)}`
        break
      case 'email':
        const subject = isProduct ? 'Produit recommandé' : 'Promotion exceptionnelle'
        shareUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message + '\n\n' + itemUrl)}`
        break
      case 'copy':
        navigator.clipboard.writeText(itemUrl)
        toast({
          title: "Lien copié !",
          description: `Le lien ${isProduct ? 'du produit' : 'de la promotion'} a été copié`,
          variant: "default",
        })
        setShowShareMenu(false)
        return
      default:
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      
      // Enregistrer le partage
      if (shareRecord) {
        if (isProduct) {
          setProductShareHistory(prev => [shareRecord, ...prev])
        } else {
          // Ajouter l'historique des partages de promotions si l'état existe
          // setPromotionShareHistory(prev => [shareRecord, ...prev])
        }
      }
      
      toast({
        title: "Partage réussi !",
        description: `${isProduct ? 'Produit' : 'Promotion'} partagé sur ${platform}`,
        variant: "default",
      })
    }
    
    setShowShareMenu(false)
  }

  // Fonctions pour les vendeurs
  const contactSeller = (seller: any) => {
    // Ouvrir le chat avec le vendeur
    setActiveTab('chat')
    
    // Enregistrer le contact
    const contactRecord = {
      id: Date.now().toString(),
      sellerId: seller.id,
      sellerName: seller.name,
      contactedAt: new Date()
    }
    setSellerChatHistory(prev => [contactRecord, ...prev])
    
    // Fermer la modal si elle est ouverte
    setShowSellerDetailsModal(false)
    
    toast({
      title: "Chat ouvert !",
      description: `Ouverture du chat avec ${seller.name}`,
      variant: "default",
    })
  }

  const toggleSellerFollow = (sellerId: string) => {
    setSellerFollowStatus(prev => ({
      ...prev,
      [sellerId]: !prev[sellerId]
    }))
    
    const isFollowing = sellerFollowStatus[sellerId]
    toast({
      title: isFollowing ? "Ne suit plus" : "Suit maintenant",
      description: isFollowing 
        ? "Vous ne suivez plus ce vendeur" 
        : "Vous suivez maintenant ce vendeur",
      variant: "default",
    })
  }

  const viewSellerProfile = (seller: any) => {
    toast({
      title: "Redirection...",
      description: "Ouverture du profil complet du vendeur",
      variant: "default",
    })
    
    setTimeout(() => {
      window.open(`/seller/${seller.id}`, '_blank')
    }, 1000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fonctions pour les promotions
  const applyPromotion = (promotion: any) => {
    // Vérifier si la promotion est déjà appliquée
    if (appliedPromotions.includes(promotion.id)) {
      toast({
        title: "Promotion déjà appliquée",
        description: "Cette promotion est déjà active sur votre compte",
        variant: "destructive",
      })
      return
    }

    // Vérifier si la promotion est active
    if (!promotion.isActive) {
      toast({
        title: "Promotion expirée",
        description: "Cette promotion n'est plus disponible",
        variant: "destructive",
      })
      return
    }

    // Vérifier les conditions
    if (promotion.conditions.length > 0) {
      const conditionsMet = promotion.conditions.every((condition: string) => {
        // Logique de vérification des conditions
        if (condition.includes("minimum")) {
          const minAmount = parseInt(condition.match(/\d+/)?.[0] || "0")
          return userPoints >= minAmount
        }
        if (condition.includes("catégorie")) {
          return true // Pour l'instant, on accepte toutes les catégories
        }
        return true
      })

      if (!conditionsMet) {
        toast({
          title: "Conditions non remplies",
          description: "Vous ne remplissez pas toutes les conditions pour cette promotion",
          variant: "destructive",
        })
        return
      }
    }

    // Appliquer la promotion
    setAppliedPromotions(prev => [...prev, promotion.id])
    setPromotionUsage(prev => ({
      ...prev,
      [promotion.id]: (prev[promotion.id] || 0) + 1
    }))

    // Ajouter à l'historique
    const promotionRecord = {
      id: promotion.id,
      title: promotion.title,
      appliedAt: new Date(),
      value: promotion.value,
      type: promotion.type
    }
    setPromotionHistory(prev => [promotionRecord, ...prev])

    // Afficher la modal de succès
    setSelectedPromotion(promotion)
    setShowPromotionSuccessModal(true)

    toast({
      title: "Promotion appliquée avec succès !",
      description: `${promotion.title} est maintenant active sur votre compte`,
      variant: "default",
    })
  }

  const copyPromotionCode = (promotion: any) => {
    const code = promotion.code || `PROMO-${promotion.id.slice(-6).toUpperCase()}`
    navigator.clipboard.writeText(code)
    toast({
      title: "Code copié !",
      description: `Le code ${code} a été copié dans votre presse-papiers`,
      variant: "default",
    })
  }

  const sharePromotion = (promotion: any) => {
    setSelectedItemForShare(promotion)
    setShowShareMenu(true)
  }

  // Fonction pour exporter les promotions
  const exportPromotions = () => {
    const csvContent = [
      ['Titre', 'Type', 'Valeur', 'Début', 'Fin', 'Utilisations', 'Statut', 'Priorité'],
      ...mockPromotions.map(promotion => [
        promotion.title,
        promotion.type,
        promotion.value,
        formatDate(promotion.startDate),
        formatDate(promotion.endDate),
        promotion.usageCount.toString(),
        promotion.isActive ? 'Active' : 'Expirée',
        promotion.priority.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Promotions-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export réussi !",
      description: "Vos promotions ont été exportées en CSV",
      variant: "default",
    })
  }

  // Fonction pour ouvrir l'historique des promotions
  const openPromotionHistory = () => {
    // Ouvrir la modale d'historique des promotions
    setShowPromotionHistoryModal(true)
    toast({
      title: "Historique des promotions !",
      description: "Ouverture de l'historique des promotions",
      variant: "default",
    })
  }

  // Fonction pour activer les alertes de promotion
  const togglePromotionAlerts = (promotionTitle: string) => {
    console.log('togglePromotionAlerts appelée avec:', promotionTitle)
    console.log('État actuel des alertes:', promotionAlerts)
    
    const hasAlert = promotionAlerts.includes(promotionTitle)
    console.log('Cette promotion a-t-elle déjà une alerte?', hasAlert)
    
    if (hasAlert) {
      setPromotionAlerts(prev => {
        const newAlerts = prev.filter(title => title !== promotionTitle)
        console.log('Nouveaux alertes après désactivation:', newAlerts)
        return newAlerts
      })
      toast({
        title: "Alertes désactivées !",
        description: "Vous ne recevrez plus d'alertes pour cette promotion",
        variant: "default",
      })
    } else {
      setPromotionAlerts(prev => {
        const newAlerts = [...prev, promotionTitle]
        console.log('Nouveaux alertes après activation:', newAlerts)
        return newAlerts
      })
      toast({
        title: "Alertes activées !",
        description: "Vous recevrez des notifications pour cette promotion",
        variant: "default",
      })
    }
  }

  // Fonction pour rediriger vers la boutique avec promotion active
  const navigateToShopWithPromotion = (promotionTitle: string) => {
    toast({
      title: "Navigation !",
      description: "Redirection vers la boutique avec promotion active",
      variant: "default",
    })
    
    // Rediriger vers la page des produits avec la promotion active
    if (typeof window !== 'undefined') {
      const promotionParam = encodeURIComponent(promotionTitle.toLowerCase().replace(/\s+/g, '-'))
      window.location.href = `/products?promotion=${promotionParam}&special=true`
    }
  }

  // Fonction pour partager une promotion spéciale
  const shareSpecialPromotion = (promotion: any) => {
    const message = `Promotion exceptionnelle : ${promotion.title} - ${promotion.description}`
    const url = `${window.location.origin}/promotions/${promotion.title.toLowerCase().replace(/\s+/g, '-')}`
    
    // Ouvrir le menu de partage avec la promotion spéciale
    setSelectedItemForShare({
      ...promotion,
      id: promotion.title.toLowerCase().replace(/\s+/g, '-'),
      name: promotion.title,
      category: 'promotion-speciale'
    })
    setShowShareMenu(true)
  }



  const togglePromotionFavorite = (promotionId: string) => {
    setPromotionFavorites(prev => 
      prev.includes(promotionId) 
        ? prev.filter(id => id !== promotionId)
        : [...prev, promotionId]
    )
    
    const isFavorite = promotionFavorites.includes(promotionId)
    toast({
      title: isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFavorite 
        ? "Promotion retirée de vos favoris" 
        : "Promotion ajoutée à vos favoris",
      variant: "default",
    })
  }

  // Fonction pour gérer le retrait de points
  const handleWithdrawal = () => {
    if (!withdrawalAmount || !selectedWithdrawalMethod) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      })
      return
    }

    const points = parseInt(withdrawalAmount)
    if (points < 1000) {
      toast({
        title: "Montant insuffisant",
        description: "Le montant minimum est de 1,000 points",
        variant: "destructive",
      })
      return
    }

    // Simuler le traitement du retrait
    toast({
      title: "Retrait en cours...",
      description: "Votre demande est en cours de traitement",
      variant: "default",
    })

    // Ici on pourrait appeler une API pour traiter le retrait
    setTimeout(() => {
      toast({
        title: "Retrait confirmé !",
        description: `Votre retrait de ${points} points a été traité avec succès`,
      variant: "default",
      })
      
      // Réinitialiser le formulaire
      setWithdrawalAmount('')
      setSelectedWithdrawalMethod(null)
      setShowWithdrawalModal(false)
    }, 2000)
  }

  // Fonction pour générer et télécharger l'historique des transactions en CSV
  const generateAndDownloadTransactionsCSV = () => {
    console.log('Fonction generateAndDownloadTransactionsCSV appelée !')
    try {
      // Données des transactions (mock)
      const transactions = [
        {
          id: '1',
          type: 'earned',
          amount: 200,
          description: 'Partage Facebook - iPhone 15 Pro Max',
          date: '2024-01-15T10:30:00Z',
          balance: 15420
        },
        {
          id: '2',
          type: 'used',
          amount: -500,
          description: 'Achat - Commande ORD-001',
          date: '2024-01-15T09:15:00Z',
          balance: 15220
        },
        {
          id: '3',
          type: 'earned',
          amount: 150,
          description: 'Partage WhatsApp - MacBook Air M2',
          date: '2024-01-14T16:45:00Z',
          balance: 15720
        },
        {
          id: '4',
          type: 'withdrawn',
          amount: -2000,
          description: 'Retrait vers compte bancaire',
          date: '2024-01-10T14:20:00Z',
          balance: 15570
        },
        {
          id: '5',
          type: 'earned',
          amount: 300,
          description: 'Partage Twitter - Samsung Galaxy S24',
          date: '2024-01-08T11:30:00Z',
          balance: 17570
        }
      ]

      // Créer le contenu CSV
      const csvContent = [
        // En-têtes
        ['ID', 'Type', 'Montant (points)', 'Description', 'Date', 'Solde après transaction'],
        // Données
        ...transactions.map(t => [
          t.id,
          t.type === 'earned' ? 'Gagné' : t.type === 'used' ? 'Utilisé' : 'Retiré',
          t.amount > 0 ? `+${t.amount}` : t.amount.toString(),
          t.description,
          formatDate(t.date),
          t.balance.toLocaleString()
        ])
      ].map(row => row.join(',')).join('\n')

      // Créer un blob avec le contenu CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Historique-Transactions-${new Date().toISOString().split('T')[0]}.csv`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Historique exporté !",
        description: "L'historique des transactions a été téléchargé en CSV",
        variant: "default",
      })
      
      console.log('Export CSV réussi ! Fichier téléchargé.')
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
      
      // Notification d'erreur
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'historique. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  // Fonction pour traiter le paiement
  const processPayment = async () => {
    if (!selectedPointsOffer) return
    
    setIsProcessingPayment(true)
    setPaymentStep('processing')
    
    try {
      // Simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simuler la validation du paiement
      const paymentSuccess = Math.random() > 0.1 // 90% de succès
      
      if (paymentSuccess) {
        // Mettre à jour les points de l'utilisateur
        const totalPoints = selectedPointsOffer.points + selectedPointsOffer.bonus
        setUserPoints(prev => prev + totalPoints)
        
        // Enregistrer la transaction
        const transaction = {
          id: `TXN-${Date.now()}`,
          type: 'purchase',
          amount: totalPoints,
          description: `Achat de ${selectedPointsOffer.points.toLocaleString()} points`,
          date: new Date().toISOString(),
          paymentMethod: selectedPaymentMethod,
          amountPaid: selectedPointsOffer.price * 1.02
        }
        
        // Simuler l'enregistrement en base de données
        console.log('Transaction enregistrée:', transaction)
        
        setPaymentStep('success')
        
        toast({
          title: "Paiement réussi !",
          description: `${totalPoints.toLocaleString()} points ont été ajoutés à votre compte`,
          variant: "default",
        })
        
        // Fermer la modal après 3 secondes
        setTimeout(() => {
          setShowPointsPurchaseModal(false)
          setPaymentStep('selection')
          setIsProcessingPayment(false)
        }, 3000)
        
      } else {
        throw new Error('Échec du paiement')
      }
      
    } catch (error) {
      console.error('Erreur lors du paiement:', error)
      setPaymentStep('error')
      
      toast({
        title: "Échec du paiement",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      })
      
      setIsProcessingPayment(false)
    }
  }

  // Fonction pour valider les détails de paiement
  const validatePaymentDetails = () => {
    switch (selectedPaymentMethod) {
      case 'mobile-money':
        return paymentDetails.phoneNumber.length >= 8
      case 'bank-transfer':
        return paymentDetails.bankAccount.length >= 10 && paymentDetails.accountName.length >= 3
      case 'card':
        return paymentDetails.cardNumber.length >= 16 && 
               paymentDetails.cardExpiry.length === 5 && 
               paymentDetails.cardCvv.length >= 3
      default:
        return false
    }
  }

  // Fonction pour réinitialiser le processus de paiement
  const resetPaymentProcess = () => {
    setPaymentStep('selection')
    setIsProcessingPayment(false)
    setPaymentDetails({
      phoneNumber: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      bankAccount: '',
      accountName: ''
    })
  }

  // Fonction pour générer et télécharger un rapport spécifique à un produit
  const generateProductSpecificReport = (product: any) => {
    try {
      // Créer le contenu du rapport spécifique
      const reportContent = `
RAPPORT PRODUIT SPÉCIFIQUE - PRO BOOSTER
=========================================

PRODUIT: ${product.productName}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}
Date de partage: ${formatDate(product.sharedAt)}

STATISTIQUES GLOBALES:
- Total partages: ${product.totalShares}
- Points gagnés: ${product.pointsEarned}
- Points utilisés: ${product.pointsUsed}
- Points retirés: ${product.pointsWithdrawn}
- Points disponibles: ${product.pointsAvailable}

RÉPARTITION PAR RÉSEAU SOCIAL:
- Facebook: ${product.shares.facebook} partages (${Math.round((product.shares.facebook / product.totalShares) * 100)}%)
- WhatsApp: ${product.shares.whatsapp} partages (${Math.round((product.shares.whatsapp / product.totalShares) * 100)}%)
- Twitter/X: ${product.shares.twitter} partages (${Math.round((product.shares.twitter / product.totalShares) * 100)}%)
- Instagram: ${product.shares.instagram} partages (${Math.round((product.shares.instagram / product.totalShares) * 100)}%)

ANALYSE DE PERFORMANCE:
- Réseau le plus performant: ${Object.entries(product.shares).reduce((a, b) => product.shares[a[0]] > product.shares[b[0]] ? a : b)[0]}
- Taux de conversion moyen: ${Math.round((product.pointsEarned / product.totalShares) * 10)} points par partage
- Efficacité globale: ${Math.round((product.totalShares / 100) * 100)}%

RECOMMANDATIONS:
- Continuer à partager sur ${Object.entries(product.shares).reduce((a, b) => product.shares[a[0]] > product.shares[b[0]] ? a : b)[0]}
- Optimiser le contenu pour ${Object.entries(product.shares).reduce((a, b) => product.shares[a[0]] < product.shares[b[0]] ? a : b)[0]}
- Maintenir la fréquence de partage actuelle

Merci pour vos partages !
Pro Booster - Votre marketplace de confiance
      `.trim()

      // Créer un blob avec le contenu
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Rapport-${product.productName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Rapport produit téléchargé !",
        description: `Le rapport pour ${product.productName} a été téléchargé`,
        variant: "default",
      })
    } catch (error) {
      console.error('Erreur lors de l\'export du rapport produit:', error)
      
      // Notification d'erreur
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport produit. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  // Fonction pour générer et télécharger le rapport de partage
  const generateAndDownloadSharesReport = () => {
    try {
      // Créer le contenu du rapport
      const reportContent = `
RAPPORT DE PARTAGE PRO BOOSTER
==============================

Date de génération: ${new Date().toLocaleDateString('fr-FR')}
Total de produits partagés: ${mockSharedProducts.length}

DÉTAILS PAR PRODUIT:
${mockSharedProducts.map((product, index) => `
${index + 1}. ${product.productName}
   Date de partage: ${formatDate(product.sharedAt)}
   Total partages: ${product.totalShares}
   Points gagnés: ${product.pointsEarned}
   Points utilisés: ${product.pointsUsed}
   Points retirés: ${product.pointsWithdrawn}
   Points disponibles: ${product.pointsAvailable}
   
   Répartition par réseau:
   - Facebook: ${product.shares.facebook}
   - WhatsApp: ${product.shares.whatsapp}
   - Twitter: ${product.shares.twitter}
   - Instagram: ${product.shares.instagram}
`).join('')}

RÉSUMÉ GLOBAL:
- Total partages: ${mockSharedProducts.reduce((sum, p) => sum + p.totalShares, 0)}
- Total points gagnés: ${mockSharedProducts.reduce((sum, p) => sum + p.pointsEarned, 0)}
- Total points utilisés: ${mockSharedProducts.reduce((sum, p) => sum + p.pointsUsed, 0)}
- Total points retirés: ${mockSharedProducts.reduce((sum, p) => sum + p.pointsWithdrawn, 0)}
- Total points disponibles: ${mockSharedProducts.reduce((sum, p) => sum + p.pointsAvailable, 0)}

Merci pour vos partages !
Pro Booster - Votre marketplace de confiance
      `.trim()

      // Créer un blob avec le contenu
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Rapport-Partages-${new Date().toISOString().split('T')[0]}.txt`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Rapport exporté !",
        description: "Le rapport de partage a été téléchargé avec succès",
        variant: "default",
      })
    } catch (error) {
      console.error('Erreur lors de l\'export du rapport:', error)
      
      // Notification d'erreur
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le rapport. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

























  // Voir le profil du vendeur depuis le chat
  const viewSellerProfileFromChat = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId)
    if (session) {
      toast({
        title: "Profil vendeur",
        description: "Ouverture du profil du vendeur...",
        variant: "default",
      })
      // Ici on pourrait rediriger vers le profil du vendeur
    }
  }



  // Fonction pour générer et télécharger la facture
  const generateAndDownloadInvoice = (order: Order) => {
    try {
      // Créer le contenu de la facture
      const invoiceContent = `
FACTURE PRO BOOSTER
===================

Numéro de commande: ${order.id}
Date: ${formatDate(order.createdAt)}
Statut: ${order.status === 'delivered' ? 'Livrée' : 
         order.status === 'shipped' ? 'Expédiée' :
         order.status === 'confirmed' ? 'Confirmée' :
         order.status === 'pending' ? 'En attente' : 'Annulée'}

ARTICLES:
${order.items.map((item, index) => `
${index + 1}. ${item.name}
   Quantité: ${item.quantity}
   Prix unitaire: ${formatCurrency(item.price)}
   Sous-total: ${formatCurrency(item.price * item.quantity)}
`).join('')}

${order.pointsUsed && order.pointsUsed > 0 ? `
Points utilisés: ${order.pointsUsed} points
Valeur des points: ${formatCurrency(order.pointsUsed * 10)}
` : ''}

${order.deliveryOption ? `
Option de livraison: ${order.deliveryOption}
` : ''}

TOTAL: ${formatCurrency(order.total)}
Points gagnés: ${Math.round(order.total / 10)} points

Merci pour votre commande !
Pro Booster - Votre marketplace de confiance
      `.trim()

      // Créer un blob avec le contenu
      const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Facture-${order.id}-${new Date().toISOString().split('T')[0]}.txt`
      
      // Déclencher le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Notification de succès
      toast({
        title: "Facture téléchargée !",
        description: `La facture ${order.id} a été téléchargée avec succès`,
        variant: "default",
      })
    } catch (error) {
      console.error('Erreur lors du téléchargement de la facture:', error)
      
      // Notification d'erreur
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger la facture. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center relative">
                <User className="w-6 h-6 text-white" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
                <p className="text-sm text-gray-600">Gérez vos commandes, points et interactions</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">En ligne</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">Dernière connexion: aujourd'hui</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Bouton Notifications avec indicateur et menu déroulant */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="hover:bg-orange-50 hover:border-orange-200 transition-colors relative"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Button>
                
                {/* Menu déroulant des notifications */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 notifications-dropdown">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setActiveTab('notifications')}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Voir tout
                        </Button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {[
                        {
                          id: '1',
                          title: 'Commande livrée',
                          message: 'Votre commande ORD-001 a été livrée avec succès',
                          time: '2h',
                          isRead: false,
                          type: 'success'
                        },
                        {
                          id: '2',
                          title: 'Points gagnés',
                          message: 'Vous avez gagné 200 points pour votre partage',
                          time: '4h',
                          isRead: false,
                          type: 'info'
                        },
                        {
                          id: '3',
                          title: 'Promotion spéciale',
                          message: '20% de réduction sur tous les smartphones',
                          time: '6h',
                          isRead: false,
                          type: 'promotion'
                        },
                        {
                          id: '4',
                          title: 'Nouveau message',
                          message: 'TechStore vous a envoyé un message',
                          time: '8h',
                          isRead: true,
                          type: 'chat'
                        }
                      ].map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            // Marquer comme lu
                            if (!notification.isRead) {
                              setUnreadNotifications(prev => Math.max(0, prev - 1))
                            }
                            // Fermer le menu
                            setShowNotificationsDropdown(false)
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'info' ? 'bg-blue-500' :
                              notification.type === 'promotion' ? 'bg-orange-500' :
                              'bg-purple-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200 bg-gray-50">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="w-full text-gray-600 hover:text-gray-800"
                        onClick={() => {
                          setUnreadNotifications(0)
                          setShowNotificationsDropdown(false)
                        }}
                      >
                        Marquer toutes comme lues
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bouton Paramètres */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('settings')}
                className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
              
              {/* Bouton Rafraîchir */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsLoading(true)
                  setTimeout(() => setIsLoading(false), 1000)
                }}
                className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
                title="Rafraîchir le tableau de bord"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Navigation Latérale */}
          <div className="w-80 flex-shrink-0">
            <div className="space-y-6">
              {/* Profil utilisateur */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">John Doe</h3>
                      <p className="text-sm text-gray-600">Client Premium</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-gray-600">4.8/5</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation des sections */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sections</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    {[
                      { id: 'overview', label: 'Vue d\'ensemble', icon: Activity, active: activeTab === 'overview' },
                      { id: 'orders', label: 'Commandes', icon: Package, active: activeTab === 'orders' },
                      { id: 'chat', label: 'Chat', icon: MessageCircle, active: activeTab === 'chat' },
                      { id: 'shares', label: 'Partages', icon: Share2, active: activeTab === 'shares' },
                      { id: 'points', label: 'Points', icon: Gift, active: activeTab === 'points' },
                      { id: 'recommendations', label: 'Recommandations IA', icon: Sparkles, active: activeTab === 'recommendations' },
                      { id: 'promotions', label: 'Offres Promotionnelles', icon: Tag, active: activeTab === 'promotions' },
                      { id: 'notifications', label: 'Gestion Notifications', icon: Bell, active: activeTab === 'notifications' },
                      { id: 'messaging', label: 'Messagerie Interne', icon: Mail, active: activeTab === 'messaging' },
                      { id: 'settings', label: 'Paramètres Système', icon: Settings, active: activeTab === 'settings' },
                      { id: 'profile', label: 'Profil', icon: User, active: activeTab === 'profile' }
                    ].map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveTab(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                          section.active
                            ? 'bg-orange-50 border-r-2 border-orange-500 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <section.icon className={`w-5 h-5 ${section.active ? 'text-orange-600' : 'text-gray-500'}`} />
                        <span className="font-medium">{section.label}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              {/* Demande de Paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>Demande de Paiement</span>
                  </CardTitle>
                  <CardDescription>Retirez vos points gagnés en argent réel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Solde des points */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">Solde Points</span>
                      <Gift className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-900 mb-1">
                      {userPoints.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">
                      ≈ {formatCurrency(userPoints * 0.8)} {selectedCurrency}
                    </div>
                    <div className="text-xs text-green-500 mt-1">
                      Taux: 1 point = 0.8 {selectedCurrency}
                    </div>
                  </div>

                  {/* Seuil de retrait */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Seuil minimum</span>
                    </div>
                    <p className="text-sm text-blue-600">
                      Minimum: 1,000 points ({formatCurrency(1000 * 0.8)} {selectedCurrency})
                    </p>
                  </div>

                  {/* Bouton de demande amélioré */}
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 group relative overflow-visible"
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={userPoints < 1000}
                  >
                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    
                    <CreditCard className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">Demander un Paiement</span>
                    
                    {/* Badge des nouveaux modes de paiement - Ajusté pour éviter la coupure */}
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse shadow-sm border border-yellow-500">
                      NOUVEAU
                    </div>
                  </Button>
                  
                  {/* Informations sur les modes de paiement */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Modes de paiement disponibles</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-blue-600">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Mobile Money</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Carte bancaire</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Compte bancaire</span>
                      </div>
                    </div>
                  </div>

                  {/* Historique des demandes */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Demandes récentes</h4>
                    <div className="space-y-2">
                      {[
                        { id: 'WD-001', amount: 5000, points: 6250, status: 'Approuvée', date: '2024-01-15' },
                        { id: 'WD-002', amount: 3000, points: 3750, status: 'En cours', date: '2024-01-10' },
                        { id: 'WD-003', amount: 2000, points: 2500, status: 'Complétée', date: '2024-01-05' }
                      ].map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="text-xs font-medium">{request.id}</p>
                            <p className="text-xs text-gray-500">{request.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium">{formatCurrency(request.amount)}</p>
                            <Badge 
                              variant={request.status === 'Approuvée' ? 'default' : 
                                     request.status === 'En cours' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Statistiques Rapides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900 mb-1">24</div>
                      <p className="text-xs text-blue-600">Commandes</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-900 mb-1">89</div>
                      <p className="text-xs text-green-600">Partages</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900 mb-1">7</div>
                      <p className="text-xs text-purple-600">Chats</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-900 mb-1">4.8</div>
                      <p className="text-xs text-orange-600">Note</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <span>Actions Rapides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setShowAdvancedChat(true)}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Nouveau Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('shares')}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager un Produit
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('orders')}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Nouvelle Commande
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contenu Principal */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Statistiques principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Total Commandes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">{mockStats.totalOrders}</div>
                        <ShoppingBag className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">+12% ce mois</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Points Fidélité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">{userPoints.toLocaleString()}</div>
                        <Gift className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Valeur: {formatCurrency(userPoints * 10)} • {userPoints} points
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Partages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">{mockStats.totalShares}</div>
                        <Share2 className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">+8 cette semaine</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Total Dépensé</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">{formatCurrency(mockStats.totalSpent)}</div>
                        <CreditCard className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">+15% ce mois</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphiques et activités récentes */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Graphique des points */}
                  <div className="lg:col-span-2">
                    <PointsEvolutionChart 
                      title="Évolution des Points"
                      description="Progression de vos points fidélité sur 30 jours"
                    />
                  </div>

                  {/* Activités récentes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>Activités Récentes</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Commande livrée</p>
                          <p className="text-xs text-gray-500">iPhone 15 Pro Max</p>
                        </div>
                        <span className="text-xs text-gray-400">2h</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Points gagnés</p>
                          <p className="text-xs text-gray-500">+200 points</p>
                        </div>
                        <span className="text-xs text-gray-400">4h</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Produit partagé</p>
                          <p className="text-xs text-gray-500">MacBook Air M2</p>
                        </div>
                        <span className="text-xs text-gray-400">6h</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Nouveau message</p>
                          <p className="text-xs text-gray-500">TechStore</p>
                        </div>
                        <span className="text-xs text-gray-400">8h</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Commandes récentes et vendeurs favoris */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Commandes récentes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span>Commandes Récentes</span>
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('orders')
                            toast({
                              title: "Navigation effectuée !",
                              description: "Vous êtes maintenant dans la section Commandes",
                              variant: "default",
                            })
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mockOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{order.id}</p>
                            <p className="text-xs text-gray-500">{order.items[0].name}</p>
                          </div>
                                                    <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                            <p className="text-xs text-[#ff6600]">{Math.round(order.total / 10)} points</p>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Vendeurs favoris */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center space-x-2">
                          <Heart className="w-5 h-5 text-red-600" />
                          <span>Vendeurs Favoris</span>
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setActiveTab('sellers')
                            toast({
                              title: "Navigation effectuée !",
                              description: "Vous êtes maintenant dans la section Vendeurs",
                              variant: "default",
                            })
                          }}
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {mockSellers.slice(0, 3).map((seller) => (
                        <div key={seller.name} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={seller.avatar} />
                            <AvatarFallback>{seller.name && seller.name.length > 0 ? seller.name[0] : '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p 
                                className="text-sm font-medium cursor-pointer hover:text-blue-600 transition-colors duration-300"
                                onClick={() => router.push(`/seller/${seller.name.toLowerCase().replace(/\s+/g, '-')}`)}
                              >
                                {seller.name}
                              </p>
                              <div className={`w-2 h-2 rounded-full ${seller.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <p className="text-xs text-gray-500">{seller.rating}</p>
                              <span className="text-xs text-gray-400">•</span>
                              <p className="text-xs text-gray-500">{seller.responseTime}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setShowAdvancedChat(true)
                              toast({
                                title: "Chat ouvert !",
                                description: `Chat avec ${seller.name} ouvert`,
                                variant: "default",
                              })
                            }}
                            className="hover:bg-green-50 hover:text-green-600 transition-colors"
                            title={`Chatter avec ${seller.name}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Graphiques supplémentaires */}
                <div className="space-y-6">
                  {/* Statistiques en temps réel */}
                  <RealTimeStats />

                  {/* Graphiques d'activité */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WeeklyActivityChart 
                      title="Activité Hebdomadaire"
                      description="Vue d'ensemble de vos activités sur la semaine"
                    />
                    <PerformanceRadarChart 
                      title="Performance Globale"
                      description="Évaluation de vos performances par métrique"
                    />
                  </div>

                  {/* Graphique des commandes */}
                  <OrdersChart 
                    title="Évolution des Commandes"
                    description="Progression de vos commandes et revenus sur 6 mois"
                  />
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                {/* Filtres et recherche */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Mes Commandes</span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Export en cours !",
                              description: "Vos commandes sont en cours d'exportation...",
                              variant: "default",
                            })
                            // Simuler l'export
                            setTimeout(() => {
                              toast({
                                title: "Export terminé !",
                                description: "Vos commandes ont été exportées avec succès",
                                variant: "default",
                              })
                            }, 2000)
                          }}
                          className="hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Filtres appliqués !",
                              description: "Les filtres ont été appliqués à vos commandes",
                              variant: "default",
                            })
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filtrer
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>Suivi complet de vos commandes et livraisons</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher une commande..."
                          className="pl-10"
                          onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase()
                            // Simuler la recherche
                            if (searchTerm.length > 2) {
                              toast({
                                title: "Recherche effectuée !",
                                description: `Résultats pour "${searchTerm}"`,
                                variant: "default",
                              })
                            }
                          }}
                        />
                      </div>
                      <Select defaultValue="all" onValueChange={(value) => {
                        if (value !== 'all') {
                          toast({
                            title: "Filtre appliqué !",
                            description: `Commandes avec le statut: ${value}`,
                            variant: "default",
                          })
                        }
                      }}>
                        <SelectTrigger className="w-48 hover:bg-gray-50 transition-colors">
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="confirmed">Confirmée</SelectItem>
                          <SelectItem value="shipped">Expédiée</SelectItem>
                          <SelectItem value="delivered">Livrée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Statistiques des commandes */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card 
                        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Vue d'ensemble !",
                            description: "Affichage de toutes vos commandes",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-blue-700">Total</p>
                              <p className="text-2xl font-bold text-blue-900">24</p>
                            </div>
                            <Package className="w-8 h-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Commandes en cours !",
                            description: "8 commandes en cours de traitement",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-yellow-700">En cours</p>
                              <p className="text-2xl font-bold text-yellow-900">8</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Commandes livrées !",
                            description: "14 commandes livrées avec succès",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-green-700">Livrées</p>
                              <p className="text-2xl font-bold text-green-900">14</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                        onClick={() => {
                          toast({
                            title: "Commandes annulées !",
                            description: "2 commandes ont été annulées",
                            variant: "default",
                          })
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-red-700">Annulées</p>
                              <p className="text-2xl font-bold text-red-900">2</p>
                            </div>
                            <XCircle className="w-8 h-8 text-red-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Liste des commandes */}
                    <div className="space-y-4">
                      {mockOrders.map((order) => (
                        <Card key={order.id} className="hover:shadow-md transition-shadow group">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-600" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium">{order.id}</h3>
                                    <Badge className={getStatusColor(order.status)}>
                                      {getStatusIcon(order.status)}
                                      <span className="ml-1">{order.status}</span>
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {order.items[0].name} {order.items.length > 1 && `+${order.items.length - 1} autres`}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                    <span>Commandé le {formatDate(order.createdAt)}</span>
                                    <span>•</span>
                                    <span>{order.deliveryOption}</span>
                                    {order.pointsUsed && order.pointsUsed > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{order.pointsUsed} points utilisés</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div>
                          <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                          <p className="text-sm text-[#ff6600]">{Math.round(order.total / 10)} points</p>
                        </div>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrder(order)
                                      setShowOrderDetailsModal(true)
                                    }}
                                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Détails
                                  </Button>
                                  
                                  {/* Boutons d'action contextuels */}
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {order.status === 'delivered' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedOrderForAction(order)
                                          setShowOrderEvaluationModal(true)
                                        }}
                                        className="hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                        title="Évaluer la commande"
                                      >
                                        <Star className="w-4 h-4" />
                                      </Button>
                                    )}
                                    
                                    {order.status === 'shipped' && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setSelectedOrderForAction(order)
                                          setShowOrderTrackingModal(true)
                                        }}
                                        className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                        title="Suivre la livraison"
                                      >
                                        <Truck className="w-4 h-4" />
                                      </Button>
                                    )}
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.id)
                                        toast({
                                          title: "Numéro copié !",
                                          description: "Le numéro de commande a été copié",
                                          variant: "default",
                                        })
                                      }}
                                      className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      title="Copier le numéro"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                    
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        // Générer et télécharger la facture
                                        generateAndDownloadInvoice(order)
                                      }}
                                      className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                      title="Télécharger la facture"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Boutons principaux */}
                                  {order.status === 'delivered' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrderForAction(order)
                                        setShowOrderEvaluationModal(true)
                                      }}
                                      className="hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                    >
                                      <Star className="w-4 h-4 mr-1" />
                                      Évaluer
                                    </Button>
                                  )}
                                  {order.status === 'shipped' && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedOrderForAction(order)
                                        setShowOrderTrackingModal(true)
                                      }}
                                      className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                    >
                                      <Truck className="w-4 h-4 mr-1" />
                                      Suivre
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-6">
                {/* Section CHAT - Interface moderne et stylée */}
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-6 h-6 text-orange-600" />
                        <span className="text-xl font-bold text-gray-900">Messages</span>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-medium">
                          {mockSellers.filter(s => s.isOnline).length} en ligne
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex h-[600px] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      {/* Panneau gauche - Liste des conversations */}
                      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                        {/* Barre de recherche */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              placeholder="Rechercher des conversations..."
                              value={chatSearchQuery}
                              onChange={(e) => setChatSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300 transition-all duration-200"
                            />
                          </div>
                        </div>

                        {/* Onglets et contenu */}
                        <div className="flex-1 overflow-y-auto">
                          <Tabs value={chatActiveTab} onValueChange={(value) => setChatActiveTab(value as 'conversations' | 'produits')} className="w-full h-full flex flex-col">
                            <div className="px-4 pt-2">
                              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1">
                                <TabsTrigger 
                                  value="conversations" 
                                  className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all duration-200"
                                >
                                  Conversations
                                </TabsTrigger>
                                <TabsTrigger 
                                  value="produits" 
                                  className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all duration-200"
                                >
                                  Produits
                                </TabsTrigger>
                              </TabsList>
                            </div>

                            <TabsContent value="conversations" className="mt-0 flex-1">
                              <div className="space-y-1 p-2">
                                {mockSellers
                                  .filter(seller => 
                                    seller.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                                    seller.lastMessage?.toLowerCase().includes(chatSearchQuery.toLowerCase())
                                  )
                                  .map((seller) => (
                                    <div
                                      key={seller.name}
                                      onClick={() => setSelectedChatSeller(seller.name)}
                                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 ${
                                        selectedChatSeller === seller.name ? 'bg-orange-100 border border-orange-200' : 'hover:border-orange-100'
                                      }`}
                                    >
                                      <div className="flex items-start space-x-3">
                                        <div className="relative">
                                          <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                            <AvatarImage src={seller.avatar} alt={seller.name} />
                                            <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                                              {seller.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                            seller.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                          }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-gray-900 truncate">{seller.name}</h4>
                                            <span className="text-xs text-gray-500">{seller.responseTime}</span>
                                          </div>
                                          <p className="text-sm text-gray-600 truncate mb-1">{seller.lastMessage}</p>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-1">
                                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                              <span className="text-xs text-gray-600">{seller.rating}</span>
                                            </div>
                                            <Badge 
                                              variant="secondary" 
                                              className={`text-xs px-2 py-0.5 ${
                                                seller.name === 'TechStore' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                              }`}
                                            >
                                              {seller.name === 'TechStore' ? '1' : '0'}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </TabsContent>

                            <TabsContent value="produits" className="mt-0 flex-1 flex flex-col">
                              {/* Champ de recherche spécifique aux produits */}
                              <div className="p-3 border-b border-gray-100">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                  <Input
                                    placeholder="Rechercher un produit..."
                                    value={productSearchQuery}
                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                    className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 text-sm"
                                  />
                                </div>
                              </div>
                              
                              {/* Liste des produits */}
                              <div className="flex-1 overflow-y-auto">
                                <div className="space-y-1 p-2">
                                  {mockChatProducts
                                    .filter(product => 
                                      product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                      product.seller.toLowerCase().includes(productSearchQuery.toLowerCase())
                                    )
                                    .map((product, index) => (
                                      <div
                                        key={product.id}
                                        className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 hover:border-orange-100 border border-transparent"
                                        onClick={() => addProductToChat(product)}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <Avatar className="w-10 h-10 border border-gray-200">
                                            <AvatarImage src={product.image} alt={product.name} />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
                                              {product.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate text-sm">{product.name}</h4>
                                            <p className="text-xs text-gray-500">{product.seller}</p>
                                            
                                            {/* Prix en devise et en points */}
                                            <div className="space-y-1 mt-1">
                                              <p className="text-sm font-semibold text-orange-600">{formatCurrency(product.price)}</p>
                                              <div className="flex items-center space-x-1">
                                                <Coins className="w-3 h-3 text-yellow-500" />
                                                <span className="text-xs text-gray-600">
                                                  {Math.round(product.price * 10)} pts
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  
                                  {/* Message si aucun produit trouvé */}
                                  {mockChatProducts.filter(product => 
                                    product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                                    product.seller.toLowerCase().includes(productSearchQuery.toLowerCase())
                                  ).length === 0 && (
                                    <div className="text-center py-8">
                                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                      <p className="text-sm text-gray-500">Aucun produit trouvé</p>
                                      <p className="text-xs text-gray-400">Essayez avec d'autres mots-clés</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>

                      {/* Panneau droit - Zone de chat */}
                      <div className="flex-1 bg-white flex flex-col">
                        {selectedChatSeller ? (
                          <>
                            {/* En-tête de la conversation */}
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-10 h-10 border-2 border-orange-200">
                                    <AvatarImage src={mockSellers.find(s => s.name === selectedChatSeller)?.avatar} alt={selectedChatSeller} />
                                    <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                                      {selectedChatSeller.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{selectedChatSeller}</h3>
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        mockSellers.find(s => s.name === selectedChatSeller)?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                      }`} />
                                      <span className="text-sm text-gray-600">
                                        {mockSellers.find(s => s.name === selectedChatSeller)?.isOnline ? 'En ligne' : 'Hors ligne'}
                                      </span>
                                      <span className="text-sm text-gray-500">•</span>
                                      <span className="text-sm text-gray-500">
                                        Répond en {mockSellers.find(s => s.name === selectedChatSeller)?.responseTime}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-orange-600 relative group"
                                    onClick={() => {
                                      setSelectedShopSeller(selectedChatSeller)
                                      setShowShopModal(true)
                                    }}
                                    title="Voir la boutique"
                                  >
                                    <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                    {/* Indicateur de promotions */}
                                    {mockShopProducts.filter(p => p.seller === selectedChatSeller && p.isPromoted).length > 0 && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                    )}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-orange-600"
                                    onClick={handleCall}
                                    title="Appeler le vendeur"
                                  >
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-orange-600"
                                    onClick={handleVideoCall}
                                    title="Appel vidéo"
                                  >
                                    <Video className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-600 hover:text-orange-600 relative"
                                    onClick={handleChatMenu}
                                    title="Plus d'options"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                    {/* Menu du chat */}
                                    {showChatMenu && (
                                      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1 min-w-[150px] z-10">
                                        <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                                          <Archive className="w-4 h-4 mr-2" />
                                          Archiver
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                                          <Pin className="w-4 h-4 mr-2" />
                                          Épingler
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Supprimer
                                        </Button>
                                      </div>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* Zone des messages */}
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                              {/* Barre d'actions pour les messages sélectionnés */}
                              {showMessageActions && (
                                <div className="sticky top-0 z-10 bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
                                  <div className="space-y-3">
                                    {/* En-tête avec compteur et désélection */}
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700">
                                        {selectedMessageIds.length} message(s) sélectionné(s)
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={deselectAllMessages}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                      >
                                        Désélectionner tout
                                      </Button>
                                    </div>
                                    
                                    {/* Actions disposées verticalement */}
                                    <div className="space-y-2">
                                      {/* Première ligne - Actions de statut */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={markMessagesAsRead}
                                          className="text-xs h-8 justify-start"
                                        >
                                          <Check className="w-3 h-3 mr-2" />
                                          Marquer comme lu
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={markMessagesAsUnread}
                                          className="text-xs h-8 justify-start"
                                        >
                                          <X className="w-3 h-3 mr-2" />
                                          Marquer comme non lu
                                        </Button>
                                      </div>

                                      {/* Deuxième ligne - Actions de priorité */}
                                      <div className="grid grid-cols-3 gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={markMessagesAsImportant}
                                          className="text-xs h-8 justify-start border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                          <Star className="w-3 h-3 mr-2" />
                                          Important
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={markMessagesAsUrgent}
                                          className="text-xs h-8 justify-start border-red-200 hover:bg-red-50 hover:text-red-700"
                                        >
                                          <AlertCircle className="w-3 h-3 mr-2" />
                                          Urgent
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={markMessagesToResolve}
                                          className="text-xs h-8 justify-start border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                        >
                                          <Settings className="w-3 h-3 mr-2" />
                                          À régler
                                        </Button>
                                      </div>

                                      {/* Troisième ligne - Actions de gestion */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={archiveSelectedMessages}
                                          className="text-xs h-8 justify-start"
                                        >
                                          <Archive className="w-3 h-3 mr-2" />
                                          Archiver
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => transferMessages(selectedChatSeller || '')}
                                          className="text-xs h-8 justify-start"
                                        >
                                          <Send className="w-3 h-3 mr-2" />
                                          Transférer
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* Bouton de suppression */}
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={deleteSelectedMessages}
                                      className="text-xs h-8 w-full"
                                    >
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      Supprimer les messages sélectionnés
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              <div className="space-y-4">
                                {/* Bouton de sélection globale */}
                                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={selectAllMessages}
                                    className="text-xs text-gray-600 hover:text-gray-800"
                                  >
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Sélectionner tout
                                  </Button>
                                  {selectedMessageIds.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {selectedMessageIds.length} sur {chatMessages.length} sélectionné(s)
                                    </span>
                                  )}
                                </div>
                                
                                {/* Message du vendeur */}
                                <div className="flex items-start space-x-3">
                                  <Avatar className="w-8 h-8 border border-gray-200">
                                    <AvatarImage src={mockSellers.find(s => s.name === selectedChatSeller)?.avatar} alt={selectedChatSeller} />
                                    <AvatarFallback className="bg-white text-gray-700 text-xs">
                                      {selectedChatSeller.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="max-w-xs">
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                      <p className="text-sm text-gray-800">
                                        {mockSellers.find(s => s.name === selectedChatSeller)?.lastMessage}
                                      </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">10:30</p>
                                  </div>
                                </div>

                                {/* Indicateur de frappe */}
                                {isTyping && (
                                  <div className="flex items-start space-x-3">
                                    <Avatar className="w-8 h-8 border border-gray-200">
                                      <AvatarImage src={mockSellers.find(s => s.name === selectedChatSeller)?.avatar} alt={selectedChatSeller} />
                                      <AvatarFallback className="bg-white text-gray-700 text-xs">
                                        {selectedChatSeller?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                      <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Messages dynamiques du chat */}
                                {chatMessages.map((message) => (
                                  <div
                                    key={message.id}
                                    className={`flex items-start space-x-3 ${
                                      message.sender === 'user' ? 'justify-end' : ''
                                    }`}
                                  >
                                    {/* Crochet de sélection */}
                                    <div className="flex items-center pt-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedMessageIds.includes(message.id)}
                                        onChange={() => toggleMessageSelection(message.id)}
                                        className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                                      />
                                    </div>
                                    {message.sender === 'seller' && (
                                      <Avatar className="w-8 h-8 border border-gray-200">
                                        <AvatarImage src={mockSellers.find(s => s.name === selectedChatSeller)?.avatar} alt={selectedChatSeller} />
                                        <AvatarFallback className="bg-white text-gray-700 text-xs">
                                          {selectedChatSeller?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    
                                    <div className={`max-w-xs ${
                                      message.sender === 'user' ? 'order-2' : ''
                                    }`}>
                                                                             {message.type === 'product' ? (
                                         /* Message produit */
                                         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 max-w-xs">
                                           <div className="flex items-center space-x-3 mb-2">
                                             <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                               <span className="text-gray-500 text-xs">{message.product?.name?.charAt(0)}</span>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                               <h4 className="font-medium text-gray-900 text-sm truncate">
                                                 {message.product?.name}
                                               </h4>
                                               <div className="space-y-1">
                                                 <p className="text-sm font-semibold text-orange-600">
                                                   {formatCurrency(message.product?.currentPrice || message.product?.price)}
                                                 </p>
                                                 {/* Prix en points */}
                                                 <div className="flex items-center space-x-1">
                                                   <Coins className="w-3 h-3 text-yellow-500" />
                                                   <span className="text-xs text-gray-600">
                                                     {Math.round((message.product?.currentPrice || message.product?.price) * 10)} pts
                                                   </span>
                                                 </div>
                                               </div>
                                             </div>
                                           </div>
                                           <p className="text-sm text-gray-600 mb-3">
                                             {message.content}
                                           </p>
                                           
                                           {/* Actions du produit */}
                                           <div className="flex items-center justify-between">
                                             {message.product?.isPromoted && (
                                               <Badge className="bg-red-100 text-red-700 text-xs">
                                                 -{message.product.discount}% Promo
                                               </Badge>
                                             )}
                                             <Button 
                                               size="sm" 
                                               className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-3"
                                               onClick={() => addToCart(message.product)}
                                             >
                                               <ShoppingCart className="w-3 h-3 mr-1" />
                                               Acheter
                                             </Button>
                                           </div>
                                           
                                           {/* Badges de statut du message produit */}
                                           {messageStatuses[message.id] && (
                                             <div className="flex flex-wrap gap-1 mt-2">
                                               {messageStatuses[message.id].isRead && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-green-100 text-green-700 border-green-200">
                                                   <Check className="w-3 h-3 mr-1" />
                                                   Lu
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isImportant && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-blue-100 text-blue-700 border-blue-200">
                                                   <Star className="w-3 h-3 mr-1" />
                                                   Important
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isUrgent && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-red-100 text-red-700 border-red-200">
                                                   <AlertCircle className="w-3 h-3 mr-1" />
                                                   Urgent
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isToResolve && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-orange-100 text-orange-700 border-orange-200">
                                                   <Settings className="w-3 h-3 mr-1" />
                                                   À régler
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isArchived && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-gray-100 text-gray-700 border-gray-200">
                                                   <Archive className="w-3 h-3 mr-1" />
                                                   Archivé
                                                 </Badge>
                                               )}
                                             </div>
                                           )}
                                           
                                           {/* Indicateur de statut du message produit */}
                                           <div className="flex items-center justify-between mt-2">
                                             <p className="text-xs text-gray-500">
                                               {message.timestamp}
                                             </p>
                                             <MessageStatusIndicator 
                                               status={messageDeliveryStatus[message.id]?.status || 'sent'}
                                               messageId={message.id}
                                               isUserMessage={message.sender === 'user'}
                                             />
                                           </div>
                                         </div>
                                       ) : message.type === 'image' ? (
                                         /* Message image */
                                         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 max-w-xs">
                                           <div className="space-y-2">
                                             <img 
                                               src={message.imageUrl} 
                                               alt={message.fileName || 'Image'} 
                                               className="w-full h-32 object-cover rounded-lg"
                                             />
                                             <div className="flex items-center justify-between text-xs text-gray-500">
                                               <span className="truncate">{message.fileName}</span>
                                               <span>{Math.round((message.fileSize || 0) / 1024)} KB</span>
                                             </div>
                                           </div>
                                           
                                           {/* Badges de statut du message image */}
                                           {messageStatuses[message.id] && (
                                             <div className="flex flex-wrap gap-1 mt-2">
                                               {messageStatuses[message.id].isRead && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-green-100 text-green-700 border-green-200">
                                                   <Check className="w-3 h-3 mr-1" />
                                                   Lu
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isImportant && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-blue-100 text-blue-700 border-blue-200">
                                                   <Star className="w-3 h-3 mr-1" />
                                                   Important
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isUrgent && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-red-100 text-red-700 border-red-200">
                                                   <AlertCircle className="w-3 h-3 mr-1" />
                                                   Urgent
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isToResolve && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-orange-100 text-orange-700 border-orange-200">
                                                   <Settings className="w-3 h-3 mr-1" />
                                                   À régler
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isArchived && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-gray-100 text-gray-700 border-gray-200">
                                                   <Archive className="w-3 h-3 mr-1" />
                                                   Archivé
                                                 </Badge>
                                               )}
                                             </div>
                                           )}
                                           
                                           {/* Indicateur de statut du message image */}
                                           <div className="flex items-center justify-end mt-2">
                                             <MessageStatusIndicator 
                                               status={messageDeliveryStatus[message.id]?.status || 'sent'}
                                               messageId={message.id}
                                               isUserMessage={message.sender === 'user'}
                                             />
                                           </div>
                                         </div>
                                       ) : message.type === 'document' ? (
                                         /* Message document */
                                         <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 max-w-xs">
                                           <div className="flex items-center space-x-3">
                                             <div className="p-3 bg-blue-100 rounded-lg">
                                               <FileText className="w-6 h-6 text-blue-600" />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                               <h4 className="font-medium text-gray-900 text-sm truncate">
                                                 {message.fileName}
                                               </h4>
                                               <p className="text-xs text-gray-500">
                                                 {Math.round((message.fileSize || 0) / 1024)} KB
                                               </p>
                                               <p className="text-xs text-gray-400">
                                                 {message.fileType}
                                               </p>
                                             </div>
                                           </div>
                                           
                                           {/* Badges de statut du message document */}
                                           {messageStatuses[message.id] && (
                                             <div className="flex flex-wrap gap-1 mt-2">
                                               {messageStatuses[message.id].isRead && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-green-100 text-green-700 border-green-200">
                                                   <Check className="w-3 h-3 mr-1" />
                                                   Lu
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isImportant && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-blue-100 text-blue-700 border-blue-200">
                                                   <Star className="w-3 h-3 mr-1" />
                                                   Important
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isUrgent && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-red-100 text-red-700 border-red-200">
                                                   <AlertCircle className="w-3 h-3 mr-1" />
                                                   Urgent
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isToResolve && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-orange-100 text-orange-700 border-orange-200">
                                                   <Settings className="w-3 h-3 mr-1" />
                                                   À régler
                                                 </Badge>
                                               )}
                                               {messageStatuses[message.id].isArchived && (
                                                 <Badge variant="secondary" className="text-xs h-5 px-2 bg-gray-100 text-gray-700 border-gray-200">
                                                   <Archive className="w-3 h-3 mr-1" />
                                                   Archivé
                                                 </Badge>
                                               )}
                                             </div>
                                           )}
                                           
                                           {/* Indicateur de statut du message document */}
                                           <div className="flex items-center justify-end mt-2">
                                             <MessageStatusIndicator 
                                               status={messageDeliveryStatus[message.id]?.status || 'sent'}
                                               messageId={message.id}
                                               isUserMessage={message.sender === 'user'}
                                             />
                                           </div>
                                         </div>
                                       ) : (
                                        /* Message texte normal */
                                        <div className={`p-3 rounded-lg shadow-sm ${
                                          message.sender === 'user' 
                                            ? 'bg-orange-600 text-white' 
                                            : 'bg-white border border-gray-200'
                                        }`}>
                                          <p className={`text-sm ${
                                            message.sender === 'user' ? 'text-white' : 'text-gray-800'
                                          }`}>
                                            {message.content}
                                          </p>
                                          
                                          {/* Badges de statut du message */}
                                          {messageStatuses[message.id] && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                              {messageStatuses[message.id].isRead && (
                                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-green-100 text-green-700 border-green-200">
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Lu
                                                </Badge>
                                              )}
                                              {messageStatuses[message.id].isImportant && (
                                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-blue-100 text-blue-700 border-blue-200">
                                                  <Star className="w-3 h-3 mr-1" />
                                                  Important
                                                </Badge>
                                              )}
                                              {messageStatuses[message.id].isUrgent && (
                                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-red-100 text-red-700 border-red-200">
                                                  <AlertCircle className="w-3 h-3 mr-1" />
                                                  Urgent
                                                </Badge>
                                              )}
                                              {messageStatuses[message.id].isToResolve && (
                                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-orange-100 text-orange-700 border-orange-200">
                                                  <Settings className="w-3 h-3 mr-1" />
                                                  À régler
                                                </Badge>
                                              )}
                                              {messageStatuses[message.id].isArchived && (
                                                <Badge variant="secondary" className="text-xs h-5 px-2 bg-gray-100 text-gray-700 border-gray-200">
                                                  <Archive className="w-3 h-3 mr-1" />
                                                  Archivé
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <div className={`flex items-center justify-between mt-1 ${
                                        message.sender === 'user' ? 'flex-row-reverse' : ''
                                      }`}>
                                        <p className={`text-xs text-gray-500 ${
                                          message.sender === 'user' ? 'text-right' : ''
                                        }`}>
                                          {message.timestamp}
                                        </p>
                                        <MessageStatusIndicator 
                                          status={messageDeliveryStatus[message.id]?.status || 'sent'}
                                          messageId={message.id}
                                          isUserMessage={message.sender === 'user'}
                                        />
                                      </div>
                                    </div>

                                    {message.sender === 'user' && (
                                      <Avatar className="w-8 h-8 border border-gray-200">
                                        <AvatarImage src="/placeholder.jpg" alt="Moi" />
                                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                                          M
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Input de fichier caché */}
                            <input
                              ref={fileInputRef}
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
                            />
                            
                            {/* Zone de saisie */}
                            <div className="p-4 border-t border-gray-200 bg-white">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`transition-all duration-200 ${
                                      showAttachmentMenu 
                                        ? 'text-orange-600 bg-orange-50' 
                                        : 'text-gray-600 hover:text-orange-600'
                                    }`}
                                    onClick={() => {
                                      console.log('Toggle attachment menu:', !showAttachmentMenu)
                                      setShowAttachmentMenu(!showAttachmentMenu)
                                    }}
                                  >
                                    <Paperclip className="w-4 h-4" />
                                    {/* Indicateur visuel quand le menu est ouvert */}
                                    {showAttachmentMenu && (
                                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                                    )}
                                  </Button>
                                  
                                  {/* Menu d'attachement */}
                                  {showAttachmentMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-3 min-w-[200px] max-h-[400px] overflow-y-auto z-[9999] attachment-menu">
                                      <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-gray-700 mb-3 px-1">Ajouter une pièce jointe</h4>
                                        
                                        {/* Document */}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="w-full justify-start text-sm p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 group transition-all duration-200"
                                          onClick={() => triggerFileSelect('document')}
                                        >
                                          <div className="flex flex-col items-start space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                              </div>
                                              <div className="font-medium">Document</div>
                                            </div>
                                            <div className="text-xs text-gray-500 group-hover:text-blue-600 ml-12">PDF, DOC, TXT</div>
                                          </div>
                                        </Button>
                                        
                                        {/* Image */}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="w-full justify-start text-sm p-3 rounded-lg hover:bg-green-50 hover:text-green-700 group transition-all duration-200"
                                          onClick={() => triggerFileSelect('image')}
                                        >
                                          <div className="flex flex-col items-start space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                                                <Camera className="w-4 h-4 text-green-600" />
                                              </div>
                                              <div className="font-medium">Image</div>
                                            </div>
                                            <div className="text-xs text-gray-500 group-hover:text-green-600 ml-12">JPG, PNG, GIF</div>
                                          </div>
                                        </Button>
                                        
                                        {/* Vidéo */}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="w-full justify-start text-sm p-3 rounded-lg hover:bg-purple-50 hover:text-purple-700 group transition-all duration-200"
                                          onClick={() => {
                                            toast({
                                              title: "Sélectionner une vidéo",
                                              description: "Fonctionnalité de téléchargement de vidéos",
                                              variant: "default",
                                            })
                                            setShowAttachmentMenu(false)
                                          }}
                                        >
                                          <div className="flex flex-col items-start space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                                                <Video className="w-4 h-4 text-purple-600" />
                                              </div>
                                              <div className="font-medium">Vidéo</div>
                                            </div>
                                            <div className="text-xs text-gray-500 group-hover:text-purple-600 ml-12">MP4, AVI, MOV</div>
                                          </div>
                                        </Button>
                                        
                                        {/* Audio */}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="w-full justify-start text-sm p-3 rounded-lg hover:bg-orange-50 hover:text-orange-700 group transition-all duration-200"
                                          onClick={() => {
                                            toast({
                                              title: "Sélectionner un audio",
                                              description: "Fonctionnalité de téléchargement de fichiers audio",
                                              variant: "default",
                                            })
                                            setShowAttachmentMenu(false)
                                          }}
                                        >
                                          <div className="flex flex-col items-start space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                                                <Mic className="w-4 h-4 text-orange-600" />
                                              </div>
                                              <div className="font-medium">Audio</div>
                                            </div>
                                            <div className="text-xs text-gray-500 group-hover:text-orange-600 ml-12">MP3, WAV, AAC</div>
                                          </div>
                                        </Button>
                                        
                                        {/* Emplacement */}
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="w-full justify-start text-sm p-3 rounded-lg hover:bg-red-50 hover:text-red-700 group transition-all duration-200"
                                          onClick={() => {
                                            toast({
                                              title: "Partager la localisation",
                                              description: "Fonctionnalité de partage de localisation",
                                              variant: "default",
                                            })
                                            setShowAttachmentMenu(false)
                                          }}
                                        >
                                          <div className="flex flex-col items-start space-y-1">
                                            <div className="flex items-center space-x-2">
                                              <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                                                <MapPin className="w-4 h-4 text-red-600" />
                                              </div>
                                              <div className="font-medium">Localisation</div>
                                            </div>
                                            <div className="text-xs text-gray-500 group-hover:text-red-600 ml-12">Position GPS</div>
                                          </div>
                                        </Button>
                                      </div>
                                      
                                      {/* Flèche pointant vers le bouton */}
                                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                                    </div>
                                  )}
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-600 hover:text-orange-600 relative"
                                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                  <Smile className="w-4 h-4" />
                                  {/* Sélecteur d'emoji */}
                                  {showEmojiPicker && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[400px] max-h-[500px] overflow-y-auto emoji-picker">
                                      <div className="space-y-3">
                                        {/* Visages et émotions */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Visages</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Gestes et corps */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Gestes</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Cœurs et symboles */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Symboles</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '💎', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '💠', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Nature et objets */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Nature</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌸', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌻', '🌼', '🌽', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌸', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌸', '💐', '🌷', '🌹', '🥀', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Nourriture et boissons */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Nourriture</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Activités et sports */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Activités</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏊', '🏊‍♂️', '🏊‍♀️', '🚣', '🏄', '🏄‍♂️', '🏄‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🏃', '🏃‍♂️', '🏃‍♀️', '🚶', '🚶‍♂️', '🚶‍♀️', '🧍', '🧍‍♂️', '🧍‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Voyage et transport */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Voyage</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴️', '🚲', '🛵', '🏍️', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🛰️', '🚀', '🛸'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                        
                                        {/* Objets et gadgets */}
                                        <div>
                                          <h4 className="text-xs font-medium text-gray-500 mb-2 px-1">Objets</h4>
                                          <div className="grid grid-cols-8 gap-1">
                                            {['💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '🕹️', '🎮', '🎲', '🧩', '🎭', '🖼️', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🪕', '🪘', '🎸', '🎷', '🎺', '🎻', '🪗', '🥁', '🎤', '🎧', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🎮', '🎲', '🧩', '🎭', '🖼️', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🪕', '🪘', '🎸', '🎷', '🎺', '🎻', '🪗', '🥁', '🎤', '🎧', '📱', '📲'].map((emoji, index) => (
                                              <Button
                                                key={index}
                                                variant="ghost"
                                                size="sm"
                                                className="w-8 h-8 p-0 text-lg hover:bg-gray-100"
                                                onClick={() => {
                                                  setChatInput(prev => prev + emoji)
                                                  setShowEmojiPicker(false)
                                                }}
                                              >
                                                {emoji}
                                              </Button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                      {/* Flèche pointant vers le bouton */}
                                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
                                    </div>
                                  )}
                                </Button>
                                <div className="flex-1">
                                  <Input
                                    placeholder="Tapez votre message..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    className="border-gray-200 focus:border-orange-300 focus:ring-orange-200"
                                  />
                                </div>
                                <Button 
                                  size="sm" 
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                  onClick={sendMessage}
                                  disabled={!chatInput.trim()}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* État vide - Aucune conversation sélectionnée */
                          <div className="flex-1 flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
                              <p className="text-gray-500">Choisissez un vendeur pour commencer à discuter</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Modal de la Boutique */}
            <Dialog open={showShopModal} onOpenChange={setShowShopModal}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-3">
                    <ShoppingBag className="w-6 h-6 text-orange-600" />
                    <span>Boutique de {selectedShopSeller}</span>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {mockShopProducts.filter(p => p.seller === selectedShopSeller && p.isPromoted).length} promotions
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    Découvrez tous les produits et promotions disponibles
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Filtres et recherche */}
                  <div className="mb-6 space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Rechercher des produits..."
                          className="max-w-md"
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          <SelectItem value="smartphones">Smartphones</SelectItem>
                          <SelectItem value="ordinateurs">Ordinateurs</SelectItem>
                          <SelectItem value="tablettes">Tablettes</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Tri" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les produits</SelectItem>
                          <SelectItem value="promotions">Promotions uniquement</SelectItem>
                          <SelectItem value="price-asc">Prix croissant</SelectItem>
                          <SelectItem value="price-desc">Prix décroissant</SelectItem>
                          <SelectItem value="rating">Meilleures notes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Grille des produits */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {mockShopProducts
                      .filter(product => product.seller === selectedShopSeller)
                      .map((product) => (
                        <Card key={product.id} className="group hover:shadow-md transition-all duration-200 border-l-2 border-l-orange-500">
                          <CardHeader className="p-3 pb-2">
                            <div className="relative">
                              <div className="aspect-square bg-gray-100 rounded-md overflow-hidden mb-2">
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                  <span className="text-gray-500 text-xs">{product.name}</span>
                                </div>
                                {product.isPromoted && (
                                  <div className="absolute top-1 left-1">
                                    <Badge className="bg-red-500 text-white text-xs px-1 py-0.5 h-5">
                                      -{product.discount}%
                                    </Badge>
                                  </div>
                                )}
                                {product.stock < 5 && (
                                  <div className="absolute top-1 right-1">
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs px-1 py-0.5 h-5">
                                      {product.stock}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-0">
                            <div className="space-y-2">
                              {/* Nom du produit */}
                              <h3 className="font-medium text-gray-900 text-sm group-hover:text-orange-600 transition-colors line-clamp-1">
                                {product.name}
                              </h3>
                              
                              {/* Prix et promotion */}
                              <div className="space-y-1">
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm font-bold text-orange-600">
                                    {formatCurrency(product.currentPrice)}
                                  </span>
                                  {product.isPromoted && (
                                    <span className="text-xs text-gray-500 line-through">
                                      {formatCurrency(product.originalPrice)}
                                    </span>
                                  )}
                                </div>
                                {/* Prix en points */}
                                <div className="flex items-center space-x-1">
                                  <Coins className="w-3 h-3 text-yellow-500" />
                                  <span className="text-xs text-gray-600">
                                    {Math.round(product.currentPrice * 10)} pts
                                  </span>
                                </div>
                              </div>

                              {/* Note et stock */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-gray-700">{product.rating}</span>
                                </div>
                                <span className={`font-medium ${
                                  product.stock > 10 ? 'text-green-600' : 
                                  product.stock > 5 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                  {product.stock > 0 ? `${product.stock}` : '0'}
                                </span>
                              </div>

                              {/* Bouton d'action */}
                              <Button 
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs h-8"
                                onClick={() => addProductToChat(product)}
                              >
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {/* Message si aucun produit */}
                  {mockShopProducts.filter(p => p.seller === selectedShopSeller).length === 0 && (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit disponible</h3>
                      <p className="text-gray-500">Ce vendeur n'a pas encore de produits en boutique</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            

            {/* Modal du Panier du Header */}
            <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderCart />
              </DialogContent>
            </Dialog>

            {/* Modal d'appel vocal */}
            <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span>Appel en cours...</span>
                  </DialogTitle>
                  <DialogDescription>
                    Connexion avec {selectedChatSeller}
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedChatSeller}</h3>
                  <p className="text-gray-600">Appel en cours...</p>
                  <div className="mt-6 space-y-3">
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => setShowCallModal(false)}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Raccrocher
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Modal d'appel vidéo */}
            <Dialog open={showVideoCallModal} onOpenChange={setShowVideoCallModal}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    <span>Appel vidéo en cours...</span>
                  </DialogTitle>
                  <DialogDescription>
                    Connexion vidéo avec {selectedChatSeller}
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center py-6">
                  <div className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Video className="w-16 h-16 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedChatSeller}</h3>
                  <p className="text-gray-600">Appel vidéo en cours...</p>
                  <div className="mt-6 space-y-3">
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => setShowVideoCallModal(false)}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Terminer l'appel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {activeTab === 'shares' && (
              <div className="space-y-6">
                {/* Statistiques des partages */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Total Partages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">{mockStats.totalShares}</div>
                        <Share2 className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">+12 cette semaine</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Points Gagnés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">2,480</div>
                        <Gift className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">+320 ce mois</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Taux de Conversion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">68%</div>
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">+5% vs mois dernier</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Valeur Estimée</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">{formatCurrency(24800)}</div>
                <div className="text-sm text-[#ff6600] font-medium">{Math.round(24800 / 10)} points</div>
                        <Wallet className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">En points convertis</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique des réseaux sociaux */}
                <SharesDistributionChart 
                  title="Performance par Réseau Social"
                  description="Répartition de vos partages et gains par plateforme"
                />

                {/* Liste des produits partagés */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Produits Partagés</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Générer et télécharger le rapport de partage
                          generateAndDownloadSharesReport()
                        }}
                        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </CardTitle>
                    <CardDescription>Historique détaillé de vos partages et gains</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockSharedProducts.map((product) => (
                        <Card key={product.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <img
                                  src={product.productImage}
                                  alt={product.productName}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                                <div>
                                  <h3 className="font-medium">{product.productName}</h3>
                                  <p className="text-sm text-gray-600">Partagé le {formatDate(product.sharedAt)}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Facebook:</span>
                                      <Badge variant="outline" className="text-xs">{product.shares.facebook}</Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">WhatsApp:</span>
                                      <Badge variant="outline" className="text-xs">{product.shares.whatsapp}</Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Twitter:</span>
                                      <Badge variant="outline" className="text-xs">{product.shares.twitter}</Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">Instagram:</span>
                                      <Badge variant="outline" className="text-xs">{product.shares.instagram}</Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm text-gray-600">Total partages</p>
                                    <p className="text-lg font-bold text-purple-600">{product.totalShares}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Points gagnés</p>
                                    <p className="text-lg font-bold text-green-600">+{product.pointsEarned}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedProductForDetails(product)
                                        setShowProductDetailsModal(true)
                                      }}
                                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Détails
                                    </Button>
                                    <div className="relative">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setOpenProductShareMenu(openProductShareMenu === product.id ? null : product.id)}
                                      >
                                        <Share2 className="w-4 h-4 mr-1" />
                                        Partager
                                      </Button>
                                      
                                      {/* Menu de partage moderne pour les produits */}
                                      {openProductShareMenu === product.id && (
                                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                          <div className="p-3 border-b border-gray-100">
                                            <h4 className="text-sm font-medium text-gray-900">Partager ce produit</h4>
                                          </div>
                                          <div className="p-2 space-y-1">
                                            {/* Facebook */}
                                            <button
                                              onClick={() => {
                                                const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/products/' + product.productId)}&quote=${encodeURIComponent(`Découvrez ${product.productName} sur Pro Booster`)}`
                                                window.open(url, '_blank', 'width=600,height=400')
                                                setOpenProductShareMenu(null)
                                                toast({
                                                  title: "Partage Facebook",
                                                  description: "Ouverture de Facebook...",
                                                  variant: "default",
                                                })
                                              }}
                                              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                                            >
                                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                                </svg>
                                              </div>
                                              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Facebook</span>
                                            </button>

                                            {/* WhatsApp */}
                                            <button
                                              onClick={() => {
                                                const url = `https://wa.me/?text=${encodeURIComponent(`Découvrez ${product.productName} sur Pro Booster - ${window.location.origin}/products/${product.productId}`)}`
                                                window.open(url, '_blank')
                                                setOpenProductShareMenu(null)
                                                toast({
                                                  title: "Partage WhatsApp",
                                                  description: "Ouverture de WhatsApp...",
                                                  variant: "default",
                                                })
                                              }}
                                              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                                            >
                                              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                                </svg>
                                              </div>
                                              <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">WhatsApp</span>
                                            </button>

                                            {/* Twitter/X */}
                                            <button
                                              onClick={() => {
                                                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez ${product.productName} sur Pro Booster`)}&url=${encodeURIComponent(window.location.origin + '/products/' + product.productId)}`
                                                window.open(url, '_blank', 'width=600,height=400')
                                                setOpenProductShareMenu(null)
                                                toast({
                                                  title: "Partage Twitter/X",
                                                  description: "Ouverture de Twitter...",
                                                  variant: "default",
                                                })
                                              }}
                                              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-black transition-colors group"
                                            >
                                              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                                </svg>
                                              </div>
                                              <span className="text-sm font-medium text-gray-700 group-hover:text-black">Twitter/X</span>
                                            </button>

                                            {/* Telegram */}
                                            <button
                                              onClick={() => {
                                                const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/products/' + product.productId)}&text=${encodeURIComponent(`Découvrez ${product.productName} sur Pro Booster`)}`
                                                window.open(url, '_blank')
                                                setOpenProductShareMenu(null)
                                                toast({
                                                  title: "Partage Telegram",
                                                  description: "Ouverture de Telegram...",
                                                  variant: "default",
                                                })
                                              }}
                                              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                                            >
                                              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.125-1.63z"/>
                                                </svg>
                                              </div>
                                              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Telegram</span>
                                            </button>

                                            {/* Copier le lien */}
                                            <button
                                              onClick={() => {
                                                navigator.clipboard.writeText(window.location.origin + '/products/' + product.productId)
                                                setOpenProductShareMenu(null)
                                                toast({
                                                  title: "Lien copié !",
                                                  description: "Le lien du produit a été copié",
                                                  variant: "default",
                                                })
                                              }}
                                              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                                            >
                                              <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                                                <Copy className="w-5 h-5 text-white" />
                                              </div>
                                              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-600">Copier le lien</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'points' && (
              <div className="space-y-6">
                {/* Solde principal des points */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-green-800">Solde des Points</span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowWithdrawalModal(true)}
                          className="border-green-300 text-green-700 hover:bg-green-200"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Retirer
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowTransferModal(true)}
                          className="border-green-300 text-green-700 hover:bg-green-200"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Transférer
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-6xl font-bold text-green-900 mb-2">{userPoints.toLocaleString()}</div>
                      <div className="text-xl text-green-700 mb-4">Points disponibles</div>
                      <div className="text-lg text-green-600 mb-6">
                Valeur: {formatCurrency(userPoints * 10)} • {userPoints} points
              </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-bold text-green-600">15,420</div>
                          <div className="text-sm text-gray-600">Points gagnés</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-bold text-orange-600">8,200</div>
                          <div className="text-sm text-gray-600">Points utilisés</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">2,400</div>
                          <div className="text-sm text-gray-600">Points retirés</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistiques détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Taux de Conversion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">1:10</div>
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">1 point = 10 F CFA</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Seuil de Retrait</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">5,000</div>
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Points minimum</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Frais de Retrait</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">2%</div>
                        <Percent className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">Par transaction</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-red-700">Points Expirés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-red-900">0</div>
                        <Clock className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="text-xs text-red-600 mt-2">Cette année</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Historique des transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Historique des Transactions</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('Bouton Exporter CSV cliqué !')
                          // Générer et télécharger l'historique des transactions en CSV
                          generateAndDownloadTransactionsCSV()
                        }}
                        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter CSV
                      </Button>
                    </CardTitle>
                    <CardDescription>Détail de toutes vos opérations de points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          id: '1',
                          type: 'earned',
                          amount: 200,
                          description: 'Partage Facebook - iPhone 15 Pro Max',
                          date: '2024-01-15T10:30:00Z',
                          balance: 15420
                        },
                        {
                          id: '2',
                          type: 'used',
                          amount: -500,
                          description: 'Achat - Commande ORD-001',
                          date: '2024-01-15T09:15:00Z',
                          balance: 15220
                        },
                        {
                          id: '3',
                          type: 'earned',
                          amount: 150,
                          description: 'Partage WhatsApp - MacBook Air M2',
                          date: '2024-01-14T16:45:00Z',
                          balance: 15720
                        },
                        {
                          id: '4',
                          type: 'withdrawn',
                          amount: -2000,
                          description: 'Retrait vers compte bancaire',
                          date: '2024-01-10T14:20:00Z',
                          balance: 15570
                        },
                        {
                          id: '5',
                          type: 'earned',
                          amount: 300,
                          description: 'Partage Twitter - Samsung Galaxy S24',
                          date: '2024-01-08T11:30:00Z',
                          balance: 17570
                        }
                      ].map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'earned' ? 'bg-green-100' :
                              transaction.type === 'used' ? 'bg-orange-100' :
                              'bg-blue-100'
                            }`}>
                              {transaction.type === 'earned' ? (
                                <Plus className="w-5 h-5 text-green-600" />
                              ) : transaction.type === 'used' ? (
                                <Minus className="w-5 h-5 text-orange-600" />
                              ) : (
                                <Download className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount} pts
                            </p>
                            <p className="text-sm text-gray-500">Solde: {transaction.balance.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Options d'achat et transfert */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                        <span>Acheter des Points</span>
                      </CardTitle>
                      <CardDescription>Augmentez votre solde en achetant des points</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { points: 1000, price: 8000, bonus: 0 },
                          { points: 2500, price: 18000, bonus: 200 },
                          { points: 5000, price: 35000, bonus: 500 },
                          { points: 10000, price: 65000, bonus: 1200 }
                        ].map((offer, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{offer.points.toLocaleString()} points</span>
                                {offer.bonus > 0 && (
                                  <Badge className="bg-green-100 text-green-800">
                                    +{offer.bonus} bonus
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{formatCurrency(offer.price)}</p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                console.log('Bouton Acheter cliqué pour:', offer.points, 'points')
                                // Ouvrir la modal d'achat de points
                                setSelectedPointsOffer(offer)
                                setShowPointsPurchaseModal(true)
                                toast({
                                  title: "Offre sélectionnée !",
                                  description: `${offer.points.toLocaleString()} points pour ${formatCurrency(offer.price)}`,
                                  variant: "default",
                                })
                              }}
                              className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                            >
                              Acheter
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>Transférer des Points</span>
                      </CardTitle>
                      <CardDescription>Envoyez des points à d'autres utilisateurs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-medium text-purple-800 mb-2">Transfert sécurisé</h4>
                          <p className="text-sm text-purple-600 mb-4">
                            Transférez vos points vers d'autres utilisateurs en toute sécurité.
                          </p>
                          <div className="space-y-2 text-sm text-purple-700">
                            <div className="flex items-center space-x-2">
                              <Check className="w-4 h-4" />
                              <span>Frais de transfert: 1%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Check className="w-4 h-4" />
                              <span>Minimum: 100 points</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Check className="w-4 h-4" />
                              <span>Maximum: 10,000 points/jour</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          onClick={() => setShowTransferModal(true)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Transférer des Points
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique d'évolution des points */}
                <PointsEvolutionChart 
                  title="Évolution Détaillée des Points"
                  description="Analyse complète de vos gains et utilisations de points"
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Informations personnelles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Informations Personnelles</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Ouvrir la modal d'édition du profil
                          setShowProfileEdit(true)
                          toast({
                            title: "Édition du profil",
                            description: "Vous pouvez maintenant modifier vos informations",
                            variant: "default",
                          })
                        }}
                        className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                    </CardTitle>
                    <CardDescription>Vos informations de base et coordonnées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <Avatar className="w-24 h-24">
                          <AvatarImage src="/placeholder.jpg" />
                          <AvatarFallback className="text-2xl">JD</AvatarFallback>
                        </Avatar>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                          onClick={() => {
                            // Ouvrir la modal de changement d'avatar
                            setShowAvatarUpload(true)
                            toast({
                              title: "Changement d'avatar",
                              description: "Vous pouvez maintenant changer votre photo de profil",
                              variant: "default",
                            })
                          }}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Nom complet</Label>
                            <p className="text-gray-900">John Doe</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Email</Label>
                            <p className="text-gray-900">john.doe@example.com</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                            <p className="text-gray-900">+229 91 50 57 57</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Pays</Label>
                            <p className="text-gray-900">Bénin</p>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Adresse</Label>
                            <p className="text-gray-900">123 Rue de la Paix, Abomey-Calavi, Bénin</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sécurité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span>Sécurité</span>
                    </CardTitle>
                    <CardDescription>Paramètres de sécurité de votre compte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Lock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Authentification à deux facteurs</h4>
                            <p className="text-sm text-gray-600">Protégez votre compte avec la 2FA</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {twoFactorEnabled ? 'Activée' : 'Désactivée'}
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowTwoFactorSetup(true)}
                            className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                          >
                            {twoFactorEnabled ? 'Modifier' : 'Activer'}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Appareils connectés</h4>
                            <p className="text-sm text-gray-600">Gérez vos sessions actives</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowSessionsModal(true)}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Voir (3)
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Changer le mot de passe</h4>
                            <p className="text-sm text-gray-600">Mettez à jour votre mot de passe</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowPasswordChangeModal(true)}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Modifier
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-orange-600" />
                      <span>Notifications</span>
                    </CardTitle>
                    <CardDescription>Configurez vos préférences de notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Notifications par email</h4>
                          <p className="text-sm text-gray-600">Recevez des notifications par email</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.email}
                          onCheckedChange={(checked) => {
                            setNotificationSettings(prev => ({ ...prev, email: checked }))
                            toast({
                              title: checked ? "Notifications email activées" : "Notifications email désactivées",
                              description: checked ? "Vous recevrez maintenant des notifications par email" : "Vous ne recevrez plus de notifications par email",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Notifications push</h4>
                          <p className="text-sm text-gray-600">Notifications sur votre navigateur</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.push}
                          onCheckedChange={(checked) => {
                            setNotificationSettings(prev => ({ ...prev, push: checked }))
                            toast({
                              title: checked ? "Notifications push activées" : "Notifications push désactivées",
                              description: checked ? "Vous recevrez maintenant des notifications push" : "Vous ne recevrez plus de notifications push",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Notifications SMS</h4>
                          <p className="text-sm text-gray-600">Recevez des SMS importants</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.sms}
                          onCheckedChange={(checked) => {
                            setNotificationSettings(prev => ({ ...prev, sms: checked }))
                            toast({
                              title: checked ? "Notifications SMS activées" : "Notifications SMS désactivées",
                              description: checked ? "Vous recevrez maintenant des notifications SMS" : "Vous ne recevrez plus de notifications SMS",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h4 className="font-medium">Types de notifications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Commandes</span>
                            <Switch 
                              checked={notificationSettings.orders}
                              onCheckedChange={(checked) => {
                                setNotificationSettings(prev => ({ ...prev, orders: checked }))
                                toast({
                                  title: checked ? "Notifications commandes activées" : "Notifications commandes désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de commandes" : "Vous ne recevrez plus de notifications de commandes",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Points de fidélité</span>
                            <Switch 
                              checked={notificationSettings.points}
                              onCheckedChange={(checked) => {
                                setNotificationSettings(prev => ({ ...prev, points: checked }))
                                toast({
                                  title: checked ? "Notifications points activées" : "Notifications points désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de points" : "Vous ne recevrez plus de notifications de points",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Messages chat</span>
                            <Switch 
                              checked={notificationSettings.chat}
                              onCheckedChange={(checked) => {
                                setNotificationSettings(prev => ({ ...prev, chat: checked }))
                                toast({
                                  title: checked ? "Notifications chat activées" : "Notifications chat désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de chat" : "Vous ne recevrez plus de notifications de chat",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Promotions</span>
                            <Switch 
                              checked={notificationSettings.promotions}
                              onCheckedChange={(checked) => {
                                setNotificationSettings(prev => ({ ...prev, promotions: checked }))
                                toast({
                                  title: checked ? "Notifications promotions activées" : "Notifications promotions désactivées",
                                  description: checked ? "Vous recevrez maintenant des notifications de promotions" : "Vous ne recevrez plus de notifications de promotions",
                                  variant: "default",
                                })
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Préférences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-orange-600" />
                      <span>Préférences</span>
                    </CardTitle>
                    <CardDescription>Personnalisez votre expérience</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm font-medium">Langue</Label>
                        <Select value={selectedLanguage} onValueChange={(value) => {
                          setSelectedLanguage(value)
                          toast({
                            title: "Langue modifiée !",
                            description: `Votre langue a été changée vers ${value === 'fr' ? 'Français' : value === 'en' ? 'English' : 'Español'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Devise</Label>
                        <Select value={selectedCurrency} onValueChange={(value) => {
                          setSelectedCurrency(value)
                          toast({
                            title: "Devise modifiée !",
                            description: `Votre devise a été changée vers ${value === 'xof' ? 'F CFA (XOF)' : value === 'usd' ? 'USD ($)' : 'EUR (€)'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xof">F CFA (XOF)</SelectItem>
                            <SelectItem value="usd">USD ($)</SelectItem>
                            <SelectItem value="eur">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Thème</Label>
                        <Select value={selectedTheme} onValueChange={(value) => {
                          setSelectedTheme(value)
                          toast({
                            title: "Thème modifié !",
                            description: `Votre thème a été changé vers ${value === 'light' ? 'Clair' : value === 'dark' ? 'Sombre' : 'Système'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Clair</SelectItem>
                            <SelectItem value="dark">Sombre</SelectItem>
                            <SelectItem value="system">Système</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions du compte */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-orange-600" />
                      <span>Actions du Compte</span>
                    </CardTitle>
                    <CardDescription>Actions importantes sur votre compte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <Download className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Exporter mes données</h4>
                            <p className="text-sm text-gray-600">Téléchargez toutes vos données personnelles</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowExportModal(true)}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Exporter
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">Supprimer mon compte</h4>
                            <p className="text-sm text-gray-600">Cette action est irréversible</p>
                          </div>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setShowDeleteAccountModal(true)}
                          className="hover:bg-red-600 transition-colors"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'messaging' && (
              <div className="space-y-6">
                {/* En-tête de la messagerie */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-6 h-6 text-blue-600" />
                        <span className="text-blue-800">Messagerie Interne</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowNewMessageModal(true)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Nouveau Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Export en cours !",
                              description: "Vos messages sont en cours d'exportation...",
                              variant: "default",
                            })
                            
                            // Créer le contenu CSV
                            const csvContent = [
                              ['ID', 'De', 'Sujet', 'Contenu', 'Date', 'Priorité', 'Catégorie', 'Statut', 'Lu'],
                              ...internalMessages.map(msg => [
                                msg.id,
                                msg.from === 'admin' ? 'Administration' : 'Vous',
                                msg.subject,
                                msg.content,
                                formatDate(msg.timestamp),
                                msg.priority === 'high' ? 'Haute' : msg.priority === 'medium' ? 'Moyenne' : 'Basse',
                                msg.category === 'support' ? 'Support' : 
                                msg.category === 'technical' ? 'Technique' :
                                msg.category === 'billing' ? 'Facturation' : 'Général',
                                msg.status === 'sent' ? 'Envoyé' : 
                                msg.status === 'delivered' ? 'Livré' : 'Lu',
                                msg.isRead ? 'Oui' : 'Non'
                              ])
                            ].map(row => row.join(',')).join('\n')
                            
                            // Créer et télécharger le fichier
                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                            const url = window.URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = `Messages-Internes-${new Date().toISOString().split('T')[0]}.csv`
                            link.style.visibility = 'hidden'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            window.URL.revokeObjectURL(url)
                            
                            setTimeout(() => {
                              toast({
                                title: "Export terminé !",
                                description: "Vos messages ont été exportés en CSV avec succès",
                                variant: "default",
                              })
                            }, 2000)
                          }}
                          className="border-blue-300 text-blue-700 hover:bg-blue-200"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Communiquez avec l'équipe d'administration et gérez vos messages internes
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Statistiques de la messagerie */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Messages Reçus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">{internalMessages.length}</div>
                        <Mail className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Total des messages</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Non Lus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">
                          {internalMessages.filter(msg => !msg.isRead).length}
                        </div>
                        <Bell className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Messages en attente</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Réponse Moyenne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">2.3h</div>
                        <Clock className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Temps de réponse</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Satisfaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">4.8/5</div>
                        <Star className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">Note globale</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtres et recherche */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Filtres et Recherche</span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Appliquer les filtres sélectionnés
                            const selectedCategory = document.querySelector('select[value="all"]')?.value || 'all'
                            const selectedPriority = document.querySelector('select[value="all"]:last-child')?.value || 'all'
                            
                            let filteredMessages = internalMessages
                            
                            if (selectedCategory !== 'all') {
                              filteredMessages = filteredMessages.filter(msg => msg.category === selectedCategory)
                            }
                            
                            if (selectedPriority !== 'all') {
                              filteredMessages = filteredMessages.filter(msg => msg.priority === selectedPriority)
                            }
                            
                            toast({
                              title: "Filtres appliqués !",
                              description: `${filteredMessages.length} messages trouvés avec les filtres sélectionnés`,
                              variant: "default",
                            })
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Filtrer
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Trier les messages par priorité
                            const priorityOrder = { high: 3, medium: 2, low: 1 }
                            const sortedMessages = [...internalMessages].sort((a, b) => 
                              priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
                            )
                            
                            setInternalMessages(sortedMessages)
                            
                            toast({
                              title: "Triage effectué !",
                              description: "Vos messages ont été triés par priorité (Haute → Moyenne → Basse)",
                              variant: "default",
                            })
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Trier
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>Recherchez et filtrez vos messages internes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher dans vos messages..."
                          className="pl-10"
                          onChange={(e) => {
                            const searchTerm = e.target.value.toLowerCase()
                            if (searchTerm.length > 2) {
                              // Filtrer les messages selon le terme de recherche
                              const filteredMessages = internalMessages.filter(msg => 
                                msg.subject.toLowerCase().includes(searchTerm) ||
                                msg.content.toLowerCase().includes(searchTerm) ||
                                msg.category.toLowerCase().includes(searchTerm)
                              )
                              
                              toast({
                                title: "Recherche effectuée !",
                                description: `${filteredMessages.length} messages trouvés pour "${searchTerm}"`,
                                variant: "default",
                              })
                            }
                          }}
                        />
                      </div>
                      <Select defaultValue="all" onValueChange={(value) => {
                        if (value !== 'all') {
                          toast({
                            title: "Filtre appliqué !",
                            description: `Messages filtrés par ${value}`,
                            variant: "default",
                          })
                        }
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filtrer par catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="technical">Technique</SelectItem>
                          <SelectItem value="billing">Facturation</SelectItem>
                          <SelectItem value="general">Général</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all" onValueChange={(value) => {
                        if (value !== 'all') {
                          toast({
                            title: "Triage effectué !",
                            description: `Messages triés par ${value}`,
                            variant: "default",
                          })
                        }
                      }}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Trier par priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les priorités</SelectItem>
                          <SelectItem value="high">Haute priorité</SelectItem>
                          <SelectItem value="medium">Moyenne priorité</SelectItem>
                          <SelectItem value="low">Basse priorité</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Liste des messages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Messages Internes</span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Actualisation !",
                              description: "Vos messages ont été actualisés",
                              variant: "default",
                            })
                            
                            // Simuler une actualisation
                            setTimeout(() => {
                              // Vérifier s'il y a de nouveaux messages
                              const hasNewMessages = Math.random() > 0.7
                              
                              if (hasNewMessages) {
                                const newMessage = {
                                  id: `msg-${Date.now()}`,
                                  from: 'admin',
                                  subject: 'Nouvelle notification système',
                                  content: 'Un nouveau message système a été reçu.',
                                  timestamp: new Date().toISOString(),
                                  isRead: false,
                                  priority: 'low',
                                  category: 'general',
                                  status: 'delivered'
                                }
                                
                                setInternalMessages(prev => [newMessage, ...prev])
                                
                                toast({
                                  title: "Nouveau message !",
                                  description: "Un nouveau message système a été reçu",
                                  variant: "default",
                                })
                              } else {
                                toast({
                                  title: "Actualisation terminée",
                                  description: "Aucun nouveau message pour le moment",
                                  variant: "default",
                                })
                              }
                            }, 1500)
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Actualiser
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Marquage en cours !",
                              description: "Tous les messages sont marqués comme lus",
                              variant: "default",
                            })
                            
                            // Marquer tous les messages comme lus
                            setInternalMessages(prev => 
                              prev.map(msg => ({ ...msg, isRead: true, status: 'read' }))
                            )
                            
                            setTimeout(() => {
                              toast({
                                title: "Marquage terminé !",
                                description: "Tous les messages ont été marqués comme lus",
                                variant: "default",
                              })
                            }, 1000)
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Tout marquer comme lu
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>Gérez vos conversations avec l'équipe d'administration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {internalMessages.map((message) => (
                        <Card key={message.id} className={`hover:shadow-md transition-shadow ${
                          !message.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                        }`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    message.priority === 'high' ? 'bg-red-500' :
                                    message.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}></div>
                                  <Badge variant="outline" className="text-xs">
                                    {message.category === 'support' ? 'Support' :
                                     message.category === 'technical' ? 'Technique' :
                                     message.category === 'billing' ? 'Facturation' : 'Général'}
                                  </Badge>
                                  <Badge variant={message.from === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                    {message.from === 'admin' ? 'Administration' : 'Vous'}
                                  </Badge>
                                  {!message.isRead && (
                                    <Badge className="bg-blue-500 text-white text-xs animate-pulse">
                                      Nouveau
                                    </Badge>
                                  )}
                                </div>
                                
                                <div>
                                  <h3 className="font-semibold text-lg">{message.subject}</h3>
                                  <p className="text-gray-600 mt-1">{message.content}</p>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>{formatDate(message.timestamp)}</span>
                                  <span>•</span>
                                  <span>Priorité: {
                                    message.priority === 'high' ? 'Haute' :
                                    message.priority === 'medium' ? 'Moyenne' : 'Basse'
                                  }</span>
                                  <span>•</span>
                                  <span>Statut: {
                                    message.status === 'sent' ? 'Envoyé' :
                                    message.status === 'delivered' ? 'Livré' : 'Lu'
                                  }</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Marquer le message comme lu
                                    setInternalMessages(prev => 
                                      prev.map(msg => 
                                        msg.id === message.id 
                                          ? { ...msg, isRead: true, status: 'read' }
                                          : msg
                                      )
                                    )
                                    
                                    toast({
                                      title: "Message ouvert !",
                                      description: `Ouverture du message "${message.subject}"`,
                                      variant: "default",
                                    })
                                  }}
                                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ouvrir
                                </Button>
                                
                                <div className="relative">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // Ouvrir le menu d'actions pour ce message
                                      setShowNotificationActions(prev => ({
                                        ...prev,
                                        [message.id]: !prev[message.id]
                                      }))
                                    }}
                                    className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                  
                                  {/* Menu d'actions déroulant */}
                                  {showNotificationActions[message.id] && (
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            // Répondre au message
                                            setNewMessageSubject(`Re: ${message.subject}`)
                                            setNewMessageCategory(message.category)
                                            setNewMessagePriority(message.priority)
                                            setShowNewMessageModal(true)
                                            setShowNotificationActions(prev => ({
                                              ...prev,
                                              [message.id]: false
                                            }))
                                            toast({
                                              title: "Réponse préparée !",
                                              description: "Le formulaire de réponse est ouvert",
                                              variant: "default",
                                            })
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                          <Send className="w-4 h-4" />
                                          <span>Répondre</span>
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            // Marquer comme important
                                            setInternalMessages(prev => 
                                              prev.map(msg => 
                                                msg.id === message.id 
                                                  ? { ...msg, priority: 'high' }
                                                  : msg
                                              )
                                            )
                                            setShowNotificationActions(prev => ({
                                              ...prev,
                                              [message.id]: false
                                            }))
                                            toast({
                                              title: "Message marqué !",
                                              description: "Le message a été marqué comme important",
                                              variant: "default",
                                            })
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                          <Star className="w-4 h-4" />
                                          <span>Marquer important</span>
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            // Archiver le message
                                            setInternalMessages(prev => 
                                              prev.filter(msg => msg.id !== message.id)
                                            )
                                            setShowNotificationActions(prev => ({
                                              ...prev,
                                              [message.id]: false
                                            }))
                                            toast({
                                              title: "Message archivé !",
                                              description: "Le message a été archivé",
                                              variant: "default",
                                            })
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                          <Archive className="w-4 h-4" />
                                          <span>Archiver</span>
                                        </button>
                                        
                                        <Separator />
                                        
                                        <button
                                          onClick={() => {
                                            // Copier le contenu
                                            navigator.clipboard.writeText(`${message.subject}\n\n${message.content}`)
                                            setShowNotificationActions(prev => ({
                                              ...prev,
                                              [message.id]: false
                                            }))
                                            toast({
                                              title: "Contenu copié !",
                                              description: "Le contenu du message a été copié",
                                              variant: "default",
                                            })
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                        >
                                          <Copy className="w-4 h-4" />
                                          <span>Copier le contenu</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <span>Actions Rapides</span>
                    </CardTitle>
                    <CardDescription>Accédez rapidement aux fonctionnalités de messagerie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-16 text-left"
                        onClick={() => setShowNewMessageModal(true)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Plus className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">Nouveau Message</div>
                            <div className="text-xs text-gray-500">Créer un nouveau message</div>
                          </div>
                        </div>
                      </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour le support technique
                           setNewMessageSubject("Demande de support technique")
                           setNewMessageCategory("technical")
                           setNewMessagePriority("medium")
                           setNewMessageContent("Bonjour,\n\nJ'ai besoin d'assistance technique pour le problème suivant :\n\n[Veuillez décrire votre problème en détail]\n\nMerci de votre aide.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Support technique !",
                             description: "Formulaire de support technique ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                             <Headphones className="w-5 h-5 text-green-600" />
                           </div>
                           <div>
                             <div className="font-medium">Support Technique</div>
                             <div className="text-xs text-gray-500">Demande d'assistance</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour la facturation
                           setNewMessageSubject("Question concernant la facturation")
                           setNewMessageCategory("billing")
                           setNewMessagePriority("high")
                           setNewMessageContent("Bonjour,\n\nJ'ai une question concernant ma facturation :\n\n[Veuillez décrire votre problème de facturation en détail]\n\nMerci de votre aide.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Facturation !",
                             description: "Formulaire de facturation ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                             <CreditCard className="w-5 h-5 text-purple-600" />
                           </div>
                           <div>
                             <div className="font-medium">Question Facturation</div>
                             <div className="text-xs text-gray-500">Problème de paiement</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour la suggestion
                           setNewMessageSubject("Suggestion d'amélioration")
                           setNewMessageCategory("suggestion")
                           setNewMessagePriority("low")
                           setNewMessageContent("Bonjour,\n\nJ'aimerais proposer la suggestion suivante pour améliorer la plateforme :\n\n[Veuillez décrire votre suggestion en détail]\n\nMerci de votre attention.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Suggestion !",
                             description: "Formulaire de suggestion ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                             <Lightbulb className="w-5 h-5 text-orange-600" />
                           </div>
                           <div>
                             <div className="font-medium">Suggestion</div>
                             <div className="text-xs text-gray-500">Proposer une amélioration</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Pré-remplir le formulaire pour le signalement
                           setNewMessageSubject("Signalement d'un problème")
                           setNewMessageCategory("report")
                           setNewMessagePriority("high")
                           setNewMessageContent("Bonjour,\n\nJ'aimerais signaler le problème suivant :\n\n[Veuillez décrire le problème rencontré en détail]\n\nMerci de votre intervention rapide.")
                           setShowNewMessageModal(true)
                           
                           toast({
                             title: "Signalement !",
                             description: "Formulaire de signalement ouvert et pré-rempli",
                             variant: "default",
                           })
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                             <AlertTriangle className="w-5 h-5 text-red-600" />
                           </div>
                           <div>
                             <div className="font-medium">Signalement</div>
                             <div className="text-xs text-gray-500">Signaler un problème</div>
                           </div>
                         </div>
                       </Button>
                      
                                             <Button 
                         variant="outline" 
                         className="w-full justify-start h-16 text-left"
                         onClick={() => {
                           // Ouvrir la FAQ dans une nouvelle fenêtre
                           const faqWindow = window.open('/faq', '_blank', 'width=800,height=600')
                           
                           if (faqWindow) {
                             toast({
                               title: "FAQ ouverte !",
                               description: "La FAQ a été ouverte dans une nouvelle fenêtre",
                               variant: "default",
                             })
                           } else {
                             // Si la popup est bloquée, afficher un message informatif
                             toast({
                               title: "FAQ !",
                               description: "Voici les questions fréquentes les plus courantes",
                               variant: "default",
                             })
                             
                             // Afficher une FAQ simple dans un toast étendu
                             setTimeout(() => {
                               toast({
                                 title: "Questions Fréquentes",
                                 description: "1. Comment créer un compte ?\n2. Comment récupérer mon mot de passe ?\n3. Comment contacter le support ?\n4. Quels sont les délais de livraison ?",
                                 variant: "default",
                               })
                             }, 1000)
                           }
                         }}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                             <HelpCircle className="w-5 h-5 text-indigo-600" />
                           </div>
                           <div>
                             <div className="font-medium">FAQ</div>
                             <div className="text-xs text-gray-500">Questions fréquentes</div>
                           </div>
                         </div>
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                {/* En-tête avec statistiques IA */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card 
                    className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      toast({
                        title: "Statistiques IA",
                        description: "Précision IA: 94.2% - Basée sur vos interactions et retours",
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Précision IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">94.2%</div>
                        <Sparkles className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Taux de satisfaction</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      setAiRecommendationFilter('products')
                      toast({
                        title: "Filtre appliqué",
                        description: "Affichage des produits recommandés uniquement",
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Produits Recommandés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">12</div>
                        <Package className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Cette semaine</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      setAiRecommendationFilter('sellers')
                      toast({
                        title: "Filtre appliqué",
                        description: "Affichage des vendeurs recommandés uniquement",
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Vendeurs Recommandés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">8</div>
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Basés sur vos préférences</p>
                    </CardContent>
                  </Card>

                  <Card 
                    className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105"
                    onClick={() => {
                      setAiRecommendationFilter('promotions')
                      toast({
                        title: "Filtre appliqué",
                        description: "Affichage des promotions détectées uniquement",
                        variant: "default",
                      })
                    }}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-orange-700">Promotions Détectées</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-orange-900">5</div>
                        <Tag className="w-8 h-8 text-orange-600" />
                      </div>
                      <p className="text-xs text-orange-600 mt-2">Applicables à vos produits</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtres et contrôles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span>Recommandations IA</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Select value={aiRecommendationFilter} onValueChange={setAiRecommendationFilter}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrer par type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les recommandations</SelectItem>
                            <SelectItem value="products">Produits uniquement</SelectItem>
                            <SelectItem value="sellers">Vendeurs uniquement</SelectItem>
                            <SelectItem value="promotions">Promotions uniquement</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Simuler l'actualisation des recommandations IA
                            toast({
                              title: "Actualisation en cours...",
                              description: "Mise à jour des recommandations IA",
                              variant: "default",
                            })
                            
                            // Simuler le chargement
                            setTimeout(() => {
                              toast({
                                title: "Recommandations actualisées !",
                                description: "Nouvelles suggestions IA disponibles",
                                variant: "default",
                              })
                            }, 2000)
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Actualiser
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Découvrez des produits et vendeurs personnalisés grâce à notre IA avancée
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Produits recommandés */}
                {(aiRecommendationFilter === 'all' || aiRecommendationFilter === 'products') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          <span>Produits Recommandés pour Vous</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Navigation",
                              description: "Redirection vers la page des produits",
                              variant: "default",
                            })
                            setTimeout(() => {
                              router.push('/products')
                            }, 1000)
                          }}
                          className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Basé sur vos recherches, achats et préférences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockRecommendedProducts.map((product) => (
                          <Card key={product.id} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                            <CardContent className="p-6">
                              <div className="relative">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-48 object-cover rounded-lg mb-4"
                                />
                                {product.promotion && (
                                  <div className="absolute top-2 right-2">
                                    <Badge className="bg-red-500 text-white animate-pulse">
                                      {product.promotion.value}
                                    </Badge>
                                  </div>
                                )}
                                <div className="absolute top-2 left-2">
                                  <Badge className="bg-purple-500 text-white">
                                    IA: {product.aiConfidence}%
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-lg">{product.name}</h3>
                                  <p className="text-sm text-gray-600">{product.category}</p>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium">{product.rating}</span>
                                    <span className="text-xs text-gray-500">({product.reviews})</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">
                                      {formatValueWithPoints(product.price, true)}
                                    </div>
                                    {product.originalPrice > product.price && (
                                      <div className="text-sm text-gray-500 line-through">
                                        {formatValueWithPoints(product.originalPrice, true)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Vendeur: <span 
                                    className="cursor-pointer hover:text-blue-600 transition-colors duration-300"
                                    onClick={() => router.push(`/seller/${product.seller.toLowerCase().replace(/\s+/g, '-')}`)}
                                  >
                                    {product.seller}
                                  </span></span>
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span>{product.sellerRating}</span>
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <p className="text-xs text-purple-700 font-medium">Pourquoi cette recommandation ?</p>
                                  <p className="text-xs text-purple-600 mt-1">{product.aiReason}</p>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button 
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => addProductToCart(product)}
                                  >
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Acheter
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // Ouvrir la modal de détails du produit
                                      setSelectedProduct(product)
                                      setShowProductDetailsModal(true)
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => toggleProductFavorite(product.id)}
                                  >
                                    <Heart className="w-4 h-4" />
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

                {/* Vendeurs recommandés */}
                {(aiRecommendationFilter === 'all' || aiRecommendationFilter === 'sellers') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <span>Vendeurs Recommandés</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Navigation",
                              description: "Redirection vers la page des vendeurs",
                              variant: "default",
                            })
                            setTimeout(() => {
                              router.push('/sellers')
                            }, 1000)
                          }}
                          className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                        >
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Vendeurs de confiance dans vos catégories préférées
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockRecommendedSellers.map((seller) => (
                          <Card key={seller.id} className="hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-6">
                              <div className="flex items-center space-x-4 mb-4">
                                <Avatar className="w-16 h-16">
                                  <AvatarImage src={seller.avatar} />
                                  <AvatarFallback>{seller.name && seller.name.length > 0 ? seller.name[0] : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <h3 
                                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 transition-colors duration-300"
                                    onClick={() => router.push(`/seller/${seller.id}`)}
                                  >
                                    {seller.name}
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium">{seller.rating}</span>
                                    <Badge className="bg-green-100 text-green-800">
                                      IA: {seller.aiConfidence}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Ventes totales</p>
                                    <p className="font-medium">{seller.totalSales.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Temps de réponse</p>
                                    <p className="font-medium">{seller.responseTime}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">Spécialités:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {seller.specialties.map((specialty, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {specialty}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <p className="text-xs text-green-700 font-medium">Pourquoi ce vendeur ?</p>
                                  <p className="text-xs text-green-600 mt-1">{seller.aiReason}</p>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button 
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => contactSeller(seller)}
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Contacter
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // Ouvrir la modal de détails du vendeur
                                      setSelectedSeller(seller)
                                      setShowSellerDetailsModal(true)
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => toggleSellerFollow(seller.id)}
                                    className={sellerFollowStatus[seller.id] ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' : ''}
                                  >
                                    <Heart className={`w-4 h-4 ${sellerFollowStatus[seller.id] ? 'fill-current' : ''}`} />
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

                {/* Promotions détectées par IA */}
                {(aiRecommendationFilter === 'all' || aiRecommendationFilter === 'promotions') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Tag className="w-5 h-5 text-orange-600" />
                        <span>Promotions Détectées par IA</span>
                      </CardTitle>
                      <CardDescription>
                        Promotions applicables à vos produits favoris
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {mockPromotions.slice(0, 3).map((promotion) => (
                          <Card key={promotion.id} className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <h3 className="font-semibold text-lg">{promotion.title}</h3>
                                    <Badge className="bg-orange-500 text-white animate-pulse">
                                      {promotion.value}
                                    </Badge>
                                    <Badge className="bg-purple-500 text-white">
                                      IA Détectée
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-gray-600 mb-4">{promotion.description}</p>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600">Utilisations</p>
                                      <p className="font-medium">{promotion.usageCount}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Fin</p>
                                      <p className="font-medium">{formatDate(promotion.endDate)}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Priorité</p>
                                      <p className="font-medium">{promotion.priority}/5</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600">Statut</p>
                                      <Badge className={promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {promotion.isActive ? 'Active' : 'Expirée'}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  {promotion.conditions.length > 0 && (
                                    <div className="mt-4">
                                      <p className="text-sm font-medium text-gray-700 mb-2">Conditions:</p>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        {promotion.conditions.map((condition, index) => (
                                          <li key={index} className="flex items-center space-x-2">
                                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                            <span>{condition}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="ml-6 flex flex-col space-y-2">
                                  <Button 
                                    className="bg-orange-600 hover:bg-orange-700"
                                    onClick={() => applyPromotion(promotion)}
                                  >
                                    <Tag className="w-4 h-4 mr-2" />
                                    En profiter
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      // Ouvrir la modal de détails de la promotion
                                      setSelectedPromotion(promotion)
                                      setShowPromotionDetailsModal(true)
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Détails
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
            )}

            {activeTab === 'promotions' && (
              <div className="space-y-6">
                {/* En-tête avec statistiques des promotions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 animate-pulse">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-red-700">Promotions Actives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-red-900">8</div>
                        <Tag className="w-8 h-8 text-red-600 animate-bounce" />
                      </div>
                      <p className="text-xs text-red-600 mt-2">En cours actuellement</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Économies Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">{formatCurrency(125000)}</div>
                <div className="text-sm text-[#ff6600] font-medium">{Math.round(125000 / 10)} points</div>
                        <TrendingDown className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Cette année</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Flash Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">3</div>
                        <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">En cours</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Points Bonus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">x2</div>
                        <Gift className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-600 mt-2">Multiplicateur actuel</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtres et recherche */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Tag className="w-5 h-5 text-orange-600" />
                        <span>Offres Promotionnelles</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Select value={selectedPromotionType} onValueChange={setSelectedPromotionType}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrer par type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les promotions</SelectItem>
                            <SelectItem value="flash">Flash Sales</SelectItem>
                            <SelectItem value="discount">Réductions</SelectItem>
                            <SelectItem value="bundle">Bundles</SelectItem>
                            <SelectItem value="points">Points Bonus</SelectItem>
                            <SelectItem value="shipping">Livraison</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportPromotions()}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Découvrez toutes nos offres promotionnelles et économisez sur vos achats
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Promotions principales avec animations */}
                <div className="space-y-6">
                  {mockPromotions.map((promotion, index) => (
                    <Card 
                      key={promotion.id} 
                      className={`border-2 transition-all duration-500 hover:scale-105 ${
                        promotion.priority === 1 ? 'border-red-300 bg-gradient-to-r from-red-50 to-orange-50 animate-pulse' :
                        promotion.priority === 2 ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50' :
                        'border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50'
                      }`}
                      style={{
                        animationDelay: `${index * 200}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-4">
                              <h3 className="font-bold text-xl">{promotion.title}</h3>
                              <Badge className={`text-white animate-pulse ${
                                promotion.type === 'flash' ? 'bg-red-500' :
                                promotion.type === 'discount' ? 'bg-green-500' :
                                promotion.type === 'bundle' ? 'bg-purple-500' :
                                promotion.type === 'points_multiplier' ? 'bg-blue-500' :
                                'bg-orange-500'
                              }`}>
                                {promotion.value}
                              </Badge>
                              {promotion.priority === 1 && (
                                <Badge className="bg-red-500 text-white animate-bounce">
                                  🔥 Priorité Haute
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-700 mb-4 text-lg">{promotion.description}</p>
                            
                            {/* Barre de progression pour les promotions limitées */}
                            {promotion.maxUsage && (
                              <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                  <span>Utilisations</span>
                                  <span>{promotion.usageCount}/{promotion.maxUsage}</span>
                                </div>
                                <Progress 
                                  value={(promotion.usageCount / promotion.maxUsage) * 100} 
                                  className="h-2"
                                />
                              </div>
                            )}
                            
                            {/* Compte à rebours pour les flash sales */}
                            {promotion.type === 'flash' && (
                              <div className="mb-4 p-3 bg-red-100 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-700">
                                    Se termine dans: 2j 14h 32m
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Début</p>
                                <p className="font-medium">{formatDate(promotion.startDate)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Fin</p>
                                <p className="font-medium">{formatDate(promotion.endDate)}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Utilisations</p>
                                <p className="font-medium">{promotion.usageCount}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Statut</p>
                                <Badge className={promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {promotion.isActive ? '✅ Active' : '❌ Expirée'}
                                </Badge>
                              </div>
                            </div>
                            
                            {promotion.conditions.length > 0 && (
                              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-700 mb-2">Conditions d'utilisation:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {promotion.conditions.map((condition, idx) => (
                                    <li key={idx} className="flex items-center space-x-2">
                                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                      <span>{condition}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-6 flex flex-col space-y-3">
                            <Button 
                              className={`text-white ${
                                promotion.priority === 1 ? 'bg-red-600 hover:bg-red-700 animate-pulse' :
                                promotion.priority === 2 ? 'bg-orange-600 hover:bg-orange-700' :
                                'bg-blue-600 hover:bg-blue-700'
                              }`}
                              size="lg"
                              onClick={() => applyPromotion(promotion)}
                            >
                              <Tag className="w-5 h-5 mr-2" />
                              En profiter
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => sharePromotion(promotion)}
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Partager
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => togglePromotionFavorite(promotion.code)}
                              className={promotionFavorites.includes(promotion.code) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}
                            >
                              <Heart className={`w-4 h-4 mr-2 ${promotionFavorites.includes(promotion.code) ? 'fill-current' : ''}`} />
                              {promotionFavorites.includes(promotion.code) ? 'Retirer' : 'Favoris'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Promotions spéciales en carrousel */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      <span>Promotions Spéciales</span>
                    </CardTitle>
                    <CardDescription>
                      Offres exclusives et limitées dans le temps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          title: "Black Friday",
                          description: "Jusqu'à 70% de réduction",
                          endDate: "2024-11-29",
                          color: "from-black to-gray-800",
                          textColor: "text-white"
                        },
                        {
                          title: "Cyber Monday",
                          description: "Tech à prix cassés",
                          endDate: "2024-12-02",
                          color: "from-blue-600 to-purple-600",
                          textColor: "text-white"
                        },
                        {
                          title: "Boxing Day",
                          description: "Soldes d'hiver",
                          endDate: "2024-12-26",
                          color: "from-red-500 to-pink-500",
                          textColor: "text-white"
                        }
                      ].map((special, index) => (
                        <Card 
                          key={index}
                          className={`bg-gradient-to-br ${special.color} ${special.textColor} hover:scale-105 transition-all duration-500 ease-out cursor-pointer shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-white/30 group`}
                          style={{
                            animationDelay: `${index * 200}ms`,
                            animation: 'fadeInUp 0.8s ease-out forwards'
                          }}
                        >
                          <CardContent className="p-6 text-center">
                            <h3 className="font-bold text-xl mb-2">{special.title}</h3>
                            <p className="text-lg mb-4 opacity-90">{special.description}</p>
                            <div className="text-sm opacity-75">
                              Se termine le {formatDate(special.endDate)}
                            </div>
                            <Button 
                              variant="outline" 
                              className="mt-4 border-white text-white hover:bg-white hover:text-black transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out shadow-lg hover:shadow-xl animate-pulse hover:animate-none group relative overflow-hidden"
                              onClick={() => {
                                setSelectedSpecialPromotion(special)
                                setShowSpecialPromotionModal(true)
                              }}
                            >
                              {/* Effet de brillance au survol */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                              
                              {/* Icône avec animation */}
                              <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                              
                              En savoir plus
                              
                              {/* Indicateur de clic */}
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* En-tête avec statistiques des notifications */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-[#ff6600] border-opacity-30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#ff6600]">Total Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-[#535455]">{notifications.length}</div>
                        <Bell className="w-8 h-8 text-[#ff6600]" />
                      </div>
                      <p className="text-xs text-[#ff6600] mt-2">Toutes les notifications</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-red-700">Non Lues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-red-900">
                          {notifications.filter(n => !n.isRead).length}
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="text-xs text-red-600 mt-2">Nécessitent attention</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-[#535455] border-opacity-30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#535455]">Promotions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-[#535455]">
                          {notifications.filter(n => n.category === 'promotions').length}
                        </div>
                        <Tag className="w-8 h-8 text-[#ff6600]" />
                      </div>
                      <p className="text-xs text-[#535455] mt-2">Offres spéciales</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-[#ff6600] border-opacity-30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-[#ff6600]">Commandes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-[#535455]">
                          {notifications.filter(n => n.category === 'orders').length}
                        </div>
                        <Package className="w-8 h-8 text-[#ff6600]" />
                      </div>
                      <p className="text-xs text-[#ff6600] mt-2">Suivi des commandes</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contrôles et filtres */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <span>Gestion des Notifications</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <Select value={selectedNotificationCategory} onValueChange={setSelectedNotificationCategory}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrer par catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Toutes les catégories</SelectItem>
                            <SelectItem value="orders">Commandes</SelectItem>
                            <SelectItem value="points">Points</SelectItem>
                            <SelectItem value="promotions">Promotions</SelectItem>
                            <SelectItem value="system">Système</SelectItem>
                            <SelectItem value="chat">Chat</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-[#ff6600] hover:text-white hover:border-[#ff6600] transition-colors"
                          onClick={() => {
                            // Marquer toutes les notifications comme lues
                            const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }))
                            setNotifications(updatedNotifications)
                            setUnreadNotifications(0)
                            toast({
                              title: "Succès !",
                              description: "Toutes les notifications ont été marquées comme lues",
                              variant: "default",
                            })
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Tout marquer comme lu
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                          onClick={() => {
                            // Supprimer les notifications lues
                            const readNotifications = notifications.filter(n => n.isRead)
                            const unreadNotifications = notifications.filter(n => !n.isRead)
                            setNotifications(unreadNotifications)
                            toast({
                              title: "Suppression réussie !",
                              description: `${readNotifications.length} notifications lues supprimées`,
                              variant: "default",
                            })
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer lues
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Gérez vos notifications et préférences de communication
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Liste des notifications */}
                <Card>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {mockNotifications
                        .filter(notification => 
                          selectedNotificationCategory === 'all' || 
                          notification.category === selectedNotificationCategory
                        )
                        .map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                              !notification.isRead ? 'bg-orange-50 border-l-4 border-l-[#ff6600]' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className={`w-3 h-3 rounded-full mt-2 ${
                                notification.type === 'promotion' ? 'bg-[#ff6600]' :
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                'bg-[#535455]'
                              }`}></div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-3">
                                    <h4 className="font-medium">{notification.title}</h4>
                                    {!notification.isRead && (
                                      <Badge className="bg-[#ff6600] text-white text-xs">
                                        Nouveau
                                      </Badge>
                                    )}
                                    <Badge className={`text-xs ${
                                      notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {notification.priority === 'high' ? 'Haute' :
                                       notification.priority === 'medium' ? 'Moyenne' : 'Basse'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">
                                      {formatDate(notification.timestamp)}
                                    </span>
                                    <div className="relative">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setShowNotificationActions(prev => ({
                                            ...prev,
                                            [notification.id]: !prev[notification.id]
                                          }))
                                        }}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                      
                                      {showNotificationActions[notification.id] && (
                                        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-50 w-48">
                                          <div className="p-1">
                                            <button
                                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded"
                                              onClick={() => {
                                                const updatedNotifications = notifications.map(n => 
                                                  n.id === notification.id ? { ...n, isRead: !n.isRead } : n
                                                )
                                                setNotifications(updatedNotifications)
                                                setShowNotificationActions(prev => ({ ...prev, [notification.id]: false }))
                                                toast({
                                                  title: "État modifié !",
                                                  description: `Notification ${updatedNotifications.find(n => n.id === notification.id)?.isRead ? 'marquée comme lue' : 'marquée comme non lue'}`,
                                                  variant: "default",
                                                })
                                              }}
                                            >
                                              <Check className="w-4 h-4" />
                                              <span>{notification.isRead ? 'Marquer non lu' : 'Marquer lu'}</span>
                                            </button>
                                            <button
                                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded text-red-600"
                                              onClick={() => {
                                                const updatedNotifications = notifications.filter(n => n.id !== notification.id)
                                                setNotifications(updatedNotifications)
                                                setShowNotificationActions(prev => ({ ...prev, [notification.id]: false }))
                                                toast({
                                                  title: "Notification supprimée !",
                                                  description: `"${notification.title}" a été supprimée`,
                                                  variant: "default",
                                                })
                                              }}
                                            >
                                              <Trash2 className="w-4 h-4" />
                                              <span>Supprimer</span>
                                            </button>
                                            <button
                                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-50 rounded text-[#ff6600]"
                                              onClick={() => {
                                                navigator.clipboard.writeText(notification.message)
                                                setShowNotificationActions(prev => ({ ...prev, [notification.id]: false }))
                                                toast({
                                                  title: "Message copié !",
                                                  description: "Le message a été copié dans le presse-papiers",
                                                  variant: "default",
                                                })
                                              }}
                                            >
                                              <Copy className="w-4 h-4" />
                                              <span>Copier</span>
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="text-gray-600 mb-3">{notification.message}</p>
                                
                                {notification.actionUrl && notification.actionText && (
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                                      onClick={() => {
                                        // Ouvrir la mini-modale appropriée selon l'action
                                        if (notification.actionText === "Voir la commande") {
                                          // Simuler une commande pour la démo
                                          const demoOrder: Order = {
                                            id: "ORD-001",
                                            items: [{ 
                                              id: 1,
                                              name: "Smartphone Samsung Galaxy", 
                                              price: 45000, 
                                              quantity: 1,
                                              image: "/placeholder.jpg",
                                              seller: "TechStore"
                                            }],
                                            total: 45000,
                                            status: "delivered",
                                            createdAt: "2024-01-15"
                                          }
                                          setSelectedOrder(demoOrder)
                                          setShowOrderDetailsModal(true)
                                        } else if (notification.actionText === "Voir mes points") {
                                          setShowPointsDetailsModal(true)
                                        } else if (notification.actionText === "Voir la promotion") {
                                          // Simuler une promotion pour la démo
                                          const demoPromotion = {
                                            title: "Flash Sale - Smartphones",
                                            description: "25% de réduction sur tous les smartphones",
                                            endDate: "2024-01-25",
                                            code: "FLASH25",
                                            type: "flash",
                                            priority: 1,
                                            maxUsage: 100,
                                            usageCount: 45
                                          }
                                          setSelectedPromotion(demoPromotion)
                                          setShowPromotionModal(true)
                                        } else if (notification.actionText === "En profiter") {
                                          // Simuler une promotion pour la démo
                                          const demoPromotion = {
                                            title: "Promotion Spéciale",
                                            description: "20% de réduction sur tous les smartphones",
                                            endDate: "2024-01-31",
                                            code: "SMART20"
                                          }
                                          setSelectedPromotion(demoPromotion)
                                          setShowPromotionModal(true)
                                        } else {
                                          // Action par défaut
                                          toast({
                                            title: "Action exécutée !",
                                            description: `Action "${notification.actionText}" exécutée avec succès`,
                                            variant: "default",
                                          })
                                        }
                                        
                                        // Marquer comme lu après l'action
                                        const updatedNotifications = notifications.map(n => 
                                          n.id === notification.id ? { ...n, isRead: true } : n
                                        )
                                        setNotifications(updatedNotifications)
                                      }}
                                    >
                                      {notification.actionText}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="hover:bg-green-50 hover:text-green-600 transition-colors"
                                      onClick={() => {
                                        // Marquer la notification comme lue
                                        const updatedNotifications = notifications.map(n => 
                                          n.id === notification.id ? { ...n, isRead: true } : n
                                        )
                                        setNotifications(updatedNotifications)
                                        if (!notification.isRead) {
                                          setUnreadNotifications(prev => Math.max(0, prev - 1))
                                        }
                                        toast({
                                          title: "Notification marquée !",
                                          description: `"${notification.title}" a été marquée comme lue`,
                                          variant: "default",
                                        })
                                      }}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                      onClick={() => {
                                        // Supprimer la notification
                                        const updatedNotifications = notifications.filter(n => n.id !== notification.id)
                                        setNotifications(updatedNotifications)
                                        if (!notification.isRead) {
                                          setUnreadNotifications(prev => Math.max(0, prev - 1))
                                        }
                                        toast({
                                          title: "Notification supprimée !",
                                          description: `"${notification.title}" a été supprimée`,
                                          variant: "default",
                                        })
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Paramètres de notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <span>Paramètres de Notifications</span>
                    </CardTitle>
                    <CardDescription>
                      Configurez vos préférences de notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Canaux de notification */}
                      <div>
                        <h4 className="font-medium mb-4">Canaux de notification</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Mail className="w-5 h-5 text-[#ff6600]" />
                              <div>
                                <p className="font-medium">Notifications par email</p>
                                <p className="text-sm text-[#535455]">Recevez des notifications par email</p>
                              </div>
                            </div>
                            <Switch 
                              checked={notificationSettings.email}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, email: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Bell className="w-5 h-5 text-[#ff6600]" />
                              <div>
                                <p className="font-medium">Notifications push</p>
                                <p className="text-sm text-[#535455]">Notifications sur votre navigateur</p>
                              </div>
                            </div>
                            <Switch 
                              checked={notificationSettings.push}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, push: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Smartphone className="w-5 h-5 text-[#ff6600]" />
                              <div>
                                <p className="font-medium">Notifications SMS</p>
                                <p className="text-sm text-[#535455]">Recevez des SMS importants</p>
                              </div>
                            </div>
                            <Switch 
                              checked={notificationSettings.sms}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, sms: checked }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Types de notifications */}
                      <div>
                        <h4 className="font-medium mb-4">Types de notifications</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm">Commandes</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.orders}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, orders: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Gift className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm">Points de fidélité</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.points}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, points: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm">Messages chat</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.chat}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, chat: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Tag className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm">Promotions</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.promotions}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, promotions: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Settings className="w-4 h-4 text-[#535455]" />
                              <span className="text-sm">Système</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.system}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, system: checked }))
                              }
                            />
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-[#ff6600]" />
                              <span className="text-sm">Recommandations IA</span>
                            </div>
                            <Switch 
                              checked={notificationSettings.ai}
                              onCheckedChange={(checked) => 
                                setNotificationSettings(prev => ({ ...prev, ai: checked }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Fréquence et timing */}
                      <div>
                        <h4 className="font-medium mb-4">Fréquence et timing</h4>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium">Fréquence des résumés</Label>
                            <Select value={notificationFrequency} onValueChange={setNotificationFrequency}>
                              <SelectTrigger className="mt-2 border-[#ff6600] focus:ring-[#ff6600]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="immediate">Immédiat</SelectItem>
                                <SelectItem value="hourly">Toutes les heures</SelectItem>
                                <SelectItem value="daily">Quotidien</SelectItem>
                                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Heures de réception</Label>
                            <div className="flex items-center space-x-4 mt-2">
                              <Select value={notificationStartTime} onValueChange={setNotificationStartTime}>
                                <SelectTrigger className="w-32 border-[#ff6600] focus:ring-[#ff6600]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="06:00">06:00</SelectItem>
                                  <SelectItem value="07:00">07:00</SelectItem>
                                  <SelectItem value="08:00">08:00</SelectItem>
                                  <SelectItem value="09:00">09:00</SelectItem>
                                  <SelectItem value="10:00">10:00</SelectItem>
                                </SelectContent>
                              </Select>
                              <span className="text-[#535455]">à</span>
                              <Select value={notificationEndTime} onValueChange={setNotificationEndTime}>
                                <SelectTrigger className="w-32 border-[#ff6600] focus:ring-[#ff6600]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="18:00">18:00</SelectItem>
                                  <SelectItem value="19:00">19:00</SelectItem>
                                  <SelectItem value="20:00">20:00</SelectItem>
                                  <SelectItem value="21:00">21:00</SelectItem>
                                  <SelectItem value="22:00">22:00</SelectItem>
                                  <SelectItem value="23:00">23:00</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Bouton de sauvegarde des paramètres */}
                          <div className="pt-4">
                            <Button 
                              className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white transition-colors"
                              onClick={() => {
                                // Sauvegarder les paramètres
                                localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings))
                                localStorage.setItem('notificationFrequency', notificationFrequency)
                                localStorage.setItem('notificationStartTime', notificationStartTime)
                                localStorage.setItem('notificationEndTime', notificationEndTime)
                                toast({
                                  title: "Paramètres sauvegardés !",
                                  description: "Vos préférences de notifications ont été sauvegardées",
                                  variant: "default",
                                })
                              }}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Sauvegarder les paramètres
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section Paramètres Système */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* En-tête des paramètres */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-blue-700">Paramètres Généraux</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-blue-900">12</div>
                        <Settings className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Options configurables</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-green-700">Sécurité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-green-900">3</div>
                        <Shield className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Niveaux de protection</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-purple-700">Personnalisation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-purple-900">8</div>
                        <User className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-xs text-purple-700 mt-2">Préférences utilisateur</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Paramètres généraux */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      <span>Paramètres Généraux</span>
                    </CardTitle>
                    <CardDescription>
                      Configurez vos préférences générales et l'apparence du tableau de bord
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Langue et devise */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="language">Langue</Label>
                        <Select value={selectedLanguage} onValueChange={(value) => {
                          setSelectedLanguage(value)
                          toast({
                            title: "Langue modifiée !",
                            description: `Votre langue a été changée vers ${value === 'fr' ? 'Français' : value === 'en' ? 'English' : 'Español'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une langue" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="currency">Devise</Label>
                        <Select value={selectedCurrency} onValueChange={(value) => {
                          setSelectedCurrency(value)
                          toast({
                            title: "Devise modifiée !",
                            description: `Votre devise a été changée vers ${value === 'xof' ? 'XOF (Franc CFA)' : value === 'usd' ? 'USD (Dollar US)' : 'EUR (Euro)'}`,
                            variant: "default",
                          })
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une devise" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xof">XOF (Franc CFA)</SelectItem>
                            <SelectItem value="usd">USD (Dollar US)</SelectItem>
                            <SelectItem value="eur">EUR (Euro)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Thème */}
                    <div className="space-y-2">
                      <Label htmlFor="theme">Thème</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className={`w-full h-20 bg-white border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                            selectedTheme === 'light' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                          }`} onClick={() => {
                            setSelectedTheme('light')
                            toast({
                              title: "Thème modifié !",
                              description: "Le thème clair a été activé",
                              variant: "default",
                            })
                          }}>
                            <Sun className="w-8 h-8 text-yellow-500" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              name="theme" 
                              id="light" 
                              value="light" 
                              checked={selectedTheme === 'light'}
                              onChange={() => {
                                setSelectedTheme('light')
                                toast({
                                  title: "Thème modifié !",
                                  description: "Le thème clair a été activé",
                                  variant: "default",
                                })
                              }}
                            />
                            <Label htmlFor="light" className="text-sm">Clair</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className={`w-full h-20 bg-gray-900 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                            selectedTheme === 'dark' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                          }`} onClick={() => {
                            setSelectedTheme('dark')
                            toast({
                              title: "Thème modifié !",
                              description: "Le thème sombre a été activé",
                              variant: "default",
                            })
                          }}>
                            <Moon className="w-8 h-8 text-blue-400" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              name="theme" 
                              id="dark" 
                              value="dark" 
                              checked={selectedTheme === 'dark'}
                              onChange={() => {
                                setSelectedTheme('dark')
                                toast({
                                  title: "Thème modifié !",
                                  description: "Le thème sombre a été activé",
                                  variant: "default",
                                })
                              }}
                            />
                            <Label htmlFor="dark" className="text-sm">Sombre</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className={`w-full h-20 bg-gradient-to-br from-gray-100 to-gray-300 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                            selectedTheme === 'system' ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                          }`} onClick={() => {
                            setSelectedTheme('system')
                            toast({
                              title: "Thème modifié !",
                              description: "Le thème système a été activé",
                              variant: "default",
                            })
                          }}>
                            <Monitor className="w-8 h-8 text-gray-600" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="radio" 
                              name="theme" 
                              id="system" 
                              value="system" 
                              checked={selectedTheme === 'system'}
                              onChange={() => {
                                setSelectedTheme('system')
                                toast({
                                  title: "Thème modifié !",
                                  description: "Le thème système a été activé",
                                  variant: "default",
                                })
                              }}
                            />
                            <Label htmlFor="system" className="text-sm">Système</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fuseau horaire */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuseau horaire</Label>
                      <Select value={selectedTimezone} onValueChange={(value) => {
                        setSelectedTimezone(value)
                        const timezoneNames = {
                          'africa/lagos': 'Afrique/Lagos (GMT+1)',
                          'africa/abidjan': 'Afrique/Abidjan (GMT+0)',
                          'africa/douala': 'Afrique/Douala (GMT+1)'
                        }
                        toast({
                          title: "Fuseau horaire modifié !",
                          description: `Votre fuseau horaire a été changé vers ${timezoneNames[value as keyof typeof timezoneNames]}`,
                          variant: "default",
                        })
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un fuseau horaire" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="africa/lagos">Afrique/Lagos (GMT+1)</SelectItem>
                          <SelectItem value="africa/abidjian">Afrique/Abidjan (GMT+0)</SelectItem>
                          <SelectItem value="africa/douala">Afrique/Douala (GMT+1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Paramètres de sécurité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span>Paramètres de Sécurité</span>
                    </CardTitle>
                    <CardDescription>
                      Sécurisez votre compte avec des options avancées
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Authentification à deux facteurs */}
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <Key className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">Authentification à deux facteurs</p>
                          <p className="text-sm text-green-600">Protection renforcée de votre compte</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowTwoFactorSetup(true)}
                        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                      >
                        {twoFactorEnabled ? "Modifier" : "Configurer"}
                      </Button>
                    </div>

                    {/* Changement de mot de passe */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Lock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Changer le mot de passe</p>
                          <p className="text-sm text-blue-600">Mettez à jour votre mot de passe</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowPasswordChangeModal(true)}
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                      >
                        Modifier
                      </Button>
                    </div>

                    {/* Sessions actives */}
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-medium">Sessions actives</p>
                          <p className="text-sm text-purple-600">Gérez vos connexions</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowSessionsModal(true)}
                        className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
                      >
                        Voir (3)
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Paramètres de confidentialité */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="w-5 h-5 text-purple-600" />
                      <span>Confidentialité et Données</span>
                    </CardTitle>
                    <CardDescription>
                      Contrôlez la visibilité de vos informations et la collecte de données
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Visibilité du profil */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Profil public</p>
                          <p className="text-sm text-gray-600">Permettre aux autres de voir votre profil</p>
                        </div>
                        <Switch 
                          checked={profilePublic} 
                          onCheckedChange={(checked) => {
                            setProfilePublic(checked)
                            toast({
                              title: checked ? "Profil public activé" : "Profil privé activé",
                              description: checked ? "Votre profil est maintenant visible par les autres utilisateurs" : "Votre profil est maintenant privé",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Historique des achats</p>
                          <p className="text-sm text-gray-600">Partager vos achats avec les vendeurs</p>
                        </div>
                        <Switch 
                          checked={sharePurchaseHistory} 
                          onCheckedChange={(checked) => {
                            setSharePurchaseHistory(checked)
                            toast({
                              title: checked ? "Historique partagé" : "Historique privé",
                              description: checked ? "Votre historique d'achats est maintenant partagé avec les vendeurs" : "Votre historique d'achats est maintenant privé",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Statistiques de partage</p>
                          <p className="text-sm text-gray-600">Afficher vos statistiques de partage</p>
                        </div>
                        <Switch 
                          checked={shareStats} 
                          onCheckedChange={(checked) => {
                            setShareStats(checked)
                            toast({
                              title: checked ? "Statistiques partagées" : "Statistiques privées",
                              description: checked ? "Vos statistiques de partage sont maintenant visibles" : "Vos statistiques de partage sont maintenant privées",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                    </div>

                    {/* Collecte de données */}
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Analytics et amélioration</p>
                          <p className="text-sm text-gray-600">Aider à améliorer le service</p>
                        </div>
                        <Switch 
                          checked={analyticsEnabled} 
                          onCheckedChange={(checked) => {
                            setAnalyticsEnabled(checked)
                            toast({
                              title: checked ? "Analytics activés" : "Analytics désactivés",
                              description: checked ? "Vous contribuez maintenant à l'amélioration du service" : "Vous ne contribuez plus à l'amélioration du service",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Personnalisation des recommandations</p>
                          <p className="text-sm text-gray-600">Recevoir des suggestions personnalisées</p>
                        </div>
                        <Switch 
                          checked={personalizedRecommendations} 
                          onCheckedChange={(checked) => {
                            setPersonalizedRecommendations(checked)
                            toast({
                              title: checked ? "Recommandations activées" : "Recommandations désactivées",
                              description: checked ? "Vous recevrez maintenant des suggestions personnalisées" : "Vous ne recevrez plus de suggestions personnalisées",
                              variant: "default",
                            })
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions rapides */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <span>Actions Rapides</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                        onClick={() => setShowExportModal(true)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter mes données
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                        onClick={() => setShowDeleteAccountModal(true)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer mon compte
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
                        onClick={() => setShowPrivacyPolicyModal(true)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Politique de confidentialité
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                        onClick={() => setShowTermsModal(true)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Conditions d'utilisation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Advanced Chat Component */}
      <AdvancedChat 
        isOpen={showAdvancedChat}
        onClose={() => setShowAdvancedChat(false)}
      />

      {/* Modal de retrait de points amélioré avec scroll */}
      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-[#ff6600]" />
              <span>Retrait de Points</span>
            </DialogTitle>
            <DialogDescription>
              Convertissez vos points en argent réel via votre mode de paiement préféré
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Solde disponible */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Solde disponible</span>
                <span className="text-lg font-bold text-green-600">{userPoints.toLocaleString()} points</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">Valeur estimée</span>
                <span className="text-sm font-medium text-[#ff6600]">{formatCurrency(userPoints * 10)}</span>
              </div>
            </div>
            
            {/* Montant à retirer */}
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount" className="text-sm font-medium text-gray-700">
                Montant à retirer (points)
              </Label>
              <Input
                id="withdrawal-amount"
                type="number"
                placeholder="Ex: 5000"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                className="border-gray-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
              />
              {withdrawalAmount && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Vous recevrez:</span> {formatCurrency(parseInt(withdrawalAmount) * 10 * 0.98)} 
                    <span className="text-xs"> (après frais de 2%)</span>
                  </p>
                </div>
              )}
            </div>
            
            {/* Sélection du mode de paiement */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Mode de Paiement</Label>
              
              {/* Mobile Money */}
              <div className="space-y-3">
                                 <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-[#ff6600] transition-colors cursor-pointer bg-orange-50 hover:bg-orange-100"
                      onClick={() => setSelectedWithdrawalMethod('mobile-money')}>
                   <input 
                     type="radio" 
                     name="payment-method" 
                     id="mobile-money" 
                     checked={selectedWithdrawalMethod === 'mobile-money'}
                     onChange={() => setSelectedWithdrawalMethod('mobile-money')}
                     className="text-[#ff6600] focus:ring-[#ff6600]"
                   />
                  <label htmlFor="mobile-money" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">Mobile Money</span>
                  </label>
                </div>
                
                                 {/* Carte de crédit */}
                 <div className="flex items-center space-x3 p-3 border border-gray-200 rounded-lg hover:border-[#ff6600] transition-colors cursor-pointer bg-blue-50 hover:bg-blue-100"
                      onClick={() => setSelectedWithdrawalMethod('credit-card')}>
                   <input 
                     type="radio" 
                     name="payment-method" 
                     id="credit-card" 
                     checked={selectedWithdrawalMethod === 'credit-card'}
                     onChange={() => setSelectedWithdrawalMethod('credit-card')}
                     className="text-[#ff6600] focus:ring-[#ff6600]"
                   />
                  <label htmlFor="credit-card" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">Carte de Crédit</span>
                  </label>
                </div>
                
                                 {/* Compte bancaire */}
                 <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-[#ff6600] transition-colors cursor-pointer bg-green-50 hover:bg-green-100"
                      onClick={() => setSelectedWithdrawalMethod('bank-account')}>
                   <input 
                     type="radio" 
                     name="payment-method" 
                     id="bank-account" 
                     checked={selectedWithdrawalMethod === 'bank-account'}
                     onChange={() => setSelectedWithdrawalMethod('bank-account')}
                     className="text-[#ff6600] focus:ring-[#ff6600]"
                   />
                  <label htmlFor="bank-account" className="flex items-center space-x-2 cursor-pointer flex-1">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-gray-700">Compte Bancaire</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Détails spécifiques au mode de paiement */}
            {selectedWithdrawalMethod === 'mobile-money' && (
              <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800">Mobile Money</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Numéro de téléphone (ex: +229 91 50 57 57)"
                    className="border-orange-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  />
                  <p className="text-xs text-orange-600">
                    Le montant sera envoyé directement sur votre compte Mobile Money
                  </p>
                </div>
              </div>
            )}
            
            {selectedWithdrawalMethod === 'credit-card' && (
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800">Carte de Crédit</h4>
                <div className="space-y-2">
                  <Input
                    placeholder="Numéro de carte"
                    className="border-blue-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="MM/YY"
                      className="border-blue-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                    />
                    <Input
                      placeholder="CVV"
                      className="border-blue-300 focus:border-[#ff6600] focus:ring-[#ff6600]"
                    />
                  </div>
                  <p className="text-xs text-blue-600">
                    Le montant sera crédité sur votre carte bancaire
                  </p>
                </div>
              </div>
            )}
            
            {selectedWithdrawalMethod === 'bank-account' && (
              <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800">Compte Bancaire</h4>
                <div className="space-y-2">
                  <Select>
                    <SelectTrigger className="border-green-300 focus:border-[#ff6600] focus:ring-[#ff6600]">
                      <SelectValue placeholder="Sélectionnez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account1">Banque Atlantique - ****1234</SelectItem>
                      <SelectItem value="account2">Ecobank - ****5678</SelectItem>
                      <SelectItem value="account3">NSIA Banque - ****9012</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-green-600">
                    Le montant sera transféré sur votre compte bancaire
                  </p>
                </div>
              </div>
            )}
            
            {/* Boutons d'action */}
            <div className="flex space-x-3 pt-4 border-t pb-4 flex-shrink-0">
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 hover:border-[#ff6600] hover:text-[#ff6600]"
                onClick={() => setShowWithdrawalModal(false)}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
                disabled={!withdrawalAmount || parseInt(withdrawalAmount) < 1000 || !selectedWithdrawalMethod}
                onClick={() => handleWithdrawal()}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Confirmer le retrait
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de nouveau message */}
      <Dialog open={showNewMessageModal} onOpenChange={setShowNewMessageModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>Nouveau Message</span>
            </DialogTitle>
            <DialogDescription>
              Envoyez un message à l'équipe d'administration. Tous les champs marqués d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="message-subject" className="flex items-center">
                  Sujet <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="message-subject"
                  placeholder="Sujet de votre message"
                  value={newMessageSubject}
                  onChange={(e) => setNewMessageSubject(e.target.value)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message-category" className="flex items-center">
                  Catégorie <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select value={newMessageCategory} onValueChange={setNewMessageCategory}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="report">Signalement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message-priority" className="flex items-center">
                Priorité <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select value={newMessagePriority} onValueChange={setNewMessagePriority}>
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Sélectionnez la priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Basse</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Moyenne</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Haute</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message-content" className="flex items-center">
                Message <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="message-content"
                placeholder="Décrivez votre demande en détail..."
                rows={6}
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                className="focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Minimum 10 caractères</span>
                <span>{newMessageContent.length}/1000</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Pièces jointes (optionnel)</Label>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Sélection de fichier",
                      description: "Fonctionnalité de pièce jointe en cours de développement",
                      variant: "default",
                    })
                  }}
                  className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Ajouter une pièce jointe
                </Button>
                <span className="text-xs text-gray-500">
                  Formats acceptés: PDF, JPG, PNG (max 5MB)
                </span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Informations importantes</span>
              </div>
              <div className="text-xs text-blue-600">
                Temps de réponse moyen: 2-4 heures
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setNewMessageSubject('')
                  setNewMessageContent('')
                  setNewMessageCategory('general')
                  setNewMessagePriority('medium')
                  setShowNewMessageModal(false)
                  toast({
                    title: "Message annulé",
                    description: "Le message a été annulé et le formulaire réinitialisé",
                    variant: "default",
                  })
                }}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!newMessageSubject || !newMessageContent || newMessageContent.length < 10}
                onClick={() => {
                  // Simuler l'envoi du message
                  const newMessage = {
                    id: `msg-${Date.now()}`,
                    from: 'user',
                    subject: newMessageSubject,
                    content: newMessageContent,
                    timestamp: new Date().toISOString(),
                    isRead: false,
                    priority: newMessagePriority,
                    category: newMessageCategory,
                    status: 'sent'
                  }
                  
                  // Ajouter le message à la liste
                  setInternalMessages(prev => [newMessage, ...prev])
                  
                  // Réinitialiser le formulaire
                  setNewMessageSubject('')
                  setNewMessageContent('')
                  setNewMessageCategory('general')
                  setNewMessagePriority('medium')
                  
                  // Fermer la modal
                  setShowNewMessageModal(false)
                  
                  // Notification de succès
                  toast({
                    title: "Message envoyé !",
                    description: "Votre message a été envoyé avec succès à l'équipe d'administration",
                    variant: "default",
                  })
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer le message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de transfert de points */}
      <Dialog open={showMoneyTransferModal} onOpenChange={setShowMoneyTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfert de Points</DialogTitle>
            <DialogDescription>
              Envoyez des points à un autre utilisateur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Solde disponible</span>
                <span className="text-lg font-bold text-purple-600">{userPoints.toLocaleString()} points</span>
              </div>
              <div className="text-xs text-purple-600 mt-2">
                Frais de transfert: 1% • Minimum: 100 points • Maximum: 10,000 points/jour
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transfer-email">Email du destinataire</Label>
              <Input
                id="transfer-email"
                type="email"
                placeholder="exemple@email.com"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Montant à transférer (points)</Label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="Ex: 1000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              {transferAmount && (
                <p className="text-sm text-gray-600">
                  Le destinataire recevra: {parseInt(transferAmount) * 0.99} points (après frais de 1%)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transfer-message">Message (optionnel)</Label>
              <Textarea
                id="transfer-message"
                placeholder="Ajoutez un message personnel..."
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowMoneyTransferModal(false)}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={!transferEmail || !transferAmount || parseInt(transferAmount) < 100}
              >
                Confirmer le transfert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de changement de mot de passe */}
      <Dialog open={showPasswordChangeModal} onOpenChange={setShowPasswordChangeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
            <DialogDescription>
              Mettez à jour votre mot de passe pour sécuriser votre compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Votre mot de passe actuel"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Votre nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre nouveau mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowPasswordChangeModal(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                }}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                onClick={() => {
                  // Validation du mot de passe
                  if (newPassword.length < 8) {
                    toast({
                      title: "Mot de passe trop court",
                      description: "Le nouveau mot de passe doit contenir au moins 8 caractères",
                      variant: "destructive",
                    })
                    return
                  }
                  
                  if (newPassword === currentPassword) {
                    toast({
                      title: "Mot de passe identique",
                      description: "Le nouveau mot de passe doit être différent de l'actuel",
                      variant: "destructive",
                    })
                    return
                  }
                  
                  // Simuler le changement de mot de passe
                  toast({
                    title: "Modification en cours...",
                    description: "Votre mot de passe est en cours de modification",
                    variant: "default",
                  })
                  
                  setTimeout(() => {
                    toast({
                      title: "Mot de passe modifié !",
                      description: "Votre mot de passe a été modifié avec succès",
                      variant: "default",
                    })
                    setShowPasswordChangeModal(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                  }, 2000)
                }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Modifier le mot de passe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition du profil */}
      <Dialog open={showProfileEdit} onOpenChange={setShowProfileEdit}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Modifier le Profil</span>
            </DialogTitle>
            <DialogDescription>
              Mettez à jour vos informations personnelles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Nom complet</Label>
                <Input
                  id="full-name"
                  placeholder="Votre nom complet"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+229 91 50 57 57"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Select value={profileData.country} onValueChange={(value) => setProfileData(prev => ({ ...prev, country: value }))}>
                  <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                    <SelectValue placeholder="Sélectionnez un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bénin">Bénin</SelectItem>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                    <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                    <SelectItem value="Ghana">Ghana</SelectItem>
                    <SelectItem value="Sénégal">Sénégal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                placeholder="Votre adresse complète"
                value={profileData.address}
                onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Informations importantes</span>
              </div>
              <div className="text-xs text-blue-600">
                Vos informations seront mises à jour immédiatement
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowProfileEdit(false)
                  // Réinitialiser les données aux valeurs originales
                  setProfileData({
                    fullName: 'John Doe',
                    email: 'john.doe@example.com',
                    phone: '+229 91 50 57 57',
                    country: 'Bénin',
                    address: '123 Rue de la Paix, Abomey-Calavi, Bénin',
                    avatar: '/placeholder.jpg'
                  })
                  toast({
                    title: "Modifications annulées",
                    description: "Vos informations n'ont pas été modifiées",
                    variant: "default",
                  })
                }}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Simuler la sauvegarde
                  toast({
                    title: "Sauvegarde en cours...",
                    description: "Vos informations sont en cours de sauvegarde",
                    variant: "default",
                  })
                  
                  setTimeout(() => {
                    toast({
                      title: "Profil mis à jour !",
                      description: "Vos informations ont été sauvegardées avec succès",
                      variant: "default",
                    })
                    setShowProfileEdit(false)
                  }, 2000)
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de changement d'avatar */}
      <Dialog open={showAvatarUpload} onOpenChange={setShowAvatarUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Changer l'Avatar</span>
            </DialogTitle>
            <DialogDescription>
              Téléchargez une nouvelle photo de profil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profileData.avatar} />
                  <AvatarFallback className="text-4xl">JD</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Méthodes de téléchargement</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "Sélection de fichier",
                        description: "Fonctionnalité de téléchargement en cours de développement",
                        variant: "default",
                      })
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Télécharger depuis l'ordinateur
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "Caméra",
                        description: "Fonctionnalité de prise de photo en cours de développement",
                        variant: "default",
                      })
                    }}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Prendre une photo
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: "URL",
                        description: "Fonctionnalité d'URL en cours de développement",
                        variant: "default",
                      })
                    }}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Importer depuis une URL
                  </Button>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Formats acceptés</p>
                    <p className="text-xs">JPG, PNG, GIF (max 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAvatarUpload(false)}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  toast({
                    title: "Avatar mis à jour !",
                    description: "Votre photo de profil a été mise à jour",
                    variant: "default",
                  })
                  setShowAvatarUpload(false)
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'authentification à deux facteurs */}
      <Dialog open={showTwoFactorSetup} onOpenChange={setShowTwoFactorSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-green-600" />
              <span>Configuration 2FA</span>
            </DialogTitle>
            <DialogDescription>
              Sécurisez votre compte avec l'authentification à deux facteurs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {!twoFactorEnabled ? (
              <>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Info className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Activation de la 2FA</p>
                      <p className="text-xs text-green-600 mt-1">
                        Scannez le QR code avec votre application d'authentification
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-gray-400" />
                        <p className="text-xs text-gray-500 mt-2">QR Code</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code">Code de vérification</Label>
                    <Input
                      id="2fa-code"
                      placeholder="Entrez le code à 6 chiffres"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowTwoFactorSetup(false)
                        setTwoFactorCode('')
                      }}
                    >
                      Annuler
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={twoFactorCode.length !== 6}
                      onClick={() => {
                        // Simuler la vérification du code
                        toast({
                          title: "Vérification en cours...",
                          description: "Vérification du code 2FA",
                          variant: "default",
                        })
                        
                        setTimeout(() => {
                          setTwoFactorEnabled(true)
                          setShowTwoFactorSetup(false)
                          setTwoFactorCode('')
                          toast({
                            title: "2FA activée !",
                            description: "L'authentification à deux facteurs est maintenant active",
                            variant: "default",
                          })
                        }, 2000)
                      }}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Activer
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-700">2FA déjà activée</p>
                      <p className="text-xs text-red-600 mt-1">
                        Votre compte est déjà sécurisé avec l'authentification à deux facteurs
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowTwoFactorSetup(false)}
                  >
                    Fermer
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setTwoFactorEnabled(false)
                      toast({
                        title: "2FA désactivée !",
                        description: "L'authentification à deux facteurs a été désactivée",
                        variant: "default",
                      })
                      setShowTwoFactorSetup(false)
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Désactiver
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des sessions actives */}
      <Dialog open={showSessionsModal} onOpenChange={setShowSessionsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessions actives</DialogTitle>
            <DialogDescription>
              Gérez vos connexions actives sur différents appareils
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                {
                  id: '1',
                  device: 'Ordinateur Windows - Chrome',
                  location: 'Cotonou, Bénin',
                  lastActive: 'Maintenant',
                  isCurrent: true,
                  ip: '192.168.1.100'
                },
                {
                  id: '2',
                  device: 'iPhone 15 - Safari',
                  location: 'Lagos, Nigeria',
                  lastActive: 'Il y a 2h',
                  isCurrent: false,
                  ip: '192.168.1.101'
                },
                {
                  id: '3',
                  device: 'MacBook Pro - Firefox',
                  location: 'Abidjan, Côte d\'Ivoire',
                  lastActive: 'Hier',
                  isCurrent: false,
                  ip: '192.168.1.102'
                }
              ].map((session) => (
                <div key={session.id} className={`p-4 rounded-lg border ${
                  session.isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{session.device}</p>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">Actuel</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{session.location}</p>
                      <p className="text-xs text-gray-500 mt-1">IP: {session.ip}</p>
                      <p className="text-xs text-gray-500">Dernière activité: {session.lastActive}</p>
                    </div>
                    {!session.isCurrent && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Simuler la fermeture de session
                          toast({
                            title: "Fermeture en cours...",
                            description: `Fermeture de la session ${session.device}`,
                            variant: "default",
                          })
                          
                          setTimeout(() => {
                            toast({
                              title: "Session fermée !",
                              description: `Session ${session.device} fermée avec succès`,
                              variant: "default",
                            })
                          }, 1500)
                        }}
                      >
                        Fermer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowSessionsModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'export des données */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exporter mes données</DialogTitle>
            <DialogDescription>
              Téléchargez une copie de toutes vos données personnelles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Informations incluses</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Profil, commandes, points, partages, messages et préférences
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Format d'export</Label>
                <Select defaultValue="json">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Recommandé)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Période</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les données</SelectItem>
                    <SelectItem value="last30">30 derniers jours</SelectItem>
                    <SelectItem value="last90">90 derniers jours</SelectItem>
                    <SelectItem value="last365">1 an</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowExportModal(false)}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // Récupérer les valeurs sélectionnées
                  const formatSelect = document.querySelector('select[defaultValue="json"]') as HTMLSelectElement
                  const periodSelect = document.querySelector('select[defaultValue="all"]') as HTMLSelectElement
                  
                  const format = formatSelect?.value || 'json'
                  const period = periodSelect?.value || 'all'
                  
                  toast({
                    title: "Export en cours !",
                    description: `Export de vos données en ${format.toUpperCase()} pour la période ${period}`,
                    variant: "default",
                  })
                  
                  // Simuler l'export
                  setTimeout(() => {
                    // Créer un fichier d'exemple
                    let content = ''
                    let filename = ''
                    
                    if (format === 'json') {
                      content = JSON.stringify({
                        user: {
                          profile: "Données du profil",
                          orders: "Historique des commandes",
                          points: "Historique des points",
                          shares: "Historique des partages"
                        },
                        exportDate: new Date().toISOString(),
                        period: period
                      }, null, 2)
                      filename = `donnees-utilisateur-${new Date().toISOString().split('T')[0]}.json`
                    } else if (format === 'csv') {
                      content = `Type,Données,Date\nProfil,Données du profil,${new Date().toISOString()}\nCommandes,Historique des commandes,${new Date().toISOString()}\nPoints,Historique des points,${new Date().toISOString()}\nPartages,Historique des partages,${new Date().toISOString()}`
                      filename = `donnees-utilisateur-${new Date().toISOString().split('T')[0]}.csv`
                    } else {
                      content = "Données utilisateur exportées en PDF"
                      filename = `donnees-utilisateur-${new Date().toISOString().split('T')[0]}.txt`
                    }
                    
                    // Créer et télécharger le fichier
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = filename
                    link.style.visibility = 'hidden'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                    
                    toast({
                      title: "Export terminé !",
                      description: `Vos données ont été exportées en ${format.toUpperCase()} avec succès`,
                      variant: "default",
                    })
                    
                    setShowExportModal(false)
                  }, 3000)
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter les données
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression de compte */}
      <Dialog open={showDeleteAccountModal} onOpenChange={setShowDeleteAccountModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer mon compte</DialogTitle>
            <DialogDescription>
              Cette action est irréversible et supprimera définitivement votre compte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700">Attention !</p>
                  <p className="text-xs text-red-600 mt-1">
                    La suppression de votre compte entraînera la perte de :
                  </p>
                  <ul className="text-xs text-red-600 mt-2 list-disc list-inside">
                    <li>Tous vos points et récompenses</li>
                    <li>Votre historique d'achats</li>
                    <li>Vos partages et interactions</li>
                    <li>Vos données personnelles</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Tapez "SUPPRIMER" pour confirmer</Label>
              <Input
                id="delete-confirm"
                placeholder="SUPPRIMER"
                className="uppercase"
                onChange={(e) => {
                  const confirmText = e.target.value
                  const deleteButton = document.querySelector('button[disabled="true"]') as HTMLButtonElement
                  if (deleteButton) {
                    deleteButton.disabled = confirmText !== 'SUPPRIMER'
                  }
                }}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowDeleteAccountModal(false)}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                disabled={true}
                onClick={() => {
                  toast({
                    title: "Suppression en cours...",
                    description: "Votre compte est en cours de suppression",
                    variant: "default",
                  })
                  
                  setTimeout(() => {
                    toast({
                      title: "Compte supprimé !",
                      description: "Votre compte a été supprimé définitivement",
                      variant: "default",
                    })
                    setShowDeleteAccountModal(false)
                    
                    // Rediriger vers la page d'accueil après suppression
                    setTimeout(() => {
                      if (typeof window !== 'undefined') {
                        window.location.href = '/'
                      }
                    }, 2000)
                  }, 3000)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de politique de confidentialité */}
      <Dialog open={showPrivacyPolicyModal} onOpenChange={setShowPrivacyPolicyModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Politique de Confidentialité</DialogTitle>
            <DialogDescription>
              Dernière mise à jour : 19 janvier 2024
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Collecte des informations</h3>
              <p className="text-gray-600">
                Nous collectons les informations que vous nous fournissez directement, telles que votre nom, 
                adresse e-mail, adresse postale et informations de paiement lorsque vous créez un compte, 
                effectuez un achat ou nous contactez.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Utilisation des informations</h3>
              <p className="text-gray-600">
                Nous utilisons vos informations pour traiter vos commandes, vous fournir un service client, 
                vous envoyer des communications marketing (avec votre consentement) et améliorer nos services.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Partage des informations</h3>
              <p className="text-gray-600">
                Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. 
                Nous pouvons partager vos informations avec des fournisseurs de services de confiance 
                qui nous aident à exploiter notre site web et à vous servir.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Sécurité des données</h3>
              <p className="text-gray-600">
                Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations 
                personnelles contre tout accès non autorisé, altération, divulgation ou destruction.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowPrivacyPolicyModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des conditions d'utilisation */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conditions d'Utilisation</DialogTitle>
            <DialogDescription>
              Dernière mise à jour : 19 janvier 2024
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Acceptation des conditions</h3>
              <p className="text-gray-600">
                En utilisant notre plateforme, vous acceptez d'être lié par ces conditions d'utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Utilisation du service</h3>
              <p className="text-gray-600">
                Vous acceptez d'utiliser notre service uniquement à des fins légales et conformément 
                à ces conditions. Vous vous engagez à ne pas utiliser le service de manière abusive.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Compte utilisateur</h3>
              <p className="text-gray-600">
                Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot de passe. 
                Vous acceptez d'assumer la responsabilité de toutes les activités qui se produisent sous votre compte.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Modifications des conditions</h3>
              <p className="text-gray-600">
                Nous nous réservons le droit de modifier ces conditions à tout moment. 
                Les modifications prendront effet immédiatement après leur publication sur le site.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowTermsModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Détails de Commande */}
      <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#ff6600]" />
              <span>Détails de la Commande</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur votre commande
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* En-tête de la commande */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de commande</p>
                    <p className="font-semibold">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <Badge className={`${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status === 'delivered' ? 'Livrée' : 
                       selectedOrder.status === 'shipped' ? 'Expédiée' :
                       selectedOrder.status === 'confirmed' ? 'Confirmée' :
                       selectedOrder.status === 'pending' ? 'En attente' : 'Annulée'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Livraison</p>
                    <p className="font-semibold">{selectedOrder.deliveryOption || 'Standard'}</p>
                  </div>
                </div>
              </div>

              {/* Articles de la commande */}
              <div>
                <h4 className="font-medium mb-3">Articles commandés</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#ff6600] rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.price)}</p>
                        <p className="text-xs text-[#ff6600]">{Math.round(item.price / 10)} points</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total et actions */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Total</span>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#ff6600]">{formatCurrency(selectedOrder.total)}</p>
                    <p className="text-sm text-[#ff6600]">{Math.round(selectedOrder.total / 10)} points</p>
                  </div>
                </div>
                
                {/* Actions rapides */}
                <div className="flex items-center space-x-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrder.id)
                      toast({
                        title: "Numéro copié !",
                        description: "Le numéro de commande a été copié",
                        variant: "default",
                      })
                    }}
                    className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copier le numéro
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      // Générer et télécharger la facture
                      generateAndDownloadInvoice(selectedOrder)
                    }}
                    className="hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Télécharger facture
                  </Button>
                  
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Partager
                    </Button>
                    
                    {/* Menu de partage moderne */}
                    {showShareMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                        <div className="p-3 border-b border-gray-100">
                          <h4 className="text-sm font-medium text-gray-900">Partager cette commande</h4>
                        </div>
                        <div className="p-2 space-y-1">
                          {/* Facebook */}
                          <button
                            onClick={() => {
                              const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/orders/' + selectedOrder.id)}&quote=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster`)}`
                              window.open(url, '_blank', 'width=600,height=400')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage Facebook",
                                description: "Ouverture de Facebook...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Facebook</span>
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => {
                              const url = `https://wa.me/?text=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster - ${window.location.origin}/orders/${selectedOrder.id}`)}`
                              window.open(url, '_blank')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage WhatsApp",
                                description: "Ouverture de WhatsApp...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">WhatsApp</span>
                          </button>

                          {/* Twitter/X */}
                          <button
                            onClick={() => {
                              const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster`)}&url=${encodeURIComponent(window.location.origin + '/orders/' + selectedOrder.id)}`
                              window.open(url, '_blank', 'width=600,height=400')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage Twitter/X",
                                description: "Ouverture de Twitter...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-black transition-colors group"
                          >
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-black">Twitter/X</span>
                          </button>

                          {/* Telegram */}
                          <button
                            onClick={() => {
                              const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/orders/' + selectedOrder.id)}&text=${encodeURIComponent(`J'ai commandé pour ${formatCurrency(selectedOrder.total)} sur Pro Booster`)}`
                              window.open(url, '_blank')
                              setShowShareMenu(false)
                              toast({
                                title: "Partage Telegram",
                                description: "Ouverture de Telegram...",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.125-1.63z"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Telegram</span>
                          </button>

                          {/* Copier le lien */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + '/orders/' + selectedOrder.id)
                              setShowShareMenu(false)
                              toast({
                                title: "Lien copié !",
                                description: "Le lien de la commande a été copié",
                                variant: "default",
                              })
                            }}
                            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                              <Copy className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-600">Copier le lien</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {selectedOrder.status === 'delivered' && (
                    <Button 
                      variant="outline"
                      className="w-full hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                      onClick={() => {
                        setShowOrderDetailsModal(false)
                        setSelectedOrderForAction(selectedOrder)
                        setShowOrderEvaluationModal(true)
                      }}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Évaluer
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'shipped' && (
                    <Button 
                      variant="outline"
                      className="w-full hover:bg-green-50 hover:text-green-600 transition-colors"
                      onClick={() => {
                        setShowOrderDetailsModal(false)
                        setSelectedOrderForAction(selectedOrder)
                        setShowOrderTrackingModal(true)
                      }}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Suivre
                    </Button>
                  )}
                  
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white transition-colors"
                    onClick={() => {
                      toast({
                        title: "Suivi activé !",
                        description: "Vous recevrez des mises à jour sur votre commande",
                        variant: "default",
                      })
                    }}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Suivre ma commande
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full hover:bg-gray-50 transition-colors"
                    onClick={() => setShowOrderDetailsModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Détails des Points */}
      <Dialog open={showPointsDetailsModal} onOpenChange={setShowPointsDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-[#ff6600]" />
              <span>Mes Points de Fidélité</span>
            </DialogTitle>
            <DialogDescription>
              Gérez et utilisez vos points de fidélité
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-6 px-6 scrollbar-modal" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {/* Résumé des points */}
            <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 p-6 rounded-lg text-white text-center">
              <div className="text-4xl font-bold mb-2">{userPoints.toLocaleString()}</div>
              <p className="text-lg opacity-90">Points disponibles</p>
              <p className="text-sm opacity-75 mt-2">
                Valeur: {formatCurrency(userPoints * 10)} • {userPoints} points
              </p>
            </div>

            {/* Historique des points */}
            <div>
              <h4 className="font-medium mb-3">Historique récent</h4>
              <div className="space-y-3">
                {[
                  { action: "Achat commande ORD-001", points: 450, date: "2024-01-15", type: "earned" },
                  { action: "Partage sur réseaux sociaux", points: 200, date: "2024-01-14", type: "earned" },
                  { action: "Achat commande ORD-002", points: 320, date: "2024-01-12", type: "earned" },
                  { action: "Utilisation promotion", points: -150, date: "2024-01-10", type: "spent" },
                  { action: "Bonus de bienvenue", points: 1000, date: "2024-01-08", type: "earned" },
                  { action: "Achat commande ORD-003", points: 280, date: "2024-01-05", type: "earned" },
                  { action: "Partage produit viral", points: 500, date: "2024-01-03", type: "earned" },
                  { action: "Utilisation coupon", points: -200, date: "2024-01-01", type: "spent" },
                  { action: "Achat commande ORD-004", points: 180, date: "2023-12-28", type: "earned" },
                  { action: "Bonus anniversaire", points: 250, date: "2023-12-25", type: "earned" }
                ].map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'earned' ? (
                          <Plus className="w-4 h-4 text-green-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.action}</p>
                        <p className="text-sm text-gray-600">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'earned' ? '+' : ''}{transaction.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques des points */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Statistiques</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {userPoints > 100000 ? '100K+' : userPoints.toLocaleString()}
                    </div>
                    <p className="text-sm text-blue-600">Total gagné</p>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(userPoints * 0.1)}
                    </div>
                    <p className="text-sm text-green-600">Points/mois</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Actions rapides</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-[#ff6600] hover:text-white transition-colors"
                  onClick={() => {
                    toast({
                      title: "Historique complet !",
                      description: "Ouverture de l'historique complet des points",
                      variant: "default",
                    })
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Historique complet
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-[#ff6600] hover:text-white transition-colors"
                  onClick={() => {
                    toast({
                      title: "Programme de fidélité !",
                      description: "Ouverture du programme de fidélité",
                      variant: "default",
                    })
                  }}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Programme fidélité
                </Button>
              </div>
            </div>
          </div>

          {/* Bouton de fermeture fixe en bas */}
          <div className="flex-shrink-0 border-t pt-4 mt-4 px-6 pb-6">
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowPointsDetailsModal(false)}
                className="hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Promotion */}
      <Dialog open={showPromotionModal} onOpenChange={setShowPromotionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-[#ff6600]" />
              <span>Promotion Spéciale</span>
            </DialogTitle>
            <DialogDescription>
              Détails et utilisation de votre promotion
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromotion && (
            <div className="space-y-6">
              {/* Détails de la promotion */}
              <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 p-6 rounded-lg text-white text-center">
                <h3 className="text-2xl font-bold mb-2">{selectedPromotion.title}</h3>
                <p className="text-lg opacity-90 mb-4">{selectedPromotion.description}</p>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <p className="text-sm opacity-75">Code promo</p>
                  <p className="text-2xl font-mono font-bold">{selectedPromotion.code}</p>
                </div>
                <p className="text-sm opacity-75 mt-3">
                  Se termine le {formatDate(selectedPromotion.endDate)}
                </p>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-[#ff6600]" />
                    <span>Conditions d'utilisation</span>
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Valable sur tous les smartphones</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Minimum d'achat: 25 000 F CFA</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Non cumulable avec d'autres promotions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>Se termine le {formatDate(selectedPromotion.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-[#ff6600]" />
                    <span>Statistiques</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedPromotion.type === 'flash' && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Promotion Flash</span>
                        </div>
                        <p className="text-xs text-red-600">Offre limitée dans le temps</p>
                      </div>
                    )}
                    
                    {selectedPromotion.maxUsage && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">Utilisations</span>
                          <span className="text-sm font-medium text-blue-800">
                            {selectedPromotion.usageCount}/{selectedPromotion.maxUsage}
                          </span>
                        </div>
                        <Progress 
                          value={(selectedPromotion.usageCount / selectedPromotion.maxUsage) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedPromotion.maxUsage - selectedPromotion.usageCount} utilisations restantes
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions principales */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-lg mb-4 text-center">Actions Disponibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selectedPromotion.code)
                        
                        // Mettre à jour le compteur d'utilisation
                        const currentUsage = promotionUsage[selectedPromotion.code] || 0
                        setPromotionUsage(prev => ({
                          ...prev,
                          [selectedPromotion.code]: currentUsage + 1
                        }))
                        
                        toast({
                          title: "Code copié avec succès !",
                          description: `Le code ${selectedPromotion.code} a été copié dans votre presse-papiers`,
                          variant: "default",
                        })
                      } catch (error) {
                        toast({
                          title: "Erreur de copie",
                          description: "Impossible de copier le code. Veuillez le noter manuellement.",
                          variant: "destructive",
                        })
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copier le code
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={() => {
                      // Simuler la navigation vers la boutique avec promotion active
                      setShowProductsModal(true)
                      
                      toast({
                        title: "Promotion activée !",
                        description: `La promotion ${selectedPromotion.code} est maintenant active pour votre navigation`,
                        variant: "default",
                      })
                    }}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Voir les produits
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Ouvrir la modale de partage
                      setShowShareModal(true)
                      
                      // Simuler le partage
                      const shareData = {
                        title: selectedPromotion.title,
                        text: selectedPromotion.description,
                        url: `${window.location.origin}/promotions/${selectedPromotion.code}`
                      }
                      
                      if (navigator.share && navigator.canShare(shareData)) {
                        navigator.share(shareData)
                      }
                      
                      toast({
                        title: "Partage réussi !",
                        description: "Promotion partagée sur vos réseaux sociaux",
                        variant: "default",
                      })
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>

              {/* Actions secondaires */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="ghost" 
                    className={`w-full ${
                      promotionFavorites.includes(selectedPromotion.code) 
                        ? 'text-red-500 bg-red-50 hover:bg-red-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const isFavorite = promotionFavorites.includes(selectedPromotion.code)
                      
                      if (isFavorite) {
                        // Retirer des favoris
                        setPromotionFavorites(prev => 
                          prev.filter(code => code !== selectedPromotion.code)
                        )
                        toast({
                          title: "Retiré des favoris !",
                          description: "Promotion retirée de vos favoris",
                          variant: "default",
                        })
                      } else {
                        // Ajouter aux favoris
                        setPromotionFavorites(prev => [...prev, selectedPromotion.code])
                        toast({
                          title: "Ajouté aux favoris !",
                          description: "Promotion ajoutée à vos favoris",
                          variant: "default",
                        })
                      }
                    }}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${
                      promotionFavorites.includes(selectedPromotion.code) ? 'fill-current' : ''
                    }`} />
                    {promotionFavorites.includes(selectedPromotion.code) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className={`w-full ${
                      promotionAlerts.includes(selectedPromotion.code) 
                        ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      const hasAlert = promotionAlerts.includes(selectedPromotion.code)
                      
                      if (hasAlert) {
                        // Désactiver les alertes
                        setPromotionAlerts(prev => 
                          prev.filter(code => code !== selectedPromotion.code)
                        )
                        toast({
                          title: "Alertes désactivées !",
                          description: "Vous ne recevrez plus d'alertes pour cette promotion",
                          variant: "default",
                        })
                      } else {
                        // Activer les alertes
                        setPromotionAlerts(prev => [...prev, selectedPromotion.code])
                        toast({
                          title: "Alertes activées !",
                          description: "Vous recevrez des notifications pour cette promotion",
                          variant: "default",
                        })
                      }
                    }}
                  >
                    <Bell className={`w-4 h-4 mr-2 ${
                      promotionAlerts.includes(selectedPromotion.code) ? 'fill-current' : ''
                    }`} />
                    {promotionAlerts.includes(selectedPromotion.code) ? 'Désactiver les alertes' : 'Activer les alertes'}
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowPromotionModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mini-Modale Promotion Spéciale */}
      <Dialog open={showSpecialPromotionModal} onOpenChange={setShowSpecialPromotionModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#ff6600]" />
              <span>Promotion Spéciale</span>
            </DialogTitle>
            <DialogDescription>
              Détails complets et actions disponibles
            </DialogDescription>
          </DialogHeader>
          
          {selectedSpecialPromotion && (
            <div className="flex-1 overflow-y-auto space-y-6 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* En-tête de la promotion avec gradient */}
              <div className={`bg-gradient-to-br ${selectedSpecialPromotion.color} ${selectedSpecialPromotion.textColor} p-8 rounded-lg text-center`}>
                <h2 className="text-3xl font-bold mb-3">{selectedSpecialPromotion.title}</h2>
                <p className="text-xl opacity-90 mb-4">{selectedSpecialPromotion.description}</p>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
                  <p className="text-sm opacity-75 mb-1">Date de fin</p>
                  <p className="text-2xl font-bold">{formatDate(selectedSpecialPromotion.endDate)}</p>
                </div>
              </div>

              {/* Détails et conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <Info className="w-5 h-5 text-[#ff6600]" />
                    <span>Informations</span>
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Promotion exclusive et limitée</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Valable sur tous les produits éligibles</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Non cumulable avec d'autres offres</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span>Temps limité : {formatDate(selectedSpecialPromotion.endDate)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-[#ff6600]" />
                    <span>Produits Éligibles</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedSpecialPromotion.title === "Black Friday" && (
                      <>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Smartphone className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Smartphones et tablettes</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Monitor className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Ordinateurs et accessoires</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Headphones className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Audio et gaming</span>
                        </div>
                      </>
                    )}
                    {selectedSpecialPromotion.title === "Cyber Monday" && (
                      <>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Laptop className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Technologies avancées</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Camera className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Photo et vidéo</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Gamepad className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Gaming et divertissement</span>
                        </div>
                      </>
                    )}
                    {selectedSpecialPromotion.title === "Boxing Day" && (
                      <>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <ShoppingBag className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Mode et accessoires</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Home className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Maison et jardin</span>
                        </div>
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                          <Heart className="w-4 h-4 text-[#ff6600]" />
                          <span className="text-sm">Beauté et bien-être</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions principales */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-lg mb-4 text-center">Actions Disponibles</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white"
                    onClick={() => navigateToShopWithPromotion(selectedSpecialPromotion.title)}
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Voir les produits
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                    onClick={() => shareSpecialPromotion(selectedSpecialPromotion)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className={`w-full ${
                      promotionFavorites.includes(selectedSpecialPromotion.title) 
                        ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100' 
                        : ''
                    }`}
                    onClick={() => togglePromotionFavorite(selectedSpecialPromotion.title)}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${
                      promotionFavorites.includes(selectedSpecialPromotion.title) ? 'fill-current' : ''
                    }`} />
                    {promotionFavorites.includes(selectedSpecialPromotion.title) ? 'Retirer des favoris' : 'Favoris'}
                  </Button>
                </div>
              </div>

              {/* Actions secondaires */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={openPromotionHistory}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Historique des promotions
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className={`w-full ${
                      promotionAlerts.includes(selectedSpecialPromotion.title) 
                        ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => togglePromotionAlerts(selectedSpecialPromotion.title)}
                  >
                    <Bell className={`w-4 h-4 mr-2 ${
                      promotionAlerts.includes(selectedSpecialPromotion.title) ? 'fill-current' : ''
                    }`} />
                    {promotionAlerts.includes(selectedSpecialPromotion.title) ? 'Désactiver les alertes' : 'Activer les alertes'}
                  </Button>
                </div>
                
                <div className="mt-4 pb-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowSpecialPromotionModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale d'Historique des Promotions */}
      <Dialog open={showPromotionHistoryModal} onOpenChange={setShowPromotionHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#ff6600]" />
              <span>Historique des Promotions</span>
            </DialogTitle>
            <DialogDescription>
              Consultez l'historique complet de vos promotions utilisées
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {promotionHistory.length > 0 ? (
              <div className="space-y-4">
                {promotionHistory.map((promo, index) => (
                  <Card key={index} className="border-l-4 border-l-[#ff6600]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-gray-900">{promo.title}</h4>
                          <p className="text-sm text-gray-600">Type: {promo.type}</p>
                          <p className="text-sm text-gray-600">Valeur: {promo.value}</p>
                          <p className="text-xs text-gray-500">
                            Appliquée le {formatDate(promo.appliedAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            Utilisée
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Ici on pourrait réappliquer la promotion si elle est encore valide
                              toast({
                                title: "Promotion réappliquée !",
                                description: `${promo.title} a été réactivée`,
                                variant: "default",
                              })
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Réappliquer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun historique</h3>
                <p className="text-gray-500">
                  Vous n'avez pas encore utilisé de promotions. Commencez par en appliquer une !
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowPromotionHistoryModal(false)}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale des Produits avec Promotion */}
      <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-[#ff6600]" />
              <span>Produits Éligibles à la Promotion</span>
            </DialogTitle>
            <DialogDescription>
              {selectedPromotion && `Promotion ${selectedPromotion.code} active - ${selectedPromotion.description}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Filtres et recherche */}
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input 
                  placeholder="Rechercher des produits..." 
                  className="w-full"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="smartphones">Smartphones</SelectItem>
                  <SelectItem value="tablets">Tablettes</SelectItem>
                  <SelectItem value="laptops">Ordinateurs</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>

            {/* Liste des produits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 1,
                  name: "iPhone 15 Pro Max",
                  price: 450000,
                  originalPrice: 500000,
                  image: "/placeholder.jpg",
                  discount: 10,
                  inStock: true
                },
                {
                  id: 2,
                  name: "Samsung Galaxy S24",
                  price: 380000,
                  originalPrice: 420000,
                  image: "/placeholder.jpg",
                  discount: 9,
                  inStock: true
                },
                {
                  id: 3,
                  name: "Xiaomi 14 Pro",
                  price: 320000,
                  originalPrice: 380000,
                  image: "/placeholder.jpg",
                  discount: 16,
                  inStock: false
                }
              ].map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="relative mb-3">
                      <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      {product.discount > 0 && (
                        <Badge className="absolute top-2 right-2 bg-[#ff6600] text-white">
                          -{product.discount}%
                        </Badge>
                      )}
                      {!product.inStock && (
                        <Badge variant="secondary" className="absolute top-2 left-2">
                          Rupture
                        </Badge>
                      )}
                    </div>
                    
                    <h3 className="font-semibold mb-2">{product.name}</h3>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-lg font-bold text-[#ff6600]">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-[#ff6600] hover:bg-[#e55a00]"
                        disabled={!product.inStock}
                        onClick={() => addProductToCartWithPromotion(product, selectedPromotion)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!product.inStock}
                        onClick={() => toggleProductFavorite(product.id)}
                        className={productFavorites.includes(product.id) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}
                      >
                        <Heart className={`w-4 h-4 ${productFavorites.includes(product.id) ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions de la promotion */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Promotion {selectedPromotion?.code} active sur tous les produits
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowProductsModal(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale de Partage */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-[#ff6600]" />
              <span>Partager la Promotion</span>
            </DialogTitle>
            <DialogDescription>
              Partagez cette promotion avec vos amis et votre réseau
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Options de partage */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank')
                  toast({
                    title: "Partagé sur Facebook !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-blue-600 rounded mr-2" />
                Facebook
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
                  toast({
                    title: "Partagé sur Twitter !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-blue-400 rounded mr-2" />
                Twitter
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
                  toast({
                    title: "Partagé sur WhatsApp !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-green-600 rounded mr-2" />
                WhatsApp
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                onClick={() => {
                  const url = `${window.location.origin}/promotions/${selectedPromotion?.code}`
                  const text = `${selectedPromotion?.title}: ${selectedPromotion?.description}`
                  window.open(`https://www.instagram.com/?url=${encodeURIComponent(url)}`, '_blank')
                  toast({
                    title: "Partagé sur Instagram !",
                    description: "Votre promotion a été partagée",
                    variant: "default",
                  })
                }}
              >
                <div className="w-6 h-6 bg-purple-600 rounded mr-2" />
                Instagram
              </Button>
            </div>

            {/* Lien direct */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lien direct</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  value={`${window.location.origin}/promotions/${selectedPromotion?.code}`}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/promotions/${selectedPromotion?.code}`)
                    toast({
                      title: "Lien copié !",
                      description: "Le lien a été copié dans votre presse-papiers",
                      variant: "default",
                    })
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale d'évaluation de commande */}
      <Dialog open={showOrderEvaluationModal} onOpenChange={setShowOrderEvaluationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Évaluer votre commande</span>
            </DialogTitle>
            <DialogDescription>
              Donnez votre avis sur cette commande et aidez d'autres acheteurs
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderForAction && (
            <div className="space-y-4">
              {/* Détails de la commande */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Commande {selectedOrderForAction.id}</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrderForAction.items[0].name} {selectedOrderForAction.items.length > 1 && `+${selectedOrderForAction.items.length - 1} autres`}
                </p>
                <p className="text-sm text-gray-600">
                  Livrée le {formatDate(selectedOrderForAction.createdAt)}
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="text-sm font-medium">Note globale</label>
                <div className="flex items-center space-x-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setEvaluationRating(star)}
                      className={`text-2xl ${star <= evaluationRating ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {evaluationRating === 1 && "Très mauvais"}
                  {evaluationRating === 2 && "Mauvais"}
                  {evaluationRating === 3 && "Moyen"}
                  {evaluationRating === 4 && "Bon"}
                  {evaluationRating === 5 && "Excellent"}
                </p>
              </div>

              {/* Commentaire */}
              <div>
                <label className="text-sm font-medium">Commentaire (optionnel)</label>
                <textarea
                  value={evaluationComment}
                  onChange={(e) => setEvaluationComment(e.target.value)}
                  placeholder="Partagez votre expérience..."
                  className="w-full mt-2 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowOrderEvaluationModal(false)}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00]"
                  onClick={() => {
                    toast({
                      title: "Évaluation envoyée !",
                      description: "Merci pour votre avis",
                      variant: "default",
                    })
                    setShowOrderEvaluationModal(false)
                    setEvaluationComment('')
                    setEvaluationRating(5)
                  }}
                >
                  Envoyer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale de suivi de commande */}
      <Dialog open={showOrderTrackingModal} onOpenChange={setShowOrderTrackingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-green-500" />
              <span>Suivi de commande</span>
            </DialogTitle>
            <DialogDescription>
              Suivez l'état de votre commande en temps réel
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderForAction && (
            <div className="space-y-4">
              {/* Détails de la commande */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Commande {selectedOrderForAction.id}</h4>
                <p className="text-sm text-gray-600">
                  {selectedOrderForAction.items[0].name} {selectedOrderForAction.items.length > 1 && `+${selectedOrderForAction.items.length - 1} autres`}
                </p>
                <p className="text-sm text-gray-600">
                  Expédiée le {formatDate(selectedOrderForAction.createdAt)}
                </p>
              </div>

              {/* Statut de livraison */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Commande confirmée</p>
                    <p className="text-xs text-gray-500">15 janvier 2024 à 10:30</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">En préparation</p>
                    <p className="text-xs text-gray-500">15 janvier 2024 à 14:15</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Expédiée</p>
                    <p className="text-xs text-gray-500">16 janvier 2024 à 09:00</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">En transit</p>
                    <p className="text-xs text-gray-500">En cours de livraison</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Livraison prévue</p>
                    <p className="text-xs text-gray-500">18 janvier 2024</p>
                  </div>
                </div>
              </div>

              {/* Code de suivi */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-1">Code de suivi</p>
                <div className="flex items-center space-x-2">
                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">TRK-{selectedOrderForAction.id.slice(-6)}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`TRK-${selectedOrderForAction.id.slice(-6)}`)
                      toast({
                        title: "Code copié !",
                        description: "Le code de suivi a été copié",
                        variant: "default",
                      })
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowOrderTrackingModal(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00]"
                  onClick={() => {
                    toast({
                      title: "Notifications activées !",
                      description: "Vous recevrez des mises à jour sur votre commande",
                      variant: "default",
                    })
                  }}
                >
                  Activer les notifications
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails des produits partagés */}
      <Dialog open={showProductDetailsModal} onOpenChange={setShowProductDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Eye className="w-6 h-6 text-blue-600" />
              <span>Détails du Produit Partagé</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le produit et ses performances de partage
            </DialogDescription>
          </DialogHeader>
          
          {selectedProductForDetails && (
            <div className="space-y-6">
              {/* En-tête du produit */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-6">
                  <img
                    src={selectedProductForDetails.productImage}
                    alt={selectedProductForDetails.productName}
                    className="w-24 h-24 rounded-xl object-cover shadow-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedProductForDetails.productName}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Partagé le {formatDate(selectedProductForDetails.sharedAt)}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedProductForDetails.totalShares}</div>
                        <div className="text-sm text-gray-600">Total partages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">+{selectedProductForDetails.pointsEarned}</div>
                        <div className="text-sm text-gray-600">Points gagnés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{selectedProductForDetails.pointsUsed}</div>
                        <div className="text-sm text-gray-600">Points utilisés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedProductForDetails.pointsAvailable}</div>
                        <div className="text-sm text-gray-600">Points disponibles</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiques détaillées par réseau social */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span>Performance par Réseau Social</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Facebook */}
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{selectedProductForDetails.shares.facebook}</div>
                      <div className="text-sm text-gray-600">Partages Facebook</div>
                      <div className="text-xs text-blue-500 mt-1">
                        {Math.round((selectedProductForDetails.shares.facebook / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{selectedProductForDetails.shares.whatsapp}</div>
                      <div className="text-sm text-gray-600">Partages WhatsApp</div>
                      <div className="text-xs text-green-500 mt-1">
                        {Math.round((selectedProductForDetails.shares.whatsapp / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>

                    {/* Twitter/X */}
                    <div className="text-center p-4 bg-black rounded-lg border border-gray-300">
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedProductForDetails.shares.twitter}</div>
                      <div className="text-sm text-gray-300">Partages Twitter/X</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {Math.round((selectedProductForDetails.shares.twitter / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg border border-purple-300">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.058 1.644-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-white">{selectedProductForDetails.shares.instagram}</div>
                      <div className="text-sm text-gray-200">Partages Instagram</div>
                      <div className="text-xs text-gray-300 mt-1">
                        {Math.round((selectedProductForDetails.shares.instagram / selectedProductForDetails.totalShares) * 100)}% du total
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span>Actions Rapides</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Partager à nouveau */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setShowProductDetailsModal(false)
                        setOpenProductShareMenu(selectedProductForDetails.id)
                        toast({
                          title: "Menu de partage ouvert",
                          description: "Vous pouvez maintenant partager ce produit",
                          variant: "default",
                        })
                      }}
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </Button>

                    {/* Voir le produit */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Redirection...",
                          description: "Ouverture de la page du produit",
                          variant: "default",
                        })
                        // Simuler l'ouverture de la page produit
                        setTimeout(() => {
                          window.open(`/products/${selectedProductForDetails.productId}`, '_blank')
                        }, 1000)
                      }}
                      className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir produit
                    </Button>

                    {/* Copier le lien */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/products/${selectedProductForDetails.productId}`)
                        toast({
                          title: "Lien copié !",
                          description: "Le lien du produit a été copié",
                          variant: "default",
                        })
                      }}
                      className="hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier lien
                    </Button>

                    {/* Télécharger rapport */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Générer un rapport spécifique pour ce produit
                        generateProductSpecificReport(selectedProductForDetails)
                      }}
                      className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Rapport
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Historique des actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <span>Historique des Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">Partage réussi</p>
                          <p className="text-xs text-green-600">Facebook - 15 partages</p>
                        </div>
                      </div>
                      <span className="text-xs text-green-600">Il y a 2h</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Gift className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">Points gagnés</p>
                          <p className="text-xs text-blue-600">+{selectedProductForDetails.pointsEarned} points</p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-600">Il y a 1j</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-800">Performance améliorée</p>
                          <p className="text-xs text-purple-600">+25% de partages</p>
                        </div>
                      </div>
                      <span className="text-xs text-purple-600">Il y a 3j</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boutons d'action principaux */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowProductDetailsModal(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] text-white"
                  onClick={() => {
                    toast({
                      title: "Actions en cours...",
                      description: "Traitement de vos demandes",
                      variant: "default",
                    })
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Actions groupées
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'achat de points */}
      <Dialog open={showPointsPurchaseModal} onOpenChange={setShowPointsPurchaseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <span>Acheter des Points</span>
            </DialogTitle>
            <DialogDescription>
              Choisissez votre forfait et procédez au paiement sécurisé
            </DialogDescription>
          </DialogHeader>
          
          {selectedPointsOffer && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Détails de l'offre sélectionnée */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-900 mb-2">
                      {selectedPointsOffer.points.toLocaleString()} points
                    </div>
                    <div className="text-2xl font-bold text-purple-600 mb-3">
                      {formatCurrency(selectedPointsOffer.price)}
                    </div>
                    {selectedPointsOffer.bonus > 0 && (
                      <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2 mb-4">
                        +{selectedPointsOffer.bonus} points bonus inclus !
                      </Badge>
                    )}
                    <div className="text-sm text-gray-600">
                      Taux de conversion: 1 point = 10 F CFA
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Options de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    <span>Méthode de Paiement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'mobile-money' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('mobile-money')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="mobile-money" 
                        checked={selectedPaymentMethod === 'mobile-money'}
                        onChange={() => setSelectedPaymentMethod('mobile-money')}
                      />
                      <label htmlFor="mobile-money" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Mobile Money</span>
                      </label>
                    </div>
                    
                    <div 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'bank-transfer' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('bank-transfer')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="bank-transfer" 
                        checked={selectedPaymentMethod === 'bank-transfer'}
                        onChange={() => setSelectedPaymentMethod('bank-transfer')}
                      />
                      <label htmlFor="bank-transfer" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Building className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Virement Bancaire</span>
                      </label>
                    </div>
                    
                    <div 
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'card' 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPaymentMethod('card')}
                    >
                      <input 
                        type="radio" 
                        name="payment" 
                        id="card" 
                        checked={selectedPaymentMethod === 'card'}
                        onChange={() => setSelectedPaymentMethod('card')}
                      />
                      <label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">Carte Bancaire</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulaire de paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Détails de Paiement</span>
                  </CardTitle>
                  <CardDescription>
                    Remplissez les informations requises pour votre méthode de paiement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPaymentMethod === 'mobile-money' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="phone-number" className="text-sm font-medium text-gray-700">
                          Numéro de téléphone
                        </Label>
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="+229 91 50 57 57"
                          value={paymentDetails.phoneNumber}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Entrez le numéro associé à votre compte Mobile Money
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'bank-transfer' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="bank-account" className="text-sm font-medium text-gray-700">
                          Numéro de compte bancaire
                        </Label>
                        <Input
                          id="bank-account"
                          type="text"
                          placeholder="1234567890"
                          value={paymentDetails.bankAccount}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, bankAccount: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account-name" className="text-sm font-medium text-gray-700">
                          Nom du titulaire du compte
                        </Label>
                        <Input
                          id="account-name"
                          type="text"
                          placeholder="John Doe"
                          value={paymentDetails.accountName}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, accountName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {selectedPaymentMethod === 'card' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="card-number" className="text-sm font-medium text-gray-700">
                          Numéro de carte
                        </Label>
                        <Input
                          id="card-number"
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={paymentDetails.cardNumber}
                          onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                          className="mt-1"
                          maxLength={19}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="card-expiry" className="text-sm font-medium text-gray-700">
                            Date d'expiration
                          </Label>
                          <Input
                            id="card-expiry"
                            type="text"
                            placeholder="MM/YY"
                            value={paymentDetails.cardExpiry}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardExpiry: e.target.value }))}
                            className="mt-1"
                            maxLength={5}
                          />
                        </div>
                        <div>
                          <Label htmlFor="card-cvv" className="text-sm font-medium text-gray-700">
                            CVV
                          </Label>
                          <Input
                            id="card-cvv"
                            type="text"
                            placeholder="123"
                            value={paymentDetails.cardCvv}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardCvv: e.target.value }))}
                            className="mt-1"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Résumé de la commande */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span>Résumé de la Commande</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Points de base:</span>
                      <span className="font-medium">{selectedPointsOffer.points.toLocaleString()} points</span>
                    </div>
                    {selectedPointsOffer.bonus > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Points bonus:</span>
                        <span className="font-medium">+{selectedPointsOffer.bonus} points</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Prix total:</span>
                      <span className="font-medium">{formatCurrency(selectedPointsOffer.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frais de transaction:</span>
                      <span className="font-medium">{formatCurrency(selectedPointsOffer.price * 0.02)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total à payer:</span>
                      <span className="text-blue-600">{formatCurrency(selectedPointsOffer.price * 1.02)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boutons d'action */}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowPointsPurchaseModal(false)
                    resetPaymentProcess()
                  }}
                  disabled={isProcessingPayment}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={processPayment}
                  disabled={!validatePaymentDetails() || isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Procéder au Paiement
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails du produit recommandé */}
      <Dialog open={showProductDetailsModal} onOpenChange={setShowProductDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <span>Détails du Produit Recommandé</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes et recommandations IA pour ce produit
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Image et badges */}
              <div className="relative">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
                {selectedProduct.promotion && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-red-500 text-white animate-pulse text-lg px-4 py-2">
                      {selectedProduct.promotion.value}
                    </Badge>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                    IA: {selectedProduct.aiConfidence}%
                  </Badge>
                </div>
              </div>

              {/* Informations du produit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-gray-600">{selectedProduct.category}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                      <span className="font-medium">{selectedProduct.rating}</span>
                      <span className="text-gray-500">({selectedProduct.reviews} avis)</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prix actuel:</span>
                      <div className="text-2xl font-bold text-green-600">
                        {formatValueWithPoints(selectedProduct.price, true)}
                      </div>
                    </div>
                    {selectedProduct.originalPrice > selectedProduct.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prix original:</span>
                        <div className="text-lg text-gray-500 line-through">
                          {formatValueWithPoints(selectedProduct.originalPrice, true)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Vendeur</h4>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedProduct.seller && selectedProduct.seller.length > 0 ? selectedProduct.seller[0] : '?'}
                      </div>
                      <div>
                        <p className="font-medium">{selectedProduct.seller}</p>
                        <div className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-sm">{selectedProduct.sellerRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Analyse IA</h4>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700 font-medium">Pourquoi cette recommandation ?</p>
                      <p className="text-sm text-purple-600 mt-1">{selectedProduct.aiReason}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => addProductToCart(selectedProduct)}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ajouter au Panier
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => toggleProductFavorite(selectedProduct.id)}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Favoris
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => shareProduct(selectedProduct)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails du vendeur recommandé */}
      <Dialog open={showSellerDetailsModal} onOpenChange={setShowSellerDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-green-600" />
              <span>Profil du Vendeur</span>
            </DialogTitle>
            <DialogDescription>
              Informations détaillées et statistiques du vendeur
            </DialogDescription>
          </DialogHeader>
          
          {selectedSeller && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* En-tête du vendeur */}
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={selectedSeller.avatar} />
                  <AvatarFallback className="text-3xl">{selectedSeller.name && selectedSeller.name.length > 0 ? selectedSeller.name[0] : '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedSeller.name}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{selectedSeller.rating}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      IA: {selectedSeller.aiConfidence}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedSeller.totalSales.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Ventes totales</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedSeller.responseTime}</div>
                  <div className="text-sm text-gray-600">Temps de réponse</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedSeller.specialties.length}</div>
                  <div className="text-sm text-gray-600">Spécialités</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">98%</div>
                  <div className="text-sm text-gray-600">Satisfaction</div>
                </div>
              </div>

              {/* Spécialités */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Spécialités</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSeller.specialties.map((specialty: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Analyse IA */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Analyse IA</h4>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Pourquoi ce vendeur ?</p>
                  <p className="text-sm text-green-600 mt-1">{selectedSeller.aiReason}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => contactSeller(selectedSeller)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contacter
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => viewSellerProfile(selectedSeller)}
                >
                  <ExternalLink className="w-4 h-2" />
                  Voir Profil Complet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de détails de la promotion */}
      <Dialog open={showPromotionDetailsModal} onOpenChange={setShowPromotionDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="flex items-center space-x-3">
              <Tag className="w-6 h-6 text-orange-600" />
              <span>Détails de la Promotion</span>
            </DialogTitle>
            <DialogDescription>
              Informations complètes et conditions de la promotion
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromotion && (
            <div className="flex-1 overflow-y-auto space-y-6 px-6 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* En-tête de la promotion */}
              <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                <h3 className="text-2xl font-bold text-orange-900 mb-2">{selectedPromotion.title}</h3>
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Badge className="bg-orange-500 text-white text-lg px-4 py-2 animate-pulse">
                    {selectedPromotion.value}
                  </Badge>
                  <Badge className="bg-purple-500 text-white text-lg px-4 py-2">
                    IA Détectée
                  </Badge>
                </div>
                <p className="text-gray-700">{selectedPromotion.description}</p>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedPromotion.usageCount}</div>
                  <div className="text-sm text-gray-600">Utilisations</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatDate(selectedPromotion.endDate)}</div>
                  <div className="text-sm text-gray-600">Date de fin</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedPromotion.priority}/5</div>
                  <div className="text-sm text-gray-600">Priorité IA</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedPromotion.isActive ? 'Active' : 'Expirée'}
                  </div>
                  <div className="text-sm text-gray-600">Statut</div>
                </div>
              </div>

              {/* Conditions */}
              {selectedPromotion.conditions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Conditions d'utilisation</h4>
                  <div className="space-y-2">
                    {selectedPromotion.conditions.map((condition: string, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{condition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => applyPromotion(selectedPromotion)}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  En profiter
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => copyPromotionCode(selectedPromotion)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier le Code
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => togglePromotionFavorite(selectedPromotion.code)}
                  className={promotionFavorites.includes(selectedPromotion.code) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}
                >
                  <Heart className={`w-4 h-4 mr-2 ${promotionFavorites.includes(selectedPromotion.code) ? 'fill-current' : ''}`} />
                  {promotionFavorites.includes(selectedPromotion.code) ? 'Retirer' : 'Favoris'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => sharePromotion(selectedPromotion)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </div>
              
              {/* Actions secondaires */}
              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  variant="ghost" 
                  className={`w-full ${
                    promotionAlerts.includes(selectedPromotion.code) 
                      ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    const hasAlert = promotionAlerts.includes(selectedPromotion.code)
                    
                    if (hasAlert) {
                      // Désactiver les alertes
                      setPromotionAlerts(prev => 
                        prev.filter(code => code !== selectedPromotion.code)
                      )
                      toast({
                        title: "Alertes désactivées !",
                        description: "Vous ne recevrez plus d'alertes pour cette promotion",
                        variant: "default",
                      })
                    } else {
                      // Activer les alertes
                      setPromotionAlerts(prev => [...prev, selectedPromotion.code])
                      toast({
                        title: "Alertes activées !",
                        description: "Vous recevrez des notifications pour cette promotion",
                        variant: "default",
                      })
                    }
                  }}
                >
                  <Bell className={`w-4 h-4 mr-2 ${
                    promotionAlerts.includes(selectedPromotion.code) ? 'fill-current' : ''
                  }`} />
                  {promotionAlerts.includes(selectedPromotion.code) ? 'Désactiver les alertes' : 'Activer les alertes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de succès de promotion */}
      <Dialog open={showPromotionSuccessModal} onOpenChange={setShowPromotionSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>Promotion Appliquée !</span>
            </DialogTitle>
            <DialogDescription>
              Votre promotion a été activée avec succès
            </DialogDescription>
          </DialogHeader>
          
          {selectedPromotion && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {selectedPromotion.value}
                </div>
                <p className="text-sm text-green-700">{selectedPromotion.title}</p>
                <p className="text-xs text-green-600 mt-1">
                  Promotion active jusqu'au {formatDate(selectedPromotion.endDate)}
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Code de promotion:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                    {selectedPromotion.code || `PROMO-${selectedPromotion.id.slice(-6).toUpperCase()}`}
                  </code>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Utilisations restantes:</span>
                  <span className="font-medium">
                    {selectedPromotion.maxUsage ? selectedPromotion.maxUsage - (promotionUsage[selectedPromotion.id] || 0) : 'Illimité'}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPromotionSuccessModal(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowPromotionSuccessModal(false)
                    // Ouvrir le modal des produits éligibles à la promotion
                    setShowProductsModal(true)
                    toast({
                      title: "Produits éligibles !",
                      description: "Affichage des produits concernés par cette promotion",
                      variant: "default",
                    })
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Voir les Produits
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de produit ajouté au panier */}
      <Dialog open={showProductAddedModal} onOpenChange={setShowProductAddedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span>Produit Ajouté !</span>
            </DialogTitle>
            <DialogDescription>
              Votre produit a été ajouté au panier avec succès
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                  <div className="text-lg font-bold text-green-600">
                    {formatValueWithPoints(selectedProduct.price, true)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Quantité:</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Total panier:</span>
                  <div className="font-medium">
                    {formatValueWithPoints(productCart.reduce((sum, item) => sum + item.price, 0), true)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowProductAddedModal(false)}
                >
                  Continuer les Achats
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowProductAddedModal(false)
                    // Ouvrir directement le modal panier via un événement personnalisé
                    if (typeof window !== 'undefined') {
                      // Dispatcher un événement pour ouvrir le modal panier
                      window.dispatchEvent(new CustomEvent('openCartModal'))
                      toast({
                        title: "Panier ouvert !",
                        description: "Votre panier s'affiche maintenant",
                        variant: "default",
                      })
                    }
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Voir le Panier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



      {/* Modal de transfert de messages */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-blue-600" />
              <span>Transférer les Messages</span>
            </DialogTitle>
            <DialogDescription>
              Sélectionnez le vendeur vers lequel transférer {selectedMessageIds.length} message(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Liste des vendeurs disponibles */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Vendeurs disponibles :</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {mockSellers.map((seller) => (
                  <div
                    key={seller.name}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                      selectedTransferSeller === seller.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTransferSeller(seller.name)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={seller.avatar} alt={seller.name} />
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                        {seller.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{seller.name}</span>
                        {seller.isOnline && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{seller.lastMessage}</p>
                    </div>
                    {selectedTransferSeller === seller.name && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowTransferModal(false)
                  setSelectedTransferSeller(null)
                }}
              >
                Annuler
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={confirmTransfer}
                disabled={!selectedTransferSeller}
              >
                <Send className="h-4 w-4 mr-2" />
                Transférer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu de partage */}
      <Dialog open={showShareMenu} onOpenChange={setShowShareMenu}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              <span>Partager ce Produit</span>
            </DialogTitle>
            <DialogDescription>
              Choisissez votre plateforme de partage préférée
            </DialogDescription>
          </DialogHeader>
          
          {selectedItemForShare && (
            <div className="space-y-4">
              {/* Options de partage */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => executeShare('facebook', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-blue-600 rounded mr-2" />
                  Facebook
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  onClick={() => executeShare('twitter', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-blue-400 rounded mr-2" />
                  Twitter/X
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  onClick={() => executeShare('whatsapp', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-green-600 rounded mr-2" />
                  WhatsApp
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                  onClick={() => executeShare('telegram', selectedItemForShare)}
                >
                  <div className="w-6 h-6 bg-purple-600 rounded mr-2" />
                  Telegram
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  onClick={() => executeShare('email', selectedItemForShare)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                  onClick={() => executeShare('copy', selectedItemForShare)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier Lien
                </Button>
              </div>

              {/* Lien direct */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lien direct</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={`${window.location.origin}/product/${selectedItemForShare.id}`}
                    readOnly
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/product/${selectedItemForShare.id}`)
                      toast({
                        title: "Lien copié !",
                        description: "Le lien a été copié dans votre presse-papiers",
                        variant: "default",
                      })
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setShowShareMenu(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



    </div>
  )
}
