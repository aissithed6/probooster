"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Star, 
  TrendingUp, 
  Shield, 
  Gift, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  Package, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Video,
  Play,
  Download,
  ExternalLink
} from "lucide-react"

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("general")
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const categories = [
    {
      id: "general",
      title: "Général",
      icon: HelpCircle,
      color: "from-blue-500 to-cyan-500",
      articles: 15
    },
    {
      id: "account",
      title: "Compte & Profil",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      articles: 12
    },
    {
      id: "shopping",
      title: "Shopping",
      icon: ShoppingCart,
      color: "from-orange-500 to-red-500",
      articles: 20
    },
    {
      id: "points",
      title: "Système de Points",
      icon: Gift,
      color: "from-purple-500 to-violet-500",
      articles: 8
    },
    {
      id: "payment",
      title: "Paiement",
      icon: CreditCard,
      color: "from-yellow-500 to-orange-500",
      articles: 10
    },
    {
      id: "shipping",
      title: "Livraison",
      icon: Truck,
      color: "from-indigo-500 to-purple-500",
      articles: 14
    }
  ]

  const popularArticles = [
    {
      id: "1",
      title: "Comment créer un compte ?",
      category: "Compte & Profil",
      views: 1250,
      rating: 4.8,
      icon: Users
    },
    {
      id: "2", 
      title: "Comment gagner des points ?",
      category: "Système de Points",
      views: 980,
      rating: 4.9,
      icon: Gift
    },
    {
      id: "3",
      title: "Comment effectuer un achat ?",
      category: "Shopping",
      views: 856,
      rating: 4.7,
      icon: ShoppingCart
    },
    {
      id: "4",
      title: "Méthodes de paiement acceptées",
      category: "Paiement",
      views: 743,
      rating: 4.6,
      icon: CreditCard
    },
    {
      id: "5",
      title: "Délais de livraison",
      category: "Livraison",
      views: 692,
      rating: 4.5,
      icon: Truck
    }
  ]

  const faqs = [
    {
      question: "Comment puis-je créer un compte sur Probooster ?",
      answer: "Pour créer un compte, cliquez sur 'Se connecter' en haut à droite, puis sur 'Créer un compte'. Remplissez le formulaire avec vos informations personnelles et validez votre email."
    },
    {
      question: "Comment fonctionne le système de points ?",
      answer: "Le système de points vous permet de gagner des points à chaque achat, partage sur les réseaux sociaux, et participation à la communauté. Ces points peuvent être échangés contre des réductions ou des produits gratuits."
    },
    {
      question: "Quels sont les délais de livraison ?",
      answer: "Les délais de livraison varient selon votre localisation et le vendeur. En général, comptez 2-5 jours ouvrés pour la livraison standard et 1-2 jours pour la livraison express."
    },
    {
      question: "Comment contacter le support client ?",
      answer: "Vous pouvez nous contacter via le chat en ligne disponible 24h/24, par email à support@probooster.online, ou par téléphone au +229 91 50 57 57 24h/24 et 7j/7."
    },
    {
      question: "Comment retourner un produit ?",
      answer: "Pour retourner un produit, allez dans 'Mes commandes', sélectionnez la commande concernée et cliquez sur 'Retourner'. Vous avez 14 jours pour initier un retour après réception."
    },
    {
      question: "Les paiements sont-ils sécurisés ?",
      answer: "Oui, tous nos paiements sont sécurisés par un cryptage SSL de niveau bancaire. Nous acceptons les cartes bancaires, PayPal, et les paiements mobiles."
    }
  ]

  const helpChannels = [
    {
      title: "Chat en ligne",
      description: "Assistance instantanée 24h/24",
      icon: MessageCircle,
      color: "from-green-500 to-emerald-500",
      available: true
    },
    {
      title: "Email",
      description: "Réponse sous 24h",
      icon: Mail,
      color: "from-blue-500 to-cyan-500",
      available: true
    },
    {
      title: "Téléphone",
      description: "Lun-Ven 8h-18h",
      icon: Phone,
      color: "from-orange-500 to-red-500",
      available: true
    },
    {
      title: "Vidéo tutoriels",
      description: "Guides visuels",
      icon: Video,
      color: "from-purple-500 to-violet-500",
      available: true
    }
  ]

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
                     <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
             <HelpCircle className="h-5 w-5 animate-pulse animate-float" />
             <span className="font-semibold group-hover:text-shimmer">CENTRE D'AIDE</span>
             <HelpCircle className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
           </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
            Comment pouvons-nous <span className="text-[#ff6600] animate-pulse">vous aider</span> ?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 hover:text-gray-800 transition-colors duration-300">
            Trouvez rapidement des réponses à vos questions et accédez à notre support expert
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-600">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:animate-pulse" />
            <Input
              type="search"
              placeholder="Rechercher dans l'aide..."
              className="pl-12 pr-4 py-4 text-lg border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Help Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up animation-delay-800">
          {helpChannels.map((channel, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
              <CardHeader className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-r ${channel.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <channel.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{channel.title}</CardTitle>
                <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{channel.description}</p>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  variant="outline" 
                  className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-all duration-300 group transition-all duration-300 hover:scale-105"
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Accéder</span>
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Catégories d'aide</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Card 
                key={category.id}
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group ${
                  activeCategory === category.id ? 'ring-2 ring-[#ff6600]' : ''
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                      <category.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{category.title}</CardTitle>
                      <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{category.articles} articles</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Articles populaires</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularArticles.map((article, index) => (
              <Card key={article.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                      <article.icon className="h-5 w-5 text-white group-hover:animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2 group-hover:text-[#ff6600] transition-colors duration-300">{article.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs group-hover:bg-[#ff6600] group-hover:text-white transition-all duration-300">{article.category}</Badge>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                          <TrendingUp className="h-3 w-3 group-hover:animate-pulse" />
                          <span>{article.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current group-hover:animate-pulse" />
                      <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{article.rating}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[#ff6600] hover:text-[#e55a00] group transition-all duration-300 hover:scale-105">
                      <span className="group-hover:translate-x-1 transition-transform duration-300">Lire</span>
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:animate-bounce" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Questions fréquentes</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleFaq(`faq-${index}`)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{faq.question}</CardTitle>
                    {expandedFaq === `faq-${index}` ? (
                      <ChevronUp className="h-5 w-5 text-[#ff6600] animate-bounce" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 group-hover:animate-pulse" />
                    )}
                  </div>
                </CardHeader>
                {expandedFaq === `faq-${index}` && (
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4 hover:text-shimmer transition-all duration-300">Besoin d'aide supplémentaire ?</h2>
          <p className="text-xl mb-6 opacity-90 hover:opacity-100 transition-opacity duration-300">
            Notre équipe d'experts est là pour vous aider 24h/24
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="mr-2 h-5 w-5 group-hover:animate-bounce" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Chat en ligne</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
            >
              <Mail className="mr-2 h-5 w-5 group-hover:animate-bounce" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Envoyer un email</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 