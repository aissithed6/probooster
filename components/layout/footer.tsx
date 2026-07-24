"use client"

import { Facebook, Instagram, Mail, Phone, Twitter, CheckCircle, MessageCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { usePublicGlobalSettings } from "@/contexts/PublicGlobalSettingsContext"

export default function Footer() {
  const { data: publicSettings } = usePublicGlobalSettings()
  const [whatsappNumber, setWhatsappNumber] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClient, setIsClient] = useState(false)

  const resolvedLogoSrc = (() => {
    const candidate = (publicSettings?.siteConfig?.logoUrl ?? '').toString().trim()
    if (!candidate) return "/images/logo.png"
    return candidate
  })()

  const canUseNextImageForLogo = resolvedLogoSrc.startsWith('/')

  const resolvedSiteName = (() => {
    const name = (publicSettings?.siteConfig?.siteName ?? 'Probooster').toString().trim()
    return name || 'Probooster'
  })()

  const resolvedSupportPhone = (() => {
    const phone = (publicSettings as any)?.contactInfo?.phone ?? null
    const whatsapp = (publicSettings as any)?.contactInfo?.whatsapp ?? null
    const chosen = (whatsapp ?? phone ?? '').toString().trim()
    return chosen || '+229 91 50 57 57'
  })()

  const resolvedSupportEmail = (() => {
    const email = ((publicSettings as any)?.contactInfo?.email ?? '').toString().trim()
    return email || 'support@probooster.online'
  })()

  // Chargement progressif
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSubscribe = async () => {
    if (!whatsappNumber.trim()) {
      alert("Veuillez entrer votre numéro WhatsApp")
      return
    }

    // Validation du format du numéro
    const phoneRegex = /^(\+?229|229)?[0-9]{8}$/
    const cleanNumber = whatsappNumber.replace(/\s/g, "")
    
    if (!phoneRegex.test(cleanNumber)) {
      alert("Veuillez entrer un numéro WhatsApp valide (format: +229 XX XX XX XX)")
      return
    }

    setIsSubmitting(true)

    try {
      // Préparer le message WhatsApp
      const message = `🆕 Nouvel abonnement Newsletter Probooster

📱 Numéro: ${whatsappNumber}
📅 Date: ${new Date().toLocaleDateString('fr-FR')}
⏰ Heure: ${new Date().toLocaleTimeString('fr-FR')}

✅ L'utilisateur souhaite recevoir les alertes et nouveautés de Probooster.

---
Probooster - Marketplace Innovante`

      // Encoder le message pour l'URL WhatsApp
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/22991505757?text=${encodedMessage}`

      // Ouvrir WhatsApp
      window.open(whatsappUrl, '_blank')

      // Simuler l'envoi d'un email à l'administrateur
      await sendAdminNotification(whatsappNumber)

      // Afficher le modal de succès
      setShowSuccessModal(true)
      setWhatsappNumber("")

    } catch (error) {
      console.error("Erreur lors de l'abonnement:", error)
      alert("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendAdminNotification = async (phoneNumber: string) => {
    // Simulation d'envoi d'email à l'administrateur
    const adminEmail = "admin@probooster.online"
    const subject = "Nouvel abonnement Newsletter Probooster"
    const body = `
Nouvel abonnement reçu :

📱 Numéro WhatsApp: ${phoneNumber}
📅 Date: ${new Date().toLocaleDateString('fr-FR')}
⏰ Heure: ${new Date().toLocaleTimeString('fr-FR')}

L'utilisateur a été ajouté à la liste des abonnés.
Un message WhatsApp a été envoyé à l'administrateur.

---
Probooster Dashboard
    `

    // En production, vous utiliseriez un service d'email comme SendGrid, Mailgun, etc.
    console.log("Email envoyé à l'administrateur:", { adminEmail, subject, body })
  }

  // Afficher un état de chargement si le client n'est pas encore prêt
  if (!isClient) {
    return (
      <footer className="fixed-footer-bottom bg-[#535455] text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Skeletons de chargement */}
            {[...Array(4)].map((_, index) => (
              <div key={index} className="space-y-4">
                <div className="animate-pulse bg-gray-600 h-6 w-32 rounded"></div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-600 h-4 w-24 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="fixed-footer-bottom bg-[#535455] text-white">
      <div className="container mx-auto px-4 py-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center group relative z-30">
              <div className="w-20 h-20 group-hover:scale-110 transition-transform duration-300 animate-pulse animate-float">
                {canUseNextImageForLogo ? (
                  <Image 
                    src={resolvedLogoSrc} 
                    alt={`${resolvedSiteName} Logo`} 
                    width={80} 
                    height={80} 
                    className="w-full h-full object-contain"
                    priority
                  />
                ) : (
                  <img
                    src={resolvedLogoSrc || '/images/logo.png'}
                    alt={`${resolvedSiteName} Logo`}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed hover:text-white transition-colors duration-300">
              La marketplace innovante qui révolutionne le commerce en ligne avec son système de points unique et ses
              fonctionnalités sociales avancées.
            </p>
            <div className="flex space-x-3">
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-gray-300 hover:text-[#ff6600] group transition-all duration-300 hover:scale-110 animate-float"
              >
                <Facebook className="h-4 w-4 group-hover:animate-bounce" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-gray-300 hover:text-[#ff6600] group transition-all duration-300 hover:scale-110 animate-float"
                style={{ animationDelay: '0.5s' }}
              >
                <Twitter className="h-4 w-4 group-hover:animate-bounce" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="text-gray-300 hover:text-[#ff6600] group transition-all duration-300 hover:scale-110 animate-float"
                style={{ animationDelay: '1s' }}
              >
                <Instagram className="h-4 w-4 group-hover:animate-bounce" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg hover:text-[#ff6600] transition-colors duration-300 group-hover:text-shimmer">Liens Rapides</h3>
            <ul className="space-y-2 text-sm">
              <li className="group">
                <Link href="/about" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  À propos
                </Link>
              </li>
              <li className="group">
                <Link href="/how-it-works" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Comment ça marche
                </Link>
              </li>
              <li className="group">
                <Link href="/become-seller" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Devenir vendeur
                </Link>
              </li>
              <li className="group">
                <Link href="/points-system" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Système de points
                </Link>
              </li>
              <li className="group">
                <Link href="/mobile-app" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Application mobile
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg hover:text-[#ff6600] transition-colors duration-300 group-hover:text-shimmer">Support</h3>
            <ul className="space-y-2 text-sm">
              <li className="group">
                <Link href="/help" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Centre d'aide
                </Link>
              </li>
              <li className="group">
                <Link href="/contact" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Nous contacter
                </Link>
              </li>
              <li className="group">
                <Link href="/shipping" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Livraison
                </Link>
              </li>
              <li className="group">
                <Link href="/returns" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  Retours
                </Link>
              </li>
              <li className="group">
                <Link href="/faq" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 group-hover:translate-x-1 inline-block">
                  FAQ
                </Link>
              </li>
            </ul>
            <div className="space-y-2 text-sm">
              <a 
                href={`https://wa.me/${resolvedSupportPhone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 group hover:text-[#ff6600] transition-colors duration-300 cursor-pointer"
              >
                <Phone className="h-4 w-4 group-hover:animate-pulse animate-float" />
                <span className="group-hover:translate-x-1 transition-transform duration-300">{resolvedSupportPhone}</span>
              </a>
              <a 
                href={`mailto:${resolvedSupportEmail}`} 
                className="flex items-center space-x-2 text-gray-300 group hover:text-[#ff6600] transition-colors duration-300 cursor-pointer"
              >
                <Mail className="h-4 w-4 group-hover:animate-pulse animate-float" style={{ animationDelay: '0.3s' }} />
                <span className="group-hover:translate-x-1 transition-transform duration-300">{resolvedSupportEmail}</span>
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg hover:text-[#ff6600] transition-colors duration-300 group-hover:text-shimmer">Newsletter</h3>
            <p className="text-gray-300 text-sm hover:text-white transition-colors duration-300">Restez informé des dernières offres et nouveautés</p>
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="Votre WhatsApp (+229 XX XX XX XX)"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="bg-gray-600 border-gray-500 text-white placeholder:text-gray-400 focus:border-[#ff6600] transition-all duration-300 hover:bg-gray-500"
              />
              <Button 
                onClick={handleSubscribe}
                disabled={isSubmitting || !whatsappNumber.trim()}
                className="w-full bg-[#ff6600] hover:bg-[#e55a00] group transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">S'abonner</span>
                  </div>
                )}
              </Button>
            </div>
            <div className="text-xs text-gray-400 hover:text-gray-300 transition-colors duration-300">
              En vous abonnant, vous acceptez notre politique de confidentialité.
            </div>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-300 hover:text-white transition-colors duration-300">
              © 2025 Probooster. Tous droits réservés. Développé par{" "}
              <a
                href="https://wa.me/22996567436"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff6600] hover:text-orange-400 transition-colors duration-300 underline"
              >
                Ultra Web
              </a>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 hover:translate-y-[-2px] inline-block">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 hover:translate-y-[-2px] inline-block">
                Conditions d'utilisation
              </Link>
              <Link href="/cookies" className="text-gray-300 hover:text-[#ff6600] transition-all duration-300 hover:translate-y-[-2px] inline-block">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span>Abonnement Réussi !</span>
            </DialogTitle>
            <DialogDescription>
              Votre abonnement aux notifications WhatsApp a été activé avec succès
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-gray-600">
                Votre abonnement a été enregistré avec succès !
              </p>
              <p className="text-sm text-gray-500">
                Un message WhatsApp a été envoyé à l'administrateur.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 text-green-700">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Prochaines étapes :</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-green-600">
                <li>• Vous recevrez bientôt un message de confirmation</li>
                <li>• Les alertes seront envoyées sur WhatsApp</li>
                <li>• Vous pouvez vous désabonner à tout moment</li>
              </ul>
            </div>

            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-[#ff6600] hover:bg-[#e55a00]"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
