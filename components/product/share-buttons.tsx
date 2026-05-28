"use client"

import { useState, useEffect, useRef } from "react"
import { FaWhatsapp, FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaTiktok } from 'react-icons/fa6'
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ShareEngagementService } from "@/lib/services/share-engagement-service"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { ShareConfirmModal } from "@/components/product/share-confirm-modal"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface ShareButtonsProps {
  productId: string
  productName: string
  vendorId: string
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
  vendorId,
  productUrl = "",
  shareData = { facebook: 0, twitter: 0, whatsapp: 0, instagram: 0 },
}: ShareButtonsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { requireAuth } = useAuthGuard()
  const [isOpen, setIsOpen] = useState(false)
  const [shares, setShares] = useState(shareData)
  const [isSharing, setIsSharing] = useState(false)
  const [pointsConfig, setPointsConfig] = useState<Record<string, number>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPlatform, setConfirmPlatform] = useState<string>('')
  const [confirmPoints, setConfirmPoints] = useState<number>(0)
  const pendingShareRef = useRef<{ platform: string } | null>(null)

  // Charger la configuration des points au montage
  useEffect(() => {
    loadPointsConfig()
  }, [])

  // Charger les compteurs réels de partages (par réseau) au montage
  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const counts = await ShareEngagementService.getProductShareCounts(productId)
        if (!mounted) return
        setShares((prev) => ({
          ...prev,
          facebook: counts.byPlatform.facebook || 0,
          twitter: counts.byPlatform.twitter || 0,
          whatsapp: counts.byPlatform.whatsapp || 0,
          instagram: counts.byPlatform.instagram || 0
        }))
      } catch {
        // noop
      }
    })()

    return () => {
      mounted = false
    }
  }, [productId])

  const loadPointsConfig = async () => {
    const platforms = ['facebook', 'twitter', 'whatsapp', 'instagram', 'linkedin', 'tiktok']
    const config: Record<string, number> = {}
    
    for (const platform of platforms) {
      config[platform] = await ShareEngagementService.getPointsConfig(platform)
    }
    
    setPointsConfig(config)
  }

  const openShareWindow = async (p: string, shareUrl: string, shareText: string): Promise<boolean> => {
    let url = ''
    switch (p) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        break
      case "instagram":
      case "tiktok":
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Lien copié!",
          description: `Collez le lien dans votre ${p === 'instagram' ? 'story Instagram' : 'vidéo TikTok'}`,
          variant: "default",
        })
        return true
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
    }
    if (!url) return false
    window.open(url, '_blank', 'width=600,height=400')
    return true
  }

  const runShare = async (platform: string, awardPoints: boolean) => {
    if (!requireAuth("Connectez-vous pour gagner des points en partageant.")) {
      return
    }

    /**
     * Empêche l'enregistrement côté DB si le vendeur n'est pas identifié.
     * Sinon le partage ne remontera jamais dans le dashboard vendeur (filtré par vendor_id).
     */
    const safeVendorId = String(vendorId ?? '').trim()
    if (!UUID_REGEX.test(safeVendorId)) {
      toast({
        title: 'Partage indisponible',
        description: "Impossible d'identifier le vendeur pour enregistrer ce partage.",
        variant: 'destructive'
      })
      return
    }

    setIsSharing(true)

    // Générer l'URL de partage avec référence utilisateur
    const shareUrl = `${window.location.origin}/product/${productId}?ref=${user?.id ?? ''}`
    const shareText = `Découvrez ce produit incroyable: ${productName}`

    const opened = await openShareWindow(platform, shareUrl, shareText)
    if (!opened) {
      setIsSharing(false)
      return
    }

    // Enregistrer le partage dans Supabase
    const share = await ShareEngagementService.recordShare(
      String(user?.id ?? ''),
      productId,
      safeVendorId,
      platform,
      shareUrl,
      { awardPoints }
    )

    if (share) {
      // Mettre à jour le compteur local
      setShares((prev) => ({
        ...prev,
        [platform]: prev[platform as keyof typeof prev] + 1,
      }))

      // Re-sync rapide avec la DB pour éviter les écarts entre onglets et réseaux
      try {
        const counts = await ShareEngagementService.getProductShareCounts(productId)
        setShares((prev) => ({
          ...prev,
          facebook: counts.byPlatform.facebook || 0,
          twitter: counts.byPlatform.twitter || 0,
          whatsapp: counts.byPlatform.whatsapp || 0,
          instagram: counts.byPlatform.instagram || 0
        }))

        try {
          if (typeof window !== 'undefined') {
            const total = Number(counts?.total)
            window.dispatchEvent(
              new CustomEvent('productShareRecorded', {
                detail: {
                  productId: String(productId),
                  total: Number.isFinite(total) && total >= 0 ? Math.round(total) : null
                }
              })
            )
          }
        } catch {
          // noop
        }
      } catch {
        // noop
      }

      toast({
        title: "Partage enregistré! 🎉",
        description: `Vous avez gagné ${share.points_earned} points`,
        variant: "default",
      })
    }

    setIsSharing(false)
  }

  const handleShare = async (platform: string) => {
    if (!requireAuth("Connectez-vous pour gagner des points en partageant.")) {
      return
    }

    // Vérifier l'éligibilité: si déjà récompensé / propre produit => pas de modal, partage direct sans points.
    const elig = await ShareEngagementService.checkShareEligibility(productId, platform)
    if (!elig) {
      await runShare(platform, true)
      return
    }

    if (!elig.canEarnPoints) {
      await runShare(platform, false)
      return
    }

    // Éligible: afficher mini-modal pour choisir où prendre les points.
    pendingShareRef.current = { platform }
    setConfirmPlatform(platform)
    setConfirmPoints(elig.points)
    setConfirmOpen(true)
  }

  const totalShares = Object.values(shares).reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex items-center space-x-2">
      <ShareConfirmModal
        open={confirmOpen}
        platform={(confirmPlatform || 'copy') as any}
        points={confirmPoints}
        onOpenChange={(next) => {
          if (!next) {
            setConfirmOpen(false)
            pendingShareRef.current = null
          }
        }}
        onEarnPoints={() => {
          const p = pendingShareRef.current?.platform
          setConfirmOpen(false)
          pendingShareRef.current = null
          if (p) void runShare(p, true)
        }}
        onShareNoPoints={() => {
          const p = pendingShareRef.current?.platform
          setConfirmOpen(false)
          pendingShareRef.current = null
          if (p) void runShare(p, false)
        }}
      />
      <DropdownMenu
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIsOpen(false)
            return
          }
          if (!requireAuth("Connectez-vous pour gagner des points en partageant.")) {
            setIsOpen(false)
            return
          }
          setIsOpen(true)
        }}
      >
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
          {(['facebook', 'whatsapp', 'twitter', 'instagram', 'linkedin', 'tiktok'] as const).map((platform) => {
            const Icon = {
              facebook: FaFacebook,
              whatsapp: FaWhatsapp,
              twitter: FaXTwitter,
              instagram: FaInstagram,
              linkedin: FaLinkedin,
              tiktok: FaTiktok
            }[platform]
            
            const colors = {
              facebook: 'bg-blue-600 hover:text-blue-600 hover:bg-blue-50',
              whatsapp: 'bg-green-500 hover:text-green-600 hover:bg-green-50',
              twitter: 'bg-black hover:text-black hover:bg-gray-50',
              instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:text-pink-500 hover:bg-pink-50',
              linkedin: 'bg-blue-700 hover:text-blue-700 hover:bg-blue-50',
              tiktok: 'bg-black hover:text-black hover:bg-gray-50'
            }[platform]

            return (
              <DropdownMenuItem
                key={platform}
                onClick={() => handleShare(platform)}
                className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 ${colors.split(' hover:')[0]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className={`font-semibold text-gray-900 transition-colors duration-300 ${colors.split('hover:')[1]}`}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">+{pointsConfig[platform] || pointsConfig.copy || 5} points</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs animate-pulse">
                  {(shares as any)[platform] || 0}
                </Badge>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
