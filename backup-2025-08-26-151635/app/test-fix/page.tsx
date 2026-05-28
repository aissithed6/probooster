"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Coins, Star, Flame, Sparkles } from "lucide-react"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"
import ProductModal from "@/components/product/product-modal"

const testProduct = {
  id: "test-1",
  name: "Smartphone Galaxy Pro Ultra",
  price: 450000,
  pointsPrice: 4500,
  image: "/placeholder.svg",
  rating: 4.8,
  reviews: 128,
  discount: 10,
  isHot: true,
  isNew: false,
  isLimited: false,
  originalPrice: 500000,
  seller: "TechStore CI",
  sharePoints: 50,
  shares: 245,
  inStock: true,
  badges: ["HOT"],
  color: "red"
}

export default function TestFixPage() {
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  const handlePointsPurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    console.log(`Achat: ${product.name} avec ${pointsToUse} points`)
    alert(`Achat confirmé ! Produit: ${product.name}, Points utilisés: ${pointsToUse}`)
  }

  const handleProductClick = (product: any) => {
    console.log("Clic sur la carte produit - ouverture du modal fiche produit")
    setIsProductModalOpen(true)
  }

  const openPointsModal = (product: any) => {
    console.log("Clic sur le bouton points - ouverture du modal points")
    setIsPointsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          🧪 Test de Correction des Modaux
        </h1>
        
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Test de la Carte Produit
          </h2>
          
          <Card 
            className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2 cursor-pointer"
            onClick={() => handleProductClick(testProduct)}
          >
            <div className="relative overflow-hidden p-6">
              <div className="flex items-start space-x-4">
                <div className="relative w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl overflow-hidden flex-shrink-0">
                  <img
                    src={testProduct.image}
                    alt={testProduct.name}
                    className="w-full h-full object-cover"
                  />
                  {testProduct.discount && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      -{testProduct.discount}%
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {testProduct.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span>{testProduct.rating}/5</span>
                      </div>
                      <span>•</span>
                      <span>{testProduct.reviews} avis</span>
                      {testProduct.isHot && (
                        <>
                          <span>•</span>
                          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            <Flame className="h-3 w-3 inline mr-1" />
                            HOT
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-orange-600">
                      {testProduct.price.toLocaleString()} F CFA
                    </div>
                    <div className="text-lg text-gray-600">
                      <Coins className="h-5 w-5 inline mr-2 text-yellow-500 animate-pulse" />
                      {testProduct.pointsPrice} points
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-2 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] rounded-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group px-6 py-4"
                  onClick={(e) => {
                    e.stopPropagation()
                    openPointsModal(testProduct)
                  }}
                >
                  <div className="flex items-center justify-center w-full">
                    <Coins className="h-5 w-5 animate-pulse flex-shrink-0 text-yellow-600 mr-3" />
                    <span className="text-sm font-semibold text-gray-800">
                      Acheter avec points ({testProduct.pointsPrice} pts)
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Instructions de Test
            </h3>
            <div className="text-blue-700 space-y-2 text-sm">
              <p>1. <strong>Clic sur la carte produit</strong> → Modal fiche produit s'ouvre</p>
              <p>2. <strong>Clic sur "Acheter avec points"</strong> → Modal points s'ouvre (pas de conflit)</p>
              <p>3. <strong>Vérifier</strong> qu'un seul modal s'ouvre à la fois</p>
            </div>
          </div>
        </div>

        {/* Modal d'achat avec points */}
        <PointsPurchaseModal
          isOpen={isPointsModalOpen}
          onClose={() => setIsPointsModalOpen(false)}
          product={testProduct}
          userPoints={5000}
          onPurchase={handlePointsPurchase}
        />

        {/* Modal fiche produit */}
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          product={{
            ...testProduct,
            images: [testProduct.image, testProduct.image, testProduct.image, testProduct.image],
            seller: {
              name: testProduct.seller,
              avatar: "/placeholder-user.jpg",
              rating: testProduct.rating,
              totalSales: 500,
              responseTime: "2-4h",
              location: "Abomey-Calavi, Bénin",
              phone: "+225 07 12 34 56 78",
              email: "contact@techstore.com"
            },
            description: `Découvrez ${testProduct.name}, un produit exceptionnel avec des fonctionnalités avancées et une qualité premium.`,
            specifications: {
              "Marque": "Probooster",
              "Modèle": testProduct.name,
              "Couleur": testProduct.color,
              "Garantie": "1 an",
              "Origine": "Abomey-Calavi, Bénin"
            },
            features: [
              "Qualité premium",
              "Garantie officielle",
              "Livraison rapide",
              "Support client 24/7"
            ],
            warranty: "1 an",
            shipping: {
              cost: 5000,
              time: "2-3 jours",
              method: "Express"
            },
            stock: 25,
            category: "Électronique",
            tags: ["Premium", "Garantie", "Livraison rapide"],
            relatedProducts: []
          }}
        />
      </div>
    </div>
  )
}
