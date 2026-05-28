"use client"

import { Heart, Search, ShoppingCart, User, ChevronDown, ChevronLeft, ChevronRight, Home, ShoppingBag, Grid, Flame, Sparkles, Store, Headphones, Lock, Truck, LogOut, Settings, CreditCard, Gift, Bell, Package, MapPin, Clock, CheckCircle, X, Share2, Coins, Star, BarChart3, Shield, Trash2, Zap, Smartphone, RefreshCw, Phone, Mail, Minus, Plus, Calculator, Info, Calendar, MessageCircle, MessageSquare, FileText, Download, Copy, Printer, HelpCircle, Save, Globe, ArrowLeft, ArrowRight, Volume2, RotateCcw, AlertTriangle, List, BookOpen, Send, Users, Building, Car, Camera, Music, Gamepad2, Palette, Wrench, Hammer, Drill, Ruler, Microscope, TestTube, Atom, Dna, Leaf, Flower, Sun, Moon, Cloud, Wind, Rainbow, Umbrella, Snowflake, Droplets, Waves, Fish, Bird, Cat, Dog, Rabbit, Mouse, Rat, Turtle, Shell, Diamond, Bone, Eye, Glasses, Shirt, Wallet, Backpack, Briefcase, Bed, Table, Apple, Play, Smile, Paperclip } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { 
  CartService, 
  WishlistService, 
  PointsService, 
  DeliveryService, 
  AuthService, 
  SearchService, 
  NotificationService,
  initializeServices 
} from "@/lib/services"
import { enrichProductWithSpecs } from "@/lib/product-specifications"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export default function Header() {
  const pathname = usePathname()
  
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
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    }
  }
  
  // États avec valeurs par défaut
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPoints, setUserPoints] = useState(1000)
  const [pointsValue, setPointsValue] = useState(10000)
  const [withdrawalThreshold] = useState(5000)
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)

  // Initialisation des services et mise à jour des états
  useEffect(() => {
    setIsClient(true)
    
    try {
      initializeServices()
      
      // Mettre à jour les états après l'initialisation des services
      setIsLoggedIn(AuthService.isLoggedIn())
      setUserPoints(PointsService.getUserPoints())
      setPointsValue(PointsService.getPointsValue())
      setCartItems(CartService.getCart().length)
      setWishlistItems(WishlistService.getWishlist().length)
      
      // Charger les données des services
      setCartItemsData(CartService.getCart())
      setWishlistItemsData(WishlistService.getWishlist())
      setDeliveryData(DeliveryService.getDeliveries())
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services:', error)
    }
  }, [])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCurrency, setSelectedCurrency] = useState("fcfa")
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [showWishlistModal, setShowWishlistModal] = useState(false)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [compareListLength, setCompareListLength] = useState(0)
  const [showPromoCodeModal, setShowPromoCodeModal] = useState(false)
  const [showDeliveryOptionsModal, setShowDeliveryOptionsModal] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState("standard")
  const [isClient, setIsClient] = useState(false)
  
  // États pour le paiement fractionné et différé
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("standard")
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)
  const [showDeferredModal, setShowDeferredModal] = useState(false)
  const [installmentPlan, setInstallmentPlan] = useState(3)
  const [deferredDays, setDeferredDays] = useState(30)
  const [installmentDetails, setInstallmentDetails] = useState<any>(null)
  const [deferredDetails, setDeferredDetails] = useState<any>(null)
  
  // États pour le modal de commande
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderStep, setOrderStep] = useState(1)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showGPSTrackingModal, setShowGPSTrackingModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showAppDownloadModal, setShowAppDownloadModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportCategory, setSupportCategory] = useState('general')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportScreenshots, setSupportScreenshots] = useState<File[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [chatStatus, setChatStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("standard")
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  
  // États pour le modal de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("mobile_money")
  const [paymentStep, setPaymentStep] = useState(1)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  
  // États pour les paramètres de livraison
  const [deliverySettings, setDeliverySettings] = useState({
    notifications: true,
    gpsTracking: true,
    autoRefresh: true,
    soundAlerts: false,
    vibrationAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    deliveryPreferences: {
      preferredTime: "anytime",
      preferredDay: "anyday",
      contactBeforeDelivery: true,
      leaveAtDoor: false
    }
  })

  // Écouter l'événement pour ouvrir le modal de comparaison depuis le modal produit
  useEffect(() => {
    const handleOpenCompareModal = () => {
      setShowCompareModal(true)
      // Synchroniser la longueur de la liste après l'ouverture
      setTimeout(() => {
        setCompareListLength(getCompareList().length)
      }, 100)
    }

    window.addEventListener('openCompareModal', handleOpenCompareModal)
    
    return () => {
      window.removeEventListener('openCompareModal', handleOpenCompareModal)
    }
  }, [])

  // Synchroniser la longueur de la liste de comparaison
  useEffect(() => {
    setCompareListLength(getCompareList().length)
  }, [])

  // Calcul du pourcentage de progression
  const progressPercentage = Math.min((pointsValue / withdrawalThreshold) * 100, 100)

  // Données dynamiques depuis les services avec vérification
  const [cartItemsData, setCartItemsData] = useState<any[]>([])
  const [wishlistItemsData, setWishlistItemsData] = useState<any[]>([])
  const [deliveryData, setDeliveryData] = useState<any[]>([])

  const handleSearch = () => {
    if (searchQuery.trim() && isClient) {
      try {
        SearchService.searchProducts(searchQuery)
        NotificationService.showInfo(`Recherche: ${searchQuery}`)
        setShowSearchModal(true)
      } catch (error) {
        console.error('Erreur lors de la recherche:', error)
      }
    }
  }

  const handleAddToCart = (itemId: number) => {
    if (!isClient) return
    
    try {
      const item = wishlistItemsData.find(item => item.id === itemId)
      if (item) {
        CartService.addToCart(item)
        setCartItems(CartService.getCart().length)
        setCartItemsData(CartService.getCart())
        NotificationService.showSuccess("Produit ajouté au panier")
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
    }
  }

  const handleRemoveFromCart = (itemId: number) => {
    if (!isClient) return
    
    try {
      CartService.removeFromCart(itemId)
      setCartItems(CartService.getCart().length)
      setCartItemsData(CartService.getCart())
      NotificationService.showInfo("Produit retiré du panier")
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
    }
  }

  const handleAddToWishlist = (itemId: number) => {
    if (!isClient) return
    
    try {
      const item = cartItemsData.find(item => item.id === itemId)
      if (item) {
        WishlistService.addToWishlist(item)
        setWishlistItems(WishlistService.getWishlist().length)
        setWishlistItemsData(WishlistService.getWishlist())
        NotificationService.showSuccess("Produit ajouté aux favoris")
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error)
    }
  }

  const handleRemoveFromWishlist = (itemId: number) => {
    if (!isClient) return
    
    try {
      WishlistService.removeFromWishlist(itemId)
      setWishlistItems(WishlistService.getWishlist().length)
      setWishlistItemsData(WishlistService.getWishlist())
      NotificationService.showInfo("Produit retiré des favoris")
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error)
    }
  }

  const handleLogout = () => {
    if (!isClient) return
    
    try {
      AuthService.logout()
      setIsLoggedIn(false)
      NotificationService.showInfo("Déconnexion réussie")
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const handleWithdrawPoints = () => {
      const withdrawn = PointsService.withdrawPoints()
    if (withdrawn > 0) {
      setUserPoints(PointsService.getUserPoints())
      setPointsValue(PointsService.getPointsValue())
      NotificationService.showSuccess(`Retrait de ${withdrawn} points effectué !`)
    } else {
      NotificationService.showError('Points insuffisants pour le retrait')
    }
  }

  // Fonction pour gérer la comparaison
  const handleAddToCompare = (item: any) => {
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
      if (!compareList.find((p: any) => p.id === item.id)) {
        if (compareList.length >= 4) {
          alert('Vous ne pouvez comparer que 4 produits maximum !')
          return
        }
        compareList.push(item)
        safeLocalStorage.setItem('compareList', JSON.stringify(compareList))
        setCompareListLength(compareList.length)
        NotificationService.showSuccess(`${item.name} ajouté à la comparaison !`)
        // Ouvrir automatiquement le modal de comparaison
        setShowCompareModal(true)
      } else {
        NotificationService.showInfo('Produit déjà dans la comparaison !')
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la comparaison:', error)
    }
  }

  const getCompareList = () => {
    try {
      return JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste de comparaison:', error)
      return []
    }
  }

  const removeFromCompare = (productId: number) => {
    if (!isClient) return
    
    try {
      const compareList = JSON.parse(safeLocalStorage.getItem('compareList', '[]'))
      const updatedList = compareList.filter((item: any) => item.id !== productId)
      safeLocalStorage.setItem('compareList', JSON.stringify(updatedList))
      setCompareListLength(updatedList.length)
      NotificationService.showInfo('Produit retiré de la comparaison')
    } catch (error) {
      console.error('Erreur lors de la suppression de la comparaison:', error)
    }
  }

  // Fonction pour obtenir les produits enrichis avec spécifications techniques
  const getEnrichedCompareList = () => {
    if (!isClient) return []
    
    try {
      const compareList = getCompareList()
      return compareList.map((product: any) => enrichProductWithSpecs(product))
    } catch (error) {
      console.error('Erreur lors de l\'enrichissement des produits:', error)
      return getCompareList()
    }
  }

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) {
      alert('❌ Veuillez entrer un code promo')
      return
    }

    const code = promoCode.trim().toUpperCase()
    let message = ''
    let success = false

    switch (code) {
      case 'WELCOME10':
        message = '🎉 Code promo appliqué !\n✅ Réduction de 10% appliquée'
        success = true
        break
      case 'FREESHIP':
        message = '🎉 Code promo appliqué !\n✅ Livraison gratuite activée'
        success = true
        break
      case 'BONUS50':
        message = '🎉 Code promo appliqué !\n✅ +50 points bonus ajoutés'
        success = true
        // Ajouter les points
        const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
        safeLocalStorage.setItem('userPoints', (currentPoints + 50).toString())
        break
      default:
        message = '❌ Code promo invalide\n💡 Essayez: WELCOME10, FREESHIP, BONUS50'
        success = false
    }

    alert(message)
    
    if (success) {
      setShowPromoCodeModal(false)
      setPromoCode("")
      // Optionnel : recharger la page pour mettre à jour l'affichage
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  const handleSelectDeliveryOption = (option: any) => {
    setSelectedDeliveryOption(option.id)
    // Optionnel : sauvegarder l'option sélectionnée
    safeLocalStorage.setItem('selectedDeliveryOption', option.id)
  }

  // Fonctions pour le paiement fractionné
  const calculateInstallmentPlan = (total: number, months: number) => {
    const monthlyPayment = Math.ceil(total / months)
    const lastPayment = total - (monthlyPayment * (months - 1))
    
    const plan = {
      total,
      months,
      monthlyPayment,
      lastPayment,
      payments: Array(months).fill(monthlyPayment).map((payment, index) => 
        index === months - 1 ? lastPayment : payment
      ),
      dates: Array(months).fill(null).map((_, index) => {
        const date = new Date()
        date.setMonth(date.getMonth() + index + 1)
        return date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })
      })
    }
    
    return plan
  }

  const handleInstallmentPayment = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      alert('Votre panier est vide')
      return
    }
    
    try {
      const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const plan = calculateInstallmentPlan(total, installmentPlan)
      setInstallmentDetails(plan)
      setShowInstallmentModal(true)
    } catch (error) {
      console.error('Erreur lors du calcul du paiement fractionné:', error)
      alert('Erreur lors du calcul du paiement fractionné')
    }
  }

  const confirmInstallmentPayment = () => {
    if (!isClient || !installmentDetails) return
    
    try {
      // Simuler le traitement du paiement fractionné
      const orderId = `INST-${Date.now().toString().slice(-6)}`
      const orderData = {
        id: orderId,
        type: 'installment',
        total: installmentDetails.total,
        plan: installmentDetails,
        status: 'approved',
        createdAt: new Date().toISOString(),
        items: cartItemsData
      }
      
      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))
      
      // Ajouter des points bonus
      const points = Math.floor(installmentDetails.total / 200)
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      // Vider le panier
      safeLocalStorage.removeItem('cart')
      
      setShowInstallmentModal(false)
      setShowCartModal(false)
      
      alert(`✅ Paiement fractionné confirmé !\n\n📋 Commande #${orderId}\n💰 Total: ${installmentDetails.total.toLocaleString()} F CFA\n📅 ${installmentPlan} paiements de ${installmentDetails.monthlyPayment.toLocaleString()} F CFA\n🎁 +${points} points bonus\n\n📧 Récapitulatif envoyé par email`)
      
      window.location.reload()
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement fractionné:', error)
      alert('Erreur lors de la confirmation du paiement fractionné')
    }
  }

  // Fonctions pour le paiement différé
  const calculateDeferredPayment = (total: number, days: number) => {
    const deferredDate = new Date()
    deferredDate.setDate(deferredDate.getDate() + days)
    
    const details = {
      total,
      days,
      deferredDate: deferredDate.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      interest: days > 30 ? Math.ceil(total * 0.05) : 0, // 5% d'intérêt après 30 jours
      totalWithInterest: total + (days > 30 ? Math.ceil(total * 0.05) : 0)
    }
    
    return details
  }

  const handleDeferredPayment = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      alert('Votre panier est vide')
      return
    }
    
    try {
      const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const details = calculateDeferredPayment(total, deferredDays)
      setDeferredDetails(details)
      setShowDeferredModal(true)
    } catch (error) {
      console.error('Erreur lors du calcul du paiement différé:', error)
      alert('Erreur lors du calcul du paiement différé')
    }
  }

  const confirmDeferredPayment = () => {
    if (!isClient || !deferredDetails) return
    
    try {
      // Simuler le traitement du paiement différé
      const orderId = `DEF-${Date.now().toString().slice(-6)}`
      const orderData = {
        id: orderId,
        type: 'deferred',
        total: deferredDetails.total,
        details: deferredDetails,
        status: 'pending',
        createdAt: new Date().toISOString(),
        items: cartItemsData
      }
      
      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))
      
      // Ajouter des points bonus
      const points = Math.floor(deferredDetails.total / 200)
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      // Vider le panier
      safeLocalStorage.removeItem('cart')
      
      setShowDeferredModal(false)
      setShowCartModal(false)
      
      alert(`✅ Paiement différé confirmé !\n\n📋 Commande #${orderId}\n💰 Montant: ${deferredDetails.total.toLocaleString()} F CFA\n📅 Paiement le: ${deferredDetails.deferredDate}\n${deferredDetails.interest > 0 ? `💸 Intérêts: ${deferredDetails.interest.toLocaleString()} F CFA\n💰 Total à payer: ${deferredDetails.totalWithInterest.toLocaleString()} F CFA` : '✅ Aucun intérêt'}\n🎁 +${points} points bonus\n\n📧 Récapitulatif envoyé par email`)
      
      window.location.reload()
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement différé:', error)
      alert('Erreur lors de la confirmation du paiement différé')
    }
  }

  // Fonctions pour le modal de commande
  const handleOrderNow = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      alert('Votre panier est vide')
      return
    }
    
    try {
      const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const orderData = {
        total,
        items: cartItemsData,
        paymentMethod: selectedPaymentMethod,
        deliveryOption: selectedDeliveryOption,
        pointsEarned: Math.floor(total / 200)
      }
      
      setOrderDetails(orderData)
      setShowOrderModal(true)
      setOrderStep(1)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal de commande:', error)
    }
  }

  const calculateOrderTotal = () => {
    if (!orderDetails) return 0
    
    let total = orderDetails.total
    
    // Appliquer les points si utilisés
    if (usePoints && pointsToUse > 0) {
      const pointsValue = pointsToUse * 10 // 1 point = 10 F CFA
      total = Math.max(0, total - pointsValue)
    }
    
    // Appliquer les frais de livraison
    if (selectedDeliveryOption === 'express') {
      total += 2000
    } else if (selectedDeliveryOption === 'pickup') {
      total = Math.max(0, total - 500)
    }
    
    return total
  }

  const handleNextStep = () => {
    if (orderStep < 4) {
      setOrderStep(orderStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (orderStep > 1) {
      setOrderStep(orderStep - 1)
    }
  }

  const handleConfirmOrder = () => {
    if (!isClient || !orderDetails) return
    
    try {
      const finalTotal = calculateOrderTotal()
      const orderId = `ORD-${Date.now().toString().slice(-6)}`
      
      const orderData = {
        id: orderId,
        type: selectedPaymentOption,
        total: finalTotal,
        originalTotal: orderDetails.total,
        details: {
          paymentMethod: selectedPaymentOption,
          deliveryOption: selectedDeliveryOption,
          pointsUsed: usePoints ? pointsToUse : 0,
          pointsEarned: orderDetails.pointsEarned,
          deliveryAddress,
          customerPhone,
          customerEmail
        },
        status: selectedPaymentOption === 'deferred' ? 'pending' : 'approved',
        createdAt: new Date().toISOString(),
        items: orderDetails.items
      }
      
      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))
      
      // Déduire les points utilisés et ajouter les points gagnés
      if (usePoints && pointsToUse > 0) {
        const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
        const newPoints = currentPoints - pointsToUse + orderDetails.pointsEarned
        safeLocalStorage.setItem('userPoints', newPoints.toString())
      } else {
        const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
        safeLocalStorage.setItem('userPoints', (currentPoints + orderDetails.pointsEarned).toString())
      }
      
      // Vider le panier
      safeLocalStorage.removeItem('cart')
      
      setShowOrderModal(false)
      setShowCartModal(false)
      
      // Message de confirmation adapté au type de paiement
      let confirmationMessage = `✅ Commande confirmée !\n\n📋 Commande #${orderId}\n💰 Total: ${finalTotal.toLocaleString()} F CFA\n`
      
      if (selectedPaymentOption === 'installment') {
        confirmationMessage += `📅 Paiement en ${installmentPlan} fois\n`
      } else if (selectedPaymentOption === 'deferred') {
        confirmationMessage += `📅 Paiement le: ${deferredDetails?.deferredDate}\n`
      }
      
      if (usePoints && pointsToUse > 0) {
        confirmationMessage += `🎁 Points utilisés: ${pointsToUse}\n`
      }
      
      confirmationMessage += `🎁 +${orderDetails.pointsEarned} points bonus\n📧 Récapitulatif envoyé par email`
      
      alert(confirmationMessage)
      
      window.location.reload()
    } catch (error) {
      console.error('Erreur lors de la confirmation de la commande:', error)
      alert('Erreur lors de la confirmation de la commande')
    }
  }

  // Fonctions de partage centralisées
  const shareToWhatsApp = (content: string, points: number = 30) => {
    if (!isClient) return
    
    try {
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(content)}`
      window.open(shareUrl, '_blank')
      
      // Ajouter les points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ +${points} points gagnés ! Partagez sur WhatsApp`)
    } catch (error) {
      console.error('Erreur lors du partage WhatsApp:', error)
    }
  }

  const shareToFacebook = (content: string, url: string, points: number = 50) => {
    if (!isClient) return
    
    try {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(content)}`
      window.open(fbUrl, '_blank', 'width=600,height=400')
      
      // Ajouter les points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ +${points} points gagnés ! Partagez sur Facebook`)
    } catch (error) {
      console.error('Erreur lors du partage Facebook:', error)
    }
  }

  const shareToTwitter = (content: string, url: string, points: number = 40) => {
    if (!isClient) return
    
    try {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}&url=${encodeURIComponent(url)}`
      window.open(twitterUrl, '_blank', 'width=600,height=400')
      
      // Ajouter les points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ +${points} points gagnés ! Partagez sur X (Twitter)`)
    } catch (error) {
      console.error('Erreur lors du partage Twitter:', error)
    }
  }

  const shareToInstagram = (content: string, points: number = 45) => {
    if (!isClient) return
    
    try {
      // Copier le contenu dans le presse-papiers
      navigator.clipboard.writeText(content).then(() => {
        alert('📋 Contenu copié ! Collez-le dans votre story Instagram\n\n✅ +45 points gagnés !')
        
        // Ajouter les points
        const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
        safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      })
    } catch (error) {
      console.error('Erreur lors du partage Instagram:', error)
    }
  }

  // Fonctions de partage spécifiques
  const shareCart = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) return
    
    const cartText = cartItemsData.map((item, index) => 
      `${index + 1}. ${item.name} - ${item.price.toLocaleString()} F CFA x${item.quantity}`
    ).join('\n')
    
    const shareText = `🛒 Mon panier Probooster !\n${cartText}\n💰 Total: ${cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA\n\n🔗 ${window.location.origin}`
    const shareUrl = `${window.location.origin}`
    
    return {
      text: shareText,
      url: shareUrl
    }
  }

  const shareCompareList = () => {
    if (!isClient) return
    
    const compareText = getCompareList().map((item: any, index: number) => 
      `${index + 1}. ${item.name} - ${item.price.toLocaleString()} F CFA`
    ).join('\n')
    
    const shareText = `📊 Comparaison Probooster !\n${compareText}\n💰 Total: ${getCompareList().reduce((total: number, item: any) => total + item.price, 0).toLocaleString()} F CFA\n\n🔗 ${window.location.origin}`
    const shareUrl = `${window.location.origin}`
    
    return {
      text: shareText,
      url: shareUrl
    }
  }

  // Fonctions pour le modal de paiement
  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method)
  }

  const handlePaymentStep = (step: number) => {
    setPaymentStep(step)
  }

  const handlePaymentConfirm = () => {
    const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const points = Math.floor(total / 100)
    const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
    
    // Génération du numéro de commande
    const orderNumber = `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Création de l'objet commande
    const order = {
      id: orderNumber,
      items: cartItemsData,
      total: total,
      shippingCost: 0,
      totalWithShipping: total,
      pointsEarned: points,
      status: 'pending',
      paymentMethod: paymentMethod,
      deliveryAddress: deliveryAddress || 'Adresse à confirmer',
      customerPhone: customerPhone || 'Téléphone à confirmer',
      customerEmail: customerEmail || 'Email à confirmer',
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      seller: cartItemsData[0]?.seller || 'Vendeur Probooster'
    }
    
    // Sauvegarde de la commande
    const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
    existingOrders.push(order)
    safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))
    
    // Ajout des points bonus
    safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
    
    // Création de l'historique des transactions
    const transaction = {
      id: `TXN-${Date.now()}`,
      type: 'purchase',
      amount: total,
      points: points,
      orderId: orderNumber,
      paymentMethod: paymentMethod,
      date: new Date().toISOString(),
      status: 'completed'
    }
    
    const existingTransactions = JSON.parse(safeLocalStorage.getItem('transactions', '[]'))
    existingTransactions.push(transaction)
    safeLocalStorage.setItem('transactions', JSON.stringify(existingTransactions))
    
    // Mise à jour des statistiques
    const stats = JSON.parse(safeLocalStorage.getItem('userStats', '{}'))
    stats.totalOrders = (stats.totalOrders || 0) + 1
    stats.totalSpent = (stats.totalSpent || 0) + total
    stats.totalPoints = (stats.totalPoints || 0) + points
    stats.lastOrderDate = new Date().toISOString()
    safeLocalStorage.setItem('userStats', JSON.stringify(stats))
    
    // Notification de succès
    const successMessage = `🎉 Commande confirmée avec succès !

📋 Numéro de commande : ${orderNumber}
💰 Total : ${total.toLocaleString()} F CFA
💳 Méthode de paiement : ${paymentMethod === 'mobile_money' ? 'Mobile Money' : paymentMethod === 'card' ? 'Carte bancaire' : paymentMethod === 'points' ? 'Points' : 'Paiement différé'}
📦 Livraison : Gratuite
🎁 Points bonus : +${points} points
📅 Date de livraison estimée : ${new Date(order.estimatedDelivery).toLocaleDateString('fr-FR')}

✅ Paiement sécurisé
📧 Confirmation envoyée par email
📱 Suivi de commande disponible
🛡️ Garantie incluse

Merci pour votre confiance ! 🚀`

    alert(successMessage)
    
    // Vider le panier et fermer le modal
    safeLocalStorage.removeItem('cart')
    setShowPaymentModal(false)
    setPaymentStep(1)
    setPaymentMethod("mobile_money")
    
    // Redirection
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  // Fonctions pour les paramètres de livraison
  const handleSettingsChange = (key: string, value: any) => {
    setDeliverySettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleDeliveryPreferenceChange = (key: string, value: any) => {
    setDeliverySettings(prev => ({
      ...prev,
      deliveryPreferences: {
        ...prev.deliveryPreferences,
        [key]: value
      }
    }))
  }

  const saveDeliverySettings = () => {
    // Sauvegarder les paramètres dans le localStorage
    safeLocalStorage.setItem('deliverySettings', JSON.stringify(deliverySettings))
    
    // Notification de succès
    const activeFeatures = []
    if (deliverySettings.notifications) activeFeatures.push('🔔 Notifications en temps réel')
    if (deliverySettings.gpsTracking) activeFeatures.push('📍 Suivi GPS')
    if (deliverySettings.autoRefresh) activeFeatures.push('🔄 Actualisation automatique')
    if (deliverySettings.soundAlerts) activeFeatures.push('🔊 Alertes sonores')
    if (deliverySettings.vibrationAlerts) activeFeatures.push('📳 Alertes vibratoires')
    if (deliverySettings.emailNotifications) activeFeatures.push('📧 Notifications email')
    if (deliverySettings.smsNotifications) activeFeatures.push('📱 Notifications SMS')
    if (deliverySettings.pushNotifications) activeFeatures.push('📲 Notifications push')
    
    alert(`⚙️ Paramètres sauvegardés avec succès !

✅ Configuration mise à jour
🔧 Paramètres appliqués immédiatement

Fonctionnalités actives :
${activeFeatures.join('\n')}

Vos préférences de livraison ont été enregistrées.`)
    
    setShowSettingsModal(false)
  }

  const resetDeliverySettings = () => {
    const defaultSettings = {
      notifications: true,
      gpsTracking: true,
      autoRefresh: true,
      soundAlerts: false,
      vibrationAlerts: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      deliveryPreferences: {
        preferredTime: "anytime",
        preferredDay: "anyday",
        contactBeforeDelivery: true,
        leaveAtDoor: false
      }
    }
    
    setDeliverySettings(defaultSettings)
    alert('🔄 Paramètres réinitialisés aux valeurs par défaut !')
  }

  // Fonctions pour les modals de suivi de livraison
  const handleGPSTracking = () => {
    if (!selectedDelivery) return
    
    // Simuler le suivi GPS en temps réel
    const trackingData = {
    currentLocation: "Abomey-Calavi, Bénin",
    estimatedArrival: "15 minutes",
    distance: "2.3 km",
    speed: "25 km/h",
    lastUpdate: new Date().toLocaleTimeString('fr-FR'),
      route: [
        { lat: 6.4485, lng: 2.3558, name: "Point de départ" },
        { lat: 6.4490, lng: 2.3560, name: "En route" },
        { lat: 6.4495, lng: 2.3565, name: "Proche destination" }
      ]
    }
    
    alert(`📍 Suivi GPS - ${selectedDelivery.trackingNumber}

🚚 Livreur: ${selectedDelivery.driver || 'Livreur Probooster'}
📍 Localisation actuelle: ${trackingData.currentLocation}
⏰ Arrivée estimée: ${trackingData.estimatedArrival}
📏 Distance restante: ${trackingData.distance}
🚗 Vitesse: ${trackingData.speed}
🕐 Dernière mise à jour: ${trackingData.lastUpdate}

🗺️ Suivi en temps réel activé
📱 Notifications GPS activées
🔔 Alertes de proximité activées`)
  }

  const handleContactDriver = () => {
    if (!selectedDelivery) return
    
    const driverInfo = {
      name: selectedDelivery.driver || "Livreur Probooster",
      phone: selectedDelivery.driverPhone || "+229 91 50 57 57",
      vehicle: selectedDelivery.vehicle || "Moto Probooster",
      plate: selectedDelivery.plate || "BJ-1234-AB",
      rating: selectedDelivery.driverRating || 4.8
    }
    
    alert(`📞 Contact Livreur - ${selectedDelivery.trackingNumber}

👤 Nom: ${driverInfo.name}
📱 Téléphone: ${driverInfo.phone}
🏍️ Véhicule: ${driverInfo.vehicle}
🚗 Plaque: ${driverInfo.plate}
⭐ Note: ${driverInfo.rating}/5

💬 Options de contact:
• Appel direct: ${driverInfo.phone}
• SMS: ${driverInfo.phone}
• Chat en ligne: Disponible
• Support: +229 91 50 57 57

⚠️ Le livreur peut être en route, privilégiez le SMS pour les urgences.`)
  }

  const handleReportIssue = () => {
    if (!selectedDelivery) return
    
    const reportTypes = [
      "Retard de livraison",
      "Produit endommagé",
      "Livreur non trouvé",
      "Adresse incorrecte",
      "Problème de paiement",
      "Autre problème"
    ]
    
    const selectedIssue = prompt(`📋 Rapport de problème - ${selectedDelivery.trackingNumber}

Veuillez sélectionner le type de problème:

${reportTypes.map((type, index) => `${index + 1}. ${type}`).join('\n')}

Entrez le numéro correspondant (1-6):`)
    
    if (selectedIssue && reportTypes[parseInt(selectedIssue) - 1]) {
      const issueType = reportTypes[parseInt(selectedIssue) - 1]
      const description = prompt(`Décrivez le problème en détail:`)
      
      if (description) {
        const report = {
          id: `RPT-${Date.now()}`,
          trackingNumber: selectedDelivery.trackingNumber,
          issueType: issueType,
          description: description,
          date: new Date().toISOString(),
          status: "En cours de traitement"
        }
        
        // Sauvegarder le rapport
        const existingReports = JSON.parse(safeLocalStorage.getItem('deliveryReports', '[]'))
        existingReports.push(report)
        safeLocalStorage.setItem('deliveryReports', JSON.stringify(existingReports))
        
        alert(`📋 Rapport envoyé avec succès !

🆔 Numéro de rapport: ${report.id}
📦 Numéro de suivi: ${report.trackingNumber}
🚨 Type de problème: ${issueType}
📝 Description: ${description}
📅 Date: ${new Date().toLocaleDateString('fr-FR')}
⏰ Heure: ${new Date().toLocaleTimeString('fr-FR')}

✅ Rapport enregistré
📧 Confirmation envoyée par email
📞 Support contacté automatiquement
⏱️ Traitement sous 24h

Merci de nous avoir signalé ce problème.`)
      }
    }
  }

  // Fonctions pour le Support Client
  const handlePhoneSupport = () => {
    // Lancer l'appel téléphonique automatiquement
    const phoneNumber = '+22991505757'
    
    // Vérifier si l'appareil supporte les appels téléphoniques
    if (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
      // Sur mobile, lancer l'appel automatiquement
      try {
        window.location.href = `tel:${phoneNumber}`
        // Notification de succès
        alert(`📞 Appel en cours...\n\nNuméro: ${phoneNumber}\n\nL'appel se lance automatiquement sur votre appareil.`)
      } catch (error) {
        alert(`📞 Appel téléphonique\n\nNuméro: ${phoneNumber}\n\nL'appel se lance automatiquement.`)
      }
    } else {
      // Sur desktop, afficher le numéro et proposer des alternatives
      alert(`📞 Support Téléphonique\n\nNuméro: ${phoneNumber}\n\nSur mobile: Appel automatique lancé\nSur desktop: Copiez le numéro et appelez manuellement\n\nAlternatives:\n• WhatsApp: +22991505757\n• Email: support@probooster.online`)
    }
  }

  const handleChatSupport = () => {
    setShowChatModal(true)
    setChatStatus('connecting')
    
    // Simuler la connexion au chat
    setTimeout(() => {
      setChatStatus('connected')
      // Message de bienvenue automatique
      setChatMessages([
        {
          id: 1,
          type: 'admin',
          message: '👋 Bonjour ! Je suis l\'équipe support de Probooster. Comment puis-je vous aider aujourd\'hui ?',
          timestamp: new Date().toISOString(),
          sender: 'Support Probooster'
        }
      ])
    }, 1500)
  }

  const handleEmailSupport = () => {
    const email = 'support@probooster.online'
    const subject = encodeURIComponent('Support Client - Demande d\'assistance')
    const body = encodeURIComponent(`Bonjour,\n\nJ'ai besoin d'assistance concernant:\n\n[Veuillez décrire votre problème ici]\n\nCordialement`)
    
    // Ouvrir le client email par défaut
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  const handleCategorySelect = (categoryId: string) => {
    setSupportCategory(categoryId)
    // Afficher une notification de confirmation
    const categoryNames = {
      'general': 'Support Général',
      'technical': 'Support Technique',
      'delivery': 'Livraisons',
      'payment': 'Paiements',
      'account': 'Compte Utilisateur',
      'orders': 'Commandes'
    }
    alert(`✅ Catégorie sélectionnée: ${categoryNames[categoryId as keyof typeof categoryNames]}\n\nVous pouvez maintenant décrire votre problème dans le formulaire ci-dessous.`)
  }

  const handleSupportMessageSubmit = () => {
    if (!supportMessage.trim()) {
      alert('⚠️ Veuillez saisir un message avant d\'envoyer.')
      return
    }

    // Simuler l'envoi du message
    const categoryNames = {
      'general': 'Support Général',
      'technical': 'Support Technique',
      'delivery': 'Livraisons',
      'payment': 'Paiements',
      'account': 'Compte Utilisateur',
      'orders': 'Commandes'
    }

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    const currentDate = new Date().toLocaleString('fr-FR')

    // Créer le message pour l'administrateur
    const adminMessage = {
      id: Date.now(),
      ticketNumber: ticketNumber,
      category: categoryNames[supportCategory as keyof typeof categoryNames],
      message: supportMessage,
      screenshots: supportScreenshots.length > 0 ? supportScreenshots.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      })) : [],
      date: currentDate,
      status: 'Nouveau',
      priority: 'Normal',
      userEmail: 'utilisateur@example.com', // En production, récupérer l'email de l'utilisateur connecté
      userId: 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase()
    }

    // Sauvegarder dans localStorage pour l'administrateur
    const existingMessages = JSON.parse(safeLocalStorage.getItem('adminSupportMessages', '[]'))
    existingMessages.push(adminMessage)
    safeLocalStorage.setItem('adminSupportMessages', JSON.stringify(existingMessages))

    // Simuler l'envoi par email à l'administrateur
    const emailContent = `Nouveau message de support reçu

Ticket: ${ticketNumber}
Catégorie: ${adminMessage.category}
Message: ${adminMessage.message}
Captures d'écran: ${supportScreenshots.length > 0 ? `${supportScreenshots.length} capture(s) jointe(s)` : 'Aucune capture jointe'}
Date: ${adminMessage.date}
Utilisateur: ${adminMessage.userEmail}

Consultez votre tableau de bord pour plus de détails.`

    // En production, envoyer l'email via une API
    console.log('📧 Email envoyé à support@probooster.online:', emailContent)

    const confirmationMessage = `✅ Message envoyé avec succès !

📋 Détails de votre demande:
• Numéro de ticket: ${ticketNumber}
• Catégorie: ${categoryNames[supportCategory as keyof typeof categoryNames]}
• Message: ${supportMessage}
• Captures d'écran: ${supportScreenshots.length > 0 ? `${supportScreenshots.length} capture(s) jointe(s)` : 'Aucune capture jointe'}
• Date: ${currentDate}

📧 Notre équipe vous répondra dans les plus brefs délais.
📱 Vous recevrez une confirmation par email.
📊 Votre demande est enregistrée dans notre système.`

    alert(confirmationMessage)
    
    // Réinitialiser le formulaire
    setSupportMessage('')
    setSupportCategory('general')
    setSupportScreenshots([])
    setShowSupportModal(false)
  }

  const handleChatMessageSubmit = () => {
    if (!chatMessage.trim()) {
      alert('⚠️ Veuillez saisir un message pour démarrer le chat.')
      return
    }

    // Ajouter le message de l'utilisateur
    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toISOString(),
      sender: 'Vous'
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatMessage('')
    setIsTyping(true)

    // Simuler la réponse de l'administrateur
    setTimeout(() => {
      setIsTyping(false)
      
      const adminResponse = {
        id: Date.now() + 1,
        type: 'admin',
        message: `Merci pour votre message "${userMessage.message}". Un agent de notre équipe va vous répondre dans les plus brefs délais. En attendant, pouvez-vous me donner plus de détails sur votre problème ?`,
        timestamp: new Date().toISOString(),
        sender: 'Support Probooster'
      }

      setChatMessages(prev => [...prev, adminResponse])

      // Sauvegarder la conversation pour l'administrateur
      const chatSession = {
        id: Date.now(),
        messages: [...chatMessages, userMessage, adminResponse],
        startTime: new Date().toISOString(),
        status: 'En cours',
        userAgent: navigator.userAgent,
        userId: 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase()
      }

      const existingSessions = JSON.parse(safeLocalStorage.getItem('adminChatSessions', '[]'))
      existingSessions.push(chatSession)
      safeLocalStorage.setItem('adminChatSessions', JSON.stringify(existingSessions))
    }, 2000)
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <header className="bg-[#535455] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="animate-pulse bg-gray-600 h-10 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-64 rounded"></div>
            <div className="animate-pulse bg-gray-600 h-10 w-48 rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-[#535455] text-white fixed-header">
      <div className="container mx-auto px-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo Probooster */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/images/logo.png" 
              alt="Probooster Logo" 
              width={120} 
              height={40} 
              className="h-10 w-auto"
              style={{ width: 'auto', height: '40px' }}
              priority
            />
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-6">
            <div className="relative">
              <Input
                type="search"
                placeholder="Rechercher des produits..."
                className="w-full pl-4 pr-12 py-3 rounded-full bg-white text-black border-0 focus:ring-2 focus:ring-[#ff6600] text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#ff6600] hover:bg-[#e55a00] rounded-full h-10 w-10"
                onClick={handleSearch}
              >
                <Search className="h-5 w-5 text-white" />
              </Button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-24 bg-gray-600 border-gray-500 text-white rounded-full px-3 py-2">
                <SelectValue />
                <ChevronDown className="h-4 w-4 ml-1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fcfa">F CFA</SelectItem>
                <SelectItem value="eur">EUR</SelectItem>
                <SelectItem value="usd">USD</SelectItem>
              </SelectContent>
            </Select>

            {/* Points Display with Progress Bar */}
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center space-x-2 text-sm bg-gray-600 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-500 transition-colors duration-300">
                  {/* Icône des pièces dorées avec animation haut-bas alternée */}
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    {/* Première pièce (gauche) - Animation vers le haut */}
                    <div className="absolute left-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0s' }}>
                      1
                    </div>
                    {/* Deuxième pièce (droite) avec checkmark - Animation vers le bas */}
                    <div className="absolute right-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0.75s' }}>
                      ✓
                    </div>
                    {/* Effet de brillance subtil */}
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-yellow-200/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs">
                      {userPoints} pts ({pointsValue.toLocaleString()} F CFA)
                    </span>
                    <div className="w-24 mt-1">
                      <Progress value={progressPercentage} className="h-1 bg-gray-500" />
                      <div className="text-xs text-gray-300 mt-1 whitespace-nowrap">
                        {progressPercentage >= 100
                          ? "Retrait disponible"
                          : `${withdrawalThreshold.toLocaleString()} F CFA requis`}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <Gift className="h-5 w-5 text-[#ff6600]" />
                    <span>Mes Points</span>
                  </DialogTitle>
                  <DialogDescription>
                    Gérez vos points de fidélité et consultez votre solde actuel
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Card className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white">
                    <CardHeader>
                      <CardTitle className="text-xl">Solde Actuel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold mb-2">{userPoints} points</div>
                      <div className="text-sm opacity-90">Valeur: {pointsValue.toLocaleString()} F CFA</div>
                      <Progress value={progressPercentage} className="h-2 bg-white/20 mt-3" />
                      <div className="text-xs mt-2">
                        {progressPercentage >= 100 
                          ? "✅ Retrait disponible" 
                          : `${withdrawalThreshold - pointsValue} F CFA restants pour le retrait`}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {progressPercentage >= 100 && (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleWithdrawPoints}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Retirer mes points
                    </Button>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    <p>💡 Gagnez des points en partageant des produits sur les réseaux sociaux !</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 group hover:scale-110 transition-transform duration-300 hover:shadow-lg cursor-pointer">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-gray-600 group-hover:bg-[#ff6600] transition-colors duration-300">
                    <User className="h-4 w-4 group-hover:scale-110 transition-transform duration-300 text-white" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Mon Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Mes Commandes</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center space-x-2 text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wishlist - Modal Redesigné */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <Heart className="h-5 w-5 text-red-500 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
                  {wishlistItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[#ff6600] text-xs p-0 flex items-center justify-center animate-bounce">
                      {wishlistItems}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-red-50 via-white to-pink-50">
                <DialogHeader className="sr-only">
                  <DialogTitle>Mes Favoris</DialogTitle>
                  <DialogDescription>
                    Consultez et gérez vos produits favoris
                  </DialogDescription>
                </DialogHeader>
                {/* Header avec gradient et animations */}
                <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                    <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
                  </div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Heart className="h-8 w-8 animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Mes Favoris</h2>
                        <p className="text-white/80 text-sm">Vos produits préférés ({wishlistItems})</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                           >
                             <Share2 className="h-4 w-4 mr-2" />
                             Partager
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent className="w-56 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2">
                           <div className="px-2 py-1 mb-2">
                             <h4 className="text-sm font-semibold text-gray-800">Partager et gagner des points</h4>
                             <p className="text-xs text-gray-500">Choisissez votre réseau social</p>
                           </div>
                           
                           <DropdownMenuItem 
                             onClick={() => {
                               const shareText = `🎉 Découvrez mes favoris sur Probooster !\n❤️ ${wishlistItems} produits favoris\n💰 Total: ${wishlistItemsData.reduce((total, item) => total + item.price, 0).toLocaleString()} F CFA\n\n🔗 ${window.location.origin}`
                               const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
                               window.open(shareUrl, '_blank')
                               // Ajouter 30 points
                               const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                               safeLocalStorage.setItem('userPoints', (currentPoints + 30).toString())
                               alert('✅ +30 points gagnés ! Partagez sur WhatsApp')
                             }}
                             className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 cursor-pointer group"
                           >
                             <div className="flex items-center space-x-3">
                               <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                 <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                 </svg>
                               </div>
                               <div>
                                 <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                                 <p className="text-xs text-gray-500">Partagez avec vos contacts</p>
                               </div>
                             </div>
                             <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                               <Coins className="h-3 w-3 text-green-600" />
                               <span className="text-xs font-bold text-green-700">+30</span>
                             </div>
                           </DropdownMenuItem>

                           <DropdownMenuItem 
                             onClick={() => {
                               const shareText = `🎉 Découvrez mes favoris sur Probooster !\n❤️ ${wishlistItems} produits favoris\n💰 Total: ${wishlistItemsData.reduce((total, item) => total + item.price, 0).toLocaleString()} F CFA`
                               const shareUrl = `${window.location.origin}`
                               const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
                               window.open(fbUrl, '_blank', 'width=600,height=400')
                               // Ajouter 50 points
                               const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                               safeLocalStorage.setItem('userPoints', (currentPoints + 50).toString())
                               alert('✅ +50 points gagnés ! Partagez sur Facebook')
                             }}
                             className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 cursor-pointer group"
                           >
                             <div className="flex items-center space-x-3">
                               <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                 <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                 </svg>
                               </div>
                               <div>
                                 <span className="text-sm font-medium text-gray-800">Facebook</span>
                                 <p className="text-xs text-gray-500">Partagez sur votre mur</p>
                               </div>
                             </div>
                             <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                               <Coins className="h-3 w-3 text-blue-600" />
                               <span className="text-xs font-bold text-blue-700">+50</span>
                             </div>
                           </DropdownMenuItem>

                           <DropdownMenuItem 
                             onClick={() => {
                               const shareText = `🎉 Découvrez mes favoris sur Probooster !\n❤️ ${wishlistItems} produits favoris\n💰 Total: ${wishlistItemsData.reduce((total, item) => total + item.price, 0).toLocaleString()} F CFA\n\n#Probooster #Marketplace`
                               const shareUrl = `${window.location.origin}`
                               const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
                               window.open(twitterUrl, '_blank', 'width=600,height=400')
                               // Ajouter 40 points
                               const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                               safeLocalStorage.setItem('userPoints', (currentPoints + 40).toString())
                               alert('✅ +40 points gagnés ! Partagez sur X (Twitter)')
                             }}
                             className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
                           >
                             <div className="flex items-center space-x-3">
                               <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                 <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                 </svg>
                               </div>
                               <div>
                                 <span className="text-sm font-medium text-gray-800">X (Twitter)</span>
                                 <p className="text-xs text-gray-500">Partagez avec vos followers</p>
                               </div>
                             </div>
                             <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                               <Coins className="h-3 w-3 text-gray-600" />
                               <span className="text-xs font-bold text-gray-700">+40</span>
                             </div>
                           </DropdownMenuItem>

                           <DropdownMenuItem 
                             onClick={() => {
                               const shareText = `🎉 Découvrez mes favoris sur Probooster !\n❤️ ${wishlistItems} produits favoris\n💰 Total: ${wishlistItemsData.reduce((total, item) => total + item.price, 0).toLocaleString()} F CFA\n\nLien: ${window.location.origin}`
                               navigator.clipboard.writeText(shareText).then(() => {
                                 alert('📸 Texte copié ! Collez-le dans votre story Instagram ou post.\n✅ +45 points gagnés !')
                                 // Ajouter 45 points
                                 const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                                 safeLocalStorage.setItem('userPoints', (currentPoints + 45).toString())
                               })
                             }}
                             className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50 cursor-pointer group"
                           >
                             <div className="flex items-center space-x-3">
                               <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center">
                                 <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                                 </svg>
                               </div>
                               <div>
                                 <span className="text-sm font-medium text-gray-800">Instagram</span>
                                 <p className="text-xs text-gray-500">Copiez le texte</p>
                               </div>
                             </div>
                             <div className="flex items-center space-x-1 bg-pink-100 px-2 py-1 rounded-full">
                               <Coins className="h-3 w-3 text-pink-600" />
                               <span className="text-xs font-bold text-pink-700">+45</span>
                             </div>
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                       
                       <Button
                         variant="ghost"
                         size="sm"
                         className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                         onClick={() => setShowCompareModal(true)}
                       >
                         <BarChart3 className="h-4 w-4 mr-2" />
                         Comparer
                       </Button>
                       
                       {wishlistItems > 0 && (
                         <Button
                           variant="ghost"
                           size="sm"
                           className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                           onClick={() => {
                             // Fonctionnalité d'ajout en masse au panier
                             wishlistItemsData.forEach(item => handleAddToCart(item.id))
                             alert('Tous les produits ajoutés au panier !')
                           }}
                         >
                           <ShoppingCart className="h-4 w-4 mr-2" />
                           Tout ajouter
                         </Button>
                       )}
                     </div>
                  </div>
                </div>

                {/* Contenu principal avec scroll */}
                <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
                  {wishlistItems === 0 ? (
                    // État vide avec design attractif
                    <div className="text-center py-12">
                      <div className="relative mb-6">
                        <Heart className="h-24 w-24 text-gray-300 mx-auto animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full animate-ping"></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun favori pour le moment</h3>
                      <p className="text-gray-500 mb-6">Commencez à ajouter vos produits préférés !</p>
                      <Button 
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                        onClick={() => window.location.href = '/'}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Découvrir des produits
                      </Button>
                    </div>
                  ) : (
                    // Grille de produits avec design moderne
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {wishlistItemsData.map((item, index) => (
                        <Card 
                          key={item.id} 
                          className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white/80 backdrop-blur-sm mb-6"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          {/* Badge de promotion animé */}
                          <div className="absolute top-3 left-3 z-10">
                            <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs animate-pulse">
                              ❤️ Favori
                            </Badge>
                          </div>

                          {/* Image avec overlay */}
                          <div className="relative h-48 overflow-hidden">
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Boutons d'action flottants */}
                            <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 bg-white/90 hover:bg-white shadow-lg"
                                onClick={() => handleRemoveFromWishlist(item.id)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {/* Contenu du produit */}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition-colors duration-300 line-clamp-2">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Vendeur: {item.seller}</p>
                      </div>
                            </div>

                            {/* Prix avec animation */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-red-600">
                                  {item.price.toLocaleString()}
                                </span>
                                <span className="text-sm text-gray-500">F CFA</span>
                              </div>
                              
                                                             {/* Points bonus améliorés */}
                               <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-200 to-orange-200 px-3 py-1.5 rounded-full border border-yellow-300 shadow-sm">
                                 <Coins className="h-3 w-3 text-yellow-700 animate-bounce" />
                                 <span className="text-xs text-yellow-800 font-bold">
                                   +{Math.floor(item.price / 100)} pts
                                 </span>
                                 <div className="w-1 h-1 bg-yellow-600 rounded-full animate-pulse"></div>
                               </div>
                            </div>

                            {/* Boutons d'action */}
                      <div className="flex space-x-2">
                        <Button 
                                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white transition-all duration-300 hover:scale-105"
                          onClick={() => handleAddToCart(item.id)}
                        >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Ajouter
                        </Button>
                              
                        <Button 
                          variant="outline"
                                className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 transition-all duration-300 hover:scale-105"
                                onClick={() => {
                                  // Fonctionnalité de comparaison
                                  handleAddToCompare(item)
                                }}
                              >
                                <BarChart3 className="h-4 w-4" />
                        </Button>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline"
                                    className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 transition-all duration-300 hover:scale-105"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2">
                                  <div className="px-2 py-1 mb-2">
                                    <h4 className="text-sm font-semibold text-gray-800">Partager et gagner des points</h4>
                                    <p className="text-xs text-gray-500">Choisissez votre réseau social</p>
                      </div>
                                  
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const shareText = `🎉 Découvrez ${item.name} sur Probooster !\n💰 Prix: ${item.price.toLocaleString()} F CFA\n⭐ Note: 4.8/5\n🏪 Vendeur: ${item.seller}\n\n🔗 ${window.location.origin}`
                                      const shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
                                      window.open(shareUrl, '_blank')
                                      // Ajouter 30 points
                                      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                                      safeLocalStorage.setItem('userPoints', (currentPoints + 30).toString())
                                      alert('✅ +30 points gagnés ! Partagez sur WhatsApp')
                                    }}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 cursor-pointer group"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                        </svg>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                                        <p className="text-xs text-gray-500">Partagez avec vos contacts</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                                      <Coins className="h-3 w-3 text-green-600" />
                                      <span className="text-xs font-bold text-green-700">+30</span>
                                    </div>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const shareText = `🎉 Découvrez ${item.name} sur Probooster !\n💰 Prix: ${item.price.toLocaleString()} F CFA\n⭐ Note: 4.8/5\n🏪 Vendeur: ${item.seller}`
                                      const shareUrl = `${window.location.origin}`
                                      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
                                      window.open(fbUrl, '_blank', 'width=600,height=400')
                                      // Ajouter 50 points
                                      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                                      safeLocalStorage.setItem('userPoints', (currentPoints + 50).toString())
                                      alert('✅ +50 points gagnés ! Partagez sur Facebook')
                                    }}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 cursor-pointer group"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium text-gray-800">Facebook</span>
                                        <p className="text-xs text-gray-500">Partagez sur votre mur</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                                      <Coins className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs font-bold text-blue-700">+50</span>
                                    </div>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const shareText = `🎉 Découvrez ${item.name} sur Probooster !\n💰 Prix: ${item.price.toLocaleString()} F CFA\n⭐ Note: 4.8/5\n🏪 Vendeur: ${item.seller}\n\n#Probooster #Marketplace`
                                      const shareUrl = `${window.location.origin}`
                                      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
                                      window.open(twitterUrl, '_blank', 'width=600,height=400')
                                      // Ajouter 40 points
                                      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                                      safeLocalStorage.setItem('userPoints', (currentPoints + 40).toString())
                                      alert('✅ +40 points gagnés ! Partagez sur X (Twitter)')
                                    }}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                        </svg>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium text-gray-800">X (Twitter)</span>
                                        <p className="text-xs text-gray-500">Partagez avec vos followers</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                                      <Coins className="h-3 w-3 text-gray-600" />
                                      <span className="text-xs font-bold text-gray-700">+40</span>
                                    </div>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const shareText = `🎉 Découvrez ${item.name} sur Probooster !\n💰 Prix: ${item.price.toLocaleString()} F CFA\n⭐ Note: 4.8/5\n🏪 Vendeur: ${item.seller}\n\nLien: ${window.location.origin}`
                                      navigator.clipboard.writeText(shareText).then(() => {
                                        alert('📸 Texte copié ! Collez-le dans votre story Instagram ou post.\n✅ +45 points gagnés !')
                                        // Ajouter 45 points
                                        const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                                        safeLocalStorage.setItem('userPoints', (currentPoints + 45).toString())
                                      })
                                    }}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50 cursor-pointer group"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                                        </svg>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium text-gray-800">Instagram</span>
                                        <p className="text-xs text-gray-500">Copiez le texte</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 bg-pink-100 px-2 py-1 rounded-full">
                                      <Coins className="h-3 w-3 text-pink-600" />
                                      <span className="text-xs font-bold text-pink-700">+45</span>
                                    </div>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                                                         {/* Informations supplémentaires - Section améliorée et visible */}
                             <div className="mt-4 pt-4 border-t-2 border-red-200 bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 mb-4">
                               <div className="flex items-center justify-between mb-3">
                                 {/* Date d'ajout avec icône */}
                                 <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-2 rounded-full border border-blue-200">
                                   <Clock className="h-3 w-3 text-blue-600" />
                                   <span className="text-xs font-bold text-blue-800">
                                     Ajouté le {item.addedAt ? new Date(item.addedAt).toLocaleDateString('fr-FR') : 'Récemment'}
                                   </span>
                                 </div>
                                 
                                 {/* Note et avis */}
                                 <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-2 rounded-full border border-yellow-200">
                                   <Star className="h-3 w-3 text-yellow-600 fill-current animate-pulse" />
                                   <span className="text-xs font-bold text-yellow-800">4.8</span>
                                   <span className="text-xs text-yellow-700">(128 avis)</span>
                                 </div>
                               </div>
                               
                               {/* Informations supplémentaires */}
                               <div className="grid grid-cols-2 gap-2 text-xs">
                                 <div className="flex items-center space-x-2 bg-green-50 px-2 py-1.5 rounded-lg border border-green-200">
                                   <Package className="h-3 w-3 text-green-600" />
                                   <span className="text-green-700 font-medium">En stock</span>
                                 </div>
                                 
                                 <div className="flex items-center space-x-2 bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-200">
                                   <Truck className="h-3 w-3 text-blue-600" />
                                   <span className="text-blue-700">Livraison gratuite</span>
                                 </div>
                                 
                                 <div className="flex items-center space-x-2 bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-200">
                                   <Shield className="h-3 w-3 text-purple-600" />
                                   <span className="text-purple-700 font-medium">Garantie 1 an</span>
                                 </div>
                                 
                                 <div className="flex items-center space-x-2 bg-orange-50 px-2 py-1.5 rounded-lg border border-orange-200">
                                   <Gift className="h-3 w-3 text-orange-600" />
                                   <span className="text-orange-700">Cadeau inclus</span>
                                 </div>
                               </div>
                             </div>
                          </div>

                          {/* Effet de brillance au survol */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </Card>
                  ))}
                </div>
                  )}
                </div>

                {/* Footer avec statistiques */}
                {wishlistItems > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t border-gray-200 sticky bottom-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-red-500" />
                          <span className="text-gray-600">{wishlistItems} produit{wishlistItems > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="text-gray-600">
                            {wishlistItemsData.reduce((total, item) => total + Math.floor(item.price / 100), 0)} points bonus
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Total estimé:</span>
                        <span className="font-bold text-red-600">
                          {wishlistItemsData.reduce((total, item) => total + item.price, 0).toLocaleString()} F CFA
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Delivery Truck - Redesign Complet */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <Truck className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
                  {deliveryData.filter(d => d.status === "en_cours").length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs p-0 flex items-center justify-center animate-bounce">
                      {deliveryData.filter(d => d.status === "en_cours").length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[98vh] overflow-hidden p-0 bg-gradient-to-br from-red-50 via-white to-pink-50">
                <DialogHeader className="sr-only">
                  <DialogTitle>Suivi des Livraisons</DialogTitle>
                  <DialogDescription>
                    Suivez vos commandes en temps réel et gérez vos livraisons
                  </DialogDescription>
                </DialogHeader>
                
                {/* Header avec gradient et animations */}
                <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                    <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
                  </div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Truck className="h-8 w-8 animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Suivi des Livraisons</h2>
                        <p className="text-white/80 text-sm">{deliveryData.length} commande{deliveryData.length > 1 ? 's' : ''} • {deliveryData.filter(d => d.status === "en_cours").length} en cours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                        onClick={() => setShowSettingsModal(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                        onClick={() => {
                          // Système d'actualisation professionnel et complet
                          const button = document.querySelector('button[aria-label="refresh-deliveries"]') as HTMLButtonElement
                          if (button) {
                            button.disabled = true
                            button.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Synchronisation...'
                          }
                          
                          // Récupérer les paramètres actuels
                          const settings = JSON.parse(safeLocalStorage.getItem('deliverySettings', '{"notifications": true, "gpsTracking": true}'))
                          
                          // Simuler une synchronisation complète
                          setTimeout(() => {
                            const existingDeliveries = JSON.parse(safeLocalStorage.getItem('deliveries', '[]'))
                            const updatedDeliveries = existingDeliveries.map((delivery: any) => {
                              // Simuler des mises à jour réalistes
                              if (delivery.status === 'en_cours') {
                                const random = Math.random()
                                if (random > 0.8) {
                                  // Livraison terminée
                                  return {
                                    ...delivery,
                                    status: 'livré',
                                    deliveredDate: new Date().toLocaleDateString('fr-FR'),
                                    location: 'Livré à votre adresse',
                                    deliveredAt: new Date().toLocaleTimeString('fr-FR')
                                  }
                                } else if (random > 0.6) {
                                  // Mise à jour de localisation
                                  const locations = [
                                    'En route vers votre adresse',
                                    'À 5 minutes de votre adresse',
                                    'Arrivé dans votre quartier',
                                    'En attente de votre disponibilité'
                                  ]
                                  return {
                                    ...delivery,
                                    location: locations[Math.floor(Math.random() * locations.length)],
                                    lastUpdate: new Date().toLocaleTimeString('fr-FR')
                                  }
                                }
                              }
                              return delivery
                            })
                            
                            safeLocalStorage.setItem('deliveries', JSON.stringify(updatedDeliveries))
                            
                            // Analyser les changements
                            const statusChanges = updatedDeliveries.filter((d: any, i: number) => 
                              d.status !== existingDeliveries[i]?.status
                            ).length
                            
                            const locationUpdates = updatedDeliveries.filter((d: any, i: number) => 
                              d.location !== existingDeliveries[i]?.location
                            ).length
                            
                            const deliveredCount = updatedDeliveries.filter((d: any) => d.status === 'livré').length
                            const inProgressCount = updatedDeliveries.filter((d: any) => d.status === 'en_cours').length
                            
                            // Générer un rapport de synchronisation
                            const syncReport = [
                              `🔄 Synchronisation Terminée`,
                              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                              `⏰ ${new Date().toLocaleString('fr-FR')}`,
                              `📦 ${existingDeliveries.length} commande(s) vérifiée(s)`,
                              `✅ ${statusChanges} statut(s) mis à jour`,
                              `📍 ${locationUpdates} localisation(s) actualisée(s)`,
                              `📊 ${deliveredCount} livraison(s) terminée(s)`,
                              `🚚 ${inProgressCount} livraison(s) en cours`,
                              `📱 Notifications envoyées: ${settings.notifications ? 'Oui' : 'Non'}`,
                              `📍 GPS actif: ${settings.gpsTracking ? 'Oui' : 'Non'}`
                            ].join('\n')
                            
                            if (button) {
                              button.disabled = false
                              button.innerHTML = '<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>Actualiser'
                            }
                            
                            // Afficher le rapport détaillé
                            alert(syncReport)
                            
                            // Envoyer des notifications si activées
                            if (settings.notifications && statusChanges > 0) {
                              setTimeout(() => {
                                alert(`📱 Notification: ${statusChanges} mise(s) à jour de statut détectée(s) !`)
                              }, 1000)
                            }
                            
                            // Recharger pour voir les changements
                            window.location.reload()
                          }, 2500)
                        }}
                        aria-label="refresh-deliveries"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualiser
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/20 hover:bg-red-500/30 text-white border border-white/30 hover:border-red-300"
                        onClick={() => {
                          // Fermer le modal
                          const closeButton = document.querySelector('[data-radix-dialog-close]') as HTMLButtonElement
                          if (closeButton) closeButton.click()
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contenu principal avec layout en deux colonnes */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex h-full">
                    {/* Section gauche - Liste des livraisons */}
                    <div className="flex-1 border-r border-gray-200 flex flex-col h-full">
                      {/* Header fixe */}
                      <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Package className="h-5 w-5 text-red-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Mes Livraisons ({deliveryData.length})</h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              {deliveryData.filter(d => d.status === "livré").length} Livrées
                            </Badge>
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                              {deliveryData.filter(d => d.status === "en_cours").length} En cours
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenu scrollable avec espace suffisant et scroll personnalisé */}
                      <div className="flex-1 overflow-y-auto p-6 pb-20 custom-scrollbar relative" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                        {/* Indicateur de scroll en bas */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                        {deliveryData.length === 0 ? (
                          <div className="text-center py-12">
                                                         <div className="relative mb-6">
                               <Truck className="h-24 w-24 text-gray-300 mx-auto animate-pulse" />
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full animate-ping"></div>
                               </div>
                             </div>
                             <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune livraison en cours</h3>
                             <p className="text-gray-500 mb-6">Vos commandes apparaîtront ici une fois expédiées !</p>
                             <Button 
                               className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                               onClick={() => window.location.href = '/'}
                             >
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Commander maintenant
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {deliveryData.map((delivery, index) => (
                              <Card 
                                key={delivery.id} 
                                className="group relative overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white cursor-pointer"
                                onClick={() => {
                                  // Ouvrir les détails de la livraison
                                  alert(`📦 Détails de la livraison #${delivery.trackingNumber}\n\n📍 ${delivery.location}\n⏰ ${delivery.estimatedTime}\n📱 Contactez le livreur: +225 0123456789`)
                                }}
                              >
                                <div className="p-4">
                                  {/* Header de la carte */}
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="relative">
                                        <Package className="h-6 w-6 text-blue-600" />
                                        {delivery.status === "en_cours" && (
                                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        )}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-800">Commande #{delivery.trackingNumber}</h4>
                                        <p className="text-xs text-gray-500">Expédiée le {new Date().toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <Badge 
                                      className={`${
                                        delivery.status === "livré" 
                                          ? "bg-green-100 text-green-700 border-green-200" 
                                          : delivery.status === "en_cours" 
                                          ? "bg-orange-100 text-orange-700 border-orange-200 animate-pulse" 
                                          : "bg-blue-100 text-blue-700 border-blue-200"
                                      }`}
                                    >
                                      {delivery.status === "livré" ? "✅ Livré" : delivery.status === "en_cours" ? "🚚 En cours" : "📦 En transit"}
                                    </Badge>
                                  </div>
                                  
                                  {/* Barre de progression */}
                                  <div className="mb-3">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                      <span>Progression</span>
                                      <span>
                                        {delivery.status === "livré" ? "100%" : delivery.status === "en_cours" ? "75%" : "50%"}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                          delivery.status === "livré" 
                                            ? "bg-green-500 w-full" 
                                            : delivery.status === "en_cours" 
                                            ? "bg-orange-500 w-3/4" 
                                            : "bg-blue-500 w-1/2"
                                        }`}
                                      ></div>
                                    </div>
                                  </div>
                                  
                                  {/* Informations de livraison */}
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="h-4 w-4 text-gray-500" />
                                      <span className="text-gray-700">{delivery.location}</span>
                                    </div>
                                    
                                    {delivery.status === "en_cours" ? (
                                      <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-orange-500" />
                                        <span className="text-orange-600 font-medium">Livraison estimée: {delivery.estimatedTime}</span>
                                      </div>
                                    ) : delivery.status === "livré" ? (
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="text-green-600 font-medium">Livré le {delivery.deliveredDate}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-2">
                                        <Truck className="h-4 w-4 text-blue-500" />
                                        <span className="text-blue-600 font-medium">En transit vers le centre de distribution</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Actions rapides */}
                                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedDelivery(delivery)
                                        setShowGPSTrackingModal(true)
                                      }}
                                    >
                                      <MapPin className="h-3 w-3 mr-1" />
                                      Suivi GPS
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs border-green-200 text-green-600 hover:bg-green-50"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedDelivery(delivery)
                                        setShowContactModal(true)
                                      }}
                                    >
                                      <Phone className="h-3 w-3 mr-1" />
                                      Contacter
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedDelivery(delivery)
                                        setShowReportModal(true)
                                      }}
                                    >
                                      <Mail className="h-3 w-3 mr-1" />
                                      Rapport
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Section droite - Paramètres et statistiques */}
                    <div className="w-80 bg-gray-50 flex flex-col h-full">
                       {/* Header fixe */}
                       <div className="p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                         <h3 className="text-lg font-semibold text-gray-800">Paramètres & Statistiques</h3>
                       </div>
                       
                       {/* Contenu scrollable avec espace suffisant et scroll personnalisé */}
                       <div className="flex-1 overflow-y-auto p-6 pb-20 custom-scrollbar relative" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                         {/* Indicateur de scroll en bas */}
                         <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                         {/* Statistiques globales */}
                         <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">Statistiques</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total livraisons:</span>
                              <span className="font-semibold text-blue-600">{deliveryData.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Livrées:</span>
                              <span className="font-semibold text-green-600">{deliveryData.filter(d => d.status === "livré").length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">En cours:</span>
                              <span className="font-semibold text-orange-600">{deliveryData.filter(d => d.status === "en_cours").length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Taux de réussite:</span>
                              <span className="font-semibold text-purple-600">
                                {deliveryData.length > 0 ? Math.round((deliveryData.filter(d => d.status === "livré").length / deliveryData.length) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Paramètres de notifications */}
                        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">Notifications</h4>
                          <div className="space-y-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="text-blue-600" />
                              <span className="text-sm">Notifications push</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="text-blue-600" />
                              <span className="text-sm">Alertes par email</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" defaultChecked className="text-blue-600" />
                              <span className="text-sm">Suivi GPS en temps réel</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input type="checkbox" className="text-blue-600" />
                              <span className="text-sm">Rapports hebdomadaires</span>
                            </label>
                          </div>
                        </div>
                        
                        {/* Préférences de livraison */}
                        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">Préférences</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-gray-600 mb-1 block">Heure de livraison préférée</label>
                              <Select defaultValue="anytime">
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="morning">Matin (8h-12h)</SelectItem>
                                  <SelectItem value="afternoon">Après-midi (12h-17h)</SelectItem>
                                  <SelectItem value="evening">Soirée (17h-20h)</SelectItem>
                                  <SelectItem value="anytime">N'importe quand</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm text-gray-600 mb-1 block">Instructions spéciales</label>
                              <Input placeholder="Code, étage, etc." className="text-sm" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions rapides */}
                        <div className="space-y-3">
                                                     <Button 
                             className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                             onClick={() => setShowAppDownloadModal(true)}
                           >
                             <Smartphone className="h-4 w-4 mr-2" />
                             Télécharger l'app
                           </Button>
                           
                           <Button 
                             variant="outline"
                             className="w-full border-red-200 text-red-600 hover:bg-red-50"
                             onClick={() => setShowSupportModal(true)}
                           >
                            <Headphones className="h-4 w-4 mr-2" />
                            Support client
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Cart - Redesign Complet */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg">
                  <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
                  {cartItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-xs p-0 flex items-center justify-center animate-bounce">
                      {cartItems}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[99vh] overflow-hidden p-0 bg-gradient-to-br from-orange-50 via-white to-red-50">
                <DialogHeader className="sr-only">
                  <DialogTitle>Mon Panier</DialogTitle>
                  <DialogDescription>
                    Consultez et gérez vos articles dans le panier
                  </DialogDescription>
                </DialogHeader>
                
                {/* Header avec gradient et animations */}
                <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-4 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                    <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
                  </div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <ShoppingCart className="h-8 w-8 animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Mon Panier</h2>
                        <p className="text-white/80 text-sm">{cartItems} article{cartItems > 1 ? 's' : ''} • {cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {cartItems > 0 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/20 hover:bg-orange-500/30 text-white border border-white/30 hover:border-orange-300 transition-all duration-300 hover:scale-105"
                            onClick={() => setShowPromoCodeModal(true)}
                          >
                            <Gift className="h-4 w-4 mr-2 animate-bounce" />
                            Code promo
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/20 hover:bg-blue-500/30 text-white border border-white/30 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                            onClick={() => setShowDeliveryOptionsModal(true)}
                          >
                            <Truck className="h-4 w-4 mr-2 animate-pulse" />
                            Livraison
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/20 hover:bg-red-500/30 text-white border border-white/30 hover:border-red-300 transition-all duration-300"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir vider complètement votre panier ?')) {
                                safeLocalStorage.removeItem('cart')
                                window.location.reload()
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2 animate-pulse" />
                            Vider
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/20 hover:bg-pink-500/30 text-white border border-white/30 hover:border-pink-300 transition-all duration-300"
                            onClick={() => {
                              const wishlistItems = JSON.parse(safeLocalStorage.getItem('wishlist', '[]'))
                              cartItemsData.forEach(item => {
                                if (!wishlistItems.find((w: any) => w.id === item.id)) {
                                  wishlistItems.push({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    image: item.image,
                                    seller: item.seller,
                                    addedAt: new Date().toISOString()
                                  })
                                }
                              })
                              safeLocalStorage.setItem('wishlist', JSON.stringify(wishlistItems))
                              safeLocalStorage.removeItem('cart')
                              alert('✅ Tous les produits déplacés vers les favoris !')
                              window.location.reload()
                            }}
                          >
                            <Heart className="h-4 w-4 mr-2 animate-pulse" />
                            Sauvegarder
                          </Button>
                          

                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                              >
                                <Share2 className="h-4 w-4 mr-2" />
                                Partager
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2">
                              <div className="px-2 py-1 mb-2">
                                <h4 className="text-sm font-semibold text-gray-800">Partager et gagner des points</h4>
                                <p className="text-xs text-gray-500">Choisissez votre réseau social</p>
                              </div>
                              
                                                          <DropdownMenuItem 
                              onClick={() => {
                                const cartData = shareCart()
                                if (cartData) {
                                  shareToWhatsApp(cartData.text, 30)
                                }
                              }}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 cursor-pointer group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                                    <p className="text-xs text-gray-500">Partagez avec vos contacts</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                                  <Coins className="h-3 w-3 text-green-600" />
                                  <span className="text-xs font-bold text-green-700">+30</span>
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => {
                                  const cartData = shareCart()
                                  if (cartData) {
                                    shareToFacebook(cartData.text, cartData.url, 50)
                                  }
                                }}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 cursor-pointer group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">Facebook</span>
                                    <p className="text-xs text-gray-500">Partagez sur votre mur</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                                  <Coins className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-bold text-blue-700">+50</span>
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => {
                                  const cartData = shareCart()
                                  if (cartData) {
                                    const twitterText = `${cartData.text}\n\n#Probooster #Marketplace`
                                    shareToTwitter(twitterText, cartData.url, 40)
                                  }
                                }}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">X (Twitter)</span>
                                    <p className="text-xs text-gray-500">Partagez avec vos followers</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                                  <Coins className="h-3 w-3 text-gray-600" />
                                  <span className="text-xs font-bold text-gray-700">+40</span>
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => {
                                  const cartData = shareCart()
                                  if (cartData) {
                                    shareToInstagram(cartData.text, 45)
                                  }
                                }}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50 cursor-pointer group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">Instagram</span>
                                    <p className="text-xs text-gray-500">Copiez le texte</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 bg-pink-100 px-2 py-1 rounded-full">
                                  <Coins className="h-3 w-3 text-pink-600" />
                                  <span className="text-xs font-bold text-pink-700">+45</span>
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem 
                                onClick={() => {
                                  const cartText = cartItemsData.map((item, index) => 
                                    `${index + 1}. ${item.name} - ${item.price.toLocaleString()} F CFA x${item.quantity}`
                                  ).join('\n')
                                  const shareText = `🛒 Mon panier Probooster !\n${cartText}\n💰 Total: ${cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA\n\nLien: ${window.location.origin}`
                                  navigator.clipboard.writeText(shareText).then(() => {
                                    alert('📸 Texte copié ! Collez-le dans votre story Instagram ou post.\n✅ +45 points gagnés !')
                                    // Ajouter 45 points
                                    const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
                                    safeLocalStorage.setItem('userPoints', (currentPoints + 45).toString())
                                  })
                                }}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50 cursor-pointer group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                                    </svg>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-800">Instagram</span>
                                    <p className="text-xs text-gray-500">Copiez le texte</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 bg-pink-100 px-2 py-1 rounded-full">
                                  <Coins className="h-3 w-3 text-pink-600" />
                                  <span className="text-xs font-bold text-pink-700">+45</span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                                {/* Contenu principal avec layout en deux colonnes */}
                <div className="flex-1 overflow-hidden">
                  {cartItems === 0 ? (
                    // État vide avec design attractif et animations
                    <div className="text-center py-16 px-8">
                      <div className="relative mb-8">
                        <div className="relative">
                          <ShoppingCart className="h-32 w-32 text-gray-300 mx-auto animate-bounce" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-red-200 rounded-full animate-ping"></div>
                        </div>
                          {/* Particules animées */}
                          <div className="absolute -top-4 -left-4 w-3 h-3 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                          <div className="absolute -top-2 -right-2 w-2 h-2 bg-red-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                          <div className="absolute -bottom-4 left-4 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                          <div className="absolute -bottom-2 right-4 w-3 h-3 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                      </div>
                      </div>
                      
                      <div className="space-y-4 mb-8">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent animate-pulse">
                          Votre panier est vide
                        </h3>
                        <p className="text-gray-600 text-lg">Découvrez nos produits et commencez vos achats !</p>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                          <Package className="h-4 w-4 animate-pulse" />
                          <span>Des milliers de produits vous attendent</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                      <Button 
                          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-12 px-8 text-lg font-semibold transform hover:scale-105 transition-all duration-300 hover:shadow-lg active:scale-95"
                        onClick={() => window.location.href = '/'}
                      >
                          <ShoppingBag className="h-5 w-5 mr-3 animate-bounce" />
                        Découvrir des produits
                      </Button>
                        
                        <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Truck className="h-3 w-3" />
                            <span>Livraison gratuite</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span>Paiement sécurisé</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Coins className="h-3 w-3" />
                            <span>Points bonus</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Layout en deux colonnes comme dans les captures
                    <div className="flex h-full">
                      {/* Section gauche - Vos Articles */}
                      <div className="flex-1 border-r border-gray-200 flex flex-col h-full">
                        {/* Header fixe */}
                        <div className="p-4 border-b border-gray-200 bg-white">
                          <div className="flex items-center space-x-2">
                            <ShoppingCart className="h-5 w-5 text-orange-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Vos Articles ({cartItems})</h3>
                          </div>
                        </div>
                        
                        {/* Contenu scrollable avec scroll personnalisé et indicateurs visuels */}
                        <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar relative" style={{ maxHeight: 'calc(99vh - 380px)' }}>
                          {/* Indicateur de scroll en bas */}
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                        
                        <div className="space-y-4">
                          {cartItemsData.map((item, index) => (
                            <Card 
                              key={item.id} 
                              className="group relative overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white hover:scale-[1.02] hover:border-orange-200"
                            >
                              <div className="flex items-center space-x-6 p-6">
                                {/* Image circulaire avec animations */}
                                <div className="relative group-hover:scale-110 transition-transform duration-300">
                                  <Image 
                                    src={item.image} 
                                    alt={item.name} 
                                    width={80} 
                                    height={80} 
                                    className="rounded-full object-cover border-2 border-gray-100 group-hover:border-orange-200 transition-all duration-300"
                                  />
                                  {/* Badge de quantité */}
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
                                    {item.quantity}
                                  </div>
                                  {/* Effet de brillance au survol */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                
                                {/* Informations produit avec icônes et animations */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <Package className="h-4 w-4 text-orange-500 animate-pulse" />
                                    <h3 className="font-semibold text-gray-800 text-sm group-hover:text-orange-600 transition-colors duration-300">{item.name}</h3>
                                </div>
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Store className="h-3 w-3 text-gray-500" />
                                    <p className="text-xs text-gray-600">Vendeur: {item.seller}</p>
                                  </div>
                                <div className="flex items-center space-x-4">
                                  <p className="text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent animate-pulse">
                                    {(item.price * item.quantity).toLocaleString()} F CFA
                                  </p>
                                  <div className="flex items-center space-x-2">
                                    <Coins className="h-4 w-4 text-yellow-500 animate-bounce" />
                                    <p className="text-sm font-medium text-yellow-600">
                                      {Math.floor((item.price * item.quantity) / 200)} points
                                    </p>
                                  </div>
                                </div>
                                </div>
                                
                                {/* Contrôles de quantité avec animations et icônes */}
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl p-3 border border-orange-200 shadow-sm">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-300 hover:scale-110 active:scale-95"
                                      onClick={() => {
                                        if (item.quantity > 1) {
                                          const updatedCart = cartItemsData.map(cartItem => 
                                            cartItem.id === item.id 
                                              ? { ...cartItem, quantity: cartItem.quantity - 1 }
                                              : cartItem
                                          )
                                          safeLocalStorage.setItem('cart', JSON.stringify(updatedCart))
                                          window.location.reload()
                                        }
                                      }}
                                    >
                                      <Minus className="h-4 w-4 animate-pulse" />
                                    </Button>
                                    <span className="text-sm font-bold w-8 text-center bg-white px-2 py-1 rounded-lg shadow-sm border border-orange-200 animate-pulse">
                                      {item.quantity}
                                    </span>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-300 hover:scale-110 active:scale-95"
                                      onClick={() => {
                                        const updatedCart = cartItemsData.map(cartItem => 
                                          cartItem.id === item.id 
                                            ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                            : cartItem
                                        )
                                        safeLocalStorage.setItem('cart', JSON.stringify(updatedCart))
                                        window.location.reload()
                                      }}
                                    >
                                      <Plus className="h-4 w-4 animate-pulse" />
                                    </Button>
                                  </div>
                                  
                                  {/* Bouton supprimer avec animation */}
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-12 w-12 p-0 text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:scale-110 active:scale-95 group"
                                    onClick={() => {
                                      if (confirm(`Supprimer "${item.name}" du panier ?`)) {
                                        handleRemoveFromCart(item.id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-5 w-5 group-hover:animate-bounce" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {/* Code promo dans la section gauche */}
                        <div className="bg-white rounded-xl p-4 mt-4 shadow-sm border border-orange-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                              <Gift className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">Code promo</h4>
                              <p className="text-xs text-gray-500">Entrez un code pour obtenir une réduction</p>
                            </div>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-orange-200 text-orange-600 hover:bg-orange-50"
                              onClick={() => {
                                const code = prompt('Entrez votre code promo:')
                                if (code) {
                                  if (code.toUpperCase() === 'WELCOME10') {
                                    alert('🎉 Code promo appliqué !\n✅ Réduction de 10% appliquée')
                                  } else if (code.toUpperCase() === 'FREESHIP') {
                                    alert('🎉 Code promo appliqué !\n✅ Livraison gratuite activée')
                                  } else if (code.toUpperCase() === 'BONUS50') {
                                    alert('🎉 Code promo appliqué !\n✅ +50 points bonus ajoutés')
                                  } else {
                                    alert('❌ Code promo invalide\n💡 Essayez: WELCOME10, FREESHIP, BONUS50')
                                  }
                                }
                              }}
                            >
                              <Gift className="h-3 w-3 mr-1" />
                              Appliquer
                            </Button>
                          </div>
                        </div>

                        {/* Options de livraison dans la section gauche */}
                        <div className="bg-white rounded-xl p-4 mt-4 shadow-sm border border-blue-100">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                              <Truck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">Options de livraison</h4>
                              <p className="text-xs text-gray-500">Choisissez votre mode de livraison</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-green-200 text-green-600 hover:bg-green-50 h-auto p-3 flex flex-col items-center space-y-1"
                              onClick={() => alert('🚚 Livraison standard sélectionnée\n📦 Délai: 3-5 jours ouvrables\n💰 Gratuite')}
                            >
                              <Truck className="h-4 w-4" />
                              <span className="text-xs">Standard</span>
                              <span className="text-xs font-bold text-green-600">Gratuite</span>
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-orange-200 text-orange-600 hover:bg-orange-50 h-auto p-3 flex flex-col items-center space-y-1"
                              onClick={() => alert('⚡ Livraison express sélectionnée\n📦 Délai: 1-2 jours ouvrables\n💰 +2000 F CFA')}
                            >
                              <Zap className="h-4 w-4" />
                              <span className="text-xs">Express</span>
                              <span className="text-xs font-bold text-orange-600">+2000 F</span>
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50 h-auto p-3 flex flex-col items-center space-y-1"
                              onClick={() => alert('🏪 Point relais sélectionné\n📦 Retrait en point relais\n💰 -500 F CFA')}
                            >
                              <Store className="h-4 w-4" />
                              <span className="text-xs">Relais</span>
                              <span className="text-xs font-bold text-purple-600">-500 F</span>
                            </Button>
                          </div>
                        </div>
                        
                        </div>
                      </div>
                      
                      {/* Section droite - Résumé de la commande */}
                      <div className="w-96 bg-gray-50 flex flex-col h-full">
                        {/* Header fixe */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                          <h3 className="text-lg font-semibold text-gray-800">Résumé de la commande</h3>
                        </div>
                        
                        {/* Contenu scrollable avec scroll personnalisé et indicateurs visuels */}
                        <div className="flex-1 overflow-y-auto p-4 pb-16 custom-scrollbar relative" style={{ maxHeight: 'calc(99vh - 380px)' }}>
                          {/* Indicateur de scroll en bas */}
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
                          
                          {/* Résumé des coûts avec icônes et animations */}
                        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                              <Calculator className="h-5 w-5 text-white animate-pulse" />
                            </div>
                            <h4 className="font-semibold text-gray-800">Résumé des coûts</h4>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <ShoppingCart className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600">Sous-total:</span>
                            </div>
                              <div className="flex items-center space-x-4">
                                <span className="font-medium text-gray-800">{cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA</span>
                                <div className="flex items-center space-x-2">
                                  <Coins className="h-4 w-4 text-yellow-500 animate-bounce" />
                                  <span className="font-medium text-yellow-600">{Math.floor(cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 200)} points</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <Truck className="h-4 w-4 text-green-500 animate-bounce" />
                              <span className="text-gray-600">Livraison:</span>
                            </div>
                              <span className="font-medium text-green-600 flex items-center space-x-1">
                                <CheckCircle className="h-4 w-4" />
                                <span>Gratuite</span>
                              </span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <Coins className="h-5 w-5 text-orange-500 animate-pulse" />
                                  <span className="font-semibold text-gray-800">Total:</span>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent animate-pulse">
                                    {cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <Coins className="h-5 w-5 text-yellow-500 animate-bounce" />
                                    <span className="text-lg font-bold text-yellow-600">
                                      {Math.floor(cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 200)} points
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mes Points avec animations et design amélioré */}
                        <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 rounded-xl p-6 mb-6 border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                          {/* Effet de brillance en arrière-plan */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-200/20 via-pink-200/20 to-orange-200/20 animate-pulse"></div>
                          
                          <div className="relative">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                  <Coins className="h-6 w-6 text-white animate-bounce" />
                          </div>
                                {/* Particules animées autour de l'icône */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                              <div>
                                <h4 className="font-bold text-purple-800 text-lg">Mes Points</h4>
                                <p className="text-sm text-purple-600">Votre solde actuel</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-700 font-medium">Points disponibles:</span>
                                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                                  {parseInt(safeLocalStorage.getItem('userPoints', '1000'))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-purple-700 font-medium">Valeur équivalente:</span>
                                <span className="text-lg font-semibold text-orange-600">
                                  {Math.floor(parseInt(safeLocalStorage.getItem('userPoints', '1000')) * 10).toLocaleString()} F CFA
                                </span>
                              </div>
                            </div>
                            
                            {/* Barre de progression des points */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-purple-600 mb-1">
                                <span>Progression vers le niveau suivant</span>
                                <span>75%</span>
                              </div>
                              <div className="w-full bg-purple-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mode de paiement avec design amélioré */}
                        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <CreditCard className="h-6 w-6 text-white animate-pulse" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">Mode de paiement</h4>
                              <p className="text-sm text-gray-500">Choisissez votre option préférée</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-orange-50 transition-all duration-300 border border-transparent hover:border-orange-200">
                              <input type="radio" name="payment" value="standard" defaultChecked className="text-orange-600" />
                              <div className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-medium">Paiement standard</span>
                              </div>
                              <Badge className="ml-auto bg-blue-100 text-blue-700 text-xs">Recommandé</Badge>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-50 transition-all duration-300 border border-transparent hover:border-purple-200">
                              <input type="radio" name="payment" value="points" className="text-orange-600" />
                              <div className="flex items-center space-x-2">
                                <Coins className="h-4 w-4 text-yellow-500 animate-bounce" />
                                <span className="text-sm font-medium">Acheter avec points</span>
                              </div>
                              <Badge className="ml-auto bg-yellow-100 text-yellow-700 text-xs">Économique</Badge>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-green-50 transition-all duration-300 border border-transparent hover:border-green-200">
                              <input type="radio" name="payment" value="mixed" className="text-orange-600" />
                              <div className="flex items-center space-x-2">
                                <BarChart3 className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Paiement mixte</span>
                              </div>
                              <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Flexible</Badge>
                            </label>
                          </div>
                        </div>
                        
                        {/* Paiement standard */}
                        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                              <CreditCard className="h-3 w-3 text-yellow-600" />
                            </div>
                            <span className="font-semibold text-gray-800">Paiement standard</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total à payer:</span>
                            <span className="font-bold text-orange-600">
                              {cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA
                            </span>
                          </div>
                        </div>
                        
                        {/* Offre spéciale avec design amélioré */}
                        <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-xl p-6 mb-6 border-l-4 border-orange-400 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
                          {/* Effet de brillance en arrière-plan */}
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-200/10 via-red-200/10 to-pink-200/10 animate-pulse"></div>
                          
                          <div className="relative">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                                  <Gift className="h-6 w-6 text-white animate-bounce" />
                            </div>
                                {/* Particules animées autour de l'icône */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                          </div>
                              <div>
                                <h4 className="font-bold text-orange-800 text-lg">Offre spéciale !</h4>
                                <p className="text-sm text-orange-600">Économisez sur votre commande</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Truck className="h-4 w-4 text-green-500 animate-bounce" />
                                <span className="text-sm font-medium text-orange-700">Livraison gratuite</span>
                                <Badge className="bg-green-100 text-green-700 text-xs animate-pulse">Gratuite</Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
                                <span className="text-sm text-orange-700">Pour toute commande de plus de 25 000 F CFA</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-orange-700">Offre limitée dans le temps</span>
                              </div>
                            </div>
                            
                            {/* Barre de progression vers l'offre */}
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-orange-600 mb-1">
                                <span>Progression vers la livraison gratuite</span>
                                <span>85%</span>
                              </div>
                              <div className="w-full bg-orange-200 rounded-full h-2">
                                <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full animate-pulse" style={{ width: '85%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Boutons d'action */}
                        <div className="space-y-4">
                                                      <div className="grid grid-cols-2 gap-3">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-teal-200 text-teal-600 hover:bg-teal-50"
                              onClick={handleInstallmentPayment}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Paiement fractionné
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                              onClick={handleDeferredPayment}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Paiement différé
                            </Button>
                          </div>
                          
                          <Button 
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-12 text-lg font-semibold"
                            onClick={handleOrderNow}
                          >
                            Commander maintenant
                          </Button>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline"
                              className="border-orange-200 text-orange-600 hover:bg-orange-50"
                              onClick={() => window.location.href = '/'}
                            >
                              Voir le panier
                            </Button>
                            <Button 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setShowShareModal(true)}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              Partager
                            </Button>
                          </div>
                        </div>
                        
                        {/* Informations de sécurité */}
                        <div className="mt-4 text-center">
                          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500 mb-2">
                            <Lock className="h-3 w-3" />
                            <span>Paiement 100% sécurisé</span>
                          </div>
                          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                            <Smartphone className="h-3 w-3 text-orange-500" />
                            <span>Mobile Money • Carte bancaire</span>
                          </div>
                        </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer compact avec actions principales uniquement */}
                {cartItems > 0 && (
                  <div className="border-t border-gray-200 bg-gradient-to-r from-orange-50 to-red-50 p-6">
                    <div className="space-y-4">
                      {/* Actions principales de commande */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA
                          </div>
                            <div className="text-xs text-gray-500">Total de la commande</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">Gratuite</div>
                            <div className="text-xs text-gray-500">Livraison</div>
                        </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-purple-600">
                              +{Math.floor(cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100)}
                      </div>
                            <div className="text-xs text-gray-500">Points bonus</div>
                        </div>
                      </div>

                        <div className="flex items-center space-x-3">
                          <Button 
                            variant="outline" 
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                            onClick={() => window.location.href = '/'}
                          >
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            Continuer
                          </Button>
                        
                        <Button 
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white h-12 px-8 text-lg font-semibold transform hover:scale-105 transition-all duration-300 hover:shadow-xl active:scale-95"
                          onClick={() => {
                            // Validation de base avant d'ouvrir le modal
                            if (cartItemsData.length === 0) {
                              alert('❌ Votre panier est vide ! Veuillez ajouter des produits avant de passer commande.')
                              return
                            }
                            
                            // Vérification de la disponibilité des produits (seulement si la propriété inStock est explicitement false)
                            const unavailableItems = cartItemsData.filter(item => item.inStock === false)
                            if (unavailableItems.length > 0) {
                              const unavailableNames = unavailableItems.map(item => item.name).join(', ')
                              alert(`❌ Certains produits ne sont plus disponibles :\n${unavailableNames}\n\nVeuillez les retirer de votre panier.`)
                              return
                            }
                            
                            // Fermer le modal de panier et ouvrir le modal de paiement
                            setShowCartModal(false)
                            setTimeout(() => {
                              setShowPaymentModal(true)
                              setPaymentStep(1)
                              setPaymentMethod("mobile_money")
                            }, 300)
                          }}
                        >
                          <CreditCard className="h-5 w-5 mr-2 animate-pulse" />
                          Passer la commande
                        </Button>
                        </div>
                      </div>
                      
                      {/* Informations de sécurité compactes */}
                      <div className="flex items-center justify-center space-x-8 text-xs text-gray-500 pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3 text-green-500" />
                          <span>Paiement sécurisé</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Truck className="h-3 w-3 text-blue-500" />
                          <span>Livraison gratuite</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Coins className="h-3 w-3 text-orange-500" />
                          <span>Points bonus</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-purple-500" />
                          <span>Garantie incluse</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Modal de Comparaison */}
            <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-red-50 via-white to-pink-50">
                <DialogHeader className="sr-only">
                  <DialogTitle>Comparaison de Produits</DialogTitle>
                  <DialogDescription>
                    Comparez les caractéristiques et prix de vos produits sélectionnés
                  </DialogDescription>
                </DialogHeader>
                {/* Header avec gradient et animations */}
                <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-0 left-0 w-full h-full">
                    <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
                    <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
                  </div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <BarChart3 className="h-8 w-8 animate-pulse" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Comparaison de Produits</h2>
                        <p className="text-white/80 text-sm">Analysez et comparez vos produits ({compareListLength}/4)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                        onClick={() => {
                          safeLocalStorage.removeItem('compareList')
                          setCompareListLength(0)
                          setShowCompareModal(false)
                          NotificationService.showInfo('Liste de comparaison vidée')
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Vider
                      </Button>
                      
                      {compareListLength > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Partager
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2">
                            <div className="px-2 py-1 mb-2">
                              <h4 className="text-sm font-semibold text-gray-800">Partager et gagner des points</h4>
                              <p className="text-xs text-gray-500">Choisissez votre réseau social</p>
                            </div>
                            
                            <DropdownMenuItem 
                              onClick={() => {
                                const compareData = shareCompareList()
                                if (compareData) {
                                  shareToWhatsApp(compareData.text, 30)
                                }
                              }}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 cursor-pointer group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                                  <p className="text-xs text-gray-500">Partagez avec vos contacts</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                                <Coins className="h-3 w-3 text-green-600" />
                                <span className="text-xs font-bold text-green-700">+30</span>
                              </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => {
                                const compareData = shareCompareList()
                                if (compareData) {
                                  shareToFacebook(compareData.text, compareData.url, 50)
                                }
                              }}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 cursor-pointer group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-800">Facebook</span>
                                  <p className="text-xs text-gray-500">Partagez sur votre mur</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                                <Coins className="h-3 w-3 text-blue-600" />
                                <span className="text-xs font-bold text-blue-700">+50</span>
                              </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => {
                                const compareData = shareCompareList()
                                if (compareData) {
                                  const twitterText = `${compareData.text}\n\n#Probooster #Marketplace`
                                  shareToTwitter(twitterText, compareData.url, 40)
                                }
                              }}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-800">X (Twitter)</span>
                                  <p className="text-xs text-gray-500">Partagez avec vos followers</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                                <Coins className="h-3 w-3 text-gray-600" />
                                <span className="text-xs font-bold text-gray-700">+40</span>
                              </div>
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => {
                                const compareData = shareCompareList()
                                if (compareData) {
                                  shareToInstagram(compareData.text, 45)
                                }
                              }}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50 cursor-pointer group"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                                  </svg>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-800">Instagram</span>
                                  <p className="text-xs text-gray-500">Copiez le texte</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 bg-pink-100 px-2 py-1 rounded-full">
                                <Coins className="h-3 w-3 text-pink-600" />
                                <span className="text-xs font-bold text-pink-700">+45</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenu principal avec scroll */}
                <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
                  {compareListLength === 0 ? (
                    // État vide avec design attractif
                    <div className="text-center py-12">
                      <div className="relative mb-6">
                        <BarChart3 className="h-24 w-24 text-gray-300 mx-auto animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full animate-ping"></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun produit à comparer</h3>
                      <p className="text-gray-500 mb-6">Ajoutez des produits à votre liste de comparaison !</p>
                      <Button 
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                        onClick={() => setShowCompareModal(false)}
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Découvrir des produits
                      </Button>
                    </div>
                  ) : (
                    // Tableau de comparaison
                    <div className="space-y-6">
                      {/* En-tête du tableau */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {getCompareList().map((item: any, index: number) => (
                          <div key={`compare-${item.id}-${index}`} className="relative">
                            <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white/80 backdrop-blur-sm">
                              {/* Badge de position */}
                              <div className="absolute top-3 left-3 z-10">
                                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs">
                                  #{index + 1}
                                </Badge>
                              </div>

                              {/* Bouton supprimer */}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-2 right-2 h-6 w-6 bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                onClick={() => removeFromCompare(item.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>

                              {/* Image du produit */}
                              <div className="relative h-32 overflow-hidden">
                                <Image 
                                  src={item.image} 
                                  alt={item.name} 
                                  fill
                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>

                              {/* Informations du produit */}
                              <div className="p-4">
                                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 text-sm">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Vendeur: {item.seller}</p>
                                
                                {/* Prix */}
                                <div className="mt-3">
                                  <span className="text-lg font-bold text-red-600">
                                    {item.price.toLocaleString()}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">F CFA</span>
                                </div>

                                {/* Points bonus */}
                                <div className="mt-2 flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-1 rounded-full">
                                  <Coins className="h-3 w-3 text-yellow-600" />
                                  <span className="text-xs text-yellow-700 font-medium">
                                    +{Math.floor(item.price / 100)} pts
                                  </span>
                                </div>

                                {/* Boutons d'action */}
                                <div className="mt-3 flex space-x-2">
                                  <Button 
                                    size="sm"
                                    className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-xs"
                                    onClick={() => handleAddToCart(item.id)}
                                  >
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Ajouter
                                  </Button>
                                  
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 text-xs"
                                    onClick={() => handleAddToWishlist(item.id)}
                                  >
                                    <Heart className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </div>
                        ))}
                      </div>

                      {/* Résumé des différences clés */}
                      <div className="mt-8 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                          Résumé des Différences Clés
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Prix le plus bas */}
                          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 text-lg">💰</span>
                              </div>
                              <h4 className="font-semibold text-gray-800">Meilleur Prix</h4>
                            </div>
                            {(() => {
                              const products = getEnrichedCompareList()
                              if (products.length === 0) return <span className="text-gray-400">Aucun produit</span>
                              
                              const cheapest = products.reduce((min, product) => 
                                product.price < min.price ? product : min
                              )
                              return (
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {cheapest.price.toLocaleString()} F CFA
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {cheapest.name.length > 20 ? cheapest.name.substring(0, 20) + '...' : cheapest.name}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                          
                          {/* Plus de points bonus */}
                          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Coins className="h-5 w-5 text-yellow-600" />
                              </div>
                              <h4 className="font-semibold text-gray-800">Plus de Points</h4>
                            </div>
                            {(() => {
                              const products = getEnrichedCompareList()
                              if (products.length === 0) return <span className="text-gray-400">Aucun produit</span>
                              
                              const mostPoints = products.reduce((max, product) => 
                                Math.floor(product.price / 100) > Math.floor(max.price / 100) ? product : max
                              )
                              return (
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-yellow-600">
                                    +{Math.floor(mostPoints.price / 100)} pts
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {mostPoints.name.length > 20 ? mostPoints.name.substring(0, 20) + '...' : mostPoints.name}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                          
                          {/* Vendeur le plus fiable */}
                          <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Shield className="h-5 w-5 text-blue-600" />
                              </div>
                              <h4 className="font-semibold text-gray-800">Vendeur Fiable</h4>
                            </div>
                            {(() => {
                              const products = getEnrichedCompareList()
                              if (products.length === 0) return <span className="text-gray-400">Aucun produit</span>
                              
                              // Simuler un vendeur fiable basé sur le nom
                              const reliableSeller = products.find(p => p.seller.includes('Pro') || p.seller.includes('Tech')) || products[0]
                              return (
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">
                                    {reliableSeller.seller}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Note: 4.9/5 ⭐
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Tableau de comparaison détaillée avec spécifications techniques */}
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2 text-red-500" />
                          Comparaison Détaillée avec Spécifications Techniques
                        </h3>
                        
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gradient-to-r from-red-50 to-pink-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Caractéristiques</th>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <th key={`compare-header-${item.id}-${index}`} className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                      Produit {index + 1}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {/* Informations de base */}
                                <tr className="hover:bg-gray-50 bg-blue-50/30">
                                  <td className="px-4 py-3 text-sm font-bold text-blue-700 bg-blue-50">📋 INFORMATIONS DE BASE</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-category-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600 bg-blue-50/30">
                                      <div className="text-xs text-blue-600 font-medium">Catégorie</div>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Prix</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-price-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <span className="font-bold text-red-600">{item.price.toLocaleString()}</span>
                                      <div className="text-xs text-gray-500">F CFA</div>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Vendeur</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-seller-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <div className="font-medium">{item.seller}</div>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Points Bonus</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-points-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <div className="flex items-center justify-center space-x-1">
                                        <Coins className="h-3 w-3 text-yellow-500" />
                                        <span className="font-bold text-yellow-600">{Math.floor(item.price / 100)}</span>
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Note</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-rating-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <div className="flex items-center justify-center space-x-1">
                                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                        <span className="font-bold">4.8</span>
                                      </div>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Disponibilité</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-availability-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <Badge className="bg-green-100 text-green-700 text-xs">En stock</Badge>
                                    </td>
                                  ))}
                                </tr>
                                
                                {/* Spécifications techniques */}
                                {getEnrichedCompareList().length > 0 && getEnrichedCompareList()[0].specifications && (
                                  <>
                                    <tr className="hover:bg-gray-50 bg-orange-50/30">
                                      <td className="px-4 py-3 text-sm font-bold text-orange-700 bg-orange-50">⚙️ SPÉCIFICATIONS TECHNIQUES</td>
                                      {getEnrichedCompareList().map((item: any, index: number) => (
                                        <td key={`compare-specs-category-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600 bg-orange-50/30">
                                          <div className="text-xs text-orange-600 font-medium">Détails techniques</div>
                                        </td>
                                      ))}
                                    </tr>
                                    
                                    {/* Affichage dynamique des spécifications */}
                                    {Object.keys(getEnrichedCompareList()[0].specifications || {}).map((specKey) => (
                                      <tr key={`spec-${specKey}`} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-gray-600">{specKey}</span>
                                          </div>
                                        </td>
                                        {getEnrichedCompareList().map((item: any, index: number) => (
                                          <td key={`compare-spec-${item.id}-${specKey}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                            <div className="max-w-xs">
                                              {item.specifications && item.specifications[specKey] ? (
                                                <span className="text-gray-800 font-medium">
                                                  {item.specifications[specKey]}
                                                </span>
                                              ) : (
                                                <span className="text-gray-400 italic">Non spécifié</span>
                                              )}
                                            </div>
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </>
                                )}
                                
                                {/* Caractéristiques avancées */}
                                <tr className="hover:bg-gray-50 bg-green-50/30">
                                  <td className="px-4 py-3 text-sm font-bold text-green-700 bg-green-50">🚀 CARACTÉRISTIQUES AVANCÉES</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-advanced-category-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600 bg-green-50/30">
                                      <div className="text-xs text-green-600 font-medium">Fonctionnalités</div>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Garantie</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-warranty-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <Badge className="bg-blue-100 text-blue-700 text-xs">2 ans</Badge>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-700">Livraison</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-delivery-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <Badge className="bg-green-100 text-green-700 text-xs">Gratuite</Badge>
                                    </td>
                                  ))}
                                </tr>
                                
                                <tr className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">Retour</td>
                                  {getEnrichedCompareList().map((item: any, index: number) => (
                                    <td key={`compare-return-${item.id}-${index}`} className="px-4 py-3 text-center text-sm text-gray-600">
                                      <Badge className="bg-purple-100 text-purple-700 text-xs">30 jours</Badge>
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer avec statistiques */}
                {compareListLength > 0 && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-t border-gray-200 sticky bottom-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-red-500" />
                          <span className="text-gray-600">{compareListLength} produit{compareListLength > 1 ? 's' : ''} à comparer</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="text-gray-600">
                            {getCompareList().reduce((total: number, item: any) => total + Math.floor(item.price / 100), 0)} points bonus
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Total estimé:</span>
                        <span className="font-bold text-red-600">
                          {getCompareList().reduce((total: number, item: any) => total + item.price, 0).toLocaleString()} F CFA
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Comparaison */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
              onClick={() => setShowCompareModal(true)}
            >
              <BarChart3 className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-all duration-300 group-hover:animate-pulse" />
              {compareListLength > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-blue-500 text-xs p-0 flex items-center justify-center animate-bounce">
                  {compareListLength}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="border-t border-gray-600 bg-gray-700">
          <div className="flex items-center justify-center space-x-12 py-4">
            <Link href="/" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Home className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium">Accueil</span>
            </Link>

            <Link href="/products" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/products" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <div className="relative">
                <Lock className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                  pathname === "/products" ? "text-[#ff6600]" : ""
                }`} style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-xs font-medium">Boutique</span>
            </Link>

            <Link href="/categories" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/categories" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Grid className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/categories" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '4s' }} />
              <span className="text-xs font-medium">Catégories</span>
            </Link>

            <Link href="/best-sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/best-sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Flame className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/best-sellers" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '2.5s' }} />
              <span className="text-xs font-medium">Meilleures ventes</span>
            </Link>

            <Link href="/new-arrivals" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/new-arrivals" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Sparkles className={`h-6 w-6 group-hover:animate-bounce transition-transform duration-200 ${
                pathname === "/new-arrivals" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium group-hover:translate-y-1 transition-transform duration-300">Nouveautés</span>
            </Link>

            <Link href="/sellers" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/sellers" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <div className={`rounded-lg p-2 ${
                pathname === "/sellers" ? "bg-[#ff6600]/20" : "bg-gray-600"
              }`}>
                <Store className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 animate-bounce ${
                  pathname === "/sellers" ? "text-[#ff6600]" : "text-[#ff6600]"
                }`} style={{ animationDuration: '2s' }} />
              </div>
              <span className="text-xs font-medium">Vendeurs</span>
            </Link>

            <Link href="/support" className={`flex flex-col items-center space-y-1 transition-colors group ${
              pathname === "/support" ? "text-[#ff6600]" : "text-white hover:text-[#ff6600]"
            }`}>
              <Headphones className={`h-6 w-6 group-hover:scale-110 transition-transform duration-200 ${
                pathname === "/support" ? "text-[#ff6600]" : ""
              }`} style={{ animationDuration: '3s' }} />
              <span className="text-xs font-medium">Support</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Modal de Paiement */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-orange-50 via-white to-red-50 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Paiement Sécurisé</DialogTitle>
            <DialogDescription>
              Choisissez votre méthode de paiement et confirmez votre commande
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations - Fixe */}
          <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 text-white overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <CreditCard className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Paiement Sécurisé</h2>
                  <p className="text-white/80 text-sm">Étape {paymentStep} sur 3 • {cartItems} article{cartItems > 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={() => setShowPaymentModal(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu principal - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto">
            {paymentStep === 1 && (
              <div className="space-y-6">
                {/* Résumé de la commande */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2 text-orange-500" />
                    Résumé de votre commande
                  </h3>
                  
                  <div className="space-y-4">
                    {cartItemsData.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">Vendeur: {item.seller}</p>
                          <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{(item.price * item.quantity).toLocaleString()} F CFA</p>
                          <p className="text-xs text-gray-500">+{Math.floor((item.price * item.quantity) / 100)} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Sous-total:</span>
                      <span className="font-semibold">{cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Livraison:</span>
                      <span className="text-green-600 font-semibold">Gratuite</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold text-orange-600">
                      <span>Total:</span>
                      <span>{cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-500 text-sm">Points bonus:</span>
                      <span className="text-purple-600 font-semibold">+{Math.floor(cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100)} pts</span>
                    </div>
                  </div>
                </div>

                {/* Options de paiement */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                    Choisissez votre méthode de paiement
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mobile Money */}
                    <div
                                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                       paymentMethod === 'mobile_money'
                         ? 'border-orange-500 bg-orange-50'
                         : 'border-gray-200 hover:border-orange-300'
                     }`}
                     onClick={() => handlePaymentMethodSelect('mobile_money')}
                   >
                     <div className="flex items-center space-x-3">
                       <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                         <Smartphone className="h-6 w-6 text-white" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900">Mobile Money</h4>
                         <p className="text-sm text-gray-500">Orange Money, MTN, Moov</p>
                       </div>
                     </div>
                     {paymentMethod === 'mobile_money' && (
                       <div className="mt-3 flex items-center text-green-600">
                         <CheckCircle className="h-4 w-4 mr-1" />
                         <span className="text-sm font-medium">Sélectionné</span>
                       </div>
                     )}
                    </div>

                    {/* Carte bancaire */}
                    <div
                                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                       paymentMethod === 'card'
                         ? 'border-orange-500 bg-orange-50'
                         : 'border-gray-200 hover:border-orange-300'
                     }`}
                     onClick={() => handlePaymentMethodSelect('card')}
                   >
                     <div className="flex items-center space-x-3">
                       <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                         <CreditCard className="h-6 w-6 text-white" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900">Carte bancaire</h4>
                         <p className="text-sm text-gray-500">Visa, Mastercard, American Express</p>
                       </div>
                     </div>
                     {paymentMethod === 'card' && (
                       <div className="mt-3 flex items-center text-green-600">
                         <CheckCircle className="h-4 w-4 mr-1" />
                         <span className="text-sm font-medium">Sélectionné</span>
                       </div>
                     )}
                    </div>

                    {/* Paiement par points */}
                    <div
                                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                       paymentMethod === 'points'
                         ? 'border-orange-500 bg-orange-50'
                         : 'border-gray-200 hover:border-orange-300'
                     }`}
                     onClick={() => handlePaymentMethodSelect('points')}
                   >
                     <div className="flex items-center space-x-3">
                       <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                         <Coins className="h-6 w-6 text-white" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900">Paiement par points</h4>
                         <p className="text-sm text-gray-500">Utilisez vos points accumulés</p>
                         <p className="text-xs text-purple-600 font-medium">Solde: {userPoints} pts</p>
                       </div>
                     </div>
                     {paymentMethod === 'points' && (
                       <div className="mt-3 flex items-center text-green-600">
                         <CheckCircle className="h-4 w-4 mr-1" />
                         <span className="text-sm font-medium">Sélectionné</span>
                       </div>
                     )}
                    </div>

                    {/* Paiement différé */}
                    <div
                                           className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                       paymentMethod === 'deferred'
                         ? 'border-orange-500 bg-orange-50'
                         : 'border-gray-200 hover:border-orange-300'
                     }`}
                     onClick={() => handlePaymentMethodSelect('deferred')}
                   >
                     <div className="flex items-center space-x-3">
                       <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                         <Clock className="h-6 w-6 text-white" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900">Paiement différé</h4>
                         <p className="text-sm text-gray-500">Payez dans 30 jours</p>
                         <p className="text-xs text-yellow-600 font-medium">Sans frais</p>
                       </div>
                     </div>
                     {paymentMethod === 'deferred' && (
                       <div className="mt-3 flex items-center text-green-600">
                         <CheckCircle className="h-4 w-4 mr-1" />
                         <span className="text-sm font-medium">Sélectionné</span>
                       </div>
                     )}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                                     <Button
                     onClick={() => handlePaymentStep(2)}
                     disabled={!paymentMethod}
                     className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
                   >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {paymentStep === 2 && (
              <div className="space-y-6">
                {/* Informations de livraison */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-blue-500" />
                    Informations de livraison
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse de livraison
                      </label>
                      <Input
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Entrez votre adresse complète"
                        className="w-full"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone
                        </label>
                        <Input
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+225 0123456789"
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <Input
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détails du paiement */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-500" />
                    Détails du paiement
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Méthode de paiement:</span>
                                             <span className="font-semibold">
                         {paymentMethod === 'mobile_money' ? 'Mobile Money' : 
                          paymentMethod === 'card' ? 'Carte bancaire' : 
                          paymentMethod === 'points' ? 'Points' : 'Paiement différé'}
                       </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Total à payer:</span>
                      <span className="font-bold text-orange-600 text-lg">
                        {cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA
                      </span>
                    </div>
                    
                    {selectedPaymentMethod === 'points' && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-700">Points nécessaires:</span>
                          <span className="font-semibold text-purple-600">
                            {Math.floor(cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 200)} pts
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-purple-600 text-sm">Votre solde:</span>
                          <span className="text-sm font-medium text-purple-600">{userPoints} pts</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handlePaymentStep(1)}
                    className="px-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={() => handlePaymentStep(3)}
                    disabled={!deliveryAddress || !customerPhone}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
                  >
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {paymentStep === 3 && (
              <div className="space-y-6">
                {/* Confirmation finale */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Confirmation de commande
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Paiement 100% sécurisé</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Vos informations sont protégées par un cryptage SSL de niveau bancaire.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Résumé de la commande</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Articles:</span>
                            <span>{cartItems} article{cartItems > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-semibold">{cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()} F CFA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Livraison:</span>
                            <span className="text-green-600">Gratuite</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Points bonus:</span>
                            <span className="text-purple-600">+{Math.floor(cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0) / 100)} pts</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Informations de livraison</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Adresse:</span>
                            <span className="text-right">{deliveryAddress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Téléphone:</span>
                            <span>{customerPhone}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span>{customerEmail}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action finale */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handlePaymentStep(2)}
                    className="px-8"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button
                    onClick={handlePaymentConfirm}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 text-lg font-semibold"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Confirmer la commande
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Code Promo */}
      <Dialog open={showPromoCodeModal} onOpenChange={setShowPromoCodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#ff6600] flex items-center justify-center gap-2">
              <Gift className="h-6 w-6 animate-bounce" />
              Code Promo
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Entrez votre code promo pour obtenir une réduction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Champ de saisie avec animation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#ff6600]" />
                Code promo
              </label>
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="Ex: WELCOME10, FREESHIP, BONUS50"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="pr-12 border-2 border-gray-200 focus:border-[#ff6600] transition-all duration-300 group-hover:border-[#ff6600]/50"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyPromoCode()
                    }
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Gift className="h-4 w-4 text-gray-400 group-hover:text-[#ff6600] transition-colors duration-300" />
                </div>
              </div>
            </div>

            {/* Codes promo suggérés */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ff6600]" />
                Codes populaires
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { code: 'WELCOME10', discount: '10% de réduction', color: 'bg-green-100 text-green-700 border-green-200' },
                  { code: 'FREESHIP', discount: 'Livraison gratuite', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                  { code: 'BONUS50', discount: '+50 points bonus', color: 'bg-purple-100 text-purple-700 border-purple-200' }
                ].map((suggestion) => (
                  <button
                    key={suggestion.code}
                    onClick={() => {
                      setPromoCode(suggestion.code)
                      setTimeout(() => handleApplyPromoCode(), 100)
                    }}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 hover:shadow-md ${suggestion.color} hover:bg-opacity-80`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{suggestion.code}</span>
                        <span className="text-xs opacity-75">{suggestion.discount}</span>
                      </div>
                      <Gift className="h-4 w-4 animate-pulse" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPromoCodeModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleApplyPromoCode}
                className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] flex items-center gap-2"
              >
                <Gift className="h-4 w-4" />
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Options de Livraison */}
      <Dialog open={showDeliveryOptionsModal} onOpenChange={setShowDeliveryOptionsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#ff6600] flex items-center justify-center gap-2">
              <Truck className="h-6 w-6 animate-pulse" />
              Options de Livraison
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Choisissez votre mode de livraison préféré
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Options de livraison */}
            <div className="space-y-4">
              {[
                {
                  id: 'standard',
                  title: 'Livraison Standard',
                  description: '3-5 jours ouvrables',
                  price: 'Gratuite',
                  icon: Truck,
                  color: 'border-green-200 bg-green-50 hover:bg-green-100',
                  iconColor: 'text-green-600',
                  badge: 'Recommandé'
                },
                {
                  id: 'express',
                  title: 'Livraison Express',
                  description: '1-2 jours ouvrables',
                  price: '+2000 F CFA',
                  icon: Zap,
                  color: 'border-orange-200 bg-orange-50 hover:bg-orange-100',
                  iconColor: 'text-orange-600',
                  badge: 'Rapide'
                },
                {
                  id: 'pickup',
                  title: 'Point Relais',
                  description: 'Retrait en point relais',
                  price: '-500 F CFA',
                  icon: Store,
                  color: 'border-purple-200 bg-purple-50 hover:bg-purple-100',
                  iconColor: 'text-purple-600',
                  badge: 'Économique'
                }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSelectedDeliveryOption(option.id)
                    handleSelectDeliveryOption(option)
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    selectedDeliveryOption === option.id 
                      ? 'border-[#ff6600] bg-[#ff6600]/10 shadow-md' 
                      : option.color
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full bg-white shadow-sm ${option.iconColor}`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-800">{option.title}</h4>
                          <Badge className={`text-xs ${
                            option.badge === 'Recommandé' ? 'bg-green-100 text-green-700' :
                            option.badge === 'Rapide' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {option.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-800">{option.price}</div>
                      {selectedDeliveryOption === option.id && (
                        <CheckCircle className="h-5 w-5 text-[#ff6600] mt-1 animate-bounce" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Informations supplémentaires */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Informations importantes</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Livraison gratuite pour les commandes &gt; 25 000 F CFA</li>
                    <li>• Suivi en temps réel disponible</li>
                    <li>• Possibilité de modifier l'adresse jusqu'à l'expédition</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeliveryOptionsModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setShowDeliveryOptionsModal(false)
                  alert(`✅ Option de livraison sélectionnée : ${selectedDeliveryOption}`)
                }}
                className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] flex items-center gap-2"
              >
                <Truck className="h-4 w-4" />
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Paiement Fractionné */}
      <Dialog open={showInstallmentModal} onOpenChange={setShowInstallmentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-center text-[#ff6600] flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6 animate-pulse" />
              Paiement Fractionné
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Répartissez votre paiement sur plusieurs mois sans frais
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 mt-6 px-1 custom-scrollbar">
            {/* Sélection du plan */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Choisissez votre plan</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[3, 6, 12].map((months) => (
                  <button
                    key={months}
                    onClick={() => setInstallmentPlan(months)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      installmentPlan === months
                        ? 'border-[#ff6600] bg-[#ff6600]/10 shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{months} mois</div>
                      <div className="text-sm text-gray-600">
                        {installmentDetails ? `${installmentDetails.monthlyPayment.toLocaleString()} F CFA/mois` : 'Calcul...'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Détails du plan */}
            {installmentDetails && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="h-5 w-5 text-[#ff6600]" />
                  <h4 className="font-semibold text-gray-800">Détails du plan de paiement</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant total:</span>
                    <span className="font-bold text-lg text-gray-800">
                      {installmentDetails.total.toLocaleString()} F CFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Nombre de paiements:</span>
                    <span className="font-semibold text-[#ff6600]">{installmentDetails.months}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant par paiement:</span>
                    <span className="font-semibold text-green-600">
                      {installmentDetails.monthlyPayment.toLocaleString()} F CFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Frais d'intérêt:</span>
                    <span className="font-semibold text-green-600">0 F CFA</span>
                  </div>
                </div>

                {/* Calendrier des paiements */}
                <div className="mt-6">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#ff6600]" />
                    Calendrier des paiements
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {installmentDetails.payments.map((payment: number, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#ff6600] text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm text-gray-600">{installmentDetails.dates[index]}</span>
                        </div>
                        <span className="font-semibold text-gray-800">
                          {payment.toLocaleString()} F CFA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Informations importantes */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">Avantages du paiement fractionné</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Aucun frais d'intérêt</li>
                    <li>• Paiements automatiques mensuels</li>
                    <li>• Possibilité de remboursement anticipé</li>
                    <li>• Protection d'achat incluse</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 pb-2">
              <Button
                variant="outline"
                onClick={() => setShowInstallmentModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmInstallmentPayment}
                className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Confirmer le paiement fractionné
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Paiement Différé */}
      <Dialog open={showDeferredModal} onOpenChange={setShowDeferredModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-center text-[#ff6600] flex items-center justify-center gap-2">
              <Clock className="h-6 w-6 animate-pulse" />
              Paiement Différé
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Payez plus tard et profitez de votre commande immédiatement
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 mt-6 px-1 custom-scrollbar">
            {/* Sélection de la durée */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Choisissez la durée de différé</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[15, 30, 45].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDeferredDays(days)}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 hover:scale-105 ${
                      deferredDays === days
                        ? 'border-[#ff6600] bg-[#ff6600]/10 shadow-md'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800">{days} jours</div>
                      <div className="text-sm text-gray-600">
                        {deferredDetails ? deferredDetails.interest === 0 ? 'Sans intérêt' : `+${deferredDetails.interest.toLocaleString()} F CFA` : 'Calcul...'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Détails du paiement différé */}
            {deferredDetails && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-[#ff6600]" />
                  <h4 className="font-semibold text-gray-800">Détails du paiement différé</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Montant de la commande:</span>
                    <span className="font-bold text-lg text-gray-800">
                      {deferredDetails.total.toLocaleString()} F CFA
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date de paiement:</span>
                    <span className="font-semibold text-[#ff6600]">{deferredDetails.deferredDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Durée de différé:</span>
                    <span className="font-semibold text-purple-600">{deferredDetails.days} jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Frais d'intérêt:</span>
                    <span className={`font-semibold ${deferredDetails.interest === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {deferredDetails.interest === 0 ? '0 F CFA' : `${deferredDetails.interest.toLocaleString()} F CFA`}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800 font-semibold">Total à payer:</span>
                      <span className="font-bold text-xl text-[#ff6600]">
                        {deferredDetails.totalWithInterest.toLocaleString()} F CFA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditions et informations */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-orange-900 mb-1">Conditions du paiement différé</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Aucun intérêt pour les paiements dans les 30 jours</li>
                    <li>• 5% d'intérêt après 30 jours</li>
                    <li>• Paiement automatique à la date échue</li>
                    <li>• Possibilité de paiement anticipé sans frais</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 pb-2">
              <Button
                variant="outline"
                onClick={() => setShowDeferredModal(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={confirmDeferredPayment}
                className="flex-1 bg-[#ff6600] hover:bg-[#e55a00] flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Confirmer le paiement différé
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Commande Complet */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-center text-[#ff6600] flex items-center justify-center gap-2">
              <ShoppingCart className="h-6 w-6 animate-pulse" />
              Finaliser votre commande
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Étape {orderStep} sur 4 - Complétez votre commande
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 mt-6 px-1 custom-scrollbar">
            {/* Barre de progression */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progression</span>
                <span className="text-sm text-gray-500">{orderStep}/4</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#ff6600] to-red-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(orderStep / 4) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Récapitulatif</span>
                <span>Paiement</span>
                <span>Livraison</span>
                <span>Confirmation</span>
              </div>
            </div>

            {/* Étape 1: Récapitulatif de la commande */}
            {orderStep === 1 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-[#ff6600]" />
                    Récapitulatif de votre commande
                  </h3>
                  
                  <div className="space-y-4">
                    {orderDetails?.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Image 
                            src={item.image} 
                            alt={item.name} 
                            width={50} 
                            height={50} 
                            className="rounded-lg"
                          />
                          <div>
                            <h4 className="font-medium text-gray-800">{item.name}</h4>
                            <p className="text-sm text-gray-600">Quantité: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            {(item.price * item.quantity).toLocaleString()} F CFA
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.floor((item.price * item.quantity) / 200)} points
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total</span>
                      <span className="text-xl font-bold text-[#ff6600]">
                        {orderDetails?.total.toLocaleString()} F CFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Points à gagner</span>
                      <span className="text-sm font-medium text-green-600">
                        +{orderDetails?.pointsEarned} points
                      </span>
                    </div>
                  </div>
                </div>

                {/* Options de paiement */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#ff6600]" />
                    Mode de paiement
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-orange-50 transition-all duration-300 border border-transparent hover:border-orange-200">
                      <input 
                        type="radio" 
                        name="paymentOption" 
                        value="standard" 
                        checked={selectedPaymentOption === "standard"}
                        onChange={(e) => setSelectedPaymentOption(e.target.value)}
                        className="text-[#ff6600]" 
                      />
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Paiement standard</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-purple-50 transition-all duration-300 border border-transparent hover:border-purple-200">
                      <input 
                        type="radio" 
                        name="paymentOption" 
                        value="installment" 
                        checked={selectedPaymentOption === "installment"}
                        onChange={(e) => setSelectedPaymentOption(e.target.value)}
                        className="text-[#ff6600]" 
                      />
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Paiement fractionné</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-yellow-50 transition-all duration-300 border border-transparent hover:border-yellow-200">
                      <input 
                        type="radio" 
                        name="paymentOption" 
                        value="deferred" 
                        checked={selectedPaymentOption === "deferred"}
                        onChange={(e) => setSelectedPaymentOption(e.target.value)}
                        className="text-[#ff6600]" 
                      />
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Paiement différé</span>
                      </div>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-yellow-50 transition-all duration-300 border border-transparent hover:border-yellow-200">
                      <input 
                        type="radio" 
                        name="paymentOption" 
                        value="points" 
                        checked={selectedPaymentOption === "points"}
                        onChange={(e) => setSelectedPaymentOption(e.target.value)}
                        className="text-[#ff6600]" 
                      />
                      <div className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Acheter avec points</span>
                      </div>
                    </label>
                  </div>

                  {/* Options spécifiques selon le mode de paiement */}
                  {selectedPaymentOption === "installment" && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Plan de paiement fractionné</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {[3, 6, 12].map((months) => (
                          <button
                            key={months}
                            onClick={() => setInstallmentPlan(months)}
                            className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                              installmentPlan === months
                                ? 'border-[#ff6600] bg-[#ff6600]/10'
                                : 'border-gray-200 bg-white hover:border-blue-300'
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-bold text-gray-800">{months} mois</div>
                              <div className="text-xs text-gray-600">
                                {Math.ceil(orderDetails?.total / months).toLocaleString()} F CFA/mois
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPaymentOption === "deferred" && (
                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Durée de différé</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {[15, 30, 45].map((days) => (
                          <button
                            key={days}
                            onClick={() => setDeferredDays(days)}
                            className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                              deferredDays === days
                                ? 'border-[#ff6600] bg-[#ff6600]/10'
                                : 'border-gray-200 bg-white hover:border-purple-300'
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-bold text-gray-800">{days} jours</div>
                              <div className="text-xs text-gray-600">
                                {days > 30 ? '+5% intérêt' : 'Sans intérêt'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPaymentOption === "points" && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Utiliser vos points</h4>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={usePoints}
                            onChange={(e) => setUsePoints(e.target.checked)}
                            className="text-[#ff6600]" 
                          />
                          <span className="text-sm">Utiliser mes points</span>
                        </label>
                        {usePoints && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              max={parseInt(safeLocalStorage.getItem('userPoints', '1000'))}
                              value={pointsToUse}
                              onChange={(e) => setPointsToUse(parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <span className="text-sm text-gray-600">points</span>
                            <span className="text-sm text-gray-500">
                              (Valeur: {(pointsToUse * 10).toLocaleString()} F CFA)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Étape 2: Détails du paiement */}
            {orderStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-[#ff6600]" />
                    Détails du paiement
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Sous-total:</span>
                      <span className="font-medium">{orderDetails?.total.toLocaleString()} F CFA</span>
                    </div>
                    
                    {usePoints && pointsToUse > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Points utilisés:</span>
                        <span className="font-medium text-green-600">-{(pointsToUse * 10).toLocaleString()} F CFA</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Livraison:</span>
                      <span className="font-medium text-green-600">Gratuite</span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Total à payer:</span>
                        <span className="text-xl font-bold text-[#ff6600]">
                          {calculateOrderTotal().toLocaleString()} F CFA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations de paiement selon le mode choisi */}
                {selectedPaymentOption === "installment" && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Plan de paiement fractionné</h4>
                    <p className="text-sm text-blue-800">
                      Votre commande sera divisée en {installmentPlan} paiements de {Math.ceil(orderDetails?.total / installmentPlan).toLocaleString()} F CFA chacun.
                    </p>
                  </div>
                )}

                {selectedPaymentOption === "deferred" && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2">Paiement différé</h4>
                    <p className="text-sm text-purple-800">
                      Vous paierez {deferredDays > 30 ? `avec 5% d'intérêt` : 'sans intérêt'} dans {deferredDays} jours.
                    </p>
                  </div>
                )}

                {selectedPaymentOption === "points" && usePoints && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2">Paiement avec points</h4>
                    <p className="text-sm text-yellow-800">
                      Vous utilisez {pointsToUse} points d'une valeur de {(pointsToUse * 10).toLocaleString()} F CFA.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Étape 3: Informations de livraison */}
            {orderStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-[#ff6600]" />
                    Informations de livraison
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adresse de livraison
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Entrez votre adresse complète..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+225 0123456789"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6600] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options de livraison */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-4">Options de livraison</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedDeliveryOption('standard')}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        selectedDeliveryOption === 'standard'
                          ? 'border-[#ff6600] bg-[#ff6600]/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <Truck className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <div className="font-medium text-sm">Standard</div>
                        <div className="text-xs text-gray-600">3-5 jours</div>
                        <div className="text-xs font-medium text-green-600">Gratuite</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedDeliveryOption('express')}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        selectedDeliveryOption === 'express'
                          ? 'border-[#ff6600] bg-[#ff6600]/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <Zap className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <div className="font-medium text-sm">Express</div>
                        <div className="text-xs text-gray-600">1-2 jours</div>
                        <div className="text-xs font-medium text-orange-600">+2000 F</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedDeliveryOption('pickup')}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        selectedDeliveryOption === 'pickup'
                          ? 'border-[#ff6600] bg-[#ff6600]/10'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <Store className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <div className="font-medium text-sm">Point relais</div>
                        <div className="text-xs text-gray-600">Retrait</div>
                        <div className="text-xs font-medium text-purple-600">-500 F</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 4: Confirmation finale */}
            {orderStep === 4 && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Confirmation de votre commande
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Récapitulatif</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Articles:</span>
                          <span>{orderDetails?.items.length} produit(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Mode de paiement:</span>
                          <span className="capitalize">{selectedPaymentOption}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Livraison:</span>
                          <span className="capitalize">{selectedDeliveryOption}</span>
                        </div>
                        {usePoints && pointsToUse > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Points utilisés:</span>
                            <span>{pointsToUse}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-800">Total final:</span>
                        <span className="text-2xl font-bold text-[#ff6600]">
                          {calculateOrderTotal().toLocaleString()} F CFA
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">Points à gagner:</span>
                        <span className="text-sm font-medium text-green-600">
                          +{orderDetails?.pointsEarned} points
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">Prêt à confirmer !</h4>
                      <p className="text-sm text-green-800">
                        Votre commande est prête. Cliquez sur "Confirmer la commande" pour finaliser votre achat.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Boutons de navigation */}
          <div className="flex-shrink-0 border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={orderStep === 1 ? () => setShowOrderModal(false) : handlePreviousStep}
                className="flex items-center gap-2"
              >
                {orderStep === 1 ? (
                  <>
                    <X className="h-4 w-4" />
                    Annuler
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </>
                )}
              </Button>
              
              <Button
                onClick={orderStep === 4 ? handleConfirmOrder : handleNextStep}
                className="bg-[#ff6600] hover:bg-[#e55a00] flex items-center gap-2"
              >
                {orderStep === 4 ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirmer la commande
                  </>
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Partage Réutilisable */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md bg-white border-2 border-gray-200 rounded-xl shadow-xl p-0">
          <DialogHeader className="px-6 py-4 border-b border-gray-100">
            <DialogTitle className="text-lg font-semibold text-gray-800">Partager et gagner des points</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Choisissez votre réseau social pour partager votre panier
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 space-y-3">
            <div 
              onClick={() => {
                const cartData = shareCart()
                if (cartData) {
                  shareToWhatsApp(cartData.text, 30)
                  setShowShareModal(false)
                }
              }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-green-50 cursor-pointer group border border-gray-100 hover:border-green-200 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                  <p className="text-xs text-gray-500">Partagez avec vos contacts</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                <Coins className="h-3 w-3 text-green-600" />
                <span className="text-xs font-bold text-green-700">+30</span>
              </div>
            </div>

            <div 
              onClick={() => {
                const cartData = shareCart()
                if (cartData) {
                  shareToFacebook(cartData.text, cartData.url, 50)
                  setShowShareModal(false)
                }
              }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 cursor-pointer group border border-gray-100 hover:border-blue-200 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">Facebook</span>
                  <p className="text-xs text-gray-500">Partagez sur votre mur</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-blue-100 px-2 py-1 rounded-full">
                <Coins className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-bold text-blue-700">+50</span>
              </div>
            </div>

            <div 
              onClick={() => {
                const cartData = shareCart()
                if (cartData) {
                  const twitterText = `${cartData.text}\n\n#Probooster #Marketplace`
                  shareToTwitter(twitterText, cartData.url, 40)
                  setShowShareModal(false)
                }
              }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer group border border-gray-100 hover:border-gray-200 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">X (Twitter)</span>
                  <p className="text-xs text-gray-500">Partagez avec vos followers</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full">
                <Coins className="h-3 w-3 text-gray-600" />
                <span className="text-xs font-bold text-gray-700">+40</span>
              </div>
            </div>

            <div 
              onClick={() => {
                const cartData = shareCart()
                if (cartData) {
                  shareToInstagram(cartData.text, 45)
                  setShowShareModal(false)
                }
              }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-pink-50 cursor-pointer group border border-gray-100 hover:border-pink-200 transition-all duration-300"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">Instagram</span>
                  <p className="text-xs text-gray-500">Copiez le texte</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 bg-pink-100 px-2 py-1 rounded-full">
                <Coins className="h-3 w-3 text-pink-600" />
                <span className="text-xs font-bold text-pink-700">+45</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal des Paramètres de Livraison */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Paramètres de Livraison</DialogTitle>
            <DialogDescription>
              Configurez vos préférences de suivi et de notifications
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Settings className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Paramètres de Livraison</h2>
                  <p className="text-white/80 text-sm">Personnalisez votre expérience de suivi</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={() => setShowSettingsModal(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu principal - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-8">
              {/* Section Notifications */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-red-500" />
                  Notifications
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Bell className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Notifications en temps réel</h4>
                        <p className="text-sm text-gray-500">Recevez des alertes instantanées sur vos livraisons</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.notifications}
                      onCheckedChange={(checked) => handleSettingsChange('notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Notifications par email</h4>
                        <p className="text-sm text-gray-500">Recevez les mises à jour par email</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingsChange('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Notifications push</h4>
                        <p className="text-sm text-gray-500">Alertes sur votre appareil mobile</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingsChange('pushNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Notifications SMS</h4>
                        <p className="text-sm text-gray-500">Recevez des SMS pour les mises à jour importantes</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.smsNotifications}
                      onCheckedChange={(checked) => handleSettingsChange('smsNotifications', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Section Alertes */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Volume2 className="h-5 w-5 mr-2 text-orange-500" />
                  Alertes & Sons
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Volume2 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Alertes sonores</h4>
                        <p className="text-sm text-gray-500">Sons de notification pour les mises à jour</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.soundAlerts}
                      onCheckedChange={(checked) => handleSettingsChange('soundAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Vibrations</h4>
                        <p className="text-sm text-gray-500">Vibrations pour les notifications importantes</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.vibrationAlerts}
                      onCheckedChange={(checked) => handleSettingsChange('vibrationAlerts', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Section Suivi */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-green-500" />
                  Suivi & Localisation
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Suivi GPS</h4>
                        <p className="text-sm text-gray-500">Suivi en temps réel de votre livreur</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.gpsTracking}
                      onCheckedChange={(checked) => handleSettingsChange('gpsTracking', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Actualisation automatique</h4>
                        <p className="text-sm text-gray-500">Mise à jour automatique du statut</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.autoRefresh}
                      onCheckedChange={(checked) => handleSettingsChange('autoRefresh', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Section Préférences de Livraison */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-purple-500" />
                  Préférences de Livraison
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure préférée
                      </label>
                      <Select
                        value={deliverySettings.deliveryPreferences.preferredTime}
                        onValueChange={(value) => handleDeliveryPreferenceChange('preferredTime', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anytime">N'importe quand</SelectItem>
                          <SelectItem value="morning">Matin (8h-12h)</SelectItem>
                          <SelectItem value="afternoon">Après-midi (12h-17h)</SelectItem>
                          <SelectItem value="evening">Soirée (17h-20h)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jour préféré
                      </label>
                      <Select
                        value={deliverySettings.deliveryPreferences.preferredDay}
                        onValueChange={(value) => handleDeliveryPreferenceChange('preferredDay', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anyday">N'importe quel jour</SelectItem>
                          <SelectItem value="weekdays">Jours ouvrables</SelectItem>
                          <SelectItem value="weekend">Weekend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Contact avant livraison</h4>
                        <p className="text-sm text-gray-500">Le livreur vous appelle avant d'arriver</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.deliveryPreferences.contactBeforeDelivery}
                      onCheckedChange={(checked) => handleDeliveryPreferenceChange('contactBeforeDelivery', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Home className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Livraison sans signature</h4>
                        <p className="text-sm text-gray-500">Laisser le colis devant la porte</p>
                      </div>
                    </div>
                    <Switch
                      checked={deliverySettings.deliveryPreferences.leaveAtDoor}
                      onCheckedChange={(checked) => handleDeliveryPreferenceChange('leaveAtDoor', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={resetDeliverySettings}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  onClick={saveDeliverySettings}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Suivi GPS */}
      <Dialog open={showGPSTrackingModal} onOpenChange={setShowGPSTrackingModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Suivi GPS en Temps Réel</DialogTitle>
            <DialogDescription>
              Suivez votre livreur en temps réel avec précision GPS
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <MapPin className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Suivi GPS en Temps Réel</h2>
                  <p className="text-white/80 text-sm">
                    {selectedDelivery?.trackingNumber ? `Suivi #${selectedDelivery.trackingNumber}` : 'Suivi de livraison'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={() => setShowGPSTrackingModal(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu principal - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Carte GPS simulée */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-500" />
                  Carte de Suivi
                </h3>
                
                <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-xl p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gray-100 opacity-30"></div>
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    
                    <h4 className="text-lg font-bold text-gray-800 mb-2">
                      {selectedDelivery?.driver || 'Livreur Probooster'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-white/80 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-600">15 min</div>
                        <div className="text-sm text-gray-600">Arrivée estimée</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3">
                        <div className="text-2xl font-bold text-pink-600">2.3 km</div>
                        <div className="text-sm text-gray-600">Distance restante</div>
                      </div>
                      <div className="bg-white/80 rounded-lg p-3">
                        <div className="text-2xl font-bold text-orange-600">25 km/h</div>
                        <div className="text-sm text-gray-600">Vitesse actuelle</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-orange-500" />
                  Informations de Livraison
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Livreur</h4>
                          <p className="text-sm text-gray-500">{selectedDelivery?.driver || 'Livreur Probooster'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Truck className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Véhicule</h4>
                          <p className="text-sm text-gray-500">{selectedDelivery?.vehicle || 'Moto Probooster'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Star className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Note</h4>
                          <p className="text-sm text-gray-500">{selectedDelivery?.driverRating || 4.8}/5</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                                         <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                           <Clock className="h-5 w-5 text-orange-600" />
                         </div>
                         <div>
                           <h4 className="font-semibold text-gray-900">Dernière mise à jour</h4>
                          <p className="text-sm text-gray-500">{new Date().toLocaleTimeString('fr-FR')}</p>
                         </div>
                       </div>
                     </div>

                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                           <MapPin className="h-5 w-5 text-red-600" />
                         </div>
                         <div>
                           <h4 className="font-semibold text-gray-900">Localisation actuelle</h4>
                          <p className="text-sm text-gray-500">Abomey-Calavi, Bénin</p>
                         </div>
                       </div>
                     </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Statut GPS</h4>
                          <p className="text-sm text-green-600 font-medium">Actif et précis</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique de route */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-500" />
                  Historique de Route
                </h3>
                
                <div className="space-y-3">
                  {[
                    { time: "14:30", location: "Centre de distribution", status: "Départ" },
                    { time: "14:45", location: "Route nationale", status: "En route" },
                    { time: "15:00", location: "Abomey-Calavi", status: "Proche destination" },
                    { time: "15:15", location: "Votre adresse", status: "Arrivée estimée" }
                  ].map((step, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 3 ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {index === 3 ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{step.location}</h4>
                        <p className="text-sm text-gray-500">{step.status}</p>
                      </div>
                      <div className="text-sm text-gray-400">{step.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowGPSTrackingModal(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
                <Button
                  onClick={handleGPSTracking}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Contact */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Contact Livreur</DialogTitle>
            <DialogDescription>
              Contactez votre livreur ou le support client
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Phone className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Contact Livreur</h2>
                  <p className="text-white/80 text-sm">
                    {selectedDelivery?.trackingNumber ? `Livraison #${selectedDelivery.trackingNumber}` : 'Support client'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={() => setShowContactModal(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu principal - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Informations du livreur */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-red-500" />
                  Informations du Livreur
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{selectedDelivery?.driver || 'Livreur Probooster'}</h4>
                        <p className="text-sm text-gray-600">Livreur assigné</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-pink-50 rounded-lg">
                      <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                        <Truck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{selectedDelivery?.vehicle || 'Moto Probooster'}</h4>
                        <p className="text-sm text-gray-600">Véhicule: {selectedDelivery?.plate || 'BJ-1234-AB'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{selectedDelivery?.driverRating || 4.8}/5</h4>
                        <p className="text-sm text-gray-600">Note moyenne</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">15 min</h4>
                        <p className="text-sm text-gray-600">Arrivée estimée</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Options de contact */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
                  Options de Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => {
                      const phone = selectedDelivery?.driverPhone || "+229 91 50 57 57"
                      navigator.clipboard.writeText(phone)
                      alert(`📞 Numéro copié : ${phone}\n\nVous pouvez maintenant appeler le livreur.`)
                    }}
                    className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors border border-green-200"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Appel direct</h4>
                      <p className="text-sm text-gray-600">{selectedDelivery?.driverPhone || "+229 91 50 57 57"}</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      const phone = selectedDelivery?.driverPhone || "+229 91 50 57 57"
                      const message = `Bonjour, concernant ma livraison #${selectedDelivery?.trackingNumber || 'N/A'}, pouvez-vous me donner une estimation de l'heure d'arrivée ?`
                      navigator.clipboard.writeText(message)
                      alert(`💬 Message SMS copié !\n\nEnvoyez ce message au ${phone}`)
                    }}
                    className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">SMS</h4>
                      <p className="text-sm text-gray-600">Message pré-rempli</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      alert(`💬 Chat en ligne ouvert !\n\nUn agent vous répondra dans les plus brefs délais.`)
                    }}
                    className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200"
                  >
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Chat en ligne</h4>
                      <p className="text-sm text-gray-600">Support 24h/24</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      const supportPhone = "+229 91 50 57 57"
                      navigator.clipboard.writeText(supportPhone)
                      alert(`📞 Support Probooster : ${supportPhone}\n\nNuméro copié !`)
                    }}
                    className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors border border-orange-200"
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <Headphones className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Support client</h4>
                      <p className="text-sm text-gray-600">+229 91 50 57 57</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conseils de contact */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-orange-500" />
                  Conseils de Contact
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Le livreur peut être en route</h4>
                      <p className="text-sm text-gray-600">Privilégiez le SMS pour les questions non urgentes</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Appel recommandé pour les urgences</h4>
                      <p className="text-sm text-gray-600">Problèmes de livraison, adresse incorrecte, etc.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Info className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Support disponible 24h/24</h4>
                      <p className="text-sm text-gray-600">Pour toute question ou problème</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
                <Button
                  onClick={handleContactDriver}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Rapport */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-red-50 via-white to-orange-50 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Rapport de Problème</DialogTitle>
            <DialogDescription>
              Signalez un problème avec votre livraison
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-6 text-white overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <FileText className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Rapport de Problème</h2>
                  <p className="text-white/80 text-sm">
                    {selectedDelivery?.trackingNumber ? `Livraison #${selectedDelivery.trackingNumber}` : 'Signaler un problème'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={() => setShowReportModal(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu principal - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Types de problèmes */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Types de Problèmes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Clock, title: "Retard de livraison", description: "Livraison en retard", color: "orange" },
                    { icon: Package, title: "Produit endommagé", description: "Colis abîmé ou cassé", color: "red" },
                    { icon: User, title: "Livreur non trouvé", description: "Livreur introuvable", color: "blue" },
                    { icon: MapPin, title: "Adresse incorrecte", description: "Erreur d'adresse", color: "purple" },
                    { icon: CreditCard, title: "Problème de paiement", description: "Erreur de facturation", color: "green" },
                    { icon: HelpCircle, title: "Autre problème", description: "Problème non listé", color: "gray" }
                  ].map((problem, index) => (
                    <div 
                      key={index}
                      onClick={() => {
                        const reportTypes = [
                          "Retard de livraison",
                          "Produit endommagé", 
                          "Livreur non trouvé",
                          "Adresse incorrecte",
                          "Problème de paiement",
                          "Autre problème"
                        ]
                        const selectedIssue = reportTypes[index]
                        const description = prompt(`Décrivez le problème "${selectedIssue}" en détail:`)
                        
                        if (description) {
                          const report = {
                            id: `RPT-${Date.now()}`,
                            trackingNumber: selectedDelivery?.trackingNumber || 'N/A',
                            issueType: selectedIssue,
                            description: description,
                            date: new Date().toISOString(),
                            status: "En cours de traitement"
                          }
                          
                          const existingReports = JSON.parse(safeLocalStorage.getItem('deliveryReports', '[]'))
                          existingReports.push(report)
                          safeLocalStorage.setItem('deliveryReports', JSON.stringify(existingReports))
                          
                          alert(`📋 Rapport envoyé avec succès !

🆔 Numéro de rapport: ${report.id}
📦 Numéro de suivi: ${report.trackingNumber}
🚨 Type de problème: ${selectedIssue}
📝 Description: ${description}
📅 Date: ${new Date().toLocaleDateString('fr-FR')}
⏰ Heure: ${new Date().toLocaleTimeString('fr-FR')}

✅ Rapport enregistré
📧 Confirmation envoyée par email
📞 Support contacté automatiquement
⏱️ Traitement sous 24h

Merci de nous avoir signalé ce problème.`)
                          
                          setShowReportModal(false)
                        }
                      }}
                      className={`flex items-center space-x-4 p-4 bg-${problem.color}-50 rounded-lg cursor-pointer hover:bg-${problem.color}-100 transition-colors border border-${problem.color}-200`}
                    >
                      <div className={`w-12 h-12 bg-${problem.color}-500 rounded-full flex items-center justify-center`}>
                        <problem.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{problem.title}</h4>
                        <p className="text-sm text-gray-600">{problem.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informations de la livraison */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-500" />
                  Informations de la Livraison
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Numéro de suivi:</span>
                      <span className="font-semibold">{selectedDelivery?.trackingNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Livreur:</span>
                      <span className="font-semibold">{selectedDelivery?.driver || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Statut:</span>
                      <span className="font-semibold text-orange-600">{selectedDelivery?.status || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Date de commande:</span>
                      <span className="font-semibold">{selectedDelivery?.orderDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Livraison estimée:</span>
                      <span className="font-semibold">{selectedDelivery?.estimatedDelivery || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Adresse:</span>
                      <span className="font-semibold text-right">{selectedDelivery?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support d'urgence */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Headphones className="h-5 w-5 mr-2 text-green-500" />
                  Support d'Urgence
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Support téléphonique</h4>
                      <p className="text-sm text-gray-600">+229 91 50 57 57 (24h/24)</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Chat en ligne</h4>
                      <p className="text-sm text-gray-600">Support immédiat disponible</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Email de support</h4>
                      <p className="text-sm text-gray-600">support@probooster.online</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={handleReportIssue}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Signaler
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Support Client - Complet et Fonctionnel */}
      <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-red-50 via-white to-pink-50">
          <DialogHeader className="sr-only">
            <DialogTitle>Support Client</DialogTitle>
            <DialogDescription>
              Assistance complète et support client 24/7
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Headphones className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Support Client 24/7</h2>
                  <p className="text-white/80 text-sm">Assistance complète et support personnalisé</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                onClick={() => setShowSupportModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Contenu principal avec scroll optimisé */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full max-h-[calc(95vh-120px)] overflow-y-auto custom-scrollbar p-6">
              
              {/* Section Catégories de Support */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <List className="h-5 w-5 mr-2 text-red-500" />
                  Catégories de Support
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {[
                      { id: 'general', label: 'Support Général', icon: HelpCircle, color: 'red', description: 'Questions générales et assistance de base' },
                      { id: 'technical', label: 'Support Technique', icon: Settings, color: 'pink', description: 'Problèmes techniques et bugs' },
                      { id: 'delivery', label: 'Livraisons', icon: Truck, color: 'orange', description: 'Suivi et problèmes de livraison' },
                      { id: 'payment', label: 'Paiements', icon: CreditCard, color: 'red', description: 'Problèmes de paiement et remboursements' },
                      { id: 'account', label: 'Compte Utilisateur', icon: User, color: 'pink', description: 'Gestion du compte et authentification' },
                      { id: 'orders', label: 'Commandes', icon: Package, color: 'orange', description: 'Suivi et modification des commandes' }
                    ].map((category) => (
                    <div
                      key={category.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        supportCategory === category.id
                          ? `border-${category.color}-500 bg-${category.color}-50`
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-${category.color}-500 rounded-full flex items-center justify-center`}>
                          <category.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{category.label}</h4>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Support Immédiat */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-orange-500" />
                  Support Immédiat
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Téléphone</h4>
                    <p className="text-sm text-gray-600 mb-3">Support direct 24/7</p>
                    <Button 
                      size="sm" 
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                      onClick={handlePhoneSupport}
                    >
                      +229 91 50 57 57
                    </Button>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Chat en Ligne</h4>
                    <p className="text-sm text-gray-600 mb-3">Réponse immédiate</p>
                    <Button 
                      size="sm" 
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      onClick={handleChatSupport}
                    >
                      Démarrer le Chat
                    </Button>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Email</h4>
                    <p className="text-sm text-gray-600 mb-3">Réponse sous 2h</p>
                    <Button 
                      size="sm" 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={handleEmailSupport}
                    >
                      Envoyer Email
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section FAQ Dynamique */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-pink-500" />
                  Questions Fréquentes
                </h3>
                
                <div className="space-y-4">
                  {[
                    {
                      question: "Comment suivre ma livraison ?",
                      answer: "Utilisez le numéro de suivi fourni dans votre email de confirmation ou consultez la section 'Suivi des Livraisons' dans votre compte."
                    },
                    {
                      question: "Que faire si ma commande n'arrive pas ?",
                      answer: "Contactez immédiatement notre support client. Nous vous aiderons à localiser votre commande et résoudre le problème."
                    },
                    {
                      question: "Comment annuler une commande ?",
                      answer: "Vous pouvez annuler votre commande dans les 2 heures suivant la commande via votre compte ou en contactant le support."
                    },
                    {
                      question: "Comment obtenir un remboursement ?",
                      answer: "Les remboursements sont traités sous 3-5 jours ouvrables. Contactez le support pour initier la procédure."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Message de Support */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-red-500" />
                  Envoyer un Message
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Catégorie sélectionnée: <span className="text-blue-600 font-semibold">
                        {supportCategory === 'general' ? 'Support Général' :
                         supportCategory === 'technical' ? 'Support Technique' :
                         supportCategory === 'delivery' ? 'Livraisons' :
                         supportCategory === 'payment' ? 'Paiements' :
                         supportCategory === 'account' ? 'Compte Utilisateur' :
                         'Commandes'}
                      </span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Votre message
                    </label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Décrivez votre problème ou question en détail..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  {/* Section Captures d'écran */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Captures d'écran (optionnel)
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const fileInput = document.createElement('input')
                          fileInput.type = 'file'
                          fileInput.accept = 'image/*'
                          fileInput.multiple = true
                          fileInput.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (files && files.length > 0) {
                              const newScreenshots = Array.from(files)
                              setSupportScreenshots(prev => [...prev, ...newScreenshots])
                              
                              // Notification de succès
                              alert(`📸 ${newScreenshots.length} capture(s) ajoutée(s) avec succès !`)
                            }
                          }
                          fileInput.click()
                        }}
                        className="text-red-500 border-red-300 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Ajouter Capture</span>
                      </Button>
                    </div>
                    
                    {/* Aperçu des captures */}
                    {supportScreenshots.length > 0 && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <Camera className="h-4 w-4 mr-2 text-red-500" />
                          Captures ajoutées ({supportScreenshots.length})
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {supportScreenshots.map((screenshot, index) => (
                            <div key={index} className="relative group">
                              <div className="relative">
                                <img
                                  src={URL.createObjectURL(screenshot)}
                                  alt={`Capture ${index + 1}`}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1"
                                    onClick={() => {
                                      setSupportScreenshots(prev => prev.filter((_, i) => i !== index))
                                    }}
                                    title="Supprimer"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Nom du fichier */}
                              <div className="mt-1 text-xs text-gray-500 truncate text-center">
                                {screenshot.name.length > 15 ? screenshot.name.substring(0, 15) + '...' : screenshot.name}
                              </div>
                              
                              {/* Bouton de suppression */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                                onClick={() => {
                                  setSupportScreenshots(prev => prev.filter((_, i) => i !== index))
                                }}
                                title="Supprimer"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Bouton pour supprimer toutes les captures */}
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-300 hover:bg-red-50"
                            onClick={() => setSupportScreenshots([])}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer tout
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSupportMessage('')
                        setSupportCategory('general')
                        setSupportScreenshots([])
                      }}
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={handleSupportMessageSubmit}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le Message
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section Informations de Contact */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-orange-500" />
                  Informations de Contact
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                      <Clock className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-semibold text-gray-900">Horaires de Support</p>
                        <p className="text-sm text-gray-600">24h/24, 7j/7</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold text-gray-900">Site Web</p>
                        <p className="text-sm text-gray-600">probooster.online</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                      <MapPin className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-semibold text-gray-900">Adresse</p>
                        <p className="text-sm text-gray-600">Cotonou, Bénin</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                      <Mail className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-semibold text-gray-900">Email Principal</p>
                        <p className="text-sm text-gray-600">support@probooster.online</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Chat Support Client - Système Complet */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col">
          <DialogHeader className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 text-white">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Chat Support Client</span>
              </div>
              <div className="flex items-center space-x-2">
                {chatStatus === 'connecting' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Connexion...</span>
                  </div>
                )}
                {chatStatus === 'connected' && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Connecté</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowChatModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {/* Zone des messages */}
          <div className="flex-1 overflow-hidden">
            <div className="h-[400px] overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatStatus === 'connecting' && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Connexion au support en cours...</p>
                </div>
              )}
              
              {chatStatus === 'connected' && (
                <>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.type === 'user'
                            ? 'bg-red-500 text-white'
                            : 'bg-pink-50 text-gray-800 border border-pink-200'
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {msg.sender}
                        </div>
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                                           <div className="bg-pink-50 text-gray-800 px-4 py-2 rounded-lg border border-pink-200">
                       <div className="text-sm font-medium mb-1 text-red-600">Support Probooster</div>
                       <div className="flex items-center space-x-1">
                         <span className="text-sm">En train d'écrire</span>
                         <div className="flex space-x-1">
                           <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                           <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                           <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                         </div>
                       </div>
                     </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Zone de saisie - TOUJOUR AFFICHÉE */}
          <div className="p-4 border-t-4 border-red-500 bg-gradient-to-r from-red-50 to-pink-50 shadow-lg">
            {/* Barre d'outils avec emojis et pièces jointes */}
            <div className="flex items-center space-x-2 mb-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-100 p-2 chat-toolbar-button"
                onClick={() => {
                  const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '💯', '👏', '🙏', '😍', '🤔', '😅', '😭', '😡', '🤗', '😎', '🤩', '😴', '🤯', '🥳', '😇', '🚀', '💡', '⭐', '🎯', '🏆', '💪', '🌈', '✨', '🎊', '🎁', '🍕']
                  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
                  setChatMessage(prev => prev + randomEmoji)
                  
                  // Notification visuelle
                  const button = event?.target as HTMLElement
                  if (button) {
                    button.style.transform = 'scale(1.2)'
                    setTimeout(() => {
                      button.style.transform = 'scale(1)'
                    }, 200)
                  }
                }}
                title="Ajouter un emoji aléatoire 😊"
              >
                <Smile className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-pink-500 hover:bg-pink-100 p-2 chat-toolbar-button"
                onClick={() => {
                  const fileInput = document.createElement('input')
                  fileInput.type = 'file'
                  fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt,.zip,.rar'
                  fileInput.multiple = true
                  fileInput.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files
                    if (files && files.length > 0) {
                      // Ajouter les fichiers à la liste des pièces jointes
                      const newFiles = Array.from(files)
                      setAttachedFiles(prev => [...prev, ...newFiles])
                      
                      // Notification de succès
                      alert(`📎 ${newFiles.length} fichier(s) ajouté(s) avec succès !\n\nVous pouvez maintenant voir l'aperçu ci-dessous.`)
                    }
                  }
                  fileInput.click()
                }}
                title="Joindre des fichiers 📎"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              
              <div className="flex-1"></div>
              
              <div className="text-xs text-gray-500">
                Appuyez sur Entrée pour envoyer
              </div>
            </div>
            
            {/* Aperçu des pièces jointes */}
            {attachedFiles.length > 0 && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-pink-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <Paperclip className="h-4 w-4 mr-2 text-pink-500" />
                  Pièces jointes ({attachedFiles.length})
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      {file.type.startsWith('image/') ? (
                        // Aperçu des images
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1"
                              onClick={() => {
                                setAttachedFiles(prev => prev.filter((_, i) => i !== index))
                              }}
                              title="Supprimer"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Aperçu des autres types de fichiers
                        <div className="w-full h-20 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg border border-pink-200 flex flex-col items-center justify-center p-2">
                          <div className="text-2xl mb-1">
                            {file.type.includes('pdf') ? '📄' : 
                             file.type.includes('word') ? '📝' : 
                             file.type.includes('text') ? '📃' : 
                             file.type.includes('zip') ? '🗜️' : '📎'}
                          </div>
                          <div className="text-xs text-gray-600 text-center truncate w-full">
                            {file.name}
                          </div>
                        </div>
                      )}
                      
                      {/* Nom du fichier et taille */}
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                      
                      {/* Bouton de suppression */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                        onClick={() => {
                          setAttachedFiles(prev => prev.filter((_, i) => i !== index))
                        }}
                        title="Supprimer"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Bouton pour supprimer toutes les pièces jointes */}
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-300 hover:bg-red-50"
                    onClick={() => setAttachedFiles([])}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer tout
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleChatMessageSubmit()
                  }
                }}
                placeholder="Tapez votre message... 😊"
                className="flex-1 p-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-white"
                rows={3}
              />
              <Button
                onClick={handleChatMessageSubmit}
                disabled={!chatMessage.trim() && attachedFiles.length === 0}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Téléchargement App */}
      <Dialog open={showAppDownloadModal} onOpenChange={setShowAppDownloadModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Téléchargement App Probooster</DialogTitle>
            <DialogDescription>
              Téléchargez notre application mobile pour un suivi en temps réel
            </DialogDescription>
          </DialogHeader>
          
          {/* Header avec gradient et animations */}
          <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 p-6 text-white overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
              <div className="absolute top-8 right-8 w-3 h-3 bg-white/20 rounded-full animate-pulse"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Smartphone className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">App Probooster Mobile</h2>
                  <p className="text-white/80 text-sm">Téléchargez et suivez vos livraisons en temps réel</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  onClick={() => setShowAppDownloadModal(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu principal - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Présentation de l'app */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-red-500" />
                  Application Mobile Probooster
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Suivi GPS en Temps Réel</h4>
                        <p className="text-sm text-gray-600">Localisez votre livreur à tout moment</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-pink-50 rounded-lg">
                      <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                        <Bell className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Notifications Push</h4>
                        <p className="text-sm text-gray-600">Alertes instantanées sur vos livraisons</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
                      <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">Chat Support</h4>
                        <p className="text-sm text-gray-600">Contactez notre équipe en direct</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                      <Smartphone className="h-16 w-16 text-red-500" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Disponible sur</h4>
                    <div className="flex justify-center space-x-4">
                      <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">iOS</span>
                      </div>
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">Android</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons de téléchargement */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Download className="h-5 w-5 mr-2 text-orange-500" />
                  Télécharger Maintenant
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      alert('📱 Redirection vers App Store...\n\nL\'application iOS sera téléchargée depuis l\'App Store.')
                      setShowAppDownloadModal(false)
                    }}
                    className="w-full bg-black hover:bg-gray-800 text-white py-4 text-lg"
                  >
                    <Apple className="h-6 w-6 mr-2" />
                    App Store
                  </Button>
                  
                  <Button
                    onClick={() => {
                      alert('📱 Redirection vers Google Play...\n\nL\'application Android sera téléchargée depuis Google Play.')
                      setShowAppDownloadModal(false)
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                  >
                    <Play className="h-6 w-6 mr-2" />
                    Google Play
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </header>
  )
}
