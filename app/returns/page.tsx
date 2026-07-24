"use client"

import { useState, type FormEvent, useEffect } from "react"
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
  X,
  AlertTriangle, 
  ArrowRight,
  Calendar,
  DollarSign,
  Shield,
  Truck,
  MessageCircle,
  FileText,
  Star,
  Heart,
  Users,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardService } from "@/lib/services/dashboard-service"
import { toast } from "react-hot-toast"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"

export default function ReturnsPage() {
  const { user } = useAuth()
  const [returnReason, setReturnReason] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [description, setDescription] = useState("")

  // Charger les commandes de l'utilisateur
  useEffect(() => {
    async function loadOrders() {
      if (!user) return
      setIsLoadingOrders(true)
      try {
        const orders = await DashboardService.getUserOrders(user.id)
        // Filtrer les commandes qui peuvent être retournées (ex: livrées)
        const returnableOrders = orders.filter(o => 
          o.status === 'delivered' || o.status === 'completed'
        )
        setUserOrders(returnableOrders)
      } catch (error) {
        console.error("❌ Erreur chargement commandes:", error)
      } finally {
        setIsLoadingOrders(false)
      }
    }
    loadOrders()
  }, [user])

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

  const handleSubmitReturn = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("Veuillez vous connecter pour initier un retour.")
      return
    }

    setIsSubmitting(true)
    
    try {
      const order = userOrders.find(o => o.id === selectedOrderId)
      if (!order) {
        toast.error("Commande introuvable.")
        return
      }

      const { error } = await DashboardService.createReturnRequest({
        orderId: order.id,
        userId: user.id,
        vendorId: order.vendor_id || "",
        reason: returnReason,
        description: description,
        refundCurrency: order.currency || "XOF"
      })

      if (error) throw error
      
      setSubmitted(true)
      toast.success("Votre demande de retour a été enregistrée.")
      
      setTimeout(() => {
        setSubmitted(false)
        setOrderNumber("")
        setSelectedOrderId(null)
        setReturnReason("")
        setDescription("")
      }, 5000)
    } catch (error) {
      toast.error("Une erreur est survenue lors de la soumission.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOrderSelect = (val: string) => {
    const order = userOrders.find(o => o.id === val)
    if (order) {
      setSelectedOrderId(order.id)
      setOrderNumber(order.order_number)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
            <RotateCcw className="h-5 w-5 animate-pulse" />
            <span className="font-semibold">RETOURS</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200">
            Politique de <span className="text-[#ff6600]">retour</span> simple
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Retournez vos produits facilement et obtenez un remboursement rapide
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 animate-fade-in-up animation-delay-600">
          {returnStats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className={`w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Return Policy */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Notre politique de retour</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {returnPolicy.map((policy, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <policy.icon className="h-8 w-8 text-[#ff6600]" />
                  </div>
                  <CardTitle className="text-lg">{policy.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center">{policy.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Return Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Processus de retour</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {returnSteps.map((step, index) => (
                <div key={step.step} className="text-center relative group">
                  {index < returnSteps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 z-0"></div>
                  )}
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className={`h-8 w-8 ${step.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
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
                  <RotateCcw className="h-5 w-5 text-[#ff6600]" />
                  <span>Demande de retour</span>
                </CardTitle>
                <p className="text-gray-600">Remplissez le formulaire ci-dessous pour initier votre retour</p>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Retour initié !</h3>
                    <p className="text-gray-600">Nous avons bien reçu votre demande pour la commande <strong>{orderNumber}</strong>. Nous vous enverrons un email avec les instructions.</p>
                    <Button 
                      variant="outline" 
                      className="mt-6"
                      onClick={() => setSubmitted(false)}
                    >
                      Faire un autre retour
                    </Button>
                  </div>
                ) : !user ? (
                  <div className="text-center py-12 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200">
                    <Users className="h-12 w-12 text-orange-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-orange-900 mb-2">Connexion requise</h3>
                    <p className="text-orange-700 mb-6 px-4 text-sm">Veuillez vous connecter à votre compte pour voir vos commandes et initier un retour.</p>
                    <Button asChild className="bg-[#ff6600] hover:bg-[#e55a00]">
                      <Link href="/auth/login">Se connecter</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReturn} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionnez une commande *</label>
                      {isLoadingOrders ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 p-2 border rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Chargement de vos commandes...
                        </div>
                      ) : userOrders.length > 0 ? (
                        <Select onValueChange={handleOrderSelect}>
                          <SelectTrigger className="w-full border-2 focus:ring-[#ff6600]">
                            <SelectValue placeholder="Choisir une commande livrée" />
                          </SelectTrigger>
                          <SelectContent>
                            {userOrders.map(order => (
                              <SelectItem key={order.id} value={order.id}>
                                {order.order_number} - {new Date(order.created_at).toLocaleDateString()} ({order.total_amount} {order.currency})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-100">
                          Vous n'avez aucune commande éligible au retour (livrée) pour le moment.
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Raison du retour *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {returnReasons.map((reason) => (
                          <Button
                            key={reason.id}
                            type="button"
                            variant={returnReason === reason.id ? "default" : "outline"}
                            className={`justify-start group transition-all duration-300 ${
                              returnReason === reason.id 
                                ? "bg-[#ff6600] text-white" 
                                : "border-gray-300 hover:border-[#ff6600]"
                            }`}
                            onClick={() => setReturnReason(reason.id)}
                          >
                            <reason.icon className="h-4 w-4 mr-2" />
                            <span className="truncate">{reason.name}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description du problème</label>
                      <Textarea
                        placeholder="Décrivez précisément l'état du produit ou la raison de votre insatisfaction..."
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="border-2 focus:border-[#ff6600] transition-all duration-300 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !orderNumber || !returnReason}
                      className="w-full bg-[#ff6600] hover:bg-[#e55a00] py-3 text-lg transition-all duration-300 shadow-md"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Traitement de votre demande...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <RotateCcw className="h-5 w-5" />
                          <span>Soumettre la demande de retour</span>
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </div>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
