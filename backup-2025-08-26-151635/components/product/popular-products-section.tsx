"use client"

import { useState } from "react"
import AdvancedProductCard from "./advanced-product-card"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
import { enrichProductWithSpecs } from "@/lib/product-specifications"

interface Product {
  id: string
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
}

const popularProducts: Product[] = [
  {
    id: "smartphone-1",
    name: "Smartphone Galaxy Pro",
    price: 450000,
    pointsPrice: 2250,
    originalPrice: 500000,
    rating: 4.5,
    reviews: 128,
    image: "/placeholder.svg",
    seller: "TechStore CI",
    sharePoints: 150,
    shares: 245,
    inStock: true,
    discount: 10,
    isHot: true,
    isNew: false,
    isLimited: false,
    badges: ["HOT"],
    color: "red"
  },
  {
    id: "headphones-1",
    name: "Casque Audio Premium",
    price: 120000,
    pointsPrice: 600,
    originalPrice: 150000,
    rating: 4.8,
    reviews: 89,
    image: "/placeholder.svg",
    seller: "Audio Plus",
    sharePoints: 80,
    shares: 156,
    inStock: true,
    discount: 20,
    isHot: false,
    isNew: true,
    isLimited: false,
    badges: ["NEW"],
    color: "blue"
  },
  {
    id: "watch-1",
    name: "Montre Connectée Sport",
    price: 85000,
    pointsPrice: 425,
    originalPrice: 110000,
    rating: 4.6,
    reviews: 203,
    image: "/placeholder.svg",
    seller: "Sport Tech",
    sharePoints: 95,
    shares: 312,
    inStock: true,
    discount: 23,
    isHot: true,
    isNew: false,
    isLimited: true,
    badges: ["HOT", "LIMITED"],
    color: "purple"
  },
  {
    id: "camera-1",
    name: "Appareil Photo Professionnel",
    price: 180000,
    pointsPrice: 900,
    originalPrice: 220000,
    rating: 4.4,
    reviews: 120,
    image: "/placeholder.svg",
    seller: "Photo Pro",
    sharePoints: 120,
    shares: 267,
    inStock: true,
    discount: 18,
    isHot: false,
    isNew: false,
    isLimited: false,
    badges: [],
    color: "black"
  }
]

interface PopularProductsSectionProps {
  onProductClick?: (product: Product) => void;
}

