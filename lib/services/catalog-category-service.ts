import type { ProductCategoryRecord } from '@/lib/types/product-category'

interface FetchCatalogCategoryOptions {
  search?: string
}

/**
 * Service d’accès public/ vendeur pour récupérer les catégories actives.
 */
export class CatalogCategoryService {
  static async fetchCategories(options: FetchCatalogCategoryOptions = {}): Promise<ProductCategoryRecord[]> {
    const params = new URLSearchParams()

    if (options.search && options.search.trim().length > 0) {
      params.set('search', options.search.trim())
    }

    const query = params.toString() ? `?${params.toString()}` : ''

    try {
      const response = await fetch(`/api/catalog/categories${query}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store'
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => undefined)
        const message = payload?.error ?? `Impossible de récupérer les catégories (status ${response.status}).`
        throw new Error(message)
      }

      const data = await response.json().catch(() => ({}))
      return (data?.data?.items as ProductCategoryRecord[] | undefined) ?? []
    } catch (error) {
      console.error('❌ CatalogCategoryService.fetchCategories failed:', error)
      // En cas d'échec réseau ou serveur, on retourne un tableau vide pour ne pas bloquer l'UI
      return []
    }
  }
}
