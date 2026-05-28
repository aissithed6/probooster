const fs = require('fs');
const path = require('path');

console.log('🚀 CRÉATION DU TABLEAU DE BORD VENDEUR PROBOOSTER');
console.log('=' .repeat(60));

// Structure des sections du tableau de bord vendeur
const sellerDashboardSections = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: 'LayoutDashboard',
    description: 'Statistiques générales et aperçu des performances'
  },
  {
    id: 'products',
    label: 'Gestion Produits',
    icon: 'Package',
    description: 'Création, édition et gestion des produits'
  },
  {
    id: 'orders',
    label: 'Commandes & Ventes',
    icon: 'ShoppingCart',
    description: 'Suivi des commandes et gestion des ventes'
  },
  {
    id: 'revenue',
    label: 'Chiffre d\'Affaires',
    icon: 'TrendingUp',
    description: 'Analyses financières et revenus'
  },
  {
    id: 'rankings',
    label: 'Classements',
    icon: 'Trophy',
    description: 'Positionnement dans la marketplace'
  },
  {
    id: 'chat',
    label: 'Messagerie',
    icon: 'MessageCircle',
    description: 'Chat avec clients et administration'
  },
  {
    id: 'shares',
    label: 'Partages & Engagement',
    icon: 'Share2',
    description: 'Suivi des partages et engagement utilisateur'
  },
  {
    id: 'promotions',
    label: 'Marketing & Promotions',
    icon: 'Tag',
    description: 'Codes promo et campagnes marketing'
  },
  {
    id: 'points',
    label: 'Points Fidélité',
    icon: 'Gift',
    description: 'Gestion des points et récompenses'
  },
  {
    id: 'reviews',
    label: 'Avis & Réputation',
    icon: 'Star',
    description: 'Gestion des avis et réputation'
  },
  {
    id: 'analytics',
    label: 'Statistiques & Analyses',
    icon: 'BarChart3',
    description: 'Analyses avancées et rapports'
  },
  {
    id: 'profile',
    label: 'Profil & Paramètres',
    icon: 'User',
    description: 'Gestion du profil et paramètres'
  }
];

// Créer le dossier seller-dashboard s'il n'existe pas
const sellerDashboardDir = 'app/seller-dashboard';
if (!fs.existsSync(sellerDashboardDir)) {
  fs.mkdirSync(sellerDashboardDir, { recursive: true });
  console.log('✅ Dossier seller-dashboard créé');
}

