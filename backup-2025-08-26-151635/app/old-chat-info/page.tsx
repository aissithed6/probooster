"use client"

import { MessageCircle, ArrowRight, CheckCircle, Star } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OldChatInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <MessageCircle className="h-20 w-20 text-orange-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Nouveau Système de Chat Global !
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            L'ancien système de chat a été remplacé par une solution moderne, synchronisée et plus performante.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Avant */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center">
                ❌ Ancien Système
              </CardTitle>
              <CardDescription className="text-red-600">
                Limitations de l'ancien widget de chat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-red-700">
              <p>• Chats isolés et non synchronisés</p>
              <p>• Interface basique</p>
              <p>• Fonctionnalités limitées</p>
              <p>• Pas de gestion avancée des messages</p>
              <p>• Design non responsive</p>
            </CardContent>
          </Card>

          {/* Après */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800 flex items-center">
                ✅ Nouveau Système
              </CardTitle>
              <CardDescription className="text-green-600">
                Fonctionnalités avancées du nouveau chat global
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-green-700">
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Synchronisation globale des conversations
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Interface moderne et responsive
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Gestion avancée des messages
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Référencement automatique des produits
              </p>
              <p className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Support emojis et pièces jointes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fonctionnalités détaillées */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-6 w-6 text-orange-500 mr-3" />
              Nouvelles Fonctionnalités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Chat Global</h3>
                <p className="text-sm text-gray-600">
                  Conversations synchronisées accessible depuis partout
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Gestion Avancée</h3>
                <p className="text-sm text-gray-600">
                  Sélection multiple, archivage, transfert de messages
                </p>
              </div>

              <div className="text-center p-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Interface Moderne</h3>
                <p className="text-sm text-gray-600">
                  Design responsive, emojis, pièces jointes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center space-y-4">
          <div className="space-y-4">
            <Link href="/test-chat">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-4">
                <MessageCircle className="h-5 w-5 mr-2" />
                Tester le Nouveau Chat Global
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            
            <div className="flex justify-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">
                  Retour au Dashboard
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline">
                  Retour à l'Accueil
                </Button>
              </Link>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            💡 Le nouveau système est déjà intégré et prêt à être utilisé !
          </p>
        </div>
      </div>
    </div>
  )
}
