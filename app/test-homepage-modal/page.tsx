"use client"

import { useState } from "react"
import AdvancedProductCard from "@/components/product/advanced-product-card"
import ProductModal from "@/components/product/product-modal"

export default function TestHomepageModal() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenProductModal = (product: any) => {
    console.log("=== TEST MODAL ===")
    console.log("Produit sélectionné:", product)
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleCloseProductModal = () => {
    setSelectedProduct(null)
    setIsModalOpen(false)
  }

  const testProduct = {
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
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test du Modal de Fiche Produit - Page d'Accueil
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Instructions de Test :</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Cliquez sur l'image du produit ci-dessous</li>
            <li>Le modal de fiche produit devrait s'ouvrir</li>
            <li>Vérifiez que toutes les informations du produit sont affichées</li>
            <li>Testez la fermeture du modal avec le bouton X</li>
          </ol>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Produit de Test :</h2>
          <AdvancedProductCard
            product={testProduct}
            onBuyWithPoints={(product) => console.log("Acheter avec points:", product)}
            onShare={(product, platform) => console.log("Partage:", product.name, platform)}
            onStartChat={(product) => console.log("Chat:", product.name)}
            onCompare={(product) => console.log("Comparer:", product.name)}
            onProductClick={handleOpenProductModal}
          />
        </div>

        {/* Modal de fiche produit */}
        {isModalOpen && selectedProduct && (
          <ProductModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={handleCloseProductModal}
          />
        )}
      </div>
    </div>
  )
}