export default function PopularProductsSection({ onProductClick }: PopularProductsSectionProps) {
  const [cartItems, setCartItems] = useState<Array<{id: string, name: string, price: number, points: number, quantity?: number}>>([])
  const [wishlistItems, setWishlistItems] = useState<Array<{id: string, name: string, price: number, points: number}>>([])
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [showWishlistNotification, setShowWishlistNotification] = useState(false)
  const [showPointsNotification, setShowPointsNotification] = useState(false)
  
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()

  // Fonction pour ajouter au panier
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        return prev.map((item) => 
          item.id === product.id 
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setShowCartNotification(true)
    setTimeout(() => setShowCartNotification(false), 3000)
  }

  // Fonction pour ajouter aux favoris
  const handleAddToWishlist = (product: Product) => {
    setWishlistItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        return prev.filter((item) => item.id !== product.id)
      }
      return [...prev, product]
    })
    setShowWishlistNotification(true)
    setTimeout(() => setShowWishlistNotification(false), 3000)
  }

  // Fonction pour acheter avec points
  const handleBuyWithPoints = (product: Product) => {
    setShowPointsNotification(true)
    setTimeout(() => setShowPointsNotification(false), 3000)
  }

  // Fonction pour partager un produit
  const handleShare = (product: Product, platform: string) => {
    const shareText = `Découvrez ${product.name} sur Probooster ! Prix: ${product.price} F CFA, Points: ${product.pointsPrice}`
    const shareUrl = `${window.location.origin}/product/${product.id}`

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`)
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`)
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`)
        break
    }
  }

  // Fonction pour démarrer le chat
  const handleStartChat = (product: Product) => {
    // Ici on pourrait rediriger vers une page de chat ou ouvrir un modal
    console.log("Démarrer le chat pour:", product.name)
  }

  // Fonction pour comparer les produits
  const handleCompare = (product: Product) => {
    // Utiliser le système de comparaison du header via localStorage
    try {
      const compareList = JSON.parse(localStorage.getItem('compareList') || '[]')
      
      // Fonction pour détecter si deux produits sont similaires ou partagent des intérêts communs
      const areProductsSimilar = (product1: any, product2: any): boolean => {
        if (product1.id === product2.id) return false
        
        const name1 = product1.name.toLowerCase()
        const name2 = product2.name.toLowerCase()
        
        // 1. Même marque (Apple, Samsung, Sony, etc.)
        const brands = ['apple', 'iphone', 'ipad', 'macbook', 'samsung', 'galaxy', 'sony', 'playstation', 'nike', 'adidas', 'jordan']
        const brand1 = brands.find(brand => name1.includes(brand))
        const brand2 = brands.find(brand => name2.includes(brand))
        
        if (brand1 && brand2 && brand1 === brand2) {
          return true
        }
        
        // 2. Même catégorie principale (smartphones, laptops, gaming, audio, etc.)
        const categories = {
          smartphones: ['iphone', 'galaxy', 'smartphone', 'mobile', 'phone'],
          laptops: ['macbook', 'laptop', 'ordinateur', 'computer', 'pc'],
          tablets: ['ipad', 'tablet', 'tablette'],
          audio: ['airpods', 'casque', 'headphone', 'écouteur', 'speaker'],
          gaming: ['playstation', 'xbox', 'nintendo', 'gaming', 'console'],
          watches: ['watch', 'montre', 'smartwatch'],
          sneakers: ['jordan', 'nike', 'adidas', 'sneaker', 'chaussure']
        }
        
        const category1 = Object.keys(categories).find(cat => 
          categories[cat as keyof typeof categories].some(keyword => name1.includes(keyword))
        )
        const category2 = Object.keys(categories).find(cat => 
          categories[cat as keyof typeof categories].some(keyword => name2.includes(keyword))
        )
        
        if (category1 && category2 && category1 === category2) {
          return true
        }
        
        // 3. Même domaine d'intérêt (tech, sport, mode, etc.)
        const domains = {
          tech: ['iphone', 'galaxy', 'macbook', 'ipad', 'airpods', 'watch', 'playstation', 'xbox'],
          sport: ['nike', 'adidas', 'jordan', 'sneaker', 'chaussure'],
          audio: ['airpods', 'casque', 'headphone', 'écouteur', 'speaker'],
          gaming: ['playstation', 'xbox', 'nintendo', 'gaming', 'console']
        }
        
        const domain1 = Object.keys(domains).find(domain => 
          domains[domain as keyof typeof domains].some(keyword => name1.includes(keyword))
        )
        const domain2 = Object.keys(domains).find(domain => 
          domains[domain as keyof typeof domains].some(keyword => name2.includes(keyword))
        )
        
        if (domain1 && domain2 && domain1 === domain2) {
          return true
        }
        
        // 4. Même gamme de prix (approximative) - seulement si les produits ont des prix
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
  title: 'Produit ajouté à la comparaison', 
  message: '${product.name} a été ajouté à votre liste de comparaison' 
})
      } else {
                  addNotification({
            type: 'warning',
            title: 'Impossible d\'ajouter à la comparaison',
            message: reason || 'Impossible d\'ajouter ce produit à la comparaison'
          })
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
              addNotification({
          type: 'error',
          title: 'Erreur de comparaison',
          message: 'Impossible d\'ajouter le produit à la comparaison'
        })
    }
  }

  // Fonction pour vérifier si un produit est dans les favoris
  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId)
  }

  return (
    <section style={{
      padding: '80px 0',
      backgroundColor: '#ffffff'
    }}>
      {/* Container des notifications modernes */}
      <NotificationContainer />
      
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '64px',
          animation: 'fadeInUp 1s ease-out 0.9s both'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#000000',
            marginBottom: '16px'
          }}>
            Produits Populaires
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: '#535455',
            maxWidth: '768px',
            margin: '0 auto'
          }}>
            Découvrez les produits les plus appréciés par notre communauté
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px'
        }}>
          {/* Nombre de produits: {popularProducts.length} */}
          {popularProducts.map((product, index) => {
            console.log(`PopularProductsSection - Produit ${index}:`, product);
            return (
              <div
                key={product.id}
                style={{
                  animation: `fadeInUp 1s ease-out ${1.2 + index * 0.2}s both`
                }}
              >
                <AdvancedProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleAddToWishlist}
                  onBuyWithPoints={handleBuyWithPoints}
                  onShare={handleShare}
                  onStartChat={handleStartChat}
                  onCompare={handleCompare}
                  isInWishlist={isInWishlist(product.id)}
                  onProductClick={onProductClick}
                />
              </div>
            );
          })}
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '48px'
        }}>
          <button style={{
            backgroundColor: 'transparent',
            color: '#ff6600',
            border: '2px solid #ff6600',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '1.125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6600'
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 102, 0, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#ff6600'
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          onClick={() => window.location.href = '/products'}
          >
            Voir tous les produits
          </button>
        </div>
      </div>

      {/* Notifications */}
      {showCartNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span>✅</span>
            Produit ajouté au panier !
          </div>
        </div>
      )}

      {showWishlistNotification && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span>❤️</span>
            Produit ajouté aux favoris !
          </div>
        </div>
      )}

      {showPointsNotification && (
        <div style={{
          position: 'fixed',
          top: '140px',
          right: '20px',
          backgroundColor: '#ff6600',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span>⭐</span>
            Achat avec points en cours...
          </div>
        </div>
      )}
    </section>
  )
}
