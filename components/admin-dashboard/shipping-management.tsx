"use client"

import { useState } from 'react'
import { 
  Truck, Plus, Edit, Trash2, Settings, Globe, 
  Package, Clock, MapPin, DollarSign, Zap,
  CheckCircle, AlertTriangle, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatMinAmount, formatMaxAmount, formatPricePerUnit } from '@/lib/currency-utils'

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  regions: string[]
  methods: ShippingMethod[]
  enabled: boolean
}

interface ShippingMethod {
  id: string
  name: string
  type: 'flat_rate' | 'free_shipping' | 'weight_based' | 'distance_based'
  cost: number
  minOrderAmount?: number
  maxOrderAmount?: number
  minWeight?: number
  maxWeight?: number
  estimatedDays: string
  enabled: boolean
  priority: number
}

export default function ShippingManagement() {
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([
    {
      id: '1',
      name: 'France Métropolitaine',
      countries: ['France'],
      regions: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Occitanie'],
      methods: [
        {
          id: '1',
          name: 'Livraison Standard',
          type: 'flat_rate',
          cost: 599,
          estimatedDays: '2-3 jours',
          enabled: true,
          priority: 1
        },
        {
          id: '2',
          name: 'Livraison Express',
          type: 'flat_rate',
          cost: 1299,
          estimatedDays: '1 jour',
          enabled: true,
          priority: 2
        },
        {
          id: '3',
          name: 'Livraison Gratuite',
          type: 'free_shipping',
          cost: 0,
          minOrderAmount: 5000,
          estimatedDays: '3-5 jours',
          enabled: true,
          priority: 3
        }
      ],
      enabled: true
    },
    {
      id: '2',
      name: 'Europe',
      countries: ['Allemagne', 'Belgique', 'Espagne', 'Italie', 'Pays-Bas'],
      regions: [],
      methods: [
        {
          id: '4',
          name: 'Livraison Europe Standard',
          type: 'weight_based',
          cost: 1599,
          minWeight: 0,
          maxWeight: 5,
          estimatedDays: '5-7 jours',
          enabled: true,
          priority: 1
        },
        {
          id: '5',
          name: 'Livraison Europe Express',
          type: 'weight_based',
          cost: 2999,
          minWeight: 0,
          maxWeight: 5,
          estimatedDays: '2-3 jours',
          enabled: true,
          priority: 2
        }
      ],
      enabled: true
    }
  ])

  const [activeTab, setActiveTab] = useState('zones')
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showMethodModal, setShowMethodModal] = useState(false)
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null)

  const handleCreateZone = () => {
    setSelectedZone(null)
    setShowZoneModal(true)
  }

  const handleEditZone = (zone: ShippingZone) => {
    setSelectedZone(zone)
    setShowZoneModal(true)
  }

  const handleCreateMethod = (zoneId: string) => {
    setSelectedMethod(null)
    setShowMethodModal(true)
  }

  const handleEditMethod = (method: ShippingMethod) => {
    setSelectedMethod(method)
    setShowMethodModal(true)
  }

  const toggleZoneStatus = (zoneId: string) => {
    setShippingZones(prev => prev.map(zone => 
      zone.id === zoneId ? { ...zone, enabled: !zone.enabled } : zone
    ))
  }

  const toggleMethodStatus = (zoneId: string, methodId: string) => {
    setShippingZones(prev => prev.map(zone => 
      zone.id === zoneId ? {
        ...zone,
        methods: zone.methods.map(method => 
          method.id === methodId ? { ...method, enabled: !method.enabled } : method
        )
      } : zone
    ))
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Zones de Livraison</p>
                <p className="text-2xl font-bold text-blue-900">{shippingZones.length}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Méthodes Actives</p>
                <p className="text-2xl font-bold text-green-900">
                  {shippingZones.reduce((sum, zone) => 
                    sum + zone.methods.filter(m => m.enabled).length, 0
                  )}
                </p>
              </div>
              <Truck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Pays Couverts</p>
                <p className="text-2xl font-bold text-purple-900">
                  {shippingZones.reduce((sum, zone) => sum + zone.countries.length, 0)}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Zones Actives</p>
                <p className="text-2xl font-bold text-orange-900">
                  {shippingZones.filter(zone => zone.enabled).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'outils */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gestion des Options de Livraison</h2>
              <p className="text-gray-600">Configurez les zones et méthodes de livraison globales</p>
            </div>
            <Button 
              onClick={handleCreateZone}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Zone
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="zones">Zones de Livraison</TabsTrigger>
          <TabsTrigger value="methods">Méthodes de Livraison</TabsTrigger>
          <TabsTrigger value="settings">Paramètres Globaux</TabsTrigger>
        </TabsList>

        {/* Onglet Zones de Livraison */}
        <TabsContent value="zones" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shippingZones.map((zone) => (
              <Card key={zone.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={zone.enabled}
                          onCheckedChange={() => toggleZoneStatus(zone.id)}
                        />
                        <Label className="text-lg font-semibold">{zone.name}</Label>
                      </div>
                      <Badge variant={zone.enabled ? "default" : "secondary"}>
                        {zone.enabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditZone(zone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateMethod(zone.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Pays et régions */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Pays couverts:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {zone.countries.map((country) => (
                        <Badge key={country} variant="outline" className="text-xs">
                          {country}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {zone.regions.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Régions spécifiques:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {zone.regions.map((region) => (
                          <Badge key={region} variant="outline" className="text-xs">
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Méthodes de livraison */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Méthodes de livraison:</Label>
                    <div className="space-y-2 mt-2">
                      {zone.methods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={method.enabled}
                              onCheckedChange={() => toggleMethodStatus(zone.id, method.id)}
                            />
                            <div>
                              <div className="font-medium text-sm">{method.name}</div>
                              <div className="text-xs text-gray-500">
                                {method.cost === 0 ? 'Gratuit' : formatPrice(method.cost)} • {method.estimatedDays}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMethod(method)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statistiques de la zone */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="font-bold text-blue-600">{zone.methods.length}</div>
                      <div className="text-blue-500">Méthodes</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="font-bold text-green-600">{zone.countries.length}</div>
                      <div className="text-green-500">Pays</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="font-bold text-purple-600">{zone.methods.filter(m => m.enabled).length}</div>
                      <div className="text-purple-500">Actives</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Méthodes de Livraison */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Types de Méthodes de Livraison</CardTitle>
              <CardDescription>
                Configurez les différents types de calcul des frais de livraison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Tarif Fixe
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Frais de livraison fixes pour tous les produits
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Prix:</span>
                        <span className="font-medium">599 FCFA - 2999 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Délai:</span>
                        <span className="font-medium">1-7 jours</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      Livraison Gratuite
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Livraison gratuite selon conditions (montant minimum, etc.)
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Condition:</span>
                        <span className="font-medium">{formatMinAmount(5000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Délai:</span>
                        <span className="font-medium">3-5 jours</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      Basé sur le Poids
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Frais calculés selon le poids total de la commande
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Prix:</span>
                        <span className="font-medium">1599 FCFA - 2999 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Limite:</span>
                        <span className="font-medium">0-5 kg</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-orange-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-600" />
                      Basé sur la Distance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      Frais calculés selon la distance de livraison
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base:</span>
                        <span className="font-medium">{formatPricePerUnit(50, 'km')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maximum:</span>
                        <span className="font-medium">{formatMaxAmount(5000)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Paramètres Globaux */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres Globaux de Livraison</CardTitle>
              <CardDescription>
                Configurez les options générales pour toutes les zones de livraison
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Options générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Options Générales</h3>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Activer la livraison internationale</Label>
                    <p className="text-sm text-gray-600">Permettre la livraison vers tous les pays</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Calcul automatique des frais</Label>
                    <p className="text-sm text-gray-600">Calculer automatiquement selon le poids et la destination</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="font-medium">Notifications de suivi</Label>
                    <p className="text-sm text-gray-600">Envoyer des notifications de suivi aux clients</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              {/* Limites et restrictions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Limites et Restrictions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxWeight">Poids maximum par commande (kg)</Label>
                    <Input
                      id="maxWeight"
                      type="number"
                      defaultValue={25}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxDistance">Distance maximum (km)</Label>
                    <Input
                      id="maxDistance"
                      type="number"
                      defaultValue={1000}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minOrderAmount">Montant minimum pour livraison gratuite</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      defaultValue={5000}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500">{formatMinAmount(5000)}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxShippingCost">Frais de livraison maximum</Label>
                    <Input
                      id="maxShippingCost"
                      type="number"
                      defaultValue={5000}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500">{formatMaxAmount(5000)}</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Options avancées */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Options Avancées</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultShippingTime">Délai de livraison par défaut (jours)</Label>
                    <Input
                      id="defaultShippingTime"
                      type="number"
                      defaultValue={3}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rushShippingMultiplier">Multiplicateur livraison express</Label>
                    <Input
                      id="rushShippingMultiplier"
                      type="number"
                      step="0.1"
                      defaultValue={2.5}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <Label className="font-medium text-blue-900">Mode de développement</Label>
                    <p className="text-sm text-blue-700">Activer les options de test et de débogage</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Informations et aide */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Info className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Configuration des Options de Livraison</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Les zones de livraison définissent les régions géographiques couvertes</p>
                <p>• Chaque zone peut avoir plusieurs méthodes de livraison avec des conditions spécifiques</p>
                <p>• Les vendeurs peuvent utiliser ces options globales ou définir leurs propres règles</p>
                <p>• Les paramètres globaux s'appliquent à toutes les zones sauf indication contraire</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
