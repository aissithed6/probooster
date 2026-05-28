"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Store, 
  TrendingUp, 
  Users, 
  Coins, 
  Shield, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Target, 
  Zap, 
  Gift, 
  MessageCircle, 
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
  Smartphone,
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
  FileText
} from "lucide-react"

export default function BecomeSellerPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    businessType: "",
    description: "",
    website: "",
    acceptTerms: false,
    newsletter: false
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStep, setSubmissionStep] = useState(1)

  const benefits = [
    {
      icon: TrendingUp,
      title: "Croissance Rapide",
      description: "Accédez à des milliers de clients potentiels et développez votre activité rapidement.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Coins,
      title: "Revenus Multipliés",
      description: "Gagnez plus avec notre système de commission avantageux et les bonus de performance.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Sécurité Garantie",
      description: "Transactions sécurisées et protection de vos données avec les meilleures technologies.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Support Dédié",
      description: "Une équipe d'experts à votre service pour vous accompagner dans votre réussite.",
      color: "from-purple-500 to-violet-500"
    }
  ]

  const features = [
    {
      icon: Store,
      title: "Boutique Personnalisée",
      description: "Créez votre boutique en ligne avec votre identité de marque unique.",
      features: ["Design personnalisable", "Logo et couleurs", "Galerie photos", "Descriptions détaillées"]
    },
    {
      icon: BarChart3,
      title: "Analytics Avancées",
      description: "Suivez vos performances en temps réel avec des outils d'analyse puissants.",
      features: ["Ventes en temps réel", "Comportement clients", "Rapports détaillés", "Prévisions"]
    },
    {
      icon: MessageCircle,
      title: "Chat Intégré",
      description: "Communiquez directement avec vos clients pour un service personnalisé.",
      features: ["Chat instantané", "Notifications", "Historique", "Support multilingue"]
    },
    {
      icon: Truck,
      title: "Logistique Simplifiée",
      description: "Gérez vos livraisons et stocks avec nos outils intégrés.",
      features: ["Gestion des stocks", "Suivi livraison", "Calcul frais", "Partners logistiques"]
    }
  ]

  const testimonials = [
    {
      name: "Fatou Diallo",
      business: "Mode Africaine",
      image: "/placeholder-user.jpg",
      rating: 5,
      text: "Probooster a transformé mon petit commerce en une entreprise florissante. Les outils sont incroyables !",
      sales: "+300%",
      time: "6 mois"
    },
    {
      name: "Kouassi Jean",
      business: "Tech Solutions",
      image: "/placeholder-user.jpg",
      rating: 5,
      text: "La plateforme est intuitive et le support client est exceptionnel. Je recommande vivement !",
      sales: "+450%",
      time: "1 an"
    },
    {
      name: "Aminata Traoré",
      business: "Artisanat Local",
      image: "/placeholder-user.jpg",
      rating: 5,
      text: "Grâce à Probooster, j'ai pu exporter mes produits dans toute l'Afrique de l'Ouest.",
      sales: "+200%",
      time: "8 mois"
    }
  ]

  const resources = [
    {
      icon: BookOpen,
      title: "Guide du Vendeur",
      description: "Tout ce que vous devez savoir pour réussir sur Probooster",
      type: "PDF",
      duration: "30 min"
    },
    {
      icon: Video,
      title: "Formation Vidéo",
      description: "Tutoriels étape par étape pour optimiser votre boutique",
      type: "Vidéo",
      duration: "2h"
    },
    {
      icon: FileText,
      title: "Modèles de Contrat",
      description: "Templates et documents légaux pour votre activité",
      type: "DOC",
      duration: "Téléchargement"
    }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Validation des données
      if (!formData.businessName || !formData.ownerName || !formData.email || !formData.phone) {
        alert('Veuillez remplir tous les champs obligatoires')
        setIsSubmitting(false)
        return
      }
      
      // Simulation d'un délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Sauvegarder les données dans localStorage pour simulation
      const sellerApplications = JSON.parse(localStorage.getItem('sellerApplications') || '[]')
      const newApplication = {
        id: Date.now(),
        ...formData,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        applicationNumber: `SELL-${Date.now().toString().slice(-6)}`
      }
      sellerApplications.push(newApplication)
      localStorage.setItem('sellerApplications', JSON.stringify(sellerApplications))
      
      setSubmissionStep(2)
      
      // Notification de succès
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            type: 'success',
            title: 'Candidature soumise !',
            message: `Votre candidature #${newApplication.applicationNumber} a été reçue. Nous vous contacterons dans les 24h.`
          }
        }))
      }
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinue = () => {
    setSubmissionStep(3)
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
              <Store className="h-5 w-5 animate-pulse animate-float" />
              <span className="font-semibold group-hover:text-shimmer">DEVENIR VENDEUR</span>
              <Sparkles className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
              Transformez votre <span className="text-yellow-300 animate-pulse">Passion</span> en <span className="text-yellow-300 animate-pulse">Business</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed animate-fade-in-up animation-delay-400 max-w-3xl mx-auto hover:text-white transition-colors duration-300">
              Rejoignez des milliers de vendeurs qui ont déjà transformé leur activité grâce à Probooster. 
              Créez votre boutique en ligne, atteignez de nouveaux clients et multipliez vos revenus.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                asChild
              >
                <Link href="#register" className="flex items-center">
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Commencer Maintenant</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
                asChild
              >
                <Link href="#benefits" className="flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Découvrir les Avantages</span>
                  <Gift className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float">
                <Store className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2 animate-count-up group-hover:text-[#ff6600] transition-colors duration-300">5,000+</div>
              <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Vendeurs Actifs</div>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.2s' }}>
                <TrendingUp className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2 animate-count-up group-hover:text-[#ff6600] transition-colors duration-300">+150%</div>
              <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Croissance Moyenne</div>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.4s' }}>
                <Coins className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2 animate-count-up group-hover:text-[#ff6600] transition-colors duration-300">2.5M+</div>
              <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">F CFA de CA</div>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.6s' }}>
                <Users className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2 animate-count-up group-hover:text-[#ff6600] transition-colors duration-300">50K+</div>
              <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Clients Satisfaits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Pourquoi Choisir Probooster ?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez les avantages exclusifs qui font de Probooster la plateforme de choix pour les vendeurs
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

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Outils Professionnels</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Tout ce dont vous avez besoin pour réussir votre business en ligne
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                      <feature.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{feature.title}</CardTitle>
                      <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{feature.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 group">
                        <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                        <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Ils Ont Réussi</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez les témoignages de nos vendeurs qui ont transformé leur activité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={60}
                      height={60}
                      className="w-15 h-15 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div>
                      <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{testimonial.name}</CardTitle>
                      <p className="text-[#ff6600] font-medium group-hover:text-orange-600 transition-colors duration-300">{testimonial.business}</p>
                      <div className="flex items-center space-x-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current group-hover:animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 italic group-hover:text-gray-800 transition-colors duration-300">"{testimonial.text}"</p>
                  <div className="flex justify-between items-center">
                    <Badge className="bg-green-500 text-white group-hover:scale-110 transition-transform duration-300">
                      {testimonial.sales} de croissance
                    </Badge>
                    <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">en {testimonial.time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Rejoignez Probooster</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
                Créez votre compte vendeur en quelques minutes et commencez à vendre dès aujourd'hui
              </p>
            </div>

            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                {submissionStep === 1 && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Nom de l'entreprise *</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          placeholder="Votre entreprise"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ownerName">Nom du propriétaire *</Label>
                        <Input
                          id="ownerName"
                          value={formData.ownerName}
                          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                          placeholder="Votre nom complet"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="votre@email.com"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+229 91 50 57 57"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Adresse complète"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessType">Type d'activité *</Label>
                        <Input
                          id="businessType"
                          value={formData.businessType}
                          onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                          placeholder="Mode, Tech, Alimentation..."
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">Site web (optionnel)</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://votresite.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description de votre activité *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Décrivez vos produits/services..."
                        rows={4}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="terms"
                          checked={formData.acceptTerms}
                          onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                          required
                        />
                        <Label htmlFor="terms" className="text-sm">
                          J'accepte les conditions d'utilisation et la politique de confidentialité
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="newsletter"
                          checked={formData.newsletter}
                          onCheckedChange={(checked) => setFormData({ ...formData, newsletter: checked as boolean })}
                        />
                        <Label htmlFor="newsletter" className="text-sm">
                          Je souhaite recevoir les actualités et conseils pour vendeurs
                        </Label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#ff6600] to-orange-500 hover:from-[#e55a00] hover:to-orange-600 text-white py-4 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Traitement en cours...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="group-hover:translate-x-1 transition-transform duration-300">Devenir Vendeur</span>
                          <ArrowRight className="h-5 w-5 group-hover:animate-bounce" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}

                {submissionStep === 2 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center mx-auto animate-pulse animate-float">
                      <CheckCircle className="h-8 w-8 text-white animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Demande Envoyée !</h3>
                      <p className="text-gray-600">Nous avons reçu votre demande et nous vous contacterons dans les 24h.</p>
                    </div>
                    <Button
                      onClick={handleContinue}
                      className="bg-gradient-to-r from-[#ff6600] to-orange-500 hover:from-[#e55a00] hover:to-orange-600 text-white"
                    >
                      Continuer
                    </Button>
                  </div>
                )}

                {submissionStep === 3 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce animate-float">
                      <Rocket className="h-8 w-8 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Bienvenue chez Probooster !</h3>
                      <p className="text-gray-600">Votre compte vendeur sera activé dans les prochaines heures.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild>
                        <Link href="/dashboard" className="flex items-center">
                          <span className="group-hover:translate-x-1 transition-transform duration-300">Accéder au Dashboard</span>
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/resources" className="flex items-center">
                          <span className="group-hover:translate-x-1 transition-transform duration-300">Voir les Ressources</span>
                          <BookOpen className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Ressources pour Vendeurs</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Tout ce dont vous avez besoin pour réussir sur Probooster
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {resources.map((resource, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                    <resource.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 group-hover:text-gray-800 transition-colors duration-300">{resource.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs group-hover:scale-110 transition-transform duration-300">
                      {resource.type} • {resource.duration}
                    </Badge>
                    <Button size="sm" variant="outline" className="group">
                      <Download className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                      Télécharger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#ff6600] to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 hover:text-shimmer transition-all duration-300">Prêt à Transformer Votre Business ?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto hover:text-white transition-colors duration-300">
            Rejoignez des milliers de vendeurs qui ont déjà multiplié leurs revenus avec Probooster
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
              asChild
            >
                              <Link href="#register" className="flex items-center">
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Commencer Maintenant</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
              asChild
            >
                              <Link href="/contact" className="flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Parler à un Expert</span>
                  <MessageCircle className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
} 