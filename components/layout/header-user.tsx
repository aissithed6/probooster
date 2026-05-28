"use client"

import { useState, useEffect } from "react"
import { User, ChevronDown, LogOut, Settings, CreditCard, Gift, Coins } from "lucide-react"
import { 
  PointsService, 
  AuthService
} from "@/lib/services"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HeaderUser() {
  // États avec valeurs par défaut
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userPoints, setUserPoints] = useState(1000)
  const [pointsValue, setPointsValue] = useState(10000)
  const [withdrawalThreshold] = useState(5000)
  const [isClient, setIsClient] = useState(false)

  // Initialisation des services et mise à jour des états
  useEffect(() => {
    setIsClient(true)
    
    try {
      // Les services sont maintenant auto-initialisés
      
      // Mettre à jour les états après l'initialisation des services
      setIsLoggedIn(AuthService.isLoggedIn())
      setUserPoints(PointsService.getUserPoints())
      setPointsValue(PointsService.getPointsValue())
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services:', error)
    }
  }, [])

  const handleLogout = () => {
    try {
      AuthService.logout()
      setIsLoggedIn(false)
      setUserPoints(1000)
      setPointsValue(10000)
      
      // Rediriger vers la page d'accueil
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const handleWithdrawPoints = () => {
    try {
      const withdrawn = PointsService.withdrawPoints(500)
      if (withdrawn > 0) {
        setUserPoints(PointsService.getUserPoints())
        setPointsValue(PointsService.getPointsValue())
        alert('Points retirés avec succès !')
      } else {
        alert('Points insuffisants pour le retrait')
      }
    } catch (error) {
      console.error('Erreur lors du retrait des points:', error)
      alert('Erreur lors du retrait des points')
    }
  }

  // Calcul du pourcentage de progression pour le retrait
  const progressPercentage = Math.min((pointsValue / withdrawalThreshold) * 100, 100)

  if (!isClient) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2 text-2xl font-bold text-gray-900">
          <User className="h-6 w-6 text-[#ff6600]" />
          <span>Mon Profil</span>
        </DialogTitle>
        <DialogDescription>
          Gérez votre profil, vos points et vos paramètres
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* Informations utilisateur */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-[#ff6600]" />
              <span>Informations personnelles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-[#ff6600] text-white text-xl">
                  {isLoggedIn ? 'U' : 'G'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {isLoggedIn ? 'Utilisateur Connecté' : 'Invité'}
                </h3>
                <p className="text-gray-500">
                  {isLoggedIn ? 'Connecté' : 'Non connecté'}
                </p>
              </div>
            </div>
            
            {!isLoggedIn && (
              <Button className="w-full bg-[#ff6600] hover:bg-[#e55a00]">
                Se connecter
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Points et récompenses */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span>Mes Points</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#ff6600] mb-2">
                {userPoints} points
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Valeur: {pointsValue.toLocaleString()} F CFA
              </div>
              
              <Progress value={progressPercentage} className="h-2 mb-4" />
              
              <div className="text-xs text-gray-500 mb-4">
                {progressPercentage >= 100 
                  ? "✅ Retrait disponible" 
                  : `${withdrawalThreshold - pointsValue} F CFA restants pour le retrait`}
              </div>
              
              {progressPercentage >= 100 && (
                <Button 
                  onClick={handleWithdrawPoints}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Retirer mes points
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <span>Actions rapides</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Settings className="h-6 w-6 mb-2 text-blue-600" />
                <span className="text-sm font-medium">Paramètres</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <CreditCard className="h-6 w-6 mb-2 text-green-600" />
                <span className="text-sm font-medium">Mes commandes</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Gift className="h-6 w-6 mb-2 text-purple-600" />
                <span className="text-sm font-medium">Récompenses</span>
              </Button>
              
              <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
                <Coins className="h-6 w-6 mb-2 text-yellow-600" />
                <span className="text-sm font-medium">Historique</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Déconnexion */}
        {isLoggedIn && (
          <Card className="p-6 border-red-200 bg-red-50">
            <CardContent>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                className="w-full border-red-300 text-red-600 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

