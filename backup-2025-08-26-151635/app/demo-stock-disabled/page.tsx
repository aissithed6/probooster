"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coins } from "lucide-react"

interface DemoProduct {
  id: number
  name: string
  price: number
  pointsPrice: number
  inStock: boolean
  description: string
}

export default function DemoStockDisabledPage() {
  const demoProducts: DemoProduct[] = [
    {
      id: 1,
      name: "iPhone 15 Pro Max",
      price: 850000,
      pointsPrice: 8500,
      inStock: true,
      description: "Smartphone en stock - Bouton actif"
    },
    {
      id: 2,
      name: "MacBook Air M2",
      price: 1200000,
      pointsPrice: 12000,
      inStock: false,
      description: "Ordinateur en rupture - Bouton désactivé"
    },
    {
      id: 3,
      name: "AirPods Pro 2",
      price: 180000,
      pointsPrice: 1800,
      inStock: true,
      description: "Écouteurs en stock - Bouton actif"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 Démonstration Bouton "Acheter avec des points"
          </h1>
          <p className="text-lg text-gray-600">
            Comportement automatique selon le statut du stock
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoProducts.map((product) => (
            <Card key={product.id} className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <div className="flex items-center justify-between">
                  <Badge variant={product.inStock ? "default" : "destructive"}>
                    {product.inStock ? "En Stock" : "Rupture de Stock"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {product.price.toLocaleString()} F CFA
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{product.description}</p>
                
                {/* Bouton "Acheter avec des points" */}
                <Button 
                  variant="outline" 
                  className={`w-full border-2 rounded-xl transition-all duration-300 transform relative overflow-hidden group px-6 py-4 ${
                    product.inStock 
                      ? 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-[#ff6600]/10 hover:to-[#ff8533]/10 border-gray-200 hover:border-[#ff6600] text-gray-700 hover:text-[#ff6600] hover:scale-105' 
                      : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => {
                    if (product.inStock) {
                      alert(`Ouverture du modal d'achat avec points pour ${product.name}`)
                    }
                  }}
                  disabled={!product.inStock}
                >
                  {/* Effet de particules - seulement si en stock */}
                  {product.inStock && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.3s' }}></div>
                      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ animationDelay: '0.6s' }}></div>
                    </div>
                  )}
                  
                  <Coins className={`h-5 w-5 flex-shrink-0 mr-3 ${product.inStock ? 'animate-pulse text-yellow-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-semibold">
                    {product.inStock ? `Acheter avec points (${product.pointsPrice} pts)` : 'Indisponible'}
                  </span>
                </Button>

                {/* Informations techniques */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>inStock:</strong> {product.inStock.toString()}</p>
                  <p><strong>disabled:</strong> {(!product.inStock).toString()}</p>
                  <p><strong>className:</strong> {product.inStock ? 'Actif' : 'Désactivé'}</p>
                  <p><strong>onClick:</strong> {product.inStock ? 'Exécuté' : 'Bloqué'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Résumé du comportement */}
        <Card className="mt-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Comportement Implémenté</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-green-700">
            <p>• <strong>Produits EN STOCK</strong> : Bouton actif, texte avec prix en points, effets visuels, onClick fonctionnel</p>
            <p>• <strong>Produits EN RUPTURE</strong> : Bouton désactivé, texte "Indisponible", style grisé, onClick bloqué</p>
            <p>• <strong>Automatique</strong> : Le comportement change automatiquement selon `product.inStock`</p>
            <p>• <strong>Cohérent</strong> : Même logique sur toutes les pages (/best-sellers, /new-arrivals, /products)</p>
          </CardContent>
        </Card>

        {/* Liens vers les pages réelles */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">🌐 Test sur les Pages Réelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>• <strong>Page Best Sellers</strong> : <a href="/best-sellers" className="underline hover:text-blue-800">http://localhost:3000/best-sellers</a></p>
            <p>• <strong>Page New Arrivals</strong> : <a href="/new-arrivals" className="underline hover:text-blue-800">http://localhost:3000/new-arrivals</a></p>
            <p>• <strong>Page Products</strong> : <a href="/products" className="underline hover:text-blue-800">http://localhost:3000/products</a></p>
            <p className="mt-4 text-sm text-blue-600">
              <strong>Note :</strong> Sur ces pages, vous verrez le même comportement automatique 
              pour tous les produits selon leur statut de stock.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
