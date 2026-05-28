"use client"

import { useState, useEffect, use } from "react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useNotifications } from "@/components/ui/modern-notification"
import { 
  ArrowLeft, 
  Star, 
  ShoppingCart, 
  Heart, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Truck, 
  Shield, 
  Award, 
  TrendingUp, 
  Users, 
  Package,
  Filter,
  Search,
  Grid,
  List,
  Eye,
  EyeOff,
  Flame,
  Sparkles,
  Target,
  Crown,
  Coins,
  Gift,
  Zap,
  Share2,
  BarChart3
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChatContext } from "@/lib/chat-context"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"
import ProductModal from "@/components/product/product-modal"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"
// Import supprimé - remplacé par le nouveau système de chat global

interface Product {
  id: number
  name: string
  price: number
  image: string
  category: string
  rating: number
  reviews: number
  inStock: boolean
  discount?: number
  isHot?: boolean
  isNew?: boolean
  isLimited?: boolean
  description: string
  specifications: Record<string, string>
}

interface Seller {
  id: string
  name: string
  avatar: string
  initials: string
  rating: number
  reviews: number
  products: number
  sales: number
  isVerified: boolean
  isPremium: boolean
  badge: string
  badgeColor: string
  avatarColor: string
  description: string
  specialties: string[]
  responseTime: string
  deliveryTime: string
  isOnline: boolean
  location: string
  phone: string
  email: string
  joinedDate: string
  totalProducts: number
  categories: string[]
}

