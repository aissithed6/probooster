"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Percent, Truck, Star } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientSpecialPromotionsSection } from "@/app/dashboard/components/ClientSpecialPromotionsSection"
import { useCart } from "@/hooks/use-cart"
import { useMoney } from "@/lib/hooks/use-money"

interface PublicPromotion {
  id: string
  name: string
  description?: string | null
  type: "coupon" | "discount" | "flash_sale" | "bundle"
  status: "draft" | "active" | "paused" | "ended"
  start_date: string
  end_date: string
  discount_type: "percentage" | "fixed" | "free_shipping"
  discount_value: number
  applicable_products: string[]
  created_at: string
  updated_at: string
}

interface ProductRow {
  id: string
  name: string
  price: number
  images: string[] | null
  rating?: number | null
  total_reviews?: number | null
}

interface OfferCard {
  product: ProductRow
  originalPrice: number
  discountedPrice: number
  hasFreeShipping: boolean
  promoBadge: string
  promotionId?: string
}

/**
 * Calcule le prix remisé selon le type de promotion.
 */
function computeDiscount(price: number, discountType: PublicPromotion["discount_type"], discountValue: number) {
  if (discountType === "percentage") {
    const discounted = price * (1 - (discountValue || 0) / 100)
    return Math.max(0, Math.round(discounted))
  }
  if (discountType === "fixed") {
    return Math.max(0, Math.round(price - (discountValue || 0)))
  }
  return price
}

/**
 * Page client affichant les offres promotionnelles actives.
 * - Récupère GET /api/public/promotions
 * - Charge les produits associés depuis Supabase
 * - Affiche des cartes produit avec badge et prix barré
 */
