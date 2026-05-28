"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { 
  X, 
  Coins, 
  Gift, 
  Star, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Zap,
  Crown,
  Sparkles,
  Target,
  Award,
  Users,
  Clock,
  Heart,
  ShoppingCart,
  CreditCard,
  Wallet,
  Calculator,
  Info,
  Flame
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string | number
  name: string
  price: number
  pointsPrice: number
  image: string
  rating: number
  reviews: number
  discount?: number
  isHot?: boolean
  isNew?: boolean
  isLimited?: boolean
}

interface PointsPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  userPoints?: number
  onPurchase: (product: Product, usePoints: boolean, pointsToUse: number) => void
}

function PointsPurchaseModalContent({
  product,
  userPoints = 2500,
  onClose,
  onPurchase
}: {
  product: Product
  userPoints: number
  onClose: () => void
  onPurchase: (product: Product, usePoints: boolean, pointsToUse: number) => void
}) {
  const { toast } = useToast()
  const [pointsToUse, setPointsToUse] = useState(0)
  const [purchaseMethod, setPurchaseMethod] = useState<"points" | "mixed" | "cash">("points")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Calculs dynamiques
  const maxPointsToUse = Math.min(userPoints, product.pointsPrice)
  const remainingPrice = product.price - (pointsToUse * 100)
  const pointsSaved = product.pointsPrice - pointsToUse
  const totalPointsEarned = Math.floor(remainingPrice / 100) + (product.discount ? 50 : 0)
  const finalPrice = remainingPrice > 0 ? remainingPrice : 0

  // Points bonus et avantages
  const bonusPoints = Math.floor(pointsToUse * 0.1) // 10% de bonus
  const loyaltyPoints = Math.floor(pointsToUse * 0.05) // 5% de fidélité
  const totalBonusPoints = bonusPoints + loyaltyPoints

  useEffect(() => {
    if (maxPointsToUse > 0) {
      setPointsToUse(maxPointsToUse)
      setPurchaseMethod("points")
      setShowConfirmation(false)
    }
  }, [maxPointsToUse])

  const handlePurchase = async () => {
    setIsProcessing(true)
    
    // Simulation d'un processus d'achat
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsProcessing(false)
    setShowConfirmation(true)
    
    // Appel de la fonction d'achat
    onPurchase(product, purchaseMethod === "points", pointsToUse)
    
    // Fermer le modal après 3 secondes
    setTimeout(() => {
      onClose()
    }, 3000)
  }

  const handlePointsChange = (newPoints: number) => {
    if (newPoints >= 0 && newPoints <= maxPointsToUse) {
      setPointsToUse(newPoints)
      
      if (newPoints === 0) {
        setPurchaseMethod("cash")
      } else if (newPoints === maxPointsToUse) {
        setPurchaseMethod("points")
      } else {
        setPurchaseMethod("mixed")
      }
    }
  }

  const handleMethodChange = (method: "points" | "mixed" | "cash") => {
    setPurchaseMethod(method)
    
    switch (method) {
      case "points":
        setPointsToUse(maxPointsToUse)
        break
      case "mixed":
        setPointsToUse(Math.floor(maxPointsToUse / 2))
        break
      case "cash":
        setPointsToUse(0)
        break
    }
  }

  if (showConfirmation) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Achat Réussi !</h3>
          <p className="text-gray-600 mb-6">
            Votre commande a été traitée avec succès. Vous recevrez un email de confirmation.
          </p>
          
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-green-800">
              <div className="font-semibold mb-2">Récapitulatif :</div>
              <div>Produit : {product.name}</div>
              <div>Points utilisés : {pointsToUse}</div>
              <div>Prix final : {finalPrice.toLocaleString()} F CFA</div>
            </div>
          </div>
          
          <Button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Fermer
          </Button>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header avec bouton fermer */}
        <div className="sticky top-0 bg-white rounded-t-3xl p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Achat avec Points</h2>
                <p className="text-gray-600">Utilisez vos points pour économiser sur cet achat</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations du produit */}
          <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-10 h-10 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < product.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">({product.reviews} avis)</span>
                    </div>
                    {product.isHot && (
                      <Badge variant="destructive" className="bg-red-500">
                        <Flame className="w-3 h-3 mr-1" />
                        Populaire
                      </Badge>
                    )}
                    {product.isNew && (
                      <Badge className="bg-green-500">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Nouveau
                      </Badge>
                    )}
                    {product.isLimited && (
                      <Badge className="bg-purple-500">
                        <Clock className="w-3 h-3 mr-1" />
                        Limité
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl font-bold text-orange-600">
                      {product.price.toLocaleString()} F CFA
                    </div>
                    <div className="text-lg text-gray-500">
                      <span className="line-through">{product.price?.toLocaleString()} F CFA</span>
                    </div>
                    {product.discount && (
                      <Badge className="bg-green-500 text-white">
                        -{product.discount}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sélection de la méthode d'achat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Méthode d'Achat</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={purchaseMethod === "points" ? "default" : "outline"}
                  onClick={() => handleMethodChange("points")}
                  className={`h-20 flex-col space-y-2 ${
                    purchaseMethod === "points" 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'hover:border-orange-300'
                  }`}
                >
                  <Coins className="w-6 h-6" />
                  <span className="text-sm font-semibold">100% Points</span>
                  <span className="text-xs opacity-80">
                    {maxPointsToUse} points requis
                  </span>
                </Button>

                <Button
                  variant={purchaseMethod === "mixed" ? "default" : "outline"}
                  onClick={() => handleMethodChange("mixed")}
                  className={`h-20 flex-col space-y-2 ${
                    purchaseMethod === "mixed" 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'hover:border-blue-300'
                  }`}
                >
                  <Calculator className="w-6 h-6" />
                  <span className="text-sm font-semibold">Mixte</span>
                  <span className="text-xs opacity-80">
                    Points + Espèces
                  </span>
                </Button>

                <Button
                  variant={purchaseMethod === "cash" ? "default" : "outline"}
                  onClick={() => handleMethodChange("cash")}
                  className={`h-20 flex-col space-y-2 ${
                    purchaseMethod === "cash" 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'hover:border-green-300'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-semibold">100% Espèces</span>
                  <span className="text-xs opacity-80">
                    Paiement classique
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gestion des points */}
          {purchaseMethod !== "cash" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <span>Gestion des Points</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Coins className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Vos Points Disponibles</div>
                      <div className="text-2xl font-bold text-green-600">{userPoints.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Valeur estimée</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {(userPoints * 100).toLocaleString()} F CFA
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Points à utiliser :</span>
                    <span className="text-lg font-bold text-orange-600">{pointsToUse.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">0</span>
                    <input
                      type="range"
                      min="0"
                      max={maxPointsToUse}
                      value={pointsToUse}
                      onChange={(e) => handlePointsChange(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-sm text-gray-600">{maxPointsToUse.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Économies :</span>
                    <span className="font-semibold text-green-600">
                      {(pointsToUse * 100).toLocaleString()} F CFA
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Résumé de l'achat */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Calculator className="w-5 h-5" />
                <span>Résumé de l'Achat</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix original :</span>
                    <span className="font-semibold">{product.price.toLocaleString()} F CFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points utilisés :</span>
                    <span className="font-semibold text-orange-600">-{pointsToUse.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Économies :</span>
                    <span className="font-semibold text-green-600">-{(pointsToUse * 100).toLocaleString()} F CFA</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Prix final :</span>
                    <span className="text-blue-600">{finalPrice.toLocaleString()} F CFA</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <div className="text-center mb-3">
                    <div className="text-sm text-blue-600 font-medium">Points Bonus Gagnés</div>
                    <div className="text-2xl font-bold text-purple-600">+{totalBonusPoints + totalPointsEarned}</div>
                    <div className="text-sm text-purple-600">points au total</div>
                  </div>
                </div>
              </div>

              {/* Garanties et sécurité */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <span className="font-semibold text-gray-800">Garanties et Sécurité</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 h-4 text-green-500" />
                    <span>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 h-4 text-green-500" />
                    <span>Garantie 30 jours</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 h-4 text-green-500" />
                    <span>Livraison rapide</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 h-4 text-green-500" />
                    <span>Support 24/7</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-14 text-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-300"
            >
              Annuler
            </Button>
            
            <Button
              onClick={handlePurchase}
              disabled={isProcessing || pointsToUse === 0}
              className="flex-1 h-14 text-lg bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Traitement en cours...</span>
                </div>
              ) : (
                <>
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <Coins className="h-6 h-6 mr-2 animate-pulse" />
                  <span>
                    {purchaseMethod === "points" ? "Acheter avec Points" : 
                     purchaseMethod === "mixed" ? "Acheter Mixte" : "Acheter en Espèces"}
                  </span>
                </>
              )}
            </Button>
          </div>

          {/* Informations supplémentaires */}
          <div className="text-center text-sm text-gray-500 space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <Info className="h-4 h-4" />
              <span>Vos points sont convertis au taux de 1 point = 1 F CFA</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-4 h-4" />
              <span>Les points bonus sont crédités sous 24h</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function PointsPurchaseModal({
  isOpen,
  onClose,
  product,
  userPoints = 2500,
  onPurchase
}: PointsPurchaseModalProps) {
  // Vérification de sécurité avant le rendu
  if (!product || !isOpen) return null

  // Vérification que toutes les propriétés nécessaires existent
  if (!product.id || !product.name || !product.price || !product.pointsPrice || !product.image) {
    console.error("Produit invalide:", product)
    return null
  }

  return (
    <PointsPurchaseModalContent
      product={product}
      userPoints={userPoints}
      onClose={onClose}
      onPurchase={onPurchase}
    />
  )
}
