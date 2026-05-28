"use client"

import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, CreditCard, Wallet, Banknote,
  BarChart3, Download, RefreshCw, Eye, Settings,
  Users, Package, ShoppingCart, Star, Globe, PieChart,
  FileText, FileDown, Calendar, Filter, Search,
  CheckCircle, AlertTriangle, XCircle, Edit, Trash2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNotifications } from '@/components/ui/modern-notification'

// Interfaces pour la gestion financière
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
}

interface PointsWithdrawal {
  id: string
  userId: string
  userName: string
  pointsAmount: number
  fcfAmount: number
  status: 'pending' | 'approved' | 'rejected'
  withdrawalMethod: string
  bankDetails?: string
  mobileNumber?: string
  createdAt: string
  processedAt?: string
  rejectionReason?: string
}

interface Currency {
  code: string
  name: string
  symbol: string
  exchangeRate: number
  isDefault: boolean
}

export default function FinancialManagement() {
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()
  
  // États principaux
  const [stats, setStats] = useState({
    totalRevenue: 125000000,
    totalCommission: 6250000,
    totalPoints: 45600000,
    pendingWithdrawals: 1250000,
    monthlyGrowth: 12.5,
    averageOrderValue: 85000
  })
  
  // États pour les demandes de paiement
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequest | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // États pour les retraits de points
  const [pointsWithdrawals, setPointsWithdrawals] = useState<PointsWithdrawal[]>([])
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PointsWithdrawal | null>(null)
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)
  
  // États pour la configuration des points
  const [pointsConfig, setPointsConfig] = useState({
    pointValue: 0.01, // 1 point = 0.01 FCFA
    transferFees: 100, // Frais de transfert en FCFA
    purchaseValue: 0.01, // Valeur pour achats sur le site
    withdrawalValue: 0.01, // Valeur pour retraits
    socialShareValue: 5, // Points par partage sur réseaux sociaux
    minWithdrawal: 1000, // Seuil minimum de retrait
    maxWithdrawal: 100000 // Seuil maximum de retrait
  })

  // États pour la configuration des commissions
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed' | 'hybrid'>('percentage')
  const [commissionFixed, setCommissionFixed] = useState({
    enabled: false,
    amount: 5000
  })
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
  const [paymentFrequencies, setPaymentFrequencies] = useState({
    daily: false,
    weekly: false,
    monthly: true,
    quarterly: false
  })
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'pm1',
      name: 'FeexPay Mobile Money',
      type: 'mobile_money',
      isActive: true,
      fees: 2.5,
      processingTime: 'Instantané'
    },
    {
      id: 'pm2',
      name: 'Cartes Bancaires',
      type: 'card',
      isActive: true,
      fees: 3.0,
      processingTime: '24-48h'
    },
    {
      id: 'pm3',
      name: 'Virements Bancaires',
      type: 'bank_transfer',
      isActive: true,
      fees: 0.5,
      processingTime: '2-3 jours'
    }
  ])
  const [currencies, setCurrencies] = useState<Currency[]>([
    { code: 'XOF', name: 'Franc CFA', symbol: 'FCFA', exchangeRate: 1, isDefault: true },
    { code: 'USD', name: 'Dollar US', symbol: '$', exchangeRate: 0.0017, isDefault: false },
    { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0015, isDefault: false }
  ])
  const [defaultCurrency, setDefaultCurrency] = useState('XOF')
  
  // États pour les filtres et exports
  const [dateRange, setDateRange] = useState('month')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Chargement des données au montage
  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Données simulées pour les demandes de paiement
    const mockPaymentRequests: PaymentRequest[] = [
      {
        id: 'pr1',
        vendorId: 'v1',
        vendorName: 'TechStore Pro',
        orderIds: ['1', '3'],
        totalAmount: 1900000,
        commissionAmount: 190000,
        netAmount: 1710000,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        bankDetails: 'BOA CI - FR123456789',
        createdAt: '2024-12-20 09:00:00'
      },
      {
        id: 'pr2',
        vendorId: 'v2',
        vendorName: 'Electronics Plus',
        orderIds: ['2'],
        totalAmount: 750000,
        commissionAmount: 90000,
        netAmount: 660000,
        status: 'approved',
        paymentMethod: 'mobile_money',
        mobileNumber: '+225 05678901',
        createdAt: '2024-12-19 16:00:00',
        processedAt: '2024-12-20 10:00:00'
      }
    ]

    // Données simulées pour les retraits de points
    const mockPointsWithdrawals: PointsWithdrawal[] = [
      {
        id: 'pw1',
        userId: 'u1',
        userName: 'Jean Dupont',
        pointsAmount: 50000,
        fcfAmount: 500,
        status: 'pending',
        withdrawalMethod: 'mobile_money',
        mobileNumber: '+225 01234567',
        createdAt: '2024-12-20 11:00:00'
      },
      {
        id: 'pw2',
        userId: 'u2',
        userName: 'Marie Martin',
        pointsAmount: 100000,
        fcfAmount: 1000,
        status: 'approved',
        withdrawalMethod: 'bank_transfer',
        bankDetails: 'SGB CI - FR987654321',
        createdAt: '2024-12-19 14:00:00',
        processedAt: '2024-12-20 09:00:00'
      }
    ]

    setPaymentRequests(mockPaymentRequests)
    setPointsWithdrawals(mockPointsWithdrawals)
  }

  // Fonctions de gestion des demandes de paiement
  const handlePaymentRequestApproval = (requestId: string, approved: boolean) => {
    setPaymentRequests(paymentRequests.map(request =>
      request.id === requestId ? { 
        ...request, 
        status: approved ? 'approved' : 'rejected',
        processedAt: new Date().toLocaleString()
      } : request
    ))
    
    addNotification({
      type: approved ? 'success' : 'error',
      title: approved ? 'Demande Approuvée' : 'Demande Rejetée',
      message: approved ? 'La demande de paiement a été approuvée avec succès.' : 'La demande de paiement a été rejetée.',
      duration: 5000
    })
  }

  const handlePaymentRequestRejection = (requestId: string, reason: string) => {
    setPaymentRequests(paymentRequests.map(request =>
      request.id === requestId ? { 
        ...request, 
        status: 'rejected',
        rejectionReason: reason,
        rejectionDate: new Date().toLocaleString(),
        rejectionBy: 'Super Admin',
        processedAt: new Date().toLocaleString()
      } : request
    ))
    
    addNotification({
      type: 'warning',
      title: 'Demande Rejetée',
      message: `La demande de paiement a été rejetée. Motif: ${reason}`,
      duration: 5000
    })
    
    setIsRejectionModalOpen(false)
    setRejectionReason('')
  }

  const handlePaymentRequestDeletion = (requestId: string) => {
    setPaymentRequests(paymentRequests.map(request =>
      request.id === requestId ? { 
        ...request, 
        status: 'deleted',
        processedAt: new Date().toLocaleString()
      } : request
    ))
    
    addNotification({
      type: 'info',
      title: 'Demande Supprimée',
      message: 'La demande de paiement a été supprimée avec succès.',
      duration: 5000
    })
  }

  const handlePaymentRequestEdit = (requestId: string) => {
    addNotification({
      type: 'info',
      title: 'Édition de Demande',
      message: 'La demande de paiement est en cours d\'édition.',
      duration: 5000
    })
  }

  // Fonctions de gestion des retraits de points
  const handleWithdrawalApproval = (withdrawalId: string, approved: boolean) => {
    setPointsWithdrawals(pointsWithdrawals.map(withdrawal =>
      withdrawal.id === withdrawalId ? { 
        ...withdrawal, 
        status: approved ? 'approved' : 'rejected',
        processedAt: new Date().toLocaleString()
      } : withdrawal
    ))
    
    addNotification({
      type: approved ? 'success' : 'warning',
      title: approved ? 'Retrait Approuvé' : 'Retrait Rejeté',
      message: approved ? 'Le retrait de points a été approuvé avec succès.' : 'Le retrait de points a été rejeté.',
      duration: 5000
    })
  }

  // Fonctions d'export
  const exportToCSV = () => {
    addNotification({
      type: 'success',
      title: 'Export CSV',
      message: 'Les données ont été exportées en CSV avec succès.',
      duration: 4000
    })
  }

  const exportToPDF = () => {
    addNotification({
      type: 'success',
      title: 'Export PDF',
      message: 'Le rapport PDF a été généré avec succès.',
      duration: 4000
    })
  }

  // Fonction de formatage des prix
  const formatPrice = (price: number, currency: string = 'XOF') => {
    if (currency === 'XOF') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
      }).format(price)
    }
    
    const selectedCurrency = currencies.find(c => c.code === currency)
    if (selectedCurrency) {
      const convertedAmount = price * selectedCurrency.exchangeRate
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: selectedCurrency.code
      }).format(convertedAmount)
    }
    
    return price.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion Financière</h2>
            <p className="text-gray-600 mt-2">
              Suivi des revenus, commissions et gestion des points de fidélité
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sélecteur de devise */}
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger className="w-32">
                <Globe className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportToCSV}>
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 min-h-[140px]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-600 mb-2">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-green-900 leading-tight break-words">
                  {formatPrice(stats.totalRevenue, defaultCurrency)}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  +{stats.monthlyGrowth}% ce mois
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 min-h-[140px]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-600 mb-2">Commissions</p>
                <p className="text-2xl font-bold text-blue-900 leading-tight break-words">
                  {formatPrice(stats.totalCommission, defaultCurrency)}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  5% du CA total
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 min-h-[140px]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-600 mb-2">Points en Circulation</p>
                <p className="text-2xl font-bold text-orange-900 leading-tight">
                  {(stats.totalPoints / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-orange-700 mt-1 break-words">
                  Valeur: {formatPrice(stats.totalPoints * pointsConfig.pointValue, defaultCurrency)}
                </p>
              </div>
              <Star className="h-10 w-10 text-orange-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation par onglets */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 gap-2">
          <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
          <TabsTrigger value="payment-requests">Demande Paiem.</TabsTrigger>
          <TabsTrigger value="points">Points & Fidélité</TabsTrigger>
          <TabsTrigger value="withdrawals">Retraits Points</TabsTrigger>
          <TabsTrigger value="configuration">Config. Finance</TabsTrigger>
          <TabsTrigger value="commission-config">Config. Comm.</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-8">
            {/* Statistiques Globales du Site */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Statistiques Financières Globales du Site</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 min-h-[120px]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 mb-2">Chiffre d'Affaires Total</p>
                        <p className="text-lg font-bold text-blue-900 leading-tight break-words">{formatPrice(stats.totalRevenue, defaultCurrency)}</p>
                        <p className="text-xs text-blue-700 mt-1">+{stats.monthlyGrowth}% ce mois</p>
                      </div>
                      <TrendingUp className="h-6 w-6 text-blue-600 flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 min-h-[120px]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-600 mb-2">Commandes Total</p>
                        <p className="text-lg font-bold text-green-900 leading-tight">2,847</p>
                        <p className="text-xs text-green-700 mt-1">+15% ce mois</p>
                      </div>
                      <ShoppingCart className="h-6 w-6 text-green-600 flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 min-h-[120px]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-600 mb-2">Vendeurs Actifs</p>
                        <p className="text-lg font-bold text-purple-900 leading-tight">156</p>
                        <p className="text-xs text-purple-700 mt-1">+8 nouveaux</p>
                      </div>
                      <Users className="h-6 w-6 text-purple-600 flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 min-h-[120px]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between h-full">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-orange-600 mb-2">Panier Moyen</p>
                        <p className="text-lg font-bold text-orange-900 leading-tight break-words">{formatPrice(stats.averageOrderValue, defaultCurrency)}</p>
                        <p className="text-xs text-orange-700 mt-1">+5% ce mois</p>
                      </div>
                      <Package className="h-6 w-6 text-orange-600 flex-shrink-0 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Évolution des Revenus et Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution des Revenus (12 derniers mois)</CardTitle>
                  <CardDescription>Performance mensuelle détaillée</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { month: 'Décembre 2024', amount: 125000000, growth: 12.5, color: 'bg-green-600' },
                      { month: 'Novembre 2024', amount: 110000000, growth: 8.2, color: 'bg-blue-600' },
                      { month: 'Octobre 2024', amount: 102000000, growth: 15.3, color: 'bg-purple-600' },
                      { month: 'Septembre 2024', amount: 88500000, growth: 6.8, color: 'bg-orange-600' },
                      { month: 'Août 2024', amount: 83000000, growth: 4.2, color: 'bg-red-600' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.month}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">{formatPrice(item.amount, defaultCurrency)}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${item.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {item.growth > 0 ? '+' : ''}{item.growth}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full`} style={{ width: `${Math.min((item.amount / 125000000) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des Commissions</CardTitle>
                  <CardDescription>Par catégorie de vendeur et produit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3 text-gray-700">Par Type de Vendeur</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Vendeurs Premium</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">3.2M FCFA</span>
                            <span className="text-xs text-green-600">+25%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '51%' }}></div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Vendeurs Standard</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">3.0M FCFA</span>
                            <span className="text-xs text-blue-600">+18%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '48%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-gray-700">Par Catégorie de Produit</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Électronique</span>
                          <span className="font-medium">2.1M FCFA</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Vêtements</span>
                          <span className="font-medium">1.8M FCFA</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Alimentation</span>
                          <span className="font-medium">1.2M FCFA</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Beauté</span>
                          <span className="font-medium">0.9M FCFA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Vendeurs avec Statistiques Individuelles */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Statistiques Financières par Vendeur</h3>
                <div className="flex items-center gap-3">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrer par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les vendeurs</SelectItem>
                      <SelectItem value="premium">Vendeurs Premium</SelectItem>
                      <SelectItem value="standard">Vendeurs Standard</SelectItem>
                      <SelectItem value="new">Nouveaux vendeurs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'v1',
                    name: 'TechStore Pro',
                    type: 'Premium',
                    revenue: 45000000,
                    orders: 156,
                    commission: 4500000,
                    growth: 28.5,
                    avatar: 'TS',
                    color: 'from-purple-500 to-purple-600'
                  },
                  {
                    id: 'v2',
                    name: 'Electronics Plus',
                    type: 'Premium',
                    revenue: 38000000,
                    orders: 134,
                    commission: 4560000,
                    growth: 22.1,
                    avatar: 'EP',
                    color: 'from-blue-500 to-blue-600'
                  },
                  {
                    id: 'v3',
                    name: 'Fashion House',
                    type: 'Standard',
                    revenue: 28000000,
                    orders: 98,
                    commission: 2240000,
                    growth: 15.8,
                    avatar: 'FH',
                    color: 'from-green-500 to-green-600'
                  },
                  {
                    id: 'v4',
                    name: 'Beauty Corner',
                    type: 'Standard',
                    revenue: 22000000,
                    orders: 87,
                    commission: 3300000,
                    growth: 31.2,
                    avatar: 'BC',
                    color: 'from-pink-500 to-pink-600'
                  },
                  {
                    id: 'v5',
                    name: 'Sports Gear',
                    type: 'Standard',
                    revenue: 18500000,
                    orders: 76,
                    commission: 1850000,
                    growth: 12.4,
                    avatar: 'SG',
                    color: 'from-orange-500 to-orange-600'
                  },
                  {
                    id: 'v6',
                    name: 'Home & Garden',
                    type: 'Standard',
                    revenue: 16500000,
                    orders: 65,
                    commission: 1650000,
                    growth: 8.9,
                    avatar: 'HG',
                    color: 'from-teal-500 to-teal-600'
                  }
                ].map((vendor) => (
                  <Card key={vendor.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${vendor.color} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                          {vendor.avatar}
                        </div>
                        <Badge variant={vendor.type === 'Premium' ? 'default' : 'secondary'}>
                          {vendor.type}
                        </Badge>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{vendor.name}</h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Chiffre d'affaires:</span>
                          <span className="font-medium">{formatPrice(vendor.revenue, defaultCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commandes:</span>
                          <span className="font-medium">{vendor.orders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commissions:</span>
                          <span className="font-medium text-red-600">{formatPrice(vendor.commission, defaultCurrency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Croissance:</span>
                          <span className={`font-medium ${vendor.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {vendor.growth > 0 ? '+' : ''}{vendor.growth}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Panier moyen: {formatPrice(vendor.revenue / vendor.orders, defaultCurrency)}</span>
                          <span>Commission: {((vendor.commission / vendor.revenue) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Métriques de Performance Avancées */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Métriques de Performance</CardTitle>
                  <CardDescription>Indicateurs clés de performance financière</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Taux de Conversion</span>
                      <span className="text-lg font-bold text-green-600">3.2%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Taux de Rétention</span>
                      <span className="text-lg font-bold text-blue-600">78.5%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Lifetime Value</span>
                      <span className="text-lg font-bold text-purple-600">{formatPrice(125000, defaultCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Temps de Récupération</span>
                      <span className="text-lg font-bold text-orange-600">8.2 mois</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prévisions et Tendances</CardTitle>
                  <CardDescription>Projections financières pour les prochains mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">Prévision Janvier 2025</span>
                        <span className="text-sm font-bold text-blue-900">+18%</span>
                      </div>
                      <div className="text-xs text-blue-700">
                        Basé sur la croissance saisonnière et les tendances actuelles
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">Objectif Q1 2025</span>
                        <span className="text-sm font-bold text-green-900">380M FCFA</span>
                      </div>
                      <div className="text-xs text-green-700">
                        Objectif trimestriel basé sur les performances historiques
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-800">Croissance Vendeurs</span>
                        <span className="text-sm font-bold text-purple-900">+25%</span>
                      </div>
                      <div className="text-xs text-purple-700">
                        Projection d'augmentation du nombre de vendeurs actifs
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment-requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Paiement des Vendeurs</CardTitle>
              <CardDescription>
                Gestion des demandes de retrait après validation des commandes. Les commissions sont automatiquement déduites selon les taux configurés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvées</SelectItem>
                    <SelectItem value="rejected">Rejetées</SelectItem>
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
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="quarter">Ce trimestre</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liste des demandes */}
              <div className="space-y-4">
                {paymentRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{request.vendorName}</h3>
                            <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                              {request.status === 'pending' ? 'En attente' : 
                               request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Montant total: <span className="font-medium">{formatPrice(request.totalAmount, defaultCurrency)}</span></div>
                            <div>Commission: <span className="font-medium text-red-600">{formatPrice(request.commissionAmount, defaultCurrency)}</span></div>
                            <div>Montant net: <span className="font-medium text-green-600">{formatPrice(request.netAmount, defaultCurrency)}</span></div>
                            <div>Méthode: {request.paymentMethod}</div>
                            <div>Créée le: {request.createdAt}</div>
                          </div>
                          {request.status === 'rejected' && (
                            <div className="mt-2 text-sm text-red-600">
                              <div><strong>Motif:</strong> {request.rejectionReason}</div>
                              <div><strong>Rejeté le:</strong> {request.rejectionDate}</div>
                              <div><strong>Par:</strong> {request.rejectionBy}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handlePaymentRequestApproval(request.id, true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedPaymentRequest(request)
                                  setIsRejectionModalOpen(true)
                                }}
                                className="border-orange-300 text-orange-600 hover:bg-orange-50"
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePaymentRequestEdit(request.id)}
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Rééditer
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePaymentRequestDeletion(request.id)}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Supprimer
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="points" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Points de Fidélité</CardTitle>
              <CardDescription>
                Paramétrage complet des valeurs, seuils et frais pour le système de points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Valeurs des points */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Valeurs des Points</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                      <Label className="text-sm font-medium text-blue-800">Valeur d'achat sur le site</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          value={pointsConfig.purchaseValue}
                          onChange={(e) => setPointsConfig({...pointsConfig, purchaseValue: Number(e.target.value)})}
                          className="border-blue-300"
                        />
                        <span className="text-sm text-blue-600">FCFA par point</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Valeur pour les achats sur la marketplace
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                      <Label className="text-sm font-medium text-green-800">Valeur de retrait</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="0.01"
                          value={pointsConfig.withdrawalValue}
                          onChange={(e) => setPointsConfig({...pointsConfig, withdrawalValue: Number(e.target.value)})}
                          className="border-green-300"
                        />
                        <span className="text-sm text-green-600">FCFA par point</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Valeur lors des retraits en FCFA
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-purple-50">
                      <Label className="text-sm font-medium text-purple-800">Partage réseaux sociaux</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          value={pointsConfig.socialShareValue}
                          onChange={(e) => setPointsConfig({...pointsConfig, socialShareValue: Number(e.target.value)})}
                          className="border-purple-300"
                        />
                        <span className="text-sm text-purple-600">points par partage</span>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Points gagnés par partage (défaut: 5)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seuils et frais */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Seuils et Frais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-orange-50">
                      <Label className="text-sm font-medium text-orange-800">Seuil minimum retrait</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          value={pointsConfig.minWithdrawal}
                          onChange={(e) => setPointsConfig({...pointsConfig, minWithdrawal: Number(e.target.value)})}
                          className="border-orange-300"
                        />
                        <span className="text-sm text-orange-600">points</span>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Minimum requis pour retrait
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-red-50">
                      <Label className="text-sm font-medium text-red-800">Seuil maximum retrait</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          value={pointsConfig.maxWithdrawal}
                          onChange={(e) => setPointsConfig({...pointsConfig, maxWithdrawal: Number(e.target.value)})}
                          className="border-red-300"
                        />
                        <span className="text-sm text-red-600">points</span>
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        Maximum autorisé par retrait
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
                      <Label className="text-sm font-medium text-yellow-800">Frais de transfert</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          value={pointsConfig.transferFees}
                          onChange={(e) => setPointsConfig({...pointsConfig, transferFees: Number(e.target.value)})}
                          className="border-yellow-300"
                        />
                        <span className="text-sm text-yellow-600">FCFA</span>
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Frais par transfert de points
                      </div>
                    </div>
                  </div>
                </div>

                {/* Règles de gain */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Règles de Gain</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h5 className="font-medium mb-3">Gain par achat</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">1 FCFA dépensé =</span>
                          <span className="text-sm font-medium">1 point</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Bonus vendeur premium =</span>
                          <span className="text-sm font-medium">+20%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Bonus parrainage =</span>
                          <span className="text-sm font-medium">+10%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h5 className="font-medium mb-3">Conversion et utilisation</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">100 points =</span>
                          <span className="text-sm font-medium">{formatPrice(100 * pointsConfig.purchaseValue, defaultCurrency)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Retrait 1000 points =</span>
                          <span className="text-sm font-medium">{formatPrice(1000 * pointsConfig.withdrawalValue - pointsConfig.transferFees, defaultCurrency)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Frais de retrait =</span>
                          <span className="text-sm font-medium text-red-600">{formatPrice(pointsConfig.transferFees, defaultCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end">
                  <Button 
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    onClick={() => {
                      addNotification({
                        type: 'success',
                        title: 'Configuration Sauvegardée',
                        message: 'Les paramètres des points de fidélité ont été sauvegardés avec succès.',
                        duration: 4000
                      })
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Sauvegarder la Configuration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Retraits de Points</CardTitle>
              <CardDescription>
                Supervision des demandes et historique des retraits de points de fidélité
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvés</SelectItem>
                    <SelectItem value="rejected">Rejetés</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="quarter">Ce trimestre</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Statistiques des retraits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Total Demandes</div>
                  <div className="text-2xl font-bold text-blue-900">{pointsWithdrawals.length}</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Points en Attente</div>
                  <div className="text-2xl font-bold text-green-900">
                    {pointsWithdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.pointsAmount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm font-medium text-orange-600">Valeur Totale</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {formatPrice(pointsWithdrawals.reduce((sum, w) => sum + w.fcfAmount, 0), defaultCurrency)}
                  </div>
                </div>
              </div>

              {/* Liste des retraits */}
              <div className="space-y-4">
                {pointsWithdrawals.map((withdrawal) => (
                  <Card key={withdrawal.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{withdrawal.userName}</h3>
                            <Badge variant={withdrawal.status === 'pending' ? 'secondary' : 'default'}>
                              {withdrawal.status === 'pending' ? 'En attente' : 
                               withdrawal.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Points demandés: <span className="font-medium">{withdrawal.pointsAmount.toLocaleString()}</span></div>
                            <div>Montant FCFA: <span className="font-medium text-green-600">{formatPrice(withdrawal.fcfAmount, defaultCurrency)}</span></div>
                            <div>Frais de transfert: <span className="font-medium text-red-600">{formatPrice(pointsConfig.transferFees, defaultCurrency)}</span></div>
                            <div>Montant net: <span className="font-medium text-blue-600">
                              {formatPrice(withdrawal.fcfAmount - pointsConfig.transferFees, defaultCurrency)}
                            </span></div>
                            <div>Méthode: {withdrawal.withdrawalMethod}</div>
                            <div>Créée le: {withdrawal.createdAt}</div>
                          </div>
                          {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                            <div className="mt-2 text-sm text-red-600">
                              <div><strong>Motif de rejet:</strong> {withdrawal.rejectionReason}</div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleWithdrawalApproval(withdrawal.id, true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal)
                                  setIsWithdrawalModalOpen(true)
                                }}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="mt-6">
          <div className="space-y-6">
            {/* Gestion multidevise */}
            <Card>
              <CardHeader>
                <CardTitle>Gestion Multidevise</CardTitle>
                <CardDescription>
                  Configuration des devises supportées et des taux de change
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Devise par défaut</Label>
                    <div className="mt-2">
                      <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-gray-600 mt-1">
                        Cette devise sera utilisée par défaut pour l'affichage des montants
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Devises supportées</Label>
                    <div className="mt-3 space-y-3">
                      {currencies.map((currency) => (
                        <div key={currency.code} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="defaultCurrency"
                                checked={currency.isDefault}
                                onChange={() => {
                                  setCurrencies(currencies.map(c => ({ ...c, isDefault: c.code === currency.code })))
                                  setDefaultCurrency(currency.code)
                                }}
                                className="text-orange-600 focus:ring-orange-500"
                              />
                              <span className="font-medium">{currency.symbol} {currency.name}</span>
                            </div>
                            <Badge variant="outline">{currency.code}</Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-gray-600">Taux: </span>
                              <span className="font-medium">1 {currency.code} = {currency.exchangeRate.toFixed(4)} FCFA</span>
                            </div>
                            <Switch 
                              checked={currency.isDefault}
                              onCheckedChange={() => {
                                setCurrencies(currencies.map(c => ({ ...c, isDefault: c.code === currency.code })))
                                setDefaultCurrency(currency.code)
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Note:</strong> Les taux de change sont mis à jour automatiquement. 
                      La devise par défaut détermine l'affichage principal des montants dans l'interface.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paramètres d'export et rapports */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres d'Export et Rapports</CardTitle>
                <CardDescription>
                  Configuration des formats d'export et des rapports financiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Format d'export par défaut</Label>
                      <Select defaultValue="csv">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Période de rapport par défaut</Label>
                      <Select defaultValue="month">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Semaine</SelectItem>
                          <SelectItem value="month">Mois</SelectItem>
                          <SelectItem value="quarter">Trimestre</SelectItem>
                          <SelectItem value="year">Année</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="autoExport" />
                    <Label htmlFor="autoExport">Export automatique des rapports</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch id="emailReports" />
                    <Label htmlFor="emailReports">Envoi automatique par email</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Onglet Configuration des Commissions */}
        <TabsContent value="commission-config" className="mt-6">
          <div className="space-y-6">
            {/* Configuration des commissions */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration des Commissions</CardTitle>
                <CardDescription>
                  Définir les taux de commission par catégorie de produits et les commissions fixes. Ces paramètres sont appliqués automatiquement lors du calcul des demandes de paiement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Type de commission */}
                <div>
                  <Label className="text-base font-medium">Type de Commission</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="percentage"
                        name="commissionType"
                        value="percentage"
                        checked={commissionType === 'percentage'}
                        onChange={(e) => setCommissionType(e.target.value as 'percentage' | 'fixed' | 'hybrid')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <Label htmlFor="percentage" className="cursor-pointer">Pourcentage par catégorie</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="fixed"
                        name="commissionType"
                        value="fixed"
                        checked={commissionType === 'fixed'}
                        onChange={(e) => setCommissionType(e.target.value as 'percentage' | 'fixed' | 'hybrid')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <Label htmlFor="fixed" className="cursor-pointer">Montant fixe</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="hybrid"
                        name="commissionType"
                        value="hybrid"
                        checked={commissionType === 'hybrid'}
                        onChange={(e) => setCommissionType(e.target.value as 'percentage' | 'fixed' | 'hybrid')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <Label htmlFor="hybrid" className="cursor-pointer">Hybride (fixe + pourcentage)</Label>
                    </div>
                  </div>
                </div>

                {/* Commission fixe */}
                {(commissionType === 'fixed' || commissionType === 'hybrid') && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <Label className="text-base font-medium text-orange-800">Commission Fixe</Label>
                    <div className="mt-2">
                      <Input 
                        type="number" 
                        value={commissionFixed.amount}
                        onChange={(e) => setCommissionFixed({...commissionFixed, amount: Number(e.target.value)})}
                        placeholder="Montant en FCFA"
                        className="border-orange-300"
                      />
                      <div className="text-xs text-orange-600 mt-1">
                        Montant fixe appliqué à chaque commande
                      </div>
                    </div>
                  </div>
                )}

                {/* Commissions par pourcentage */}
                {(commissionType === 'percentage' || commissionType === 'hybrid') && (
                  <div>
                    <Label className="text-base font-medium">Taux par Catégorie (%)</Label>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Taux par défaut</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.default}
                          onChange={(e) => setCommissionRates({...commissionRates, default: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Taux appliqué par défaut</div>
                      </div>
                      <div>
                        <Label>Électronique</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.electronics}
                          onChange={(e) => setCommissionRates({...commissionRates, electronics: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Smartphones, ordinateurs</div>
                      </div>
                      <div>
                        <Label>Vêtements</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.clothing}
                          onChange={(e) => setCommissionRates({...commissionRates, clothing: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Habillement et accessoires</div>
                      </div>
                      <div>
                        <Label>Alimentation</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.food}
                          onChange={(e) => setCommissionRates({...commissionRates, food: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Produits alimentaires</div>
                      </div>
                      <div>
                        <Label>Beauté</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.beauty}
                          onChange={(e) => setCommissionRates({...commissionRates, beauty: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Cosmétiques, parfums</div>
                      </div>
                      <div>
                        <Label>Sports</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.sports}
                          onChange={(e) => setCommissionRates({...commissionRates, sports: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Équipements sportifs</div>
                      </div>
                      <div>
                        <Label>Livres</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.books}
                          onChange={(e) => setCommissionRates({...commissionRates, books: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Livres et magazines</div>
                      </div>
                      <div>
                        <Label>Maison</Label>
                        <Input 
                          type="number" 
                          value={commissionRates.home}
                          onChange={(e) => setCommissionRates({...commissionRates, home: Number(e.target.value)})}
                        />
                        <div className="text-xs text-gray-500 mt-1">Meubles, décoration</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Exemples */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800 space-y-2">
                    <div><strong>Exemples de calcul:</strong></div>
                    {commissionType === 'percentage' && (
                      <div>• Vente de 100,000 FCFA avec taux de 10% → Commission: 10,000 FCFA, Net: 90,000 FCFA</div>
                    )}
                    {commissionType === 'fixed' && (
                      <div>• Vente de 50,000 FCFA avec commission fixe → Commission: {commissionFixed.amount.toLocaleString()} FCFA, Net: {(50000 - commissionFixed.amount).toLocaleString()} FCFA</div>
                    )}
                    {commissionType === 'hybrid' && (
                      <div>• Vente de 100,000 FCFA avec commission hybride → Commission: {Math.max(commissionFixed.amount, Math.round(100000 * commissionRates.default / 100)).toLocaleString()} FCFA</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fréquences de paiement */}
            <Card>
              <CardHeader>
                <CardTitle>Fréquences de Paiement</CardTitle>
                <CardDescription>
                  Configurer les périodes de paiement des commissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {Object.entries(paymentFrequencies).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="capitalize">{key}</Label>
                      <Switch 
                        checked={value as boolean}
                        onCheckedChange={(checked) => setPaymentFrequencies({...paymentFrequencies, [key]: checked})}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Modes de paiement */}
            <Card>
              <CardHeader>
                <CardTitle>Modes de Paiement</CardTitle>
                <CardDescription>
                  Configuration des méthodes de paiement supportées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{method.name}</h4>
                        <p className="text-sm text-gray-600">
                          Frais: {method.fees}% • Traitement: {method.processingTime}
                        </p>
                      </div>
                      <Switch checked={method.isActive} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de rejet de demande de paiement */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter la Demande de Paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motif du rejet *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Expliquez la raison du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsRejectionModalOpen(false)
                  setRejectionReason('')
                }}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (rejectionReason.trim()) {
                    handlePaymentRequestRejection(selectedPaymentRequest?.id || '', rejectionReason)
                  } else {
                    addNotification({
                      type: 'error',
                      title: 'Erreur',
                      message: 'Veuillez saisir un motif de rejet.',
                      duration: 4000
                    })
                  }
                }}
                disabled={!rejectionReason.trim()}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de rejet de retrait de points */}
      <Dialog open={isWithdrawalModalOpen} onOpenChange={setIsWithdrawalModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter le Retrait de Points</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="withdrawalRejectionReason">Motif du rejet *</Label>
              <Textarea
                id="withdrawalRejectionReason"
                placeholder="Expliquez la raison du rejet..."
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsWithdrawalModalOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  addNotification({
                    type: 'warning',
                    title: 'Retrait Rejeté',
                    message: 'Le retrait de points a été rejeté avec succès.',
                    duration: 4000
                  })
                  setIsWithdrawalModalOpen(false)
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
