"use client"

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageCircle, 
  Mail, 
  User, 
  Users,
  Eye,
  Reply,
  Forward,
  Archive,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { DashboardData } from '@/lib/services/dashboard-service'
import { Tables } from '@/lib/supabase'

interface SyncedMessagesListProps {
  data: DashboardData | null
  isLoading: boolean
  onRefresh: () => void
}

export function SyncedMessagesList({ data, isLoading, onRefresh }: SyncedMessagesListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedMessage, setSelectedMessage] = useState<Tables<'user_messages'> | null>(null)

  /**
   * Redirige vers l'onglet "Messagerie interne" existant.
   * Objectif: ne pas ré-implémenter de logique/modales ici pour éviter toute régression.
   */
  const navigateToInternalMessaging = (opts?: { messageId?: string; action?: 'view' | 'reply' | 'forward' }) => {
    const isSellerDashboard = Boolean(pathname && pathname.startsWith('/seller-dashboard'))
    const basePath = isSellerDashboard ? '/seller-dashboard' : '/dashboard'
    const params = new URLSearchParams()
    params.set('tab', 'messaging')
    if (opts?.messageId) params.set('messageId', String(opts.messageId))
    if (opts?.action) params.set('action', opts.action)
    router.push(`${basePath}?${params.toString()}#messaging`)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internal':
        return <Mail className="h-4 w-4 text-blue-600" />
      case 'chat':
        return <MessageCircle className="h-4 w-4 text-green-600" />
      case 'support':
        return <User className="h-4 w-4 text-purple-600" />
      default:
        return <MessageCircle className="h-4 w-4 text-gray-600" />
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Aucun message</p>
            <p className="text-sm">Vous n'avez pas encore de messages</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const unreadCount = data.messages.filter(m => !m.is_read && m.recipient_id === data.user?.id).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages récents
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
          {data.messages.slice(0, 6).map((message) => (
            <div
              key={message.id}
              className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                !message.is_read && message.recipient_id === data.user?.id 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white'
              }`}
              onClick={() => setSelectedMessage(message)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getTypeIcon(message.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {message.subject}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(message.priority)}>
                        {getPriorityText(message.priority)}
                      </Badge>
                      {!message.is_read && message.recipient_id === data.user?.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {message.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(message.created_at)}</span>
                      <span>•</span>
                      <span>{formatTime(message.created_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {message.sender_id === data.user?.id ? (
                          <>
                            <Users className="w-3 h-3" />
                            Envoyé
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3" />
                            Reçu
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigateToInternalMessaging({ messageId: message.id, action: 'view' })
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir
                      </Button>
                      
                      {message.recipient_id === data.user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateToInternalMessaging({ messageId: message.id, action: 'reply' })
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          <Reply className="w-3 h-3 mr-1" />
                          Répondre
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigateToInternalMessaging({ messageId: message.id, action: 'forward' })
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Forward className="w-3 h-3 mr-1" />
                        Transférer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.messages.length > 6 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigateToInternalMessaging()}
            >
              Voir tous les messages ({data.messages.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
