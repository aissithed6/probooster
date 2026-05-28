"use client"

import { useState, useEffect } from 'react'
import { 
  Bell, AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown,
  Target, Award, Crown, Medal, Zap, Star, Share2, Eye, ShoppingCart
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useNotifications } from '@/components/ui/modern-notification'

// Types pour les notifications
interface RankingNotification {
  id: string
  type: 'success' | 'warning' | 'info' | 'achievement'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  action?: {
    label: string
    onClick: () => void
  }
  metrics?: {
    current: number
    target: number
    unit: string
  }
}

interface RankingAlert {
  id: string
  type: 'milestone' | 'competitor' | 'performance' | 'opportunity'
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  urgency: 'low' | 'medium' | 'high'
  recommendations: string[]
  estimatedValue: string
}

export default function RankingNotifications() {
  const { addNotification } = useNotifications()
  
  const [notifications, setNotifications] = useState<RankingNotification[]>([])
  const [alerts, setAlerts] = useState<RankingAlert[]>([])
  const [showAll, setShowAll] = useState(false)

  // Données mock pour les notifications
  const mockNotifications: RankingNotification[] = [
    {
      id: '1',
      type: 'achievement',
      title: '🏆 1ère place maintenue !',
      message: 'Félicitations ! Vous avez maintenu votre position de leader dans la marketplace.',
      timestamp: '2024-01-15T10:30:00Z',
      isRead: false,
      priority: 'high',
      metrics: {
        current: 1,
        target: 1,
        unit: 'position'
      }
    },
    {
      id: '2',
      type: 'success',
      title: '📈 Performance en hausse',
      message: 'Votre performance a augmenté de 3.2% cette semaine.',
      timestamp: '2024-01-15T09:15:00Z',
      isRead: false,
      priority: 'medium',
      metrics: {
        current: 98.5,
        target: 95,
        unit: '%'
      }
    },
    {
      id: '3',
      type: 'warning',
      title: '⚠️ Attention concurrent',
      message: 'Digital World gagne du terrain. Surveillez vos partages sociaux.',
      timestamp: '2024-01-15T08:45:00Z',
      isRead: false,
      priority: 'high',
      action: {
        label: 'Analyser',
        onClick: () => alert('Analyse de la concurrence')
      }
    },
    {
      id: '4',
      type: 'info',
      title: '📊 Nouveau classement disponible',
      message: 'Le classement de cette semaine est maintenant disponible.',
      timestamp: '2024-01-15T08:00:00Z',
      isRead: true,
      priority: 'low'
    }
  ]

  const mockAlerts: RankingAlert[] = [
    {
      id: '1',
      type: 'milestone',
      title: 'Objectif 1000 vues/jour atteint !',
      description: 'Vous avez dépassé votre objectif de vues quotidiennes. Nouvel objectif recommandé : 1500 vues/jour',
      impact: 'positive',
      urgency: 'medium',
      recommendations: [
        'Maintenir la qualité du contenu',
        'Optimiser les descriptions SEO',
        'Augmenter la fréquence des publications'
      ],
      estimatedValue: '+15% de visibilité'
    },
    {
      id: '2',
      type: 'competitor',
      title: 'Smart Gadgets perd des positions',
      description: 'Votre concurrent direct Smart Gadgets a perdu 2 positions. Opportunité d\'améliorer votre écart.',
      impact: 'positive',
      urgency: 'low',
      recommendations: [
        'Maintenir votre avantage concurrentiel',
        'Analyser leurs faiblesses',
        'Renforcer vos points forts'
      ],
      estimatedValue: '+2% de part de marché'
    },
    {
      id: '3',
      type: 'opportunity',
      title: 'Catégorie Mode : potentiel inexploité',
      description: 'Vous avez le potentiel de grimper de la 3ème à la 1ère place dans la catégorie Mode.',
      impact: 'positive',
      urgency: 'medium',
      recommendations: [
        'Développer votre catalogue Mode',
        'Optimiser les prix de cette catégorie',
        'Lancer des campagnes ciblées'
      ],
      estimatedValue: '+25% de CA Mode'
    }
  ]

  useEffect(() => {
    setNotifications(mockNotifications)
    setAlerts(mockAlerts)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    )
    
    // Ajouter une notification moderne
    const notification = notifications.find(n => n.id === id)
    if (notification) {
      addNotification({
        type: 'success',
        title: 'Notification marquée',
        message: `"${notification.title}" a été marquée comme lue`
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'neutral':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Zap className="w-4 h-4 text-red-500" />
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'À l\'instant'
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    if (diffInHours < 48) return 'Hier'
    return time.toLocaleDateString('fr-FR')
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Header des notifications */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications & Alertes</h2>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Voir moins' : 'Voir tout'}
        </Button>
      </div>

      {/* Notifications en temps réel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span>Notifications en Temps Réel</span>
          </CardTitle>
          <CardDescription>
            Restez informé de vos performances et des opportunités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications
              .filter(n => showAll || !n.isRead)
              .slice(0, showAll ? notifications.length : 5)
              .map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md ${
                    notification.isRead 
                      ? 'border-gray-200 bg-gray-50' 
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {notification.message}
                    </p>
                    
                    {notification.metrics && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progression</span>
                          <span>
                            {notification.metrics.current} / {notification.metrics.target} {notification.metrics.unit}
                          </span>
                        </div>
                        <Progress 
                          value={(notification.metrics.current / notification.metrics.target) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs"
                        >
                          Marquer comme lu
                        </Button>
                      )}
                      
                      {notification.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Exécuter l'action et afficher une notification moderne
                            notification.action?.onClick()
                            addNotification({
                              type: 'info',
                              title: 'Action exécutée',
                              message: `Action "${notification.action.label}" effectuée avec succès`
                            })
                          }}
                          className="text-xs"
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes et opportunités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <span>Alertes & Opportunités</span>
          </CardTitle>
          <CardDescription>
            Découvrez les opportunités d'amélioration et les menaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${getImpactColor(alert.impact)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getUrgencyIcon(alert.urgency)}
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                  </div>
                  
                  <Badge className={`${getImpactColor(alert.impact)}`}>
                    {alert.impact === 'positive' ? 'Opportunité' : 
                     alert.impact === 'negative' ? 'Menace' : 'Info'}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {alert.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recommandations</h4>
                    <ul className="space-y-1">
                      {alert.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center space-x-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Impact estimé</h4>
                    <div className="text-lg font-semibold text-green-600">
                      {alert.estimatedValue}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Basé sur l'analyse des données actuelles
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Urgence:</span>
                    <Badge variant="outline" className="text-xs">
                      {alert.urgency}
                    </Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      addNotification({
                        type: 'success',
                        title: 'Action lancée',
                        message: `Action lancée pour l'alerte "${alert.title}"`
                      })
                    }}
                  >
                    Agir maintenant
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Résumé des notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-gray-500" />
            <span>Résumé des Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.type === 'success' || n.type === 'achievement').length}
              </div>
              <div className="text-sm text-green-600">Succès</div>
            </div>
            
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {notifications.filter(n => n.type === 'warning').length}
              </div>
              <div className="text-sm text-yellow-600">Avertissements</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {notifications.filter(n => n.type === 'info').length}
              </div>
              <div className="text-sm text-blue-600">Informations</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {alerts.filter(a => a.impact === 'positive').length}
              </div>
              <div className="text-sm text-purple-600">Opportunités</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


