"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  DollarSign,
  RefreshCw,
  Calendar,
  TrendingUp,
  Wallet,
  Banknote,
  Receipt,
  ShoppingBag,
  Star,
  Truck,
  Package
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

interface SyncedPaymentRequestsProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedPaymentRequests({ data, isLoading, onRefresh }: SyncedPaymentRequestsProps) {
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // Générer des demandes de paiement basées sur les vraies données
  const generatePaymentRequests = () => {
    if (!data) return []

    const paymentRequests = []

    // Demande de paiement basée sur les commandes en attente
    const pendingOrders = data.orders.filter(order => order.status === 'pending')
    if (pendingOrders.length > 0) {
      pendingOrders.forEach((order, index) => {
        paymentRequests.push({
          id: `payment-${order.id}`,
          orderId: order.id,
          orderNumber: order.order_number,
          amount: order.total_amount,
          currency: 'XOF',
          status: 'pending',
          type: 'order_payment',
          description: `Paiement pour la commande #${order.order_number}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
          createdAt: new Date(order.created_at),
          paymentMethod: 'card',
          isUrgent: index === 0, // Première commande = urgente
          fees: Math.round(order.total_amount * 0.025), // 2.5% de frais
          totalWithFees: order.total_amount + Math.round(order.total_amount * 0.025)
        })
      })
    }

    // Demande de paiement pour services premium
    if (data.loyaltyPoints && data.loyaltyPoints.points_balance > 5000) {
      paymentRequests.push({
        id: 'payment-premium',
        orderId: null,
        orderNumber: 'PREMIUM-001',
        amount: 25000,
        currency: 'XOF',
        status: 'pending',
        type: 'premium_service',
        description: 'Abonnement Premium - Accès aux fonctionnalités avancées',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        createdAt: new Date(),
        paymentMethod: 'card',
        isUrgent: false,
        fees: 625, // 2.5% de frais
        totalWithFees: 25625
      })
    }

    // Demande de paiement pour livraison express
    const shippedOrders = data.orders.filter(order => order.status === 'shipped')
    if (shippedOrders.length > 0) {
      const expressDelivery = shippedOrders[0]
      paymentRequests.push({
        id: `payment-delivery-${expressDelivery.id}`,
        orderId: expressDelivery.id,
        orderNumber: expressDelivery.order_number,
        amount: 15000,
        currency: 'XOF',
        status: 'pending',
        type: 'express_delivery',
        description: `Livraison express pour la commande #${expressDelivery.order_number}`,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 jours
        createdAt: new Date(),
        paymentMethod: 'card',
        isUrgent: true,
        fees: 375, // 2.5% de frais
        totalWithFees: 15375
      })
    }

    // Demande de paiement pour produits en attente
    if (data.products && data.products.length > 0) {
      const inactiveProducts = data.products.filter(product => !product.is_active)
      if (inactiveProducts.length > 0) {
        paymentRequests.push({
          id: 'payment-approval',
          orderId: null,
          orderNumber: 'APPROVAL-001',
          amount: 10000,
          currency: 'XOF',
          status: 'pending',
          type: 'product_approval',
          description: 'Frais d\'approbation pour produits inactifs',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
          createdAt: new Date(),
          paymentMethod: 'card',
          isUrgent: false,
          fees: 250, // 2.5% de frais
          totalWithFees: 10250
        })
      }
    }

    return paymentRequests
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'processing':
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order_payment':
        return <ShoppingBag className="h-4 w-4 text-blue-600" />
      case 'premium_service':
        return <Star className="h-4 w-4 text-purple-600" />
      case 'express_delivery':
        return <Truck className="h-4 w-4 text-green-600" />
      case 'product_approval':
        return <Package className="h-4 w-4 text-orange-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order_payment':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'premium_service':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'express_delivery':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'product_approval':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTimeRemaining = (dueDate: Date) => {
    const now = new Date()
    const diff = dueDate.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diff < 0) return 'En retard'
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`
    return 'Expire bientôt'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Demandes de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-28 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const paymentRequests = generatePaymentRequests()

  if (paymentRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Demandes de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune demande de paiement</p>
            <p className="text-sm">Vous êtes à jour avec tous vos paiements</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalPending = paymentRequests
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.totalWithFees, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Demandes de Paiement ({paymentRequests.length})
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="h-8 px-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Résumé des paiements en attente */}
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-700">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">Total en attente</span>
            </div>
            <div className="text-lg font-bold text-yellow-700">
              {formatCurrency(totalPending)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {paymentRequests.map((payment) => (
            <div
              key={payment.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                payment.isUrgent ? 'bg-red-50 border-red-200' : 'bg-white'
              }`}
              onClick={() => setSelectedPayment(payment)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getTypeIcon(payment.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {payment.description}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status === 'pending' ? 'En attente' : payment.status}
                      </Badge>
                      <Badge className={getTypeColor(payment.type)}>
                        {payment.type.replace('_', ' ')}
                      </Badge>
                      {payment.isUrgent && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <p className="text-xs text-gray-500">Montant</p>
                    </div>
                    
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(payment.totalWithFees)}
                      </div>
                      <p className="text-xs text-gray-500">Total avec frais</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Échéance: {formatDate(payment.dueDate)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(payment.dueDate)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Logique pour voir les détails
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Détails
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Logique pour payer
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        Payer
                      </Button>
                    </div>
                  </div>

                  {payment.fees > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <Receipt className="w-3 h-3 inline mr-1" />
                      Frais de transaction: {formatCurrency(payment.fees)} (2.5%)
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Gestion des paiements</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Payez vos demandes en attente pour éviter les retards et maintenir un bon historique de paiement.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
