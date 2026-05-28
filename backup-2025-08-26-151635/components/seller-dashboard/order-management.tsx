"use client"

import { useState, useEffect } from 'react'
import { 
  Search, Eye, Edit, Download, Package, Truck, 
  CheckCircle, XCircle, DollarSign, User, MapPin, 
  Phone, Mail, FileText, Printer, Star, RefreshCw, 
  CheckCircle2, Package2, Settings,
  TrendingUp, BarChart3, PieChart, Calendar, Filter,
  AlertTriangle, Clock, AlertCircle, Info, Zap,
  Target, Award, Trophy, TrendingDown, Users,
  MessageSquare, Bell, CreditCard, Smartphone,
  Shield, AlertCircle as AlertCircleIcon, Copy, Share, Receipt, Archive, Trash2, Save
} from 'lucide-react'

// Icônes officielles des réseaux sociaux
import { 
  FaWhatsapp, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram,
  FaTelegram,
  FaDiscord
} from 'react-icons/fa'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

import { SellerOrder } from './types'

interface OrderManagementProps {
  orders: SellerOrder[]
  onOrderUpdate: (order: SellerOrder) => void
  onOrderStatusChange: (orderId: string, status: SellerOrder['status']) => void
  onPaymentRequest?: (orderId: string) => void
  onCustomerValidation?: (orderId: string) => void
}

interface OrderAnalytics {
  daily: { date: string; revenue: number; orders: number }[]
  weekly: { week: string; revenue: number; orders: number }[]
  monthly: { month: string; revenue: number; orders: number }[]
}

interface MarketplaceRanking {
  position: number
  totalVendors: number
  salesVolume: number
  sharesCount: number
  productViews: number
  category: string
  trend: 'up' | 'down' | 'stable'
}

type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly'
type DateRange = { start: Date; end: Date }
type NotificationItem = {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  timestamp: Date
}

