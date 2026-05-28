"use client"

import { useState, useEffect, useRef } from "react"
import { 
  MessageCircle, 
  X, 
  Send, 
  ShoppingCart, 
  Heart, 
  Star,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Minus,
  Plus,
  Mic,
  MicOff,
  Paperclip,
  File,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Share2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Image from "next/image"
import { 
  CartService, 
  WishlistService
} from "@/lib/services"
import { useNotifications } from "@/components/ui/modern-notification"
import { useChat } from "@/lib/chat-context"

interface Product {
  id: number
  name: string
  price: number
  image: string
  seller: string
  rating: number
  reviews: number
  inStock: boolean
  discount?: number
  isHot?: boolean
  isNew?: boolean
  isLimited?: boolean
}

interface Seller {
  name: string
  avatar: string
  rating: number
  totalSales: number
  responseTime: string
  location: string
  phone: string
  email: string
  isOnline: boolean
}

interface ChatWidgetProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  seller?: Seller
  isGeneralChat?: boolean
}

export default function ChatWidget({ isOpen, onClose, product, seller, isGeneralChat = false }: ChatWidgetProps) {
  const { 
    createOrGetSession, 
    addMessage, 
    setTyping, 
    currentSession,
    setIsAnyChatOpen 
  } = useChat()
  const { addNotification } = useNotifications()
  
  const [inputText, setInputText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [quantity, setQuantity] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Initialiser le chat avec le produit si fourni ou seulement le vendeur
  useEffect(() => {
    console.log('useEffect chat init:', { isOpen, product, seller })
    if (isOpen && seller) {
      // Créer ou récupérer la session de chat
      // Si pas de produit, utiliser un ID fictif pour la session
      const sessionId = product ? product.id : 0
      console.log('Création session avec:', { sessionId, sellerName: seller.name })
      createOrGetSession(sessionId, seller.name)
      
      // Vérifier si le produit est dans les favoris (seulement si produit fourni)
      if (product) {
        setIsWishlisted(WishlistService.isInWishlist(product.id))
      }
      
      // Marquer qu'un chat est ouvert
      setIsAnyChatOpen(true)
    } else {
      setIsAnyChatOpen(false)
    }
  }, [isOpen, product, seller, createOrGetSession, setIsAnyChatOpen])

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  // Timer pour l'enregistrement vocal
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const handleSendMessage = () => {
    console.log('handleSendMessage appelé:', { inputText, currentSession, product, seller })
    if (!inputText.trim() || !currentSession) {
      console.log('Message non envoyé:', { inputTextEmpty: !inputText.trim(), noSession: !currentSession })
      return
    }

    // Ajouter le message de l'utilisateur
    addMessage(currentSession.id, {
      text: inputText,
      sender: 'user',
      type: 'text',
      productId: product?.id || 0
    })
    
    setInputText("")
    setTyping(currentSession.id, true)

    // Simuler une réponse du vendeur
    setTimeout(() => {
      const sellerResponse = getSellerResponse(inputText)
      addMessage(currentSession.id, {
        text: sellerResponse,
        sender: 'seller',
        type: 'text',
        productId: product?.id || 0
      })
      setTyping(currentSession.id, false)
    }, 2000)
  }

  const getSellerResponse = (userMessage: string): string => {
    const responses = [
      "Merci pour votre message ! Je vais vous répondre dans les plus brefs délais.",
      "Excellente question ! Laissez-moi vous donner plus de détails.",
      "Je comprends votre demande. Voici ce que je peux vous proposer.",
      "Parfait ! Je suis là pour vous aider avec toutes vos questions.",
      "Très bonne observation ! Laissez-moi clarifier cela pour vous."
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleAddToCart = () => {
    if (product && currentSession) {
      CartService.addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        seller: product.seller
      })
      addNotification({ type: 'success', title: 'Succès', message: 'Produit ajouté au panier !' })
      
      addMessage(currentSession.id, {
        text: "🛒 Produit ajouté au panier !",
        sender: 'seller',
        type: 'system',
        productId: product.id
      })
    }
  }

  const handleAddToWishlist = () => {
    if (product && currentSession) {
      if (isWishlisted) {
        WishlistService.removeFromWishlist(product.id)
        setIsWishlisted(false)
        addNotification({ type: 'success', title: 'Succès', message: 'Retiré des favoris' })
      } else {
        WishlistService.addToWishlist({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          seller: product.seller
        })
        setIsWishlisted(true)
        addNotification({ type: 'success', title: 'Succès', message: 'Ajouté aux favoris !' })
      }
      
      addMessage(currentSession.id, {
        text: isWishlisted ? "💔 Retiré des favoris" : "❤️ Ajouté aux favoris !",
        sender: 'seller',
        type: 'system',
        productId: product.id
      })
    }
  }

  const handleBuyNow = () => {
    if (product && currentSession) {
      // Simuler l'achat
      addNotification({ type: 'success', title: 'Succès', message: 'Commande passée avec succès !' })
      
      addMessage(currentSession.id, {
        text: "🛒 Commande passée ! Vous recevrez un email de confirmation.",
        sender: 'seller',
        type: 'system',
        productId: product.id
      })
    }
  }

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => Math.min(prev + 1, 10))
    } else {
      setQuantity(prev => Math.max(prev - 1, 1))
    }
  }

  // Fonctionnalités d'enregistrement vocal
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
             recorder.onstop = () => {
         const audioBlob = new Blob(chunks, { type: 'audio/wav' })
         const audioUrl = URL.createObjectURL(audioBlob)
         
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
       }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
      addNotification({ type: 'error', title: 'Erreur', message: 'Impossible d\'accéder au microphone' })
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  // Fonctionnalités d'envoi de fichiers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setIsFileUploading(true)
    
    // Simuler l'upload
    setTimeout(() => {
      Array.from(files).forEach(file => {
        const fileUrl = URL.createObjectURL(file)
        if (currentSession) {
          addMessage(currentSession.id, {
            text: `📎 ${file.name}`,
            sender: 'user',
            type: 'file',
            fileUrl: fileUrl,
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            fileType: getFileType(file.type),
            productId: product?.id
          })
        }
      })
      setIsFileUploading(false)
    }, 1500)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.includes('pdf')) return 'pdf'
    if (mimeType.includes('document') || mimeType.includes('word')) return 'document'
    return 'file'
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4 text-blue-500" />
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />
      case 'audio':
        return <Music className="h-4 w-4 text-green-500" />
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'document':
        return <FileText className="h-4 w-4 text-orange-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header Moderne */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white p-2.5 relative">
        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <Avatar className="h-7 w-7 ring-2 ring-white/50 group-hover:ring-orange-200 transition-all duration-300">
              <AvatarImage src={seller?.avatar || "/placeholder-user.jpg"} />
                                  <AvatarFallback className="bg-white text-orange-600">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
            </Avatar>
              {/* Indicateur de statut animé */}
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-md animate-ping"></div>
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white drop-shadow-sm">{seller?.name || "Vendeur"}</h3>
              <div className="flex items-center space-x-0.5 text-xs text-white/90">
                <div className="flex items-center space-x-0.5">
                  <Clock className="h-2.5 w-2.5 text-yellow-300 animate-pulse" />
                  <span className="text-xs">Réponse: {seller?.responseTime || '2-4h'}</span>
                </div>
                <span className="text-xs">•</span>
                <div className="flex items-center space-x-0.5">
                  <Star className="h-2.5 w-2.5 text-yellow-300 fill-current" />
                  <span className="text-xs">{seller?.rating}/5</span>
                </div>
                <span className="text-xs">•</span>
                <div className="flex items-center space-x-0.5">
                  <TrendingUp className="h-2.5 w-2.5 text-green-300" />
                  <span className="text-xs">{seller?.totalSales} ventes</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Boutons d'action dans l'en-tête */}
          <div className="flex items-center space-x-0.5">
            {/* Bouton favoris intégré */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAddToWishlist}
              className={`h-5 w-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-110 active:scale-95 ${isWishlisted ? 'text-red-300 bg-red-500/20' : 'text-white'}`}
            >
              <Heart className={`h-3 w-3 ${isWishlisted ? 'fill-current animate-pulse' : ''}`} />
            </Button>
            
            {/* Bouton fermer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
              className="h-5 w-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-red-500/30 hover:text-red-200 transform hover:scale-110 active:scale-95 transition-all duration-300"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

        {/* Barre de progression animée */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/30 via-white/50 to-white/30 rounded-b-2xl overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse"></div>
        </div>
      </div>

      {/* Product Info Moderne */}
      {!isGeneralChat && product && (
        <div className="p-1.5 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-b border-orange-200 relative overflow-hidden">
          {/* Effet de brillance en arrière-plan */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/20 via-red-100/20 to-pink-100/20 animate-pulse"></div>
          
          <div className="relative flex items-center space-x-1.5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <Image
                src={product.image}
                alt={product.name}
                width={60}
                height={60}
                className="rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300 ring-2 ring-white/50"
              />
              {product.discount && (
                <Badge className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse border border-white">
                  -{product.discount}%
                </Badge>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-bold text-sm line-clamp-1 text-gray-800 group-hover:text-orange-600 transition-all duration-300">
                  {product.name}
                </h4>
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                  💬 Chat en direct
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="text-lg font-bold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent animate-pulse">
                  {product.price.toLocaleString()} F CFA
                </span>
                <div className="flex items-center space-x-0.5 bg-gradient-to-r from-yellow-50 to-orange-50 px-1 py-0.5 rounded-full shadow-sm border border-yellow-200">
                  <Star className="h-2.5 w-2.5 text-yellow-500 fill-current animate-pulse" />
                  <span className="text-xs text-yellow-700 font-medium">{product.rating}</span>
                </div>
                {product.inStock ? (
                  <div className="flex items-center space-x-0.5 text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">En stock</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-0.5 text-red-600">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Rupture</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Buttons Modernisés */}
                      <div className="flex items-center space-x-0.5 mt-1">
            <div className="flex items-center space-x-0.5 bg-white/60 backdrop-blur-sm rounded-xl px-0.5 py-0.5 border border-white/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(false)}
                className="h-4 w-4 hover:bg-orange-100"
              >
                <Minus className="h-2.5 w-2.5" />
              </Button>
              <span className="text-sm font-medium w-4 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleQuantityChange(true)}
                className="h-4 w-4 hover:bg-orange-100"
              >
                <Plus className="h-2.5 w-2.5" />
              </Button>
            </div>
            
            <Button
              size="sm"
              onClick={handleBuyNow}
              className="bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs rounded-full px-1 py-0.5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 font-medium border-0"
            >
              <ShoppingCart className="h-3 w-3 mr-0.5 animate-bounce" />
              Acheter
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              className="text-xs rounded-full border-2 border-orange-200 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all duration-300 hover:scale-105 active:scale-95 font-medium bg-white px-1 py-0.5"
            >
              <ShoppingCart className="h-3 w-3 mr-0.5 animate-pulse" />
              Panier
            </Button>
          </div>
          
          {/* Barre de progression en bas */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
          </div>
        </div>
      )}

      {/* En-tête du chat général (si pas de produit) */}
      {isGeneralChat && (
        <div className="p-1.5 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-b border-green-200 relative overflow-hidden">
          {/* Effet de brillance en arrière-plan */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-100/20 via-blue-100/20 to-purple-100/20 animate-pulse"></div>
          
          <div className="relative flex items-center space-x-1.5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="w-15 h-15 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300 ring-2 ring-white/50 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-bold text-sm line-clamp-1 text-gray-800 group-hover:text-green-600 transition-all duration-300">
                  Chat avec {seller?.name}
                </h4>
                <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-md animate-pulse">
                  💬 Chat général
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mb-0.5">
                <span className="text-sm text-gray-600">
                  Posez vos questions générales
                </span>
                <div className="flex items-center space-x-0.5 bg-gradient-to-r from-green-50 to-blue-50 px-1 py-0.5 rounded-full shadow-sm border border-green-200">
                  <Star className="h-2.5 w-2.5 text-green-500 fill-current animate-pulse" />
                  <span className="text-xs text-green-700 font-medium">{seller?.rating}</span>
                </div>
                {seller?.isOnline ? (
                  <div className="flex items-center space-x-0.5 text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">En ligne</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-0.5 text-red-600">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Hors ligne</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Barre de progression en bas */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 rounded-b-2xl overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Messages avec Design Amélioré */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5 bg-white" style={{ height: 'calc(100% - 280px)' }}>
        {currentSession?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-2 shadow-md ${
                message.sender === 'user'
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
                  : message.type === 'system'
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 border border-green-200'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 border border-gray-200'
              }`}
            >
              {message.type === 'file' && message.fileUrl && (
                <div className="flex items-center space-x-3 mb-2">
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
              )}
              
              {message.type === 'audio' && message.fileUrl && (
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex-shrink-0">
                    <Music className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Message vocal</p>
                    <p className="text-xs opacity-70">{message.fileSize}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 hover:bg-white/20"
                    onClick={() => {
                      const audio = new Audio(message.fileUrl)
                      audio.play()
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <p className="text-sm">{message.text}</p>
              <div className="flex items-center justify-end mt-1 space-x-1">
                <p className="text-xs opacity-70">
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
          </div>
        ))}
        
        {currentSession?.isTyping && (
          <div className="flex justify-start items-end animate-fadeIn">
            <div className="relative">
              <Avatar className="h-8 w-8 mr-2 mb-1 ring-2 ring-white shadow-md">
                <AvatarImage src={seller?.avatar || "/placeholder-user.jpg"} />
                <AvatarFallback className="bg-gradient-to-br from-orange-100 to-red-100 text-orange-600 text-xs font-medium">VP</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 bg-green-500 h-3 w-3 rounded-full border-2 border-white animate-pulse"></span>
            </div>
                         <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl rounded-tl-none p-2 shadow-md border border-gray-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-2 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Moderne avec Fonctionnalités Avancées */}
      <div className="p-1 bg-white border-t border-gray-200 relative">
        {/* Zone de saisie principale */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <MessageCircle className="h-5 w-5" />
          </div>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Tapez votre message..."
              className="w-full pr-40 pl-12 py-1.5 rounded-2xl border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400 focus:ring-opacity-20 transition-all shadow-sm hover:shadow-md text-sm bg-gray-50 focus:bg-white"
            />
          
          {/* Boutons d'action modernes */}
          <div className="absolute right-0.5 top-1/2 transform -translate-y-1/2 flex space-x-0.5">
            {/* Bouton emojis avec sélecteur */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                                 <Button
                   variant="ghost"
                   size="sm"
                   className="h-7 w-7 p-0 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 border border-yellow-200 shadow-md transition-all duration-300 hover:scale-110 active:scale-95"
                 >
                   <span className="text-base">😊</span>
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {['😊', '😂', '❤️', '👍', '🎉', '🔥', '💯', '👏', '🙏', '😍', '🤔', '😅', '😭', '😱', '🤯', '🥳', '😎', '🤩', '😇', '🤗', '😴', '🤤', '😋', '🤪', '😜', '😝', '🤓', '🧐', '🤠', '👻', '🤖', '👽'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setInputText(prev => prev + emoji)}
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
              className="h-7 w-7 p-0 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 border border-blue-200 shadow-md transition-all duration-300 hover:scale-110 active:scale-95"
            >
              <Paperclip className="h-4 w-4 text-blue-600" />
            </Button>
            
            {/* Bouton d'enregistrement vocal */}
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={`h-7 w-7 p-0 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-md ${
                isRecording 
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse border border-red-400' 
                  : 'bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 border border-green-200'
              }`}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4 animate-pulse" />
              ) : (
                <Mic className="h-4 w-4 text-green-600" />
              )}
            </Button>
            
            {/* Bouton d'envoi */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || !currentSession}
              className="h-7 w-7 p-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Indicateur d'enregistrement moderne */}
        {isRecording && (
          <div className="absolute -top-8 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-3 py-1 rounded-full text-center animate-pulse shadow-lg border border-red-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              <span className="font-medium">Enregistrement en cours...</span>
              <span className="font-bold">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        )}
        
        {/* Indicateur de chargement de fichier */}
        {isFileUploading && (
          <div className="absolute -top-8 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full text-center animate-pulse shadow-lg border border-blue-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Envoi du fichier...</span>
            </div>
          </div>
        )}
        
        {/* Trait de séparation dégradé */}
        <div className="w-full h-px bg-gradient-to-r from-red-400 via-red-500 to-red-600 my-2"></div>
        
        {/* Message d'aide */}
        <div className="text-center pb-1">
          <p className="text-xs text-gray-500 font-medium">💬 Réponse rapide</p>
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
        className="hidden"
        onChange={handleFileSelect}
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  )
}
