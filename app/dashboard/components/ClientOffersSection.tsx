"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCart } from "@/hooks/use-cart";

interface OfferApiItem {
  product: {
    id: string
    name: string
    price: number
    images?: any
    rating?: number
    total_reviews?: number
  }
  originalPrice: number
  discountedPrice: number
  hasFreeShipping: boolean
  promoBadge: string
  promotionId: string
  promotionName?: string
  promotionDescription?: string
  discountType?: string
  discountValue?: number
  startDate?: string
  endDate?: string
}

interface ClientPromotionCard {
  id: string
  title: string
  description?: string
  type: "flash" | "discount" | "bundle" | "points_multiplier" | "shipping" | "other"
  valueLabel: string
  startDate?: string
  endDate?: string
  usageCount: number
  maxUsage?: number
  isActive: boolean
  priority: 1 | 2 | 3
  conditions: string[]
  products: Array<{
    id: string
    name: string
    originalPrice: number
    discountedPrice: number
    image: string
    seller: string
  }>
}

interface ClientOffersSectionProps {
  onCountChange?: (count: number) => void
}

/**
 * ClientOffersSection
 * Section "Offres Promotionnelles" du tableau de bord client (ancienne page).
 * Consomme `/api/public/offers` et reconstruit des cartes de promotions
 * dans un style proche de la boucle realPromotions.map existante.
 */