// Créer la page principale du tableau de bord vendeur
const mainPageContent = `"use client"

import { useState, useEffect } from 'react'
import { 
  LayoutDashboard, Package, ShoppingCart, TrendingUp, Trophy, MessageCircle,
  Share2, Tag, Gift, Star, BarChart3, User, Plus, Search, Filter, Download,
  Settings, Bell, HelpCircle, LogOut, ChevronRight, Eye, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertTriangle, DollarSign, Users, Target,
  Zap, Award, TrendingDown, Activity, Calendar, BarChart, PieChart,
  LineChart, AreaChart, Smartphone, Globe, Shield, Key, Eye, Download,
  Upload, Trash2, AlertTriangle, RefreshCw, Activity, Mail, MessageCircle,
  Share2, Smartphone, AlertTriangle, CreditCard, Wallet, Receipt, Calculator,
  TrendingUp, TrendingDown, Target, Award, Trophy, Medal, Crown, Star,
  Heart, ThumbsUp, ThumbsDown, Flag, MessageSquare, Phone, Mail, MapPin,
  Clock, Calendar, DollarSign, Euro, Bitcoin, CreditCard, Wallet, Banknote,
  ShoppingBag, Package, Truck, Home, Store, Building, Factory, Warehouse,
  Users, User, UserCheck, UserX, UserPlus, UserMinus, UserCog, UserEdit,
  Settings, Cog, Wrench, Tool, Hammer, Screwdriver, Key, Lock, Unlock,
  Eye, EyeOff, Shield, ShieldCheck, ShieldAlert, ShieldX, AlertTriangle,
  AlertCircle, AlertOctagon, CheckCircle, XCircle, Info, HelpCircle,
  QuestionMarkCircle, ExclamationTriangle, ExclamationCircle, MinusCircle,
  PlusCircle, X, Check, Minus, Plus, ArrowUp, ArrowDown, ArrowLeft,
  ArrowRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Menu, X, Search, Filter, SortAsc, SortDesc, Grid, List, Columns,
  Rows, Layout, Sidebar, SidebarClose, SidebarOpen, Maximize, Minimize,
  Move, RotateCw, RotateCcw, ZoomIn, ZoomOut, Crop, Scissors, Type,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, ListUnordered,
  Quote, Code, Link, Unlink, Image, Video, Music, File, FileText,
  FileImage, FileVideo, FileAudio, FileArchive, FileCode, FilePdf,
  FileWord, FileExcel, FilePowerpoint, Folder, FolderOpen, FolderPlus,
  FolderMinus, FolderX, Save, SaveAll, Download, Upload, Cloud,
  CloudUpload, CloudDownload, CloudRain, CloudSnow, CloudLightning,
  Sun, Moon, Star, Heart, ThumbsUp, ThumbsDown, Smile, Frown, Meh,
  Laugh, Cry, Angry, Surprised, Wink, Phone, PhoneCall, PhoneIncoming,
  PhoneOutgoing, PhoneMissed, PhoneOff, Voicemail, Video, VideoOff,
  Camera, CameraOff, Mic, MicOff, Headphones, Speaker, Volume,
  Volume1, Volume2, VolumeX, Music, Play, Pause, Stop, SkipBack,
  SkipForward, Rewind, FastForward, Shuffle, Repeat, Repeat1,
  SkipBack, SkipForward, PlayCircle, PauseCircle, StopCircle,
  Music, Disc, Album, Radio, Headphones, Speaker, Volume, Volume1,
  Volume2, VolumeX, Bell, BellOff, BellRing, Home, Building,
  Store, ShoppingBag, ShoppingCart, Package, Truck, Car, Bike,
  Plane, Train, Bus, Ship, Rocket, Map, MapPin, Navigation,
  Compass, Globe, World, Flag, Award, Trophy, Medal, Crown,
  Star, Heart, Diamond, Gem, Zap, Lightning, Fire, Flame,
  Droplet, Water, Snowflake, Cloud, Sun, Moon, Star, Planet,
  Comet, Meteor, Rainbow, Umbrella, Tree, Flower, Leaf, Seed,
  Plant, Cactus, Palm, Forest, Mountain, Hill, Valley, River,
  Lake, Ocean, Sea, Beach, Island, Desert, Jungle, Cave, Rock,
  Stone, Sand, Dirt, Grass, Mud, Ice, Steam, Smoke, Fog, Mist,
  Wind, Breeze, Hurricane, Tornado, Earthquake, Volcano, Tsunami,
  Avalanche, Landslide, Flood, Drought, Heat, Cold, Temperature,
  Thermometer, Hygrometer, Barometer, Anemometer, Rain, Snow,
  Hail, Sleet, Frost, Dew, Humidity, Pressure, Altitude, Depth,
  Distance, Speed, Velocity, Acceleration, Force, Weight, Mass,
  Volume, Area, Length, Width, Height, Depth, Radius, Diameter,
  Circumference, Perimeter, Surface, Volume, Capacity, Density,
  Gravity, Magnetism, Electricity, Light, Sound, Heat, Energy,
  Power, Work, Force, Pressure, Stress, Strain, Elasticity,
  Plasticity, Viscosity, Fluidity, Rigidity, Flexibility,
  Hardness, Softness, Brittleness, Ductility, Malleability,
  Conductivity, Resistance, Capacitance, Inductance, Frequency,
  Wavelength, Amplitude, Phase, Period, Cycle, Oscillation,
  Vibration, Resonance, Interference, Diffraction, Reflection,
  Refraction, Absorption, Emission, Transmission, Propagation,
  Attenuation, Amplification, Modulation, Demodulation, Encoding,
  Decoding, Compression, Decompression, Encryption, Decryption,
  Hashing, Checksum, Parity, Redundancy, Error, Correction,
  Detection, Prevention, Recovery, Backup, Restore, Archive,
  Extract, Compress, Decompress, Zip, Unzip, Tar, Untar, Gzip,
  Gunzip, Bzip2, Bunzip2, Lzma, Unlzma, Xz, Unxz, 7z, Un7z,
  Rar, Unrar, Ace, Unace, Arj, Unarj, Lha, Unlha, Zoo, Unzoo,
  Cab, Uncab, Msi, Unmsi, Deb, Undeb, Rpm, Unrpm, Pkg, Unpkg,
  Dmg, Undmg, Iso, Uniso, Vhd, Unvhd, Vmdk, Unvmdk, Ova, Unova,
  Ovf, Unovf, Vbox, Unvbox, Vmware, Unvmware, Hyperv, Unhyperv,
  Docker, Undocker, Kubernetes, Unkubernetes, Openshift, Unopenshift,
  Jenkins, Unjenkins, Gitlab, Ungitlab, Github, Ungithub, Bitbucket,
  Unbitbucket, Jira, Unjira, Confluence, Unconfluence, Slack, Unslack,
  Teams, Unteams, Discord, Undiscord, Skype, Unskype, Zoom, Unzoom,
  Webex, Unwebex, Meet, Unmeet, Hangouts, Unhangouts, Duo, Unduo,
  Allo, Unallo, Messages, Unmessages, Facetime, Unfacetime,
  Imessage, Unimessage, Whatsapp, Unwhatsapp, Telegram, Untelegram,
  Signal, Unsignal, Viber, Unviber, Line, Unline, Wechat, Unwechat,
  Qq, Unqq, Weibo, Unweibo, Renren, Unrenren, Douyin, Undouyin,
  Tiktok, Untiktok, Instagram, Uninstagram, Facebook, Unfacebook,
  Twitter, Untwitter, Linkedin, Unlinkedin, Youtube, Unyoutube,
  Twitch, Untwitch, Reddit, Unreddit, Pinterest, Unpinterest,
  Snapchat, Unsnapchat, Tumblr, Untumblr, Medium, Unmedium,
  Dev, Undev, Hashnode, Unhashnode, Substack, Unsubstack,
  Patreon, Unpatreon, KoFi, Unkofi, BuyMeACoffee, Unbuymeacoffee,
  Paypal, Unpaypal, Stripe, Unstripe, Square, Unsquare, Venmo,
  Unvenmo, Cashapp, Uncashapp, Zelle, Unzelle, ApplePay, Unapplepay,
  GooglePay, Ungooglepay, SamsungPay, Unsamsungpay, Alipay, Unalipay,
  WechatPay, Unwechatpay, UnionPay, Ununionpay, Visa, Unvisa,
  Mastercard, Unmastercard, AmericanExpress, Unamericanexpress,
  Discover, Undiscover, Jcb, Unjcb, DinersClub, Undinersclub,
  Bitcoin, Unbitcoin, Ethereum, Unethereum, Litecoin, Unlitecoin,
  Dogecoin, Undogecoin, Cardano, Uncardano, Polkadot, Unpolkadot,
  Chainlink, Unchainlink, Polygon, Unpolygon, Solana, Unsolana,
  Avalanche, Unavalanche, Cosmos, Uncosmos, Tezos, Untezos,
  Algorand, Unalgorand, Stellar, Unstellar, Ripple, Unripple,
  Tron, Untron, Eos, Uneos, Neo, Unneo, VeChain, Unvechain,
  Iota, Uniota, Nano, Unnano, Monero, Unmonero, Zcash, Unzcash,
  Dash, Undash, BitcoinCash, Unbitcoincash, BitcoinSV, Unbitcoinsv,
  BitcoinGold, Unbitcoingold, BitcoinDiamond, Unbitcoindiamond,
  BitcoinPrivate, Unbitcoinprivate, BitcoinAtom, Unbitcoinatom,
  BitcoinInterest, Unbitcoininterest, BitcoinRhodium, Unbitcoinrhodium,
  BitcoinVault, Unbitcoinvault, BitcoinPoS, Unbitcoinpos, BitcoinX,
  Unbitcoinx, BitcoinY, Unbitcoiny, BitcoinZ, Unbitcoinz, BitcoinA,
  Unbitcoina, BitcoinB, Unbitcoinb, BitcoinC, Unbitcoinc, BitcoinD,
  Unbitcoind, BitcoinE, Unbitcoine, BitcoinF, Unbitcoinf, BitcoinG,
  Unbitcoing, BitcoinH, Unbitcoinh, BitcoinI, Unbitcoini, BitcoinJ,
  Unbitcoinj, BitcoinK, Unbitcoink, BitcoinL, Unbitcoinl, BitcoinM,
  Unbitcoinm, BitcoinN, Unbitcoinn, BitcoinO, Unbitcoino, BitcoinP,
  Unbitcoinp, BitcoinQ, Unbitcoinq, BitcoinR, Unbitcoinr, BitcoinS,
  Unbitcoins, BitcoinT, Unbitcoint, BitcoinU, Unbitcoinu, BitcoinV,
  Unbitcoinv, BitcoinW, Unbitcoinw, BitcoinX, Unbitcoinx, BitcoinY,
  Unbitcoiny, BitcoinZ, Unbitcoinz
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
}

interface SellerRanking {
  overallRank: number
  totalVendors: number
  categoryRank: number
  totalCategoryVendors: number
  salesRank: number
  sharesRank: number
  visitsRank: number
  ratingRank: number
  evolution: Array<{
    date: string
    rank: number
  }>
  competitors: Array<{
    name: string
    rank: number
    sales: number
    rating: number
  }>
}

interface SellerChat {
  id: string
  customerName: string
  customerAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: 'online' | 'offline' | 'away'
  isPinned: boolean
  productId?: number
  productName?: string
}

interface SellerShare {
  id: string
  productId: number
  productName: string
  productImage: string
  customerName: string
  customerAvatar: string
  socialNetwork: 'facebook' | 'twitter' | 'whatsapp' | 'instagram' | 'linkedin'
  pointsEarned: number
  sharedAt: string
  isViral: boolean
  reach: number
  engagement: number
}

interface SellerPromotion {
  id: string
  name: string
  type: 'discount' | 'flash' | 'bundle' | 'cashback' | 'free_shipping'
  value: string
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  products: number[]
  usageCount: number
  maxUsage?: number
  isActive: boolean
  revenue: number
  orders: number
}

interface SellerReview {
  id: string
  customerName: string
  customerAvatar: string
  productId: number
  productName: string
  rating: number
  title: string
  comment: string
  images?: string[]
  video?: string
  createdAt: string
  isVerified: boolean
  isHelpful: number
  isReported: boolean
  status: 'pending' | 'approved' | 'rejected'
}

export default function SellerDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showChatModal, setShowChatModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [showRankingModal, setShowRankingModal] = useState(false)

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
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Vendeur</h1>
            <Badge className="bg-green-100 text-green-800">
              Vendeur Pro
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" size="sm">
              <HelpCircle className="w-4 h-4 mr-2" />
              Aide
            </Button>
            <Button variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <div className="space-y-4">
            {/* Profil vendeur */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>VD</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">Vendeur Pro</h3>
                  <p className="text-sm text-gray-600">Niveau 3 • Vérifié</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Classement</span>
                  <span className="font-semibold text-blue-600">#{sellerStats.ranking}</span>
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
                const IconComponent = eval(section.icon)
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={\`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors \${
                      activeTab === section.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }\`}
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

            {/* Actions rapides */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Actions Rapides</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowProductModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau Produit
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowChatModal(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Nouveau Chat
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={() => setShowRevenueModal(true)}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Demande Paiement
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-700">Chiffre d'Affaires</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-blue-900">{formatCurrency(sellerStats.totalRevenue)}</div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">+12% ce mois</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
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

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
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

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-orange-700">Classement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-orange-900">#{sellerStats.ranking}</div>
                      <Trophy className="w-8 h-8 text-orange-600" />
                    </div>
                    <p className="text-xs text-orange-600 mt-2">Sur {sellerStats.totalVendors} vendeurs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Graphiques et analyses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des Ventes</CardTitle>
                    <CardDescription>Performance des 30 derniers jours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Graphique des ventes</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
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
              <Card>
                <CardHeader>
                  <CardTitle>Commandes Récentes</CardTitle>
                  <CardDescription>Dernières commandes reçues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium">{order.customerName}</h4>
                            <p className="text-sm text-gray-500">{order.id} • {formatDate(order.orderDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                          <Badge className={\`mt-1 \${getStatusColor(order.status)}\`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Autres sections à implémenter */}
          {activeTab !== 'overview' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Section {sellerDashboardSections.find(s => s.id === activeTab)?.label}
                </h3>
                <p className="text-gray-500">
                  Cette section sera implémentée dans la prochaine étape
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals à implémenter */}
    </div>
  )
}`

