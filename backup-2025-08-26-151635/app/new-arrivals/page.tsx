"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Grid, List, Search, Star, Heart, ShoppingCart, Clock, Sparkles, TrendingUp, Gift, ArrowRight, Zap, Calendar, Flame, X, CheckCircle, Bell, Smartphone, MessageCircle, Mail, Phone, Globe, Settings, Shield, Users, Target, Award } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import ShareButtons from "@/components/product/share-buttons"
import ProductModal from "@/components/product/product-modal"
import NewArrivalsSection from "@/components/product/new-arrivals-section"
// Import supprimé - remplacé par le nouveau système de chat global

export default function NewArrivalsPage() {
  const router = useRouter()
  // Hook supprimé - remplacé par le nouveau système de chat global
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [notificationPreferences, setNotificationPreferences] = useState({
    whatsapp: true,
    email: false,
    sms: false,
    push: false
  })
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fonction pour ouvrir le modal de fiche produit
  const handleOpenProductModal = (product: any) => {
    console.log("handleOpenProductModal appelé avec:", product);
    setSelectedProduct(product);
    setIsModalOpen(true);
    console.log("Modal ouvert:", product ? "oui" : "non");
  };

  const newArrivals = [
    {
      id: "1",
      name: "iPhone 16 Pro Max 512GB",
      price: 1450000,
      pointsPrice: 14500,
      originalPrice: 1600000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.9,
      reviews: 23,
      seller: "Apple Store Official",
      shareData: { facebook: 12, twitter: 8, whatsapp: 19, instagram: 15 },
      discount: 9,
      daysAgo: 1,
      isNew: true,
      isHot: true,
      isLimited: false,
      sharePoints: 120,
      badges: ["🆕 Nouveau", "🔥 Bestseller", "⚡ Livraison Express"],
      color: "from-blue-500 to-purple-600",
    },
    {
      id: "2",
      name: "Samsung Galaxy Z Fold 6",
      price: 1800000,
      pointsPrice: 18000,
      originalPrice: 2000000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      reviews: 18,
      seller: "Samsung Premium",
      shareData: { facebook: 8, twitter: 5, whatsapp: 14, instagram: 11 },
      discount: 10,
      daysAgo: 2,
      isNew: true,
      isHot: true,
      isLimited: false,
      sharePoints: 100,
      badges: ["🆕 Nouveau", "📱 Smartphone Pro", "⚡ Livraison Express"],
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "3",
      name: "MacBook Air M3 15 pouces",
      price: 1650000,
      pointsPrice: 16500,
      originalPrice: 1800000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.8,
      reviews: 31,
      seller: "Tech Innovation",
      shareData: { facebook: 15, twitter: 9, whatsapp: 22, instagram: 18 },
      discount: 8,
      daysAgo: 3,
      isNew: true,
      isHot: false,
      isLimited: false,
      sharePoints: 90,
      badges: ["🆕 Nouveau", "💻 Laptop Pro", "⚡ Livraison Express"],
      color: "from-orange-500 to-red-600",
    },
    {
      id: "4",
      name: "PlayStation 5 Pro",
      price: 850000,
      pointsPrice: 8500,
      originalPrice: 950000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.6,
      reviews: 45,
      seller: "Gaming Paradise",
      shareData: { facebook: 28, twitter: 16, whatsapp: 35, instagram: 24 },
      discount: 11,
      daysAgo: 5,
      isNew: true,
      isHot: true,
      isLimited: true,
      sharePoints: 80,
      badges: ["🆕 Nouveau", "🎮 Gaming Pro", "⏰ Offre Limitée"],
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "5",
      name: "Tesla Model Y Accessories Kit",
      price: 450000,
      pointsPrice: 4500,
      originalPrice: 520000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.5,
      reviews: 12,
      seller: "Auto Premium",
      shareData: { facebook: 6, twitter: 3, whatsapp: 11, instagram: 8 },
      discount: 13,
      daysAgo: 4,
      isNew: true,
      isHot: false,
      isLimited: false,
      sharePoints: 70,
      badges: ["🆕 Nouveau", "🚗 Auto Pro", "⚡ Livraison Express"],
      color: "from-red-500 to-pink-600",
    },
    {
      id: "6",
      name: "Dyson V15 Detect Absolute",
      price: 680000,
      pointsPrice: 6800,
      originalPrice: 750000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      reviews: 27,
      seller: "Home & Living",
      shareData: { facebook: 18, twitter: 11, whatsapp: 26, instagram: 19 },
      discount: 9,
      daysAgo: 6,
      isNew: true,
      isHot: false,
      isLimited: false,
      sharePoints: 60,
      badges: ["🆕 Nouveau", "🏠 Home Pro", "⚡ Livraison Express"],
      color: "from-teal-500 to-cyan-600",
    },
  ]

  const categories = [
    { id: "tech", name: "Technologie", icon: "💻", color: "from-blue-500 to-purple-600" },
    { id: "fashion", name: "Mode", icon: "👗", color: "from-pink-500 to-red-500" },
    { id: "home", name: "Maison", icon: "🏠", color: "from-green-500 to-emerald-600" },
    { id: "sports", name: "Sport", icon: "⚽", color: "from-orange-500 to-red-600" },
    { id: "beauty", name: "Beauté", icon: "💄", color: "from-purple-500 to-pink-600" },
    { id: "gaming", name: "Gaming", icon: "🎮", color: "from-indigo-500 to-purple-600" },
  ]

  const upcomingEvents = [
    {
      id: "1",
      title: "Black Friday Tech",
      date: "2024-11-29",
      time: "09:00",
      category: "tech",
      description: "Énormes réductions sur tous les produits tech",
      discount: "Jusqu'à -70%",
      status: "upcoming"
    },
    {
      id: "2",
      title: "Nouveautés iPhone",
      date: "2024-12-15",
      time: "14:00",
      category: "tech",
      description: "Lancement des nouveaux iPhone 16",
      discount: "Pré-commande exclusive",
      status: "announced"
    },
    {
      id: "3",
      title: "Collection Hiver",
      date: "2024-12-01",
      time: "10:00",
      category: "fashion",
      description: "Nouvelle collection mode hiver",
      discount: "Jusqu'à -50%",
      status: "upcoming"
    },
    {
      id: "4",
      title: "Gaming Week",
      date: "2024-12-20",
      time: "16:00",
      category: "gaming",
      description: "Semaine spéciale gaming avec PS5 Pro",
      discount: "Édition limitée",
      status: "announced"
    }
  ]

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleNotificationToggle = (type: keyof typeof notificationPreferences) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleSubmitAlerts = () => {
    // Simulation d'envoi
    console.log("Alertes configurées:", { phoneNumber, email, selectedCategories, notificationPreferences })
    setShowAlertsModal(false)
    // Reset form
    setPhoneNumber("")
    setEmail("")
    setSelectedCategories([])
  }

  const handleProductClick = (product: any) => {
    // Convertir le produit simple en produit complet pour le modal
    const fullProduct = {
      ...product,
      images: [product.image, product.image, product.image, product.image], // Images multiples
      seller: {
        name: product.seller || 'Vendeur Probooster',
        avatar: "/placeholder-user.jpg",
        rating: product.rating,
        totalSales: Math.floor(Math.random() * 1000) + 100,
        responseTime: "2-4h",
        location: "Abomey-Calavi, Bénin",
        phone: "+225 07 " + Math.floor(Math.random() * 90 + 10) + " " + Math.floor(Math.random() * 90 + 10) + " " + Math.floor(Math.random() * 90 + 10),
        email: "contact@" + (product.seller || 'vendeur').toLowerCase().replace(/\s+/g, '') + ".com"
      },
      description: `Découvrez ${product.name}, un produit exceptionnel avec des fonctionnalités avancées et une qualité premium. Idéal pour tous vos besoins quotidiens.`,
      specifications: {
        "Marque": "Probooster",
        "Modèle": product.name,
        "Garantie": "1 an",
        "Origine": "Abomey-Calavi, Bénin",
        "Ajouté il y a": `${product.daysAgo} jour${product.daysAgo > 1 ? 's' : ''}`
      },
      features: [
        "Qualité premium",
        "Garantie officielle",
        "Livraison rapide",
        "Support client 24/7"
      ],
      warranty: "1 an",
      shipping: {
        cost: 5000,
        time: "2-3 jours",
        method: "Express"
      },
      stock: product.isNew ? Math.floor(Math.random() * 50) + 10 : 0,
      category: "Électronique",
      tags: ["Premium", "Garantie", "Livraison rapide"],
      relatedProducts: []
    }
    
    setSelectedProduct(fullProduct)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-4 animate-fade-in-up">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">Probooster</span>
            <Sparkles className="h-5 w-5 animate-pulse delay-300" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200">
            <span className="text-[#ff6600] animate-pulse">Nouveautés</span> Exclusives
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Découvrez les derniers produits ajoutés à notre marketplace avec des offres exclusives
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 animate-fade-in-up animation-delay-600">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-hover:text-[#ff6600] transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Rechercher dans les nouveautés..."
                className="pl-10 border-2 focus:border-[#ff6600] transition-all duration-300 hover:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select defaultValue="newest">
              <SelectTrigger className="w-48 border-2 hover:border-[#ff6600] transition-all duration-300">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Plus récent</SelectItem>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="price-low">Prix croissant</SelectItem>
                <SelectItem value="price-high">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border-2 rounded-lg overflow-hidden hover:border-[#ff6600] transition-all duration-300">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`rounded-r-none transition-all duration-300 ${
                  viewMode === "grid" ? "bg-[#ff6600] text-white" : "hover:bg-orange-50"
                }`}
              >
                <Grid className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={`rounded-l-none transition-all duration-300 ${
                  viewMode === "list" ? "bg-[#ff6600] text-white" : "hover:bg-orange-50"
                }`}
              >
                <List className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>

        {/* Section Nouveautés avec cartes avancées */}
        <NewArrivalsSection 
          onProductClick={handleOpenProductModal}
          onStartChat={(product) => {
            openChatWidget(product, { name: product.seller, id: product.seller.toLowerCase().replace(/\s+/g, '-') })
          }}
          onCompare={(product) => {
            // Cette fonction sera gérée par NewArrivalsSection elle-même
            // car elle a déjà sa propre logique de comparaison
          }}
        />

        {/* Coming Soon Section */}
        <div className="mt-20 animate-fade-in-up animation-delay-600">
          <div className="relative overflow-hidden">
            {/* Background with animated elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-[#ff6600] to-orange-600 opacity-10"></div>
            <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-yellow-400 to-[#ff6600] rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full opacity-20 animate-bounce" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full opacity-20 animate-ping"></div>
            <div className="absolute bottom-20 right-1/3 w-8 h-8 bg-gradient-to-r from-orange-500 to-[#ff8533] rounded-full opacity-20 animate-spin" style={{ animationDuration: '3s' }}></div>

            {/* Main Content */}
            <div className="relative bg-gradient-to-r from-[#ff6600]/90 via-orange-500/90 to-[#ff8533]/90 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 backdrop-blur-sm">
              <div className="text-center max-w-4xl mx-auto">
                {/* Animated Rocket Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                      <div className="w-16 h-16 bg-gradient-to-r from-white to-gray-100 rounded-full flex items-center justify-center">
                        <div className="relative">
                          {/* Rocket Body */}
                          <div className="w-8 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-full relative">
                            {/* Rocket Fins */}
                            <div className="absolute -bottom-2 -left-1 w-2 h-3 bg-red-500 rounded-br-full"></div>
                            <div className="absolute -bottom-2 -right-1 w-2 h-3 bg-red-500 rounded-bl-full"></div>
                            {/* Rocket Window */}
                            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
                            {/* Rocket Flame */}
                            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                              <div className="w-2 h-6 bg-gradient-to-t from-orange-500 via-red-500 to-yellow-400 rounded-b-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Floating Sparkles */}
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-ping" />
                    </div>
                    <div className="absolute -bottom-2 -left-2">
                      <Sparkles className="h-5 w-5 text-orange-300 animate-ping" style={{ animationDelay: '0.5s' }} />
                    </div>
                  </div>
                </div>

                {/* Main Title */}
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    Bientôt Disponible
                  </span>
                </h2>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-fade-in-up animation-delay-200">
                  Ne manquez pas nos prochains arrivages exceptionnels !
                </p>

                                 {/* Features Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                   <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 group hover:bg-white/20 transition-all duration-300">
                     <div className="flex items-center justify-center mb-3">
                       <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-[#ff6600] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                         <Zap className="h-5 w-5 text-white" />
                       </div>
                     </div>
                     <h3 className="text-white font-semibold text-center mb-2">Produits Exclusifs</h3>
                     <p className="text-white/80 text-sm text-center">Accès en avant-première aux nouveautés</p>
                   </div>

                   <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 group hover:bg-white/20 transition-all duration-300">
                     <div className="flex items-center justify-center mb-3">
                       <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                         <Gift className="h-5 w-5 text-white" />
                       </div>
                     </div>
                     <h3 className="text-white font-semibold text-center mb-2">Offres Spéciales</h3>
                     <p className="text-white/80 text-sm text-center">Réductions exclusives pour les alertes</p>
                   </div>

                   <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 group hover:bg-white/20 transition-all duration-300">
                     <div className="flex items-center justify-center mb-3">
                       <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-[#ff8533] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                         <Clock className="h-5 w-5 text-white" />
                       </div>
                     </div>
                     <h3 className="text-white font-semibold text-center mb-2">Notifications Instantanées</h3>
                     <p className="text-white/80 text-sm text-center">Soyez les premiers informés</p>
                   </div>
                 </div>

                                 {/* Call to Action */}
                 <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                   <div className="relative group">
                     <Button 
                       size="lg" 
                       className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group-hover:animate-pulse"
                       onClick={() => setShowAlertsModal(true)}
                     >
                       <div className="flex items-center space-x-3">
                         <div className="w-6 h-6 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center">
                           <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                         </div>
                         <span>Recevoir les alertes</span>
                         <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                       </div>
                     </Button>
                   </div>

                   <Button 
                     variant="outline" 
                     size="lg"
                     className="bg-white text-black border-[#ff6600] hover:bg-[#ff6600]/10 hover:border-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                     onClick={() => setShowCalendarModal(true)}
                   >
                     <div className="flex items-center space-x-3">
                       <Calendar className="h-5 w-5 text-[#ff6600] group-hover:text-black group-hover:animate-bounce" />
                       <span>Voir le calendrier</span>
                     </div>
                   </Button>
                 </div>

                {/* Additional Info */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full">
                    <Flame className="h-4 w-4 animate-pulse" />
                    <span className="text-sm font-medium">Plus de 50,000 personnes déjà inscrites</span>
                    <Flame className="h-4 w-4 animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
              </div>
            </div>
                     </div>
         </div>

         {/* Alerts Modal */}
         <Dialog open={showAlertsModal} onOpenChange={setShowAlertsModal}>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="flex items-center space-x-3 text-2xl">
                 <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center">
                   <Bell className="h-5 w-5 text-white" />
                 </div>
                 <span>Configurer les Alertes WhatsApp</span>
               </DialogTitle>
             </DialogHeader>

             <div className="space-y-6">
               {/* Contact Information */}
               <Card className="border-0 shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Smartphone className="h-5 w-5 text-[#ff6600]" />
                     <span>Informations de Contact</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="phone" className="text-sm font-medium">Numéro WhatsApp</Label>
                       <div className="relative">
                         <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                         <Input
                           id="phone"
                           type="tel"
                           placeholder="+229 91 50 57 57"
                           value={phoneNumber}
                           onChange={(e) => setPhoneNumber(e.target.value)}
                           className="pl-10"
                         />
                       </div>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="email" className="text-sm font-medium">Email (optionnel)</Label>
                       <div className="relative">
                         <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                         <Input
                           id="email"
                           type="email"
                           placeholder="votre@email.com"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           className="pl-10"
                         />
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Categories Selection */}
               <Card className="border-0 shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Target className="h-5 w-5 text-[#ff6600]" />
                     <span>Catégories d'Intérêt</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {categories.map((category) => (
                       <div
                         key={category.id}
                         className={`relative cursor-pointer group transition-all duration-300 ${
                           selectedCategories.includes(category.id)
                             ? 'ring-2 ring-[#ff6600] ring-offset-2'
                             : 'hover:scale-105'
                         }`}
                         onClick={() => handleCategoryToggle(category.id)}
                       >
                         <Card className={`border-0 transition-all duration-300 ${
                           selectedCategories.includes(category.id)
                             ? 'bg-gradient-to-r from-[#ff6600] to-orange-500 text-white'
                             : 'bg-gray-50 hover:bg-gray-100'
                         }`}>
                           <CardContent className="p-4 text-center">
                             <div className="text-2xl mb-2">{category.icon}</div>
                             <div className="font-medium">{category.name}</div>
                             {selectedCategories.includes(category.id) && (
                               <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-white" />
                             )}
                           </CardContent>
                         </Card>
                       </div>
                     ))}
                   </div>
                 </CardContent>
               </Card>

               {/* Notification Preferences */}
               <Card className="border-0 shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Settings className="h-5 w-5 text-[#ff6600]" />
                     <span>Préférences de Notification</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                       <Checkbox
                         id="whatsapp"
                         checked={notificationPreferences.whatsapp}
                         onCheckedChange={() => handleNotificationToggle('whatsapp')}
                       />
                       <Label htmlFor="whatsapp" className="flex items-center space-x-2 cursor-pointer">
                         <MessageCircle className="h-5 w-5 text-green-600" />
                         <span>WhatsApp</span>
                       </Label>
                     </div>
                     <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                       <Checkbox
                         id="email"
                         checked={notificationPreferences.email}
                         onCheckedChange={() => handleNotificationToggle('email')}
                       />
                       <Label htmlFor="email" className="flex items-center space-x-2 cursor-pointer">
                         <Mail className="h-5 w-5 text-blue-600" />
                         <span>Email</span>
                       </Label>
                     </div>
                     <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                       <Checkbox
                         id="sms"
                         checked={notificationPreferences.sms}
                         onCheckedChange={() => handleNotificationToggle('sms')}
                       />
                       <Label htmlFor="sms" className="flex items-center space-x-2 cursor-pointer">
                         <Phone className="h-5 w-5 text-purple-600" />
                         <span>SMS</span>
                       </Label>
                     </div>
                     <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                       <Checkbox
                         id="push"
                         checked={notificationPreferences.push}
                         onCheckedChange={() => handleNotificationToggle('push')}
                       />
                       <Label htmlFor="push" className="flex items-center space-x-2 cursor-pointer">
                         <Bell className="h-5 w-5 text-orange-600" />
                         <span>Notifications Push</span>
                       </Label>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Benefits */}
               <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2 text-green-700">
                     <Award className="h-5 w-5" />
                     <span>Avantages des Alertes</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                         <CheckCircle className="h-4 w-4 text-white" />
                       </div>
                       <span className="text-sm">Accès en avant-première</span>
                     </div>
                     <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                         <CheckCircle className="h-4 w-4 text-white" />
                       </div>
                       <span className="text-sm">Offres exclusives</span>
                     </div>
                     <div className="flex items-center space-x-3">
                       <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                         <CheckCircle className="h-4 w-4 text-white" />
                       </div>
                       <span className="text-sm">Notifications instantanées</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-4 justify-end">
                 <Button
                   variant="outline"
                   onClick={() => setShowAlertsModal(false)}
                   className="px-6 py-2"
                 >
                   Annuler
                 </Button>
                 <Button
                   onClick={handleSubmitAlerts}
                   className="bg-[#ff6600] hover:bg-[#e55a00] px-6 py-2"
                   disabled={!phoneNumber.trim()}
                 >
                   <MessageCircle className="h-4 w-4 mr-2" />
                   Activer les Alertes
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>

         {/* Calendar Modal */}
         <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
           <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="flex items-center space-x-3 text-2xl">
                 <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center">
                   <Calendar className="h-5 w-5 text-white" />
                 </div>
                 <span>Calendrier des Événements</span>
               </DialogTitle>
             </DialogHeader>

             <div className="space-y-6">
               {/* Calendar Overview */}
               <Card className="border-0 shadow-lg">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2">
                     <Clock className="h-5 w-5 text-[#ff6600]" />
                     <span>Prochains Événements</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {upcomingEvents.map((event) => {
                       const category = categories.find(cat => cat.id === event.category)
                       const eventDate = new Date(event.date)
                       const isUpcoming = eventDate > new Date()
                       
                       return (
                         <Card key={event.id} className={`border-0 shadow-lg transition-all duration-300 hover:scale-105 ${
                           event.status === 'upcoming' ? 'ring-2 ring-[#ff6600]' : 'ring-2 ring-blue-500'
                         }`}>
                           <CardContent className="p-6">
                             <div className="flex items-start justify-between mb-4">
                               <div className="flex items-center space-x-3">
                                 <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                                   event.status === 'upcoming' ? 'bg-gradient-to-r from-[#ff6600] to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                                 }`}>
                                   {category?.icon}
                                 </div>
                                 <div>
                                   <h3 className="font-bold text-lg">{event.title}</h3>
                                   <p className="text-sm text-gray-600">{category?.name}</p>
                                 </div>
                               </div>
                               <Badge className={`${
                                 event.status === 'upcoming' ? 'bg-[#ff6600]' : 'bg-blue-500'
                               } text-white`}>
                                 {event.status === 'upcoming' ? 'Bientôt' : 'Annoncé'}
                               </Badge>
                             </div>
                             
                             <p className="text-gray-600 mb-4">{event.description}</p>
                             
                             <div className="flex items-center justify-between">
                               <div className="flex items-center space-x-4 text-sm text-gray-500">
                                 <div className="flex items-center space-x-1">
                                   <Calendar className="h-4 w-4" />
                                   <span>{eventDate.toLocaleDateString('fr-FR')}</span>
                                 </div>
                                 <div className="flex items-center space-x-1">
                                   <Clock className="h-4 w-4" />
                                   <span>{event.time}</span>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <div className="font-bold text-[#ff6600]">{event.discount}</div>
                                 <div className="text-xs text-gray-500">
                                   {isUpcoming ? `${Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} jours` : 'Prochainement'}
                                 </div>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       )
                     })}
                   </div>
                 </CardContent>
               </Card>

               {/* Statistics */}
               <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
                 <CardHeader>
                   <CardTitle className="flex items-center space-x-2 text-blue-700">
                     <TrendingUp className="h-5 w-5" />
                     <span>Statistiques des Événements</span>
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                       <div className="text-2xl font-bold text-[#ff6600]">{upcomingEvents.length}</div>
                       <div className="text-sm text-gray-600">Événements à venir</div>
                     </div>
                     <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                       <div className="text-2xl font-bold text-blue-600">4</div>
                       <div className="text-sm text-gray-600">Catégories</div>
                     </div>
                     <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                       <div className="text-2xl font-bold text-green-600">15,420</div>
                       <div className="text-sm text-gray-600">Personnes inscrites</div>
                     </div>
                     <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                       <div className="text-2xl font-bold text-purple-600">89%</div>
                       <div className="text-sm text-gray-600">Taux de satisfaction</div>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Action Buttons */}
               <div className="flex flex-col sm:flex-row gap-4 justify-end">
                 <Button
                   variant="outline"
                   onClick={() => setShowCalendarModal(false)}
                   className="px-6 py-2"
                 >
                   Fermer
                 </Button>
                 <Button
                   onClick={() => {
                     setShowCalendarModal(false)
                     setShowAlertsModal(true)
                   }}
                   className="bg-[#ff6600] hover:bg-[#e55a00] px-6 py-2"
                 >
                   <Bell className="h-4 w-4 mr-2" />
                   S'inscrire aux Alertes
                 </Button>
               </div>
             </div>
           </DialogContent>
         </Dialog>

         {/* Product Modal */}
         <ProductModal
           product={selectedProduct}
           isOpen={isModalOpen}
           onClose={() => setIsModalOpen(false)}
         />
       </div>
     </div>
   )
 }
