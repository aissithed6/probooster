"use client"

import { useState } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, CreditCard, Wallet, 
  Download, Calendar, BarChart, PieChart, LineChart, 
  ArrowUp, ArrowDown, Target, Award, Calculator, Receipt,
  Users, AlertTriangle
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { SellerRevenue } from './types'

interface RevenueManagementProps {
  revenue: SellerRevenue
  onPaymentRequest: (amount: number) => void
}

export default function RevenueManagement({ 
  revenue, 
  onPaymentRequest 
}: RevenueManagementProps) {
  const [showAllVendorsModal, setShowAllVendorsModal] = useState(false)
  const [showPaymentScheduleModal, setShowPaymentScheduleModal] = useState(false)
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<{
    id: string
    customerName: string
    amount: number
    dueDate: string
    priority: string
  } | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount)
  }

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1)
  }

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 100
    return ((current - previous) / previous) * 100
  }

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? (
      <ArrowUp className="w-4 h-4 text-green-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-red-600" />
    )
  }

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-600' : 'text-red-600'
  }

  // Fonction pour afficher les notifications
  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Fonction pour exporter le rapport de chiffre d'affaires
  const handleExportRevenueReport = () => {
    setIsLoading(true)
    setTimeout(() => {
      const csvContent = [
        'Rapport Chiffre d\'affaires',
        `Période,${new Date().toLocaleDateString('fr-FR')}`,
        `Chiffre d'affaires total,${formatCurrency(revenue.totalRevenue)}`,
        `Revenu net,${formatCurrency(revenue.netRevenue)}`,
        `Commissions,${formatCurrency(revenue.totalCommissions)}`,
        `Paiements en attente,${formatCurrency(revenue.pendingPayments)}`,
        `Paiements complétés,${formatCurrency(revenue.completedPayments)}`,
        '',
        'Détail par période:',
        `Janvier,${formatCurrency(120000)}`,
        `Février,${formatCurrency(150000)}`,
        `Mars,${formatCurrency(180000)}`,
        `Avril,${formatCurrency(200000)}`,
        `Mai,${formatCurrency(220000)}`,
        `Juin,${formatCurrency(250000)}`
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rapport-chiffre-affaires-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Rapport de chiffre d\'affaires exporté avec succès (CSV)', 'success')
    }, 1500)
  }

  // Fonction pour générer les factures
  const handleGenerateInvoices = () => {
    setIsLoading(true)
    setTimeout(() => {
      // Simulation de génération de factures pour les commandes livrées
      const invoices = [
        {
          id: 'INV-001',
          customerName: 'Client Premium',
          amount: 45000,
          date: new Date().toISOString().split('T')[0],
          status: 'En attente'
        },
        {
          id: 'INV-002',
          customerName: 'Client Standard',
          amount: 32000,
          date: new Date().toISOString().split('T')[0],
          status: 'En attente'
        },
        {
          id: 'INV-003',
          customerName: 'Client VIP',
          amount: 78000,
          date: new Date().toISOString().split('T')[0],
          status: 'En attente'
        }
      ]
      
      const csvContent = [
        'Factures Générées',
        'Numéro,Client,Montant,Date,Statut',
        ...invoices.map(invoice => 
          `${invoice.id},${invoice.customerName},${formatCurrency(invoice.amount)},${invoice.date},${invoice.status}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factures-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification(`${invoices.length} factures générées et exportées avec succès (CSV)`, 'success')
    }, 1800)
  }

  // Fonction pour planifier les paiements
  const handleSchedulePayments = () => {
    setShowPaymentScheduleModal(true)
  }

  // Fonction pour confirmer la planification des paiements
  const handleConfirmPaymentSchedule = () => {
    setIsLoading(true)
    setTimeout(() => {
      // Simulation de planification des paiements
      const scheduledPayments = [
        {
          id: 'PAY-001',
          customerName: 'Client Premium',
          amount: 45000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 jours
          priority: 'Haute'
        },
        {
          id: 'PAY-002',
          customerName: 'Client Standard',
          amount: 32000,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 jours
          priority: 'Normale'
        },
        {
          id: 'PAY-003',
          customerName: 'Client VIP',
          amount: 78000,
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +21 jours
          priority: 'Haute'
        }
      ]
      
      const csvContent = [
        'Planification des Paiements',
        'Numéro,Client,Montant,Date d\'échéance,Priorité',
        ...scheduledPayments.map(payment => 
          `${payment.id},${payment.customerName},${formatCurrency(payment.amount)},${payment.dueDate},${payment.priority}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `planification-paiements-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      setShowPaymentScheduleModal(false)
      showNotification(`${scheduledPayments.length} paiements planifiés et exportés avec succès (CSV)`, 'success')
    }, 2000)
  }

  // Fonction pour exporter la planification des paiements
  const handleExportPaymentSchedule = () => {
    setIsLoading(true)
    setTimeout(() => {
      const scheduledPayments = [
        {
          id: 'PAY-001',
          customerName: 'Client Premium',
          amount: 45000,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'Haute'
        },
        {
          id: 'PAY-002',
          customerName: 'Client Standard',
          amount: 32000,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'Normale'
        },
        {
          id: 'PAY-003',
          customerName: 'Client VIP',
          amount: 78000,
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'Haute'
        }
      ]
      
      const csvContent = [
        'Planification des Paiements',
        'Numéro,Client,Montant,Date d\'échéance,Priorité',
        ...scheduledPayments.map(payment => 
          `${payment.id},${payment.customerName},${formatCurrency(payment.amount)},${payment.dueDate},${payment.priority}`
        )
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `planification-paiements-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setIsLoading(false)
      showNotification('Planification des paiements exportée avec succès (CSV)', 'success')
    }, 1500)
  }

  // Fonction pour ouvrir le modal de modification d'un paiement
  const handleEditPayment = (payment: {
    id: string
    customerName: string
    amount: number
    dueDate: string
    priority: string
  }) => {
    setSelectedPayment(payment)
    setShowEditPaymentModal(true)
  }

  // Fonction pour sauvegarder les modifications d'un paiement
  const handleSavePaymentEdit = (updatedPayment: {
    id: string
    customerName: string
    amount: number
    dueDate: string
    priority: string
  }) => {
    setIsLoading(true)
    setTimeout(() => {
      // Ici on pourrait mettre à jour la base de données
      setSelectedPayment(updatedPayment)
      setIsLoading(false)
      setShowEditPaymentModal(false)
      showNotification(`Paiement ${updatedPayment.id} modifié avec succès`, 'success')
    }, 1500)
  }


  // Données mock pour les graphiques
  const monthlyData = [
    { month: 'Jan', revenue: 120000, orders: 15 },
    { month: 'Fév', revenue: 150000, orders: 18 },
    { month: 'Mar', revenue: 180000, orders: 22 },
    { month: 'Avr', revenue: 200000, orders: 25 },
    { month: 'Mai', revenue: 220000, orders: 28 },
    { month: 'Jun', revenue: 250000, orders: 30 }
  ]

  const categoryData = [
    { category: 'Électronique', revenue: 450000, percentage: 45 },
    { category: 'Audio', revenue: 200000, percentage: 20 },
    { category: 'Mode', revenue: 180000, percentage: 18 },
    { category: 'Maison', revenue: 170000, percentage: 17 }
  ]

  const growthRate = getGrowthRate(revenue.totalRevenue, revenue.totalRevenue * 0.9) // Simulation

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : notification.type === 'warning' 
            ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
            : 'bg-blue-50 border-blue-500 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              notification.type === 'success' ? 'bg-green-500' 
              : notification.type === 'warning' ? 'bg-yellow-500' 
              : 'bg-blue-500'
            }`}></div>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* En-tête avec statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-orange-900">{formatCurrency(revenue.totalRevenue)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  {getGrowthIcon(growthRate)}
                  <span className={`text-xs font-medium ${getGrowthColor(growthRate)}`}>
                    {Math.abs(growthRate).toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs mois dernier</span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Revenu Net</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(revenue.netRevenue)}</p>
                <p className="text-xs text-green-600 mt-1">
                  {formatPercentage(revenue.netRevenue, revenue.totalRevenue)}% du CA
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Commissions</p>
                <p className="text-2xl font-bold text-red-900">{formatCurrency(revenue.totalCommissions)}</p>
                <p className="text-xs text-red-600 mt-1">
                  {formatPercentage(revenue.totalCommissions, revenue.totalRevenue)}% du CA
                </p>
              </div>
              <Calculator className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Paiements en Attente</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(revenue.pendingPayments)}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {revenue.completedPayments} paiements reçus
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Évolution des Revenus</CardTitle>
                <CardDescription>Performance des 6 derniers mois</CardDescription>
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Graphique d'évolution des revenus</p>
                <div className="mt-4 space-y-2">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{data.month}</span>
                      <span className="font-medium">{formatCurrency(data.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Catégorie</CardTitle>
            <CardDescription>Répartition du CA par catégorie de produits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Graphique de répartition</p>
                <div className="mt-4 space-y-2">
                  {categoryData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{data.category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{data.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détails financiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Produits</CardTitle>
            <CardDescription>Produits les plus rentables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sales} ventes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                    <p className="text-xs text-gray-500">
                      {formatPercentage(product.revenue, revenue.totalRevenue)}% du CA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des Paiements</CardTitle>
            <CardDescription>Derniers paiements reçus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue.paymentHistory.slice(0, 5).map((payment, index) => (
                <div key={payment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-gray-500">{payment.method}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {payment.status === 'completed' ? 'Reçu' :
                       payment.status === 'pending' ? 'En cours' : 'Échoué'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{payment.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Gestion des paiements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => setShowAllVendorsModal(true)}
                className="w-full bg-[#ff6600] hover:bg-[#ff6600]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Demander un Paiement
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportRevenueReport}
                disabled={isLoading}
                className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Export en cours...' : 'Exporter Rapport'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGenerateInvoices}
                disabled={isLoading}
                className="w-full justify-start hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <Receipt className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Génération...' : 'Générer Factures'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSchedulePayments}
                disabled={isLoading}
                className="w-full justify-start hover:bg-purple-50 hover:border-purple-200 transition-colors"
              >
                <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Planification...' : 'Planifier Paiement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse Détaillée des Revenus</CardTitle>
          <CardDescription>Vue d'ensemble complète de vos finances</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="products">Par Produit</TabsTrigger>
              <TabsTrigger value="categories">Par Catégorie</TabsTrigger>
              <TabsTrigger value="periods">Par Période</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CA Total</span>
                    <Target className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.totalRevenue)}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    {getGrowthIcon(growthRate)}
                    <span className={`text-xs ${getGrowthColor(growthRate)}`}>
                      {Math.abs(growthRate).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenu Net</span>
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.netRevenue)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercentage(revenue.netRevenue, revenue.totalRevenue)}% du CA
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Commissions</span>
                    <Calculator className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.totalCommissions)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPercentage(revenue.totalCommissions, revenue.totalRevenue)}% du CA
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">En Attente</span>
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(revenue.pendingPayments)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {revenue.completedPayments} paiements reçus
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <div className="space-y-4">
                {revenue.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.sales} unités vendues</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">
                        {formatPercentage(product.revenue, revenue.totalRevenue)}% du CA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="categories" className="mt-6">
              <div className="space-y-4">
                {revenue.revenueByCategory.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{category.category}</span>
                      <span className="font-bold">{formatCurrency(category.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{category.percentage}% du chiffre d'affaires</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="periods" className="mt-6">
              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{data.month}</p>
                      <p className="text-sm text-gray-500">{data.orders} commandes</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(data.revenue)}</p>
                      <p className="text-sm text-gray-500">
                        Moyenne: {formatCurrency(data.revenue / data.orders)}/commande
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal pour demande tous les paiements */}
      <Dialog open={showAllVendorsModal} onOpenChange={setShowAllVendorsModal}>
        <DialogContent className="max-w-lg border-[#8b5cf6]">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#8b5cf6]/20 rounded-full">
                <Users className="w-6 h-6 text-[#8b5cf6]" />
              </div>
              <div>
                <DialogTitle className="text-[#8b5cf6] font-bold">Demande Tous les Paiements</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Effectuer une demande de paiement pour toutes les commandes disponibles
            </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-[#8b5cf6]/20 to-[#3b82f6]/20 rounded-lg border border-[#8b5cf6]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[#8b5cf6]">Commandes disponibles :</span>
                <span className="text-lg font-bold text-[#8b5cf6]">
                  {revenue.completedPayments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#3b82f6]">Montant total :</span>
                <span className="text-xl font-bold text-[#3b82f6]">
                  {formatCurrency(revenue.netRevenue)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Aperçu des revenus :</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Chiffre d'affaires total</span>
                  <span className="font-medium">{formatCurrency(revenue.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Revenu net disponible</span>
                  <span className="font-medium">{formatCurrency(revenue.netRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Commissions</span>
                  <span className="font-medium">{formatCurrency(revenue.totalCommissions)}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>Paiements en attente</span>
                  <span className="font-medium">{formatCurrency(revenue.pendingPayments)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#ff6600]/20 border border-[#ff6600] rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#ff6600] mt-0.5" />
                <div className="text-sm text-[#ff6600]">
                  <p className="font-medium">Information :</p>
                  <p>Cette action enverra une demande de paiement pour tous vos revenus disponibles via FeexPay.</p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAllVendorsModal(false)}
              className="border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition-colors"
            >
              Annuler
            </Button>
            <Button 
              onClick={() => {
                onPaymentRequest(revenue.netRevenue)
                setShowAllVendorsModal(false)
              }}
              className="bg-[#8b5cf6] hover:bg-[#8b5cf6]/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Users className="w-4 h-4 mr-2" />
              Confirmer la Demande
            </Button>
          </DialogFooter>
                 </DialogContent>
       </Dialog>

       {/* Modal de Planification des Paiements */}
       <Dialog open={showPaymentScheduleModal} onOpenChange={setShowPaymentScheduleModal}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-purple-100 rounded-full">
                 <Calendar className="w-6 h-6 text-purple-600" />
               </div>
            <div>
                 <DialogTitle className="text-2xl font-bold text-gray-900">Planification des Paiements</DialogTitle>
                 <DialogDescription className="text-gray-600">
                   Planifiez et gérez vos paiements à venir avec des échéances et priorités
                 </DialogDescription>
            </div>
             </div>
           </DialogHeader>
           
           <div className="space-y-6">
             {/* Aperçu des paiements à planifier */}
             <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
               <CardHeader>
                 <CardTitle className="text-purple-800">Aperçu des Paiements Disponibles</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                     <div className="text-2xl font-bold text-purple-600">{formatCurrency(revenue.pendingPayments)}</div>
                     <div className="text-sm text-purple-600">Montant en attente</div>
                   </div>
                   <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                     <div className="text-2xl font-bold text-blue-600">{revenue.completedPayments}</div>
                     <div className="text-sm text-blue-600">Commandes livrées</div>
                   </div>
                   <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                     <div className="text-2xl font-bold text-green-600">{formatCurrency(revenue.netRevenue)}</div>
                     <div className="text-sm text-green-600">Revenu net disponible</div>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Tableau des paiements planifiés */}
             <Card>
               <CardHeader>
                 <CardTitle>Paiements à Planifier</CardTitle>
                 <CardDescription>Gérez les échéances et priorités de vos paiements</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {/* En-têtes du tableau */}
                   <div className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
                     <div>Client</div>
                     <div>Montant</div>
                     <div>Date d'échéance</div>
                     <div>Priorité</div>
                     <div>Statut</div>
                     <div>Actions</div>
                   </div>
                   
                   {/* Lignes des paiements */}
                   <div className="space-y-3">
                                           <div className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                        <div className="font-medium">Client Premium</div>
                        <div className="font-bold text-green-600">{formatCurrency(45000)}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                        </div>
            <div>
                          <Badge className="bg-red-100 text-red-800 border-red-200">Haute</Badge>
                        </div>
                        <div>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleEditPayment({
                              id: 'PAY-001',
                              customerName: 'Client Premium',
                              amount: 45000,
                              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              priority: 'Haute'
                            })}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                     
                                           <div className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                        <div className="font-medium">Client Standard</div>
                        <div className="font-bold text-green-600">{formatCurrency(32000)}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">Normale</Badge>
                        </div>
                        <div>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleEditPayment({
                              id: 'PAY-002',
                              customerName: 'Client Standard',
                              amount: 32000,
                              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              priority: 'Normale'
                            })}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                     
                                           <div className="grid grid-cols-6 gap-4 p-3 border rounded-lg items-center">
                        <div className="font-medium">Client VIP</div>
                        <div className="font-bold text-green-600">{formatCurrency(78000)}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <Badge className="bg-red-100 text-red-800 border-red-200">Haute</Badge>
                        </div>
                        <div>
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En attente</Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => handleEditPayment({
                              id: 'PAY-003',
                              customerName: 'Client VIP',
                              amount: 78000,
                              dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              priority: 'Haute'
                            })}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Options de planification */}
             <Card>
               <CardHeader>
                 <CardTitle>Options de Planification</CardTitle>
                 <CardDescription>Personnalisez vos paramètres de planification</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Fréquence de rappel</label>
                       <Select defaultValue="weekly">
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner la fréquence" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="daily">Quotidien</SelectItem>
                           <SelectItem value="weekly">Hebdomadaire</SelectItem>
                           <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
                           <SelectItem value="monthly">Mensuel</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de notification</label>
                       <Select defaultValue="email">
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner la méthode" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="email">Email</SelectItem>
                           <SelectItem value="sms">SMS</SelectItem>
                           <SelectItem value="push">Notification push</SelectItem>
                           <SelectItem value="all">Toutes</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                   
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Délai d'échéance par défaut</label>
                       <Select defaultValue="7">
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner le délai" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="3">3 jours</SelectItem>
                           <SelectItem value="7">7 jours</SelectItem>
                           <SelectItem value="14">14 jours</SelectItem>
                           <SelectItem value="30">30 jours</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Priorité par défaut</label>
                       <Select defaultValue="normal">
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Sélectionner la priorité" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="low">Basse</SelectItem>
                           <SelectItem value="normal">Normale</SelectItem>
                           <SelectItem value="high">Haute</SelectItem>
                           <SelectItem value="urgent">Urgente</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
           
           <DialogFooter className="flex justify-between">
             <div className="flex space-x-2">
               <Button 
                 variant="outline" 
                 onClick={handleExportPaymentSchedule}
                 disabled={isLoading}
                 className="border-blue-500 text-blue-600 hover:bg-blue-50"
               >
                 <Download className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                 {isLoading ? 'Export...' : 'Exporter Planification'}
               </Button>
               <Button 
                 variant="outline" 
                 onClick={() => setShowPaymentScheduleModal(false)}
                 className="border-gray-300 text-gray-600 hover:bg-gray-50"
               >
                 Annuler
               </Button>
             </div>
             <Button 
               onClick={handleConfirmPaymentSchedule}
               disabled={isLoading}
               className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
             >
               <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
               {isLoading ? 'Planification...' : 'Confirmer Planification'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Modal d'édition des paiements */}
       <Dialog open={showEditPaymentModal} onOpenChange={setShowEditPaymentModal}>
         <DialogContent className="max-w-lg">
           <DialogHeader>
             <div className="flex items-center space-x-3">
               <div className="p-2 bg-blue-100 rounded-full">
                 <Calendar className="w-6 h-6 text-blue-600" />
               </div>
               <div>
                 <DialogTitle className="text-xl font-bold text-gray-900">Modifier le Paiement</DialogTitle>
                 <DialogDescription className="text-gray-600">
                   Modifiez la date d'échéance et la priorité du paiement
                 </DialogDescription>
               </div>
             </div>
           </DialogHeader>
           
           {selectedPayment && (
             <div className="space-y-6">
               {/* Informations du paiement */}
               <Card className="bg-gray-50">
                 <CardContent className="p-4">
                   <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-600">Client :</span>
                       <span className="font-medium">{selectedPayment.customerName}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-600">Montant :</span>
                       <span className="font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-sm font-medium text-gray-600">ID Paiement :</span>
                       <span className="font-mono text-sm">{selectedPayment.id}</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Formulaire de modification */}
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
              <input
                     type="date"
                     defaultValue={selectedPayment.dueDate}
                     className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     onChange={(e) => setSelectedPayment({
                       ...selectedPayment,
                       dueDate: e.target.value
                     })}
              />
            </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                   <Select 
                     value={selectedPayment.priority} 
                     onValueChange={(value) => setSelectedPayment({
                       ...selectedPayment,
                       priority: value
                     })}
                   >
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Sélectionner la priorité" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Basse">Basse</SelectItem>
                       <SelectItem value="Normale">Normale</SelectItem>
                       <SelectItem value="Haute">Haute</SelectItem>
                       <SelectItem value="Urgente">Urgente</SelectItem>
                     </SelectContent>
                   </Select>
            </div>

                 {/* Options supplémentaires */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Méthode de notification</label>
                   <Select defaultValue="email">
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Sélectionner la méthode" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="email">Email</SelectItem>
                       <SelectItem value="sms">SMS</SelectItem>
                       <SelectItem value="push">Notification push</SelectItem>
                       <SelectItem value="all">Toutes</SelectItem>
                     </SelectContent>
                   </Select>
          </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Rappel avant échéance</label>
                   <Select defaultValue="3">
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Sélectionner le délai" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="1">1 jour avant</SelectItem>
                       <SelectItem value="3">3 jours avant</SelectItem>
                       <SelectItem value="7">7 jours avant</SelectItem>
                       <SelectItem value="14">14 jours avant</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               </div>
             </div>
           )}
           
           <DialogFooter className="flex justify-between">
             <Button 
               variant="outline" 
               onClick={() => setShowEditPaymentModal(false)}
               className="border-gray-300 text-gray-600 hover:bg-gray-50"
             >
              Annuler
            </Button>
            <Button 
               onClick={() => selectedPayment && handleSavePaymentEdit(selectedPayment)}
               disabled={isLoading || !selectedPayment}
               className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
             >
               <Calendar className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
               {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
