"use client"

import React, { useState } from 'react'
import { 
  Download, 
  Target,
  Users, 
  Share2, 
  Eye,
  BarChart3,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Zap,
  Star,
  ShoppingCart,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useNotifications } from '@/components/ui/notification'

import type { VendorAnalyticsData } from '@/lib/vendor-analytics'

interface AnalyticsActionsProps {
  analytics: VendorAnalyticsData | null
  isLoading: boolean
  onExport: (type: string, format: string) => void
  onRefresh: () => Promise<void>
  onViewProductDetails: (productId: string) => void
  onViewDetailedReport: (metric: string) => void
}

export default function AnalyticsActions({
  analytics,
  isLoading,
  onExport,
  onRefresh,
  onViewProductDetails,
  onViewDetailedReport
}: AnalyticsActionsProps) {
  const { showNotification } = useNotifications()
  
  // États pour les modales
  const [showExportModal, setShowExportModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  
  // États pour les actions
  const [isExporting, setIsExporting] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  
  // États pour les données
  const [exportOptions, setExportOptions] = useState({
    type: 'all',
    format: 'pdf',
    period: '30d'
  })

  // NOUVELLES FONCTIONS : Conversion en points et affichage double
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const convertToPoints = (value: number) => {
    // 1 XOF = 1 point
    return Math.round(value)
  }

  const displayAmountWithPoints = (amount: number) => {
    const points = convertToPoints(amount)
    return `${formatCurrency(amount)} (${formatNumber(points)} pts)`
  }

  const optimizationActions = analytics?.optimizations ?? []

  // FONCTIONS RÉELLES ET FONCTIONNELLES AVEC NOTIFICATIONS MODERNES
  const handleExport = async (type: string, format: string) => {
    setIsExporting(true)
    try {
      onExport(type, format === 'pdf' ? 'json' : format)
      showNotification({
        type: 'success',
        title: 'Export réussi !',
        message: `Export ${type} (JSON) téléchargé depuis vos données réelles.`,
        duration: 5000
      })
      setShowExportModal(false)
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur d\'export',
        message: `Une erreur s'est produite lors de l'export: ${error}`,
        duration: 5000
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleOptimize = async (actionId: string) => {
    setIsOptimizing(true)
    const action = optimizationActions.find((a) => a.id === actionId)
    try {
      showNotification({
        type: 'info',
        title: 'Recommandation',
        message: action?.description ?? 'Suivez cette action dans votre catalogue et vos campagnes.',
        duration: 5000
      })
      if (action?.id === 'top-product' && analytics?.topProducts?.[0]) {
        onViewProductDetails(analytics.topProducts[0].id)
      } else {
        onViewDetailedReport(actionId)
      }
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleViewProductDetails = (productId: string) => {
    setShowProductModal(true)
    onViewProductDetails(productId)
    
    // Notification d'information
    showNotification({
      type: 'info',
      title: 'Détails produit',
      message: `Affichage des détails du produit ${productId}`,
      duration: 3000
    })
  }

  const handleViewDetailedReport = (metric: string) => {
    setShowReportModal(true)
    onViewDetailedReport(metric)
    
    // Notification d'information
    showNotification({
      type: 'info',
      title: 'Rapport détaillé',
      message: `Affichage du rapport détaillé: ${metric}`,
      duration: 3000
    })
  }

  const handleQuickExport = (type: string = 'all', format: string = 'pdf') => {
    handleExport(type, format)
  }

  const handleRefreshData = async () => {
    showNotification({
      type: 'info',
      title: 'Actualisation',
      message: 'Synchronisation avec la base de données...',
      duration: 2000
    })
    await onRefresh()
    showNotification({
      type: 'success',
      title: 'Données à jour',
      message: 'Les statistiques ont été rechargées.',
      duration: 3000
    })
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions rapides */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Actions & Insights IA</h2>
          <p className="text-gray-600">Optimisez vos performances avec l'intelligence artificielle</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Configurer Export
          </Button>
          <Button variant="outline" onClick={handleRefreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Actions d'optimisation IA */}
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[#ff6600]" />
            <span>Actions d'Optimisation IA</span>
          </CardTitle>
          <CardDescription>Optimisations automatiques et recommandées par l'IA</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationActions.length === 0 && (
              <p className="text-sm text-gray-600">Aucune recommandation pour le moment. Continuez à vendre pour obtenir des suggestions personnalisées.</p>
            )}
            {optimizationActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-[#3b82f6]/20 rounded-full">
                    <Target className="w-5 h-5 text-[#3b82f6]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {action.status === 'completed' ? 'Terminé' :
                       action.status === 'in-progress' ? 'En cours' : 'En attente'}
                    </p>
                    {action.status === 'in-progress' && (
                      <Progress value={action.progress} className="w-24 h-2 mt-1" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`${
                      action.status === 'completed' ? 'border-[#10b981] text-[#10b981]' :
                      action.status === 'in-progress' ? 'border-[#3b82f6] text-[#3b82f6]' :
                      'border-[#ff6600] text-[#ff6600]'
                    }`}
                    onClick={() => handleOptimize(action.id)}
                    disabled={action.status === 'completed'}
                  >
                    {action.status === 'completed' ? 'Terminé' :
                     action.status === 'in-progress' ? 'En cours...' : 'Démarrer'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides IA */}
      <Card className="hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#3b82f6]/10 to-[#8b5cf6]/10 border border-[#3b82f6]/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions Rapides IA</h3>
              <p className="text-gray-600">Actions intelligentes recommandées par l'IA</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleQuickExport()}
                className="flex items-center space-x-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white"
              >
                <Download className="w-4 h-4" />
                <span>Export Rapide</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleRefreshData()}
                className="flex items-center space-x-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Actualiser IA</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleViewProductDetails('1')}
                className="flex items-center space-x-2 border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white"
              >
                <Eye className="w-4 h-4" />
                <span>Voir Produits</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleViewDetailedReport('performance')}
                className="flex items-center space-x-2 border-[#8b5cf6] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Rapport IA</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modale d'export */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configuration de l'Export</DialogTitle>
            <DialogDescription>
              Personnalisez vos exports de données et rapports
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type de données</Label>
                <Select value={exportOptions.type} onValueChange={(value) => setExportOptions(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les données</SelectItem>
                    <SelectItem value="sales">Ventes uniquement</SelectItem>
                    <SelectItem value="analytics">Analytics uniquement</SelectItem>
                    <SelectItem value="insights">Insights IA uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Format</Label>
                <Select value={exportOptions.format} onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowExportModal(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => handleExport(exportOptions.type, exportOptions.format)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale de détails produit */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Produit</DialogTitle>
            <DialogDescription>
              Informations complètes et analyses du produit sélectionné
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Informations produit</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Nom:</strong> Produit Premium</p>
                  <p><strong>Prix:</strong> {displayAmountWithPoints(25000)}</p>
                  <p><strong>Stock:</strong> 45 unités</p>
                </div>
                <div>
                  <p><strong>Ventes:</strong> 23 ce mois</p>
                  <p><strong>Note:</strong> 4.8/5</p>
                  <p><strong>Catégorie:</strong> Électronique</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowProductModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale de rapport détaillé */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport Détaillé - Analytics</DialogTitle>
            <DialogDescription>
              Analyse complète et insights détaillés de vos performances
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Métriques IA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Score IA */}
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#ff6600] bg-gradient-to-br from-orange-50 to-orange-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-orange-700">Score IA</p>
                      <p className="text-3xl font-bold text-orange-900">94.2</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Zap className="w-6 h-6 text-[#ff6600]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-600">+2.1%</span>
                    <span className="text-sm text-orange-600">vs mois dernier</span>
                  </div>
                </CardContent>
              </Card>

              {/* Précision prédictive */}
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#3b82f6] bg-gradient-to-br from-blue-50 to-blue-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Précision IA</p>
                      <p className="text-3xl font-bold text-blue-900">87.5%</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Target className="w-6 h-6 text-[#3b82f6]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-600">+1.8%</span>
                    <span className="text-sm text-blue-600">vs mois dernier</span>
                  </div>
                </CardContent>
              </Card>

              {/* ROI IA */}
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#8b5cf6] bg-gradient-to-br from-purple-50 to-purple-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-purple-700">ROI IA</p>
                      <p className="text-3xl font-bold text-purple-900">{displayAmountWithPoints(125000)}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-[#8b5cf6]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-600">+15.3%</span>
                    <span className="text-sm text-purple-600">vs mois dernier</span>
                  </div>
                </CardContent>
              </Card>

              {/* Optimisations actives */}
              <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#10b981] bg-gradient-to-br from-green-50 to-green-100/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-green-700">Optimisations</p>
                      <p className="text-3xl font-bold text-green-900">12</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <RefreshCw className="w-6 h-6 text-[#10b981]" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-green-600">+3</span>
                    <span className="text-sm text-green-600">ce mois</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Recommandations IA</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• Augmenter le stock des produits les plus vendus</p>
                <p>• Lancer une campagne de rétention pour les clients inactifs</p>
                <p>• Optimiser les horaires de publication sur les réseaux sociaux</p>
                <p>• Améliorer les descriptions produits pour le SEO</p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setShowReportModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
