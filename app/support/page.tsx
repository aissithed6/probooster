"use client"

import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  Search, 
  HelpCircle, 
  FileText, 
  Shield, 
  CreditCard, 
  ShoppingBag, 
  Coins, 
  Users, 
  Settings, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Star, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Headphones,
  LifeBuoy,
  BookOpen,
  Video,
  Download,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useMoney } from "@/lib/hooks/use-money"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useChatContext } from "@/lib/chat-context-supabase"
import { ChatService } from "@/lib/services/chat-service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "react-hot-toast"
import { useState } from "react"

export default function SupportPage() {
  const { currencyCode } = useMoney()
  const { user } = useAuth()
  const { createChatSession, openChatSession, chatSessions, setIsAnyChatOpen } = useChatContext()
  const [isLoadingChat, setIsLoadingChat] = useState(false)

  /**
   * Ouvre le chat de support avec l'administrateur système.
   * Crée une nouvelle session si nécessaire, sinon réouvre la session existante.
   */
  const handleOpenChat = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour accéder au chat.")
      return
    }

    setIsLoadingChat(true)
    const loadingToast = toast.loading("Ouverture du chat de support...")
    try {
      // Ouvrir d'abord l'UI du chat pour afficher le modal
      setIsAnyChatOpen(true)
      
      const admin = await ChatService.getSystemAdmin(user.id)
      if (!admin) {
        toast.error("Le système de chat est en cours de maintenance. Veuillez nous contacter par email.")
        return
      }

      // Vérifier si une session existe déjà avec cet admin
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
          
          // Petit délai pour laisser le temps à la session de s'ouvrir
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
      setIsLoadingChat(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">

      {/* Enhanced Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-red-200 rounded-full opacity-20 animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
            <Headphones className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">Support Probooster</span>
            <Headphones className="h-5 w-5 animate-pulse delay-300" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up animation-delay-200">
            Nous sommes là pour <span className="text-[#ff6600] animate-pulse">vous aider</span>
          </h1>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto mb-8 animate-fade-in-up animation-delay-400 leading-relaxed">
            Notre équipe de support est disponible 24h/24 et 7j/7 pour répondre à toutes vos questions 
            et vous accompagner dans votre expérience Probooster
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
            <Button 
              size="lg" 
              className="bg-[#ff6600] hover:bg-[#e55a00] text-white px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl" 
              asChild
            >
              <Link href="#contact" className="flex items-center">
                <span className="relative z-10">Contacter le support</span>
                <MessageCircle className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
              asChild
            >
              <Link href="#faq" className="flex items-center">
                <span className="relative z-10">FAQ</span>
                <HelpCircle className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Methods Section */}
      <section id="contact" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6">
              <MessageSquare className="h-5 w-5 animate-pulse" />
              <span className="font-semibold text-lg">Moyens de Contact</span>
              <MessageSquare className="h-5 w-5 animate-pulse delay-300" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Contactez-nous <span className="text-[#ff6600] animate-pulse">facilement</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez le moyen qui vous convient le mieux pour nous contacter
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 animate-fade-in-up animation-delay-800">
            {[
              {
                title: "Chat en Direct",
                description: "Discutez avec nos experts en temps réel",
                icon: MessageCircle,
                color: "from-[#ff6600] to-orange-500",
                time: "Réponse instantanée",
                action: "Démarrer le chat",
                href: "#chat"
              },
              {
                title: "Téléphone",
                description: "Appelez-nous pour un support vocal",
                icon: Phone,
                color: "from-green-500 to-emerald-600",
                time: "24h/24, 7j/7",
                action: "Appeler maintenant",
                href: "tel:+22991505757"
              },
              {
                title: "Email",
                description: "Envoyez-nous un message détaillé",
                icon: Mail,
                color: "from-blue-500 to-purple-600",
                time: "Réponse sous 2h",
                action: "Envoyer un email",
                href: "mailto:support@probooster.online"
              }
            ].map((method, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer border-0 shadow-lg relative overflow-hidden animate-fade-in-up bg-white"
                style={{ animationDelay: `${(index + 1) * 0.2}s` }}
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform translate-x-10 -translate-y-10"></div>
                
                <CardHeader className="text-center pb-6 relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-r ${method.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <method.icon className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold group-hover:text-blue-600 transition-colors duration-300">
                    {method.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <CardDescription className="text-center text-base mb-6 leading-relaxed">
                    {method.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-center space-x-2 mb-6">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{method.time}</span>
                  </div>
                  
                  <Button 
                    className={`w-full bg-gradient-to-r ${method.color} hover:from-[#e55a00] hover:to-orange-600 text-white group-hover:scale-105 transition-all duration-300`}
                    onClick={method.title === "Chat en Direct" ? handleOpenChat : undefined}
                    asChild={method.title !== "Chat en Direct"}
                  >
                    {method.title === "Chat en Direct" ? (
                      <span className="flex items-center justify-center">
                        <span>{isLoadingChat ? "Ouverture..." : method.action}</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    ) : (
                      <Link href={method.href} className="flex items-center justify-center">
                        <span>{method.action}</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6">
              <HelpCircle className="h-5 w-5 animate-pulse" />
              <span className="font-semibold text-lg">Questions Fréquentes</span>
              <HelpCircle className="h-5 w-5 animate-pulse delay-300" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              FAQ <span className="text-[#ff6600] animate-pulse">Probooster</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trouvez rapidement les réponses à vos questions les plus courantes
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 animate-fade-in-up animation-delay-800">
            <div className="space-y-6">
              {[
                {
                  category: "Compte & Inscription",
                  icon: Users,
                  color: "from-[#ff6600] to-orange-500",
                  questions: [
                    {
                      q: "Comment créer mon compte Probooster ?",
                      a: "Cliquez sur 'S'inscrire' en haut à droite, choisissez votre rôle (acheteur ou vendeur), remplissez vos informations et validez votre email."
                    },
                    {
                      q: "Comment récupérer mon mot de passe ?",
                      a: "Utilisez l'option 'Mot de passe oublié' sur la page de connexion. Un lien de réinitialisation vous sera envoyé par email."
                    },
                    {
                      q: "Comment modifier mes informations personnelles ?",
                      a: "Allez dans 'Mon Profil' depuis votre tableau de bord et cliquez sur 'Modifier' pour mettre à jour vos informations."
                    }
                  ]
                },
                {
                  category: "Points & Gains",
                  icon: Coins,
                  color: "from-green-500 to-emerald-600",
                  questions: [
                    {
                      q: "Comment gagner des points ?",
                      a: "Partagez des produits sur les réseaux sociaux : Facebook (+50 pts), WhatsApp (+30 pts), Instagram (+45 pts), Twitter (+40 pts)."
                    },
                    {
                      q: "Comment convertir mes points en argent ?",
                      a: `1 point = 2 ${currencyCode}. Retirez dès 5,000 ${currencyCode} atteints via votre tableau de bord dans la section 'Mes Points'.`
                    },
                    {
                      q: "Les points expirent-ils ?",
                      a: "Non, vos points n'expirent jamais. Vous pouvez les utiliser ou les convertir à tout moment."
                    }
                  ]
                }
              ].map((category, catIndex) => (
                <Card key={catIndex} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center`}>
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold">{category.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.questions.map((item, qIndex) => (
                        <div key={qIndex} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              {[
                {
                  category: "Achats & Paiements",
                  icon: CreditCard,
                  color: "from-blue-500 to-purple-600",
                  questions: [
                    {
                      q: "Quels moyens de paiement acceptez-vous ?",
                      a: "Nous acceptons les cartes bancaires, Mobile Money, Orange Money, MTN Money et paiement par points Probooster."
                    },
                    {
                      q: "Comment suivre ma commande ?",
                      a: "Consultez 'Mes Commandes' dans votre tableau de bord. Vous recevrez aussi des notifications par email et SMS."
                    },
                    {
                      q: "Quelle est la politique de remboursement ?",
                      a: "Remboursement sous 14 jours si le produit ne correspond pas à la description. Contactez notre support pour initier la procédure."
                    }
                  ]
                },
                {
                  category: "Sécurité & Confidentialité",
                  icon: Shield,
                  color: "from-green-500 to-emerald-600",
                  questions: [
                    {
                      q: "Mes données sont-elles sécurisées ?",
                      a: "Oui, nous utilisons un chiffrement SSL avancé et respectons le RGPD. Vos données sont protégées et ne sont jamais partagées."
                    },
                    {
                      q: "Comment activer l'authentification 2FA ?",
                      a: "Allez dans 'Sécurité' de votre profil et suivez les instructions pour configurer l'authentification à deux facteurs."
                    },
                    {
                      q: "Que faire en cas de compte piraté ?",
                      a: "Contactez immédiatement notre support. Nous bloquerons votre compte et vous aiderons à le récupérer en toute sécurité."
                    }
                  ]
                }
              ].map((category, catIndex) => (
                <Card key={catIndex} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-full flex items-center justify-center`}>
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold">{category.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.questions.map((item, qIndex) => (
                        <div key={qIndex} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
                          <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6">
                <MessageSquare className="h-5 w-5 animate-pulse" />
                <span className="font-semibold text-lg">Formulaire de Contact</span>
                <MessageSquare className="h-5 w-5 animate-pulse delay-300" />
              </div>
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Envoyez-nous un <span className="text-[#ff6600] animate-pulse">message</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Remplissez ce formulaire et nous vous répondrons dans les plus brefs délais
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 animate-fade-in-up animation-delay-800">
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                    <LifeBuoy className="h-8 w-8 text-[#ff6600] mr-3" />
                    Informations de Contact
                  </h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Notre équipe est disponible pour vous aider avec toutes vos questions
                  </p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Phone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-2">Téléphone</h4>
                      <Link href="tel:+22991505757" className="text-gray-600 hover:text-[#ff6600] transition-colors duration-300">
                        +229 91 50 57 57
                      </Link>
                      <p className="text-sm text-gray-500">24h/24, 7j/7</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-2">Email</h4>
                      <Link href="mailto:support@probooster.online" className="text-gray-600 hover:text-blue-600 transition-colors duration-300">
                        support@probooster.online
                      </Link>
                      <p className="text-sm text-gray-500">Réponse sous 2h</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900 mb-2">Site Web</h4>
                      <Link href="https://probooster.online" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-green-600 transition-colors duration-300">
                        https://probooster.online
                      </Link>
                      <p className="text-sm text-gray-500">Support 24h/24</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <Input placeholder="Votre prénom" className="border-gray-300 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <Input placeholder="Votre nom" className="border-gray-300 focus:border-blue-500" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <Input type="email" placeholder="votre@email.com" className="border-gray-300 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                    <Input placeholder="+229 91 50 57 57" className="border-gray-300 focus:border-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                    <Select>
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Choisissez un sujet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Problème de compte</SelectItem>
                        <SelectItem value="payment">Problème de paiement</SelectItem>
                        <SelectItem value="points">Questions sur les points</SelectItem>
                        <SelectItem value="technical">Problème technique</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <Textarea 
                      placeholder="Décrivez votre problème ou question en détail..." 
                      className="border-gray-300 focus:border-blue-500 min-h-[120px]"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#ff6600] hover:bg-[#e55a00] text-white py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <span className="relative z-10">Envoyer le message</span>
                    <MessageCircle className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6">
              <BookOpen className="h-5 w-5 animate-pulse" />
              <span className="font-semibold text-lg">Ressources Utiles</span>
              <BookOpen className="h-5 w-5 animate-pulse delay-300" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Centre de <span className="text-[#ff6600] animate-pulse">Ressources</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Accédez à nos guides, tutoriels et documentations pour une meilleure expérience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in-up animation-delay-800">
            {[
              {
                title: "Guide Utilisateur",
                description: "Tutoriel complet pour utiliser Probooster",
                icon: BookOpen,
                color: "from-[#ff6600] to-orange-500",
                action: "Consulter",
                href: "#"
              },
              {
                title: "Vidéos Tutoriels",
                description: "Apprenez avec nos vidéos explicatives",
                icon: Video,
                color: "from-blue-500 to-purple-600",
                action: "Regarder",
                href: "#"
              },
              {
                title: "Documentation API",
                description: "Documentation technique pour développeurs",
                icon: FileText,
                color: "from-green-500 to-emerald-600",
                action: "Lire",
                href: "#"
              },
              {
                title: "Téléchargements",
                description: "Applications mobiles et outils",
                icon: Download,
                color: "from-red-500 to-pink-600",
                action: "Télécharger",
                href: "#"
              }
            ].map((resource, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer border-0 shadow-lg relative overflow-hidden animate-fade-in-up bg-white"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${resource.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <CardHeader className="text-center pb-6 relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-r ${resource.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <resource.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors duration-300">
                    {resource.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <CardDescription className="text-center text-base mb-6 leading-relaxed">
                    {resource.description}
                  </CardDescription>
                  
                  <Button 
                    variant="outline"
                    className="w-full border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white group-hover:scale-105 transition-all duration-300"
                    asChild
                  >
                    <Link href={resource.href} className="flex items-center justify-center">
                      <span>{resource.action}</span>
                      <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

            {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#ff6600] to-orange-500 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6 animate-fade-in-up">
            Besoin d'aide <span className="animate-pulse">immédiate</span> ?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
            Notre équipe de support est disponible 24h/24 et 7j/7 pour vous accompagner 
            dans toutes vos démarches sur Probooster
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up animation-delay-400">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={handleOpenChat}
              disabled={isLoadingChat}
            >
              <span className="relative z-10 flex items-center">
                {isLoadingChat ? "Ouverture..." : "Chat en direct"}
                <MessageCircle className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              </span>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl bg-transparent"
              asChild
            >
              <Link href="tel:+22991505757" className="flex items-center">
                <span className="relative z-10">Appeler maintenant</span>
                <Phone className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
} 