"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchWithChat } from "@/components/search/SearchWithChat"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import AdvancedProductCard from "@/components/product/advanced-product-card"
import ProductModal from "@/components/product/product-modal"
// Import supprimé - remplacé par le nouveau système de chat global
import { enrichProductWithSpecs } from "@/lib/product-specifications"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Gift, 
  Users, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Zap,
  Award,
  Globe,
  Smartphone,
  Headphones,
  Share2,
  MessageCircle,
  CreditCard,
  Brain,
  Rocket,
  Play,
  ShoppingBag,
  Store,
  Watch,
  Camera,
  Flame,
  Target,
  Clock,
  Crown,
  Coins,
  Sparkles,
  Laptop
} from "lucide-react"


export default function HomePage() {
  // Hook pour les notifications modernes
  const { addNotification } = useNotifications()
  
  // Hook pour les paramètres de recherche
  const searchParams = useSearchParams()
  
  // États pour le modal de fiche produit
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // États pour les notifications
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [showWishlistNotification, setShowWishlistNotification] = useState(false)
  const [showPointsNotification, setShowPointsNotification] = useState(false)

  // États pour le partage
  const [currentProduct, setCurrentProduct] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  // États pour le panier et la wishlist
  const [cartItems, setCartItems] = useState<Array<{id: string, name: string, price: number, points: number, quantity?: number}>>([])
  const [wishlistItems, setWishlistItems] = useState<Array<{id: string, name: string, price: number, points: number}>>([])

  // États pour le chat - Remplacés par le système de chat global
  // Le chat est maintenant accessible via le bouton flottant orange en bas à droite

  // Effet pour détecter le paramètre openCart et ouvrir le modal panier
  useEffect(() => {
    const openCart = searchParams.get('openCart')
    if (openCart === 'true') {
      // Attendre un peu que le header soit chargé, puis ouvrir le modal panier
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Utiliser un événement personnalisé pour ouvrir le modal panier
          window.dispatchEvent(new CustomEvent('openCartModal'))
          // Nettoyer l'URL
          window.history.replaceState({}, '', '/')
        }
      }, 500)
    }
  }, [searchParams])

  // Fonction pour ajouter au panier
  const handleAddToCart = (product: any) => {
    setCartItems((prev: Array<{id: string, name: string, price: number, points: number, quantity?: number}>) => {
      const existingItem = prev.find((item: {id: string, name: string, price: number, points: number, quantity?: number}) => item.id === product.id);
      if (existingItem) {
        return prev.map((item: {id: string, name: string, price: number, points: number, quantity?: number}) => 
          item.id === product.id 
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setShowCartNotification(true);
    setTimeout(() => setShowCartNotification(false), 3000);
  };

  // Fonction pour ajouter aux favoris
  const handleAddToWishlist = (product: any) => {
    setWishlistItems((prev: Array<{id: string, name: string, price: number, points: number}>) => {
      const existingItem = prev.find((item: {id: string, name: string, price: number, points: number}) => item.id === product.id);
      if (existingItem) {
        return prev.filter((item: {id: string, name: string, price: number, points: number}) => item.id !== product.id);
      }
      return [...prev, product];
    });
    setShowWishlistNotification(true);
    setTimeout(() => setShowWishlistNotification(false), 3000);
  };

  // Fonction pour acheter avec points
  const handleBuyWithPoints = (product: any) => {
    setShowPointsNotification(true);
    setTimeout(() => setShowPointsNotification(false), 3000);
    // Ici on pourrait rediriger vers une page de paiement par points
  };

  // Fonction pour ouvrir le modal de fiche produit
  const handleOpenProductModal = (product: any) => {
    console.log("=== DEBUG MODAL ===");
    console.log("handleOpenProductModal appelé avec:", product);
    console.log("Type du produit:", typeof product);
    console.log("Propriétés du produit:", Object.keys(product || {}));
    setSelectedProduct(product);
    setIsModalOpen(true);
    console.log("selectedProduct défini:", product);
    console.log("isModalOpen défini:", true);
    console.log("Modal ouvert:", product ? "oui" : "non");
    console.log("=== FIN DEBUG ===");
  };

  // Fonction pour fermer le modal de fiche produit
  const handleCloseProductModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  // Fonction pour ouvrir le chat - Remplacée par le système de chat global
  const handleStartChat = (product: any) => {
    // Le chat est maintenant géré par le système global
    // Utilisez le bouton flottant orange en bas à droite pour accéder au chat
    console.log('Chat démarré pour le produit:', product.name)
    // Ici vous pourriez intégrer le nouveau système de chat global
  };

  // Fonction pour comparer un produit
  const handleCompare = (product: any) => {
    try {
      // Récupérer la liste de comparaison existante
      const existingCompareList = localStorage.getItem('compareList')
      let compareList = existingCompareList ? JSON.parse(existingCompareList) : []
      
      // Vérifier si le produit est déjà dans la liste
      if (compareList.find((p: any) => p.id === product.id)) {
        addNotification({ 
          type: 'warning', 
          title: 'Déjà en comparaison', 
          message: `${product.name} est déjà dans votre liste de comparaison` 
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
        if (category1.includes('airpods') && category2.includes('airpods')) return true
        if (category1.includes('samsung') && category2.includes('samsung')) return true
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
          message: `${product.name} a été ajouté à votre liste de comparaison` 
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
  };

  // Fonction pour partager un produit
  const handleShareProduct = (product: any) => {
    setCurrentProduct(product);
    setShowShareModal(true);
  };

  // Fonction pour partager sur les réseaux sociaux
  const shareOnSocialMedia = (platform: string) => {
    const product = currentProduct;
    if (!product) return;

    const text = `Découvrez ${product.name} sur Probooster ! Prix: ${product.price} F CFA, Points: ${product.points}`;
    const url = `${window.location.origin}/product/${product.id}`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(text + ' ' + url);
        break;
    }
    setShowShareModal(false);
  };

  // Fonction pour naviguer vers "Comment ça marche"
  const handleHowItWorks = () => {
    window.location.href = '/how-it-works';
  };

  // Fonction pour naviguer vers "Devenir Vendeur"
  const handleBecomeSeller = () => {
    window.location.href = '/auth/register?type=vendeur';
  };

  // Fonction pour naviguer vers la page des produits
  const handleStartShopping = () => {
    window.location.href = '/auth/register?type=acheteur';
  };

  // Fonction pour commencer l'expérience
  const handleStartNow = () => {
    window.location.href = '/auth/register';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff'
    }}>
      {/* Hero Section - La Marketplace du Futur */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        color: '#000000',
        padding: '80px 0'
      }}>
        {/* Bulles décoratives */}
        <div 
          style={{
          position: 'absolute',
            left: '20%',
            top: '20%',
            width: '60px',
            height: '60px',
            backgroundColor: '#ff6600',
            borderRadius: '50%',
            opacity: 0.8,
            zIndex: 1,
          }}
          className="bubble-orange"
        />
        <div 
          style={{
            position: 'absolute',
            right: '15%',
            top: '30%',
            width: '80px',
            height: '80px',
            backgroundColor: '#87ceeb',
            borderRadius: '50%',
            opacity: 0.7,
            zIndex: 1,
          }}
          className="bubble-blue"
        />
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h1 style={{
              fontSize: '3.5rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '24px',
              textAlign: 'center',
              lineHeight: '1.2',
              animation: 'fadeInUp 1s ease-out 0.2s both'
            }} className="title-main sparkle-effect">
              La Marketplace du <span className="future-word">Futur</span>
            </h1>
            <p style={{
              fontSize: '1.25rem',
              marginBottom: '32px',
              color: '#535455',
              maxWidth: '700px',
              margin: '0 auto 32px',
              animation: 'fadeInUp 1s ease-out 0.3s both'
            }} className="text-reveal">
              Rejoignez <strong style={{color: '#ff6600'}} className="heartbeat-animation">Probooster</strong>, la marketplace où chaque achat devient une aventure sociale. Système de points innovant, interactions enrichies et technologie de pointe au service de votre expérience.
            </p>
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center',
              animation: 'fadeInUp 1s ease-out 0.6s both'
            }}>
              <Button size="lg" style={{
                backgroundColor: '#ff6600',
                color: 'white',
                fontSize: '1.125rem',
                padding: '12px 32px',
                border: 'none',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} className="neon-glow magnetic-hover" 
              onClick={handleStartNow}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 102, 0, 0.3)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <Rocket style={{width: '20px', height: '20px'}} className="icon-spin icon-glow" />
                Commencer maintenant
                <ArrowRight style={{width: '16px', height: '16px'}} className="icon-bounce icon-float" />
              </Button>
              <Button size="lg" variant="outline" style={{
                backgroundColor: 'white',
                color: '#ff6600',
                border: '2px solid #ff6600',
                fontSize: '1.125rem',
                padding: '12px 32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }} 
              onClick={handleHowItWorks}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ff6600';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = '#ff6600';
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 102, 0, 0.3)';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#ff6600';
                e.currentTarget.style.borderColor = '#ff6600';
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <Play style={{width: '20px', height: '20px'}} className="icon-pulse icon-glow" />
                Comment ça marche
                <ArrowRight style={{width: '16px', height: '16px'}} className="icon-wiggle icon-float" />
              </Button>
            </div>

            {/* Barre de recherche avec chat intégré */}
            <div style={{
              marginTop: '48px',
              animation: 'fadeInUp 1s ease-out 0.8s both'
            }}>
              <SearchWithChat 
                placeholder="Rechercher des produits, vendeurs, ou commencer un chat..."
                className="max-w-2xl mx-auto"
                onSearch={(query) => {
                  console.log('Recherche effectuée:', query)
                  // Ici on pourrait rediriger vers la page de recherche
                }}
              />
              <p style={{
                fontSize: '0.875rem',
                marginTop: '16px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                💬 Tapez pour rechercher ou cliquez sur "Chat" pour discuter directement avec un vendeur
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Produits Populaires */}
      <section style={{
        padding: '80px 0',
        backgroundColor: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '64px',
            animation: 'fadeInUp 1s ease-out 1.6s both'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '16px'
            }}>
              🏆 Produits Populaires
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#6b7280',
              maxWidth: '768px',
              margin: '0 auto'
            }}>
              Découvrez nos produits les plus vendus et appréciés par nos clients
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {/* Produit 1 - iPhone 15 Pro Max */}
            <AdvancedProductCard
              product={{
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
              }}
              onBuyWithPoints={handleBuyWithPoints}
              onShare={(product, platform) => {
                console.log(`Partage de ${product.name} sur ${platform}`);
              }}
              onCompare={handleCompare}
              onProductClick={handleOpenProductModal}
            />

            {/* Produit 2 - MacBook Air M2 */}
            <AdvancedProductCard
              product={{
                id: 2,
                name: "MacBook Air M2 13.6 pouces",
                price: 1650000,
                pointsPrice: 16500,
                originalPrice: 1800000,
                rating: 4.9,
                reviews: 89,
                image: "/placeholder.svg",
                seller: "Tech Innovation",
                sharePoints: 85,
                shares: 67,
                inStock: true,
                discount: 8,
                isHot: true,
                isNew: true,
                isLimited: false,
                badges: ["🥈 Top Vente", "💎 Premium", "⚡ Livraison Express"],
                color: "from-green-500 to-emerald-600"
              }}
              onBuyWithPoints={handleBuyWithPoints}
              onShare={(product, platform) => {
                console.log(`Partage de ${product.name} sur ${platform}`);
              }}
              onCompare={handleCompare}
              onProductClick={handleOpenProductModal}
            />

            {/* Produit 3 - AirPods Pro 2 */}
            <AdvancedProductCard
              product={{
                id: 3,
                name: "AirPods Pro 2ème génération",
                price: 280000,
                pointsPrice: 2800,
                originalPrice: 320000,
                rating: 4.7,
                reviews: 234,
                image: "/placeholder.svg",
                seller: "Audio Premium",
                sharePoints: 75,
                shares: 156,
                inStock: true,
                discount: 12,
                isHot: false,
                isNew: false,
                isLimited: true,
                badges: ["🎧 Audio Pro", "📱 Compatible iOS/Android", "⚡ Livraison Express"],
                color: "from-purple-500 to-pink-600"
              }}
              onBuyWithPoints={handleBuyWithPoints}
              onShare={(product, platform) => {
                console.log(`Partage de ${product.name}`);
              }}
              onCompare={handleCompare}
              onProductClick={handleOpenProductModal}
            />
          </div>
          
          <div style={{
            textAlign: 'center',
            marginTop: '48px',
            animation: 'fadeInUp 1s ease-out 2.4s both'
          }}>
            <Button size="lg" style={{
              backgroundColor: '#ff6600',
              color: 'white',
              border: 'none',
              fontSize: '1.125rem',
              padding: '16px 32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 auto',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }} onClick={() => window.location.href = '/products'}>
              Voir tous les produits
              <ArrowRight style={{width: '20px', height: '20px'}} />
            </Button>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités Exclusives */}
      <section style={{
        padding: '80px 0',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '64px',
            animation: 'fadeInUp 1s ease-out 1.8s both'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '16px'
            }}>
              Fonctionnalités Exclusives
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#6b7280',
              maxWidth: '768px',
              margin: '0 auto'
            }}>
              Découvrez ce qui rend notre marketplace unique
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {/* Fonctionnalité 1 - Système de Points Révolutionnaire */}
            <Card style={{
              border: 'none',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'slideInLeft 1s ease-out 2.0s both'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            }}>
                <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#ff6600',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'bounce 2s ease-in-out infinite'
              }} className="neon-glow">
                <Star style={{width: '40px', height: '40px', color: 'white'}} className="icon-spin icon-glow" />
                  </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 16px 0'
              }}>Système de Points Révolutionnaire</h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Gagnez des points en partageant sur les réseaux sociaux, convertissez-les en argent réel ou utilisez-les pour vos achats. Un système de récompenses unique !
              </p>
            </Card>

            {/* Fonctionnalité 2 - Chat Instantané Avancé */}
            <Card style={{
              border: 'none',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'fadeInUp 1s ease-out 2.2s both'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            }}>
                <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'bounce 2s ease-in-out infinite 0.5s'
              }} className="neon-glow">
                <MessageCircle style={{width: '40px', height: '40px', color: 'white'}} className="icon-bounce icon-glow" />
                  </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 16px 0'
              }}>Chat Instantané Avancé</h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Communiquez directement avec les vendeurs via notre système de chat type WhatsApp. Messages vocaux, emojis et pièces jointes inclus.
              </p>
            </Card>

            {/* Fonctionnalité 3 - Multidevise & International */}
            <Card style={{
              border: 'none',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'slideInRight 1s ease-out 2.4s both'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            }}>
                <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#10b981',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'bounce 2s ease-in-out infinite 1s'
              }} className="neon-glow">
                <Globe style={{width: '40px', height: '40px', color: 'white'}} className="icon-rotate3d icon-glow" />
                  </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 16px 0'
              }}>Multidevise & International</h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Support natif du F CFA et autres devises. Interface multilingue adaptée à votre région avec contenus localisés.
              </p>
            </Card>

            {/* Fonctionnalité 4 - Paiements Innovants */}
            <Card style={{
              border: 'none',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'slideInLeft 1s ease-out 2.6s both'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            }}>
                <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#8b5cf6',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'bounce 2s ease-in-out infinite 1.5s'
              }} className="neon-glow">
                <Zap style={{width: '40px', height: '40px', color: 'white'}} className="icon-pulse icon-glow" />
                  </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 16px 0'
              }}>Paiements Innovants</h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Mobile Money, cartes bancaires, points et QR codes. Intégration FeexPay pour une expérience de paiement fluide et sécurisée.
              </p>
            </Card>

            {/* Fonctionnalité 5 - Sécurité Renforcée */}
            <Card style={{
              border: 'none',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'fadeInUp 1s ease-out 2.8s both'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            }}>
                <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#ef4444',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'bounce 2s ease-in-out infinite 2s'
              }} className="neon-glow">
                <Shield style={{width: '40px', height: '40px', color: 'white'}} className="icon-wiggle icon-glow" />
                  </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 16px 0'
              }}>Sécurité Renforcée</h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Authentification 2FA, protection avancée des données, conformité RGPD et sécurité by design pour votre tranquillité.
              </p>
            </Card>

            {/* Fonctionnalité 6 - IA & Personnalisation */}
            <Card style={{
              border: 'none',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              animation: 'slideInRight 1s ease-out 3.0s both'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            }}>
                <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#6366f1',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                animation: 'bounce 2s ease-in-out infinite 2.5s'
              }} className="neon-glow">
                <Star style={{width: '40px', height: '40px', color: 'white'}} className="icon-float icon-rainbow" />
                  </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#000000',
                margin: '0 0 16px 0'
              }}>IA & Personnalisation</h3>
              <p style={{
                fontSize: '1rem',
                color: '#6b7280',
                lineHeight: '1.6',
                margin: '0'
              }}>
                Suggestions intelligentes, recherche vocale et visuelle, assistant virtuel intégré pour une expérience sur mesure.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Section CTA - Prêt à Révolutionner Votre Commerce */}
      <section style={{
        padding: '80px 0',
        backgroundColor: '#ff6600',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            animation: 'fadeInUp 1s ease-out 2.6s both'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '24px',
              animation: 'bounce 3s ease-in-out infinite'
          }}>
            Prêt à Révolutionner Votre Commerce ?
          </h2>
          <p style={{
            fontSize: '1.25rem',
              marginBottom: '40px',
            opacity: 0.9,
              lineHeight: '1.6'
          }}>
              Rejoignez des milliers de vendeurs et acheteurs qui ont déjà transformé leur expérience commerciale
          </p>
          <div style={{
            display: 'flex',
              gap: '20px',
            justifyContent: 'center',
              marginTop: '30px',
              flexWrap: 'wrap'
            }}>
              <button 
                className="cta-button cta-button-vendor-bottom"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 102, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
                onClick={(e) => {
                  e.currentTarget.style.animation = 'buttonClick 0.2s ease-out';
                  setTimeout(() => {
                    e.currentTarget.style.animation = '';
                  }, 200);
                  handleBecomeSeller();
                }}
              >
                <Store style={{ marginRight: '8px' }} className="icon-zoom icon-glow" />
                Devenir Vendeur
                <ArrowRight style={{ marginLeft: '8px' }} className="icon-spin icon-float" />
              </button>
              <button 
                className="cta-button cta-button-buy-bottom"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 15px 35px rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
                onClick={(e) => {
                  e.currentTarget.style.animation = 'buttonClick 0.2s ease-out';
                  setTimeout(() => {
                    e.currentTarget.style.animation = '';
                  }, 200);
                  handleStartShopping();
                }}
              >
                <ShoppingBag style={{ marginRight: '8px' }} className="icon-bounce icon-glow" />
                Commencer à Acheter
                <ArrowRight style={{ marginLeft: '8px' }} className="icon-wiggle icon-float" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section Statistiques */}
      <section style={{
        padding: '60px 0',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '32px',
            textAlign: 'center'
          }}>
            {/* Statistique 1 */}
            <div style={{
              animation: 'fadeInUp 1s ease-out 3.2s both'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
              color: '#ff6600',
                marginBottom: '8px',
                animation: 'bounce 2s ease-in-out infinite 0.5s'
              }} className="heartbeat-animation neon-glow">
                50K+
              </div>
              <div style={{
              fontSize: '1.125rem',
                color: '#535455',
                fontWeight: '500'
              }}>
                Utilisateurs Actifs
              </div>
            </div>
            
            {/* Statistique 2 */}
            <div style={{
              animation: 'fadeInUp 1s ease-out 3.4s both'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#4f46e5',
                marginBottom: '8px',
                animation: 'bounce 2s ease-in-out infinite 1s'
              }} className="heartbeat-animation neon-glow">
                1M+
              </div>
              <div style={{
              fontSize: '1.125rem',
                color: '#535455',
                fontWeight: '500'
              }}>
                Points Distribués
              </div>
            </div>
            
            {/* Statistique 3 */}
            <div style={{
              animation: 'fadeInUp 1s ease-out 3.6s both'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#10b981',
                marginBottom: '8px',
                animation: 'bounce 2s ease-in-out infinite 1.5s'
              }} className="heartbeat-animation neon-glow">
                95%
              </div>
              <div style={{
                fontSize: '1.125rem',
                color: '#535455',
                fontWeight: '500'
              }}>
                Satisfaction Client
              </div>
            </div>
            
            {/* Statistique 4 */}
            <div style={{
              animation: 'fadeInUp 1s ease-out 3.8s both'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: '#8b5cf6',
                marginBottom: '8px',
                animation: 'bounce 2s ease-in-out infinite 2s'
              }} className="heartbeat-animation neon-glow">
                24/7
              </div>
              <div style={{
                fontSize: '1.125rem',
                color: '#535455',
                fontWeight: '500'
              }}>
                Support Disponible
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de fiche produit */}
      {isModalOpen && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={handleCloseProductModal}
        />
      )}

      {/* Chat Widget - Remplacé par le système de chat global */}
      {/* Le chat est maintenant accessible via le bouton flottant orange en bas à droite */}

      {/* Container des notifications modernes */}
      <NotificationContainer />

    </div>
  )
}
