"use client"

import { useState } from 'react'
import { 
  LayoutDashboard, Package, ShoppingCart, TrendingUp, Trophy, MessageCircle,
  Share2, Tag, Gift, Star, BarChart3, User, Plus, Bell, HelpCircle, LogOut,
  Eye, Edit, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, DollarSign,
  Users, Target, Award, TrendingDown, Activity, Calendar, Search, Filter, Crown,
    ChevronDown, Mail, Send, Info, X, Phone, CreditCard, Settings, MapPin, Globe, Truck, Download, RefreshCw, Check
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

// Import des composants de sections
import ProductManagement from '@/components/seller-dashboard/product-management'
import OrderManagement from '@/components/seller-dashboard/order-management'
import RevenueManagement from '@/components/seller-dashboard/revenue-management'
import PointSection from '@/components/seller-dashboard/point-section'
import PaymentRequestsSection from '@/components/seller-dashboard/payment-requests-section'
import RankingSection from '@/components/seller-dashboard/ranking-section'

import SharesEngagementSection from '@/components/seller-dashboard/shares-engagement-section'
import MarketingPromotionsSection from '@/components/seller-dashboard/marketing-promotions-section'
import ReviewsSection from '@/components/seller-dashboard/reviews-section'
import StatisticsAnalyticsSection from '@/components/seller-dashboard/statistics-analytics-section'
import ProfileSection from '@/components/seller-dashboard/profile-section'

import AdvancedProductModal from '@/components/seller-dashboard/advanced-product-modal'
import InternalMessagingSection from '@/components/seller-dashboard/internal-messaging-section'

// Types pour le tableau de bord vendeur
interface SellerStats {
  totalSales: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  totalRevenue: number
  totalCommissions: number
  totalPoints: number
  averageRating: number
  totalReviews: number
  totalShares: number
  ranking: number
  totalVendors: number
}

interface SellerProduct {
  id: number
  name: string
  price: number
  originalPrice: number
  image: string
  category: string
  stock: number
  sales: number
  revenue: number
  shares: number
  rating: number
  reviews: number
  status: 'active' | 'inactive' | 'draft' | 'out_of_stock'
  createdAt: string
  updatedAt: string
  description?: string
  images?: string[]
  tags?: string[]
  seoTitle?: string
  seoDescription?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  shippingCost?: number
  isShareable?: boolean
  isPromoted?: boolean
}

interface SellerOrder {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  products: Array<{
    id: number
    name: string
    quantity: number
    price: number
    total: number
  }>
  totalAmount: number
  commission: number
  netRevenue: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: string
  orderDate: string
  deliveryDate?: string
  customerRating?: number
  customerReview?: string
  trackingNumber?: string
  shippingMethod?: string
  notes?: string
}

interface SellerRevenue {
  totalRevenue: number
  totalCommissions: number
  netRevenue: number
  pendingPayments: number
  completedPayments: number
  monthlyRevenue: number[]
  monthlyOrders: number[]
  topProducts: Array<{
    id: number
    name: string
    revenue: number
    sales: number
  }>
  revenueByCategory: Array<{
    category: string
    revenue: number
    percentage: number
  }>
  paymentHistory: Array<{
    id: string
    amount: number
    date: string
    method: string
    status: string
  }>
}

// Types pour le profil vendeur
interface SellerProfile {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  bio: string
  company: string
  website: string
  address: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  socialMedia: {
    facebook: string
    twitter: string
    instagram: string
    linkedin: string
  }
  verification: {
    isVerified: boolean
    verificationDate?: string
    documents: Array<{
      id: string
      type: string
      name: string
      status: 'pending' | 'approved' | 'rejected'
      uploadedAt: string
    }>
  }
  preferences: {
    theme: 'auto' | 'light' | 'dark'
    language: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  statistics: {
    totalSales: number
    totalOrders: number
    averageRating: number
    totalReviews: number
    responseRate: number
  }
}

// Sections du tableau de bord
const sellerDashboardSections = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: LayoutDashboard,
    description: 'Statistiques générales et aperçu des performances'
  },
  {
    id: 'products',
    label: 'Gestion Produits',
    icon: Package,
    description: 'Création, édition et gestion des produits'
  },
  {
    id: 'orders',
    label: 'Commandes & Ventes',
    icon: ShoppingCart,
    description: 'Suivi des commandes et gestion des ventes'
  },
  {
    id: 'revenue',
    label: 'Chiffre d\'Affaires',
    icon: TrendingUp,
    description: 'Analyses financières et revenus'
  },
  {
    id: 'payment-requests',
    label: 'Demandes de Paiement',
    icon: DollarSign,
    description: 'Demandes de paiement pour les ventes livrées'
  },
  {
    id: 'rankings',
    label: 'Classements',
    icon: Trophy,
    description: 'Positionnement dans la marketplace'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    description: 'Chat avec clients et administration'
  },
  {
    id: 'messaging',
    label: 'Messagerie Interne',
    icon: Mail,
    description: 'Messages internes avec l\'administration'
  },
  {
    id: 'shares',
    label: 'Partages & Engagement',
    icon: Share2,
    description: 'Suivi des partages et engagement utilisateur'
  },
  {
    id: 'marketing',
    label: 'Marketing & Promotions',
    icon: Tag,
    description: 'Codes promo et campagnes marketing'
  },
  {
    id: 'points',
    label: 'Point',
    icon: Gift,
    description: 'Gestion des points et récompenses'
  },
  {
    id: 'reviews',
    label: 'Avis & Réputation',
    icon: Star,
    description: 'Gestion des avis et réputation'
  },
  {
    id: 'analytics',
    label: 'Statistiques & Analyses',
    icon: BarChart3,
    description: 'Analyses avancées et rapports'
  },
  {
    id: 'profile',
    label: 'Profil & Paramètres',
    icon: User,
    description: 'Gestion du profil et paramètres'
  },
  {
    id: 'currency-test',
    label: 'Test Devises',
    icon: DollarSign,
    description: 'Vérifiez l\'affichage des prix en FCFA et points Probooster'
  }
]

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showChatModal, setShowChatModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  
  // États pour les modales de l'en-tête
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // États pour le chat support
  const [showChatSupportModal, setShowChatSupportModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatStatus, setChatStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  
  // États pour l'email support
  const [showEmailSupportModal, setShowEmailSupportModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailCategory, setEmailCategory] = useState('general')
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const [showAdvancedProductModal, setShowAdvancedProductModal] = useState(false)
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)



  // Données mock pour le profil vendeur
  const mockSellerProfile = {
    id: '1',
    name: 'TechStore Pro',
    email: 'contact@techstorepro.com',
    phone: '+33 1 23 45 67 89',
    avatar: '/avatars/seller-1.jpg',
    bio: 'Spécialiste en produits technologiques de haute qualité',
    company: 'TechStore Pro SARL',
    website: 'https://techstorepro.com',
    address: {
      street: '123 Rue de la Technologie',
      city: 'Paris',
      state: 'Île-de-France',
      country: 'France',
      postalCode: '75001'
    },
    socialMedia: {
      facebook: 'techstorepro',
      twitter: 'techstorepro',
      instagram: 'techstorepro',
      linkedin: 'techstorepro'
    },
    verification: {
      isVerified: true,
      verificationDate: '2024-01-15',
      documents: [
        {
          id: '1',
          type: 'identity',
          name: 'Carte d\'identité',
          status: 'approved',
          uploadedAt: '2024-01-10'
        },
        {
          id: '2',
          type: 'business',
          name: 'Extrait Kbis',
          status: 'approved',
          uploadedAt: '2024-01-12'
        }
      ]
    },
    preferences: {
      theme: 'auto' as const,
      language: 'fr',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    },
    statistics: {
      totalSales: 1250000,
      totalOrders: 1250,
      averageRating: 4.8,
      totalReviews: 450,
      responseRate: 95
    }
  } as SellerProfile

  // Données mock pour le vendeur
  const sellerStats: SellerStats = {
    totalSales: 1247,
    totalOrders: 89,
    totalProducts: 24,
    totalCustomers: 156,
    totalRevenue: 1250000,
    totalCommissions: 125000,
    totalPoints: 8500,
    averageRating: 4.8,
    totalReviews: 234,
    totalShares: 567,
    ranking: 3,
    totalVendors: 1250
  }

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`
    if (diffDays < 365) return `Il y a ${Math.ceil(diffDays / 30)} mois`
    return date.toLocaleDateString('fr-FR')
  }

  const mockProducts: SellerProduct[] = [
    {
      id: 1,
      name: "Smartphone Galaxy S24",
      price: 450000,
      originalPrice: 500000,
      image: "/placeholder.jpg",
      category: "Électronique",
      stock: 15,
      sales: 23,
      revenue: 10350000,
      shares: 45,
      rating: 4.9,
      reviews: 67,
      status: "active",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20"
    },
    {
      id: 2,
      name: "Casque Bluetooth Pro",
      price: 25000,
      originalPrice: 30000,
      image: "/placeholder.jpg",
      category: "Audio",
      stock: 8,
      sales: 12,
      revenue: 300000,
      shares: 23,
      rating: 4.7,
      reviews: 34,
      status: "active",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-18"
    },
    {
      id: 3,
      name: "Montre Connectée Sport",
      price: 75000,
      originalPrice: 85000,
      image: "/placeholder.jpg",
      category: "Électronique",
      stock: 5,
      sales: 8,
      revenue: 600000,
      shares: 12,
      rating: 4.6,
      reviews: 19,
      status: "active",
      createdAt: "2024-01-05",
      updatedAt: "2024-01-15"
    }
  ]

  const mockOrders: SellerOrder[] = [
    {
      id: "ORD-001",
      customerName: "Kouassi Jean",
      customerEmail: "kouassi@email.com",
      customerPhone: "+225 07 12 34 56 78",
      products: [
        {
          id: 1,
          name: "Smartphone Galaxy S24",
          quantity: 1,
          price: 450000,
          total: 450000
        }
      ],
      totalAmount: 450000,
      commission: 45000,
      netRevenue: 405000,
      status: "delivered",
      paymentStatus: "paid",
      shippingAddress: "Abomey-Calavi, Bénin",
      orderDate: "2024-01-20",
      deliveryDate: "2024-01-22",
      customerRating: 5,
      customerReview: "Excellent produit, livraison rapide !"
    },
    {
      id: "ORD-002",
      customerName: "Adjoa Marie",
      customerEmail: "adjoa@email.com",
      customerPhone: "+229 91 50 57 57",
      products: [
        {
          id: 2,
          name: "Casque Bluetooth Pro",
          quantity: 2,
          price: 25000,
          total: 50000
        }
      ],
      totalAmount: 50000,
      commission: 5000,
      netRevenue: 45000,
      status: "shipped",
      paymentStatus: "paid",
      shippingAddress: "Cotonou, Bénin",
      orderDate: "2024-01-21",
      trackingNumber: "TRK-123456"
    },
    {
      id: "ORD-003",
      customerName: "Kofi Mensah",
      customerEmail: "kofi@email.com",
      customerPhone: "+233 24 12 34 56",
      products: [
        {
          id: 3,
          name: "Montre Connectée Sport",
          quantity: 1,
          price: 75000,
          total: 75000
        }
      ],
      totalAmount: 75000,
      commission: 7500,
      netRevenue: 67500,
      status: "pending",
      paymentStatus: "pending",
      shippingAddress: "Accra, Ghana",
      orderDate: "2024-01-22"
    }
  ]

  const mockRevenue: SellerRevenue = {
    totalRevenue: 1250000,
    totalCommissions: 125000,
    netRevenue: 1125000,
    pendingPayments: 67500,
    completedPayments: 5,
    monthlyRevenue: [120000, 150000, 180000, 200000, 220000, 250000],
    monthlyOrders: [15, 18, 22, 25, 28, 30],
    topProducts: [
      { id: 1, name: "Smartphone Galaxy S24", revenue: 10350000, sales: 23 },
      { id: 2, name: "Casque Bluetooth Pro", revenue: 300000, sales: 12 },
      { id: 3, name: "Montre Connectée Sport", revenue: 600000, sales: 8 }
    ],
    revenueByCategory: [
      { category: "Électronique", revenue: 450000, percentage: 45 },
      { category: "Audio", revenue: 200000, percentage: 20 },
      { category: "Mode", revenue: 180000, percentage: 18 },
      { category: "Maison", revenue: 170000, percentage: 17 }
    ],
    paymentHistory: [
      { id: "PAY-001", amount: 405000, date: "2024-01-22", method: "FeexPay", status: "completed" },
      { id: "PAY-002", amount: 45000, date: "2024-01-21", method: "Mobile Money", status: "completed" },
      { id: "PAY-003", amount: 67500, date: "2024-01-22", method: "Carte Bancaire", status: "pending" }
    ]
  }

  // Données mock pour les points
  const mockPointsData = {
    balance: 8500,
    totalEarned: 12500,
    totalSpent: 3200,
    totalTransferred: 800,
    conversionRate: 0.85,
    exchangeRate: 1.2,
    pendingRequests: 3,
    sharesData: {
      totalShares: 567,
      sharesThisMonth: 89,
      pointsFromShares: 2340,
      viralScore: 78,
      topSharedProducts: [
        {
          id: "1",
          name: "Smartphone Galaxy S24",
          image: "/placeholder.jpg",
          shares: 45,
          points: 180,
          revenue: 10350000,
          isOwnProduct: true
        },
        {
          id: "2",
          name: "Casque Bluetooth Pro",
          image: "/placeholder.jpg",
          shares: 23,
          points: 92,
          revenue: 300000,
          isOwnProduct: true
        }
      ],
      socialNetworkStats: {
        facebook: { shares: 156, points: 624, engagement: 23 },
        instagram: { shares: 234, points: 936, engagement: 34 },
        twitter: { shares: 89, points: 356, engagement: 12 },
        whatsapp: { shares: 67, points: 268, engagement: 45 },
        linkedin: { shares: 21, points: 84, engagement: 8 }
      },
      userEngagement: [
        {
          id: "1",
          name: "Kouassi Jean",
          avatar: "/placeholder-user.jpg",
          totalShares: 89,
          pointsEarned: 3560,
          lastShareDate: "2024-01-22T10:30:00Z",
          favoriteCategories: ["Électronique", "Audio"],
          engagementScore: 92
        }
      ]
    },
    history: [
      {
        id: "1",
        type: "earned" as const,
        amount: 500,
        description: "Vente produit #1234",
        timestamp: "2024-01-22T10:30:00Z",
        status: "completed" as const,
        source: "Vente"
      },
      {
        id: "2",
        type: "spent" as const,
        amount: -200,
        description: "Échange contre réduction",
        timestamp: "2024-01-21T15:45:00Z",
        status: "completed" as const
      },
      {
        id: "3",
        type: "transferred" as const,
        amount: -100,
        description: "Transfert vers Marie K.",
        timestamp: "2024-01-20T09:15:00Z",
        status: "completed" as const,
        recipient: "Marie K."
      },
      {
        id: "4",
        type: "bonus" as const,
        amount: 150,
        description: "Bonus fidélité",
        timestamp: "2024-01-19T14:20:00Z",
        status: "completed" as const,
        source: "Bonus"
      },
      {
        id: "5",
        type: "exchanged" as const,
        amount: -300,
        description: "Échange XOF",
        timestamp: "2024-01-18T11:30:00Z",
        status: "completed" as const
      }
    ],
    topEarners: [
      {
        id: "1",
        name: "Kouassi Jean",
        avatar: "/placeholder-user.jpg",
        points: 12500,
        shares: 89,
        revenue: 450000,
        engagementScore: 92,
        favoriteCategories: ["Électronique", "Audio"]
      },
      {
        id: "2",
        name: "Marie Konan",
        avatar: "/placeholder-user.jpg",
        points: 9800,
        shares: 67,
        revenue: 320000,
        engagementScore: 87,
        favoriteCategories: ["Mode", "Maison"]
      },
      {
        id: "3",
        name: "Pierre Yao",
        avatar: "/placeholder-user.jpg",
        points: 8700,
        shares: 54,
        revenue: 280000,
        engagementScore: 84,
        favoriteCategories: ["Électronique", "Sport"]
      }
    ],
    exchangeHistory: [
      {
        id: "1",
        fromCurrency: "Points",
        toCurrency: "XOF",
        amount: 1000,
        rate: 1.2,
        timestamp: "2024-01-22T08:00:00Z",
        status: "completed",
        fees: 50
      },
      {
        id: "2",
        fromCurrency: "Points",
        toCurrency: "USD",
        amount: 500,
        rate: 0.85,
        timestamp: "2024-01-21T16:30:00Z",
        status: "completed",
        fees: 25
      }
    ],
    withdrawalRequests: [
      {
        id: "1",
        amount: 5000,
        method: "Mobile Money",
        status: "pending" as const,
        timestamp: "2024-01-22T09:00:00Z"
      }
    ],
    predictiveAnalytics: {
      nextMonthPrediction: 9800,
      growthTrend: "increasing" as const,
      recommendedActions: [
        "Partager plus de produits électroniques",
        "Engager avec les clients sur Instagram",
        "Créer du contenu vidéo pour les produits"
      ],
      marketOpportunities: [
        {
          category: "Électronique",
          potentialPoints: 1200,
          difficulty: "low" as const
        },
        {
          category: "Audio",
          potentialPoints: 800,
          difficulty: "medium" as const
        }
      ]
    }
  }

  // Données mock pour la section avis et réputation
  const mockReviewsData = {
    reviews: [
      {
        id: "1",
        customerId: "cust-1",
        customerName: "Kouassi Jean",
        customerAvatar: "/placeholder-user.jpg",
        productId: 1,
        productName: "Smartphone Galaxy S24",
        productImage: "/placeholder.jpg",
        rating: 5,
        title: "Excellent produit, très satisfait !",
        content: "J'ai acheté ce smartphone il y a une semaine et je suis vraiment satisfait. La qualité est excellente, la livraison a été rapide et le vendeur très professionnel. Je recommande vivement !",
        images: ["/placeholder.jpg", "/placeholder.jpg"],
        createdAt: "2024-01-22T10:30:00Z",
        status: "approved" as const,
        isVerified: true,
        helpfulCount: 12,
        replyCount: 1,
        sellerReply: {
          content: "Merci beaucoup pour votre avis positif ! Nous sommes ravis que vous soyez satisfait de votre achat. N'hésitez pas à nous contacter si vous avez des questions.",
          createdAt: "2024-01-22T14:00:00Z"
        },
        flags: [],
        sentiment: "positive" as const,
        impact: "high" as const
      },
      {
        id: "2",
        customerId: "cust-2",
        customerName: "Adjoa Marie",
        customerAvatar: "/placeholder-user.jpg",
        productId: 2,
        productName: "Casque Bluetooth Pro",
        productImage: "/placeholder.jpg",
        rating: 4,
        title: "Très bon casque, petit bémol sur la batterie",
        content: "La qualité sonore est excellente et le confort est au rendez-vous. Seul point négatif : la batterie pourrait tenir un peu plus longtemps. Sinon, je recommande !",
        createdAt: "2024-01-21T15:45:00Z",
        status: "approved" as const,
        isVerified: true,
        helpfulCount: 8,
        replyCount: 1,
        images: [],
        sellerReply: {
          content: "Merci pour votre retour ! Nous travaillons sur l'amélioration de l'autonomie de la batterie. Votre avis nous aide à progresser.",
          createdAt: "2024-01-21T18:30:00Z"
        },
        flags: [],
        sentiment: "positive" as const,
        impact: "medium" as const
      },
      {
        id: "3",
        customerId: "cust-3",
        customerName: "Kofi Mensah",
        customerAvatar: "/placeholder-user.jpg",
        productId: 3,
        productName: "Montre Connectée Sport",
        productImage: "/placeholder.jpg",
        rating: 3,
        title: "Produit correct mais pourrait être mieux",
        content: "La montre fonctionne bien mais l'interface utilisateur pourrait être plus intuitive. Le prix est correct pour la qualité proposée.",
        createdAt: "2024-01-20T12:15:00Z",
        status: "pending" as const,
        isVerified: false,
        helpfulCount: 3,
        replyCount: 0,
        images: [],
        flags: [],
        sentiment: "neutral" as const,
        impact: "low" as const
      },
      {
        id: "4",
        customerId: "cust-4",
        customerName: "Fatou Diallo",
        customerAvatar: "/placeholder-user.jpg",
        productId: 1,
        productName: "Smartphone Galaxy S24",
        productImage: "/placeholder.jpg",
        rating: 1,
        title: "Très déçu de la qualité",
        content: "Le produit reçu ne correspond pas à la description. La qualité est médiocre et le service client n'a pas été à la hauteur de mes attentes.",
        createdAt: "2024-01-19T09:20:00Z",
        status: "flagged" as const,
        isVerified: true,
        helpfulCount: 15,
        replyCount: 2,
        images: [],
        flags: [
          {
            id: "flag-1",
            reason: "Contenu inapproprié",
            reporterId: "seller",
            reporterName: "Vendeur",
            createdAt: "2024-01-19T16:00:00Z",
            status: "pending" as const
          }
        ],
        sentiment: "negative" as const,
        impact: "high" as const
      }
    ],
    reputationData: {
      overallRating: 4.8,
      totalReviews: 234,
      ratingDistribution: {
        '5': 156,
        '4': 45,
        '3': 18,
        '2': 8,
        '1': 7
      },
      averageResponseTime: 1.5,
      responseRate: 98,
      helpfulReviewsPercentage: 81,
      verifiedReviewsPercentage: 95,
      monthlyTrends: [
        { month: 'Jan 2024', rating: 4.9, reviews: 45 },
        { month: 'Déc 2023', rating: 4.7, reviews: 38 },
        { month: 'Nov 2023', rating: 4.8, reviews: 42 },
        { month: 'Oct 2023', rating: 4.6, reviews: 35 },
        { month: 'Sep 2023', rating: 4.8, reviews: 40 },
        { month: 'Août 2023', rating: 4.7, reviews: 34 }
      ]
    }
  }

  // Données mock pour les commandes livrées et demandes de paiement
  const mockDeliveredOrders = [
    {
      id: "ORD-001",
      customerName: "Kouassi Jean",
      customerEmail: "kouassi@email.com",
      customerPhone: "+225 07 12 34 56 78",
      products: [
        {
          id: 1,
          name: "Smartphone Galaxy S24",
          quantity: 1,
          price: 450000,
          total: 450000
        }
      ],
      totalAmount: 450000,
      commission: 45000,
      netRevenue: 405000,
      status: "delivered",
      paymentStatus: "pending",
      shippingAddress: "Abidjan, Côte d'Ivoire",
      orderDate: "2024-01-15",
      deliveryDate: "2024-01-20",
      expectedDeliveryDate: "2024-01-18",
      customerRating: 5,
      customerReview: "Excellent produit, livraison rapide !",
      trackingNumber: "TRK123456789",
      shippingMethod: "Express",
      notes: "Livré avec succès",
      isPaymentRequested: false,
      paymentRequestDate: null
    },
    {
      id: "ORD-002",
      customerName: "Marie Konan",
      customerEmail: "marie@email.com",
      customerPhone: "+225 07 98 76 54 32",
      products: [
        {
          id: 2,
          name: "Casque Bluetooth Pro",
          quantity: 2,
          price: 25000,
          total: 50000
        },
        {
          id: 3,
          name: "Montre Connectée Sport",
          quantity: 1,
          price: 75000,
          total: 75000
        }
      ],
      totalAmount: 125000,
      commission: 12500,
      netRevenue: 112500,
      status: "delivered",
      paymentStatus: "pending",
      shippingAddress: "Accra, Ghana",
      orderDate: "2024-01-18",
      deliveryDate: "2024-01-22",
      expectedDeliveryDate: "2024-01-25",
      customerRating: 4,
      customerReview: "Très satisfaite de mes achats",
      trackingNumber: "TRK987654321",
      shippingMethod: "Standard",
      notes: "Livré avec succès",
      isPaymentRequested: true,
      paymentRequestDate: "2024-01-23"
    },
    {
      id: "ORD-003",
      customerName: "Pierre Yao",
      customerEmail: "pierre@email.com",
      customerPhone: "+225 07 55 44 33 22",
      products: [
        {
          id: 1,
          name: "Smartphone Galaxy S24",
          quantity: 1,
          price: 450000,
          total: 450000
        }
      ],
      totalAmount: 450000,
      commission: 45000,
      netRevenue: 405000,
      status: "delivered",
      paymentStatus: "pending",
      shippingAddress: "Lagos, Nigeria",
      orderDate: "2024-01-20",
      deliveryDate: "2024-01-25",
      expectedDeliveryDate: "2024-01-23",
      customerRating: 5,
      customerReview: "Produit conforme à la description",
      trackingNumber: "TRK456789123",
      shippingMethod: "Express",
      notes: "Livré avec succès",
      isPaymentRequested: false,
      paymentRequestDate: null
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }



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

  // Handlers pour les sections
  const handleProductUpdate = (product: SellerProduct) => {
    console.log('Produit mis à jour:', product)
    // Ici on mettrait à jour la base de données
  }

  const handleProductDelete = (productId: number) => {
    console.log('Produit supprimé:', productId)
    // Ici on supprimerait de la base de données
  }

  const handleProductCreate = (product: Omit<SellerProduct, 'id'>) => {
    console.log('Nouveau produit:', product)
    // Ici on créerait dans la base de données
  }

  const handleOrderUpdate = (order: SellerOrder) => {
    console.log('Commande mise à jour:', order)
    // Ici on mettrait à jour la base de données
  }

  const handleOrderStatusChange = (orderId: string, status: SellerOrder['status']) => {
    console.log('Statut de commande changé:', orderId, status)
    // Ici on mettrait à jour la base de données
  }

  const handlePaymentRequest = (amount: number) => {
    console.log('Demande de paiement:', amount)
    alert(`Demande de paiement de ${formatCurrency(amount)} envoyée avec succès !`)
  }

  // Handlers pour les points
  const handleTransferPoints = (recipientId: string, amount: number) => {
    console.log('Transfert de points:', recipientId, amount)
    alert(`Transfert de ${amount} points vers ${recipientId} effectué avec succès !`)
  }

  const handleExchangePoints = (fromCurrency: string, toCurrency: string, amount: number) => {
    console.log('Échange de points:', fromCurrency, toCurrency, amount)
    alert(`Échange de ${amount} ${fromCurrency} vers ${toCurrency} effectué avec succès !`)
  }

  const handleRequestWithdrawal = (amount: number, method: string) => {
    console.log('Demande de retrait:', amount, method)
    alert(`Demande de retrait de ${amount} points via ${method} envoyée avec succès !`)
  }

  const handleExportHistory = (type: string) => {
    console.log('Export historique:', type)
    alert(`Export de l'historique ${type} téléchargé avec succès !`)
  }

  // Handlers pour les demandes de paiement des ventes
  const handleSalesPaymentRequest = (orderId: string, amount: number, paymentData: any) => {
    console.log('Demande de paiement pour vente:', orderId, amount, paymentData)
    
    // Mettre à jour le statut de la commande dans les données mock
    const orderIndex = mockDeliveredOrders.findIndex(order => order.id === orderId)
    if (orderIndex !== -1) {
      mockDeliveredOrders[orderIndex].isPaymentRequested = true
      mockDeliveredOrders[orderIndex].paymentRequestDate = new Date().toISOString()
    }
    
    const methodText = paymentData.paymentMethod === 'mobile_money' ? 'Mobile Money (via FeexPay)' :
                      paymentData.paymentMethod === 'bank_card' ? 'Carte Bancaire (via FeexPay)' :
                      'Virement Bancaire'
    
    const sellerInfo = `Vendeur: ${paymentData.sellerName} (${paymentData.sellerEmail})`
    const paymentInfo = paymentData.paymentMethod === 'mobile_money' ? 
                       `Téléphone: ${paymentData.phoneNumber}` :
                       paymentData.paymentMethod === 'bank_transfer' ?
                       `Banque: ${paymentData.bankName}\nCompte: ${paymentData.accountNumber}` :
                       'Carte bancaire'
    
    alert(`✅ Demande de paiement envoyée avec succès !\n\n💰 Montant: ${formatCurrency(amount)}\n📦 Commande: ${orderId}\n👤 ${sellerInfo}\n💳 Mode: ${methodText}\n📋 ${paymentInfo}\n\n📧 La demande a été envoyée à l'administrateur et au super administrateur pour validation.`)
  }

  const handleBulkPaymentRequest = (orders: any[]) => {
    const totalAmount = orders.reduce((sum, order) => sum + order.netRevenue, 0)
    console.log('Demande de paiement groupée:', orders, totalAmount)
    alert(`Demande de paiement groupée de ${formatCurrency(totalAmount)} pour ${orders.length} commandes envoyée avec succès !`)
  }

  // Fonctions de gestion des avis et réputation
  const handleReviewApprove = (reviewId: string) => {
    console.log('Approuver avis:', reviewId)
    // Logique d'approbation d'avis
  }

  const handleReviewReject = (reviewId: string, reason: string) => {
    console.log('Rejeter avis:', reviewId, 'Raison:', reason)
    // Logique de rejet d'avis
  }

  const handleReviewReply = (reviewId: string, reply: string) => {
    console.log('Répondre à avis:', reviewId, 'Réponse:', reply)
    // Logique de réponse à un avis
  }

  const handleReviewFlag = (reviewId: string, reason: string) => {
    console.log('Signaler avis:', reviewId, 'Raison:', reason)
    // Logique de signalement d'avis
  }

  const handleReviewDelete = (reviewId: string) => {
    console.log('Supprimer avis:', reviewId)
    // Logique de suppression d'avis
  }

  const handleExportReviews = (type: string) => {
    console.log('Exporter avis:', type)
    // Logique d'export des avis
  }

  const handleViewCustomerProfile = (customerId: string) => {
    console.log('Voir profil client:', customerId)
    // Logique d'affichage du profil client
  }

  const handleViewProductDetails = (productId: number) => {
    console.log('Voir détails produit:', productId)
    // Logique d'affichage des détails du produit
  }

  const handleExportData = (type: string, format: string) => {
    console.log('Exporter données:', type, format)
    // Logique d'export des données
  }

  const handleViewDetailedReport = (metric: string) => {
    console.log('Voir rapport détaillé:', metric)
    // Logique d'affichage du rapport détaillé
  }

  // Fonctions de gestion du profil
  const handleProfileUpdate = (profileData: any) => {
    console.log('Mise à jour du profil:', profileData)
    // Implémenter la logique de mise à jour du profil
  }

  const handlePasswordChange = (oldPassword: string, newPassword: string) => {
    console.log('Changement de mot de passe')
    // Implémenter la logique de changement de mot de passe
  }

  const handleTwoFactorToggle = (enabled: boolean) => {
    console.log('Activation/désactivation 2FA:', enabled)
    // Implémenter la logique de gestion 2FA
  }

  const handleSessionTerminate = (sessionId: string) => {
    console.log('Termination de session:', sessionId)
    // Implémenter la logique de termination de session
  }

  const handleDocumentUpload = (file: File, type: string) => {
    console.log('Upload de document:', type, file.name)
    // Implémenter la logique d'upload de document
  }

  const handleAccountDelete = () => {
    console.log('Suppression de compte demandée')
    // Implémenter la logique de suppression de compte
  }

  const handleLogout = () => {
    console.log('Déconnexion')
    // Implémenter la logique de déconnexion
  }

  // Fonctions de gestion de l'en-tête
  const handleNotificationsClick = () => {
    setShowNotificationsModal(true)
  }

  const handleHelpClick = () => {
    setShowHelpModal(true)
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutModal(false)
    // Ici on pourrait ajouter la logique de déconnexion réelle
    console.log('Déconnexion confirmée')
    // Redirection vers la page de connexion ou autre
  }

  // Fonctions de gestion du chat support
  const handleChatSupportClick = () => {
    setShowChatSupportModal(true)
    setShowHelpModal(false)
    setChatStatus('connecting')
    
    // Simuler la connexion
    setTimeout(() => {
      setChatStatus('connected')
      // Message de bienvenue automatique
      const welcomeMessage = {
        id: Date.now(),
        type: 'admin',
        message: 'Bonjour ! Je suis l\'équipe support de Probooster. Comment puis-je vous aider aujourd\'hui ?',
        timestamp: new Date().toISOString(),
        sender: 'Support Probooster'
      }
      setChatMessages([welcomeMessage])
    }, 1000)
  }

  const handleChatMessageSubmit = () => {
    if (!chatMessage.trim() || chatStatus !== 'connected') return
    
    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toISOString(),
      sender: 'Vous'
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setChatMessage('')
    setIsTyping(true)
    
    // Simuler la réponse de l'administrateur
    setTimeout(() => {
      setIsTyping(false)
      const adminResponse = {
        id: Date.now() + 1,
        type: 'admin',
        message: `Merci pour votre message "${userMessage.message}". Un agent de notre équipe va vous répondre dans les plus brefs délais. En attendant, pouvez-vous me donner plus de détails sur votre problème ?`,
        timestamp: new Date().toISOString(),
        sender: 'Support Probooster'
      }
      setChatMessages(prev => [...prev, adminResponse])
    }, 2000)
  }

  // Fonctions de gestion de l'email support
  const handleEmailSupportClick = () => {
    setShowEmailSupportModal(true)
    setShowHelpModal(false)
    // Pré-remplir avec les informations du vendeur
    setEmailSubject('Demande de support - Vendeur')
    setEmailMessage(`Bonjour,\n\nJe suis vendeur sur Probooster et j'ai besoin d'assistance.\n\nProblème : \n\nMerci de votre aide.\n\nCordialement,\n${mockSellerProfile.name}`)
  }

  const handleEmailSubmit = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Veuillez remplir tous les champs')
      return
    }
    
    setIsSendingEmail(true)
    
    try {
      // Simuler l'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Succès
      alert('✅ Email envoyé avec succès ! L\'administrateur vous répondra dans les plus brefs délais.')
      setShowEmailSupportModal(false)
      setEmailSubject('')
      setEmailMessage('')
      setEmailCategory('general')
    } catch (error) {
      alert('❌ Erreur lors de l\'envoi de l\'email. Veuillez réessayer.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleCreateProduct = () => {
    setProductModalMode('create')
    setSelectedProduct(null)
    setShowAdvancedProductModal(true)
  }

  const handleEditProduct = (product: any) => {
    setProductModalMode('edit')
    setSelectedProduct(product)
    setShowAdvancedProductModal(true)
  }

  const handleReviewAction = (reviewId: string, reason?: string) => {
    // Logique pour gérer les actions sur les avis
    console.log('Action sur avis:', reviewId, reason)
  }

  const handleNotificationAction = (type?: string) => {
    // Logique pour gérer les actions sur les notifications
    console.log('Action sur notification:', type)
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Vendeur</h1>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              Vendeur Pro
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-orange-50 hover:border-orange-200"
              onClick={handleNotificationsClick}
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-orange-50 hover:border-orange-200"
              onClick={handleHelpClick}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Aide
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hover:bg-orange-50 hover:border-orange-200"
              onClick={handleLogoutClick}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 shadow-sm">
          <div className="space-y-4">
            {/* Profil vendeur */}
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12 border-2 border-orange-200">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-orange-100 text-orange-800">VD</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">Vendeur Pro</h3>
                  <p className="text-sm text-gray-600">Niveau 3 • Vérifié</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Classement</span>
                  <span className="font-semibold text-orange-600">#{sellerStats.ranking}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Note moyenne</span>
                  <span className="font-semibold text-yellow-600">{sellerStats.averageRating}★</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {sellerDashboardSections.map((section) => {
                const IconComponent = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === section.id
                        ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{section.label}</div>
                      <div className="text-xs text-gray-500">{section.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>

            

          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-700">Chiffre d'Affaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-orange-900">{formatCurrency(sellerStats.totalRevenue)}</div>
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-xs text-orange-600 mt-2">+12% ce mois</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-700">Commandes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-green-900">{sellerStats.totalOrders}</div>
                      <ShoppingCart className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-xs text-green-600 mt-2">+8% ce mois</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-purple-700">Produits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-purple-900">{sellerStats.totalProducts}</div>
                      <Package className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-xs text-purple-600 mt-2">Actifs</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700">Classement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blue-900">#{sellerStats.ranking}</div>
                      <Trophy className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Sur {sellerStats.totalVendors} vendeurs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Graphiques et analyses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Évolution des Ventes</CardTitle>
                    <CardDescription>Performance des 30 derniers jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Graphique des ventes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Produits les Plus Vendus</CardTitle>
                    <CardDescription>Top 5 des produits</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockProducts.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex items-center space-x-4">
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{product.name}</h4>
                            <p className="text-xs text-gray-500">{product.sales} ventes</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                            <p className="text-xs text-gray-500">{product.shares} partages</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>



              {/* Commandes récentes */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Commandes Récentes</CardTitle>
                  <CardDescription>Dernières commandes reçues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium">{order.customerName}</h4>
                            <p className="text-sm text-gray-500">{order.id} • {formatDate(order.orderDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                          <Badge className={`mt-1 ${getStatusColor(order.status)}`}>
                            {order.status === 'pending' ? 'En attente' :
                             order.status === 'confirmed' ? 'Confirmée' :
                             order.status === 'shipped' ? 'Expédiée' :
                             order.status === 'delivered' ? 'Livrée' :
                             order.status === 'cancelled' ? 'Annulée' : 'Retournée'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Section Gestion des Produits */}
          {activeTab === 'products' && (
            <ProductManagement
              onCreateProduct={handleCreateProduct}
              onEditProduct={handleEditProduct}
            />
          )}

          {/* Section Test des Devises */}
          {activeTab === 'currency-test' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test des Devises et Points</CardTitle>
                  <CardDescription>
                    Vérifiez l'affichage des prix en FCFA et points Probooster
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-lg font-medium text-blue-800">Prix Standard</div>
                      <div className="text-2xl font-bold text-blue-600">129 900 FCFA</div>
                      <div className="text-sm text-blue-500">12 990 points Probooster</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-lg font-medium text-green-800">Prix Promo</div>
                      <div className="text-2xl font-bold text-green-600">119 900 FCFA</div>
                      <div className="text-sm text-green-500">11 990 points Probooster</div>
                      <Badge variant="outline" className="border-red-500 text-red-600 mt-2">
                        -8%
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-lg font-medium text-purple-800">Livraison</div>
                      <div className="text-2xl font-bold text-purple-600">599 FCFA</div>
                      <div className="text-sm text-purple-500">60 points Probooster</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Configuration des Devises</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Devise:</span> FCFA
                      </div>
                      <div>
                        <span className="font-medium">Points:</span> 1 FCFA = 0.1 points
                      </div>
                      <div>
                        <span className="font-medium">Locale:</span> Français
                      </div>
                      <div>
                        <span className="font-medium">Format:</span> 129 900 FCFA
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test des Paiements Différés */}
              <Card>
                <CardHeader>
                  <CardTitle>Test des Paiements Différés</CardTitle>
                  <CardDescription>
                    Simulation des frais variables selon la période et la méthode
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                        <h4 className="font-medium text-orange-800 mb-2">Exemple avec 10% par mois</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>1 mois:</span>
                            <span className="font-medium">142 890 FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>3 mois:</span>
                            <span className="font-medium">168 870 FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>6 mois:</span>
                            <span className="font-medium">207 840 FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>12 mois:</span>
                            <span className="font-medium">285 780 FCFA</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">Exemple avec 100 FCFA par jour</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>1 jour:</span>
                            <span className="font-medium">130 000 FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>7 jours:</span>
                            <span className="font-medium">130 700 FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>30 jours:</span>
                            <span className="font-medium">132 900 FCFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span>90 jours:</span>
                            <span className="font-medium">138 900 FCFA</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">Configuration des Frais</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Types:</span> Pourcentage ou Montant fixe
                        </div>
                        <div>
                          <span className="font-medium">Périodes:</span> Jour, Mois, Trimestre
                        </div>
                        <div>
                          <span className="font-medium">Méthodes:</span> Intérêts simples ou composés
                        </div>
                        <div>
                          <span className="font-medium">Devise:</span> FCFA (par défaut)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Section Commandes & Ventes */}
          {activeTab === 'orders' && (
            <OrderManagement
              orders={mockOrders}
              onOrderUpdate={handleOrderUpdate}
              onOrderStatusChange={handleOrderStatusChange}
            />
          )}

          {/* Section Chiffre d'Affaires */}
          {activeTab === 'revenue' && (
            <RevenueManagement
              revenue={mockRevenue}
              onPaymentRequest={handlePaymentRequest}
            />
          )}

          {/* Section Point */}
          {activeTab === 'points' && (
            <PointSection
              pointData={mockPointsData}
              onTransferPoints={handleTransferPoints}
              onExchangePoints={handleExchangePoints}
              onRequestWithdrawal={handleRequestWithdrawal}
              onExportHistory={handleExportHistory}
            />
          )}

          {/* Section Demandes de Paiement */}
          {activeTab === 'payment-requests' && (
            <PaymentRequestsSection
              deliveredOrders={mockDeliveredOrders}
              onPaymentRequest={handleSalesPaymentRequest}
              onBulkPaymentRequest={handleBulkPaymentRequest}
            />
          )}

          {/* Section Classements */}
          {activeTab === 'rankings' && (
            <RankingSection />
          )}

          {/* Section Chat */}
          {activeTab === 'chat' && (
            <InternalMessagingSection />
          )}

          {/* Section Partages et Engagement */}
          {activeTab === 'shares' && (
            <SharesEngagementSection />
          )}

          {/* Section Marketing et Promotions */}
          {activeTab === 'marketing' && (
            <MarketingPromotionsSection />
          )}

          {/* Section Avis et Réputation */}
          {activeTab === 'reviews' && (
            <ReviewsSection 
              reviews={mockReviewsData.reviews}
              reputationData={mockReviewsData.reputationData}
              onReviewApprove={handleReviewApprove}
              onReviewReject={handleReviewReject}
              onReviewReply={handleReviewReply}
              onReviewFlag={handleReviewFlag}
              onReviewDelete={handleReviewDelete}
              onExportReviews={handleExportReviews}
              onViewCustomerProfile={handleViewCustomerProfile}
              onViewProductDetails={handleViewProductDetails}
            />
          )}

          {/* Section Statistiques et Analyses */}
          {activeTab === 'analytics' && (
            <StatisticsAnalyticsSection
              onExportData={handleExportData}
              onViewProductDetails={handleViewProductDetails}
              onViewCustomerProfile={handleViewCustomerProfile}
              onViewDetailedReport={handleViewDetailedReport}
            />
          )}

          {/* Section Messagerie Interne */}
          {activeTab === 'messaging' && (
            <InternalMessagingSection />
          )}

          {/* Section Profil et Paramètres */}
          {activeTab === 'profile' && (
            <ProfileSection
              profile={mockSellerProfile}
              onProfileUpdate={handleProfileUpdate}
              onPasswordChange={handlePasswordChange}
              onTwoFactorToggle={handleTwoFactorToggle}
              onSessionTerminate={handleSessionTerminate}
              onDocumentUpload={handleDocumentUpload}
              onAccountDelete={handleAccountDelete}
              onLogout={handleLogout}
            />
          )}


        </main>
      </div>

      {/* Modal Chat Global */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-orange-600" />
              <span>Chat Global - Toutes les Conversations</span>
            </DialogTitle>
            <DialogDescription>
              Gérez toutes vos conversations avec les clients depuis un seul endroit
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex h-[70vh] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            {/* Panneau gauche - Liste des conversations */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
              {/* Barre de recherche */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher des conversations..."
                    className="pl-10 pr-4 py-2 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-300 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Liste des conversations */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2">
                  {/* Conversation exemple */}
                  <div className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border border-gray-100 hover:border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                            C
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Client Probooster</h4>
                          <span className="text-xs text-gray-500">2 min</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">Bonjour ! Je suis intéressé par votre produit...</p>
                      </div>
                    </div>
                  </div>

                  {/* Autres conversations */}
                  <div className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-orange-50 border border-gray-100 hover:border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold">
                            M
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">Marie Dubois</h4>
                          <span className="text-xs text-gray-500">1h</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">Pouvez-vous me donner plus d'informations...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panneau droit - Zone de chat */}
            <div className="flex-1 bg-white flex flex-col">
              {/* En-tête de la conversation */}
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 font-semibold">
                        C
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">Client Probooster</h3>
                      <p className="text-xs text-gray-600">En ligne • Répond en 2-4h</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-orange-600">
                      <Mail className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Zone des messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Message du client */}
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-900">Bonjour ! Je suis intéressé par votre produit "Laptop Gaming Ultra". Pouvez-vous me donner plus d'informations sur les spécifications techniques ?</p>
                      <span className="text-xs text-gray-500 mt-2 block">14:32</span>
                    </div>
                  </div>
                </div>

                {/* Message du vendeur */}
                <div className="flex justify-end">
                  <div className="max-w-xs lg:max-w-md">
                    <div className="bg-orange-500 text-white rounded-lg p-3">
                      <p className="text-sm">Bonjour ! Bien sûr, je serais ravi de vous aider. Le Laptop Gaming Ultra dispose d'un processeur Intel i7 de 12e génération, 16GB de RAM DDR4, et une carte graphique RTX 3060. Que souhaitez-vous savoir de plus ?</p>
                      <span className="text-xs text-orange-100 mt-2 block">14:35</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Tapez votre message..."
                    className="flex-1"
                  />
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nouveau Produit</DialogTitle>
            <DialogDescription>
              Accédez à la section "Gestion Produits" pour créer un nouveau produit
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Utilisez la section dédiée pour une meilleure expérience</p>
            <Button 
              className="mt-4 bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setShowProductModal(false)
                setActiveTab('products')
              }}
            >
              Aller à la section Produits
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevenueModal} onOpenChange={setShowRevenueModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Demande de Paiement</DialogTitle>
            <DialogDescription>
              Accédez à la section "Chiffre d'Affaires" pour gérer vos paiements
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Utilisez la section dédiée pour une meilleure expérience</p>
            <Button 
              className="mt-4 bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setShowRevenueModal(false)
                setActiveTab('revenue')
              }}
            >
              Aller à la section CA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Notifications */}
      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-[#ff6600]">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </DialogTitle>
            <DialogDescription>
              Gérez vos notifications et alertes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Notifications récentes */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Notifications récentes</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="w-2 h-2 bg-[#ff6600] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Nouvelle commande reçue</p>
                    <p className="text-xs text-gray-500">Commande #12345 - 2 minutes</p>
                  </div>
                  <Badge className="text-xs bg-orange-100 text-orange-800">Nouveau</Badge>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="w-2 h-2 bg-[#3b82f6] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Paiement validé</p>
                    <p className="text-xs text-gray-500">Paiement de 25 000 F CFA - 1 heure</p>
                  </div>
                  <Badge className="text-xs bg-blue-100 text-blue-800">Paiement</Badge>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="w-2 h-2 bg-[#10b981] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Avis client reçu</p>
                    <p className="text-xs text-gray-500">5 étoiles pour "Smartphone Premium" - 3 heures</p>
                  </div>
                  <Badge className="text-xs bg-green-100 text-green-800">Avis</Badge>
                </div>
                
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="w-2 h-2 bg-[#8b5cf6] rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Promotion expirée</p>
                    <p className="text-xs text-gray-500">Code promo "ETE2024" - 1 jour</p>
                  </div>
                  <Badge className="text-xs bg-purple-100 text-purple-800">Promo</Badge>
                </div>
              </div>
            </div>
            
            {/* Paramètres de notifications */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Paramètres</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications par email</p>
                    <p className="text-xs text-gray-500">Recevoir les notifications par email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications push</p>
                    <p className="text-xs text-gray-500">Recevoir les notifications push</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications SMS</p>
                    <p className="text-xs text-gray-500">Recevoir les notifications par SMS</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowNotificationsModal(false)}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Aide */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-[#3b82f6]">
              <HelpCircle className="w-5 h-5 mr-2" />
              Centre d'Aide
            </DialogTitle>
            <DialogDescription>
              Trouvez rapidement des réponses à vos questions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
            {/* Recherche */}
            <div className="relative">
              <Input 
                placeholder="Rechercher dans l'aide..."
                className="pl-10 border-[#3b82f6] focus:border-[#3b82f6] focus:ring-[#3b82f6] focus:ring-2"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#3b82f6]" />
            </div>
            
            {/* Catégories d'aide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#ff6600] hover:bg-orange-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Package className="w-6 h-6 text-[#ff6600]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#ff6600] transition-colors">Gestion des Produits</h4>
                    <p className="text-sm text-gray-500">Créer, modifier, supprimer des produits</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#3b82f6] hover:bg-blue-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-[#3b82f6]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#3b82f6] transition-colors">Commandes & Ventes</h4>
                    <p className="text-sm text-gray-500">Gérer les commandes et suivre les ventes</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#8b5cf6] hover:bg-purple-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <TrendingUp className="w-6 h-6 text-[#8b5cf6]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#8b5cf6] transition-colors">Chiffre d'Affaires</h4>
                    <p className="text-sm text-gray-500">Suivre vos revenus et demander des paiements</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg hover:border-[#10b981] hover:bg-green-50 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <Gift className="w-6 h-6 text-[#10b981]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-[#10b981] transition-colors">Points & Récompenses</h4>
                    <p className="text-sm text-gray-500">Gérer vos points et récompenses</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* FAQ rapide */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Questions fréquentes</h4>
              <div className="space-y-2">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#ff6600] hover:bg-orange-50 transition-all duration-300">
                    <span className="font-medium text-gray-900 group-hover:text-[#ff6600]">Comment créer un nouveau produit ?</span>
                    <ChevronDown className="w-4 h-4 text-[#ff6600] group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-3 text-sm text-gray-600 bg-orange-50 rounded-b-lg border-l-4 border-l-[#ff6600]">
                    Allez dans la section "Gestion Produits" et cliquez sur "Nouveau Produit". Remplissez tous les champs requis et cliquez sur "Créer".
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#3b82f6] hover:bg-blue-50 transition-all duration-300">
                    <span className="font-medium text-gray-900 group-hover:text-[#3b82f6]">Comment demander un paiement ?</span>
                    <ChevronDown className="w-4 h-4 text-[#3b82f6] group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-3 text-sm text-gray-600 bg-blue-50 rounded-b-lg border-l-4 border-l-[#3b82f6]">
                    Dans la section "Chiffre d'Affaires", sélectionnez les commandes livrées et cliquez sur "Demander Paiement".
                  </div>
                </details>
                
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-[#8b5cf6] hover:bg-purple-50 transition-all duration-300">
                    <span className="font-medium text-gray-900 group-hover:text-[#8b5cf6]">Comment améliorer mon classement ?</span>
                    <ChevronDown className="w-4 h-4 text-[#8b5cf6] group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-3 text-sm text-gray-600 bg-purple-50 rounded-b-lg border-l-4 border-l-[#8b5cf6]">
                    Vendez plus, recevez de bons avis, répondez rapidement aux clients et partagez vos produits.
                  </div>
                </details>
              </div>
            </div>
            
            {/* Contact support */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:border-[#8b5cf6] transition-all duration-300">
              <h4 className="font-medium text-[#3b82f6] mb-2">Besoin d'aide supplémentaire ?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Notre équipe support est disponible 24h/24 pour vous aider.
              </p>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                  onClick={handleChatSupportClick}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat Support
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition-all duration-300"
                  onClick={handleEmailSupportClick}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
              </div>
            </div>

            {/* Indicateur de scroll */}
            <div className="text-center py-2">
              <div className="inline-flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-[#ff6600] rounded-full animate-pulse"></div>
                <span className="text-[#3b82f6] font-medium">Utilisez la molette de votre souris pour naviguer</span>
                <div className="w-2 h-2 bg-[#8b5cf6] rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              onClick={() => setShowHelpModal(false)}
              className="bg-[#3b82f6] hover:bg-[#3b82f6]/90"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Déconnexion */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <LogOut className="w-5 h-5 mr-2" />
              Confirmer la déconnexion
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter ? Toutes vos sessions seront fermées.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Attention :</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Toutes vos sessions actives seront fermées</li>
                    <li>• Vous devrez vous reconnecter pour accéder au tableau de bord</li>
                    <li>• Les données non sauvegardées pourront être perdues</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowLogoutModal(false)}
                className="border-gray-300 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleConfirmLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chat Support */}
      <Dialog open={showChatSupportModal} onOpenChange={setShowChatSupportModal}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat Support</DialogTitle>
            <DialogDescription>Chat en direct avec l'équipe support</DialogDescription>
          </DialogHeader>
          
          {/* Header du chat */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">
                    Chat Support Probooster
                  </h2>
                  <p className="text-sm opacity-90">
                    {chatStatus === 'connecting' && 'Connexion en cours...'}
                    {chatStatus === 'connected' && 'Connecté - En ligne'}
                    {chatStatus === 'disconnected' && 'Déconnecté'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChatSupportModal(false)}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Zone des messages */}
          <div className="flex-1 min-h-0 p-4 bg-gray-50 overflow-y-auto">
            {chatStatus === 'connecting' && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6600] mx-auto mb-4"></div>
                  <p className="text-gray-600">Connexion au support en cours...</p>
                </div>
              </div>
            )}
            
            {chatStatus === 'connected' && (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-[#ff6600] text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Zone de saisie */}
          {chatStatus === 'connected' && (
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleChatMessageSubmit()}
                />
                <Button
                  onClick={handleChatMessageSubmit}
                  disabled={!chatMessage.trim()}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Email Support */}
      <Dialog open={showEmailSupportModal} onOpenChange={setShowEmailSupportModal}>
        <DialogContent className="max-w-2xl border-[#ff6600]">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center text-[#ff6600] text-xl font-bold">
              <Mail className="w-6 h-6 mr-3 text-[#ff6600]" />
              Envoyer un email au support
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Remplissez ce formulaire pour contacter l'équipe support par email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-category" className="text-[#ff6600] font-medium">Catégorie</Label>
              <Select value={emailCategory} onValueChange={setEmailCategory}>
                <SelectTrigger className="border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Question générale</SelectItem>
                  <SelectItem value="technical">Problème technique</SelectItem>
                  <SelectItem value="billing">Facturation</SelectItem>
                  <SelectItem value="account">Compte utilisateur</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="email-subject" className="text-[#ff6600] font-medium">Sujet</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Sujet de votre demande"
                className="border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2"
              />
            </div>
            
            <div>
              <Label htmlFor="email-message" className="text-[#ff6600] font-medium">Message</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Décrivez votre problème ou question..."
                rows={6}
                className="border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2"
              />
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-[#ff6600] mt-0.5" />
                <div className="text-sm text-orange-700">
                  <p className="font-medium text-[#ff6600]">Informations :</p>
                  <ul className="mt-1 space-y-1">
                    <li>• L'email sera envoyé directement à l'équipe support</li>
                    <li>• Vous recevrez une confirmation par email</li>
                    <li>• Réponse garantie sous 24h ouvrées</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowEmailSupportModal(false)}
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleEmailSubmit}
              disabled={isSendingEmail || !emailSubject.trim() || !emailMessage.trim()}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isSendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer l'email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chat Global */}
      

      <AdvancedProductModal
        isOpen={showAdvancedProductModal}
        onClose={() => setShowAdvancedProductModal(false)}
        product={selectedProduct}
        mode={productModalMode}
      />
    </div>
  )
}