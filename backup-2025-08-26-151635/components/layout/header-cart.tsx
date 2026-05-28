"use client"

import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Share2, 
  BarChart3, 
  Coins, 
  Clock, 
  Package, 
  Truck, 
  Shield, 
  Gift, 
  Star, 
  CreditCard, 
  Calculator, 
  Info, 
  Calendar, 
  MessageCircle, 
  FileText, 
  Download, 
  Copy, 
  Printer, 
  HelpCircle, 
  Save, 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  Volume2, 
  RotateCcw, 
  AlertTriangle, 
  List, 
  BookOpen, 
  Send, 
  Users, 
  Building, 
  Car, 
  Camera, 
  Music, 
  Gamepad2, 
  Palette, 
  Wrench, 
  Hammer, 
  Drill, 
  Ruler, 
  Microscope, 
  TestTube, 
  Atom, 
  Dna, 
  Leaf, 
  Flower, 
  Sun, 
  Moon, 
  Cloud, 
  Wind, 
  Rainbow, 
  Umbrella, 
  Snowflake, 
  Droplets, 
  Waves, 
  Fish, 
  Bird, 
  Cat, 
  Dog, 
  Rabbit, 
  Mouse, 
  Rat, 
  Turtle, 
  Shell, 
  Diamond, 
  Bone, 
  Eye, 
  Glasses, 
  Shirt, 
  Wallet, 
  Backpack, 
  Briefcase, 
  Bed, 
  Table, 
  Apple, 
  Play, 
  Smile, 
  Paperclip, 
  Heart,
  Sparkles,
  Zap,
  Crown,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin
} from "lucide-react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Input } from "@/components/ui/input"

// Import des services corrigés
import { 
  CartService, 
  WishlistService, 
  PointsService, 
  DeliveryService, 
  AuthService, 
  SearchService,
  initializeServices 
} from "@/lib/services"

// Import du hook de notifications modernes
import { useNotifications } from "@/components/ui/modern-notification"

