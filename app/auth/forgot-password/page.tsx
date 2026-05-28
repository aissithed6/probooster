"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

// Composant responsable de l'envoi du lien de réinitialisation de mot de passe.
export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fonction de soumission du formulaire de demande de réinitialisation.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setSuccessMessage(null)
      setErrorMessage(null)

      const { error } = await sendPasswordReset(email)

      if (error) {
        setErrorMessage(error.message ?? "Impossible d'envoyer l'e-mail de réinitialisation.")
      } else {
        setSuccessMessage("Un e-mail contenant le lien de réinitialisation vient de vous être envoyé.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <Card className="w-full max-w-lg bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Mot de passe oublié</CardTitle>
          <CardDescription className="text-gray-300">
            Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Adresse e-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="votre@email.com"
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
              {isSubmitting ? "Envoi en cours..." : "Envoyer le lien"}
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
        </CardContent>
      </Card>
    </div>
  )
}
