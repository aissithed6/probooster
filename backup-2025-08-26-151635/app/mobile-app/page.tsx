"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  TrendingUp, 
  Gift, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Target, 
  Zap, 
  Users, 
  Share2, 
  ShoppingBag, 
  Rocket,
  Globe,
  Award,
  BarChart3,
  Headphones,
  CreditCard,
  Truck,
  Package,
  Settings,
  Monitor,
  Wifi,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Play,
  Download,
  BookOpen,
  Video,
  FileText,
  DollarSign,
  Wallet,
  PiggyBank,
  Banknote,
  Calculator,
  PieChart,
  Activity,
  Crown,
  Medal,
  Heart,
  ThumbsUp,
  MessageCircle,
  Bell,
  Eye,
  EyeOff,
  QrCode,
  Shield,
  Lock,
  Battery,
  Camera,
  Fingerprint,
  Bluetooth,
  Cloud,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  Signal,
  Compass,
  Thermometer
} from "lucide-react"

export default function MobileAppPage() {
  const [activeFeature, setActiveFeature] = useState("shopping")
  const [downloadStep, setDownloadStep] = useState(1)

  const features = [
    {
      id: "shopping",
      icon: ShoppingBag,
      title: "Shopping Mobile",
      description: "Achetez en toute simplicité avec notre interface optimisée",
      color: "from-green-500 to-emerald-500",
      details: [
        "Navigation intuitive",
        "Recherche avancée",
        "Filtres intelligents",
        "Comparaison de prix"
      ]
    },
    {
      id: "points",
      icon: Gift,
      title: "Système de Points",
      description: "Gagnez et gérez vos points directement depuis l'app",
      color: "from-yellow-500 to-orange-500",
      details: [
        "Suivi en temps réel",
        "Historique des gains",
        "Échange de points",
        "Niveaux et récompenses"
      ]
    },
    {
      id: "social",
      icon: Share2,
      title: "Partage Social",
      description: "Partagez vos découvertes et gagnez des points",
      color: "from-blue-500 to-cyan-500",
      details: [
        "Partage en un clic",
        "Réseaux sociaux intégrés",
        "Points de partage",
        "Viralité automatique"
      ]
    },
    {
      id: "chat",
      icon: MessageCircle,
      title: "Chat Intégré",
      description: "Communiquez directement avec les vendeurs",
      color: "from-purple-500 to-violet-500",
      details: [
        "Chat en temps réel",
        "Notifications push",
        "Historique des conversations",
        "Support multilingue"
      ]
    }
  ]

  const appStats = [
    { icon: Download, value: "100K+", label: "Téléchargements", color: "text-blue-500" },
    { icon: Star, value: "4.8", label: "Note moyenne", color: "text-yellow-500" },
    { icon: Users, value: "50K+", label: "Utilisateurs actifs", color: "text-green-500" },
    { icon: Award, value: "99%", label: "Satisfaction", color: "text-purple-500" }
  ]

  const screenshots = [
    {
      title: "Page d'accueil",
      description: "Interface moderne et intuitive",
      image: "/placeholder.svg",
      features: ["Navigation fluide", "Design responsive", "Chargement rapide"]
    },
    {
      title: "Catalogue produits",
      description: "Découvrez des milliers de produits",
      image: "/placeholder.svg",
      features: ["Filtres avancés", "Recherche intelligente", "Comparaison facile"]
    },
    {
      title: "Panier & Paiement",
      description: "Paiement sécurisé en quelques clics",
      image: "/placeholder.svg",
      features: ["Paiement sécurisé", "Méthodes multiples", "Confirmation instantanée"]
    },
    {
      title: "Profil utilisateur",
      description: "Gérez votre compte et vos points",
      image: "/placeholder.svg",
      features: ["Gestion des points", "Historique complet", "Paramètres personnalisés"]
    }
  ]

  const benefits = [
    {
      icon: Zap,
      title: "Performance Optimale",
      description: "Application ultra-rapide avec chargement instantané",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Sécurité Maximale",
      description: "Protection des données et transactions sécurisées",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Wifi,
      title: "Hors-ligne Disponible",
      description: "Fonctionnalités disponibles même sans connexion",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Bell,
      title: "Notifications Intelligentes",
      description: "Restez informé des meilleures offres",
      color: "from-purple-500 to-violet-500"
    }
  ]

  const systemRequirements = [
    {
      platform: "iOS",
      version: "iOS 12.0+",
      storage: "50 MB",
      features: ["iPhone 6s+", "iPad Air 2+", "iPod Touch 7+"]
    },
    {
      platform: "Android",
      version: "Android 6.0+",
      storage: "45 MB",
      features: ["API Level 23+", "RAM 2GB+", "Écran 4.7+"]
    }
  ]

  const handleDownload = (platform: string) => {
    setDownloadStep(2)
    // Simulation du téléchargement
    setTimeout(() => setDownloadStep(3), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#ff6600] via-orange-500 to-[#ff8533]">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-white/10 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
                <Smartphone className="h-5 w-5 animate-pulse animate-float" />
                <span className="font-semibold group-hover:text-shimmer">APPLICATION MOBILE</span>
                <Sparkles className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
                Probooster dans votre <span className="text-yellow-300 animate-pulse">Poche</span>
              </h1>
              
              <p className="text-xl text-white/90 mb-8 leading-relaxed animate-fade-in-up animation-delay-400 hover:text-white transition-colors duration-300">
                Téléchargez notre application mobile et accédez à toutes les fonctionnalités 
                de Probooster où que vous soyez. Shopping, points, partage social, tout en un !
              </p>

              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-600">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                  onClick={() => handleDownload('ios')}
                >
                  <svg className="h-6 w-6 mr-2 group-hover:animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">App Store</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  onClick={() => handleDownload('android')}
                >
                  <svg className="h-6 w-6 mr-2 group-hover:animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Google Play</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Button>
              </div>
            </div>

            <div className="relative animate-fade-in-up animation-delay-800">
              <div className="relative">
                <div className="w-80 h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-4 mx-auto shadow-2xl">
                  <div className="w-full h-full bg-gradient-to-br from-[#ff6600] to-orange-500 rounded-2xl flex items-center justify-center group">
                    <div className="text-center text-white">
                      <Smartphone className="h-16 w-16 mx-auto mb-4 animate-bounce group-hover:animate-pulse" />
                      <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-300 transition-colors duration-300">Probooster</h3>
                      <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">Shopping & Points</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 -right-8 w-4 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Stats */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {appStats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <stat.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2 animate-count-up group-hover:text-[#ff6600] transition-colors duration-300">{stat.value}</div>
                <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Fonctionnalités Principales</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez toutes les fonctionnalités disponibles dans notre application mobile
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <Card 
                  key={feature.id}
                  className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group ${
                    activeFeature === feature.id ? 'ring-2 ring-[#ff6600]' : ''
                  }`}
                  onClick={() => setActiveFeature(feature.id)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                        <feature.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                      </div>
                      <div>
                        <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{feature.title}</CardTitle>
                        <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{feature.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  {activeFeature === feature.id && (
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center space-x-2 group">
                            <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                            <span className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="relative">
              <div className="w-80 h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-4 mx-auto shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-[#ff6600] to-orange-500 rounded-2xl flex items-center justify-center group">
                  <div className="text-center text-white">
                    {activeFeature === "shopping" && (
                      <>
                        <ShoppingBag className="h-16 w-16 mx-auto mb-4 animate-bounce group-hover:animate-pulse" />
                        <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-300 transition-colors duration-300">Shopping Mobile</h3>
                        <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">Achetez en toute simplicité</p>
                      </>
                    )}
                    {activeFeature === "points" && (
                      <>
                        <Gift className="h-16 w-16 mx-auto mb-4 animate-pulse group-hover:animate-bounce" />
                        <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-300 transition-colors duration-300">Système de Points</h3>
                        <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">Gagnez et gérez vos points</p>
                      </>
                    )}
                    {activeFeature === "social" && (
                      <>
                        <Share2 className="h-16 w-16 mx-auto mb-4 animate-spin group-hover:animate-pulse" />
                        <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-300 transition-colors duration-300">Partage Social</h3>
                        <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">Partagez et gagnez</p>
                      </>
                    )}
                    {activeFeature === "chat" && (
                      <>
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 animate-bounce group-hover:animate-pulse" />
                        <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-300 transition-colors duration-300">Chat Intégré</h3>
                        <p className="text-sm opacity-90 group-hover:opacity-100 transition-opacity duration-300">Communiquez en temps réel</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Aperçu de l'Application</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez l'interface intuitive et moderne de notre application mobile
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {screenshots.map((screenshot, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <CardHeader>
                  <div className="w-64 h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-2 mx-auto">
                    <div className="w-full h-full bg-gradient-to-br from-[#ff6600] to-orange-500 rounded-xl flex items-center justify-center group">
                      <div className="text-center text-white">
                        <Smartphone className="h-12 w-12 mx-auto mb-2 group-hover:animate-bounce" />
                        <h4 className="text-sm font-bold group-hover:text-yellow-300 transition-colors duration-300">{screenshot.title}</h4>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-4 group-hover:text-[#ff6600] transition-colors duration-300">{screenshot.title}</CardTitle>
                  <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{screenshot.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {screenshot.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2 group">
                        <CheckCircle className="h-3 w-3 text-green-500 group-hover:animate-bounce" />
                        <span className="text-gray-600 text-xs group-hover:text-gray-800 transition-colors duration-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Avantages de l'App Mobile</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Pourquoi choisir l'application mobile Probooster ?
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-r ${benefit.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-125 transition-all duration-500 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                    <benefit.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Configuration Requise</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Vérifiez que votre appareil est compatible avec notre application
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {systemRequirements.map((system, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                      <Smartphone className="h-6 w-6 text-white group-hover:animate-bounce" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{system.platform}</CardTitle>
                      <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{system.version}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stockage requis:</span>
                      <span className="font-semibold">{system.storage}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Appareils compatibles:</h4>
                      <ul className="space-y-1">
                        {system.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center space-x-2 group">
                            <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                            <span className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-20 bg-gradient-to-r from-[#ff6600] to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 hover:text-shimmer transition-all duration-300">Téléchargez Maintenant</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto hover:text-white transition-colors duration-300">
            Rejoignez des milliers d'utilisateurs qui utilisent déjà l'application mobile Probooster
          </p>
          
          {downloadStep === 1 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
                onClick={() => handleDownload('ios')}
              >
                <svg className="h-6 w-6 mr-2 group-hover:animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"/>
                </svg>
                <span className="group-hover:translate-x-1 transition-transform duration-300">Télécharger sur App Store</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
                onClick={() => handleDownload('android')}
              >
                <svg className="h-6 w-6 mr-2 group-hover:animate-bounce" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <span className="group-hover:translate-x-1 transition-transform duration-300">Télécharger sur Google Play</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
              </Button>
            </div>
          )}

          {downloadStep === 2 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Download className="h-8 w-8 text-[#ff6600]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Téléchargement en cours...</h3>
                <p className="text-white/80">Veuillez patienter pendant le téléchargement</p>
              </div>
            </div>
          )}

          {downloadStep === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Téléchargement Réussi !</h3>
                <p className="text-white/80">L'application a été téléchargée avec succès</p>
              </div>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#ff6600]"
                onClick={() => setDownloadStep(1)}
              >
                Télécharger une autre version
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* QR Code Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 hover:text-[#ff6600] transition-colors duration-300">Scannez pour Télécharger</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Utilisez votre appareil pour scanner le QR code et télécharger l'application
            </p>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="w-48 h-48 bg-gradient-to-br from-[#ff6600] to-orange-500 rounded-2xl p-4 mx-auto flex items-center justify-center group">
                  <QrCode className="h-32 w-32 text-white group-hover:animate-pulse" />
                </div>
                <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Scannez avec votre appareil photo</p>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">Instructions</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center space-x-3 group">
                    <div className="w-6 h-6 bg-[#ff6600] rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:animate-bounce">1</div>
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Ouvrez l'appareil photo de votre téléphone</span>
                  </li>
                  <li className="flex items-center space-x-3 group">
                    <div className="w-6 h-6 bg-[#ff6600] rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:animate-bounce">2</div>
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Pointez vers le QR code ci-dessus</span>
                  </li>
                  <li className="flex items-center space-x-3 group">
                    <div className="w-6 h-6 bg-[#ff6600] rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:animate-bounce">3</div>
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Suivez le lien pour télécharger l'app</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 