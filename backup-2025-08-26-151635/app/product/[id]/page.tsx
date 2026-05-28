"use client"

import { useState, use } from "react"
import { Heart, Minus, Plus, Share2, ShoppingCart, Star, MessageCircle } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Import supprimé - remplacé par le nouveau système de chat global

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  
  const { id: productId } = use(params)

  const product = {
    id: productId,
    name: "Smartphone Galaxy Pro Max 256GB",
    price: 450000,
    originalPrice: 500000,
    rating: 4.5,
    reviews: 128,
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    seller: {
      name: "TechStore CI",
      rating: 4.8,
      totalSales: 1250,
      avatar: "/placeholder-user.jpg",
    },
    sharePoints: 50,
    shares: 245,
    inStock: true,
    stockCount: 15,
    discount: 10,
    description:
      "Découvrez le smartphone le plus avancé de sa génération avec un écran AMOLED 6.7 pouces, une caméra triple 108MP et une batterie longue durée de 5000mAh. Parfait pour les professionnels et les passionnés de technologie.",
    features: [
      "Écran AMOLED 6.7 pouces 120Hz",
      "Processeur Snapdragon 8 Gen 2",
      "RAM 12GB + Stockage 256GB",
      "Caméra principale 108MP",
      "Batterie 5000mAh charge rapide 65W",
      "5G, WiFi 6, Bluetooth 5.3",
    ],
    specifications: {
      Écran: "6.7 pouces AMOLED 120Hz",
      Processeur: "Snapdragon 8 Gen 2",
      RAM: "12GB",
      Stockage: "256GB",
      Caméra: "108MP + 12MP + 8MP",
      Batterie: "5000mAh",
      OS: "Android 14",
    },
  }

  const reviews = [
    {
      id: 1,
      user: "Marie K.",
      rating: 5,
      comment: "Excellent produit, livraison rapide. Je recommande !",
      date: "Il y a 2 jours",
      verified: true,
    },
    {
      id: 2,
      user: "Jean-Paul D.",
      rating: 4,
      comment: "Très bon smartphone, la qualité photo est impressionnante.",
      date: "Il y a 1 semaine",
      verified: true,
    },
    {
      id: 3,
      user: "Fatou S.",
      rating: 5,
      comment: "Parfait pour le travail et les loisirs. Batterie qui tient toute la journée.",
      date: "Il y a 2 semaines",
      verified: false,
    },
  ]

  const handleShare = (platform: string) => {
    console.log(`Sharing on ${platform}`)
    // Handle sharing logic and points
  }

  const handleAddToCart = () => {
    console.log(`Adding ${quantity} items to cart`)
  }

  const handleBuyWithPoints = () => {
    const pointsRequired = Math.floor(product.price / 2)
    console.log(`Buying with ${pointsRequired} points`)
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border">
              <Image
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.name}
                width={500}
                height={500}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${
                    selectedImage === index ? "border-[#ff6600]" : "border-gray-200"
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
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-gray-600">
                  {product.rating} ({product.reviews} avis)
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-[#ff6600]">{product.price.toLocaleString()} F CFA</span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {product.originalPrice.toLocaleString()} F CFA
                    </span>
                    <Badge className="bg-red-500">-{product.discount}%</Badge>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={product.seller.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{product.seller.name}</div>
                  <div className="text-sm text-gray-600">
                    ⭐ {product.seller.rating} • {product.seller.totalSales} ventes
                  </div>
                </div>
              </div>
            </div>

            {/* Share Section */}
            <Card className="bg-gradient-to-r from-[#ff6600]/10 to-orange-100 border-[#ff6600]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#ff6600]">Gagnez +{product.sharePoints} points</div>
                    <div className="text-sm text-gray-600">En partageant ce produit • {product.shares} partages</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-[#ff6600] text-[#ff6600] bg-transparent">
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleShare("facebook")}>📘 Facebook (+50 pts)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare("whatsapp")}>💬 WhatsApp (+30 pts)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare("twitter")}>🐦 Twitter (+40 pts)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare("instagram")}>
                        📷 Instagram (+45 pts)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantité:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    disabled={quantity >= product.stockCount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-600">{product.stockCount} en stock</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button size="lg" className="bg-[#ff6600] hover:bg-[#e55a00]" onClick={handleAddToCart}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Ajouter au panier
                </Button>
                <Button size="lg" variant="outline" onClick={handleBuyWithPoints}>
                  Acheter avec points ({Math.floor(product.price / 2)} pts)
                </Button>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" className="flex-1 bg-transparent">
                                          <Heart className="h-4 w-4 mr-2 text-red-500 hover:scale-110 transition-all duration-300" />
                  Ajouter aux favoris
                </Button>
                <Button variant="outline" onClick={() => setIsChatOpen(true)}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter le vendeur
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Caractéristiques</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({product.reviews})</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Description du produit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                <div>
                  <h4 className="font-semibold mb-2">Caractéristiques principales:</h4>
                  <ul className="space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-[#ff6600] rounded-full"></span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Spécifications techniques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b">
                      <span className="font-medium">{key}:</span>
                      <span className="text-gray-600">{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Avis clients</CardTitle>
                <CardDescription>
                  {product.reviews} avis • Note moyenne: {product.rating}/5
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.user}</span>
                        {review.verified && (
                          <Badge variant="outline" className="text-xs">
                            Achat vérifié
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Widget */}
      <ChatWidget
        productId={product.id}
        sellerId="seller1"
        sellerName={product.seller.name}
        productName={product.name}
      />
    </div>
  )
}
