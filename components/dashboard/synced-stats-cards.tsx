"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag, 
  Gift, 
  MessageCircle, 
  Share2, 
  TrendingUp, 
  Package,
  Heart,
  CreditCard,
  Users,
  Activity,
  Zap,
  Target
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'

interface SyncedStatsCardsProps {
  data: DashboardData | null
  isLoading: boolean
}

export function SyncedStatsCards({ data, isLoading }: SyncedStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 text-sm">Aucune donnée disponible</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = data.stats

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Commandes */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-blue-700">
            <span>Commandes</span>
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">
            {stats.totalOrders.toLocaleString()}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Total des commandes passées
          </p>
          {data.orders.length > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                Dernière: {new Date(data.orders[0].created_at).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points de fidélité */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-orange-700">
            <span>Points Fidélité</span>
            <Gift className="w-5 h-5 text-orange-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">
            {stats.totalPoints.toLocaleString()}
          </div>
          <p className="text-xs text-orange-600 mt-2">
            Points disponibles
          </p>
          {data.loyaltyPoints && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                Valeur: {data.loyaltyPoints.fcfa_value.toLocaleString()} F CFA
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-green-700">
            <span>Messages</span>
            <MessageCircle className="w-5 h-5 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            {stats.unreadMessages}
          </div>
          <p className="text-xs text-green-600 mt-2">
            Messages non lus
          </p>
          <div className="mt-2">
            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
              Total: {data.messages.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Produits partagés */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-purple-700">
            <span>Produits</span>
            <Package className="w-5 h-5 text-purple-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">
            {stats.totalProducts}
          </div>
          <p className="text-xs text-purple-600 mt-2">
            Produits dans votre boutique
          </p>
          {stats.averageRating > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                Note: {stats.averageRating}/5
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
