"use client"

import { useState, useEffect } from 'react'
import { 
  Package, Plus, Search, Filter, MoreHorizontal, 
  Eye, Edit, Trash2, Star, Heart, Share2,
  ShoppingCart, TrendingUp, AlertTriangle, CheckCircle,
  Clock, MapPin, DollarSign, Tag, Image, Settings,
  Copy, EyeOff, Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

// Import du modal de création de produit existant
import AdvancedProductModal from '@/components/seller-dashboard/advanced-product-modal'

interface Product {
  id: string
  name: string
  description: string
  price: number
  salePrice: number
  costPrice: number
  category: string
  subcategory: string
  brand: string
  vendor: string
  status: 'active' | 'inactive' | 'draft' | 'pending' | 'reported'
  stock: number
  stockAlert: number
  rating: number
  totalSales: number
  totalRevenue: number
  featured: boolean
  images: string[]
  tags: string[]
  sku: string
  createdAt: string
  updatedAt: string
  seoScore: number
  socialShares: number
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  // Nouveaux états pour la sélection multiple et les actions en lot
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    // Simulation du chargement des produits
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'iPhone 15 Pro Max',
        description: 'Le dernier iPhone avec des fonctionnalités avancées',
        price: 850000,
        salePrice: 800000,
        costPrice: 700000,
        category: 'Électronique',
        subcategory: 'Smartphones',
        brand: 'Apple',
        vendor: 'TechStore Pro',
        status: 'active',
        stock: 25,
        stockAlert: 5,
        rating: 4.8,
        totalSales: 156,
        totalRevenue: 124800000,
        featured: true,
        images: ['/iphone15.jpg'],
        tags: ['smartphone', 'apple', '5G', 'camera'],
        sku: 'IPH15-PRO-MAX-001',
        createdAt: '2024-09-15',
        updatedAt: '2024-12-19',
        seoScore: 92,
        socialShares: 1250
      },
      {
        id: '2',
        name: 'Samsung Galaxy S24',
        description: 'Flagship Android avec IA intégrée',
        price: 750000,
        salePrice: 0,
        costPrice: 600000,
        category: 'Électronique',
        subcategory: 'Smartphones',
        brand: 'Samsung',
        vendor: 'Electronics Plus',
        status: 'active',
        stock: 18,
        stockAlert: 3,
        rating: 4.6,
        totalSales: 89,
        totalRevenue: 66750000,
        featured: false,
        images: ['/galaxy-s24.jpg'],
        tags: ['smartphone', 'samsung', 'AI', '5G'],
        sku: 'SAMS-S24-001',
        createdAt: '2024-10-20',
        updatedAt: '2024-12-18',
        seoScore: 88,
        socialShares: 890
      },
      {
        id: '3',
        name: 'MacBook Air M2',
        description: 'Ordinateur portable ultra-léger et performant',
        price: 1200000,
        salePrice: 1100000,
        costPrice: 950000,
        category: 'Informatique',
        subcategory: 'Ordinateurs portables',
        brand: 'Apple',
        vendor: 'TechStore Pro',
        status: 'active',
        stock: 12,
        stockAlert: 2,
        rating: 4.9,
        totalSales: 67,
        totalRevenue: 73700000,
        featured: true,
        images: ['/macbook-air.jpg'],
        tags: ['laptop', 'apple', 'M2', 'ultrabook'],
        sku: 'MAC-AIR-M2-001',
        createdAt: '2024-08-10',
        updatedAt: '2024-12-17',
        seoScore: 95,
        socialShares: 2100
      }
    ]

    setProducts(mockProducts)
    setFilteredProducts(mockProducts)
  }, [])

  // Filtrage des produits
  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    if (vendorFilter !== 'all') {
      filtered = filtered.filter(product => product.vendor === vendorFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, statusFilter, categoryFilter, vendorFilter])

  const handleCreateProduct = () => {
    setIsCreateModalOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setProducts(products.filter(product => product.id !== productId))
    }
  }



  const handleToggleFeatured = (productId: string) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, featured: !product.featured } : product
    ))
  }

  // Fonction d'export CSV
  const exportToCSV = (productsToExport: Product[]) => {
    try {
      // Préparer les données pour l'export
      const exportData = productsToExport.map(product => ({
        ID: product.id,
        Nom: product.name,
        Description: product.description,
        Prix: `${product.price} F CFA`,
        'Prix de vente': product.salePrice > 0 ? `${product.salePrice} F CFA` : 'N/A',
        'Prix de revient': `${product.costPrice} F CFA`,
        Catégorie: product.category,
        'Sous-catégorie': product.subcategory,
        Marque: product.brand,
        Vendeur: product.vendor,
        Statut: product.status === 'active' ? 'Actif' : 
                product.status === 'inactive' ? 'Inactif' :
                product.status === 'draft' ? 'Brouillon' :
                product.status === 'pending' ? 'En attente' :
                product.status === 'reported' ? 'Signalé' : 'Inconnu',
        Stock: product.stock,
        'Alerte stock': product.stockAlert,
        Note: `${product.rating}/5`,
        'Total ventes': product.totalSales,
        'Revenus totaux': `${product.totalRevenue} F CFA`,
        Vedette: product.featured ? 'Oui' : 'Non',
        SKU: product.sku,
        'Date création': product.createdAt,
        'Date modification': product.updatedAt,
        'Score SEO': product.seoScore,
        'Partages sociaux': product.socialShares
      }))

      // Créer le contenu CSV avec gestion des caractères spéciaux
      const headers = Object.keys(exportData[0]).join(',')
      const rows = exportData.map(row => 
        Object.values(row).map(value => {
          const stringValue = String(value)
          // Échapper les guillemets et entourer de guillemets si nécessaire
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      )
      const csvContent = [headers, ...rows].join('\n')

      // Créer et télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Nom du fichier selon le type d'export
      const fileName = selectedProducts.size > 0 
        ? `produits_selectionnes_export_${new Date().toISOString().split('T')[0]}.csv`
        : `produits_export_${new Date().toISOString().split('T')[0]}.csv`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Nettoyer l'URL
      URL.revokeObjectURL(url)

      // Notification de succès avec détails
      const exportType = selectedProducts.size > 0 ? 'sélectionnés' : 'tous'
      console.log(`Export CSV réussi : ${productsToExport.length} produit(s) ${exportType} exporté(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error)
    }
  }

  // Fonction d'export Excel (XLSX)
  const exportToExcel = (productsToExport: Product[]) => {
    try {
      // Préparer les données pour l'export
      const exportData = productsToExport.map(product => ({
        ID: product.id,
        Nom: product.name,
        Description: product.description,
        Prix: product.price,
        'Prix de vente': product.salePrice > 0 ? product.salePrice : null,
        'Prix de revient': product.costPrice,
        Catégorie: product.category,
        'Sous-catégorie': product.subcategory,
        Marque: product.brand,
        Vendeur: product.vendor,
        Statut: product.status === 'active' ? 'Actif' : 
                product.status === 'inactive' ? 'Inactif' :
                product.status === 'draft' ? 'Brouillon' :
                product.status === 'pending' ? 'En attente' :
                product.status === 'reported' ? 'Signalé' : 'Inconnu',
        Stock: product.stock,
        'Alerte stock': product.stockAlert,
        Note: product.rating,
        'Total ventes': product.totalSales,
        'Revenus totaux': product.totalRevenue,
        Vedette: product.featured ? 'Oui' : 'Non',
        SKU: product.sku,
        'Date création': product.createdAt,
        'Date modification': product.updatedAt,
        'Score SEO': product.seoScore,
        'Partages sociaux': product.socialShares
      }))

      // Créer le contenu Excel (format TSV pour compatibilité)
      const headers = Object.keys(exportData[0]).join('\t')
      const rows = exportData.map(row => 
        Object.values(row).map(value => {
          const stringValue = String(value || '')
          // Échapper les tabulations et retours à la ligne
          if (stringValue.includes('\t') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join('\t')
      )
      const tsvContent = [headers, ...rows].join('\n')

      // Créer et télécharger le fichier
      const blob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Nom du fichier selon le type d'export
      const fileName = selectedProducts.size > 0 
        ? `produits_selectionnes_export_${new Date().toISOString().split('T')[0]}.xls`
        : `produits_export_${new Date().toISOString().split('T')[0]}.xls`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Nettoyer l'URL
      URL.revokeObjectURL(url)

      // Notification de succès avec détails
      const exportType = selectedProducts.size > 0 ? 'sélectionnés' : 'tous'
      console.log(`Export Excel réussi : ${productsToExport.length} produit(s) ${exportType} exporté(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
    }
  }

  // Fonction d'export PDF
  const exportToPDF = (productsToExport: Product[]) => {
    try {
      // Créer le contenu HTML pour le PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Export Produits</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #ff6600; text-align: center; border-bottom: 2px solid #ff6600; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .header-info { text-align: center; margin-bottom: 20px; color: #666; }
            .product-row:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Liste des Produits</h1>
          <div class="header-info">
            <p>Date d'export : ${new Date().toLocaleDateString('fr-FR')}</p>
            <p>Nombre de produits : ${productsToExport.length}</p>
            ${selectedProducts.size > 0 ? `<p>Produits sélectionnés : ${selectedProducts.size}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Marque</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Note</th>
                <th>Vedette</th>
              </tr>
            </thead>
            <tbody>
              ${productsToExport.map(product => `
                <tr class="product-row">
                  <td>${product.name}</td>
                  <td>${product.brand}</td>
                  <td>${product.category} > ${product.subcategory}</td>
                  <td>${product.price} F CFA</td>
                  <td>${product.stock}</td>
                  <td>${product.status === 'active' ? 'Actif' : 
                         product.status === 'inactive' ? 'Inactif' :
                         product.status === 'draft' ? 'Brouillon' :
                         product.status === 'pending' ? 'En attente' :
                         product.status === 'reported' ? 'Signalé' : 'Inconnu'}</td>
                  <td>${product.rating}/5</td>
                  <td>${product.featured ? 'Oui' : 'Non'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      // Créer et télécharger le fichier HTML (qui peut être converti en PDF)
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      // Nom du fichier selon le type d'export
      const fileName = selectedProducts.size > 0 
        ? `produits_selectionnes_export_${new Date().toISOString().split('T')[0]}.html`
        : `produits_export_${new Date().toISOString().split('T')[0]}.html`
      
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Nettoyer l'URL
      URL.revokeObjectURL(url)

      // Notification de succès avec détails
      const exportType = selectedProducts.size > 0 ? 'sélectionnés' : 'tous'
      console.log(`Export PDF/HTML réussi : ${productsToExport.length} produit(s) ${exportType} exporté(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
    }
  }

  // Fonction principale d'export avec sélection du format
  const exportProducts = (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      // Déterminer quels produits exporter (sélectionnés ou tous)
      const productsToExport = selectedProducts.size > 0 
        ? filteredProducts.filter(product => selectedProducts.has(product.id))
        : filteredProducts

      // Vérifier s'il y a des produits à exporter
      if (productsToExport.length === 0) {
        console.log('Aucun produit à exporter')
        return
      }

      // Exporter selon le format choisi
      switch (format) {
        case 'csv':
          exportToCSV(productsToExport)
          break
        case 'excel':
          exportToExcel(productsToExport)
          break
        case 'pdf':
          exportToPDF(productsToExport)
          break
        default:
          exportToCSV(productsToExport)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  // Nouvelles fonctions de gestion des statuts
  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      // Simuler la mise à jour du statut
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, status: newStatus as any, updatedAt: new Date().toISOString() }
          : product
      ))
      
      // Mettre à jour les produits filtrés
      setFilteredProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, status: newStatus as any, updatedAt: new Date().toISOString() }
          : product
      ))
      
      // Notification de succès
      const statusLabels = {
        'active': 'Actif',
        'inactive': 'Inactif',
        'draft': 'Brouillon',
        'pending': 'En attente',
        'reported': 'Signalé'
      }
      
      console.log(`Statut du produit ${productId} changé vers ${statusLabels[newStatus as keyof typeof statusLabels]}`)
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
    }
  }

  // Fonction de duplication de produit
  const handleDuplicateProduct = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return
      
      // Simuler la duplication
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const duplicatedProduct = {
        ...product,
        id: Date.now().toString(),
        name: `${product.name} (Copie)`,
        sku: `${product.sku}-COPY`,
        status: 'draft' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setProducts(prev => [duplicatedProduct, ...prev])
      setFilteredProducts(prev => [duplicatedProduct, ...prev])
      
      console.log(`Produit ${productId} dupliqué avec succès`)
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
    }
  }

  // Fonction de signalement de produit
  const handleReportProduct = async (productId: string) => {
    try {
      // Simuler le signalement
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, status: 'reported', updatedAt: new Date().toISOString() }
          : product
      ))
      
      setFilteredProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, status: 'reported', updatedAt: new Date().toISOString() }
          : product
      ))
      
      console.log(`Produit ${productId} signalé avec succès`)
    } catch (error) {
      console.error('Erreur lors du signalement:', error)
    }
  }

  // Fonctions de gestion de la sélection multiple
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set())
      setSelectAll(false)
    } else {
      const currentTabProducts = getCurrentTabProducts()
      setSelectedProducts(new Set(currentTabProducts.map(p => p.id)))
      setSelectAll(true)
    }
  }

  const getCurrentTabProducts = () => {
    switch (activeTab) {
      case 'active':
        return filteredProducts.filter(p => p.status === 'active')
      case 'pending':
        return filteredProducts.filter(p => p.status === 'pending')
      case 'reported':
        return filteredProducts.filter(p => p.status === 'reported')
      case 'featured':
        return filteredProducts.filter(p => p.featured)
      case 'low-stock':
        return filteredProducts.filter(p => p.stock <= p.stockAlert)
      case 'draft':
        return filteredProducts.filter(p => p.status === 'draft')
      default:
        return filteredProducts
    }
  }

  // Actions en lot
  const handleBulkAction = async (action: string) => {
    if (selectedProducts.size === 0) return
    
    try {
      const productIds = Array.from(selectedProducts)
      
      switch (action) {
        case 'duplicate':
          for (const id of productIds) {
            await handleDuplicateProduct(id)
          }
          break
        case 'inactive':
          for (const id of productIds) {
            await handleStatusChange(id, 'inactive')
          }
          break
        case 'pending':
          for (const id of productIds) {
            await handleStatusChange(id, 'pending')
          }
          break
        case 'draft':
          for (const id of productIds) {
            await handleStatusChange(id, 'draft')
          }
          break
        case 'reported':
          for (const id of productIds) {
            await handleStatusChange(id, 'reported')
          }
          break
        case 'delete':
          for (const id of productIds) {
            await handleDeleteProduct(id)
          }
          break
        case 'active':
          for (const id of productIds) {
            await handleStatusChange(id, 'active')
          }
          break
      }
      
      // Réinitialiser la sélection
      setSelectedProducts(new Set())
      setSelectAll(false)
      setShowBulkActions(false)
      
      console.log(`Action en lot "${action}" effectuée sur ${productIds.length} produit(s)`)
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error)
    }
  }

  const clearSelection = () => {
    setSelectedProducts(new Set())
    setSelectAll(false)
    setShowBulkActions(false)
  }

  // Gérer l'affichage de la barre d'actions
  useEffect(() => {
    if (selectedProducts.size > 0) {
      setShowBulkActions(true)
    } else {
      setShowBulkActions(false)
    }
  }, [selectedProducts.size])

  // Fermer le menu d'export quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !(event.target as Element).closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Actif</Badge>
      case 'inactive': return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Inactif</Badge>
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Brouillon</Badge>
      case 'pending': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En attente</Badge>
      case 'reported': return <Badge className="bg-red-100 text-red-800 border-red-200">Signalé</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* En-tête de la gestion des produits */}
      <div className="bg-gradient-to-r from-[#ff6600]/10 to-[#535455]/10 border border-[#ff6600]/30 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion Complète des Produits</h2>
            <p className="text-gray-600 mt-2">
              Création, édition, suppression et modération de tous les produits de la marketplace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleCreateProduct}
              className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer Produit
            </Button>
            <div className="relative export-menu-container">
              <Button 
                variant="outline" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className={`border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors ${
                  selectedProducts.size > 0 ? 'ring-2 ring-[#ff6600]/50' : ''
                }`}
                title={selectedProducts.size > 0 ? `Exporter ${selectedProducts.size} produit(s) sélectionné(s)` : 'Exporter tous les produits'}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {selectedProducts.size > 0 ? `Exporter (${selectedProducts.size})` : 'Exporter'}
              </Button>
              
              {/* Menu déroulant des formats d'export */}
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportProducts('csv')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4 text-[#ff6600]" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        exportProducts('excel')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4 text-[#ff6600]" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => {
                        exportProducts('pdf')
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4 text-[#ff6600]" />
                      Export PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, description, marque ou vendeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="reported">Signalé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="Électronique">Électronique</SelectItem>
                <SelectItem value="Informatique">Informatique</SelectItem>
                <SelectItem value="Mode">Mode</SelectItem>
                <SelectItem value="Maison">Maison</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Vendeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les vendeurs</SelectItem>
                <SelectItem value="TechStore Pro">TechStore Pro</SelectItem>
                <SelectItem value="Electronics Plus">Electronics Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Barre d'actions en lot */}
      {showBulkActions && selectedProducts.size > 0 && (
        <Card className="border-[#ff6600] bg-[#ff6600]/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#ff6600]">
                  {selectedProducts.size} produit(s) sélectionné(s)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                >
                  Annuler la sélection
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Actions disponibles selon l'onglet */}
                {activeTab === 'all' || activeTab === 'active' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : activeTab === 'pending' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('active')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Actif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : activeTab === 'reported' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('active')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Actif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                  </>
                ) : activeTab === 'featured' || activeTab === 'low-stock' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Brouillon
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : activeTab === 'draft' ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('duplicate')}
                      className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Dupliquer
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('active')}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Actif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('inactive')}
                      className="bg-[#535455] hover:bg-[#535455]/90 text-white"
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Inactif
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('pending')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBulkAction('reported')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Signalé
                    </Button>
                  </>
                ) : null}
                
                <Button
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 bg-[#535455]/10 border border-[#535455]/20">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Tous ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Actifs
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            En Attente
          </TabsTrigger>
          <TabsTrigger 
            value="reported" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Signalés
          </TabsTrigger>
          <TabsTrigger 
            value="featured" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Vedettes
          </TabsTrigger>
          <TabsTrigger 
            value="low-stock" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Stock Faible
          </TabsTrigger>
          <TabsTrigger 
            value="draft" 
            className="data-[state=active]:bg-[#ff6600] data-[state=active]:text-white hover:bg-[#ff6600]/20"
          >
            Brouillons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ProductList 
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'active')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'pending')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="reported" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'reported')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.featured)}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="low-stock" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.stock <= p.stockAlert)}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <ProductList 
            products={filteredProducts.filter(p => p.status === 'draft')}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStatusChange={handleStatusChange}
            onToggleFeatured={handleToggleFeatured}
            onView={(product) => {
              setSelectedProduct(product)
              setIsViewModalOpen(true)
            }}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onDuplicate={handleDuplicateProduct}
            onReport={handleReportProduct}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de création de produit */}
      {isCreateModalOpen && (
        <AdvancedProductModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          product={null}
        />
      )}

      {/* Modal d'édition de produit */}
      {isEditModalOpen && selectedProduct && (
        <AdvancedProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          mode="edit"
          product={selectedProduct}
        />
      )}

      {/* Modal de visualisation de produit */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Détails du Produit</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Informations Générales</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{selectedProduct.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.brand}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.vendor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Créé le {selectedProduct.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Prix et Stock</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">{formatPrice(selectedProduct.price)}</span>
                        {selectedProduct.salePrice > 0 && (
                          <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">
                            {formatPrice(selectedProduct.salePrice)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Stock: {selectedProduct.stock} unités</span>
                        {selectedProduct.stock <= selectedProduct.stockAlert && (
                          <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">
                            Stock faible
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Performance</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.totalSales} ventes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{formatPrice(selectedProduct.totalRevenue)} de revenus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Note: {selectedProduct.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">SEO et Social</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Score SEO: {selectedProduct.seoScore}/100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{selectedProduct.socialShares} partages</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewModalOpen(false)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={() => {
                    setIsViewModalOpen(false)
                    handleEditProduct(selectedProduct)
                  }}
                  className="bg-[#ff6600] hover:bg-[#ff6600]/90 text-white"
                >
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant de liste des produits
interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  onStatusChange: (productId: string, status: Product['status']) => void
  onToggleFeatured: (productId: string) => void
  onView: (product: Product) => void
  selectedProducts: Set<string>
  onSelectProduct: (productId: string) => void
  onDuplicate: (productId: string) => void
  onReport: (productId: string) => void
}

function ProductList({ products, onEdit, onDelete, onStatusChange, onToggleFeatured, onView, selectedProducts, onSelectProduct, onDuplicate, onReport }: ProductListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.menu-container')) {
        setOpenMenuId(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(price)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">Actif</Badge>
      case 'inactive': return <Badge className="bg-[#535455]/20 text-[#535455] border-[#535455]/30">Inactif</Badge>
      case 'draft': return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Brouillon</Badge>
      case 'pending': return <Badge className="bg-blue-100 text-blue-800 border-blue-200">En attente</Badge>
      case 'reported': return <Badge className="bg-red-100 text-red-800 border-red-200">Signalé</Badge>
      default: return <Badge variant="outline">Inconnu</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Checkbox de sélection */}
                <input
                  type="checkbox"
                  checked={selectedProducts.has(product.id)}
                  onChange={() => onSelectProduct(product.id)}
                  className="w-4 h-4 text-[#ff6600] bg-gray-100 border-gray-300 rounded focus:ring-[#ff6600] focus:ring-2"
                />
                <div className="w-16 h-16 bg-gradient-to-r from-[#ff6600] to-[#535455] rounded-lg flex items-center justify-center text-white font-semibold">
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    {getStatusBadge(product.status)}
                    {product.featured && (
                      <Badge className="bg-[#ff6600]/20 text-[#ff6600] border-[#ff6600]/30">
                        Vedette
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>{product.brand}</span>
                                         <span>{product.category} {'>'}{' '}{product.subcategory}</span>
                    <span>{product.vendor}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{formatPrice(product.price)}</span>
                    {product.salePrice > 0 && (
                      <span className="text-[#ff6600] font-medium">
                        {formatPrice(product.salePrice)}
                      </span>
                    )}
                    <span>Stock: {product.stock}</span>
                    <span>Note: {product.rating}/5</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onView(product)}
                  className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(product)}
                  className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onToggleFeatured(product.id)}
                  className={product.featured 
                    ? 'bg-[#ff6600] border-[#ff6600] text-white hover:bg-[#ff6600]/90' 
                    : 'border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors'
                  }
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDelete(product.id)}
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                {/* Icône 3 points avec menu déroulant */}
                <div className="relative menu-container">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#535455] text-[#535455] hover:bg-[#535455] hover:text-white transition-colors"
                    onClick={() => setOpenMenuId(openMenuId === product.id ? null : product.id)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  
                  {/* Menu déroulant des options */}
                  {openMenuId === product.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onDuplicate(product.id)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4 text-[#ff6600]" />
                          Dupliquer
                        </button>
                        <button
                          onClick={() => {
                            onStatusChange(product.id, 'inactive')
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <EyeOff className="h-4 w-4 text-[#535455]" />
                          Inactif
                        </button>
                        <button
                          onClick={() => {
                            onStatusChange(product.id, 'pending')
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-yellow-600" />
                          En attente
                        </button>
                        <button
                          onClick={() => {
                            onStatusChange(product.id, 'draft')
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Save className="h-4 w-4 text-yellow-600" />
                          Brouillon
                        </button>
                        <button
                          onClick={() => {
                            onReport(product.id)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          Signalé
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {products.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun produit trouvé</h3>
            <p className="text-gray-600">Aucun produit ne correspond aux critères de recherche.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