export default function HeaderCart() {
  // Hook de notifications modernes
  const { addNotification } = useNotifications()
  
  // États avec valeurs par défaut
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPoints, setUserPoints] = useState(1000)
  const [pointsValue, setPointsValue] = useState(10000)
  const [withdrawalThreshold] = useState(5000)
  const [cartItems, setCartItems] = useState(0)
  const [wishlistItems, setWishlistItems] = useState(0)
  const [isClient, setIsClient] = useState(false)
  
  // États pour le modal du panier
  const [showCartModal, setShowCartModal] = useState(false)
  const [cartItemsData, setCartItemsData] = useState<any[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("standard")
  const [showInstallmentModal, setShowInstallmentModal] = useState(false)
  const [showDeferredModal, setShowDeferredModal] = useState(false)
  const [installmentPlan, setInstallmentPlan] = useState(3)
  const [deferredDays, setDeferredDays] = useState(30)
  const [installmentDetails, setInstallmentDetails] = useState<any>(null)
  const [deferredDetails, setDeferredDetails] = useState<any>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderStep, setOrderStep] = useState(1)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("mobile_money")
  const [paymentStep, setPaymentStep] = useState(1)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [usePoints, setUsePoints] = useState(false)
  const [pointsToUse, setPointsToUse] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState("standard")
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("standard")
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState<any>(null)
  const [promoError, setPromoError] = useState("")
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [deliveryStep, setDeliveryStep] = useState(1)
  const [deliveryCity, setDeliveryCity] = useState("")
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("")
  const [deliveryCountry, setDeliveryCountry] = useState("Côte d'Ivoire")
  const [deliveryPhone, setDeliveryPhone] = useState("")
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState("standard")
  const [deliveryInstructions, setDeliveryInstructions] = useState("")
  const [preferredDeliveryDate, setPreferredDeliveryDate] = useState("")
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState("")

  // Initialisation des services et mise à jour des états
  useEffect(() => {
    setIsClient(true)
    
    try {
      // Ajouter des données de test si le panier est vide
      const currentCart = CartService.getCart()
      if (currentCart.length === 0) {
        const testProducts = [
          {
            id: 1,
            name: "Smartphone Dernière Génération",
            price: 299000,
            image: "/placeholder.svg",
            seller: "TechStore Pro",
            category: "electronics",
            rating: 4.8,
            quantity: 1
          }
        ]
        
        testProducts.forEach(product => {
          CartService.addToCart(product)
        })
        
        console.log('Données de test ajoutées au panier')
      }
      
      // Mettre à jour les états après l'initialisation des services
      setIsLoggedIn(AuthService.isLoggedIn())
      setUserPoints(PointsService.getUserPoints())
      setPointsValue(PointsService.getPointsValue())
      setCartItems(CartService.getCart().length)
      setWishlistItems(WishlistService.getWishlist().length)
      
      // Charger les données des services
      setCartItemsData(CartService.getCart())
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services:', error)
    }
  }, [])

  // Calcul du pourcentage de progression
  const progressPercentage = Math.min((pointsValue / withdrawalThreshold) * 100, 100)

  // Suggestions de produits complémentaires générées par IA
  const getAISuggestions = () => {
    if (cartItemsData.length === 0) return []
    
    const categories = [...new Set(cartItemsData.map(item => item.category))]
    const suggestions = []
    
    if (categories.includes('electronics')) {
      suggestions.push(
        { id: 'sug1', name: 'Coque de Protection Premium', price: 15000, image: '/placeholder.svg', seller: 'ProtectStore', category: 'accessories', rating: 4.9 },
        { id: 'sug2', name: 'Chargeur Rapide 65W', price: 25000, image: '/placeholder.svg', seller: 'PowerTech', category: 'accessories', rating: 4.7 },
        { id: 'sug3', name: 'Écouteurs Sans Fil Pro', price: 45000, image: '/placeholder.svg', seller: 'AudioPro', category: 'accessories', rating: 4.8 }
      )
    }
    
    if (categories.includes('fashion')) {
      suggestions.push(
        { id: 'sug4', name: 'Sac à Dos Élégant', price: 35000, image: '/placeholder.svg', seller: 'StyleStore', category: 'accessories', rating: 4.6 },
        { id: 'sug5', name: 'Montre Connectée', price: 85000, image: '/placeholder.svg', seller: 'TechWatch', category: 'accessories', rating: 4.5 }
      )
    }
    
    return suggestions.slice(0, 3) // Limiter à 3 suggestions
  }

  // Fonction pour ajouter une suggestion au panier
  const handleAddSuggestion = (suggestion: any) => {
    if (!isClient) return
    
    try {
      CartService.addToCart(suggestion)
      setCartItems(CartService.getCart().length)
      setCartItemsData(CartService.getCart())
      showSuccess(`${suggestion.name} ajouté au panier !`)
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la suggestion:', error)
      showError('Erreur lors de l\'ajout au panier')
    }
  }

  // Fonctions de gestion du panier
  const handleRemoveFromCart = (itemId: number) => {
    if (!isClient) return
    
    try {
      const item = cartItemsData.find(item => item.id === itemId)
      if (item) {
        CartService.removeFromCart(itemId)
        setCartItems(CartService.getCart().length)
        setCartItemsData(CartService.getCart())
        showInfo(`${item.name} retiré du panier`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du panier:', error)
      showError('Erreur lors de la suppression du produit')
    }
  }

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (!isClient) return
    
    try {
      if (newQuantity <= 0) {
        handleRemoveFromCart(itemId)
        return
      }
      
      CartService.updateQuantity(itemId, newQuantity)
      setCartItemsData(CartService.getCart())
      showSuccess('Quantité mise à jour')
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error)
      showError('Erreur lors de la mise à jour')
    }
  }

  const handleAddToWishlist = (itemId: number) => {
    if (!isClient) return
    
    try {
      const item = cartItemsData.find(item => item.id === itemId)
      if (item) {
        WishlistService.addToWishlist(item)
        setWishlistItems(WishlistService.getWishlist().length)
        showSuccess(`${item.name} ajouté aux favoris`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error)
      showError('Erreur lors de l\'ajout aux favoris')
    }
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
      showError('Votre panier est vide')
      return
    }
    
    try {
      const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const plan = calculateInstallmentPlan(total, installmentPlan)
      setInstallmentDetails(plan)
      setShowInstallmentModal(true)
      showInfo('Plan de paiement fractionné calculé !')
    } catch (error) {
      console.error('Erreur lors du calcul du paiement fractionné:', error)
      showError('Erreur lors du calcul du paiement fractionné')
    }
  }

  // Fonctions pour le paiement différé
  const calculateDeferredPayment = (total: number, days: number) => {
    const deferredTotal = Math.ceil(total * 1.15) // 15% d'intérêts
    const dailyInterest = (deferredTotal - total) / days
    
    const plan = {
      originalTotal: total,
      deferredTotal,
      days,
      dailyInterest,
      totalInterest: deferredTotal - total,
      finalDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
    
    return plan
  }

  const handleDeferredPayment = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      showError('Votre panier est vide')
      return
    }
    
    try {
      const total = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const plan = calculateDeferredPayment(total, deferredDays)
      setDeferredDetails(plan)
      setShowDeferredModal(true)
      showInfo('Plan de paiement différé calculé !')
    } catch (error) {
      console.error('Erreur lors du calcul du paiement différé:', error)
      showError('Erreur lors du calcul du paiement différé')
    }
  }

  // Fonction pour confirmer le paiement fractionné
  const handleConfirmInstallment = () => {
    if (!installmentDetails) return
    
    try {
      showSuccess('Paiement fractionné confirmé !')
      setShowInstallmentModal(false)
      
      // Simuler la création de la commande avec paiement fractionné
      const order = {
        id: `INSTALLMENT_${Date.now()}`,
        type: 'installment',
        items: cartItemsData,
        total: installmentDetails.total,
        plan: installmentDetails,
        status: 'pending',
        date: new Date().toISOString()
      }
      
      console.log('Commande avec paiement fractionné créée:', order)
      showInfo('Votre commande a été créée avec succès !')
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error)
      showError('Erreur lors de la confirmation du paiement')
    }
  }

  // Fonction pour confirmer le paiement différé
  const handleConfirmDeferred = () => {
    if (!deferredDetails) return
    
    try {
      showSuccess('Paiement différé confirmé !')
      setShowDeferredModal(false)
      
      // Simuler la création de la commande avec paiement différé
      const order = {
        id: `DEFERRED_${Date.now()}`,
        type: 'deferred',
        items: cartItemsData,
        total: deferredDetails.originalTotal,
        deferredTotal: deferredDetails.deferredTotal,
        plan: deferredDetails,
        status: 'pending',
        date: new Date().toISOString()
      }
      
      console.log('Commande avec paiement différé créée:', order)
      showInfo('Votre commande a été créée avec succès !')
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error)
      showError('Erreur lors de la confirmation du paiement')
    }
  }

  // Fonction pour passer la commande
  const handlePlaceOrder = () => {
    if (!isClient || !cartItemsData || cartItemsData.length === 0) {
      showError('Votre panier est vide')
      return
    }
    
    if (!deliveryAddress || !customerPhone || !customerEmail) {
      showInfo('Veuillez remplir les informations de livraison pour continuer')
      setShowOrderModal(true)
      return
    }
    
    try {
      // Récupérer les détails de paiement sélectionnés
      const paymentDetails = {
        method: selectedPaymentMethod,
        usePoints: usePoints,
        pointsUsed: pointsToUse,
        pointsDiscount: pointsDiscount,
        finalTotal: finalTotal,
        finalTotalPoints: finalTotalPoints,
        installmentPlan: installmentDetails ? {
          type: 'installment',
          months: installmentPlan,
          monthlyPayment: installmentDetails.monthlyPayment,
          totalPayments: installmentDetails.total
        } : null,
        deferredPlan: deferredDetails ? {
          type: 'deferred',
          days: deferredDays,
          originalTotal: deferredDetails.originalTotal,
          finalTotal: deferredDetails.deferredTotal,
          interest: deferredDetails.totalInterest
        } : null
      }
      
      const order = {
        id: `ORDER_${Date.now()}`,
        items: cartItemsData,
        total: cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        deliveryAddress,
        customerPhone,
        customerEmail,
        deliveryOption: selectedDeliveryOption,
        paymentDetails,
        orderDate: new Date().toISOString(),
        status: 'pending'
      }
      
      setOrderDetails(order)
      setShowOrderModal(true)
      showSuccess('Commande créée avec succès !')
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error)
      showError('Erreur lors de la création de la commande')
    }
  }

  // Fonction pour finaliser le paiement
  const handleFinalizePayment = () => {
    if (!isClient || !orderDetails) {
      showError('Aucune commande à payer')
      return
    }
    
    try {
      // Créer le paiement en fonction du plan sélectionné
      let paymentAmount = orderDetails.total
      let paymentDescription = 'Paiement standard'
      
      if (orderDetails.paymentDetails) {
        const details = orderDetails.paymentDetails
        
        if (details.installmentPlan) {
          paymentAmount = details.installmentPlan.monthlyPayment
          paymentDescription = `Paiement fractionné - 1ère mensualité de ${details.installmentPlan.months} mois`
        } else if (details.deferredPlan) {
          paymentAmount = details.deferredPlan.finalTotal
          paymentDescription = `Paiement différé - Échéance dans ${details.deferredPlan.days} jours`
        } else if (details.usePoints) {
          paymentAmount = details.finalTotal
          paymentDescription = `Paiement avec ${details.pointsUsed.toLocaleString()} points utilisés`
        }
      }
      
      const payment = {
        id: `PAY_${Date.now()}`,
        orderId: orderDetails.id,
        amount: paymentAmount,
        originalAmount: orderDetails.total,
        method: selectedPaymentOption || 'standard',
        description: paymentDescription,
        paymentDetails: orderDetails.paymentDetails,
        status: 'processing',
        date: new Date().toISOString()
      }
      
      setPaymentDetails(payment)
      setShowPaymentModal(true)
      showSuccess('Paiement initialisé avec succès !')
      
      // Simuler le traitement du paiement
      setTimeout(() => {
        showInfo('Traitement du paiement en cours...')
        setTimeout(() => {
          showSuccess('Commande confirmée et paiement traité !')
          setShowOrderModal(false)
          setShowPaymentModal(false)
          
          // Vider le panier après commande réussie
          setCartItemsData([])
          setCartItems(0)
          
          // Réinitialiser les états de paiement
          setUsePoints(false)
          setPointsToUse(0)
          setInstallmentDetails(null)
          setDeferredDetails(null)
        }, 2000)
      }, 1000)
      
    } catch (error) {
      console.error('Erreur lors de la finalisation du paiement:', error)
      showError('Erreur lors de la finalisation du paiement')
    }
  }

  // Fonction pour utiliser les points
  const handleUsePoints = (amount: number) => {
    if (!isClient) return
    
    try {
      if (amount <= userPoints) {
        setPointsToUse(amount)
        setUsePoints(true)
        showSuccess(`${amount} points utilisés`)
      } else {
        showError('Points insuffisants')
      }
    } catch (error) {
      console.error('Erreur lors de l\'utilisation des points:', error)
    }
  }

  // Fonction pour calculer la réduction avec les points
  const calculatePointsDiscount = () => {
    if (!usePoints || pointsToUse === 0) return 0
    return Math.min(pointsToUse * 10, cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0))
  }

  // Fonction pour convertir FCFA en points
  const convertFCFAToPoints = (fcfAmount: number) => {
    return Math.round(fcfAmount / 10) // 1 point = 10 FCFA
  }

  // Fonction pour convertir points en FCFA
  const convertPointsToFCFA = (points: number) => {
    return points * 10
  }

  // Calcul du total final
  const cartTotal = cartItemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartTotalPoints = convertFCFAToPoints(cartTotal)
  const pointsDiscount = calculatePointsDiscount()
  const finalTotal = Math.max(0, cartTotal - pointsDiscount)
  const finalTotalPoints = convertFCFAToPoints(finalTotal)

  // Fonction pour gérer le changement de mode de paiement
  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method)
    // Réinitialiser les points à utiliser quand on change de mode
    if (method !== 'mixed') {
      setPointsToUse(0)
    }
  }

  // Fonction pour appliquer un code promo
  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoError("Veuillez saisir un code promo")
      return
    }

    // Simuler la validation d'un code promo
    const validPromoCodes = [
      { code: "WELCOME20", discount: 20, type: "percentage", minAmount: 50000 },
      { code: "SAVE15", discount: 15, type: "percentage", minAmount: 30000 },
      { code: "FLASH50", discount: 5000, type: "fixed", minAmount: 10000 },
      { code: "NEWUSER", discount: 25, type: "percentage", minAmount: 20000 }
    ]

    const promo = validPromoCodes.find(p => p.code.toUpperCase() === promoCode.toUpperCase().trim())
    
    if (!promo) {
      setPromoError("Code promo invalide ou expiré")
      return
    }

    if (cartTotal < promo.minAmount) {
      setPromoError(`Montant minimum requis: ${promo.minAmount.toLocaleString()} FCFA`)
      return
    }

    // Appliquer le code promo
    setAppliedPromo(promo)
    setPromoError("")
    setPromoCode("")
    
    showSuccess(`Code promo ${promo.code} appliqué avec succès !`)
    
    // Fermer le modal après un délai
    setTimeout(() => {
      setShowPromoModal(false)
    }, 1500)
  }

  // Fonction pour supprimer un code promo
  const handleRemovePromo = () => {
    setAppliedPromo(null)
    showInfo("Code promo supprimé")
  }

  // Calcul de la réduction promo
  const calculatePromoDiscount = () => {
    if (!appliedPromo) return 0
    
    if (appliedPromo.type === "percentage") {
      return (cartTotal * appliedPromo.discount) / 100
    } else {
      return appliedPromo.discount
    }
  }

  // Total final avec promo
  const finalTotalWithPromo = Math.max(0, finalTotal - calculatePromoDiscount())
  const finalTotalWithPromoPoints = convertFCFAToPoints(finalTotalWithPromo)

  // Fonctions pour la gestion des livraisons
  const handleDeliveryMethodChange = (method: string) => {
    setSelectedDeliveryMethod(method)
  }

  const calculateDeliveryCost = (method: string) => {
    const baseCost = 2000 // 2000 FCFA de base
    switch (method) {
      case 'express':
        return baseCost * 2.5 // 5000 FCFA
      case 'premium':
        return baseCost * 3 // 6000 FCFA
      case 'scheduled':
        return baseCost * 1.5 // 3000 FCFA
      default:
        return 0 // Gratuit pour la livraison standard
    }
  }

  const getDeliveryTime = (method: string) => {
    switch (method) {
      case 'express':
        return '1-2 jours ouvrés'
      case 'premium':
        return '2-3 jours ouvrés'
      case 'scheduled':
        return 'Date choisie par vous'
      default:
        return '3-5 jours ouvrés'
    }
  }

  const generateDeliveryCalendar = () => {
    const calendar = []
    const today = new Date()
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      // Exclure les dimanches
      if (date.getDay() !== 0) {
        calendar.push({
          date: date,
          formatted: date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }),
          available: true,
          timeSlots: ['09:00-12:00', '14:00-17:00', '18:00-21:00']
        })
      }
    }
    
    return calendar
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
        {/* En-tête moderne avec gradient orange */}
        <DialogHeader className="mb-8">
          <div className="relative">
            {/* Fond avec effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-500 rounded-2xl opacity-10"></div>
            <div className="relative bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-100 rounded-2xl p-6 border border-orange-200 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <ShoppingCart className="h-8 w-8 text-white animate-pulse" />
                    </div>
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      Mon Panier
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 mt-1">
                      Gérez vos produits et finalisez vos achats en toute sécurité
                    </DialogDescription>
                  </div>
                  
                  {/* Bouton Codes Promo */}
                  <div className="ml-4">
                    <Button
                      onClick={() => setShowPromoModal(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group border-0"
                    >
                      <Gift className="h-4 w-4 mr-2 group-hover:animate-bounce group-hover:scale-110 transition-all duration-300" />
                      <span className="font-semibold">Codes Promo</span>
                      <Badge className="ml-2 bg-white/20 text-white text-xs animate-pulse">
                        -20%
                      </Badge>
                    </Button>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold text-orange-600 mb-1">
                    {cartItems}
                  </div>
                  <div className="text-sm text-gray-600">
                    {cartItems === 1 ? 'article' : 'articles'} sélectionné{cartItems > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {cartItems === 0 ? (
          // Panier vide avec design moderne
          <div className="text-center py-16">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="h-12 w-12 text-orange-400" />
              </div>
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 to-yellow-200/50 rounded-full animate-ping"></div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Votre panier est vide</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Commencez à explorer notre catalogue et ajoutez vos produits préférés à votre panier
            </p>
            
            <Button 
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
              onClick={() => {
                showInfo('Redirection vers le catalogue...')
                setTimeout(() => {
                  window.location.href = '/products'
                }, 1000)
              }}
            >
              <Sparkles className="h-5 w-5 mr-2 group-hover:animate-spin transition-all duration-300" />
              Commencer les achats
            </Button>
          </div>
        ) : (
          // Contenu du panier avec design moderne
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Section gauche : Articles du panier */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Package className="h-5 w-5 text-orange-600" />
                    <span>Vos Articles ({cartItems})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItemsData.map((item, index) => (
                    <Card key={`cart-item-${item.id}-${index}`} className="group hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-orange-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] hover:-translate-y-1">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          {/* Image du produit */}
                          <div className="relative">
                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 group-hover:shadow-lg transition-all duration-300">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                              />
                            </div>
                            <Badge className="absolute -top-2 -left-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs px-2 py-1 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Package className="h-3 w-3 mr-1 fill-current" />
                              Panier
                            </Badge>
                          </div>
                          
                          {/* Informations du produit */}
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Vendeur: {item.seller}
                              </p>
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-600">{item.rating || 4.5}</span>
                              </div>
                            </div>
                            
                            {/* Contrôle des quantités */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="h-8 w-8 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                              >
                                <Minus className="h-4 w-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-300 group-hover:animate-pulse" />
                              </Button>
                              <span className="w-12 text-center font-medium text-gray-900">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                              >
                                <Plus className="h-4 w-4 text-gray-600 group-hover:text-orange-600 transition-colors duration-300 group-hover:animate-bounce" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Prix et actions */}
                          <div className="text-right space-y-3">
                            <div>
                              <p className="font-bold text-lg text-orange-600">
                                {(item.price * item.quantity).toLocaleString()} FCFA
                              </p>
                              <p className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                                <Coins className="h-3 w-3 text-yellow-500" />
                                <span>{convertFCFAToPoints(item.price * item.quantity).toLocaleString()} pts</span>
                              </p>
                              <p className="text-xs text-gray-400">
                                {item.price.toLocaleString()} FCFA l'unité
                              </p>
                            </div>
                            
                            {/* Actions rapides */}
                            <div className="flex flex-col space-y-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAddToWishlist(item.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                                title="Ajouter aux favoris"
                              >
                                <Heart className="h-4 w-4 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out group hover:shadow-md"
                                title="Retirer du panier"
                              >
                                <Trash2 className="h-4 w-4 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Suggestions IA */}
              {showSuggestions && getAISuggestions().length > 0 && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                      <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
                      <span>Suggestions IA</span>
                      <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                        Nouveau
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">Produits complémentaires recommandés pour vous</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {getAISuggestions().map((suggestion, index) => (
                        <Card key={`ai-suggestion-${suggestion.id}-${index}`} className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-blue-200 overflow-hidden transform hover:scale-105 active:scale-95 hover:-translate-y-1">
                          <CardContent className="p-4">
                            <div className="text-center space-y-3">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mx-auto group-hover:shadow-lg transition-all duration-300">
                                <Image
                                  src={suggestion.image}
                                  alt={suggestion.name}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                />
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                                  {suggestion.name}
                                </h5>
                                <p className="text-xs text-gray-500 mt-1">{suggestion.seller}</p>
                                <div className="flex items-center justify-center space-x-1 mt-1">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-gray-600">{suggestion.rating}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="font-bold text-orange-600 text-sm">
                                  {suggestion.price.toLocaleString()} FCFA
                                </p>
                                <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  <span>{convertFCFAToPoints(suggestion.price).toLocaleString()} pts</span>
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddSuggestion(suggestion)}
                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group hover:shadow-lg"
                                >
                                  <Plus className="h-3 w-3 mr-1 group-hover:animate-bounce group-hover:scale-110 transition-all duration-300" />
                                  Ajouter
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Section droite : Résumé de la commande */}
            <div className="space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-orange-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Calculator className="h-5 w-5 text-orange-600" />
                    <span>Résumé de la commande</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Détails des prix */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total:</span>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{cartTotal.toLocaleString()} FCFA</div>
                        <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                          <Coins className="h-3 w-3" />
                          <span>{cartTotalPoints.toLocaleString()} pts</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Livraison:</span>
                      <span className="font-medium">Gratuite</span>
                    </div>
                    {pointsDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Réduction points:</span>
                        <div className="text-right">
                          <div className="font-medium">-{pointsDiscount.toLocaleString()} FCFA</div>
                          <div className="text-xs flex items-center justify-end space-x-1">
                            <Coins className="h-3 w-3" />
                            <span>-{convertFCFAToPoints(pointsDiscount).toLocaleString()} pts</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Réduction code promo */}
                    {appliedPromo && (
                      <div className="flex justify-between text-sm text-purple-600">
                        <span className="flex items-center space-x-1">
                          <Gift className="h-3 w-3" />
                          <span>Code promo {appliedPromo.code}:</span>
                        </span>
                        <div className="text-right">
                          <div className="font-medium">-{calculatePromoDiscount().toLocaleString()} FCFA</div>
                          <div className="text-xs flex items-center justify-end space-x-1">
                            <Coins className="h-3 w-3" />
                            <span>-{convertFCFAToPoints(calculatePromoDiscount()).toLocaleString()} pts</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleRemovePromo}
                            className="text-xs text-purple-500 hover:text-purple-700 hover:bg-purple-50 p-1 h-auto mt-1 transform hover:scale-110 active:scale-95 transition-all duration-300"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total final:</span>
                        <div className="text-right">
                          <div className="text-orange-600">{finalTotalWithPromo.toLocaleString()} FCFA</div>
                          <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                            <Coins className="h-4 w-4" />
                            <span>{finalTotalWithPromoPoints.toLocaleString()} pts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points utilisateur */}
                  <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Coins className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-purple-900 flex items-center space-x-1">
                            <Coins className="h-4 w-4 text-yellow-500 group-hover:animate-pulse transition-all duration-300" />
                            <span>Mes Points: {userPoints.toLocaleString()}</span>
                          </p>
                          <p className="text-sm text-purple-700">Valeur: {pointsValue.toLocaleString()} FCFA</p>
                        </div>
                      </div>
                      <Progress value={progressPercentage} className="mt-3 h-2" />
                      <p className="text-xs text-purple-600 mt-1">
                        {pointsValue.toLocaleString()} / {withdrawalThreshold.toLocaleString()} FCFA
                      </p>
                    </CardContent>
                  </Card>

                  {/* Mode de paiement */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-orange-600" />
                      <span>Mode de paiement</span>
                    </h4>
                    
                    <RadioGroup value={selectedPaymentMethod} onValueChange={handlePaymentMethodChange}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 group cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all duration-300">
                          <RadioGroupItem value="standard" id="standard" className="group-hover:scale-110 transition-transform duration-300" />
                          <Label htmlFor="standard" className="text-sm font-medium cursor-pointer group-hover:text-orange-600 transition-colors duration-300">
                            Paiement standard
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 group cursor-pointer hover:bg-yellow-50 p-2 rounded-lg transition-all duration-300">
                          <RadioGroupItem value="points" id="points" className="group-hover:scale-110 transition-transform duration-300" />
                          <Label htmlFor="points" className="text-sm font-medium cursor-pointer group-hover:text-yellow-600 transition-colors duration-300">
                            Acheter avec points
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 group cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-all duration-300">
                          <RadioGroupItem value="mixed" id="mixed" className="group-hover:scale-110 transition-transform duration-300" />
                          <Label htmlFor="mixed" className="text-sm font-medium cursor-pointer group-hover:text-blue-600 transition-colors duration-300">
                            Paiement mixte
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Détails du paiement standard */}
                  {selectedPaymentMethod === 'standard' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-orange-600" />
                        <span>Paiement standard</span>
                      </h4>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total à payer:</span>
                        <span className="text-orange-600">{finalTotal.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  )}

                  {/* Détails du paiement avec points */}
                  {selectedPaymentMethod === 'points' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-yellow-600" />
                        <span>Paiement avec points</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Total de la commande:</span>
                          <div className="text-right">
                            <div className="font-medium">{finalTotal.toLocaleString()} FCFA</div>
                            <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{finalTotalPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Vos points disponibles:</span>
                          <div className="text-right">
                            <div className="font-medium text-purple-600">{userPoints.toLocaleString()}</div>
                            <div className="text-xs text-purple-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{userPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                        {userPoints >= finalTotalPoints ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="flex items-center space-x-2 text-green-700">
                              <CheckCircle className="h-4 w-4 group-hover:animate-bounce transition-all duration-300" />
                              <span className="font-medium">Paiement possible avec vos points !</span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Il vous restera {userPoints - finalTotalPoints} points après l'achat
                            </p>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="flex items-center space-x-2 text-red-700">
                              <AlertCircle className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                              <span className="font-medium">Points insuffisants</span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              Il vous manque {finalTotalPoints - userPoints} points pour finaliser l'achat
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Détails du paiement mixte */}
                  {selectedPaymentMethod === 'mixed' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-orange-600" />
                        <span>Paiement mixte</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Total de la commande:</span>
                          <div className="text-right">
                            <div className="font-medium">{finalTotal.toLocaleString()} FCFA</div>
                            <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{finalTotalPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Sélecteur de points à utiliser */}
                        <div className="space-y-2">
                          <Label htmlFor="pointsToUse" className="text-sm font-medium">
                            Points à utiliser (max: {Math.min(userPoints, finalTotalPoints)})
                          </Label>
                          <div className="flex space-x-2">
                            <Input
                              id="pointsToUse"
                              type="number"
                              min="0"
                              max={Math.min(userPoints, finalTotalPoints)}
                              value={pointsToUse}
                              onChange={(e) => setPointsToUse(Number(e.target.value))}
                              className="flex-1"
                              placeholder="0"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPointsToUse(Math.min(userPoints, finalTotalPoints))}
                              className="px-3 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                            >
                              <span className="group-hover:animate-pulse transition-all duration-300">Max</span>
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Valeur: {convertPointsToFCFA(pointsToUse).toLocaleString()} FCFA
                          </p>
                        </div>

                        {/* Calcul du paiement mixte */}
                        {pointsToUse > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                            <div className="flex justify-between text-sm">
                              <span>Paiement en points:</span>
                              <div className="text-right">
                                <div className="font-medium text-blue-600">-{convertPointsToFCFA(pointsToUse).toLocaleString()} FCFA</div>
                                <div className="text-xs text-blue-600 flex items-center justify-end space-x-1">
                                  <Coins className="h-3 w-3 group-hover:animate-pulse transition-all duration-300" />
                                  <span>-{pointsToUse.toLocaleString()} pts</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                              <span>Reste à payer:</span>
                              <div className="text-right">
                                <div className="text-orange-600">{Math.max(0, finalTotal - convertPointsToFCFA(pointsToUse)).toLocaleString()} FCFA</div>
                                <div className="text-xs text-yellow-600 flex items-center justify-end space-x-1">
                                  <Coins className="h-3 w-3 group-hover:animate-pulse transition-all duration-300" />
                                  <span>{Math.max(0, finalTotalPoints - pointsToUse).toLocaleString()} pts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Offre spéciale */}
                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Gift className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h5 className="font-medium text-green-900">Offre spéciale!</h5>
                          <p className="text-sm text-green-700">
                            Livraison gratuite pour toute commande de plus de 25.000 FCFA
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bouton Gérer les livraisons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowDeliveryModal(true)}
                      className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group border-0"
                    >
                      <Truck className="h-5 w-5 mr-2 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300" />
                      <span className="font-semibold">Gérer les livraisons</span>
                      <Badge className="ml-2 bg-white/20 text-white text-xs animate-pulse">
                        Nouveau
                      </Badge>
                    </Button>
                    
                    {/* Boutons d'action */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={handleInstallmentPayment}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group h-auto py-3 px-4"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <CreditCard className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                          <span className="text-xs font-medium leading-tight">Paiement<br />fractionné</span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeferredPayment}
                        className="border-purple-200 text-purple-600 hover:bg-blue-50 hover:border-purple-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group h-auto py-3 px-4"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          <Clock className="h-4 w-4 group-hover:animate-pulse transition-all duration-300" />
                          <span className="text-xs font-medium leading-tight">Paiement<br />différé</span>
                        </div>
                      </Button>
                    </div>
                    
                    <Button
                      onClick={handlePlaceOrder}
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2 group-hover:animate-bounce transition-all duration-300" />
                      {selectedPaymentMethod === 'points' ? (
                        <div className="text-center">
                          <div>Commander avec {finalTotalWithPromoPoints.toLocaleString()} points</div>
                          <div className="text-sm opacity-90">({finalTotalWithPromo.toLocaleString()} FCFA)</div>
                        </div>
                      ) : selectedPaymentMethod === 'mixed' && pointsToUse > 0 ? (
                        <div className="text-center">
                          <div>Commander maintenant</div>
                          <div className="text-sm opacity-90">
                            {pointsToUse} pts + {Math.max(0, finalTotalWithPromo - convertPointsToFCFA(pointsToUse)).toLocaleString()} FCFA
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div>Commander maintenant</div>
                          <div className="text-sm opacity-90">{finalTotalWithPromo.toLocaleString()} FCFA</div>
                        </div>
                      )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          showInfo('Redirection vers le catalogue...')
                          setTimeout(() => {
                            window.location.href = '/products'
                          }, 1000)
                        }}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2 group-hover:animate-bounce transition-all duration-300" />
                        Plus D'achats
                      </Button>
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button
                             variant="outline"
                             className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transform hover:scale-105 active:scale-95 transition-all duration-300 ease-out group w-full"
                           >
                             <Share2 className="h-4 w-4 mr-2 group-hover:animate-pulse transition-all duration-300" />
                             Partager
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent className="w-64 p-2 bg-white border-green-200 shadow-xl rounded-xl">
                           <div className="space-y-2">
                             {/* En-tête du menu */}
                             <div className="text-center py-2 border-b border-gray-100">
                               <h4 className="font-semibold text-gray-900">Partager votre panier</h4>
                               <p className="text-xs text-gray-500">Choisissez votre réseau préféré</p>
                             </div>
                             
                             {/* Réseaux sociaux */}
                             <div className="grid grid-cols-2 gap-2">
                               {/* WhatsApp */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${finalTotalWithPromo.toLocaleString()} FCFA (${finalTotalWithPromoPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                   const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
                                   window.open(whatsappUrl, '_blank')
                                   showSuccess('Partage WhatsApp lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 hover:text-green-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <MessageCircle className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">WhatsApp</p>
                                   <p className="text-xs text-gray-500">Partage instantané</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Facebook */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${finalTotalWithPromo.toLocaleString()} FCFA (${finalTotalWithPromoPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}`
                                   const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`
                                   window.open(facebookUrl, '_blank')
                                   showSuccess('Partage Facebook lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Facebook className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Facebook</p>
                                   <p className="text-xs text-gray-500">Partage social</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Twitter/X */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster ! 💰 Total: ${finalTotalWithPromo.toLocaleString()} FCFA (${finalTotalWithPromoPoints.toLocaleString()} pts) 📦 ${cartItems} article${cartItems > 1 ? 's' : ''}`
                                   const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.origin)}`
                                   window.open(twitterUrl, '_blank')
                                   showSuccess('Partage Twitter lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Twitter className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Twitter</p>
                                   <p className="text-xs text-gray-500">Partage rapide</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Instagram */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${finalTotal.toLocaleString()} FCFA (${finalTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                   navigator.clipboard.writeText(shareText)
                                   showSuccess('Texte copié ! Collez-le dans votre story Instagram')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-pink-50 hover:text-pink-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Instagram className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Instagram</p>
                                   <p className="text-xs text-gray-500">Story & posts</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* LinkedIn */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${finalTotal.toLocaleString()} FCFA (${finalTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                   const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent('Mon Panier Probooster')}&summary=${encodeURIComponent(shareText)}`
                                   window.open(linkedinUrl, '_blank')
                                   showSuccess('Partage LinkedIn lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Linkedin className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">LinkedIn</p>
                                   <p className="text-xs text-gray-500">Réseau pro</p>
                                 </div>
                               </DropdownMenuItem>

                               {/* Email */}
                               <DropdownMenuItem 
                                 onClick={() => {
                                   const shareText = `🛒 Mon panier Probooster !\n\n💰 Total: ${finalTotal.toLocaleString()} FCFA (${finalTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}\n\nDécouvrez mes produits sélectionnés !`
                                   const emailUrl = `mailto:?subject=Mon Panier Probooster&body=${encodeURIComponent(shareText)}`
                                   window.open(emailUrl)
                                   showSuccess('Email de partage lancé !')
                                 }}
                                 className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 hover:text-gray-700 cursor-pointer transition-all duration-300 group/item"
                               >
                                 <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                   <Mail className="h-4 w-4 text-white" />
                                 </div>
                                 <div>
                                   <p className="font-medium text-sm">Email</p>
                                   <p className="text-xs text-gray-500">Partage par mail</p>
                                 </div>
                               </DropdownMenuItem>
                             </div>

                             {/* Séparateur */}
                             <div className="border-t border-gray-100 my-2"></div>

                             {/* Option Copier */}
                             <DropdownMenuItem 
                               onClick={() => {
                                 const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${finalTotal.toLocaleString()} FCFA (${finalTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                 navigator.clipboard.writeText(shareText)
                                 showSuccess('Panier copié dans le presse-papiers !')
                               }}
                               className="flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 hover:text-orange-700 cursor-pointer transition-all duration-300 group/item"
                             >
                               <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                 <Copy className="h-4 w-4 text-white" />
                               </div>
                               <div>
                                 <p className="font-medium text-sm">Copier le lien</p>
                                 <p className="text-xs text-gray-500">Presse-papiers</p>
                               </div>
                             </DropdownMenuItem>

                             {/* Option Partage Natif */}
                             <DropdownMenuItem 
                               onClick={() => {
                                 const shareText = `🛒 Mon panier Probooster !\n💰 Total: ${finalTotal.toLocaleString()} FCFA (${finalTotalPoints.toLocaleString()} pts)\n📦 ${cartItems} article${cartItems > 1 ? 's' : ''}\n🔗 ${window.location.origin}`
                                 if (navigator.share) {
                                   navigator.share({
                                     title: 'Mon Panier Probooster',
                                     text: shareText,
                                     url: window.location.origin
                                   }).then(() => {
                                     showSuccess('Partage réussi !')
                                   }).catch(() => {
                                     showError('Partage annulé')
                                   })
                                 } else {
                                   navigator.clipboard.writeText(shareText)
                                   showSuccess('Partage natif non disponible, copié dans le presse-papiers !')
                                 }
                               }}
                               className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition-all duration-300 group/item"
                             >
                               <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover/item:animate-bounce transition-all duration-300">
                                 <Share2 className="h-4 w-4 text-white" />
                               </div>
                               <div>
                                 <p className="font-medium text-sm">Partage natif</p>
                                 <p className="text-xs text-gray-500">Options système</p>
                               </div>
                             </DropdownMenuItem>
                           </div>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </div>

                  {/* Sécurité et méthodes de paiement */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Paiement 100% sécurisé</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Wallet className="h-4 w-4 text-blue-600" />
                      <span>Mobile Money • Carte bancaire</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>



      {/* Modal Paiement Fractionné */}
      {showInstallmentModal && installmentDetails && (
        <Dialog open={showInstallmentModal} onOpenChange={setShowInstallmentModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-2xl font-bold text-blue-600">
                <CreditCard className="h-6 w-6" />
                <span>Paiement Fractionné</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Répartissez votre paiement sur {installmentDetails.months} mois
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Résumé de la commande */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-blue-900">Total de la commande</h4>
                      <p className="text-sm text-blue-700">{cartItems} article{cartItems > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {installmentDetails.total.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-blue-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(installmentDetails.total).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Détails du plan */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span>Plan de Paiement sur {installmentDetails.months} Mois</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-900 mb-2">Paiement Mensuel</h5>
                      <div className="text-2xl font-bold text-blue-600">
                        {installmentDetails.monthlyPayment.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-blue-600 flex items-center space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(installmentDetails.monthlyPayment).toLocaleString()} pts</span>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h5 className="font-medium text-green-900 mb-2">Dernier Paiement</h5>
                      <div className="text-2xl font-bold text-green-600">
                        {installmentDetails.lastPayment.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-green-600 flex items-center space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(installmentDetails.lastPayment).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Calendrier des paiements */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Calendrier des Paiements</h5>
                    <div className="space-y-2">
                      {installmentDetails.payments.map((payment: number, index: number) => (
                        <div key={`installment-payment-${index}-${payment}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {installmentDetails.dates[index]}
                              </p>
                              <p className="text-sm text-gray-500">
                                {index === installmentDetails.months - 1 ? 'Dernier paiement' : `${index + 1}ème mensualité`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              {payment.toLocaleString()} FCFA
                            </div>
                            <div className="text-sm text-gray-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{convertFCFAToPoints(payment).toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conditions et avantages */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <h5 className="font-medium text-green-900 mb-3 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Avantages du Paiement Fractionné</span>
                  </h5>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Aucun intérêt supplémentaire</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Flexibilité de paiement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Validation immédiate de la commande</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInstallmentModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmInstallment}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmer le Plan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Paiement Différé */}
      {showDeferredModal && deferredDetails && (
        <Dialog open={showDeferredModal} onOpenChange={setShowDeferredModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-2xl font-bold text-purple-600">
                <Clock className="h-6 w-6" />
                <span>Paiement Différé</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Payez dans {deferredDetails.days} jours avec un délai de grâce
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Résumé de la commande */}
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-purple-900">Total de la commande</h4>
                      <p className="text-sm text-purple-700">{cartItems} article{cartItems > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {deferredDetails.originalTotal.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-purple-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(deferredDetails.originalTotal).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Détails du plan différé */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <Calculator className="h-5 w-5 text-purple-600" />
                    <span>Détails du Paiement Différé</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h5 className="font-medium text-purple-900 mb-2">Montant Original</h5>
                      <div className="text-2xl font-bold text-purple-600">
                        {deferredDetails.originalTotal.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-purple-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(deferredDetails.originalTotal).toLocaleString()} pts</span>
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h5 className="font-medium text-red-900 mb-2">Montant Final</h5>
                      <div className="text-2xl font-bold text-red-600">
                        {deferredDetails.deferredTotal.toLocaleString()} FCFA
                      </div>
                      <div className="text-sm text-red-600 flex items-center justify-end space-x-1">
                        <Coins className="h-3 w-3" />
                        <span>{convertFCFAToPoints(deferredDetails.deferredTotal).toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Détails des intérêts */}
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h5 className="font-medium text-yellow-900 mb-3 flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Détails des Intérêts</span>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-yellow-700 font-medium">Intérêts Totaux</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {deferredDetails.totalInterest.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-yellow-700 font-medium">Intérêts Quotidiens</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {deferredDetails.dailyInterest.toLocaleString()} FCFA
                        </p>
                      </div>
                      <div>
                        <p className="text-yellow-700 font-medium">Taux Effectif</p>
                        <p className="text-lg font-bold text-yellow-800">
                          {Math.round(((deferredDetails.deferredTotal / deferredDetails.originalTotal) - 1) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Calendrier de paiement */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Échéance de Paiement</h5>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-purple-900">Date Limite</p>
                          <p className="text-sm text-purple-700">Paiement complet requis</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-purple-600">
                            {deferredDetails.finalDate}
                          </div>
                          <div className="text-sm text-purple-600">
                            Dans {deferredDetails.days} jours
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conditions et avertissements */}
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-4">
                  <h5 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Conditions et Avertissements</span>
                  </h5>
                  <ul className="space-y-2 text-sm text-orange-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Intérêts de 15% appliqués après le délai</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Paiement complet requis à l'échéance</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Pas de paiement partiel autorisé</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeferredModal(false)}
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirmDeferred}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <Clock className="h-4 w-4 mr-2" />
                Confirmer le Délai
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Commande */}
      {showOrderModal && (
        <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-3xl font-bold text-orange-600">
                <ShoppingCart className="h-8 w-8" />
                <span>Finaliser votre Commande</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-lg">
                Complétez vos informations et confirmez votre commande
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-8">
              {/* Étapes de la commande */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div key={`order-step-${step}`} className="flex items-center space-x-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      orderStep >= step 
                        ? 'bg-orange-500 text-white shadow-lg scale-110' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {step}
                    </div>
                    {step < 4 && (
                      <div className={`w-16 h-1 rounded-full transition-all duration-300 ${
                        orderStep > step ? 'bg-orange-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Étape 1: Informations de livraison */}
              {orderStep === 1 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-blue-900">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <span>Informations de Livraison</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700">
                            Adresse de livraison *
                          </Label>
                          <Input
                            id="deliveryAddress"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder="123 Rue Principale, Ville, Pays"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
                            Téléphone *
                          </Label>
                          <Input
                            id="customerPhone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+225 0123456789"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerEmail" className="text-sm font-medium text-gray-700">
                          Email *
                        </Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="votre@email.com"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Options de livraison */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Mode de livraison</Label>
                        <RadioGroup value={selectedDeliveryOption} onValueChange={setSelectedDeliveryOption}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="standard" id="standard" />
                              <Label htmlFor="standard" className="cursor-pointer">
                                <div className="font-medium">Livraison Standard</div>
                                <div className="text-sm text-gray-500">3-5 jours ouvrés</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="express" id="express" />
                              <Label htmlFor="express" className="cursor-pointer">
                                <div className="font-medium">Livraison Express</div>
                                <div className="text-sm text-gray-500">1-2 jours ouvrés</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="pickup" id="pickup" />
                              <Label htmlFor="pickup" className="cursor-pointer">
                                <div className="font-medium">Point Relais</div>
                                <div className="text-sm text-gray-500">Retrait en magasin</div>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      {/* Résumé des options de paiement sélectionnées */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                        <h5 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                          <CreditCard className="h-5 w-5 text-orange-600" />
                          <span>Options de Paiement Sélectionnées</span>
                        </h5>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-orange-700">Mode de paiement:</span>
                            <span className="font-medium text-orange-900">
                              {selectedPaymentMethod === 'points' ? 'Paiement avec Points' :
                               selectedPaymentMethod === 'mixed' ? 'Paiement Mixte' :
                               selectedPaymentMethod === 'fcf' ? 'Paiement FCFA' : 'Standard'}
                            </span>
                          </div>
                          
                          {usePoints && (
                            <div className="flex justify-between items-center text-green-700">
                              <span>Points à utiliser:</span>
                              <span className="font-medium">
                                {pointsToUse.toLocaleString()} pts
                              </span>
                            </div>
                          )}
                          
                          {installmentDetails && (
                            <div className="flex justify-between items-center text-blue-700">
                              <span>Paiement fractionné:</span>
                              <span className="font-medium">
                                {installmentPlan} mois - {installmentDetails.monthlyPayment.toLocaleString()} FCFA/mois
                              </span>
                            </div>
                          )}
                          
                          {deferredDetails && (
                            <div className="flex justify-between items-center text-purple-700">
                              <span>Paiement différé:</span>
                              <span className="font-medium">
                                {deferredDays} jours - {deferredDetails.deferredTotal.toLocaleString()} FCFA
                              </span>
                            </div>
                          )}
                          
                          <div className="pt-2 border-t border-orange-200">
                            <div className="flex justify-between items-center font-medium">
                              <span>Total à payer:</span>
                              <span className="text-lg text-orange-600">
                                {finalTotal.toLocaleString()} FCFA
                              </span>
                            </div>
                            <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{finalTotalPoints.toLocaleString()} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Étape 2: Résumé de la commande */}
              {orderStep === 2 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-green-900">
                        <Package className="h-5 w-5 text-green-600" />
                        <span>Résumé de votre Commande</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Articles commandés */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Articles commandés ({cartItems})</h4>
                        {cartItemsData.map((item, index) => (
                          <div key={`order-item-${item.id}-${index}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                <p className="text-sm text-gray-500">Quantité: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {(item.price * item.quantity).toLocaleString()} FCFA
                              </p>
                              <p className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                                <Coins className="h-3 w-3" />
                                <span>{convertFCFAToPoints(item.price * item.quantity).toLocaleString()} pts</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Détails des prix */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Sous-total:</span>
                          <span className="font-medium">{cartTotal.toLocaleString()} FCFA</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center justify-end space-x-1">
                          <Coins className="h-3 w-3" />
                          <span>{cartTotalPoints.toLocaleString()} pts</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Livraison:</span>
                          <span className="font-medium">Gratuite</span>
                        </div>
                        
                        {pointsDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Réduction points:</span>
                            <span className="font-medium">-{pointsDiscount.toLocaleString()} FCFA</span>
                          </div>
                        )}
                        
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span className="text-orange-600">{finalTotal.toLocaleString()} FCFA</span>
                          </div>
                          <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                            <Coins className="h-3 w-3" />
                            <span>{finalTotalPoints.toLocaleString()} pts</span>
                          </div>
                        </div>
                        
                        {/* Informations de paiement sélectionnées */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                              <CreditCard className="h-4 w-4" />
                              <span>Mode de Paiement Sélectionné</span>
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Méthode:</span>
                                <span className="font-medium text-blue-700">
                                  {orderDetails.paymentDetails.method === 'points' ? 'Paiement avec Points' :
                                   orderDetails.paymentDetails.method === 'mixed' ? 'Paiement Mixte' :
                                   orderDetails.paymentDetails.method === 'fcf' ? 'Paiement FCFA' : 'Standard'}
                                </span>
                              </div>
                              
                              {orderDetails.paymentDetails.usePoints && (
                                <div className="flex justify-between text-green-700">
                                  <span>Points utilisés:</span>
                                  <span className="font-medium">
                                    {orderDetails.paymentDetails.pointsUsed.toLocaleString()} pts
                                  </span>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="flex justify-between text-purple-700">
                                  <span>Paiement fractionné:</span>
                                  <span className="font-medium">
                                    {orderDetails.paymentDetails.installmentPlan.months} mois
                                  </span>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="flex justify-between text-orange-700">
                                  <span>Paiement différé:</span>
                                  <span className="font-medium">
                                    {orderDetails.paymentDetails.deferredPlan.days} jours
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Étape 3: Confirmation et paiement */}
              {orderStep === 3 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                        <span>Confirmation et Paiement</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Récapitulatif final */}
                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <h5 className="font-medium text-orange-900 mb-3">Récapitulatif de la commande</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><span className="font-medium">Adresse:</span> {deliveryAddress}</p>
                            <p><span className="font-medium">Téléphone:</span> {customerPhone}</p>
                            <p><span className="font-medium">Email:</span> {customerEmail}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Livraison:</span> {selectedDeliveryOption}</p>
                            <p><span className="font-medium">Paiement:</span> {selectedPaymentMethod}</p>
                            <p><span className="font-medium">Total:</span> {finalTotal.toLocaleString()} FCFA</p>
                            <p className="text-yellow-600 flex items-center space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{finalTotalPoints.toLocaleString()} pts</span>
                            </p>
                          </div>
                        </div>
                        
                        {/* Détails du plan de paiement sélectionné */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-4 pt-4 border-t border-orange-200">
                            <h6 className="font-medium text-orange-800 mb-2">Plan de Paiement</h6>
                            <div className="space-y-2 text-sm">
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  <div className="flex items-center space-x-2 text-blue-700">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-medium">Paiement Fractionné</span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                                    <div>
                                      <span className="text-blue-600">Mensualité:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.monthlyPayment.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Durée:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.months} mois</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <div className="flex items-center space-x-2 text-purple-700">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Paiement Différé</span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                                    <div>
                                      <span className="text-blue-600">Montant final:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.finalTotal.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-blue-600">Délai:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.days} jours</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.usePoints && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center space-x-2 text-green-700">
                                    <Coins className="h-4 w-4" />
                                    <span className="font-medium">Points Utilisés</span>
                                  </div>
                                  <div className="mt-2 text-xs">
                                    <div className="mb-1">
                                      <span className="text-green-600">Points appliqués:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.pointsUsed.toLocaleString()} pts</div>
                                    </div>
                                    <div>
                                      <span className="text-green-600">Économies:</span>
                                      <div className="font-bold">-{orderDetails.paymentDetails.pointsDiscount.toLocaleString()} FCFA</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Méthodes de paiement */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Méthode de paiement</Label>
                        <RadioGroup value={selectedPaymentOption} onValueChange={setSelectedPaymentOption}>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="mobile_money" id="mobile_money" />
                              <Label htmlFor="mobile_money" className="cursor-pointer">
                                <div className="font-medium">Mobile Money</div>
                                <div className="text-sm text-gray-500">Moov, MTN, Orange</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="card" id="card" />
                              <Label htmlFor="card" className="cursor-pointer">
                                <div className="font-medium">Carte Bancaire</div>
                                <div className="text-sm text-gray-500">Visa, Mastercard</div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 cursor-pointer">
                              <RadioGroupItem value="cash" id="cash" />
                              <Label htmlFor="cash" className="cursor-pointer">
                                <div className="font-medium">Paiement à la livraison</div>
                                <div className="text-sm text-gray-500">Espèces ou carte</div>
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Conditions et sécurité */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Sécurité et Conditions</p>
                            <ul className="space-y-1 text-xs">
                              <li>• Vos données sont protégées et chiffrées</li>
                              <li>• Aucun prélèvement avant validation</li>
                              <li>• Droit de rétractation de 14 jours</li>
                              <li>• Support client disponible 24/7</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Étape 4: Récapitulatif final et validation */}
              {orderStep === 4 && (
                <div className="space-y-6">
                  <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-xl font-bold text-green-900">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span>Validation Finale de la Commande</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Résumé complet de la commande */}
                      <div className="bg-white p-6 rounded-lg border border-green-200">
                        <h5 className="font-medium text-green-900 mb-4 text-lg">Récapitulatif Complet</h5>
                        
                        {/* Informations de livraison */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h6 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
                            <Truck className="h-4 w-4" />
                            <span>Informations de Livraison</span>
                          </h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><span className="font-medium">Adresse:</span> {deliveryAddress}</p>
                              <p><span className="font-medium">Téléphone:</span> {customerPhone}</p>
                              <p><span className="font-medium">Email:</span> {customerEmail}</p>
                            </div>
                            <div>
                              <p><span className="font-medium">Mode:</span> {selectedDeliveryOption}</p>
                              <p><span className="font-medium">Délai estimé:</span> 
                                {selectedDeliveryOption === 'express' ? '1-2 jours' : 
                                 selectedDeliveryOption === 'pickup' ? 'Immédiat' : '3-5 jours'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Résumé des articles */}
                        <div className="mb-6">
                          <h6 className="font-medium text-green-900 mb-3">Articles Commandés</h6>
                          <div className="space-y-2">
                            {cartItemsData.map((item, index) => (
                              <div key={`final-order-item-${item.id}-${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{item.name} x{item.quantity}</span>
                                <span className="font-medium text-sm">
                                  {(item.price * item.quantity).toLocaleString()} FCFA
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Détails financiers */}
                        <div className="border-t pt-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Sous-total:</span>
                              <span className="font-medium">{cartTotal.toLocaleString()} FCFA</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                              <Coins className="h-3 w-3" />
                              <span>{cartTotalPoints.toLocaleString()} pts</span>
                            </div>
                            
                            {pointsDiscount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Réduction points:</span>
                                <span className="font-medium">-{pointsDiscount.toLocaleString()} FCFA</span>
                              </div>
                            )}
                            
                            <div className="border-t pt-2">
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total Final:</span>
                                <span className="text-green-600">{finalTotal.toLocaleString()} FCFA</span>
                              </div>
                              <div className="text-sm text-yellow-600 flex items-center justify-end space-x-1">
                                <Coins className="h-3 w-3" />
                                <span>{finalTotalPoints.toLocaleString()} pts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Détails du plan de paiement sélectionné */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-4 pt-4 border-t border-green-200">
                            <h6 className="font-medium text-green-900 mb-3">Plan de Paiement Sélectionné</h6>
                            <div className="space-y-3">
                              {/* Mode de paiement */}
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-2 text-blue-700 mb-2">
                                  <CreditCard className="h-4 w-4" />
                                  <span className="font-medium">Mode de Paiement</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-blue-600">Type:</span>
                                  <span className="font-medium ml-2">
                                    {orderDetails.paymentDetails.method === 'points' ? 'Paiement avec Points' :
                                     orderDetails.paymentDetails.method === 'mixed' ? 'Paiement Mixte' :
                                     orderDetails.paymentDetails.method === 'fcf' ? 'Paiement FCFA' : 'Standard'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Paiement fractionné */}
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <div className="flex items-center space-x-2 text-purple-700 mb-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="font-medium">Paiement Fractionné</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-purple-600">Mensualité:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.monthlyPayment.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-purple-600">Durée:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.installmentPlan.months} mois</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Paiement différé */}
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                  <div className="flex items-center space-x-2 text-orange-700 mb-2">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Paiement Différé</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-orange-600">Montant final:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.finalTotal.toLocaleString()} FCFA</div>
                                    </div>
                                    <div>
                                      <span className="text-orange-600">Délai:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.deferredPlan.days} jours</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Points utilisés */}
                              {orderDetails.paymentDetails.usePoints && (
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                  <div className="flex items-center space-x-2 text-green-700 mb-2">
                                    <Coins className="h-4 w-4" />
                                    <span className="font-medium">Points Utilisés</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="text-green-600">Points appliqués:</span>
                                      <div className="font-bold">{orderDetails.paymentDetails.pointsUsed.toLocaleString()} pts</div>
                                    </div>
                                    <div>
                                      <span className="text-green-600">Économies:</span>
                                      <div className="font-bold">-{orderDetails.paymentDetails.pointsDiscount.toLocaleString()} FCFA</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                                              {/* Calcul final du montant à payer */}
                        {orderDetails?.paymentDetails && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                            <h6 className="font-medium text-orange-900 mb-3 flex items-center space-x-2">
                              <Calculator className="h-4 w-4" />
                              <span>Calcul Final du Paiement</span>
                            </h6>
                            <div className="space-y-3">
                              {orderDetails.paymentDetails.installmentPlan && (
                                <div className="bg-white p-3 rounded-lg border border-orange-200">
                                  <div className="text-center">
                                    <p className="text-sm text-orange-700 mb-2">Montant de la 1ère mensualité</p>
                                    <div className="text-2xl font-bold text-orange-600">
                                      {orderDetails.paymentDetails.installmentPlan.monthlyPayment.toLocaleString()} FCFA
                                    </div>
                                    <div className="text-sm text-yellow-600 flex items-center justify-center space-x-1 mt-1">
                                      <Coins className="h-3 w-3" />
                                      <span>{convertFCFAToPoints(orderDetails.paymentDetails.installmentPlan.monthlyPayment).toLocaleString()} pts</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                      Puis {orderDetails.paymentDetails.installmentPlan.months - 1} mensualités de même montant
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-white p-3 rounded-lg border border-orange-200">
                                  <div className="text-center">
                                    <p className="text-sm text-orange-700 mb-2">Montant à payer dans {orderDetails.paymentDetails.deferredPlan.days} jours</p>
                                    <div className="text-2xl font-bold text-orange-600">
                                      {orderDetails.paymentDetails.deferredPlan.finalTotal.toLocaleString()} FCFA
                                    </div>
                                    <div className="text-sm text-yellow-600 flex items-center justify-center space-x-1 mt-1">
                                      <Coins className="h-3 w-3" />
                                      <span>{convertFCFAToPoints(orderDetails.paymentDetails.deferredPlan.finalTotal).toLocaleString()} pts</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                      Intérêts: +{orderDetails.paymentDetails.deferredPlan.interest.toLocaleString()} FCFA
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {orderDetails.paymentDetails.usePoints && !orderDetails.paymentDetails.installmentPlan && !orderDetails.paymentDetails.deferredPlan && (
                                <div className="bg-white p-3 rounded-lg border border-orange-200">
                                  <div className="text-center">
                                    <p className="text-sm text-orange-700 mb-2">Montant final à payer</p>
                                    <div className="text-2xl font-bold text-orange-600">
                                      {orderDetails.paymentDetails.finalTotal.toLocaleString()} FCFA
                                    </div>
                                    <div className="text-sm text-yellow-600 flex items-center justify-center space-x-1 mt-1">
                                      <Coins className="h-3 w-3" />
                                      <span>{convertFCFAToPoints(orderDetails.paymentDetails.finalTotal).toLocaleString()} pts</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2">
                                      Après application de {orderDetails.paymentDetails.pointsUsed.toLocaleString()} points
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Avertissement final */}
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                              <p className="font-medium mb-1">Important</p>
                              <p>En confirmant cette commande, vous acceptez les conditions de vente et de livraison. 
                              Aucun prélèvement ne sera effectué avant la validation de votre commande.</p>
                            </div>
                          </div>
                        </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation entre étapes */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setOrderStep(Math.max(1, orderStep - 1))}
                  disabled={orderStep === 1}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                
                <div className="flex space-x-3">
                  {orderStep < 4 ? (
                    <Button
                      onClick={() => setOrderStep(orderStep + 1)}
                      className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      Suivant
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinalizePayment}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg font-semibold transform hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmer la Commande
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal des Codes Promo */}
      <Dialog open={showPromoModal} onOpenChange={setShowPromoModal}>
        <DialogContent className="max-w-md max-h-[98vh] bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-2xl overflow-hidden">
          {/* En-tête fixe */}
          <DialogHeader className="text-center pb-3 border-b border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="relative mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Gift className="h-7 w-7 text-white animate-bounce" />
              </div>
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-full animate-ping"></div>
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Codes Promo
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Entrez votre code promo pour bénéficier de réductions exclusives
            </DialogDescription>
          </DialogHeader>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4 max-h-[calc(98vh-140px)]">
            {/* Saisie du code promo */}
            <div className="space-y-3">
              <Label htmlFor="promoCode" className="text-sm font-medium text-gray-700">
                Code promo
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="promoCode"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Ex: WELCOME20"
                  className="flex-1 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <Button
                  onClick={handleApplyPromo}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 transform hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Message d'erreur */}
              {promoError && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{promoError}</span>
                </div>
              )}
            </div>

            {/* Codes promo disponibles */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 text-center text-sm">Codes disponibles</h4>
              <div className="grid grid-cols-2 gap-2">
                <Card className="border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-2 text-center">
                    <div className="text-base font-bold text-purple-600">WELCOME20</div>
                    <div className="text-xs text-gray-600">-20% sur 50k+ FCFA</div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-2 text-center">
                    <div className="text-base font-bold text-purple-600">SAVE15</div>
                    <div className="text-xs text-gray-600">-15% sur 30k+ FCFA</div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-2 text-center">
                    <div className="text-base font-bold text-purple-600">FLASH50</div>
                    <div className="text-xs text-gray-600">-5000 FCFA sur 10k+</div>
                  </CardContent>
                </Card>
                <Card className="border-purple-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
                  <CardContent className="p-2 text-center">
                    <div className="text-base font-bold text-purple-600">NEWUSER</div>
                    <div className="text-xs text-gray-600">-25% sur 20k+ FCFA</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="text-xs text-purple-800">
                  <p className="font-medium mb-1">Comment ça marche ?</p>
                  <ul className="space-y-1">
                    <li>• Entrez votre code promo dans le champ ci-dessus</li>
                    <li>• La réduction sera automatiquement appliquée</li>
                    <li>• Un seul code promo par commande</li>
                    <li>• Les codes sont valides sur les montants minimums indiqués</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pied de page fixe avec bouton fermer */}
          <div className="border-t border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 px-6 py-4">
            <Button
              onClick={() => setShowPromoModal(false)}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Gestion des Livraisons */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* En-tête du modal */}
          <DialogHeader className="text-center pb-4 border-b border-orange-200">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                <Truck className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  Gestion des Livraisons
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Configurez votre adresse et choisissez vos options de livraison
                </DialogDescription>
              </div>
            </div>
            
            {/* Étapes de livraison */}
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={`delivery-step-${step}`} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    deliveryStep >= step 
                      ? 'bg-orange-500 text-white shadow-lg scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 rounded-full transition-all duration-300 ${
                      deliveryStep > step ? 'bg-orange-500' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </DialogHeader>

          {/* Contenu du modal */}
          <div className="flex-1 overflow-y-auto px-6 py-4 max-h-[60vh]">
            {/* Étape 1: Adresse de livraison */}
            {deliveryStep === 1 && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <span>Adresse de Livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700">
                          Adresse complète *
                        </Label>
                        <Input
                          id="deliveryAddress"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="123 Rue Principale, Quartier"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryCity" className="text-sm font-medium text-gray-700">
                          Ville *
                        </Label>
                        <Input
                          id="deliveryCity"
                          value={deliveryCity}
                          onChange={(e) => setDeliveryCity(e.target.value)}
                          placeholder="Abidjan"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryPostalCode" className="text-sm font-medium text-gray-700">
                          Code postal
                        </Label>
                        <Input
                          id="deliveryPostalCode"
                          value={deliveryPostalCode}
                          onChange={(e) => setDeliveryPostalCode(e.target.value)}
                          placeholder="225"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryCountry" className="text-sm font-medium text-gray-700">
                          Pays
                        </Label>
                        <Input
                          id="deliveryCountry"
                          value={deliveryCountry}
                          onChange={(e) => setDeliveryCountry(e.target.value)}
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deliveryPhone" className="text-sm font-medium text-gray-700">
                          Téléphone *
                        </Label>
                        <Input
                          id="deliveryPhone"
                          value={deliveryPhone}
                          onChange={(e) => setDeliveryPhone(e.target.value)}
                          placeholder="+225 0123456789"
                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deliveryInstructions" className="text-sm font-medium text-gray-700">
                        Instructions de livraison
                      </Label>
                      <Input
                        id="deliveryInstructions"
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="Code d'accès, étage, repères..."
                        className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Étape 2: Mode de livraison */}
            {deliveryStep === 2 && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                      <Truck className="h-5 w-5 text-orange-600" />
                      <span>Mode de Livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Livraison Standard */}
                      <Card 
                        className={`border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          selectedDeliveryMethod === 'standard' 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => handleDeliveryMethodChange('standard')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Truck className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Livraison Standard</h4>
                          <p className="text-sm text-gray-600 mb-2">3-5 jours ouvrés</p>
                          <p className="text-lg font-bold text-green-600">Gratuite</p>
                          <p className="text-xs text-gray-500">Commande &gt; 25.000 FCFA</p>
                        </CardContent>
                      </Card>

                      {/* Livraison Express */}
                      <Card 
                        className={`border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          selectedDeliveryMethod === 'express' 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => handleDeliveryMethodChange('express')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Livraison Express</h4>
                          <p className="text-sm text-gray-600 mb-2">1-2 jours ouvrés</p>
                          <p className="text-lg font-bold text-orange-600">5.000 FCFA</p>
                          <p className="text-xs text-gray-500">Livraison prioritaire</p>
                        </CardContent>
                      </Card>

                      {/* Livraison Premium */}
                      <Card 
                        className={`border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          selectedDeliveryMethod === 'premium' 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => handleDeliveryMethodChange('premium')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Crown className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Livraison Premium</h4>
                          <p className="text-sm text-gray-600 mb-2">2-3 jours ouvrés</p>
                          <p className="text-lg font-bold text-purple-600">6.000 FCFA</p>
                          <p className="text-xs text-gray-500">Service premium</p>
                        </CardContent>
                      </Card>

                      {/* Livraison Programmée */}
                      <Card 
                        className={`border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          selectedDeliveryMethod === 'scheduled' 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => handleDeliveryMethodChange('scheduled')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">Livraison Programmée</h4>
                          <p className="text-sm text-gray-600 mb-2">Date choisie par vous</p>
                          <p className="text-lg font-bold text-blue-600">3.000 FCFA</p>
                          <p className="text-xs text-gray-500">Flexibilité maximale</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Résumé du mode sélectionné */}
                    {selectedDeliveryMethod && (
                      <Card className="bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-orange-900">
                                Mode sélectionné: {selectedDeliveryMethod === 'standard' ? 'Standard' : 
                                                  selectedDeliveryMethod === 'express' ? 'Express' :
                                                  selectedDeliveryMethod === 'premium' ? 'Premium' : 'Programmée'}
                              </h5>
                              <p className="text-sm text-orange-700">
                                Délai: {getDeliveryTime(selectedDeliveryMethod)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-orange-600">
                                {calculateDeliveryCost(selectedDeliveryMethod).toLocaleString()} FCFA
                              </div>
                              <div className="text-sm text-orange-600">
                                {convertFCFAToPoints(calculateDeliveryCost(selectedDeliveryMethod)).toLocaleString()} pts
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Étape 3: Calendrier de livraison */}
            {deliveryStep === 3 && (
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-xl font-bold text-orange-900">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <span>Calendrier de Livraison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sélecteur de date */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Date de livraison préférée
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="preferredDeliveryDate" className="text-sm font-medium text-gray-700">
                            Date
                          </Label>
                          <Input
                            id="preferredDeliveryDate"
                            type="date"
                            value={preferredDeliveryDate}
                            onChange={(e) => setPreferredDeliveryDate(e.target.value)}
                            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryTimeSlot" className="text-sm font-medium text-gray-700">
                            Créneau horaire
                          </Label>
                          <Select value={deliveryTimeSlot} onValueChange={setDeliveryTimeSlot}>
                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Choisir un créneau" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="09:00-12:00">Matin (09:00-12:00)</SelectItem>
                              <SelectItem value="14:00-17:00">Après-midi (14:00-17:00)</SelectItem>
                              <SelectItem value="18:00-21:00">Soirée (18:00-21:00)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Calendrier dynamique */}
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Dates disponibles (30 prochains jours)</h5>
                      <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                        {generateDeliveryCalendar().map((day, index) => (
                          <div
                            key={`delivery-day-${day.date.toISOString().split('T')[0]}-${index}`}
                            className={`p-2 text-center rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                              preferredDeliveryDate === day.date.toISOString().split('T')[0]
                                ? 'border-orange-500 bg-orange-100 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                            onClick={() => setPreferredDeliveryDate(day.date.toISOString().split('T')[0])}
                          >
                            <div className="text-xs font-medium">{day.date.getDate()}</div>
                            <div className="text-xs text-gray-500">{day.date.toLocaleDateString('fr-FR', { month: 'short' })}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Résumé final */}
                    <Card className="bg-gradient-to-r from-orange-100 to-yellow-100 border-orange-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <h5 className="font-medium text-orange-900">Résumé de votre livraison</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Mode: <span className="font-medium text-orange-700">
                                {selectedDeliveryMethod === 'standard' ? 'Standard' : 
                                 selectedDeliveryMethod === 'express' ? 'Express' :
                                 selectedDeliveryMethod === 'premium' ? 'Premium' : 'Programmée'}
                              </span></p>
                              <p className="text-gray-700">Délai: <span className="font-medium text-orange-700">
                                {getDeliveryTime(selectedDeliveryMethod)}
                              </span></p>
                              <p className="text-gray-600">Coût: <span className="font-medium text-orange-700">
                                {calculateDeliveryCost(selectedDeliveryMethod).toLocaleString()} FCFA
                              </span></p>
                            </div>
                            <div>
                              <p className="text-gray-600">Date: <span className="font-medium text-orange-700">
                                {preferredDeliveryDate ? new Date(preferredDeliveryDate).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric' 
                                }) : 'Non définie'}
                              </span></p>
                              <p className="text-gray-600">Créneau: <span className="font-medium text-orange-700">
                                {deliveryTimeSlot || 'Non défini'}
                              </span></p>
                              <p className="text-gray-600">Total: <span className="font-medium text-orange-700">
                                {(finalTotalWithPromo + calculateDeliveryCost(selectedDeliveryMethod)).toLocaleString()} FCFA
                              </span></p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Navigation entre étapes */}
          <div className="flex justify-between pt-6 border-t border-orange-200 bg-white sticky bottom-0">
            <Button
              variant="outline"
              onClick={() => setDeliveryStep(Math.max(1, deliveryStep - 1))}
              disabled={deliveryStep === 1}
              className="px-6 py-2 border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            
            <div className="flex space-x-3">
              {deliveryStep < 3 ? (
                <Button
                  onClick={() => setDeliveryStep(deliveryStep + 1)}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white transform hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    showSuccess('Configuration de livraison enregistrée !')
                    setShowDeliveryModal(false)
                    setDeliveryStep(1)
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-lg font-semibold transform hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirmer la Livraison
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}


