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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  const [showBulkActionModal, setShowBulkActionModal] = useState(false)
  
  // Nouveaux états pour les fonctionnalités avancées
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [showRankingModal, setShowRankingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
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

  const handleBulkAction = (action: string) => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }
    
    const actionText = {
      'confirm': 'confirmer',
      'ship': 'expédier',
      'deliver': 'livrer',
      'cancel': 'annuler',
      'requestPayment': 'demander le paiement',
      'validateDelivery': 'valider la livraison'
    }[action] || action
    
    if (confirm(`Êtes-vous sûr de vouloir ${actionText} ${selectedOrdersForBulkAction.length} commande(s) ?`)) {
      selectedOrdersForBulkAction.forEach(orderId => {
        switch (action) {
          case 'confirm':
            onOrderStatusChange(orderId, 'confirmed')
            break
          case 'ship':
            onOrderStatusChange(orderId, 'shipped')
            break
          case 'deliver':
            onOrderStatusChange(orderId, 'delivered')
            break
          case 'cancel':
            onOrderStatusChange(orderId, 'cancelled')
            break
          case 'requestPayment':
            onPaymentRequest?.(orderId)
            break
          case 'validateDelivery':
            onCustomerValidation?.(orderId)
            break
        }
      })
      
      setSelectedOrdersForBulkAction([])
      setShowBulkActionModal(false)
      showNotification('Actions appliquées', `${selectedOrdersForBulkAction.length} commande(s) traitée(s)`, 'success')
    }
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
  }

  const handleViewShippedOrders = () => {
    setStatusFilter('shipped')
    setActiveTab('shipped')
  }

  const handleViewRevenueDetails = () => {
    setShowAnalyticsModal(true)
  }

  const handleViewPendingPayments = () => {
    setPaymentFilter('pending')
    setStatusFilter('delivered')
    setActiveTab('pending-payments')
  }

  const handleViewReturns = () => {
    setStatusFilter('returned')
    setActiveTab('returns')
  }

  const handleViewRankingDetails = () => {
    setShowRankingModal(true)
  }

  // Fonctions pour les filtres avancés
  const [urgentFilter, setUrgentFilter] = useState(false)
  const [highValueFilter, setHighValueFilter] = useState(false)
  const [repeatCustomerFilter, setRepeatCustomerFilter] = useState(false)

  const handleUrgentFilter = (checked: boolean) => {
    setUrgentFilter(checked)
  }

  const handleHighValueFilter = (checked: boolean) => {
    setHighValueFilter(checked)
  }

  const handleRepeatCustomerFilter = (checked: boolean) => {
    setRepeatCustomerFilter(checked)
  }

  // Fonction pour optimiser les livraisons
  const handleOptimizeDeliveries = () => {
    setIsLoading(true)
    setTimeout(() => {
      showNotification('Optimisation terminée', '✅ Transporteur Express Delivery sélectionné\n✅ Frais réduits de 500 XOF\n✅ Délai de livraison optimisé à 1-2 jours', 'success')
      setIsLoading(false)
    }, 2000)
  }

  // Fonction pour gérer les litiges
  const handleManageDisputes = () => {
    setShowDisputesModal(true)
  }

  // Fonction pour configurer les notifications
  const handleConfigureNotifications = () => {
    setShowNotificationsModal(true)
  }

  // Fonction pour synchroniser
  const handleSyncNow = () => {
    setIsLoading(true)
    setTimeout(() => {
      showNotification('Synchronisation terminée', '✅ Marketplace principale synchronisée\n✅ WooCommerce synchronisé\n✅ Shopify en attente de connexion\n✅ Amazon déconnecté', 'success')
      setIsLoading(false)
    }, 3000)
  }

  // Fonction pour configurer l'IA
  const handleConfigureAI = () => {
    setShowAIConfigModal(true)
  }

  // Fonction pour voir les prévisions
  const handleViewForecasts = () => {
    setShowForecastsModal(true)
  }

  // Nouveaux états pour les modals
  const [showDisputesModal, setShowDisputesModal] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const [showAIConfigModal, setShowAIConfigModal] = useState(false)
  const [showForecastsModal, setShowForecastsModal] = useState(false)
  const [showBulkActionsModal, setShowBulkActionsModal] = useState(false)
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false)
  const [showEditOrderModal, setShowEditOrderModal] = useState(false)

  // Fonction pour les actions en lot
  const handleBulkActions = () => {
    if (selectedOrdersForBulkAction.length === 0) {
      showNotification('Attention', 'Veuillez sélectionner au moins une commande', 'warning')
      return
    }
    setShowBulkActionsModal(true)
  }

  // Fonction pour voir les détails d'une commande
  const handleViewOrderDetails = (order: SellerOrder) => {
    setSelectedOrder(order)
    setShowOrderDetailsModal(true)
  }

  // Fonction pour éditer une commande
  const handleEditOrderModal = (order: SellerOrder) => {
    setEditingOrder(order)
    setShowEditOrderModal(true)
  }

  // Fonction pour supprimer une commande
  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.')) {
      showNotification('Commande supprimée', `Commande ${orderId} supprimée avec succès`, 'success')
    }
  }

  // Fonction pour dupliquer une commande
  const handleDuplicateOrder = (order: SellerOrder) => {
    const newOrder = {
      ...order,
      id: `${order.id}-COPY`,
      orderDate: new Date().toISOString(),
      status: 'pending' as const
    }
    showNotification('Commande dupliquée', `Commande ${order.id} dupliquée avec succès. Nouvelle commande: ${newOrder.id}`, 'success')
  }

  // Fonction pour archiver une commande
  const handleArchiveOrder = (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir archiver cette commande ?')) {
      showNotification('Commande archivée', `Commande ${orderId} archivée avec succès`, 'info')
    }
  }

  // Fonction pour marquer comme prioritaire
  const handleMarkAsPriority = (orderId: string) => {
    showNotification('Priorité définie', `Commande ${orderId} marquée comme prioritaire`, 'success')
  }

  // Fonction pour envoyer un rappel
  const handleSendReminder = (orderId: string) => {
    showNotification('Rappel envoyé', `Rappel envoyé pour la commande ${orderId}`, 'success')
  }

  // Fonction pour générer un bon de livraison
  const handleGenerateDeliveryNote = (orderId: string) => {
    setIsLoading(true)
    setTimeout(() => {
      const deliveryNoteContent = `BON DE LIVRAISON\nCommande: ${orderId}\nDate: ${new Date().toLocaleDateString('fr-FR')}\n\nContenu:\n- Produits de la commande\n\nSignature du livreur: _________________\nSignature du client: _________________`
      
      const blob = new Blob([deliveryNoteContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bon_livraison_${orderId}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Bon de livraison généré', `Bon de livraison pour la commande ${orderId} téléchargé`, 'success')
    }, 1500)
  }

  // Fonction pour générer un reçu
  const handleGenerateReceipt = (orderId: string) => {
    setIsLoading(true)
    setTimeout(() => {
      const receiptContent = `REÇU DE PAIEMENT\nCommande: ${orderId}\nDate: ${new Date().toLocaleDateString('fr-FR')}\n\nMontant reçu: [Montant]\nMode de paiement: [Mode]\n\nSignature: _________________`
      
      const blob = new Blob([receiptContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `recu_${orderId}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Reçu généré', `Reçu pour la commande ${orderId} téléchargé`, 'success')
    }, 1500)
  }

  // Fonction pour partager la commande
  const handleShareOrder = (order: SellerOrder) => {
    const shareText = `Commande ${order.id} - ${order.customerName} - ${formatCurrency(order.totalAmount)}`
    if (navigator.share) {
      navigator.share({
        title: 'Détails de la commande',
        text: shareText
      })
    } else {
      navigator.clipboard.writeText(shareText)
      showNotification('Succès', 'Détails de la commande copiés dans le presse-papiers', 'success')
    }
  }

  // Fonction pour partager les analytics
  const handleShareAnalytics = () => {
    const analyticsText = `Analytics de vente - CA: ${formatCurrency(stats.totalRevenue)} - ${stats.total} commandes`
    if (navigator.share) {
      navigator.share({
        title: 'Analytics de vente',
        text: analyticsText
      })
    } else {
      navigator.clipboard.writeText(analyticsText)
      showNotification('Succès', 'Analytics copiés dans le presse-papiers', 'success')
    }
  }

  // Fonction pour partager le classement
  const handleShareRanking = () => {
    const rankingText = `Classement marketplace - Position #${marketplaceRanking.position} sur ${marketplaceRanking.totalVendors} vendeurs`
    if (navigator.share) {
      navigator.share({
        title: 'Mon classement marketplace',
        text: rankingText
      })
    } else {
      navigator.clipboard.writeText(rankingText)
      showNotification('Succès', 'Classement copié dans le presse-papiers', 'success')
    }
  }

  // Fonction pour partager les statistiques
  const handleShareStats = () => {
    const statsText = `Statistiques vendeur - ${stats.total} commandes - CA: ${formatCurrency(stats.totalRevenue)}`
    if (navigator.share) {
      navigator.share({
        title: 'Mes statistiques vendeur',
        text: statsText
      })
    } else {
      navigator.clipboard.writeText(statsText)
      showNotification('Succès', 'Statistiques copiées dans le presse-papiers', 'success')
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
  const [notifications, setNotifications] = useState<Array<{
    id: string
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    timestamp: Date
  }>>([])

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
              <Button size="sm" variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
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
              <Button size="sm" variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
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
              <Button size="sm" variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
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
              <Button size="sm" variant="outline" className="flex-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50">
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

            <Button 
              variant="outline" 
              className="w-full border-violet-300 text-violet-700 hover:bg-violet-50"
              onClick={handleShareAnalytics}
            >
              <Share className="w-4 h-4 mr-2" />
              Partager les analytics
            </Button>
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
            >
              <Settings className="w-4 h-4 mr-2" />
              Optimiser les livraisons
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
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Gérer les litiges
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

              <Button 
                onClick={handleShareStats}
                variant="outline" 
                className="w-full justify-start"
              >
                <Share className="w-4 h-4 mr-2" />
                Partager Stats
              </Button>
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
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={handleShareRanking}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Partager
                </Button>
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
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurer les notifications
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
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Synchroniser maintenant
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
                    <Button size="sm" variant="outline" onClick={() => handleShareOrder(order)}>
                      <Share className="w-4 h-4 mr-1" />
                      Partager
                    </Button>
                  </div>

                  {/* Boutons de partage social */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleShareOnSocial('facebook', order)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Facebook
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleShareOnSocial('twitter', order)}
                      className="border-sky-300 text-sky-700 hover:bg-sky-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Twitter
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleShareOnSocial('whatsapp', order)}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      WhatsApp
                    </Button>
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
                    <Button size="sm" variant="outline" onClick={() => handleGenerateDeliveryNote(order.id)}>
                      <FileText className="w-4 h-4 mr-1" />
                      Bon de livraison
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleGenerateReceipt(order.id)}>
                      <Receipt className="w-4 h-4 mr-1" />
                      Reçu
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownloadDocuments(order.id)}>
                      <Download className="w-4 h-4 mr-1" />
                      Documents
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSendReminder(order.id)}>
                      <Bell className="w-4 h-4 mr-1" />
                      Rappel
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMarkAsPriority(order.id)}>
                      <Star className="w-4 h-4 mr-1" />
                      Prioritaire
                    </Button>
                  </div>

                  {/* Actions avancées */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleArchiveOrder(order.id)}>
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
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteOrder(order.id)}>
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

      {/* Modals simplifiés */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analytics Avancés</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Fonctionnalité en cours de développement...</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRankingModal} onOpenChange={setShowRankingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Classement Marketplace</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Fonctionnalité en cours de développement...</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la Commande</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Fonctionnalité en cours de développement...</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la Commande</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Fonctionnalité en cours de développement...</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nouveaux modals complets */}
      <Dialog open={showDisputesModal} onOpenChange={setShowDisputesModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gestion Intelligente des Litiges</DialogTitle>
            <DialogDescription>Résolution automatisée et prévention des conflits</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Litiges en cours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="font-medium">Commande #12345</p>
                        <p className="text-sm text-gray-600">Livraison en retard</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Commande #12346</p>
                        <p className="text-sm text-gray-600">Produit endommagé</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Résolu</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-800">0.8%</div>
                      <div className="text-sm text-blue-600">Taux de litiges</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-800">2.1h</div>
                      <div className="text-sm text-green-600">Résolution moyenne</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDisputesModal(false)}>
                Fermer
              </Button>
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Nouveau litige
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationsModal} onOpenChange={setShowNotificationsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuration des Notifications</DialogTitle>
            <DialogDescription>Personnalisez vos alertes et notifications</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Nouvelles commandes</span>
                </div>
                <Select defaultValue="push-email">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push-email">Push + Email</SelectItem>
                    <SelectItem value="none">Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  <span>Livraisons en retard</span>
                </div>
                <Select defaultValue="urgent">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="none">Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Paiements reçus</span>
                </div>
                <Select defaultValue="push">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="none">Aucune</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNotificationsModal(false)}>
                Annuler
              </Button>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
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
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForecastsModal} onOpenChange={setShowForecastsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Analytics Prédictifs</DialogTitle>
            <DialogDescription>Prévisions et tendances de vos ventes</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prévision de vente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">+23%</div>
                    <div className="text-sm text-gray-600">vs mois précédent</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Détection d'anomalies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">3</div>
                    <div className="text-sm text-gray-600">commandes à surveiller</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-600">Croissance stable</div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Graphique des prévisions en cours de développement...</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowForecastsModal(false)}>
                Fermer
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showBulkActionsModal} onOpenChange={setShowBulkActionsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actions en Lot</DialogTitle>
            <DialogDescription>
              {selectedOrdersForBulkAction.length} commande(s) sélectionnée(s)
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleBulkAction('confirm')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmer
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction('ship')}>
                <Truck className="w-4 h-4 mr-2" />
                Expédier
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction('deliver')}>
                <Package className="w-4 h-4 mr-2" />
                Livrer
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction('cancel')}>
                <XCircle className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction('requestPayment')}>
                <CreditCard className="w-4 h-4 mr-2" />
                Demander paiement
              </Button>
              <Button variant="outline" onClick={() => handleBulkAction('validateDelivery')}>
                <User className="w-4 h-4 mr-2" />
                Valider livraison
              </Button>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowBulkActionsModal(false)}>
                Annuler
              </Button>
              <Button onClick={() => setShowBulkActionsModal(false)}>
                Appliquer
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
    </div>
  )
}