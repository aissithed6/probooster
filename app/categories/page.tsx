"use client"

import { Search, Grid, List, Sparkles, TrendingUp, ArrowRight, Heart, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

type Category = {
  id: string
  name: string
  description: string
  image: string
  productCount: number
  icon: string
  isHot: boolean
  isNew: boolean
  isTrending: boolean
  color: string
  badge: string | null
  slug: string | null
}

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Retourne une classe Tailwind de dégradé stable pour une catégorie.
   */
  const getCategoryGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-pink-500 to-red-500',
      'from-green-500 to-emerald-600',
      'from-orange-500 to-red-600',
      'from-indigo-500 to-blue-600',
      'from-teal-500 to-cyan-600',
      'from-yellow-500 to-orange-600',
      'from-rose-500 to-pink-600'
    ]
    const safeIndex = Number.isFinite(index) ? Math.max(0, index) : 0
    return gradients[safeIndex % gradients.length]
  }

  /**
   * Charge les catégories réelles depuis Supabase via l'API publique.
   * Compte le nombre de produits actifs par catégorie.
   */
  useEffect(() => {
    let cancelled = false

    const loadCategories = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/catalog/categories', { method: 'GET', cache: 'no-store' })
        const json = await res.json().catch(() => null)
        const raw = Array.isArray(json?.data?.items) ? json.data.items : []

        if (cancelled) return

        // Pour chaque catégorie, compter les produits actifs
        const categoriesWithCounts = await Promise.all(
          raw.map(async (cat: any) => {
            const catId = String(cat?.id ?? '').trim()
            const catName = String(cat?.name ?? '').trim()
            
            // Compter les produits actifs dans cette catégorie
            let productCount = 0
            try {
              const countRes = await fetch(`/api/catalog/categories/${catId}/product-count`, { 
                method: 'GET', 
                cache: 'no-store' 
              })
              const countJson = await countRes.json().catch(() => null)
              productCount = Number(countJson?.data?.count ?? 0) || 0
            } catch {
              productCount = 0
            }

            return {
              id: catId,
              name: catName,
              description: String(cat?.description ?? `Découvrez nos produits ${catName}`),
              image: "/placeholder.svg?height=200&width=200",
              productCount,
              icon: String(cat?.icon ?? '🏷️'),
              isHot: false,
              isNew: false,
              isTrending: false,
              color: getCategoryGradient(raw.indexOf(cat)),
              badge: null,
              slug: cat?.slug ?? catName.toLowerCase().replace(/\s+/g, '-'),
            }
          })
        )

        if (!cancelled) {
          setCategories(categoriesWithCounts)
        }
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadCategories()
    return () => { cancelled = true }
  }, [])

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#ff6600] to-orange-500 text-white px-6 py-3 rounded-full mb-4 animate-fade-in-up">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="font-semibold text-lg">Probooster</span>
            <Sparkles className="h-5 w-5 animate-pulse delay-300" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-fade-in-up animation-delay-200">
            Explorez nos <span className="text-[#ff6600] animate-pulse">Catégories</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
            Découvrez des milliers de produits organisés par catégories pour une expérience d&apos;achat optimale
          </p>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 animate-fade-in-up animation-delay-600">
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-hover:text-[#ff6600] transition-colors duration-300" />
              <Input
                type="search"
                placeholder="Rechercher une catégorie..."
                className="pl-10 border-2 focus:border-[#ff6600] transition-all duration-300 hover:shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Select defaultValue="name">
              <SelectTrigger className="w-48 border-2 hover:border-[#ff6600] transition-all duration-300">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="products">Nombre de produits</SelectItem>
                <SelectItem value="popular">Plus populaire</SelectItem>
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

        {/* Enhanced Categories Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-200 border-t-[#ff6600] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Chargement des catégories...</p>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`grid gap-6 animate-fade-in-up animation-delay-800 ${
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
              }`}
            >
          {filteredCategories.map((category, index) => (
            <Card
              key={category.id}
              className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 cursor-pointer border-0 shadow-lg relative overflow-hidden animate-fade-in-up"
              style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              asChild
            >
              <Link href={`/categories/${category.id}`}>
                {/* Animated Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="relative overflow-hidden rounded-t-lg">
                  <Image
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    width={200}
                    height={200}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Animated Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                    <span className="text-6xl group-hover:scale-125 transition-transform duration-500 animate-bounce">
                      {category.icon}
                    </span>
                  </div>

                  {/* Animated Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {category.isHot && (
                      <Badge className="bg-red-500 text-white animate-pulse shadow-lg">
                        🔥 HOT
                      </Badge>
                    )}
                    {category.isNew && (
                      <Badge className="bg-green-500 text-white animate-pulse shadow-lg">
                        🆕 NOUVEAU
                      </Badge>
                    )}
                    {category.isTrending && (
                      <Badge className="bg-orange-500 text-white animate-bounce shadow-lg">
                        ⚡ TRENDING
                      </Badge>
                    )}
                  </div>

                  {/* Floating Action Buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                          <Button
                        variant="ghost"
                        size="icon"
                        className="bg-white/90 hover:bg-white shadow-lg transition-all duration-300"
                      >
                        <Heart className="h-4 w-4 text-red-500 hover:scale-110 transition-all duration-300" />
                      </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Animated Sparkles for Hot Categories */}
                  {category.isHot && (
                    <div className="absolute inset-0 pointer-events-none">
                      <Sparkles className="absolute top-4 right-4 h-4 w-4 text-yellow-400 animate-ping" />
                      <Sparkles className="absolute top-8 right-8 h-3 w-3 text-orange-400 animate-ping delay-300" />
                      <Sparkles className="absolute top-12 right-12 h-2 w-2 text-red-400 animate-ping delay-700" />
                    </div>
                  )}
                </div>

                <CardContent className="p-6 relative">
                  <CardTitle className="text-xl mb-2 group-hover:text-[#ff6600] transition-colors duration-300">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 mb-4 group-hover:text-gray-700 transition-colors duration-300">
                    {category.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#ff6600] font-semibold group-hover:scale-110 transition-transform duration-300">
                        {category.productCount.toLocaleString()} produits
                      </span>
                      {category.isTrending && (
                        <TrendingUp className="h-4 w-4 text-green-500 animate-pulse" />
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="bg-[#ff6600] hover:bg-[#e55a00] group-hover:scale-105 transition-all duration-300 group-hover:shadow-lg"
                    >
                      <span>Explorer</span>
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
            </div>

            {filteredCategories.length === 0 && (
              <div className="text-center py-12 animate-fade-in-up">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-500 text-lg">Aucune catégorie trouvée pour "{searchQuery}"</p>
                <Button 
                  className="mt-4 bg-[#ff6600] hover:bg-[#e55a00]"
                  onClick={() => setSearchQuery("")}
                >
                  Effacer la recherche
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
