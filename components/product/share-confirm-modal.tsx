"use client"

import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FaWhatsapp, FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaTiktok } from 'react-icons/fa6'
import { Share2, Sparkles, Coins } from 'lucide-react'

type SharePlatform = 'facebook' | 'twitter' | 'whatsapp' | 'instagram' | 'linkedin' | 'tiktok' | 'copy'

const PLATFORM_META: Record<SharePlatform, { label: string; icon: React.ComponentType<any> }> = {
  facebook: { label: 'Facebook', icon: FaFacebook },
  twitter: { label: 'X (Twitter)', icon: FaXTwitter },
  whatsapp: { label: 'WhatsApp', icon: FaWhatsapp },
  instagram: { label: 'Instagram', icon: FaInstagram },
  linkedin: { label: 'LinkedIn', icon: FaLinkedin },
  tiktok: { label: 'TikTok', icon: FaTiktok },
  copy: { label: 'Copier le lien', icon: Share2 }
}

export function ShareConfirmModal({
  open,
  platform,
  points,
  onEarnPoints,
  onShareNoPoints,
  onOpenChange,
  disableAnimations
}: {
  open: boolean
  platform: SharePlatform
  points: number
  onEarnPoints: () => void
  onShareNoPoints: () => void
  onOpenChange: (open: boolean) => void
  disableAnimations?: boolean
}) {
  /**
   * Mini modal de confirmation avant partage.
   * Il explique que les points ne peuvent être gagnés qu'une seule fois par produit.
   */
  const meta = PLATFORM_META[platform] ?? PLATFORM_META.copy
  const Icon = meta.icon
  const safePoints = Math.max(0, Math.round(Number(points) || 0))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        disableAnimations={disableAnimations}
        className={cn(
          'max-w-md overflow-hidden border-0 p-0 shadow-2xl',
          !disableAnimations && 'data-[state=open]:animate-in data-[state=closed]:animate-out'
        )}
      >
        <DialogTitle className="sr-only">Confirmation de partage</DialogTitle>
        <div className={cn('relative', !disableAnimations && 'motion-safe:animate-in motion-safe:fade-in-0')}>
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-95', 'from-zinc-900 via-zinc-800 to-[#ff6600]')} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,102,0,0.25),transparent_60%)]" />

          <div className="relative p-6 text-white">
            <div className="flex items-start gap-4">
              <div className={cn(
                'h-12 w-12 rounded-2xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center',
                !disableAnimations && 'motion-safe:animate-in motion-safe:zoom-in-95'
              )}>
                <Icon className={cn('h-6 w-6', !disableAnimations && 'motion-safe:animate-bounce')} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold tracking-tight">Partager sur {meta.label}</h3>
                  <Sparkles className={cn('h-5 w-5 text-white/90', !disableAnimations && 'motion-safe:animate-pulse')} />
                </div>

                <p className="mt-1 text-sm text-white/90 leading-relaxed">
                  Les points pour ce produit ne peuvent être gagnés <span className="font-bold">qu’une seule fois</span>,
                  sur <span className="font-bold">un seul réseau</span>.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-white/10 ring-1 ring-white/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Coins className={cn('h-5 w-5 text-yellow-200', !disableAnimations && 'motion-safe:animate-pulse')} />
                  <span className="text-sm font-semibold">Récompense sur ce réseau</span>
                </div>
                <span className={cn(
                  'px-3 py-1 rounded-full bg-black/20 ring-1 ring-white/20 text-sm font-extrabold',
                  !disableAnimations && 'motion-safe:animate-in motion-safe:slide-in-from-right-2'
                )}>
                  +{safePoints} points
                </span>
              </div>

              <p className="mt-2 text-xs text-white/85">
                Tu peux aussi partager sans points et garder la récompense pour un autre réseau.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className={cn(
                  'h-11 rounded-xl bg-white text-zinc-900 hover:bg-white/90 font-bold shadow-lg',
                  !disableAnimations && 'motion-safe:hover:scale-[1.02] transition-transform'
                )}
                onClick={onEarnPoints}
              >
                Gagner {safePoints} points
              </Button>

              <Button
                variant="outline"
                className={cn(
                  'h-11 rounded-xl border-white/40 text-white bg-transparent hover:bg-white/10 font-semibold',
                  !disableAnimations && 'motion-safe:hover:scale-[1.02] transition-transform'
                )}
                onClick={onShareNoPoints}
              >
                Partager sans points
              </Button>
            </div>

            <button
              type="button"
              className={cn(
                'mt-4 w-full text-center text-xs text-white/80 hover:text-white transition-colors',
                !disableAnimations && 'motion-safe:animate-in motion-safe:fade-in-0'
              )}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
