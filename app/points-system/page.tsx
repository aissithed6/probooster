"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useClientPoints } from "@/lib/hooks/use-client-points"
import { useMoney } from "@/lib/hooks/use-money"
import { supabase } from "@/lib/supabase"
import { ClientPointsService, type ClientRewardOption } from "@/lib/services/client-points-service"
import { 
  Coins, 
  TrendingUp, 
  Gift, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Zap, 
  Users, 
  Share2, 
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
  FileText,
  DollarSign,
  Wallet,
  PiggyBank,
  Banknote,
  Calculator,
  PieChart,
  Activity,
  Trophy,
  Crown,
  Medal,
  Heart,
  ThumbsUp,
  MessageCircle,
  Bell,
  Eye,
  EyeOff
} from "lucide-react"

type LeaderboardEntry = {
  rank: number
  name: string
  points: number
  avatar: string
  level: string
}

/**
 * Page marketing/infos du système de points, avec affichage de la valeur estimée dans la devise utilisateur.
 */
export default function PointsSystemPage() {
  const [showPoints, setShowPoints] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState("bronze")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [dbRewards, setDbRewards] = useState<ClientRewardOption[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const { balance, estimatedValue, configuration } = useClientPoints()
  const { formatMoney, currencyCode } = useMoney()
  
  const userPoints = balance
  const pointsValue = estimatedValue ?? 0
  
  // Niveaux (seuils dynamiques si possible, sinon statiques)
  const nextLevel = 5000
  const progressPercentage = Math.min((userPoints / nextLevel) * 100, 100)

  // Configuration dynamique des gains
  const conversionRate = configuration?.settings?.conversionRate ?? 1
  const purchasePointsPer100 = configuration?.settings?.purchaseValue ?? 1
  const socialSharePoints = configuration?.settings?.socialShareValue ?? 50
  const withdrawalValue = configuration?.settings?.withdrawalValue ?? 1

  useEffect(() => {
    async function fetchData() {
      setIsDataLoading(true)
      try {
        // 1. Leaderboard
        const { data: lpData, error: lpError } = await supabase
          .from('loyalty_points')
          .select('points_balance, user_profiles!inner(first_name, last_name, avatar_url)')
          .order('points_balance', { ascending: false })
          .limit(5)

        if (!lpError && lpData) {
          const formattedLeaderboard = lpData.map((row: any, idx: number) => {
            const profile = row.user_profiles
            const points = Number(row.points_balance || 0)
            
            // Déterminer le niveau basé sur les points
            let level = "Bronze"
            if (points >= 100000) level = "Diamant"
            else if (points >= 50000) level = "Platine"
            else if (points >= 20000) level = "Or"
            else if (points >= 5000) level = "Argent"

            return {
              rank: idx + 1,
              name: `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Utilisateur',
              points,
              avatar: profile.avatar_url || "/placeholder-user.jpg",
              level
            }
          })
          setLeaderboard(formattedLeaderboard)
        }

        // 2. Récompenses
        const rewards = await ClientPointsService.listAvailableRewards()
        setDbRewards(rewards)

      } catch (err) {
        console.error("Erreur lors de la récupération des données de points:", err)
      } finally {
        setIsDataLoading(false)
      }
    }

    fetchData()
  }, [])

  const levels = [
    {
      name: "Bronze",
      icon: "🥉",
      minPoints: 0,
      maxPoints: 4999,
      benefits: [
        "Accès aux produits de base",
        "Support client standard",
        "Points de base sur les achats"
      ],
      color: "from-amber-500 to-orange-500"
    },
    {
      name: "Argent",
      icon: "🥈",
      minPoints: 5000,
      maxPoints: 19999,
      benefits: [
        "Réductions exclusives",
        "Support client prioritaire",
        "Points bonus +10%",
        "Livraison gratuite"
      ],
      color: "from-gray-400 to-gray-600"
    },
    {
      name: "Or",
      icon: "🥇",
      minPoints: 20000,
      maxPoints: 49999,
      benefits: [
        "Produits premium",
        "Support client VIP",
        "Points bonus +25%",
        "Livraison express gratuite",
        "Accès anticipé aux ventes"
      ],
      color: "from-yellow-400 to-yellow-600"
    },
    {
      name: "Platine",
      icon: "💎",
      minPoints: 50000,
      maxPoints: 99999,
      benefits: [
        "Tous les avantages Or",
        "Points bonus +50%",
        "Conciergerie personnelle",
        "Événements exclusifs",
        "Retours illimités"
      ],
      color: "from-purple-400 to-purple-600"
    },
    {
      name: "Diamant",
      icon: "👑",
      minPoints: 100000,
      maxPoints: 999999,
      benefits: [
        "Tous les avantages Platine",
        "Points bonus +100%",
        "Service client dédié",
        "Produits exclusifs",
        "Invitations VIP"
      ],
      color: "from-blue-400 to-blue-600"
    }
  ]

  const earningMethods = [
    {
      icon: ShoppingBag,
      title: "Achats",
      description: "Gagnez des points sur chaque achat",
      points: `${purchasePointsPer100} point(s) par 100 ${currencyCode}`,
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Share2,
      title: "Partage Social",
      description: "Partagez et gagnez des points",
      points: `${socialSharePoints} points par partage`,
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Parrainage",
      description: "Invitez des amis et gagnez",
      points: `500 points par parrain`,
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Star,
      title: "Avis & Évaluations",
      description: "Donnez votre avis et gagnez",
      points: "50 points par avis",
      color: "from-yellow-500 to-orange-500"
    }
  ]

  // Fusionner les récompenses statiques avec celles de la DB
  const rewards = useMemo(() => {
    const baseRewards = [
      {
        icon: Gift,
        title: "Réductions",
        description: "Échangez vos points contre des réductions",
        examples: ["10% sur tout", "Livraison gratuite", "Produits exclusifs"]
      },
      {
        icon: CreditCard,
        title: "Retrait en Argent",
        description: `Convertissez vos points en ${currencyCode}`,
        examples: [`1 point = ${withdrawalValue} ${currencyCode}`, `Retrait minimum ${configuration?.limits?.withdrawal?.min ?? 5000} pts`, "Paiement sécurisé"]
      }
    ]

    // Ajouter les récompenses de la DB
    const dbMapped = dbRewards.slice(0, 4).map(r => ({
      icon: Package,
      title: r.name,
      description: r.description || "Offre exclusive",
      examples: [`Coût: ${r.pointsCost} pts`, `Type: ${r.rewardType}`, `Valeur: ${r.value} ${r.valueType === 'percentage' ? '%' : currencyCode}`]
    }))

    return [...baseRewards, ...dbMapped].slice(0, 4)
  }, [dbRewards, withdrawalValue, currencyCode, configuration])

  const leaderboardToDisplay = leaderboard.length > 0 ? leaderboard : [
    { rank: 1, name: "Chargement...", points: 0, avatar: "/placeholder-user.jpg", level: "..." },
  ]

  const tips = [
    {
      icon: Calendar,
      title: "Achetez Régulièrement",
      description: "Les achats réguliers vous rapportent plus de points"
    },
    {
      icon: Share2,
      title: "Partagez Souvent",
      description: "Partagez vos produits préférés pour gagner des points"
    },
    {
      icon: Users,
      title: "Parrainez des Amis",
      description: "Invitez vos amis et gagnez des points bonus"
    },
    {
      icon: Star,
      title: "Donnez des Avis",
      description: "Vos avis aident la communauté et vous rapportent des points"
    }
  ]

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
              <Coins className="h-5 w-5 animate-pulse animate-float" />
              <span className="font-semibold group-hover:text-shimmer">SYSTÈME DE POINTS</span>
              <Sparkles className="h-5 w-5 animate-pulse animate-float" style={{ animationDelay: '0.5s' }} />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
              Gagnez, <span className="text-yellow-300 animate-pulse">Échangez</span>, <span className="text-yellow-300 animate-pulse">Profitez</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed animate-fade-in-up animation-delay-400 max-w-3xl mx-auto hover:text-white transition-colors duration-300">
              Découvrez notre système de points révolutionnaire qui récompense chaque interaction. 
              Gagnez des points, montez en niveau et accédez à des avantages exclusifs.
            </p>

            {/* User Points Display */}
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-8 animate-fade-in-up animation-delay-600 group">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPoints(!showPoints)}
                  className="text-white hover:bg-white/20 group-hover:animate-pulse"
                >
                  {showPoints ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors duration-300">
                    {showPoints ? `${userPoints.toLocaleString()} pts` : "••••••"}
                  </div>
                  <div className="text-white/80 group-hover:text-white transition-colors duration-300">
                    Valeur: {showPoints ? formatMoney(pointsValue) : "••••••"}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/80 group-hover:text-white transition-colors duration-300">
                  <span>Progression vers le niveau suivant</span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-white/20 group-hover:bg-white/30 transition-all duration-300" />
                <div className="text-xs text-white/60 group-hover:text-white/80 transition-colors duration-300">
                  {nextLevel - userPoints} points pour atteindre le niveau Argent
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-800">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                asChild
              >
                <Link href="#how-it-works" className="flex items-center">
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Comment ça Marche</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
                asChild
              >
                <Link href="#rewards" className="flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Voir les Récompenses</span>
                  <Gift className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Comment Gagner des Points</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez toutes les façons de gagner des points et d'optimiser vos gains
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {earningMethods.map((method, index) => (
              <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-r ${method.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-125 transition-all duration-500 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                    <method.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{method.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed mb-4 group-hover:text-gray-800 transition-colors duration-300">{method.description}</p>
                  <Badge className="bg-[#ff6600] text-white group-hover:scale-110 transition-transform duration-300">{method.points}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Levels Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Niveaux et Avantages</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Plus vous gagnez de points, plus vous accédez à des avantages exclusifs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {levels.map((level, index) => (
              <Card 
                key={index} 
                className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group cursor-pointer ${
                  selectedLevel === level.name.toLowerCase() ? 'ring-2 ring-[#ff6600]' : ''
                }`}
                onClick={() => setSelectedLevel(level.name.toLowerCase())}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${level.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                      <span className="text-2xl group-hover:animate-bounce">{level.icon}</span>
                    </div>
                    <Badge className={`bg-gradient-to-r ${level.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                      {level.minPoints.toLocaleString()} - {level.maxPoints.toLocaleString()} pts
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{level.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {level.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center space-x-2 group">
                        <CheckCircle className="h-4 w-4 text-green-500 group-hover:animate-bounce" />
                        <span className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards Section */}
      <section id="rewards" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Échangez Vos Points</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Utilisez vos points pour obtenir des récompenses exclusives
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {rewards.map((reward, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                      <reward.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-[#ff6600] transition-colors duration-300">{reward.title}</CardTitle>
                      <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{reward.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reward.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center space-x-2 group">
                        <Star className="h-4 w-4 text-yellow-400 group-hover:animate-bounce" />
                        <span className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{example}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Classement des Points</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez les utilisateurs avec le plus de points
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {leaderboardToDisplay.map((user, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={50}
                            height={50}
                            className="w-12 h-12 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold group-hover:animate-bounce">
                            {user.rank}
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">{user.name}</div>
                          <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{user.level}</div>
                        </div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="font-bold text-[#ff6600] group-hover:scale-110 transition-transform duration-300">{user.points.toLocaleString()} pts</div>
                        <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                          {formatMoney(Math.floor(user.points * withdrawalValue))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Conseils pour Optimiser</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Maximisez vos gains de points avec ces astuces
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tips.map((tip, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-float" style={{ animationDelay: `${index * 0.2}s` }}>
                    <tip.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#ff6600] to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 hover:text-shimmer transition-all duration-300">Commencez à Gagner des Points</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto hover:text-white transition-colors duration-300">
            Rejoignez des milliers d'utilisateurs qui gagnent déjà des points et accèdent à des avantages exclusifs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl"
              asChild
            >
              <Link href="/auth/register" className="flex items-center">
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
              <Link href="/products" className="flex items-center">
                <span className="group-hover:translate-x-1 transition-transform duration-300">Voir les Produits</span>
                <ShoppingBag className="ml-2 h-5 w-5 group-hover:animate-bounce" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
} 