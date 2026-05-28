"use client"

import { useState, useEffect } from "react"
import { Share2, Facebook, Twitter, Instagram, Mail, Link, Copy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HeaderShare() {
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareText, setShareText] = useState("")
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Fonction utilitaire pour localStorage sécurisé
  const safeLocalStorage = {
    getItem: (key: string, defaultValue: string = '') => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key) || defaultValue
      }
      return defaultValue
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    }
  }

  // Initialisation
  useEffect(() => {
    setIsClient(true)
    setShareUrl(window.location.href)
    setShareText("Découvrez Probooster, la marketplace innovante avec système de points et chat instantané !")
  }, [])

  const shareToWhatsApp = (content: string, points: number = 30) => {
    try {
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(content)}`
      window.open(shareUrl, '_blank')
      
      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ Partagé sur WhatsApp ! +${points} points gagnés`)
    } catch (error) {
      console.error('Erreur lors du partage WhatsApp:', error)
    }
  }

  const shareToFacebook = (content: string, url: string, points: number = 50) => {
    try {
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(content)}`
      window.open(shareUrl, '_blank')
      
      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ Partagé sur Facebook ! +${points} points gagnés`)
    } catch (error) {
      console.error('Erreur lors du partage Facebook:', error)
    }
  }

  const shareToTwitter = (content: string, url: string, points: number = 40) => {
    try {
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}&url=${encodeURIComponent(url)}`
      window.open(shareUrl, '_blank')
      
      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ Partagé sur Twitter ! +${points} points gagnés`)
    } catch (error) {
      console.error('Erreur lors du partage Twitter:', error)
    }
  }

  const shareToInstagram = (content: string, points: number = 45) => {
    try {
      // Instagram ne permet pas le partage direct via URL, on copie le texte
      navigator.clipboard.writeText(content)
      
      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ Texte copié pour Instagram ! +${points} points gagnés\n\nCollez ce texte dans votre story Instagram :\n\n${content}`)
    } catch (error) {
      console.error('Erreur lors du partage Instagram:', error)
    }
  }

  const shareByEmail = (content: string, url: string, points: number = 35) => {
    try {
      const subject = encodeURIComponent('Découvrez Probooster !')
      const body = encodeURIComponent(`${content}\n\n${url}`)
      
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
      window.open(mailtoUrl)
      
      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + points).toString())
      
      alert(`✅ Email de partage ouvert ! +${points} points gagnés`)
    } catch (error) {
      console.error('Erreur lors du partage par email:', error)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      // Ajouter des points
      const currentPoints = parseInt(safeLocalStorage.getItem('userPoints', '1000'))
      safeLocalStorage.setItem('userPoints', (currentPoints + 20).toString())
      
      alert('✅ Lien copié ! +20 points gagnés')
    } catch (error) {
      console.error('Erreur lors de la copie:', error)
    }
  }

  const generateShareContent = () => {
    const baseText = "🎉 Découvrez Probooster, la marketplace innovante !"
    const features = "✨ Système de points • 💬 Chat instantané • 🚚 Livraison rapide"
    const callToAction = "🔗 Rejoignez-nous maintenant !"
    
    return `${baseText}\n\n${features}\n\n${callToAction}\n\n${shareUrl}`
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Share Button */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#ff6600] hover:text-white rounded-full group hover:scale-110 transition-all duration-300 hover:shadow-lg"
          >
            <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Share2 className="h-5 w-5 text-[#ff6600]" />
              <span>Partager Probooster</span>
            </DialogTitle>
            <DialogDescription>
              Partagez Probooster avec vos amis et gagnez des points de fidélité !
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Contenu personnalisable */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Personnaliser votre message</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message de partage</label>
                  <Input
                    placeholder="Votre message personnalisé..."
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL à partager</label>
                  <Input
                    placeholder="URL du site ou de la page..."
                    value={shareUrl}
                    onChange={(e) => setShareUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Partager sur les réseaux sociaux</h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-gray-100 hover:border-green-500"
                  onClick={() => shareToWhatsApp(generateShareContent(), 30)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-lg font-bold">W</span>
                    </div>
                    <h5 className="font-semibold text-sm">WhatsApp</h5>
                    <Badge className="mt-1 bg-green-100 text-green-800 text-xs">+30 pts</Badge>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-gray-100 hover:border-blue-600"
                  onClick={() => shareToFacebook(generateShareContent(), shareUrl, 50)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-lg font-bold">f</span>
                    </div>
                    <h5 className="font-semibold text-sm">Facebook</h5>
                    <Badge className="mt-1 bg-blue-100 text-blue-800 text-xs">+50 pts</Badge>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-gray-100 hover:border-blue-400"
                  onClick={() => shareToTwitter(generateShareContent(), shareUrl, 40)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-lg font-bold">𝕏</span>
                    </div>
                    <h5 className="font-semibold text-sm">Twitter</h5>
                    <Badge className="mt-1 bg-blue-100 text-blue-800 text-xs">+40 pts</Badge>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-gray-100 hover:border-purple-500"
                  onClick={() => shareToInstagram(generateShareContent(), 45)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-lg">📷</span>
                    </div>
                    <h5 className="font-semibold text-sm">Instagram</h5>
                    <Badge className="mt-1 bg-purple-100 text-purple-800 text-xs">+45 pts</Badge>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-gray-100 hover:border-red-500"
                  onClick={() => shareByEmail(generateShareContent(), shareUrl, 35)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <h5 className="font-semibold text-sm">Email</h5>
                    <Badge className="mt-1 bg-red-100 text-red-800 text-xs">+35 pts</Badge>
                  </CardContent>
                </Card>
                
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 border-gray-100 hover:border-gray-600"
                  onClick={() => copyToClipboard(shareUrl)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Copy className="h-6 w-6 text-white" />
                    </div>
                    <h5 className="font-semibold text-sm">Copier</h5>
                    <Badge className="mt-1 bg-gray-100 text-gray-800 text-xs">+20 pts</Badge>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Informations sur les points */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💡</span>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-800">Gagnez des points en partageant !</h4>
                  <p className="text-sm text-yellow-700">
                    Chaque partage vous rapporte des points de fidélité que vous pouvez utiliser pour des réductions.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setShowShareModal(false)}>
                Fermer
              </Button>
              
              <Button 
                onClick={() => copyToClipboard(generateShareContent())}
                className="bg-[#ff6600] hover:bg-[#e55a00]"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copier tout
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


