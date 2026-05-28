"use client"

import { useEffect, useMemo, useState } from "react"
import { Grid, List, Search, TrendingUp, Flame, Trophy, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProductModal from "@/components/product/product-modal"
import BestSellersSection from "@/components/product/best-sellers-section"
import { useClientPoints } from "@/lib/hooks/use-client-points"

type BestSellersStats = {
  totalSales: number
  revenueFcfa: number
  averageRating: number
  topCategoryName: string
  topCategorySharePercent: number
  salesGrowthPercent?: number
  revenueGrowthPercent?: number
  ratingDelta?: number
  salesTrend?: {
    weekPercent: number
    weekBarPercent: number
    monthPercent: number
    monthBarPercent: number
    quarterPercent: number
    quarterBarPercent: number
  }
  topProducts?: Array<{
    productId: string
    name: string
    salesCount: number
    changePercent: number
  }>
}

type BestSellerProduct = {
  id: string
  name: string
  price: number
  salePrice?: number | null
  originalPrice?: number
  pointsPrice?: number
  rating?: number
  reviews?: number
  image: string
  seller?: string
  sellerName?: string
  sharePoints?: number
  shares?: number
  inStock?: boolean
  stockQuantity?: number | null
  discount?: number
  badges?: string[]
  color?: string
  totalSales?: number
}

type SelectedProduct = any

/**
 * Page client /best-sellers: affiche immédiatement les produits et stats préchargés en SSR.
 */
export default function BestSellersPageClient({
  initialProducts,
  initialStats
}: {
  initialProducts: BestSellerProduct[]
  initialStats: BestSellersStats
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<'sales' | 'rating' | 'price-low' | 'price-high'>('sales')

  const [stats, setStats] = useState<BestSellersStats>(initialStats)

  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { purchaseValue } = useClientPoints()

  /**
   * Calcule le prix en points synchronisé.
   */
  const getComputedPointsPrice = (price: number) => {
    return Math.max(0, Math.round(Number(price || 0) / purchaseValue))
  }

  /**
   * Ouvre la fiche produit (modal) à partir d'un item de best-seller.
   */
  const handleOpenProductModal = (product: any) => {
    // On s'assure que le produit passé au modal a le prix en points recalculé
    const enriched = {
      ...product,
      pointsPrice: getComputedPointsPrice(product.price)
    }
    setSelectedProduct(enriched)
    setIsModalOpen(true)
  }

  useEffect(() => {
    let cancelled = false

    /**
     * Refresh léger des stats (sans bloquer l'affichage initial SSR).
     */
    const refresh = async () => {
      try {
        const resp = await fetch('/api/public/best-sellers/stats', { method: 'GET', cache: 'no-store' }).catch(() => null)
        const json = await resp?.json().catch(() => null)
        const data = json?.data
        if (cancelled || !data) return

        setStats({
          totalSales: Number(data?.totalSales ?? 0) || 0,
          revenueFcfa: Number(data?.revenueFcfa ?? 0) || 0,
          averageRating: Number(data?.averageRating ?? 0) || 0,
          topCategoryName: String(data?.topCategoryName ?? ''),
          topCategorySharePercent: Number(data?.topCategorySharePercent ?? 0) || 0,
          salesGrowthPercent: typeof data?.salesGrowthPercent === 'number' ? data.salesGrowthPercent : undefined,
          revenueGrowthPercent: typeof data?.revenueGrowthPercent === 'number' ? data.revenueGrowthPercent : undefined,
          ratingDelta: typeof data?.ratingDelta === 'number' ? data.ratingDelta : undefined,
          salesTrend: data?.salesTrend,
          topProducts: Array.isArray(data?.topProducts) ? data.topProducts : undefined
        })
      } catch {
        // noop
      }
    }

    refresh()
    const t = setInterval(refresh, 30_000)

    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const salesTrend = useMemo(() => {
    const t = stats.salesTrend
    if (!t) {
      return {
        weekPercent: 0,
        weekBarPercent: 75,
        monthPercent: 0,
        monthBarPercent: 68,
        quarterPercent: 0,
        quarterBarPercent: 52
      }
    }
    return {
      weekPercent: Number(t.weekPercent ?? 0) || 0,
      weekBarPercent: Number(t.weekBarPercent ?? 75) || 75,
      monthPercent: Number(t.monthPercent ?? 0) || 0,
      monthBarPercent: Number(t.monthBarPercent ?? 68) || 68,
      quarterPercent: Number(t.quarterPercent ?? 0) || 0,
      quarterBarPercent: Number(t.quarterBarPercent ?? 52) || 52
    }
  }, [stats.salesTrend])

  const topProducts = useMemo(() => {
    const arr = Array.isArray(stats.topProducts) ? stats.topProducts : []
    return arr
      .filter((x) => x && typeof x === 'object')
      .slice(0, 5)
      .map((x: any) => ({
        productId: String(x.productId ?? ''),
        name: String(x.name ?? 'Produit'),
        salesCount: Number(x.salesCount ?? 0) || 0,
        changePercent: Number(x.changePercent ?? 0) || 0
      }))
  }, [stats.topProducts])

  const formatDeltaPercent = (v: number) => {
    const n = Number(v) || 0
    const sign = n >= 0 ? '+' : ''
    return `${sign}${Math.round(n)}%`
  }

  const formattedRevenue = useMemo(() => {
    const v = Number(stats.revenueFcfa)
    if (!Number.isFinite(v) || v <= 0) return '0'
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000) return `${Math.round(v / 1_000)}K`
    return String(Math.round(v))
  }, [stats.revenueFcfa])

  const formattedRating = useMemo(() => {
    const v = Number(stats.averageRating)
    return Number.isFinite(v) && v > 0 ? v.toFixed(1) : '0.0'
  }, [stats.averageRating])

  const salesGrowthText = useMemo(() => {
    const v = stats.salesGrowthPercent
    if (typeof v !== 'number') return null
    const sign = v >= 0 ? '+' : ''
    return `${sign}${v}%`
  }, [stats.salesGrowthPercent])

  const revenueGrowthText = useMemo(() => {
    const v = stats.revenueGrowthPercent
    if (typeof v !== 'number') return null
    const sign = v >= 0 ? '+' : ''
    return `${sign}${v}%`
  }, [stats.revenueGrowthPercent])

  const ratingDeltaText = useMemo(() => {
    const v = stats.ratingDelta
    if (typeof v !== 'number') return null
    const sign = v >= 0 ? '+' : ''
    return `${sign}${v.toFixed(1)}`
  }, [stats.ratingDelta])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-4 animate-fade-in-up">
            <Trophy className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">Probooster</span>
            <Trophy className="h-5 w-5 animate-pulse delay-300" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200">
            <span className="text-[#ff6600] animate-pulse">Meilleures</span> Ventes
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Découvrez les produits les plus vendus et les plus appréciés par notre communauté
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 animate-fade-in-up animation-delay-600">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-hover:text-[#ff6600] transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Rechercher dans les meilleures ventes..."
                className="pl-10 border-2 focus:border-[#ff6600] transition-all duration-300 hover:shadow-lg"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as any)}>
              <SelectTrigger className="w-48 border-2 hover:border-[#ff6600] transition-all duration-300">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Meilleures ventes</SelectItem>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="price-low">Prix croissant</SelectItem>
                <SelectItem value="price-high">Prix décroissant</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border-2 rounded-lg overflow-hidden hover:border-[#ff6600] transition-all duration-300">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`rounded-r-none transition-all duration-300 ${
                  viewMode === "grid" ? "bg-[#ff6600] text-white" : "hover:bg-orange-50"
                }`}
              >
                <Grid className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={`rounded-l-none transition-all duration-300 ${
                  viewMode === "list" ? "bg-[#ff6600] text-white" : "hover:bg-orange-50"
                }`}
              >
                <List className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>

        {/* Section Meilleures Ventes (SSR first) */}
        <BestSellersSection
          initialItems={Array.isArray(initialProducts) ? initialProducts : []}
          searchQuery={searchQuery}
          sortBy={sortBy}
          viewMode={viewMode}
          hideHeader
          onProductClick={handleOpenProductModal}
          onStartChat={(product: any) => {
            console.log('Chat démarré pour le produit:', product?.name)
          }}
        />

        {/* Sales Statistics Section */}
        <div className="mt-16 animate-fade-in-up animation-delay-600">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 hover:text-[#ff6600] transition-colors duration-300">
              Statistiques des Ventes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto hover:text-gray-800 transition-colors duration-300">
              Découvrez les performances de nos meilleures ventes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Sales */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold animate-count-up">{stats.totalSales.toLocaleString()}</div>
                    <div className="text-sm opacity-90">Ventes Totales</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-green-300">↗ {salesGrowthText ?? '+0%'}</span>
                  <span className="ml-2 opacity-75">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold animate-count-up">{formattedRevenue}</div>
                    <div className="text-sm opacity-90">F CFA</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-green-300">↗ {revenueGrowthText ?? '+0%'}</span>
                  <span className="ml-2 opacity-75">Chiffre d'affaires</span>
                </div>
              </CardContent>
            </Card>

            {/* Average Rating */}
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold animate-count-up">{formattedRating}</div>
                    <div className="text-sm opacity-90">Note Moyenne</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-yellow-300">↗ {ratingDeltaText ?? '+0.0'}</span>
                  <span className="ml-2 opacity-75">vs mois dernier</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Category */}
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Flame className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stats.topCategoryName || '—'}</div>
                    <div className="text-sm opacity-90">Catégorie #1</div>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-purple-300">🔥</span>
                  <span className="ml-2 opacity-75">{Math.max(0, Math.round(stats.topCategorySharePercent))}% des ventes</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics (laissées telles quelles pour ne pas changer le contenu) */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">
                    Évolution des Ventes
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">En hausse</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cette semaine</span>
                    <span className="font-semibold text-green-600">{formatDeltaPercent(salesTrend.weekPercent)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full animate-pulse"
                      style={{ width: `${Math.max(0, Math.min(100, salesTrend.weekBarPercent))}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ce mois</span>
                    <span className="font-semibold text-blue-600">{formatDeltaPercent(salesTrend.monthPercent)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full animate-pulse"
                      style={{ width: `${Math.max(0, Math.min(100, salesTrend.monthBarPercent))}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ce trimestre</span>
                    <span className="font-semibold text-purple-600">{formatDeltaPercent(salesTrend.quarterPercent)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full animate-pulse"
                      style={{ width: `${Math.max(0, Math.min(100, salesTrend.quarterBarPercent))}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#ff6600] transition-colors duration-300">
                    Performance des Produits
                  </h3>
                  <Badge className="bg-[#ff6600] text-white animate-pulse">Top 5</Badge>
                </div>

                <div className="space-y-4">
                  {(topProducts.length > 0 ? topProducts : [{ productId: '1', name: '—', salesCount: 0, changePercent: 0 }]).map(
                    (p, idx) => {
                      const rank = idx + 1
                      const rowClass =
                        rank === 1
                          ? 'from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100'
                          : rank === 2
                            ? 'from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                            : 'from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100'

                      const badgeClass =
                        rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-500' : 'bg-orange-600'

                      const deltaClass =
                        rank === 1 ? 'text-green-600' : rank === 2 ? 'text-blue-600' : 'text-orange-600'

                      return (
                        <div
                          key={p.productId || String(rank)}
                          className={`flex items-center justify-between p-3 bg-gradient-to-r ${rowClass} rounded-lg group hover:bg-gradient-to-r transition-all duration-300`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 ${badgeClass} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                            >
                              {rank}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{p.name}</div>
                              <div className="text-sm text-gray-600">{p.salesCount.toLocaleString()} ventes</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${deltaClass}`}>{formatDeltaPercent(p.changePercent)}</div>
                            <div className="text-xs text-gray-500">vs hier</div>
                          </div>
                        </div>
                      )
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ProductModal product={selectedProduct} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  )
}
