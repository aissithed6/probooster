"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Truck, 
  Package, 
  Clock, 
  MapPin, 
  Star, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Calendar,
  DollarSign,
  Globe,
  Zap,
  Heart,
  Sparkles,
  TrendingUp,
  Users,
  Award,
  MessageCircle,
  Mail,
  Phone,
  Copy,
  ExternalLink,
  Globe as GlobeIcon,
  Info,
  X
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function ShippingPage() {
  const [selectedZone, setSelectedZone] = useState("abomey-calavi")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const shippingOptions = [
    {
      id: "express",
      name: "Livraison Express",
      description: "Livraison en 24h",
      price: "2 500 F CFA",
      time: "24h",
      icon: Zap,
      color: "from-red-500 to-pink-500",
      features: ["Livraison en 24h", "Suivi en temps réel", "Signature requise", "Assurance incluse"],
      popular: true
    },
    {
      id: "standard",
      name: "Livraison Standard",
      description: "Livraison en 2-3 jours",
      price: "1 500 F CFA",
      time: "2-3 jours",
      icon: Truck,
      color: "from-blue-500 to-cyan-500",
      features: ["Livraison en 2-3 jours", "Suivi disponible", "Livraison à domicile", "Assurance incluse"]
    },
    {
      id: "economy",
      name: "Livraison Économique",
      description: "Livraison en 5-7 jours",
      price: "800 F CFA",
      time: "5-7 jours",
      icon: Package,
      color: "from-green-500 to-emerald-500",
      features: ["Livraison en 5-7 jours", "Suivi disponible", "Point relais", "Assurance incluse"]
    }
  ]

  const deliveryZones = [
    {
              id: "abomey-calavi",
        name: "Abomey-Calavi",
      time: "1-2 jours",
      price: "Gratuit",
      icon: MapPin,
      color: "from-green-500 to-emerald-500"
    },
    {
      id: "other-cities",
      name: "Autres villes",
      time: "2-3 jours",
      price: "500 F CFA",
      icon: Globe,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "rural",
      name: "Zones rurales",
      time: "3-5 jours",
      price: "1 000 F CFA",
      icon: MapPin,
      color: "from-orange-500 to-red-500"
    }
  ]

  const trackingSteps = [
    {
      step: 1,
      title: "Commande confirmée",
      description: "Votre commande a été reçue et confirmée",
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      step: 2,
      title: "En préparation",
      description: "Votre commande est en cours de préparation",
      icon: Package,
      color: "text-blue-500"
    },
    {
      step: 3,
      title: "En transit",
      description: "Votre commande est en route vers vous",
      icon: Truck,
      color: "text-orange-500"
    },
    {
      step: 4,
      title: "Livré",
      description: "Votre commande a été livrée",
      icon: CheckCircle,
      color: "text-green-500"
    }
  ]

  const shippingStats = [
    { icon: Truck, value: "99.5%", label: "Livraisons réussies", color: "text-green-500" },
    { icon: Clock, value: "1.2j", label: "Délai moyen", color: "text-blue-500" },
    { icon: Users, value: "50K+", label: "Clients satisfaits", color: "text-orange-500" },
    { icon: Star, value: "4.9/5", label: "Note moyenne", color: "text-yellow-500" }
  ]

  const handleTrackPackage = () => {
    if (trackingNumber.trim()) {
      // Simulation du suivi
      alert(`Suivi du colis ${trackingNumber} en cours...`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
                     <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
             <Truck className="h-5 w-5 animate-pulse animate-float" />
             <span className="font-semibold group-hover:text-shimmer">LIVRAISON</span>
             <Truck className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
           </div>
                     <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
             Livraison <span className="text-[#ff6600] animate-pulse">rapide et fiable</span>
           </h1>
           <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 hover:text-gray-800 transition-colors duration-300">
             Découvrez nos options de livraison et suivez vos commandes en temps réel
           </p>
        </div>

        {/* Stats */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-fade-in-up animation-delay-600">
           {shippingStats.map((stat, index) => (
             <div key={index} className="text-center group">
               <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                 <stat.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
               </div>
               <div className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">{stat.value}</div>
               <div className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
             </div>
           ))}
         </div>

        {/* Shipping Options */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Options de livraison</h2>
           <div className="grid md:grid-cols-3 gap-6">
             {shippingOptions.map((option, index) => (
               <Card 
                 key={option.id}
                 className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer relative group ${
                   option.popular ? 'ring-2 ring-[#ff6600]' : ''
                 }`}
               >
                 {option.popular && (
                   <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#ff6600] text-white animate-pulse">
                     Populaire
                   </Badge>
                 )}
                 <CardHeader className="text-center">
                   <div className={`w-16 h-16 bg-gradient-to-r ${option.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.3}s` }}>
                     <option.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                   </div>
                   <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{option.name}</CardTitle>
                   <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{option.description}</p>
                   <div className="flex items-center justify-center space-x-2 mt-2">
                     <Clock className="h-4 w-4 text-gray-500 group-hover:animate-pulse" />
                     <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{option.time}</span>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="text-center mb-4">
                     <div className="text-2xl font-bold text-[#ff6600] group-hover:scale-110 transition-transform duration-300">{option.price}</div>
                   </div>
                   <ul className="space-y-2">
                     {option.features.map((feature, index) => (
                       <li key={index} className="flex items-center space-x-2 group">
                         <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                         <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{feature}</span>
                       </li>
                     ))}
                   </ul>
                   <Button className="w-full mt-4 bg-[#ff6600] hover:bg-[#e55a00] group transition-all duration-300 hover:scale-105">
                     <span className="group-hover:translate-x-1 transition-transform duration-300">Choisir cette option</span>
                     <ArrowRight className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                   </Button>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>

        {/* Delivery Zones */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Zones de livraison</h2>
           <div className="grid md:grid-cols-3 gap-6">
             {deliveryZones.map((zone, index) => (
               <Card 
                 key={zone.id}
                 className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group ${
                   selectedZone === zone.id ? 'ring-2 ring-[#ff6600]' : ''
                 }`}
                 onClick={() => setSelectedZone(zone.id)}
               >
                 <CardHeader>
                   <div className="flex items-center space-x-4">
                     <div className={`w-12 h-12 bg-gradient-to-r ${zone.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                       <zone.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                     </div>
                     <div>
                       <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{zone.name}</CardTitle>
                       <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{zone.time}</p>
                     </div>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <div className="flex justify-between items-center">
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Frais de livraison:</span>
                     <span className="font-semibold text-[#ff6600] group-hover:scale-110 transition-transform duration-300">{zone.price}</span>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>

        {/* Package Tracking */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Suivi de colis</h2>
           <div className="max-w-2xl mx-auto">
             <Card className="border-0 shadow-xl group">
               <CardHeader>
                 <CardTitle className="flex items-center space-x-2">
                   <Package className="h-5 w-5 text-[#ff6600] animate-pulse" />
                   <span className="hover:text-[#ff6600] transition-colors duration-300">Suivre votre commande</span>
                 </CardTitle>
                 <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Entrez votre numéro de suivi pour connaître le statut de votre livraison</p>
               </CardHeader>
               <CardContent>
                 <div className="flex space-x-4">
                   <Input
                     type="text"
                     placeholder="Numéro de suivi..."
                     value={trackingNumber}
                     onChange={(e) => setTrackingNumber(e.target.value)}
                     className="flex-1 border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
                   />
                   <Button 
                     onClick={handleTrackPackage}
                     disabled={!trackingNumber.trim()}
                     className="bg-[#ff6600] hover:bg-[#e55a00] group transition-all duration-300 hover:scale-105"
                   >
                     <span className="group-hover:translate-x-1 transition-transform duration-300">Suivre</span>
                     <ArrowRight className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>

        {/* Tracking Steps */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Processus de livraison</h2>
           <div className="max-w-4xl mx-auto">
             <div className="grid md:grid-cols-4 gap-6">
               {trackingSteps.map((step, index) => (
                 <div key={step.step} className="text-center relative group">
                   {index < trackingSteps.length - 1 && (
                     <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 z-0"></div>
                   )}
                   <div className="relative z-10">
                     <div className={`w-16 h-16 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.4}s` }}>
                       <step.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                     </div>
                     <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">{step.title}</h3>
                     <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{step.description}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </div>

        {/* Shipping Features */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Pourquoi choisir notre livraison ?</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
               <CardHeader className="text-center">
                 <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float">
                   <Shield className="h-8 w-8 text-white group-hover:animate-bounce" />
                 </div>
                 <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">Livraison sécurisée</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-gray-600 text-center group-hover:text-gray-800 transition-colors duration-300">Tous nos colis sont assurés et livrés en toute sécurité</p>
               </CardContent>
             </Card>

             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
               <CardHeader className="text-center">
                 <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.2s' }}>
                   <Clock className="h-8 w-8 text-white group-hover:animate-bounce" />
                 </div>
                 <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">Suivi en temps réel</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-gray-600 text-center group-hover:text-gray-800 transition-colors duration-300">Suivez votre commande étape par étape</p>
               </CardContent>
             </Card>

             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
               <CardHeader className="text-center">
                 <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.4s' }}>
                   <Zap className="h-8 w-8 text-white group-hover:animate-bounce" />
                 </div>
                 <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">Livraison rapide</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-gray-600 text-center group-hover:text-gray-800 transition-colors duration-300">Livraison express disponible en 24h</p>
               </CardContent>
             </Card>

             <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
               <CardHeader className="text-center">
                 <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: '0.6s' }}>
                   <Heart className="h-8 w-8 text-white group-hover:animate-bounce" />
                 </div>
                 <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">Service client</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-gray-600 text-center group-hover:text-gray-800 transition-colors duration-300">Support disponible 24h/24 pour vos questions</p>
               </CardContent>
             </Card>
           </div>
         </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4 hover:text-shimmer transition-all duration-300">Besoin d'aide pour votre livraison ?</h2>
          <p className="text-xl mb-6 opacity-90 hover:opacity-100 transition-opacity duration-300">
            Notre équipe logistique est là pour vous aider
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg"
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
              onClick={() => setContactModalOpen(true)}
            >
              <MessageCircle className="mr-2 h-5 w-5 group-hover:animate-bounce" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Contacter le support</span>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
            >
              <Package className="mr-2 h-5 w-5 group-hover:animate-bounce" />
              <span className="group-hover:translate-x-1 transition-transform duration-300">Voir nos tarifs</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-[#ff6600] flex items-center justify-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Contactez-nous
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Notre équipe logistique est là pour vous aider avec vos questions de livraison
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
                          window.open('mailto:support@probooster.online?subject=Question sur la livraison&body=Bonjour,\n\nJ\'ai une question concernant la livraison de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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
                      Pour les questions urgentes concernant la livraison, nous recommandons d'utiliser le téléphone. 
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
                window.open('mailto:support@probooster.online?subject=Question sur la livraison&body=Bonjour,\n\nJ\'ai une question concernant la livraison de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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