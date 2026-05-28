"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import PointsPurchaseModal from "@/components/product/points-purchase-modal"

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
  isLimited: false
}

export default function TestModalSimplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handlePurchase = (product: any, usePoints: boolean, pointsToUse: number) => {
    console.log(`Achat: ${product.name} avec ${pointsToUse} points`)
    alert(`Achat confirmé ! Produit: ${product.name}, Points utilisés: ${pointsToUse}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          🧪 Test Simple du Modal
        </h1>
        
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {testProduct.name}
          </h2>
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {testProduct.price.toLocaleString()} F CFA
          </div>
          <div className="text-gray-600">
            {testProduct.pointsPrice} points
          </div>
        </div>
        
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-4 text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          🎯 Tester le Modal
        </Button>

        <PointsPurchaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={testProduct}
          userPoints={5000}
          onPurchase={handlePurchase}
        />
      </div>
    </div>
  )
}
