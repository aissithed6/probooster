"use client"

import { useState, useEffect } from "react"
import { BarChart3, X, Share2, Trash2, Star, Package, Building, Coins, CheckCircle, Clock, Truck, TrendingUp, ShoppingCart, Crown, Instagram, Download, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { useNotifications, NotificationContainer } from "@/components/ui/modern-notification"

export default function HeaderCompare() {
  const [compareList, setCompareList] = useState<any[]>([])
  const [compareListLength, setCompareListLength] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState<number | null>(null)
  const { addNotification } = useNotifications()

  // Initialisation
  useEffect(() => {
    setIsClient(true)
    loadCompareList()
  }, [])

  const loadCompareList = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('compareList')
        if (stored) {
          const list = JSON.parse(stored)
          setCompareList(list)
          setCompareListLength(list.length)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la liste de comparaison:', error)
      setCompareList([])
      setCompareListLength(0)
    }
  }

  const removeFromCompare = (productId: number) => {
    try {
      const updatedList = compareList.filter((item: any) => item.id !== productId)
      localStorage.setItem('compareList', JSON.stringify(updatedList))
      setCompareList(updatedList)
      setCompareListLength(updatedList.length)
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: 'Produit retiré de la comparaison' 
})
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Erreur lors de la suppression' 
})
    }
  }

  const clearCompareList = () => {
    try {
      localStorage.removeItem('compareList')
      setCompareList([])
      setCompareListLength(0)
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '🗑️ Liste de comparaison vidée' 
})
    } catch (error) {
      console.error('Erreur lors du vidage de la liste:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du vidage'
      })
    }
  }

  // Fonction d'exportation PDF
  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      // Simulation de l'exportation PDF
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Créer le contenu du PDF
      const pdfContent = {
        title: 'Comparaison de Produits Probooster',
        date: new Date().toLocaleDateString('fr-FR'),
        products: compareList.map((item, index) => ({
          position: index + 1,
          name: item.name,
          price: item.price,
          points: Math.round(item.price / 100),
          seller: item.seller || 'Probooster',
          brand: item.brand || 'Marque',
          rating: item.rating || 0,
          category: item.category || 'Catégorie'
        })),
        total: compareList.reduce((total, item) => total + item.price, 0)
      }

      // Simuler le téléchargement
      const blob = new Blob([JSON.stringify(pdfContent, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comparaison-produits-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '📄 PDF exporté avec succès !' 
})
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'exportation'
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Fonction d'ajout au panier
  const addToCart = async (product: any) => {
    setIsAddingToCart(product.id)
    try {
      // Récupérer le panier actuel
      const currentCart = localStorage.getItem('cart') || '[]'
      const cart = JSON.parse(currentCart)
      
      // Vérifier si le produit est déjà dans le panier
      const existingProduct = cart.find((item: any) => item.id === product.id)
      
      if (existingProduct) {
        existingProduct.quantity = (existingProduct.quantity || 1) + 1
        addNotification({ 
  type: 'info', 
  title: 'Information', 
  message: 'Quantité mise à jour dans le panier' 
})
      } else {
        cart.push({
          ...product,
          quantity: 1,
          addedAt: new Date().toISOString()
        })
        addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: 'Produit ajouté au panier !' 
})
      }
      
      // Sauvegarder le panier
      localStorage.setItem('cart', JSON.stringify(cart))
      
      // Déclencher un événement pour mettre à jour le compteur du panier
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }))
      
      // Log pour debug
      console.log('Produit ajouté au panier:', product.name)
      console.log('Panier actuel:', cart)
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error)
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'ajout au panier'
      })
    } finally {
      setIsAddingToCart(null)
    }
  }

  const shareCompareList = () => {
    try {
      const compareText = compareList.map((item: any, index: number) =>
        `${index + 1}. ${item.name} - ${item.price.toLocaleString()} F CFA`
      ).join('\n')
      
      const shareText = `📊 Comparaison Probooster !\n${compareText}\n💰 Total: ${compareList.reduce((total: number, item: any) => total + item.price, 0).toLocaleString()} F CFA\n\n🔗 ${window.location.origin}`
      
      return {
        text: shareText,
        url: window.location.origin
      }
    } catch (error) {
      console.error('Erreur lors de la préparation du partage:', error)
      return null
    }
  }

  const shareToWhatsApp = (content: string) => {
    try {
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(content)}`
      window.open(shareUrl, '_blank')
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '✅ +30 points gagnés ! Partagez sur WhatsApp' 
})
    } catch (error) {
      console.error('Erreur lors du partage WhatsApp:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Erreur lors du partage WhatsApp' 
})
    }
  }

  const shareToFacebook = (content: string) => {
    try {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(content)}`
      window.open(shareUrl, '_blank', 'width=600,height=400')
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '✅ +50 points gagnés ! Partagez sur Facebook' 
})
    } catch (error) {
      console.error('Erreur lors du partage Facebook:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Erreur lors du partage Facebook' 
})
    }
  }

  const shareToInstagram = (content: string) => {
    try {
      // Instagram ne supporte pas le partage direct via URL, on copie le contenu
      copyToClipboard(content)
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '✅ +40 points gagnés ! Contenu copié pour Instagram' 
})
    } catch (error) {
      console.error('Erreur lors du partage Instagram:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Erreur lors du partage Instagram' 
})
    }
  }

  const copyToClipboard = (content: string) => {
    try {
      navigator.clipboard.writeText(content)
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '✅ Lien copié dans le presse-papiers !' 
})
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
      // Fallback pour les navigateurs plus anciens
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '✅ Lien copié dans le presse-papiers !' 
})
    }
  }

  const shareToTwitter = (content: string) => {
    try {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`
      window.open(shareUrl, '_blank', 'width=600,height=400')
      addNotification({ 
  type: 'success', 
  title: 'Succès', 
  message: '✅ +40 points gagnés ! Partagez sur Twitter' 
})
    } catch (error) {
      console.error('Erreur lors du partage Twitter:', error)
      addNotification({ 
  type: 'error', 
  title: 'Erreur', 
  message: 'Erreur lors du partage Twitter' 
})
    }
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* En-tête optimisé avec titre et description sur la même ligne */}
      <DialogHeader className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg animate-bounce-slow hover:scale-110 transition-transform duration-300">
              <BarChart3 className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="animate-slide-in-left">
              <DialogTitle className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
                Comparaison de Produits
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1 hover:text-gray-800 transition-colors duration-300">
                Analysez en détail chaque produit et prenez la meilleure décision d'achat
              </DialogDescription>
            </div>
          </div>
          {compareListLength > 0 && (
            <Badge className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-4 py-2 text-lg font-semibold shadow-lg animate-pulse hover:scale-105 transition-transform duration-300">
              {compareListLength} {compareListLength === 1 ? 'produit' : 'produits'} à comparer
            </Badge>
          )}
        </div>
      </DialogHeader>

      {compareListLength === 0 ? (
        // Liste de comparaison vide avec design amélioré
        <div className="text-center py-16 animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-slow hover:scale-110 transition-transform duration-300">
            <BarChart3 className="h-12 w-12 text-orange-500 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 animate-slide-in-up">Votre liste de comparaison est vide</h3>
          <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto animate-slide-in-up delay-100">
            Ajoutez des produits similaires pour les comparer et prendre la meilleure décision
          </p>
          <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-bounce-slow hover:animate-none">
            Découvrir des produits
          </Button>
        </div>
      ) : (
        // Contenu de la comparaison avec design moderne
        <div className="space-y-6 animate-fade-in">
          {/* Actions principales avec design amélioré */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 animate-slide-in-up">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={clearCompareList}
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg animate-pulse hover:animate-none group"
              >
                <Trash2 className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Vider la liste
              </Button>
              <Button
                variant="outline"
                onClick={exportToPDF}
                disabled={isExporting}
                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 px-6 py-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg animate-pulse hover:animate-none group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Download className="h-5 w-5 mr-2 group-hover:translate-y-[-2px] transition-transform duration-300" />
                )}
                {isExporting ? 'Exportation...' : 'Exporter PDF'}
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse hover:animate-none group">
                  <Share2 className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  Partager
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white rounded-xl shadow-xl border border-gray-200 animate-slide-in-up">
                <DropdownMenuItem onClick={() => {
                  const content = shareCompareList()
                  if (content) shareToWhatsApp(content.text)
                }} className="p-3 hover:bg-green-50 rounded-lg cursor-pointer group transition-all duration-200 hover:scale-105">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-sm font-bold">W</span>
                  </div>
                  <span className="group-hover:text-green-600 transition-colors duration-200">WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const content = shareCompareList()
                  if (content) shareToFacebook(content.text)
                }} className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer group transition-all duration-200 hover:scale-105">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-sm font-bold">f</span>
                  </div>
                  <span className="group-hover:text-blue-600 transition-colors duration-200">Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const content = shareCompareList()
                  if (content) shareToInstagram(content.text)
                }} className="p-3 hover:bg-pink-50 rounded-lg cursor-pointer group transition-all duration-200 hover:scale-105">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                    <Instagram className="h-4 w-4 text-white" />
                  </div>
                  <span className="group-hover:text-pink-600 transition-colors duration-200">Instagram</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const content = shareCompareList()
                  if (content) shareToTwitter(content.text)
                }} className="p-3 hover:bg-sky-50 rounded-lg cursor-pointer group transition-all duration-200 hover:scale-105">
                  <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-sm font-bold">𝕏</span>
                  </div>
                  <span className="group-hover:text-sky-600 transition-colors duration-200">Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const content = shareCompareList()
                  if (content) copyToClipboard(content.text)
                }} className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer group transition-all duration-200 hover:scale-105">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                    <span className="text-white text-sm font-bold">📋</span>
                  </div>
                  <span className="group-hover:text-gray-600 transition-colors duration-200">Copier le lien</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tableau de comparaison détaillé et enrichi */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-in-up delay-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-sm">Caractéristiques</th>
                    {compareList.map((item, index) => (
                      <th key={item.id} className="px-4 py-3 text-center font-bold text-sm min-w-[180px] animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        Produit {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Images et noms des produits */}
                  <tr className="bg-gradient-to-br from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-all duration-300">
                    <td className="px-4 py-4 font-semibold text-gray-700">Produit</td>
                    {compareList.map((item) => (
                      <td key={item.id} className="px-4 py-4 text-center group">
                        <div className="space-y-3">
                          <div className="w-24 h-24 mx-auto relative group-hover:scale-105 transition-transform duration-300">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-300"></div>
                          </div>
                          <h4 className="font-bold text-gray-900 text-base leading-tight group-hover:text-orange-600 transition-colors duration-300">{item.name}</h4>
                          <Badge className="bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 border-orange-200 px-2 py-1 text-xs group-hover:scale-110 transition-transform duration-300">
                            {item.category || 'Catégorie'}
                          </Badge>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Vendeur et marque */}
                  <tr className="bg-white hover:bg-gray-50 transition-all duration-300">
                    <td className="px-4 py-3 font-semibold text-gray-700 flex items-center space-x-2">
                      <Building className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span>Vendeur & Marque</span>
                    </td>
                    {compareList.map((item) => (
                      <td key={item.id} className="px-4 py-3 text-center">
                        <div className="space-y-2">
                          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200 hover:bg-blue-100 transition-colors duration-300">
                            <p className="text-sm font-medium text-blue-700">Vendeur</p>
                            <p className="text-sm font-bold text-blue-800">{item.seller || 'Probooster'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 hover:bg-gray-100 transition-colors duration-300">
                            <p className="text-sm font-medium text-gray-700">Marque</p>
                            <p className="text-sm font-bold text-gray-800">{item.brand || 'Marque'}</p>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Prix en F CFA et Points */}
                  <tr className="bg-gray-50 hover:bg-gray-100 transition-all duration-300">
                    <td className="px-4 py-3 font-semibold text-gray-700 flex items-center space-x-2">
                      <Coins className="h-4 w-4 text-yellow-500 animate-bounce-slow" />
                      <span>Prix & Points</span>
                    </td>
                    {compareList.map((item) => (
                      <td key={item.id} className="px-4 py-3 text-center">
                        <div className="space-y-3">
                          <div className="bg-orange-50 rounded-lg p-2 border border-orange-200 hover:bg-orange-100 transition-colors duration-300">
                            <p className="text-sm font-medium text-orange-700">Prix F CFA</p>
                            <p className="text-lg font-bold text-orange-800 hover:scale-110 transition-transform duration-300 inline-block">{item.price.toLocaleString()} F CFA</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200 hover:bg-yellow-100 transition-colors duration-300">
                            <p className="text-sm font-medium text-yellow-700">Points</p>
                            <p className="text-lg font-bold text-yellow-800 hover:scale-110 transition-transform duration-300 inline-block">{Math.round(item.price / 100)} pts</p>
                          </div>
                          <p className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            {item.price > 100000 ? 'Premium' : item.price > 50000 ? 'Intermédiaire' : 'Économique'}
                          </p>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Évaluation et avis */}
                  <tr className="bg-white hover:bg-gray-50 transition-all duration-300">
                    <td className="px-4 py-3 font-semibold text-gray-700 flex items-center space-x-2">
                      <Star className="h-4 w-4 text-yellow-500 animate-pulse" />
                      <span>Évaluation</span>
                    </td>
                    {compareList.map((item) => (
                      <td key={item.id} className="px-4 py-3 text-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'} hover:scale-110 transition-transform duration-200`} 
                              />
                            ))}
                          </div>
                          <p className="text-base font-bold text-gray-900 hover:text-yellow-600 transition-colors duration-300">{item.rating || 0}/5</p>
                          <p className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            {item.rating >= 4.5 ? 'Excellent' : item.rating >= 4 ? 'Très bon' : item.rating >= 3.5 ? 'Bon' : 'Moyen'}
                          </p>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Caractéristiques techniques détaillées */}
                  <tr className="bg-gray-50 hover:bg-gray-100 transition-all duration-300">
                    <td className="px-4 py-3 font-semibold text-gray-700 flex items-center space-x-2">
                      <Package className="h-4 w-4 text-green-500 animate-bounce-slow" />
                      <span>Caractéristiques</span>
                    </td>
                    {compareList.map((item) => (
                      <td key={item.id} className="px-4 py-3 text-center">
                        <div className="space-y-2">
                          {/* Caractéristiques spécifiques selon la catégorie */}
                          {item.category === 'electronics' && (
                            <>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Capacité</p>
                                <p className="text-sm font-bold text-gray-900">{item.capacity || '128GB'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Couleur</p>
                                <p className="text-sm font-bold text-gray-900">{item.color || 'Noir'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Garantie</p>
                                <p className="text-sm font-bold text-gray-900">{item.warranty || '2 ans'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Modèle</p>
                                <p className="text-sm font-bold text-gray-900">{item.model || '2024'}</p>
                              </div>
                            </>
                          )}
                          {item.category === 'fashion' && (
                            <>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Taille</p>
                                <p className="text-sm font-bold text-gray-900">{item.size || 'M'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Matériau</p>
                                <p className="text-sm font-bold text-gray-900">{item.material || 'Coton'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Style</p>
                                <p className="text-sm font-bold text-gray-900">{item.style || 'Casual'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Genre</p>
                                <p className="text-sm font-bold text-gray-900">{item.gender || 'Unisexe'}</p>
                              </div>
                            </>
                          )}
                          {(!item.category || (item.category !== 'electronics' && item.category !== 'fashion')) && (
                            <>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Type</p>
                                <p className="text-sm font-bold text-gray-900">{item.type || 'Standard'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Qualité</p>
                                <p className="text-sm font-bold text-gray-900">{item.quality || 'Premium'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Disponibilité</p>
                                <p className="text-sm font-bold text-gray-900">{item.availability || 'En stock'}</p>
                              </div>
                              <div className="bg-white rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors duration-300">
                                <p className="text-xs font-medium text-gray-700">Origine</p>
                                <p className="text-sm font-bold text-gray-900">{item.origin || 'Local'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Livraison et garantie */}
                  <tr className="bg-white hover:bg-gray-50 transition-all duration-300">
                    <td className="px-4 py-3 font-semibold text-gray-700 flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-purple-500 animate-bounce-slow" />
                      <span>Livraison & Garantie</span>
                    </td>
                    {compareList.map((item) => (
                      <td key={item.id} className="px-4 py-3 text-center">
                        <div className="space-y-2">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all duration-300">
                            <p className="text-xs font-medium text-green-700">Livraison</p>
                            <p className="text-sm font-bold text-green-800">{item.delivery || 'Gratuite'}</p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300">
                            <p className="text-xs font-medium text-blue-700">Garantie</p>
                            <p className="text-sm font-bold text-blue-800">{item.warranty || '2 ans'}</p>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 border border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all duration-300">
                            <p className="text-xs font-medium text-purple-700">Retour</p>
                            <p className="text-sm font-bold text-purple-800">{item.return || '30 jours'}</p>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Actions */}
                  <tr className="bg-gradient-to-br from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-all duration-300">
                    <td className="px-4 py-3 font-semibold text-gray-700">Actions</td>
                    {compareList.map((item) => (
                      <td key={item.id} className="px-4 py-3 text-center">
                        <div className="space-y-2">
                          <Button 
                            onClick={() => addToCart(item)}
                            disabled={isAddingToCart === item.id}
                            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-xs py-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isAddingToCart === item.id ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <ShoppingCart className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform duration-300" />
                            )}
                            {isAddingToCart === item.id ? 'Ajout...' : 'Ajouter au panier'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => removeFromCompare(item.id)}
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-lg transition-all duration-300 hover:scale-105 text-xs py-2 group hover:shadow-lg"
                          >
                            <X className="h-3 w-3 mr-1 group-hover:rotate-90 transition-transform duration-300" />
                            Retirer
                          </Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Résumé intelligent de la comparaison */}
          {compareListLength > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in-up delay-200">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-800 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform duration-300" />
                    <span>Meilleur rapport qualité-prix</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const bestValue = compareList.reduce((best, current) => {
                      const currentValue = (current.rating || 0) / (current.price / 10000)
                      const bestValue = (best.rating || 0) / (best.price / 10000)
                      return currentValue > bestValue ? current : best
                    })
                    return (
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-700 group-hover:scale-110 transition-transform duration-300 inline-block">{bestValue.name}</p>
                        <p className="text-sm text-green-600">{bestValue.price.toLocaleString()} F CFA</p>
                        <p className="text-xs text-green-500">{Math.round(bestValue.price / 100)} pts</p>
                        <Badge className="bg-green-100 text-green-700 border-green-200 mt-1 text-xs group-hover:scale-110 transition-transform duration-300">
                          Recommandé
                        </Badge>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-blue-800 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                    <span>Prix le plus bas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const lowestPrice = compareList.reduce((lowest, current) => 
                      current.price < lowest.price ? current : lowest
                    )
                    return (
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-700 group-hover:scale-110 transition-transform duration-300 inline-block">{lowestPrice.name}</p>
                        <p className="text-sm text-blue-600">{lowestPrice.price.toLocaleString()} F CFA</p>
                        <p className="text-xs text-blue-500">{Math.round(lowestPrice.price / 100)} pts</p>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 mt-1 text-xs group-hover:scale-110 transition-transform duration-300">
                          Économique
                        </Badge>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-800 flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                    <span>Meilleure évaluation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const bestRating = compareList.reduce((best, current) => 
                      (current.rating || 0) > (best.rating || 0) ? current : best
                    )
                    return (
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-700 group-hover:scale-110 transition-transform duration-300 inline-block">{bestRating.name}</p>
                        <p className="text-sm text-purple-600">{bestRating.rating}/5</p>
                        <p className="text-xs text-purple-500">{bestRating.seller || 'Vendeur'}</p>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 mt-1 text-xs group-hover:scale-110 transition-transform duration-300">
                          Top qualité
                        </Badge>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Graphique de comparaison des prix */}
          {compareListLength > 1 && (
            <Card className="p-4 bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-slide-in-up delay-300">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-orange-500 animate-pulse" />
                  <span>Analyse comparative des prix</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compareList.map((item, index) => {
                    const maxPrice = Math.max(...compareList.map(p => p.price))
                    const percentage = (item.price / maxPrice) * 100
                    return (
                      <div key={item.id} className="space-y-2 group">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700 text-sm group-hover:text-orange-600 transition-colors duration-300">{item.name}</span>
                          <div className="text-right">
                            <span className="font-bold text-orange-600 text-sm">{item.price.toLocaleString()} F CFA</span>
                            <p className="text-xs text-gray-500">{Math.round(item.price / 100)} pts</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 group-hover:h-3 transition-all duration-300">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-1000 ease-out group-hover:h-3"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
                 </div>
       )}
       
       {/* Conteneur des notifications */}
       <NotificationContainer />
     </div>
   )
 }


