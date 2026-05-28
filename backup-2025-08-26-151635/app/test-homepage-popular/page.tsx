"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Star, ShoppingCart, Heart, Coins, Smartphone, Laptop, Headphones } from "lucide-react"
import AdvancedProductCard from "@/components/product/advanced-product-card"

export default function TestHomepagePopularPage() {
  // Fonctions de test pour les produits populaires
  const handleBuyWithPoints = (product: any) => {
    console.log(`Test - Achat avec points pour ${product.name}`);
    alert(`Test - Ouverture du modal d'achat avec points pour ${product.name}`);
  };

  const handleShare = (product: any, platform: string) => {
    console.log(`Test - Partage de ${product.name} sur ${platform}`);
    alert(`Test - Partage de ${product.name} sur ${platform}`);
  };

  const handleStartChat = (product: any) => {
    console.log(`Test - Chat avec le vendeur de ${product.name}`);
    alert(`Test - Ouverture du chat avec le vendeur de ${product.name}`);
  };

  const handleCompare = (product: any) => {
    console.log(`Test - Comparaison de ${product.name}`);
    alert(`Test - Ajout de ${product.name} à la comparaison`);
  };

  // Produits de test identiques à ceux de la page d'accueil
  const popularProducts = [
    {
      id: 1,
      name: "iPhone 15 Pro Max 256GB",
      price: 1200000,
      pointsPrice: 12000,
      originalPrice: 1350000,
      rating: 4.8,
      reviews: 156,
      image: "/placeholder.svg",
      seller: "Apple Store Premium",
      sharePoints: 100,
      shares: 89,
      inStock: true,
      discount: 11,
      isHot: true,
      isNew: false,
      isLimited: false,
      badges: ["🔥 Bestseller", "⚡ Livraison Express", "🎁 Cadeau Inclus"],
      color: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      name: "MacBook Air M2 13.6 pouces",
      price: 1650000,
      pointsPrice: 16500,
      originalPrice: 1800000,
      rating: 4.9,
      reviews: 89,
      image: "/placeholder.svg",
      seller: "Tech Innovation",
      sharePoints: 85,
      shares: 67,
      inStock: true,
      discount: 8,
      isHot: true,
      isNew: true,
      isLimited: false,
      badges: ["🥈 Top Vente", "💎 Premium", "⚡ Livraison Express"],
      color: "from-green-500 to-emerald-600"
    },
    {
      id: 3,
      name: "AirPods Pro 2ème génération",
      price: 280000,
      pointsPrice: 2800,
      originalPrice: 320000,
      rating: 4.7,
      reviews: 234,
      image: "/placeholder.svg",
      seller: "Audio Premium",
      sharePoints: 75,
      shares: 156,
      inStock: true,
      discount: 12,
      isHot: false,
      isNew: false,
      isLimited: true,
      badges: ["🎧 Audio Pro", "📱 Compatible iOS/Android", "⚡ Livraison Express"],
      color: "from-purple-500 to-pink-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Section Produits Populaires - Page d'Accueil
          </h1>
          <p className="text-lg text-gray-600">
            Vérifiez que la section "Produits Populaires" utilise bien le composant AdvancedProductCard
          </p>
        </div>

        {/* Section Produits Populaires - Test */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">
              🏆 Section Produits Populaires - AdvancedProductCard
            </CardTitle>
            <p className="text-gray-600">
              Cette section utilise maintenant le même composant que les autres pages de produits
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popularProducts.map((product) => (
                <AdvancedProductCard
                  key={product.id}
                  product={product}
                  onBuyWithPoints={handleBuyWithPoints}
                  onShare={handleShare}
                  onStartChat={handleStartChat}
                  onCompare={handleCompare}
                />
              ))}
            </div>
            
            {/* Bouton "Voir tous les produits" */}
            <div className="text-center mt-12">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-4">
                Voir tous les produits
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions de Test */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-700">
            <p>1. <strong>Vérifiez la page d'accueil</strong> : Allez sur <a href="/" className="underline hover:text-yellow-800">http://localhost:3000</a></p>
            <p>2. <strong>Localisez la section</strong> : Cherchez "🏆 Produits Populaires" avant "Fonctionnalités Exclusives"</p>
            <p>3. <strong>Vérifiez le composant</strong> : Les cartes utilisent maintenant AdvancedProductCard</p>
            <p>4. <strong>Testez les fonctionnalités</strong> : Toutes les fonctionnalités des autres pages sont disponibles</p>
            <p>5. <strong>Vérifiez la cohérence</strong> : Même design et comportement que /products</p>
          </CardContent>
        </Card>

        {/* Fonctionnalités Implémentées */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Fonctionnalités Implémentées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-green-700">
            <p>• <strong>Composant unifié</strong> : Utilise AdvancedProductCard comme les autres pages</p>
            <p>• <strong>Fonctionnalités complètes</strong> : Ajouter au panier, Favoris, Acheter avec points</p>
            <p>• <strong>Hooks intégrés</strong> : useCart et useWishlist fonctionnent automatiquement</p>
            <p>• <strong>Design cohérent</strong> : Même apparence que /products, /best-sellers, /new-arrivals</p>
            <p>• <strong>Interactions</strong> : Partage, Chat, Comparaison, Modal produit</p>
            <p>• <strong>Bouton CTA</strong> : "Voir tous les produits" qui redirige vers /products</p>
          </CardContent>
        </Card>

        {/* Comparaison avec les autres pages */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🔄 Cohérence avec les Autres Pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>• <strong>Page Products</strong> : <a href="/products" className="underline hover:text-blue-800">http://localhost:3000/products</a> - Même composant</p>
            <p>• <strong>Page Best Sellers</strong> : <a href="/best-sellers" className="underline hover:text-blue-800">http://localhost:3000/best-sellers</a> - Même composant</p>
            <p>• <strong>Page New Arrivals</strong> : <a href="/new-arrivals" className="underline hover:text-blue-800">http://localhost:3000/new-arrivals</a> - Même composant</p>
            <p className="mt-4 text-sm text-blue-600">
              <strong>Note :</strong> Toutes les pages utilisent maintenant le même composant AdvancedProductCard 
              avec les mêmes fonctionnalités et le même design.
            </p>
          </CardContent>
        </Card>

        {/* Test des fonctionnalités */}
        <Card className="mt-6 bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-800">🧪 Test des Fonctionnalités</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-purple-700">
            <p>• <strong>Ajouter au panier</strong> : Cliquez sur le bouton "Ajouter au panier" - doit ajouter au panier</p>
            <p>• <strong>Favoris</strong> : Cliquez sur le bouton cœur - doit ajouter/retirer des favoris</p>
            <p>• <strong>Acheter avec points</strong> : Cliquez sur "Acheter avec points" - doit ouvrir le modal</p>
            <p>• <strong>Partage</strong> : Cliquez sur le bouton de partage - doit afficher les options</p>
            <p>• <strong>Chat</strong> : Cliquez sur le bouton de chat - doit ouvrir le chat</p>
            <p>• <strong>Comparaison</strong> : Cliquez sur le bouton de comparaison - doit ajouter à la comparaison</p>
            <p>• <strong>Modal produit</strong> : Cliquez sur l'image ou le nom - doit ouvrir le modal produit</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
