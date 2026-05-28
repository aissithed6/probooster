"use client"
import { useState } from "react"
import { Shield, Lock, Eye, Database, UserCheck, FileText, Calendar, CheckCircle, AlertTriangle, Info, ArrowRight, Users, Globe, Smartphone, Mail, Phone, MapPin, Clock, Star, Zap, Heart, ShoppingBag, Gift, Sparkles, MessageCircle, Truck, XCircle, RefreshCw, BarChart3, Target, Settings, X, ExternalLink, Copy, Globe as GlobeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("collecte")
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const sections = [
    { id: "collecte", title: "Collecte de données", icon: Database },
    { id: "utilisation", title: "Utilisation des données", icon: Eye },
    { id: "partage", title: "Partage des données", icon: Users },
    { id: "securite", title: "Sécurité", icon: Shield },
    { id: "droits", title: "Vos droits", icon: UserCheck },
    { id: "cookies", title: "Cookies", icon: FileText },
  ]

  const dataTypes = [
    { type: "Informations personnelles", description: "Nom, email, téléphone, adresse", icon: UserCheck },
    { type: "Données de navigation", description: "Pages visitées, temps passé", icon: Globe },
    { type: "Données de transaction", description: "Historique d'achats, points", icon: ShoppingBag },
    { type: "Données techniques", description: "IP, navigateur, appareil", icon: Smartphone },
  ]

  const userRights = [
    { right: "Accès", description: "Consulter vos données personnelles", icon: Eye },
    { right: "Rectification", description: "Corriger des informations inexactes", icon: FileText },
    { right: "Effacement", description: "Supprimer vos données", icon: AlertTriangle },
    { right: "Portabilité", description: "Récupérer vos données", icon: ArrowRight },
    { right: "Opposition", description: "Refuser le traitement", icon: XCircle },
    { right: "Limitation", description: "Limiter le traitement", icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#535455] via-gray-800 to-[#ff6600] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                <Shield className="h-12 w-12 text-[#ff6600] animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-gray-200 mb-8 animate-fade-in-up animation-delay-200">
              Nous protégeons vos données personnelles avec la plus grande attention
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-400">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Lock className="h-4 w-4 mr-2" />
                Données sécurisées
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Eye className="h-4 w-4 mr-2" />
                Transparence totale
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <UserCheck className="h-4 w-4 mr-2" />
                Contrôle utilisateur
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 animate-bounce">
          <Sparkles className="h-8 w-8 text-[#ff6600]/30" />
        </div>
        <div className="absolute top-20 right-20 animate-pulse">
          <Shield className="h-6 w-6 text-white/20" />
        </div>
        <div className="absolute bottom-10 left-1/4 animate-ping">
          <Lock className="h-4 w-4 text-[#ff6600]/40" />
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
            {/* Collecte de données */}
            {activeSection === "collecte" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Collecte de Données</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Nous collectons uniquement les données nécessaires pour vous offrir la meilleure expérience possible.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {dataTypes.map((dataType, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#ff6600]/10 rounded-lg">
                            <dataType.icon className="h-6 w-6 text-[#ff6600]" />
                          </div>
                          <CardTitle className="text-xl">{dataType.type}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{dataType.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Utilisation des données */}
            {activeSection === "utilisation" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Utilisation des Données</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Vos données sont utilisées exclusivement pour améliorer votre expérience sur notre plateforme.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Amélioration du service</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Personnalisation des recommandations et optimisation de l'interface utilisateur.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ShoppingBag className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>Gestion des commandes</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Traitement des achats, suivi des livraisons et gestion des points.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MessageCircle className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle>Communication</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Notifications importantes et support client personnalisé.</p>
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
                      <p className="text-gray-600">Protection contre la fraude et sécurisation de votre compte.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Partage des données */}
            {activeSection === "partage" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Partage des Données</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Nous ne partageons vos données qu'avec votre consentement explicite ou pour des raisons légales.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <CardTitle className="text-green-800">Avec votre consentement</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700">Partage explicite pour des services tiers spécifiques.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Truck className="h-6 w-6 text-blue-600" />
                        <CardTitle className="text-blue-800">Prestataires de services</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-700">Livraison, paiement et support technique.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                        <CardTitle className="text-red-800">Obligations légales</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-red-700">Réponse aux demandes des autorités compétentes.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-gray-200 bg-gray-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-6 w-6 text-gray-600" />
                        <CardTitle className="text-gray-800">Protection</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">Prévention de la fraude et sécurité de la plateforme.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Sécurité */}
            {activeSection === "securite" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Sécurité des Données</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Nous mettons en place les meilleures pratiques de sécurité pour protéger vos données.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Lock className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Chiffrement SSL</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Toutes les données sont chiffrées en transit et au repos.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>Accès restreint</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Accès aux données limité aux employés autorisés uniquement.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Eye className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle>Surveillance continue</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Monitoring 24/7 pour détecter les menaces potentielles.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <RefreshCw className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle>Sauvegarde régulière</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Sauvegarde automatique et sécurisée de toutes les données.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Vos droits */}
            {activeSection === "droits" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Vos Droits</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Vous disposez de droits complets sur vos données personnelles.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {userRights.map((right, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#ff6600]/10 rounded-lg">
                            <right.icon className="h-6 w-6 text-[#ff6600]" />
                          </div>
                          <CardTitle className="text-xl">{right.right}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{right.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Cookies */}
            {activeSection === "cookies" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Politique des Cookies</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Les cookies améliorent votre expérience en mémorisant vos préférences.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <CardTitle className="text-green-800">Cookies essentiels</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700">Nécessaires au fonctionnement du site (panier, connexion).</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                        <CardTitle className="text-blue-800">Cookies analytiques</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-700">Analyse du trafic et amélioration des performances.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Target className="h-6 w-6 text-purple-600" />
                        <CardTitle className="text-purple-800">Cookies marketing</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-700">Personnalisation des publicités et recommandations.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Settings className="h-6 w-6 text-orange-600" />
                        <CardTitle className="text-orange-800">Gestion des cookies</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700">Contrôlez vos préférences dans les paramètres.</p>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions sur la Confidentialité ?</h2>
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
          <h2 className="text-3xl font-bold mb-4">Protection de vos données</h2>
          <p className="text-xl mb-8 opacity-90">
            Votre confiance est notre priorité. Nous nous engageons à protéger vos données personnelles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
                         <Button 
               size="lg" 
               variant="secondary" 
               className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
               onClick={() => {
                 // Simuler le téléchargement d'un PDF
                 const link = document.createElement('a');
                 link.href = '/privacy-policy.pdf'; // URL fictive du PDF
                 link.download = 'politique-confidentialite-probooster.pdf';
                 link.style.display = 'none';
                 document.body.appendChild(link);
                 
                 // Afficher une notification de téléchargement
                 alert('Téléchargement de la politique de confidentialité en cours...\n\nSi le téléchargement ne démarre pas automatiquement, veuillez contacter notre équipe support.');
                 
                 // Simuler le clic
                 link.click();
                 document.body.removeChild(link);
                 
                 // Optionnel : Envoyer une notification au serveur
                 console.log('Téléchargement de la politique de confidentialité demandé');
               }}
             >
               <FileText className="h-5 w-5 mr-2 group-hover:animate-pulse" />
               <span className="group-hover:translate-x-1 transition-transform duration-300">Télécharger la politique complète</span>
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
               Notre équipe est là pour vous aider avec vos questions sur la politique de confidentialité
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
                           window.open('mailto:support@probooster.online?subject=Question sur la politique de confidentialité&body=Bonjour,\n\nJ\'ai une question concernant la politique de confidentialité de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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
                       Pour les questions urgentes concernant la confidentialité, nous recommandons d'utiliser le téléphone. 
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
                 window.open('mailto:support@probooster.online?subject=Question sur la politique de confidentialité&body=Bonjour,\n\nJ\'ai une question concernant la politique de confidentialité de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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