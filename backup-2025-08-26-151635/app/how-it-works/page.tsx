"use client"

import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  ShoppingBag, 
  Share2, 
  Coins, 
  MessageCircle, 
  Shield, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Globe, 
  Heart, 
  Star, 
  Award, 
  Gift, 
  Clock, 
  Smartphone,
  CreditCard,
  Lock,
  Eye,
  ShieldCheck,
  Globe2,
  MessageSquare,
  GiftIcon,
  Target,
  Rocket
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
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
            <Sparkles className="h-5 w-5 animate-pulse animate-float" />
            <span className="font-semibold text-lg group-hover:text-shimmer">Probooster</span>
            <Sparkles className="h-5 w-5 animate-pulse animate-float delay-300" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
            Comment ça <span className="text-[#ff6600] animate-pulse">marche</span> ?
          </h1>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto mb-8 animate-fade-in-up animation-delay-400 leading-relaxed hover:text-gray-800 transition-colors duration-300">
            Découvrez le processus simple en 4 étapes pour utiliser notre marketplace révolutionnaire 
            et commencer à gagner des points dès aujourd'hui
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-[#ff6600] to-orange-500 hover:from-[#e55a00] hover:to-orange-600 text-white px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl" 
              asChild
            >
                              <Link href="#steps" className="flex items-center">
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Voir les étapes</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
              asChild
            >
              <Link href="/auth/register" className="flex items-center">
                <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Commencer maintenant</span>
                <TrendingUp className="ml-2 h-5 w-5 group-hover:animate-bounce" />
            </Link>
          </Button>
          </div>
        </div>
      </section>

      {/* Enhanced Steps Section */}
      <section id="steps" className="py-20 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-full mb-6">
              <Rocket className="h-5 w-5 animate-pulse animate-float" />
              <span className="font-semibold text-lg group-hover:text-shimmer">Processus Simple</span>
              <Rocket className="h-5 w-5 animate-pulse animate-float delay-300" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 hover:text-[#ff6600] transition-colors duration-300">
              En <span className="text-[#ff6600] animate-pulse">4 étapes</span> simples
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Rejoignez notre communauté et commencez à gagner dès aujourd'hui
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in-up animation-delay-800">
            {[
              {
                step: "01",
                title: "Inscription",
                description: "Créez votre compte gratuitement en choisissant votre rôle : acheteur ou vendeur. Remplissez vos informations et validez votre email.",
                icon: Users,
                color: "from-blue-500 to-purple-600",
                delay: "0s",
                features: ["Compte gratuit", "Validation email", "Profil personnalisé"]
              },
              {
                step: "02",
                title: "Exploration",
                description: "Parcourez notre catalogue de produits, découvrez les catégories et trouvez ce qui vous intéresse.",
                icon: ShoppingBag,
                color: "from-green-500 to-emerald-600",
                delay: "0.2s",
                features: ["Catalogue riche", "Recherche avancée", "Filtres intelligents"]
              },
              {
                step: "03",
                title: "Partage & Points",
                description: "Partagez vos produits préférés sur les réseaux sociaux et gagnez des points à chaque partage.",
                icon: Share2,
                color: "from-[#ff6600] to-orange-600",
                delay: "0.4s",
                features: ["Points Facebook", "Points WhatsApp", "Points Instagram"]
              },
              {
                step: "04",
                title: "Achat & Retrait",
                description: "Utilisez vos points pour acheter ou convertissez-les en argent réel dès que vous atteignez le seuil.",
                icon: Coins,
                color: "from-purple-500 to-pink-600",
                delay: "0.6s",
                features: ["Achat avec points", "Conversion en F CFA", "Retrait rapide"]
              },
            ].map((item, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer border-0 shadow-lg relative overflow-hidden animate-fade-in-up bg-white"
                style={{ animationDelay: item.delay }}
              >
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 transform translate-x-10 -translate-y-10"></div>
                
                <CardHeader className="text-center pb-6 relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                    <item.icon className="h-10 w-10 text-white group-hover:animate-bounce" />
                  </div>
                  <Badge className="absolute top-4 right-4 bg-gray-900 text-white font-bold text-sm px-3 py-1 group-hover:scale-110 transition-transform duration-300">
                    {item.step}
                  </Badge>
                  <CardTitle className="text-2xl font-bold group-hover:text-[#ff6600] transition-colors duration-300">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <CardDescription className="text-center text-base mb-6 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                    {item.description}
                  </CardDescription>
                  
                  {/* Features List */}
                  <div className="space-y-2">
                    {item.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm group">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 group-hover:animate-bounce" />
                        <span className="text-gray-700 group-hover:text-gray-800 transition-colors duration-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Detail Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-full mb-6">
              <Award className="h-5 w-5 animate-pulse animate-float" />
              <span className="font-semibold text-lg group-hover:text-shimmer">Fonctionnalités Avancées</span>
              <Award className="h-5 w-5 animate-pulse animate-float delay-300" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 hover:text-[#ff6600] transition-colors duration-300">
              Fonctionnalités <span className="text-[#ff6600] animate-pulse">Détaillées</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Tout ce que vous devez savoir sur notre plateforme révolutionnaire
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in-up animation-delay-800">
            {/* Points System */}
            <div className="space-y-8">
              <div className="text-center lg:text-left">
                <h3 className="text-4xl font-bold text-gray-900 mb-6 flex items-center justify-center lg:justify-start hover:text-[#ff6600] transition-colors duration-300">
                  <GiftIcon className="h-8 w-8 text-[#ff6600] mr-3 animate-float" />
                  Système de Points Innovant
                </h3>
                <p className="text-lg text-gray-600 mb-8 hover:text-gray-800 transition-colors duration-300">
                  Gagnez des points en partageant et convertissez-les en argent réel
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Gagnez en partageant</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="group-hover:text-gray-800 transition-colors duration-300">Facebook (+50 pts)</div>
                      <div className="group-hover:text-gray-800 transition-colors duration-300">Twitter (+40 pts)</div>
                      <div className="group-hover:text-gray-800 transition-colors duration-300">WhatsApp (+30 pts)</div>
                      <div className="group-hover:text-gray-800 transition-colors duration-300">Instagram (+45 pts)</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Convertissez en argent</h4>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">1 point = 2 F CFA. Retirez dès 5,000 F CFA atteints</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Achetez avec vos points</h4>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Utilisez vos points directement pour vos achats</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Transférez entre utilisateurs</h4>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Envoyez des points à vos amis et famille</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-2xl p-8 text-white shadow-2xl animate-fade-in-up animation-delay-1000">
              <div className="text-center mb-6">
                <Target className="h-12 w-12 mx-auto mb-4 animate-pulse animate-float" />
                <h4 className="text-3xl font-bold mb-2 hover:text-yellow-300 transition-colors duration-300">Exemple de gains</h4>
                <p className="text-orange-100 hover:text-white transition-colors duration-300">Simulez vos gains potentiels</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg group hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xs font-bold">FB</span>
                    </div>
                  <span className="group-hover:text-yellow-300 transition-colors duration-300">10 partages Facebook</span>
                  </div>
                  <span className="font-bold text-lg group-hover:scale-110 transition-transform duration-300">500 points</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg group hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xs font-bold">WA</span>
                    </div>
                  <span className="group-hover:text-yellow-300 transition-colors duration-300">15 partages WhatsApp</span>
                  </div>
                  <span className="font-bold text-lg group-hover:scale-110 transition-transform duration-300">450 points</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg group hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <span className="text-xs font-bold">IG</span>
                    </div>
                  <span className="group-hover:text-yellow-300 transition-colors duration-300">8 partages Instagram</span>
                  </div>
                  <span className="font-bold text-lg group-hover:scale-110 transition-transform duration-300">360 points</span>
                </div>
                
                <hr className="border-orange-300" />
                
                <div className="flex justify-between items-center p-4 bg-white/20 rounded-lg group hover:bg-white/30 transition-all duration-300">
                  <span className="text-xl font-bold group-hover:text-yellow-300 transition-colors duration-300">Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold group-hover:scale-110 transition-transform duration-300">1,310 points</div>
                    <div className="text-orange-100 group-hover:text-white transition-colors duration-300">= 2,620 F CFA</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Chat System Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in-up animation-delay-1200">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-float">
                  <MessageCircle className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <div>
                  <h4 className="text-3xl font-bold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">Chat en temps réel</h4>
                  <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Communication directe avec les vendeurs</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-gray-100 to-blue-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Vous</div>
                  <div className="text-gray-800">Bonjour, ce produit est-il disponible ?</div>
                </div>
                
                <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 text-white rounded-xl p-4 ml-8 shadow-lg">
                  <div className="text-sm opacity-80 mb-1">Vendeur</div>
                  <div>Oui, il est en stock ! Livraison possible demain. 🚚</div>
                </div>
                
                <div className="bg-gradient-to-r from-gray-100 to-green-50 rounded-xl p-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Vous</div>
                  <div className="text-gray-800">Parfait ! Je le prends 👍</div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
            <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-6 flex items-center hover:text-[#ff6600] transition-colors duration-300">
                  <MessageSquare className="h-8 w-8 text-[#ff6600] mr-3 animate-float" />
                  Communication Directe
                </h3>
                <p className="text-lg text-gray-600 mb-8 hover:text-gray-800 transition-colors duration-300">
                  Communiquez directement avec les vendeurs en temps réel
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Chat instantané</h4>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Discutez directement avec les vendeurs en temps réel</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Messages vocaux</h4>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Envoyez des messages audio pour plus de clarté</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-orange-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Pièces jointes</h4>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Partagez des images et documents (max 90 ko)</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 group hover:shadow-lg transition-all duration-300">
                  <CheckCircle className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0 group-hover:animate-bounce" />
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Historique synchronisé</h4>
                    <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Retrouvez vos conversations partout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Security Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full mb-6">
              <ShieldCheck className="h-5 w-5 animate-pulse animate-float" />
              <span className="font-semibold text-lg group-hover:text-shimmer">Sécurité Maximale</span>
              <ShieldCheck className="h-5 w-5 animate-pulse animate-float delay-300" />
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 hover:text-[#ff6600] transition-colors duration-300">
              Sécurité & <span className="text-[#ff6600] animate-pulse">Confiance</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Votre sécurité est notre priorité absolue. Nous utilisons les technologies les plus avancées
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 animate-fade-in-up animation-delay-800">
            <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg animate-float">
                  <Lock className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <CardTitle className="text-2xl font-bold group-hover:text-[#ff6600] transition-colors duration-300">Authentification 2FA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                  Double authentification pour sécuriser votre compte et vos transactions. 
                  Protection maximale de vos données personnelles.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg animate-float" style={{ animationDelay: '0.2s' }}>
                  <Eye className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <CardTitle className="text-2xl font-bold group-hover:text-[#ff6600] transition-colors duration-300">Chiffrement SSL</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                  Toutes vos données sont chiffrées et protégées par des protocoles de sécurité avancés. 
                  Connexion sécurisée en permanence.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg animate-float" style={{ animationDelay: '0.4s' }}>
                  <Globe2 className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <CardTitle className="text-2xl font-bold group-hover:text-[#ff6600] transition-colors duration-300">Conformité RGPD</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                  Respect total de vos données personnelles selon les normes européennes. 
                  Transparence et contrôle de vos informations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#ff6600] to-orange-500 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6 animate-fade-in-up hover:text-shimmer transition-all duration-300">
            Prêt à <span className="animate-pulse">commencer</span> ?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed hover:text-white transition-colors duration-300">
            Rejoignez des milliers d'utilisateurs qui gagnent déjà des points et révolutionnent leur façon d'acheter. 
            Commencez votre aventure dès aujourd'hui !
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up animation-delay-400">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
              asChild
            >
              <Link href="/auth/register?role=buyer" className="flex items-center">
                <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Devenir Acheteur</span>
                <ShoppingBag className="ml-2 h-5 w-5 group-hover:animate-bounce" />
              </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl bg-transparent"
              asChild
            >
              <Link href="/auth/register?role=seller" className="flex items-center">
                <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Devenir Vendeur</span>
                <Star className="ml-2 h-5 w-5 group-hover:animate-bounce" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
