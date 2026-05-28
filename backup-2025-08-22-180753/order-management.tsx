"use client"

import { useState, useEffect } from 'react'
import { 
  ShoppingCart, Package, Truck, CheckCircle, Clock, AlertTriangle, Eye, DollarSign, Shield, CreditCard,
  MapPin, User, Calendar, TrendingUp, Filter, Search, Download, RefreshCw, Star, Mail, Phone,
  FileText, ArrowLeftRight, CheckCircle2, XCircle, Plus, Settings, Smartphone, Zap, Target, Edit, Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useNotifications } from '@/components/ui/modern-notification'

// Interfaces complètes
interface Order {
  id: string
  orderNumber: string
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

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')

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
  
  // États pour les retours et réclamations
  const [returns, setReturns] = useState<Order[]>([])
  const [selectedReturn, setSelectedReturn] = useState<Order | null>(null)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  
  // États pour les demandes de paiement
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
  const [selectedPaymentRequest, setSelectedPaymentRequest] = useState<PaymentRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  useEffect(() => {
    loadMockData()
  }, [])

  const loadMockData = () => {
    // Commandes simulées avec toutes les fonctionnalités
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-2024-001',
        customer: {
          name: 'Jean Dupont',
          email: 'jean.dupont@email.com',
          phone: '+225 01234567',
          address: '123 Rue de la Paix, Abidjan'
        },
        vendor: {
          id: 'v1',
          name: 'TechStore Pro',
          commissionRate: 10
        },
        products: [
          {
            id: '1',
            name: 'iPhone 15 Pro Max',
            quantity: 1,
            price: 800000,
            total: 800000
          }
        ],
        status: 'delivered',
        totalAmount: 800000,
        shippingAddress: '123 Rue de la Paix, Abidjan, Côte d\'Ivoire',
        paymentMethod: 'card',
        paymentStatus: 'paid',
        createdAt: '2024-12-15 10:30:00',
        updatedAt: '2024-12-19 14:00:00',
        deliveryDate: '2024-12-19 14:00:00',
        commission: 80000,
        pointsEarned: 8000,
        clientValidation: true,
        clientValidationDate: '2024-12-19 14:30:00'
      },
      {
        id: '2',
        orderNumber: 'ORD-2024-002',
        customer: {
          name: 'Marie Martin',
          email: 'marie.martin@email.com',
          phone: '+225 05678901',
          address: '456 Avenue des Fleurs, Bouaké'
        },
        vendor: {
          id: 'v2',
          name: 'Electronics Plus',
          commissionRate: 12
        },
        products: [
          {
            id: '2',
            name: 'Samsung Galaxy S24',
            quantity: 1,
            price: 750000,
            total: 750000
          }
        ],
        status: 'shipped',
        totalAmount: 750000,
        shippingAddress: '456 Avenue des Fleurs, Bouaké, Côte d\'Ivoire',
        paymentMethod: 'mobile_money',
        paymentStatus: 'paid',
        createdAt: '2024-12-16 15:45:00',
        updatedAt: '2024-12-19 09:30:00',
        commission: 90000,
        pointsEarned: 7500,
        clientValidation: false
      },
      {
        id: '3',
        orderNumber: 'ORD-2024-003',
        customer: {
          name: 'Pierre Durand',
          email: 'pierre.durand@email.com',
          phone: '+225 09876543',
          address: '789 Boulevard Central, Abidjan'
        },
        vendor: {
          id: 'v1',
          name: 'TechStore Pro',
          commissionRate: 10
        },
        products: [
          {
            id: '3',
            name: 'MacBook Air M2',
            quantity: 1,
            price: 1100000,
            total: 1100000
          }
        ],
        status: 'pending',
        totalAmount: 1100000,
        shippingAddress: '789 Boulevard Central, Abidjan, Côte d\'Ivoire',
        paymentMethod: 'card',
        paymentStatus: 'pending',
        createdAt: '2024-12-19 11:20:00',
        updatedAt: '2024-12-19 11:20:00',
        commission: 110000,
        pointsEarned: 11000,
        clientValidation: false
      },
      {
        id: '4',
        orderNumber: 'ORD-2024-004',
        customer: {
          name: 'Sophie Bernard',
          email: 'sophie.bernard@email.com',
          phone: '+225 01234568',
          address: '321 Rue du Commerce, Abidjan'
        },
        vendor: {
          id: 'v2',
          name: 'Electronics Plus',
          commissionRate: 12
        },
        products: [
          {
            id: '4',
            name: 'AirPods Pro',
            quantity: 1,
            price: 250000,
            total: 250000
          }
        ],
        status: 'returned',
        totalAmount: 250000,
        shippingAddress: '321 Rue du Commerce, Abidjan, Côte d\'Ivoire',
        paymentMethod: 'mobile_money',
        paymentStatus: 'paid',
        createdAt: '2024-12-18 14:00:00',
        updatedAt: '2024-12-20 10:00:00',
        commission: 30000,
        pointsEarned: 2500,
        clientValidation: true,
        returnReason: 'Produit défectueux - son de mauvaise qualité',
        returnStatus: 'pending'
      }
    ]

    // Demandes de paiement simulées avec calcul des commissions
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

    // Modes de paiement supportés
    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: 'pm1',
        name: 'FeexPay Mobile Money',
        type: 'mobile_money',
        isActive: true,
        fees: 2.5,
        processingTime: 'Instantané',
        supportedCurrencies: ['XOF', 'USD', 'EUR']
      },
      {
        id: 'pm2',
        name: 'Cartes Bancaires',
        type: 'card',
        isActive: true,
        fees: 3.0,
        processingTime: '24-48h',
        supportedCurrencies: ['XOF', 'USD', 'EUR', 'GBP']
      },
      {
        id: 'pm3',
        name: 'Virements Bancaires',
        type: 'bank_transfer',
        isActive: true,
        fees: 0.5,
        processingTime: '2-3 jours',
        supportedCurrencies: ['XOF', 'USD', 'EUR']
      }
    ]

    setOrders(mockOrders)
    setPaymentRequests(mockPaymentRequests)
    setPaymentMethods(mockPaymentMethods)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price)
  }

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toLocaleString() } : order
    ))
    
    addNotification({
      type: 'success',
      title: 'Statut Modifié',
      message: `Le statut de la commande a été modifié vers "${newStatus}".`,
      duration: 4000
    })
  }

  const handleClientValidation = (orderId: string) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { 
        ...order, 
        clientValidation: true, 
        clientValidationDate: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString()
      } : order
    ))
    
    addNotification({
      type: 'success',
      title: 'Validation Client',
      message: 'La livraison a été validée par le client avec succès.',
      duration: 4000
    })
  }

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
    // Logique pour éditer la demande de paiement
    addNotification({
      type: 'info',
      title: 'Édition de Demande',
      message: 'La demande de paiement est en cours d\'édition.',
      duration: 5000
    })
  }

  // Gestion des retours et réclamations
  const handleReturnApproval = (orderId: string, approved: boolean, reason?: string) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { 
        ...order, 
        returnStatus: approved ? 'approved' : 'rejected',
        returnReason: reason || order.returnReason,
        updatedAt: new Date().toLocaleString()
      } : order
    ))
    
    addNotification({
      type: approved ? 'success' : 'warning',
      title: approved ? 'Retour Approuvé' : 'Retour Rejeté',
      message: approved ? 'Le retour a été approuvé et sera traité.' : 'Le retour a été rejeté.',
      duration: 4000
    })
  }

  const handleReturnProcessing = (orderId: string) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { 
        ...order, 
        returnStatus: 'completed',
        updatedAt: new Date().toLocaleString()
      } : order
    ))
    
    addNotification({
      type: 'success',
      title: 'Retour Traité',
      message: 'Le retour a été traité avec succès.',
      duration: 4000
    })
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

  // Créer une nouvelle demande de paiement
  const createPaymentRequest = (vendorId: string, orderIds: string[]) => {
    const vendorOrders = orders.filter(order => 
      order.vendor.id === vendorId && 
      orderIds.includes(order.id) && 
      order.clientValidation && 
      order.paymentStatus === 'paid'
    )
    
    if (vendorOrders.length === 0) return
    
    const totalAmount = vendorOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    const commissionAmount = vendorOrders.reduce((sum, order) => sum + calculateCommission(order), 0)
    const netAmount = totalAmount - commissionAmount
    
    const newRequest: PaymentRequest = {
      id: `pr${Date.now()}`,
      vendorId,
      vendorName: vendorOrders[0].vendor.name,
      orderIds,
      totalAmount,
      commissionAmount,
      netAmount,
      status: 'pending',
      paymentMethod: 'bank_transfer',
      createdAt: new Date().toLocaleString()
    }
    
    setPaymentRequests([...paymentRequests, newRequest])
    
    addNotification({
      type: 'success',
      title: 'Demande Créée',
      message: `Nouvelle demande de paiement créée pour ${vendorOrders[0].vendor.name} - Montant: ${formatPrice(netAmount)}`,
      duration: 5000
    })
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
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En attente' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Payé' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Échoué' },
      refunded: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Remboursé' }
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
                            <h3 className="font-semibold">{order.orderNumber}</h3>
                            {getStatusBadge(order.status)}
                            {getPaymentStatusBadge(order.paymentStatus)}
                            {order.clientValidation && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Validée Client
                              </Badge>
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

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedOrder(order)
                          setIsViewModalOpen(true)
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Select onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}>
                          <SelectTrigger className="w-32">
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
                             className="bg-green-600 hover:bg-green-700"
                           >
                             <CheckCircle className="h-4 w-4 mr-1" />
                             Valider Client
                           </Button>
                         )}
                         {order.status === 'delivered' && order.clientValidation && order.paymentStatus === 'paid' && (
                           <Button 
                             size="sm" 
                             onClick={() => createPaymentRequest(order.vendor.id, [order.id])}
                             className="bg-blue-600 hover:bg-blue-700"
                           >
                             <CreditCard className="h-4 w-4 mr-1" />
                             Demande Paiement
                           </Button>
                         )}
                      </div>
                    </div>
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
         <DialogContent className="max-w-4xl">
           <DialogHeader>
             <DialogTitle>Détails de la Commande</DialogTitle>
           </DialogHeader>
           {selectedOrder && (
             <div className="space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                   <h3 className="font-medium mb-2">Informations de la Commande</h3>
                   <div className="space-y-2 text-sm">
                     <div><strong>Numéro:</strong> {selectedOrder.orderNumber}</div>
                     <div><strong>Montant:</strong> {formatPrice(selectedOrder.totalAmount)}</div>
                     <div><strong>Commission:</strong> {formatPrice(selectedOrder.commission)}</div>
                     <div><strong>Statut:</strong> {getStatusBadge(selectedOrder.status)}</div>
                     <div><strong>Méthode de paiement:</strong> {selectedOrder.paymentMethod}</div>
                     <div><strong>Statut de paiement:</strong> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                   </div>
                 </div>
                 <div>
                   <h3 className="font-medium mb-2">Client</h3>
                   <div className="space-y-2 text-sm">
                     <div><strong>Nom:</strong> {selectedOrder.customer.name}</div>
                     <div><strong>Email:</strong> {selectedOrder.customer.email}</div>
                     <div><strong>Téléphone:</strong> {selectedOrder.customer.phone}</div>
                     <div><strong>Adresse:</strong> {selectedOrder.customer.address}</div>
                   </div>
                 </div>
               </div>
               <div className="flex justify-end gap-3 pt-4 border-t">
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
     </div>
   )
 }
