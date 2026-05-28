"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, Star, Gift, Truck, CreditCard, MessageCircle, Settings, Trash2, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function HeaderNotification() {
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [filterType, setFilterType] = useState("all")
  const [showRead, setShowRead] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Fonction utilitaire pour localStorage sécurisé
  const safeLocalStorage = {
    getItem: (key: string, defaultValue: string = '') => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || defaultValue
      }
      return defaultValue
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    }
  }

  // Initialisation
  useEffect(() => {
    setIsClient(true)
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    try {
      const savedNotifications = safeLocalStorage.getItem('notifications', '[]')
      const parsedNotifications = JSON.parse(savedNotifications)
      
      if (parsedNotifications.length === 0) {
        // Créer des notifications d'exemple
        const defaultNotifications = [
          {
            id: 1,
            type: 'success',
            title: 'Commande confirmée',
            message: 'Votre commande #PROB001 a été confirmée et sera expédiée demain.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
            read: false,
            category: 'order',
            priority: 'high'
          },
          {
            id: 2,
            type: 'info',
            title: 'Nouveau produit disponible',
            message: 'Le produit "Smartphone Pro" est maintenant disponible dans votre catégorie préférée.',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
            read: false,
            category: 'product',
            priority: 'medium'
          },
          {
            id: 3,
            type: 'warning',
            title: 'Livraison en retard',
            message: 'Votre livraison #DEL001 est en retard. Nous nous excusons pour ce désagrément.',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
            read: true,
            category: 'delivery',
            priority: 'high'
          },
          {
            id: 4,
            type: 'success',
            title: 'Points gagnés',
            message: 'Félicitations ! Vous avez gagné 50 points pour votre partage sur Facebook.',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8h ago
            read: false,
            category: 'points',
            priority: 'medium'
          },
          {
            id: 5,
            type: 'info',
            title: 'Maintenance prévue',
            message: 'Une maintenance est prévue le 15 décembre de 2h à 4h du matin.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            read: true,
            category: 'system',
            priority: 'low'
          }
        ]
        
        setNotifications(defaultNotifications)
        safeLocalStorage.setItem('notifications', JSON.stringify(defaultNotifications))
      } else {
        setNotifications(parsedNotifications)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
      setNotifications([])
    }
  }

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
    
    // Sauvegarder dans localStorage
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId 
        ? { ...notif, read: true }
        : notif
    )
    safeLocalStorage.setItem('notifications', JSON.stringify(updatedNotifications))
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notif => ({ ...notif, read: true }))
    setNotifications(updatedNotifications)
    safeLocalStorage.setItem('notifications', JSON.stringify(updatedNotifications))
  }

  const deleteNotification = (notificationId: number) => {
    const updatedNotifications = notifications.filter(notif => notif.id !== notificationId)
    setNotifications(updatedNotifications)
    safeLocalStorage.setItem('notifications', JSON.stringify(updatedNotifications))
  }

  const clearAllNotifications = () => {
    setNotifications([])
    safeLocalStorage.setItem('notifications', '[]')
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'order':
        return <CheckCircle className="h-4 w-4" />
      case 'product':
        return <Star className="h-4 w-4" />
      case 'delivery':
        return <Truck className="h-4 w-4" />
      case 'points':
        return <Gift className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      case 'support':
        return <MessageCircle className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'À l\'instant'
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `Il y a ${diffInDays}j`
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filterType !== 'all' && notif.category !== filterType) return false
    if (!showRead && notif.read) return false
    return true
  })

  const unreadCount = notifications.filter(notif => !notif.read).length

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <Bell className="h-5 w-5 group-hover:scale-110 transition-all duration-300" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#ff6600] text-xs p-0 flex items-center justify-center animate-bounce">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>
              Gérez vos notifications et alertes
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Bell className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Notifications</h2>
                  <p className="text-white/80 text-sm">
                    {unreadCount > 0 
                      ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                      : 'Toutes vos notifications sont à jour'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={markAllAsRead}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={clearAllNotifications}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tout effacer
                </Button>
              </div>
            </div>
          </div>

          {/* Filtres et options */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filtrer par catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    <SelectItem value="order">Commandes</SelectItem>
                    <SelectItem value="product">Produits</SelectItem>
                    <SelectItem value="delivery">Livraisons</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="payment">Paiements</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-read"
                    checked={showRead}
                    onCheckedChange={setShowRead}
                  />
                  <label htmlFor="show-read" className="text-sm text-gray-600">
                    Afficher les lues
                  </label>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {filterType === 'all' ? 'Aucune notification' : 'Aucune notification dans cette catégorie'}
                </h3>
                <p className="text-gray-500">
                  {filterType === 'all' 
                    ? 'Vous êtes à jour avec toutes vos notifications !'
                    : 'Essayez de changer de catégorie ou de filtrer différemment.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`border-2 transition-all duration-200 hover:shadow-md cursor-pointer ${
                      notification.read ? 'opacity-75' : 'ring-2 ring-blue-200'
                    } ${getNotificationColor(notification.type)}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  {notification.title}
                                </h4>
                                <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority === 'high' ? 'Élevée' : 
                                   notification.priority === 'medium' ? 'Moyenne' : 'Faible'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <div className="flex items-center space-x-1">
                                    {getCategoryIcon(notification.category)}
                                    <span>
                                      {notification.category === 'order' ? 'Commande' :
                                       notification.category === 'product' ? 'Produit' :
                                       notification.category === 'delivery' ? 'Livraison' :
                                       notification.category === 'points' ? 'Points' :
                                       notification.category === 'payment' ? 'Paiement' :
                                       notification.category === 'support' ? 'Support' :
                                       notification.category === 'system' ? 'Système' : 'Autre'}
                                    </span>
                                  </div>
                                </Badge>
                              </div>
                              
                              <p className="text-gray-700 text-sm mb-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimestamp(notification.timestamp)}</span>
                                </div>
                                
                                {!notification.read && (
                                  <div className="flex items-center space-x-1 text-blue-600">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                    <span>Non lue</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {!notification.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between p-6 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowNotificationModal(false)}>
              Fermer
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
              
              <Button 
                variant="outline"
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Tout effacer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


