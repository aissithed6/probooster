"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  formatPrice, 
  convertToPoints, 
  formatPoints, 
  formatPriceWithPoints,
  formatSalePrice,
  formatInstallmentPayment,
  formatFinancialStats,
  calculateDeferredPaymentFees,
  formatDeferredPaymentFees,
  simulateDeferredPayments,
  calculateInstallmentPayment
} from '@/lib/currency-utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TestCurrencyPage() {
  const [testPrice, setTestPrice] = useState(129900)
  const [testSalePrice, setTestSalePrice] = useState(119900)
  const [deferredRate, setDeferredRate] = useState(10)
  const [deferredType, setDeferredType] = useState<'percentage' | 'fixed'>('percentage')
  const [deferredPeriod, setDeferredPeriod] = useState<'day' | 'month' | 'quarter'>('month')
  const [deferredMethod, setDeferredMethod] = useState<'simple' | 'compound'>('simple')

  const sampleProducts = [
    {
      id: 1,
      name: "iPhone 15 Pro Max",
      price: 129900,
      salePrice: 119900,
      category: "Électronique",
      stock: 25,
      sales: 150,
      revenue: 17985000
    },
    {
      id: 2,
      name: "MacBook Air M2",
      price: 119900,
      category: "Électronique",
      stock: 18,
      sales: 89,
      revenue: 10661100
    },
    {
      id: 3,
      name: "AirPods Pro",
      price: 24900,
      salePrice: 19900,
      category: "Électronique",
      stock: 0,
      sales: 320,
      revenue: 6368000
    }
  ]

  const shippingMethods = [
    { name: "Livraison Standard", cost: 599, estimatedDays: "2-3 jours" },
    { name: "Livraison Express", cost: 1299, estimatedDays: "1 jour" },
    { name: "Livraison Gratuite", cost: 0, estimatedDays: "3-5 jours" },
    { name: "Livraison Europe", cost: 1599, estimatedDays: "5-7 jours" }
  ]

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test des Devises et Points</h1>
        <p className="text-gray-600">Vérification de l'affichage FCFA et points Probooster</p>
      </div>

      {/* Testeur de prix */}
      <Card>
        <CardHeader>
          <CardTitle>Testeur de Prix</CardTitle>
          <CardDescription>Testez différents montants et voyez leur conversion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testPrice">Prix en FCFA</Label>
              <Input
                id="testPrice"
                type="number"
                value={testPrice}
                onChange={(e) => setTestPrice(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="testSalePrice">Prix de vente en FCFA</Label>
              <Input
                id="testSalePrice"
                type="number"
                value={testSalePrice}
                onChange={(e) => setTestSalePrice(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatPrice(testPrice)}</div>
              <div className="text-sm text-blue-500">{formatPoints(convertToPoints(testPrice))}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatPrice(testSalePrice)}</div>
              <div className="text-sm text-green-500">{formatPoints(convertToPoints(testSalePrice))}</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {testSalePrice > 0 ? formatSalePrice(testPrice, testSalePrice).discountPercentage : 'Pas de promo'}
              </div>
              <div className="text-sm text-purple-500">
                {testSalePrice > 0 ? `Économie: ${formatPrice(testPrice - testSalePrice)}` : 'Prix normal'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exemples de produits */}
      <Card>
        <CardHeader>
          <CardTitle>Exemples de Produits</CardTitle>
          <CardDescription>Affichage des prix en FCFA et points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleProducts.map((product) => (
              <div key={product.id} className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                
                <div className="space-y-2">
                  {product.salePrice ? (
                    <>
                      <div className="text-2xl font-bold text-red-600">{formatPrice(product.salePrice)}</div>
                      <div className="text-lg text-gray-500 line-through">{formatPrice(product.price)}</div>
                      <Badge variant="outline" className="border-red-500 text-red-600">
                        {formatSalePrice(product.price, product.salePrice).discountPercentage}
                      </Badge>
                    </>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</div>
                  )}
                  
                  <div className="text-sm text-gray-600">
                    {formatPoints(convertToPoints(product.salePrice || product.price))}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  <div>Stock: {product.stock}</div>
                  <div>Ventes: {product.sales}</div>
                  <div>Revenus: {formatPrice(product.revenue)}</div>
                  <div className="text-purple-600">{formatPoints(convertToPoints(product.revenue))}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Options de livraison */}
      <Card>
        <CardHeader>
          <CardTitle>Options de Livraison</CardTitle>
          <CardDescription>Coûts en FCFA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shippingMethods.map((method, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{method.name}</h4>
                  <Badge variant={method.cost === 0 ? "default" : "outline"}>
                    {method.cost === 0 ? 'Gratuit' : formatPrice(method.cost)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Délai: {method.estimatedDays}</div>
                  {method.cost > 0 && (
                    <div className="text-purple-600">
                      {formatPoints(convertToPoints(method.cost))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paiements en plusieurs fois */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements en Plusieurs Fois</CardTitle>
          <CardDescription>Simulation avec le prix de test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[3, 6, 12].map((months) => (
              <div key={months} className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-lg font-medium text-orange-800">{months} mois</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatInstallmentPayment(testPrice, months)}
                </div>
                <div className="text-sm text-orange-500">
                  {formatPoints(convertToPoints(calculateInstallmentPayment(testPrice, months)))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paiements Différés avec Frais */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements Différés avec Frais</CardTitle>
          <CardDescription>Test des frais variables selon la période et la méthode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="deferredRate">Taux/Frais</Label>
              <Input
                id="deferredRate"
                type="number"
                value={deferredRate}
                onChange={(e) => setDeferredRate(parseFloat(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="deferredType">Type</Label>
              <Select value={deferredType} onValueChange={(value: 'percentage' | 'fixed') => setDeferredType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                  <SelectItem value="fixed">Montant fixe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deferredPeriod">Période</Label>
              <Select value={deferredPeriod} onValueChange={(value: 'day' | 'month' | 'quarter') => setDeferredPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Par jour</SelectItem>
                  <SelectItem value="month">Par mois</SelectItem>
                  <SelectItem value="quarter">Par trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deferredMethod">Méthode</Label>
              <Select value={deferredMethod} onValueChange={(value: 'simple' | 'compound') => setDeferredMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Intérêts simples</SelectItem>
                  <SelectItem value="compound">Intérêts composés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 3, 6, 12].map((periods) => {
              const totalFees = calculateDeferredPaymentFees(
                testPrice,
                deferredRate,
                deferredType,
                deferredPeriod,
                periods,
                deferredMethod
              )
              const totalAmount = testPrice + totalFees
              
              return (
                <div key={periods} className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                  <div className="text-lg font-medium text-orange-800">
                    {periods} {deferredPeriod === 'day' ? 'jour(s)' : 
                               deferredPeriod === 'month' ? 'mois' : 'trimestre(s)'}
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatPrice(totalAmount)}
                  </div>
                  <div className="text-sm text-orange-500">
                    Frais: {formatPrice(totalFees)}
                  </div>
                  <div className="text-xs text-red-600">
                    {formatPoints(convertToPoints(totalAmount))}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Détail des calculs */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Détail des calculs :</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Prix initial: {formatPrice(testPrice)}</div>
              <div>Taux: {deferredType === 'percentage' ? `${deferredRate}%` : formatPrice(deferredRate)}</div>
              <div>Période: {deferredPeriod === 'day' ? 'Par jour' : deferredPeriod === 'month' ? 'Par mois' : 'Par trimestre'}</div>
              <div>Méthode: {deferredMethod === 'simple' ? 'Intérêts simples' : 'Intérêts composés'}</div>
              {deferredType === 'percentage' && (
                <div className="text-orange-600 font-medium">
                  {deferredMethod === 'simple' 
                    ? `Formule: ${testPrice} × ${deferredRate}% × nombre de périodes`
                    : `Formule: ${testPrice} × (1 + ${deferredRate}%)^nombre de périodes - ${testPrice}`
                  }
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques financières */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Financières</CardTitle>
          <CardDescription>Formatage automatique des données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: 17985000, label: "Chiffre d'Affaires" },
              { value: 10661100, label: "Revenus" },
              { value: 6368000, label: "Ventes" },
              { value: 5000000, label: "Objectif" }
            ].map((stat, index) => {
              const formatted = formatFinancialStats(stat.value, stat.label)
              return (
                <div key={index} className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-medium text-blue-800">{formatted.label}</div>
                  <div className="text-2xl font-bold text-blue-600">{formatted.mainValue}</div>
                  <div className="text-sm text-blue-500">{formatted.secondaryValue}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informations sur la devise */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-green-800 mb-4">Configuration des Devises</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-green-700">Devise Principale</div>
                <div className="text-green-600">Franc CFA (FCFA)</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-blue-700">Points Probooster</div>
                <div className="text-blue-600">1 FCFA = 0.1 points</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="font-medium text-purple-700">Locale</div>
                <div className="text-purple-600">Français (fr-FR)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
