"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { SuperAdminCategoryService } from '@/lib/services/super-admin-category-service'
import { CatalogCategoryService } from '@/lib/services/catalog-category-service'
import type {
  ProductCategoryInsights,
  ProductCategoryRecord,
  ProductCategoryTreeNode
} from '@/lib/types/product-category'
import { useAuth } from '@/contexts/AuthContext'

interface ProductCategoryContextValue {
  categories: ProductCategoryRecord[]
  categoryTree: ProductCategoryTreeNode[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const ProductCategoryContext = createContext<ProductCategoryContextValue | undefined>(undefined)

interface ProductCategoryProviderProps {
  children: ReactNode
  eager?: boolean
  initialCategories?: ProductCategoryRecord[]
  initialTree?: ProductCategoryTreeNode[]
}

/**
 * Fournit les catégories produits pour l’ensemble des formulaires (super admin, admin, vendeurs).
 */
export function ProductCategoryProvider({ children, eager = false, initialCategories, initialTree }: ProductCategoryProviderProps) {
  const { user } = useAuth()
  const isSuperAdminScope = useMemo(() => {
    const role = user?.role
    return role === 'super_admin' || role === 'admin'
  }, [user?.role])

  const [categories, setCategories] = useState<ProductCategoryRecord[]>(initialCategories ?? [])
  const [categoryTree, setCategoryTree] = useState<ProductCategoryTreeNode[]>(initialTree ?? [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const assignCategories = (items: ProductCategoryRecord[], insights?: ProductCategoryInsights) => {
      setCategories(items)
      setCategoryTree(SuperAdminCategoryService.buildTree(items, insights))
    }

    try {
      if (isSuperAdminScope) {
        const { items, insights } = await SuperAdminCategoryService.fetchCategories({
          includeInactive: true,
          withStats: true
        })
        assignCategories(items, insights)
        return
      }

      const fallbackItems = await CatalogCategoryService.fetchCategories()
      assignCategories(fallbackItems)
    } catch (primaryError) {
      if (isSuperAdminScope) {
        console.error('❌ Impossible de charger les catégories via SuperAdminCategoryService:', primaryError)

        try {
          const fallbackItems = await CatalogCategoryService.fetchCategories()
          assignCategories(fallbackItems)
          return
        } catch (fallbackError) {
          console.error('❌ Échec du fallback catalogue pour les catégories:', fallbackError)
          const message =
            fallbackError instanceof Error
              ? fallbackError.message
              : primaryError instanceof Error
                ? primaryError.message
                : 'Erreur inconnue'
          setError(message)
        }
      } else {
        console.error('❌ Impossible de charger les catégories via CatalogCategoryService:', primaryError)
        const message = primaryError instanceof Error ? primaryError.message : 'Erreur inconnue'
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isSuperAdminScope])

  useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories)
    }
  }, [initialCategories])

  useEffect(() => {
    if (initialTree) {
      setCategoryTree(initialTree)
    }
  }, [initialTree])

  useEffect(() => {
    if (eager || (!initialCategories && categories.length === 0)) {
      void load()
    }
  }, [categories.length, eager, initialCategories, load])

  const value = useMemo<ProductCategoryContextValue>(
    () => ({
      categories,
      categoryTree,
      isLoading,
      error,
      refresh: load
    }),
    [categories, categoryTree, isLoading, error, load]
  )

  return <ProductCategoryContext.Provider value={value}>{children}</ProductCategoryContext.Provider>
}

export function useProductCategories() {
  const context = useContext(ProductCategoryContext)
  if (!context) {
    throw new Error('useProductCategories doit être utilisé dans un ProductCategoryProvider')
  }

  return context
}
