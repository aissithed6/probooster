"use client"

import { useState, useEffect } from 'react'
import { 
  Users, Package, ShoppingCart, DollarSign, 
  TrendingUp, Settings, Bell, MessageSquare,
  Star, Gift, Target, BarChart3, Shield,
  Globe, Zap, Database, Activity, Eye,
  Plus, Search, Filter, MoreHorizontal,
  CheckCircle, AlertTriangle, Clock,
  Heart, Share2, CreditCard, Truck,
  FileText, Lock, Mail, Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

// Composants des sections
import SuperAdminOverview from '@/components/super-admin/overview-section'
import UserManagement from '@/components/super-admin/user-management'
import ProductManagement from '@/components/super-admin/product-management'
import OrderManagement from '@/components/super-admin/order-management'
import FinancialManagement from '@/components/super-admin/financial-management'
import MarketingPromotions from '@/components/super-admin/marketing-promotions'
import LoyaltyPoints from '@/components/super-admin/loyalty-points'
import MessagingChat from '@/components/super-admin/messaging-chat'
import ReviewsReputation from '@/components/super-admin/reviews-reputation'
import NotificationsAlerts from '@/components/super-admin/notifications-alerts'
import GlobalSettings from '@/components/super-admin/global-settings'
import AutomationTriggers from '@/components/super-admin/automation-triggers'
import AdvancedAnalytics from '@/components/super-admin/advanced-analytics'
import DesignUX from '@/components/super-admin/design-ux'

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)

  // États globaux pour le super admin
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalVendors: 0,
    pendingVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalPoints: 0,
    unreadMessages: 0,
    systemAlerts: 0
  })

  // Chargement des statistiques globales
  useEffect(() => {
    const loadGlobalStats = async () => {
      setIsLoading(true)
      try {
        // Simulation de chargement des données
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setGlobalStats({
          totalUsers: 15420,
          activeUsers: 12850,
          totalVendors: 1250,
          pendingVendors: 45,
          totalProducts: 45680,
          totalOrders: 8920,
          totalRevenue: 125000000,
          totalPoints: 45600000,
          unreadMessages: 156,
          systemAlerts: 8
        })
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGlobalStats()
  }, [])

  // Configuration des sections avec icônes et descriptions
  const sections = [
    {
      id: 'overview',
      title: 'Vue d\'Ensemble',
      icon: BarChart3,
      description: 'Tableau de bord principal et KPIs',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'users',
      title: 'Gestion Utilisateurs',
      icon: Users,
      description: 'CRUD, approbations, rôles et permissions',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'products',
      title: 'Gestion Produits',
      icon: Package,
      description: 'Catalogue, création, édition et modération',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'orders',
      title: 'Commandes & Ventes',
      icon: ShoppingCart,
      description: 'Suivi des commandes et paiements',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'financial',
      title: 'Gestion Financière',
      icon: DollarSign,
      description: 'Commissions, points et retraits',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      id: 'marketing',
      title: 'Marketing & Promos',
      icon: Target,
      description: 'Campagnes, coupons et offres',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'loyalty',
      title: 'Points & Fidélité',
      icon: Star,
      description: 'Système de fidélité et récompenses',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'messaging',
      title: 'Messagerie & Chat',
      icon: MessageSquare,
      description: 'Modération et synchronisation',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'reviews',
      title: 'Avis & Réputation',
      icon: Star,
      description: 'Modération et gestion des avis',
      color: 'from-amber-500 to-amber-600'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Alertes et notifications push',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'settings',
      title: 'Configuration',
      icon: Settings,
      description: 'Paramètres globaux et sécurité',
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'automation',
      title: 'Automatisation',
      icon: Zap,
      description: 'Déclencheurs et règles automatiques',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      id: 'analytics',
      title: 'Analyses',
      icon: Activity,
      description: 'Statistiques et rapports avancés',
      color: 'from-violet-500 to-violet-600'
    },
    {
      id: 'design',
      title: 'Design & UX',
      icon: Eye,
      description: 'Interface et expérience utilisateur',
      color: 'from-rose-500 to-rose-600'
    }
  ]

  // Fonction pour rendre le contenu de la section active
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return <SuperAdminOverview stats={globalStats} />
      case 'users':
        return <UserManagement />
      case 'products':
        return <ProductManagement />
      case 'orders':
        return <OrderManagement />
      case 'financial':
        return <FinancialManagement />
      case 'marketing':
        return <MarketingPromotions />
      case 'loyalty':
        return <LoyaltyPoints />
      case 'messaging':
        return <MessagingChat />
      case 'reviews':
        return <ReviewsReputation />
      case 'notifications':
        return <NotificationsAlerts />
      case 'settings':
        return <GlobalSettings />
      case 'automation':
        return <AutomationTriggers />
      case 'analytics':
        return <AdvancedAnalytics />
      case 'design':
        return <DesignUX />
      default:
        return <SuperAdminOverview stats={globalStats} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête du tableau de bord */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tableau de Bord Super Administrateur</h1>
                <p className="text-sm text-gray-600">Gestion totale et contrôle exhaustif de la marketplace</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {globalStats.systemAlerts} Alertes
              </Badge>
              <Badge variant="outline" className="border-blue-300 text-blue-700">
                <MessageSquare className="h-3 w-3 mr-1" />
                {globalStats.unreadMessages} Messages
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques globales en temps réel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Utilisateurs Actifs</p>
                  <p className="text-2xl font-bold text-blue-900">{globalStats.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-blue-700">Sur {globalStats.totalUsers.toLocaleString()} total</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold text-green-900">{(globalStats.totalRevenue / 1000000).toFixed(1)}M FCFA</p>
                  <p className="text-xs text-green-700">+12.5% ce mois</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Points en Circulation</p>
                  <p className="text-2xl font-bold text-orange-900">{(globalStats.totalPoints / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-orange-700">Fidélité active</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Commandes en Cours</p>
                  <p className="text-2xl font-bold text-purple-900">{globalStats.totalOrders.toLocaleString()}</p>
                  <p className="text-xs text-purple-700">Ce mois</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Vendeurs en Attente</p>
                  <p className="text-2xl font-bold text-red-900">{globalStats.pendingVendors}</p>
                  <p className="text-xs text-red-700">Approbation requise</p>
                </div>
                <Package className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Layout principal avec barre latérale et contenu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex gap-6">
          {/* Barre latérale gauche */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections d'Administration</h3>
              
              <div className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${
                        isActive 
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg` 
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : `bg-gradient-to-r ${section.color} text-white`
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                            {section.title}
                          </p>
                          <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            {section.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {/* En-tête de la section active */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {(() => {
                    const activeSectionData = sections.find(s => s.id === activeSection)
                    const IconComponent = activeSectionData?.icon
                    return (
                      <>
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${activeSectionData?.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{activeSectionData?.title}</h2>
                      </>
                    )
                  })()}
                </div>
                <p className="text-gray-600">{sections.find(s => s.id === activeSection)?.description}</p>
              </div>

              {/* Contenu de la section */}
              <div className="min-h-[600px]">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
