"use client"

import { RefreshCw, Share2, Zap } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export type ShareDetailsDialogShare = {
  id: string
  createdAt: string
  platform: string
  shareUrl: string
  pointsEarned: number
  shareUserName: string
  shareUserAvatar?: string
  shareUserRole?: string
  productId: string
  productName: string
  productImage?: string
  productVendorName?: string
  interactionsCount?: number
  interactionTypes?: Record<string, number>
  pointsFromInteractions?: number
}

export type ShareDetailsDialogInteraction = {
  id: string
  createdAt: string
  type: string
  platform?: string
  ip?: string
  userAgent?: string
  referrer?: string
}

export type ShareDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  share: ShareDetailsDialogShare | null
  interactions: ShareDetailsDialogInteraction[]
  isLoadingInteractions: boolean
  interactionsError: string | null
  onRetryLoadInteractions?: () => void
}

function formatDateTimeFr(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPlatformBadgeClass(platform: string): string {
  const p = String(platform || '').toLowerCase().trim()
  if (p === 'facebook') return 'bg-blue-100 text-blue-700'
  if (p === 'twitter' || p === 'x') return 'bg-slate-100 text-slate-700'
  if (p === 'whatsapp') return 'bg-emerald-100 text-emerald-700'
  if (p === 'instagram') return 'bg-pink-100 text-pink-700'
  if (p === 'linkedin') return 'bg-indigo-100 text-indigo-700'
  if (p === 'tiktok') return 'bg-gray-900 text-white'
  if (p === 'email') return 'bg-amber-100 text-amber-800'
  if (p === 'copy') return 'bg-gray-100 text-gray-700'
  return 'bg-gray-100 text-gray-700'
}

/**
 * Modal réutilisable: affiche les détails d'un partage + la liste des interactions associées.
 */
export function ShareDetailsDialog({
  open,
  onOpenChange,
  share,
  interactions,
  isLoadingInteractions,
  interactionsError,
  onRetryLoadInteractions
}: ShareDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0">
        <div className="p-6 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-indigo-700" />
              Détails du partage
            </DialogTitle>
            <DialogDescription>Toutes les informations + interactions détaillées (engagement).</DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {!share ? (
            <div className="text-sm text-gray-600">Aucun partage sélectionné.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={share.shareUserAvatar || undefined} alt={share.shareUserName} />
                    <AvatarFallback className="bg-indigo-600 text-white">
                      {String(share.shareUserName || 'U').slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-lg font-semibold text-gray-900">{share.shareUserName}</div>
                      {share.shareUserRole ? (
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          {share.shareUserRole}
                        </Badge>
                      ) : null}
                      <Badge className={getPlatformBadgeClass(share.platform)}>{share.platform}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{formatDateTimeFr(share.createdAt)}</div>
                    <div className="text-xs text-gray-500 mt-1">Share ID: {share.id}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(share.shareUrl, '_blank', 'noopener,noreferrer')}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  >
                    Ouvrir le lien de partage
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Points gagnés (partage)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-900">+{share.pointsEarned} pts</div>
                    <p className="text-xs text-gray-500 mt-1">Attribués selon la config Super Admin</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Interactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-900">{share.interactionsCount ?? 0}</div>
                    <p className="text-xs text-gray-500 mt-1">Vues, clics, conversions, achats</p>
                  </CardContent>
                </Card>

                <Card className="border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-700">Points (interactions)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-fuchsia-900">+{share.pointsFromInteractions ?? 0} pts</div>
                    <p className="text-xs text-gray-500 mt-1">Conversions/achats bonus si activés</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl overflow-hidden border bg-white flex items-center justify-center">
                        {share.productImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={share.productImage} alt={share.productName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-xs text-gray-400">Img</div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{share.productName}</div>
                        <div className="text-sm text-gray-600">Vendeur: {share.productVendorName || '-'}</div>
                        <div className="text-xs text-gray-500">Product ID: {share.productId}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.keys(share.interactionTypes || {}).length > 0 ? (
                        <>
                          <span className="text-xs text-gray-500">Résumé:</span>
                          {Object.entries(share.interactionTypes || {})
                            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                            .map(([t, c]) => (
                              <Badge key={t} variant="outline" className="border-slate-300 text-slate-700">
                                {t}: {c}
                              </Badge>
                            ))}
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Aucun détail d’interaction agrégé.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-emerald-600" />
                    Interactions détaillées
                  </CardTitle>
                  <CardDescription>Liste brute des interactions liées à ce partage.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingInteractions ? (
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Chargement des interactions...
                    </div>
                  ) : interactionsError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="text-sm font-semibold text-red-700">Erreur</div>
                      <div className="text-sm text-red-700 mt-1">{interactionsError}</div>
                      {onRetryLoadInteractions ? (
                        <Button variant="outline" size="sm" className="mt-3" onClick={onRetryLoadInteractions}>
                          Réessayer
                        </Button>
                      ) : null}
                    </div>
                  ) : interactions.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucune interaction enregistrée pour ce partage.</div>
                  ) : (
                    <div className="space-y-2">
                      {interactions.map((i) => (
                        <div
                          key={i.id}
                          className="p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="bg-emerald-100 text-emerald-700">{i.type}</Badge>
                              <Badge className={getPlatformBadgeClass(i.platform || share.platform)}>
                                {i.platform || share.platform || 'platform'}
                              </Badge>
                              <span className="text-sm text-gray-700">{formatDateTimeFr(i.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {i.ip ? (
                                <Badge variant="outline" className="border-slate-300 text-slate-700">
                                  IP: {i.ip}
                                </Badge>
                              ) : null}
                              {i.referrer ? (
                                <Badge variant="outline" className="border-slate-300 text-slate-700 max-w-[520px] truncate">
                                  Ref: {i.referrer}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          {i.userAgent ? (
                            <div className="text-xs text-gray-500 mt-2 break-words">User-Agent: {i.userAgent}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
