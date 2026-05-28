"use client"

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DataSyncIndicatorProps {
  isConnected: boolean
  lastSync: Date | null
  isSyncing: boolean
  error: string | null
  onRefresh: () => void
}

export function DataSyncIndicator({
  isConnected,
  lastSync,
  isSyncing,
  error,
  onRefresh
}: DataSyncIndicatorProps) {
  const [timeSinceLastSync, setTimeSinceLastSync] = useState<string>('')

  useEffect(() => {
    const updateTimeSinceLastSync = () => {
      if (!lastSync) {
        setTimeSinceLastSync('Jamais')
        return
      }

      const now = new Date()
      const diff = now.getTime() - lastSync.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (days > 0) {
        setTimeSinceLastSync(`Il y a ${days} jour${days > 1 ? 's' : ''}`)
      } else if (hours > 0) {
        setTimeSinceLastSync(`Il y a ${hours} heure${hours > 1 ? 's' : ''}`)
      } else if (minutes > 0) {
        setTimeSinceLastSync(`Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`)
      } else {
        setTimeSinceLastSync('À l\'instant')
      }
    }

    updateTimeSinceLastSync()
    const interval = setInterval(updateTimeSinceLastSync, 60000) // Mise à jour toutes les minutes

    return () => clearInterval(interval)
  }, [lastSync])

  const getStatusColor = () => {
    if (error) return 'destructive'
    if (!isConnected) return 'secondary'
    if (isSyncing) return 'default'
    return 'default'
  }

  const getStatusText = () => {
    if (error) return 'Erreur de synchronisation'
    if (!isConnected) return 'Déconnecté'
    if (isSyncing) return 'Synchronisation...'
    return 'Synchronisé'
  }

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="h-4 w-4" />
    if (!isConnected) return <WifiOff className="h-4 w-4" />
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
    return <CheckCircle className="h-4 w-4" />
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-700">Base de données</span>
            </div>
            
            <Badge variant={getStatusColor()} className="text-xs">
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-500">
              Dernière sync: {timeSinceLastSync}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isSyncing || !isConnected}
              className="h-7 px-2 text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
