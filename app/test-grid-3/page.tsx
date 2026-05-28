"use client"

import { useState } from "react"
import BestSellersSection from "@/components/product/best-sellers-section"

export default function TestGrid3Page() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)

  const handleOpenProductModal = (product: any) => {
    console.log("Modal fiche produit ouvert pour:", product.name)
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Test Grille 3 Produits par Ligne
          </h1>
          <p className="text-lg text-gray-600">
            Vérifiez que la grille affiche exactement 3 produits par ligne sur les écrans larges
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Instructions de Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-800">✅ Vérifications :</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Écran large (lg+)</strong> → 3 produits par ligne</li>
                <li>• <strong>Écran moyen (md)</strong> → 2 produits par ligne</li>
                <li>• <strong>Écran petit (sm)</strong> → 1 produit par ligne</li>
                <li>• <strong>Espacement uniforme</strong> entre les produits</li>
                <li>• <strong>Alignement parfait</strong> des cartes</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-green-800">🎯 Objectifs :</h3>
              <ul className="space-y-1 text-green-700">
                <li>• Confirmer la grille 3 colonnes sur desktop</li>
                <li>• Vérifier la responsivité mobile</li>
                <li>• Tester l'espacement et l'alignement</li>
                <li>• Valider les animations de chargement</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section des meilleurs vendeurs avec grille 3 */}
        <BestSellersSection onProductClick={handleOpenProductModal} />

        {/* Informations sur la grille */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 text-center">
            📐 Configuration de la Grille
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
            <div className="text-center">
              <div className="font-semibold">Mobile (sm)</div>
              <div className="text-xs">1 colonne</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Tablet (md)</div>
              <div className="text-xs">2 colonnes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Desktop (lg+)</div>
              <div className="text-xs">3 colonnes</div>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-blue-600">
            Classes CSS utilisées : <code className="bg-blue-100 px-2 py-1 rounded">grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8</code>
          </div>
        </div>

        {/* Modal de fiche produit (simplifié pour le test) */}
        {selectedProduct && isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Fiche Produit - {selectedProduct.name}
                </h3>
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl overflow-hidden">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedProduct.price.toLocaleString()} F CFA
                    </div>
                    <div className="text-gray-600">
                      {selectedProduct.pointsPrice} points
                    </div>
                    <div className="text-sm text-gray-500">
                      Vendeur: {selectedProduct.seller}
                    </div>
                    <div className="text-sm text-gray-500">
                      Rang: #{selectedProduct.rank}
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-700">
                  <p><strong>Note:</strong> {selectedProduct.rating}/5 ({selectedProduct.reviews} avis)</p>
                  <p><strong>Réduction:</strong> {selectedProduct.discount}%</p>
                  <p><strong>Statut:</strong> {selectedProduct.inStock ? 'En stock' : 'Rupture de stock'}</p>
                  <p><strong>Ventes:</strong> {selectedProduct.sales} unités</p>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Ceci est un modal de test simplifié. En production, il afficherait la fiche produit complète.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
