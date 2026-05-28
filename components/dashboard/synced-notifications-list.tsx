"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Bell, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle,
  Gift,
  MessageCircle,
  ShoppingBag,
  Coins,
  Eye,
  Check,
  RefreshCw
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { DashboardService } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

interface SyncedNotificationsListProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedNotificationsList({ data, isLoading, onRefresh }: SyncedNotificationsListProps) {
  const [selectedNotification, setSelectedNotification] = useState<Tables<'user_notifications'> | null>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'promotion':
        return <Gift className="h-4 w-4 text-purple-600" />
      case 'message':
        return <MessageCircle className="h-4 w-4 text-indigo-600" />
      case 'order':
        return <ShoppingBag className="h-4 w-4 text-orange-600" />
      case 'points':
        return <Coins className="h-4 w-4 text-amber-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'Basse'
      case 'normal':
        return 'Normale'
      case 'high':
        return 'Haute'
      case 'urgent':
        return 'Urgente'
      default:
        return priority
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`
    if (diffDays < 365) return `Il y a ${Math.ceil(diffDays / 30)} mois`
    return date.toLocaleDateString('fr-FR')
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await DashboardService.markNotificationRead(notificationId, true)
      onRefresh()
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucune notification</p>
            <p className="text-sm">Vous êtes à jour !</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadCount = data.notifications.filter(n => !n.is_read).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications récentes
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
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
        <div className="space-y-3">
          {data.notifications.slice(0, 8).map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
              onClick={() => setSelectedNotification(notification)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getTypeIcon(String((notification as any)?.type ?? 'info'))}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(String((notification as any)?.priority ?? 'normal'))}>
                        {getPriorityText(String((notification as any)?.priority ?? 'normal'))}
                      </Badge>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.created_at)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Marquer lu
                        </Button>
                      )}
                      
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.notifications.length > 8 && (
          <div className="mt-4 text-center">
            <Button variant="outline" className="w-full">
              Voir toutes les notifications ({data.notifications.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