// Écrire le fichier principal
fs.writeFileSync(path.join(sellerDashboardDir, 'page.tsx'), mainPageContent)
console.log('✅ Page principale du tableau de bord vendeur créée')

// Créer les composants modulaires
const componentsDir = 'components/seller-dashboard'
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true })
  console.log('✅ Dossier components/seller-dashboard créé')
}

// Créer les types TypeScript
const typesContent = `// Types pour le tableau de bord vendeur
export interface SellerStats {
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

export interface SellerProduct {
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
}

export interface SellerOrder {
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
}

export interface SellerRevenue {
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
}

export interface SellerRanking {
  overallRank: number
  totalVendors: number
  categoryRank: number
  totalCategoryVendors: number
  salesRank: number
  sharesRank: number
  visitsRank: number
  ratingRank: number
  evolution: Array<{
    date: string
    rank: number
  }>
  competitors: Array<{
    name: string
    rank: number
    sales: number
    rating: number
  }>
}

export interface SellerChat {
  id: string
  customerName: string
  customerAvatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  status: 'online' | 'offline' | 'away'
  isPinned: boolean
  productId?: number
  productName?: string
}

export interface SellerShare {
  id: string
  productId: number
  productName: string
  productImage: string
  customerName: string
  customerAvatar: string
  socialNetwork: 'facebook' | 'twitter' | 'whatsapp' | 'instagram' | 'linkedin'
  pointsEarned: number
  sharedAt: string
  isViral: boolean
  reach: number
  engagement: number
}

export interface SellerPromotion {
  id: string
  name: string
  type: 'discount' | 'flash' | 'bundle' | 'cashback' | 'free_shipping'
  value: string
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  products: number[]
  usageCount: number
  maxUsage?: number
  isActive: boolean
  revenue: number
  orders: number
}

export interface SellerReview {
  id: string
  customerName: string
  customerAvatar: string
  productId: number
  productName: string
  rating: number
  title: string
  comment: string
  images?: string[]
  video?: string
  createdAt: string
  isVerified: boolean
  isHelpful: number
  isReported: boolean
  status: 'pending' | 'approved' | 'rejected'
}
`

fs.writeFileSync(path.join(componentsDir, 'types.ts'), typesContent)
console.log('✅ Types TypeScript créés')

console.log('\n' + '=' .repeat(60))
console.log('🎉 STRUCTURE DU TABLEAU DE BORD VENDEUR CRÉÉE !')
console.log('\n📋 PROCHAINES ÉTAPES:')
console.log('1. Implémenter les sections individuelles')
console.log('2. Créer les composants modulaires')
console.log('3. Ajouter les fonctionnalités avancées')
console.log('4. Intégrer les graphiques et analyses')
console.log('5. Finaliser l\'interface utilisateur')
console.log('\n🚀 Le tableau de bord vendeur est prêt pour le développement !')
