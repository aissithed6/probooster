"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
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
  ExternalLink,
  Loader2,
  Send
} from "lucide-react"
import { HelpService, type HelpCategory, type HelpArticle, type FAQ } from "@/lib/services/help-service"
import { useAuth } from "@/contexts/AuthContext"
import { useChatContext } from "@/lib/chat-context-supabase"
import { ChatService } from "@/lib/services/chat-service"
import { toast } from "react-hot-toast"
import Link from "next/link"

const ICON_MAP: Record<string, any> = {
  HelpCircle,
  Users,
  ShoppingCart,
  Gift,
  CreditCard,
  Truck,
  MessageCircle,
  Mail,
  Phone,
  Video
}

export default function HelpCenterPage() {
  const { user } = useAuth()
  const { createChatSession, openChatSession, chatSessions } = useChatContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  
  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [popularArticles, setPopularArticles] = useState<HelpArticle[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [categoryArticles, setCategoryArticles] = useState<HelpArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCategory, setIsLoadingCategory] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([])

  // Article Modal
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)

  // Support Ticket Form
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false)
  const [ticketData, setTicketData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    department: "general"
  })

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true)
      try {
        const [cats, popular, allFaqs] = await Promise.all([
          HelpService.getCategories(),
          HelpService.getPopularArticles(),
          HelpService.getFAQs()
        ])
        setCategories(cats)
        setPopularArticles(popular)
        setFaqs(allFaqs)
      } catch (error) {
        console.error("❌ Erreur chargement aide:", error)
        toast.error("Impossible de charger les données d'aide.")
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function loadCategoryArticles() {
      if (activeCategory === 'all') {
        setCategoryArticles([])
        return
      }
      setIsLoadingCategory(true)
      const articles = await HelpService.getArticlesByCategory(activeCategory)
      setCategoryArticles(articles)
      setIsLoadingCategory(false)
    }
    loadCategoryArticles()
  }, [activeCategory])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true)
        const results = await HelpService.searchArticles(searchQuery)
        setSearchResults(results)
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (user) {
      setTicketData(prev => ({
        ...prev,
        name: user.email?.split('@')[0] || "",
        email: user.email || ""
      }))
    }
  }, [user])

  const handleOpenArticle = (article: HelpArticle) => {
    setSelectedArticle(article)
    setIsArticleModalOpen(true)
    // Optionnel: Incrémenter les vues
  }

  const handleOpenChat = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour accéder au chat.")
      return
    }

    const loadingToast = toast.loading("Ouverture du chat de support...")
    try {
      const admin = await ChatService.getSystemAdmin(user.id)
      if (!admin) {
        toast.error("Le système de chat est en cours de maintenance. Veuillez nous contacter par email.")
        return
      }

      // Vérifier si une session existe déjà
      const existingSession = chatSessions.find(s => 
        (s.sellerId === admin.id) || 
        (s.sellerName === admin.name)
      )

      if (existingSession) {
        openChatSession(existingSession.id)
      } else {
        const sessionId = await createChatSession(admin.id, admin.name, admin.avatar_url)
        if (sessionId) {
          openChatSession(sessionId)
          
          // Petit délai pour laisser le temps à la session de s'ouvrir avant d'envoyer le message de bienvenue
          setTimeout(() => {
            toast.info("Un conseiller vous répondra dès que possible.", { duration: 5000 })
          }, 1000)
        }
      }
      toast.success("Chat de support ouvert !")
    } catch (error) {
      console.error("Erreur ouverture chat support:", error)
      toast.error("Erreur lors de l'ouverture du chat.")
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  const helpChannels = [
    {
      title: "Chat en ligne",
      description: "Assistance instantanée 24h/24",
      icon: MessageCircle,
      color: "from-green-500 to-emerald-500",
      action: handleOpenChat
    },
    {
      title: "Email",
      description: "Réponse sous 24h",
      icon: Mail,
      color: "from-blue-500 to-cyan-500",
      action: () => setIsSupportModalOpen(true)
    },
    {
      title: "Téléphone",
      description: "Lun-Ven 8h-18h",
      icon: Phone,
      color: "from-orange-500 to-red-500",
      action: () => window.location.href = "tel:+22991505757"
    },
    {
      title: "Vidéo tutoriels",
      description: "Guides visuels",
      icon: Video,
      color: "from-purple-500 to-violet-500",
      action: () => toast.info("Bientôt disponible !")
    }
  ]

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingTicket(true)
    try {
      const { error } = await HelpService.createTicket({
        ...ticketData,
        user_id: user?.id
      })
      if (error) throw error
      toast.success("Votre ticket a été créé avec succès !")
      setIsSupportModalOpen(false)
      setTicketData({
        ...ticketData,
        subject: "",
        message: "",
        department: "general"
      })
    } catch (error) {
      toast.error("Erreur lors de la création du ticket.")
    } finally {
      setIsSubmittingTicket(false)
    }
  }

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-[#ff6600] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Chargement du centre d'aide...</p>
      </div>
    )
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
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#ff6600] h-5 w-5 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:animate-pulse" />
            )}
            <Input
              type="search"
              placeholder="Rechercher dans l'aide..."
              className="pl-12 pr-4 py-4 text-lg border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <Card className="mt-2 shadow-xl border-0 overflow-hidden absolute z-50 w-full max-w-2xl">
              <CardContent className="p-0">
                {searchResults.map((result) => (
                  <div 
                    key={result.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex items-center space-x-3 group"
                    onClick={() => handleOpenArticle(result)}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#ff6600]" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-[#ff6600] transition-colors">{result.title}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Channels */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up animation-delay-800">
          {helpChannels.map((channel, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
              onClick={channel.action}
            >
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
            {categories.map((category, index) => {
              const Icon = ICON_MAP[category.icon] || HelpCircle
              return (
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
                        <Icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{category.name}</CardTitle>
                        <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{category.articles_count} articles</p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Popular Articles or Category Articles */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">
            {activeCategory === 'all' ? "Articles populaires" : `Articles : ${categories.find(c => c.id === activeCategory)?.name}`}
          </h2>
          
          {isLoadingCategory ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#ff6600] animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeCategory === 'all' ? popularArticles : categoryArticles).map((article, index) => (
                <Card 
                  key={article.id} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                  onClick={() => handleOpenArticle(article)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                        <FileText className="h-5 w-5 text-white group-hover:animate-bounce" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2 group-hover:text-[#ff6600] transition-colors duration-300">{article.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[#ff6600] hover:text-[#e55a00] group transition-all duration-300 hover:scale-105"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenArticle(article)
                        }}
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-300">Lire</span>
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:animate-bounce" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {activeCategory !== 'all' && categoryArticles.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Aucun article trouvé dans cette catégorie.
                </div>
              )}
            </div>
          )}
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
        <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-2xl p-8 text-center text-white mb-12">
          <h2 className="text-3xl font-bold mb-4 hover:text-shimmer transition-all duration-300">Besoin d'aide supplémentaire ?</h2>
          <p className="text-xl mb-6 opacity-90 hover:opacity-100 transition-opacity duration-300">
            Notre équipe d'experts est là pour vous aider 24h/24
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
              onClick={handleOpenChat}
            >
              <MessageCircle className="mr-2 h-5 w-5 group-hover:animate-bounce" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Chat en ligne</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <Mail className="mr-2 h-5 w-5 group-hover:animate-bounce" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Envoyer un email</span>
            </Button>
          </div>
        </div>

        {/* Support Modal */}
        <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#ff6600]">Contacter le Support</DialogTitle>
              <DialogDescription>
                Décrivez votre problème et nous vous répondrons dans les plus brefs délais.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitTicket} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom</label>
                  <Input 
                    value={ticketData.name}
                    onChange={(e) => setTicketData({...ticketData, name: e.target.value})}
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email"
                    value={ticketData.email}
                    onChange={(e) => setTicketData({...ticketData, email: e.target.value})}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sujet</label>
                <Input 
                  value={ticketData.subject}
                  onChange={(e) => setTicketData({...ticketData, subject: e.target.value})}
                  placeholder="De quoi s'agit-il ?"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  value={ticketData.message}
                  onChange={(e) => setTicketData({...ticketData, message: e.target.value})}
                  placeholder="Détaillez votre demande..."
                  rows={4}
                  required
                />
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="bg-[#ff6600] hover:bg-[#e55a00] w-full"
                  disabled={isSubmittingTicket}
                >
                  {isSubmittingTicket ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Envoyer la demande
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
 
         {/* Article Modal */}
         <Dialog open={isArticleModalOpen} onOpenChange={setIsArticleModalOpen}>
           <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="text-2xl font-bold text-[#ff6600]">
                 {selectedArticle?.title}
               </DialogTitle>
               <DialogDescription className="flex items-center space-x-4 mt-2">
                 <div className="flex items-center text-sm text-gray-500">
                   <TrendingUp className="h-4 w-4 mr-1" />
                   <span>{selectedArticle?.views} vues</span>
                 </div>
                 <div className="flex items-center text-sm text-gray-500">
                   <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                   <span>{selectedArticle?.rating} / 5</span>
                 </div>
               </DialogDescription>
             </DialogHeader>
             <div className="py-6 prose prose-orange max-w-none">
               {selectedArticle?.content ? (
                 <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
               ) : (
                 <p className="text-gray-600">Contenu en cours de rédaction...</p>
               )}
             </div>
             <DialogFooter className="flex-col sm:flex-row gap-4 border-t pt-4">
               <div className="flex-1 text-sm text-gray-500 italic">
                 Cet article vous a-t-il été utile ?
                 <div className="flex space-x-2 mt-1">
                   <Button variant="outline" size="sm" onClick={() => toast.success("Merci pour votre retour !")}>Oui</Button>
                   <Button variant="outline" size="sm" onClick={() => toast.success("Merci, nous allons l'améliorer.")}>Non</Button>
                 </div>
               </div>
               <Button onClick={() => setIsArticleModalOpen(false)}>Fermer</Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     </div>
   )
 }