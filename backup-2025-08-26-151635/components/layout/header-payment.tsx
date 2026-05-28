"use client"

import { useState, useEffect } from "react"
import { CreditCard, Calculator, Clock, CheckCircle, ArrowLeft, ArrowRight, Wallet, Shield, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HeaderPayment() {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentStep, setPaymentStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [installmentPlan, setInstallmentPlan] = useState(3)
  const [deferredDays, setDeferredDays] = useState(30)
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

  const calculateInstallmentPlan = (total: number, months: number) => {
    const monthlyPayment = total / months
    const totalWithInterest = total * (1 + (months > 3 ? 0.05 : 0)) // 5% d'intérêt après 3 mois
    
    return {
      total: totalWithInterest,
      monthlyPayment: totalWithInterest / months,
      interest: totalWithInterest - total,
      months
    }
  }

  const calculateDeferredPayment = (total: number, days: number) => {
    const interestRate = days > 30 ? 0.08 : 0.03 // 8% après 30 jours, 3% avant
    const interest = total * interestRate
    const totalWithInterest = total + interest
    
    return {
      total: totalWithInterest,
      interest,
      deferredDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      days
    }
  }

  const handleInstallmentPayment = () => {
    try {
      const total = 50000 // Exemple de montant
      const installmentDetails = calculateInstallmentPlan(total, installmentPlan)
      const points = Math.floor(total / 100)
      
      const orderId = `INST-${Date.now().toString().slice(-6)}`
      const orderData = {
        id: orderId,
        timestamp: new Date().toISOString(),
        type: 'installment',
        originalAmount: total,
        totalAmount: installmentDetails.total,
        monthlyPayment: installmentDetails.monthlyPayment,
        months: installmentPlan,
        interest: installmentDetails.interest,
        pointsEarned: points,
        status: 'En cours de traitement'
      }

      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))

      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())

      alert(`✅ Paiement fractionné confirmé !\n\n📋 Commande #${orderId}\n💰 Total: ${installmentDetails.total.toLocaleString()} F CFA\n📅 ${installmentPlan} paiements de ${installmentDetails.monthlyPayment.toLocaleString()} F CFA\n🎁 +${points} points bonus\n\n📧 Récapitulatif envoyé par email`)
    } catch (error) {
      console.error('Erreur lors du paiement fractionné:', error)
      alert('❌ Erreur lors du paiement fractionné')
    }
  }

  const confirmInstallmentPayment = () => {
    try {
      const total = 50000 // Exemple de montant
      const installmentDetails = calculateInstallmentPlan(total, installmentPlan)
      const points = Math.floor(total / 100)
      
      const orderId = `INST-${Date.now().toString().slice(-6)}`
      const orderData = {
        id: orderId,
        timestamp: new Date().toISOString(),
        type: 'installment',
        originalAmount: total,
        totalAmount: installmentDetails.total,
        monthlyPayment: installmentDetails.monthlyPayment,
        months: installmentPlan,
        interest: installmentDetails.interest,
        pointsEarned: points,
        status: 'En cours de traitement'
      }

      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))

      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())

      alert(`✅ Paiement fractionné confirmé !\n\n📋 Commande #${orderId}\n💰 Total: ${installmentDetails.total.toLocaleString()} F CFA\n📅 ${installmentPlan} paiements de ${installmentDetails.monthlyPayment.toLocaleString()} F CFA\n🎁 +${points} points bonus\n\n📧 Récapitulatif envoyé par email`)
    } catch (error) {
      console.error('Erreur lors du paiement fractionné:', error)
      alert('❌ Erreur lors du paiement fractionné')
    }
  }

  const handleDeferredPayment = () => {
    try {
      const total = 50000 // Exemple de montant
      const deferredDetails = calculateDeferredPayment(total, deferredDays)
      const points = Math.floor(total / 100)
      
      const orderId = `DEF-${Date.now().toString().slice(-6)}`
      const orderData = {
        id: orderId,
        timestamp: new Date().toISOString(),
        type: 'deferred',
        originalAmount: total,
        totalAmount: deferredDetails.total,
        deferredDate: deferredDetails.deferredDate,
        interest: deferredDetails.interest,
        days: deferredDays,
        pointsEarned: points,
        status: 'En attente de paiement'
      }

      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))

      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())

      alert(`✅ Paiement différé confirmé !\n\n📋 Commande #${orderId}\n💰 Montant: ${deferredDetails.total.toLocaleString()} F CFA\n📅 Paiement le: ${deferredDetails.deferredDate}\n${deferredDetails.interest > 0 ? `💸 Intérêts: ${deferredDetails.interest.toLocaleString()} F CFA\n` : ''}🎁 +${points} points bonus\n\n📧 Récapitulatif envoyé par email`)
    } catch (error) {
      console.error('Erreur lors du paiement différé:', error)
      alert('❌ Erreur lors du paiement différé')
    }
  }

  const confirmDeferredPayment = () => {
    try {
      const total = 50000 // Exemple de montant
      const deferredDetails = calculateDeferredPayment(total, deferredDays)
      const points = Math.floor(total / 100)
      
      const orderId = `DEF-${Date.now().toString().slice(-6)}`
      const orderData = {
        id: orderId,
        timestamp: new Date().toISOString(),
        type: 'deferred',
        originalAmount: total,
        totalAmount: deferredDetails.total,
        deferredDate: deferredDetails.deferredDate,
        interest: deferredDetails.interest,
        days: deferredDays,
        pointsEarned: points,
        status: 'En attente de paiement'
      }

      // Sauvegarder la commande
      const existingOrders = JSON.parse(safeLocalStorage.getItem('orders', '[]'))
      existingOrders.push(orderData)
      safeLocalStorage.setItem('orders', JSON.stringify(existingOrders))

      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())

      alert(`✅ Paiement différé confirmé !\n\n📋 Commande #${orderId}\n💰 Montant: ${deferredDetails.total.toLocaleString()} F CFA\n📅 Paiement le: ${deferredDetails.deferredDate}\n${deferredDetails.interest > 0 ? `💸 Intérêts: ${deferredDetails.interest.toLocaleString()} F CFA\n` : ''}🎁 +${points} points bonus\n\n📧 Récapitulatif envoyé par email`)
    } catch (error) {
      console.error('Erreur lors du paiement différé:', error)
      alert('❌ Erreur lors du paiement différé')
    }
  }

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method)
  }

  const handlePaymentStep = (step: number) => {
    setPaymentStep(step)
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
      {/* Payment Button */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
          >
            <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-[#ff6600]" />
              <span>Options de paiement</span>
            </DialogTitle>
            <DialogDescription>
              Choisissez votre méthode de paiement préférée
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Méthodes de paiement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className={`cursor-pointer border-2 ${
                  paymentMethod === 'card' ? 'border-[#ff6600]' : 'border-gray-200'
                }`}
                onClick={() => handlePaymentMethodSelect('card')}
              >
                <CardContent className="p-4 text-center">
                  <CreditCard className="h-8 w-8 text-[#ff6600] mx-auto mb-2" />
                  <h4 className="font-semibold">Carte bancaire</h4>
                  <p className="text-sm text-gray-600">Paiement immédiat</p>
                  <Badge className="mt-2 bg-green-100 text-green-800">Sécurisé</Badge>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer border-2 ${
                  paymentMethod === 'installment' ? 'border-[#ff6600]' : 'border-gray-200'
                }`}
                onClick={() => handlePaymentMethodSelect('installment')}
              >
                <CardContent className="p-4 text-center">
                  <Calculator className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold">Paiement fractionné</h4>
                  <p className="text-sm text-gray-600">3x sans frais</p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800">Flexible</Badge>
                </CardContent>
              </Card>
              
              <Card 
                className={`cursor-pointer border-2 ${
                  paymentMethod === 'deferred' ? 'border-[#ff6600]' : 'border-gray-200'
                }`}
                onClick={() => handlePaymentMethodSelect('deferred')}
              >
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold">Paiement différé</h4>
                  <p className="text-sm text-gray-600">Payer plus tard</p>
                  <Badge className="mt-2 bg-purple-100 text-purple-800">Convenant</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Configuration selon la méthode */}
            {paymentMethod === 'installment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span>Configuration du paiement fractionné</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre de mois</label>
                    <Select value={installmentPlan.toString()} onValueChange={(value) => setInstallmentPlan(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 mois</SelectItem>
                        <SelectItem value="3">3 mois</SelectItem>
                        <SelectItem value="6">6 mois</SelectItem>
                        <SelectItem value="12">12 mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Simulation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Montant initial:</span>
                        <span>50 000 F CFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paiement mensuel:</span>
                        <span>{(50000 / installmentPlan).toLocaleString()} F CFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Intérêts:</span>
                        <span>{installmentPlan > 3 ? '5%' : '0%'}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{calculateInstallmentPlan(50000, installmentPlan).total.toLocaleString()} F CFA</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={confirmInstallmentPayment} className="w-full bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer le paiement fractionné
                  </Button>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'deferred' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span>Configuration du paiement différé</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Délai de paiement</label>
                    <Select value={deferredDays.toString()} onValueChange={(value) => setDeferredDays(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 jours</SelectItem>
                        <SelectItem value="15">15 jours</SelectItem>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="60">60 jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Simulation</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Montant initial:</span>
                        <span>50 000 F CFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date de paiement:</span>
                        <span>{new Date(Date.now() + deferredDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taux d'intérêt:</span>
                        <span>{deferredDays > 30 ? '8%' : '3%'}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{calculateDeferredPayment(50000, deferredDays).total.toLocaleString()} F CFA</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={confirmDeferredPayment} className="w-full bg-purple-600 hover:bg-purple-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmer le paiement différé
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Informations de sécurité */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-800">Paiement sécurisé</h4>
                    <p className="text-sm text-green-700">
                      Tous vos paiements sont protégés par un cryptage SSL 256-bit et conformes aux normes PCI DSS.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                Fermer
              </Button>
              
              {paymentMethod === 'card' && (
                <Button onClick={handlePaymentConfirm} className="bg-[#ff6600] hover:bg-[#e55a00]">
                  <Lock className="h-4 w-4 mr-2" />
                  Procéder au paiement sécurisé
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


