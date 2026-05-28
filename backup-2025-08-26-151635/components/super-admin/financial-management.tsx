"use client"

import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, CreditCard, Wallet, Banknote,
  BarChart3, Download, RefreshCw, Eye, Settings,
  Users, Package, ShoppingCart, Star, Globe, PieChart,
  FileText, FileDown, Calendar, Filter, Search,
  CheckCircle, AlertTriangle, XCircle, Edit, Trash2,
  Smartphone, Mail, Clock, Plus
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
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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
  const [showEditPaymentRequestModal, setShowEditPaymentRequestModal] = useState(false)
  const [editingPaymentRequest, setEditingPaymentRequest] = useState<PaymentRequest | null>(null)
  
  // États pour les retraits de points
  const [pointsWithdrawals, setPointsWithdrawals] = useState<PointsWithdrawal[]>([])
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<PointsWithdrawal | null>(null)
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)
  
  // États pour l'historique et les détails
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedWithdrawalForDetails, setSelectedWithdrawalForDetails] = useState<PointsWithdrawal | null>(null)
  
  // États pour la configuration des points
  const [pointsConfig, setPointsConfig] = useState({
    pointValue: 0.01, // 1 point = 0.01 FCFA
    transferFees: 100, // Frais de transfert en FCFA
    purchaseValue: 0.01, // Valeur pour achats sur le site
    withdrawalValue: 0.01, // Valeur pour retraits
    socialShareValue: 5, // Points par partage sur réseaux sociaux
    minWithdrawal: 1000, // Seuil minimum de retrait
    maxWithdrawal: 100000, // Seuil maximum de retrait
    
    // Nouvelles règles de gain configurables
    basePointsPerFCFA: 1, // Points de base par FCFA dépensé
    premiumVendorBonus: 20, // Bonus en % pour vendeurs premium
    referralBonus: 10, // Bonus en % pour parrainage
    firstPurchaseBonus: 50, // Points bonus pour premier achat
    weekendBonus: 15, // Bonus en % pour achats en weekend
    bulkPurchaseBonus: 25, // Bonus en % pour achats groupés (seuil: 50000 FCFA)
    bulkPurchaseThreshold: 50000, // Seuil pour bonus achats groupés
    categoryBonuses: {
      electronics: 30, // Bonus électronique
      clothing: 20, // Bonus vêtements
      food: 15, // Bonus alimentation
      beauty: 25, // Bonus beauté
      sports: 20, // Bonus sports
      books: 10, // Bonus livres
      home: 15 // Bonus maison
    }
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
    // Générer des données variées avec des variations aléatoires
    const baseRevenue = 1900000 + Math.floor(Math.random() * 500000)
    const baseCommission = Math.round(baseRevenue * 0.1) // 10% de commission
    const basePoints = 50000 + Math.floor(Math.random() * 50000)
    
    // Données simulées pour les demandes de paiement
    const mockPaymentRequests: PaymentRequest[] = [
      {
        id: 'pr1',
        vendorId: 'v1',
        vendorName: 'TechStore Pro',
        orderIds: ['1', '3'],
        totalAmount: baseRevenue,
        commissionAmount: baseCommission,
        netAmount: baseRevenue - baseCommission,
        status: 'pending',
        paymentMethod: 'bank_transfer',
        bankDetails: 'BOA CI - FR123456789',
        createdAt: new Date(Date.now() - Math.random() * 86400000).toLocaleString() // Date aléatoire dans les dernières 24h
      },
      {
        id: 'pr2',
        vendorId: 'v2',
        vendorName: 'Electronics Plus',
        orderIds: ['2'],
        totalAmount: 750000 + Math.floor(Math.random() * 200000),
        commissionAmount: 90000 + Math.floor(Math.random() * 20000),
        netAmount: 660000 + Math.floor(Math.random() * 150000),
        status: 'approved',
        paymentMethod: 'mobile_money',
        mobileNumber: '+225 05678901',
        createdAt: new Date(Date.now() - Math.random() * 86400000).toLocaleString(),
        processedAt: new Date().toLocaleString()
      }
    ]

    // Données simulées pour les retraits de points
    const mockPointsWithdrawals: PointsWithdrawal[] = [
      {
        id: 'pw1',
        userId: 'u1',
        userName: 'Jean Dupont',
        pointsAmount: basePoints,
        fcfAmount: basePoints * 0.01, // Conversion 1 point = 0.01 FCFA
        status: 'pending',
        withdrawalMethod: 'mobile_money',
        mobileNumber: '+225 01234567',
        createdAt: new Date(Date.now() - Math.random() * 86400000).toLocaleString()
      },
      {
        id: 'pw2',
        userId: 'u2',
        userName: 'Marie Martin',
        pointsAmount: 100000 + Math.floor(Math.random() * 50000),
        fcfAmount: (100000 + Math.floor(Math.random() * 50000)) * 0.01,
        status: 'approved',
        withdrawalMethod: 'bank_transfer',
        bankDetails: 'SGB CI - FR987654321',
        createdAt: new Date(Date.now() - Math.random() * 86400000).toLocaleString(),
        processedAt: new Date().toLocaleString()
      }
    ]

    // Mettre à jour les données
    setPaymentRequests(mockPaymentRequests)
    setPointsWithdrawals(mockPointsWithdrawals)

    // Calculer et mettre à jour les statistiques dynamiquement
    const totalRevenue = mockPaymentRequests.reduce((sum, request) => sum + request.totalAmount, 0)
    const totalCommission = mockPaymentRequests.reduce((sum, request) => sum + request.commissionAmount, 0)
    const pendingWithdrawals = mockPointsWithdrawals
      .filter(withdrawal => withdrawal.status === 'pending')
      .reduce((sum, withdrawal) => sum + withdrawal.fcfAmount, 0)
    
    // Calculer le total des points en circulation avec variation réaliste
    const baseTotalPoints = 45600000
    const pointsVariation = Math.floor(Math.random() * 2000000) - 1000000 // Variation de ±1M points
    const totalPoints = Math.max(0, baseTotalPoints + pointsVariation)
    
    // Calculer la croissance mensuelle avec variation réaliste
    const baseGrowth = 12.5
    const growthVariation = (Math.random() - 0.5) * 2 // Variation de ±1%
    const monthlyGrowth = Math.max(0, Math.min(25, baseGrowth + growthVariation))
    
    // Calculer la valeur moyenne des commandes
    const averageOrderValue = totalRevenue > 0 ? Math.round(totalRevenue / mockPaymentRequests.length) : 85000
    
    // Mettre à jour les statistiques
    setStats(prevStats => ({
      ...prevStats,
      totalRevenue,
      totalCommission,
      totalPoints,
      pendingWithdrawals,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10, // Arrondir à 1 décimale
      averageOrderValue
    }))

    // Log de la mise à jour des données
    console.log('🔄 Données financières rechargées:', {
      timestamp: new Date().toISOString(),
      totalPaymentRequests: mockPaymentRequests.length,
      totalWithdrawals: mockPointsWithdrawals.length,
      newStats: {
        totalRevenue,
        totalCommission,
        totalPoints,
        pendingWithdrawals
      }
    })
  }

  // Fonctions de gestion des demandes de paiement
  const handlePaymentRequestApproval = async (requestId: string, approved: boolean) => {
    try {
      addNotification({
        type: 'info',
        title: 'Traitement en cours...',
        message: approved ? 'Approbation de la demande de paiement...' : 'Rejet de la demande de paiement...',
        duration: 3000
      })

      // Simulation de traitement backend
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mettre à jour le statut localement
      setPaymentRequests(paymentRequests.map(request =>
        request.id === requestId ? { 
          ...request, 
          status: approved ? 'approved' : 'rejected',
          processedAt: new Date().toLocaleString()
        } : request
      ))

      // Log de l'action
      console.log(`💰 Demande de paiement ${approved ? 'approuvée' : 'rejetée'}:`, {
        requestId,
        action: approved ? 'approval' : 'rejection',
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      // Notification de succès
      addNotification({
        type: approved ? 'success' : 'warning',
        title: approved ? 'Demande Approuvée' : 'Demande Rejetée',
        message: approved ? 
          'La demande de paiement a été approuvée et le virement sera effectué dans les 24h.' : 
          'La demande de paiement a été rejetée et le vendeur sera notifié.',
        duration: 5000
      })

      // Si approuvée, simuler l'envoi de notification au vendeur
      if (approved) {
        const request = paymentRequests.find(r => r.id === requestId)
        if (request) {
          console.log(`📧 Notification envoyée au vendeur ${request.vendorName}:`, {
            message: `Votre demande de paiement de ${formatPrice(request.netAmount, defaultCurrency)} a été approuvée.`,
            amount: request.netAmount,
            method: request.paymentMethod
          })
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de traitement',
        message: 'Une erreur est survenue lors du traitement de la demande.',
        duration: 5000
      })
    }
  }

  const handlePaymentRequestRejection = async (requestId: string, reason: string) => {
    try {
      if (!reason.trim()) {
        addNotification({
          type: 'error',
          title: 'Motif requis',
          message: 'Veuillez saisir un motif de rejet.',
          duration: 4000
        })
        return
      }

      addNotification({
        type: 'info',
        title: 'Rejet en cours...',
        message: 'Traitement du rejet de la demande de paiement...',
        duration: 3000
      })

      // Simulation de traitement backend
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mettre à jour le statut localement
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

      // Log de l'action
      console.log(`❌ Demande de paiement rejetée:`, {
        requestId,
        reason,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      // Notification de succès
      addNotification({
        type: 'warning',
        title: 'Demande Rejetée',
        message: `La demande de paiement a été rejetée avec le motif: "${reason}". Le vendeur sera notifié.`,
        duration: 5000
      })

      // Simuler l'envoi de notification au vendeur
      const request = paymentRequests.find(r => r.id === requestId)
      if (request) {
        console.log(`📧 Notification de rejet envoyée au vendeur ${request.vendorName}:`, {
          message: `Votre demande de paiement de ${formatPrice(request.netAmount, defaultCurrency)} a été rejetée.`,
          reason: reason,
          amount: request.netAmount
        })
      }
      
      setIsRejectionModalOpen(false)
      setRejectionReason('')
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de rejet',
        message: 'Une erreur est survenue lors du rejet de la demande.',
        duration: 5000
      })
    }
  }

  const handlePaymentRequestDeletion = async (requestId: string) => {
    try {
      addNotification({
        type: 'info',
        title: 'Suppression en cours...',
        message: 'Suppression de la demande de paiement...',
        duration: 3000
      })

      // Simulation de traitement backend
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Récupérer les informations de la demande avant suppression
      const requestToDelete = paymentRequests.find(r => r.id === requestId)
      
      // Supprimer la demande de la liste
      setPaymentRequests(paymentRequests.filter(request => request.id !== requestId))

      // Log de l'action
      console.log(`🗑️ Demande de paiement supprimée:`, {
        requestId,
        vendorName: requestToDelete?.vendorName,
        amount: requestToDelete?.netAmount,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      // Notification de succès
      addNotification({
        type: 'success',
        title: 'Demande Supprimée',
        message: `La demande de paiement de ${requestToDelete?.vendorName} (${formatPrice(requestToDelete?.netAmount || 0, defaultCurrency)}) a été supprimée définitivement.`,
        duration: 5000
      })

      // Simuler l'envoi de notification au vendeur
      if (requestToDelete) {
        console.log(`📧 Notification de suppression envoyée au vendeur ${requestToDelete.vendorName}:`, {
          message: `Votre demande de paiement de ${formatPrice(requestToDelete.netAmount, defaultCurrency)} a été supprimée par l'administration.`,
          amount: requestToDelete.netAmount,
          action: 'deletion'
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de suppression',
        message: 'Une erreur est survenue lors de la suppression de la demande.',
        duration: 5000
      })
    }
  }

  const handlePaymentRequestEdit = async (requestId: string) => {
    try {
      const request = paymentRequests.find(r => r.id === requestId)
      if (!request) {
        addNotification({
          type: 'error',
          title: 'Demande introuvable',
          message: 'La demande de paiement spécifiée n\'existe pas.',
          duration: 4000
        })
        return
      }

      // Préparer les données d'édition
      setEditingPaymentRequest({ ...request })
      setShowEditPaymentRequestModal(true)

      // Log de l'action
      console.log(`✏️ Édition de demande de paiement:`, {
        requestId,
        vendorName: request.vendorName,
        amount: request.netAmount,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'édition',
        message: 'Une erreur est survenue lors de l\'ouverture de l\'éditeur.',
        duration: 5000
      })
    }
  }

  const handleSavePaymentRequestEdit = async () => {
    try {
      if (!editingPaymentRequest) return

      addNotification({
        type: 'info',
        title: 'Sauvegarde en cours...',
        message: 'Enregistrement des modifications...',
        duration: 3000
      })

      // Simulation de sauvegarde backend
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mettre à jour la demande dans la liste
      setPaymentRequests(paymentRequests.map(request =>
        request.id === editingPaymentRequest.id ? editingPaymentRequest : request
      ))

      // Log de la sauvegarde
      console.log(`💾 Demande de paiement modifiée:`, {
        requestId: editingPaymentRequest.id,
        vendorName: editingPaymentRequest.vendorName,
        changes: editingPaymentRequest,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      // Notification de succès
      addNotification({
        type: 'success',
        title: 'Modifications sauvegardées',
        message: `La demande de paiement de ${editingPaymentRequest.vendorName} a été modifiée avec succès.`,
        duration: 5000
      })

      // Fermer le modal
      setShowEditPaymentRequestModal(false)
      setEditingPaymentRequest(null)

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde des modifications.',
        duration: 5000
      })
    }
  }

  const handleCancelPaymentRequestEdit = () => {
    setShowEditPaymentRequestModal(false)
    setEditingPaymentRequest(null)
  }

  // Fonctions pour la gestion des points de fidélité
  const handleSavePointsConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Sauvegarde en cours...',
        message: 'Enregistrement de la configuration des points de fidélité...',
        duration: 3000
      })

      // Simulation de sauvegarde backend
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log de la sauvegarde
      console.log(`💾 Configuration des points sauvegardée:`, {
        config: pointsConfig,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Configuration Sauvegardée',
        message: 'Les paramètres des points de fidélité ont été sauvegardés avec succès.',
        duration: 5000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde de la configuration.',
        duration: 5000
      })
    }
  }

  const handleResetPointsConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Réinitialisation en cours...',
        message: 'Restauration des valeurs par défaut...',
        duration: 3000
      })

      // Simulation de réinitialisation
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Valeurs par défaut
      const defaultConfig = {
        pointValue: 0.01,
        transferFees: 100,
        purchaseValue: 0.01,
        withdrawalValue: 0.01,
        socialShareValue: 5,
        minWithdrawal: 1000,
        maxWithdrawal: 100000,
        basePointsPerFCFA: 1,
        premiumVendorBonus: 20,
        referralBonus: 10,
        firstPurchaseBonus: 50,
        weekendBonus: 15,
        bulkPurchaseBonus: 25,
        bulkPurchaseThreshold: 50000,
        categoryBonuses: {
          electronics: 30,
          clothing: 20,
          food: 15,
          beauty: 25,
          sports: 20,
          books: 10,
          home: 15
        }
      }

      setPointsConfig(defaultConfig)

      // Log de la réinitialisation
      console.log(`🔄 Configuration des points réinitialisée:`, {
        defaultConfig,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Configuration Réinitialisée',
        message: 'Les paramètres ont été restaurés aux valeurs par défaut.',
        duration: 5000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de réinitialisation',
        message: 'Une erreur est survenue lors de la réinitialisation.',
        duration: 5000
      })
    }
  }

  const handleTestPointsConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Test en cours...',
        message: 'Vérification de la configuration des points...',
        duration: 3000
      })

      // Simulation de test
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Tests de validation
      const tests = [
        {
          name: 'Valeur d\'achat',
          status: pointsConfig.purchaseValue > 0 ? 'success' : 'error',
          message: pointsConfig.purchaseValue > 0 ? 'OK' : 'Doit être > 0'
        },
        {
          name: 'Valeur de retrait',
          status: pointsConfig.withdrawalValue > 0 ? 'success' : 'error',
          message: pointsConfig.withdrawalValue > 0 ? 'OK' : 'Doit être > 0'
        },
        {
          name: 'Seuil minimum',
          status: pointsConfig.minWithdrawal > 0 ? 'success' : 'error',
          message: pointsConfig.minWithdrawal > 0 ? 'OK' : 'Doit être > 0'
        },
        {
          name: 'Seuil maximum',
          status: pointsConfig.maxWithdrawal > pointsConfig.minWithdrawal ? 'success' : 'error',
          message: pointsConfig.maxWithdrawal > pointsConfig.minWithdrawal ? 'OK' : 'Doit être > minimum'
        },
        {
          name: 'Frais de transfert',
          status: pointsConfig.transferFees >= 0 ? 'success' : 'error',
          message: pointsConfig.transferFees >= 0 ? 'OK' : 'Doit être >= 0'
        }
      ]

      const passedTests = tests.filter(test => test.status === 'success').length
      const totalTests = tests.length

      // Log du test
      console.log(`🧪 Test de configuration des points:`, {
        tests,
        passedTests,
        totalTests,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      if (passedTests === totalTests) {
        addNotification({
          type: 'success',
          title: 'Test Réussi',
          message: `Tous les tests sont passés (${passedTests}/${totalTests}). La configuration est valide.`,
          duration: 5000
        })
      } else {
        addNotification({
          type: 'warning',
          title: 'Test Partiellement Réussi',
          message: `${passedTests}/${totalTests} tests sont passés. Certains paramètres nécessitent une attention.`,
          duration: 5000
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de test',
        message: 'Une erreur est survenue lors du test de la configuration.',
        duration: 5000
      })
    }
  }

  const handleExportPointsConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export en cours...',
        message: 'Génération du fichier de configuration...',
        duration: 3000
      })

      // Simulation de génération
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer le contenu JSON
      const configData = {
        pointsConfig,
        exportDate: new Date().toISOString(),
        exportedBy: 'Super Admin',
        version: '1.0'
      }

      const jsonContent = JSON.stringify(configData, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `points-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Log de l'export
      console.log(`📤 Configuration des points exportée:`, {
        configData,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Export Réussi',
        message: 'La configuration des points a été exportée en JSON.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export de la configuration.',
        duration: 4000
      })
    }
  }

  const handleValidatePointsConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Validation en cours...',
        message: 'Vérification approfondie de la configuration...',
        duration: 3000
      })

      // Simulation de validation
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Validation avancée
      const validations = []
      
      // Validation des valeurs
      if (pointsConfig.purchaseValue <= 0) {
        validations.push('La valeur d\'achat doit être supérieure à 0')
      }
      if (pointsConfig.withdrawalValue <= 0) {
        validations.push('La valeur de retrait doit être supérieure à 0')
      }
      if (pointsConfig.minWithdrawal <= 0) {
        validations.push('Le seuil minimum doit être supérieur à 0')
      }
      if (pointsConfig.maxWithdrawal <= pointsConfig.minWithdrawal) {
        validations.push('Le seuil maximum doit être supérieur au seuil minimum')
      }
      if (pointsConfig.transferFees < 0) {
        validations.push('Les frais de transfert ne peuvent pas être négatifs')
      }

      // Validation des ratios
      const purchaseToWithdrawalRatio = pointsConfig.purchaseValue / pointsConfig.withdrawalValue
      if (purchaseToWithdrawalRatio < 0.5 || purchaseToWithdrawalRatio > 2) {
        validations.push('Le ratio valeur d\'achat/retrait doit être entre 0.5 et 2')
      }

      // Log de la validation
      console.log(`✅ Validation de la configuration des points:`, {
        validations,
        purchaseToWithdrawalRatio,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      if (validations.length === 0) {
        addNotification({
          type: 'success',
          title: 'Validation Réussie',
          message: 'Tous les paramètres sont valides et cohérents.',
          duration: 5000
        })
      } else {
        addNotification({
          type: 'warning',
          title: 'Validation Partielle',
          message: `${validations.length} problème(s) détecté(s). Vérifiez les paramètres.`,
          duration: 6000
        })

        // Afficher les détails dans la console
        console.log('⚠️ Problèmes de validation:', validations)
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de validation',
        message: 'Une erreur est survenue lors de la validation.',
        duration: 5000
      })
    }
  }

  const handlePreviewPointsRules = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Prévisualisation en cours...',
        message: 'Génération de l\'aperçu des règles...',
        duration: 3000
      })

      // Simulation de génération
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Calcul des exemples
      const examples = [
        {
          scenario: 'Achat de 10,000 FCFA',
          pointsGained: Math.round(10000 / pointsConfig.purchaseValue),
          valueInPoints: formatPrice(10000 / pointsConfig.purchaseValue * pointsConfig.purchaseValue, defaultCurrency),
          bonus: pointsConfig.socialShareValue > 0 ? `+${pointsConfig.socialShareValue} points bonus` : 'Aucun bonus'
        },
        {
          scenario: 'Retrait de 5,000 points',
          pointsCost: 5000,
          fcfAmount: formatPrice(5000 * pointsConfig.withdrawalValue, defaultCurrency),
          netAmount: formatPrice(5000 * pointsConfig.withdrawalValue - pointsConfig.transferFees, defaultCurrency),
          fees: formatPrice(pointsConfig.transferFees, defaultCurrency)
        },
        {
          scenario: 'Seuils de retrait',
          minWithdrawal: `${pointsConfig.minWithdrawal.toLocaleString()} points (${formatPrice(pointsConfig.minWithdrawal * pointsConfig.withdrawalValue, defaultCurrency)})`,
          maxWithdrawal: `${pointsConfig.maxWithdrawal.toLocaleString()} points (${formatPrice(pointsConfig.maxWithdrawal * pointsConfig.withdrawalValue, defaultCurrency)})`,
          transferFees: formatPrice(pointsConfig.transferFees, defaultCurrency)
        }
      ]

      // Log de la prévisualisation
      console.log(`👁️ Prévisualisation des règles de points:`, {
        examples,
        config: pointsConfig,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Prévisualisation Générée',
        message: 'L\'aperçu des règles a été généré. Consultez la console pour les détails.',
        duration: 5000
      })

      // Afficher un résumé dans la notification
      setTimeout(() => {
        addNotification({
          type: 'info',
          title: 'Résumé des Règles',
          message: `Achat: 1 FCFA = ${(1/pointsConfig.purchaseValue).toFixed(2)} points | Retrait: 1 point = ${pointsConfig.withdrawalValue} FCFA`,
          duration: 8000
        })
      }, 1000)

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de prévisualisation',
        message: 'Une erreur est survenue lors de la génération de l\'aperçu.',
        duration: 5000
      })
    }
  }

  const handleShowPointsHistory = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Chargement de l\'historique...',
        message: 'Récupération des modifications récentes...',
        duration: 3000
      })

      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Historique simulé
      const history = [
        {
          date: '2024-12-20 14:30:00',
          action: 'Modification de la valeur d\'achat',
          oldValue: '0.01 FCFA',
          newValue: `${pointsConfig.purchaseValue} FCFA`,
          admin: 'Super Admin',
          type: 'update'
        },
        {
          date: '2024-12-19 16:45:00',
          action: 'Ajustement des frais de transfert',
          oldValue: '150 FCFA',
          newValue: `${pointsConfig.transferFees} FCFA`,
          admin: 'Super Admin',
          type: 'update'
        },
        {
          date: '2024-12-18 09:15:00',
          action: 'Configuration initiale',
          oldValue: 'Non défini',
          newValue: 'Configuré',
          admin: 'Super Admin',
          type: 'create'
        }
      ]

      // Log de l'historique
      console.log(`📚 Historique des points de fidélité:`, {
        history,
        totalEntries: history.length,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Historique Chargé',
        message: `${history.length} entrées d'historique ont été récupérées. Consultez la console pour les détails.`,
        duration: 5000
      })

      // Afficher un résumé
      setTimeout(() => {
        addNotification({
          type: 'info',
          title: 'Dernière Modification',
          message: `Dernière modification: ${history[0].action} le ${history[0].date}`,
        duration: 6000
        })
      }, 1000)

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Une erreur est survenue lors du chargement de l\'historique.',
        duration: 5000
      })
    }
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

  // Actualiser les retraits
  const handleRefreshWithdrawals = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Actualisation en cours...',
        message: 'Récupération des données mises à jour...',
        duration: 3000
      })

      // Simulation de mise à jour avec de nouvelles données
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Générer de nouvelles données simulées pour l'actualisation
      const newWithdrawals = [
        ...pointsWithdrawals,
        {
          id: `w${Date.now()}`,
          userId: `user${Math.floor(Math.random() * 1000)}`,
          userName: `Utilisateur ${Math.floor(Math.random() * 1000)}`,
          pointsAmount: Math.floor(Math.random() * 50000) + 1000,
          fcfAmount: Math.floor(Math.random() * 500000) + 10000,
          status: 'pending' as const,
          withdrawalMethod: ['Mobile Money', 'Virement Bancaire', 'Carte Bancaire'][Math.floor(Math.random() * 3)],
          createdAt: new Date().toLocaleString('fr-FR'),
          bankDetails: Math.random() > 0.5 ? `Banque ${Math.floor(Math.random() * 100)}` : undefined,
          mobileNumber: Math.random() > 0.5 ? `+225 07${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}` : undefined
        }
      ]

      // Mettre à jour l'état avec les nouvelles données
      setPointsWithdrawals(newWithdrawals)

      // Log de l'actualisation
      console.log('🔄 Actualisation des retraits de points:', {
        timestamp: new Date().toISOString(),
        ancienTotal: pointsWithdrawals.length,
        nouveauTotal: newWithdrawals.length,
        nouvellesDonnees: newWithdrawals.length - pointsWithdrawals.length,
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Actualisation réussie',
        message: `${newWithdrawals.length - pointsWithdrawals.length} nouveaux retraits ont été ajoutés. Total: ${newWithdrawals.length}`,
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur d\'actualisation',
        message: 'Une erreur est survenue lors de l\'actualisation.',
        duration: 4000
      })
    }
  }

  // Exporter les retraits en CSV
  const handleExportWithdrawalsCSV = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export CSV en cours...',
        message: 'Génération du fichier CSV des retraits...',
        duration: 3000
      })

      // Simulation de génération CSV
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer le contenu CSV
      const csvContent = `ID,Utilisateur,Points Demandés,Montant FCFA,Statut,Méthode de Retrait,Date de Création
${pointsWithdrawals.map(withdrawal => 
  `${withdrawal.id},${withdrawal.userName},${withdrawal.pointsAmount},${withdrawal.fcfAmount},${withdrawal.status},${withdrawal.withdrawalMethod},${withdrawal.createdAt}`
).join('\n')}`

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `retraits-points-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Log de l'export
      console.log('📊 Export CSV des retraits de points:', {
        totalWithdrawals: pointsWithdrawals.length,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Export CSV réussi',
        message: `${pointsWithdrawals.length} retraits ont été exportés en CSV.`,
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export CSV.',
        duration: 4000
      })
    }
  }

  // Exporter les retraits en PDF
  const handleExportWithdrawalsPDF = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export PDF en cours...',
        message: 'Génération du rapport PDF des retraits...',
        duration: 3000
      })

      // Simulation de génération PDF
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Créer le contenu du rapport
      const reportContent = `
        RAPPORT DES RETRAITS DE POINTS - ${new Date().toLocaleDateString('fr-FR')}
        
        RÉSUMÉ GÉNÉRAL:
        - Total des retraits: ${pointsWithdrawals.length}
        - Retraits en attente: ${pointsWithdrawals.filter(w => w.status === 'pending').length}
        - Retraits approuvés: ${pointsWithdrawals.filter(w => w.status === 'approved').length}
        - Retraits rejetés: ${pointsWithdrawals.filter(w => w.status === 'rejected').length}
        
        MONTANTS:
        - Total des points demandés: ${pointsWithdrawals.reduce((sum, w) => sum + w.pointsAmount, 0).toLocaleString()}
        - Total des montants FCFA: ${formatPrice(pointsWithdrawals.reduce((sum, w) => sum + w.fcfAmount, 0), defaultCurrency)}
        - Total des frais de transfert: ${formatPrice(pointsWithdrawals.length * pointsConfig.transferFees, defaultCurrency)}
        
        DÉTAIL PAR UTILISATEUR:
        ${pointsWithdrawals.map(w => 
          `- ${w.userName}: ${w.pointsAmount.toLocaleString()} points (${formatPrice(w.fcfAmount, defaultCurrency)}) - ${w.status}`
        ).join('\n')}
        
        Généré le: ${new Date().toLocaleString('fr-FR')}
        Par: Super Administrateur
      `

      // Créer et télécharger le fichier
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-retraits-points-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Log de l'export
      console.log('📄 Export PDF des retraits de points:', {
        totalWithdrawals: pointsWithdrawals.length,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Export PDF réussi',
        message: `Rapport PDF des retraits généré avec succès.`,
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export PDF.',
        duration: 4000
      })
    }
  }

  // Envoyer le rapport par email
  const handleEmailWithdrawalsReport = () => {
    try {
      // Préparer le contenu du rapport
      const reportContent = `
        RAPPORT DES RETRAITS DE POINTS - ${new Date().toLocaleDateString('fr-FR')}
        
        RÉSUMÉ GÉNÉRAL:
        - Total des retraits: ${pointsWithdrawals.length}
        - Retraits en attente: ${pointsWithdrawals.filter(w => w.status === 'pending').length}
        - Retraits approuvés: ${pointsWithdrawals.filter(w => w.status === 'approved').length}
        - Retraits rejetés: ${pointsWithdrawals.filter(w => w.status === 'rejected').length}
        
        MONTANTS:
        - Total des points demandés: ${pointsWithdrawals.reduce((sum, w) => sum + w.pointsAmount, 0).toLocaleString()}
        - Total des montants FCFA: ${formatPrice(pointsWithdrawals.reduce((sum, w) => sum + w.fcfAmount, 0), defaultCurrency)}
        - Total des frais de transfert: ${formatPrice(pointsWithdrawals.length * pointsConfig.transferFees, defaultCurrency)}
        
        DÉTAIL PAR UTILISATEUR:
        ${pointsWithdrawals.map(w => 
          `- ${w.userName}: ${w.pointsAmount.toLocaleString()} points (${formatPrice(w.fcfAmount, defaultCurrency)}) - ${w.status}`
        ).join('\n')}
        
        Généré le: ${new Date().toLocaleString('fr-FR')}
        Par: Super Administrateur
      `

      // Créer le lien mailto avec le contenu pré-rempli
      const mailtoLink = `mailto:admin@probooster.com,finance@probooster.com?subject=Rapport des Retraits de Points - ${new Date().toLocaleDateString('fr-FR')}&body=${encodeURIComponent(reportContent)}`

      // Ouvrir le service mail par défaut
      window.open(mailtoLink, '_blank')

      // Log de l'ouverture du service mail
      console.log('📧 Ouverture du service mail pour rapport des retraits:', {
        totalWithdrawals: pointsWithdrawals.length,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin',
        recipients: ['admin@probooster.com', 'finance@probooster.com'],
        mailtoLink: mailtoLink
      })

      addNotification({
        type: 'success',
        title: 'Service mail ouvert',
        message: 'Le service mail a été ouvert avec le rapport pré-rempli.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du service mail:', error)
      addNotification({
        type: 'error',
        title: 'Erreur d\'ouverture',
        message: 'Une erreur est survenue lors de l\'ouverture du service mail.',
        duration: 4000
      })
    }
  }

  // Afficher l'historique des retraits
  const handleShowWithdrawalsHistory = () => {
    setIsHistoryModalOpen(true)
    
    // Log de l'ouverture de l'historique
    console.log('📚 Ouverture de l\'historique des retraits:', {
      totalWithdrawals: pointsWithdrawals.length,
      timestamp: new Date().toISOString(),
      admin: 'Super Admin'
    })
  }

  // Voir les détails d'un retrait
  const handleViewWithdrawalDetails = (withdrawal: PointsWithdrawal) => {
    setSelectedWithdrawalForDetails(withdrawal)
    setIsDetailsModalOpen(true)
    
    // Log de la consultation
    console.log('👁️ Consultation des détails du retrait:', {
      withdrawalId: withdrawal.id,
      userName: withdrawal.userName,
      pointsAmount: withdrawal.pointsAmount,
      fcfAmount: withdrawal.fcfAmount,
      status: withdrawal.status,
      timestamp: new Date().toISOString(),
      admin: 'Super Admin'
    })
  }

  // ===== FONCTIONS POUR LA CONFIGURATION FINANCIÈRE =====

  // Mettre à jour les taux de change
  const handleUpdateExchangeRates = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Mise à jour des taux...',
        message: 'Récupération des taux de change en temps réel...',
        duration: 3000
      })

      // Simulation de mise à jour des taux
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mise à jour des taux avec des valeurs réalistes
      const updatedCurrencies = currencies.map(currency => ({
        ...currency,
        exchangeRate: currency.code === 'XOF' ? 1 : 
                     currency.code === 'USD' ? 0.0017 + (Math.random() * 0.0002 - 0.0001) :
                     currency.code === 'EUR' ? 0.0015 + (Math.random() * 0.0002 - 0.0001) : currency.exchangeRate
      }))

      setCurrencies(updatedCurrencies)

      // Log de la mise à jour
      console.log('💱 Mise à jour des taux de change:', {
        timestamp: new Date().toISOString(),
        currencies: updatedCurrencies,
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Taux mis à jour',
        message: 'Les taux de change ont été mis à jour avec succès.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour des taux:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de mise à jour',
        message: 'Une erreur est survenue lors de la mise à jour des taux.',
        duration: 4000
      })
    }
  }

  // Ajouter une nouvelle devise
  const handleAddNewCurrency = () => {
    const newCurrency: Currency = {
      code: 'GBP',
      name: 'Livre Sterling',
      symbol: '£',
      exchangeRate: 0.0013,
      isDefault: false
    }

    setCurrencies([...currencies, newCurrency])

    // Log de l'ajout
    console.log('➕ Nouvelle devise ajoutée:', {
      currency: newCurrency,
      timestamp: new Date().toISOString(),
      admin: 'Super Admin'
    })

    addNotification({
      type: 'success',
      title: 'Devise ajoutée',
      message: 'La livre sterling a été ajoutée aux devises supportées.',
      duration: 4000
    })
  }

  // Exporter la configuration des devises
  const handleExportCurrencyConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export en cours...',
        message: 'Génération de la configuration des devises...',
        duration: 3000
      })

      // Simulation de génération
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer le contenu de la configuration
      const configContent = `CONFIGURATION DES DEVISES - ${new Date().toLocaleDateString('fr-FR')}

