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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'

import type { SellerProfile } from '@/lib/services/seller-dashboard-service'

interface DeliveredOrder {
  id: string
  displayId?: string
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

interface ScheduledPayment {
  id: string
  orderId?: string
  customerName: string
  amount: number
  dueDate: string
  priority: string
  status?: string
  notificationMethod?: string
  reminderFrequency?: string
}

interface PaymentRequestsSectionProps {
  deliveredOrders: DeliveredOrder[]
  sellerProfile: SellerProfile | null
  onPaymentRequest: (orderId: string, amount: number, paymentData: PaymentRequestData) => void
  onBulkPaymentRequest: (
    orders: DeliveredOrder[],
    payment?: {
      paymentMethod: 'mobile_money' | 'bank_transfer' | 'bank_card'
      mobileNumber?: string
      bankDetails?: { bankName?: string; accountNumber?: string; accountName?: string }
      notes?: string
      requestedAmount?: number | null
    }
  ) => void
}

export default function PaymentRequestsSection({
  deliveredOrders,
  sellerProfile,
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
  const [isLoading, setIsLoading] = useState(false)
  const [showPaymentScheduleModal, setShowPaymentScheduleModal] = useState(false)
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<ScheduledPayment | null>(null)
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([])
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [scheduleDueDate, setScheduleDueDate] = useState<string>('')
  const [scheduleDefaultDueDays, setScheduleDefaultDueDays] = useState<string>('7')
  const [schedulePriority, setSchedulePriority] = useState<string>('normal')
  const [scheduleNotificationMethod, setScheduleNotificationMethod] = useState<string>('email')
  const [scheduleReminderFrequency, setScheduleReminderFrequency] = useState<string>('weekly')

  const selectedOrdersForSchedule = deliveredOrders.filter((o) => selectedOrders.includes(o.id) && !o.isPaymentRequested)

  const renderScheduleStatusBadge = (status: unknown) => {
    const s = String(status ?? '').trim().toLowerCase()
    if (!s) {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">N/A</Badge>
    }
    if (s.includes('cancel')) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Annulé</Badge>
    }
    if (s.includes('paid') || s.includes('done') || s.includes('complete')) {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Payé</Badge>
    }
    if (s.includes('scheduled')) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Planifié</Badge>
    }
    if (s.includes('pending') || s.includes('wait')) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{String(status)}</Badge>
  }
  
  // État pour le formulaire de demande de paiement
  const [paymentData, setPaymentData] = useState<PaymentRequestData>({
    orderId: '',
    amount: 0,
    paymentMethod: 'mobile_money',
    accountNumber: '',
    accountName: '',
    bankName: '',
    phoneNumber: '',
    notes: '',
    sellerEmail: '',
    sellerName: ''
  })

  // État pour demande groupée (bulk) et demande "tous les paiements"
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<'mobile_money' | 'bank_transfer' | 'bank_card'>('mobile_money')
  const [bulkMobileNumber, setBulkMobileNumber] = useState<string>(sellerProfile?.phone ?? '')
  const [bulkBankName, setBulkBankName] = useState<string>('')
  const [bulkAccountNumber, setBulkAccountNumber] = useState<string>('')
  const [bulkAccountName, setBulkAccountName] = useState<string>('')
  const [bulkNotes, setBulkNotes] = useState<string>('')
  const [bulkRequestedAmount, setBulkRequestedAmount] = useState<number>(0)

  useEffect(() => {
    // Préremplir le numéro mobile si le profil vendeur est chargé plus tard.
    if (!bulkMobileNumber && sellerProfile?.phone) {
      setBulkMobileNumber(sellerProfile.phone)
    }
  }, [bulkMobileNumber, sellerProfile?.phone])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  /**
   * Retourne un identifiant lisible de commande pour l'UI.
   * Priorité: displayId (numéro humain) -> UUID court.
   */
  const getOrderLabel = (order: DeliveredOrder | null) => {
    if (!order) return ''
    const displayId = String(order.displayId ?? '').trim()
    if (displayId) {
      const lower = displayId.toLowerCase()
      if (lower.startsWith('commande')) return displayId
      if (displayId.startsWith('#')) return `Commande ${displayId}`
      return `Commande #${displayId}`
    }
    const id = String(order.id ?? '').trim()
    if (!id) return ''
    if (id.length <= 12) return id
    return `${id.slice(0, 8)}…${id.slice(-4)}`
  }

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const computeSelectedNetAmount = () => {
    return deliveredOrders
      .filter(order => selectedOrders.includes(order.id) && !order.isPaymentRequested)
      .reduce((sum, order) => sum + order.netRevenue, 0)
  }

