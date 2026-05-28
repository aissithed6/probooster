"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { usePublicGlobalSettings } from "@/contexts/PublicGlobalSettingsContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

// Composant chargé de définir un nouveau mot de passe après vérification par Supabase.
export default function ResetPasswordPage() {
  const { user, updatePassword } = useAuth()
  const { data: publicSettings } = usePublicGlobalSettings()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const passwordPolicy = publicSettings?.securityConfig?.passwordPolicy
  const minPasswordLength = Math.max(6, Number(passwordPolicy?.minLength ?? 8) || 8)
  const requireUppercase = Boolean(passwordPolicy?.requireUppercase)
  const requireNumbers = Boolean(passwordPolicy?.requireNumbers)
  const requireSymbols = Boolean(passwordPolicy?.requireSymbols)

  const passwordMeetsPolicy = (value: string) => {
    const pwd = (value ?? '').toString()
    if (pwd.length < minPasswordLength) return false
    if (requireUppercase && !/[A-Z]/.test(pwd)) return false
    if (requireNumbers && !/[0-9]/.test(pwd)) return false
    if (requireSymbols && !/[^A-Za-z0-9]/.test(pwd)) return false
    return true
  }

  // Soumission de la mise à jour du mot de passe pour l'utilisateur authentifié.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.")
      setSuccessMessage(null)
      return
    }

    if (!passwordMeetsPolicy(newPassword)) {
      setErrorMessage(`Le mot de passe ne respecte pas la politique de sécurité (min ${minPasswordLength} caractères).`)
      setSuccessMessage(null)
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      const { error } = await updatePassword(newPassword)

      if (error) {
        setErrorMessage(error.message ?? "Impossible de mettre à jour le mot de passe.")
      } else {
        setSuccessMessage("Mot de passe mis à jour avec succès. Vous pouvez maintenant accéder à votre espace.")
        setNewPassword("")
        setConfirmPassword("")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const showForm = Boolean(user)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Réinitialiser le mot de passe</CardTitle>
          <CardDescription className="text-gray-300">
            {showForm
              ? "Définissez un nouveau mot de passe sécurisé."
              : "Le lien de réinitialisation n'est plus valide. Merci de recommencer la procédure."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="********"
                    required
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white">Confirmez le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="********"
                    required
                    className="pl-10 bg-white/20 border-white/30 text-white placeholder-gray-400 focus:bg-white/30 focus:border-[#ff6600] focus:ring-[#ff6600]"
                  />
                </div>
              </div>

              {successMessage && (
                <div className="flex items-start space-x-3 rounded-lg border border-green-500/40 bg-green-500/20 p-3 text-sm text-green-100">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start space-x-3 rounded-lg border border-red-500/40 bg-red-500/20 p-3 text-sm text-red-100">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Mise à jour en cours..." : "Mettre à jour"}
              </Button>

              <div className="flex items-center justify-between text-sm text-gray-300">
                <Link href="/auth/login" className="inline-flex items-center space-x-2 hover:text-white">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Retour à la connexion</span>
                </Link>
                <Link href="/auth/register" className="hover:text-white">
                  Créer un compte
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-yellow-300" />
              </div>
              <p className="text-gray-200">
                Le lien de réinitialisation semble expiré ou invalide. Relancez la procédure depuis la page
                <Link href="/auth/forgot-password" className="ml-1 text-[#ff6600] hover:text-[#ff8533]">mot de passe oublié</Link>.
              </p>
              <div className="flex justify-center">
                <Link href="/auth/forgot-password">
                  <Button variant="outline" className="border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600]/10">
                    Relancer la procédure
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
