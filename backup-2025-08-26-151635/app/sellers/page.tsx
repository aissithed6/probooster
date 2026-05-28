"use client"

import { useState } from "react"
import { 
  Users, 
  ShoppingBag, 
  Star, 
  Truck, 
  Crown, 
  MessageCircle, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Search, 
  Filter,
  Award,
  Shield,
  Zap
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Import supprimé - remplacé par le nouveau système de chat global
import { useRouter } from "next/navigation"

export default function SellersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedSeller, setSelectedSeller] = useState<any>(null)

  const stats = [
    {
      icon: Users,
      value: "1,250+",
      label: "Vendeurs actifs",
      color: "from-purple-500 to-blue-600",
      delay: "0s"
    },
    {
      icon: ShoppingBag,
      value: "15,000+",
      label: "Produits disponibles",
      color: "from-pink-500 to-red-600",
      delay: "0.2s"
    },
    {
      icon: Star,
      value: "4.8/5",
      label: "Note moyenne",
      color: "from-blue-500 to-cyan-600",
      delay: "0.4s"
    },
    {
      icon: Truck,
      value: "24h",
      label: "Livraison moyenne",
      color: "from-orange-500 to-yellow-600",
      delay: "0.6s"
    }
  ]

  const featuredSellers = [
    {
      id: 1,
      name: "TechStore Pro",
      initials: "TS",
      category: "Électronique & High-Tech",
      avatar: "/placeholder-user.jpg",
      rating: 4.9,
      reviews: 342,
      products: 250,
      sales: 2150,
      isVerified: true,
      isPremium: false,
      badge: "Vérifié",
      badgeColor: "bg-green-500",
      avatarColor: "bg-purple-500",
      description: "Spécialiste en produits technologiques de pointe",
      specialties: ["Smartphones", "Ordinateurs", "Accessoires"],
      responseTime: "2h",
      deliveryTime: "24h",
      isOnline: true
    },
    {
      id: 2,
      name: "Fashion Boutique",
      initials: "FB",
      category: "Mode & Accessoires",
      avatar: "/placeholder-user.jpg",
      rating: 4.7,
      reviews: 189,
      products: 180,
      sales: 1420,
      isVerified: true,
      isPremium: false,
      badge: "Vérifié",
      badgeColor: "bg-green-500",
      avatarColor: "bg-pink-500",
      description: "Boutique de mode tendance et accessoires élégants",
      specialties: ["Vêtements", "Chaussures", "Accessoires"],
      responseTime: "1h",
      deliveryTime: "48h",
      isOnline: true
    },
    {
      id: 3,
      name: "GameZone Electronics",
      initials: "GZ",
      category: "Gaming & Ordinateurs",
      avatar: "/placeholder-user.jpg",
      rating: 4.8,
      reviews: 276,
      products: 95,
      sales: 890,
      isVerified: false,
      isPremium: true,
      badge: "Premium",
      badgeColor: "bg-yellow-500",
      avatarColor: "bg-blue-400",
      description: "Expert en gaming et équipements informatiques",
      specialties: ["Gaming", "Ordinateurs", "Accessoires"],
      responseTime: "3h",
      deliveryTime: "72h",
      isOnline: false
    },
    {
      id: 4,
      name: "Home & Living Pro",
      initials: "HL",
      category: "Maison & Jardin",
      avatar: "/placeholder-user.jpg",
      rating: 4.6,
      reviews: 156,
      products: 320,
      sales: 980,
      isVerified: true,
      isPremium: false,
      badge: "Vérifié",
      badgeColor: "bg-green-500",
      avatarColor: "bg-green-500",
      description: "Tout pour votre maison et votre jardin",
      specialties: ["Meubles", "Décoration", "Jardinage"],
      responseTime: "4h",
      deliveryTime: "48h",
      isOnline: true
    },
    {
      id: 5,
      name: "Sports Elite",
      initials: "SE",
      category: "Sports & Loisirs",
      avatar: "/placeholder-user.jpg",
      rating: 4.9,
      reviews: 203,
      products: 145,
      sales: 1250,
      isVerified: true,
      isPremium: true,
      badge: "Premium",
      badgeColor: "bg-yellow-500",
      avatarColor: "bg-red-500",
      description: "Équipements sportifs de haute qualité",
      specialties: ["Fitness", "Running", "Outdoor"],
      responseTime: "1h",
      deliveryTime: "24h",
      isOnline: true
    },
    {
      id: 6,
      name: "Beauty & Care",
      initials: "BC",
      category: "Beauté & Soins",
      avatar: "/placeholder-user.jpg",
      rating: 4.7,
      reviews: 178,
      products: 210,
      sales: 890,
      isVerified: true,
      isPremium: false,
      badge: "Vérifié",
      badgeColor: "bg-green-500",
      avatarColor: "bg-purple-400",
      description: "Produits de beauté et soins personnels",
      specialties: ["Cosmétiques", "Soins", "Parfums"],
      responseTime: "2h",
      deliveryTime: "48h",
      isOnline: false
    }
  ]

  const filteredSellers = featuredSellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         seller.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || seller.category.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  const handleViewProducts = (seller: any) => {
    router.push(`/seller/${seller.id}`)
  }

  const handleOpenChat = (seller: any) => {
    setSelectedSeller(seller)
    setIsChatOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-4 animate-fade-in-up">
            <ShoppingBag className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">Probooster</span>
            <ShoppingBag className="h-5 w-5 animate-pulse delay-300" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200">
            Nos <span className="text-[#ff6600] animate-pulse">Vendeurs Partenaires</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Découvrez notre communauté de vendeurs de confiance et leurs produits exceptionnels
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up animation-delay-600">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
              style={{ animationDelay: stat.delay }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2 animate-count-up">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 animate-fade-in-up animation-delay-800">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-hover:text-[#ff6600] transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Rechercher un vendeur..."
                className="pl-10 border-2 focus:border-[#ff6600] transition-all duration-300 hover:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 border-2 hover:border-[#ff6600] transition-all duration-300">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="Électronique">Électronique & High-Tech</SelectItem>
                <SelectItem value="Mode">Mode & Accessoires</SelectItem>
                <SelectItem value="Gaming">Gaming & Ordinateurs</SelectItem>
                <SelectItem value="Maison">Maison & Jardin</SelectItem>
                <SelectItem value="Sports">Sports & Loisirs</SelectItem>
                <SelectItem value="Beauté">Beauté & Soins</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-2 hover:border-[#ff6600] transition-all duration-300">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Featured Sellers Section */}
        <div className="mb-8">
          <div className="text-center mb-8 animate-fade-in-up animation-delay-1000">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
              <Crown className="h-6 w-6 text-[#ff6600] mr-2" />
              Vendeurs Vedettes
            </h2>
            <p className="text-gray-600">Nos vendeurs les plus performants et fiables</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up animation-delay-1200">
            {filteredSellers.map((seller, index) => (
              <Card 
                key={seller.id} 
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer border-0 shadow-lg relative overflow-hidden animate-fade-in-up bg-white"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                {/* Animated Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform -translate-x-8 translate-y-8"></div>
                
                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20 group-hover:scale-110 transition-transform duration-300 ring-4 ring-white shadow-lg">
                        <AvatarImage src={seller.avatar} alt={seller.name} />
                        <AvatarFallback className={`text-white font-bold text-xl ${seller.avatarColor} shadow-lg`}>
                          {seller.initials}
                        </AvatarFallback>
                      </Avatar>
                      {seller.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white animate-pulse shadow-lg"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 
                          className="font-bold text-xl group-hover:text-[#ff6600] transition-colors duration-300 cursor-pointer hover:scale-105 transform transition-transform duration-300"
                          onClick={() => handleViewProducts(seller)}
                        >
                          {seller.name}
                        </h3>
                        <Badge className={`text-white text-xs font-semibold ${seller.badgeColor} animate-pulse shadow-lg px-2 py-1`}>
                          {seller.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{seller.category}</p>
                      <p className="text-xs text-gray-500 mt-1">{seller.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 relative z-10">
                  {/* Rating with Enhanced Design */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(seller.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {seller.rating} ({seller.reviews} avis)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#ff6600]">{seller.rating}</div>
                      <div className="text-xs text-gray-500">Note globale</div>
                    </div>
                  </div>

                  {/* Enhanced Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{seller.products}+</div>
                      <div className="text-xs text-gray-600 font-medium">Produits</div>
                      <div className="w-8 h-1 bg-blue-200 rounded-full mx-auto mt-2"></div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300">
                      <div className="text-2xl font-bold text-green-600 mb-1">{seller.sales.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 font-medium">Ventes</div>
                      <div className="w-8 h-1 bg-green-200 rounded-full mx-auto mt-2"></div>
                    </div>
                  </div>

                  {/* Specialties with Enhanced Design */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                      <Award className="h-4 w-4 mr-2 text-[#ff6600]" />
                      Spécialités
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {seller.specialties.map((specialty, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-white/90 border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors font-medium px-3 py-1"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Response and Delivery Time with Enhanced Design */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Réponse</div>
                        <div className="text-sm font-semibold text-gray-700">{seller.responseTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Truck className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Livraison</div>
                        <div className="text-sm font-semibold text-gray-700">{seller.deliveryTime}</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenChat(seller)}
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 group-hover:scale-105 transition-all duration-300 font-medium group"
                    >
                      <MessageCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Chat
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleViewProducts(seller)}
                      className="flex-1 bg-gradient-to-r from-[#ff6600] to-orange-500 hover:from-[#e55a00] hover:to-orange-600 group-hover:scale-105 transition-all duration-300 font-medium shadow-lg group"
                    >
                      <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                      Voir produits
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* View All Sellers Button */}
        <div className="text-center animate-fade-in-up animation-delay-1400">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <Users className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
            Voir Tous les Vendeurs
            <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>
      </div>

      {/* Widget de chat */}
      {selectedSeller && (
        <ChatWidget
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          seller={{
            name: selectedSeller.name,
            avatar: selectedSeller.avatar,
            rating: selectedSeller.rating,
            totalSales: selectedSeller.sales,
            responseTime: selectedSeller.responseTime,
            location: "Abidjan, Côte d'Ivoire",
            phone: "+225 0123456789",
            email: "contact@vendeur.com",
            isOnline: selectedSeller.isOnline
          }}
        />
      )}
    </div>
  )
} 