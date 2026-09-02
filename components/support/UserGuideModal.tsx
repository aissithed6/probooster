"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen,
  ShoppingCart,
  Users,
  Coins,
  MessageCircle,
  Settings,
  Shield,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Star,
  Zap,
  Gift,
  TrendingUp,
  HelpCircle
} from "lucide-react"

interface UserGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const guideSections = [
  {
    id: "getting-started",
    title: "Demarrage",
    icon: Star,
    steps: [
      { number: "01", title: "Creez votre compte", description: "Inscrivez-vous gratuitement en quelques secondes avec votre email ou numero de telephone.", tip: "Utilisez une adresse email valide pour recevoir vos notifications." },
      { number: "02", title: "Explorez le catalogue", description: "Parcourez des milliers de produits organises par categories avec des filtres avances.", tip: "Utilisez la barre de recherche pour trouver rapidement ce que vous cherchez." },
      { number: "03", title: "Ajoutez au panier", description: "Selectionnez vos produits et ajoutez-les a votre panier en un clic.", tip: "Vous pouvez modifier les quantites directement dans votre panier." },
      { number: "04", title: "Passez commande", description: "Finalisez votre achat avec nos methodes de paiement securisees.", tip: "Activez la livraison gratuite pour les commandes superieures a 50 000 F CFA." }
    ]
  },
  {
    id: "orders",
    title: "Commandes",
    icon: ShoppingCart,
    steps: [
      { number: "01", title: "Passer une commande", description: "Selectionnez vos produits, choisissez le mode de livraison et payez en toute securite.", tip: "Verifiez votre panier avant de finaliser pour eviter les erreurs." },
      { number: "02", title: "Suivre votre livraison", description: "Suivez en temps reel l'etat de votre commande : confirmee, en preparation, expediee, livree.", tip: "Recevez des notifications a chaque etape de votre livraison." },
      { number: "03", title: "Historique", description: "Consultez l'historique complet de vos commandes passees.", tip: "Vous pouvez repasser une commande precedente en un clic." },
      { number: "04", title: "Retours", description: "Initiez un retour sous 14 jours si le produit ne vous convient pas.", tip: "Contactez le support pour toute question sur les retours." }
    ]
  },
  {
    id: "points",
    title: "Points",
    icon: Coins,
    steps: [
      { number: "01", title: "Gagner des points", description: "Partagez des produits sur les reseaux sociaux pour gagner des points.", tip: "Facebook +50, WhatsApp +30, Instagram +45, Twitter +40 points." },
      { number: "02", title: "Convertir en argent", description: "1 point = 2 F CFA. Convertissez vos points des que vous atteignez le seuil.", tip: "Le seuil de conversion est de 5 000 F CFA." },
      { number: "03", title: "Payer avec les points", description: "Utilisez vos points comme moyen de paiement pour vos achats.", tip: "Combinez points et paiement classique pour plus de flexibilite." },
      { number: "04", title: "Parrainage", description: "Parrainez vos amis et gagnez des bonus de parrainage.", tip: "Chaque ami parraine vous rapporte 100 points bonus." }
    ]
  },
  {
    id: "account",
    title: "Mon Compte",
    icon: Settings,
    steps: [
      { number: "01", title: "Profil utilisateur", description: "Mettez a jour vos informations personnelles et photo de profil.", tip: "Un profil complet augmente la confiance des vendeurs." },
      { number: "02", title: "Securite", description: "Activez l'authentification a deux facteurs et gerez vos sessions.", tip: "Changez regulierement votre mot de passe." },
      { number: "03", title: "Notifications", description: "Configurez vos preferences de notification : email, SMS, push.", tip: "Restez informe des offres speciales." },
      { number: "04", title: "Adresses", description: "Gerez vos adresses de livraison pour un passage de commande plus rapide.", tip: "Definissez une adresse par defaut pour gagner du temps." }
    ]
  },
  {
    id: "support",
    title: "Support",
    icon: MessageCircle,
    steps: [
      { number: "01", title: "Chat en direct", description: "Discutez en temps reel avec notre equipe de support 24h/24.", tip: "Le chat est le moyen le plus rapide pour obtenir de l'aide." },
      { number: "02", title: "Email", description: "Envoyez-nous un email detaille a support@probooster.online.", tip: "Reponse garantie sous 24 heures." },
      { number: "03", title: "Telephone", description: "Appelez-nous au +229 91 50 57 57 pour une assistance immediate.", tip: "Disponible 24h/24, 7j/7." },
      { number: "04", title: "FAQ", description: "Consultez notre base de connaissances pour des reponses rapides.", tip: "La reponse a votre question s'y trouve peut-etre deja." }
    ]
  }
]

export function UserGuideModal({ open, onOpenChange }: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState("getting-started")
  const [currentStep, setCurrentStep] = useState(0)

  const currentSection = guideSections.find(s => s.id === activeTab) || guideSections[0]
  const steps = currentSection.steps

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentStep(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-[#ff6600] to-orange-500">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="h-7 w-7" />
            Guide d&apos;utilisation Probooster
          </DialogTitle>
          <p className="text-orange-100 mt-1">Guide complet pour maitriser la plateforme</p>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-56 border-r bg-gray-50 p-3 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
              <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1">
                {guideSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="w-full justify-start px-3 py-2.5 data-[state=active]:bg-[#ff6600] data-[state=active]:text-white"
                  >
                    <section.icon className="h-4 w-4 mr-2" />
                    <span className="text-sm">{section.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full mb-4">
                  <currentSection.icon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{currentSection.title}</h2>
              </div>

              <div className="flex items-center justify-center gap-2 mb-8">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-3 rounded-full transition-all ${
                      index === currentStep ? "bg-[#ff6600] w-8" : index < currentStep ? "bg-[#ff6600]/50" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6 border border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {steps[currentStep].number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{steps[currentStep].title}</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">{steps[currentStep].description}</p>
                    <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">{steps[currentStep].tip}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Precedent
                </Button>
                <span className="text-sm text-gray-500">{currentStep + 1} / {steps.length}</span>
                <Button onClick={nextStep} disabled={currentStep === steps.length - 1} className="flex items-center gap-2 bg-[#ff6600] hover:bg-[#e55a00]">
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
