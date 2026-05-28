"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Heart, 
  Minus, 
  Plus, 
  Share2, 
  ShoppingCart, 
  Star, 
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Truck,
  Shield,
  Gift,
  Coins,
  Users,
  Award,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare,
  Zap,
  Crown,
  Flame,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Send,
  Mic,
  MicOff,
  Paperclip,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  BarChart3
} from "lucide-react"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"
// Import supprimé - remplacé par le nouveau système de chat global

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ProductGlobalChatTrigger } from "@/components/chat"
import { LegacyChatModal } from "@/components/chat/LegacyChatModal"

interface Product {
  id: number
  name: string
  price: number
  pointsPrice: number
  originalPrice: number
  rating: number
  reviews: number
  images?: string[]
  image?: string
  seller: {
    name: string
    avatar: string
    rating: number
    totalSales: number
    responseTime: string
    location: string
    phone: string
    email: string
    joinDate: string
    memberSince: string
    logo: string
  }
  description: string
  specifications: Record<string, string>
  features: string[]
  warranty: string
  shipping: {
    cost: number
    time: string
    method: string
  }
  stock: number
  sharePoints: number
  shares: number
  inStock: boolean
  discount: number
  isHot: boolean
  isNew: boolean
  isLimited: boolean
  badges: string[]
  color: string
  category: string
  tags: string[]
  relatedProducts: number[]
}

interface ProductModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
}

