"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  TrendingUp, 
  ShoppingBag, 
  Star, 
  Eye, 
  Heart,
  RefreshCw,
  Zap,
  Target,
  Lightbulb
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

interface SyncedAIRecommendationsProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedAIRecommendations({ data, isLoading, onRefresh }: SyncedAIRecommendationsProps) {
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null)

  // Générer des recommandations basées sur les vraies données
  const generateRecommendations = () => {
    if (!data) return []

    const recommendations = []

    // Recommandation basée sur l'historique des commandes
    if (data.orders.length > 0) {
      const avgOrderValue = data.orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / data.orders.length
      if (avgOrderValue > 500000) {
        recommendations.push({
          id: 'rec-1',
          type: 'product',
          title: 'Produits Premium Recommandés',
          description: 'Basé sur votre historique d\'achats premium',
          confidence: 95,
          reason: 'Vous achetez régulièrement des produits haut de gamme',
          data: { avgOrderValue: avgOrderValue.toLocaleString() },
          category: 'premium'
        })
      }
    }

    // Recommandation basée sur les points de fidélité
    if (data.loyaltyPoints && data.loyaltyPoints.points_balance > 2000) {
      recommendations.push({
        id: 'rec-2',
        type: 'promotion',
        title: 'Utilisez vos points de fidélité',
        description: 'Vous avez assez de points pour des réductions importantes',
        confidence: 88,
        reason: 'Solde de points élevé',
        data: { pointsBalance: data.loyaltyPoints.points_balance },
        category: 'points'
      })
    }

    // Recommandation basée sur l'activité
    if (data.orders.length >= 3) {
      recommendations.push({
        id: 'rec-3',
        type: 'seller',
        title: 'Vendeurs recommandés',
        description: 'Basé sur vos préférences d\'achat',
        confidence: 82,
        reason: 'Historique d\'achats diversifié',
        data: { orderCount: data.orders.length },
        category: 'seller'
      })
    }

    // Recommandation basée sur les notifications non lues
    const unreadCount = data.notifications.filter(n => !n.is_read).length
    if (unreadCount > 2) {
      recommendations.push({
        id: 'rec-4',
        type: 'action',
        title: 'Notifications importantes',
        description: 'Vous avez des notifications non lues importantes',
        confidence: 90,
        reason: 'Notifications en attente',
        data: { unreadCount },
        category: 'notification'
      })
    }

    return recommendations
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <ShoppingBag className="w-5 h-5 text-blue-600" />
      case 'promotion':
        return <Star className="w-5 h-5 text-yellow-600" />
      case 'seller':
        return <Target className="w-5 h-5 text-green-600" />
      case 'action':
        return <Lightbulb className="w-5 h-5 text-purple-600" />
      default:
        return <Sparkles className="w-5 h-5 text-orange-600" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (confidence >= 80) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'points':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'seller':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'notification':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const recommendations = generateRecommendations()

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Recommandations IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune recommandation</p>
            <p className="text-sm">Continuez à utiliser la plateforme pour recevoir des recommandations personnalisées</p>
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
            <Sparkles className="w-5 h-5" />
            Recommandations IA ({recommendations.length})
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
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50"
              onClick={() => setSelectedRecommendation(rec)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getRecommendationIcon(rec.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {rec.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getConfidenceColor(rec.confidence)}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {rec.confidence}%
                      </Badge>
                      <Badge className={getCategoryColor(rec.category)}>
                        {rec.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {rec.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <Zap className="w-3 h-3 inline mr-1" />
                      {rec.reason}
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
                        Voir
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Logique pour appliquer la recommandation
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-medium">Comment ça marche ?</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Nos algorithmes IA analysent votre comportement d'achat, vos préférences et votre activité 
            pour vous proposer des recommandations personnalisées en temps réel.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
