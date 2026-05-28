"use client"

import { useState, useEffect } from "react"
import { Zap, Star, TrendingUp, Clock, Heart, ShoppingCart, Gift, Coins, Truck, CreditCard, MessageCircle, Settings, Home, Search, User, Bell, Globe, Palette, HelpCircle, Share2, Bookmark, Download, Upload, RefreshCw, Target, Award, Calendar, MapPin, Phone, Mail, Camera, Video, Music, FileText, Calculator, Clock3, Shield, Lock, Unlock, Eye, EyeOff, Volume2, VolumeX, Wifi, WifiOff, Battery, BatteryCharging, Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function HeaderQuickActions() {
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
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
  }, [])

  const quickActions = [
    {
      id: "navigation",
      title: "Navigation rapide",
      description: "Accédez rapidement aux sections principales",
      icon: Target,
      color: "blue",
      actions: [
        { name: "Accueil", icon: Home, action: () => window.location.href = "/", points: 5 },
        { name: "Recherche", icon: Search, action: () => document.querySelector('input[type="search"]')?.focus(), points: 5 },
        { name: "Profil", icon: User, action: () => document.querySelector('[data-user-menu]')?.click(), points: 5 },
        { name: "Notifications", icon: Bell, action: () => document.querySelector('[data-notifications]')?.click(), points: 5 }
      ]
    },
    {
      id: "shopping",
      title: "Achats express",
      description: "Actions rapides pour vos achats",
      icon: ShoppingCart,
      color: "green",
      actions: [
        { name: "Panier", icon: ShoppingCart, action: () => document.querySelector('[data-cart]')?.click(), points: 10 },
        { name: "Favoris", icon: Heart, action: () => document.querySelector('[data-wishlist]')?.click(), points: 10 },
        { name: "Comparer", icon: TrendingUp, action: () => document.querySelector('[data-compare]')?.click(), points: 15 },
        { name: "Promos", icon: Gift, action: () => document.querySelector('[data-promos]')?.click(), points: 10 }
      ]
    },
    {
      id: "account",
      title: "Gestion de compte",
      description: "Gérez votre profil et vos paramètres",
      icon: User,
      color: "purple",
      actions: [
        { name: "Paramètres", icon: Settings, action: () => document.querySelector('[data-settings]')?.click(), points: 5 },
        { name: "Points", icon: Coins, action: () => document.querySelector('[data-points]')?.click(), points: 5 },
        { name: "Commandes", icon: Clock, action: () => document.querySelector('[data-orders]')?.click(), points: 5 },
        { name: "Livraisons", icon: Truck, action: () => document.querySelector('[data-delivery]')?.click(), points: 5 }
      ]
    },
    {
      id: "support",
      title: "Support et aide",
      description: "Obtenez de l'aide rapidement",
      icon: HelpCircle,
      color: "orange",
      actions: [
        { name: "Chat support", icon: MessageCircle, action: () => document.querySelector('[data-chat]')?.click(), points: 20 },
        { name: "Aide", icon: HelpCircle, action: () => document.querySelector('[data-help]')?.click(), points: 15 },
        { name: "Contact", icon: Phone, action: () => window.open('tel:+22500000000', '_blank'), points: 10 },
        { name: "Email", icon: Mail, action: () => window.open('mailto:support@probooster.com', '_blank'), points: 10 }
      ]
    },
    {
      id: "personalization",
      title: "Personnalisation",
      description: "Adaptez l'interface à vos préférences",
      icon: Palette,
      color: "pink",
      actions: [
        { name: "Thème", icon: Monitor, action: () => document.querySelector('[data-theme]')?.click(), points: 5 },
        { name: "Langue", icon: Globe, action: () => document.querySelector('[data-language]')?.click(), points: 5 },
        { name: "Partage", icon: Share2, action: () => document.querySelector('[data-share]')?.click(), points: 15 },
        { name: "Favoris", icon: Bookmark, action: () => document.querySelector('[data-bookmarks]')?.click(), points: 5 }
      ]
    },
    {
      id: "utilities",
      title: "Utilitaires",
      description: "Outils et raccourcis pratiques",
      icon: Zap,
      color: "yellow",
      actions: [
        { name: "Calculatrice", icon: Calculator, action: () => window.open('https://www.calculator.net/', '_blank'), points: 5 },
        { name: "Horloge", icon: Clock3, action: () => alert(`🕐 Heure actuelle: ${new Date().toLocaleTimeString('fr-FR')}`), points: 5 },
        { name: "Localisation", icon: MapPin, action: () => navigator.geolocation.getCurrentPosition(pos => alert(`📍 Position: ${pos.coords.latitude}, ${pos.coords.longitude}`)), points: 10 },
        { name: "Capture d'écran", icon: Camera, action: () => window.print(), points: 15 }
      ]
    }
  ]

  const recentActions = [
    { name: "Recherche de produits", icon: Search, timestamp: "Il y a 2h", points: 5 },
    { name: "Ajout au panier", icon: ShoppingCart, timestamp: "Il y a 4h", points: 10 },
    { name: "Partage sur Facebook", icon: Share2, timestamp: "Il y a 6h", points: 50 },
    { name: "Chat support", icon: MessageCircle, timestamp: "Il y a 1j", points: 20 },
    { name: "Changement de thème", icon: Palette, timestamp: "Il y a 2j", points: 5 }
  ]

  const favoriteActions = [
    { name: "Recherche rapide", icon: Search, points: 5, shortcut: "Ctrl+K" },
    { name: "Ouvrir le panier", icon: ShoppingCart, points: 10, shortcut: "Ctrl+B" },
    { name: "Voir les favoris", icon: Heart, points: 5, shortcut: "Ctrl+F" },
    { name: "Notifications", icon: Bell, points: 5, shortcut: "Ctrl+N" },
    { name: "Paramètres", icon: Settings, points: 5, shortcut: "Ctrl+P" }
  ]

  const handleActionClick = (action: any) => {
    try {
      action.action()
      
      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + action.points).toString())
      
      // Afficher une confirmation
      alert(`✅ ${action.name} - +${action.points} points gagnés !`)
      
      // Fermer le modal après un délai
      setTimeout(() => {
        setShowQuickActionsModal(false)
      }, 1000)
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action:', error)
      alert(`❌ Erreur lors de l'exécution de ${action.name}`)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Rechercher dans les actions
      const results = quickActions.flatMap(category => 
        category.actions.filter(action => 
          action.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      
      if (results.length > 0) {
        alert(`🔍 ${results.length} action(s) trouvée(s) pour "${searchQuery}"`)
      } else {
        alert(`❌ Aucune action trouvée pour "${searchQuery}"`)
      }
    }
  }

  const filteredActions = selectedCategory === "all" 
    ? quickActions 
    : quickActions.filter(category => category.id === selectedCategory)

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full">
          <Zap className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Dialog open={showQuickActionsModal} onOpenChange={setShowQuickActionsModal}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
            <Zap className="h-5 w-5 group-hover:scale-110 transition-all duration-300" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Actions rapides</DialogTitle>
            <DialogDescription>
              Accédez rapidement aux fonctionnalités principales
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-6 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Zap className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Actions rapides</h2>
                  <p className="text-white/80 text-sm">
                    Accédez rapidement aux fonctionnalités principales et gagnez des points
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-lg font-bold">
                    ⚡ Actions rapides
                  </div>
                  <div className="text-sm text-white/80">
                    Gagnez des points en utilisant les raccourcis
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Rechercher une action rapide..."
                    className="w-full pl-4 pr-12 py-3 rounded-full border-2 focus:ring-2 focus:ring-[#ff6600] focus:border-[#ff6600]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#ff6600] hover:bg-[#e55a00] rounded-full h-10 w-10"
                    onClick={handleSearch}
                  >
                    <Search className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="navigation">Navigation</SelectItem>
                  <SelectItem value="shopping">Achats</SelectItem>
                  <SelectItem value="account">Compte</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="personalization">Personnalisation</SelectItem>
                  <SelectItem value="utilities">Utilitaires</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions rapides principales */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredActions.map((category) => (
                <Card key={category.id} className="border-2 border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full bg-${category.color}-100 flex items-center justify-center`}>
                        <category.icon className={`h-5 w-5 text-${category.color}-600`} />
                      </div>
                      <span>{category.title}</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {category.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          className="h-auto p-3 flex flex-col items-center space-y-2 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => handleActionClick(action)}
                        >
                          <action.icon className="h-5 w-5" />
                          <div className="text-center">
                            <div className="font-medium text-sm">{action.name}</div>
                            <Badge variant="secondary" className="text-xs">
                              +{action.points} pts
                            </Badge>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions récentes et favorites */}
          <div className="p-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Actions récentes */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-800">
                    <Clock className="h-5 w-5" />
                    <span>Actions récentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActions.slice(0, 3).map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex items-center space-x-2">
                          <action.icon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{action.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            +{action.points} pts
                          </Badge>
                          <span className="text-xs text-gray-500">{action.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions favorites */}
              <Card className="border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Star className="h-5 w-5" />
                    <span>Actions favorites</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {favoriteActions.slice(0, 3).map((action, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex items-center space-x-2">
                          <action.icon className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">{action.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            +{action.points} pts
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {action.shortcut}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between p-6 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowQuickActionsModal(false)}>
              Fermer
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              
              <Button 
                onClick={() => window.open('/help/quick-actions', '_blank')}
                className="bg-[#ff6600] hover:bg-[#e55a00]"
              >
                <Zap className="h-4 w-4 mr-2" />
                Voir toutes les actions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


