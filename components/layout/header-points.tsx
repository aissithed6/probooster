"use client"

import { useState, useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Gift, CreditCard, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useClientPoints } from "@/lib/hooks/use-client-points"

export default function HeaderPoints() {
  const [isClient, setIsClient] = useState(false)
  const { balance, estimatedValue, basePointValue, configuration } = useClientPoints()
  const router = useRouter()
  const pathname = usePathname()

  // Initialisation
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleWithdrawPoints = () => {
    if (!isClient) return
    
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('openPointsWithdrawalModal'))
      }

      if (pathname !== '/dashboard') {
        router.push('/dashboard?section=points')
      }
    } catch (error) {
      console.error('Erreur lors du retrait des points:', error)
      alert('Erreur lors du retrait des points')
    }
  }

  const withdrawalThreshold = useMemo(() => {
    const minWithdrawalPointsRaw = (configuration?.limits?.withdrawal as any)?.min
    const minWithdrawalPoints = Number(minWithdrawalPointsRaw)
    if (Number.isFinite(minWithdrawalPoints) && minWithdrawalPoints > 0) {
      // Le seuil min est exprimé en points: on convertit en FCFA via la valeur de retrait.
      return Number((minWithdrawalPoints * basePointValue).toFixed(2))
    }
    return 5000
  }, [configuration?.limits?.withdrawal, basePointValue])

  // Calcul du pourcentage de progression
  const progressPercentage = Math.min(((estimatedValue ?? 0) / withdrawalThreshold) * 100, 100)

  if (!isClient) {
    return (
      <div className="flex items-center space-x-2 text-sm bg-gray-600 rounded-lg px-3 py-2">
        <div className="animate-pulse bg-gray-500 h-7 w-7 rounded-full"></div>
        <div className="animate-pulse bg-gray-500 h-4 w-24 rounded"></div>
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center space-x-2 text-sm bg-gray-600 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-500 transition-colors duration-300">
          {/* Icône des pièces dorées avec animation haut-bas alternée */}
          <div className="relative w-7 h-7 flex items-center justify-center">
            {/* Première pièce (gauche) - Animation vers le haut */}
            <div className="absolute left-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0s' }}>
              1
            </div>
            {/* Deuxième pièce (droite) avec checkmark - Animation vers le bas */}
            <div className="absolute right-0 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-yellow-900 font-bold text-xs shadow-lg animate-bounce" style={{ animationDuration: '1.5s', animationDelay: '0.75s' }}>
              ✓
            </div>
            {/* Effet de brillance subtil */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-yellow-200/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs">
              {balance} pts ({(estimatedValue ?? 0).toLocaleString()} F CFA)
            </span>
            <div className="w-24 mt-1">
              <Progress value={progressPercentage} className="h-1 bg-gray-500" />
              <div className="text-xs text-gray-300 mt-1 whitespace-nowrap">
                {progressPercentage >= 100
                  ? "Retrait disponible"
                  : `${withdrawalThreshold.toLocaleString()} F CFA requis`}
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-[#ff6600]" />
            <span>Mes Points</span>
          </DialogTitle>
          <DialogDescription>
            Gérez vos points de fidélité et consultez votre solde actuel
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white">
            <CardHeader>
              <CardTitle className="text-xl">Solde Actuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">{balance} points</div>
              <div className="text-sm opacity-90">Valeur: {(estimatedValue ?? 0).toLocaleString()} F CFA</div>
              <Progress value={progressPercentage} className="h-2 bg-white/20 mt-3" />
              <div className="text-xs mt-2">
                {progressPercentage >= 100 
                  ? "✅ Retrait disponible" 
                  : `${Math.max(0, withdrawalThreshold - (estimatedValue ?? 0)).toLocaleString()} F CFA restants pour le retrait`}
              </div>
            </CardContent>
          </Card>
          
          {progressPercentage >= 100 && (
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleWithdrawPoints}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Retirer mes points
            </Button>
          )}
          
          <div className="text-sm text-gray-600">
            <p>💡 Gagnez des points en partageant des produits sur les réseaux sociaux !</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


