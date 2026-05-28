"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  Phone,
  RefreshCw,
  Calendar,
  TrendingUp,
  Route,
  Navigation
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

type DeliveryStatus = 'preparing' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned'

interface DeliveryItem {
  id: string
  orderId: string
  orderNumber: string
  trackingNumber: string
  status: DeliveryStatus
  type: 'standard' | 'express'
  estimatedDelivery: Date
  actualDelivery: Date | null
  carrier: string
  origin: string
  destination: string
  recipient: string
  phone?: string
  weight: number
  dimensions: string
  shippingCost: number
  isExpress: boolean
  notes: string
  createdAt: Date
}

interface SyncedDeliveriesProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedDeliveries({ data, isLoading, onRefresh }: SyncedDeliveriesProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)

  // Générer des livraisons basées sur les vraies données
  const generateDeliveries = () => {
    if (!data) return []

    const deliveries: DeliveryItem[] = []

    // Livraisons basées sur les commandes expédiées
    const shippedOrders = data.orders.filter(order => order.status === 'shipped')
    shippedOrders.forEach((order, index) => {
      const shippingCostRaw = (order as any)?.shipping_cost
      deliveries.push({
        id: `delivery-${order.id}`,
        orderId: order.id,
        orderNumber: order.order_number,
        trackingNumber: `TRK-${order.id.slice(0, 8).toUpperCase()}`,
        status: 'in_transit',
        type: 'standard',
        estimatedDelivery: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000), // 1-3 jours
        actualDelivery: null,
        carrier: 'Express Delivery',
        origin: 'Entrepôt principal',
        destination: 'Adresse de livraison',
        recipient: 'Client',
        phone: '+225 0123456789',
        weight: Math.round(Math.random() * 5) + 1, // 1-6 kg
        dimensions: `${Math.round(Math.random() * 20) + 30}x${Math.round(Math.random() * 20) + 20}x${Math.round(Math.random() * 10) + 10} cm`,
        shippingCost: Number.isFinite(Number(shippingCostRaw)) ? Number(shippingCostRaw) : 5000,
        isExpress: index === 0, // Première livraison = express
        notes: order.notes || 'Livraison standard',
        createdAt: new Date(order.created_at)
      })
    })

    // Livraisons en préparation
    const processingOrders = data.orders.filter(order => order.status === 'processing')
    processingOrders.forEach((order, index) => {
      const shippingCostRaw = (order as any)?.shipping_cost
      deliveries.push({
        id: `prep-${order.id}`,
        orderId: order.id,
        orderNumber: order.order_number,
        trackingNumber: `PREP-${order.id.slice(0, 8).toUpperCase()}`,
        status: 'preparing',
        type: 'standard',
        estimatedDelivery: new Date(Date.now() + (index + 2) * 24 * 60 * 60 * 1000), // 2-4 jours
        actualDelivery: null,
        carrier: 'Standard Delivery',
        origin: 'Entrepôt principal',
        destination: 'Adresse de livraison',
        recipient: 'Client',
        phone: '+225 0123456789',
        weight: Math.round(Math.random() * 3) + 1, // 1-4 kg
        dimensions: `${Math.round(Math.random() * 15) + 25}x${Math.round(Math.random() * 15) + 15}x${Math.round(Math.random() * 8) + 8} cm`,
        shippingCost: Number.isFinite(Number(shippingCostRaw)) ? Number(shippingCostRaw) : 3000,
        isExpress: false,
        notes: 'En préparation',
        createdAt: new Date(order.created_at)
      })
    })

    // Livraisons livrées
    const deliveredOrders = data.orders.filter(order => order.status === 'delivered')
    deliveredOrders.slice(0, 2).forEach((order) => {
      const shippingCostRaw = (order as any)?.shipping_cost
      deliveries.push({
        id: `delivered-${order.id}`,
        orderId: order.id,
        orderNumber: order.order_number,
        trackingNumber: `DEL-${order.id.slice(0, 8).toUpperCase()}`,
        status: 'delivered',
        type: 'standard',
        estimatedDelivery: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // 1-7 jours dans le passé
        actualDelivery: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000), // 1-3 jours dans le passé
        carrier: 'Standard Delivery',
        origin: 'Entrepôt principal',
        destination: 'Adresse de livraison',
        recipient: 'Client',
        phone: '+225 0123456789',
        weight: Math.round(Math.random() * 4) + 1, // 1-5 kg
        dimensions: `${Math.round(Math.random() * 18) + 28}x${Math.round(Math.random() * 18) + 18}x${Math.round(Math.random() * 9) + 9} cm`,
        shippingCost: Number.isFinite(Number(shippingCostRaw)) ? Number(shippingCostRaw) : 3000,
        isExpress: false,
        notes: 'Livraison réussie',
        createdAt: new Date(order.created_at)
      })
    })

    return deliveries
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preparing':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'in_transit':
        return <Truck className="h-4 w-4 text-yellow-600" />
      case 'out_for_delivery':
        return <Route className="h-4 w-4 text-orange-600" />
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'returned':
        return <AlertCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'returned':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'En préparation'
      case 'in_transit':
        return 'En transit'
      case 'out_for_delivery':
        return 'En livraison'
      case 'delivered':
        return 'Livré'
      case 'failed':
        return 'Échoué'
      case 'returned':
        return 'Retourné'
      default:
        return status
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'express':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'standard':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'economy':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTimeRemaining = (estimatedDate: Date) => {
    const now = new Date()
    const diff = estimatedDate.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diff < 0) return 'En retard'
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`
    return 'Arrive bientôt'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Livraisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const deliveries = generateDeliveries()

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Livraisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune livraison</p>
            <p className="text-sm">Vos commandes n'ont pas encore été expédiées</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const inTransitCount = deliveries.filter(d => d.status === 'in_transit').length
  const preparingCount = deliveries.filter(d => d.status === 'preparing').length
  const deliveredCount = deliveries.filter(d => d.status === 'delivered').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Livraisons ({deliveries.length})
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="h-8 px-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Résumé des statistiques */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">En préparation</span>
            </div>
            <div className="text-lg font-bold text-blue-700 mt-1">
              {preparingCount}
            </div>
          </div>
          
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 text-yellow-700">
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">En transit</span>
            </div>
            <div className="text-lg font-bold text-yellow-700 mt-1">
              {inTransitCount}
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Livrées</span>
            </div>
            <div className="text-lg font-bold text-green-700 mt-1">
              {deliveredCount}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                delivery.isExpress ? 'bg-purple-50 border-purple-200' : 'bg-white'
              }`}
              onClick={() => setSelectedDelivery(delivery)}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getStatusIcon(delivery.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        Livraison #{delivery.trackingNumber}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Commande #{delivery.orderNumber}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(delivery.status)}>
                        {getStatusText(delivery.status)}
                      </Badge>
                      
                      <Badge className={getTypeColor(delivery.type)}>
                        {delivery.type === 'express' ? 'Express' : 'Standard'}
                      </Badge>
                      
                      {delivery.isExpress && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          Express
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(delivery.shippingCost)}
                      </div>
                      <p className="text-xs text-gray-500">Frais de livraison</p>
                    </div>
                    
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-blue-600">
                        {delivery.weight} kg
                      </div>
                      <p className="text-xs text-gray-500">Poids</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {delivery.destination}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {delivery.dimensions}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        {delivery.carrier}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Livraison estimée: {formatDate(delivery.estimatedDelivery)}
                      </span>
                      
                      <span>•</span>
                      
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(delivery.estimatedDelivery)}
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
                        Suivre
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Logique pour appeler
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Appeler
                      </Button>
                    </div>
                  </div>

                  {/* Informations supplémentaires */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {delivery.origin} → {delivery.destination}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {delivery.recipient}
                      </span>
                      
                      {delivery.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {delivery.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Suivi des livraisons</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Suivez vos livraisons en temps réel et restez informé de leur statut.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
