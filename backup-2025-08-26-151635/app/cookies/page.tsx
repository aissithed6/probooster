"use client"
import { useState } from "react"
import { Cookie, Shield, Settings, Eye, CheckCircle, AlertTriangle, Info, ArrowRight, Users, Clock, Calendar, Star, Zap, Heart, ShoppingBag, Gift, Sparkles, BarChart3, Target, Lock, Database, Mail, Phone, MapPin, MessageCircle, Download, ExternalLink, X, Copy, Globe as GlobeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function CookiesPage() {
  const [activeSection, setActiveSection] = useState("types")
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false
  })

  const sections = [
    { id: "types", title: "Types de cookies", icon: Cookie },
    { id: "gestion", title: "Gestion", icon: Settings },
    { id: "preferences", title: "Préférences", icon: Eye },
    { id: "securite", title: "Sécurité", icon: Shield },
    { id: "duree", title: "Durée de vie", icon: Clock },
    { id: "tiers", title: "Tiers", icon: Users },
  ]

  const cookieTypes = [
    { 
      type: "Cookies essentiels", 
      description: "Nécessaires au fonctionnement du site", 
      examples: ["Session utilisateur", "Panier d'achat", "Authentification"],
      icon: CheckCircle,
      color: "green",
      required: true
    },
    { 
      type: "Cookies analytiques", 
      description: "Analyse du trafic et amélioration des performances", 
      examples: ["Google Analytics", "Statistiques de visite", "Comportement utilisateur"],
      icon: BarChart3,
      color: "blue",
      required: false
    },
    { 
      type: "Cookies marketing", 
      description: "Personnalisation des publicités et recommandations", 
      examples: ["Publicités ciblées", "Recommandations produits", "Campagnes marketing"],
      icon: Target,
      color: "purple",
      required: false
    },
    { 
      type: "Cookies de préférences", 
      description: "Mémorisation de vos choix et paramètres", 
      examples: ["Langue préférée", "Thème d'affichage", "Paramètres régionaux"],
      icon: Settings,
      color: "orange",
      required: false
    },
  ]

  const cookieDuration = [
    { duration: "Session", description: "Supprimés à la fermeture du navigateur", icon: Clock },
    { duration: "Persistants", description: "Restent actifs jusqu'à expiration", icon: Calendar },
    { duration: "Tiers", description: "Gérés par nos partenaires", icon: Users },
  ]

  const handleCookieToggle = (type: string) => {
    if (type === 'essential') return // Les cookies essentiels ne peuvent pas être désactivés
    
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type as keyof typeof prev]
    }))
  }

  const handleSavePreferences = () => {
    // Simulation de sauvegarde des préférences
    console.log('Préférences sauvegardées:', cookiePreferences)
    // Ici vous pouvez ajouter la logique pour sauvegarder les préférences
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#535455] via-gray-800 to-[#ff6600] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                <Cookie className="h-12 w-12 text-[#ff6600] animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
              Politique des Cookies
            </h1>
            <p className="text-xl text-gray-200 mb-8 animate-fade-in-up animation-delay-200">
              Comprendre et contrôler l'utilisation des cookies sur notre plateforme
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-400">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Shield className="h-4 w-4 mr-2" />
                Transparence totale
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Settings className="h-4 w-4 mr-2" />
                Contrôle utilisateur
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Eye className="h-4 w-4 mr-2" />
                Gestion simple
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 animate-bounce">
          <Sparkles className="h-8 w-8 text-[#ff6600]/30" />
        </div>
        <div className="absolute top-20 right-20 animate-pulse">
          <Cookie className="h-6 w-6 text-white/20" />
        </div>
        <div className="absolute bottom-10 left-1/4 animate-ping">
          <Settings className="h-4 w-4 text-[#ff6600]/40" />
        </div>
      </section>

      {/* Navigation Sections */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-300 ${
                  activeSection === section.id 
                    ? "bg-[#ff6600] text-white shadow-lg scale-105" 
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{section.title}</span>
              </Button>
            ))}
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Types de cookies */}
            {activeSection === "types" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Types de Cookies</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Découvrez les différents types de cookies utilisés sur notre plateforme et leur utilité.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {cookieTypes.map((cookieType, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              cookieType.color === 'green' ? 'bg-green-100' :
                              cookieType.color === 'blue' ? 'bg-blue-100' :
                              cookieType.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                            }`}>
                              <cookieType.icon className={`h-6 w-6 ${
                                cookieType.color === 'green' ? 'text-green-600' :
                                cookieType.color === 'blue' ? 'text-blue-600' :
                                cookieType.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                              }`} />
                            </div>
                            <div>
                              <CardTitle className="text-xl">{cookieType.type}</CardTitle>
                              {cookieType.required && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                  Obligatoire
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{cookieType.description}</p>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Exemples :</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {cookieType.examples.map((example, idx) => (
                              <li key={idx} className="flex items-center space-x-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                <span>{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Gestion */}
            {activeSection === "gestion" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Gestion des Cookies</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Apprenez à contrôler et gérer vos préférences de cookies.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>Paramètres navigateur</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Configurez les paramètres de cookies dans votre navigateur.</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Chrome : Paramètres &gt; Confidentialité et sécurité</p>
                        <p>• Firefox : Options &gt; Confidentialité et sécurité</p>
                        <p>• Safari : Préférences &gt; Confidentialité</p>
                        <p>• Edge : Paramètres &gt; Cookies et permissions</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Eye className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Bannière de consentement</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Choisissez vos préférences lors de votre première visite.</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Acceptez tous les cookies</p>
                        <p>• Refusez les cookies non essentiels</p>
                        <p>• Personnalisez vos choix</p>
                        <p>• Modifiez vos préférences à tout moment</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <RefreshCw className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle>Mise à jour des préférences</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Modifiez vos choix à tout moment depuis cette page.</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Accédez à la section Préférences</p>
                        <p>• Activez/désactivez les cookies</p>
                        <p>• Sauvegardez vos choix</p>
                        <p>• Consultez l'historique des modifications</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Shield className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle>Suppression des cookies</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Supprimez les cookies existants de votre navigateur.</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>• Suppression manuelle via le navigateur</p>
                        <p>• Suppression automatique à la fermeture</p>
                        <p>• Suppression sélective par type</p>
                        <p>• Réinitialisation complète des préférences</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Préférences */}
            {activeSection === "preferences" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Vos Préférences de Cookies</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Personnalisez vos préférences de cookies selon vos besoins.
                  </p>
                </div>
                
                <div className="max-w-2xl mx-auto">
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-xl">Gestion des Préférences</CardTitle>
                      <CardDescription>
                        Activez ou désactivez les différents types de cookies selon vos préférences.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {Object.entries(cookiePreferences).map(([key, value]) => {
                        const cookieType = cookieTypes.find(ct => ct.type.toLowerCase().includes(key)) || cookieTypes[0]
                        const isEssential = key === 'essential'
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-lg ${
                                cookieType.color === 'green' ? 'bg-green-100' :
                                cookieType.color === 'blue' ? 'bg-blue-100' :
                                cookieType.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                              }`}>
                                <cookieType.icon className={`h-5 w-5 ${
                                  cookieType.color === 'green' ? 'text-green-600' :
                                  cookieType.color === 'blue' ? 'text-blue-600' :
                                  cookieType.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                                }`} />
                              </div>
                              <div>
                                <Label className="text-base font-medium">
                                  {key === 'essential' ? 'Cookies essentiels' :
                                   key === 'analytics' ? 'Cookies analytiques' :
                                   key === 'marketing' ? 'Cookies marketing' : 'Cookies de préférences'}
                                </Label>
                                <p className="text-sm text-gray-600">
                                  {cookieType.description}
                                </p>
                                {isEssential && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs mt-1">
                                    Obligatoire
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Switch
                              checked={value}
                              onCheckedChange={() => handleCookieToggle(key)}
                              disabled={isEssential}
                              className={isEssential ? 'opacity-50' : ''}
                            />
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-center space-x-4">
                    <Button onClick={handleSavePreferences} className="bg-[#ff6600] hover:bg-[#e55a00]">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Sauvegarder les préférences
                    </Button>
                    <Button variant="outline" onClick={() => setCookiePreferences({
                      essential: true,
                      analytics: false,
                      marketing: false,
                      preferences: false
                    })}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sécurité */}
            {activeSection === "securite" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Sécurité des Cookies</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Nous mettons en place des mesures de sécurité pour protéger vos données.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Lock className="h-6 w-6 text-green-600" />
                        <CardTitle className="text-green-800">Chiffrement</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700">Tous nos cookies sont transmis via des connexions HTTPS sécurisées.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-6 w-6 text-blue-600" />
                        <CardTitle className="text-blue-800">Protection</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-700">Protection contre les attaques XSS et CSRF sur tous nos cookies.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Eye className="h-6 w-6 text-purple-600" />
                        <CardTitle className="text-purple-800">Transparence</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-700">Informations détaillées sur l'utilisation de chaque cookie.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Clock className="h-6 w-6 text-orange-600" />
                        <CardTitle className="text-orange-800">Expiration</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700">Durée de vie limitée pour tous les cookies non essentiels.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Durée de vie */}
            {activeSection === "duree" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Durée de Vie des Cookies</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Comprendre la durée de conservation des différents types de cookies.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {cookieDuration.map((duration, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#ff6600]/10 rounded-lg">
                            <duration.icon className="h-6 w-6 text-[#ff6600]" />
                          </div>
                          <CardTitle className="text-xl">{duration.duration}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{duration.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Informations importantes</h3>
                      <p className="text-blue-800">
                        La durée de vie des cookies peut varier selon votre navigateur et vos paramètres. 
                        Certains cookies peuvent être conservés plus longtemps si vous ne videz pas régulièrement 
                        le cache de votre navigateur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tiers */}
            {activeSection === "tiers" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Cookies de Tiers</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Informations sur les cookies déposés par nos partenaires et prestataires de services.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>Google Analytics</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Analyse du trafic et des performances du site.</p>
                      <div className="text-sm text-gray-600">
                        <p>• _ga (2 ans)</p>
                        <p>• _gid (24h)</p>
                        <p>• _gat (1 minute)</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Publicité</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Cookies pour la publicité personnalisée.</p>
                      <div className="text-sm text-gray-600">
                        <p>• Facebook Pixel</p>
                        <p>• Google Ads</p>
                        <p>• Partenaires publicitaires</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MessageCircle className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle>Support client</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Outils de support et de chat en ligne.</p>
                      <div className="text-sm text-gray-600">
                        <p>• Zendesk</p>
                        <p>• Intercom</p>
                        <p>• LiveChat</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Shield className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle>Sécurité</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Protection contre les attaques et la fraude.</p>
                      <div className="text-sm text-gray-600">
                        <p>• reCAPTCHA</p>
                        <p>• Cloudflare</p>
                        <p>• Protection DDoS</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions sur les Cookies ?</h2>
            <p className="text-lg text-gray-600">Notre équipe est là pour vous aider</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-[#ff6600]/10 rounded-full">
                    <Mail className="h-8 w-8 text-[#ff6600]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Email</h3>
                <p className="text-gray-600">support@probooster.online</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-[#ff6600]/10 rounded-full">
                    <Phone className="h-8 w-8 text-[#ff6600]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Téléphone</h3>
                <p className="text-gray-600">+229 91 50 57 57</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-[#ff6600]/10 rounded-full">
                    <MapPin className="h-8 w-8 text-[#ff6600]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Adresse</h3>
                <p className="text-gray-600">Abomey-Calavi, Bénin</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#ff6600] to-[#e55a00] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Contrôle total de vos cookies</h2>
          <p className="text-xl mb-8 opacity-90">
            Nous vous donnons le contrôle total sur vos préférences de cookies pour une expérience personnalisée.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" className="bg-white text-[#ff6600] hover:bg-gray-100">
              <Download className="h-5 w-5 mr-2" />
              Télécharger la politique
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => setContactModalOpen(true)}
            >
              <MessageCircle className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Nous contacter</span>
            </Button>
          </div>
                 </div>
       </section>

       {/* Contact Modal */}
       <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold text-center text-[#ff6600] flex items-center justify-center gap-2">
               <MessageCircle className="h-6 w-6" />
               Contactez-nous
             </DialogTitle>
             <DialogDescription className="text-center text-gray-600">
               Notre équipe est là pour vous aider avec vos questions sur les cookies
             </DialogDescription>
           </DialogHeader>

           <div className="grid md:grid-cols-2 gap-6 mt-6">
             {/* Méthodes de contact principales */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                 <MessageCircle className="h-5 w-5 text-[#ff6600]" />
                 Méthodes de contact
               </h3>
               
               {/* Email */}
               <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-[#ff6600]">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-[#ff6600]/10 rounded-full">
                         <Mail className="h-5 w-5 text-[#ff6600]" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900">Email</h4>
                         <p className="text-sm text-gray-600">support@probooster.online</p>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600] hover:text-white"
                         onClick={() => {
                           window.open('mailto:support@probooster.online?subject=Question sur les cookies&body=Bonjour,\n\nJ\'ai une question concernant les cookies de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
                         }}
                       >
                         <Mail className="h-4 w-4 mr-1" />
                         Envoyer
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => {
                           navigator.clipboard.writeText('support@probooster.online');
                           alert('Email copié dans le presse-papiers !');
                         }}
                       >
                         <Copy className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Téléphone */}
               <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-green-500/10 rounded-full">
                         <Phone className="h-5 w-5 text-green-500" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900">Téléphone</h4>
                         <p className="text-sm text-gray-600">+229 91 50 57 57</p>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         className="text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
                         onClick={() => {
                           window.open('tel:+22991505757', '_blank');
                         }}
                       >
                         <Phone className="h-4 w-4 mr-1" />
                         Appeler
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => {
                           navigator.clipboard.writeText('+229 91 50 57 57');
                           alert('Numéro copié dans le presse-papiers !');
                         }}
                       >
                         <Copy className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Site Web */}
               <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-500/10 rounded-full">
                         <GlobeIcon className="h-5 w-5 text-blue-500" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900">Site Web</h4>
                         <p className="text-sm text-gray-600">https://probooster.online</p>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                         onClick={() => {
                           window.open('https://probooster.online', '_blank');
                         }}
                       >
                         <ExternalLink className="h-4 w-4 mr-1" />
                         Visiter
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => {
                           navigator.clipboard.writeText('https://probooster.online');
                           alert('URL copiée dans le presse-papiers !');
                         }}
                       >
                         <Copy className="h-4 w-4" />
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             </div>

             {/* Informations supplémentaires */}
             <div className="space-y-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                 <Info className="h-5 w-5 text-[#ff6600]" />
                 Informations
               </h3>

               {/* Adresse */}
               <Card className="hover:shadow-lg transition-all duration-300">
                 <CardContent className="p-4">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-[#ff6600]/10 rounded-full">
                       <MapPin className="h-5 w-5 text-[#ff6600]" />
                     </div>
                     <div>
                       <h4 className="font-semibold text-gray-900">Adresse</h4>
                       <p className="text-sm text-gray-600">Abomey-Calavi, Bénin</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Horaires */}
               <Card className="hover:shadow-lg transition-all duration-300">
                 <CardContent className="p-4">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-[#ff6600]/10 rounded-full">
                       <Clock className="h-5 w-5 text-[#ff6600]" />
                     </div>
                     <div>
                       <h4 className="font-semibold text-gray-900">Horaires de support</h4>
                       <p className="text-sm text-gray-600">Lun-Ven: 8h-18h | Sam: 9h-15h</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Temps de réponse */}
               <Card className="hover:shadow-lg transition-all duration-300">
                 <CardContent className="p-4">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-[#ff6600]/10 rounded-full">
                       <Zap className="h-5 w-5 text-[#ff6600]" />
                     </div>
                     <div>
                       <h4 className="font-semibold text-gray-900">Temps de réponse</h4>
                       <p className="text-sm text-gray-600">Email: 24h | Téléphone: Immédiat</p>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Note importante */}
               <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                 <div className="flex items-start gap-3">
                   <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                   <div>
                     <h4 className="font-semibold text-blue-900 mb-1">Note importante</h4>
                     <p className="text-sm text-blue-800">
                       Pour les questions urgentes concernant les cookies, nous recommandons d'utiliser le téléphone. 
                       Pour les demandes détaillées, l'email est préférable.
                     </p>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Boutons d'action */}
           <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
             <Button
               variant="outline"
               onClick={() => setContactModalOpen(false)}
               className="flex items-center gap-2"
             >
               <X className="h-4 w-4" />
               Fermer
             </Button>
             <Button
               onClick={() => {
                 window.open('mailto:support@probooster.online?subject=Question sur les cookies&body=Bonjour,\n\nJ\'ai une question concernant les cookies de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
                 setContactModalOpen(false);
               }}
               className="bg-[#ff6600] hover:bg-[#e55a00] flex items-center gap-2"
             >
               <Mail className="h-4 w-4" />
               Envoyer un email
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
 } 