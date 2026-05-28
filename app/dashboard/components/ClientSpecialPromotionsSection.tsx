"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription as DialogDesc, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Zap, ChevronRight } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useMoney } from "@/lib/hooks/use-money"

interface SpecialPromotion {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  end_date: string
  gradient_from: string
  gradient_to: string
  text_color: string
  products?: Array<{
    id: string
    name: string
    price: number
    originalPrice?: number
    discountedPrice?: number
    hasFreeShipping?: boolean
    promoBadge?: string
    images?: any
    rating?: number | null
    total_reviews?: number | null
  }>
}

interface ClientSpecialPromotionsSectionProps {
  onCountChange?: (count: number) => void
  initialItems?: SpecialPromotion[]
}

/**
 * ClientSpecialPromotionsSection
 * Affiche les promotions spéciales actives en consommant l'API `/api/public/special-promotions`.
 */
export function ClientSpecialPromotionsSection({ onCountChange, initialItems }: ClientSpecialPromotionsSectionProps = {}) {
  const [items, setItems] = useState<SpecialPromotion[]>(() => (Array.isArray(initialItems) ? initialItems : []))
  const [loading, setLoading] = useState(() => !Array.isArray(initialItems))
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedSpecial, setSelectedSpecial] = useState<SpecialPromotion | null>(null)
  const { addToCart, isInCart } = useCart()
  const { formatMoney } = useMoney()

  const resolveReadableTextColor = (value?: string | null) => {
    const v = typeof value === 'string' ? value.trim() : ''
    const hex = v.startsWith('#') ? v.slice(1) : v
    if (!hex) return undefined
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return v
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    if (brightness < 80) return '#ffffff'
    return v
  }

  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!Array.isArray(initialItems)) return
    setItems(initialItems)
    onCountChange?.(initialItems.length)
    setLoading(false)
  }, [initialItems, onCountChange])

  /**
   * Charge les promotions spéciales côté client en désactivant le cache.
   */
  const load = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true)
      const resp = await fetch("/api/public/special-promotions", { cache: 'no-store' })
      if (!resp.ok) throw new Error("Impossible de charger les promotions spéciales")
      const data: SpecialPromotion[] = await resp.json()

      if (!mountedRef.current) return
      setItems(Array.isArray(data) ? data : [])
      onCountChange?.(Array.isArray(data) ? data.length : 0)
    } catch (_e) {
      if (!mountedRef.current) return
      setItems([])
      onCountChange?.(0)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [onCountChange])

  useEffect(() => {
    void load({ silent: true })
  }, [load])

  // Rafraîchir automatiquement au retour sur l'onglet / focus fenêtre
  useEffect(() => {
    const refresh = () => {
      void load({ silent: true })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }, 15000)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(interval)
    }
  }, [load])

  const formatDate = (value: string) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric", timeZone: 'UTC' })
  }

  /**
   * Ouvre le modal de détails d'une promotion spéciale.
   */
  const openDetails = (special: SpecialPromotion) => {
    setSelectedSpecial(special)
    setDetailsOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span>Promotions Spéciales</span>
          </CardTitle>
          <CardDescription>Offres exclusives et limitées dans le temps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            <span>Promotions Spéciales</span>
          </CardTitle>
          <CardDescription>Offres exclusives et limitées dans le temps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-gray-500">
            Aucune promotion spéciale n'est disponible pour le moment.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <span>Promotions Spéciales</span>
        </CardTitle>
        <CardDescription>Offres exclusives et limitées dans le temps</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((special, index) => (
            <Card
              key={special.id}
              className="text-white hover:scale-105 transition-all duration-500 ease-out cursor-pointer shadow-lg hover:shadow-2xl border-2 border-transparent hover:border-white/30 group"
              onClick={() => openDetails(special)}
              style={{
                animationDelay: `${index * 200}ms`,
                animation: "fadeInUp 0.8s ease-out forwards",
                backgroundImage: `linear-gradient(135deg, ${special.gradient_from}, ${special.gradient_to})`,
                backgroundColor: special.gradient_from,
                color: resolveReadableTextColor(special.text_color) || undefined,
              }}
            >
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-xl mb-2">{special.title}</h3>
                {special.description && (
                  <p className="text-lg mb-4 opacity-90">{special.description}</p>
                )}
                <div className="text-sm opacity-75">
                  Se termine le {formatDate(special.end_date)}
                </div>
                {Array.isArray(special.products) && special.products.length > 0 && (
                  <div className="mt-3">
                    <Badge variant="secondary" className="bg-white/20 text-white border border-white/20">
                      {special.products.length} produit{special.products.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-4 border-white text-white hover:bg-white hover:text-black transform hover:scale-110 active:scale-95 transition-all duration-300 ease-out shadow-lg hover:shadow-xl animate-pulse hover:animate-none group relative overflow-hidden"
                  onClick={(e) => {
                    e.stopPropagation()
                    openDetails(special)
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
                  <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  En savoir plus
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <span>{selectedSpecial?.title ?? 'Promotion spéciale'}</span>
              </DialogTitle>
              <DialogDesc>
                {selectedSpecial?.description ?? 'Découvrez les produits concernés et profitez de cette offre limitée.'}
              </DialogDesc>
            </DialogHeader>

            <div className="space-y-4">
              {selectedSpecial?.end_date ? (
                <div className="text-sm text-gray-600">
                  Se termine le {formatDate(selectedSpecial.end_date)}
                </div>
              ) : null}

              {(selectedSpecial?.products ?? []).length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center text-sm text-gray-500">
                    Aucun produit n'est associé à cette promotion pour le moment.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedSpecial?.products ?? []).map((p) => {
                    const rawPrice = typeof p.price === 'number' ? p.price : Number((p as any).price ?? 0)
                    const price = Number.isFinite(rawPrice) ? rawPrice : 0
                    const originalPriceRaw = typeof (p as any).originalPrice === 'number'
                      ? (p as any).originalPrice
                      : price
                    const discountedPriceRaw = typeof (p as any).discountedPrice === 'number'
                      ? (p as any).discountedPrice
                      : price
                    const originalPrice = Number.isFinite(originalPriceRaw) ? originalPriceRaw : price
                    const discountedPrice = Number.isFinite(discountedPriceRaw) ? discountedPriceRaw : price
                    const alreadyInCart = isInCart(p.id)
                    const image = (() => {
                      const img = Array.isArray((p as any).images) && (p as any).images.length > 0 ? (p as any).images[0] : null
                      if (!img) return "/placeholder.svg"
                      if (typeof img === 'string') return img
                      return img.url || "/placeholder.svg"
                    })()

                    return (
                      <Card key={p.id} className="overflow-hidden">
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                              <img src={image} alt={p.name} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">{p.name}</div>
                              <div className="text-sm text-gray-600">
                                <span className="font-semibold text-orange-600">{formatMoney(Math.round(discountedPrice))}</span>
                                {discountedPrice < originalPrice && (
                                  <span className="ml-2 text-gray-400 line-through">{formatMoney(Math.round(originalPrice))}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant={alreadyInCart ? "outline" : "default"}
                            disabled={alreadyInCart}
                            onClick={() => {
                              addToCart({
                                id: p.id,
                                name: p.name,
                                price: Math.round(discountedPrice),
                                originalPrice: Math.round(originalPrice),
                                image,
                                seller: "Vendeur Probooster",
                                inStock: true,
                              })
                            }}
                          >
                            {alreadyInCart ? "Déjà au panier" : "Ajouter au panier"}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ClientSpecialPromotionsSection
