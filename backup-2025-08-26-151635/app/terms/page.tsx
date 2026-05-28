"use client"
import { useState } from "react"
import { FileText, Scale, AlertTriangle, CheckCircle, Users, Shield, Clock, Calendar, Star, Zap, Heart, ShoppingBag, Gift, Sparkles, ArrowRight, Info, XCircle, Lock, Eye, UserCheck, Mail, Phone, MapPin, MessageCircle, Download, ExternalLink, X, Copy, Globe as GlobeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("general")
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const sections = [
    { id: "general", title: "Conditions générales", icon: FileText },
    { id: "droits", title: "Droits et obligations", icon: Scale },
    { id: "sanctions", title: "Sanctions", icon: AlertTriangle },
    { id: "propriete", title: "Propriété intellectuelle", icon: Shield },
    { id: "responsabilite", title: "Responsabilité", icon: Users },
    { id: "modifications", title: "Modifications", icon: Clock },
  ]

  const generalTerms = [
    { title: "Acceptation des conditions", description: "En utilisant notre plateforme, vous acceptez ces conditions", icon: CheckCircle },
    { title: "Âge minimum", description: "Vous devez avoir au moins 18 ans pour utiliser nos services", icon: UserCheck },
    { title: "Compte utilisateur", description: "Vous êtes responsable de la sécurité de votre compte", icon: Lock },
    { title: "Utilisation acceptable", description: "Interdiction d'utiliser la plateforme à des fins illégales", icon: Shield },
  ]

  const userRights = [
    { right: "Accès au service", description: "Utilisation de la plateforme selon les conditions", icon: CheckCircle },
    { right: "Support client", description: "Assistance technique et support utilisateur", icon: MessageCircle },
    { right: "Protection des données", description: "Respect de votre vie privée et sécurité", icon: Shield },
    { right: "Transparence", description: "Information claire sur nos services", icon: Eye },
  ]

  const userObligations = [
    { obligation: "Respect des règles", description: "Respecter les conditions d'utilisation", icon: FileText },
    { obligation: "Informations exactes", description: "Fournir des informations véridiques", icon: CheckCircle },
    { obligation: "Sécurité du compte", description: "Protéger vos identifiants de connexion", icon: Lock },
    { obligation: "Paiement des frais", description: "Payer les frais de service applicables", icon: ShoppingBag },
  ]

  const sanctions = [
    { sanction: "Avertissement", description: "Première infraction - avertissement écrit", icon: AlertTriangle },
    { sanction: "Suspension temporaire", description: "Suspension du compte de 7 à 30 jours", icon: Clock },
    { sanction: "Suspension définitive", description: "Fermeture permanente du compte", icon: XCircle },
    { sanction: "Actions légales", description: "Poursuites judiciaires si nécessaire", icon: Scale },
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
                <FileText className="h-12 w-12 text-[#ff6600] animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
              Conditions d'Utilisation
            </h1>
            <p className="text-xl text-gray-200 mb-8 animate-fade-in-up animation-delay-200">
              Les règles qui régissent l'utilisation de notre plateforme marketplace
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-400">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Scale className="h-4 w-4 mr-2" />
                Règles claires
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Shield className="h-4 w-4 mr-2" />
                Protection mutuelle
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Users className="h-4 w-4 mr-2" />
                Communauté équitable
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 animate-bounce">
          <Sparkles className="h-8 w-8 text-[#ff6600]/30" />
        </div>
        <div className="absolute top-20 right-20 animate-pulse">
          <FileText className="h-6 w-6 text-white/20" />
        </div>
        <div className="absolute bottom-10 left-1/4 animate-ping">
          <Scale className="h-4 w-4 text-[#ff6600]/40" />
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
            {/* Conditions générales */}
            {activeSection === "general" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Conditions Générales</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Les conditions générales définissent les règles de base pour l'utilisation de notre plateforme.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {generalTerms.map((term, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-[#ff6600]/10 rounded-lg">
                            <term.icon className="h-6 w-6 text-[#ff6600]" />
                          </div>
                          <CardTitle className="text-xl">{term.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{term.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Important</h3>
                      <p className="text-blue-800">
                        En utilisant notre plateforme, vous acceptez automatiquement ces conditions d'utilisation. 
                        Nous vous recommandons de les lire attentivement avant de commencer à utiliser nos services.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Droits et obligations */}
            {activeSection === "droits" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Droits et Obligations</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Un équilibre entre vos droits en tant qu'utilisateur et vos obligations envers la communauté.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div>
                    <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center">
                      <CheckCircle className="h-6 w-6 mr-3" />
                      Vos Droits
                    </h3>
                    <div className="space-y-4">
                      {userRights.map((right, index) => (
                        <Card key={index} className="border-green-200 bg-green-50 hover:shadow-lg transition-all duration-300">
                          <CardHeader>
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <right.icon className="h-5 w-5 text-green-600" />
                              </div>
                              <CardTitle className="text-green-800 text-lg">{right.right}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-green-700">{right.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-orange-800 mb-6 flex items-center">
                      <AlertTriangle className="h-6 w-6 mr-3" />
                      Vos Obligations
                    </h3>
                    <div className="space-y-4">
                      {userObligations.map((obligation, index) => (
                        <Card key={index} className="border-orange-200 bg-orange-50 hover:shadow-lg transition-all duration-300">
                          <CardHeader>
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-orange-100 rounded-lg">
                                <obligation.icon className="h-5 w-5 text-orange-600" />
                              </div>
                              <CardTitle className="text-orange-800 text-lg">{obligation.obligation}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-orange-700">{obligation.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sanctions */}
            {activeSection === "sanctions" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Sanctions et Mesures</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Nous appliquons des sanctions progressives pour maintenir un environnement équitable.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  {sanctions.map((sanction, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            index === 0 ? "bg-yellow-100" : 
                            index === 1 ? "bg-orange-100" : 
                            index === 2 ? "bg-red-100" : "bg-gray-100"
                          }`}>
                            <sanction.icon className={`h-6 w-6 ${
                              index === 0 ? "text-yellow-600" : 
                              index === 1 ? "text-orange-600" : 
                              index === 2 ? "text-red-600" : "text-gray-600"
                            }`} />
                          </div>
                          <CardTitle className={`text-xl ${
                            index === 0 ? "text-yellow-800" : 
                            index === 1 ? "text-orange-800" : 
                            index === 2 ? "text-red-800" : "text-gray-800"
                          }`}>{sanction.sanction}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className={`${
                          index === 0 ? "text-yellow-700" : 
                          index === 1 ? "text-orange-700" : 
                          index === 2 ? "text-red-700" : "text-gray-700"
                        }`}>{sanction.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 mb-2">Zéro tolérance</h3>
                      <p className="text-red-800">
                        Les infractions graves (fraude, harcèlement, contenu illégal) entraînent une suspension immédiate 
                        et définitive du compte, sans possibilité de recours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Propriété intellectuelle */}
            {activeSection === "propriete" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Propriété Intellectuelle</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Protection des droits de propriété intellectuelle de tous les utilisateurs.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>Contenu utilisateur</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Vous conservez vos droits sur le contenu que vous publiez sur la plateforme.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Licence d'utilisation</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Nous accordons une licence limitée pour utiliser notre plateforme.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Eye className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle>Marques déposées</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Nos marques et logos sont protégés par la propriété intellectuelle.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <AlertTriangle className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle>Contenu interdit</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Interdiction de publier du contenu violant les droits d'auteur.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Responsabilité */}
            {activeSection === "responsabilite" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Limitation de Responsabilité</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Définition claire des responsabilités de chaque partie dans l'utilisation de la plateforme.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-6 w-6 text-blue-600" />
                        <CardTitle className="text-blue-800">Notre responsabilité</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-700">Maintenance de la plateforme et protection des données utilisateur.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Users className="h-6 w-6 text-green-600" />
                        <CardTitle className="text-green-800">Votre responsabilité</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700">Contenu publié et respect des conditions d'utilisation.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                        <CardTitle className="text-orange-800">Exclusions</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-orange-700">Dommages indirects et pertes de données non liées à notre service.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <Scale className="h-6 w-6 text-purple-600" />
                        <CardTitle className="text-purple-800">Force majeure</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-700">Événements indépendants de notre volonté (pannes, catastrophes).</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Modifications */}
            {activeSection === "modifications" && (
              <div className="animate-fade-in-up">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Modifications des Conditions</h2>
                  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Processus transparent pour les modifications de nos conditions d'utilisation.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>Notification préalable</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Vous serez informé 30 jours avant toute modification importante.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Mail className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Communication</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Notifications par email et affichage sur la plateforme.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-purple-600" />
                        </div>
                        <CardTitle>Acceptation continue</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">L'utilisation continue vaut acceptation des nouvelles conditions.</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <XCircle className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle>Droit de résiliation</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Vous pouvez résilier votre compte si vous n'acceptez pas les modifications.</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-4">
                    <Info className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Dernière mise à jour</h3>
                      <p className="text-blue-800">
                        Ces conditions d'utilisation ont été mises à jour pour la dernière fois le 15 janvier 2024. 
                        Nous nous engageons à maintenir cette page à jour avec les dernières modifications.
                      </p>
                    </div>
                  </div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions sur les Conditions ?</h2>
            <p className="text-lg text-gray-600">Notre équipe juridique est là pour vous éclairer</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-[#ff6600]/10 rounded-full">
                    <Mail className="h-8 w-8 text-[#ff6600]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Email juridique</h3>
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
          <h2 className="text-3xl font-bold mb-4">Conditions d'utilisation claires</h2>
          <p className="text-xl mb-8 opacity-90">
            Nous nous engageons à maintenir des conditions d'utilisation transparentes et équitables pour tous.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => {
                // Simuler le téléchargement d'un PDF
                const link = document.createElement('a');
                link.href = '/terms-of-service.pdf'; // URL fictive du PDF
                link.download = 'conditions-utilisation-probooster.pdf';
                link.style.display = 'none';
                document.body.appendChild(link);
                
                // Afficher une notification de téléchargement
                alert('Téléchargement des conditions d\'utilisation en cours...\n\nSi le téléchargement ne démarre pas automatiquement, veuillez contacter notre équipe support.');
                
                // Simuler le clic
                link.click();
                document.body.removeChild(link);
                
                // Optionnel : Envoyer une notification au serveur
                console.log('Téléchargement des conditions d\'utilisation demandé');
              }}
            >
              <Download className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Télécharger les conditions</span>
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
               Notre équipe juridique est là pour vous aider avec vos questions sur les conditions d'utilisation
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
                           window.open('mailto:support@probooster.online?subject=Question sur les conditions d\'utilisation&body=Bonjour,\n\nJ\'ai une question concernant les conditions d\'utilisation de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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
                       Pour les questions urgentes concernant les conditions d'utilisation, nous recommandons d'utiliser le téléphone. 
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
                 window.open('mailto:support@probooster.online?subject=Question sur les conditions d\'utilisation&body=Bonjour,\n\nJ\'ai une question concernant les conditions d\'utilisation de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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