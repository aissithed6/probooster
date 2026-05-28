"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  RotateCcw, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowRight,
  Calendar,
  DollarSign,
  Shield,
  Truck,
  MessageCircle,
  FileText,
  Download,
  Upload,
  Star,
  Heart,
  Sparkles,
  Users,
  Award,
  ArrowLeft,
  Info,
  Zap,
  ShoppingBag,
  Gift,
  Copy,
  Globe as GlobeIcon,
  Mail,
  Phone,
  MapPin
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"

export default function ReturnsPage() {
  const [returnReason, setReturnReason] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)

  const returnReasons = [
    { id: "wrong-size", name: "Mauvaise taille", icon: Package, color: "from-blue-500 to-cyan-500" },
    { id: "defective", name: "Produit défectueux", icon: AlertTriangle, color: "from-red-500 to-pink-500" },
    { id: "not-as-described", name: "Ne correspond pas à la description", icon: FileText, color: "from-orange-500 to-yellow-500" },
    { id: "changed-mind", name: "Changement d'avis", icon: Heart, color: "from-purple-500 to-violet-500" },
    { id: "duplicate", name: "Commande en double", icon: Package, color: "from-green-500 to-emerald-500" },
    { id: "other", name: "Autre raison", icon: MessageCircle, color: "from-gray-500 to-gray-600" }
  ]

  const returnPolicy = [
    {
      title: "Délai de retour",
      description: "14 jours à compter de la réception",
      icon: Calendar,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "État du produit",
      description: "Doit être dans son état d'origine",
      icon: Package,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Frais de retour",
      description: "Gratuits pour les produits défectueux",
      icon: DollarSign,
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Remboursement",
      description: "Traité sous 5-7 jours ouvrés",
      icon: Shield,
      color: "from-purple-500 to-violet-500"
    }
  ]

  const returnSteps = [
    {
      step: 1,
      title: "Initier le retour",
      description: "Connectez-vous et sélectionnez la commande",
      icon: RotateCcw,
      color: "text-blue-500"
    },
    {
      step: 2,
      title: "Préparer le colis",
      description: "Remettez le produit dans son emballage",
      icon: Package,
      color: "text-green-500"
    },
    {
      step: 3,
      title: "Expédier",
      description: "Utilisez l'étiquette de retour fournie",
      icon: Truck,
      color: "text-orange-500"
    },
    {
      step: 4,
      title: "Remboursement",
      description: "Reçu sous 5-7 jours ouvrés",
      icon: CheckCircle,
      color: "text-purple-500"
    }
  ]

  const returnStats = [
    { icon: Users, value: "98%", label: "Clients satisfaits", color: "text-green-500" },
    { icon: Clock, value: "5-7j", label: "Délai de remboursement", color: "text-blue-500" },
    { icon: Shield, value: "100%", label: "Retours sécurisés", color: "text-orange-500" },
    { icon: Star, value: "4.8/5", label: "Note moyenne", color: "text-yellow-500" }
  ]

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulation de soumission
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    setSubmitted(true)
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false)
      setOrderNumber("")
      setReturnReason("")
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
                     <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
             <RotateCcw className="h-5 w-5 animate-pulse animate-float" />
             <span className="font-semibold group-hover:text-shimmer">RETOURS</span>
             <RotateCcw className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
           </div>
                     <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
             Politique de <span className="text-[#ff6600] animate-pulse">retour</span> simple
           </h1>
           <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 hover:text-gray-800 transition-colors duration-300">
             Retournez vos produits facilement et obtenez un remboursement rapide
           </p>
        </div>

        {/* Stats */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-fade-in-up animation-delay-600">
           {returnStats.map((stat, index) => (
             <div key={index} className="text-center group">
               <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                 <stat.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
               </div>
               <div className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">{stat.value}</div>
               <div className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
             </div>
           ))}
         </div>

        {/* Return Policy */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Notre politique de retour</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             {returnPolicy.map((policy, index) => (
               <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                 <CardHeader className="text-center">
                   <div className={`w-16 h-16 bg-gradient-to-r ${policy.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.3}s` }}>
                     <policy.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                   </div>
                   <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{policy.title}</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-gray-600 text-center group-hover:text-gray-800 transition-colors duration-300">{policy.description}</p>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>

        {/* Return Process */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Processus de retour</h2>
           <div className="max-w-4xl mx-auto">
             <div className="grid md:grid-cols-4 gap-6">
               {returnSteps.map((step, index) => (
                 <div key={step.step} className="text-center relative group">
                   {index < returnSteps.length - 1 && (
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

        {/* Return Form */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Initier un retour</h2>
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                                 <CardTitle className="flex items-center space-x-2">
                   <RotateCcw className="h-5 w-5 text-[#ff6600] animate-pulse" />
                   <span className="hover:text-[#ff6600] transition-colors duration-300">Demande de retour</span>
                 </CardTitle>
                <p className="text-gray-600">Remplissez le formulaire ci-dessous pour initier votre retour</p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Retour initié !</h3>
                    <p className="text-gray-600">Nous vous enverrons un email avec les instructions de retour.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReturn} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de commande *</label>
                      <Input
                        type="text"
                        placeholder="Ex: ORD-2024-001234"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        required
                        className="border-2 focus:border-[#ff6600] transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Raison du retour *</label>
                      <div className="grid grid-cols-2 gap-2">
                                                 {returnReasons.map((reason) => (
                           <Button
                             key={reason.id}
                             type="button"
                             variant={returnReason === reason.id ? "default" : "outline"}
                             className={`justify-start group transition-all duration-300 hover:scale-105 ${
                               returnReason === reason.id 
                                 ? "bg-[#ff6600] text-white" 
                                 : "border-gray-300 hover:border-[#ff6600]"
                             }`}
                             onClick={() => setReturnReason(reason.id)}
                           >
                             <reason.icon className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                             <span className="group-hover:translate-x-1 transition-transform duration-300">{reason.name}</span>
                           </Button>
                         ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                      <Textarea
                        placeholder="Décrivez le problème ou la raison du retour..."
                        rows={4}
                        className="border-2 focus:border-[#ff6600] transition-all duration-300 resize-none"
                      />
                    </div>

                                         <Button
                       type="submit"
                       disabled={isSubmitting || !orderNumber || !returnReason}
                       className="w-full bg-[#ff6600] hover:bg-[#e55a00] py-3 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105"
                     >
                       {isSubmitting ? (
                         <div className="flex items-center space-x-2">
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           <span>Traitement en cours...</span>
                         </div>
                       ) : (
                         <div className="flex items-center space-x-2">
                           <RotateCcw className="h-5 w-5 animate-pulse" />
                           <span>Initier le retour</span>
                           <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300 animate-float" />
                         </div>
                       )}
                     </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What can be returned */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Que peut-on retourner ?</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                                 <CardTitle className="flex items-center space-x-2 text-green-600">
                   <CheckCircle className="h-5 w-5 animate-pulse" />
                   <span className="hover:text-green-700 transition-colors duration-300">Produits acceptés</span>
                 </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                                     <li className="flex items-center space-x-2 group">
                     <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits dans leur état d'origine</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits défectueux</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits ne correspondant pas à la description</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits endommagés lors de la livraison</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Commandes en double</span>
                   </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                                 <CardTitle className="flex items-center space-x-2 text-red-600">
                   <XCircle className="h-5 w-5 animate-pulse" />
                   <span className="hover:text-red-700 transition-colors duration-300">Produits non acceptés</span>
                 </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                                     <li className="flex items-center space-x-2 group">
                     <XCircle className="h-4 w-4 text-red-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits personnalisés</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <XCircle className="h-4 w-4 text-red-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits utilisés ou endommagés</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <XCircle className="h-4 w-4 text-red-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits de santé et hygiène</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <XCircle className="h-4 w-4 text-red-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits numériques</span>
                   </li>
                   <li className="flex items-center space-x-2 group">
                     <XCircle className="h-4 w-4 text-red-500 group-hover:animate-bounce" />
                     <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Produits périssables</span>
                   </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Questions fréquentes</h2>
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Combien de temps ai-je pour retourner un produit ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Vous avez 14 jours à compter de la réception de votre commande pour initier un retour.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Les frais de retour sont-ils gratuits ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Les frais de retour sont gratuits pour les produits défectueux ou ne correspondant pas à la description. Pour les autres cas, les frais sont à votre charge.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Combien de temps pour recevoir le remboursement ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Le remboursement est traité sous 5-7 jours ouvrés après réception du retour par nos services.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Puis-je échanger un produit au lieu d'un remboursement ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Oui, vous pouvez demander un échange lors de l'initiation du retour. Nous vous proposerons des produits similaires disponibles.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Besoin d'aide pour votre retour ?</h2>
          <p className="text-xl mb-6 opacity-90">
            Notre équipe support est là pour vous accompagner
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
              className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg"
            >
              <FileText className="mr-2 h-5 w-5" />
              Voir la politique complète
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
              Notre équipe support est là pour vous aider avec vos retours
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
                          window.open('mailto:support@probooster.online?subject=Question sur les retours&body=Bonjour,\n\nJ\'ai une question concernant les retours de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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
                      Pour les questions urgentes concernant les retours, nous recommandons d'utiliser le téléphone. 
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
                window.open('mailto:support@probooster.online?subject=Question sur les retours&body=Bonjour,\n\nJ\'ai une question concernant les retours de Probooster.\n\nMerci de votre aide.\n\nCordialement,', '_blank');
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