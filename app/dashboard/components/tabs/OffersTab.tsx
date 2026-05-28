"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientSpecialPromotionsSection from "@/app/dashboard/components/ClientSpecialPromotionsSection";
import { useCart } from "@/hooks/use-cart";

interface OfferCard {
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
}

// Composant d'onglet des offres promotionnelles (client)
/**
 * OffersTab
 * Affiche les offres promotionnelles consommées depuis l'API `/api/public/offers`.
 * Rendu sous forme de cartes produits avec badge promo, prix barré, rating et CTA.
 */
export function OffersTab() {
  const [offers, setOffers] = useState<OfferCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"offers" | "specials">("offers")
  const [specialsCount, setSpecialsCount] = useState(0)
  const [prefetchedSpecials, setPrefetchedSpecials] = useState<any[]>([])
  const [productId, setProductId] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [vendorId, setVendorId] = useState<string>("")
  const [minPrice, setMinPrice] = useState<string>("")
  const [maxPrice, setMaxPrice] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("relevance")
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([])
  const [vendorOptions, setVendorOptions] = useState<Array<{ id: string; name: string | null; email: string | null }>>([])
  const [categorySearch, setCategorySearch] = useState<string>("")
  const [vendorSearch, setVendorSearch] = useState<string>("")
  const { addToCart, isInCart } = useCart()

  /**
   * Charge les offres depuis l'API publique.
   * `silent=true` permet de rafraîchir sans activer l'état `loading` (évite le clignotement UI).
   */
  const load = async (
    filters?: { productId?: string; categoryId?: string; vendorId?: string },
    options?: { silent?: boolean }
  ) => {
    try {
      if (!options?.silent) setLoading(true)
      if (!options?.silent) setError(null)
      const qs = new URLSearchParams()
      if (filters?.productId) qs.set('productId', filters.productId)
      if (filters?.categoryId) qs.set('categoryId', filters.categoryId)
      if (filters?.vendorId) qs.set('vendorId', filters.vendorId)
      const url = qs.toString() ? `/api/public/offers?${qs.toString()}` : '/api/public/offers'
      const resp = await fetch(url, { cache: 'no-store' })
      if (!resp.ok) throw new Error("Impossible de charger les offres")
      const data: OfferCard[] = await resp.json()
      setOffers(data)
      setError(null)
    } catch (e: any) {
      if (!options?.silent) {
        setError(e?.message || "Erreur lors du chargement des offres")
      }
    } finally {
      if (!options?.silent) setLoading(false)
    }
  }

  /**
   * Charge le compteur des promotions spéciales actives depuis l'API publique, sans cache.
   */
  const loadSpecialsCount = useCallback(async () => {
    try {
      const resp = await fetch('/api/public/special-promotions', { cache: 'no-store' })
      if (!resp.ok) throw new Error('Impossible de charger les promotions spéciales')
      const data: unknown = await resp.json()
      const items = Array.isArray(data) ? data : []
      setPrefetchedSpecials(items as any[])
      setSpecialsCount(items.length)
    } catch {
      setPrefetchedSpecials([])
      setSpecialsCount(0)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    if (typeof window !== 'undefined') {
      try {
        const cachedOffers = window.localStorage.getItem('client_offers_cache_v1')
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
    // Restaurer les filtres depuis le localStorage si disponible
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('client_offers_filters_v1')
        if (saved) {
          const parsed = JSON.parse(saved) as {
            productId?: string
            categoryId?: string
            vendorId?: string
            minPrice?: string
            maxPrice?: string
            sortBy?: string
          }
          if (parsed.productId) setProductId(parsed.productId)
          if (parsed.categoryId) setCategoryId(parsed.categoryId)
          if (parsed.vendorId) setVendorId(parsed.vendorId)
          if (parsed.minPrice) setMinPrice(parsed.minPrice)
          if (parsed.maxPrice) setMaxPrice(parsed.maxPrice)
          if (parsed.sortBy) setSortBy(parsed.sortBy)
          ;(async () => {
            if (mounted) await load({
              productId: parsed.productId,
              categoryId: parsed.categoryId,
              vendorId: parsed.vendorId,
            })
          })()
        } else {
          ;(async () => { if (mounted) await load() })()
        }
      } catch {
        ;(async () => { if (mounted) await load() })()
      }
    } else {
      ;(async () => { if (mounted) await load() })()
    }
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('client_offers_cache_v1', JSON.stringify(offers))
    } catch {
      // silencieux
    }
  }, [offers])

  useEffect(() => {
    void loadSpecialsCount()
  }, [loadSpecialsCount])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const cached = window.localStorage.getItem('client_specials_cache_v1')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) {
          setPrefetchedSpecials(parsed)
          setSpecialsCount(parsed.length)
        }
      }
    } catch {
      // silencieux
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('client_specials_cache_v1', JSON.stringify(prefetchedSpecials))
    } catch {
      // silencieux
    }
  }, [prefetchedSpecials])

  // Rafraîchir automatiquement au retour sur l'onglet / focus fenêtre
  useEffect(() => {
    const refresh = () => {
      void load({
        productId: productId || undefined,
        categoryId: categoryId || undefined,
        vendorId: vendorId || undefined
      }, { silent: true })
      void loadSpecialsCount()
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
  }, [productId, categoryId, vendorId, loadSpecialsCount])

  // Persister les filtres dans localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const payload = {
        productId,
        categoryId,
        vendorId,
        minPrice,
        maxPrice,
        sortBy,
      }
      window.localStorage.setItem('client_offers_filters_v1', JSON.stringify(payload))
    } catch {
      // silencieux
    }
  }, [productId, categoryId, vendorId, minPrice, maxPrice, sortBy])

  // Charger les options de filtres (catégories & vendeurs)
  useEffect(() => {
    let mounted = true
    const loadOptions = async () => {
      try {
        const [catResp, venResp] = await Promise.all([
          fetch('/api/catalog/categories'),
          fetch('/api/catalog/vendors')
        ])
        if (catResp.ok) {
          const catJson = await catResp.json()
          const items = Array.isArray(catJson?.data?.items) ? catJson.data.items : []
          if (mounted) setCategoryOptions(items.map((c: any) => ({ id: c.id, name: c.name })))
        }
        if (venResp.ok) {
          const venJson = await venResp.json()
          const items = Array.isArray(venJson?.data?.items) ? venJson.data.items : []
          if (mounted) setVendorOptions(items.map((v: any) => ({ id: v.id, name: v.name ?? null, email: v.email ?? null })))
        }
      } catch (_) {
        // silencieux
      }
    }
    void loadOptions()
    return () => { mounted = false }
  }, [])

  const filteredOffers = useMemo(() => {
    let result = [...offers]

    const min = parseFloat(minPrice || '0')
    const max = parseFloat(maxPrice || '0')

    if (minPrice) {
      result = result.filter(o => o.discountedPrice >= min)
    }
    if (maxPrice) {
      result = result.filter(o => o.discountedPrice <= max)
    }

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.discountedPrice - b.discountedPrice)
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.discountedPrice - a.discountedPrice)
    } else if (sortBy === 'popularity') {
      result.sort((a, b) => (b.product.total_reviews || 0) - (a.product.total_reviews || 0))
    }

    return result
  }, [offers, minPrice, maxPrice, sortBy])

  const offersCount = useMemo(() => {
    const ids = new Set<string>()
    for (const o of offers) {
      if (o?.promotionId) ids.add(o.promotionId)
    }
    return ids.size
  }, [offers])

  const hasOffers = useMemo(() => (filteredOffers?.length || 0) > 0, [filteredOffers])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center text-gray-600">
          <Icons.packageOpen className="mx-auto h-10 w-10 text-red-500 mb-2" />
          <p className="mb-2 font-medium">{error}</p>
          <p className="text-sm">Veuillez réessayer plus tard.</p>
        </div>
      </div>
    )
  }

  if (!hasOffers) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icons.packageOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune offre disponible</h3>
          <p className="text-gray-500 mb-6">Revenez plus tard pour découvrir nos prochaines promotions.</p>
          <Button onClick={() => window.location.reload()}>
            <Icons.refreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
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
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Offres promotionnelles</h2>
          <p className="text-gray-500 text-sm">Découvrez les meilleures promotions en cours</p>
        </div>
        <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100">
          {filteredOffers.length} sur {offers.length} offre{offers.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Product ID</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="ex: 123"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Catégorie</label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1">
                  <input
                    className="w-full border rounded-md px-2 py-1 text-xs"
                    placeholder="Rechercher une catégorie"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                  />
                </div>
                <SelectItem value="">Toutes les catégories</SelectItem>
                {categoryOptions
                  .filter(c => !categorySearch || c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                  .map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Vendeur</label>
            <Select value={vendorId} onValueChange={(v) => setVendorId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les vendeurs" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1">
                  <input
                    className="w-full border rounded-md px-2 py-1 text-xs"
                    placeholder="Rechercher un vendeur"
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                  />
                </div>
                <SelectItem value="">Tous les vendeurs</SelectItem>
                {vendorOptions
                  .filter(v => {
                    const label = v.name || v.email || v.id
                    return !vendorSearch || label.toLowerCase().includes(vendorSearch.toLowerCase())
                  })
                  .map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name || v.email || v.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Prix min / max (FCFA)</label>
            <div className="flex gap-2">
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Trier par</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pertinence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Pertinence</SelectItem>
                  <SelectItem value="price_asc">Prix croissant</SelectItem>
                  <SelectItem value="price_desc">Prix décroissant</SelectItem>
                  <SelectItem value="popularity">Popularité</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="flex-1" onClick={() => load({ productId, categoryId, vendorId })}>
              Appliquer les filtres
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setProductId("")
                setCategoryId("")
                setVendorId("")
                setMinPrice("")
                setMaxPrice("")
                setSortBy("relevance")
                setCategorySearch("")
                setVendorSearch("")
                load()
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredOffers.map((offer, idx) => {
          const img = Array.isArray(offer.product.images) && offer.product.images.length > 0
            ? offer.product.images[0]
            : null
          const resolvedImg = !img ? "/placeholder.svg" : typeof img === 'string' ? img : img.url || "/placeholder.svg"
          const discountPercent = offer.originalPrice > 0
            ? Math.round(100 - (offer.discountedPrice * 100) / offer.originalPrice)
            : 0
          const alreadyInCart = isInCart(offer.product.id)
          return (
            <Card key={`${offer.promotionId}-${offer.product.id}-${idx}`} className="overflow-hidden hover:shadow-lg transition-all border border-orange-100 bg-gradient-to-b from-orange-50/50 to-white">
              <div className="relative h-44 bg-gray-50">
                {img ? (
                  <img src={typeof img === 'string' ? img : img.url || ''} alt={offer.product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Icons.package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge className="bg-gradient-to-r from-[#ff6600] to-[#ff8533] text-white border-0">{offer.promoBadge}</Badge>
                  {discountPercent > 0 && (
                    <Badge className="bg-red-500 text-white">-{discountPercent}%</Badge>
                  )}
                  {offer.hasFreeShipping && (
                    <Badge className="bg-emerald-500 text-white">Livraison gratuite</Badge>
                  )}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-2">{offer.product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-lg font-semibold">{offer.discountedPrice.toLocaleString()} FCFA</span>
                  {offer.discountedPrice < offer.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">{offer.originalPrice.toLocaleString()} FCFA</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Icons.star className="h-4 w-4 text-amber-400" />
                  <span>{(offer.product.rating || 4.5).toFixed(1)}</span>
                  <span>·</span>
                  <span>{offer.product.total_reviews || 0} avis</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={alreadyInCart ? "outline" : "default"}
                    className="flex-1"
                    disabled={alreadyInCart}
                    onClick={() => {
                      if (alreadyInCart) return
                      addToCart({
                        id: offer.product.id,
                        name: offer.product.name,
                        price: offer.discountedPrice,
                        originalPrice: offer.originalPrice,
                        image: resolvedImg,
                        seller: "Vendeur Probooster",
                        inStock: true,
                      })
                    }}
                  >
                    <Icons.shoppingCart className="mr-2 h-4 w-4" />
                    {alreadyInCart ? "Au panier" : "Ajouter"}
                  </Button>
                  <Button className="flex-1" onClick={() => window.location.assign(`/product/${offer.product.id}`)}>
                    <Icons.shoppingCart className="mr-2 h-4 w-4" />
                    Voir le produit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default OffersTab;
