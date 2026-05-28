"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff, Mail, Phone, User, Store, Shield, Sparkles, TrendingUp, Gift, Coins, ArrowRight, CheckCircle, AlertCircle, Zap, Globe, MessageCircle, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userType, setUserType] = useState("buyer")
  const [isLoading, setIsLoading] = useState(false)
  const [registerStep, setRegisterStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    newsletter: false,
  })
  
  // État pour les notifications
  const [showNotification, setShowNotification] = useState(false)
  const [notificationData, setNotificationData] = useState({
    type: 'info' as 'info' | 'success',
    title: '',
    message: ''
  })

  // Détecter le type de compte depuis l'URL
  useEffect(() => {
    const typeFromUrl = searchParams.get('type')
    if (typeFromUrl === 'vendeur') {
      setUserType('seller')
      
      // Notification locale pour informer l'utilisateur
      setNotificationData({
        type: 'info',
        title: 'Mode Vendeur activé',
        message: 'Vous êtes en mode vendeur. Vous pouvez changer cela ci-dessous.'
      })
      setShowNotification(true)
      
      // Masquer la notification après 5 secondes
      setTimeout(() => setShowNotification(false), 5000)
    } else if (typeFromUrl === 'acheteur') {
      setUserType('buyer')
      
      // Notification locale pour informer l'utilisateur
      setNotificationData({
        type: 'info',
        title: 'Mode Acheteur activé',
        message: 'Vous êtes en mode acheteur. Vous pouvez changer cela ci-dessous.'
      })
      setShowNotification(true)
      
      // Masquer la notification après 5 secondes
      setTimeout(() => setShowNotification(false), 5000)
    }
  }, [searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Validation des données
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        alert('Veuillez remplir tous les champs obligatoires')
        setIsLoading(false)
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas')
        setIsLoading(false)
        return
      }
      
      if (!formData.acceptTerms) {
        alert('Veuillez accepter les conditions d\'utilisation')
        setIsLoading(false)
        return
      }
      
      // Simulation d'un délai d'inscription
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Sauvegarder les données dans localStorage pour simulation
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const newUser = {
        id: Date.now(),
        ...formData,
        userType: userType,
        status: 'active',
        createdAt: new Date().toISOString(),
        points: 1000, // Points de bienvenue
        userId: `USER-${Date.now().toString().slice(-6)}`
      }
      users.push(newUser)
      localStorage.setItem('users', JSON.stringify(users))
      
      // Créer un profil utilisateur
      const userProfile = {
        userId: newUser.userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        userType: userType,
        points: 1000,
        joinDate: new Date().toISOString(),
        preferences: {
          newsletter: formData.newsletter,
          notifications: true
        }
      }
      localStorage.setItem(`profile_${newUser.userId}`, JSON.stringify(userProfile))
      
      setRegisterStep(2)
      
      // Notification de succès
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showNotification', {
          detail: {
            type: 'success',
            title: 'Compte créé avec succès !',
            message: `Bienvenue ${formData.firstName} ! Votre compte #${newUser.userId} a été créé avec ${newUser.points} points de bienvenue.`
          }
        }))
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = () => {
    setRegisterStep(3)
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-[#535455] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-[#ff6600] to-[#ff8533] rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-gradient-to-r from-[#ff6600] to-[#ff8533] rounded-full opacity-30 animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full opacity-25 animate-ping" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-r from-[#ff8533] to-[#ff6600] rounded-full opacity-35 animate-spin" style={{ animationDuration: '8s' }}></div>
          </div>

      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        <Sparkles className="absolute top-20 left-20 h-6 w-6 text-yellow-400 animate-ping opacity-60" />
        <Sparkles className="absolute top-40 right-40 h-4 w-4 text-yellow-400 animate-ping opacity-60" style={{ animationDelay: '0.5s' }} />
        <Sparkles className="absolute bottom-40 left-40 h-5 w-5 text-yellow-400 animate-ping opacity-60" style={{ animationDelay: '1s' }} />
        <Sparkles className="absolute bottom-20 right-20 h-3 w-3 text-yellow-400 animate-ping opacity-60" style={{ animationDelay: '1.5s' }} />
              </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Features */}
          <div className="text-white space-y-8 animate-fade-in-up">
            {/* Logo Section */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white px-6 py-3 rounded-full mb-6 animate-pulse">
                <Sparkles className="h-5 w-5 animate-spin" />
                <span className="font-bold text-lg">PROBOOSTER</span>
                <TrendingUp className="h-5 w-5 animate-bounce" />
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-[#ff6600] to-white bg-clip-text text-transparent">
                Rejoignez-nous
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
                Créez votre compte et commencez à gagner des points dès aujourd'hui
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-[#ff8533] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Points & Récompenses</h3>
                      <p className="text-gray-300 text-sm">Gagnez des points en partageant et convertissez-les en argent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff6600] to-[#ff8533] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Chat Instantané</h3>
                      <p className="text-gray-300 text-sm">Communiquez directement avec les vendeurs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Multi-vendeurs</h3>
                      <p className="text-gray-300 text-sm">Accédez à des milliers de produits de vendeurs vérifiés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 group">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#ff8533] to-[#ff6600] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                      <h3 className="text-lg font-semibold text-white">Sécurité Avancée</h3>
                      <p className="text-gray-300 text-sm">Protection des données et transactions sécurisées</p>
                    </div>
              </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-[#ff6600] mb-1">50K+</div>
                <div className="text-sm text-gray-300">Utilisateurs</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-[#ff6600] mb-1">1M+</div>
                <div className="text-sm text-gray-300">Points distribués</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-[#ff6600] mb-1">99%</div>
                <div className="text-sm text-gray-300">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Right Side - Registration Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl animate-fade-in-up animation-delay-200">
          <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  {registerStep === 1 && "Créer un compte"}
                  {registerStep === 2 && "Vérification"}
                  {registerStep === 3 && "Bienvenue !"}
                </CardTitle>
                <p className="text-gray-300">
                  {registerStep === 1 && "Rejoignez la communauté Probooster"}
                  {registerStep === 2 && "Vérification de vos informations..."}
                  {registerStep === 3 && "Inscription réussie !"}
                </p>
          </CardHeader>

              <CardContent className="space-y-6">
                {registerStep === 1 && (
                  <form onSubmit={handleRegister} className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-medium text-lg">Type de compte</Label>
                  {userType === 'seller' && (
                    <Badge className="bg-[#ff6600] text-white animate-pulse">
                      <Store className="h-3 w-3 mr-1" />
                      Mode Vendeur
                    </Badge>
                  )}
                  {userType === 'buyer' && (
                    <Badge className="bg-blue-500 text-white animate-pulse">
                      <User className="h-3 w-3 mr-1" />
                      Mode Acheteur
                    </Badge>
                  )}
                </div>
                
                <RadioGroup value={userType} onValueChange={setUserType} className="grid grid-cols-2 gap-4">
                  <div className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    userType === 'buyer' 
                      ? 'border-[#ff6600] bg-[#ff6600]/20' 
                      : 'border-white/30 bg-white/5 hover:bg-white/10'
                  }`}>
                    <RadioGroupItem value="buyer" id="buyer" className="border-white/30 data-[state=checked]:bg-[#ff6600] data-[state=checked]:border-[#ff6600]" />
                    <Label htmlFor="buyer" className="cursor-pointer flex items-center space-x-3 text-white">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Acheteur</div>
                        <div className="text-sm text-gray-300">Achetez et gagnez des points</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 ${
                    userType === 'seller' 
                      ? 'border-[#ff6600] bg-[#ff6600]/20' 
                      : 'border-white/30 bg-white/5 hover:bg-white/10'
                  }`}>
                    <RadioGroupItem value="seller" id="seller" className="border-white/30 data-[state=checked]:bg-[#ff6600] data-[state=checked]:border-[#ff6600]" />
                    <Label htmlFor="seller" className="cursor-pointer flex items-center space-x-3 text-white">
                      <div className="w-10 h-10 bg-[#ff6600] rounded-full flex items-center justify-center">
                        <Store className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Vendeur</div>
                        <div className="text-sm text-gray-300">Vendez et développez votre business</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                
                {userType === 'seller' && (
                  <div className="bg-[#ff6600]/10 border border-[#ff6600]/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-[#ff6600]">
                      <Store className="h-4 w-4" />
                      <span className="font-medium">Mode Vendeur activé</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      Vous pourrez créer votre boutique et commencer à vendre après l'inscription.
                    </p>
                  </div>
                )}
                
                {userType === 'buyer' && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Mode Acheteur activé</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      Vous pourrez acheter des produits et gagner des points en partageant.
                    </p>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white font-medium">Prénom</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600] transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white font-medium">Nom</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600] transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                        <Label htmlFor="email" className="text-white font-medium">Email</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff6600] transition-colors duration-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="pl-10 pr-4 py-3 bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600] transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                        <Label htmlFor="phone" className="text-white font-medium">Téléphone</Label>
                        <div className="relative group">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff6600] transition-colors duration-300" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+229 91 50 57 57"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="pl-10 pr-4 py-3 bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600] transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-4">
                <div className="space-y-2">
                        <Label htmlFor="password" className="text-white font-medium">Mot de passe</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff6600] transition-colors duration-300" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="pl-10 pr-12 py-3 bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600] transition-all duration-300"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-white font-medium">Confirmer le mot de passe</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff6600] transition-colors duration-300" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="pl-10 pr-12 py-3 bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600] transition-all duration-300"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
                          className="border-white/30 data-[state=checked]:bg-[#ff6600] data-[state=checked]:border-[#ff6600]"
                    required
                  />
                        <Label htmlFor="terms" className="text-white text-sm">
                    J'accepte les{" "}
                          <Link href="/terms" className="text-[#ff6600] hover:text-[#ff8533] transition-colors duration-300">
                      conditions d'utilisation
                    </Link>{" "}
                    et la{" "}
                          <Link href="/privacy" className="text-[#ff6600] hover:text-[#ff8533] transition-colors duration-300">
                      politique de confidentialité
                    </Link>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.newsletter}
                    onCheckedChange={(checked) => setFormData({ ...formData, newsletter: checked as boolean })}
                          className="border-white/30 data-[state=checked]:bg-[#ff6600] data-[state=checked]:border-[#ff6600]"
                  />
                        <Label htmlFor="newsletter" className="text-white text-sm">
                    Je souhaite recevoir les offres et actualités par email
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white py-3 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Création en cours...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Créer mon compte</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                      <span className="text-gray-300">Déjà un compte ? </span>
                      <Link href="/auth/login" className="text-[#ff6600] hover:text-[#ff8533] font-semibold transition-colors duration-300">
                    Se connecter
                  </Link>
              </div>
            </form>
                )}

                {registerStep === 2 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-[#ff6600] to-[#ff8533] rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Zap className="h-8 w-8 text-white animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Vérification en cours...</h3>
                      <p className="text-gray-300">Nous vérifions vos informations d'inscription</p>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <div className="w-2 h-2 bg-[#ff6600] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[#ff6600] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-[#ff6600] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}

                {registerStep === 3 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Inscription réussie !</h3>
                      <p className="text-gray-300">Bienvenue sur Probooster</p>
                    </div>
                    <Button
                      onClick={() => window.location.href = '/'}
                      className="w-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white py-3 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Continuer vers l'accueil
                    </Button>
                  </div>
                )}
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
      
      {/* Notification locale */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full border rounded-lg shadow-lg bg-blue-50 border-blue-200 animate-fadeIn">
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900">{notificationData.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{notificationData.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => setShowNotification(false)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
