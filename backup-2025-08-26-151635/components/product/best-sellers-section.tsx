"use client"

import { useState } from "react"
import BestSellerCard from "./best-seller-card"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
import { enrichProductWithSpecs } from "@/lib/product-specifications"
import PointsPurchaseModal from "./points-purchase-modal"

interface Product {
  id: number
  name: string
  price: number
  pointsPrice: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  seller: string
  sharePoints: number
  shares: number
  inStock: boolean
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
  rank: number
  sales: number
}

interface BestSellersSectionProps {
  onProductClick?: (product: Product) => void;
  onStartChat?: (product: Product) => void;
}

export default function BestSellersSection({ onProductClick, onStartChat }: BestSellersSectionProps) {
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<Product | null>(null)
  
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  const bestSellersProducts: Product[] = [
    {
      id: 1,
      name: "iPhone 15 Pro Max 256GB",
      price: 1200000,
      pointsPrice: 12000,
      originalPrice: 1350000,
      rating: 4.9,
      reviews: 456,
      image: "/placeholder.svg",
      seller: "TechStore Premium",
      sharePoints: 100,
      shares: 245,
      inStock: true,
      discount: 11,
      isHot: true,
      isNew: false,
      isLimited: false,
      badges: ["Bestseller", "Livraison Express", "Cadeau Inclus"],
      color: "black",
      rank: 1,
      sales: 1250
    },
    {
      id: 2,
      name: "MacBook Pro M3 14 pouces",
      price: 2100000,
      pointsPrice: 21000,
      originalPrice: 2300000,
      rating: 4.8,
      reviews: 234,
      image: "/placeholder.svg",
      seller: "Apple Store CI",
      sharePoints: 85,
      shares: 156,
      inStock: true,
      discount: 9,
      isHot: true,
      isNew: false,
      isLimited: false,
      badges: ["Top Vente", "Premium", "Livraison Express"],
      color: "silver",
      rank: 2,
      sales: 890
    },
    {
      id: 3,
      name: "Samsung Galaxy S24 Ultra",
      price: 950000,
      pointsPrice: 9500,
      originalPrice: 1100000,
      rating: 4.7,
      reviews: 345,
      image: "/placeholder.svg",
      seller: "Samsung Official",
      sharePoints: 75,
      shares: 312,
      inStock: true,
      discount: 14,
      isHot: true,
      isNew: false,
      isLimited: false,
      badges: ["Top 3", "Smartphone Pro", "Livraison Express"],
      color: "purple",
      rank: 3,
      sales: 780
    },
    {
      id: 4,
      name: "AirPods Pro 2ème génération",
      price: 280000,
      pointsPrice: 2800,
      originalPrice: 320000,
      rating: 4.6,
      reviews: 189,
      image: "/placeholder.svg",
      seller: "Audio Premium",
      sharePoints: 65,
      shares: 134,
      inStock: true,
      discount: 12,
      isHot: false,
      isNew: false,
      isLimited: false,
      badges: ["Audio Pro", "Qualité Premium", "Livraison Express"],
      color: "white",
      rank: 4,
      sales: 650
    },
    {
      id: 5,
      name: "PlayStation 5 Slim",
      price: 850000,
      pointsPrice: 8500,
      originalPrice: 950000,
      rating: 4.5,
      reviews: 278,
      image: "/placeholder.svg",
      seller: "Gaming Paradise",
      sharePoints: 55,
      shares: 198,
      inStock: true,
      discount: 11,
      isHot: true,
      isNew: false,
      isLimited: true,
      badges: ["Gaming Pro", "Édition Limitée", "Livraison Express"],
      color: "black",
      rank: 5,
      sales: 520
    },
    {
      id: 6,
      name: "Nike Air Jordan 1 Retro High",
      price: 180000,
      pointsPrice: 1800,
      originalPrice: 220000,
      rating: 4.8,
      reviews: 156,
      image: "/placeholder.svg",
      seller: "Sneaker Store",
      sharePoints: 45,
      shares: 89,
      inStock: true,
      discount: 18,
      isHot: true,
      isNew: false,
      isLimited: false,
      badges: ["Sneaker Pro", "Édition Limitée", "Livraison Express"],
      color: "red",
      rank: 6,
      sales: 420
    }
  ]



  // Fonction pour acheter avec des points
  const handleBuyWithPoints = (product: Product) => {
    setSelectedProductForPoints(product)
    setIsPointsModalOpen(true)
  }

  // Fonction pour gérer l'achat avec points
  const handlePointsPurchase = (product: Product, usePoints: boolean, pointsToUse: number) => {
    // Simulation d'un achat avec points
    console.log(`Achat du produit ${product.name} avec ${pointsToUse} points`)
    
    // Ici vous pouvez ajouter la logique d'achat réelle
    // Par exemple, appeler une API pour traiter l'achat
    
            addNotification({ 
  type: 'success', 
  title: 'Achat confirmé', 
  message: '${product.name} acheté avec ${pointsToUse} points' 
})
    
    // Fermer le modal
    setIsPointsModalOpen(false)
    setSelectedProductForPoints(null)
  }

  // Fonction pour partager
  const handleShare = (product: Product, platform: string) => {
    try {
      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(`Découvrez ${product.name} sur notre marketplace !`)}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Découvrez ${product.name} sur notre marketplace !`)}&url=${encodeURIComponent(window.location.href)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`Découvrez ${product.name} sur notre marketplace ! ${window.location.href}`)}`
      }
      
      const url = shareUrls[platform as keyof typeof shareUrls]
      if (url) {
        window.open(url, '_blank', 'width=600,height=400')
        addNotification({ 
  type: 'success', 
  title: 'Produit partagé', 
  message: 'Produit partagé sur ${platform} ! +${Math.floor(product.sharePoints * 0.5)} points gagnés' 
})
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error)
              addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de partager le produit' 
})
    }
  }

  // Fonction pour démarrer un chat
  const handleStartChat = (product: Product) => {
    if (onStartChat) {
      onStartChat(product)
    } else {
      try {
        // Logique de fallback pour démarrer un chat
        addNotification({ 
  type: 'success', 
  title: 'Chat démarré', 
  message: 'Chat démarré avec le vendeur de ${product.name}' 
})
      } catch (error) {
        console.error('Erreur lors du démarrage du chat:', error)
        addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Impossible de démarrer le chat' 
})
      }
    }
  }

  // Fonction pour comparer
  const handleCompare = (product: Product) => {
    try {
      // Récupérer la liste de comparaison existante
      const existingCompareList = localStorage.getItem('compareList')
      let compareList = existingCompareList ? JSON.parse(existingCompareList) : []
      
      // Vérifier si le produit est déjà dans la liste
      if (compareList.find((p: any) => p.id === product.id)) {
        addNotification({ 
  type: 'warning', 
  title: 'Déjà en comparaison', 
  message: 'Ce produit est déjà dans votre liste de comparaison' 
})
        return
      }
      
      // Vérifier la limite de 4 produits
      if (compareList.length >= 4) {
        addNotification({ 
  type: 'warning', 
  title: 'Limite atteinte', 
  message: 'Vous ne pouvez comparer que 4 produits maximum' 
})
        return
      }
      
      // Fonction pour vérifier si deux produits sont similaires
      const areProductsSimilar = (product1: any, product2: any): boolean => {
        // Vérifier la catégorie (basée sur le nom du produit)
        const category1 = product1.name.toLowerCase()
        const category2 = product2.name.toLowerCase()
        
        if (category1.includes('iphone') && category2.includes('iphone')) return true
        if (category1.includes('macbook') && category2.includes('macbook')) return true
        if (category1.includes('samsung') && category2.includes('samsung')) return true
        if (category1.includes('airpods') && category2.includes('airpods')) return true
        if (category1.includes('playstation') && category2.includes('playstation')) return true
        if (category1.includes('nike') && category2.includes('nike')) return true
        
        // Vérifier la gamme de prix (différence < 50%)
        const price1 = product1.price || 0
        const price2 = product2.price || 0
        if (price1 > 0 && price2 > 0) {
          const priceDiff = Math.abs(price1 - price2)
          const avgPrice = (price1 + price2) / 2
          
          if (priceDiff / avgPrice < 0.5) { // Différence de prix < 50%
            return true
          }
        }
        
        return false
      }
      
      // Fonction pour vérifier si un produit peut être ajouté
      const canAddToCompare = (newProduct: any, existingList: any[]): { canAdd: boolean, reason?: string } => {
        if (existingList.find(p => p.id === newProduct.id)) {
          return { canAdd: false, reason: 'Ce produit est déjà dans votre liste de comparaison' }
        }
        
        if (existingList.length >= 4) {
          return { canAdd: false, reason: 'Vous ne pouvez comparer que 4 produits maximum' }
        }
        
        if (existingList.length === 0) {
          return { canAdd: true }
        }
        
        const hasSimilarProduct = existingList.some(existingProduct => 
          areProductsSimilar(newProduct, existingProduct)
        )
        
        if (!hasSimilarProduct) {
          return { 
            canAdd: false, 
            reason: 'Ce produit n\'est pas similaire aux produits déjà en comparaison. Vous ne pouvez comparer que des produits de même marque, catégorie, domaine d\'intérêt ou gamme de prix.' 
          }
        }
        
        return { canAdd: true }
      }
      
      const { canAdd, reason } = canAddToCompare(product, compareList)
      
      if (canAdd) {
        // Enrichir le produit avec des spécifications techniques
        const enrichedProduct = enrichProductWithSpecs(product)
        compareList.push(enrichedProduct)
        localStorage.setItem('compareList', JSON.stringify(compareList))
        
        // Déclencher un événement personnalisé pour notifier le header
        window.dispatchEvent(new CustomEvent('compareListUpdated', { 
          detail: { compareList, length: compareList.length } 
        }))
        
        addNotification({ 
  type: 'success', 
  title: 'Produit ajouté', 
  message: '${product.name} a été ajouté à votre liste de comparaison' 
})
      } else {
        addNotification({
          type: 'warning',
          title: 'Impossible d\'ajouter',
          message: reason || 'Impossible d\'ajouter ce produit à la comparaison'
        })
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter le produit à la comparaison'
      })
    }
  }



  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Container des notifications modernes */}
        <NotificationContainer />
        
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Meilleures Ventes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez les produits les plus vendus et les plus appréciés par notre communauté
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bestSellersProducts.map((product, index) => {
            return (
              <div
                key={product.id}
                style={{
                  animation: `fadeInUp 1s ease-out ${1.2 + index * 0.2}s both`
                }}
              >
                <div className="relative">
                  <BestSellerCard
                    product={product}
                    onBuyWithPoints={handleBuyWithPoints}
                    onShare={handleShare}
                    onStartChat={handleStartChat}
                    onCompare={handleCompare}
                    onProductClick={onProductClick}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <button 
            className="bg-transparent text-[#ff6600] border-2 border-[#ff6600] px-8 py-4 rounded-lg text-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-[#ff6600] hover:text-white hover:transform hover:-translate-y-1 hover:scale-105 hover:shadow-lg"
            onClick={() => window.location.href = '/products'}
          >
            Voir tous les produits
          </button>
        </div>

        {/* Modal d'achat avec points */}
        {selectedProductForPoints && (
          <PointsPurchaseModal
            isOpen={isPointsModalOpen}
            onClose={() => {
              setIsPointsModalOpen(false)
              setSelectedProductForPoints(null)
            }}
            product={{
              id: selectedProductForPoints.id,
              name: selectedProductForPoints.name,
              price: selectedProductForPoints.price,
              pointsPrice: selectedProductForPoints.pointsPrice,
              image: selectedProductForPoints.image,
              rating: selectedProductForPoints.rating,
              reviews: selectedProductForPoints.reviews,
              discount: selectedProductForPoints.discount,
              isHot: selectedProductForPoints.isHot,
              isNew: selectedProductForPoints.isNew,
              isLimited: selectedProductForPoints.isLimited
            }}
            userPoints={2500}
            onPurchase={handlePointsPurchase}
          />
        )}
      </div>
    </section>
  )
}