  const computeAvailableNetAmount = () => {
    return deliveredOrders
      .filter(order => !order.isPaymentRequested)
      .reduce((sum, order) => sum + order.netRevenue, 0)
  }

  useEffect(() => {
    if (showBulkModal) {
      setBulkRequestedAmount(computeSelectedNetAmount())
    }
  }, [showBulkModal, deliveredOrders, selectedOrders])

  useEffect(() => {
    if (showAllVendorsModal) {
      setBulkRequestedAmount(computeAvailableNetAmount())
    }
  }, [showAllVendorsModal, deliveredOrders])

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

    /**
     * Construit le payload de paiement pour les demandes groupées.
     */
    const buildBulkPaymentPayload = () => {
      const paymentMethod = bulkPaymentMethod
      return {
        paymentMethod,
        mobileNumber: paymentMethod === 'mobile_money' ? (bulkMobileNumber || '') : undefined,
        bankDetails: paymentMethod === 'bank_transfer'
          ? {
              bankName: bulkBankName || '',
              accountNumber: bulkAccountNumber || '',
              accountName: bulkAccountName || ''
            }
          : undefined,
        notes: bulkNotes || undefined,
        requestedAmount: Number.isFinite(bulkRequestedAmount) && bulkRequestedAmount > 0 ? bulkRequestedAmount : null
      } as const
    }

