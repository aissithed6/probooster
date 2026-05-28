"use client"

import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Heart, Trash2, Plus, Minus } from "lucide-react"

// Produits de test
const testProducts = [
  {
    id: 1,
    name: "Smartphone Galaxy Pro",
    price: 450000,
    image: "/placeholder.svg?height=300&width=300",
    seller: "TechStore CI",
    inStock: true
  },
  {
    id: 2,
    name: "Laptop Gaming Ultra",
    price: 850000,
    image: "/placeholder.svg?height=300&width=300",
    seller: "Gaming World",
    inStock: true
  },
  {
    id: 3,
    name: "Casque Audio Premium",
    price: 125000,
    image: "/placeholder.svg?height=300&width=300",
    seller: "Audio Plus",
    inStock: false
  }
]

export default function TestCartPage() {
  const { 
    cartItems, 
    cartCount, 
    cartTotal, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    isInCart,
    getItemQuantity
  } = useCart()
  
  const { 
    wishlistItems, 
    wishlistCount, 
    addToWishlist, 
    removeFromWishlist, 
    toggleWishlist,
    isInWishlist 
  } = useWishlist()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🛒 Test des Fonctionnalités du Panier
          </h1>
          <p className="text-lg text-gray-600">
            Testez l'ajout au panier, la wishlist et toutes les fonctionnalités
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-800 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Panier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{cartCount}</div>
              <div className="text-sm text-blue-600">Produits</div>
              <div className="text-lg font-semibold text-blue-800">
                {cartTotal.toLocaleString()} F CFA
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-800 flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Favoris
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{wishlistCount}</div>
              <div className="text-sm text-red-600">Produits</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-800">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={clearCart}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Vider le panier
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Produits de test */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🎯 Produits de Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Rupture de stock
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">Vendeur: {product.seller}</p>
                  <p className="text-2xl font-bold text-orange-600 mb-4">
                    {product.price.toLocaleString()} F CFA
                  </p>
                  
                  <div className="space-y-2">
                    {/* Bouton Ajouter au panier */}
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock}
                      className={`w-full ${
                        product.inStock 
                          ? 'bg-orange-500 hover:bg-orange-600' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {product.inStock ? "Ajouter au panier" : "Indisponible"}
                    </Button>

                    {/* Bouton Wishlist */}
                    <Button
                      onClick={() => toggleWishlist(product)}
                      variant="outline"
                      className={`w-full ${
                        isInWishlist(product.id) 
                          ? 'border-red-500 text-red-500 hover:bg-red-50' 
                          : 'border-gray-300 hover:border-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      {isInWishlist(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    </Button>

                    {/* Quantité si dans le panier */}
                    {isInCart(product.id) && (
                      <div className="flex items-center justify-center space-x-2 p-2 bg-orange-50 rounded-lg">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, getItemQuantity(product.id) - 1)}
                          disabled={getItemQuantity(product.id) <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-semibold text-orange-600">
                          {getItemQuantity(product.id)}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, getItemQuantity(product.id) + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contenu du panier */}
        {cartItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              🛒 Contenu du Panier
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">Vendeur: {item.seller}</p>
                          <p className="text-lg font-bold text-orange-600">
                            {item.price.toLocaleString()} F CFA
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-semibold text-lg min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {cartTotal.toLocaleString()} F CFA
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions de test */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>• <strong>Ajouter au panier</strong> : Cliquez sur "Ajouter au panier" pour les produits en stock</p>
            <p>• <strong>Gérer les quantités</strong> : Utilisez les boutons + et - pour modifier les quantités</p>
            <p>• <strong>Wishlist</strong> : Ajoutez/retirez des produits de vos favoris</p>
            <p>• <strong>Rupture de stock</strong> : Le produit "Casque Audio Premium" est en rupture</p>
            <p>• <strong>Notifications</strong> : Vérifiez les notifications lors des actions</p>
            <p>• <strong>Header</strong> : Les compteurs du header se mettent à jour automatiquement</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