export default function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addNotification } = useNotifications()
  const { openChatSession, createChatSession } = useChatContext()

  const handleStartChat = (product?: Product) => {
    if (seller) {
      // Ouvrir le modal chat avec les informations du vendeur et du produit
      setChatSellerId(seller.id)
      setChatSellerName(seller.name)
      setChatSellerAvatar(seller.avatar)
      if (product) {
        setSelectedProduct(product) // Définir le produit sélectionné pour le chat
      }
      setShowChatModal(true)
      console.log('💬 Chat démarré avec le vendeur:', seller.name, product ? `pour le produit: ${product.name}` : '(chat général)')
    }
  }

  const handleProductClick = (product: Product) => {
    setSelectedProductForModal(product)
    setIsModalOpen(true)
    console.log('🔍 Modal produit ouvert pour:', product.name)
  }
  const [seller, setSeller] = useState<Seller | null>(null)
  const [isGeneralChatOpen, setIsGeneralChatOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popularity")

  const [isLoading, setIsLoading] = useState(true)
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<Product | null>(null)
  
  // États pour le modal chat
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatSellerId, setChatSellerId] = useState<string>('')
  const [chatSellerName, setChatSellerName] = useState<string>('')
  const [chatSellerAvatar, setChatSellerAvatar] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // États pour le modal produit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null)

  // Simuler le chargement des données du vendeur
  useEffect(() => {
    const loadSellerData = async () => {
      setIsLoading(true)
      try {
        // Simulation d'un appel API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockSeller: Seller = {
          id: id,
          name: "TechStore Pro",
          avatar: "/placeholder-user.jpg",
          initials: "TS",
          rating: 4.9,
          reviews: 342,
          products: 250,
          sales: 2150,
          isVerified: true,
          isPremium: true,
          badge: "Premium",
          badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
          avatarColor: "bg-gradient-to-r from-purple-500 to-blue-600",
          description: "Spécialiste en produits technologiques de pointe avec plus de 5 ans d'expérience dans la vente en ligne. Nous proposons les dernières innovations technologiques avec un service client exceptionnel.",
          specialties: ["Smartphones", "Ordinateurs", "Accessoires", "Gaming", "Audio"],
          responseTime: "2h",
          deliveryTime: "24h",
          isOnline: true,
          location: "Abidjan, Côte d'Ivoire",
          phone: "+225 0123456789",
          email: "contact@techstorepro.com",
          joinedDate: "2020",
          totalProducts: 250,
          categories: ["Électronique", "High-Tech", "Gaming", "Accessoires"]
        }
        
        const mockProducts: Product[] = [
          {
            id: 1,
            name: "iPhone 15 Pro Max",
            price: 850000,
            image: "/placeholder.svg",
            category: "Smartphones",
            rating: 4.8,
            reviews: 156,
            inStock: true,
            isNew: true,
            description: "Le dernier iPhone avec des fonctionnalités révolutionnaires",
            specifications: {
              "Écran": "6.7 pouces",
              "Processeur": "A17 Pro",
              "Stockage": "256GB",
              "Caméra": "48MP"
            }
          },
          {
            id: 2,
            name: "MacBook Air M2",
            price: 1200000,
            image: "/placeholder.svg",
            category: "Ordinateurs",
            rating: 4.9,
            reviews: 89,
            inStock: true,
            isHot: true,
            description: "Ordinateur portable ultra-léger avec puce M2",
            specifications: {
              "Écran": "13.6 pouces",
              "Processeur": "M2",
              "RAM": "8GB",
              "Stockage": "512GB"
            }
          },
          {
            id: 3,
            name: "AirPods Pro 2",
            price: 180000,
            image: "/placeholder.svg",
            category: "Accessoires",
            rating: 4.7,
            reviews: 234,
            inStock: true,
            description: "Écouteurs sans fil avec réduction de bruit active",
            specifications: {
              "Connexion": "Bluetooth 5.0",
              "Autonomie": "6h",
              "Résistance": "IPX4",
              "Compatibilité": "iOS/Android"
            }
          }
        ]
        
        setSeller(mockSeller)
        setProducts(mockProducts)
        setFilteredProducts(mockProducts)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSellerData()
  }, [id])

  // Filtrer les produits
  useEffect(() => {
    let filtered = products
    
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    // Trier les produits
    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating)
        break
      case "reviews":
        filtered = [...filtered].sort((a, b) => b.reviews - a.reviews)
        break
      default:
        // Popularité par défaut
        filtered = [...filtered].sort((a, b) => b.reviews - a.reviews)
    }
    
    setFilteredProducts(filtered)
  }, [products, searchQuery, selectedCategory, sortBy])

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller: seller?.name || 'Vendeur Probooster'
    })
    addNotification({ 
      type: 'success', 
      title: 'Produit ajouté', 
      message: `${product.name} a été ajouté au panier` 
    })
  }

  const handleAddToWishlist = (product: Product) => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller: seller?.name || 'Vendeur Probooster'
    })
    
    if (isInWishlist(product.id)) {
      addNotification({ 
        type: 'info', 
        title: 'Produit retiré', 
        message: `${product.name} a été retiré des favoris` 
      })
    } else {
              addNotification({ 
          type: 'success', 
          title: 'Produit ajouté', 
          message: `${product.name} a été ajouté aux favoris` 
        })
    }
  }

  const handleAddToCompare = (product: Product) => {
    try {
      // Récupérer la liste de comparaison existante
      const existingCompareList = localStorage.getItem('compareList')
      let compareList = existingCompareList ? JSON.parse(existingCompareList) : []
      
      // Vérifier si le produit est déjà dans la liste
      if (compareList.find((p: any) => p.id === product.id)) {
        addNotification({ 
          type: 'warning', 
          title: 'Déjà en comparaison', 
          message: `${product.name} est déjà dans votre liste de comparaison` 
        })
        return
      }
      
      // Vérifier la limite de 4 produits
      if (compareList.length >= 4) {
        addNotification({ 
  type: 'warning', 
  title: 'Limite atteinte', 
  message: 'Vous ne pouvez comparer que 4 produits maximum' 
})
        return
      }
      
      // Ajouter le produit à la liste de comparaison
      const productToAdd = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        seller: seller?.name || 'Vendeur Probooster',
        rating: product.rating,
        reviews: product.reviews,
        category: product.category,
        inStock: product.inStock
      }
      
      compareList.push(productToAdd)
      localStorage.setItem('compareList', JSON.stringify(compareList))
      
      // Déclencher un événement personnalisé pour notifier le header
      window.dispatchEvent(new CustomEvent('compareListUpdated', { 
        detail: { compareList, length: compareList.length } 
      }))
      
      addNotification({ 
        type: 'success', 
        title: 'Produit ajouté', 
        message: `${product.name} a été ajouté à la comparaison` 
      })
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le produit à la comparaison'
      })
    }
  }

  const handleCallSeller = () => {
    // Utiliser le protocole tel: pour déclencher l'appel
    if (seller && seller.phone) {
      try {
        // Vérifier si le navigateur supporte le protocole tel:
        if ('protocol' in window.location) {
          window.open(`tel:${seller.phone}`, '_self')
        } else {
          // Fallback pour les navigateurs qui ne supportent pas tel:
          (window.location as any).href = `tel:${seller.phone}`
        }
        console.log(`Appel en cours vers ${seller.phone}`)
      } catch (error) {
        console.error('Erreur lors de l\'appel:', error)
        // Fallback : copier le numéro dans le presse-papiers
        navigator.clipboard.writeText(seller.phone)
        alert(`Numéro copié dans le presse-papiers : ${seller.phone}`)
      }
    } else {
      console.log("Numéro de téléphone non disponible")
      alert("Numéro de téléphone non disponible pour ce vendeur")
    }
  }

  const handleEmailSeller = () => {
    // Utiliser le protocole mailto: pour ouvrir l'email
    if (seller && seller.email) {
      try {
        const subject = encodeURIComponent(`Contact - ${seller.name}`)
        const body = encodeURIComponent(`Bonjour,\n\nJe souhaite vous contacter concernant vos produits.\n\nCordialement,`)
        window.open(`mailto:${seller.email}?subject=${subject}&body=${body}`, '_self')
        console.log(`Email en cours vers ${seller.email}`)
      } catch (error) {
        console.error('Erreur lors de l\'ouverture de l\'email:', error)
        // Fallback : copier l'email dans le presse-papiers
        navigator.clipboard.writeText(seller.email)
        alert(`Email copié dans le presse-papiers : ${seller.email}`)
      }
    } else {
      console.log("Email non disponible")
      alert("Email non disponible pour ce vendeur")
    }
  }

  const handlePointsPurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    // Simulation d'un achat avec points
    console.log(`Achat du produit ${product.name} avec ${pointsToUse} points`)
    
    // Ici vous pouvez ajouter la logique d'achat réelle
    // Par exemple, appeler une API pour traiter l'achat
    
    // Fermer le modal
    setIsPointsModalOpen(false)
    setSelectedProductForPoints(null)
  }

  const openPointsModal = (product: Product) => {
    setSelectedProductForPoints(product)
    setIsPointsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de la boutique...</p>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Vendeur non trouvé</p>
          <Button onClick={() => router.back()} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">


      <div className="container mx-auto px-4 py-8">
        {/* En-tête du vendeur */}
        <div className="bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 rounded-3xl p-8 mb-8 shadow-xl border border-orange-100 animate-fade-in-up">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Avatar et informations principales */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl hover:scale-110 transition-transform duration-500">
                  <AvatarImage src={seller.avatar} alt={seller.name} />
                  <AvatarFallback className={`text-white font-bold text-2xl ${seller.avatarColor} shadow-lg`}>
                    {seller.initials}
                  </AvatarFallback>
                </Avatar>
                {seller.isOnline && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white animate-pulse shadow-lg"></div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <h1 className="text-4xl font-bold text-gray-900 hover:text-orange-600 transition-colors duration-300">
                    {seller.name}
                  </h1>
                  <Badge className={`text-white text-sm font-semibold ${seller.badgeColor} animate-pulse shadow-lg px-3 py-1`}>
                    {seller.badge}
                  </Badge>
                </div>
                
                <p className="text-lg text-gray-600 max-w-2xl">{seller.description}</p>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(seller.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                          } hover:scale-110 transition-transform duration-200`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">
                      {seller.rating} ({seller.reviews} avis)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="h-5 w-5" />
                    <span>{seller.sales.toLocaleString()} ventes</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Statistiques rapides */}
            <div className="flex flex-col space-y-4 lg:ml-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{seller.totalProducts}+</div>
                  <div className="text-sm text-gray-600">Produits</div>
                </div>
                <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{seller.joinedDate}</div>
                  <div className="text-sm text-gray-600">Membre depuis</div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setIsGeneralChatOpen(true)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                >
                  <MessageCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Chat
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleCallSeller}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group"
                >
                  <Phone className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Appeler
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Informations détaillées du vendeur */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Spécialités */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <CardTitle className="text-blue-800 flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                <span>Spécialités</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {seller.specialties.map((specialty, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-white/90 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors font-medium px-3 py-1"
                  >
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informations de contact */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                <span>Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-green-700">
                <MapPin className="h-4 w-4" />
                <span>{seller.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-green-700">
                <Phone className="h-4 w-4" />
                <span>{seller.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-green-700">
                <Mail className="h-4 w-4" />
                <span>{seller.email}</span>
              </div>
              
              {/* Boutons d'action rapide */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCallSeller}
                  className="flex-1 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all duration-300 group"
                >
                  <Phone className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Appeler
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEmailSeller}
                  className="flex-1 border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 transition-all duration-300 group"
                >
                  <Mail className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Email
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setIsGeneralChatOpen(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 group"
                >
                  <MessageCircle className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                  Chat Général
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <CardHeader className="pb-4">
              <CardTitle className="text-purple-800 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Réponse</span>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {seller.responseTime}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Livraison</span>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  {seller.deliveryTime}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-purple-700">Disponibilité</span>
                <Badge className={`${seller.isOnline ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {seller.isOnline ? 'En ligne' : 'Hors ligne'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section des produits */}
        <div className="space-y-6">
          {/* En-tête des produits */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Produits de {seller.name}
              </h2>
              <p className="text-gray-600">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Rechercher un produit..."
                  className="pl-10 w-64 border-2 focus:border-orange-500 transition-all duration-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Filtres */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 border-2 hover:border-orange-500 transition-all duration-300">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {seller.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Tri */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 border-2 hover:border-orange-500 transition-all duration-300">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularité</SelectItem>
                  <SelectItem value="price-low">Prix croissant</SelectItem>
                  <SelectItem value="price-high">Prix décroissant</SelectItem>
                  <SelectItem value="rating">Note</SelectItem>
                  <SelectItem value="reviews">Avis</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Mode d'affichage */}
              <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none border-0 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none border-0 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Grille des produits avec carte produit officielle */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleProductClick(product)}
                >
                  {/* Image du produit avec badges et actions */}
                  <div 
                    className="relative overflow-hidden cursor-pointer"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700"
                    />

                    {/* Animated Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Animated Badges */}
                    <div className="absolute top-3 left-3 flex flex-col space-y-2">
                      {product.isHot && (
                        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 animate-pulse shadow-lg">
                          <Flame className="h-3 w-3 mr-1 animate-bounce" />
                          HOT
                      </Badge>
                    )}
                      {product.isNew && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 animate-pulse shadow-lg">
                          <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                          NEW
                      </Badge>
                    )}
                    {product.isLimited && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 animate-ping shadow-lg">
                          <Clock className="h-3 w-3 mr-1 animate-ping" />
                          LIMITED
                      </Badge>
                    )}
                      
                      {/* Triggers d'incitation supplémentaires */}
                      {product.inStock && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 animate-pulse shadow-lg">
                          <Target className="h-3 w-3 mr-1 animate-bounce" />
                          POPULAIRE
                        </Badge>
                      )}
                      
                      {product.discount && product.discount > 15 && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 animate-pulse shadow-lg">
                          <Crown className="h-3 w-3 mr-1 animate-pulse" />
                          MEILLEUR PRIX
                        </Badge>
                      )}
                  </div>

                    {/* Animated Discount Badge */}
                    {product.discount && product.discount > 0 && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0 animate-bounce shadow-lg">
                        -{product.discount}%
                      </Badge>
                    )}

                    {/* Stock Status et Triggers d'urgence */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <Badge variant="destructive" className="text-lg px-4 py-2 animate-pulse">
                          Rupture de stock
                      </Badge>
                    </div>
                    )}
                    
                    {/* Indicateurs de stock limité */}
                    {product.inStock && (
                      <div className="absolute bottom-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Seulement {Math.floor(Math.random() * 5) + 1} restants !</span>
                        </div>
                        </div>
                    )}

                    {/* Floating Action Buttons */}
                    <div className="absolute top-12 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                      {/* Bouton Favori */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToWishlist(product)
                        }}
                      >
                        {/* Effet de particules */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                      
                        <Heart className="h-4 w-4 text-red-500 hover:scale-110 transition-all duration-300" />
                      </Button>
                      
                      {/* Bouton Panier */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCart(product)
                        }}
                      >
                        {/* Effet de particules */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                    </div>

                        <ShoppingCart className="h-4 w-4 text-green-600 hover:scale-110 transition-transform duration-300 animate-bounce" />
                      </Button>
                      
                      {/* Bouton Comparer */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddToCompare(product)
                        }}
                      >
                        {/* Effet de particules */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-violet-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        
                        <BarChart3 className="h-4 w-4 text-purple-600 hover:scale-110 transition-transform duration-300 animate-pulse" />
                      </Button>
                      
                      {/* Bouton Message */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartChat(product)
                        }}
                      >
                        {/* Effet de particules */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        
                        <MessageCircle className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                        
                        {/* Indicateur de disponibilité */}
                        <span className="absolute -top-1 -right-1 text-xs bg-green-500 text-white px-1 rounded-full animate-pulse">
                          💬
                        </span>
                      </Button>
                    </div>

                    {/* Animated Sparkles */}
                    <div className="absolute inset-0 pointer-events-none">
                      <Sparkles className="absolute top-1/4 left-1/4 h-4 w-4 text-yellow-400 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Sparkles className="absolute top-1/3 right-1/3 h-3 w-3 text-yellow-400 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.5s' }} />
                      <Sparkles className="absolute bottom-1/4 left-1/3 h-4 w-4 text-yellow-400 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '1s' }} />
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Indicateur de vente rapide */}
                      {product.inStock && (
                        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-bounce shadow-md inline-flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Vendu {Math.floor(Math.random() * 5) + 5} fois aujourd'hui !</span>
                        </div>
                      )}
                      
                      <h3 className="font-bold text-xl line-clamp-2 group-hover:text-[#ff6600] transition-colors duration-300">
                        {product.name}
                      </h3>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {product.rating} ({product.reviews})
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-[#ff6600]">
                            {product.price.toLocaleString()} F CFA
                          </span>
                          {product.discount && product.discount > 0 && (
                            <span className="text-sm text-gray-500 line-through">
                              {Math.round(product.price / (1 - product.discount / 100)).toLocaleString()} F CFA
                          </span>
                        )}
                      </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
                          <span className="font-semibold text-gray-700">
                            {Math.round(product.price / 100)} points
                          </span>
                      </div>
                    </div>

                      <div className="text-sm text-gray-600">
                        Vendu par <span 
                          className="font-medium text-[#ff6600] cursor-pointer hover:text-[#e55a00] transition-colors duration-300"
                          onClick={() => router.push(`/seller/${seller.id}`)}
                        >
                          {seller.name}
                        </span>
                      </div>

                      {/* Enhanced Share Info */}
                      <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#ff8533]/10 p-3 rounded-xl border border-[#ff6600]/20">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#ff6600] font-semibold flex items-center">
                            <Gift className="h-4 w-4 mr-1 animate-bounce" />
                            +{Math.floor(Math.random() * 30) + 20} points par partage
                          </span>
                          <span className="text-gray-600 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {Math.floor(Math.random() * 100) + 50} partages
                          </span>
                        </div>
                      </div>
                      
                      {/* Triggers d'incitation supplémentaires */}
                      {product.discount && product.discount > 10 && (
                        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 p-3 rounded-xl border border-green-500/20">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-green-600 font-semibold flex items-center">
                              <Award className="h-4 w-4 mr-1 animate-pulse" />
                              Économisez {product.discount}% aujourd'hui !
                            </span>
                            <span className="text-blue-600 flex items-center">
                              <Zap className="h-4 w-4 mr-1 animate-bounce" />
                              Offre limitée
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Indicateur de confiance */}
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 rounded-xl border border-blue-500/20">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-600 font-semibold flex items-center">
                            <Star className="h-4 w-4 mr-1 text-yellow-500" />
                            {product.rating}/5 ({product.reviews} avis)
                          </span>
                          <span className="text-purple-600 flex items-center">
                            <Crown className="h-4 w-4 mr-1" />
                            Vendeur vérifié
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0 space-y-3">
                    <div className="flex flex-col space-y-3 w-full">
                      <div className="flex space-x-3 w-full">
                      <Button 
                          className="flex-1 bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                        onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                        >
                          {/* Effet de brillance */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                          
                          <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
                          {product.inStock ? "Ajouter au panier" : "Indisponible"}
                          
                          {/* Indicateur d'urgence */}
                          {product.inStock && (
                            <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full animate-pulse">
                              🔥
                            </span>
                          )}
                      </Button>
                      
                      <Button 
                        variant="outline"
                          size="icon"
                          className="border-2 border-gray-200 hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white rounded-xl transition-all duration-300 min-w-[44px] group animate-pulse relative overflow-hidden"
                          onClick={() => {
                            // Fonctionnalité de partage à implémenter
                          }}
                        >
                          {/* Effet de particules */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                          </div>
                          
                          <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 animate-bounce" />
                      </Button>
                    </div>

                      <div className="w-full">
                        <Button 
                          variant="outline" 
                          className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-2 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] rounded-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group px-6 py-4"
                          onClick={(e) => {
                            e.stopPropagation()
                            openPointsModal(product)
                          }}
                        >
                          {/* Effet de particules */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                            <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.6s' }}></div>
                          </div>
                          
                          <div className="flex items-center justify-center w-full">
                            <Coins className="h-5 w-5 animate-pulse flex-shrink-0 text-yellow-600 mr-3" />
                            <span className="text-sm font-semibold text-gray-800">
                              Acheter avec points ({Math.round(product.price / 100)} pts)
                            </span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            // Mode liste avec carte produit officielle
            <div className="space-y-4">
              {filteredProducts.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-0 shadow-md relative overflow-hidden animate-fade-in-up bg-white"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex space-x-4 p-4">
                    {/* Image du produit avec badges */}
                    <div className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* Badges sur l'image */}
                      <div className="absolute top-2 left-2 flex flex-col space-y-1">
                        {product.isHot && (
                          <Badge className="bg-red-500 text-white text-xs px-1 py-0.5">
                            HOT
                          </Badge>
                        )}
                        {product.isNew && (
                          <Badge className="bg-blue-500 text-white text-xs px-1 py-0.5">
                            NEW
                          </Badge>
                        )}
                        {product.discount && product.discount > 0 && (
                          <Badge className="bg-orange-500 text-white text-xs px-1 py-0.5">
                            -{product.discount}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Informations du produit */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors duration-300 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {product.description}
                        </p>
                        <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                          {product.category}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-orange-600">
                            {product.price.toLocaleString()} F CFA
                          </div>
                          <div className="text-sm text-gray-500">
                            {Math.round(product.price / 100)} pts
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                            <span className="text-sm text-gray-600 ml-1">
                              {product.rating} ({product.reviews})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleAddToCart(product)}
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                          Ajouter au panier
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={() => handleAddToWishlist(product)}
                          className="border-gray-300 text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-300 group"
                        >
                          <Heart className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                          Wishlist
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Message si aucun produit */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>
      </div>



      {/* Modal d'achat avec points */}
      {selectedProductForPoints && isPointsModalOpen && (
        <PointsPurchaseModal
          isOpen={isPointsModalOpen}
          onClose={() => {
            setIsPointsModalOpen(false)
            setSelectedProductForPoints(null)
          }}
          product={{
            id: selectedProductForPoints.id,
            name: selectedProductForPoints.name,
            price: selectedProductForPoints.price,
            pointsPrice: Math.round(selectedProductForPoints.price / 100),
            image: selectedProductForPoints.image,
            rating: selectedProductForPoints.rating,
            reviews: selectedProductForPoints.reviews,
            discount: selectedProductForPoints.discount,
            isHot: selectedProductForPoints.isHot,
            isNew: selectedProductForPoints.isNew,
            isLimited: selectedProductForPoints.isLimited
          }}
          userPoints={2500}
          onPurchase={handlePointsPurchase}
        />
      )}

      {/* Modal Fiche Produit */}
      {selectedProductForModal && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedProductForModal(null)
          }}
          product={{
            ...selectedProductForModal,
            seller: {
              name: seller?.name || 'Vendeur',
              avatar: seller?.avatar || '/placeholder-user.jpg',
              logo: seller?.avatar || '/placeholder-user.jpg',
              rating: seller?.rating || 4.5,
              totalSales: seller?.sales || 0,
              responseTime: seller?.responseTime || '2h',
              location: seller?.location || 'Localisation',
              phone: seller?.phone || 'Téléphone',
              email: seller?.email || 'email@example.com',
              joinDate: seller?.joinedDate || '2020',
              memberSince: seller?.joinedDate || '2020'
            }
          } as any}
        />
      )}

      {/* Modal Chat Legacy */}
      <LegacyChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          setSelectedProduct(null)
        }}
        sellerId={chatSellerId}
        sellerName={chatSellerName}
        sellerAvatar={chatSellerAvatar}
        product={selectedProduct}
      />
      
      {/* Chat général avec le vendeur - Intégré au système global */}
      {isGeneralChatOpen && seller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chat avec {seller.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsGeneralChatOpen(false)}
              >
                ✕
              </Button>
            </div>
            <p className="text-gray-600 mb-4">
              Pour discuter avec ce vendeur, utilisez le bouton "Nouveau Chat" dans votre tableau de bord ou le bouton de chat flottant global.
            </p>
            <Button
              onClick={() => {
                setIsGeneralChatOpen(false)
                handleStartChat()
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
            >
              Démarrer le chat
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
