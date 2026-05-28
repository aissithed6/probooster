"use client"

import { useState } from "react"
import { Gift, Sparkles, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HeaderPromo() {
  const [showPromoCodeModal, setShowPromoCodeModal] = useState(false)
  const [promoCode, setPromoCode] = useState("")

  // Fonction utilitaire pour localStorage sécurisé
  const safeLocalStorage = {
    getItem: (key: string, defaultValue: string = '') => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || defaultValue
      }
      return defaultValue
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    }
  }

  const handleApplyPromoCode = () => {
    if (!promoCode.trim()) {
      alert('❌ Veuillez entrer un code promo')
      return
    }

    try {
      const code = promoCode.trim().toUpperCase()
      let message = ''
      let applied = false

      // Vérifier les codes promo valides
      switch (code) {
        case 'WELCOME10':
          message = '🎉 Code promo appliqué !\n✅ Réduction de 10% appliquée'
          applied = true
          break
        case 'FREESHIP':
          message = '🎉 Code promo appliqué !\n✅ Livraison gratuite activée'
          applied = true
          break
        case 'BONUS50':
          message = '🎉 Code promo appliqué !\n✅ +50 points bonus ajoutés'
          // Ajouter les points
          const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
          safeLocalStorage.setItem('userPoints', (currentPoints + 50).toString())
          applied = true
          break
        default:
          message = '❌ Code promo invalide\n💡 Essayez: WELCOME10, FREESHIP, BONUS50'
          applied = false
      }

      alert(message)

      if (applied) {
        // Sauvegarder le code promo appliqué
        safeLocalStorage.setItem('appliedPromoCode', code)
        safeLocalStorage.setItem('promoCodeAppliedAt', new Date().toISOString())
        
        // Fermer la modale et réinitialiser
        setShowPromoCodeModal(false)
        setPromoCode("")
      }
    } catch (error) {
      console.error('Erreur lors de l\'application du code promo:', error)
      alert('❌ Erreur lors de l\'application du code promo')
    }
  }

  const suggestedCodes = [
    { code: 'WELCOME10', description: 'Réduction de 10% sur votre première commande', discount: '10% OFF' },
    { code: 'FREESHIP', description: 'Livraison gratuite sur toute commande', discount: 'Livraison gratuite' },
    { code: 'BONUS50', description: '50 points bonus ajoutés à votre compte', discount: '+50 pts' }
  ]

  return (
    <div className="flex items-center space-x-3">
      {/* Promo Code Button */}
      <Dialog open={showPromoCodeModal} onOpenChange={setShowPromoCodeModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
          >
            <Gift className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-[#ff6600]" />
              <span>Code Promo</span>
            </DialogTitle>
            <DialogDescription>
              Entrez votre code promo pour obtenir une réduction
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Input du code promo */}
            <div className="space-y-2">
              <label htmlFor="promoCode" className="text-sm font-medium text-gray-700">
                Code promo
              </label>
              <Input
                id="promoCode"
                placeholder="Ex: WELCOME10"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleApplyPromoCode()}
                className="text-center font-mono text-lg tracking-wider"
              />
            </div>

            {/* Bouton d'application */}
            <Button 
              onClick={handleApplyPromoCode}
              className="w-full bg-[#ff6600] hover:bg-[#e55a00]"
              disabled={!promoCode.trim()}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Appliquer le code
            </Button>

            {/* Codes promo suggérés */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Codes promo suggérés</h4>
              <div className="grid gap-2">
                {suggestedCodes.map((suggestion) => (
                  <Card 
                    key={suggestion.code}
                    className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-2 border-gray-100 hover:border-[#ff6600]"
                    onClick={() => {
                      setPromoCode(suggestion.code)
                      setTimeout(() => handleApplyPromoCode(), 100)
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {suggestion.code}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              {suggestion.discount}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                        </div>
                        <Sparkles className="h-4 w-4 text-[#ff6600]" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>💡 Un seul code promo par commande</p>
              <p>📅 Codes valides jusqu'à la fin du mois</p>
              <p>🎯 Cumulable avec les points de fidélité</p>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPromoCodeModal(false)}
                className="flex-1"
              >
                Fermer
              </Button>
              <Button 
                onClick={handleApplyPromoCode}
                className="flex-1 bg-[#ff6600] hover:bg-[#e55a00]"
              >
                Appliquer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


