"use client"

import { useNotifications } from "@/components/ui/modern-notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Info, XCircle } from "lucide-react"

export default function TestNotificationsPage() {
  const { addNotification, clearAll } = useNotifications()

  const testNotifications = [
    {
      type: 'success' as const,
      title: 'Succès !',
      message: 'Cette notification de succès fonctionne parfaitement',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      type: 'error' as const,
      title: 'Erreur !',
      message: 'Cette notification d\'erreur s\'affiche correctement',
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      type: 'warning' as const,
      title: 'Attention !',
      message: 'Cette notification d\'avertissement est visible',
      icon: AlertCircle,
      color: 'text-yellow-600'
    },
    {
      type: 'info' as const,
      title: 'Information',
      message: 'Cette notification d\'information s\'affiche bien',
      icon: Info,
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔔 Test des Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Testez tous les types de notifications pour vérifier qu'ils fonctionnent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {testNotifications.map((notification, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className={`flex items-center ${notification.color}`}>
                  <notification.icon className="h-5 w-5 mr-2" />
                  {notification.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{notification.message}</p>
                <Button
                  onClick={() => addNotification({
                    type: notification.type,
                    title: notification.title,
                    message: notification.message
                  })}
                  className="w-full"
                  variant={notification.type === 'success' ? 'default' : 'outline'}
                >
                  Tester {notification.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={clearAll}
            variant="outline"
            size="lg"
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          >
            🗑️ Effacer toutes les notifications
          </Button>
        </div>

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700">
            <p>• <strong>Cliquez sur chaque bouton</strong> pour tester les différents types de notifications</p>
            <p>• <strong>Vérifiez l'apparence</strong> : couleurs, icônes, animations</p>
            <p>• <strong>Testez l'auto-fermeture</strong> : les notifications se ferment automatiquement après 5 secondes</p>
            <p>• <strong>Utilisez le bouton fermer</strong> (X) pour fermer manuellement une notification</p>
            <p>• <strong>Cliquez sur "Effacer toutes"</strong> pour supprimer toutes les notifications</p>
            <p>• <strong>Vérifiez la responsivité</strong> sur mobile et desktop</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
