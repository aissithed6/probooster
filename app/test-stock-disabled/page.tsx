"use client"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useNotifications } from "@/components/ui/modern-notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Heart, Star, Coins, Flame, Sparkles, Clock, Target, Crown, TrendingUp, Users, Gift, Award, Zap, MessageCircle, Share2 } from "lucide-react"
import AdvancedProductCard from "@/components/product/advanced-product-card"
import NewArrivalCard from "@/components/product/new-arrival-card"
import BestSellerCard from "@/components/product/best-seller-card"

interface Product {
  id: number
  name: string
  price: number
  pointsPrice: number
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
  sharePoints: number
  shares: number
}

export default function TestStockDisabledPage() {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addNotification } = useNotifications()

  // Produits de test avec différents statuts de stock
  const testProducts: Product[] = [
    {
      id: 1,
      name: "iPhone 15 Pro Max - EN STOCK",
      price: 850000,
      pointsPrice: 8500,
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
      },
      sharePoints: 50,
      shares: 245
    },
    {
      id: 2,
      name: "MacBook Air M2 - RUPTURE DE STOCK",
      price: 1200000,
      pointsPrice: 12000,
      image: "/placeholder.svg",
      category: "Ordinateurs",
      rating: 4.9,
      reviews: 89,
      inStock: false,
      isHot: true,
      description: "Ordinateur portable ultra-léger avec puce M2",
      specifications: {
        "Écran": "13.6 pouces",
        "Processeur": "M2",
        "RAM": "8GB",
        "Stockage": "512GB"
      },
      sharePoints: 60,
      shares: 189
    },
    {
      id: 3,
      name: "AirPods Pro 2 - EN STOCK",
      price: 180000,
      pointsPrice: 1800,
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
      },
      sharePoints: 30,
      shares: 156
    },
    {
      id: 4,
      name: "iPad Pro 12.9 - RUPTURE DE STOCK",
      price: 950000,
      pointsPrice: 9500,
      image: "/placeholder.svg",
      category: "Tablettes",
      rating: 4.6,
      reviews: 78,
      inStock: false,
      isLimited: true,
      description: "Tablette professionnelle avec puce M2",
      specifications: {
        "Écran": "12.9 pouces",
        "Processeur": "M2",
        "Stockage": "256GB",
        "Connectivité": "WiFi + Cellular"
      },
      sharePoints: 45,
      shares: 98
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

  const handleShare = (product: Product, platform: string) => {
    addNotification({ 
  type: 'info', 
  title: 'Partage', 
          message: `${product.name} partagé sur ${platform}` 
})
  }

  const handleStartChat = (product: Product) => {
    addNotification({
      type: 'info',
      title: 'Chat',
      message: 'Ouverture du chat avec le vendeur'
    })
  }

  const handleCompare = (product: Product) => {
    addNotification({ 
  type: 'info', 
  title: 'Comparaison', 
          message: `${product.name} ajouté à la comparaison` 
})
  }

  const handleBuyWithPoints = (product: Product) => {
    addNotification({
      type: 'info',
      title: 'Achat avec points',
      message: `Modal d'achat avec points ouvert pour ${product.name}`
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Désactivation Bouton "Acheter avec des points"
          </h1>
          <p className="text-lg text-gray-600">
            Vérifiez que le bouton "Acheter avec des points" se désactive automatiquement quand un produit est en rupture de stock
          </p>
        </div>

        {/* Section AdvancedProductCard */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">
              📱 AdvancedProductCard - Test Stock
            </CardTitle>
            <p className="text-gray-600">
              Testez le comportement du bouton "Acheter avec des points" selon le statut du stock
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Prix:</strong> {product.price.toLocaleString()} F CFA</p>
                    <p><strong>Points:</strong> {product.pointsPrice} pts</p>
                    <p><strong>Stock:</strong> 
                      <Badge variant={product.inStock ? "default" : "destructive"} className="ml-2">
                        {product.inStock ? "En Stock" : "Rupture de Stock"}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <AdvancedProductCard
                product={testProducts[0]}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                onShare={handleShare}
                onStartChat={handleStartChat}
                onCompare={handleCompare}
                openPointsModal={handleBuyWithPoints}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section NewArrivalCard */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-600">
              🆕 NewArrivalCard - Test Stock
            </CardTitle>
            <p className="text-gray-600">
              Testez le comportement du bouton "Acheter avec des points" selon le statut du stock
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Prix:</strong> {product.price.toLocaleString()} F CFA</p>
                    <p><strong>Points:</strong> {product.pointsPrice} pts</p>
                    <p><strong>Stock:</strong> 
                      <Badge variant={product.inStock ? "default" : "destructive"} className="ml-2">
                        {product.inStock ? "En Stock" : "Rupture de Stock"}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <NewArrivalCard
                product={testProducts[1]}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                onShare={handleShare}
                onStartChat={handleStartChat}
                onCompare={handleCompare}
                onBuyWithPoints={handleBuyWithPoints}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section BestSellerCard */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-orange-600">
              🏆 BestSellerCard - Test Stock
            </CardTitle>
            <p className="text-gray-600">
              Testez le comportement du bouton "Acheter avec des points" selon le statut du stock
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Prix:</strong> {product.price.toLocaleString()} F CFA</p>
                    <p><strong>Points:</strong> {product.pointsPrice} pts</p>
                    <p><strong>Stock:</strong> 
                      <Badge variant={product.inStock ? "default" : "destructive"} className="ml-2">
                        {product.inStock ? "En Stock" : "Rupture de Stock"}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <BestSellerCard
                product={testProducts[2]}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                onShare={handleShare}
                onStartChat={handleStartChat}
                onCompare={handleCompare}
                onBuyWithPoints={handleBuyWithPoints}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructions de Test */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-700">
            <p>1. <strong>Vérifiez les produits EN STOCK</strong> - Le bouton "Acheter avec des points" doit être actif et afficher le prix en points</p>
            <p>2. <strong>Vérifiez les produits EN RUPTURE</strong> - Le bouton "Acheter avec des points" doit être désactivé et afficher "Indisponible"</p>
            <p>3. <strong>Testez sur toutes les pages</strong> :</p>
            <ul className="ml-6 space-y-1">
              <li>• <strong>/best-sellers</strong> - Bouton désactivé pour produits hors stock</li>
              <li>• <strong>/new-arrivals</strong> - Bouton désactivé pour produits hors stock</li>
              <li>• <strong>/products</strong> - Bouton désactivé pour produits hors stock</li>
            </ul>
            <p>4. <strong>Vérifiez le style visuel</strong> - Boutons désactivés doivent avoir une apparence grisée et `cursor-not-allowed`</p>
          </CardContent>
        </Card>

        {/* Résumé des Fonctionnalités */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">✅ Fonctionnalités Implémentées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>• <strong>Désactivation automatique</strong> : Bouton "Acheter avec des points" se désactive quand `product.inStock = false`</p>
            <p>• <strong>Changement de texte</strong> : Affiche "Indisponible" au lieu du prix en points</p>
            <p>• <strong>Style visuel</strong> : Bouton grisé avec `opacity-60` et `cursor-not-allowed`</p>
            <p>• <strong>Prévention d'action</strong> : `onClick` vérifie `product.inStock` avant d'ouvrir le modal</p>
            <p>• <strong>Particules désactivées</strong> : Effets visuels ne s'affichent que si le produit est en stock</p>
            <p>• <strong>Cohérence globale</strong> : Même comportement sur toutes les pages de produits</p>
          </CardContent>
        </Card>

        {/* Test des Pages */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">🌐 Test des Pages Réelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-green-700">
            <p>• <strong>Page Best Sellers</strong> : <a href="/best-sellers" className="underline hover:text-green-800">http://localhost:3000/best-sellers</a></p>
            <p>• <strong>Page New Arrivals</strong> : <a href="/new-arrivals" className="underline hover:text-green-800">http://localhost:3000/new-arrivals</a></p>
            <p>• <strong>Page Products</strong> : <a href="/products" className="underline hover:text-green-800">http://localhost:3000/products</a></p>
            <p>• <strong>Page Seller</strong> : <a href="/seller/test" className="underline hover:text-green-800">http://localhost:3000/seller/test</a></p>
            <p className="mt-4 text-sm text-green-600">
              <strong>Note :</strong> Visitez ces pages pour vérifier que le bouton "Acheter avec des points" se désactive correctement 
              pour tous les produits en rupture de stock.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
