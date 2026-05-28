"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Gift, 
  Percent, 
  Clock, 
  Tag, 
  Eye, 
  ShoppingCart,
  RefreshCw,
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

interface SyncedPromotionsOffersProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedPromotionsOffers({ data, isLoading, onRefresh }: SyncedPromotionsOffersProps) {
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null)

  // Générer des promotions basées sur les vraies données
  const generatePromotions = () => {
    if (!data) return []

    const promotions = []

    // Promotion basée sur les points de fidélité
    if (data.loyaltyPoints && data.loyaltyPoints.points_balance > 1000) {
      promotions.push({
        id: 'promo-1',
        title: 'Points x2 sur tous les achats',
        description: 'Gagnez 2x plus de points fidélité cette semaine',
        type: 'points_multiplier',
        value: 'Points x2',
        minAmount: 0,
        maxDiscount: null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageCount: 0,
        maxUsage: 1000,
        conditions: ['Minimum d\'achat: 0 F CFA', 'Maximum de réduction: Aucune limite'],
        priority: 1,
        applicableProducts: [],
        applicableCategories: []
      })
    }

    // Promotion basée sur l'historique des commandes
    if (data.orders.length >= 2) {
      const totalSpent = data.orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      if (totalSpent > 1000000) {
        promotions.push({
          id: 'promo-2',
          title: 'Client VIP - 15% de réduction',
          description: 'Réduction spéciale pour nos clients fidèles',
          type: 'discount',
          value: '15% de réduction',
          minAmount: 100000,
          maxDiscount: 150000,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
          usageCount: 0,
          maxUsage: 500,
          conditions: ['Minimum d\'achat: 100,000 F CFA', 'Maximum de réduction: 150,000 F CFA'],
          priority: 2,
          applicableProducts: [],
          applicableCategories: []
        })
      }
    }

    // Promotion flash basée sur l'activité
    if (data.orders.length > 0) {
      const lastOrder = data.orders[0]
      const daysSinceLastOrder = Math.floor((Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceLastOrder > 7) {
        promotions.push({
          id: 'promo-3',
          title: 'Flash Sale - Retour en force',
          description: 'Offre spéciale pour vous faire revenir',
          type: 'flash',
          value: '20% de réduction',
          minAmount: 50000,
          maxDiscount: 100000,
          startDate: new Date(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          isActive: true,
          usageCount: 0,
          maxUsage: 200,
          conditions: ['Minimum d\'achat: 50,000 F CFA', 'Maximum de réduction: 100,000 F CFA', 'Offre limitée à 3 jours'],
          priority: 3,
          applicableProducts: [],
          applicableCategories: []
        })
      }
    }

    // Promotion de bienvenue pour nouveaux utilisateurs
    if (data.orders.length === 0) {
      promotions.push({
        id: 'promo-4',
        title: 'Bienvenue - 10% de réduction',
        description: 'Première commande à prix réduit',
        type: 'welcome',
        value: '10% de réduction',
        minAmount: 25000,
        maxDiscount: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageCount: 0,
        maxUsage: 1000,
        conditions: ['Première commande uniquement', 'Minimum d\'achat: 25,000 F CFA', 'Maximum de réduction: 50,000 F CFA'],
        priority: 4,
        applicableProducts: [],
        applicableCategories: []
      })
    }

    return promotions
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Percent className="w-5 h-5 text-blue-600" />
      case 'flash':
        return <Zap className="w-5 h-5 text-yellow-600" />
      case 'points_multiplier':
        return <Gift className="w-5 h-5 text-purple-600" />
      case 'welcome':
        return <Tag className="w-5 h-5 text-green-600" />
      default:
        return <Gift className="w-5 h-5 text-orange-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'flash':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'points_multiplier':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'welcome':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-200'
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 3:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
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

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date()
    const diff = endDate.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`
    if (hours > 0) return `${hours} heure${hours > 1 ? 's' : ''}`
    return 'Expire bientôt'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Offres et Promotions
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

  const promotions = generatePromotions()

  if (promotions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Offres et Promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune promotion disponible</p>
            <p className="text-sm">Continuez à utiliser la plateforme pour découvrir des offres spéciales</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Offres et Promotions ({promotions.length})
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
        <div className="space-y-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-green-50 to-blue-50"
              onClick={() => setSelectedPromotion(promo)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getTypeIcon(promo.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {promo.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(promo.type)}>
                        {promo.type.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(promo.priority)}>
                        Priorité {promo.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {promo.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-green-600">
                        {promo.value}
                      </div>
                      <p className="text-xs text-gray-500">Réduction</p>
                    </div>
                    
                    <div className="text-center p-2 bg-white rounded border">
                      <div className="text-lg font-bold text-blue-600">
                        {promo.minAmount?.toLocaleString() || '0'} F CFA
                      </div>
                      <p className="text-xs text-gray-500">Minimum</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(promo.endDate)}
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
                          // Logique pour utiliser la promotion
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Utiliser
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Promotions personnalisées</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Ces offres sont spécialement sélectionnées pour vous en fonction de votre activité et de vos préférences.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
