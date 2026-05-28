"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useChat } from "@/lib/chat-context"
import Link from "next/link"

export default function TestChatVerificationPage() {
  const { openChatWidget } = useChat()

  const testProduct = {
    id: 1,
    name: "Produit de Test",
    price: 100000,
    image: "/placeholder.jpg",
    rating: 4.5,
    reviews: 50,
    seller: "Vendeur Test"
  }

  const testSeller = {
    name: "Vendeur Test",
    avatar: "/placeholder-user.jpg",
    rating: 4.5,
    totalSales: 500,
    responseTime: "2-4h",
    location: "Abidjan, CI",
    phone: "+225 0701234567",
    email: "contact@probooster.online",
    joinDate: "2023",
    memberSince: "1 an",
    logo: "/placeholder-logo.png"
  }

  const handleStartChat = () => {
    openChatWidget(testProduct, testSeller)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Vérification du Système de Chat Global</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Test du bouton Message Global</h2>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Image</span>
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium">{testProduct.name}</h3>
              <p className="text-gray-600">{testProduct.price.toLocaleString()} F CFA</p>
            </div>
            
            <Button
              onClick={handleStartChat}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-3">Pages à Vérifier</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-blue-600 hover:underline">
                  • Page d'accueil (/)
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-blue-600 hover:underline">
                  • Page boutique (/products)
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="text-blue-600 hover:underline">
                  • Nouveautés (/new-arrivals)
                </Link>
              </li>
              <li>
                <Link href="/best-sellers" className="text-blue-600 hover:underline">
                  • Meilleures ventes (/best-sellers)
                </Link>
              </li>
              <li>
                <Link href="/seller/test" className="text-blue-600 hover:underline">
                  • Page vendeur (/seller/test)
                </Link>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-3">Instructions de Test</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li>1. Allez sur chaque page listée</li>
              <li>2. Trouvez une carte produit</li>
              <li>3. Cliquez sur le bouton "Message" (💬)</li>
              <li>4. Vérifiez que le widget chat s'ouvre</li>
              <li>5. Vérifiez que le chat fonctionne correctement</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="mb-2">✅ Le système de chat global devrait maintenant fonctionner sur toutes les pages</p>
          <p>🔧 Si un problème survient, vérifiez la console du navigateur pour les erreurs</p>
        </div>
      </div>
    </div>
  )
}
