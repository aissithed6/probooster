"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
// Import supprimé - remplacé par le nouveau système de chat global

export default function TestChatWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  const testProduct = {
    id: 1,
    name: "MacBook Air M2 13.6 pouces avec puce M2",
    price: 1650000,
    image: "/placeholder.svg",
    seller: "Tech Innovation Premium",
    rating: 4.9,
    reviews: 89,
    inStock: true,
    discount: 8,
    isHot: true,
    isNew: true,
    isLimited: false
  }

  const testSeller = {
    name: "Tech Innovation Premium",
    avatar: "/vendor-avatar.png",
    rating: 4.9,
    totalSales: 1250,
    responseTime: "2-4h",
    location: "Abidjan, CI",
    phone: "+225 0701234567",
    email: "contact@techinnovation.ci",
    isOnline: true
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Test du Widget de Chat
        </h1>
        
        <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Instructions de Test :</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li><strong>Cliquez sur "Ouvrir le Chat"</strong> pour tester le widget</li>
            <li><strong>Vérifiez que le header est complet</strong> avec toutes les informations du vendeur</li>
            <li><strong>Vérifiez que la carte produit est visible</strong> sans être coupée</li>
            <li><strong>Vérifiez que les messages sont visibles</strong> et que le scroll fonctionne</li>
            <li><strong>Testez la fermeture</strong> avec le bouton X</li>
          </ol>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3 text-blue-800">Problèmes à vérifier :</h2>
          <div className="text-sm text-blue-700 space-y-2">
            <p>✅ <strong>Header complet :</strong> Nom du vendeur, avatar, statut, temps de réponse, note, ventes</p>
            <p>✅ <strong>Carte produit :</strong> Image, nom, prix, note, stock, boutons d'action</p>
            <p>✅ <strong>Messages :</strong> Zone de chat visible avec scroll</p>
            <p>✅ <strong>Hauteur :</strong> Widget de 700px pour éviter les coupures</p>
          </div>
        </div>

        <div className="text-center space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <MessageCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Système de Chat Migré !
            </h3>
            <p className="text-gray-600 mb-4">
              L'ancien widget de chat a été remplacé par le nouveau système de chat global synchronisé.
            </p>
            <div className="space-y-3">
              <Link href="/test-chat">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Tester le Nouveau Système de Chat
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Retour au Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
