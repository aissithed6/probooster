"use client"

import { useState } from "react"
import { useNotifications } from "@/components/ui/modern-notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShoppingCart, Heart, Share2, MessageCircle } from "lucide-react"

export default function TestModalNotificationsPage() {
  const { addNotification } = useNotifications()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const testNotification = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Succès !', message: 'Cette notification devrait s\'afficher au-dessus du modal' },
      error: { title: 'Erreur !', message: 'Cette notification d\'erreur devrait être visible' },
      warning: { title: 'Attention !', message: 'Cette notification d\'avertissement devrait apparaître' },
      info: { title: 'Information', message: 'Cette notification d\'information devrait être visible' }
    }

    addNotification({
      type,
      title: messages[type].title,
      message: messages[type].message
    })
  }

  const testAllNotifications = () => {
    setTimeout(() => testNotification('success'), 100)
    setTimeout(() => testNotification('error'), 1000)
    setTimeout(() => testNotification('warning'), 2000)
    setTimeout(() => testNotification('info'), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Modal + Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Testez que les notifications s'affichent correctement au-dessus du modal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Test Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => testNotification('success')}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Notification Succès
              </Button>
              <Button 
                onClick={() => testNotification('error')}
                className="w-full bg-red-500 hover:bg-red-600"
              >
                Notification Erreur
              </Button>
              <Button 
                onClick={() => testNotification('warning')}
                className="w-full bg-yellow-500 hover:bg-yellow-600"
              >
                Notification Avertissement
              </Button>
              <Button 
                onClick={() => testNotification('info')}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Notification Info
              </Button>
              <Button 
                onClick={testAllNotifications}
                className="w-full bg-purple-500 hover:bg-purple-600"
              >
                Toutes les Notifications
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🔍 Test Modal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Ouvrez le modal et testez les notifications
              </p>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">
                    Ouvrir le Modal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Modal de Test</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Ce modal est ouvert pour tester que les notifications s'affichent correctement au-dessus.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={() => testNotification('success')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ajouter au Panier
                      </Button>
                      <Button 
                        onClick={() => testNotification('error')}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Favoris
                      </Button>
                      <Button 
                        onClick={() => testNotification('warning')}
                        variant="outline"
                        className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </Button>
                      <Button 
                        onClick={() => testNotification('info')}
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Button>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        <strong>Instructions :</strong>
                      </p>
                      <ul className="text-sm text-gray-500 mt-2 space-y-1">
                        <li>• Cliquez sur "Ouvrir le Modal"</li>
                        <li>• Testez les boutons dans le modal</li>
                        <li>• Vérifiez que les notifications s'affichent au-dessus</li>
                        <li>• Les notifications doivent être visibles et cliquables</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">🐛 Diagnostic du Conflit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-700">
            <p>• <strong>Problème identifié</strong> : Dialog et Notifications utilisaient tous les deux z-50</p>
            <p>• <strong>Solution appliquée</strong> : Notifications maintenant en z-[9999]</p>
            <p>• <strong>Test requis</strong> : Vérifiez que les notifications s'affichent au-dessus du modal</p>
            <p>• <strong>Résultat attendu</strong> : Notifications visibles et cliquables même avec le modal ouvert</p>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>1. <strong>Ouvrez le modal</strong> en cliquant sur "Ouvrir le Modal"</p>
            <p>2. <strong>Testez les notifications</strong> en cliquant sur les boutons dans le modal</p>
            <p>3. <strong>Vérifiez la visibilité</strong> : les notifications doivent être au-dessus du modal</p>
            <p>4. <strong>Testez l'interaction</strong> : les notifications doivent être cliquables</p>
            <p>5. <strong>Fermez le modal</strong> et vérifiez que les notifications restent visibles</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
