"use client"

/**
 * Boutons de Partage Synchronisés avec Supabase
 * Enregistre automatiquement les partages et attribue les points
 */

import { useEffect, useState, useRef } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { FaWhatsapp, FaFacebook, FaXTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ShareEngagementService } from "@/lib/services/share-engagement-service"
import { useAuth } from "@/contexts/AuthContext"
import { useAuthGuard } from "@/lib/hooks/use-auth-guard"
import { ShareConfirmModal } from "@/components/product/share-confirm-modal"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface ShareButtonsSyncedProps {
  productId: string
  productName: string
  productImage?: string
  vendorId: string
  className?: string
}

export default function ShareButtonsSynced({
  productId,
  productName,
  productImage,
  vendorId,
  className = ''
}: ShareButtonsSyncedProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [sharingPlatform, setSharingPlatform] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmPlatform, setConfirmPlatform] = useState<string>('')
  const [confirmPoints, setConfirmPoints] = useState<number>(0)
  const pendingShareRef = useRef<{ platform: string; openWindow: () => Promise<void> } | null>(null)
  const [pointsConfig, setPointsConfig] = useState<Record<string, number>>({})

  useEffect(() => {
    let isMounted = true

    const loadPointsConfig = async () => {
      const platforms = ['facebook', 'twitter', 'whatsapp', 'instagram', 'linkedin', 'tiktok', 'copy']
      const config: Record<string, number> = {}

      for (const platform of platforms) {
        try {
          config[platform] = await ShareEngagementService.getPointsConfig(platform)
        } catch {
          // noop
        }
      }

      if (isMounted) {
        setPointsConfig(config)
      }
    }

    loadPointsConfig()

    return () => {
      isMounted = false
    }
  }, [])

  const resolvePoints = (platform: string, fallback: number) => {
    const value = Number(pointsConfig?.[platform])
    return Number.isFinite(value) && value > 0 ? value : fallback
  }

  // Générer l'URL de partage
  const getShareUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/products/${productId}?ref=${user?.id || 'guest'}`
  }

  const requireAuth = (message: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: message,
        variant: "destructive",
      })
      return false
    }
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

    try {
      setSharingPlatform(platform)
      const shareRow = await ShareEngagementService.recordShare(
        String(user?.id ?? ''),
        String(productId),
        safeVendorId,
        String(platform),
        String(getShareUrl()),
        { awardPoints }
      )

      if (shareRow) {
        try {
          const counts = await ShareEngagementService.getProductShareCounts(String(productId))
          const total = Number(counts?.total)
          if (typeof window !== 'undefined') {
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

        toast({
          title: "Partage enregistré! ",
          description: `Vous avez gagné ${shareRow.points_earned} points`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Erreur enregistrement partage:', error)
    } finally {
      setSharingPlatform(null)
    }
  }

  const openShareWindow = async (platform: string) => {
    const shareUrl = getShareUrl()
    switch (platform) {
      case 'facebook': {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        window.open(url, '_blank', 'width=600,height=400')
        return
      }
      case 'twitter': {
        const text = `Découvrez ${productName} sur Probooster!`
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
        window.open(url, '_blank', 'width=600,height=400')
        return
      }
      case 'whatsapp': {
        const text = `Découvrez ${productName} sur Probooster! ${shareUrl}`
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
        return
      }
      case 'linkedin': {
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        window.open(url, '_blank', 'width=600,height=400')
        return
      }
      case 'copy': {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
        toast({
          title: 'Lien copié!',
          description: 'Le lien a été copié dans le presse-papier',
          variant: 'default'
        })
        return
      }
      default:
        return
    }
  }

  const handleShare = async (platform: string) => {
    if (!requireAuth("Connectez-vous pour gagner des points en partageant.")) {
      return
    }

    const elig = await ShareEngagementService.checkShareEligibility(String(productId), String(platform))
    if (!elig) {
      await openShareWindow(platform)
      await runShare(platform, true)
      return
    }

    if (!elig.canEarnPoints) {
      await openShareWindow(platform)
      await runShare(platform, false)
      return
    }

    pendingShareRef.current = { platform, openWindow: () => openShareWindow(platform) }
    setConfirmPlatform(platform)
    setConfirmPoints(elig.points)
    setConfirmOpen(true)
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
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
          const openWindow = pendingShareRef.current?.openWindow
          setConfirmOpen(false)
          pendingShareRef.current = null
          if (p) {
            void (async () => {
              await openWindow?.()
              await runShare(p, true)
            })()
          }
        }}
        onShareNoPoints={() => {
          const p = pendingShareRef.current?.platform
          const openWindow = pendingShareRef.current?.openWindow
          setConfirmOpen(false)
          pendingShareRef.current = null
          if (p) {
            void (async () => {
              await openWindow?.()
              await runShare(p, false)
            })()
          }
        }}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleShare('facebook')}
        disabled={sharingPlatform === 'facebook'}
        className="border-blue-300 hover:bg-blue-50"
        title={`Partager sur Facebook (+${resolvePoints('facebook', 10)} points)`}
      >
        <FaFacebook className="w-4 h-4 text-blue-600" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleShare('twitter')}
        disabled={sharingPlatform === 'twitter'}
        className="border-gray-300 hover:bg-gray-50"
        title={`Partager sur Twitter (+${resolvePoints('twitter', 8)} points)`}
      >
        <FaXTwitter className="w-4 h-4 text-black" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleShare('whatsapp')}
        disabled={sharingPlatform === 'whatsapp'}
        className="border-green-300 hover:bg-green-50"
        title={`Partager sur WhatsApp (+${resolvePoints('whatsapp', 5)} points)`}
      >
        <FaWhatsapp className="w-4 h-4 text-green-600" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleShare('linkedin')}
        disabled={sharingPlatform === 'linkedin'}
        className="border-blue-300 hover:bg-blue-50"
        title={`Partager sur LinkedIn (+${resolvePoints('linkedin', 12)} points)`}
      >
        <FaLinkedin className="w-4 h-4 text-blue-700" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => void handleShare('copy')}
        className="border-gray-300 hover:bg-gray-50"
        title={`Copier le lien (+${resolvePoints('copy', 3)} points)`}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-gray-600" />
        )}
      </Button>
    </div>
  )
}

// Version compacte avec dropdown
export function ShareButtonCompact({
  productId,
  productName,
  productImage,
  vendorId,
  className = ''
}: ShareButtonsSyncedProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="border-gray-300 hover:bg-gray-50"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Partager
      </Button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <ShareButtonsSynced
              productId={productId}
              productName={productName}
              productImage={productImage}
              vendorId={vendorId}
            />
          </div>
        </>
      )}
    </div>
  )
}