export default function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const router = useRouter()
  // useChat remplacé par le nouveau système de chat global
  // Utilisez le bouton flottant orange en bas à droite pour accéder au chat
  
  const { addNotification } = useNotifications()
  
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState("details")
  const [isWishlisted, setIsWishlisted] = useState(false)
  // États de chat supprimés - remplacés par le système global
  
  // États pour les fonctionnalités vocales et fichiers
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [showFileInput, setShowFileInput] = useState(false)
  
  // Références
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // États pour le modal chat
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatSellerId, setChatSellerId] = useState('')
  const [chatSellerName, setChatSellerName] = useState('')
  const [chatSellerAvatar, setChatSellerAvatar] = useState('')





  // Initialiser les données utilisateur si elles n'existent pas
  useEffect(() => {
    if (!localStorage.getItem('userPoints')) {
      localStorage.setItem('userPoints', '1000') // Points de départ
    }
    
    // Vérifier si le produit est dans la wishlist
    if (product) {
      const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      const isInWishlist = existingWishlist.find((item: any) => item.id === product.id)
      if (isInWishlist) {
        setIsWishlisted(true)
      }
    }
  }, [product])

  // Vérification APRÈS tous les hooks pour respecter les règles React
  if (!product) return null

  // Fonction utilitaire pour obtenir l'image du produit
  const getProductImage = (index: number = 0) => {
    if (product.images && product.images.length > index) {
      return product.images[index]
    }
    return product.image || "/placeholder.svg"
  }

  // Fonction pour trouver un produit similaire pour la comparaison
  const findSimilarProduct = () => {
    // Simuler une base de données de produits similaires
    const similarProducts = [
      {
        id: product.id + 1,
        name: `${product.name} Pro`,
        price: Math.round(product.price * 1.2),
        originalPrice: Math.round(product.price * 1.4),
        rating: Math.min(5, product.rating + 0.2),
        reviews: Math.round(product.reviews * 0.8),
        images: product.images || [product.image || "/placeholder.svg"],
        seller: {
          name: "Vendeur Premium",
          avatar: "/vendor-avatar.png",
          rating: 4.8,
          totalSales: Math.round((product.seller.totalSales || 100) * 1.1),
          responseTime: "2-4h",
          location: "Abidjan, CI",
          phone: "+225 0701234567",
          email: "premium@probooster.online",
          joinDate: "2023",
          memberSince: "1 an",
          logo: "/placeholder-logo.png"
        },
        description: `Version améliorée de ${product.name} avec des fonctionnalités premium`,
        specifications: {
          ...(product.specifications || {}),
          "Version": "Pro",
          "Garantie": "2 ans",
          "Support": "24/7"
        },
        features: [...(product.features || []), "Support premium", "Garantie étendue"],
        warranty: "2 ans",
        shipping: {
          cost: Math.round((product.shipping?.cost || 1000) * 0.9),
          time: "1-2 jours",
          method: "Express"
        },
        stock: Math.round((product.stock || 10) * 0.7),
        sharePoints: Math.round((product.sharePoints || 100) * 1.3),
        shares: Math.round((product.shares || 50) * 1.2),
        inStock: true,
        discount: 15,
        isHot: true,
        isNew: false,
        isLimited: false,
        badges: [...(product.badges || []), "Premium"],
        color: product.color,
        category: product.category,
        tags: [...(product.tags || []), "premium", "pro"],
        relatedProducts: []
      },
      {
        id: product.id + 2,
        name: `${product.name} Édition Limitée`,
        price: Math.round(product.price * 0.9),
        originalPrice: product.price,
        rating: Math.max(1, product.rating - 0.1),
        reviews: Math.round(product.reviews * 0.6),
        images: product.images || [product.image || "/placeholder.svg"],
        seller: {
          name: "Vendeur Économique",
          avatar: "/vendor-avatar.png",
          rating: 4.2,
          totalSales: Math.round((product.seller.totalSales || 100) * 0.8),
          responseTime: "4-8h",
          location: "Lagos, NG",
          phone: "+234 0801234567",
          email: "eco@probooster.online",
          joinDate: "2024",
          memberSince: "6 mois",
          logo: "/placeholder-logo.png"
        },
        description: `Version économique de ${product.name} avec un excellent rapport qualité-prix`,
        specifications: {
          ...(product.specifications || {}),
          "Version": "Économique",
          "Garantie": "1 an",
          "Support": "Standard"
        },
        features: (product.features || []).filter(f => !f.includes("Premium")),
        warranty: "1 an",
        shipping: {
          cost: Math.round((product.shipping?.cost || 1000) * 1.1),
          time: "3-5 jours",
          method: "Standard"
        },
        stock: Math.round((product.stock || 10) * 1.3),
        sharePoints: Math.round((product.sharePoints || 100) * 0.8),
        shares: Math.round((product.shares || 50) * 0.9),
        inStock: true,
        discount: 25,
        isHot: false,
        isNew: false,
        isLimited: true,
        badges: [...(product.badges || []), "Économique"],
        color: product.color,
        category: product.category,
        tags: [...(product.tags || []), "economique", "bon-prix"],
        relatedProducts: []
      }
    ]

    // Algorithme intelligent pour choisir le produit le plus similaire
    const chooseBestSimilar = () => {
      // Critères de similarité
      const categoryMatch = 0.4 // 40% d'importance pour la catégorie
      const priceMatch = 0.3    // 30% d'importance pour le prix
      const ratingMatch = 0.2   // 20% d'importance pour la note
      const featureMatch = 0.1  // 10% d'importance pour les fonctionnalités
      
      let bestProduct = similarProducts[0]
      let bestScore = 0
      
      similarProducts.forEach(prod => {
        let score = 0
        
        // Score pour la catégorie (même catégorie = 100%)
        if (prod.category === product.category) {
          score += categoryMatch
        }
        
        // Score pour le prix (plus proche = meilleur score)
        const priceDiff = Math.abs(prod.price - product.price) / product.price
        score += priceMatch * (1 - priceDiff)
        
        // Score pour la note (plus proche = meilleur score)
        const ratingDiff = Math.abs(prod.rating - product.rating) / 5
        score += ratingMatch * (1 - ratingDiff)
        
        // Score pour les fonctionnalités (plus de fonctionnalités communes = meilleur score)
        const commonFeatures = prod.features ? prod.features.filter(f => product.features && product.features.includes(f)).length : 0
        const totalFeatures = Math.max(prod.features?.length || 0, product.features?.length || 0)
        score += featureMatch * (totalFeatures > 0 ? commonFeatures / totalFeatures : 0)
        
        if (score > bestScore) {
          bestScore = score
          bestProduct = prod
        }
      })
      
      return bestProduct
    }

    // Retourner le produit le plus similaire selon l'algorithme intelligent
    return chooseBestSimilar()
  }

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => Math.min(prev + 1, product.stock || 10))
    } else {
      setQuantity(prev => Math.max(prev - 1, 1))
    }
  }

  const handleAddToCart = () => {
    // Simuler l'ajout au panier
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.images ? product.images[0] : product.image || "/placeholder.svg",
      seller: product.seller.name
    }
    
    // Ajouter au localStorage pour simuler un panier
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id)
    
    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += quantity
    } else {
      existingCart.push(cartItem)
    }
    
    localStorage.setItem('cart', JSON.stringify(existingCart))
    
    // Afficher une notification de succès
    const successMessage = {
      id: Date.now().toString(),
      text: `✅ ${quantity} ${product.name} ajouté${quantity > 1 ? 's' : ''} au panier !`,
      sender: 'system',
      timestamp: new Date(),
      type: 'system'
    }
    
      // Notification d'ajout au panier
      {
      // Créer une notification toast
      addNotification({
        type: 'success',
        title: 'Panier',
        message: `✅ ${quantity} ${product.name} ajouté${quantity > 1 ? 's' : ''} au panier !`,
        duration: 3000
      })
    }
    
    // Fermer le modal après un délai
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  const handleBuyWithPoints = () => {
    // Vérifier si l'utilisateur a assez de points
    const userPoints = parseInt(localStorage.getItem('userPoints') || '0')
    
    if (userPoints < (product.pointsPrice || 0)) {
      const errorMessage = {
        id: Date.now().toString(),
        text: `❌ Points insuffisants ! Vous avez ${userPoints} points, il en faut ${product.pointsPrice || 0}.`,
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      }
      
          // Notification de points insuffisants
    addNotification({
      type: 'error',
      title: 'Points insuffisants',
      message: `❌ Points insuffisants ! Vous avez ${userPoints} points, il en faut ${product.pointsPrice || 0}.`,
      duration: 5000
    })
      return
    }
    
    // Déduire les points
    const newPoints = userPoints - (product.pointsPrice || 0)
    localStorage.setItem('userPoints', newPoints.toString())
    
    // Créer la commande
    const order = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      quantity: quantity,
      totalPoints: product.pointsPrice * quantity,
      date: new Date().toISOString(),
      status: 'pending'
    }
    
    // Sauvegarder la commande
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
    existingOrders.push(order)
    localStorage.setItem('orders', JSON.stringify(existingOrders))
    
    // Message de succès
    const successMessage = {
      id: Date.now().toString(),
      text: `🎉 Commande passée avec ${product.pointsPrice * quantity} points ! Numéro de commande: #${order.id}`,
      sender: 'system',
      timestamp: new Date(),
      type: 'system'
    }
    
    // Notification de succès de commande
    addNotification({
      type: 'success',
      title: 'Commande réussie',
      message: `🎉 Commande passée avec ${product.pointsPrice * quantity} points ! Numéro: #${order.id}`,
      duration: 5000
    })
    
    // Note: Le système de chat est maintenant géré globalement
    
    // Fermer le modal
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const handleToggleWishlist = () => {
    const newWishlistState = !isWishlisted
    setIsWishlisted(newWishlistState)
    
    // Gérer la wishlist dans localStorage
    const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    
    if (newWishlistState) {
      // Ajouter aux favoris
      const wishlistItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: getProductImage(0),
        seller: product.seller.name,
        addedAt: new Date().toISOString()
      }
      
      if (!existingWishlist.find((item: any) => item.id === product.id)) {
        existingWishlist.push(wishlistItem)
        localStorage.setItem('wishlist', JSON.stringify(existingWishlist))
      }
      
      // Message de succès
      const successMessage = {
        id: Date.now().toString(),
        text: `❤️ ${product.name} ajouté aux favoris !`,
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      }
      
      // Notification d'ajout aux favoris
      addNotification({
        type: 'success',
        title: 'Favoris',
        message: `❤️ ${product.name} ajouté aux favoris !`,
        duration: 3000
      })
    } else {
      // Retirer des favoris
      const updatedWishlist = existingWishlist.filter((item: any) => item.id !== product.id)
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
      
      // Message de confirmation
      const removeMessage = {
        id: Date.now().toString(),
        text: `💔 ${product.name} retiré des favoris.`,
        sender: 'system',
        timestamp: new Date(),
        type: 'system'
      }
      
      // Notification de suppression des favoris
      addNotification({
        type: 'info',
        title: 'Favoris',
        message: `💔 ${product.name} retiré des favoris.`,
        duration: 3000
      })
    }
  }

  const handleShare = (platform: string) => {
    const shareText = `🎉 Découvrez ${product.name} sur Probooster !\n💰 Prix: ${product.price.toLocaleString()} FCFA\n⭐ Note: ${product.rating}/5 (${product.reviews} avis)\n🏪 Vendeur: ${product.seller.name}`
    const shareUrl = `${window.location.origin}/product/${product.id}`
    
    let shareLink = ''
    
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n🔗 ' + shareUrl)}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        break
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=Probooster,Marketplace`
        break
      case 'instagram':
        // Instagram ne supporte pas le partage direct via URL, on copie le texte
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`).then(() => {
          addNotification({
            type: 'success',
            title: 'Instagram',
            message: '📸 Texte copié ! Collez-le dans votre story Instagram ou post.',
            duration: 3000
          })
        }).catch(() => {
          const textArea = document.createElement('textarea')
          textArea.value = `${shareText}\n\n${shareUrl}`
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          addNotification({
            type: 'success',
            title: 'Instagram',
            message: '📸 Texte copié ! Collez-le dans votre story Instagram ou post.',
            duration: 3000
          })
        })
        return
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        break
      case 'email':
        shareLink = `mailto:?subject=${encodeURIComponent(`Découvrez ${product.name} sur Probooster`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`
        break
      case 'copy':
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`).then(() => {
          addNotification({
            type: 'success',
            title: 'Copie',
            message: '✅ Lien copié dans le presse-papiers !',
            duration: 3000
          })
        }).catch(() => {
          // Fallback pour les navigateurs qui ne supportent pas clipboard API
          const textArea = document.createElement('textarea')
          textArea.value = `${shareText}\n\n${shareUrl}`
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          addNotification({
            type: 'success',
            title: 'Copie',
            message: '✅ Lien copié dans le presse-papiers !',
            duration: 3000
          })
        })
        return
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400')
      
      // Notification de partage réussi
      addNotification({
        type: 'success',
        title: 'Partage réussi',
        message: `📤 Produit partagé sur ${platform.charAt(0).toUpperCase() + platform.slice(1)} !`,
        duration: 3000
      })
    }
  }

  const handleContactSeller = (method: 'chat' | 'phone' | 'email') => {
    switch (method) {
      case 'chat':
        // Ouvrir le modal chat avec les informations du vendeur et du produit
        setChatSellerId(product.seller.name.toLowerCase().replace(/\s+/g, '-'))
        setChatSellerName(product.seller.name)
        setChatSellerAvatar(product.seller.logo || product.seller.avatar)
        setShowChatModal(true)
        break
        
      case 'phone':
        // Vérifier si l'appareil supporte les appels
        if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
        window.open(`tel:${product.seller.phone}`)
        } else {
          // Copier le numéro dans le presse-papiers
          navigator.clipboard.writeText(product.seller.phone).then(() => {
          addNotification({
            type: 'success',
            title: 'Téléphone',
            message: `📞 Numéro copié : ${product.seller.phone}\n\nAppelez ce numéro pour contacter le vendeur.`,
            duration: 5000
          })
          }).catch(() => {
          addNotification({
            type: 'info',
            title: 'Téléphone',
            message: `📞 Numéro du vendeur : ${product.seller.phone}\n\nCopiez ce numéro pour l'appeler.`,
            duration: 5000
          })
          })
        }
        
        // Message de confirmation - Notification moderne
        addNotification({
          type: 'info',
          title: 'Appel initié',
          message: `📞 Appel vers ${product.seller.phone}`,
          duration: 3000
        })
        break
        
      case 'email':
        const subject = encodeURIComponent(`Question sur le produit : ${product.name}`)
        const body = encodeURIComponent(`Bonjour ${product.seller.name},\n\nJe suis intéressé(e) par votre produit "${product.name}" (ID: ${product.id}).\n\nPouvez-vous me donner plus d'informations sur :\n\n- La disponibilité\n- Les options de livraison\n- Les garanties\n- Les prix\n\nMerci d'avance !\n\nCordialement,`)
        
        window.open(`mailto:${product.seller.email}?subject=${subject}&body=${body}`)
        
        // Notification de confirmation email
        addNotification({
          type: 'info',
          title: 'Email ouvert',
          message: `📧 Email ouvert vers ${product.seller.email}`,
          duration: 3000
        })
        break
    }
  }

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !currentSession) return

    // Ajouter le message de l'utilisateur
    addMessage(currentSession.id, {
      text: chatInput,
      sender: 'user',
      type: 'text',
      productId: product?.id
    })
    
    setChatInput("")
    setTyping(currentSession.id, true)

    // Simuler une réponse du vendeur
    setTimeout(() => {
      const responses = [
        "Merci pour votre message ! Je vais vous répondre dans les plus brefs délais.",
        "Excellente question ! Laissez-moi vous donner plus de détails.",
        "Je comprends votre demande. Voici ce que je peux vous proposer :",
        "Parfait ! Je suis là pour vous aider avec ce produit.",
        "Très bonne question ! Voici les informations que vous cherchez :",
        "Je suis ravi de vous aider ! Voici ma réponse :",
        "Excellente observation ! Laissez-moi clarifier cela pour vous.",
        "Merci de votre intérêt ! Voici les détails que vous demandez :"
      ]
      
      addMessage(currentSession.id, {
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'seller',
        type: 'text',
        productId: product?.id
      })
      setTyping(currentSession.id, false)
    }, 1000 + Math.random() * 2000)
  }

  const handleChatAction = (action: 'buy' | 'cart' | 'wishlist') => {
    switch (action) {
      case 'buy':
        // Utiliser la même logique que handleBuyWithPoints
        const userPoints = parseInt(localStorage.getItem('userPoints') || '0')
        
        if (userPoints < product.pointsPrice) {
          const errorMessage = {
            id: Date.now().toString(),
            text: `❌ Points insuffisants ! Vous avez ${userPoints} points, il en faut ${product.pointsPrice}.`,
            sender: 'system',
            timestamp: new Date(),
            type: 'system'
          }
          if (currentSession) {
            addMessage(currentSession.id, {
              text: `❌ Points insuffisants ! Vous avez ${userPoints} points, il en faut ${product.pointsPrice}.`,
              sender: 'system',
              type: 'system',
              productId: product.id
            })
          }
          return
        }
        
        // Déduire les points
        const newPoints = userPoints - product.pointsPrice
        localStorage.setItem('userPoints', newPoints.toString())
        
        // Créer la commande
        const order = {
          id: Date.now(),
          productId: product.id,
          productName: product.name,
          quantity: 1,
          totalPoints: product.pointsPrice,
          date: new Date().toISOString(),
          status: 'pending'
        }
        
        // Sauvegarder la commande
        const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        existingOrders.push(order)
        localStorage.setItem('orders', JSON.stringify(existingOrders))
        
        const buyMessage = {
          id: Date.now().toString(),
          text: `🎉 Commande passée avec ${product.pointsPrice} points !\n📋 Numéro de commande: #${order.id}\n📧 Vous recevrez un email de confirmation.`,
          sender: 'system',
          timestamp: new Date(),
          type: 'system'
        }
        if (currentSession) {
          addMessage(currentSession.id, {
            text: `🎉 Commande passée avec ${product.pointsPrice} points !\n📋 Numéro de commande: #${order.id}\n📧 Vous recevrez un email de confirmation.`,
            sender: 'system',
            type: 'system',
            productId: product.id
          })
        }
        break
        
      case 'cart':
        // Utiliser la même logique que handleAddToCart
        const cartItem = {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: getProductImage(0),
          seller: product.seller.name
        }
        
        const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
        const existingItemIndex = existingCart.findIndex((item: any) => item.id === product.id)
        
        if (existingItemIndex >= 0) {
          existingCart[existingItemIndex].quantity += 1
        } else {
          existingCart.push(cartItem)
        }
        
        localStorage.setItem('cart', JSON.stringify(existingCart))
        
        const cartMessage = {
          id: Date.now().toString(),
          text: `✅ ${product.name} ajouté au panier !\n🛒 Votre panier contient maintenant ${existingCart.length} article${existingCart.length > 1 ? 's' : ''}.`,
          sender: 'system',
          timestamp: new Date(),
          type: 'system'
        }
        if (currentSession) {
          addMessage(currentSession.id, {
            text: `✅ ${product.name} ajouté au panier !\n🛒 Votre panier contient maintenant ${existingCart.length} article${existingCart.length > 1 ? 's' : ''}.`,
            sender: 'system',
            type: 'system',
            productId: product.id
          })
        }
        break
        
      case 'wishlist':
        // Utiliser la même logique que handleToggleWishlist
        const existingWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
        const isInWishlist = existingWishlist.find((item: any) => item.id === product.id)
        
        if (!isInWishlist) {
          const wishlistItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            image: getProductImage(0),
            seller: product.seller.name,
            addedAt: new Date().toISOString()
          }
          
          existingWishlist.push(wishlistItem)
          localStorage.setItem('wishlist', JSON.stringify(existingWishlist))
          
          const wishlistMessage = {
            id: Date.now().toString(),
            text: `❤️ ${product.name} ajouté aux favoris !\n💝 Vous avez maintenant ${existingWishlist.length} favori${existingWishlist.length > 1 ? 's' : ''}.`,
            sender: 'system',
            timestamp: new Date(),
            type: 'system'
          }
          if (currentSession) {
            addMessage(currentSession.id, {
              text: `❤️ ${product.name} ajouté aux favoris !\n💝 Vous avez maintenant ${existingWishlist.length} favori${existingWishlist.length > 1 ? 's' : ''}.`,
              sender: 'system',
              type: 'system',
              productId: product.id
            })
          }
        } else {
          if (currentSession) {
            addMessage(currentSession.id, {
              text: `💔 ${product.name} retiré des favoris.`,
              sender: 'system',
              type: 'system',
              productId: product.id
            })
          }
        }
        break
    }
  }

  // Fonctionnalités vocales
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        const voiceMessage = {
      id: Date.now().toString(),
          audioUrl,
          duration: recordingTime,
          sender: 'user',
          timestamp: new Date(),
          type: 'voice'
        }
        
        if (currentSession) {
          addMessage(currentSession.id, {
            text: "🎤 Message vocal",
            sender: 'user',
            type: 'audio',
            fileUrl: audioUrl,
            fileName: `audio_${Date.now()}.wav`,
            fileSize: formatFileSize(audioBlob.size),
            fileType: 'audio',
            productId: product?.id
          })
        }
        setAudioChunks([])
        setRecordingTime(0)
        
        // Simuler une réponse vocale du vendeur
        setTimeout(() => {
          if (currentSession) {
            addMessage(currentSession.id, {
              text: "🎤 Message vocal",
      sender: 'seller',
              type: 'audio',
              fileUrl: audioUrl,
              fileName: `audio_${Date.now()}.wav`,
              fileSize: formatFileSize(audioBlob.size),
              fileType: 'audio',
              productId: product?.id
            })
          }
        }, 2000)
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setAudioChunks(chunks)
      setIsRecording(true)
      
      // Démarrer le chronomètre
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors de l\'accès au microphone:', error)
      
      // Gestion intelligente des erreurs de microphone
      let errorMessage = 'Impossible d\'accéder au microphone.'
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permission microphone refusée. Cliquez sur l\'icône microphone dans la barre d\'adresse pour autoriser l\'accès.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Aucun microphone détecté. Vérifiez que votre appareil dispose d\'un microphone.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Le microphone est utilisé par une autre application. Fermez les autres applications qui utilisent le microphone.'
        } else {
          errorMessage = `Erreur microphone: ${error.message}`
        }
      }
      
      // Notification d'erreur microphone
      addNotification({
        type: 'error',
        title: 'Erreur Microphone',
        message: `${errorMessage}\n\nSolutions:\n• Vérifiez les permissions du navigateur\n• Cliquez sur l'icône microphone dans la barre d'adresse\n• Rafraîchissez la page et réessayez`,
        duration: 8000
      })
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }
  
  // Fonctionnalités d'envoi de fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    setIsFileUploading(true)
    
    // Simuler l'upload
    setTimeout(() => {
      const file = files[0]
      const fileType = getFileType(file.type)
      const fileSize = formatFileSize(file.size)
      
      const fileMessage = {
        id: Date.now().toString(),
        fileName: file.name,
        fileSize,
        fileType,
        fileUrl: URL.createObjectURL(file),
        sender: 'user',
        type: 'file'
      }
      
      if (currentSession) {
        addMessage(currentSession.id, {
          text: `📎 ${file.name}`,
          sender: 'user',
          type: 'file',
          fileUrl: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          fileType: getFileType(file.type),
          productId: product?.id
        })
      }
      setIsFileUploading(false)
      setShowFileInput(false)
      
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Simuler une réponse du vendeur
      setTimeout(() => {
        if (currentSession) {
          addMessage(currentSession.id, {
            text: `Merci pour le fichier "${file.name}" ! Je vais l'examiner et vous répondre rapidement.`,
            sender: 'seller',
            type: 'text',
            productId: product?.id
          })
        }
      }, 1500)
      
    }, 1000)
  }
  
  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document'
    return 'file'
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      case 'pdf': return <FileText className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      default: return <File className="h-4 w-4" />
    }
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Détails du produit - {product.name}</DialogTitle>
        </DialogHeader>
        <div className="relative">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left Column - Images */}
            <div className="relative bg-gray-50 p-6">
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square overflow-hidden rounded-xl border-2 border-gray-100 shadow-lg">
                  <Image
                    src={product.images ? product.images[selectedImage] : product.image || "/placeholder.svg"}
                    alt={product.name}
                    width={600}
                    height={600}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Image Navigation - Only show if multiple images exist */}
                  {product.images && product.images.length > 1 && (
                  <div className="absolute top-4 left-4 flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/90 hover:bg-white shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300"
                      onClick={() => setSelectedImage(prev => Math.max(prev - 1, 0))}
                      disabled={selectedImage === 0}
                    >
                      <ChevronLeft className="h-4 w-4 animate-pulse" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/90 hover:bg-white shadow-lg transform hover:scale-110 active:scale-95 transition-all duration-300"
                        onClick={() => setSelectedImage(prev => Math.min(prev + 1, (product.images?.length || 1) - 1))}
                        disabled={selectedImage === (product.images?.length || 1) - 1}
                    >
                      <ChevronRight className="h-4 w-4 animate-pulse" />
                    </Button>
                  </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {product.discount > 0 && (
                      <Badge className="bg-red-500 text-white animate-pulse shadow-lg">
                        -{product.discount}%
                      </Badge>
                    )}
                    {product.isHot && (
                      <Badge className="bg-orange-500 text-white animate-bounce shadow-lg">
                        🔥 HOT
                      </Badge>
                    )}
                    {product.isNew && (
                      <Badge className="bg-green-500 text-white animate-pulse shadow-lg">
                        🆕 NOUVEAU
                      </Badge>
                    )}
                    {product.isLimited && (
                      <Badge className="bg-purple-500 text-white animate-pulse shadow-lg">
                        ⏰ LIMITÉ
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Thumbnail Images - Only show if multiple images exist */}
                {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                        selectedImage === index 
                          ? "border-[#ff6600] shadow-lg scale-105" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                )}
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div className="p-6 space-y-6">
              {/* Product Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="font-semibold text-gray-900">{product.rating}</span>
                        <span className="text-gray-500">({product.reviews} avis)</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                  
                                     <div className="flex space-x-2">
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={handleToggleWishlist}
                       className={`${isWishlisted ? 'text-red-500 bg-red-50' : 'text-gray-400'} hover:text-red-500 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 active:scale-95`}
                     >
                       <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current animate-pulse' : 'hover:scale-110'} transition-all duration-300`} />
                     </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="transform hover:scale-110 active:scale-95 transition-all duration-300">
                          <Share2 className="h-5 w-5 animate-pulse" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-48">
                        <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="flex items-center space-x-2">
                          {/* WhatsApp Icon */}
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" fill="#25D366"/>
                          </svg>
                          <span>WhatsApp</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('facebook')} className="flex items-center space-x-2">
                          {/* Facebook Icon */}
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                          </svg>
                          <span>Facebook</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('twitter')} className="flex items-center space-x-2">
                          {/* Twitter/X Icon */}
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000"/>
                          </svg>
                          <span>Twitter</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('telegram')} className="flex items-center space-x-2">
                          {/* Telegram Icon */}
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#0088CC"/>
                          </svg>
                          <span>Telegram</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('email')} className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Email</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare('copy')} className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copier le lien</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Price Section */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-[#ff6600]">
                      {product.price.toLocaleString()} FCFA
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-xl text-gray-400 line-through">
                        {product.originalPrice.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {product.pointsPrice} points ou {Math.floor(product.price / 200)} points
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2">
                  {product.inStock ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">En stock ({product.stock} disponibles)</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Rupture de stock</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Quantité</label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(false)}
                    disabled={quantity <= 1}
                    className="transform hover:scale-110 active:scale-95 transition-all duration-300 hover:bg-red-50 hover:border-red-300"
                  >
                    <Minus className="h-4 w-4 animate-pulse" />
                  </Button>
                  <span className="w-16 text-center font-semibold animate-pulse">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(true)}
                    disabled={quantity >= product.stock}
                    className="transform hover:scale-110 active:scale-95 transition-all duration-300 hover:bg-green-50 hover:border-green-300"
                  >
                    <Plus className="h-4 w-4 animate-pulse" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="bg-[#ff6600] hover:bg-[#e55a00] text-white py-3 text-lg font-semibold transform hover:scale-105 transition-all duration-300 hover:shadow-lg active:scale-95"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2 animate-bounce" />
                  Ajouter au panier
                </Button>
                
                <Button 
                  variant="outline" 
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 py-3 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-purple-300 group"
                  onClick={handleBuyWithPoints}
                  disabled={!product.inStock}
                >
                  <div className="relative mr-2">
                    <Coins className="h-5 w-5 animate-bounce group-hover:animate-spin" />
                    {/* Pièce animée en haut à droite */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping group-hover:animate-bounce"></div>
                    {/* Pièce animée en bas à gauche */}
                    <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse group-hover:animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    {/* Pièce animée au centre */}
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-yellow-300 rounded-full animate-pulse group-hover:animate-bounce" style={{ animationDelay: '1s' }}></div>
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-full animate-pulse group-hover:animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                    {/* Pièces supplémentaires au survol */}
                    <div className="absolute -top-2 -right-2 w-1 h-1 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.2s' }}></div>
                    <div className="absolute -bottom-2 -left-2 w-1 h-1 bg-yellow-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.7s' }}></div>
                  </div>
                  Acheter avec points
                </Button>
              </div>

              {/* Seller Info */}
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      {product.seller.logo ? (
                        <Image 
                          src={product.seller.logo || "/placeholder-logo.svg"}
                          alt={`Logo ${product.seller.name}`}
                          width={40}
                          height={40}
                          className="rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                          <AvatarImage src={product.seller.avatar} />
                          <AvatarFallback>{product.seller.name ? product.seller.name[0] : 'U'}</AvatarFallback>
                        </Avatar>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 
                          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                          onClick={() => router.push(`/seller/${product.seller.name.toLowerCase().replace(/\s+/g, '-')}`)}
                        >
                          {product.seller.name}
                        </h4>
                        <Badge variant="outline" className="text-[10px] border-green-200 text-green-600 bg-green-50 px-1.5 py-0 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                          Actif
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{product.seller.rating}</span>
                        <span>•</span>
                        <span>{product.seller.totalSales || 100} ventes</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Membre depuis {product.seller.memberSince || "2 ans"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-green-200 text-green-600 hover:bg-green-50 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-green-300"
                      onClick={() => handleContactSeller('chat')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Chat
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-blue-300"
                      onClick={() => handleContactSeller('phone')}
                    >
                      <Phone className="h-4 w-4 mr-2 animate-bounce" />
                      Appeler
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:border-gray-300"
                      onClick={() => handleContactSeller('email')}
                    >
                      <Mail className="h-4 w-4 mr-2 animate-pulse" />
                      Email
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Livraison</h4>
                      <p className="text-sm text-gray-600">
                        {product.shipping?.cost > 0 
                          ? `${product.shipping.cost.toLocaleString()} FCFA` 
                          : 'Gratuite'
                        } • {product.shipping?.time || '3-5 jours'}
                      </p>
                    </div>
                  </div>
                  
                                     <div className="flex items-center space-x-3">
                     <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Garantie {product.warranty || '1 an'}</span>
                   </div>
                   <div className="flex items-center space-x-3">
                     <RefreshCw className="h-4 w-4 text-blue-600" />
                     <span className="text-sm text-gray-600">Retours: 30 jours satisfait ou remboursé</span>
                   </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Récompenses et Points - Design Élégant */}
            <div className="mt-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  {/* En-tête simple */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Coins className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Gagnez des points</h3>
                        <p className="text-sm text-gray-500">Partagez et cumulez des récompenses</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                      +{product.sharePoints || 100} pts
                    </Badge>
                  </div>

                  {/* Statistiques simples */}
                  <div className="flex justify-between mb-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{product.sharePoints || 100}</div>
                      <div className="text-xs text-gray-500">Points à gagner</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{product.shares || 50}</div>
                      <div className="text-xs text-gray-500">Partages</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">5</div>
                      <div className="text-xs text-gray-500">Points/partage</div>
                    </div>
                  </div>

                  {/* Boutons de partage ronds */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Partagez sur :</h4>
                    
                    <div className="flex justify-center space-x-4">
                      {/* WhatsApp */}
                      <Button
                        onClick={() => handleShare('whatsapp')}
                        size="icon"
                        className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                      >
                        <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                        </div>
                      </Button>

                      {/* Facebook */}
                      <Button
                        onClick={() => handleShare('facebook')}
                        size="icon"
                        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                      >
                        <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                        </div>
                      </Button>

                      {/* X (Twitter) */}
                      <Button
                        onClick={() => handleShare('twitter')}
                        size="icon"
                        className="w-12 h-12 rounded-full bg-black hover:bg-gray-800 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                      >
                        <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                        </div>
                      </Button>

                      {/* Instagram */}
                      <Button
                        onClick={() => handleShare('instagram')}
                        size="icon"
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 active:scale-95 group"
                      >
                        <div className="relative">
                          <svg className="w-5 h-5 fill-current group-hover:animate-bounce" viewBox="0 0 24 24">
                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                        </div>
                      </Button>
                    </div>

                    {/* Progression simple */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progression</span>
                        <span className="text-xs text-gray-600 font-medium">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Bronze</span>
                        <span>Argent</span>
                      </div>
                    </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Section - Tabs */}
          <div className="border-t border-gray-200 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Détails</span>
                </TabsTrigger>
                <TabsTrigger value="specs" className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>Spécifications</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Avis ({product.reviews})</span>
                </TabsTrigger>
                <TabsTrigger value="seller" className="flex items-center space-x-2">
                  <Crown className="h-4 w-4" />
                  <span>Vendeur</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Caractéristiques</h4>
                      <ul className="space-y-1">
                        {product.features && product.features.length > 0 ? (
                          product.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </li>
                          ))
                        ) : (
                          <li className="text-sm text-gray-500 italic">Aucune caractéristique disponible</li>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.tags && product.tags.length > 0 ? (
                          product.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">Aucun tag disponible</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Spécifications techniques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.specifications && Object.keys(product.specifications).length > 0 ? (
                      Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">{key}</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-500 italic">
                        Aucune spécification technique disponible
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Avis clients</h3>
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="font-semibold">{product.rating}</span>
                      <span className="text-gray-500">/ 5</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Rating breakdown */}
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 w-8">{stars}★</span>
                          <Progress value={stars * 20} className="flex-1 h-2" />
                          <span className="text-sm text-gray-500 w-12">{(stars * 20)}%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center py-4">
                      <Button 
                        variant="outline" 
                        className="w-full transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => {
                          const reviewData = {
                            productId: product.id,
                            productName: product.name,
                            rating: 0,
                            comment: '',
                            date: new Date().toISOString()
                          }
                          
                          // Simuler l'ouverture d'un formulaire d'avis
                          const reviewMessage = {
                            id: Date.now().toString(),
                            text: `📝 Formulaire d'avis ouvert pour ${product.name}.\n\nVeuillez remplir le formulaire qui s'ouvre dans un nouvel onglet.`,
                            sender: 'system',
                            timestamp: new Date(),
                            type: 'system'
                          }
                          
                          // Notification pour l'ouverture du formulaire d'avis
                          addNotification({
                            type: 'info',
                            title: 'Formulaire d\'avis',
                            message: `📝 Formulaire d'avis ouvert pour ${product.name}.\n\nVeuillez remplir le formulaire qui s'ouvre dans un nouvel onglet.`,
                            duration: 5000
                          })
                          
                          // Simuler l'ouverture d'un formulaire
                          setTimeout(() => {
                            const successMessage = {
                              id: (Date.now() + 1).toString(),
                              text: `✅ Votre avis a été enregistré avec succès !\n⭐ Merci pour votre contribution à la communauté Probooster.`,
                              sender: 'system',
                              timestamp: new Date(),
                              type: 'system'
                            }
                            
                            // Notification de succès pour l'avis
                            addNotification({
                              type: 'success',
                              title: 'Avis enregistré',
                              message: '✅ Votre avis a été enregistré avec succès !\n⭐ Merci pour votre contribution !',
                              duration: 4000
                            })
                          }, 2000)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 animate-pulse" />
                        Laisser un avis
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seller" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {product.seller.logo ? (
                        <Image 
                          src={product.seller.logo || "/placeholder-logo.svg"}
                          alt={`Logo ${product.seller.name}`}
                          width={64}
                          height={64}
                          className="rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <Avatar className="h-16 w-16 ring-2 ring-white shadow-md">
                          <AvatarImage src={product.seller.avatar} />
                          <AvatarFallback className="text-lg">{product.seller.name ? product.seller.name[0] : 'U'}</AvatarFallback>
                        </Avatar>
                      )}
                      <span className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 
                          className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                          onClick={() => router.push(`/seller/${product.seller.name.toLowerCase().replace(/\s+/g, '-')}`)}
                        >
                          {product.seller.name}
                        </h3>
                        <Badge variant="outline" className="text-xs border-green-200 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                          Actif
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{product.seller.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>{product.seller.totalSales || 100} ventes</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>Réponse: {product.seller.responseTime}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-full w-fit">
                        <Clock className="h-4 w-4 mr-2 text-orange-500" />
                        <span>Membre depuis {product.seller.memberSince || "2 ans"}</span>
                        {product.seller.joinDate && (
                          <span className="ml-1 text-gray-400">({product.seller.joinDate})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <MapPin className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Localisation</h4>
                            <p className="text-sm text-gray-600">{product.seller.location}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <Phone className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900">Contact</h4>
                            <p className="text-sm text-gray-600">{product.seller.phone}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] transform hover:scale-105 transition-all duration-300 hover:shadow-lg active:scale-95"
                      onClick={() => {
                        setChatSellerId(product.seller.name.toLowerCase().replace(/\s+/g, '-'))
                        setChatSellerName(product.seller.name)
                        setChatSellerAvatar(product.seller.logo || product.seller.avatar)
                        setShowChatModal(true)
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2 animate-pulse" />
                      Discuter avec le vendeur
                    </Button>
                    
                      <Button 
                        variant="outline"
                      className="transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleContactSeller('phone')}
                      >
                      <Phone className="h-4 w-4 mr-2 animate-bounce" />
                        Appeler
                      </Button>
                      <Button 
                        variant="outline"
                      className="transform hover:scale-105 transition-all duration-300 hover:shadow-md active:scale-95 hover:bg-gray-50 hover:border-gray-300"
                        onClick={() => handleContactSeller('email')}
                      >
                      <Mail className="h-4 w-4 mr-2 animate-pulse" />
                        Email
                      </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
                     </div>
         </div>

         {/* Chat Section - Ancien design restauré avec nouveau système de chat */}
         <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
           <div className="p-4">
             {/* En-tête du chat moderne */}
             <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-t-2xl p-4 border-b border-orange-200 shadow-lg">
               {/* Effet de brillance en arrière-plan */}
               <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 rounded-t-2xl animate-pulse"></div>
               
               <div className="relative flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   {/* Avatar du vendeur avec animation moderne */}
                   <div className="relative group">
                     <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:ring-orange-200 transition-all duration-300">
                       {product.seller?.logo ? (
                         <Image 
                           src={product.seller.logo}
                           alt={product.seller.name}
                           width={40}
                           height={40}
                           className="rounded-full object-cover"
                         />
                       ) : (
                         <span className="text-orange-600 font-bold text-lg">VP</span>
                       )}
                     </div>
                     {/* Indicateur de statut animé */}
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md animate-ping"></div>
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                     {/* Effet de brillance au survol */}
                     <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   </div>
                   
                   {/* Informations du vendeur améliorées */}
                   <div className="flex flex-col">
                     <div className="flex items-center space-x-2">
                       <h3 
                         className="text-lg font-bold text-white drop-shadow-sm cursor-pointer hover:text-blue-200 transition-colors duration-300"
                         onClick={() => router.push(`/seller/${product.seller?.name.toLowerCase().replace(/\s+/g, '-')}`)}
                       >
                         {product.seller?.name || 'Vendeur Probooster'}
                       </h3>
                       <Badge className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/30 animate-pulse">
                         <span className="h-2 w-2 rounded-full bg-green-400 mr-1.5 animate-ping"></span>
                         En ligne
                       </Badge>
                     </div>
                     
                     {/* Message informatif sur la comparaison automatique */}
                     <div className="mt-2 bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                       <p className="text-white text-sm">
                         💬 <strong>Chat moderne et sécurisé</strong><br />
                         Connecté au système global de synchronisation
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 {/* Bouton pour ouvrir le chat global */}
                 <Button
                   onClick={() => {
                     setChatSellerId(`seller-${product.id}`)
                     setChatSellerName(product.seller?.name || 'Vendeur Probooster')
                     setChatSellerAvatar(product.seller?.avatar || product.seller?.logo || '/placeholder-user.jpg')
                     setShowChatModal(true)
                   }}
                   className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                 >
                   <MessageCircle className="h-4 w-4 mr-2" />
                   Démarrer le chat
                 </Button>
               </div>
             </div>
           </div>
         </div>
         
         {/* Ancienne section chat désactivée pour référence */}
         {false && (
           <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white">
             <div className="p-4">
               {/* En-tête du chat moderne */}
               <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-t-2xl p-4 border-b border-orange-200 shadow-lg">
                 {/* Effet de brillance en arrière-plan */}
                 <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 rounded-t-2xl animate-pulse"></div>
                 
                 <div className="relative flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     {/* Avatar du vendeur avec animation moderne */}
                     <div className="relative group">
                       <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:ring-orange-200 transition-all duration-300">
                         {product.seller.logo ? (
                           <Image 
                             src={product.seller.logo}
                             alt={product.seller.name}
                             width={40}
                             height={40}
                             className="rounded-full object-cover"
                           />
                         ) : (
                           <span className="text-orange-600 font-bold text-lg">VP</span>
                         )}
                       </div>
                       {/* Indicateur de statut animé */}
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md animate-ping"></div>
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                       {/* Effet de brillance au survol */}
                       <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                     </div>
                     
                     {/* Informations du vendeur améliorées */}
                     <div className="flex flex-col">
                 <div className="flex items-center space-x-2">
                         <h3 
                           className="text-lg font-bold text-white drop-shadow-sm cursor-pointer hover:text-blue-200 transition-colors duration-300"
                           onClick={() => router.push(`/seller/${product.seller.name.toLowerCase().replace(/\s+/g, '-')}`)}
                         >
                           {product.seller.name}
                         </h3>
                         <Badge className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full border border-white/30 animate-pulse">
                           <span className="h-2 w-2 rounded-full bg-green-400 mr-1.5 animate-ping"></span>
                           En ligne
                   </Badge>
                       </div>
                       
                       {/* Message informatif sur la comparaison automatique */}
                       <div className="mt-2 bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                         <div className="flex items-center space-x-2 text-white/90">
                           <BarChart3 className="h-4 w-4 text-blue-200" />
                           <span className="text-xs font-medium">💡 Comparaison automatique disponible</span>
                         </div>
                         <p className="text-xs text-white/80 mt-1">
                           Cliquez sur "Comparer" pour analyser ce produit avec un produit similaire
                         </p>
                 </div>
                       <div className="flex items-center space-x-3 text-xs text-white/90">
                         <div className="flex items-center space-x-1">
                           <Clock className="h-3 w-3 text-yellow-300 animate-pulse" />
                           <span>Réponse: {product.seller.responseTime}</span>
                         </div>
                         <span>•</span>
                         <div className="flex items-center space-x-1">
                           <Star className="h-3 w-3 text-yellow-300 fill-current" />
                           <span>{product.seller.rating}/5</span>
                         </div>
                         <span>•</span>
                         <div className="flex items-center space-x-1">
                           <TrendingUp className="h-3 w-3 text-green-300" />
                           <span>{product.seller.totalSales || 100} ventes</span>
                         </div>
                       </div>
                     </div>
                   </div>
                   
                   {/* Boutons d'action dans l'en-tête */}
                   <div className="flex items-center space-x-2">
                     {/* Bouton favoris intégré */}
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => handleChatAction('wishlist')}
                       className={`h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-110 active:scale-95 ${isWishlisted ? 'text-red-300 bg-red-500/20' : 'text-white'}`}
                     >
                       <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current animate-pulse' : ''}`} />
                     </Button>
                     
                     {/* Bouton fermer avec animation */}
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setIsChatOpen(false)}
                       className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-red-500/30 hover:text-red-200 transform hover:scale-110 active:scale-95 transition-all duration-300"
                 >
                   <X className="h-4 w-4" />
                 </Button>
                   </div>
               </div>

                 {/* Barre de progression animée */}
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 via-white/50 to-white/30 rounded-b-2xl overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse"></div>
                 </div>
               </div>

               {/* Product Info in Chat - Design Amélioré */}
               <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-2xl p-4 mb-5 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                 {/* Effet de brillance en arrière-plan */}
                 <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 via-red-100/20 to-pink-100/20 animate-pulse"></div>
                 
                 <div className="relative flex items-center space-x-4">
                   <div className="relative group">
                     <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                     <Image
                       src={getProductImage(0)}
                       alt={product.name}
                       width={70}
                       height={70}
                       className="rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300 ring-2 ring-white/50"
                     />
                     {product.discount > 0 && (
                       <Badge className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse border border-white">
                         -{product.discount}%
                       </Badge>
                     )}
                     {/* Effet de brillance sur l'image */}
                     <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                   </div>
                   <div className="flex-1">
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="font-bold text-sm line-clamp-1 text-gray-800 group-hover:text-orange-600 transition-all duration-300">
                         {product.name}
                       </h4>
                       <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-2 py-1 rounded-full shadow-md animate-pulse">
                         💬 Chat en direct
                       </Badge>
                     </div>
                     <div className="flex items-center space-x-3 mb-2">
                       <span className="text-lg font-bold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent animate-pulse">
                         {product.price.toLocaleString()} F CFA
                       </span>
                       <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-50 to-orange-50 px-2 py-1 rounded-full shadow-sm border border-yellow-200">
                         <Star className="h-3 w-3 text-yellow-500 fill-current animate-pulse" />
                         <span className="text-xs text-yellow-700 font-medium">{product.rating}</span>
                       </div>
                       {product.inStock ? (
                         <div className="flex items-center space-x-1 text-green-600">
                           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                           <span className="text-xs font-medium">En stock</span>
                     </div>
                       ) : (
                         <div className="flex items-center space-x-1 text-red-600">
                           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                           <span className="text-xs font-medium">Rupture</span>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                 
                 {/* Barre de progression en bas */}
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-b-2xl overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                 </div>
               </div>
                 
                 {/* Action Buttons - Design Amélioré */}
                 <div className="flex items-center space-x-3 mt-4">
                   <Button
                     size="sm"
                     onClick={() => handleChatAction('buy')}
                     className="bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs rounded-full px-5 py-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium border-0"
                   >
                     <ShoppingCart className="h-4 w-4 mr-2 animate-bounce" />
                     Acheter
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleChatAction('cart')}
                     className="text-xs rounded-full border-2 border-green-200 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white"
                   >
                     <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
                     Panier
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       // Fonction utilitaire pour localStorage sécurisé
                       const safeLocalStorage = {
                         getItem: (key: string, defaultValue: string = '') => {
                           if (typeof window !== 'undefined' && window.localStorage) {
                             return localStorage.getItem(key) || defaultValue
                           }
                           return defaultValue
                         },
                         setItem: (key: string, value: string) => {
                           if (typeof window !== 'undefined' && window.localStorage) {
                             localStorage.setItem(key, value)
                           }
                         }
                       }
                       
                       // Trouver un produit similaire pour la comparaison
                       const similarProduct = findSimilarProduct()
                       
                       // Ajouter les deux produits à la comparaison
                       const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
                       
                       // Vérifier si les produits ne sont pas déjà dans la comparaison
                       const productExists = compareList.find((p: any) => p.id === product.id)
                       const similarExists = compareList.find((p: any) => p.id === similarProduct.id)
                       
                       if (!productExists && !similarExists) {
                         if (compareList.length >= 3) { // Réserver une place pour le produit similaire
                           addNotification({ 
  type: 'warning', 
  title: 'Limite de comparaison atteinte', 
  message: 'Vous ne pouvez comparer que 4 produits maximum !' 
})
                           return
                         }
                         
                         // Ajouter le produit actuel
                         compareList.push({
                           id: product.id,
                           name: product.name,
                           price: product.price,
                           image: getProductImage(0),
                           seller: product.seller.name || 'Vendeur Probooster'
                         })
                         
                         // Ajouter le produit similaire
                         compareList.push({
                           id: similarProduct.id,
                           name: similarProduct.name,
                           price: similarProduct.price,
                           image: similarProduct.images && similarProduct.images.length > 0 ? similarProduct.images[0] : "/placeholder.svg",
                           seller: similarProduct.seller.name || 'Vendeur Probooster'
                         })
                         
                         safeLocalStorage.setItem('compareList', JSON.stringify(compareList))
                         
                         // Message de confirmation avec les produits ajoutés
                         addNotification({
                           type: 'success',
                           title: 'Comparaison créée !',
                           message: `${product.name} vs ${similarProduct.name}\n\nLe modal de comparaison s'ouvre par-dessus.`
                         })
                         
                         // Notification pour la comparaison créée
                         addNotification({
                           type: 'success',
                           title: 'Comparaison créée !',
                           message: `📊 ${product.name} vs ${similarProduct.name}\n\nLe modal de comparaison s'ouvre par-dessus.`,
                           duration: 4000
                         })
                         
                         // Ouvrir le modal de comparaison SANS fermer le modal produit
                         // Le modal de comparaison s'affichera par-dessus
                           window.dispatchEvent(new CustomEvent('openCompareModal'))
                       } else {
                         // Si un des produits est déjà dans la comparaison
                         if (productExists && similarExists) {
                           addNotification({ 
  type: 'info', 
  title: 'Produits déjà comparés', 
  message: 'Ces produits sont déjà dans la comparaison !' 
})
                         } else if (productExists) {
                           addNotification({ 
  type: 'info', 
  title: 'Produit déjà comparé', 
  message: '${product.name} est déjà dans la comparaison !' 
})
                         } else {
                           addNotification({ 
  type: 'info', 
  title: 'Produit déjà comparé', 
  message: '${similarProduct.name} est déjà dans la comparaison !' 
})
                         }
                       }
                     }}
                     className="text-xs rounded-full border-2 border-blue-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white group relative"
                   >
                     <BarChart3 className="h-4 w-4 mr-2 animate-pulse group-hover:animate-bounce" />
                     Comparer
                     
                     {/* Tooltip informatif */}
                     <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-blue-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-50">
                       <div className="text-center">
                         <div className="font-semibold">Comparaison automatique</div>
                         <div className="text-blue-200">Produit similaire + actuel</div>
                       </div>
                       {/* Flèche du tooltip */}
                       <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
                     </div>
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleChatAction('wishlist')}
                     className={`text-xs rounded-full border-2 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white ${isWishlisted ? 'text-red-500 border-red-300 bg-red-50 hover:bg-red-100' : 'border-gray-200 hover:border-red-400 hover:text-red-500 hover:bg-red-50'}`}
                   >
                     <Heart className={`h-4 w-4 mr-2 transition-all duration-300 ${isWishlisted ? 'fill-current animate-pulse' : ''}`} />
                     Favoris
                   </Button>
                   
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleShare('whatsapp')}
                     className="text-xs rounded-full border-2 border-green-200 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white"
                   >
                     <Share2 className="h-4 w-4 mr-2 animate-pulse" />
                     Partager
                   </Button>
                 </div>
               </div>

               {/* Messages - Design Amélioré */}
               <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                 <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                   <div className="flex items-center space-x-3">
                     <div className="relative">
                       {product.seller.logo ? (
                         <Image 
                           src={product.seller.logo || "/placeholder-logo.svg"}
                           alt={`Logo ${product.seller.name}`}
                           width={36}
                           height={36}
                           className="rounded-full object-cover border-2 border-white shadow-md"
                         />
                       ) : (
                         <Avatar className="h-9 w-9 ring-2 ring-white shadow-md">
                           <AvatarImage src="/vendor-avatar.png" />
                           <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 text-sm font-medium">VP</AvatarFallback>
                         </Avatar>
                       )}
                       <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 h-3 w-3 rounded-full border-2 border-white animate-pulse"></span>
                     </div>
                     <div>
                       <h4 
                         className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors duration-300"
                         onClick={() => router.push(`/seller/${product.seller.name.toLowerCase().replace(/\s+/g, '-')}`)}
                       >
                         {product.seller.name}
                       </h4>
                       <div className="flex items-center space-x-2">
                         <p className="text-xs text-green-600 font-medium">En ligne maintenant</p>
                         <span>•</span>
                         <p className="text-xs text-gray-500 flex items-center">
                           <Clock className="h-3 w-3 mr-1 text-orange-500" />
                           <span>Réponse: {product.seller.responseTime}</span>
                         </p>
                       </div>
                     </div>
                   </div>
                   <Badge variant="outline" className="text-xs border-green-200 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                     <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                     Actif
                   </Badge>
                 </div>
                 <div className="space-y-4 max-h-80 overflow-y-auto mb-4 px-2 py-3 custom-scrollbar">
                 {currentSession?.messages.map((message, index) => (
                   <div
                     key={message.id}
                     className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                     style={{ animationDelay: `${index * 0.1}s` }}
                   >
                     {message.sender !== 'user' && (
                       <div className="relative">
                         {product.seller.logo ? (
                           <div className="relative h-9 w-9 mr-2 self-end mb-1">
                             <Image 
                               src={product.seller.logo || "/placeholder-logo.svg"}
                               alt={`Logo ${product.seller.name}`}
                               width={36}
                               height={36}
                               className="rounded-full object-cover border-2 border-white shadow-md"
                             />
                             {index === 0 && (
                               <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                             )}
                           </div>
                         ) : (
                           <div className="relative">
                             <Avatar className="h-9 w-9 mr-2 self-end mb-1 ring-2 ring-white shadow-md">
                               <AvatarImage src="/vendor-avatar.png" />
                               <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-medium">VD</AvatarFallback>
                             </Avatar>
                             {index === 0 && (
                               <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                             )}
                           </div>
                         )}
                       </div>
                     )}
                     
                     {/* Messages textuels */}
                     {message.type === 'text' && (
                     <div
                       className={`max-w-[75%] rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                         message.sender === 'user'
                           ? 'bg-gradient-to-br from-[#ff6600] to-[#ff8533] text-white rounded-tr-none transform hover:-translate-y-0.5'
                             : message.sender === 'system'
                           ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-200 transform hover:-translate-y-0.5'
                           : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none transform hover:-translate-y-0.5'
                       }`}
                     >
                       <p className="text-sm leading-relaxed">{message.text}</p>
                       <div className="flex items-center justify-end mt-1 space-x-1">
                         <p className="text-[10px] opacity-70">
                           {message.timestamp.toLocaleTimeString('fr-FR', { 
                             hour: '2-digit', 
                             minute: '2-digit' 
                           })}
                         </p>
                         {message.sender === 'user' && (
                           <CheckCircle className="h-3 w-3 text-white opacity-70" />
                         )}
                       </div>
                     </div>
                     )}
                     
                     {/* Messages vocaux */}
                     {message.type === 'audio' && (
                       <div
                         className={`max-w-[75%] rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                           message.sender === 'user'
                             ? 'bg-gradient-to-br from-[#ff6600] to-[#ff8533] text-white rounded-tr-none transform hover:-translate-y-0.5'
                             : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none transform hover:-translate-y-0.5'
                         }`}
                       >
                         <div className="flex items-center space-x-2">
                           <div className="flex items-center space-x-1">
                             <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                             <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                           </div>
                           <span className="text-sm font-medium">
                             0:30
                           </span>
                         </div>
                         <div className="flex items-center justify-end mt-1 space-x-1">
                           <p className="text-[10px] opacity-70">
                             {message.timestamp.toLocaleTimeString('fr-FR', { 
                               hour: '2-digit', 
                               minute: '2-digit' 
                             })}
                           </p>
                           {message.sender === 'user' && (
                             <CheckCircle className="h-3 w-3 text-white opacity-70" />
                           )}
                         </div>
                       </div>
                     )}
                     
                     {/* Messages de fichiers */}
                     {message.type === 'file' && (
                       <div
                         className={`max-w-[75%] rounded-2xl p-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                           message.sender === 'user'
                             ? 'bg-gradient-to-br from-[#ff6600] to-[#ff8533] text-white rounded-tr-none transform hover:-translate-y-0.5'
                             : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none transform hover:-translate-y-0.5'
                         }`}
                       >
                         <div className="flex items-center space-x-3">
                           <div className="flex-shrink-0">
                             {getFileIcon(message.fileType || 'file')}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium truncate">{message.fileName}</p>
                             <p className="text-xs opacity-70">{message.fileSize}</p>
                           </div>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="p-1 hover:bg-white/20"
                             onClick={() => window.open(message.fileUrl, '_blank')}
                           >
                             <File className="h-4 w-4" />
                           </Button>
                         </div>
                         <div className="flex items-center justify-end mt-1 space-x-1">
                           <p className="text-[10px] opacity-70">
                             {message.timestamp.toLocaleTimeString('fr-FR', { 
                               hour: '2-digit', 
                               minute: '2-digit' 
                             })}
                           </p>
                           {message.sender === 'user' && (
                             <CheckCircle className="h-3 w-3 text-white opacity-70" />
                           )}
                         </div>
                       </div>
                     )}
                     
                     {message.sender === 'user' && (
                       <Avatar className="h-9 w-9 ml-2 self-end mb-1 ring-2 ring-[#fff0e6] shadow-md">
                         <AvatarImage src="/user-avatar.png" />
                         <AvatarFallback className="bg-gradient-to-br from-[#fff0e6] to-[#ffdfcc] text-[#ff6600] text-xs font-medium">ME</AvatarFallback>
                       </Avatar>
                     )}
                   </div>
                 ))}
                 
                                   {currentSession?.isTyping && (
                   <div className="flex justify-start items-end animate-fadeIn">
                     <div className="relative">
                       {product.seller.logo ? (
                         <div className="relative h-9 w-9 mr-2 mb-1">
                           <Image 
                             src={product.seller.logo || "/placeholder-logo.svg"}
                             alt={`Logo ${product.seller.name}`}
                             width={36}
                             height={36}
                             className="rounded-full object-cover border-2 border-white shadow-md"
                           />
                           <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                         </div>
                       ) : (
                         <div className="relative">
                           <Avatar className="h-9 w-9 mr-2 mb-1 ring-2 ring-white shadow-md">
                             <AvatarImage src="/vendor-avatar.png" />
                             <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 text-xs font-medium">VD</AvatarFallback>
                           </Avatar>
                           <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white"></span>
                         </div>
                       )}
                     </div>
                     <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-md border border-gray-100">
                       <div className="flex space-x-1">
                         <div className="w-2 h-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
                         <div className="w-2 h-2 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                         <div className="w-2 h-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>

               {/* Input Moderne avec Fonctionnalités Avancées */}
               <div className="relative mt-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                 {/* Zone de saisie principale */}
                 <div className="relative">
                 <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                     <MessageCircle className="h-5 w-5" />
                 </div>
                 <Input
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                   placeholder="Tapez votre message..."
                     className="w-full pr-44 pl-12 py-4 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400 focus:ring-opacity-20 transition-all shadow-sm hover:shadow-md text-sm bg-gray-50 focus:bg-white"
                   />
                   
                   {/* Boutons d'action modernes */}
                   <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                     {/* Bouton emojis avec sélecteur */}
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                   <Button
                           variant="ghost"
                           size="sm"
                           className="h-10 w-10 p-0 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 border border-yellow-200 shadow-md transition-all duration-300 hover:scale-110 active:scale-95"
                         >
                           <span className="text-lg">😊</span>
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent className="w-64 p-2">
                         <div className="grid grid-cols-8 gap-1">
                           {['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '👏', '🙏', '😍', '🤔', '😅', '😭', '😱', '🤯', '🥳', '😎', '🤩', '😇', '🤗', '😴', '🤤', '😋', '🤪', '😜', '😝', '🤓', '🧐', '🤠', '👻', '🤖', '👽'].map((emoji) => (
                             <button
                               key={emoji}
                               onClick={() => setChatInput(prev => prev + emoji)}
                               className="w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors duration-200"
                             >
                               {emoji}
                             </button>
                           ))}
                         </div>
                       </DropdownMenuContent>
                     </DropdownMenu>
                     
                     {/* Bouton d'envoi de fichiers */}
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => fileInputRef.current?.click()}
                       className="h-10 w-10 p-0 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 border border-blue-200 shadow-md transition-all duration-300 hover:scale-110 active:scale-95"
                     >
                       <Paperclip className="h-5 w-5 text-blue-600" />
                     </Button>
                   
                     {/* Bouton d'enregistrement vocal */}
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={isRecording ? stopRecording : startRecording}
                       className={`h-10 w-10 p-0 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-md ${
                         isRecording 
                           ? 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse border border-red-400' 
                           : 'bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 border border-green-200'
                       }`}
                     >
                       {isRecording ? (
                         <MicOff className="h-5 w-5 animate-pulse" />
                       ) : (
                         <Mic className="h-5 w-5 text-green-600" />
                       )}
                     </Button>
                   
                     {/* Bouton d'envoi */}
                     <Button
                       variant="ghost"
                       size="sm"
                     onClick={handleSendChatMessage}
                       disabled={!chatInput.trim() && !isRecording}
                       className="h-10 w-10 p-0 rounded-full bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0"
                   >
                       <Send className="h-5 w-5" />
                   </Button>
                 </div>
                 </div>
                 
                 {/* Indicateur d'enregistrement moderne */}
                 {isRecording && (
                   <div className="absolute -top-12 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm px-4 py-2 rounded-full text-center animate-pulse shadow-lg border border-red-400">
                     <div className="flex items-center justify-center space-x-2">
                       <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                       <span className="font-medium">Enregistrement en cours...</span>
                       <span className="font-bold">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
               </div>
                   </div>
                 )}
                 
                 {/* Indicateur de chargement de fichier */}
                 {isFileUploading && (
                   <div className="absolute -top-12 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm px-4 py-2 rounded-full text-center animate-pulse shadow-lg border border-blue-400">
                     <div className="flex items-center justify-center space-x-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       <span className="font-medium">Envoi du fichier...</span>
                     </div>
                   </div>
                 )}
                 
                 {/* Message d'aide */}
                 <div className="absolute -bottom-6 left-0 right-0 text-center">
                   <p className="text-xs text-gray-500 font-medium">💬 Réponse rapide en quelques secondes</p>
                 </div>
                 
                 {/* Barre de progression en bas */}
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-b-2xl overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                 </div>
               </div>
               
               {/* Input caché pour les fichiers */}
               <input
                 ref={fileInputRef}
                 type="file"
                 multiple
                 accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                 onChange={handleFileSelect}
                 className="hidden"
               />
             </div>
           </div>
         )}
       </DialogContent>
     </Dialog>
     
     {/* Modal chat intégré */}
     <LegacyChatModal
       isOpen={showChatModal}
       onClose={() => setShowChatModal(false)}
       sellerId={chatSellerId}
       sellerName={chatSellerName}
       sellerAvatar={chatSellerAvatar}
       product={product}
     />

     {/* Conteneur des notifications modernes */}
     <NotificationContainer />
     </>
   )
 }