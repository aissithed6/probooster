"use client"

import { useState, useEffect } from "react"
import { ShoppingBag, CreditCard, Calculator, Clock, CheckCircle, ArrowLeft, ArrowRight, Package, Truck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HeaderOrder() {
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderStep, setOrderStep] = useState(1)
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("standard")
  const [pointsToUse, setPointsToUse] = useState(0)
  const [isClient, setIsClient] = useState(false)

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

  // Initialisation
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleOrderNow = () => {
    try {
      // Récupérer les données du panier
      const cartItems = JSON.parse(safeLocalStorage.getItem('cart', '[]'))
      const total = cartItems.reduce((sum: number, item: any) => sum + item.price, 0)
      const pointsEarned = Math.floor(total / 100)

      const orderData = {
        total,
        items: cartItems,
        pointsEarned,
        timestamp: new Date().toISOString()
      }

      setOrderDetails(orderData)
      setShowOrderModal(true)
      setOrderStep(1)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal de commande:', error)
    }
  }

  const calculateOrderTotal = () => {
    if (!orderDetails) return 0
    
    let total = orderDetails.total
    
    // Appliquer la réduction des points
    if (pointsToUse > 0) {
      const pointsValue = pointsToUse * 10 // 1 point = 10 F CFA
      total = Math.max(0, total - pointsValue)
    }
    
    return total
  }

  const handleNextStep = () => {
    if (orderStep < 4) {
      setOrderStep(orderStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (orderStep > 1) {
      setOrderStep(orderStep - 1)
    }
  }

  const handleConfirmOrder = () => {
    if (!isClient || !orderDetails) return
    
    try {
      const finalTotal = calculateOrderTotal()
      const orderId = `ORD-${Date.now().toString().slice(-6)}`
      
      const orderData = {
        id: orderId,
        timestamp: new Date().toISOString(),
        originalTotal: orderDetails.total,
        finalTotal,
        pointsUsed: pointsToUse,
        pointsEarned: orderDetails.pointsEarned,
        paymentMethod: selectedPaymentMethod,
        status: 'En cours de traitement',
        items: orderDetails.items
      }

      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))

      // Mettre à jour les points utilisateur
      if (pointsToUse > 0) {
        const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
        const newPoints = currentPoints - pointsToUse + orderDetails.pointsEarned
        safeLocalStorage.setItem('userPoints', newPoints.toString())
      } else {
        const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
        safeLocalStorage.setItem('userPoints', (currentPoints + orderDetails.pointsEarned).toString())
      }

      // Fermer la modale
      setShowOrderModal(false)
      setOrderStep(1)
      setOrderDetails(null)
      setPointsToUse(0)

      // Message de confirmation
      let confirmationMessage = `✅ Commande confirmée !\n\n📋 Commande #${orderId}\n💰 Total: ${finalTotal.toLocaleString()} F CFA\n`
      
      if (pointsToUse > 0) {
        confirmationMessage += `💳 Points utilisés: ${pointsToUse} pts\n`
      }
      
      confirmationMessage += `🎁 +${orderDetails.pointsEarned} points bonus\n📧 Récapitulatif envoyé par email`
      
      alert(confirmationMessage)
    } catch (error) {
      console.error('Erreur lors de la confirmation de la commande:', error)
      alert('Erreur lors de la confirmation de la commande')
    }
  }

  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method)
  }

  const handlePaymentStep = (step: number) => {
    setOrderStep(step)
  }

  const handlePaymentConfirm = () => {
    // Logique de confirmation de paiement
    alert('💳 Paiement confirmé ! Votre commande est en cours de traitement.')
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Order Button */}
      <Dialog open={showOrderModal} onOpenChange={setShowOrderModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
            onClick={handleOrderNow}
          >
            <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-[#ff6600]" />
              <span>Finaliser la commande</span>
            </DialogTitle>
            <DialogDescription>
              Étape {orderStep} sur 4 - Finalisez votre commande en quelques étapes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Barre de progression */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousStep}
                  disabled={orderStep === 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">Étape {orderStep} sur 4</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextStep}
                  disabled={orderStep === 4}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step <= orderStep ? 'bg-[#ff6600]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Contenu des étapes */}
            {orderStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Récapitulatif de la commande</h3>
                
                {orderDetails?.items?.map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={item.image || '/placeholder-product.jpg'} 
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        {(String(item?.warranty ?? '').trim() || String(item?.returnPolicy ?? '').trim()) && (
                          <p className="text-xs text-gray-600 mt-1">
                            {String(item?.warranty ?? '').trim() && (
                              <span>
                                <span className="font-medium">Garantie:</span> {String(item?.warranty ?? '').trim()}
                              </span>
                            )}
                            {String(item?.warranty ?? '').trim() && String(item?.returnPolicy ?? '').trim() ? (
                              <span className="mx-2">•</span>
                            ) : null}
                            {String(item?.returnPolicy ?? '').trim() && (
                              <span>
                                <span className="font-medium">Retours:</span> {String(item?.returnPolicy ?? '').trim()}
                              </span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{item.rating || 4.5}/5</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#ff6600]">{item.price.toLocaleString()} F CFA</div>
                        <div className="text-sm text-gray-500">+{Math.floor(item.price / 100)} pts</div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                <Card className="p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total de la commande</span>
                    <span className="text-xl font-bold text-[#ff6600]">
                      {orderDetails?.total?.toLocaleString()} F CFA
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Points gagnés: +{orderDetails?.pointsEarned || 0} pts
                  </div>
                </Card>
              </div>
            )}

            {orderStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Méthode de paiement</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer border-2 ${
                      selectedPaymentMethod === 'standard' ? 'border-[#ff6600]' : 'border-gray-200'
                    }`}
                    onClick={() => handlePaymentMethodSelect('standard')}
                  >
                    <CardContent className="p-4 text-center">
                      <CreditCard className="h-8 w-8 text-[#ff6600] mx-auto mb-2" />
                      <h4 className="font-semibold">Paiement standard</h4>
                      <p className="text-sm text-gray-600">Paiement immédiat</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer border-2 ${
                      selectedPaymentMethod === 'installment' ? 'border-[#ff6600]' : 'border-gray-200'
                    }`}
                    onClick={() => handlePaymentMethodSelect('installment')}
                  >
                    <CardContent className="p-4 text-center">
                      <Calculator className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold">Paiement fractionné</h4>
                      <p className="text-sm text-gray-600">3x sans frais</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {orderStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Utilisation des points</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Points disponibles</span>
                    <span className="font-semibold">
                      {parseInt(safeLocalStorage.getItem('userPoints', '1000'))} pts
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Points à utiliser</label>
                    <Input
                      type="number"
                      min="0"
                      max={parseInt(safeLocalStorage.getItem('userPoints', '1000'))}
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">
                      1 point = 10 F CFA • Maximum: {parseInt(safeLocalStorage.getItem('userPoints', '1000'))} pts
                    </p>
                  </div>
                  
                  <Card className="p-4 bg-green-50">
                    <div className="flex justify-between items-center">
                      <span>Économies réalisées</span>
                      <span className="font-bold text-green-600">
                        {(pointsToUse * 10).toLocaleString()} F CFA
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {orderStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Confirmation finale</h3>
                
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{orderDetails?.total?.toLocaleString()} F CFA</span>
                    </div>
                    
                    {pointsToUse > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction points</span>
                        <span>-{(pointsToUse * 10).toLocaleString()} F CFA</span>
                      </div>
                    )}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total final</span>
                        <span className="text-[#ff6600]">
                          {calculateOrderTotal().toLocaleString()} F CFA
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    En confirmant cette commande, vous acceptez nos conditions générales de vente.
                  </p>
                  <p className="text-xs text-gray-500">
                    Points gagnés: +{orderDetails?.pointsEarned || 0} pts
                  </p>
                </div>
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={orderStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
              
              {orderStep < 4 ? (
                <Button
                  onClick={handleNextStep}
                  className="bg-[#ff6600] hover:bg-[#e55a00]"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmOrder}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer la commande
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


