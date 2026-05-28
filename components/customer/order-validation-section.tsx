"use client"

import { useState } from 'react'
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, Truck,
  Calendar, User, Package, Star, MessageCircle, 
  ThumbsUp, ThumbsDown, AlertCircle
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface CustomerOrder {
  id: string
  sellerName: string
  sellerEmail: string
  products: Array<{
    id: number
    name: string
    quantity: number
    price: number
    total: number
  }>
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled'
  shippingAddress: string
  orderDate: string
  expectedDeliveryDate: string
  deliveryDate?: string
  trackingNumber?: string
  shippingMethod: string
  notes?: string
  deliveryValidation?: 'delivered' | 'returned' | 'delayed' | 'not-delivered' | null
  validationDate?: string
  customerReview?: string
  customerRating?: number
}

interface OrderValidationSectionProps {
  orders: CustomerOrder[]
  onValidateDelivery: (orderId: string, validation: string, review?: string, rating?: number) => void
}

export default function OrderValidationSection({
  orders,
  onValidateDelivery
}: OrderValidationSectionProps) {
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null)
  const [validationType, setValidationType] = useState<string>('')
  const [review, setReview] = useState('')
  const [rating, setRating] = useState<number>(5)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const isDeliveryDatePassed = (expectedDate: string) => {
    return new Date(expectedDate) < new Date()
  }

  const handleValidateClick = (order: CustomerOrder) => {
    setSelectedOrder(order)
    setShowValidationModal(true)
    setValidationType('')
    setReview('')
    setRating(5)
  }

  const handleValidationSubmit = () => {
    if (selectedOrder && validationType) {
      onValidateDelivery(selectedOrder.id, validationType, review, rating)
      setShowValidationModal(false)
      setSelectedOrder(null)
    }
  }

  const getValidationOptions = (order: CustomerOrder) => {
    const options = [
      { value: 'delivered', label: 'Commande livrée', icon: CheckCircle, color: 'text-green-600' },
      { value: 'returned', label: 'Commande retournée', icon: XCircle, color: 'text-red-600' },
      { value: 'delayed', label: 'Commande livrée avec retard', icon: Clock, color: 'text-orange-600' }
    ]

    // Option "non livrée" uniquement si la date de livraison prévue est passée
    if (isDeliveryDatePassed(order.expectedDeliveryDate)) {
      options.push({ 
        value: 'not-delivered', 
        label: 'Commande non livrée', 
        icon: AlertTriangle, 
        color: 'text-red-600' 
      })
    }

    return options
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'confirmed': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getValidationStatus = (order: CustomerOrder) => {
    if (!order.deliveryValidation) return null

    const statusMap = {
      'delivered': { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'returned': { label: 'Retournée', color: 'bg-red-100 text-red-800', icon: XCircle },
      'delayed': { label: 'Livrée avec retard', color: 'bg-orange-100 text-orange-800', icon: Clock },
      'not-delivered': { label: 'Non livrée', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }

    return statusMap[order.deliveryValidation as keyof typeof statusMap]
  }

  const pendingValidationOrders = orders.filter(order => 
    order.status === 'delivered' && !order.deliveryValidation
  )

  const validatedOrders = orders.filter(order => 
    order.status === 'delivered' && order.deliveryValidation
  )

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Commandes Livrées</p>
                <p className="text-2xl font-bold text-blue-900">
                  {orders.filter(order => order.status === 'delivered').length}
                </p>
              </div>
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">En attente de validation</p>
                <p className="text-2xl font-bold text-orange-900">{pendingValidationOrders.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Validées</p>
                <p className="text-2xl font-bold text-green-900">{validatedOrders.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commandes en attente de validation */}
      {pendingValidationOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span>Commandes en attente de validation</span>
            </CardTitle>
            <CardDescription>
              Veuillez valider vos commandes livrées pour permettre le paiement du vendeur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingValidationOrders.map((order) => (
                <Card key={order.id} className="border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{order.id}</h3>
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              <Clock className="w-3 h-3 mr-1" />
                              En attente de validation
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(order.totalAmount)}</p>
                            <p className="text-sm text-gray-500">
                              Livré le {order.deliveryDate && formatDate(order.deliveryDate)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Vendeur</span>
                            </div>
                            <p className="text-sm text-gray-600">{order.sellerName}</p>
                            <p className="text-sm text-gray-600">{order.sellerEmail}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Truck className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">Livraison</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {order.shippingMethod} • {order.trackingNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              Date prévue: {formatDate(order.expectedDeliveryDate)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Produits commandés :</h4>
                          <div className="space-y-1">
                            {order.products.map((product, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span>{product.name} x{product.quantity}</span>
                                <span className="font-medium">{formatCurrency(product.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4">
                        <Button 
                          onClick={() => handleValidateClick(order)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Valider la Livraison
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commandes validées */}
      {validatedOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Commandes validées</span>
            </CardTitle>
            <CardDescription>
              Historique de vos validations de commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validatedOrders.map((order) => {
                const validationStatus = getValidationStatus(order)
                return (
                  <Card key={order.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-lg">{order.id}</h3>
                              {validationStatus && (
                                <Badge variant="secondary" className={validationStatus.color}>
                                  <validationStatus.icon className="w-3 h-3 mr-1" />
                                  {validationStatus.label}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{formatCurrency(order.totalAmount)}</p>
                              <p className="text-sm text-gray-500">
                                Validé le {order.validationDate && formatDate(order.validationDate)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">Vendeur</span>
                              </div>
                              <p className="text-sm text-gray-600">{order.sellerName}</p>
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">Produits</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {order.products.length} produit(s)
                              </p>
                            </div>
                          </div>

                          {order.customerRating && (
                            <div className="flex items-center space-x-2 mt-3">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < order.customerRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                {order.customerRating}/5
                              </span>
                              {order.customerReview && (
                                <span className="text-sm text-gray-600">
                                  • "{order.customerReview}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de validation */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Valider la Livraison</DialogTitle>
            <DialogDescription>
              Confirmez le statut de votre commande {selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Statut de la livraison</Label>
              <RadioGroup value={validationType} onValueChange={setValidationType} className="mt-2">
                {selectedOrder && getValidationOptions(selectedOrder).map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <option.icon className={`w-4 h-4 ${option.color}`} />
                      <span>{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {validationType === 'delivered' && (
              <>
                <div>
                  <Label htmlFor="rating" className="text-sm font-medium">Note (optionnel)</Label>
                  <div className="flex items-center space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="review" className="text-sm font-medium">Avis (optionnel)</Label>
                  <Textarea
                    id="review"
                    placeholder="Partagez votre expérience..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </>
            )}

            {validationType === 'returned' && (
              <div>
                <Label htmlFor="return-reason" className="text-sm font-medium">Raison du retour</Label>
                <Textarea
                  id="return-reason"
                  placeholder="Expliquez la raison du retour..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            )}

            {validationType === 'delayed' && (
              <div>
                <Label htmlFor="delay-reason" className="text-sm font-medium">Détails du retard</Label>
                <Textarea
                  id="delay-reason"
                  placeholder="Décrivez les circonstances du retard..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            )}

            {validationType === 'not-delivered' && (
              <div>
                <Label htmlFor="not-delivered-reason" className="text-sm font-medium">Raison de la non-livraison</Label>
                <Textarea
                  id="not-delivered-reason"
                  placeholder="Expliquez pourquoi la commande n'a pas été livrée..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowValidationModal(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleValidationSubmit}
              disabled={!validationType}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
