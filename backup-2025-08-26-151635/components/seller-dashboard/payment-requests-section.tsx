"use client"

import { useState, useEffect } from 'react'
import { 
  DollarSign, CheckCircle, XCircle, Clock, AlertTriangle,
  Download, Filter, Search, Calendar, User, Package,
  Truck, Star, MessageCircle, Plus, Minus, CreditCard,
  Smartphone, Wallet, Mail, Building, UserCheck, Users
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DeliveredOrder {
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
  status: string
  paymentStatus: string
  shippingAddress: string
  orderDate: string
  deliveryDate: string
  expectedDeliveryDate: string
  customerRating?: number
  customerReview?: string
  trackingNumber: string
  shippingMethod: string
  notes: string
  isPaymentRequested: boolean
  paymentRequestDate?: string | null
}

interface PaymentRequestData {
  orderId: string
  amount: number
  paymentMethod: string
  accountNumber: string
  accountName: string
  bankName?: string
  phoneNumber?: string
  notes?: string
  sellerEmail: string
  sellerName: string
}

// Données mock pour les vendeurs (en réalité, cela viendrait de l'API)
const mockSellers = [
  { id: 1, name: "Kouassi Jean", email: "kouassi.jean@email.com", phone: "+225 07 12 34 56 78" },
  { id: 2, name: "Traoré Fatou", email: "traore.fatou@email.com", phone: "+225 07 23 45 67 89" },
  { id: 3, name: "Diallo Mamadou", email: "diallo.mamadou@email.com", phone: "+225 07 34 56 78 90" },
  { id: 4, name: "Koné Aminata", email: "kone.aminata@email.com", phone: "+225 07 45 67 89 01" },
  { id: 5, name: "Ouattara Issouf", email: "ouattara.issouf@email.com", phone: "+225 07 56 78 90 12" },
]

interface PaymentRequestsSectionProps {
  deliveredOrders: DeliveredOrder[]
  onPaymentRequest: (orderId: string, amount: number, paymentData: PaymentRequestData) => void
  onBulkPaymentRequest: (orders: DeliveredOrder[]) => void
}

export default function PaymentRequestsSection({
  deliveredOrders,
  onPaymentRequest,
  onBulkPaymentRequest
}: PaymentRequestsSectionProps) {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAllVendorsModal, setShowAllVendorsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DeliveredOrder | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [animateModal, setAnimateModal] = useState(false)
  const [animateContent, setAnimateContent] = useState(false)
  
  // État pour le formulaire de demande de paiement
  const [paymentData, setPaymentData] = useState<PaymentRequestData>({
    orderId: '',
    amount: 0,
    paymentMethod: '',
    accountNumber: '',
    accountName: '',
    bankName: '',
    phoneNumber: '',
    notes: '',
    sellerEmail: '',
    sellerName: ''
  })

  // États pour la recherche de vendeur
  const [sellerSearchOpen, setSellerSearchOpen] = useState(false)
  const [sellerSearchValue, setSellerSearchValue] = useState('')
  const [filteredSellers, setFilteredSellers] = useState(mockSellers)

  // Animation du modal
  useEffect(() => {
    if (showPaymentModal) {
      setTimeout(() => setAnimateModal(true), 100)
      setTimeout(() => setAnimateContent(true), 200)
    } else {
      setAnimateModal(false)
      setAnimateContent(false)
    }
  }, [showPaymentModal])

  // Filtrage des vendeurs
  useEffect(() => {
    if (sellerSearchValue) {
      const filtered = mockSellers.filter(seller =>
        seller.name.toLowerCase().includes(sellerSearchValue.toLowerCase()) ||
        seller.email.toLowerCase().includes(sellerSearchValue.toLowerCase())
      )
      setFilteredSellers(filtered)
    } else {
      setFilteredSellers(mockSellers)
    }
  }, [sellerSearchValue])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const handleSelectAll = () => {
    const availableOrders = deliveredOrders
      .filter(order => !order.isPaymentRequested)
      .map(order => order.id)
    
    setSelectedOrders(prev => 
      prev.length === availableOrders.length ? [] : availableOrders
    )
  }

  const handleBulkRequest = () => {
    const selectedOrderObjects = deliveredOrders.filter(order => 
      selectedOrders.includes(order.id) && !order.isPaymentRequested
    )
    onBulkPaymentRequest(selectedOrderObjects)
    setShowBulkModal(false)
    setSelectedOrders([])
  }

  const handlePaymentRequestClick = (order: DeliveredOrder) => {
    setSelectedOrder(order)
    setPaymentData({
      orderId: order.id,
      amount: order.netRevenue,
      paymentMethod: '',
      accountNumber: '',
      accountName: '',
      bankName: '',
      phoneNumber: '',
      notes: '',
      sellerEmail: '',
      sellerName: ''
    })
    setShowPaymentModal(true)
  }

  const handlePaymentRequestSubmit = () => {
    if (selectedOrder && paymentData.paymentMethod && paymentData.sellerEmail && paymentData.sellerName) {
      onPaymentRequest(selectedOrder.id, selectedOrder.netRevenue, paymentData)
      setShowPaymentModal(false)
      setSelectedOrder(null)
      setPaymentData({
        orderId: '',
        amount: 0,
        paymentMethod: '',
        accountNumber: '',
        accountName: '',
        bankName: '',
        phoneNumber: '',
        notes: '',
        sellerEmail: '',
        sellerName: ''
      })
    }
  }

  const handleSellerSelect = (seller: typeof mockSellers[0]) => {
    setPaymentData(prev => ({
      ...prev,
      sellerName: seller.name,
      sellerEmail: seller.email
    }))
    setSellerSearchOpen(false)
    setSellerSearchValue('')
  }

  const handleAllVendorsRequest = () => {
    const availableOrders = deliveredOrders.filter(order => !order.isPaymentRequested)
    if (availableOrders.length > 0) {
      onBulkPaymentRequest(availableOrders)
    }
    setShowAllVendorsModal(false)
  }

  // Fonction pour exporter les données de demande de paiement
  const handleExport = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    // Filtrer les commandes selon le statut sélectionné
    let ordersToExport = deliveredOrders
    
    if (filterStatus === 'not-requested') {
      ordersToExport = deliveredOrders.filter(order => !order.isPaymentRequested)
    } else if (filterStatus === 'requested') {
      ordersToExport = deliveredOrders.filter(order => order.isPaymentRequested)
    }
    
    // Appliquer la recherche si un terme est saisi
    if (searchTerm) {
      ordersToExport = ordersToExport.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    let exportData = ''
    let fileName = ''
    let mimeType = ''
    
    switch (format) {
      case 'csv':
        exportData = generateCSVExport(ordersToExport)
        fileName = `demandes_paiement_${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
        break
      case 'excel':
        exportData = generateExcelExport(ordersToExport)
        fileName = `demandes_paiement_${new Date().toISOString().split('T')[0]}.xlsx`
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      case 'pdf':
        exportData = generatePDFExport(ordersToExport)
        fileName = `demandes_paiement_${new Date().toISOString().split('T')[0]}.pdf`
        mimeType = 'application/pdf'
        break
    }
    
    // Télécharger le fichier
    downloadFile(exportData, fileName, mimeType)
  }
  
  // Génération de l'export CSV
  const generateCSVExport = (orders: DeliveredOrder[]) => {
    const headers = [
      'ID Commande',
      'Client',
      'Email Client',
      'Téléphone Client',
      'Adresse Livraison',
      'Date Commande',
      'Date Livraison',
      'Méthode Livraison',
      'Numéro Suivi',
      'Montant Total',
      'Commission',
      'Revenu Net',
      'Statut Paiement',
      'Date Demande Paiement',
      'Produits'
    ]
    
    const rows = orders.map(order => [
      order.id,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.shippingAddress,
      formatDate(order.orderDate),
      formatDate(order.deliveryDate),
      order.shippingMethod,
      order.trackingNumber,
      formatCurrency(order.totalAmount),
      formatCurrency(order.commission),
      formatCurrency(order.netRevenue),
      order.isPaymentRequested ? 'Demandé' : 'Non demandé',
      order.paymentRequestDate ? formatDate(order.paymentRequestDate) : 'N/A',
      order.products.map(p => `${p.name} (x${p.quantity})`).join('; ')
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }
  
  // Génération de l'export Excel (simulation)
  const generateExcelExport = (orders: DeliveredOrder[]) => {
    // En production, utiliser une vraie bibliothèque comme xlsx
    // Pour l'instant, retourner le format CSV
    return generateCSVExport(orders)
  }
  
  // Génération de l'export PDF (simulation)
  const generatePDFExport = (orders: DeliveredOrder[]) => {
    // En production, utiliser une vraie bibliothèque comme jsPDF
    // Pour l'instant, retourner le format CSV
    return generateCSVExport(orders)
  }
  
  // Fonction pour télécharger le fichier
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mobile_money':
        return <Smartphone className="w-4 h-4" />
      case 'bank_card':
        return <CreditCard className="w-4 h-4" />
      case 'bank_transfer':
        return <Wallet className="w-4 h-4" />
      default:
        return <DollarSign className="w-4 h-4" />
    }
  }

  const filteredOrders = deliveredOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'requested' && order.isPaymentRequested) ||
                         (filterStatus === 'not-requested' && !order.isPaymentRequested)
    
    return matchesSearch && matchesFilter
  })

  const availableForPayment = deliveredOrders.filter(order => !order.isPaymentRequested)
  const totalAvailableAmount = availableForPayment.reduce((sum, order) => sum + order.netRevenue, 0)
  const selectedAmount = deliveredOrders
    .filter(order => selectedOrders.includes(order.id) && !order.isPaymentRequested)
    .reduce((sum, order) => sum + order.netRevenue, 0)

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/30 border-[#10b981] shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#10b981]">Commandes Livrées</p>
                <p className="text-2xl font-bold text-[#10b981]">{deliveredOrders.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-[#10b981]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#3b82f6]/20 to-[#3b82f6]/30 border-[#3b82f6] shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#3b82f6]">Disponibles pour Paiement</p>
                <p className="text-2xl font-bold text-[#3b82f6]">{availableForPayment.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[#3b82f6]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#8b5cf6]/20 to-[#8b5cf6]/30 border-[#8b5cf6] shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#8b5cf6]">Montant Total</p>
                <p className="text-2xl font-bold text-[#8b5cf6]">{formatCurrency(totalAvailableAmount)}</p>
              </div>
              <Package className="w-8 h-8 text-[#8b5cf6]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#ff6600]/20 to-[#ff6600]/30 border-[#ff6600] shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#ff6600]">Paiements Demandés</p>
                <p className="text-2xl font-bold text-[#ff6600]">
                  {deliveredOrders.filter(order => order.isPaymentRequested).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-[#ff6600]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#ff6600] text-2xl font-bold">Demandes de Paiement</CardTitle>
              <CardDescription className="text-gray-600">
                Gérez les demandes de paiement pour vos ventes livrées et confirmées
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {availableForPayment.length > 0 && (
                <Button 
                  onClick={() => setShowAllVendorsModal(true)}
                  className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Demande Tous les Paiements
                </Button>
              )}
              {selectedOrders.length > 0 && (
                <Button 
                  onClick={() => setShowBulkModal(true)}
                  className="bg-[#10b981] hover:bg-[#10b981]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Demande Groupée ({selectedOrders.length})
                </Button>
              )}
              <div className="relative">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('csv')}
                  className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📊 Export CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📈 Export Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      📄 Export PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ff6600] w-4 h-4" />
              <Input 
                placeholder="Rechercher par client ou numéro de commande..." 
                className="pl-10 border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48 border-[#ff6600] focus:border-[#ff6600] focus:ring-[#ff6600] focus:ring-2">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les commandes</SelectItem>
                <SelectItem value="not-requested">Paiement non demandé</SelectItem>
                <SelectItem value="requested">Paiement demandé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tableau des commandes */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Checkbox 
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleSelectOrder(order.id)}
                        disabled={order.isPaymentRequested}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{order.id}</h3>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Livrée
                            </Badge>
                            {order.isPaymentRequested && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Paiement demandé
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(order.netRevenue)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Net après commission
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{order.customerName}</span>
                            </div>
                            <p className="text-sm text-gray-600">{order.customerEmail}</p>
                            <p className="text-sm text-gray-600">{order.customerPhone}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Truck className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Livraison</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Livré le {formatDate(order.deliveryDate)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.shippingMethod} • {order.trackingNumber}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Produits commandés :</h4>
                          <div className="space-y-1">
                            {order.products.map((product, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span>{product.name} x{product.quantity}</span>
                                <span className="font-medium">{formatCurrency(product.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.customerRating && (
                          <div className="flex items-center space-x-2 mt-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < order.customerRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              {order.customerRating}/5
                            </span>
                            {order.customerReview && (
                              <span className="text-sm text-gray-600">
                                • "{order.customerReview}"
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-4">
                      {!order.isPaymentRequested ? (
                        <Button 
                          onClick={() => handlePaymentRequestClick(order)}
                          className="bg-[#10b981] hover:bg-[#10b981]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Demander Paiement
                        </Button>
                      ) : (
                        <div className="text-right">
                          <p className="text-sm text-orange-600 font-medium">
                            Demande envoyée le {order.paymentRequestDate && formatDate(order.paymentRequestDate)}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-right text-sm text-gray-500">
                        <p>Total: {formatCurrency(order.totalAmount)}</p>
                        <p>Commission: {formatCurrency(order.commission)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune commande trouvée</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal pour demande de paiement individuelle */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className={`max-w-2xl h-[90vh] flex flex-col transition-all duration-500 ease-out ${animateModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <DialogHeader className="space-y-4 pb-4 border-b border-[#ff6600] flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#ff6600]/20 rounded-full animate-pulse">
                <DollarSign className="w-6 h-6 text-[#ff6600]" />
              </div>
              <div>
                <DialogTitle className="text-xl text-[#ff6600] font-bold">Demande de Paiement Vendeur</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Remplissez les informations pour effectuer une demande de paiement
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className={`space-y-6 overflow-y-auto flex-1 pr-2 ${animateContent ? 'animate-in slide-in-from-bottom-4 duration-300' : ''}`}>
            {/* Informations de la commande et du client */}
            {selectedOrder && (
              <div className={`p-4 bg-gradient-to-r from-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-lg border border-[#3b82f6] ${animateContent ? 'animate-in slide-in-from-top-4 duration-300 delay-100' : ''}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <Package className="w-5 h-5 text-[#3b82f6]" />
                  <h3 className="font-semibold text-[#3b82f6]">Informations de la Commande</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Commande :</span>
                      <span className="font-bold text-[#3b82f6]">{selectedOrder.id}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Montant à recevoir :</span>
                      <span className="text-lg font-bold text-[#10b981]">
                        {formatCurrency(selectedOrder.netRevenue)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Client :</span>
                      <span className="font-semibold">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Email client :</span>
                      <span className="text-sm text-gray-600">{selectedOrder.customerEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

                          {/* Formulaire de paiement */}
              <div className={`space-y-4 ${animateContent ? 'animate-in slide-in-from-top-4 duration-300 delay-200' : ''}`}>
                <div className="flex items-center space-x-3 mb-4">
                  <UserCheck className="w-5 h-5 text-[#ff6600]" />
                  <h3 className="font-semibold text-[#ff6600]">Informations du Vendeur</h3>
                </div>

              {/* Recherche de vendeur */}
              <div className="space-y-2">
                <Label htmlFor="sellerSearch">Email/Nom du Vendeur *</Label>
                <Popover open={sellerSearchOpen} onOpenChange={setSellerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sellerSearchOpen}
                      className="w-full justify-between"
                    >
                      {paymentData.sellerEmail ? (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{paymentData.sellerEmail}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">{paymentData.sellerName}</span>
                        </div>
                      ) : (
                        "Rechercher un vendeur..."
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Tapez le nom ou l'email du vendeur..." 
                        value={sellerSearchValue}
                        onValueChange={setSellerSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>Aucun vendeur trouvé.</CommandEmpty>
                        <CommandGroup>
                          {filteredSellers.map((seller) => (
                            <CommandItem
                              key={seller.id}
                              value={`${seller.name} ${seller.email}`}
                              onSelect={() => handleSellerSelect(seller)}
                            >
                              <div className="flex items-center space-x-2 w-full">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {seller.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="font-medium">{seller.name}</div>
                                  <div className="text-sm text-gray-500">{seller.email}</div>
                                </div>
                                <Mail className="w-4 h-4 text-gray-400" />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <Separator />

                              <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="w-5 h-5 text-[#10b981]" />
                  <h3 className="font-semibold text-[#10b981]">Mode de Paiement</h3>
                </div>

              <div>
                <Label htmlFor="paymentMethod">Mode de paiement *</Label>
                <Select 
                  value={paymentData.paymentMethod} 
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un mode de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile_money">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile Money (via FeexPay)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_card">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Carte Bancaire (via FeexPay)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4" />
                        <span>Virement Bancaire</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentData.paymentMethod === 'mobile_money' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="phoneNumber">Numéro de téléphone *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Ex: +225 0701234567"
                    value={paymentData.phoneNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
              )}

              {paymentData.paymentMethod === 'bank_transfer' && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <Label htmlFor="bankName">Nom de la banque *</Label>
                    <Input
                      id="bankName"
                      placeholder="Ex: BICICI, SGB, NSIA..."
                      value={paymentData.bankName}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, bankName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Numéro de compte *</Label>
                    <Input
                      id="accountNumber"
                      placeholder="Numéro de compte bancaire"
                      value={paymentData.accountNumber}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informations supplémentaires pour l'administrateur..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-end space-x-2 pt-4 border-t border-[#ff6600] flex-shrink-0 bg-white">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentModal(false)}
              className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={handlePaymentRequestSubmit}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              disabled={!paymentData.paymentMethod || !paymentData.sellerEmail || !paymentData.sellerName || 
                       (paymentData.paymentMethod === 'mobile_money' && !paymentData.phoneNumber) ||
                       (paymentData.paymentMethod === 'bank_transfer' && (!paymentData.bankName || !paymentData.accountNumber))}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Envoyer la Demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour demande groupée */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="max-w-md border-[#10b981]">
          <DialogHeader>
            <DialogTitle className="text-[#10b981] font-bold">Demande de Paiement Groupée</DialogTitle>
            <DialogDescription className="text-gray-600">
              Confirmez la demande de paiement pour {selectedOrders.length} commandes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-[#10b981]/20 rounded-lg border border-[#10b981]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#10b981]">Montant total :</span>
                <span className="text-lg font-bold text-[#10b981]">
                  {formatCurrency(selectedAmount)}
                </span>
              </div>
              <p className="text-sm text-[#10b981] mt-1">
                {selectedOrders.length} commandes sélectionnées
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Commandes concernées :</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {deliveredOrders
                  .filter(order => selectedOrders.includes(order.id) && !order.isPaymentRequested)
                  .map(order => (
                    <div key={order.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>{order.id} - {order.customerName}</span>
                      <span className="font-medium">{formatCurrency(order.netRevenue)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkModal(false)}
              className="border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleBulkRequest}
              className="bg-[#10b981] hover:bg-[#10b981]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Confirmer la Demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour demande tous les paiements */}
      <Dialog open={showAllVendorsModal} onOpenChange={setShowAllVendorsModal}>
        <DialogContent className="max-w-lg border-[#8b5cf6]">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#8b5cf6]/20 rounded-full">
                <Users className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <DialogTitle className="text-[#8b5cf6] font-bold">Demande Tous les Paiements</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Effectuer une demande de paiement pour toutes les commandes disponibles
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-[#8b5cf6]/20 to-[#3b82f6]/20 rounded-lg border border-[#8b5cf6]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#8b5cf6]">Commandes disponibles :</span>
                <span className="text-lg font-bold text-[#8b5cf6]">
                  {availableForPayment.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#3b82f6]">Montant total :</span>
                <span className="text-xl font-bold text-[#3b82f6]">
                  {formatCurrency(totalAvailableAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Aperçu des commandes :</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {availableForPayment.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <span>{order.id} - {order.customerName}</span>
                    <span className="font-medium">{formatCurrency(order.netRevenue)}</span>
                  </div>
                ))}
                {availableForPayment.length > 5 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ... et {availableForPayment.length - 5} autres commandes
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#ff6600]/20 border border-[#ff6600] rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#ff6600] mt-0.5" />
                <div className="text-sm text-[#ff6600]">
                  <p className="font-medium">Attention :</p>
                  <p>Cette action enverra une demande de paiement pour toutes les commandes disponibles. Assurez-vous que toutes les informations sont correctes.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAllVendorsModal(false)}
              className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAllVendorsRequest}
              className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Confirmer Tous les Paiements
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