    onBulkPaymentRequest(selectedOrderObjects, buildBulkPaymentPayload())
    setShowBulkModal(false)
    setSelectedOrders([])
  }

  const handlePaymentRequestClick = (order: DeliveredOrder) => {
    setSelectedOrder(order)
    setPaymentData({
      orderId: order.id,
      amount: order.netRevenue,
      paymentMethod: 'mobile_money',
      accountNumber: '',
      accountName: '',
      bankName: '',
      phoneNumber: sellerProfile?.phone ?? '',
      notes: order.notes ?? '',
      sellerEmail: sellerProfile?.email ?? '',
      sellerName: sellerProfile?.name ?? ''
    })
    setShowPaymentModal(true)
  }

  /**
   * Normalise une chaîne de statut (commande/paiement) pour simplifier l'affichage.
   */
  const normalizeStatus = (value: unknown) => {
    return String(value ?? '').trim().toLowerCase()
  }

  /**
   * Retourne un badge lisible pour le statut de commande.
   */
  const renderOrderStatusBadge = (status: unknown) => {
    const s = normalizeStatus(status)
    if (!s) return null

    if (s === 'cancelled' || s === 'canceled') {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Annulée
        </Badge>
      )
    }

    if (s === 'completed' || s === 'delivered' || s.includes('deliver') || s.includes('livr')) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Livrée
        </Badge>
      )
    }

    if (s === 'confirmed') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmée
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        {String(status)}
      </Badge>
    )
  }

  /**
   * Retourne un badge lisible pour le statut de paiement.
   */
  const renderPaymentStatusBadge = (paymentStatus: unknown) => {
    const s = normalizeStatus(paymentStatus)
    if (!s) return null

    if (s === 'paid' || s === 'approved' || s.includes('success') || s.includes('succeed') || s === 'completed') {
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Payée
        </Badge>
      )
    }

    if (s === 'pending' || s.includes('wait')) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      )
    }

    if (s === 'failed' || s === 'cancelled' || s === 'canceled') {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Échoué
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        {String(paymentStatus)}
      </Badge>
    )
  }

  const handlePaymentRequestSubmit = () => {
    if (selectedOrder && paymentData.paymentMethod) {
      const normalizedAmount = paymentData.amount > 0 ? paymentData.amount : selectedOrder.netRevenue
      const normalizedData = {
        ...paymentData,
        amount: normalizedAmount
      }

      onPaymentRequest(selectedOrder.id, normalizedAmount, normalizedData)
      setShowPaymentModal(false)
      setSelectedOrder(null)
      setPaymentData({
        orderId: '',
        amount: 0,
        paymentMethod: 'mobile_money',
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

  // Le vendeur est le compte connecté (source DB via sellerProfile).

  const handleAllVendorsRequest = () => {
    const availableOrders = deliveredOrders.filter(order => !order.isPaymentRequested)
    if (availableOrders.length > 0) {
      const paymentMethod = bulkPaymentMethod
      onBulkPaymentRequest(availableOrders, {
        paymentMethod,
        mobileNumber: paymentMethod === 'mobile_money' ? (bulkMobileNumber || '') : undefined,
        bankDetails: paymentMethod === 'bank_transfer'
          ? {
              bankName: bulkBankName || '',
              accountNumber: bulkAccountNumber || '',
              accountName: bulkAccountName || ''
            }
          : undefined,
        notes: bulkNotes || undefined,
        requestedAmount: Number.isFinite(bulkRequestedAmount) && bulkRequestedAmount > 0 ? bulkRequestedAmount : null
      })
    }
    setShowAllVendorsModal(false)
  }

  /**
   * Déclenche l'export du rapport (réutilise l'export existant).
   */
  const handleExportRevenueReport = async () => {
    setIsLoading(true)
    try {
      handleExport('csv')
    } finally {
      window.setTimeout(() => setIsLoading(false), 400)
    }
  }

  /**
   * Ouvre le modal de planification des paiements.
   */
  const handleOpenSchedulePayments = () => {
    setShowPaymentScheduleModal(true)
  }

  useEffect(() => {
    if (!showPaymentScheduleModal) return
    let cancelled = false
    setIsLoading(true)
    loadPaymentSchedules()
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Erreur inconnue.'
        toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [showPaymentScheduleModal])

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
      case 'excel': {
        const finalName = `demandes_paiement_${new Date().toISOString().split('T')[0]}.xlsx`
        buildExcelBlob(ordersToExport)
          .then((blob) => downloadBlob(blob, finalName))
          .catch((err) => {
            const message = err instanceof Error ? err.message : 'Erreur inconnue.'
            toast({ title: 'Erreur export Excel', description: message, variant: 'destructive' as any })
          })
        return
      }
      case 'pdf': {
        const finalName = `demandes_paiement_${new Date().toISOString().split('T')[0]}.pdf`
        buildPdfBlob(ordersToExport)
          .then((blob) => downloadBlob(blob, finalName))
          .catch((err) => {
            const message = err instanceof Error ? err.message : 'Erreur inconnue.'
            toast({ title: 'Erreur export PDF', description: message, variant: 'destructive' as any })
          })
        return
      }
    }
    
    // Télécharger le fichier
    downloadFile(exportData, fileName, mimeType)
  }

  // Génération de l'export CSV
  const generateCSVExport = (orders: DeliveredOrder[]) => {
    const headers = [
      'Numéro Commande',
      'Client',
      'Email',
      'Téléphone',
      'Adresse',
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
      getOrderLabel(order),
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

  /** Télécharge un Blob (Excel/PDF) côté navigateur. */
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /** Construit un export Excel (.xlsx) avec les commandes affichées. */
  const buildExcelBlob = async (orders: DeliveredOrder[]): Promise<Blob> => {
    const xlsx = await import('xlsx')

    const headers = [
      'Numéro Commande',
      'Client',
      'Email',
      'Téléphone',
      'Adresse',
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
      getOrderLabel(order),
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.shippingAddress,
      formatDate(order.orderDate),
      formatDate(order.deliveryDate),
      order.shippingMethod,
      order.trackingNumber,
      order.totalAmount,
      order.commission,
      order.netRevenue,
      order.isPaymentRequested ? 'Demandé' : 'Non demandé',
      order.paymentRequestDate ? formatDate(order.paymentRequestDate) : 'N/A',
      order.products.map(p => `${p.name} (x${p.quantity})`).join('; ')
    ])

    const ws = xlsx.utils.aoa_to_sheet([headers, ...rows])
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Demandes')

    const arrayBuffer = xlsx.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  /** Construit un export PDF (table) avec les commandes affichées. */
  const buildPdfBlob = async (orders: DeliveredOrder[]): Promise<Blob> => {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const nowLabel = new Date().toLocaleString('fr-FR')
    doc.setFontSize(14)
    doc.text('Rapport - Demandes de paiement (commandes éligibles)', 40, 40)
    doc.setFontSize(10)
    doc.text(`Généré le: ${nowLabel}`, 40, 58)

    const head = [[
      'Commande',
      'Client',
      'Total',
      'Commission',
      'Net',
      'Demande',
      'Date demande'
    ]]

    const body = orders.map((order) => [
      getOrderLabel(order),
      order.customerName,
      formatCurrency(order.totalAmount),
      formatCurrency(order.commission),
      formatCurrency(order.netRevenue),
      order.isPaymentRequested ? 'Demandé' : 'Non demandé',
      order.paymentRequestDate ? formatDate(order.paymentRequestDate) : 'N/A'
    ])

    const autoTable = (autoTableModule as any).default ?? (autoTableModule as any)
    autoTable(doc, {
      head,
      body,
      startY: 80,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [255, 102, 0] }
    })

    const arrayBuffer = doc.output('arraybuffer')
    return new Blob([arrayBuffer], { type: 'application/pdf' })
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
    const displayId = String(order.displayId ?? '').toLowerCase()
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (displayId ? displayId.includes(searchTerm.toLowerCase()) : false)
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
  const totalRevenueAll = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalCommissionsAll = deliveredOrders.reduce((sum, order) => sum + order.commission, 0)
  const pendingPaymentsAmount = deliveredOrders
    .filter(order => order.isPaymentRequested)
    .reduce((sum, order) => sum + order.netRevenue, 0)

  /** Ouvre le modal d'édition pour un paiement planifié. */
  const handleEditPayment = (payment: ScheduledPayment) => {
    setSelectedPayment({
      ...payment,
      notificationMethod: payment.notificationMethod ?? 'email',
      reminderFrequency: payment.reminderFrequency ?? 'weekly'
    })
    setShowEditPaymentModal(true)
  }

  /** Charge la planification depuis la base (vendeur connecté). */
  const loadPaymentSchedules = async () => {
    const response = await fetch('/api/finance/payment-schedules?mine=true')
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.error || 'Impossible de charger la planification.')
    }
    const data = await response.json().catch(() => [])
    const rows = Array.isArray(data) ? data : []
    setScheduledPayments(
      rows.map((r: any) => ({
        id: String(r?.id ?? ''),
        orderId: r?.orderId ? String(r.orderId) : undefined,
        customerName: String(r?.customerName ?? 'Client'),
        amount: Number(r?.amount ?? 0),
        dueDate: String(r?.dueDate ?? ''),
        priority: String(r?.priority ?? 'Normale'),
        status: r?.status ? String(r.status) : undefined,
        notificationMethod: r?.notificationMethod ? String(r.notificationMethod) : undefined,
        reminderFrequency: r?.reminderFrequency ? String(r.reminderFrequency) : undefined
      }))
    )
  }

  /** Sauvegarde une édition (PUT en base) et recharge la liste. */
  const handleSavePaymentEdit = async (payment: ScheduledPayment) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/finance/payment-schedules/${encodeURIComponent(String(payment.id))}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: payment.dueDate,
          priority: payment.priority,
          notificationMethod: payment.notificationMethod,
          reminderFrequency: payment.reminderFrequency
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Sauvegarde échouée.')
      }

      toast({ title: 'Sauvegardé', description: 'La planification a été mise à jour.' })
      setSelectedPayment(null)
      setShowEditPaymentModal(false)
      await loadPaymentSchedules()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    } finally {
      setIsLoading(false)
    }
  }

  /** Exporte la planification réelle (CSV) depuis l'API. */
  const handleExportPaymentSchedule = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/finance/payment-schedules/export?mine=true&format=csv')
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || "Impossible d'exporter la planification.")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `planification_paiements_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    } finally {
      setIsLoading(false)
    }
  }

  /** Confirme la planification réelle: crée des schedules en DB pour les commandes sélectionnées (mode B). */
  const handleConfirmPaymentSchedule = async () => {
    setIsLoading(true)
    try {
      if (selectedOrders.length === 0) {
        throw new Error('Sélectionnez au moins une commande à planifier.')
      }

      const resolvedDueDate = (() => {
        if (scheduleDueDate) return scheduleDueDate
        const days = Number(scheduleDefaultDueDays)
        if (!Number.isFinite(days) || days <= 0) return ''
        const d = new Date()
        d.setDate(d.getDate() + days)
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      })()

      if (!resolvedDueDate) {
        throw new Error("Sélectionnez une date d'échéance.")
      }

      const response = await fetch('/api/finance/payment-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrders,
          dueDate: resolvedDueDate,
          priority: schedulePriority,
          notificationMethod: scheduleNotificationMethod,
          reminderFrequency: scheduleReminderFrequency
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || 'Planification échouée.')
      }

      toast({
        title: 'Planification enregistrée',
        description: `${selectedOrders.length} commande(s) planifiée(s).`
      })

      await loadPaymentSchedules()
      setShowPaymentScheduleModal(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.'
      toast({ title: 'Erreur', description: message, variant: 'destructive' as any })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#10b981]/20 to-[#10b981]/30 border-[#10b981] shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#10b981]">Commandes Éligibles</p>
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
                <p className="text-sm font-medium text-[#3b82f6]">Disponibles pour Demande</p>
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
                <p className="text-sm font-medium text-[#8b5cf6]">Net Disponible</p>
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
                <p className="text-sm font-medium text-[#ff6600]">Demandes en Cours</p>
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
                Gérez les demandes de paiement pour vos commandes éligibles (net disponible)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => {
                  setShowAllVendorsModal(true)
                }}
                className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Users className="w-4 h-4 mr-2" />
                Demander un Paiement (Tout)
              </Button>
              {selectedOrders.length > 0 && (
                <Button 
                  onClick={() => setShowBulkModal(true)}
                  className="bg-[#10b981] hover:bg-[#10b981]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Demande Groupée ({selectedOrders.length})
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleExportRevenueReport}
                disabled={isLoading}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Export en cours...' : 'Exporter Rapport'}
              </Button>
              <Button 
                variant="outline"
                onClick={handleOpenSchedulePayments}
                className="border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Planifier Paiement
              </Button>
              <div className="relative">
                <Button 
                  variant="outline" 
                  onClick={() => setExportMenuOpen((prev) => !prev)}
                  className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                {exportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleExport('csv')
                          setExportMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📊 Export CSV
                      </button>
                      <button
                        onClick={() => {
                          handleExport('excel')
                          setExportMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📈 Export Excel
                      </button>
                      <button
                        onClick={() => {
                          handleExport('pdf')
                          setExportMenuOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        📄 Export PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ff6600] w-4 h-4" />
              <Input 
                placeholder="Rechercher par client ou numéro de commande (éligibles)..." 
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
                <SelectItem value="all">Toutes les commandes éligibles</SelectItem>
                <SelectItem value="not-requested">Demande non envoyée</SelectItem>
                <SelectItem value="requested">Demande envoyée</SelectItem>
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
                            <h3 className="font-semibold text-lg">{getOrderLabel(order)}</h3>
                            {renderOrderStatusBadge(order.status)}
                            {renderPaymentStatusBadge(order.paymentStatus)}
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
                      <span className="font-bold text-[#3b82f6]">{getOrderLabel(selectedOrder)}</span>
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

              {/* Vendeur connecté (source DB) */}
              <div className="space-y-2">
                <Label htmlFor="sellerProfile">Email/Nom du Vendeur</Label>
                <div className="w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-700">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{sellerProfile?.email || paymentData.sellerEmail || '-'}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{sellerProfile?.name || paymentData.sellerName || 'Vendeur'}</span>
                  </div>
                </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${animateContent ? 'animate-in slide-in-from-top-4 duration-300 delay-250' : ''}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requestAmount">Montant à demander *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        const maxAllowed = Number(selectedOrder?.netRevenue ?? 0)
                        setPaymentData(prev => ({
                          ...prev,
                          amount: Number.isFinite(maxAllowed) && maxAllowed > 0 ? maxAllowed : prev.amount
                        }))
                      }}
                    >
                      100% du net
                    </Button>
                  </div>
                  <Input
                    id="requestAmount"
                    type="number"
                    min={0}
                    max={selectedOrder?.netRevenue ?? undefined}
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(',', '.')
                      const parsedValue = Number(rawValue)

                      const maxAllowed = Number(selectedOrder?.netRevenue ?? NaN)
                      const hasMax = Number.isFinite(maxAllowed) && maxAllowed > 0
                      const nextAmount = Number.isNaN(parsedValue) ? paymentData.amount : parsedValue

                      if (hasMax && Number.isFinite(nextAmount) && nextAmount > maxAllowed) {
                        toast({
                          title: 'Montant invalide',
                          description: 'Le montant demandé ne peut pas dépasser le revenu net disponible.',
                          variant: 'destructive' as any
                        })
                      }

                      setPaymentData(prev => ({
                        ...prev,
                        amount: hasMax && Number.isFinite(nextAmount) ? Math.min(nextAmount, maxAllowed) : nextAmount
                      }))
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Prérempli avec le revenu net de la commande. Max: {formatCurrency(selectedOrder?.netRevenue ?? 0)}.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations supplémentaires pour l'administrateur..."
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    Prérempli avec vos notes internes de commande lorsqu'elles sont disponibles.
                  </p>
                </div>
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
              disabled={!paymentData.paymentMethod || (paymentData.paymentMethod === 'mobile_money' && !paymentData.phoneNumber) ||
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-[#10b981]">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkRequestedAmount">Montant à demander *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const maxAllowed = Number(selectedAmount ?? 0)
                    setBulkRequestedAmount(Number.isFinite(maxAllowed) && maxAllowed > 0 ? maxAllowed : bulkRequestedAmount)
                  }}
                >
                  100% du net
                </Button>
              </div>
              <Input
                id="bulkRequestedAmount"
                type="number"
                min={0}
                max={selectedAmount}
                step="0.01"
                value={bulkRequestedAmount}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(',', '.')
                  const parsedValue = Number(rawValue)
                  const maxAllowed = Number(selectedAmount ?? NaN)
                  const hasMax = Number.isFinite(maxAllowed) && maxAllowed > 0
                  const nextAmount = Number.isNaN(parsedValue) ? bulkRequestedAmount : parsedValue

                  if (hasMax && Number.isFinite(nextAmount) && nextAmount > maxAllowed) {
                    toast({
                      title: 'Montant invalide',
                      description: 'Le montant demandé ne peut pas dépasser le revenu net disponible.',
                      variant: 'destructive' as any
                    })
                  }

                  setBulkRequestedAmount(hasMax && Number.isFinite(nextAmount) ? Math.min(nextAmount, maxAllowed) : nextAmount)
                }}
              />
              <p className="text-xs text-gray-500">Prérempli avec le net total sélectionné. Max: {formatCurrency(selectedAmount)}.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Commandes concernées :</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {deliveredOrders
                  .filter(order => selectedOrders.includes(order.id) && !order.isPaymentRequested)
                  .map(order => (
                    <div key={order.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>{getOrderLabel(order)} - {order.customerName}</span>
                      <span className="font-medium">{formatCurrency(order.netRevenue)}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="bulkPaymentMethod">Mode de paiement *</Label>
              <Select value={bulkPaymentMethod} onValueChange={(v) => setBulkPaymentMethod(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_card">Carte Bancaire</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkPaymentMethod === 'mobile_money' && (
              <div className="space-y-2">
                <Label htmlFor="bulkMobileNumber">Numéro Mobile Money *</Label>
                <Input
                  id="bulkMobileNumber"
                  value={bulkMobileNumber}
                  onChange={(e) => setBulkMobileNumber(e.target.value)}
                  placeholder="Ex: +2250700000000"
                />
              </div>
            )}

            {bulkPaymentMethod === 'bank_transfer' && (
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="bulkBankName">Nom de la banque *</Label>
                  <Input
                    id="bulkBankName"
                    value={bulkBankName}
                    onChange={(e) => setBulkBankName(e.target.value)}
                    placeholder="Ex: BICICI, SGB, NSIA..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkAccountNumber">Numéro de compte *</Label>
                  <Input
                    id="bulkAccountNumber"
                    value={bulkAccountNumber}
                    onChange={(e) => setBulkAccountNumber(e.target.value)}
                    placeholder="Numéro de compte bancaire"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulkAccountName">Nom du titulaire</Label>
                  <Input
                    id="bulkAccountName"
                    value={bulkAccountName}
                    onChange={(e) => setBulkAccountName(e.target.value)}
                    placeholder="Nom du titulaire"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bulkNotes">Notes (optionnel)</Label>
              <Textarea
                id="bulkNotes"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Informations supplémentaires pour l'administrateur..."
                rows={3}
              />
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
              disabled={
                !Number.isFinite(bulkRequestedAmount) || bulkRequestedAmount <= 0 ||
                (bulkPaymentMethod === 'mobile_money'
                  ? !bulkMobileNumber
                  : bulkPaymentMethod === 'bank_transfer'
                    ? !bulkBankName || !bulkAccountNumber
                    : false)
              }
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Confirmer la Demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour demande tous les paiements */}
      <Dialog open={showAllVendorsModal} onOpenChange={setShowAllVendorsModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-[#8b5cf6]">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#8b5cf6]/20 rounded-full">
                <Users className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <DialogTitle className="text-[#8b5cf6] font-bold">Demande Tous les Paiements</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Effectuer une demande de paiement pour toutes les commandes éligibles disponibles
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            {availableForPayment.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Aucune commande éligible n'est disponible pour le moment.
              </div>
            )}
            <div className="p-4 bg-gradient-to-r from-[#8b5cf6]/20 to-[#3b82f6]/20 rounded-lg border border-[#8b5cf6]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#8b5cf6]">Commandes éligibles disponibles :</span>
                <span className="text-lg font-bold text-[#8b5cf6]">
                  {availableForPayment.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#3b82f6]">Net disponible :</span>
                <span className="text-xl font-bold text-[#3b82f6]">
                  {formatCurrency(totalAvailableAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allRequestedAmount">Montant à demander *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const maxAllowed = Number(totalAvailableAmount ?? 0)
                    setBulkRequestedAmount(Number.isFinite(maxAllowed) && maxAllowed > 0 ? maxAllowed : bulkRequestedAmount)
                  }}
                >
                  100% du net
                </Button>
              </div>
              <Input
                id="allRequestedAmount"
                type="number"
                min={0}
                max={totalAvailableAmount}
                step="0.01"
                value={bulkRequestedAmount}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(',', '.')
                  const parsedValue = Number(rawValue)
                  const maxAllowed = Number(totalAvailableAmount ?? NaN)
                  const hasMax = Number.isFinite(maxAllowed) && maxAllowed > 0
                  const nextAmount = Number.isNaN(parsedValue) ? bulkRequestedAmount : parsedValue

                  if (hasMax && Number.isFinite(nextAmount) && nextAmount > maxAllowed) {
                    toast({
                      title: 'Montant invalide',
                      description: 'Le montant demandé ne peut pas dépasser le revenu net disponible.',
                      variant: 'destructive' as any
                    })
                  }

                  setBulkRequestedAmount(hasMax && Number.isFinite(nextAmount) ? Math.min(nextAmount, maxAllowed) : nextAmount)
                }}
              />
              <p className="text-xs text-gray-500">Prérempli avec le net disponible. Max: {formatCurrency(totalAvailableAmount)}.</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Aperçu des revenus :</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Chiffre d'affaires total</span>
                  <span className="font-medium">{formatCurrency(totalRevenueAll)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Revenu net disponible</span>
                  <span className="font-medium">{formatCurrency(totalAvailableAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Commissions</span>
                  <span className="font-medium">{formatCurrency(totalCommissionsAll)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Paiements en attente</span>
                  <span className="font-medium">{formatCurrency(pendingPaymentsAmount)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#ff6600]/20 border border-[#ff6600] rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#ff6600] mt-0.5" />
                <div className="text-sm text-[#ff6600]">
                  <p className="font-medium">Information :</p>
                  <p>Cette action enverra une demande de paiement pour toutes vos commandes éligibles disponible.</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="allPaymentMethod">Mode de paiement *</Label>
              <Select value={bulkPaymentMethod} onValueChange={(v) => setBulkPaymentMethod(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_card">Carte Bancaire</SelectItem>
                  <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkPaymentMethod === 'mobile_money' && (
              <div className="space-y-2">
                <Label htmlFor="allMobileNumber">Numéro Mobile Money *</Label>
                <Input
                  id="allMobileNumber"
                  value={bulkMobileNumber}
                  onChange={(e) => setBulkMobileNumber(e.target.value)}
                  placeholder="Ex: +2250700000000"
                />
              </div>
            )}

            {bulkPaymentMethod === 'bank_transfer' && (
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="allBankName">Nom de la banque *</Label>
                  <Input
                    id="allBankName"
                    value={bulkBankName}
                    onChange={(e) => setBulkBankName(e.target.value)}
                    placeholder="Ex: BICICI, SGB, NSIA..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allAccountNumber">Numéro de compte *</Label>
                  <Input
                    id="allAccountNumber"
                    value={bulkAccountNumber}
                    onChange={(e) => setBulkAccountNumber(e.target.value)}
                    placeholder="Numéro de compte bancaire"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allAccountName">Nom du titulaire</Label>
                  <Input
                    id="allAccountName"
                    value={bulkAccountName}
                    onChange={(e) => setBulkAccountName(e.target.value)}
                    placeholder="Nom du titulaire"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="allNotes">Notes (optionnel)</Label>
              <Textarea
                id="allNotes"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                placeholder="Informations supplémentaires pour l'administrateur..."
                rows={3}
              />
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
              onClick={() => {
                handleAllVendorsRequest()
                setShowAllVendorsModal(false)
              }}
              disabled={
                availableForPayment.length === 0 ||
                !Number.isFinite(bulkRequestedAmount) || bulkRequestedAmount <= 0 ||
                (bulkPaymentMethod === 'mobile_money'
                  ? !bulkMobileNumber
                  : bulkPaymentMethod === 'bank_transfer'
                    ? !bulkBankName || !bulkAccountNumber
                    : false)
              }
              className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Confirmer la Demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Planification des Paiements */}
      <Dialog open={showPaymentScheduleModal} onOpenChange={setShowPaymentScheduleModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Planification des Paiements</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Planifiez et gérez vos paiements à venir avec des échéances et priorités
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Aperçu des Paiements Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{formatCurrency(pendingPaymentsAmount)}</div>
                    <div className="text-sm text-purple-600">Montant en attente</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{availableForPayment.length}</div>
                    <div className="text-sm text-blue-600">Commandes livrées</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAvailableAmount)}</div>
                    <div className="text-sm text-green-600">Revenu net disponible</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800">Commandes sélectionnées</CardTitle>
                <CardDescription>
                  {selectedOrders.length === 0
                    ? "Aucune commande n'est sélectionnée. Cochez des commandes dans la liste avant de planifier."
                    : `${selectedOrders.length} commande(s) sélectionnée(s) pour planification.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedOrders.length === 0 ? null : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedOrdersForSchedule.slice(0, 6).map((o) => (
                        <div key={o.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <span>{getOrderLabel(o)} - {o.customerName}</span>
                          <span className="font-medium">{formatCurrency(o.netRevenue)}</span>
                        </div>
                      ))}
                    </div>
                    {selectedOrdersForSchedule.length > 6 && (
                      <div className="text-xs text-gray-500">+ {selectedOrdersForSchedule.length - 6} autre(s) commande(s)</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paiements à Planifier</CardTitle>
                <CardDescription>Gérez les échéances et priorités de vos paiements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                    <div>Client</div>
                    <div>Montant</div>
                    <div>Date d'échéance</div>
                    <div>Priorité</div>
                    <div>Statut</div>
                    <div>Actions</div>
                  </div>
                  
                  <div className="space-y-3">
                    {scheduledPayments.length === 0 ? (
                      <div className="text-sm text-gray-500">Aucun paiement planifié pour le moment.</div>
                    ) : (
                      scheduledPayments.map((p) => (
                        <div key={p.id} className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                          <div className="font-medium">{p.customerName}</div>
                          <div className="font-bold text-green-600">{formatCurrency(p.amount)}</div>
                          <div className="text-sm text-gray-600">
                            {p.dueDate ? new Date(p.dueDate).toLocaleDateString('fr-FR') : ''}
                          </div>
                          <div>
                            <Badge className={
                              String(p.priority).toLowerCase().includes('haute')
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }>
                              {p.priority}
                            </Badge>
                          </div>
                          <div>
                            {renderScheduleStatusBadge(p.status)}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => handleEditPayment(p)}
                            >
                              <Calendar className="w-3 h-3 mr-1" />
                              Modifier
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Options de Planification</CardTitle>
                <CardDescription>Personnalisez vos paramètres de planification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence de rappel</label>
                      <Select value={scheduleReminderFrequency} onValueChange={setScheduleReminderFrequency}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner la fréquence" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de notification</label>
                      <Select value={scheduleNotificationMethod} onValueChange={setScheduleNotificationMethod}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner la méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="push">Notification push</SelectItem>
                          <SelectItem value="all">Toutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Délai d'échéance par défaut</label>
                      <Select
                        value={scheduleDefaultDueDays}
                        onValueChange={setScheduleDefaultDueDays}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner le délai" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 jours</SelectItem>
                          <SelectItem value="7">7 jours</SelectItem>
                          <SelectItem value="14">14 jours</SelectItem>
                          <SelectItem value="30">30 jours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priorité par défaut</label>
                      <Select value={schedulePriority} onValueChange={setSchedulePriority}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner la priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
                  <input
                    type="date"
                    value={scheduleDueDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setScheduleDueDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={handleExportPaymentSchedule}
                disabled={isLoading}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Export...' : 'Exporter Planification'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPaymentScheduleModal(false)}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </Button>
            </div>
            <Button 
              onClick={handleConfirmPaymentSchedule}
              disabled={
                isLoading ||
                selectedOrders.length === 0 ||
                (!scheduleDueDate && (!Number.isFinite(Number(scheduleDefaultDueDays)) || Number(scheduleDefaultDueDays) <= 0))
              }
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Planification...' : 'Confirmer Planification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition des paiements */}
      <Dialog open={showEditPaymentModal} onOpenChange={setShowEditPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Modifier le Paiement</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Modifiez la date d'échéance et la priorité du paiement
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Client :</span>
                      <span className="font-medium">{selectedPayment.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Montant :</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">ID Paiement :</span>
                      <span className="font-mono text-sm">{selectedPayment.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
                  <input
                    type="date"
                    value={selectedPayment.dueDate}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setSelectedPayment({
                      ...selectedPayment,
                      dueDate: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <Select 
                    value={selectedPayment.priority} 
                    onValueChange={(value) => setSelectedPayment({
                      ...selectedPayment,
                      priority: value
                    })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner la priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basse">Basse</SelectItem>
                      <SelectItem value="Normale">Normale</SelectItem>
                      <SelectItem value="Haute">Haute</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de notification</label>
                  <Select
                    value={selectedPayment.notificationMethod ?? 'email'}
                    onValueChange={(value) => setSelectedPayment({
                      ...selectedPayment,
                      notificationMethod: value
                    })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner la méthode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Notification push</SelectItem>
                      <SelectItem value="all">Toutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rappel avant échéance</label>
                  <Select
                    value={selectedPayment.reminderFrequency ?? 'weekly'}
                    onValueChange={(value) => setSelectedPayment({
                      ...selectedPayment,
                      reminderFrequency: value
                    })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner le délai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowEditPaymentModal(false)}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => selectedPayment && handleSavePaymentEdit(selectedPayment)}
              disabled={isLoading || !selectedPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
