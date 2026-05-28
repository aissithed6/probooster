"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Star, ShoppingCart, Heart, Coins, Smartphone, Laptop, Headphones } from "lucide-react"

export default function TestHomepagePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Page d'Accueil - Section Produits Populaires
          </h1>
          <p className="text-lg text-gray-600">
            Vérifiez que la section "Produits Populaires" s'affiche correctement sur la page d'accueil
          </p>
        </div>

        {/* Section Produits Populaires - Test */}
        <Card className="mb-8 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-600">
              🏆 Section Produits Populaires
            </CardTitle>
            <p className="text-gray-600">
              Cette section a été ajoutée sur la page d'accueil avant la section "Fonctionnalités Exclusives"
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Produit 1 - iPhone 15 Pro Max */}
              <Card className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                  <Smartphone className="w-20 h-20 text-orange-500" />
                  <Badge className="absolute top-4 right-4 bg-orange-500 text-white border-none">
                    🔥 POPULAIRE
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'} mr-0.5`} />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">(4.8 - 156 avis)</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">iPhone 15 Pro Max 256GB</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    Le dernier iPhone avec puce A17 Pro, caméra 48MP et design en titane
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-orange-500">1 200 000 F CFA</span>
                      <span className="text-sm text-gray-500 line-through ml-2">1 350 000 F CFA</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 font-semibold">12 000 pts</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-3">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter au panier
                    </Button>
                    <Button variant="outline" size="icon" className="border-gray-300">
                      <Heart className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-50">
                    <Coins className="w-4 h-4 mr-2" />
                    Acheter avec 12 000 points
                  </Button>
                </CardContent>
              </Card>

              {/* Produit 2 - MacBook Air M2 */}
              <Card className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                  <Laptop className="w-20 h-20 text-orange-500" />
                  <Badge className="absolute top-4 right-4 bg-green-500 text-white border-none">
                    ⚡ NOUVEAU
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 5 ? 'text-yellow-400' : 'text-gray-300'} mr-0.5`} />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">(4.9 - 89 avis)</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">MacBook Air M2 13.6"</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    Ordinateur portable ultra-léger avec puce M2 et autonomie exceptionnelle
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-orange-500">1 650 000 F CFA</span>
                      <span className="text-sm text-gray-500 line-through ml-2">1 800 000 F CFA</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 font-semibold">16 500 pts</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-3">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter au panier
                    </Button>
                    <Button variant="outline" size="icon" className="border-gray-300">
                      <Heart className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-50">
                    <Coins className="w-4 h-4 mr-2" />
                    Acheter avec 16 500 points
                  </Button>
                </CardContent>
              </Card>

              {/* Produit 3 - AirPods Pro 2 */}
              <Card className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                  <Headphones className="w-20 h-20 text-orange-500" />
                  <Badge className="absolute top-4 right-4 bg-purple-500 text-white border-none">
                    🎧 AUDIO
                  </Badge>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'} mr-0.5`} />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">(4.7 - 234 avis)</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">AirPods Pro 2ème génération</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    Écouteurs sans fil avec réduction de bruit active et audio spatial
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-orange-500">280 000 F CFA</span>
                      <span className="text-sm text-gray-500 line-through ml-2">320 000 F CFA</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600 font-semibold">2 800 pts</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mb-3">
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter au panier
                    </Button>
                    <Button variant="outline" size="icon" className="border-gray-300">
                      <Heart className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-50">
                    <Coins className="w-4 h-4 mr-2" />
                    Acheter avec 2 800 points
                  </Button>
                </CardContent>
              </Card>
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
            <p>3. <strong>Vérifiez les produits</strong> : 3 cartes de produits avec images, prix, points et boutons</p>
            <p>4. <strong>Testez les interactions</strong> : Boutons "Ajouter au panier", "Favoris", "Acheter avec points"</p>
            <p>5. <strong>Vérifiez le bouton</strong> : "Voir tous les produits" qui redirige vers /products</p>
          </CardContent>
        </Card>

        {/* Fonctionnalités Implémentées */}
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Fonctionnalités Implémentées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-green-700">
            <p>• <strong>Section complète</strong> : 3 produits populaires avec design attrayant</p>
            <p>• <strong>Produit 1</strong> : iPhone 15 Pro Max - Badge "🔥 POPULAIRE"</p>
            <p>• <strong>Produit 2</strong> : MacBook Air M2 - Badge "⚡ NOUVEAU"</p>
            <p>• <strong>Produit 3</strong> : AirPods Pro 2 - Badge "🎧 AUDIO"</p>
            <p>• <strong>Fonctionnalités</strong> : Ajouter au panier, Favoris, Acheter avec points</p>
            <p>• <strong>Bouton CTA</strong> : "Voir tous les produits" qui redirige vers /products</p>
            <p>• <strong>Positionnement</strong> : Avant la section "Fonctionnalités Exclusives"</p>
          </CardContent>
        </Card>

        {/* Liens de Test */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🌐 Liens de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>• <strong>Page d'accueil</strong> : <a href="/" className="underline hover:text-blue-800">http://localhost:3000</a></p>
            <p>• <strong>Page Products</strong> : <a href="/products" className="underline hover:text-blue-800">http://localhost:3000/products</a></p>
            <p className="mt-4 text-sm text-blue-600">
              <strong>Note :</strong> La section "Produits Populaires" doit apparaître sur la page d'accueil 
              entre la section principale et "Fonctionnalités Exclusives".
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
