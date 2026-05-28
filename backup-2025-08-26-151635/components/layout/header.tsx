"use client"

import { Heart, Search, ShoppingCart, User, ChevronDown, ChevronLeft, ChevronRight, Home, ShoppingBag, Grid, Flame, Sparkles, Store, Headphones, Lock, Truck, LogOut, Settings, CreditCard, Gift, Bell, Package, MapPin, Clock, CheckCircle, X, Share2, Coins, Star, BarChart3, Shield, Trash2, Zap, Smartphone, RefreshCw, Phone, Mail, Minus, Plus, Calculator, Info, Calendar, MessageCircle, MessageSquare, FileText, Download, Copy, Printer, HelpCircle, Save, Globe, ArrowLeft, ArrowRight, Volume2, RotateCcw, AlertTriangle, List, BookOpen, Send, Users, Building, Car, Camera, Music, Gamepad2, Palette, Wrench, Hammer, Drill, Ruler, Microscope, TestTube, Atom, Dna, Leaf, Flower, Sun, Moon, Cloud, Wind, Rainbow, Umbrella, Snowflake, Droplets, Waves, Fish, Bird, Cat, Dog, Rabbit, Mouse, Rat, Turtle, Shell, Diamond, Bone, Eye, Glasses, Shirt, Wallet, Backpack, Briefcase, Bed, Table, Apple, Play, Smile, Paperclip } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { 
  CartService, 
  WishlistService, 
  PointsService, 
  DeliveryService, 
  AuthService, 
  SearchService, 
  NotificationService,
  initializeServices 
} from "@/lib/services"
import { enrichProductWithSpecs } from "@/lib/product-specifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

// Import des composants enfants modulaires
import HeaderCart from "./header-cart"
import HeaderWishlist from "./header-wishlist"
import HeaderUser from "./header-user"
import HeaderCompare from "./header-compare"
import HeaderDelivery from "./header-delivery"

