"use client"

import { useState } from "react"
import { Share2, Twitter, MessageCircle, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ShareService, PointsService, NotificationService } from "@/lib/services"

interface ShareButtonsProps {
  productId: string
  productName: string
  productUrl?: string
  shareData?: {
    facebook: number
    twitter: number
    whatsapp: number
    instagram: number
  }
}

export default function ShareButtons({
  productId,
  productName,
  productUrl = "",
  shareData = { facebook: 0, twitter: 0, whatsapp: 0, instagram: 0 },
}: ShareButtonsProps) {
  const [shares, setShares] = useState(shareData)
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async (platform: string) => {
    setIsSharing(true)

    // Simuler l'API call pour enregistrer le partage
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mettre à jour le compteur local
    setShares((prev) => ({
      ...prev,
      [platform]: prev[platform as keyof typeof prev] + 1,
    }))

    // Logique de partage avec les services
    const shareUrl = `${window.location.origin}/product/${productId}`
    const shareText = `Découvrez ce produit incroyable: ${productName}`

    let pointsEarned = 0
    switch (platform) {
      case "facebook":
        pointsEarned = ShareService.shareToFacebook(shareUrl, shareText)
        break
      case "twitter":
        pointsEarned = ShareService.shareToTwitter(shareUrl, shareText)
        break
      case "whatsapp":
        pointsEarned = ShareService.shareToWhatsApp(shareUrl, shareText)
        break
      case "instagram":
        pointsEarned = ShareService.shareToInstagram(shareUrl, shareText)
        break
    }

    if (pointsEarned > 0) {
      PointsService.addPoints(pointsEarned)
      NotificationService.showSuccess(`+${pointsEarned} points gagnés !`)
    }

    setIsSharing(false)
  }

  const totalShares = Object.values(shares).reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600] hover:text-white group animate-pulse"
            disabled={isSharing}
          >
            <Share2 className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-300 animate-bounce" />
            Partager
            {totalShares > 0 && (
              <Badge className="ml-2 bg-[#ff6600] text-white text-xs animate-pulse">
                {totalShares}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border-2 border-gray-200 rounded-xl shadow-xl p-2 min-w-[200px]">
          <DropdownMenuItem
            onClick={() => handleShare("facebook")}
            className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">Facebook</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">+50 points</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs animate-pulse">
              {shares.facebook}
            </Badge>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleShare("whatsapp")}
            className="flex items-center space-x-3 p-3 hover:bg-green-50 rounded-lg transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">WhatsApp</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">+30 points</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs animate-pulse">
              {shares.whatsapp}
            </Badge>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleShare("twitter")}
            className="flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-semibold text-gray-900 group-hover:text-blue-400 transition-colors duration-300">Twitter</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">+40 points</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs animate-pulse">
              {shares.twitter}
            </Badge>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleShare("instagram")}
            className="flex items-center space-x-3 p-3 hover:bg-pink-50 rounded-lg transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.718-1.297c-.875.807-2.026 1.297-3.323 1.297s-2.448-.49-3.323-1.297c-.807-.875-1.297-2.026-1.297-3.323s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323z"/>
              </svg>
            </div>
            <div className="flex-1">
              <span className="font-semibold text-gray-900 group-hover:text-pink-500 transition-colors duration-300">Instagram</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">+45 points</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs animate-pulse">
              {shares.instagram}
            </Badge>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
