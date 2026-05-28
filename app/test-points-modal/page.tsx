"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Star, Flame, Sparkles } from "lucide-react"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"

const testProduct = {
  id: "test-1",
  name: "Smartphone Galaxy Pro Ultra",
  price: 450000,
  pointsPrice: 2250,
  originalPrice: 500000,
  rating: 4.8,
  reviews: 128,
  image: "/placeholder.svg",
  seller: "TechStore CI",
  sharePoints: 75,
  shares: 245,
  inStock: true,
  discount: 10,
  isHot: true,
  isNew: false,
  isLimited: false,
  badges: ["HOT", "BEST SELLER"],
  color: "red"
}

export default function TestPointsModalPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    console.log(`Achat test: ${product.name} avec ${pointsToUse} points`)
    alert(`Achat confirmé ! Produit: ${product.name}, Points utilisés: ${pointsToUse}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Test du Modal d'Achat avec Points
          </h1>
          <p className="text-xl text-gray-600">
            Découvrez toutes les fonctionnalités du modal d'achat avec points
          </p>
        </div>

        {/* Carte produit de démonstration */}
        <Card className="bg-white shadow-2xl rounded-3xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-8 text-white text-center">
            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Coins className="h-16 w-16 text-white animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Modal d'Achat avec Points</h2>
            <p className="text-orange-100 text-lg">
              Interface élégante et professionnelle pour l'achat avec points
            </p>
          </div>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Informations du produit */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{testProduct.name}</h3>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(testProduct.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">{testProduct.rating}/5 ({testProduct.reviews} avis)</span>
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-orange-600">
                    {testProduct.price.toLocaleString()} F CFA
                  </div>
                  <div className="text-lg text-gray-600">
                    <Coins className="h-5 w-5 inline mr-2 text-yellow-500 animate-pulse" />
                    {testProduct.pointsPrice} points
                  </div>
                </div>

                <div className="flex space-x-2">
                  {testProduct.isHot && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Flame className="h-4 w-4" />
                      HOT
                    </span>
                  )}
                  {testProduct.discount > 0 && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      -{testProduct.discount}%
                    </span>
                  )}
                </div>
              </div>

              {/* Fonctionnalités */}
              <div className="space-y-4">
                <h4 className="text-xl font-semibold text-gray-800 mb-4">Fonctionnalités du Modal</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Coins className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-blue-800">Gestion intelligente des points</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-green-800">Calculs automatiques des bonus</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-purple-800">Interface responsive et animée</span>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <Flame className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-orange-800">Animations fluides et élégantes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton de test */}
            <div className="text-center mt-8">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-4 text-lg rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <Coins className="h-6 w-6 mr-3 animate-pulse" />
                Tester le Modal d'Achat avec Points
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
          <CardHeader>
            <CardTitle className="text-blue-800 text-center">
              📋 Instructions de Test
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-blue-700">
              Cliquez sur le bouton ci-dessus pour ouvrir le modal d'achat avec points.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/50 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2">🎯 Test des Points</h5>
                <p className="text-blue-600">Ajustez le slider pour voir les calculs en temps réel</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2">✨ Animations</h5>
                <p className="text-blue-600">Observez les animations fluides et les effets visuels</p>
              </div>
              <div className="bg-white/50 p-4 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2">💳 Achat</h5>
                <p className="text-blue-600">Testez le processus d'achat complet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'achat avec points */}
      <PointsPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={testProduct}
        userPoints={3500}
        onPurchase={handlePurchase}
      />
    </div>
  )
}