DEVISES SUPPORTÉES:
${currencies.map(c => 
  `- ${c.symbol} ${c.name} (${c.code}): 1 ${c.code} = ${c.exchangeRate.toFixed(4)} FCFA`
).join('\n')}

DEVISE PAR DÉFAUT: ${currencies.find(c => c.isDefault)?.code}

Généré le: ${new Date().toLocaleString('fr-FR')}
Par: Super Administrateur`

      // Créer et télécharger le fichier
      const blob = new Blob([configContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `config-devises-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Log de l'export
      console.log('📤 Export de la configuration des devises:', {
        totalCurrencies: currencies.length,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Export réussi',
        message: 'La configuration des devises a été exportée.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export.',
        duration: 4000
      })
    }
  }

  // Tester la configuration d'export
  const handleTestExportConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Test en cours...',
        message: 'Test de la configuration d\'export...',
        duration: 3000
      })

      // Simulation de test
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log du test
      console.log('🧪 Test de la configuration d\'export:', {
        timestamp: new Date().toISOString(),
        config: {
          defaultFormat: 'CSV',
          defaultPeriod: 'Mois',
          autoExport: true,
          emailReports: true
        },
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Test réussi',
        message: 'La configuration d\'export fonctionne correctement.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors du test:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de test',
        message: 'Une erreur est survenue lors du test.',
        duration: 4000
      })
    }
  }

  // Sauvegarder la configuration d'export
  const handleSaveExportConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Sauvegarde en cours...',
        message: 'Sauvegarde de la configuration d\'export...',
        duration: 3000
      })

      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log de la sauvegarde
      console.log('💾 Sauvegarde de la configuration d\'export:', {
        timestamp: new Date().toISOString(),
        config: {
          defaultFormat: 'CSV',
          defaultPeriod: 'Mois',
          autoExport: true,
          emailReports: true
        },
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Sauvegarde réussie',
        message: 'La configuration d\'export a été sauvegardée.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde.',
        duration: 4000
      })
    }
  }

  // Réinitialiser la configuration d'export
  const handleResetExportConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Réinitialisation en cours...',
        message: 'Réinitialisation de la configuration d\'export...',
        duration: 3000
      })

      // Simulation de réinitialisation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log de la réinitialisation
      console.log('🔄 Réinitialisation de la configuration d\'export:', {
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Réinitialisation réussie',
        message: 'La configuration d\'export a été réinitialisée aux valeurs par défaut.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de réinitialisation',
        message: 'Une erreur est survenue lors de la réinitialisation.',
        duration: 4000
      })
    }
  }

  // Tester la configuration des commissions
  const handleTestCommissionConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Test en cours...',
        message: 'Test de la configuration des commissions...',
        duration: 3000
      })

      // Simulation de test
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log du test
      console.log('🧪 Test de la configuration des commissions:', {
        timestamp: new Date().toISOString(),
        config: {
          type: commissionType,
          rates: commissionRates,
          fixed: commissionFixed,
          admin: 'Super Admin'
        }
      })

      addNotification({
        type: 'success',
        title: 'Test réussi',
        message: 'La configuration des commissions fonctionne correctement.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors du test:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de test',
        message: 'Une erreur est survenue lors du test.',
        duration: 4000
      })
    }
  }

  // Exporter la configuration des commissions
  const handleExportCommissionConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export en cours...',
        message: 'Génération de la configuration des commissions...',
        duration: 3000
      })

      // Simulation de génération
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer le contenu de la configuration
      const configContent = `CONFIGURATION DES COMMISSIONS - ${new Date().toLocaleDateString('fr-FR')}

TYPE DE COMMISSION: ${commissionType}

${commissionType === 'fixed' || commissionType === 'hybrid' ? 
  `COMMISSION FIXE: ${commissionFixed.amount.toLocaleString()} FCFA` : ''
}

${commissionType === 'percentage' || commissionType === 'hybrid' ? 
  `TAUX PAR CATÉGORIE:
