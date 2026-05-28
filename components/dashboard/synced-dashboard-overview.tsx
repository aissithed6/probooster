"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap,
  RefreshCw,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react'
import { DataSyncIndicator } from './data-sync-indicator'
import { SyncedStatsCards } from './synced-stats-cards'
import { SyncedOrdersList } from './synced-orders-list'
import { SyncedNotificationsList } from './synced-notifications-list'
import { SyncedMessagesList } from './synced-messages-list'
import { DashboardData } from '@/lib/services/dashboard-service'

interface SyncedDashboardOverviewProps {
  data: DashboardData | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

export function SyncedDashboardOverview({
  data,
  isLoading,
  error,
  onRefresh
}: SyncedDashboardOverviewProps) {
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    if (!isLoading && !error) {
      setLastSync(new Date())
      setIsConnected(true)
    } else if (error) {
      setIsConnected(false)
    }
  }, [isLoading, error])

  const getConnectionStatus = () => {
    if (error) return false
    if (isLoading) return true // Considérer comme connecté pendant le chargement
    return isConnected
  }

  return (
    <div className="space-y-6">
      {/* Indicateur de synchronisation */}
      <DataSyncIndicator
        isConnected={getConnectionStatus()}
        lastSync={lastSync}
        isSyncing={isLoading}
        error={error}
        onRefresh={onRefresh}
      />

      {/* Statistiques synchronisées */}
      <SyncedStatsCards data={data} isLoading={isLoading} />

      {/* Section des données en temps réel */}
      <Card className="border-l-4 border-l-green-500 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Activity className="w-5 h-5" />
            Données en Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-green-100 rounded-full">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Base de données</p>
                <p className="text-xs text-gray-500">
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </p>
              </div>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? (
                  <Wifi className="w-3 h-3 mr-1" />
                ) : (
                  <WifiOff className="w-3 h-3 mr-1" />
                )}
                {isConnected ? 'En ligne' : 'Hors ligne'}
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-blue-100 rounded-full">
                <RefreshCw className={`w-5 h-5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Synchronisation</p>
                <p className="text-xs text-gray-500">
                  {isLoading ? 'En cours...' : 'À jour'}
                </p>
              </div>
              <Badge variant={isLoading ? 'default' : 'secondary'}>
                {isLoading ? 'Sync...' : 'Synchro'}
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <div className="p-2 bg-purple-100 rounded-full">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Performance</p>
                <p className="text-xs text-gray-500">
                  {data ? 'Optimale' : 'En cours...'}
                </p>
              </div>
              <Badge variant={data ? 'default' : 'secondary'}>
                {data ? 'OK' : '...'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille des composants synchronisés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commandes synchronisées */}
        <SyncedOrdersList 
          data={data} 
          isLoading={isLoading} 
          onRefresh={onRefresh} 
        />

        {/* Notifications synchronisées */}
        <SyncedNotificationsList 
          data={data} 
          isLoading={isLoading} 
          onRefresh={onRefresh} 
        />
      </div>

      {/* Messages synchronisés */}
      <SyncedMessagesList 
        data={data} 
        isLoading={isLoading} 
        onRefresh={onRefresh} 
      />

      {/* Section de résumé des données */}
      {data && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-5 h-5" />
              Résumé des Données Synchronisées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {data.orders.length}
                </div>
                <p className="text-sm text-gray-600">Commandes</p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {data.notifications.length}
                </div>
                <p className="text-sm text-gray-600">Notifications</p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {data.messages.length}
                </div>
                <p className="text-sm text-gray-600">Messages</p>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">
                  {data.products.length}
                </div>
                <p className="text-sm text-gray-600">Produits</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Dernière mise à jour: {lastSync?.toLocaleString('fr-FR')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="h-8 px-3"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message d'erreur si applicable */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <TrendingDown className="w-5 h-5" />
              <span className="font-medium">Erreur de synchronisation</span>
            </div>
            <p className="text-sm text-red-600 mt-2">{error}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