export default function HeaderModular() {
  const pathname = usePathname()
  
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
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    }
  }
  
  // États avec valeurs par défaut
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPoints, setUserPoints] = useState(1000)
  const [pointsValue, setPointsValue] = useState(10000)
  const [withdrawalThreshold] = useState(5000)
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState("fcfa")
  const [showCartModal, setShowCartModal] = useState(false)
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareListLength, setCompareListLength] = useState(0)
  const [isClient, setIsClient] = useState(false)

  // Initialisation des services et mise à jour des états
  useEffect(() => {
    setIsClient(true)
    
    try {
      initializeServices()
      
      // Mettre à jour les états après l'initialisation des services
      setIsLoggedIn(AuthService.isLoggedIn())
      setUserPoints(PointsService.getUserPoints())
      setPointsValue(PointsService.getPointsValue())
      setCartItems(CartService.getCart().length)
      setWishlistItems(WishlistService.getWishlist().length)
      
      // Charger la liste de comparaison
      const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
      setCompareListLength(compareList.length)
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services:', error)
    }
  }, [])



  // Calcul du pourcentage de progression
  const progressPercentage = Math.min((pointsValue / withdrawalThreshold) * 100, 100)

  // Fonction de recherche
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Logique de recherche
      console.log('Recherche:', searchQuery)
    }
  }

  // Fonction pour gérer la comparaison
  const handleAddToCompare = (item: any) => {
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
      if (!compareList.find((p: any) => p.id === item.id)) {
        if (compareList.length >= 4) {
          alert('Vous ne pouvez comparer que 4 produits maximum !')
          return
        }
        compareList.push(item)
        safeLocalStorage.setItem('compareList', JSON.stringify(compareList))
        setCompareListLength(compareList.length)
        NotificationService.showSuccess(`${item.name} ajouté à la comparaison !`)
        // Ouvrir automatiquement le modal de comparaison
        setShowCompareModal(true)
      } else {
        NotificationService.showInfo('Produit déjà dans la comparaison !')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
    }
  }

  const getCompareList = () => {
    try {
      return JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste de comparaison:', error)
      return []
    }
  }

  const removeFromCompare = (productId: number) => {
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
      const updatedList = compareList.filter((item: any) => item.id !== productId)
      safeLocalStorage.setItem('compareList', JSON.stringify(updatedList))
      setCompareListLength(updatedList.length)
      NotificationService.showInfo('Produit retiré de la comparaison')
    } catch (error) {
      console.error('Erreur lors de la suppression de la comparaison:', error)
    }
  }

  // Fonction pour obtenir les produits enrichis avec spécifications techniques
  const getEnrichedCompareList = () => {
    if (!isClient) return []
    
    try {
      const compareList = getCompareList()
      return compareList.map((product: any) => enrichProductWithSpecs(product))
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement des produits:', error)
      return getCompareList()
    }
  }

  const handleLogout = () => {
    if (!isClient) return
    
    try {
      AuthService.logout()
      setIsLoggedIn(false)
      NotificationService.showInfo("Déconnexion réussie")
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const handleWithdrawPoints = () => {
    const withdrawn = PointsService.withdrawPoints()
    if (withdrawn > 0) {
      setUserPoints(PointsService.getUserPoints())
      setPointsValue(PointsService.getPointsValue())
      NotificationService.showSuccess(`Retrait de ${withdrawn} points effectué !`)
    } else {
      NotificationService.showError('Points insuffisants pour le retrait')
    }
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <header className="bg-[#535455] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="animate-pulse bg-gray-600 h-10 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-64 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-48 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-[#535455] text-white fixed-header">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo Probooster */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/logo.png" 
              alt="Probooster Logo" 
              width={120} 
              height={40} 
              className="h-10 w-auto"
              style={{ width: 'auto', height: '40px' }}
              priority
              unoptimized
            />
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-6">
            <div className="relative">
              <Input
                type="search"
                placeholder="Rechercher des produits..."
                className="w-full pl-4 pr-12 py-3 rounded-full bg-white text-black border-0 focus:ring-2 focus:ring-[#ff6600] text-base"
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

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-24 bg-gray-600 border-gray-500 text-white rounded-full px-3 py-2">
                <SelectValue />
                <ChevronDown className="h-4 w-4 ml-1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fcfa">F CFA</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="usd">USD</SelectItem>
              </SelectContent>
            </Select>

            {/* Points Display with Progress Bar */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center space-x-2 text-sm bg-gray-600 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-500 transition-colors duration-300">
                  {/* Icône des pièces dorées avec animation haut-bas alternée */}
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    {/* Première pièce (gauche) - Animation vers le haut */}
                    <div className="absolute left-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0s' }}>
                      1
                    </div>
                    {/* Deuxième pièce (droite) avec checkmark - Animation vers le bas */}
                    <div className="absolute right-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0.75s' }}>
                      ✓
                    </div>
                    {/* Effet de brillance subtil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-yellow-200/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs">
                      {userPoints} pts ({pointsValue.toLocaleString()} F CFA)
                    </span>
                    <div className="w-24 mt-1">
                      <Progress value={progressPercentage} className="h-1 bg-gray-500" />
                      <div className="text-xs text-gray-300 mt-1 whitespace-nowrap">
                        {progressPercentage >= 100
                          ? "Retrait disponible"
                          : `${withdrawalThreshold.toLocaleString()} F CFA requis`}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-[#ff6600]" />
                    <span>Mes Points</span>
                  </DialogTitle>
                  <DialogDescription>
                    Gérez vos points de fidélité et consultez votre solde actuel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white">
                    <CardHeader>
                      <CardTitle className="text-xl">Solde Actuel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{userPoints} points</div>
                      <div className="text-sm opacity-90">Valeur: {pointsValue.toLocaleString()} F CFA</div>
                      <Progress value={progressPercentage} className="h-2 bg-white/20 mt-3" />
                      <div className="text-xs mt-2">
                        {progressPercentage >= 100 
                          ? "✅ Retrait disponible" 
                          : `${withdrawalThreshold - pointsValue} F CFA restants pour le retrait`}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {progressPercentage >= 100 && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleWithdrawPoints}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Retirer mes points
                    </Button>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p>💡 Gagnez des points en partageant des produits sur les réseaux sociaux !</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 group hover:scale-110 transition-transform duration-300 hover:shadow-lg cursor-pointer">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-gray-600 group-hover:bg-[#ff6600] transition-transform duration-300">
                    <User className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 text-white" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Mon Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Mes Commandes</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center space-x-2 text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wishlist - Modal Redesigné */}
            <Dialog open={showWishlistModal} onOpenChange={setShowWishlistModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <Heart className="h-5 w-5 text-red-500 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  {wishlistItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#ff6600] text-xs p-0 flex items-center justify-center animate-bounce">
                      {wishlistItems}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderWishlist />
              </DialogContent>
            </Dialog>

            {/* Panier - Modal Redesigné */}
            <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <ShoppingCart className="h-5 w-5 text-orange-400 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  {cartItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#ff6600] text-xs p-0 flex items-center justify-center animate-bounce">
                      {cartItems}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderCart />
              </DialogContent>
            </Dialog>

            {/* Comparaison - Modal Redesigné */}
            <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  {compareListLength > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-500 text-xs p-0 flex items-center justify-center animate-bounce">
                      {compareListLength}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderCompare />
              </DialogContent>
            </Dialog>

            {/* Livraison - Modal Redesigné */}
            <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <Truck className="h-5 w-5 text-white group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0">
                <HeaderDelivery />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t border-gray-600 bg-gray-700">
          <div className="flex items-center justify-center space-x-12 py-4">
            <Link href="/" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Home className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium">Accueil</span>
            </Link>

            <Link href="/products" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/products" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <div className="relative">
                <Lock className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                  pathname === "/products" ? "text-[#ff6600]" : ""
                }`} style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-xs font-medium">Boutique</span>
            </Link>

            <Link href="/categories" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/categories" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Grid className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/categories" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '4s' }} />
              <span className="text-xs font-medium">Catégories</span>
            </Link>

            <Link href="/best-sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/best-sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Flame className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/best-sellers" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '2.5s' }} />
              <span className="text-xs font-medium">Meilleures ventes</span>
            </Link>

            <Link href="/new-arrivals" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/new-arrivals" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Sparkles className={`h-6 w-6 group-hover:animate-bounce transition-transform duration-200 ${
                pathname === "/new-arrivals" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium group-hover:translate-y-1 transition-transform duration-300">Nouveautés</span>
            </Link>

            <Link href="/sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <div className={`rounded-lg p-2 ${
                pathname === "/sellers" ? "bg-[#ff6600]/20" : "bg-gray-600"
              }`}>
                <Store className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 animate-bounce ${
                  pathname === "/sellers" ? "text-[#ff6600]" : "text-[#ff6600]"
                }`} style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-xs font-medium">Vendeurs</span>
            </Link>

            <Link href="/support" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/support" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Headphones className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/support" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium">Support</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
