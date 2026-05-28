"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  Settings, 
  Download, 
  Share2,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useDashboardData } from '@/lib/services/dashboard-service'
import { DataSyncIndicator } from './data-sync-indicator'
import { SyncedStatsCards } from './synced-stats-cards'
import { SyncedOrdersList } from './synced-orders-list'
import { SyncedNotificationsList } from './synced-notifications-list'
import { SyncedMessagesList } from './synced-messages-list'
import { SyncedAIRecommendations } from './synced-ai-recommendations'
import { SyncedPromotionsOffers } from './synced-promotions-offers'
import { SyncedPaymentRequests } from './synced-payment-requests'
import { SyncedShopProducts } from './synced-shop-products'
import { SyncedDeliveries } from './synced-deliveries'
import { SyncedAdvancedStats } from './synced-advanced-stats'

interface SyncedDashboardMainProps {
  userId: string
}

export function SyncedDashboardMain({ userId }: SyncedDashboardMainProps) {
  const { data, loading, error, refreshData } = useDashboardData(userId)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (data) {
      setLastSync(new Date())
    }
  }, [data])

  const handleRefresh = async () => {
    await refreshData()
    setLastSync(new Date())
  }

  const handleExportData = (format: 'csv' | 'excel' | 'pdf') => {
    // Logique d'export des données
    console.log(`Exporting data in ${format} format`)
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <DataSyncIndicator
          isConnected={isConnected}
          lastSync={lastSync}
          isSyncing={loading}
          error={error}
          onRefresh={handleRefresh}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Indicateur de synchronisation */}
      <DataSyncIndicator
        isConnected={isConnected}
        lastSync={lastSync}
        isSyncing={loading}
        error={error}
        onRefresh={handleRefresh}
      />

      {/* En-tête du tableau de bord */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Tableau de Bord Synchronisé
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Données en temps réel depuis votre base de données Supabase
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleExportData('csv')}
                className="h-9 px-3"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExportData('pdf')}
                className="h-9 px-3"
              >
                <Share2 className="w-4 h-4 mr-2" />
                PDF
              </Button>
              
              <Button
                onClick={handleRefresh}
                disabled={loading}
                className="h-9 px-4"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="deliveries">Livraisons</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <SyncedStatsCards data={data} isLoading={loading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SyncedAIRecommendations data={data} isLoading={loading} onRefresh={handleRefresh} />
            <SyncedPromotionsOffers data={data} isLoading={loading} onRefresh={handleRefresh} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SyncedPaymentRequests data={data} isLoading={loading} onRefresh={handleRefresh} />
            <SyncedAdvancedStats data={data} isLoading={loading} onRefresh={handleRefresh} />
          </div>
        </TabsContent>

        {/* Commandes */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Gestion des Commandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SyncedOrdersList data={data} isLoading={loading} onRefresh={handleRefresh} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Produits */}
        <TabsContent value="products" className="space-y-6">
          <SyncedShopProducts data={data} isLoading={loading} onRefresh={handleRefresh} />
        </TabsContent>

        {/* Analyses */}
        <TabsContent value="analytics" className="space-y-6">
          <SyncedAdvancedStats data={data} isLoading={loading} onRefresh={handleRefresh} />
        </TabsContent>

        {/* Communications */}
        <TabsContent value="communications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SyncedNotificationsList data={data} isLoading={loading} onRefresh={handleRefresh} />
            <SyncedMessagesList data={data} isLoading={loading} onRefresh={handleRefresh} />
          </div>
        </TabsContent>

        {/* Livraisons */}
        <TabsContent value="deliveries" className="space-y-6">
          <SyncedDeliveries data={data} isLoading={loading} onRefresh={handleRefresh} />
        </TabsContent>
      </Tabs>

      {/* Résumé des performances */}
      {data && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Performance du Tableau de Bord
                </h3>
                <p className="text-green-600 text-sm">
                  Toutes les données sont maintenant synchronisées avec votre base de données Supabase
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {data.orders.length}
                </div>
                <p className="text-sm text-green-600">Commandes</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {data.products.length}
                </div>
                <p className="text-sm text-green-600">Produits</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {data.notifications.length}
                </div>
                <p className="text-sm text-green-600">Notifications</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {data.loyaltyPoints?.points_balance || 0}
                </div>
                <p className="text-sm text-green-600">Points fidélité</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur la synchronisation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">État de la synchronisation</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Ce tableau de bord utilise maintenant des composants synchronisés qui se connectent directement à votre base de données Supabase. 
            Toutes les données mockup ont été remplacées par des données réelles.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