export default function OffresPromotionnellesPage() {
  const { addToCart, isInCart } = useCart()
  const { formatMoney } = useMoney()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offers, setOffers] = useState<OfferCard[]>([])
  const [activeTab, setActiveTab] = useState<"offers" | "specials">("offers")
  const [specialsCount, setSpecialsCount] = useState(0)
  const [prefetchedSpecials, setPrefetchedSpecials] = useState<any[]>([])

  /**
   * Charge les offres côté serveur en désactivant le cache afin de refléter instantanément
   * les promotions mises en pause / réactivées.
   */
  const loadOffers = async () => {
    const resp = await fetch("/api/public/offers", { cache: 'no-store' })
    if (!resp.ok) throw new Error("Impossible de charger les promotions publiques")
    const offersData: OfferCard[] = await resp.json()
    return offersData
  }

  useEffect(() => {
    let mounted = true
    if (typeof window !== 'undefined') {
      try {
        const cachedOffers = window.localStorage.getItem('public_offers_cache_v1')
        if (cachedOffers) {
          const parsed = JSON.parse(cachedOffers)
          if (mounted && Array.isArray(parsed)) {
            setOffers(parsed)
            setLoading(false)
          }
        }
      } catch {
        // silencieux
      }
    }
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        // 1) Offres enrichies (promotions + produits) via API serveur
        const offersData = await loadOffers()
        if (mounted) setOffers(offersData)
      } catch (e: any) {
        console.error(e)
        if (mounted) setError(e?.message || "Erreur lors du chargement des offres")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('public_offers_cache_v1', JSON.stringify(offers))
    } catch {
      // silencieux
    }
  }, [offers])

  useEffect(() => {
    let mounted = true
    if (typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('public_specials_cache_v1')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (mounted && Array.isArray(parsed)) {
            setPrefetchedSpecials(parsed)
            setSpecialsCount(parsed.length)
          }
        }
      } catch {
        // silencieux
      }
    }
    const prefetchSpecials = async () => {
      try {
        const resp = await fetch('/api/public/special-promotions', { cache: 'no-store' })
        if (!resp.ok) throw new Error('Impossible de charger les promotions spéciales')
        const data: unknown = await resp.json()
        const items = Array.isArray(data) ? data : []
        if (!mounted) return
        setPrefetchedSpecials(items as any[])
        setSpecialsCount(items.length)
      } catch {
        if (!mounted) return
        setPrefetchedSpecials([])
        setSpecialsCount(0)
      }
    }
    void prefetchSpecials()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('public_specials_cache_v1', JSON.stringify(prefetchedSpecials))
    } catch {
      // silencieux
    }
  }, [prefetchedSpecials])

  useEffect(() => {
    const refresh = async () => {
      try {
        const offersData = await loadOffers()
        setOffers(offersData)
      } catch {
        // silencieux
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const hasOffers = useMemo(() => offers.length > 0, [offers])

  const offersCount = useMemo(() => {
    const ids = new Set<string>()
    for (const o of offers) {
      const pid = (o as any)?.promotionId
      if (typeof pid === 'string' && pid) ids.add(pid)
    }
    return ids.size > 0 ? ids.size : offers.length
  }, [offers])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Offres promotionnelles</h1>
            <p className="text-gray-600 mt-2">Découvrez nos meilleures promotions en cours</p>
          </div>
          <Badge className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0 flex items-center gap-1">
            <Gift className="h-4 w-4" /> Offres actives
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
            <TabsTrigger value="offers">
              <span className="inline-flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{offersCount}</Badge>
                <span>Offres promotionnelles</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="specials">
              <span className="inline-flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-700 border border-gray-200">{specialsCount}</Badge>
                <span>Promotions spéciales</span>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="specials" forceMount>
            <ClientSpecialPromotionsSection initialItems={prefetchedSpecials as any} onCountChange={setSpecialsCount} />
          </TabsContent>

          <TabsContent value="offers" forceMount>

        {loading && (
          <div className="grid place-items-center py-24">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-4 border-orange-200 border-t-[#ff6600] rounded-full mx-auto mb-3" />
              <p className="text-gray-600">Chargement des offres...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-red-600 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && !hasOffers && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CardTitle className="text-xl mb-2">Aucune offre disponible</CardTitle>
              <p className="text-gray-600">Revenez plus tard pour découvrir de nouvelles promotions.</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && hasOffers && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offers.map((o, idx) => (
              <Card key={`${o.product.id}-${idx}`} className="group hover:shadow-xl transition-all duration-300 overflow-hidden rounded-2xl">
                <div className="relative">
                  <Image
                    src={(o.product.images?.[0] as string) || "/placeholder.svg"}
                    alt={o.product.name}
                    width={400}
                    height={300}
                    className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-3 left-3 bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0">
                    <Percent className="h-3 w-3 mr-1" /> {o.promoBadge}
                  </Badge>
                  {o.hasFreeShipping && (
                    <Badge className="absolute top-3 right-3 bg-green-600 text-white border-0">
                      <Truck className="h-3 w-3 mr-1" /> Gratuit
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 text-lg text-gray-900 group-hover:text-[#ff6600] transition-colors">
                    {o.product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold text-[#ff6600]">{formatMoney(o.discountedPrice)}</span>
                    {o.originalPrice > o.discountedPrice && (
                      <span className="text-sm text-gray-500 line-through">{formatMoney(o.originalPrice)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>{o.product.rating ?? 4.5}/5</span>
                    <span>•</span>
                    <span>{o.product.total_reviews ?? 25} avis</span>
                  </div>
                  <div className="mt-4">
                    <Button className="w-full bg-gradient-to-r from-[#ff6600] to-[#ff8533] hover:from-[#e55a00] hover:to-[#ff6600] text-white border-0">
                      Voir le produit
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button
                      className="w-full border border-[#ff6600] text-[#ff6600] bg-white hover:bg-orange-50"
                      variant="outline"
                      disabled={isInCart(o.product.id)}
                      onClick={() => {
                        const image = (o.product.images?.[0] as string) || "/placeholder.svg"
                        addToCart({
                          id: o.product.id,
                          name: o.product.name,
                          price: o.discountedPrice,
                          originalPrice: o.originalPrice,
                          image,
                          seller: "Vendeur Probooster",
                          inStock: true,
                        })
                      }}
                    >
                      {isInCart(o.product.id) ? "Déjà au panier" : "Ajouter au panier"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
