"use client"

import { 
  Heart, 
  Share2, 
  BarChart3, 
  Coins, 
  Star, 
  ShoppingCart, 
  X, 
  Clock, 
  Package, 
  Truck, 
  Shield, 
  Gift,
  Eye,
  Trash2,
  Plus,
  Minus,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Filter,
  Search,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  FileText,
  MessageCircle,
  Facebook,
  Twitter,
  Copy
} from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

// Import des services corrigés
import { 
  WishlistService, 
  CartService, 
  PointsService
} from "@/lib/services"

// Import du hook de notifications moderne
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
import { useRouter } from "next/navigation"
import ShareButtons from "@/components/product/share-buttons"
import { EditableMessagesBanner } from "@/components/messages/EditableMessagesBanner"

export default function HeaderWishlist() {
  const router = useRouter()
  // Hook de notifications moderne
  const { addNotification } = useNotifications()
  
  // États avec valeurs par défaut
  const [isClient, setIsClient] = useState(false)
  const [wishlistItems, setWishlistItems] = useState(0)
  const [wishlistItemsData, setWishlistItemsData] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name' | 'rating'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showStats, setShowStats] = useState(true)
  
  // États pour la comparaison
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareList, setCompareList] = useState<any[]>([])
  const [compareMode, setCompareMode] = useState<'smart' | 'manual'>('smart')
  
  // Initialisation des services et mise à jour des états
  useEffect(() => {
    setIsClient(true)
    
    try {
      // Ajouter des données de test si la wishlist est vide
      const currentWishlist = WishlistService.getWishlist()
      const enableTestData = localStorage.getItem('probooster_enable_test_data') === 'true'
      if (enableTestData && currentWishlist.length === 0) {
        const testProducts = [
          {
            id: 1,
            name: "iPhone 15 Pro Max",
            price: 850000,
            image: "/placeholder.svg",
            seller: "Apple Store",
            sellerId: "vendor-apple-001",
            category: "electronics",
            brand: "apple",
            rating: 4.8,
            addedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: "Samsung Galaxy S24 Ultra",
            price: 750000,
            image: "/placeholder.svg",
            seller: "Samsung Store",
            sellerId: "vendor-samsung-001",
            category: "electronics",
            brand: "samsung",
            rating: 4.7,
            addedAt: new Date().toISOString()
          },
          {
            id: 3,
            name: "Nike Air Jordan 1",
            price: 45000,
            image: "/placeholder.svg",
            seller: "Nike Store",
            sellerId: "vendor-nike-001",
            category: "fashion",
            brand: "nike",
            rating: 4.9,
            addedAt: new Date().toISOString()
          }
        ]
        
        testProducts.forEach(product => {
          WishlistService.addToWishlist(product)
        })
        
        console.log('Données de test ajoutées à la wishlist')
      }
      
      // Mettre à jour les états après l'initialisation des services
      setWishlistItems(WishlistService.getWishlist().length)
      setWishlistItemsData(WishlistService.getWishlist())
      
      console.log('Wishlist initialisée avec', WishlistService.getWishlist().length, 'produits')
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services:', error)
    }
  }, [])

  // Fonctions de gestion des favoris
  const handleRemoveFromWishlist = (itemId: number) => {
    if (!isClient) return
    
    try {
      WishlistService.removeFromWishlist(itemId)
      setWishlistItems(WishlistService.getWishlist().length)
      setWishlistItemsData(WishlistService.getWishlist())
              addNotification({ type: 'info', title: 'Information', message: 'Produit retiré des favoris' })
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error)
    }
  }

  // Fonction pour gérer la comparaison intelligente
  const handleAddToCompare = (item: any) => {
    console.log('handleAddToCompare appelé avec item:', item)
    if (!isClient) {
      console.log('Client non prêt')
      return
    }
    
    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      console.log('Liste de comparaison actuelle:', compareList)
      
      // Vérifier si le produit est déjà dans la comparaison
      if (compareList.find((p: any) => p.id === item.id)) {
        console.log('Produit déjà dans la comparaison')
        addNotification({ type: 'info', title: 'Information', message: 'Produit déjà dans la comparaison !' })
        return
      }
      
      // Vérifier la limite de 4 produits
      if (compareList.length >= 4) {
        console.log('Limite de comparaison atteinte')
        addNotification({ 
  type: 'info', 
  title: 'Information', 
  message: 'Limite de comparaison atteinte - Vous ne pouvez comparer que 4 produits maximum !' 
})
        return
      }
      
      // Logique de comparaison intelligente
      if (compareList.length > 0) {
        console.log('Vérification de la similarité...')
        const isSimilar = compareList.some((existingItem: any) => {
          // Vérifier la catégorie
          if (existingItem.category && item.category && existingItem.category !== item.category) {
            console.log('Catégories différentes:', existingItem.category, 'vs', item.category)
            return false
          }
          
          // Vérifier la marque (utiliser le champ brand s'il existe, sinon extraire du nom)
          let brand1 = existingItem.brand
          let brand2 = item.brand
          
          if (!brand1) {
            const brands = ['apple', 'iphone', 'ipad', 'macbook', 'samsung', 'galaxy', 'sony', 'playstation', 'nike', 'adidas', 'jordan', 'huawei', 'xiaomi', 'oppo', 'vivo']
            brand1 = brands.find(brand => existingItem.name.toLowerCase().includes(brand))
          }
          
          if (!brand2) {
            const brands = ['apple', 'iphone', 'ipad', 'macbook', 'samsung', 'galaxy', 'sony', 'playstation', 'nike', 'adidas', 'jordan', 'huawei', 'xiaomi', 'oppo', 'vivo']
            brand2 = brands.find(brand => item.name.toLowerCase().includes(brand))
          }
          
          if (brand1 && brand2 && brand1 !== brand2) {
            console.log('Marques différentes:', brand1, 'vs', brand2)
            return false
          }
          
          // Vérifier les caractéristiques similaires (prix dans la même fourchette)
          const priceDiff = Math.abs(existingItem.price - item.price)
          const avgPrice = (existingItem.price + item.price) / 2
          const priceSimilarity = priceDiff / avgPrice < 0.8 // 80% de différence max pour être plus flexible
          
          console.log('Similarité des prix:', priceSimilarity ? 'OK' : 'NOK', `(${priceDiff} vs ${avgPrice})`)
          return priceSimilarity
        })
        
        if (!isSimilar) {
          console.log('Produit non similaire')
          addNotification({ 
            type: 'info', 
            title: 'Information', 
            message: 'Ce produit n\'est pas similaire aux produits déjà en comparaison. Seuls les produits de même catégorie et marque peuvent être comparés.' 
          })
          return
        }
      }
      
      // Ajouter le produit à la comparaison
      console.log('Ajout à la comparaison...')
      compareList.push(item)
      localStorage.setItem('compareList', JSON.stringify(compareList))
      
      // Déclencher l'ouverture du modal de comparaison
      console.log('Déclenchement de l\'ouverture du modal de comparaison')
      window.dispatchEvent(new CustomEvent('openCompareModal'))
      
      console.log('Produit ajouté à la comparaison avec succès')
      addNotification({ type: 'success', title: 'Succès', message: `${item.name} ajouté à la comparaison !` })
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
      addNotification({ type: 'error', title: 'Erreur', message: 'Erreur lors de l\'ajout à la comparaison' })
    }
  }

  // Fonction pour ajouter au panier avec vérification
  const handleAddToCart = (itemId: number) => {
    console.log('handleAddToCart appelé avec itemId:', itemId)
    if (!isClient) {
      console.log('Client non prêt')
      return
    }
    
    try {
      const item = wishlistItemsData.find(item => item.id === itemId)
      console.log('Produit trouvé:', item)
      
      if (item) {
        // Vérifier si le produit est déjà dans le panier
        const cartItems = CartService.getCart()
        console.log('Panier actuel:', cartItems)
        
        const alreadyInCart = cartItems.find((cartItem: any) => cartItem.id === itemId)
        
        if (alreadyInCart) {
          console.log('Produit déjà dans le panier')
          addNotification({ type: 'info', title: 'Information', message: 'Ce produit est déjà dans votre panier !' })
          return
        }
        
        // Ajouter au panier
        console.log('Ajout au panier...')
        CartService.addToCart(item)
        
        // Mettre à jour l'état local
        setWishlistItems(WishlistService.getWishlist().length)
        setWishlistItemsData(WishlistService.getWishlist())
        
        console.log('Produit ajouté au panier avec succès')
        addNotification({ type: 'success', title: 'Succès', message: `${item.name} ajouté au panier avec succès !` })
      } else {
        console.log('Produit non trouvé dans wishlistItemsData')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      addNotification({ type: 'error', title: 'Erreur', message: 'Erreur lors de l\'ajout au panier' })
    }
  }

  // Fonction pour gérer les actions rapides sans alert/confirm
  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'addAllToCart':
        if (wishlistItemsData.length === 0) {
          addNotification({ type: 'info', title: 'Information', message: 'Aucun produit à ajouter au panier' })
          return
        }
        
        addNotification({ type: 'info', title: 'Information', message: 'Ajout de tous les produits au panier...' })
        let addedCount = 0
        
        wishlistItemsData.forEach(item => {
          try {
            const cartItems = CartService.getCart()
            const alreadyInCart = cartItems.find((cartItem: any) => cartItem.id === item.id)
            
            if (!alreadyInCart) {
              CartService.addToCart(item)
              addedCount++
            }
          } catch (error) {
            console.error(`Erreur lors de l'ajout de ${item.name}:`, error)
          }
        })
        
        if (addedCount > 0) {
          addNotification({ type: 'success', title: 'Succès', message: `${addedCount} produits ajoutés au panier avec succès !` })
        } else {
          addNotification({ type: 'info', title: 'Information', message: 'Tous les produits sont déjà dans votre panier' })
        }
        break
        
      case 'shareList':
        const shareText = `📋 Ma liste de favoris Probooster (${wishlistItemsData.length} produits)`
        navigator.clipboard.writeText(shareText).then(() => {
          addNotification({ type: 'success', title: 'Succès', message: 'Liste copiée dans le presse-papiers !' })
        }).catch(() => {
          addNotification({ type: 'error', title: 'Erreur', message: 'Erreur lors de la copie dans le presse-papiers' })
        })
        break
        
      case 'exportPDF':
        addNotification({ type: 'info', title: 'Information', message: 'Export PDF en cours de développement...' })
        break
        
      case 'clearList':
        if (wishlistItemsData.length === 0) {
          addNotification({ type: 'info', title: 'Information', message: 'Votre liste de favoris est déjà vide' })
          return
        }
        
        addNotification({ type: 'info', title: 'Information', message: 'Suppression de tous les produits...' })
        
        // Supprimer tous les produits de la wishlist
        wishlistItemsData.forEach(item => {
          try {
            WishlistService.removeFromWishlist(item.id)
          } catch (error) {
            console.error(`Erreur lors de la suppression de ${item.name}:`, error)
          }
        })
        
        // Mettre à jour l'état
        setWishlistItems(0)
        setWishlistItemsData([])
        
        addNotification({ type: 'success', title: 'Succès', message: 'Liste de favoris vidée avec succès !' })
        break
        
      default:
        addNotification({ type: 'info', title: 'Information', message: 'Action non reconnue' })
    }
  }

  // Fonction pour partager un produit
  const handleShare = (item: any, platform: string) => {
    const shareText = `❤️ Découvrez ${item.name} sur Probooster !\n💰 Prix: ${item.price.toLocaleString()} FCFA\n⭐ Note: ${item.rating || 4.5}/5\n🏪 Vendeur: ${item.seller}`
    const shareUrl = `${window.location.origin}/product/${item.id}`
    
    let shareLink = ''
    let platformName = ''
    let platformColor = ''
    
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n🔗 ' + shareUrl)}`
        platformName = 'WhatsApp'
        platformColor = 'green'
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        platformName = 'Facebook'
        platformColor = 'blue'
        break
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=Probooster,Marketplace`
        platformName = 'Twitter'
        platformColor = 'sky'
        break
      case 'copy':
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`).then(() => {
          addNotification({ type: 'success', title: 'Succès', message: `✅ Lien copié dans le presse-papiers !` })
        }).catch(() => {
          addNotification({ type: 'error', title: 'Erreur', message: '❌ Erreur lors de la copie dans le presse-papiers' })
        })
        return
    }
    
    if (shareLink) {
      // Afficher une notification de partage
      addNotification({ type: 'info', title: 'Information', message: `🔄 Ouverture de ${platformName}...` })
      
      // Ouvrir le lien dans une nouvelle fenêtre
      const newWindow = window.open(shareLink, '_blank', 'width=600,height=400')
      
      // Vérifier si la fenêtre s'est ouverte
      if (newWindow) {
        setTimeout(() => {
          addNotification({ type: 'success', title: 'Succès', message: `✅ ${platformName} ouvert avec succès !` })
        }, 1000)
      } else {
        addNotification({ type: 'error', title: 'Erreur', message: `❌ Impossible d'ouvrir ${platformName}. Vérifiez vos bloqueurs de popup.` })
      }
    }
  }

  // Fonction pour filtrer et trier les produits
  const getFilteredAndSortedItems = () => {
    let filtered = wishlistItemsData.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.seller.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })

    // Tri
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.addedAt || Date.now()).getTime()
          bValue = new Date(b.addedAt || Date.now()).getTime()
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        default:
          aValue = 0
          bValue = 0
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }

  // Calcul des statistiques
  const getStats = () => {
    const items = getFilteredAndSortedItems()
    const totalValue = items.reduce((sum, item) => sum + item.price, 0)
    const avgPrice = items.length > 0 ? totalValue / items.length : 0
    const categories = [...new Set(items.map(item => item.category || 'Non catégorisé'))]
    
    return {
      totalItems: items.length,
      totalValue,
      avgPrice,
      categories: categories.length
    }
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const filteredItems = getFilteredAndSortedItems()
  const stats = getStats()

  return (
    <>
      <div className="p-6 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        {/* En-tête moderne avec gradient */}
        <DialogHeader className="mb-8">
          <div className="relative">
            {/* Fond avec effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 rounded-2xl opacity-10"></div>
            <div className="relative bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="h-8 w-8 text-white animate-pulse" />
                    </div>
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      Mes Favoris
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                      Gérez vos produits préférés et créez votre collection personnalisée
                    </DialogDescription>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    {wishlistItems}
                  </div>
                  <div className="text-sm text-gray-600">
                    {wishlistItems === 1 ? 'produit' : 'produits'} favoris
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mb-8">
          <EditableMessagesBanner location="wishlist" />
        </div>

        {/* Statistiques et contrôles */}
        {showStats && wishlistItems > 0 && (
          <div className="mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                   <div className="text-center group hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
                     <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                       <Package className="h-6 w-6 text-white group-hover:animate-bounce transition-all duration-300" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{stats.totalItems}</div>
                     <div className="text-sm text-gray-600">Produits</div>
                   </div>
                  
                                   <div className="text-center group hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
                     <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                       <Coins className="h-6 w-6 text-white group-hover:animate-bounce transition-all duration-300" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                       {stats.totalValue.toLocaleString()}
                     </div>
                     <div className="text-sm text-gray-600">FCFA Total</div>
                   </div>
                  
                                   <div className="text-center group hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
                     <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                       <TrendingUp className="h-6 w-6 text-white group-hover:animate-bounce transition-all duration-300" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                       {Math.round(stats.avgPrice).toLocaleString()}
                     </div>
                     <div className="text-sm text-gray-600">Prix Moyen</div>
                   </div>
                  
                                   <div className="text-center group hover:scale-105 transition-all duration-300 ease-out cursor-pointer">
                     <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                       <Crown className="h-6 w-6 text-white group-hover:animate-bounce transition-all duration-300" />
                     </div>
                     <div className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">{stats.categories}</div>
                     <div className="text-sm text-gray-600">Catégories</div>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        {wishlistItems > 0 && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barre de recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans vos favoris..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm"
                />
              </div>
              
              {/* Filtres et tri */}
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-200 hover:border-orange-300 hover:bg-orange-50 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group">
                      <Filter className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                      Filtres
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                      Toutes les catégories
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedCategory('electronics')}>
                      Électronique
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedCategory('fashion')}>
                      Mode
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedCategory('home')}>
                      Maison
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-200 hover:border-orange-300 hover:bg-orange-50 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group">
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" /> : <SortDesc className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />}
                      {sortBy === 'date' ? 'Date' : sortBy === 'price' ? 'Prix' : sortBy === 'name' ? 'Nom' : 'Note'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => setSortBy('date')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Date d'ajout
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price')}>
                      <Coins className="h-4 w-4 mr-2" />
                      Prix
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name')}>
                      <Package className="h-4 w-4 mr-2" />
                      Nom
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('rating')}>
                      <Star className="h-4 w-4 mr-2" />
                      Note
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                      {sortOrder === 'asc' ? 'Décroissant' : 'Croissant'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Boutons de vue */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-none transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out ${viewMode === 'grid' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-gray-50'}`}
                  >
                    <Grid3X3 className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`rounded-none transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out ${viewMode === 'list' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-gray-50'}`}
                  >
                    <List className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Résultats de recherche */}
            {searchQuery && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    {filteredItems.length} résultat{filteredItems.length !== 1 ? 's' : ''} pour "{searchQuery}"
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                >
                  <X className="h-4 w-4 mr-1 group-hover:animate-pulse transition-all duration-300" />
                  Effacer
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Contenu principal */}
        {wishlistItems === 0 ? (
          // Wishlist vide avec design moderne
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-12 w-12 text-orange-400" />
              </div>
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 to-yellow-200/50 rounded-full animate-ping"></div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Votre liste de favoris est vide</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Commencez à explorer notre catalogue et ajoutez vos produits préférés à cette liste personnalisée
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button 
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                                           onClick={() => {
                         addNotification({ type: 'info', title: 'Information', message: 'Redirection vers le catalogue...' })
                         // Ici vous pouvez ajouter la logique de redirection
                         setTimeout(() => {
                           window.location.href = '/products'
                         }, 1000)
                       }}
                    >
                      <Sparkles className="h-5 w-5 mr-2 group-hover:animate-spin transition-all duration-300" />
                      Découvrir des produits
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 px-8 py-3 rounded-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                                           onClick={() => {
                         addNotification({ type: 'info', title: 'Information', message: 'Chargement des tendances...' })
                         // Ici vous pouvez ajouter la logique pour charger les tendances
                       }}
                    >
                      <TrendingUp className="h-5 w-5 mr-2 group-hover:animate-bounce transition-all duration-300" />
                      Voir les tendances
                    </Button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          // Aucun résultat de recherche
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
            <p className="text-gray-600 mb-6">
              Aucun produit ne correspond à votre recherche "{searchQuery}"
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
            >
              <X className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
              Effacer la recherche
            </Button>
          </div>
        ) : (
          // Contenu de la wishlist avec design moderne
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              // Vue grille
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-200 hover:border-orange-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]">
                    <div className="relative">
                      {/* Image du produit */}
                      <div className="aspect-square overflow-hidden bg-gray-100">
                                               <Image
                         src={item.image || "/placeholder.svg"}
                         alt={item.name}
                         width={300}
                         height={300}
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                       />
                      </div>
                      
                      {/* Badges et actions rapides */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2 py-1 shadow-lg">
                          <Heart className="h-3 w-3 mr-1 fill-current" />
                          Favori
                        </Badge>
                      </div>
                      
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFromWishlist(item.id)}
                          className="h-8 w-8 bg-white/90 hover:bg-red-50 hover:text-red-600 shadow-lg opacity-0 group-hover:opacity-100 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out"
                        >
                          <Trash2 className="h-4 w-4 hover:animate-pulse transition-all duration-300" />
                        </Button>
                      </div>
                      
                      {/* Actions au survol */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                               <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                         <Button
                           size="sm"
                           onClick={() => handleAddToCart(item.id)}
                           className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-2 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group shadow-md hover:shadow-lg"
                         >
                           <ShoppingCart className="h-3 w-3 mr-1 group-hover:animate-bounce transition-all duration-300" />
                           Panier
                         </Button>
                         <Button
                           size="sm"
                           onClick={() => handleAddToCompare(item)}
                           className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group shadow-md hover:shadow-lg"
                         >
                           <BarChart3 className="h-3 w-3 mr-1 group-hover:animate-pulse transition-all duration-300" />
                           Comparer
                         </Button>
                       </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Vendeur: <span 
                            className="cursor-pointer hover:text-blue-600 transition-colors duration-300"
                            onClick={() => router.push(`/seller/${item.seller.toLowerCase().replace(/\s+/g, '-')}`)}
                          >
                            {item.seller}
                          </span>
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-[#ff6600]">
                          {item.price.toLocaleString()} FCFA
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">{item.rating || 4.5}</span>
                        </div>
                      </div>
                      
                      {/* Boutons d'action */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCart(item.id)}
                          className="flex-1 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce transition-all duration-300" />
                          Panier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCompare(item)}
                          className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                        >
                          <BarChart3 className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                          Comparer
                        </Button>
                      </div>
                      
                      {/* Actions supplémentaires */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <ShareButtons
                          productId={item.id.toString()}
                          productName={item.name}
                          vendorId={item.sellerId || 'unknown'}
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group"
                          onClick={() => handleRemoveFromWishlist(item.id)}
                        >
                          <Trash2 className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Vue liste
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-gray-200 hover:border-orange-200 transform hover:scale-[1.01] active:scale-[0.99]">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      {/* Image du produit */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                                                     <Image
                             src={item.image || "/placeholder.svg"}
                             alt={item.name}
                             width={96}
                             height={96}
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                           />
                        </div>
                        <Badge className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2 py-1 shadow-lg">
                          <Heart className="h-3 w-3 mr-1 fill-current" />
                          Favori
                        </Badge>
                      </div>
                      
                      {/* Informations du produit */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Vendeur: {item.seller}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">{item.rating || 4.5}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">Ajouté récemment</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xl font-bold text-[#ff6600]">
                          {item.price.toLocaleString()} FCFA
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col space-y-3">
                        <Button
                          onClick={() => handleAddToCart(item.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group shadow-md hover:shadow-lg"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce transition-all duration-300" />
                          Ajouter au panier
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => handleAddToCompare(item)}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 px-6 py-2 rounded-lg transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                        >
                          <BarChart3 className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                          Comparer
                        </Button>
                        
                        <div className="flex space-x-2">
                          <ShareButtons
                            productId={item.id.toString()}
                            productName={item.name}
                            vendorId={item.sellerId || 'unknown'}
                          />
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group"
                            onClick={() => handleRemoveFromWishlist(item.id)}
                          >
                            <Trash2 className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pied de page avec actions globales */}
      {wishlistItems > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Card className="bg-gradient-to-r from-gray-50 to-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Actions globales sur vos favoris
                  </h3>
                  <p className="text-gray-600">
                    Gérez facilement tous vos produits favoris en une seule fois
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                                         onClick={() => {
                       addNotification({ type: 'info', title: 'Information', message: 'Actualisation en cours...' })
                       // Recharger les données
                       setWishlistItems(WishlistService.getWishlist().length)
                       setWishlistItemsData(WishlistService.getWishlist())
                       setTimeout(() => {
                         addNotification({ type: 'success', title: 'Succès', message: 'Liste actualisée avec succès !' })
                       }, 1000)
                     }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2 group-hover:animate-spin transition-all duration-300" />
                    Actualiser
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                    onClick={() => {
                      if (wishlistItemsData.length === 0) {
                        addNotification({ type: 'info', title: 'Information', message: 'Aucun produit à comparer' })
                        return
                      }
                      
                      if (wishlistItemsData.length > 4) {
                        addNotification({ 
  type: 'info', 
  title: 'Information', 
  message: 'Trop de produits pour la comparaison - Sélectionnez 4 maximum' 
})
                        return
                      }
                      
                      // Logique de comparaison intelligente pour tous les produits
                      const productsToCompare = wishlistItemsData.slice(0, 4)
                      
                      // Vérifier la compatibilité entre les produits
                      let compatibleProducts = [productsToCompare[0]]
                      
                      for (let i = 1; i < productsToCompare.length; i++) {
                        const currentProduct = productsToCompare[i]
                        const isCompatible = compatibleProducts.some(existingProduct => {
                          // Vérifier la catégorie
                          if (existingProduct.category && currentProduct.category && 
                              existingProduct.category !== currentProduct.category) {
                            return false
                          }
                          
                          // Vérifier la marque
                          const brands = ['apple', 'iphone', 'ipad', 'macbook', 'samsung', 'galaxy', 'sony', 'playstation', 'nike', 'adidas', 'jordan', 'huawei', 'xiaomi', 'oppo', 'vivo']
                          const brand1 = brands.find(brand => existingProduct.name.toLowerCase().includes(brand))
                          const brand2 = brands.find(brand => currentProduct.name.toLowerCase().includes(brand))
                          
                          if (brand1 && brand2 && brand1 !== brand2) {
                            return false
                          }
                          
                          // Vérifier la similarité des prix
                          const priceDiff = Math.abs(existingProduct.price - currentProduct.price)
                          const avgPrice = (existingProduct.price + currentProduct.price) / 2
                          return priceDiff / avgPrice < 0.5
                        })
                        
                        if (isCompatible) {
                          compatibleProducts.push(currentProduct)
                        }
                      }
                      
                      if (compatibleProducts.length === 0) {
                        addNotification({ type: 'info', title: 'Information', message: 'Aucun produit compatible trouvé pour la comparaison' })
                        return
                      }
                      
                      // Ajouter les produits compatibles à la comparaison
                      localStorage.setItem('compareList', JSON.stringify(compatibleProducts))
                      
                      // Ouvrir le modal de comparaison
                      window.dispatchEvent(new CustomEvent('openCompareModal'))
                      
                      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '${compatibleProducts.length} produits compatibles ajoutés à la comparaison !' 
})
                    }}
                  >
                    <BarChart3 className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                    Comparer tout
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group shadow-md hover:shadow-lg"
                      >
                        <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                        Actions rapides
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem onClick={() => handleQuickAction('addAllToCart')}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ajouter tous au panier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickAction('shareList')}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager la liste
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQuickAction('exportPDF')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Exporter en PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleQuickAction('clearList')}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Nettoyer la liste
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
                 </div>
       )}
       </div>
       
       {/* Composant de notifications - AJOUTÉ ICI */}
       <NotificationContainer />
     </>
   )
 }
