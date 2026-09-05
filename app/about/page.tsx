"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  TrendingUp,
  Award,
  Globe,
  Heart,
  Shield,
  Sparkles,
  ArrowRight,
  Star,
  Target,
  Rocket,
  MapPin,
  Phone,
  Mail,
  MessageCircle
} from "lucide-react"

export default function AboutPage() {
  const stats = [
    { icon: Users, value: "50K+", label: "Utilisateurs Actifs", color: "text-blue-500" },
    { icon: TrendingUp, value: "1M+", label: "Points Distribués", color: "text-green-500" },
    { icon: Award, value: "99%", label: "Satisfaction Client", color: "text-purple-500" },
    { icon: Globe, value: "25+", label: "Pays Desservis", color: "text-orange-500" }
  ]

  const values = [
    {
      icon: Heart,
      title: "Innovation",
      description: "Nous repoussons constamment les limites de la technologie pour créer des expériences uniques.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Shield,
      title: "Sécurité",
      description: "La protection de vos données et transactions est notre priorité absolue.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Communauté",
      description: "Nous construisons une communauté forte où chaque membre compte.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Nous visons l&apos;excellence dans chaque aspect de notre service.",
      color: "from-purple-500 to-violet-500"
    }
  ]

  const team = [
    {
      name: "Gildas Tossou",
      role: "CEO & Fondateur",
      image: "/placeholder-user.jpg",
      bio: "15 ans d&apos;expérience dans le commerce et l&apos;innovation technologique en Afrique de l&apos;Ouest."
    },
    {
      name: "Hervé Agbodjélou",
      role: "CTO",
      image: "/placeholder-user.jpg",
      bio: "Expert en développement d&apos;applications et architecture cloud, passionné par la tech au service du continent."
    },
    {
      name: "Carmelle Hounsa",
      role: "Directrice Marketing",
      image: "/placeholder-user.jpg",
      bio: "Spécialiste en marketing digital et croissance d&apos;entreprise, originaire de Cotonou."
    },
    {
      name: "Clément Sègla",
      role: "Directeur Commercial",
      image: "/placeholder-user.jpg",
      bio: "Expert en développement commercial et relations partenaires au Bénin et dans la région."
    }
  ]

  const milestones = [
    {
      year: "2023",
      title: "Fondation",
      description: "Création de Probooster avec une vision révolutionnaire du commerce en ligne."
    },
    {
      year: "2024",
      title: "Lancement Beta",
      description: "Premier lancement avec 1000 utilisateurs pionniers et système de points."
    },
    {
      year: "2025",
      title: "Expansion",
      description: "Ouverture dans 10 nouveaux pays et 100K utilisateurs actifs."
    },
    {
      year: "2026",
      title: "Innovation",
      description: "Lancement de l'application mobile et système de récompenses avancé."
    },
    {
      year: "2027",
      title: "Leader",
      description: "Devenu la référence du commerce en ligne en Afrique de l'Ouest."
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
              <Sparkles className="h-5 w-5 animate-spin animate-float" />
              <span className="font-semibold group-hover:text-shimmer">À PROPOS DE NOUS</span>
              <Sparkles className="h-5 w-5 animate-spin animate-float" style={{ animationDelay: '0.5s' }} />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up animation-delay-200 hover:text-shimmer transition-all duration-300">
              Révolutionner le <span className="text-yellow-300 animate-pulse">Commerce</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed animate-fade-in-up animation-delay-400 max-w-3xl mx-auto hover:text-white transition-colors duration-300">
              Probooster n&apos;est pas qu&apos;une simple marketplace. Nous sommes une communauté innovante 
              qui transforme la façon dont les gens achètent, vendent et interagissent en ligne.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-600">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-[#ff6600] hover:bg-gray-100 px-8 py-4 text-lg group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl" 
                asChild
              >
                <Link href="#mission" className="flex items-center">
                  <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">Notre Mission</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </Link>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="bg-[#ff6600] border-white text-white hover:bg-white hover:text-[#ff6600] px-8 py-4 text-lg group relative transition-all duration-300 hover:scale-105 hover:shadow-xl"
                asChild
              >
                <Link href="#team" className="flex items-center">
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Notre Équipe</span>
                  <Users className="ml-2 h-5 w-5 group-hover:animate-bounce" />
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
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <stat.icon className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2 animate-count-up group-hover:text-[#ff6600] transition-colors duration-300">{stat.value}</div>
                <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Notre Mission & Vision</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez ce qui nous motive et où nous voulons aller
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-125 transition-all duration-500 animate-float">
                  <Target className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <CardTitle className="text-2xl group-hover:text-[#ff6600] transition-colors duration-300">Notre Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                  Révolutionner le commerce en ligne en créant une plateforme qui valorise chaque interaction, 
                  récompense la participation et construit une communauté forte. Nous voulons rendre le commerce 
                  plus humain, plus engageant et plus profitable pour tous.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-125 transition-all duration-500 animate-float" style={{ animationDelay: '0.2s' }}>
                  <Rocket className="h-8 w-8 text-white group-hover:animate-bounce" />
                </div>
                <CardTitle className="text-2xl group-hover:text-[#ff6600] transition-colors duration-300">Notre Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                  Devenir la marketplace de référence en Afrique de l&apos;Ouest, reconnue pour son innovation, 
                  sa fiabilité et sa capacité à créer de la valeur pour tous ses utilisateurs. Nous aspirons 
                  à connecter des millions de personnes et à transformer l&apos;économie numérique de la région.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Nos Valeurs</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Les principes qui guident chacune de nos décisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-r ${value.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                    <value.icon className="h-6 w-6 text-white group-hover:animate-bounce" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm group-hover:text-gray-800 transition-colors duration-300">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Notre Histoire</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez les étapes clés de notre parcours
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gradient-to-b from-[#ff6600] to-orange-500"></div>

            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="w-1/2 px-8">
                    <div className={`${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                      <Badge className="bg-[#ff6600] text-white mb-2 animate-pulse group-hover:scale-110 transition-transform duration-300">{milestone.year}</Badge>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">{milestone.title}</h3>
                      <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">{milestone.description}</p>
                    </div>
                  </div>
                  
                  <div className="w-4 h-4 bg-[#ff6600] rounded-full border-4 border-white shadow-lg relative z-10 animate-pulse group-hover:scale-150 transition-transform duration-300"></div>
                  
                  <div className="w-1/2 px-8"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">Notre Équipe</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Les talents qui font de Probooster une réalité
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group">
                <CardHeader className="text-center">
                  <div className="relative mx-auto mb-4">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={120}
                      height={120}
                      className="w-24 h-24 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#ff6600] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Star className="h-4 w-4 text-white group-hover:animate-bounce" />
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-[#ff6600] transition-colors duration-300">{member.name}</CardTitle>
                  <p className="text-[#ff6600] font-medium group-hover:text-orange-600 transition-colors duration-300">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm text-center group-hover:text-gray-800 transition-colors duration-300">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#ff6600] to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 hover:text-shimmer transition-all duration-300">Rejoignez Notre Aventure</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto hover:text-white transition-colors duration-300">
            Faites partie de la révolution du commerce en ligne et découvrez toutes les opportunités 
            que Probooster peut vous offrir.
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
              <Link href="/contact" className="flex items-center">
                <span className="group-hover:translate-x-1 transition-transform duration-300">Nous Contacter</span>
                <MessageCircle className="ml-2 h-5 w-5 group-hover:animate-bounce" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-[#ff6600] to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float group-hover:scale-110 transition-transform duration-300">
                <MapPin className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Notre Adresse</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">Cotonou, Bénin<br />Rue du Commerce</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.2s' }}>
                <Phone className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Téléphone</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">+229 91 50 57 57<br />24h/24, 7j/7</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-float group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0.4s' }}>
                <Mail className="h-8 w-8 text-white group-hover:animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#ff6600] transition-colors duration-300">Email</h3>
              <p className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">contact@probooster.online<br />support@probooster.online</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 