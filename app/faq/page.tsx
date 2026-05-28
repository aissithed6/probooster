"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageCircle, 
  ShoppingCart, 
  Gift, 
  CreditCard, 
  Truck, 
  Package, 
  Users, 
  Shield, 
  Star, 
  TrendingUp, 
  ArrowRight,
  FileText,
  Phone,
  Mail,
  Clock,
  Award,
  Heart,
  Sparkles
} from "lucide-react"

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("general")
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const categories = [
    {
      id: "general",
      title: "Général",
      icon: HelpCircle,
      color: "from-blue-500 to-cyan-500",
      count: 8
    },
    {
      id: "account",
      title: "Compte & Profil",
      icon: Users,
      color: "from-green-500 to-emerald-500",
      count: 6
    },
    {
      id: "shopping",
      title: "Shopping",
      icon: ShoppingCart,
      color: "from-orange-500 to-red-500",
      count: 10
    },
    {
      id: "points",
      title: "Système de Points",
      icon: Gift,
      color: "from-purple-500 to-violet-500",
      count: 7
    },
    {
      id: "payment",
      title: "Paiement",
      icon: CreditCard,
      color: "from-yellow-500 to-orange-500",
      count: 5
    },
    {
      id: "shipping",
      title: "Livraison",
      icon: Truck,
      color: "from-indigo-500 to-purple-500",
      count: 6
    }
  ]

  const faqs = {
    general: [
      {
        question: "Qu'est-ce que Probooster ?",
        answer: "Probooster est une marketplace innovante qui révolutionne le commerce en ligne avec son système de points unique. Nous proposons des milliers de produits de qualité avec des fonctionnalités sociales avancées et un système de récompenses intégré."
      },
      {
        question: "Comment fonctionne le système de points ?",
        answer: "Le système de points vous permet de gagner des points à chaque achat, partage sur les réseaux sociaux, et participation à la communauté. Ces points peuvent être échangés contre des réductions, des produits gratuits, ou des avantages exclusifs."
      },
      {
        question: "Probooster est-il sécurisé ?",
        answer: "Oui, Probooster utilise les dernières technologies de sécurité pour protéger vos données et vos transactions. Tous nos paiements sont cryptés et nous respectons les normes de sécurité les plus strictes."
      },
      {
        question: "Comment contacter le support client ?",
        answer: "Vous pouvez nous contacter via le chat en ligne disponible 24h/24, par email à support@probooster.online, ou par téléphone au +229 91 50 57 57 24h/24 et 7j/7."
      },
      {
        question: "Probooster livre-t-il dans toute la Abomey-Calavi, Bénin ?",
        answer: "Oui, nous livrons dans toute la Abomey-Calavi, Bénin. Les délais et frais de livraison varient selon votre localisation. Consultez notre page de livraison pour plus de détails."
      },
      {
        question: "Quels sont les moyens de paiement acceptés ?",
        answer: "Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, Orange Money, MTN Mobile Money, Moov Money, et les paiements en espèces à la livraison."
      },
      {
        question: "Comment puis-je signaler un problème ?",
        answer: "Pour signaler un problème, utilisez notre formulaire de contact, le chat en ligne, ou appelez notre service client. Nous traitons toutes les demandes dans les plus brefs délais."
      },
      {
        question: "Probooster propose-t-il des garanties ?",
        answer: "Oui, tous nos produits bénéficient d'une garantie constructeur. De plus, notre politique de retour de 14 jours vous offre une protection supplémentaire."
      }
    ],
    account: [
      {
        question: "Comment créer un compte sur Probooster ?",
        answer: "Pour créer un compte, cliquez sur 'Se connecter' en haut à droite, puis sur 'Créer un compte'. Remplissez le formulaire avec vos informations personnelles et validez votre email."
      },
      {
        question: "Comment modifier mes informations personnelles ?",
        answer: "Connectez-vous à votre compte, allez dans 'Mon profil', puis cliquez sur 'Modifier'. Vous pouvez alors mettre à jour vos informations personnelles, adresse, et préférences."
      },
      {
        question: "Comment réinitialiser mon mot de passe ?",
        answer: "Sur la page de connexion, cliquez sur 'Mot de passe oublié'. Entrez votre email et suivez les instructions reçues par email pour créer un nouveau mot de passe."
      },
      {
        question: "Comment supprimer mon compte ?",
        answer: "Pour supprimer votre compte, contactez notre service client. Nous traiterons votre demande sous 48h après vérification de votre identité."
      },
      {
        question: "Comment activer la double authentification ?",
        answer: "Dans votre profil, allez dans 'Sécurité' et activez l'authentification à deux facteurs. Vous recevrez un code par SMS à chaque connexion."
      },
      {
        question: "Comment gérer mes notifications ?",
        answer: "Dans les paramètres de votre compte, section 'Notifications', vous pouvez choisir quels types de notifications recevoir et par quel canal (email, SMS, push)."
      }
    ],
    shopping: [
      {
        question: "Comment effectuer un achat ?",
        answer: "Parcourez nos catégories, ajoutez les produits désirés à votre panier, puis procédez au paiement. Vous pouvez payer avec points ou argent selon vos préférences."
      },
      {
        question: "Comment annuler une commande ?",
        answer: "Vous pouvez annuler une commande dans les 2h suivant la passation via votre espace 'Mes commandes'. Après ce délai, contactez notre service client."
      },
      {
        question: "Comment suivre ma commande ?",
        answer: "Connectez-vous à votre compte, allez dans 'Mes commandes', et cliquez sur la commande concernée. Vous verrez le statut en temps réel et le numéro de suivi."
      },
      {
        question: "Comment laisser un avis sur un produit ?",
        answer: "Après réception de votre commande, vous recevrez un email vous invitant à laisser un avis. Vous pouvez aussi le faire depuis 'Mes commandes'."
      },
      {
        question: "Comment comparer des produits ?",
        answer: "Utilisez la fonction 'Comparer' en cochant les produits que vous souhaitez comparer. Une page dédiée s'ouvrira avec tous les détails côte à côte."
      },
      {
        question: "Comment créer une liste de souhaits ?",
        answer: "Cliquez sur l'icône cœur à côté des produits pour les ajouter à votre liste de souhaits. Accédez-y depuis votre profil pour gérer vos favoris."
      },
      {
        question: "Comment utiliser les codes promo ?",
        answer: "Lors du paiement, entrez votre code promo dans le champ prévu. Les réductions s'appliquent automatiquement à votre commande."
      },
      {
        question: "Comment acheter en gros ?",
        answer: "Pour les achats en gros, contactez notre service commercial. Nous proposons des tarifs préférentiels pour les commandes importantes."
      },
      {
        question: "Comment signaler un produit défectueux ?",
        answer: "Contactez immédiatement notre service client avec le numéro de commande et des photos du problème. Nous traiterons votre demande en priorité."
      },
      {
        question: "Comment demander un échange ?",
        answer: "Dans 'Mes commandes', sélectionnez la commande concernée et cliquez sur 'Échanger'. Choisissez le nouveau produit et suivez les instructions."
      }
    ],
    points: [
      {
        question: "Comment gagner des points ?",
        answer: "Vous gagnez des points en achetant (1 point par 100 F CFA), en partageant des produits sur les réseaux sociaux, en laissant des avis, et en participant à nos événements."
      },
      {
        question: "Comment utiliser mes points ?",
        answer: "Lors du paiement, choisissez 'Payer avec points'. Vous pouvez utiliser vos points pour obtenir des réductions ou des produits gratuits selon leur valeur."
      },
      {
        question: "Les points expirent-ils ?",
        answer: "Non, vos points n'expirent jamais. Vous pouvez les utiliser quand vous le souhaitez, sans limite de temps."
      },
      {
        question: "Comment voir mon solde de points ?",
        answer: "Votre solde de points est visible en haut à droite de l'écran, dans votre profil, et lors du paiement. Il se met à jour en temps réel."
      },
      {
        question: "Puis-je transférer mes points ?",
        answer: "Non, les points sont personnels et ne peuvent pas être transférés à un autre compte pour des raisons de sécurité."
      },
      {
        question: "Comment obtenir plus de points ?",
        answer: "Participez à nos événements, parrainez des amis, partagez régulièrement, et achetez plus pour accumuler des points plus rapidement."
      },
      {
        question: "Que faire si mes points ne s'affichent pas ?",
        answer: "Contactez notre service client avec votre numéro de commande. Nous vérifierons et corrigerons votre solde de points si nécessaire."
      }
    ],
    payment: [
      {
        question: "Quels moyens de paiement acceptez-vous ?",
        answer: "Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, Orange Money, MTN Mobile Money, Moov Money, et les paiements en espèces à la livraison."
      },
      {
        question: "Les paiements sont-ils sécurisés ?",
        answer: "Oui, tous nos paiements sont sécurisés par un cryptage SSL de niveau bancaire. Nous ne stockons jamais vos informations de carte bancaire."
      },
      {
        question: "Comment obtenir un reçu ?",
        answer: "Votre reçu est automatiquement envoyé par email après la confirmation de votre commande. Vous pouvez aussi le télécharger depuis 'Mes commandes'."
      },
      {
        question: "Comment demander un remboursement ?",
        answer: "Contactez notre service client avec votre numéro de commande et la raison du remboursement. Nous traiterons votre demande sous 48h."
      },
      {
        question: "Puis-je payer en plusieurs fois ?",
        answer: "Oui, nous proposons le paiement en 3 ou 4 fois sans frais pour les commandes supérieures à 50 000 F CFA."
      }
    ],
    shipping: [
      {
        question: "Quels sont les délais de livraison ?",
        answer: "Les délais varient selon votre localisation : 1-2 jours pour Abomey-Calavi, 2-3 jours pour les autres villes, 3-5 jours pour les zones rurales."
      },
      {
        question: "Les frais de livraison sont-ils gratuits ?",
        answer: "La livraison est gratuite pour Abomey-Calavi à partir de 25 000 F CFA d'achat. Pour les autres zones, des frais s'appliquent selon la distance."
      },
      {
        question: "Comment suivre ma livraison ?",
        answer: "Utilisez le numéro de suivi fourni dans l'email de confirmation ou dans 'Mes commandes'. Le suivi est disponible en temps réel."
      },
      {
        question: "Puis-je choisir l'heure de livraison ?",
        answer: "Oui, lors de la commande, vous pouvez choisir une plage horaire de livraison selon les disponibilités de votre zone."
      },
      {
        question: "Que faire si je ne suis pas là ?",
        answer: "Le livreur tentera 3 livraisons. Si vous êtes absent, le colis sera déposé dans un point relais proche de votre adresse."
      },
      {
        question: "Comment signaler un problème de livraison ?",
        answer: "Contactez immédiatement notre service client avec votre numéro de commande et décrivez le problème. Nous résoudrons la situation rapidement."
      }
    ]
  }

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id)
  }

  const filteredFaqs = searchQuery 
    ? Object.values(faqs).flat().filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs[activeCategory as keyof typeof faqs] || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
                     <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-6 animate-fade-in-up">
             <HelpCircle className="h-5 w-5 animate-pulse animate-float" />
             <span className="font-semibold group-hover:text-shimmer">FAQ</span>
             <HelpCircle className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
           </div>
                     <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
             Questions <span className="text-[#ff6600] animate-pulse">fréquentes</span>
           </h1>
           <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 hover:text-gray-800 transition-colors duration-300">
             Trouvez rapidement des réponses à vos questions sur Probooster
           </p>
        </div>

        {/* Search Bar */}
                 <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-600">
           <div className="relative group">
             <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:animate-pulse" />
             <Input
               type="search"
               placeholder="Rechercher dans la FAQ..."
               className="pl-12 pr-4 py-4 text-lg border-2 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-50"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
           </div>
         </div>

        {/* Categories */}
                 {!searchQuery && (
           <div className="mb-12">
             <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">Catégories</h2>
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {categories.map((category, index) => (
                 <Card 
                   key={category.id}
                   className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group ${
                     activeCategory === category.id ? 'ring-2 ring-[#ff6600]' : ''
                   }`}
                   onClick={() => setActiveCategory(category.id)}
                 >
                   <CardHeader>
                     <div className="flex items-center space-x-4">
                       <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                         <category.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                       </div>
                       <div>
                         <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{category.title}</CardTitle>
                         <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{category.count} questions</p>
                       </div>
                     </div>
                   </CardHeader>
                 </Card>
               ))}
             </div>
           </div>
         )}

        {/* FAQ List */}
                 <div className="mb-16">
           <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center hover:text-[#ff6600] transition-colors duration-300">
             {searchQuery ? `Résultats pour "${searchQuery}"` : `Questions - ${categories.find(c => c.id === activeCategory)?.title}`}
           </h2>
           <div className="max-w-4xl mx-auto space-y-4">
             {filteredFaqs.map((faq, index) => (
               <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                 <CardHeader 
                   className="cursor-pointer"
                   onClick={() => toggleFaq(`faq-${index}`)}
                 >
                   <div className="flex items-center justify-between">
                     <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{faq.question}</CardTitle>
                     {expandedFaq === `faq-${index}` ? (
                       <ChevronUp className="h-5 w-5 text-[#ff6600] animate-bounce" />
                     ) : (
                       <ChevronDown className="h-5 w-5 text-gray-400 group-hover:animate-pulse" />
                     )}
                   </div>
                 </CardHeader>
                 {expandedFaq === `faq-${index}` && (
                   <CardContent>
                     <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{faq.answer}</p>
                   </CardContent>
                 )}
               </Card>
             ))}
           </div>
         </div>

        {/* Contact CTA */}
                 <div className="bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-2xl p-8 text-center text-white">
           <h2 className="text-3xl font-bold mb-4 hover:text-shimmer transition-all duration-300">Vous n'avez pas trouvé votre réponse ?</h2>
           <p className="text-xl mb-6 opacity-90 hover:opacity-100 transition-opacity duration-300">
             Notre équipe support est là pour vous aider
           </p>
                       <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="secondary" 
                size="lg"
                className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
                onClick={() => window.open('https://probooster.online', '_blank')}
              >
                <MessageCircle className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                <span className="group-hover:translate-x-1 transition-transform duration-300">Chat en ligne</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
                onClick={() => window.open('mailto:support@probooster.online', '_blank')}
              >
                <Mail className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                <span className="group-hover:translate-x-1 transition-transform duration-300">Envoyer un email</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group transition-all duration-300 hover:scale-105"
                onClick={() => window.open('tel:+22991505757', '_blank')}
              >
                <Phone className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                <span className="group-hover:translate-x-1 transition-transform duration-300">Appeler</span>
              </Button>
            </div>
         </div>
      </div>
    </div>
  )
} 