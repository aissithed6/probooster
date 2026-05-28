"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useNotifications } from "@/components/ui/modern-notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Heart, Star, Coins, Flame, Sparkles, Clock, Target, Crown, TrendingUp, Users, Gift, Award, Zap, MessageCircle, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

export default function TestSellerCartPage() {
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addNotification } = useNotifications()

  const testProducts: Product[] = [
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
      inStock: false,
      description: "Écouteurs sans fil avec réduction de bruit active",
      specifications: {
        "Connexion": "Bluetooth 5.0",
        "Autonomie": "6h",
        "Résistance": "IPX4",
        "Compatibilité": "iOS/Android"
      }
    }
  ]

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller: 'TechStore Pro'
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
      seller: 'TechStore Pro'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Seller Cart
          </h1>
          <p className="text-lg text-gray-600">
            Testez les fonctionnalités du bouton "Ajouter au panier" sur la page du vendeur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2">
              <div className="relative overflow-hidden">
                <img
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
                    className={`${isInWishlist(product.id) ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-white'} shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group`}
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
                    
                    <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'text-red-500 fill-current animate-pulse' : 'text-red-500 hover:scale-110'} transition-transform duration-300`} />
                    
                    {isInWishlist(product.id) && (
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
                      addNotification({ 
  type: 'info', 
  title: 'Comparaison', 
          message: `${product.name} ajouté à la comparaison` 
})
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
                  
                  {/* Bouton Message */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                    onClick={(e) => {
                      e.stopPropagation()
                      addNotification({ 
  type: 'info', 
  title: 'Chat', 
  message: 'Ouverture du chat avec le vendeur' 
})
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
                    Vendu par <span className="font-medium text-[#ff6600]">
                      TechStore Pro
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

              <CardContent className="p-6 pt-0 space-y-3">
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
                        addNotification({ 
  type: 'info', 
  title: 'Partage', 
          message: `${product.name} partagé avec succès` 
})
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
                      onClick={() => {
                        addNotification({
                          type: 'info',
                          title: 'Achat avec points',
                          message: 'Modal d\'achat avec points ouvert'
                        })
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
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">🐛 Test des Fonctionnalités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-700">
            <p>• <strong>Bouton "Ajouter au panier"</strong> : Ajoute le produit au panier + notification</p>
            <p>• <strong>Bouton "Favoris"</strong> : Ajoute/retire des favoris + notification</p>
            <p>• <strong>Bouton "Comparer"</strong> : Ajoute à la comparaison + notification</p>
            <p>• <strong>Bouton "Chat"</strong> : Ouvre le chat + notification</p>
            <p>• <strong>Bouton "Partager"</strong> : Partage le produit + notification</p>
            <p>• <strong>Bouton "Acheter avec points"</strong> : Simule l'ouverture du modal</p>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>1. <strong>Testez "Ajouter au panier"</strong> - Le produit doit s'ajouter au panier du header</p>
            <p>2. <strong>Testez "Favoris"</strong> - Le produit doit s'ajouter/retirer des favoris</p>
            <p>3. <strong>Vérifiez les notifications</strong> - Elles doivent s'afficher correctement</p>
            <p>4. <strong>Vérifiez le compteur du panier</strong> - Il doit se mettre à jour</p>
            <p>5. <strong>Testez avec un produit en rupture</strong> - Le bouton doit être désactivé</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
