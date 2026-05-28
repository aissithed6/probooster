"use client"

import { useNotifications } from "@/components/ui/modern-notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestNotificationsSimplePage() {
  const { addNotification, clearAll } = useNotifications()

  const testNotification = () => {
    console.log("Test de notification - début")
    
    try {
      addNotification({
        type: 'success',
        title: 'Test Réussi !',
        message: 'Cette notification devrait s\'afficher correctement'
      })
      console.log("Notification ajoutée avec succès")
    } catch (error) {
      console.error("Erreur lors de l'ajout de la notification:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Simple des Notifications
          </h1>
          <p className="text-lg text-gray-600">
            Testez les notifications de base pour identifier le problème
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Test Simple</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Testez une notification simple de succès
              </p>
              <Button 
                onClick={testNotification}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                Tester Notification Simple
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">🗑️ Effacer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Effacez toutes les notifications
              </p>
              <Button 
                onClick={clearAll}
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                Effacer toutes les notifications
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">🐛 Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-700">
            <p>• <strong>Ouvrez la console</strong> (F12) pour voir les logs</p>
            <p>• <strong>Cliquez sur "Test Simple"</strong> et regardez la console</p>
            <p>• <strong>Vérifiez les notifications</strong> en haut à droite</p>
            <p>• <strong>Si rien n'apparaît</strong>, vérifiez les erreurs dans la console</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
