"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  ArrowRight,
  Building,
  Users,
  Shield,
  Star,
  Sparkles,
  Loader2
} from "lucide-react"
import { HelpService } from "@/lib/services/help-service"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "react-hot-toast"

export default function ContactPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    department: "general"
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.email?.split('@')[0] || "",
        email: user.email || ""
      }))
    }
  }, [user])

  const departments = [
    { id: "general", name: "Général", icon: MessageCircle, color: "from-blue-500 to-cyan-500" },
    { id: "technical", name: "Support technique", icon: Shield, color: "from-green-500 to-emerald-500" },
    { id: "sales", name: "Ventes", icon: Star, color: "from-yellow-500 to-orange-500" },
    { id: "billing", name: "Facturation", icon: Building, color: "from-purple-500 to-violet-500" }
  ]

  const contactInfo = [
    {
      title: "Téléphone",
      value: "+229 91 50 57 57",
      description: "Lun-Ven 8h-18h",
      icon: Phone,
      color: "from-green-500 to-emerald-500",
      action: () => window.location.href = "tel:+22991505757"
    },
    {
      title: "Email",
      value: "contact@probooster.online",
      description: "Réponse sous 24h",
      icon: Mail,
      color: "from-blue-500 to-cyan-500",
      action: () => window.location.href = "mailto:contact@probooster.online"
    },
    {
      title: "Adresse",
      value: "Abomey-Calavi, Bénin",
      description: "Siège social",
      icon: MapPin,
      color: "from-orange-500 to-red-500",
      action: () => {}
    },
    {
      title: "Chat en ligne",
      value: "Disponible 24h/24",
      description: "Assistance instantanée",
      icon: MessageCircle,
      color: "from-purple-500 to-violet-500",
      action: () => toast.success("Le chat s'ouvre...")
    }
  ]

  const stats = [
    { icon: Users, value: "50K+", label: "Clients satisfaits", color: "text-blue-500" },
    { icon: MessageCircle, value: "99%", label: "Taux de réponse", color: "text-green-500" },
    { icon: Clock, value: "< 2h", label: "Temps de réponse", color: "text-orange-500" },
    { icon: Star, value: "4.9/5", label: "Note moyenne", color: "text-yellow-500" }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { error } = await HelpService.createTicket({
        ...formData,
        user_id: user?.id
      })

      if (error) throw error
      
      setSubmitted(true)
      toast.success("Votre message a été envoyé avec succès !")
      
      setTimeout(() => {
        setSubmitted(false)
        setFormData({ ...formData, subject: "", message: "", department: "general" })
      }, 3000)
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}

        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
            <MessageCircle className="h-5 w-5 animate-pulse animate-float" />
            <span className="font-semibold group-hover:text-shimmer">NOUS CONTACTER</span>
            <MessageCircle className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
            Parlons de vos <span className="text-[#ff6600] animate-pulse">besoins</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 hover:text-gray-800 transition-colors duration-300">
            Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-fade-in-up animation-delay-600">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                <stat.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">{stat.value}</div>
              <div className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="animate-fade-in-up animation-delay-800">
            <Card className="border-0 shadow-xl group">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center space-x-2">
                  <Send className="h-6 w-6 text-[#ff6600] animate-pulse" />
                  <span className="hover:text-[#ff6600] transition-colors duration-300">Envoyez-nous un message</span>
                </CardTitle>
                <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Remplissez le formulaire ci-dessous et nous vous répondrons rapidement</p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message envoyé !</h3>
                    <p className="text-gray-600">Nous vous répondrons dans les plus brefs délais.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                        <Input
                          type="text"
                          placeholder="Votre nom"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                          className="border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <Input
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          required
                          className="border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sujet *</label>
                      <Input
                        type="text"
                        placeholder="Sujet de votre message"
                        value={formData.subject}
                        onChange={(e) => handleInputChange("subject", e.target.value)}
                        required
                        className="border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Département</label>
                      <div className="grid grid-cols-2 gap-2">
                        {departments.map((dept) => (
                          <Button
                            key={dept.id}
                            type="button"
                            variant={formData.department === dept.id ? "default" : "outline"}
                            className={`justify-start group transition-all duration-300 hover:scale-105 ${
                              formData.department === dept.id 
                                ? "bg-[#ff6600] text-white" 
                                : "border-gray-300 hover:border-[#ff6600]"
                            }`}
                            onClick={() => handleInputChange("department", dept.id)}
                          >
                            <dept.icon className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                            <span className="group-hover:translate-x-1 transition-transform duration-300">{dept.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                      <Textarea
                        placeholder="Décrivez votre demande..."
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        required
                        rows={6}
                        className="border-2 focus:border-[#ff6600] transition-all duration-300 resize-none hover:bg-gray-50"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#ff6600] hover:bg-[#e55a00] py-3 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Envoi en cours...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="h-5 w-5 animate-pulse" />
                          <span className="group-hover:translate-x-1 transition-transform duration-300">Envoyer le message</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 animate-float" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 animate-fade-in-up animation-delay-1000">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6 hover:text-[#ff6600] transition-colors duration-300">Informations de contact</h2>
              <p className="text-gray-600 mb-8 hover:text-gray-800 transition-colors duration-300">
                Nous sommes disponibles pour vous aider. Choisissez le moyen de contact qui vous convient le mieux.
              </p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <Card 
                  key={index} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
                  onClick={info.action}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${info.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                        <info.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">{info.title}</h3>
                        <p className="text-lg font-medium text-[#ff6600] group-hover:scale-110 transition-transform duration-300">{info.value}</p>
                        <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{info.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Office Hours */}
            <Card className="border-0 shadow-lg group">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-[#ff6600] animate-pulse" />
                  <span className="hover:text-[#ff6600] transition-colors duration-300">Horaires d&apos;ouverture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between group">
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Lundi - Vendredi</span>
                    <span className="font-medium group-hover:text-[#ff6600] transition-colors duration-300">8h00 - 18h00</span>
                  </div>
                  <div className="flex justify-between group">
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Samedi</span>
                    <span className="font-medium group-hover:text-[#ff6600] transition-colors duration-300">9h00 - 16h00</span>
                  </div>
                  <div className="flex justify-between group">
                    <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Dimanche</span>
                    <span className="font-medium group-hover:text-[#ff6600] transition-colors duration-300">Fermé</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between group">
                      <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Support 24h/24</span>
                      <Badge className="bg-green-500 text-white animate-pulse">Disponible</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16 animate-fade-in-up animation-delay-1200">
          <Card className="border-0 shadow-xl group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-[#ff6600] animate-pulse" />
                <span className="hover:text-[#ff6600] transition-colors duration-300">Notre localisation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg h-64 flex items-center justify-center group">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-[#ff6600] mx-auto mb-4 animate-float" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Abomey-Calavi, Bénin</h3>
                  <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Siège social de Probooster</p>
                  <Button variant="outline" className="mt-4 border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white group transition-all duration-300 hover:scale-105">
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Voir sur la carte</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-2xl p-8 text-center text-white animate-fade-in-up animation-delay-1400">
          <h2 className="text-3xl font-bold mb-4 hover:text-shimmer transition-all duration-300">Besoin d&apos;une réponse rapide ??</h2>
          <p className="text-xl mb-6 opacity-90 hover:opacity-100 transition-opacity duration-300">
            Utilisez notre chat en ligne pour une assistance instantanée
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
          >
            <MessageCircle className="mr-2 h-5 w-5 group-hover:animate-bounce" />
            <span className="group-hover:translate-x-1 transition-transform duration-300">Démarrer le chat</span>
            <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
          </Button>
        </div>
      </div>
    </div>
  )
} 
