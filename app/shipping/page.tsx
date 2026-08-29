"use client"

import { useState, useMemo, useEffect } from "react"
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
  X,
  Warehouse,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useDeliveryConfig } from "@/contexts/DeliveryConfigContext"
import { useMoney } from "@/lib/hooks/use-money"
import { ClientDeliveryService, type ClientDelivery } from "@/lib/services/client-delivery-service"
import { toast } from "react-hot-toast"
import { usePublicGlobalSettings } from "@/contexts/PublicGlobalSettingsContext"

export default function ShippingPage() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [isTracking, setIsTracking] = useState(false)
  const [trackingResult, setTrackingResult] = useState<ClientDelivery | null>(null)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const { deliveryRules, pickupConfig, isLoading: configLoading } = useDeliveryConfig()
  const { formatMoney } = useMoney()
  const { data: globalSettings } = usePublicGlobalSettings()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isLoading = !isMounted || configLoading

  // Informations de contact synchronisées
  const contact = useMemo(() => {
    const info = globalSettings?.contactInfo
    return {
      email: info?.email || 'support@probooster.online',
      phone: info?.phone || '+229 91 50 57 57',
      address: `${info?.address || 'Abomey-Calavi'}, ${info?.city || 'Bénin'}`,
      website: 'https://probooster.online'
    }
  }, [globalSettings])

  // Transformation des règles de livraison en options d'affichage
  const shippingOptions = useMemo(() => {
    if (!deliveryRules || deliveryRules.length === 0) return []

    // Groupement par mode
    const modes = ['standard', 'express']
    return modes.map(mode => {
      const rules = deliveryRules.filter(r => r.mode === mode && r.isActive)
      if (rules.length === 0) return null

      // On prend la règle la plus représentative (ex: prix minimum)
      const minPrice = Math.min(...rules.map(r => r.price))
      const exampleRule = rules.find(r => r.price === minPrice) || rules[0]
      
      const isExpress = mode === 'express'
      
      return {
        id: mode,
        name: isExpress ? "Livraison Express" : "Livraison Standard",
        description: isExpress ? "Livraison ultra-rapide" : "Livraison fiable au meilleur prix",
        price: formatMoney(minPrice),
        time: exampleRule.etaMaxDays ? `${exampleRule.etaMinDays || 1}-${exampleRule.etaMaxDays} jours` : "Délai variable",
        icon: isExpress ? Zap : Truck,
        color: isExpress ? "from-red-500 to-pink-500" : "from-blue-500 to-cyan-500",
        features: [
          isExpress ? "Priorité absolue" : "Suivi standard",
          `À partir de ${formatMoney(minPrice)}`,
          "Assurance incluse",
          "Livraison sécurisée"
        ],
        popular: isExpress
      }
    }).filter(Boolean)
  }, [deliveryRules, formatMoney])

  // Zones de livraison basées sur les règles réelles
  const deliveryZones = useMemo(() => {
    if (!deliveryRules || deliveryRules.length === 0) return []

    const zoneTypes = ['local', 'regional', 'national', 'international']
    const zones = zoneTypes.map(zType => {
      const rules = deliveryRules.filter(r => r.zone === zType && r.isActive)
      if (rules.length === 0) return null

      const minPrice = Math.min(...rules.map(r => r.price))
      const exampleRule = rules.find(r => r.price === minPrice) || rules[0]
      
      let label = "Zone"
      let color = "from-gray-500 to-gray-600"
      
      if (zType === 'local') { label = "Livraison Locale"; color = "from-green-500 to-emerald-500"; }
      else if (zType === 'regional') { label = "Régional"; color = "from-blue-500 to-cyan-500"; }
      else if (zType === 'national') { label = "National"; color = "from-orange-500 to-red-500"; }
      else if (zType === 'international') { label = "International"; color = "from-purple-500 to-indigo-500"; }

      return {
        id: zType,
        name: label,
        time: exampleRule.etaMaxDays ? `${exampleRule.etaMinDays || 1}-${exampleRule.etaMaxDays} j` : "Variable",
        price: minPrice === 0 ? "Gratuit" : formatMoney(minPrice),
        icon: zType === 'international' ? Globe : MapPin,
        color: color
      }
    }).filter(Boolean)

    return zones
  }, [deliveryRules, formatMoney])

  // Points de retrait réels
  const pickupPoints = useMemo(() => {
    if (!pickupConfig?.enabled || !Array.isArray(pickupConfig?.points)) return []
    return pickupConfig.points.filter((p: any) => p.isActive).map((p: any) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      city: p.city,
      time: "Immédiat après préparation",
      price: "Gratuit",
      icon: Warehouse,
      color: "from-amber-500 to-orange-600"
    }))
  }, [pickupConfig])

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

  const handleTrackPackage = async () => {
    if (!trackingNumber.trim()) return

    setIsTracking(true)
    setTrackingResult(null)
    
    try {
      const { data } = await ClientDeliveryService.getByTrackingNumber(trackingNumber.trim())
      if (!data) {
        toast.error("Aucune livraison trouvée avec ce numéro de suivi.")
      } else {
        setTrackingResult(data)
        toast.success("Informations de suivi récupérées.")
      }
    } catch (error: any) {
      console.error("❌ Tracking error:", error)
      toast.error(error.message || "Une erreur est survenue lors du suivi.")
    } finally {
      setIsTracking(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string, color: string }> = {
      'pending': { label: 'En attente', color: 'bg-gray-100 text-gray-600' },
      'confirmed': { label: 'Confirmé', color: 'bg-blue-100 text-blue-600' },
      'preparing': { label: 'En préparation', color: 'bg-yellow-100 text-yellow-600' },
      'dispatched': { label: 'Expédié', color: 'bg-purple-100 text-purple-600' },
      'in_transit': { label: 'En transit', color: 'bg-orange-100 text-orange-600' },
      'delivered': { label: 'Livré', color: 'bg-green-100 text-green-600' },
      'cancelled': { label: 'Annulé', color: 'bg-red-100 text-red-600' }
    }
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative z-[10]">
      <div className="container mx-auto px-4 py-8 relative z-[20]">
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
          {shippingStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center group">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <Icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">{stat.value}</div>
                <div className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Shipping Options */}
        <div className="mb-16" id="tarifs">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Options de livraison</h2>
          
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-0 shadow-lg animate-pulse h-[400px] bg-gray-100"></Card>
              ))}
            </div>
          ) : shippingOptions.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shippingOptions.map((option, index) => {
                if (!option) return null
                const Icon = option.icon
                return (
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
                        <Icon className="h-8 w-8 text-white group-hover:animate-bounce" />
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
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune option de livraison disponible pour le moment.</p>
            </div>
          )}
        </div>

        {/* Delivery Zones */}
        {isMounted && deliveryZones.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Zones de livraison</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {deliveryZones.map((zone, index) => {
                const Icon = zone.icon
                return (
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
                          <Icon className="h-6 w-6 text-white group-hover:animate-bounce" />
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
                )
              })}
            </div>
          </div>
        )}

        {/* Pickup Points */}
        {isMounted && pickupPoints.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Points de retrait</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pickupPoints.map((point, index) => (
                <Card 
                  key={point.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${point.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                        <Warehouse className="h-6 w-6 text-white group-hover:animate-bounce" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{point.name}</CardTitle>
                        <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{point.city}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{point.address}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm text-gray-500 italic">{point.time}</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">{point.price}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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
                     onKeyDown={(e) => e.key === 'Enter' && handleTrackPackage()}
                     className="flex-1 border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
                   />
                   <Button 
                     onClick={handleTrackPackage}
                     disabled={isTracking || !trackingNumber.trim()}
                     className="bg-[#ff6600] hover:bg-[#e55a00] group transition-all duration-300 hover:scale-105 min-w-[120px]"
                   >
                     {isTracking ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                     ) : (
                       <>
                         <span className="group-hover:translate-x-1 transition-transform duration-300">Suivre</span>
                         <ArrowRight className="ml-2 h-4 w-4 group-hover:animate-bounce" />
                       </>
                     )}
                   </Button>
                 </div>

                 {/* Tracking Results */}
                 {trackingResult && (
                   <div className="mt-8 space-y-6 animate-fade-in-up">
                     <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                       <div>
                         <p className="text-sm text-gray-500">Statut actuel</p>
                         <div className="flex items-center gap-2 mt-1">
                           <Badge className={getStatusLabel(trackingResult.status).color}>
                             {getStatusLabel(trackingResult.status).label}
                           </Badge>
                           <span className="text-sm font-medium">{trackingResult.orderNumber}</span>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className="text-sm text-gray-500">Dernière mise à jour</p>
                         <p className="text-sm font-medium">{new Date(trackingResult.updatedAt).toLocaleString('fr-FR')}</p>
                       </div>
                     </div>

                     <div className="space-y-4">
                       <h4 className="font-semibold flex items-center gap-2">
                         <Clock className="h-4 w-4 text-[#ff6600]" />
                         Historique des événements
                       </h4>
                       <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6">
                         {trackingResult.events.length > 0 ? trackingResult.events.map((event, idx) => (
                           <div key={event.id} className="relative">
                             <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ${idx === 0 ? 'bg-[#ff6600] animate-pulse' : 'bg-gray-300'}`}></div>
                             <div className="space-y-1">
                               <p className="text-sm font-bold text-gray-900">{event.status}</p>
                               <p className="text-sm text-gray-600">{event.description}</p>
                               <div className="flex items-center gap-4 text-[10px] text-gray-400">
                                 <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.occurredAt!).toLocaleDateString('fr-FR')}</span>
                                 <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(event.occurredAt!).toLocaleTimeString('fr-FR', { hour: '2-2-digit', minute: '2-2-digit' })}</span>
                                 {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
                               </div>
                             </div>
                           </div>
                         )) : (
                           <div className="text-sm text-gray-500 italic">Aucun événement enregistré.</div>
                         )}
                       </div>
                     </div>
                   </div>
                 )}
               </CardContent>
             </Card>
           </div>
         </div>

        {/* Tracking Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Processus de livraison</h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              {trackingSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.step} className="text-center relative group">
                    {index < trackingSteps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 z-0"></div>
                    )}
                    <div className="relative z-10">
                      <div className={`w-16 h-16 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.4}s` }}>
                        <Icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">{step.title}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{step.description}</p>
                    </div>
                  </div>
                )
              })}
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
              asChild
            >
              <Link href="#tarifs">
                <Package className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                <span className="group-hover:translate-x-1 transition-transform duration-300">Voir nos tarifs</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          {/* Header fixe */}
          <DialogHeader className="p-6 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Contactez-nous
            </DialogTitle>
            <DialogDescription className="text-center text-orange-50 opacity-90">
              Notre équipe logistique est là pour vous aider avec vos questions de livraison
            </DialogDescription>
          </DialogHeader>

          {/* Corps du modal avec scroll interne */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Méthodes de contact principales */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <MessageCircle className="h-5 w-5 text-[#ff6600]" />
                  Méthodes de contact
                </h3>
                
                {/* Email */}
                <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-[#ff6600] overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#ff6600]/10 rounded-full shrink-0">
                          <Mail className="h-5 w-5 text-[#ff6600]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">Email</h4>
                          <p className="text-sm text-gray-600 truncate">{contact.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[#ff6600] border-[#ff6600] hover:bg-[#ff6600] hover:text-white transition-colors"
                          onClick={() => {
                            window.open(`mailto:${contact.email}?subject=Question sur la livraison&body=Bonjour,\n\nJ'ai une question concernant la livraison de Probooster.\n\nMerci de votre aide.\n\nCordialement,`, '_blank');
                          }}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Envoyer
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-gray-100"
                          onClick={() => {
                            navigator.clipboard.writeText(contact.email);
                            toast.success('Email copié !');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Téléphone */}
                <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-full shrink-0">
                          <Phone className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">Téléphone</h4>
                          <p className="text-sm text-gray-600 truncate">{contact.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-500 border-green-500 hover:bg-green-500 hover:text-white transition-colors"
                          onClick={() => {
                            window.open(`tel:${contact.phone.replace(/\s/g, '')}`, '_blank');
                          }}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Appeler
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-gray-100"
                          onClick={() => {
                            navigator.clipboard.writeText(contact.phone);
                            toast.success('Numéro copié !');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Site Web */}
                <Card className="hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-full shrink-0">
                          <GlobeIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">Site Web</h4>
                          <p className="text-sm text-gray-600 truncate">{contact.website}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                          onClick={() => {
                            window.open(contact.website, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Visiter
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:bg-gray-100"
                          onClick={() => {
                            navigator.clipboard.writeText(contact.website);
                            toast.success('URL copiée !');
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
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                  <Info className="h-5 w-5 text-[#ff6600]" />
                  Informations utiles
                </h3>

                <div className="grid gap-4">
                  {/* Adresse */}
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="p-2 bg-[#ff6600]/10 rounded-full shrink-0">
                      <MapPin className="h-5 w-5 text-[#ff6600]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Adresse</h4>
                      <p className="text-sm text-gray-600">{contact.address}</p>
                    </div>
                  </div>

                  {/* Horaires */}
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <div className="p-2 bg-[#ff6600]/10 rounded-full shrink-0">
                      <Clock className="h-5 w-5 text-[#ff6600]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Horaires de support</h4>
                      <p className="text-sm text-gray-600">Lun-Ven: 8h-18h | Sam: 9h-15h</p>
                    </div>
                  </div>

                  {/* Note importante */}
                  <div className="p-5 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Info className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-blue-900 mb-2">Conseil de l'équipe</h4>
                        <p className="text-sm text-blue-800 leading-relaxed">
                          Pour les questions **urgentes** concernant votre livraison en cours, nous recommandons vivement d'utiliser le **téléphone**. 
                          Pour toute autre demande, notre support email vous répondra sous 24h.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer fixe */}
          <div className="p-6 bg-white border-t flex flex-col sm:flex-row justify-center gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={() => setContactModalOpen(false)}
              className="flex items-center gap-2 h-11 px-8 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Fermer la fenêtre
            </Button>
            <Button
              onClick={() => {
                window.open(`mailto:${contact.email}?subject=Question sur la livraison&body=Bonjour,\n\nJ'ai une question concernant la livraison de Probooster.\n\nMerci de votre aide.\n\nCordialement,`, '_blank');
                setContactModalOpen(false);
              }}
              className="bg-gradient-to-r from-[#ff6600] to-orange-500 hover:from-orange-600 hover:to-red-600 text-white flex items-center gap-2 h-11 px-8 shadow-md hover:shadow-lg transition-all duration-300"
            >
              <Mail className="h-4 w-4" />
              Envoyer une demande par email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 