- Par défaut: ${commissionRates.default}%
- Électronique: ${commissionRates.electronics}%
- Vêtements: ${commissionRates.clothing}%
- Alimentation: ${commissionRates.food}%
- Beauté: ${commissionRates.beauty}%
- Sports: ${commissionRates.sports}%
- Livres: ${commissionRates.books}%
- Maison: ${commissionRates.home}%` : ''
}

Généré le: ${new Date().toLocaleString('fr-FR')}
Par: Super Administrateur`

      // Créer et télécharger le fichier
      const blob = new Blob([configContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `config-commissions-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Log de l'export
      console.log('📤 Export de la configuration des commissions:', {
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Export réussi',
        message: 'La configuration des commissions a été exportée.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export.',
        duration: 4000
      })
    }
  }

  // Réinitialiser la configuration des commissions
  const handleResetCommissionConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Réinitialisation en cours...',
        message: 'Réinitialisation de la configuration des commissions...',
        duration: 3000
      })

      // Simulation de réinitialisation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Réinitialiser aux valeurs par défaut
      setCommissionType('percentage')
      setCommissionFixed({ enabled: false, amount: 5000 })
      setCommissionRates({
        default: 10,
        electronics: 12,
        clothing: 8,
        food: 5,
        beauty: 15,
        sports: 7,
        books: 6,
        home: 9
      })

      // Log de la réinitialisation
      console.log('🔄 Réinitialisation de la configuration des commissions:', {
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Réinitialisation réussie',
        message: 'La configuration des commissions a été réinitialisée aux valeurs par défaut.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de réinitialisation',
        message: 'Une erreur est survenue lors de la réinitialisation.',
        duration: 4000
      })
    }
  }

  // Valider la configuration des commissions
  const handleValidateCommissionConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Validation en cours...',
        message: 'Validation de la configuration des commissions...',
        duration: 3000
      })

      // Simulation de validation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log de la validation
      console.log('✅ Validation de la configuration des commissions:', {
        timestamp: new Date().toISOString(),
        config: {
          type: commissionType,
          rates: commissionRates,
          fixed: commissionFixed,
          admin: 'Super Admin'
        }
      })

      addNotification({
        type: 'success',
        title: 'Validation réussie',
        message: 'La configuration des commissions est valide et prête à être utilisée.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de validation',
        message: 'Une erreur est survenue lors de la validation.',
        duration: 4000
      })
    }
  }

  // Sauvegarder la configuration des commissions
  const handleSaveCommissionConfig = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Sauvegarde en cours...',
        message: 'Sauvegarde de la configuration des commissions...',
        duration: 3000
      })

      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Log de la sauvegarde
      console.log('💾 Sauvegarde de la configuration des commissions:', {
        timestamp: new Date().toISOString(),
        config: {
          type: commissionType,
          rates: commissionRates,
          fixed: commissionFixed,
          admin: 'Super Admin'
        }
      })

      addNotification({
        type: 'success',
        title: 'Sauvegarde réussie',
        message: 'La configuration des commissions a été sauvegardée avec succès.',
        duration: 4000
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      addNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde.',
        duration: 4000
      })
    }
  }

  // Fonctions d'export
  const exportToCSV = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export CSV en cours...',
        message: 'Génération du fichier CSV...',
        duration: 3000
      })

      // Simulation de génération CSV
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Créer le contenu CSV
      const csvContent = `ID,Vendeur,Montant Total,Commission,Montant Net,Statut,Méthode de Paiement,Date de Création
${paymentRequests.map(request => 
  `${request.id},${request.vendorName},${request.totalAmount},${request.commissionAmount},${request.netAmount},${request.status},${request.paymentMethod},${request.createdAt}`
).join('\n')}`

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `demandes-paiement-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Log de l'export
      console.log(`📊 Export CSV des demandes de paiement:`, {
        totalRequests: paymentRequests.length,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Export CSV réussi',
        message: `${paymentRequests.length} demandes de paiement ont été exportées en CSV.`,
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export CSV.',
        duration: 4000
      })
    }
  }

  const exportToPDF = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Export PDF en cours...',
        message: 'Génération du rapport PDF...',
        duration: 3000
      })

      // Simulation de génération PDF
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Créer le contenu du rapport
      const reportContent = `
        RAPPORT DES DEMANDES DE PAIEMENT - ${new Date().toLocaleDateString('fr-FR')}
        
        RÉSUMÉ GÉNÉRAL:
        - Total des demandes: ${paymentRequests.length}
        - Demandes en attente: ${paymentRequests.filter(r => r.status === 'pending').length}
        - Demandes approuvées: ${paymentRequests.filter(r => r.status === 'approved').length}
        - Demandes rejetées: ${paymentRequests.filter(r => r.status === 'rejected').length}
        
        MONTANTS:
        - Montant total des demandes: ${formatPrice(paymentRequests.reduce((sum, r) => sum + r.totalAmount, 0), defaultCurrency)}
        - Total des commissions: ${formatPrice(paymentRequests.reduce((sum, r) => sum + r.commissionAmount, 0), defaultCurrency)}
        - Montant net total: ${formatPrice(paymentRequests.reduce((sum, r) => sum + r.netAmount, 0), defaultCurrency)}
        
        DÉTAIL PAR VENDEUR:
        ${paymentRequests.map(r => 
          `- ${r.vendorName}: ${formatPrice(r.netAmount, defaultCurrency)} (${r.status})`
        ).join('\n')}
        
        Généré le: ${new Date().toLocaleString('fr-FR')}
        Par: Super Administrateur
      `

      // Créer et télécharger le fichier
      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-demandes-paiement-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Log de l'export
      console.log(`📄 Export PDF des demandes de paiement:`, {
        totalRequests: paymentRequests.length,
        timestamp: new Date().toISOString(),
        admin: 'Super Admin'
      })

      addNotification({
        type: 'success',
        title: 'Export PDF réussi',
        message: 'Le rapport PDF des demandes de paiement a été généré et téléchargé.',
        duration: 4000
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: 'Une erreur est survenue lors de l\'export PDF.',
        duration: 4000
      })
    }
  }

  // Fonction pour actualiser les données
  const handleRefreshData = async () => {
    try {
      addNotification({
        type: 'info',
        title: 'Actualisation en cours...',
        message: 'Rechargement des données financières...',
        duration: 3000
      })

      // Simulation de rechargement
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Sauvegarder les anciennes valeurs pour comparaison
      const oldStats = { ...stats }
      const oldPaymentRequestsCount = paymentRequests.length
      const oldWithdrawalsCount = pointsWithdrawals.length

      // Recharger les données mockées
      loadMockData()

      // Attendre un peu pour que les états soient mis à jour
      await new Promise(resolve => setTimeout(resolve, 100))

      // Calculer les changements
      const revenueChange = stats.totalRevenue - oldStats.totalRevenue
      const commissionChange = stats.totalCommission - oldStats.totalCommission
      const pointsChange = stats.totalPoints - oldStats.totalPoints
      const withdrawalsChange = stats.pendingWithdrawals - oldStats.pendingWithdrawals

      // Log de l'actualisation avec détails
      console.log(`🔄 Actualisation des données financières:`, {
        timestamp: new Date().toISOString(),
        admin: 'Super Admin',
        changes: {
          revenue: { old: oldStats.totalRevenue, new: stats.totalRevenue, change: revenueChange },
          commission: { old: oldStats.totalCommission, new: stats.totalCommission, change: commissionChange },
          points: { old: oldStats.totalPoints, new: stats.totalPoints, change: pointsChange },
          withdrawals: { old: oldStats.pendingWithdrawals, new: stats.pendingWithdrawals, change: withdrawalsChange }
        },
        totalPaymentRequests: paymentRequests.length,
        totalWithdrawals: pointsWithdrawals.length
      })

      // Message de succès avec détails des changements
      const changesMessage = [
        revenueChange !== 0 && `CA: ${revenueChange > 0 ? '+' : ''}${formatPrice(revenueChange, defaultCurrency)}`,
        commissionChange !== 0 && `Commissions: ${commissionChange > 0 ? '+' : ''}${formatPrice(commissionChange, defaultCurrency)}`,
        pointsChange !== 0 && `Points: ${pointsChange > 0 ? '+' : ''}${(pointsChange / 1000000).toFixed(1)}M`,
        withdrawalsChange !== 0 && `Retraits: ${withdrawalsChange > 0 ? '+' : ''}${formatPrice(withdrawalsChange, defaultCurrency)}`
      ].filter(Boolean).join(', ')

      addNotification({
        type: 'success',
        title: 'Actualisation terminée',
        message: changesMessage ? 
          `Données actualisées avec succès. Changements: ${changesMessage}` :
          'Les données financières ont été actualisées avec succès.',
        duration: 5000
      })
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur d\'actualisation',
        message: 'Une erreur est survenue lors de l\'actualisation des données.',
        duration: 4000
      })
    }
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
            <Button variant="outline" onClick={handleRefreshData}>
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

                {/* Règles de gain configurables */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">Règles de Gain Configurables</h4>
                  
                  {/* Règles de base */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                      <Label className="text-sm font-medium text-blue-800">Points de base par FCFA</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="0.1"
                          value={pointsConfig.basePointsPerFCFA}
                          onChange={(e) => setPointsConfig({...pointsConfig, basePointsPerFCFA: Number(e.target.value)})}
                          className="border-blue-300"
                        />
                        <span className="text-sm text-blue-600">points/FCFA</span>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Points gagnés par FCFA dépensé
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-green-50">
                      <Label className="text-sm font-medium text-green-800">Bonus Vendeur Premium</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="1"
                          value={pointsConfig.premiumVendorBonus}
                          onChange={(e) => setPointsConfig({...pointsConfig, premiumVendorBonus: Number(e.target.value)})}
                          className="border-green-300"
                        />
                        <span className="text-sm text-green-600">%</span>
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Bonus pour vendeurs premium
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-purple-50">
                      <Label className="text-sm font-medium text-purple-800">Bonus Parrainage</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="1"
                          value={pointsConfig.referralBonus}
                          onChange={(e) => setPointsConfig({...pointsConfig, referralBonus: Number(e.target.value)})}
                          className="border-purple-300"
                        />
                        <span className="text-sm text-purple-600">%</span>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">
                        Bonus pour parrainage
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-orange-50">
                      <Label className="text-sm font-medium text-orange-800">Bonus Premier Achat</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="1"
                          value={pointsConfig.firstPurchaseBonus}
                          onChange={(e) => setPointsConfig({...pointsConfig, firstPurchaseBonus: Number(e.target.value)})}
                          className="border-orange-300"
                        />
                        <span className="text-sm text-orange-600">points</span>
                      </div>
                      <div className="text-xs text-orange-600 mt-1">
                        Points bonus premier achat
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-indigo-50">
                      <Label className="text-sm font-medium text-indigo-800">Bonus Weekend</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="1"
                          value={pointsConfig.weekendBonus}
                          onChange={(e) => setPointsConfig({...pointsConfig, weekendBonus: Number(e.target.value)})}
                          className="border-indigo-300"
                        />
                        <span className="text-sm text-indigo-600">%</span>
                      </div>
                      <div className="text-xs text-indigo-600 mt-1">
                        Bonus pour achats weekend
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-pink-50">
                      <Label className="text-sm font-medium text-pink-800">Bonus Achats Groupés</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="1"
                          value={pointsConfig.bulkPurchaseBonus}
                          onChange={(e) => setPointsConfig({...pointsConfig, bulkPurchaseBonus: Number(e.target.value)})}
                          className="border-pink-300"
                        />
                        <span className="text-sm text-pink-600">%</span>
                      </div>
                                              <div className="text-xs text-pink-600 mt-1">
                          Bonus pour achats supérieurs à {formatPrice(pointsConfig.bulkPurchaseThreshold, defaultCurrency)}
                        </div>
                    </div>
                  </div>

                  {/* Seuil achats groupés */}
                  <div className="mb-6">
                    <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
                      <Label className="text-sm font-medium text-yellow-800">Seuil Achats Groupés</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input 
                          type="number" 
                          step="1000"
                          value={pointsConfig.bulkPurchaseThreshold}
                          onChange={(e) => setPointsConfig({...pointsConfig, bulkPurchaseThreshold: Number(e.target.value)})}
                          className="border-yellow-300"
                        />
                        <span className="text-sm text-yellow-600">FCFA</span>
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Montant minimum pour bonus achats groupés
                      </div>
                    </div>
                  </div>

                  {/* Bonus par catégorie */}
                  <div className="mb-6">
                    <h5 className="font-medium mb-4 text-gray-700">Bonus par Catégorie de Produit</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(pointsConfig.categoryBonuses).map(([category, bonus]) => (
                        <div key={category} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                          <Label className="text-sm font-medium text-gray-800 capitalize">{category}</Label>
                          <div className="mt-2 flex items-center gap-2">
                            <Input 
                              type="number" 
                              step="1"
                              value={bonus}
                              onChange={(e) => setPointsConfig({
                                ...pointsConfig, 
                                categoryBonuses: {
                                  ...pointsConfig.categoryBonuses,
                                  [category]: Number(e.target.value)
                                }
                              })}
                              className="border-gray-300"
                            />
                            <span className="text-sm text-gray-600">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculateur de points en temps réel */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50">
                    <h5 className="font-medium mb-4 text-emerald-800">Calculateur de Points en Temps Réel</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Achat de 10,000 FCFA =</span>
                          <span className="text-sm font-medium text-emerald-600">
                            {Math.round(10000 * pointsConfig.basePointsPerFCFA)} points
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">+ Bonus Premium ({pointsConfig.premiumVendorBonus}%) =</span>
                          <span className="text-sm font-medium text-green-600">
                            +{Math.round(10000 * pointsConfig.basePointsPerFCFA * pointsConfig.premiumVendorBonus / 100)} points
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">+ Bonus Weekend ({pointsConfig.weekendBonus}%) =</span>
                          <span className="text-sm font-medium text-blue-600">
                            +{Math.round(10000 * pointsConfig.basePointsPerFCFA * pointsConfig.weekendBonus / 100)} points
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-emerald-200">
                          <span className="text-sm font-semibold">Total points gagnés =</span>
                          <span className="text-sm font-bold text-emerald-700">
                            {Math.round(10000 * pointsConfig.basePointsPerFCFA * (1 + pointsConfig.premiumVendorBonus / 100 + pointsConfig.weekendBonus / 100))} points
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Valeur des points =</span>
                          <span className="text-sm font-medium text-emerald-600">
                            {formatPrice(10000 * pointsConfig.basePointsPerFCFA * (1 + pointsConfig.premiumVendorBonus / 100 + pointsConfig.weekendBonus / 100) * pointsConfig.purchaseValue, defaultCurrency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Retrait possible =</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatPrice(10000 * pointsConfig.basePointsPerFCFA * (1 + pointsConfig.premiumVendorBonus / 100 + pointsConfig.weekendBonus / 100) * pointsConfig.withdrawalValue, defaultCurrency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-sm">Frais de retrait =</span>
                          <span className="text-sm font-medium text-red-600">
                            {formatPrice(pointsConfig.transferFees, defaultCurrency)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-green-200">
                          <span className="text-sm font-semibold">Montant net retrait =</span>
                          <span className="text-sm font-bold text-green-700">
                            {formatPrice(10000 * pointsConfig.basePointsPerFCFA * (1 + pointsConfig.premiumVendorBonus / 100 + pointsConfig.weekendBonus / 100) * pointsConfig.withdrawalValue - pointsConfig.transferFees, defaultCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col gap-4 pt-6 border-t border-gray-200">
                  {/* Boutons principaux */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => handleResetPointsConfig()}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleTestPointsConfig()}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Tester
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handlePreviewPointsRules()}
                      className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleExportPointsConfig()}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleValidatePointsConfig()}
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleShowPointsHistory()}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Historique
                    </Button>
                  </div>

                  {/* Bouton Sauvegarder centré */}
                  <div className="flex justify-center">
                    <Button 
                      onClick={() => handleSavePointsConfig()}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-8 py-3 text-lg"
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      Sauvegarder la Configuration
                    </Button>
                  </div>
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

              {/* Boutons d'action principaux */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => handleRefreshWithdrawals()}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleExportWithdrawalsCSV()}
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleExportWithdrawalsPDF()}
                    className="border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter PDF
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => handleEmailWithdrawalsReport()}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer par Email
                  </Button>
                                      <Button 
                      variant="outline"
                      onClick={() => handleShowWithdrawalsHistory()}
                      className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Historique
                    </Button>
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
                          {/* Bouton Voir Détails pour tous les statuts */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewWithdrawalDetails(withdrawal)}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir Détails
                          </Button>
                          
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

                  {/* Boutons d'action pour la gestion multidevise */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => handleUpdateExchangeRates()}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Mettre à jour les Taux
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleAddNewCurrency()}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une Devise
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleExportCurrencyConfig()}
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter la Config
                    </Button>
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

                  {/* Boutons d'action pour les paramètres d'export */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => handleTestExportConfig()}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Tester l'Export
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleSaveExportConfig()}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleResetExportConfig()}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
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

            {/* Boutons d'action pour la configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Actions de Configuration</CardTitle>
                <CardDescription>
                  Sauvegarder, tester et gérer la configuration financière
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Boutons principaux */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => handleTestCommissionConfig()}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Tester la Configuration
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleExportCommissionConfig()}
                      className="border-green-300 text-green-600 hover:bg-green-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exporter la Config
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleResetCommissionConfig()}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleValidateCommissionConfig()}
                      className="border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Valider
                    </Button>
                  </div>

                  {/* Bouton Sauvegarder centré */}
                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={() => handleSaveCommissionConfig()}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-8 py-3 text-lg"
                    >
                      <Settings className="h-5 w-5 mr-3" />
                      Sauvegarder la Configuration
                    </Button>
                  </div>
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

               {/* Modal Demande de Paiement Vendeur */}
        <Dialog open={showEditPaymentRequestModal} onOpenChange={setShowEditPaymentRequestModal}>
          <DialogContent className="max-w-2xl h-[90vh] flex flex-col">
            <DialogHeader className="space-y-4 pb-4 border-b border-[#ff6600] flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#ff6600]/20 rounded-full">
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
            
            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              {/* Informations de la commande et du client */}
              {editingPaymentRequest && (
                <div className="p-4 bg-gradient-to-r from-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-lg border border-[#3b82f6]">
                  <div className="flex items-center space-x-3 mb-3">
                    <Package className="w-5 h-5 text-[#3b82f6]" />
                    <h3 className="font-semibold text-[#3b82f6]">Informations de la Commande</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Commande :</span>
                        <span className="font-bold text-[#3b82f6]">ORD-001</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Montant à recevoir :</span>
                        <span className="text-lg font-bold text-[#10b981]">
                          {formatPrice(editingPaymentRequest.netAmount, defaultCurrency)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Client :</span>
                        <span className="font-semibold">Kouassi Jean</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Email client :</span>
                        <span className="text-sm text-gray-600">kouassi@email.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire de paiement */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-5 h-5 text-[#ff6600]" />
                  <h3 className="font-semibold text-[#ff6600]">Informations du Vendeur</h3>
                </div>

                {/* Email/Nom du Vendeur */}
                <div className="space-y-2">
                  <Label htmlFor="sellerEmail">Email/Nom du Vendeur *</Label>
                  <Input
                    id="sellerEmail"
                    value={editingPaymentRequest?.vendorName || ''}
                    onChange={(e) => setEditingPaymentRequest(editingPaymentRequest ? {
                      ...editingPaymentRequest,
                      vendorName: e.target.value
                    } : null)}
                    placeholder="Rechercher un vendeur..."
                    className="mt-2"
                  />
                </div>

                <Separator />

                <div className="flex items-center space-x-3 mb-4">
                  <CreditCard className="w-5 h-5 text-[#10b981]" />
                  <h3 className="font-semibold text-[#10b981]">Mode de Paiement</h3>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Mode de paiement *</Label>
                  <Select 
                    value={editingPaymentRequest?.paymentMethod || ''} 
                    onValueChange={(value) => setEditingPaymentRequest(editingPaymentRequest ? {
                      ...editingPaymentRequest,
                      paymentMethod: value
                    } : null)}
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

                {editingPaymentRequest?.paymentMethod === 'mobile_money' && (
                  <div>
                    <Label htmlFor="phoneNumber">Numéro de téléphone *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="Ex: +225 0701234567"
                      value={editingPaymentRequest?.mobileNumber || ''}
                      onChange={(e) => setEditingPaymentRequest(editingPaymentRequest ? {
                        ...editingPaymentRequest,
                        mobileNumber: e.target.value
                      } : null)}
                    />
                  </div>
                )}

                {editingPaymentRequest?.paymentMethod === 'bank_transfer' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bankName">Nom de la banque *</Label>
                      <Input
                        id="bankName"
                        placeholder="Ex: BICICI, SGB, NSIA..."
                        value={editingPaymentRequest?.bankDetails || ''}
                        onChange={(e) => setEditingPaymentRequest(editingPaymentRequest ? {
                          ...editingPaymentRequest,
                          bankDetails: e.target.value
                        } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Numéro de compte *</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Numéro de compte bancaire"
                        value={editingPaymentRequest?.bankDetails || ''}
                        onChange={(e) => setEditingPaymentRequest(editingPaymentRequest ? {
                          ...editingPaymentRequest,
                          bankDetails: e.target.value
                        } : null)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations supplémentaires pour l'administrateur..."
                    value={editingPaymentRequest?.notes || ''}
                    onChange={(e) => setEditingPaymentRequest(editingPaymentRequest ? {
                      ...editingPaymentRequest,
                      notes: e.target.value
                    } : null)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-end space-x-2 pt-4 border-t border-[#ff6600] flex-shrink-0 bg-white">
              <Button 
                variant="outline" 
                onClick={handleCancelPaymentRequestEdit}
                className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSavePaymentRequestEdit}
                className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
                disabled={!editingPaymentRequest?.paymentMethod || !editingPaymentRequest?.vendorName || 
                         (editingPaymentRequest?.paymentMethod === 'mobile_money' && !editingPaymentRequest?.mobileNumber) ||
                         (editingPaymentRequest?.paymentMethod === 'bank_transfer' && !editingPaymentRequest?.bankDetails)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Envoyer la Demande
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Historique des Retraits */}
        <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader className="space-y-4 pb-4 border-b border-orange-500 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-full">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-orange-500 font-bold">Historique Complet des Retraits de Points</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Consultation de l'historique détaillé de tous les retraits de points
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              {/* Statistiques générales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">Total Retraits</div>
                  <div className="text-2xl font-bold text-blue-900">{pointsWithdrawals.length}</div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Approuvés</div>
                  <div className="text-2xl font-bold text-green-900">
                    {pointsWithdrawals.filter(w => w.status === 'approved').length}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm font-medium text-orange-600">En Attente</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {pointsWithdrawals.filter(w => w.status === 'pending').length}
                  </div>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium text-red-600">Rejetés</div>
                  <div className="text-2xl font-bold text-red-900">
                    {pointsWithdrawals.filter(w => w.status === 'rejected').length}
                  </div>
                </div>
              </div>

              {/* Filtres d'historique */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
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

              {/* Tableau d'historique */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Utilisateur</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Points</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Montant FCFA</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Statut</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Méthode</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {pointsWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">{withdrawal.userName}</div>
                          <div className="text-xs text-gray-500">ID: {withdrawal.id}</div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <span className="font-medium text-blue-600">
                            {withdrawal.pointsAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <span className="font-medium text-green-600">
                            {formatPrice(withdrawal.fcfAmount, defaultCurrency)}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <Badge variant={
                            withdrawal.status === 'pending' ? 'secondary' : 
                            withdrawal.status === 'approved' ? 'default' : 'destructive'
                          }>
                            {withdrawal.status === 'pending' ? 'En attente' : 
                             withdrawal.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                          {withdrawal.withdrawalMethod}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                          {withdrawal.createdAt}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedWithdrawalForDetails(withdrawal)
                              setIsDetailsModalOpen(true)
                              setIsHistoryModalOpen(false)
                            }}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Résumé financier */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                <h4 className="font-semibold text-emerald-800 mb-3">Résumé Financier</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-emerald-600">Total Points Demandés</div>
                    <div className="text-xl font-bold text-emerald-800">
                      {pointsWithdrawals.reduce((sum, w) => sum + w.pointsAmount, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-emerald-600">Total Montants FCFA</div>
                    <div className="text-xl font-bold text-emerald-800">
                      {formatPrice(pointsWithdrawals.reduce((sum, w) => sum + w.fcfAmount, 0), defaultCurrency)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-emerald-600">Total Frais de Transfert</div>
                    <div className="text-xl font-bold text-emerald-800">
                      {formatPrice(pointsWithdrawals.length * pointsConfig.transferFees, defaultCurrency)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-orange-500 flex-shrink-0 bg-white">
              <Button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Fermer l'Historique
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Détails d'un Retrait */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="space-y-4 pb-4 border-b border-blue-500 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-full">
                  <Eye className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl text-blue-500 font-bold">Détails du Retrait de Points</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Informations complètes sur le retrait sélectionné
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            {selectedWithdrawalForDetails && (
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                {/* Informations de l'utilisateur */}
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg border border-blue-500">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-blue-500">Informations de l'Utilisateur</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Nom d'utilisateur :</span>
                        <span className="font-bold text-blue-600">{selectedWithdrawalForDetails.userName}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">ID Utilisateur :</span>
                        <span className="font-semibold text-gray-600">{selectedWithdrawalForDetails.userId}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Statut du compte :</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Actif
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Type de compte :</span>
                        <span className="font-semibold text-gray-600">Standard</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détails du retrait */}
                <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500">
                  <div className="flex items-center space-x-3 mb-3">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-green-500">Détails du Retrait</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Points demandés :</span>
                        <span className="text-lg font-bold text-green-600">
                          {selectedWithdrawalForDetails.pointsAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Montant FCFA :</span>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(selectedWithdrawalForDetails.fcfAmount, defaultCurrency)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Frais de transfert :</span>
                        <span className="font-semibold text-red-600">
                          {formatPrice(pointsConfig.transferFees, defaultCurrency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Montant net :</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(selectedWithdrawalForDetails.fcfAmount - pointsConfig.transferFees, defaultCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations de paiement */}
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500">
                  <div className="flex items-center space-x-3 mb-3">
                    <CreditCard className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-purple-500">Informations de Paiement</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Méthode de retrait :</span>
                      <span className="font-semibold text-purple-600">
                        {selectedWithdrawalForDetails.withdrawalMethod}
                      </span>
                    </div>
                    {selectedWithdrawalForDetails.bankDetails && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Détails bancaires :</span>
                        <span className="font-semibold text-gray-600">
                          {selectedWithdrawalForDetails.bankDetails}
                        </span>
                      </div>
                    )}
                    {selectedWithdrawalForDetails.mobileNumber && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Numéro mobile :</span>
                        <span className="font-semibold text-gray-600">
                          {selectedWithdrawalForDetails.mobileNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statut et historique */}
                <div className="p-4 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg border border-orange-500">
                  <div className="flex items-center space-x-3 mb-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <h3 className="font-semibold text-orange-500">Statut et Historique</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Statut actuel :</span>
                      <Badge variant={
                        selectedWithdrawalForDetails.status === 'pending' ? 'secondary' : 
                        selectedWithdrawalForDetails.status === 'approved' ? 'default' : 'destructive'
                      }>
                        {selectedWithdrawalForDetails.status === 'pending' ? 'En attente' : 
                         selectedWithdrawalForDetails.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">Date de création :</span>
                      <span className="font-semibold text-gray-600">
                        {selectedWithdrawalForDetails.createdAt}
                      </span>
                    </div>
                    {selectedWithdrawalForDetails.processedAt && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Date de traitement :</span>
                        <span className="font-semibold text-gray-600">
                          {selectedWithdrawalForDetails.processedAt}
                        </span>
                      </div>
                    )}
                    {selectedWithdrawalForDetails.rejectionReason && (
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Motif de rejet :</span>
                        <span className="font-semibold text-red-600">
                          {selectedWithdrawalForDetails.rejectionReason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions disponibles */}
                {selectedWithdrawalForDetails.status === 'pending' && (
                  <div className="p-4 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg border border-indigo-500">
                    <div className="flex items-center space-x-3 mb-3">
                      <Settings className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-semibold text-indigo-500">Actions Disponibles</h3>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          handleWithdrawalApproval(selectedWithdrawalForDetails.id, true)
                          setIsDetailsModalOpen(false)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedWithdrawal(selectedWithdrawalForDetails)
                          setIsDetailsModalOpen(false)
                          setIsWithdrawalModalOpen(true)
                        }}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t border-blue-500 flex-shrink-0 bg-white">
              <Button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Fermer les Détails
              </Button>
            </div>
          </DialogContent>
        </Dialog>
     </div>
   )
 }