export default function OrderManagement({ 
  orders, 
  onOrderUpdate, 
  onOrderStatusChange,
  onPaymentRequest,
  onCustomerValidation
}: OrderManagementProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SellerOrder | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrdersForBulkAction, setSelectedOrdersForBulkAction] = useState<string[]>([])
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false)
  
  // Nouveaux états pour les fonctionnalités avancées
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showRankingModal, setShowRankingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showReturnsModal, setShowReturnsModal] = useState(false)
  const [showAllPaymentsModal, setShowAllPaymentsModal] = useState(false)
  const [showDeliveryOptimizationModal, setShowDeliveryOptimizationModal] = useState(false)
  const [showDisputesModal, setShowDisputesModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showAIConfigModal, setShowAIConfigModal] = useState(false)
  const [showForecastsModal, setShowForecastsModal] = useState(false)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [showEditOrderModal, setShowEditOrderModal] = useState(false)
  const [showDisputeDetailsModal, setShowDisputeDetailsModal] = useState(false)
  const [selectedDispute, setSelectedDispute] = useState<{
    id: string
    orderId: string
    type: string
    description: string
    status: 'en_cours' | 'résolu' | 'fermé'
    openedAt: string
    resolvedAt?: string
    customerName: string
    priority: 'normal' | 'urgent' | 'critique'
  } | null>(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('daily')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })
  
  // Données simulées pour les analyses et classements
  const [orderAnalytics] = useState<OrderAnalytics>({
    daily: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 20) + 5
    })),
    weekly: Array.from({ length: 12 }, (_, i) => ({
      week: `Semaine ${i + 1}`,
      revenue: Math.floor(Math.random() * 300000) + 50000,
      orders: Math.floor(Math.random() * 100) + 20
    })),
    monthly: Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleDateString('fr-FR', { month: 'long' }),
      revenue: Math.floor(Math.random() * 1000000) + 200000,
      orders: Math.floor(Math.random() * 400) + 100
    }))
  })
  
  const [marketplaceRanking] = useState<MarketplaceRanking>({
    position: 3,
    totalVendors: 156,
    salesVolume: 1250000,
    sharesCount: 2847,
    productViews: 15678,
    category: 'Électronique',
    trend: 'up'
  })

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
      case 'returned': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter
    return matchesSearch && matchesStatus && matchesPayment
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    returned: orders.filter(o => o.status === 'returned').length,
    delayed: orders.filter(o => o.status === 'delivered' && o.deliveryDate && new Date(o.deliveryDate) > new Date()).length,
    notDelivered: orders.filter(o => o.status === 'shipped' && o.deliveryDate && new Date() > new Date(o.deliveryDate)).length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    totalCommissions: orders.reduce((sum, order) => sum + order.commission, 0),
    netRevenue: orders.reduce((sum, order) => sum + order.netRevenue, 0),
    pendingPayments: orders.filter(o => o.status === 'delivered' && o.paymentStatus === 'pending').length,
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
    conversionRate: orders.length > 0 ? (orders.filter(o => o.status === 'delivered').length / orders.length) * 100 : 0
  }

  const handleStatusChange = (orderId: string, newStatus: SellerOrder['status']) => {
    onOrderStatusChange(orderId, newStatus)
  }

  const handleExportOrders = () => {
    setIsLoading(true)
    setTimeout(() => {
      const csvContent = [
        ['ID', 'Client', 'Date', 'Statut', 'Paiement', 'Total'],
        ...filteredOrders.map(order => [
          order.id,
          order.customerName,
          formatDate(order.orderDate),
          order.status,
          order.paymentStatus,
          formatCurrency(order.totalAmount)
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `commandes_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setIsLoading(false)
      showNotification('Export réussi', 'Fichier CSV téléchargé avec succès', 'success')
    }, 1000)
  }

  const handlePrintReport = () => {
    setIsLoading(true)
    setTimeout(() => {
      const reportContent = `Rapport des commandes - ${new Date().toLocaleDateString('fr-FR')}`
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>Rapport</title></head><body><h1>${reportContent}</h1></body></html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
      setIsLoading(false)
      showNotification('Impression lancée', 'Rapport envoyé à l\'imprimante', 'success')
    }, 1500)
  }

  const handleGenerateInvoices = () => {
    setIsLoading(true)
    setTimeout(() => {
      const invoicesToGenerate = filteredOrders.filter(order => 
        order.status === 'delivered' && order.paymentStatus === 'paid'
      )
      
      if (invoicesToGenerate.length === 0) {
        showNotification('Information', 'Aucune facture à générer', 'info')
        setIsLoading(false)
        return
      }
      
      const invoiceContent = invoicesToGenerate.map(order => 
        `FACTURE ${order.id} - ${order.customerName}`
      ).join('\n')
      
      const blob = new Blob([invoiceContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factures_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Factures générées', `${invoicesToGenerate.length} facture(s) téléchargée(s)`, 'success')
    }, 2000)
  }

  const handleEditOrder = (order: SellerOrder) => {
    setEditingOrder(order)
    setShowEditModal(true)
  }

  const handleSaveOrderEdit = (updatedOrder: SellerOrder) => {
    onOrderUpdate(updatedOrder)
    setShowEditModal(false)
    setEditingOrder(null)
  }

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      onOrderStatusChange(orderId, 'cancelled')
      showNotification('Commande annulée', `La commande ${orderId} a été annulée`, 'warning')
    }
  }

  const handleReturnOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir marquer cette commande comme retournée ?')) {
      onOrderStatusChange(orderId, 'returned')
      showNotification('Commande retournée', `La commande ${orderId} a été marquée comme retournée`, 'info')
    }
  }

  const handleRefreshData = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleBulkAction = (action: 'confirm' | 'ship' | 'deliver' | 'cancel') => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }

    setIsLoading(true)
    const actionNames = {
      confirm: 'confirmation',
      ship: 'expédition',
      deliver: 'livraison',
      cancel: 'annulation'
    }

    setTimeout(() => {
      setIsLoading(false)
      setShowBulkActionsModal(false)
      showNotification(
        'Action en lot réussie', 
        `${selectedOrdersForBulkAction.length} commande(s) ${actionNames[action]} effectuée(s)`, 
        'success'
      )
      setSelectedOrdersForBulkAction([])
    }, 1500)
  }

  // Nouvelles fonctions pour les fonctionnalités avancées
  const handlePaymentRequest = (orderId: string) => {
    if (onPaymentRequest) {
      onPaymentRequest(orderId)
    } else {
      setShowPaymentModal(true)
      setSelectedOrder(orders.find(o => o.id === orderId) || null)
    }
  }

  const handleCustomerValidation = (orderId: string) => {
    if (onCustomerValidation) {
      onCustomerValidation(orderId)
    } else {
      showNotification('Demande envoyée', 'Demande de validation client envoyée. Le client doit confirmer la réception.', 'info')
    }
  }

  const handleExportAnalytics = (format: 'csv' | 'pdf') => {
    setIsLoading(true)
    setTimeout(() => {
      const analyticsData = orderAnalytics[analyticsPeriod]
      let exportContent = ''
      
      if (format === 'csv') {
        exportContent = [
          ['Période', 'Chiffre d\'affaires', 'Nombre de commandes'],
          ...analyticsData.map(item => [
            'date' in item ? item.date : 'week' in item ? item.week : item.month,
            formatCurrency(item.revenue),
            item.orders.toString()
          ])
        ].map(row => row.join(',')).join('\n')
        
        const blob = new Blob([exportContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `analytics_${analyticsPeriod}_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
      
      setIsLoading(false)
    }, 1500)
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <BarChart3 className="w-4 h-4 text-blue-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  // Nouvelles fonctions pour les boutons des cartes de statistiques
  const handleViewAllOrders = () => {
    setActiveTab('all')
    // Scroll vers la liste des commandes
    document.getElementById('orders-list')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleViewDeliveredOrders = () => {
    setStatusFilter('delivered')
    setActiveTab('delivered')
    // Scroll vers la liste des commandes
    document.getElementById('orders-list')?.scrollIntoView({ behavior: 'smooth' })
    showNotification('Filtre appliqué', 'Affichage des commandes livrées', 'info')
  }

  const handleViewShippedOrders = () => {
    setStatusFilter('shipped')
    setActiveTab('shipped')
    // Scroll vers la liste des commandes
    document.getElementById('orders-list')?.scrollIntoView({ behavior: 'smooth' })
    showNotification('Filtre appliqué', 'Affichage des commandes en transit', 'info')
  }

  const handleViewRevenueDetails = () => {
    setShowAnalyticsModal(true)
  }

  const handleViewPendingPayments = () => {
    setShowPaymentModal(true)
  }

  const handleViewReturns = () => {
    setShowReturnsModal(true)
  }

  // Fonction pour actualiser les paiements en attente
  const handleRefreshPendingPayments = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showNotification('Actualisation terminée', 'Les données des paiements en attente ont été actualisées', 'success')
    }, 1500)
  }

  // Fonction pour exporter les paiements en attente
  const handleExportPendingPayments = () => {
    setIsLoading(true)
    setTimeout(() => {
      const pendingOrders = orders.filter(order => order.status === 'delivered' && order.paymentStatus === 'pending')
      const csvContent = [
        'ID Commande,Client,Montant,Date Livraison,Statut Paiement',
        ...pendingOrders.map(order => 
          `${order.id},${order.customerName},${order.totalAmount},${order.deliveryDate || 'N/A'},${order.paymentStatus}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `paiements_en_attente_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Export réussi', `Fichier CSV exporté avec ${pendingOrders.length} commande(s)`, 'success')
    }, 1500)
  }

  // Fonction pour demander tous les paiements
  const handleRequestAllPayments = () => {
    setShowPaymentModal(false)
    setShowAllPaymentsModal(true)
  }

  // Fonction pour envoyer toutes les demandes de paiement
  const handleSendAllPaymentRequests = () => {
    setIsLoading(true)
    setTimeout(() => {
      const pendingOrders = orders.filter(order => order.status === 'delivered' && order.paymentStatus === 'pending')
      
      // Simulation de l'envoi des demandes
      pendingOrders.forEach(order => {
        // Ici, on pourrait envoyer un email, SMS, ou notification push au client
        console.log(`Demande de paiement envoyée pour la commande ${order.id}`)
      })
      
      setIsLoading(false)
      setShowAllPaymentsModal(false)
      showNotification(
        'Demandes envoyées', 
        `${pendingOrders.length} demande(s) de paiement envoyée(s) avec succès`, 
        'success'
      )
    }, 2000)
  }

  // Fonction pour actualiser les retours
  const handleRefreshReturns = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showNotification('Actualisation terminée', 'Les données des retours ont été actualisées', 'success')
    }, 1500)
  }

  // Fonction pour exporter les retours
  const handleExportReturns = () => {
    setIsLoading(true)
    setTimeout(() => {
      const returnedOrders = orders.filter(order => order.status === 'returned')
      const csvContent = [
        'ID Commande,Client,Montant,Raison,Date Retour,Statut',
        ...returnedOrders.map(order => 
          `${order.id},${order.customerName},${order.totalAmount},Produit défectueux,${order.deliveryDate || 'N/A'},En cours`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `retours_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Export réussi', `Fichier CSV exporté avec ${returnedOrders.length} retour(s)`, 'success')
    }, 1500)
  }

  // Fonction pour traiter tous les retours
  const handleProcessAllReturns = () => {
    setIsLoading(true)
    setTimeout(() => {
      const returnedOrders = orders.filter(order => order.status === 'returned')
      
      // Simulation du traitement des retours
      returnedOrders.forEach(order => {
        console.log(`Retour traité pour la commande ${order.id}`)
      })
      
      setIsLoading(false)
      showNotification(
        'Traitement terminé', 
        `${returnedOrders.length} retour(s) traité(s) avec succès`, 
        'success'
      )
    }, 2000)
  }

  // Fonction: exporter le contenu du modal Analytics Avancés
  const handleExportAnalyticsModal = () => {
    const lines = [
      'Section, Valeur',
      `Total commandes, ${stats.total}`,
      `Chiffre d'affaires, ${formatCurrency(stats.totalRevenue)}`,
      `Taux de conversion, ${stats.conversionRate.toFixed(1)}%`,
      `Panier moyen, ${formatCurrency(stats.averageOrderValue)}`
    ].join('\n')
    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showNotification('Export réussi', 'Rapport Analytics exporté (CSV)', 'success')
  }

  // État pour gérer le partage en cours
  const [isSharing, setIsSharing] = useState(false)

  // Fonction pour partager la commande
  const handleShareOrder = async (order: SellerOrder) => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const shareText = `Commande ${order.id} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Détails de la commande',
          text: shareText
        })
        showNotification('Succès', 'Partage de la commande réussi', 'success')
      } else {
        await navigator.clipboard.writeText(shareText)
        showNotification('Succès', 'Détails de la commande copiés dans le presse-papiers', 'success')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager les analytics
  const handleShareAnalytics = async () => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const analyticsText = `Analytics de vente - CA: ${formatCurrency(stats.totalRevenue)} - ${stats.total} commandes`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Analytics de vente',
          text: analyticsText
        })
        showNotification('Succès', 'Partage des analytics réussi', 'success')
      } else {
        await navigator.clipboard.writeText(analyticsText)
        showNotification('Succès', 'Analytics copiés dans le presse-papiers', 'success')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager le classement
  const handleShareRanking = async () => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const rankingText = `Classement marketplace - Position #${marketplaceRanking.position} sur ${marketplaceRanking.totalVendors} vendeurs`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mon classement marketplace',
          text: rankingText
        })
        showNotification('Succès', 'Partage du classement réussi', 'success')
      } else {
        await navigator.clipboard.writeText(rankingText)
        showNotification('Succès', 'Classement copié dans le presse-papiers', 'success')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager les statistiques
  const handleShareStats = async () => {
    if (isSharing) return // Empêcher les clics multiples
    
    setIsSharing(true)
    const statsText = `Statistiques vendeur - ${stats.total} commandes - CA: ${formatCurrency(stats.totalRevenue)}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mes statistiques vendeur',
          text: statsText
        })
        showNotification('Succès', 'Partage des statistiques réussi', 'success')
      } else {
        await navigator.clipboard.writeText(statsText)
        showNotification('Succès', 'Statistiques copiées dans le presse-papiers', 'success')
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        showNotification('Erreur', 'Erreur lors du partage', 'error')
      }
    } finally {
      setIsSharing(false)
    }
  }

  // Fonction pour partager sur les réseaux sociaux
  const handleShareOnSocial = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp', order?: SellerOrder) => {
    let shareUrl = ''
    let shareText = ''
    
    if (order) {
      shareText = `Commande ${order.id} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`
    } else {
      shareText = `Statistiques vendeur - ${stats.total} commandes - CA: ${formatCurrency(stats.totalRevenue)}`
    }

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`
        break
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`
        break
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
      showNotification('Succès', `Partage sur ${platform} lancé`, 'success')
    }
  }

  // Système de notifications modernes
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date()
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
    }, 5000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Fonction pour télécharger les documents
  const handleDownloadDocuments = (orderId: string) => {
    setIsLoading(true)
    setTimeout(() => {
      const documentsContent = `DOCUMENTS COMMANDE ${orderId}\n\n1. Facture\n2. Bon de livraison\n3. Reçu\n4. Conditions de vente`
      
      const blob = new Blob([documentsContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `documents_${orderId}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Documents téléchargés', `Tous les documents de la commande ${orderId} ont été téléchargés`, 'success')
    }, 2000)
  }

  // Fonction pour voir les détails du classement
  const handleViewRankingDetails = () => {
    setShowRankingModal(true)
  }

  // Fonction pour configurer l'IA
  const handleConfigureAI = () => {
    showNotification('Configuration IA', 'Interface de configuration de l\'IA en cours de développement', 'info')
  }

  // Fonction pour voir les prévisions
  const handleViewForecasts = () => {
    setShowAnalyticsModal(true)
  }

  // Fonction pour optimiser les livraisons
  const handleOptimizeDeliveries = () => {
    setShowDeliveryOptimizationModal(true)
  }

  // Fonction pour gérer les litiges
  const handleManageDisputes = () => {
    setShowDisputesModal(true)
  }

  // Fonction pour configurer les notifications
  const handleConfigureNotifications = () => {
    setShowNotificationsModal(true)
  }

  // Fonction pour synchroniser maintenant
  const handleSyncNow = () => {
    setIsLoading(true)
    const syncSteps = [
      { name: 'Marketplace principale', status: 'connecting', delay: 800 },
      { name: 'WooCommerce', status: 'connecting', delay: 1200 },
      { name: 'Shopify', status: 'connecting', delay: 1600 },
      { name: 'Amazon', status: 'connecting', delay: 2000 }
    ]
    let currentStep = 0
    const syncInterval = setInterval(() => {
      if (currentStep < syncSteps.length) {
        const step = syncSteps[currentStep]
        showNotification('Synchronisation en cours', `🔄 Synchronisation de ${step.name}...`, 'info')
        currentStep++
      } else {
        clearInterval(syncInterval)
        const results = [
          '✅ Marketplace principale synchronisée (156 produits, 23 commandes)',
          '✅ WooCommerce synchronisé (89 produits, 12 commandes)',
          '⚠️ Shopify en attente de connexion (API key expirée)',
          '❌ Amazon déconnecté (credentials invalides)'
        ]
        showNotification('Synchronisation terminée', results.join('\n'), 'success')
        setIsLoading(false)
        setTimeout(() => {
          showNotification('Statistiques mises à jour', '📊 Données synchronisées et analytics actualisés', 'info')
        }, 1000)
      }
    }, 400)
  }

  // Composant de menu de partage social réutilisable
  const SocialShareMenu = ({ 
    shareText, 
    shareTitle, 
    shareUrl = window.location.href,
    onShare,
    children 
  }: {
    shareText: string
    shareTitle: string
    shareUrl?: string
    onShare?: (platform: string) => void
    children: React.ReactNode
  }) => {
    const handleSocialShare = (platform: string) => {
      let shareUrlFinal = shareUrl
      let finalShareText = shareText
      
      switch (platform) {
        case 'whatsapp':
          shareUrlFinal = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
          break
        case 'facebook':
          shareUrlFinal = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
          break
        case 'twitter':
          shareUrlFinal = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
          break
        case 'linkedin':
          shareUrlFinal = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
          break
        case 'telegram':
          shareUrlFinal = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
          break
        case 'discord':
          shareUrlFinal = `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=0`
          break
        case 'copy':
          navigator.clipboard.writeText(shareText + ' ' + shareUrl)
          showNotification('Succès', 'Lien copié dans le presse-papiers', 'success')
          if (onShare) onShare('copy')
          return
        default:
          break
      }
      
      if (shareUrlFinal && platform !== 'copy') {
        window.open(shareUrlFinal, '_blank', 'width=600,height=400')
        showNotification('Succès', `Partage sur ${platform} lancé`, 'success')
        
        // Récompense pour le partage
        setTimeout(() => {
          showNotification('🎁 Récompense', '+10 points de fidélité pour ce partage !', 'success')
        }, 1000)
        
        if (onShare) onShare(platform)
      }
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-gray-900">Partager sur</p>
            <p className="text-xs text-gray-500 truncate">{shareTitle}</p>
          </div>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleSocialShare('whatsapp')} className="cursor-pointer">
            <FaWhatsapp className="w-4 h-4 mr-2 text-green-600" />
            <span>WhatsApp</span>
            <span className="ml-auto text-xs text-green-600">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('facebook')} className="cursor-pointer">
            <FaFacebook className="w-4 h-4 mr-2 text-blue-600" />
            <span>Facebook</span>
            <span className="ml-auto text-xs text-blue-600">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('twitter')} className="cursor-pointer">
            <FaTwitter className="w-4 h-4 mr-2 text-sky-500" />
            <span>X (Twitter)</span>
            <span className="ml-auto text-xs text-sky-500">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('linkedin')} className="cursor-pointer">
            <FaLinkedin className="w-4 h-4 mr-2 text-blue-700" />
            <span>LinkedIn</span>
            <span className="ml-auto text-xs text-blue-700">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('telegram')} className="cursor-pointer">
            <FaTelegram className="w-4 h-4 mr-2 text-blue-500" />
            <span>Telegram</span>
            <span className="ml-auto text-xs text-blue-500">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleSocialShare('discord')} className="cursor-pointer">
            <FaDiscord className="w-4 h-4 mr-2 text-indigo-600" />
            <span>Discord</span>
            <span className="ml-auto text-xs text-indigo-600">+10 pts</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleSocialShare('copy')} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2 text-gray-600" />
            <span>Copier le lien</span>
            <span className="ml-auto text-xs text-gray-600">+5 pts</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Fonction pour gérer les actions en lot
  const handleBulkActions = () => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }
    
    setShowBulkActionsModal(true)
  }

  // Fonction pour sauvegarder la configuration des notifications
  const handleSaveNotificationsConfig = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowNotificationsModal(false)
      showNotification('Configuration sauvegardée', 'Vos paramètres de notifications ont été sauvegardés avec succès', 'success')
    }, 1500)
  }

  // Fonction pour appliquer la configuration de l'IA
  const handleApplyAIConfig = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowAIConfigModal(false)
      showNotification('Configuration IA appliquée', 'Les paramètres de l\'IA ont été appliqués avec succès', 'success')
    }, 1500)
  }

  // Fonction pour actualiser les prévisions
  const handleRefreshForecasts = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showNotification('Prévisions actualisées', 'Les données prédictives ont été mises à jour', 'success')
    }, 1500)
  }

  // Fonction pour exporter les prévisions
  const handleExportForecasts = () => {
    const csvContent = 'Prévisions de vente\nCroissance prévue,23%\nCommandes prévues,156\nCA prévu (F CFA),4200000'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'previsions-vente.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showNotification('Export réussi', 'Rapport des prévisions exporté (CSV)', 'success')
  }

  // Fonction pour appliquer les actions en lot
  const handleApplyBulkActions = () => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowBulkActionsModal(false)
      showNotification(
        'Actions appliquées', 
        `${selectedOrdersForBulkAction.length} commande(s) traitée(s) avec succès`, 
        'success'
      )
      setSelectedOrdersForBulkAction([])
    }, 1500)
  }

  // Fonction pour ouvrir le modal d'édition de commande
  const handleEditOrderModal = (order: SellerOrder) => {
    setEditingOrder(order)
    setShowOrderDetailsModal(false)
    setShowEditOrderModal(true)
  }

  // Fonction pour voir les détails d'une commande
  const handleViewOrderDetails = (order: SellerOrder) => {
    setSelectedOrder(order)
    setShowOrderDetailsModal(true)
  }

  // Fonction pour dupliquer une commande
  const handleDuplicateOrder = (order: SellerOrder) => {
    const duplicatedOrder = {
      ...order,
      id: `COPY-${order.id}`,
      orderDate: new Date().toISOString(),
      status: 'pending' as const,
      paymentStatus: 'pending' as const
    }
    showNotification('Commande dupliquée', `Commande ${duplicatedOrder.id} créée avec succès`, 'success')
  }

  // Fonction pour générer un bon de livraison
  const handleGenerateDeliveryNote = (order: SellerOrder) => {
    const deliveryNote = `Bon de livraison - Commande ${order.id}\nClient: ${order.customerName}\nAdresse: ${order.shippingAddress}\nDate: ${new Date().toLocaleDateString('fr-FR')}`
    const blob = new Blob([deliveryNote], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bon-livraison-${order.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showNotification('Bon de livraison généré', 'Fichier téléchargé avec succès', 'success')
  }

  // Fonction pour générer un reçu
  const handleGenerateReceipt = (order: SellerOrder) => {
    const receipt = `Reçu - Commande ${order.id}\nClient: ${order.customerName}\nMontant: ${formatCurrency(order.totalAmount)}\nDate: ${new Date().toLocaleDateString('fr-FR')}`
    const blob = new Blob([receipt], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `recu-${order.id}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    showNotification('Reçu généré', 'Fichier téléchargé avec succès', 'success')
  }

  // Fonction pour envoyer un rappel
  const handleSendReminder = (order: SellerOrder) => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      showNotification('Rappel envoyé', `Rappel envoyé au client ${order.customerName}`, 'success')
    }, 1000)
  }

  // Fonction pour marquer comme prioritaire
  const handleMarkAsPriority = (order: SellerOrder) => {
    showNotification('Commande prioritaire', `Commande ${order.id} marquée comme prioritaire`, 'success')
  }

  // Fonction pour archiver une commande
  const handleArchiveOrder = (order: SellerOrder) => {
    showNotification('Commande archivée', `Commande ${order.id} archivée avec succès`, 'success')
  }

  // Fonction pour supprimer une commande
  const handleDeleteOrder = (order: SellerOrder) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la commande ${order.id} ?`)) {
      showNotification('Commande supprimée', `Commande ${order.id} supprimée avec succès`, 'success')
    }
  }

  // Exporter le rapport d'optimisation des livraisons
  const handleExportDeliveryReport = () => {
    const csv = [
      'Optimisation des livraisons',
      'Transporteur,Express Delivery',
      'Coûts,-20%',
      'Délai,1-2 jours',
      'Garantie,Oui'
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rapport-optimisation-livraisons.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    showNotification('Export réussi', 'Rapport d\'optimisation des livraisons exporté (CSV)', 'success')
  }

  // Appliquer l'optimisation des livraisons (simulation)
  const handleApplyDeliveryOptimization = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowDeliveryOptimizationModal(false)
      showNotification('Optimisation appliquée', 'Paramètres de livraison optimisés avec succès', 'success')
    }, 1200)
  }

  // Exporter le rapport des litiges
  const handleExportDisputesReport = () => {
    const csv = [
      'Rapport des litiges',
      'Taux de litiges,0.8%',
      'Litiges résolus,80%',
      'Satisfaction client,95%',
      'Support,24/7',
      'Date,' + new Date().toLocaleDateString('fr-FR')
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rapport-litiges.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    showNotification('Export réussi', 'Rapport des litiges exporté (CSV)', 'success')
  }

  // Créer un nouveau litige
  const handleCreateDispute = () => {
    showNotification('Nouveau litige', 'Interface de création de litige en cours de développement', 'info')
  }

  // Fonction pour voir les détails d'un litige
  const handleViewDisputeDetails = (disputeData: {
    id: string
    orderId: string
    type: string
    description: string
    status: 'en_cours' | 'résolu' | 'fermé'
    openedAt: string
    resolvedAt?: string
    customerName: string
    priority: 'normal' | 'urgent' | 'critique'
  }) => {
    setSelectedDispute(disputeData)
    setShowDisputeDetailsModal(true)
  }

  ;
  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques avancées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewAllOrders}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Total Commandes</p>
                <p className="text-2xl font-bold text-orange-900">{stats.total}</p>
                <p className="text-xs text-orange-600">+{stats.confirmed} en attente</p>
              </div>
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                Voir toutes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewDeliveredOrders}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Livrées</p>
                <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
                <p className="text-xs text-green-600">{stats.conversionRate.toFixed(1)}% de conversion</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
                onClick={handleViewDeliveredOrders}
              >
                Voir livrées
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewShippedOrders}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">En Transit</p>
                <p className="text-2xl font-bold text-blue-900">{stats.shipped}</p>
                <p className="text-xs text-blue-600">{stats.delayed} en retard</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={handleViewShippedOrders}
              >
                Voir en transit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewRevenueDetails}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">CA Total</p>
                <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-purple-600">Moy: {formatCurrency(stats.averageOrderValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                onClick={handleViewRevenueDetails}
              >
                Voir détails
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nouvelles cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewPendingPayments}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Paiements en attente</p>
                <p className="text-2xl font-bold text-red-900">{stats.pendingPayments}</p>
                <p className="text-xs text-red-600">Livraisons validées</p>
              </div>
              <CreditCard className="w-8 h-8 text-red-600" />
            </div>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="w-full border-red-300 text-red-700 hover:bg-red-50">
                Gérer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewReturns}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Retours</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.returned}</p>
                <p className="text-xs text-yellow-600">Gestion qualité</p>
              </div>
              <Package2 className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="mt-3">
              <Button size="sm" variant="outline" className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50">
                Gérer
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewRankingDetails}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Classement</p>
                <p className="text-2xl font-bold text-indigo-900">#{marketplaceRanking.position}</p>
                <p className="text-xs text-indigo-600">sur {marketplaceRanking.totalVendors} vendeurs</p>
              </div>
              <Trophy className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="mt-3 flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                onClick={handleViewRankingDetails}
              >
                Voir classement
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleShareRanking()
                }}
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nouvelle section : Filtres intelligents et recherche avancée */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-slate-600" />
            <span>Recherche Intelligente & Filtres Avancés</span>
          </CardTitle>
          <CardDescription>Découvrez des insights cachés dans vos données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche IA */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Recherche IA</Label>
              <div className="relative">
                <Input 
                  placeholder="Recherche intelligente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 bg-white/80 backdrop-blur-sm border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Filtre par statut */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-300">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmée</SelectItem>
                  <SelectItem value="shipped">Expédiée</SelectItem>
                  <SelectItem value="delivered">Livrée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                  <SelectItem value="returned">Retournée</SelectItem>
                  <SelectItem value="delayed">En retard</SelectItem>
                  <SelectItem value="notDelivered">Non livrée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par paiement */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Paiement</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-300">
                  <SelectValue placeholder="Tous les paiements" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les paiements</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="failed">Échoué</SelectItem>
                  <SelectItem value="refunded">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre temporel */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Période</Label>
              <Select value={analyticsPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setAnalyticsPeriod(value)}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-slate-300">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">30 derniers jours</SelectItem>
                  <SelectItem value="weekly">12 dernières semaines</SelectItem>
                  <SelectItem value="monthly">12 derniers mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtres avancés supplémentaires */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="urgent" />
              <Label htmlFor="urgent" className="text-sm text-slate-600">Commandes urgentes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="highValue" />
              <Label htmlFor="highValue" className="text-sm text-slate-600">Valeur élevée</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="repeatCustomer" />
              <Label htmlFor="repeatCustomer" className="text-sm text-slate-600">Clients fidèles</Label>
            </div>
          </div>

          {/* Boutons de partage des filtres */}
          <div className="mt-4 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const filterText = `Filtres appliqués: ${statusFilter !== 'all' ? statusFilter : 'Tous'} - ${paymentFilter !== 'all' ? paymentFilter : 'Tous'} - ${analyticsPeriod}`
                navigator.clipboard.writeText(filterText)
                showNotification('Filtres copiés', 'Configuration des filtres copiée dans le presse-papiers', 'success')
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copier filtres
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleShareOnSocial('whatsapp')}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nouvelle section : Workflow automatisé et intelligence artificielle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-emerald-800">
              <Zap className="w-5 h-5" />
              <span>Workflow Automatisé IA</span>
            </CardTitle>
            <CardDescription className="text-emerald-700">Intelligence artificielle pour optimiser vos processus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métriques d'automatisation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-800">87%</div>
                <div className="text-xs text-emerald-600">Automatisé</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-800">2.3h</div>
                <div className="text-xs text-emerald-600">Gagnées/jour</div>
              </div>
            </div>

            {/* Actions automatisées */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Validation automatique</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Rappels intelligents</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Prévisions de vente</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">Actif</Badge>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={handleConfigureAI}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurer l'IA
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-violet-300 text-violet-700 hover:bg-violet-50"
              onClick={handleViewForecasts}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Voir les prévisions
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={handleOptimizeDeliveries}
            >
              <Settings className="w-4 h-4 mr-2" />
              Optimiser les livraisons
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={handleManageDisputes}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Gérer les litiges
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
              onClick={handleConfigureNotifications}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurer les notifications
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              onClick={handleSyncNow}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Synchroniser maintenant
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200 hover:shadow-xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-violet-800">
              <Target className="w-5 h-5" />
              <span>Analytics Prédictifs</span>
            </CardTitle>
            <CardDescription className="text-violet-700">Anticipez les tendances et optimisez vos ventes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prévisions */}
            <div className="space-y-3">
              <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-violet-700">Prévision de vente</span>
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                </div>
                <div className="text-2xl font-bold text-violet-800">+23%</div>
                <div className="text-xs text-violet-600">vs mois précédent</div>
              </div>
              
              <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-violet-700">Détection d'anomalies</span>
                  <AlertTriangle className="w-4 h-4 text-violet-600" />
                </div>
                <div className="text-2xl font-bold text-violet-800">3</div>
                <div className="text-xs text-violet-600">commandes à surveiller</div>
              </div>
            </div>

            {/* Graphique de tendance */}
            <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-violet-700">Tendance des ventes</span>
                <Calendar className="w-4 h-4 text-violet-600" />
              </div>
              <div className="h-16 bg-gradient-to-r from-violet-200 to-violet-300 rounded-lg flex items-end justify-around p-2">
                {[20, 35, 45, 60, 55, 70, 85].map((height, index) => (
                  <div 
                    key={index}
                    className="w-2 bg-violet-600 rounded-t-sm transition-all duration-300 hover:bg-violet-700"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-violet-300 text-violet-700 hover:bg-violet-50"
              onClick={() => setShowRankingModal(true)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Voir les prévisions
            </Button>

            <SocialShareMenu
              shareText={`Analytics de vente - CA: ${formatCurrency(stats.totalRevenue)} - ${stats.total} commandes`}
              shareTitle="Mes analytics de vente"
              onShare={(platform) => console.log(`Analytics partagés sur ${platform}`)}
            >
              <Button 
                variant="outline" 
                className="w-full border-violet-300 text-violet-700 hover:bg-violet-50"
              >
                <Share className="w-4 h-4 mr-2" />
                Partager les analytics
              </Button>
            </SocialShareMenu>
          </CardContent>
        </Card>
      </div>

      {/* Nouvelle section : Gestion intelligente des livraisons et optimisation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Truck className="w-5 h-5" />
              <span>Optimisation des Livraisons</span>
            </CardTitle>
            <CardDescription className="text-blue-700">Intelligence artificielle pour optimiser vos expéditions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métriques de livraison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-blue-800">98.2%</div>
                <div className="text-xs text-blue-600">Livraisons à temps</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-blue-800">-15%</div>
                <div className="text-xs text-blue-600">Coûts de transport</div>
              </div>
            </div>

            {/* Choix du transporteur */}
            <div className="space-y-3">
              <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Transporteur recommandé</span>
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Express Delivery</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">-20% coût</Badge>
                </div>
              </div>
              
              <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Temps estimé</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-bold text-blue-800">1-2 jours</div>
                <div className="text-xs text-blue-600">Livraison garantie</div>
              </div>
            </div>

            {/* Calcul automatique des frais */}
            <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Frais de livraison</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Base</span>
                <span className="font-medium">2,500 XOF</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Optimisation IA</span>
                <span className="font-medium text-green-600">-500 XOF</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold text-blue-800">2,000 XOF</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={handleOptimizeDeliveries}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Optimisation...
                </>
              ) : (
                <>
                  <Settings className="w-4 h-4 mr-2" />
                  Optimiser les livraisons
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-800">
              <AlertCircleIcon className="w-5 h-5" />
              <span>Gestion Intelligente des Litiges</span>
            </CardTitle>
            <CardDescription className="text-amber-700">Résolution automatisée et prévention des conflits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métriques de litiges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-amber-800">0.8%</div>
                <div className="text-xs text-amber-600">Taux de litiges</div>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="text-2xl font-bold text-amber-800">2.1h</div>
                <div className="text-xs text-amber-600">Résolution moyenne</div>
              </div>
            </div>

            {/* Système de résolution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Résolution automatique</span>
                </div>
                <Badge className="bg-amber-100 text-amber-800">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Prévention des conflits</span>
                </div>
                <Badge className="bg-amber-100 text-amber-800">Actif</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">Chat de support IA</span>
                </div>
                <Badge className="bg-amber-100 text-amber-800">Actif</Badge>
              </div>
            </div>

            {/* Litiges en cours */}
            <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-amber-700">Litiges en cours</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Commande #12345</span>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">En cours</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Commande #12346</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">Résolu</Badge>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={handleManageDisputes}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600 mr-2"></div>
                  Ouverture...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Gérer les litiges
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides et Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Gestion quotidienne des commandes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handleExportOrders}
                variant="outline" 
                className="w-full justify-start"
                disabled={isLoading}
              >
                <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Export en cours...' : 'Exporter CSV'}
              </Button>
              
              <Button 
                onClick={handlePrintReport}
                variant="outline" 
                className="w-full justify-start"
                disabled={isLoading}
              >
                <Printer className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Génération...' : 'Imprimer Rapport'}
              </Button>
              
              <Button 
                onClick={handleGenerateInvoices}
                variant="outline" 
                className="w-full justify-start"
                disabled={isLoading}
              >
                <FileText className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Génération...' : 'Générer Factures'}
              </Button>

              <Button 
                onClick={() => setShowAnalyticsModal(true)}
                variant="outline" 
                className="w-full justify-start"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics Avancés
              </Button>

              <SocialShareMenu
                shareText={`Statistiques vendeur - ${stats.total} commandes - CA: ${formatCurrency(stats.totalRevenue)}`}
                shareTitle="Mes statistiques vendeur"
                onShare={(platform) => console.log(`Statistiques partagées sur ${platform}`)}
              >
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Partager Stats
                </Button>
              </SocialShareMenu>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classement Marketplace</CardTitle>
            <CardDescription>Votre position dans la marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Position actuelle</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-indigo-600">#{marketplaceRanking.position}</span>
                  {getTrendIcon(marketplaceRanking.trend)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Volume de ventes</span>
                  <p className="font-medium">{formatCurrency(marketplaceRanking.salesVolume)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Partages produits</span>
                  <p className="font-medium">{marketplaceRanking.sharesCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Vues produits</span>
                  <p className="font-medium">{marketplaceRanking.productViews.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Catégorie</span>
                  <p className="font-medium">{marketplaceRanking.category}</p>
                </div>
              </div>

              <Button 
                onClick={() => setShowRankingModal(true)}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Voir le classement complet
              </Button>

              <div className="flex space-x-2">
                <SocialShareMenu
                  shareText={`Classement marketplace - Position #${marketplaceRanking.position} sur ${marketplaceRanking.totalVendors} vendeurs`}
                  shareTitle="Mon classement marketplace"
                  onShare={(platform) => console.log(`Partagé sur ${platform}`)}
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleShareOnSocial('whatsapp')}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nouvelle section : Notifications intelligentes et synchronisation multi-canal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-pink-800">
              <Bell className="w-5 h-5" />
              <span>Notifications Intelligentes</span>
            </CardTitle>
            <CardDescription className="text-pink-700">Alertes contextuelles et personnalisées en temps réel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuration des notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium">Nouvelles commandes</span>
                </div>
                <Badge className="bg-pink-100 text-pink-800">Push + Email</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium">Livraisons en retard</span>
                </div>
                <Badge className="bg-pink-100 text-pink-800">Urgent</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium">Paiements reçus</span>
                </div>
                <Badge className="bg-pink-100 text-pink-800">Push</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium">Litiges détectés</span>
                </div>
                <Badge className="bg-pink-100 text-pink-800">Urgent</Badge>
              </div>
            </div>

            {/* Notifications récentes */}
            <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-pink-700">Notifications récentes</span>
                <Bell className="w-4 h-4 text-pink-600" />
              </div>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                <div className="text-xs text-pink-600">• Nouvelle commande #12347 reçue</div>
                <div className="text-xs text-pink-600">• Livraison #12345 en retard - Action requise</div>
                <div className="text-xs text-pink-600">• Paiement reçu pour #12344</div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-pink-300 text-pink-700 hover:bg-pink-50"
              onClick={handleConfigureNotifications}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600 mr-2"></div>
                  Ouverture...
                </>
              ) : (
                <>
              <Settings className="w-4 h-4 mr-2" />
              Configurer les notifications
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-xl transition-all duration-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-cyan-800">
              <RefreshCw className="w-5 h-5" />
              <span>Synchronisation Multi-Canal</span>
            </CardTitle>
            <CardDescription className="text-cyan-700">Connexion parfaite avec toutes vos plateformes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plateformes connectées */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Marketplace principale</span>
                </div>
                <Badge className="bg-cyan-100 text-cyan-800">Connecté</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">WooCommerce</span>
                </div>
                <Badge className="bg-cyan-100 text-cyan-800">Connecté</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Shopify</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Amazon</span>
                </div>
                <Badge className="bg-red-100 text-red-800">Déconnecté</Badge>
              </div>
            </div>

            {/* Statut de synchronisation */}
            <div className="p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-cyan-700">Dernière synchronisation</span>
                <Clock className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-sm text-cyan-800">Il y a 2 minutes</div>
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-cyan-200 rounded-full h-2">
                    <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                  <span className="text-xs text-cyan-600">95%</span>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              onClick={handleSyncNow}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-600 mr-2"></div>
                  Synchronisation...
                </>
              ) : (
                <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Synchroniser maintenant
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes simplifiée */}
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Commandes</CardTitle>
          <CardDescription>Suivez et gérez toutes vos commandes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{order.id}</h3>
                    <p className="text-sm text-gray-500">{order.customerName}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="mt-2 flex space-x-2">
                  <Button size="sm" onClick={() => handleEditOrder(order)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowOrderDetails(true)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Détails
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Liste complète des commandes avec toutes les données */}
      <Card id="orders-list">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion Complète des Commandes</CardTitle>
              <CardDescription>Vue détaillée avec toutes les données et actions</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleBulkActions}
                variant="outline"
                disabled={selectedOrdersForBulkAction.length === 0}
              >
                <Package className="w-4 h-4 mr-2" />
                Actions en lot ({selectedOrdersForBulkAction.length})
              </Button>
              <Button onClick={handleRefreshData} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg overflow-hidden">
                {/* En-tête de la commande */}
                <div className="bg-gray-50 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Checkbox 
                        checked={selectedOrdersForBulkAction.includes(order.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOrdersForBulkAction([...selectedOrdersForBulkAction, order.id])
                          } else {
                            setSelectedOrdersForBulkAction(selectedOrdersForBulkAction.filter(id => id !== order.id))
                          }
                        }}
                      />
                      <div>
                        <h3 className="font-bold text-lg">{order.id}</h3>
                        <p className="text-sm text-gray-600">Client: {order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Détails de la commande */}
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Date de commande</Label>
                      <p className="text-sm">{formatDate(order.orderDate)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Date de livraison</Label>
                      <p className="text-sm">{order.deliveryDate ? formatDate(order.deliveryDate) : 'Non définie'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Montant total</Label>
                      <p className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Commission</Label>
                      <p className="text-sm">{formatCurrency(order.commission)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Revenu net</Label>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(order.netRevenue)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Méthode de paiement</Label>
                      <p className="text-sm">{order.shippingMethod || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Adresse de livraison</Label>
                      <p className="text-sm">{order.shippingAddress || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Notes</Label>
                      <p className="text-sm">{order.notes || 'Aucune note'}</p>
                    </div>
                  </div>

                  {/* Actions principales */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button size="sm" onClick={() => handleViewOrderDetails(order)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Voir détails
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditOrderModal(order)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicateOrder(order)}>
                      <Copy className="w-4 h-4 mr-1" />
                      Dupliquer
                    </Button>
                    <SocialShareMenu
                      shareText={`Commande ${order.id} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`}
                      shareTitle="Détails de la commande"
                      onShare={(platform) => console.log(`Commande partagée sur ${platform}`)}
                    >
                      <Button size="sm" variant="outline">
                        <Share className="w-4 h-4 mr-1" />
                        Partager
                      </Button>
                    </SocialShareMenu>
                  </div>

                  {/* Menu de partage social unifié */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <SocialShareMenu
                      shareText={`Commande ${order.id} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`}
                      shareTitle="Détails de la commande"
                      onShare={(platform) => console.log(`Commande partagée sur ${platform}`)}
                    >
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Share className="w-4 h-4 mr-1" />
                        Partager sur tous les réseaux
                      </Button>
                    </SocialShareMenu>
                  </div>

                  {/* Actions de statut */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, 'confirmed')}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirmer
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, 'shipped')}>
                        <Truck className="w-4 h-4 mr-1" />
                        Expédier
                      </Button>
                    )}
                    {order.status === 'shipped' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(order.id, 'delivered')}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Livrer
                      </Button>
                    )}
                    {order.status === 'delivered' && order.paymentStatus === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handlePaymentRequest(order.id)}>
                        <CreditCard className="w-4 h-4 mr-1" />
                        Demander paiement
                      </Button>
                    )}
                    {order.status === 'delivered' && (
                      <Button size="sm" variant="outline" onClick={() => handleCustomerValidation(order.id)}>
                        <User className="w-4 h-4 mr-1" />
                        Valider livraison
                      </Button>
                    )}
                  </div>

                  {/* Actions de gestion */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button size="sm" variant="outline" onClick={() => handleGenerateDeliveryNote(order)}>
                      <FileText className="w-4 h-4 mr-1" />
                      Bon de livraison
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleGenerateReceipt(order)}>
                      <Receipt className="w-4 h-4 mr-1" />
                      Reçu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadDocuments(order.id)}>
                      <Download className="w-4 h-4 mr-1" />
                      Documents
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSendReminder(order)}>
                      <Bell className="w-4 h-4 mr-1" />
                      Rappel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMarkAsPriority(order)}>
                      <Star className="w-4 h-4 mr-1" />
                      Prioritaire
                    </Button>
                  </div>

                  {/* Actions avancées */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleArchiveOrder(order)}>
                      <Archive className="w-4 h-4 mr-1" />
                      Archiver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleCancelOrder(order.id)}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReturnOrder(order.id)}>
                      <Package2 className="w-4 h-4 mr-1" />
                      Retour
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal Analytics Avancés */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Analytics Avancés</DialogTitle>
            <DialogDescription className="text-gray-600">Analysez vos performances de vente en détail</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Sélecteur de période */}
            <div className="flex items-center space-x-4">
              <Label className="text-sm font-medium">Période d'analyse :</Label>
              <Select value={analyticsPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setAnalyticsPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
                  <div className="text-sm text-blue-700">Total commandes</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-sm text-green-700">Chiffre d'affaires</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">{stats.conversionRate.toFixed(1)}%</div>
                  <div className="text-sm text-purple-700">Taux de conversion</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats.averageOrderValue)}</div>
                  <div className="text-sm text-orange-700">Panier moyen</div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique des tendances */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Évolution des ventes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Graphique des tendances</p>
                    <p className="text-sm text-gray-400">Période : {analyticsPeriod === 'daily' ? '30 derniers jours' : analyticsPeriod === 'weekly' ? '12 dernières semaines' : '12 derniers mois'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowAnalyticsModal(false)}>
                Fermer
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportAnalyticsModal}>
                <Download className="w-4 h-4 mr-2" />
                Exporter PDF
              </Button>
              <SocialShareMenu
                shareText={`Analytics de vente - CA: ${formatCurrency(stats.totalRevenue)} - ${stats.total} commandes`}
                shareTitle="Mes analytics de vente"
                onShare={(platform) => console.log(`Analytics partagés sur ${platform}`)}
              >
                <Button className="bg-green-600 hover:bg-green-700">
                  <Share className="w-4 h-4 mr-2" />
                  Partager
                </Button>
              </SocialShareMenu>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Classement Marketplace */}
      <Dialog open={showRankingModal} onOpenChange={setShowRankingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Classement Marketplace</DialogTitle>
            <DialogDescription className="text-gray-600">Votre position et performance par rapport aux autres vendeurs</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Position actuelle */}
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardContent className="p-6 text-center">
                <Trophy className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                <div className="text-4xl font-bold text-indigo-900">#{marketplaceRanking.position}</div>
                <div className="text-lg text-indigo-700">sur {marketplaceRanking.totalVendors} vendeurs</div>
                <div className="mt-2">
                  <Badge className={`text-sm px-3 py-1 ${
                    marketplaceRanking.trend === 'up' ? 'bg-green-100 text-green-800' :
                    marketplaceRanking.trend === 'down' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {marketplaceRanking.trend === 'up' ? '↗️ En progression' :
                     marketplaceRanking.trend === 'down' ? '↘️ En baisse' :
                     '→ Stable'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Métriques détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance de vente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volume de ventes</span>
                    <span className="font-medium">{formatCurrency(marketplaceRanking.salesVolume)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Partages</span>
                    <span className="font-medium">{marketplaceRanking.sharesCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vues produits</span>
                    <span className="font-medium">{marketplaceRanking.productViews}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Catégorie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4">
                    <div className="text-2xl font-bold text-indigo-600">{marketplaceRanking.category}</div>
                    <div className="text-sm text-gray-600">Votre catégorie principale</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowRankingModal(false)}>
                Fermer
              </Button>
              <SocialShareMenu
                shareText={`Classement marketplace - Position #${marketplaceRanking.position} sur ${marketplaceRanking.totalVendors} vendeurs`}
                shareTitle="Mon classement marketplace"
                onShare={(platform) => console.log(`Classement partagé sur ${platform}`)}
              >
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Share className="w-4 h-4 mr-2" />
                  Partager mon classement
                </Button>
              </SocialShareMenu>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Détails de la Commande */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Détails de la Commande</DialogTitle>
            <DialogDescription className="text-gray-600">Informations complètes sur la commande sélectionnée</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {selectedOrder ? (
              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informations de la commande</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">ID Commande:</span>
                        <span className="text-sm font-semibold">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Date de commande:</span>
                        <span className="text-sm">{new Date(selectedOrder.orderDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Statut:</span>
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Paiement:</span>
                        <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Montant total:</span>
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informations client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Nom:</span>
                        <span className="text-sm font-semibold">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                        <span className="text-sm">{selectedOrder.customerEmail || 'Non spécifié'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Téléphone:</span>
                        <span className="text-sm">{selectedOrder.customerPhone || 'Non spécifié'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Adresse:</span>
                        <span className="text-sm">{selectedOrder.shippingAddress || 'Non spécifiée'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Produits de la commande */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Produits commandés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.products?.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-600">Quantité: {product.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(product.price)}</p>
                            <p className="text-sm text-gray-600">Total: {formatCurrency(product.price * product.quantity)}</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-gray-500">
                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>Aucun produit spécifié</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                    Fermer
                  </Button>
                  <Button onClick={() => handleEditOrderModal(selectedOrder)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleExportOrderDetails(selectedOrder)}>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sélectionnez une commande pour voir ses détails</p>
                <p className="text-sm text-gray-400">Cliquez sur "Voir détails" dans la liste des commandes</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Modifier la Commande */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Modifier la Commande</DialogTitle>
            <DialogDescription className="text-gray-600">Modifiez les informations de la commande sélectionnée</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {editingOrder ? (
              <div className="space-y-4">
                {/* Informations de base */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="edit-id">ID Commande</Label>
                    <Input 
                      id="edit-id" 
                      value={editingOrder.id} 
                      disabled 
                      className="bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-customer">Client</Label>
                    <Input 
                      id="edit-customer" 
                      value={editingOrder.customerName} 
                      onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-amount">Montant total</Label>
                    <Input 
                      id="edit-amount" 
                      value={editingOrder.totalAmount} 
                      onChange={(e) => setEditingOrder({...editingOrder, totalAmount: parseFloat(e.target.value) || 0})}
                      type="number"
                    />
                  </div>
                </div>

                {/* Statut et paiement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-status">Statut</Label>
                    <Select value={editingOrder.status} onValueChange={(value: SellerOrder['status']) => 
                      setEditingOrder({...editingOrder, status: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="confirmed">Confirmée</SelectItem>
                        <SelectItem value="shipped">Expédiée</SelectItem>
                        <SelectItem value="delivered">Livrée</SelectItem>
                        <SelectItem value="cancelled">Annulée</SelectItem>
                        <SelectItem value="returned">Retournée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-payment">Statut du paiement</Label>
                    <Select value={editingOrder.paymentStatus} onValueChange={(value: SellerOrder['paymentStatus']) => 
                      setEditingOrder({...editingOrder, paymentStatus: value})
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="failed">Échoué</SelectItem>
                        <SelectItem value="refunded">Remboursé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-order-date">Date de commande</Label>
                    <Input 
                      id="edit-order-date" 
                      type="date"
                      value={editingOrder.orderDate.split('T')[0]} 
                      onChange={(e) => setEditingOrder({...editingOrder, orderDate: e.target.value + 'T00:00:00.000Z'})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-delivery-date">Date de livraison</Label>
                    <Input 
                      id="edit-delivery-date" 
                      type="date"
                      value={editingOrder.deliveryDate ? editingOrder.deliveryDate.split('T')[0] : ''} 
                      onChange={(e) => setEditingOrder({...editingOrder, deliveryDate: e.target.value + 'T00:00:00.000Z'})}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea 
                    id="edit-notes"
                    value={editingOrder.notes || ''}
                    onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                    placeholder="Ajoutez des notes sur cette commande..."
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Annuler
                  </Button>
                  <Button onClick={() => {
                    handleSaveOrderEdit(editingOrder)
                    setShowEditModal(false)
                  }}>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Edit className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sélectionnez une commande pour la modifier</p>
                <p className="text-sm text-gray-400">Cliquez sur "Modifier" dans la liste des commandes</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gestion des Paiements en Attente */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Gestion des Paiements en Attente</DialogTitle>
            <DialogDescription className="text-gray-600">Gérez les commandes livrées en attente de paiement</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Statistiques des paiements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{stats.pendingPayments}</div>
                  <div className="text-sm text-red-700">Paiements en attente</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats.pendingPayments * 25000)}</div>
                  <div className="text-sm text-orange-700">Montant total</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">3.2j</div>
                  <div className="text-sm text-yellow-700">Délai moyen</div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des commandes en attente de paiement */}
              <Card>
                <CardHeader>
                <CardTitle className="text-lg">Commandes en attente de paiement</CardTitle>
                <CardDescription>Commandes livrées mais non encore payées</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                  {orders.filter(order => order.status === 'delivered' && order.paymentStatus === 'pending').slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-blue-600" />
                      <div>
                            <p className="font-medium">Commande #{order.id}</p>
                            <p className="text-sm text-gray-600">{order.customerName} - {formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
                        <Button size="sm" variant="outline" onClick={() => handlePaymentRequest(order.id)}>
                          <CreditCard className="w-4 h-4 mr-1" />
                          Demander
                        </Button>
                    </div>
                    </div>
                  ))}
                  </div>
                </CardContent>
              </Card>

            {/* Actions en lot */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={handleRefreshPendingPayments}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={handleExportPendingPayments}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <SocialShareMenu
                  shareText={`Paiements en attente - ${stats.pendingPayments} commandes - Montant total: ${formatCurrency(stats.pendingPayments * 25000)}`}
                  shareTitle="Gestion des paiements en attente"
                  onShare={(platform) => console.log(`Paiements partagés sur ${platform}`)}
                >
                  <Button 
                    variant="outline" 
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                  Fermer
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleRequestAllPayments}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Demander tous les paiements
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gestion des Retours */}
      <Dialog open={showReturnsModal} onOpenChange={setShowReturnsModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Gestion des Retours</DialogTitle>
            <DialogDescription className="text-gray-600">Gérez les retours et réclamations des clients</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Statistiques des retours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">{stats.returned}</div>
                  <div className="text-sm text-yellow-700">Retours totaux</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">2.1%</div>
                  <div className="text-sm text-orange-700">Taux de retour</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">1.8j</div>
                  <div className="text-sm text-green-700">Traitement moyen</div>
                </CardContent>
              </Card>
            </div>

            {/* Liste des retours */}
              <Card>
                <CardHeader>
                <CardTitle className="text-lg">Retours récents</CardTitle>
                <CardDescription>Gérez les retours et réclamations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                  {orders.filter(order => order.status === 'returned').slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package2 className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">Commande #{order.id}</p>
                            <p className="text-sm text-gray-600">{order.customerName} - {formatCurrency(order.totalAmount)}</p>
                            <p className="text-xs text-gray-500">Raison: Produit défectueux</p>
                    </div>
                    </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>
                                              <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDisputeDetails({
                          id: 'dispute-12346',
                          orderId: '12346',
                          type: 'Retard de livraison',
                          description: 'Retard de livraison - Résolu',
                          status: 'résolu',
                          openedAt: 'Il y a 3h',
                          resolvedAt: 'Il y a 1h',
                          customerName: 'Client satisfait',
                          priority: 'normal'
                        })}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      </div>
                    </div>
                  ))}
                  </div>
                </CardContent>
              </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                  onClick={handleRefreshReturns}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={handleExportReturns}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <SocialShareMenu
                  shareText={`Gestion des retours - ${stats.returned} retours - Taux: 2.1% - Traitement moyen: 1.8j`}
                  shareTitle="Gestion des retours"
                  onShare={(platform) => console.log(`Retours partagés sur ${platform}`)}
                >
                  <Button 
                    variant="outline" 
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
            </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowReturnsModal(false)}>
                Fermer
              </Button>
                <Button 
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={handleProcessAllReturns}
                >
                  <Package2 className="w-4 h-4 mr-2" />
                  Traiter tous les retours
              </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Demande Tous les Paiements */}
      <Dialog open={showAllPaymentsModal} onOpenChange={setShowAllPaymentsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Demande Tous les Paiements</DialogTitle>
            <DialogDescription className="text-gray-600">Demande de paiement pour toutes les commandes livrées en attente</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Résumé des paiements */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{stats.pendingPayments}</div>
                  <div className="text-sm text-red-700">Commandes en attente</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats.pendingPayments * 25000)}</div>
                  <div className="text-sm text-orange-700">Montant total</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">3.2j</div>
                  <div className="text-sm text-yellow-700">Délai moyen</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">100%</div>
                  <div className="text-sm text-blue-700">Taux de succès</div>
                </CardContent>
              </Card>
            </div>

            {/* Liste détaillée des commandes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes en attente de paiement</CardTitle>
                <CardDescription>Détail de toutes les commandes livrées mais non payées</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {orders.filter(order => order.status === 'delivered' && order.paymentStatus === 'pending').map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Commande #{order.id}</p>
                            <p className="text-sm text-gray-600">{order.customerName} - {formatCurrency(order.totalAmount)}</p>
                            <p className="text-xs text-gray-500">
                              Livrée le: {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('fr-FR') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                <div className="flex items-center space-x-2">
                        <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>
                        <div className="text-sm text-gray-600">
                          {order.totalAmount} F CFA
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Options de demande */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Options de demande de paiement</CardTitle>
                <CardDescription>Personnalisez votre demande de paiement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment-method">Mode de paiement préféré</Label>
                    <Select defaultValue="mobile-money">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mobile-money">Mobile Money</SelectItem>
                        <SelectItem value="bank-transfer">Virement bancaire</SelectItem>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="card">Carte bancaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="urgency-level">Niveau d'urgence</Label>
                    <Select defaultValue="normal">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Élevé</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="payment-message">Message personnalisé</Label>
                  <Textarea 
                    id="payment-message"
                    placeholder="Ajoutez un message personnalisé pour vos clients..."
                    defaultValue="Bonjour, nous vous rappelons que votre commande a été livrée avec succès. Merci de procéder au paiement dans les plus brefs délais."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter la liste
                </Button>
                <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
                <SocialShareMenu
                  shareText={`Demande tous les paiements - ${stats.pendingPayments} commandes - Montant total: ${formatCurrency(stats.pendingPayments * 25000)}`}
                  shareTitle="Demande tous les paiements"
                  onShare={(platform) => console.log(`Demande paiements partagée sur ${platform}`)}
                >
                  <Button 
                    variant="outline" 
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowAllPaymentsModal(false)}>
                  Annuler
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleSendAllPaymentRequests}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Envoyer toutes les demandes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Configuration des Notifications Intelligentes</DialogTitle>
            <DialogDescription className="text-gray-600">Personnalisez vos alertes et notifications pour une gestion optimale de votre boutique</DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {/* Types de notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Types de Notifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-medium text-blue-900">Nouvelles commandes</span>
                      <p className="text-xs text-blue-700">Alertes immédiates</p>
                    </div>
                </div>
                <Select defaultValue="push-email">
                    <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="push">🔔 Push</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="push-email">🔔📧 Push + Email</SelectItem>
                      <SelectItem value="sms">📱 SMS</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-orange-600" />
                    <div>
                      <span className="font-medium text-orange-900">Livraisons en retard</span>
                      <p className="text-xs text-orange-700">Alertes urgentes</p>
                    </div>
                </div>
                <Select defaultValue="urgent">
                    <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="normal">⚡ Normal</SelectItem>
                      <SelectItem value="urgent">🚨 Urgent</SelectItem>
                      <SelectItem value="critical">💥 Critique</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="font-medium text-green-900">Paiements reçus</span>
                      <p className="text-xs text-green-700">Confirmations</p>
                    </div>
                </div>
                <Select defaultValue="push">
                    <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="push">🔔 Push</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="sms">📱 SMS</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="font-medium text-red-900">Litiges détectés</span>
                      <p className="text-xs text-red-700">Alertes critiques</p>
            </div>
                  </div>
                  <Select defaultValue="urgent">
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">⚡ Normal</SelectItem>
                      <SelectItem value="urgent">🚨 Urgent</SelectItem>
                      <SelectItem value="critical">💥 Critique</SelectItem>
                      <SelectItem value="none">❌ Aucune</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Paramètres avancés */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Paramètres Avancés</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Fréquence des notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications en temps réel</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Résumé quotidien</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Résumé hebdomadaire</Label>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Canaux de communication</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications push</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications email</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications SMS</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Notifications WhatsApp</Label>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Heures de réception */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Heures de Réception</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Heure de début</Label>
                  <Select defaultValue="08:00">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Heure de fin</Label>
                  <Select defaultValue="20:00">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => (
                        <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Test des notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Test des Notifications</h3>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => showNotification('Test Push', 'Ceci est une notification de test', 'info')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Tester Push
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => showNotification('Test Email', 'Email de test envoyé', 'success')}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Tester Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => showNotification('Test SMS', 'SMS de test envoyé', 'warning')}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Tester SMS
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowNotificationsModal(false)}>
                Annuler
              </Button>
            <Button 
              onClick={handleSaveNotificationsConfig}
              className="bg-blue-600 hover:bg-blue-700"
            >
                <Save className="w-4 h-4 mr-2" />
              Sauvegarder la Configuration
              </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIConfigModal} onOpenChange={setShowAIConfigModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configuration de l'Intelligence Artificielle</DialogTitle>
            <DialogDescription>Paramétrez l'IA pour optimiser vos processus</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Automatisation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-validation" defaultChecked />
                    <Label htmlFor="auto-validation">Validation automatique des commandes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-reminders" defaultChecked />
                    <Label htmlFor="auto-reminders">Rappels intelligents</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-forecasts" defaultChecked />
                    <Label htmlFor="auto-forecasts">Prévisions de vente</Label>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seuils d'alerte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="delay-threshold">Seuil de retard (heures)</Label>
                    <Input id="delay-threshold" type="number" defaultValue="24" />
                  </div>
                  <div>
                    <Label htmlFor="stock-threshold">Seuil de stock</Label>
                    <Input id="stock-threshold" type="number" defaultValue="10" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAIConfigModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleApplyAIConfig}>
                <Save className="w-4 h-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForecastsModal} onOpenChange={setShowForecastsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Analytics Prédictifs</DialogTitle>
            <DialogDescription className="text-gray-600">Prévisions et tendances de vos ventes</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">+23%</div>
                  <div className="text-sm text-green-700">Croissance prévue</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">156</div>
                  <div className="text-sm text-blue-700">Commandes prévues</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">4.2M</div>
                  <div className="text-sm text-purple-700">CA prévu (F CFA)</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">3</div>
                  <div className="text-sm text-orange-700">Anomalies détectées</div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique des tendances */}
              <Card>
                <CardHeader>
                <CardTitle className="text-lg">Évolution des ventes (3 mois)</CardTitle>
                <CardDescription>Prévisions basées sur l'historique et les tendances saisonnières</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-800">Tendance de croissance</p>
                      <p className="text-sm text-gray-600">Prévision: +15% ce mois, +23% le mois prochain</p>
                      <div className="flex justify-center space-x-4 mt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">↑</div>
                          <div className="text-xs text-gray-600">Croissance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">→</div>
                          <div className="text-xs text-gray-600">Stable</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">↓</div>
                          <div className="text-xs text-gray-600">Déclin</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </CardContent>
              </Card>

            {/* Détection d'anomalies */}
              <Card>
                <CardHeader>
                <CardTitle className="text-lg">Détection d'anomalies</CardTitle>
                <CardDescription>Commandes nécessitant une attention particulière</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Commande #12345</p>
                        <p className="text-sm text-gray-600">Montant anormalement élevé</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">À surveiller</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium">Commande #12346</p>
                        <p className="text-sm text-gray-600">Client avec historique de retours</p>
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Risque élevé</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Commande #12347</p>
                        <p className="text-sm text-gray-600">Délai de livraison critique</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Urgent</Badge>
                  </div>
                  </div>
                </CardContent>
              </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleRefreshForecasts}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <SocialShareMenu
                  shareText="Prévisions: croissance +23%, 156 commandes prévues, CA 4.2M F CFA"
                  shareTitle="Mes prévisions de vente"
                  onShare={(platform) => console.log(`Prévisions partagées sur ${platform}`)}
                >
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
            </div>
              <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowForecastsModal(false)}>
                Fermer
              </Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportForecasts}>
                <Download className="w-4 h-4 mr-2" />
                  Exporter le rapport
              </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkActionsModal} onOpenChange={setShowBulkActionsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Actions en Lot</DialogTitle>
            <DialogDescription className="text-gray-600">
              {selectedOrdersForBulkAction.length} commande(s) sélectionnée(s)
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Résumé des commandes sélectionnées */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commandes sélectionnées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {orders.filter(order => selectedOrdersForBulkAction.includes(order.id)).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <span className="font-medium">#{order.id}</span>
                      <span className="text-gray-600">{order.customerName}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions disponibles */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Actions disponibles :</h3>
            <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('confirm')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Confirmer</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('ship')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">Expédier</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('deliver')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Livrer</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('cancel')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm">Annuler</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('requestPayment')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  <span className="text-sm">Demander paiement</span>
              </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleBulkAction('validateDelivery')}
                  className="h-auto py-3 px-4 flex flex-col items-center space-y-2"
                >
                  <User className="w-5 h-5 text-purple-600" />
                  <span className="text-sm">Valider livraison</span>
              </Button>
            </div>
            </div>

            {/* Bouton de partage des actions en lot */}
            <div className="flex justify-center pt-4">
              <SocialShareMenu
                shareText={`Actions en lot - ${selectedOrdersForBulkAction.length} commande(s) sélectionnée(s) pour traitement`}
                shareTitle="Actions en lot"
                onShare={(platform) => console.log(`Actions en lot partagées sur ${platform}`)}
              >
                <Button 
                  variant="outline" 
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Partager les actions
                </Button>
              </SocialShareMenu>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowBulkActionsModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleApplyBulkActions}
                disabled={selectedOrdersForBulkAction.length === 0}
              >
                Appliquer les actions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderDetailsModal} onOpenChange={setShowOrderDetailsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails Complets de la Commande</DialogTitle>
            <DialogDescription>
              {selectedOrder ? `Commande ${selectedOrder.id} - ${selectedOrder.customerName}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations Client</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Nom</Label>
                      <p className="text-sm">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedOrder.customerEmail || 'Non spécifié'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Téléphone</Label>
                      <p className="text-sm">{selectedOrder.customerPhone || 'Non spécifié'}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations Commande</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Statut</Label>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        {selectedOrder.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Paiement</Label>
                      <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date de commande</Label>
                      <p className="text-sm">{formatDate(selectedOrder.orderDate)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowOrderDetailsModal(false)}>
                  Fermer
                </Button>
                <Button onClick={() => handleEditOrderModal(selectedOrder)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <SocialShareMenu
                  shareText={`Commande ${selectedOrder.id} - ${selectedOrder.customerName} - ${formatCurrency(selectedOrder.totalAmount)}`}
                  shareTitle="Détails de la commande"
                  onShare={(platform) => console.log(`Commande partagée sur ${platform}`)}
                >
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditOrderModal} onOpenChange={setShowEditOrderModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Commande</DialogTitle>
            <DialogDescription>
              {editingOrder ? `Commande ${editingOrder.id}` : ''}
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-status">Statut</Label>
                  <Select value={editingOrder.status} onValueChange={(value: SellerOrder['status']) => 
                    setEditingOrder({...editingOrder, status: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="confirmed">Confirmée</SelectItem>
                      <SelectItem value="shipped">Expédiée</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                      <SelectItem value="cancelled">Annulée</SelectItem>
                      <SelectItem value="returned">Retournée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea 
                    id="edit-notes"
                    value={editingOrder.notes || ''}
                    onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                    placeholder="Ajoutez des notes sur cette commande..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditOrderModal(false)}>
                  Annuler
                </Button>
                <Button onClick={() => {
                  handleSaveOrderEdit(editingOrder)
                  setShowEditOrderModal(false)
                }}>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Système de notifications modernes */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 transform transition-all duration-300 ease-in-out
              ${notification.type === 'success' ? 'border-l-green-500' : ''}
              ${notification.type === 'error' ? 'border-l-red-500' : ''}
              ${notification.type === 'warning' ? 'border-l-yellow-500' : ''}
              ${notification.type === 'info' ? 'border-l-blue-500' : ''}
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {notification.type === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {notification.type === 'warning' && (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                {notification.type === 'info' && (
                  <Info className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                  {notification.message}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {notification.timestamp.toLocaleTimeString('fr-FR')}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Optimisation des Livraisons */}
      <Dialog open={showDeliveryOptimizationModal} onOpenChange={setShowDeliveryOptimizationModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Optimisation des Livraisons</DialogTitle>
            <DialogDescription className="text-gray-600">Optimisez vos coûts et délais de livraison avec l'IA</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Statistiques actuelles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">98.2%</div>
                  <div className="text-sm text-green-700">Livraisons à temps</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">-15%</div>
                  <div className="text-sm text-blue-700">Coûts de transport</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">1-2 jours</div>
                  <div className="text-sm text-orange-700">Délai moyen</div>
                </CardContent>
              </Card>
            </div>

            {/* Transporteur recommandé */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg text-blue-900">🚚 Transporteur Recommandé</CardTitle>
                <CardDescription className="text-blue-700">Sélectionné par l'IA pour optimiser vos coûts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-blue-900">Express Delivery</h3>
                      <p className="text-sm text-blue-700">Service premium avec suivi en temps réel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-900">-20% coût</div>
                    <div className="text-sm text-blue-600">1-2 jours</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Temps estimé:</span>
                      <span className="font-medium">1-2 jours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Livraison garantie:</span>
                      <span className="font-medium text-green-600">✓ Oui</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Suivi en temps réel:</span>
                      <span className="font-medium text-green-600">✓ Oui</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base:</span>
                      <span className="font-medium">2,500 XOF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Optimisation IA:</span>
                      <span className="font-medium text-green-600">-500 XOF</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-semibold">Total:</span>
                      <span className="font-bold text-green-600">2,000 XOF</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Options d'optimisation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚙️ Options d'Optimisation</CardTitle>
                <CardDescription>Personnalisez vos préférences de livraison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Priorité de livraison</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cost">Coût minimum</SelectItem>
                        <SelectItem value="balanced">Équilibré</SelectItem>
                        <SelectItem value="speed">Vitesse maximale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Zone de livraison</Label>
                    <Select defaultValue="national">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Locale</SelectItem>
                        <SelectItem value="national">Nationale</SelectItem>
                        <SelectItem value="international">Internationale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Notifications de suivi</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tracking-notifications" defaultChecked />
                    <Label htmlFor="tracking-notifications">Activer les notifications de suivi</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleExportDeliveryReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter le rapport
                </Button>
                <SocialShareMenu
                  shareText="🚚 Optimisation des livraisons appliquée! Transporteur Express Delivery sélectionné, -20% de coûts, délai 1-2 jours, livraison garantie."
                  shareTitle="Optimisation des livraisons"
                  onShare={(platform) => console.log(`Optimisation partagée sur ${platform}`)}
                >
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDeliveryOptimizationModal(false)}>
                  Fermer
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleApplyDeliveryOptimization}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Appliquer l'optimisation
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Gestion des Litiges */}
      <Dialog open={showDisputesModal} onOpenChange={setShowDisputesModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Gestion Intelligente des Litiges</DialogTitle>
            <DialogDescription className="text-gray-600">Résolvez et prévenez les litiges avec l'aide de l'IA</DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Statistiques des litiges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">0.8%</div>
                  <div className="text-sm text-green-700">Taux de litiges</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-900">2.1h</div>
                  <div className="text-sm text-blue-700">Résolution moyenne</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-900">95%</div>
                  <div className="text-sm text-purple-700">Satisfaction client</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-900">12</div>
                  <div className="text-sm text-orange-700">Litiges ce mois</div>
                </CardContent>
              </Card>
            </div>

            {/* Fonctionnalités IA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-lg text-green-900">🤖 Résolution Automatique</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">Actif</div>
                  <p className="text-sm text-green-700">IA résout 80% des litiges simples</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">🛡️ Prévention des Conflits</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">Actif</div>
                  <p className="text-sm text-blue-700">Détection proactive des risques</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-900">💬 Chat de Support IA</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">Actif</div>
                  <p className="text-sm text-purple-700">Support 24/7 intelligent</p>
                </CardContent>
              </Card>
            </div>

            {/* Litiges en cours */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Litiges en Cours</CardTitle>
                <CardDescription>Suivi et résolution des litiges actifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">Commande #12345</p>
                        <p className="text-sm text-gray-600">Produit défectueux - Client mécontent</p>
                        <p className="text-xs text-gray-500">Ouvert il y a 2h</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDisputeDetails({
                          id: 'dispute-12345',
                          orderId: '12345',
                          type: 'Produit défectueux',
                          description: 'Produit défectueux - Client mécontent',
                          status: 'en_cours',
                          openedAt: 'Il y a 2h',
                          customerName: 'Client mécontent',
                          priority: 'urgent'
                        })}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Commande #12346</p>
                        <p className="text-sm text-gray-600">Retard de livraison - Résolu</p>
                        <p className="text-xs text-gray-500">Résolu il y a 1h</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-100 text-green-800">Résolu</Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDisputeDetails({
                          id: 'dispute-12346',
                          orderId: '12346',
                          type: 'Retard de livraison',
                          description: 'Retard de livraison - Résolu',
                          status: 'résolu',
                          openedAt: 'Il y a 3h',
                          resolvedAt: 'Il y a 1h',
                          customerName: 'Client satisfait',
                          priority: 'normal'
                        })}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" onClick={handleExportDisputesReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter le rapport
                </Button>
                <SocialShareMenu
                  shareText="🛡️ Gestion intelligente des litiges active! IA résout 80% des litiges, prévention proactive, support 24/7, satisfaction client 95%."
                  shareTitle="Gestion intelligente des litiges"
                  onShare={(platform) => console.log(`Gestion des litiges partagée sur ${platform}`)}
                >
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                    <Share className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </SocialShareMenu>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setShowDisputesModal(false)}>
                  Fermer
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreateDispute}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Nouveau litige
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Détails des Litiges */}
      <Dialog open={showDisputeDetailsModal} onOpenChange={setShowDisputeDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Détails du Litige</DialogTitle>
            <DialogDescription className="text-gray-600">Informations complètes et actions disponibles</DialogDescription>
          </DialogHeader>
          
          {selectedDispute && (
            <div className="p-6 space-y-6">
              {/* En-tête du litige */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Litige #{selectedDispute.id}</h3>
                    <p className="text-lg text-gray-700">{selectedDispute.type}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={
                        selectedDispute.status === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                        selectedDispute.status === 'résolu' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {selectedDispute.status === 'en_cours' ? 'En cours' :
                       selectedDispute.status === 'résolu' ? 'Résolu' : 'Fermé'}
                    </Badge>
                    <Badge 
                      className={`ml-2 ${
                        selectedDispute.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        selectedDispute.priority === 'critique' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedDispute.priority === 'urgent' ? 'Urgent' :
                       selectedDispute.priority === 'critique' ? 'Critique' : 'Normal'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations Générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Commande:</span>
                      <span className="text-sm">#{selectedDispute.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Client:</span>
                      <span className="text-sm">{selectedDispute.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Ouvert:</span>
                      <span className="text-sm">{selectedDispute.openedAt}</span>
                    </div>
                    {selectedDispute.resolvedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-600">Résolu:</span>
                        <span className="text-sm">{selectedDispute.resolvedAt}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedDispute.description}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Historique des actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historique des Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Litige créé</p>
                        <p className="text-xs text-blue-700">{selectedDispute.openedAt}</p>
                      </div>
                    </div>
                    {selectedDispute.status === 'en_cours' && (
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">En cours de traitement</p>
                          <p className="text-xs text-yellow-700">IA analyse en cours...</p>
                        </div>
                      </div>
                    )}
                    {selectedDispute.status === 'résolu' && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Résolu</p>
                          <p className="text-xs text-green-700">{selectedDispute.resolvedAt}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Actions disponibles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-3">
                    {selectedDispute.status === 'en_cours' && (
                      <>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleResolveDispute(selectedDispute.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Résolution...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Résoudre le litige
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleCloseDispute(selectedDispute.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                              Fermeture...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Fermer le litige
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => setShowDisputeDetailsModal(false)}
                    >
                      Fermer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}