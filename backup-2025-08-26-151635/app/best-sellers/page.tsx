"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Grid, List, Search, Star, Heart, ShoppingCart, Sparkles, TrendingUp, Flame, Trophy, Gift, ArrowRight } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ShareButtons from "@/components/product/share-buttons"
import ProductModal from "@/components/product/product-modal"
import BestSellersSection from "@/components/product/best-sellers-section"
// Import supprimé - remplacé par le nouveau système de chat global

export default function BestSellersPage() {
  const router = useRouter()
  // useChat remplacé par le nouveau système de chat global
  // Utilisez le bouton flottant orange en bas à droite pour accéder au chat
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fonction pour ouvrir le modal de fiche produit
  const handleOpenProductModal = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const bestSellers = [
    {
      id: "1",
      name: "iPhone 15 Pro Max 256GB",
      price: 1200000,
      pointsPrice: 12000,
      originalPrice: 1350000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.9,
      reviews: 456,
      sales: 1250,
      seller: "TechStore Premium",
      shareData: { facebook: 89, twitter: 45, whatsapp: 123, instagram: 67 },
      discount: 11,
      badge: "🏆 #1",
      isHot: true,
      isNew: false,
      isLimited: false,
      sharePoints: 100,
      badges: ["🔥 Bestseller", "⚡ Livraison Express", "🎁 Cadeau Inclus"],
      rank: 1,
    },
    {
      id: "2",
      name: "MacBook Pro M3 14 pouces",
      price: 2100000,
      pointsPrice: 21000,
      originalPrice: 2300000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.8,
      reviews: 234,
      sales: 890,
      seller: "Apple Store CI",
      shareData: { facebook: 67, twitter: 34, whatsapp: 98, instagram: 45 },
      discount: 9,
      badge: "🥈 #2",
      isHot: true,
      isNew: false,
      isLimited: false,
      sharePoints: 85,
      badges: ["🥈 Top Vente", "💎 Premium", "⚡ Livraison Express"],
      rank: 2,
    },
    {
      id: "3",
      name: "Samsung Galaxy S24 Ultra",
      price: 950000,
      pointsPrice: 9500,
      originalPrice: 1100000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.7,
      reviews: 345,
      sales: 780,
      seller: "Samsung Official",
      shareData: { facebook: 56, twitter: 28, whatsapp: 87, instagram: 39 },
      discount: 14,
      badge: "🥉 #3",
      isHot: true,
      isNew: false,
      isLimited: false,
      sharePoints: 75,
      badges: ["🥉 Top 3", "📱 Smartphone Pro", "⚡ Livraison Express"],
      rank: 3,
    },
    {
      id: "4",
      name: "AirPods Pro 2ème génération",
      price: 280000,
      pointsPrice: 2800,
      originalPrice: 320000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.6,
      reviews: 567,
      sales: 650,
      seller: "Audio Premium",
      shareData: { facebook: 45, twitter: 23, whatsapp: 76, instagram: 32 },
      discount: 13,
      badge: "🔥 #4",
      isHot: true,
      isNew: false,
      isLimited: false,
      sharePoints: 60,
      badges: ["🔥 Populaire", "🎵 Audio Pro", "⚡ Livraison Express"],
      rank: 4,
    },
    {
      id: "5",
      name: "PlayStation 5 Console",
      price: 650000,
      pointsPrice: 6500,
      originalPrice: 750000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.8,
      reviews: 289,
      sales: 520,
      seller: "Gaming World",
      shareData: { facebook: 78, twitter: 41, whatsapp: 102, instagram: 58 },
      discount: 13,
      badge: "⭐ #5",
      isHot: false,
      isNew: false,
      isLimited: true,
      sharePoints: 50,
      badges: ["⭐ Top 5", "🎮 Gaming Pro", "⏰ Offre Limitée"],
      rank: 5,
    },
    {
      id: "6",
      name: "Nike Air Jordan 1 Retro",
      price: 180000,
      pointsPrice: 1800,
      originalPrice: 220000,
      image: "/placeholder.svg?height=300&width=300",
      rating: 4.5,
      reviews: 423,
      sales: 480,
      seller: "Sneakers Paradise",
      shareData: { facebook: 34, twitter: 19, whatsapp: 65, instagram: 28 },
      discount: 18,
      badge: "🔥 #6",
      isHot: true,
      isNew: false,
      isLimited: false,
      sharePoints: 40,
      badges: ["🔥 Tendance", "👟 Sneakers Pro", "⚡ Livraison Express"],
      rank: 6,
    },
  ]

  const handleProductClick = (product: any) => {
    // Convertir le produit simple en produit complet pour le modal
    const fullProduct = {
      ...product,
      images: [product.image, product.image, product.image, product.image], // Images multiples
      seller: {
        name: product.seller || 'Vendeur Probooster',
        avatar: "/placeholder-user.jpg",
        rating: product.rating,
        totalSales: product.sales,
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
        "Classement": product.badge
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
      stock: product.isHot ? Math.floor(Math.random() * 50) + 10 : 0,
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
            <Trophy className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">Probooster</span>
            <Trophy className="h-5 w-5 animate-pulse delay-300" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200">
            <span className="text-[#ff6600] animate-pulse">Meilleures</span> Ventes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Découvrez les produits les plus vendus et les plus appréciés par notre communauté
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 animate-fade-in-up animation-delay-600">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-hover:text-[#ff6600] transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Rechercher dans les meilleures ventes..."
                className="pl-10 border-2 focus:border-[#ff6600] transition-all duration-300 hover:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select defaultValue="sales">
              <SelectTrigger className="w-48 border-2 hover:border-[#ff6600] transition-all duration-300">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Meilleures ventes</SelectItem>
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

        {/* Section Meilleures Ventes */}
        <BestSellersSection 
          onProductClick={handleOpenProductModal}
          onStartChat={(product) => {
            // Le chat est maintenant géré par le système global
            // Utilisez le bouton flottant orange en bas à droite pour accéder au chat
            console.log('Chat démarré pour le produit:', product.name)
          }}
        />

        {/* Sales Statistics Section */}
        <div className="mt-16 animate-fade-in-up animation-delay-600">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">
              Statistiques des Ventes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez les performances de nos meilleures ventes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold animate-count-up">4,570</div>
                    <div className="text-sm opacity-90">Ventes Totales</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-green-300">↗ +12.5%</span>
                  <span className="ml-2 opacity-75">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold animate-count-up">2.8M</div>
                    <div className="text-sm opacity-90">F CFA</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-green-300">↗ +18.3%</span>
                  <span className="ml-2 opacity-75">Chiffre d'affaires</span>
                </div>
              </CardContent>
            </Card>

            {/* Average Rating */}
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold animate-count-up">4.7</div>
                    <div className="text-sm opacity-90">Note Moyenne</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-300">↗ +0.2</span>
                  <span className="ml-2 opacity-75">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Category */}
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">Tech</div>
                    <div className="text-sm opacity-90">Catégorie #1</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-purple-300">🔥</span>
                  <span className="ml-2 opacity-75">45% des ventes</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales Trend */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">
                    Évolution des Ventes
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">En hausse</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cette semaine</span>
                    <span className="font-semibold text-green-600">+15.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ce mois</span>
                    <span className="font-semibold text-blue-600">+12.8%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '68%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ce trimestre</span>
                    <span className="font-semibold text-purple-600">+8.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '52%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products Performance */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">
                    Performance des Produits
                  </h3>
                  <Badge className="bg-[#ff6600] text-white animate-pulse">Top 5</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg group hover:bg-gradient-to-r hover:from-yellow-100 hover:to-orange-100 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        1
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">iPhone 15 Pro Max</div>
                        <div className="text-sm text-gray-600">1,250 ventes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+23%</div>
                      <div className="text-xs text-gray-500">vs hier</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg group hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        2
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">MacBook Pro M3</div>
                        <div className="text-sm text-gray-600">890 ventes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">+18%</div>
                      <div className="text-xs text-gray-500">vs hier</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg group hover:bg-gradient-to-r hover:from-orange-100 hover:to-red-100 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        3
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Samsung S24 Ultra</div>
                        <div className="text-sm text-gray-600">780 ventes</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">+15%</div>
                      <div className="text-xs text-gray-500">vs hier</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
