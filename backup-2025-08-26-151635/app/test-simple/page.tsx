"use client"

import { useNotifications } from "@/components/ui/modern-notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestSimplePage() {
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

  const testAllTypes = () => {
    addNotification({
      type: 'success',
      title: 'Succès !',
      message: 'Opération réussie'
    })
    
    setTimeout(() => {
      addNotification({ 
  type: 'error', 
  title: 'Erreur !', 
  message: 'Une erreur est survenue' 
})
    }, 1000)
    
    setTimeout(() => {
      addNotification({ 
  type: 'warning', 
  title: 'Attention !', 
  message: 'Attention requise' 
})
    }, 2000)
    
    setTimeout(() => {
      addNotification({ 
  type: 'info', 
  title: 'Information', 
  message: 'Information importante' 
})
    }, 3000)
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
              <CardTitle className="text-blue-600">🎯 Test Multiple</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Testez tous les types de notifications
              </p>
              <Button 
                onClick={testAllTypes}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Tester Tous les Types
              </Button>
            </CardContent>
          </Card>
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

        <Card className="mt-8 bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800">🐛 Diagnostic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-yellow-700">
            <p>• <strong>Ouvrez la console</strong> (F12) pour voir les logs</p>
            <p>• <strong>Cliquez sur "Test Simple"</strong> et regardez la console</p>
            <p>• <strong>Vérifiez les notifications</strong> en haut à droite</p>
            <p>• <strong>Si rien n'apparaît</strong>, vérifiez les erreurs dans la console</p>
            <p>• <strong>Vérifiez que NotificationContainer</strong> est bien dans le layout</p>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 Vérifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-blue-700 text-sm">
            <p>✅ <strong>Layout</strong> : NotificationProvider et NotificationContainer sont dans app/layout.tsx</p>
            <p>✅ <strong>Hook</strong> : useNotifications est importé depuis modern-notification</p>
            <p>✅ <strong>Types</strong> : Les types de notification sont corrects</p>
            <p>❓ <strong>Rendu</strong> : NotificationContainer se rend-il correctement ?</p>
            <p>❓ <strong>État</strong> : Les notifications sont-elles ajoutées à l'état ?</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
