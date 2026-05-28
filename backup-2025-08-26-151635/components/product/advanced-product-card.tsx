"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Share2, 
  Gift, 
  Clock, 
  Coins, 
  Zap, 
  Crown, 
  Flame,
  Sparkles,
  TrendingUp,
  Target,
  MessageCircle,
  Users,
  Award
} from "lucide-react"
import PointsPurchaseModal from "./points-purchase-modal"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { ProductGlobalChatTrigger } from "@/components/chat"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"

interface Product {
  id: number
  name: string
  price: number
  pointsPrice: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  seller: string
  sharePoints: number
  shares: number
  inStock: boolean
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
}

interface AdvancedProductCardProps {
  product: Product
  onBuyWithPoints: (product: Product) => void
  onShare: (product: Product, platform: string) => void
  onCompare: (product: Product) => void
  onProductClick?: (product: any) => void
}

export default function AdvancedProductCard({
  product,
  onBuyWithPoints,
  onShare,
  onCompare,
  onProductClick
}: AdvancedProductCardProps) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  
  // Hooks pour le panier et la wishlist
  const { addToCart, isInCart, getItemQuantity } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handlePointsPurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    // Simulation d'un achat avec points
    console.log(`Achat du produit ${product.name} avec ${pointsToUse} points`)
    
    // Ici vous pouvez ajouter la logique d'achat réelle
    // Par exemple, appeler une API pour traiter l'achat
    
    // Fermer le modal
    setIsPointsModalOpen(false)
  }

  const openPointsModal = () => {
    setIsPointsModalOpen(true)
  }

  return (
    <Card 
      className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
    >
             <div 
         className="relative overflow-hidden cursor-pointer"
         onClick={() => {
           console.log("AdvancedProductCard - Conteneur image cliqué pour le produit:", product.name);
           if (onProductClick) {
             console.log("AdvancedProductCard - onProductClick disponible, transformation du produit");
             // Transformer le produit simplifié en produit complet pour le modal
             const enrichedProduct = {
               id: product.id,
               name: product.name,
               price: product.price,
               pointsPrice: product.pointsPrice,
               originalPrice: product.originalPrice || product.price,
               rating: product.rating,
               reviews: product.reviews,
               image: product.image,
               images: [product.image],
               seller: {
                 name: product.seller,
                 avatar: "/vendor-avatar.png",
                 rating: product.rating,
                 totalSales: 450,
                 responseTime: "2-4h",
                 location: "Abidjan, CI",
                 phone: "+225 0701234567",
                 email: "contact@probooster.online",
                 joinDate: "2023",
                 memberSince: "1 an",
                 logo: "/placeholder-logo.png"
               },
               description: `Découvrez ${product.name}, un produit exceptionnel avec une qualité premium.`,
               specifications: {
                 "Marque": "Probooster",
                 "Modèle": product.name,
                 "Catégorie": "Électronique",
                 "Garantie": "1 an",
                 "Origine": "Importé"
               },
               features: ["Qualité premium", "Garantie fabricant", "Support client"],
               warranty: "1 an",
               shipping: {
                 cost: Math.floor(product.price * 0.05),
                 time: "3-5 jours",
                 method: "Standard"
               },
               stock: 25,
               sharePoints: product.sharePoints,
               shares: product.shares,
               inStock: product.inStock,
               discount: product.discount,
               isHot: product.isHot,
               isNew: product.isNew,
               isLimited: product.isLimited,
               badges: product.badges,
               color: product.color,
               category: "Électronique",
               tags: ["premium", "qualité", "garantie"],
               relatedProducts: []
             }
             onProductClick(enrichedProduct)
           }
         }}
       >
         <Image
           src={product.image || "/placeholder.svg"}
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
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 animate-pulse shadow-lg">
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
          
          {product.discount > 15 && (
            <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white border-0 animate-pulse shadow-lg">
              <Crown className="h-3 w-3 mr-1 animate-pulse" />
              MEILLEUR PRIX
            </Badge>
          )}
        </div>

        {/* Animated Discount Badge */}
        {product.discount > 0 && (
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
              <span>Seulement 3 restants !</span>
            </div>
          </div>
        )}

        {/* Floating Action Buttons - Positionnés en dessous du badge de réduction */}
        <div className="absolute top-12 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
          {/* Bouton Favori */}
          <Button
            variant="ghost"
            size="icon"
            className={`${isInWishlist ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-white'} shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group`}
            onClick={(e) => {
              e.stopPropagation()
              toggleWishlist(product)
            }}
          >
            {/* Effet de particules */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-pink-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
            </div>
            
            <Heart className={`h-4 w-4 ${isInWishlist ? 'text-red-500 fill-current animate-pulse' : 'text-red-500 hover:scale-110'} transition-all duration-300`} />
            
            {/* Indicateur de statut */}
            {isInWishlist && (
              <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded-full animate-pulse">
                ❤️
              </span>
            )}
          </Button>
          
          {/* Bouton Panier */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
            onClick={(e) => {
              e.stopPropagation()
              addToCart(product)
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
              onCompare(product)
            }}
          >
            {/* Effet de particules */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-violet-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
            </div>
            
            <svg className="h-4 w-4 text-purple-600 hover:scale-110 transition-transform duration-300 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Button>
          
          {/* Bouton Message - Ancien design avec nouveau système de chat */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
            onClick={(e) => {
              e.stopPropagation()
              console.log('🛍️ Bouton chat carte produit cliqué pour:', product.name)
              
              // Ouvrir directement le modal de chat
              setIsChatModalOpen(true)
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
          {/* Indicateur de vente rapide - réduit et placé au-dessus du nom */}
          {product.inStock && (
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-bounce shadow-md inline-flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Vendu 8 fois aujourd'hui !</span>
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
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  {product.originalPrice.toLocaleString()} F CFA
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
              <span className="font-semibold text-gray-700">
                {product.pointsPrice} points
              </span>
            </div>
          </div>

                            <div className="text-sm text-gray-600">
                    Vendu par <span 
                      className="font-medium text-[#ff6600] cursor-pointer hover:text-[#e55a00] transition-colors duration-300"
                      onClick={() => router.push(`/seller/${product.seller.toLowerCase().replace(/\s+/g, '-')}`)}
                    >
                      {product.seller}
                    </span>
                  </div>

          {/* Enhanced Share Info */}
          <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#ff8533]/10 p-3 rounded-xl border border-[#ff6600]/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#ff6600] font-semibold flex items-center">
                <Gift className="h-4 w-4 mr-1 animate-bounce" />
                +{product.sharePoints} points par partage
              </span>
              <span className="text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {product.shares} partages
              </span>
            </div>
          </div>
          
          {/* Triggers d'incitation supplémentaires */}
          {product.discount > 10 && (
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
              onClick={() => addToCart(product)}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="border-2 border-gray-200 hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white rounded-xl transition-all duration-300 min-w-[44px] group animate-pulse relative overflow-hidden">
                  {/* Effet de particules */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  
                  <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 animate-bounce" />
                  

                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 min-w-[200px]">
                <DropdownMenuItem onClick={() => onShare(product, "facebook")} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-all duration-300 group relative overflow-hidden">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Facebook</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">+50 points</span>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onShare(product, "whatsapp")} className="flex items-center space-x-3 p-3 hover:bg-green-50 rounded-lg transition-all duration-300 group relative overflow-hidden">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.815 0 0020.885 3.488"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">WhatsApp</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">+30 points</span>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => onShare(product, "twitter")} className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-all duration-300 group relative overflow-hidden">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-gray-900 group-hover:text-blue-400 transition-colors duration-300">Twitter</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">+40 points</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-full">
            <Button 
              variant="outline" 
              className={`w-full border-2 rounded-xl transition-all duration-300 transform relative overflow-hidden group px-6 py-4 ${
                product.inStock 
                  ? 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] hover:scale-105' 
                  : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                if (product.inStock) {
                  openPointsModal()
                }
              }}
              disabled={!product.inStock}
            >
              {/* Effet de particules - seulement si en stock */}
              {product.inStock && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                  <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.6s' }}></div>
                </div>
              )}
              
              <div className="flex items-center justify-center w-full">
                <Coins className={`h-5 w-5 flex-shrink-0 mr-3 ${product.inStock ? 'animate-pulse text-yellow-600' : 'text-gray-400'}`} />
                <span className="text-sm font-semibold">
                  {product.inStock ? `Acheter avec points (${product.pointsPrice} pts)` : 'Indisponible'}
                </span>
              </div>
            </Button>
          </div>
        </div>
      </CardFooter>

      {/* Modal d'achat avec points */}
      {isPointsModalOpen && (
        <PointsPurchaseModal
          isOpen={isPointsModalOpen}
          onClose={() => setIsPointsModalOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            price: product.price,
            pointsPrice: product.pointsPrice,
            image: product.image,
            rating: product.rating,
            reviews: product.reviews,
            discount: product.discount,
            isHot: product.isHot,
            isNew: product.isNew,
            isLimited: product.isLimited
          }}
          userPoints={2500}
          onPurchase={handlePointsPurchase}
        />
      )}
      
      {/* Modal de chat avec l'ancien design */}
      <LegacyChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        sellerId={`seller-${product.id}`}
        sellerName={product.seller || 'Vendeur Probooster'}
        sellerAvatar="/placeholder-user.jpg"
        product={{
          id: product.id.toString(),
          name: product.name,
          price: product.price,
          image: product.image,
          seller: product.seller
        }}
      />
    </Card>
  )
}
