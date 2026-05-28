"use client"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { useNotifications } from "@/components/ui/modern-notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShoppingCart, Heart, Share2, MessageCircle, Star, Coins, Flame, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function TestCartModalPage() {
  const { addToCart, isInCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addNotification } = useNotifications()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const testProduct = {
    id: 1,
    name: "Smartphone Galaxy Pro Test",
    price: 450000,
    pointsPrice: 2250,
    originalPrice: 500000,
    rating: 4.5,
    reviews: 128,
    image: "/placeholder.svg?height=300&width=300",
    seller: "TechStore CI",
    sharePoints: 50,
    shares: 245,
    inStock: true,
    discount: 10,
    isHot: true,
    isNew: false,
    isLimited: false,
    badges: ["HOT"],
    color: "red"
  }

  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller: product.seller
    })
    addNotification({ 
  type: 'success', 
  title: 'Produit ajouté', 
          message: `${product.name} a été ajouté au panier` 
})
  }

  const handleToggleWishlist = (product: any) => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      seller: product.seller
    })
    
    if (isInWishlist(product.id)) {
      addNotification({ 
  type: 'info', 
  title: 'Produit retiré', 
          message: `${product.name} a été retiré des favoris` 
})
    } else {
      addNotification({ 
  type: 'success', 
  title: 'Produit ajouté', 
          message: `${product.name} a été ajouté aux favoris` 
})
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Cart + Modal
          </h1>
          <p className="text-lg text-gray-600">
            Testez que le bouton "Ajouter au panier" n'ouvre plus le modal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white rounded-2xl transform hover:scale-105 hover:-translate-y-2">
            <div className="relative overflow-hidden">
              <img
                src={testProduct.image}
                alt={testProduct.name}
                className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-700 cursor-pointer"
                onClick={() => handleProductClick(testProduct)}
              />

              {/* Animated Badges */}
              <div className="absolute top-3 left-3 flex flex-col space-y-2">
                {testProduct.isHot && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 animate-pulse shadow-lg">
                    <Flame className="h-3 w-3 mr-1 animate-bounce" />
                    HOT
                  </Badge>
                )}
                {testProduct.isNew && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 animate-pulse shadow-lg">
                    <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                    NEW
                  </Badge>
                )}
              </div>

              {/* Discount Badge */}
              {testProduct.discount > 0 && (
                <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0 animate-bounce shadow-lg">
                  -{testProduct.discount}%
                </Badge>
              )}

              {/* Floating Action Buttons */}
              <div className="absolute top-12 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                {/* Bouton Favori */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${isInWishlist(testProduct.id) ? 'bg-red-50 hover:bg-red-100' : 'bg-white/90 hover:bg-white'} shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleWishlist(testProduct)
                  }}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(testProduct.id) ? 'text-red-500 fill-current animate-pulse' : 'text-red-500 hover:scale-110'} transition-all duration-300`} />
                  
                  {isInWishlist(testProduct.id) && (
                    <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white px-1 rounded-full animate-pulse">
                      ❤️
                    </span>
                  )}
                </Button>
                
                {/* Bouton Panier */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/90 hover:bg-white shadow-lg rounded-full h-9 w-9 transition-all duration-300 relative overflow-hidden group"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToCart(testProduct)
                  }}
                >
                  <ShoppingCart className="h-4 w-4 text-green-600 hover:scale-110 transition-transform duration-300 animate-bounce" />
                </Button>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 
                  className="font-bold text-xl line-clamp-2 group-hover:text-[#ff6600] transition-colors duration-300 cursor-pointer"
                  onClick={() => handleProductClick(testProduct)}
                >
                  {testProduct.name}
                </h3>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(testProduct.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {testProduct.rating} ({testProduct.reviews})
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-[#ff6600]">
                      {testProduct.price.toLocaleString()} F CFA
                    </span>
                    {testProduct.originalPrice > testProduct.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {testProduct.originalPrice.toLocaleString()} F CFA
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Coins className="h-4 w-4 text-yellow-500 animate-pulse" />
                    <span className="font-semibold text-gray-700">
                      {testProduct.pointsPrice} points
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Vendu par <span className="font-medium text-[#ff6600]">
                    {testProduct.seller}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardContent className="p-6 pt-0">
              <div className="flex space-x-3 w-full">
                <Button
                  className="flex-1 bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                  onClick={() => handleAddToCart(testProduct)}
                  disabled={!testProduct.inStock}
                >
                  <ShoppingCart className="h-4 w-4 mr-2 animate-pulse" />
                  {testProduct.inStock ? "Ajouter au panier" : "Indisponible"}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-gray-200 hover:border-[#ff6600] hover:bg-[#ff6600] hover:text-white rounded-xl transition-all duration-300 min-w-[44px] group animate-pulse relative overflow-hidden"
                  onClick={() => handleToggleWishlist(testProduct)}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(testProduct.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🔍 Test du Comportement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Testez le comportement des boutons et du modal
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => handleAddToCart(testProduct)}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Test Ajouter au Panier
                </Button>
                
                <Button 
                  onClick={() => handleToggleWishlist(testProduct)}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Test Favoris
                </Button>
                
                <Button 
                  onClick={() => handleProductClick(testProduct)}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Ouvrir Modal (Clic sur Image/Nom)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">🐛 Diagnostic du Problème</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-700">
            <p>• <strong>Problème identifié</strong> : Toute la carte avait un onClick qui ouvrait le modal</p>
            <p>• <strong>Solution appliquée</strong> : Seuls l'image et le nom du produit ouvrent le modal</p>
            <p>• <strong>Résultat attendu</strong> : Boutons d'action n'ouvrent plus le modal</p>
            <p>• <strong>Test requis</strong> : Vérifiez que "Ajouter au panier" n'ouvre plus le modal</p>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>1. <strong>Cliquez sur "Ajouter au panier"</strong> - Le modal ne doit PAS s'ouvrir</p>
            <p>2. <strong>Cliquez sur "Favoris"</strong> - Le modal ne doit PAS s'ouvrir</p>
            <p>3. <strong>Cliquez sur l'image du produit</strong> - Le modal DOIT s'ouvrir</p>
            <p>4. <strong>Cliquez sur le nom du produit</strong> - Le modal DOIT s'ouvrir</p>
            <p>5. <strong>Vérifiez les notifications</strong> - Elles doivent s'afficher correctement</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal de test */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modal de Test - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Ce modal s'ouvre uniquement quand on clique sur l'image ou le nom du produit.
            </p>
            <p className="text-gray-600">
              Les boutons d'action (panier, favoris) ne doivent plus ouvrir ce modal.
            </p>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                <strong>Test réussi si :</strong>
              </p>
              <ul className="text-sm text-gray-500 mt-2 space-y-1">
                <li>✅ Modal ouvert en cliquant sur l'image/nom</li>
                <li>✅ Modal fermé en cliquant sur "Ajouter au panier"</li>
                <li>✅ Modal fermé en cliquant sur "Favoris"</li>
                <li>✅ Notifications visibles pour les actions</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
