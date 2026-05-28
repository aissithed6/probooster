"use client"

import { useState } from "react"
import AdvancedProductCard from "@/components/product/advanced-product-card"
import ProductModal from "@/components/product/product-modal"
// Import supprimé - remplacé par le nouveau système de chat global

/**
 * Widget de chat (stub) pour la page de test.
 * Évite un crash au build si le vrai ChatWidget n'est pas présent/importé.
 */
function ChatWidget(_props: {
  isOpen: boolean
  onClose: () => void
  product: any
  seller: any
}) {
  return null
}

export default function TestHomepageButtons() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatProduct, setChatProduct] = useState<any>(null)
  const [chatSeller, setChatSeller] = useState<any>(null)

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

  const handleStartChat = (product: any) => {
    console.log("=== TEST CHAT ===")
    console.log("Ouverture du chat pour:", product.name)
    setChatProduct(product)
    setChatSeller({
      name: product.seller || 'Vendeur Probooster',
      avatar: "/vendor-avatar.png",
      rating: product.rating,
      totalSales: Math.floor(Math.random() * 1000) + 100,
      responseTime: "2-4h",
      location: "Abidjan, CI",
      phone: "+225 0701234567",
      email: "contact@probooster.online",
      joinDate: "2023",
      memberSince: "1 an",
      logo: "/placeholder-logo.png"
    })
    setIsChatOpen(true)
  }

  const handleCompare = (product: any) => {
    console.log("=== TEST COMPARAISON ===")
    console.log("Comparaison du produit:", product.name)
    
    if (typeof window === 'undefined') return
    
    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      
      // Vérifier si le produit peut être ajouté
      if (compareList.find(p => p.id === product.id)) {
        alert('Ce produit est déjà dans votre liste de comparaison')
        return
      }
      
      if (compareList.length >= 4) {
        alert('Vous ne pouvez comparer que 4 produits maximum')
        return
      }
      
      // Ajouter le produit à la comparaison
      compareList.push(product)
      localStorage.setItem('compareList', JSON.stringify(compareList))
      
      // Déclencher un événement personnalisé pour notifier le header
      window.dispatchEvent(new CustomEvent('compareListUpdated', { 
        detail: { compareList, length: compareList.length } 
      }))
      
      alert(`${product.name} a été ajouté à votre liste de comparaison !`)
      console.log("Liste de comparaison mise à jour:", compareList)
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
      alert('Erreur lors de l\'ajout à la comparaison')
    }
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
          Test des Boutons - Page d'Accueil
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Instructions de Test :</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li><strong>Bouton Comparer :</strong> Cliquez sur le bouton de comparaison (icône graphique) - le produit doit être ajouté à la liste de comparaison du header</li>
            <li><strong>Bouton Message :</strong> Cliquez sur le bouton de message (icône message) - le widget de chat doit s'ouvrir</li>
            <li><strong>Image du produit :</strong> Cliquez sur l'image - le modal de fiche produit doit s'ouvrir</li>
          </ol>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">État de la Liste de Comparaison :</h2>
          <div className="text-sm text-blue-700">
            <p>Vérifiez le bouton de comparaison dans le header modular après avoir cliqué sur "Comparer"</p>
            <p>La liste est stockée dans localStorage et mise à jour en temps réel</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Produit de Test :</h2>
          <AdvancedProductCard
            product={testProduct}
            onBuyWithPoints={(product) => console.log("Acheter avec points:", product)}
            onShare={(product, platform) => console.log("Partage:", product.name, platform)}
            onStartChat={handleStartChat}
            onCompare={handleCompare}
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

        {/* Chat Widget */}
        <ChatWidget 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          product={chatProduct}
          seller={chatSeller}
        />
      </div>
    </div>
  )
}
