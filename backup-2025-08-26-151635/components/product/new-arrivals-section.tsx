"use client"

import { useState } from "react"
import NewArrivalCard from "./new-arrival-card"
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
  daysAgo: number
}

interface NewArrivalsSectionProps {
  onProductClick?: (product: Product) => void;
  onStartChat?: (product: Product) => void;
}

export default function NewArrivalsSection({ onProductClick, onStartChat }: NewArrivalsSectionProps) {
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [selectedProductForPoints, setSelectedProductForPoints] = useState<Product | null>(null)
  
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  // Données des nouveautés
  const newArrivalsProducts: Product[] = [
    {
      id: 1,
      name: "iPhone 16 Pro Max 512GB",
      price: 1450000,
      pointsPrice: 14500,
      originalPrice: 1600000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.9,
      reviews: 23,
      seller: "Apple Store Official",
      sharePoints: 120,
      shares: 45,
      discount: 9,
      daysAgo: 1,
      isNew: true,
      isHot: true,
      isLimited: false,
      badges: ["🆕 Nouveau", "🔥 Bestseller", "⚡ Livraison Express"],
      color: "from-blue-500 to-purple-600",
      rank: 1,
      sales: 1250,
      inStock: true
    },
    {
      id: 2,
      name: "Samsung Galaxy Z Fold 6",
      price: 1800000,
      pointsPrice: 18000,
      originalPrice: 2000000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      reviews: 18,
      seller: "Samsung Premium",
      sharePoints: 100,
      shares: 32,
      discount: 10,
      daysAgo: 2,
      isNew: true,
      isHot: true,
      isLimited: false,
      badges: ["🆕 Nouveau", "📱 Smartphone Pro", "⚡ Livraison Express"],
      color: "from-green-500 to-emerald-600",
      rank: 2,
      sales: 890,
      inStock: true
    },
    {
      id: 3,
      name: "MacBook Air M3 15 pouces",
      price: 1650000,
      pointsPrice: 16500,
      originalPrice: 1800000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.8,
      reviews: 31,
      seller: "Tech Innovation",
      sharePoints: 90,
      shares: 28,
      discount: 8,
      daysAgo: 3,
      isNew: true,
      isHot: false,
      isLimited: false,
      badges: ["🆕 Nouveau", "💻 Laptop Pro", "⚡ Livraison Express"],
      color: "from-orange-500 to-red-600",
      rank: 3,
      sales: 650,
      inStock: true
    },
    {
      id: 4,
      name: "PlayStation 5 Pro",
      price: 850000,
      pointsPrice: 8500,
      originalPrice: 950000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.6,
      reviews: 45,
      seller: "Gaming Paradise",
      sharePoints: 80,
      shares: 55,
      discount: 11,
      daysAgo: 5,
      isNew: true,
      isHot: true,
      isLimited: true,
      badges: ["🆕 Nouveau", "🎮 Gaming Pro", "⏰ Offre Limitée"],
      color: "from-purple-500 to-indigo-600",
      rank: 4,
      sales: 420,
      inStock: true
    },
    {
      id: 5,
      name: "Tesla Model Y Accessories Kit",
      price: 450000,
      pointsPrice: 4500,
      originalPrice: 520000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.5,
      reviews: 12,
      seller: "Auto Premium",
      sharePoints: 70,
      shares: 18,
      discount: 13,
      daysAgo: 4,
      isNew: true,
      isHot: false,
      isLimited: false,
      badges: ["🆕 Nouveau", "🚗 Auto Pro", "⚡ Livraison Express"],
      color: "from-red-500 to-pink-600",
      rank: 5,
      sales: 180,
      inStock: true
    },
    {
      id: 6,
      name: "Dyson V15 Detect Absolute",
      price: 680000,
      pointsPrice: 6800,
      originalPrice: 750000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      reviews: 27,
      seller: "Home & Living",
      sharePoints: 60,
      shares: 35,
      discount: 9,
      daysAgo: 6,
      isNew: true,
      isHot: false,
      isLimited: false,
      badges: ["🆕 Nouveau", "🏠 Home Pro", "⚡ Livraison Express"],
      color: "from-teal-500 to-cyan-600",
      rank: 6,
      sales: 320,
      inStock: true
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
        if (category1.includes('samsung') && category2.includes('samsung')) return true
        if (category1.includes('macbook') && category2.includes('macbook')) return true
        if (category1.includes('playstation') && category2.includes('playstation')) return true
        if (category1.includes('tesla') && category2.includes('tesla')) return true
        if (category1.includes('dyson') && category2.includes('dyson')) return true
        
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
    <div className="space-y-8">
      {/* Container des notifications modernes */}
      <NotificationContainer />
      
      {/* Titre de la section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          <span className="text-[#ff6600]">Nouveautés</span> Exclusives
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvrez les derniers produits ajoutés à notre marketplace avec des offres exclusives
        </p>
      </div>

      {/* Grille des nouveautés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {newArrivalsProducts.map((product) => (
          <NewArrivalCard
            key={product.id}
            product={product}
            onBuyWithPoints={handleBuyWithPoints}
            onShare={handleShare}
            onStartChat={handleStartChat}
            onCompare={handleCompare}
            onProductClick={onProductClick}
          />
        ))}
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
  )
}