export function ClientOffersSection({ onCountChange }: ClientOffersSectionProps = {}) {
  const [offers, setOffers] = useState<OfferApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productsModalOpen, setProductsModalOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<ClientPromotionCard["products"] | null>(null)
  const [selectedPromotionTitle, setSelectedPromotionTitle] = useState<string>("")
  const { addToCart, isInCart } = useCart()

  /**
   * Charge les offres côté serveur en désactivant le cache afin de refléter instantanément
   * les promotions mises en pause / réactivées.
   */
  const loadOffers = useCallback(async () => {
    const resp = await fetch("/api/public/offers", { cache: 'no-store' })
    if (!resp.ok) throw new Error("Impossible de charger les offres")
    const data: OfferApiItem[] = await resp.json()
    return data
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await loadOffers()
        if (mounted) {
          setOffers(data)
          const ids = new Set<string>()
          for (const o of data || []) {
            if (o?.promotionId) ids.add(o.promotionId)
          }
          onCountChange?.(ids.size)
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Erreur lors du chargement des offres")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [loadOffers, onCountChange])

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await loadOffers()
        setOffers(data)

        const ids = new Set<string>()
        for (const o of data || []) {
          if (o?.promotionId) ids.add(o.promotionId)
        }
        onCountChange?.(ids.size)
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
  }, [loadOffers, onCountChange])

  const promotions = useMemo<ClientPromotionCard[]>(() => {
    if (!offers || offers.length === 0) return []

    const byPromotion = new Map<string, OfferApiItem[]>()
    for (const o of offers) {
      if (!o.promotionId) continue
      const list = byPromotion.get(o.promotionId) ?? []
      list.push(o)
      byPromotion.set(o.promotionId, list)
    }

    const cards: ClientPromotionCard[] = []
    for (const [promotionId, group] of byPromotion.entries()) {
      const first = group[0]
      const avgDiscount = group.reduce((acc, o) => acc + Math.max(0, (o.originalPrice || 0) - (o.discountedPrice || 0)), 0) / group.length || 0
      const discountPercent = first.originalPrice > 0
        ? Math.round(100 - (first.discountedPrice * 100) / first.originalPrice)
        : Math.max(5, Math.round((avgDiscount / (first.originalPrice || 1)) * 100))

      const discountType = first.discountType || "percentage"
      let valueLabel = "";
      if (discountType === "percentage") {
        valueLabel = `-${first.discountValue ?? discountPercent}%`
      } else if (discountType === "fixed") {
        valueLabel = `-${first.discountValue ?? avgDiscount} FCFA`
      } else if (discountType === "free_shipping") {
        valueLabel = "Livraison gratuite"
      } else {
        valueLabel = first.promoBadge || "Promotion"
      }

      const type: ClientPromotionCard["type"] =
        discountType === "percentage" || discountType === "fixed" ? "discount" :
        discountType === "free_shipping" ? "shipping" :
        "other"

      let priority: 1 | 2 | 3 = 3
      if ((first.discountValue ?? discountPercent) >= 50) priority = 1
      else if ((first.discountValue ?? discountPercent) >= 20) priority = 2

      const title = first.promotionName || "Promotion spéciale"
      const description = first.promotionDescription || `Profitez d'une remise sur ${group.length} produit(s) sélectionné(s).`

      const conditions: string[] = []
      if (discountType === "percentage") conditions.push("Remise appliquée automatiquement au panier.")
      if (discountType === "fixed") conditions.push("Réduction fixe sur le prix du produit.")
      if (discountType === "free_shipping") conditions.push("Livraison gratuite sur les produits éligibles.")

      const products = group.map((g) => ({
        id: g.product.id,
        name: g.product.name,
        originalPrice: g.originalPrice,
        discountedPrice: g.discountedPrice,
        image: (() => {
          const img = Array.isArray(g.product.images) && g.product.images.length > 0 ? g.product.images[0] : null
          if (!img) return "/placeholder.svg"
          if (typeof img === 'string') return img
          return img.url || "/placeholder.svg"
        })(),
        seller: "Vendeur Probooster",
      }))

      cards.push({
        id: promotionId,
        title,
        description,
        type,
        valueLabel,
        startDate: first.startDate,
        endDate: first.endDate,
        usageCount: group.length,
        maxUsage: undefined,
        isActive: true,
        priority,
        conditions,
        products,
      })
    }

    return cards
  }, [offers])

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-md bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-md bg-gray-100 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-md border border-red-200 bg-red-50 text-sm text-red-700 flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span>{error}</span>
      </div>
    )
  }

  if (!promotions.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-gray-500">
          <Package className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          Aucune offre promotionnelle disponible pour le moment.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
          {promotions.length} promotion{promotions.length > 1 ? 's' : ''} active{promotions.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-6">
        {promotions.map((promotion, index) => (
          <Card
            key={promotion.id}
            className={`border-2 transition-all duration-500 hover:scale-105 ${
              promotion.priority === 1
                ? "border-red-300 bg-gradient-to-r from-red-50 to-orange-50 animate-pulse dark:border-red-700/60 dark:from-red-950/40 dark:to-orange-950/30"
                : promotion.priority === 2
                ? "border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 dark:border-orange-700/60 dark:from-orange-950/30 dark:to-yellow-950/25"
                : "border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-700/60 dark:from-blue-950/35 dark:to-purple-950/25"
            }`}
            style={{
              animationDelay: `${index * 200}ms`,
              animation: "fadeInUp 0.6s ease-out forwards",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{promotion.title}</h3>
                    <Badge className="text-white bg-orange-500">
                      {promotion.valueLabel}
                    </Badge>
                    {promotion.priority === 1 && (
                      <Badge className="bg-red-500 text-white animate-bounce">🔥 Priorité Haute</Badge>
                    )}
                  </div>
                  {promotion.description && (
                    <p className="text-gray-700 dark:text-gray-200 mb-4 text-lg">{promotion.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {promotion.startDate && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Début</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(promotion.startDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {promotion.endDate && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-300">Fin</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{new Date(promotion.endDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Produits</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{promotion.usageCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-300">Statut</p>
                      <Badge className={promotion.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {promotion.isActive ? "✅ Active" : "❌ Expirée"}
                      </Badge>
                    </div>
                  </div>

                  {promotion.conditions.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Conditions d'utilisation:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        {promotion.conditions.map((condition, idx) => (
                          <li key={idx} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full" />
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-3">
                  <Button
                    className="text-white bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    onClick={() => {
                      setSelectedProducts(promotion.products)
                      setSelectedPromotionTitle(promotion.title)
                      setProductsModalOpen(true)
                    }}
                  >
                    <Tag className="w-5 h-5 mr-2" />
                    Voir les produits
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={productsModalOpen} onOpenChange={setProductsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5 text-orange-600" />
              <span>Produits éligibles</span>
            </DialogTitle>
            <DialogDescription>
              {selectedPromotionTitle || "Liste des produits éligibles à cette promotion"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {(selectedProducts ?? []).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center text-sm text-gray-500">
                  Aucun produit n'est associé à cette promotion pour le moment.
                </CardContent>
              </Card>
            ) : (
              (selectedProducts ?? []).map((p) => {
                const hasDiscount = p.discountedPrice < p.originalPrice
                const discountPercent = hasDiscount && p.originalPrice > 0
                  ? Math.round(100 - (p.discountedPrice * 100) / p.originalPrice)
                  : 0
                const alreadyInCart = isInCart(p.id)
                return (
                  <Card key={p.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium line-clamp-2">{p.name}</CardTitle>
                      <CardDescription className="text-xs text-gray-500">ID: {p.id}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 flex items-center justify-between">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-semibold text-gray-900">{p.discountedPrice.toLocaleString()} FCFA</span>
                        {hasDiscount && (
                          <>
                            <span className="text-sm text-gray-400 line-through">{p.originalPrice.toLocaleString()} FCFA</span>
                            {discountPercent > 0 && (
                              <Badge className="bg-red-500 text-white text-xs py-0 px-2">-{discountPercent}%</Badge>
                            )}
                          </>
                        )}
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={alreadyInCart ? "outline" : "default"}
                          disabled={alreadyInCart}
                          onClick={() => {
                            addToCart({
                              id: p.id,
                              name: p.name,
                              price: p.discountedPrice,
                              originalPrice: p.originalPrice,
                              image: p.image,
                              seller: p.seller,
                              inStock: true,
                            })
                          }}
                        >
                          {alreadyInCart ? "Déjà au panier" : "Ajouter au panier"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ClientOffersSection;
