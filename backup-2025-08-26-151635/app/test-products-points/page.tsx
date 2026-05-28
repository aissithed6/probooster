"use client"

import { useState } from "react"
import ProductsPage from "../products/page"

export default function TestProductsPointsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="text-center py-8 bg-white shadow-sm">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🧪 Test de la Page Produits
        </h1>
        <p className="text-lg text-gray-600">
          Testez la fonctionnalité d'achat avec points sur la page des produits
        </p>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-800 mb-2">Instructions de Test :</h3>
          <ul className="text-sm text-blue-700 space-y-1 text-left">
            <li>• <strong>Clic sur une carte produit</strong> → Modal fiche produit</li>
            <li>• <strong>Clic sur "Acheter avec points"</strong> → Modal points (pas de conflit)</li>
            <li>• <strong>Vérifier</strong> qu'aucun conflit entre les modaux</li>
            <li>• <strong>Tester</strong> toutes les interactions des cartes</li>
          </ul>
        </div>
      </div>
      
      {/* Page des produits complète */}
      <ProductsPage />
    </div>
  )
}
