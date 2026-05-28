"use client"

import { FormEvent, useState } from "react"
import { Eye, EyeOff, Mail, Lock, Sparkles, TrendingUp, Gift, ArrowRight, Shield, Globe, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

import { useAuth } from "@/contexts/AuthContext"
import { usePublicGlobalSettings } from "@/contexts/PublicGlobalSettingsContext"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { data: publicSettings } = usePublicGlobalSettings()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOauthLoading, setIsOauthLoading] = useState(false)

  const allowGoogle = publicSettings?.securityConfig?.googleAuth ?? true
  const allowFacebook = publicSettings?.securityConfig?.facebookAuth ?? true
  const allowApple = publicSettings?.securityConfig?.appleAuth ?? false
  const allowX = publicSettings?.securityConfig?.xAuth ?? false

  // Lance un OAuth Supabase (Google/Facebook/Apple). Aucun secret n'est stocké côté code.
  const startOAuth = async (provider: 'google' | 'facebook' | 'apple' | 'twitter') => {
    try {
      setError(null)
      setIsOauthLoading(true)

      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/oauth-callback`
        : undefined

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo
        }
      })

      if (oauthError) {
        setError(oauthError.message || "Impossible de démarrer l'authentification OAuth")
      }
    } catch (_err) {
      setError("Impossible de démarrer l'authentification OAuth. Vérifie la configuration Supabase (provider + redirect URL).")
    } finally {
      setIsOauthLoading(false)
    }
  }

  // Gère la soumission du formulaire de connexion et la redirection après authentification.
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setIsLoading(true)
      setError(null)

      const { error: signInError, role } = await signIn(email, password)

      if (signInError) {
        setError(signInError.message ?? "Identifiants invalides")
        setIsLoading(false)
        return
      }

      if (rememberMe) {
        localStorage.setItem("probooster_saved_email", email)
      } else {
        localStorage.removeItem("probooster_saved_email")
      }

      if (role === 'vendor') {
        router.push("/seller-dashboard")
      } else if (role === 'driver') {
        router.push("/driver-dashboard")
      } else if (role === 'admin' || role === 'super_admin' || role === 'ops') {
        router.push("/super-admin-dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (_error) {
      setError("Une erreur inattendue s'est produite")
      setIsLoading(false)
    }

    setIsLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
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
                Bienvenue
              </h1>
              
              <p className="text-xl lg:text-2xl text-gray-300 mb-8 leading-relaxed">
                Rejoignez la révolution du commerce en ligne avec des points et des récompenses uniques
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
                      <Globe className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Multidevise</h3>
                      <p className="text-gray-300 text-sm">Support natif du F CFA et autres devises</p>
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

          {/* Right Side - Login Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl animate-fade-in-up animation-delay-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  Connexion
                </CardTitle>
                <p className="text-gray-300">
                  Accédez à votre compte Probooster
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">
                      Adresse e-mail
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff6600] transition-colors duration-300" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 pr-4 py-3 bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600] transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">
                      Mot de passe
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-[#ff6600] transition-colors duration-300" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Votre mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-white/30 data-[state=checked]:bg-[#ff6600] data-[state=checked]:border-[#ff6600]"
                      />
                      <Label htmlFor="remember" className="text-white text-sm">
                        Se souvenir de moi
                      </Label>
                    </div>
                    <Link href="/auth/forgot-password" className="text-[#ff6600] hover:text-[#ff8533] text-sm transition-colors duration-300">
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Login Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white py-3 text-lg font-semibold rounded-xl transform hover:scale-105 transition-all duration-300 shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connexion en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Se connecter</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    )}
                  </Button>

                  {/* Social Login */}
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-gray-300">Ou continuer avec</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {allowGoogle && (
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                          disabled={isOauthLoading}
                          onClick={() => startOAuth('google')}
                        >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                        </Button>
                      )}
                      {allowFacebook && (
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                          disabled={isOauthLoading}
                          onClick={() => startOAuth('facebook')}
                        >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Facebook
                        </Button>
                      )}
                      {allowApple && (
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                          disabled={isOauthLoading}
                          onClick={() => startOAuth('apple')}
                        >
                          Apple
                        </Button>
                      )}
                      {allowX && (
                        <Button
                          type="button"
                          variant="outline"
                          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                          disabled={isOauthLoading}
                          onClick={() => startOAuth('twitter')}
                        >
                          X
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Register Link */}
                  <div className="text-center">
                    <span className="text-gray-300">Pas encore de compte ? </span>
                    <Link href="/auth/register" className="text-[#ff6600] hover:text-[#ff8533] font-semibold transition-colors duration-300">
                      Créer un compte
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 