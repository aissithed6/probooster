"use client"

import { useState, useEffect } from "react"
import { HelpCircle, BookOpen, Video, FileText, Search, Lightbulb, Star, Users, Clock, CheckCircle, CreditCard, Truck, Gift, User, MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HeaderHelp() {
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isClient, setIsClient] = useState(false)

  // Initialisation
  useEffect(() => {
    setIsClient(true)
  }, [])

  const helpCategories = [
    {
      id: "getting-started",
      title: "Premiers pas",
      description: "Commencer avec Probooster",
      icon: Star,
      color: "blue",
      articles: [
        "Comment créer un compte",
        "Première commande",
        "Navigation sur le site",
        "Système de points"
      ]
    },
    {
      id: "orders",
      title: "Commandes",
      description: "Gérer vos commandes",
      icon: CheckCircle,
      color: "green",
      articles: [
        "Passer une commande",
        "Suivre une commande",
        "Annuler une commande",
        "Historique des commandes"
      ]
    },
    {
      id: "payments",
      title: "Paiements",
      description: "Options de paiement",
      icon: CreditCard,
      color: "purple",
      articles: [
        "Méthodes de paiement",
        "Paiement fractionné",
        "Paiement différé",
        "Sécurité des paiements"
      ]
    },
    {
      id: "delivery",
      title: "Livraison",
      description: "Suivi et options",
      icon: Truck,
      color: "orange",
      articles: [
        "Suivi en temps réel",
        "Options de livraison",
        "Contact livreur",
        "Problèmes de livraison"
      ]
    },
    {
      id: "points",
      title: "Points fidélité",
      description: "Système de récompenses",
      icon: Gift,
      color: "yellow",
      articles: [
        "Gagner des points",
        "Utiliser ses points",
        "Retrait des points",
        "Historique des points"
      ]
    },
    {
      id: "account",
      title: "Compte utilisateur",
      description: "Gérer votre profil",
      icon: User,
      color: "indigo",
      articles: [
        "Modifier le profil",
        "Changer le mot de passe",
        "Préférences",
        "Sécurité du compte"
      ]
    }
  ]

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Logique de recherche dans l'aide
      console.log('Recherche d\'aide:', searchQuery)
      alert(`🔍 Recherche d'aide pour: "${searchQuery}"\n\nRésultats disponibles dans la section correspondante.`)
    }
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const handleArticleClick = (article: string) => {
    alert(`📖 Article d'aide: ${article}\n\nContenu détaillé disponible dans notre base de connaissances.`)
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Help Button */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
          >
            <HelpCircle className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-[#ff6600]" />
              <span>Centre d'aide</span>
            </DialogTitle>
            <DialogDescription>
              Trouvez rapidement l'aide dont vous avez besoin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Barre de recherche */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rechercher dans l'aide</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Tapez votre question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} className="bg-[#ff6600] hover:bg-[#e55a00]">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Catégories d'aide */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Catégories d'aide</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {helpCategories.map((category) => (
                  <Card 
                    key={category.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 ${
                      selectedCategory === category.id ? 'border-[#ff6600]' : 'border-gray-200'
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 bg-${category.color}-100 rounded-full flex items-center justify-center`}>
                          <category.icon className={`h-5 w-5 text-${category.color}-600`} />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-800">{category.title}</h5>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                      
                      {selectedCategory === category.id && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                          <h6 className="text-sm font-medium text-gray-700">Articles disponibles :</h6>
                          <div className="space-y-1">
                            {category.articles.map((article, index) => (
                              <div
                                key={index}
                                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer p-1 rounded hover:bg-blue-50"
                                onClick={() => handleArticleClick(article)}
                              >
                                • {article}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Articles populaires */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Articles populaires</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm">Comment gagner des points ?</h5>
                        <p className="text-xs text-gray-600">Découvrez toutes les façons de gagner des points</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm">Suivi de livraison</h5>
                        <p className="text-xs text-gray-600">Suivez vos commandes en temps réel</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm">Paiement fractionné</h5>
                        <p className="text-xs text-gray-600">Payez en plusieurs fois sans frais</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm">Chat support</h5>
                        <p className="text-xs text-gray-600">Obtenez de l'aide en temps réel</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Ressources supplémentaires */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Ressources supplémentaires</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h5 className="font-semibold text-sm">Base de connaissances</h5>
                  <p className="text-xs text-gray-600">Articles détaillés et guides</p>
                </Card>
                
                <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <Video className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h5 className="font-semibold text-sm">Tutoriels vidéo</h5>
                  <p className="text-xs text-gray-600">Apprendre en regardant</p>
                </Card>
                
                <Card className="text-center p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h5 className="font-semibold text-sm">Communauté</h5>
                  <p className="text-xs text-gray-600">Forum d'entraide</p>
                </Card>
              </div>
            </div>

            {/* Contact support */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💬</span>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800">Besoin d'aide supplémentaire ?</h4>
                  <p className="text-sm text-blue-700">
                    Notre équipe support est disponible 24h/24 pour vous aider.
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Chat support
                    </Button>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-600">
                      <Phone className="h-3 w-3 mr-1" />
                      Appeler
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowHelpModal(false)}>
                Fermer
              </Button>
              
              <Button 
                onClick={() => window.open('/help', '_blank')}
                className="bg-[#ff6600] hover:bg-[#e55a00]"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Voir toute l'aide
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


