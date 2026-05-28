"use client"

import { useState } from 'react'
import { 
  Tag, Plus, Edit, Trash2, Eye, Download, Filter, Search,
  TrendingUp, Users, Calendar, Target, Zap, Award, Star,
  Clock, CheckCircle, XCircle, AlertTriangle, DollarSign,
  Percent, Gift, ShoppingCart, BarChart3, RefreshCw
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface Promotion {
  id: string
  title: string
  description: string
  type: 'discount' | 'flash' | 'bundle' | 'cashback' | 'free_shipping' | 'points_multiplier'
  value: string
  minAmount?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  products: number[]
  categories: string[]
  isActive: boolean
  usageCount: number
  maxUsage?: number
  conditions: string[]
  image?: string
  priority: number
  performance: {
    totalRevenue: number
    totalOrders: number
    conversionRate: number
    averageOrderValue: number
    customerAcquisition: number
  }
}

interface AdvertisingService {
  id: string
  name: string
  description: string
  price: number
  duration: string
  features: string[]
  type: 'boost' | 'featured' | 'banner' | 'email'
  isPopular?: boolean
}

interface PromotionsSectionProps {
  promotions: Promotion[]
  advertisingServices: AdvertisingService[]
  onPromotionCreate: (promotion: Omit<Promotion, 'id' | 'usageCount' | 'performance'>) => void
  onPromotionUpdate: (promotion: Promotion) => void
  onPromotionDelete: (promotionId: string) => void
  onAdvertisingPurchase: (serviceId: string) => void
}

export default function PromotionsSection({
  promotions,
  advertisingServices,
  onPromotionCreate,
  onPromotionUpdate,
  onPromotionDelete,
  onAdvertisingPurchase
}: PromotionsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [activeTab, setActiveTab] = useState('promotions')

  // Nouvelle promotion
  const [newPromotion, setNewPromotion] = useState({
    title: '',
    description: '',
    type: 'discount' as Promotion['type'],
    value: '',
    minAmount: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    products: [] as number[],
    categories: [] as string[],
    maxUsage: 0,
    conditions: [] as string[],
    priority: 1
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discount': return 'bg-blue-100 text-blue-800'
      case 'flash': return 'bg-red-100 text-red-800'
      case 'bundle': return 'bg-purple-100 text-purple-800'
      case 'cashback': return 'bg-green-100 text-green-800'
      case 'free_shipping': return 'bg-orange-100 text-orange-800'
      case 'points_multiplier': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount': return <Percent className="w-4 h-4" />
      case 'flash': return <Zap className="w-4 h-4" />
      case 'bundle': return <Gift className="w-4 h-4" />
      case 'cashback': return <DollarSign className="w-4 h-4" />
      case 'free_shipping': return <ShoppingCart className="w-4 h-4" />
      case 'points_multiplier': return <Award className="w-4 h-4" />
      default: return <Tag className="w-4 h-4" />
    }
  }

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && promotion.isActive) ||
                         (statusFilter === 'inactive' && !promotion.isActive)
    const matchesType = typeFilter === 'all' || promotion.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const handleCreatePromotion = () => {
    const promotion: Omit<Promotion, 'id' | 'usageCount' | 'performance'> = {
      title: newPromotion.title,
      description: newPromotion.description,
      type: newPromotion.type,
      value: newPromotion.value,
      minAmount: newPromotion.minAmount,
      maxDiscount: newPromotion.maxDiscount,
      startDate: newPromotion.startDate,
      endDate: newPromotion.endDate,
      products: newPromotion.products,
      categories: newPromotion.categories,
      isActive: true,
      maxUsage: newPromotion.maxUsage,
      conditions: newPromotion.conditions,
      priority: newPromotion.priority
    }
    onPromotionCreate(promotion)
    setShowCreateModal(false)
    setNewPromotion({
      title: '',
      description: '',
      type: 'discount',
      value: '',
      minAmount: 0,
      maxDiscount: 0,
      startDate: '',
      endDate: '',
      products: [],
      categories: [],
      maxUsage: 0,
      conditions: [],
      priority: 1
    })
  }

  const handleEditPromotion = () => {
    if (selectedPromotion) {
      onPromotionUpdate(selectedPromotion)
      setShowEditModal(false)
      setSelectedPromotion(null)
    }
  }

  const handleDeletePromotion = (promotionId: string) => {
    onPromotionDelete(promotionId)
  }

  const activePromotions = promotions.filter(p => p.isActive)
  const totalRevenue = activePromotions.reduce((sum, p) => sum + p.performance.totalRevenue, 0)
  const totalOrders = activePromotions.reduce((sum, p) => sum + p.performance.totalOrders, 0)
  const averageConversionRate = activePromotions.length > 0 
    ? activePromotions.reduce((sum, p) => sum + p.performance.conversionRate, 0) / activePromotions.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Statistiques des promotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">Promotions Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-900">{activePromotions.length}</div>
              <Tag className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-orange-600 mt-2">En cours</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Revenus Générés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-900">{formatCurrency(totalRevenue)}</div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">Par promotions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-900">{totalOrders}</div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-blue-600 mt-2">Via promotions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700">Taux de Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-900">{averageConversionRate.toFixed(1)}%</div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-purple-600 mt-2">Moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation des onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="promotions">Mes Promotions</TabsTrigger>
          <TabsTrigger value="advertising">Services Publicitaires</TabsTrigger>
        </TabsList>

        {/* Section Promotions */}
        <TabsContent value="promotions" className="space-y-6">
          {/* Filtres et actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gestion des Promotions</span>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle Promotion
                </Button>
              </CardTitle>
              <CardDescription>Créez et gérez vos codes promo et campagnes marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher une promotion..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actives</SelectItem>
                    <SelectItem value="inactive">Inactives</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="discount">Réduction</SelectItem>
                    <SelectItem value="flash">Flash Sale</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                    <SelectItem value="points_multiplier">Points x2</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>

              {/* Liste des promotions */}
              <div className="space-y-4">
                {filteredPromotions.map((promotion) => (
                  <Card key={promotion.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getTypeIcon(promotion.type)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{promotion.title}</h3>
                              <Badge className={getTypeColor(promotion.type)}>
                                {promotion.type}
                              </Badge>
                              {promotion.isActive ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{promotion.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Valeur: {promotion.value}</span>
                              <span>•</span>
                              <span>Utilisations: {promotion.usageCount}{promotion.maxUsage ? `/${promotion.maxUsage}` : ''}</span>
                              <span>•</span>
                              <span>Du {formatDate(promotion.startDate)} au {formatDate(promotion.endDate)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-600">Revenus générés</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(promotion.performance.totalRevenue)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedPromotion(promotion)
                                  setShowEditModal(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Modifier
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeletePromotion(promotion.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Performance détaillée */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {formatCurrency(promotion.performance.totalRevenue)}
                            </div>
                            <div className="text-xs text-gray-500">Revenus totaux</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {promotion.performance.totalOrders}
                            </div>
                            <div className="text-xs text-gray-500">Commandes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {promotion.performance.conversionRate}%
                            </div>
                            <div className="text-xs text-gray-500">Taux de conversion</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {formatCurrency(promotion.performance.averageOrderValue)}
                            </div>
                            <div className="text-xs text-gray-500">Panier moyen</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section Services Publicitaires */}
        <TabsContent value="advertising" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Services Publicitaires</span>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </CardTitle>
              <CardDescription>
                Boostez vos ventes avec nos services publicitaires premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advertisingServices.map((service) => (
                  <Card key={service.id} className={`relative hover:shadow-lg transition-shadow ${
                    service.isPopular ? 'ring-2 ring-orange-500' : ''
                  }`}>
                    {service.isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-orange-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Populaire
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        {service.type === 'boost' && <Zap className="w-5 h-5 text-yellow-500" />}
                        {service.type === 'featured' && <Award className="w-5 h-5 text-blue-500" />}
                        {service.type === 'banner' && <BarChart3 className="w-5 h-5 text-green-500" />}
                        {service.type === 'email' && <Target className="w-5 h-5 text-purple-500" />}
                        <span>{service.name}</span>
                      </CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-600">
                            {formatCurrency(service.price)}
                          </div>
                          <div className="text-sm text-gray-500">{service.duration}</div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Fonctionnalités incluses:</h4>
                          <ul className="space-y-1">
                            {service.features.map((feature, index) => (
                              <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          onClick={() => onAdvertisingPurchase(service.id)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Acheter maintenant
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de création de promotion */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Promotion</DialogTitle>
            <DialogDescription>
              Créez une nouvelle promotion pour booster vos ventes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Titre de la promotion</Label>
                <Input
                  value={newPromotion.title}
                  onChange={(e) => setNewPromotion({...newPromotion, title: e.target.value})}
                  placeholder="Ex: Flash Sale - 25% de réduction"
                />
              </div>
              <div>
                <Label>Type de promotion</Label>
                <Select value={newPromotion.type} onValueChange={(value: Promotion['type']) => 
                  setNewPromotion({...newPromotion, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Réduction</SelectItem>
                    <SelectItem value="flash">Flash Sale</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                    <SelectItem value="points_multiplier">Points x2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={newPromotion.description}
                onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
                placeholder="Description détaillée de la promotion..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Valeur</Label>
                <Input
                  value={newPromotion.value}
                  onChange={(e) => setNewPromotion({...newPromotion, value: e.target.value})}
                  placeholder="Ex: 25% de réduction"
                />
              </div>
              <div>
                <Label>Montant minimum</Label>
                <Input
                  type="number"
                  value={newPromotion.minAmount}
                  onChange={(e) => setNewPromotion({...newPromotion, minAmount: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Réduction max</Label>
                <Input
                  type="number"
                  value={newPromotion.maxDiscount}
                  onChange={(e) => setNewPromotion({...newPromotion, maxDiscount: Number(e.target.value)})}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={newPromotion.startDate}
                  onChange={(e) => setNewPromotion({...newPromotion, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={newPromotion.endDate}
                  onChange={(e) => setNewPromotion({...newPromotion, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreatePromotion} className="bg-orange-600 hover:bg-orange-700">
                Créer la promotion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition de promotion */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Promotion</DialogTitle>
            <DialogDescription>
              Modifiez les paramètres de votre promotion
            </DialogDescription>
          </DialogHeader>
          {selectedPromotion && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Titre de la promotion</Label>
                  <Input
                    value={selectedPromotion.title}
                    onChange={(e) => setSelectedPromotion({...selectedPromotion, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Type de promotion</Label>
                  <Select value={selectedPromotion.type} onValueChange={(value: Promotion['type']) => 
                    setSelectedPromotion({...selectedPromotion, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Réduction</SelectItem>
                      <SelectItem value="flash">Flash Sale</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                      <SelectItem value="cashback">Cashback</SelectItem>
                      <SelectItem value="free_shipping">Livraison gratuite</SelectItem>
                      <SelectItem value="points_multiplier">Points x2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={selectedPromotion.description}
                  onChange={(e) => setSelectedPromotion({...selectedPromotion, description: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedPromotion.isActive}
                  onCheckedChange={(checked) => setSelectedPromotion({...selectedPromotion, isActive: checked})}
                />
                <Label>Promotion active</Label>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditPromotion} className="bg-orange-600 hover:bg-orange-700">
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

