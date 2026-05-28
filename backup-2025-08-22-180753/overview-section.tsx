"use client"

import { useState, useEffect } from 'react'
import { 
  Users, Package, ShoppingCart, DollarSign, 
  TrendingUp, Star, MessageSquare, AlertTriangle,
  CheckCircle, Clock, Eye, Plus, Settings,
  BarChart3, Activity, Target, Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface OverviewProps {
  stats: {
    totalUsers: number
    activeUsers: number
    totalVendors: number
    pendingVendors: number
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    totalPoints: number
    unreadMessages: number
    systemAlerts: number
  }
}

export default function SuperAdminOverview({ stats }: OverviewProps) {
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [quickActions, setQuickActions] = useState<any[]>([])

  useEffect(() => {
    // Simulation des données d'activité récente
    setRecentActivity([
      {
        id: 1,
        type: 'user',
        action: 'Nouveau vendeur inscrit',
        user: 'TechStore Pro',
        time: 'Il y a 5 minutes',
        status: 'pending',
        priority: 'high'
      },
      {
        id: 2,
        type: 'order',
        action: 'Commande livrée validée',
        user: 'Client #12345',
        time: 'Il y a 15 minutes',
        status: 'completed',
        priority: 'medium'
      },
      {
        id: 3,
        type: 'product',
        action: 'Produit signalé',
        user: 'iPhone 15 Pro',
        time: 'Il y a 1 heure',
        status: 'reported',
        priority: 'high'
      },
      {
        id: 4,
        type: 'financial',
        action: 'Retrait points demandé',
        user: 'Vendeur Premium',
        time: 'Il y a 2 heures',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: 5,
        type: 'system',
        action: 'Alerte système détectée',
        user: 'Serveur principal',
        time: 'Il y a 3 heures',
        status: 'alert',
        priority: 'critical'
      }
    ])

    // Actions rapides disponibles
    setQuickActions([
      {
        id: 1,
        title: 'Approuver Vendeurs',
        description: 'Gérer les demandes d\'inscription',
        icon: CheckCircle,
        count: stats.pendingVendors,
        color: 'red',
        action: 'approve-vendors'
      },
      {
        id: 2,
        title: 'Modérer Produits',
        description: 'Vérifier les signalements',
        icon: Package,
        count: 12,
        color: 'orange',
        action: 'moderate-products'
      },
      {
        id: 3,
        title: 'Gérer Commandes',
        description: 'Suivre les livraisons',
        icon: ShoppingCart,
        count: 45,
        color: 'blue',
        action: 'manage-orders'
      },
      {
        id: 4,
        title: 'Configuration',
        description: 'Paramètres système',
        icon: Settings,
        count: 0,
        color: 'gray',
        action: 'settings'
      }
    ])
  }, [stats])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'reported': return 'bg-red-100 text-red-800 border-red-200'
      case 'alert': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />
      case 'order': return <ShoppingCart className="h-4 w-4" />
      case 'product': return <Package className="h-4 w-4" />
      case 'financial': return <DollarSign className="h-4 w-4" />
      case 'system': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la vue d'ensemble */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vue d'Ensemble du Système</h2>
            <p className="text-gray-600 mt-2">
              Supervision en temps réel de tous les aspects de la marketplace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              <Activity className="h-3 w-3 mr-1" />
              Système Opérationnel
            </Badge>
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <Eye className="h-4 w-4 mr-2" />
              Vue Détaillée
            </Button>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card key={action.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${action.color}-100`}>
                  <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                {action.count > 0 && (
                  <Badge variant="outline" className={`border-${action.color}-300 text-${action.color}-700`}>
                    {action.count}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Performance des Utilisateurs
            </CardTitle>
            <CardDescription>
              Statistiques d'engagement et d'activité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taux d'activation</span>
                <span className="text-sm font-medium">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={(stats.activeUsers / stats.totalUsers) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalVendors}</div>
                <div className="text-xs text-blue-600">Vendeurs Total</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalProducts}</div>
                <div className="text-xs text-green-600">Produits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance financière */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Performance Financière
            </CardTitle>
            <CardDescription>
              Revenus et points de fidélité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Chiffre d'affaires</span>
                <span className="text-sm font-medium">
                  {(stats.totalRevenue / 1000000).toFixed(1)}M FCFA
                </span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(stats.totalPoints / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-orange-600">Points en Circulation</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.totalOrders}</div>
                <div className="text-xs text-purple-600">Commandes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente et alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Activité Récente
            </CardTitle>
            <CardDescription>
              Dernières actions et événements du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(activity.priority)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <span className="text-sm font-medium text-gray-900">{activity.action}</span>
                      <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{activity.user}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Voir Toute l'Activité
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alertes et notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertes & Notifications
            </CardTitle>
            <CardDescription>
              Système d'alerte et notifications critiques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Alerte Critique</span>
                </div>
                <p className="text-sm text-red-700">
                  {stats.systemAlerts} alertes système nécessitent une attention immédiate
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">En Attente</span>
                </div>
                <p className="text-sm text-yellow-700">
                  {stats.pendingVendors} vendeurs en attente d'approbation
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Messages</span>
                </div>
                <p className="text-sm text-blue-700">
                  {stats.unreadMessages} messages non lus nécessitent une réponse
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Configurer les Alertes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions d'urgence */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Zap className="h-5 w-5" />
            Actions d'Urgence
          </CardTitle>
          <CardDescription className="text-red-700">
            Accès rapide aux fonctions critiques du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Gérer Alertes
            </Button>
            <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
              <Users className="h-4 w-4 mr-2" />
              Approuver Vendeurs
            </Button>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              <Settings className="h-4 w-4 mr-2" />
              Configuration Système
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
