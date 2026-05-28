import type {
  CreateProductCategoryInput,
  ProductCategory,
  ProductCategoryFilterOptions,
  ProductCategoryRecord,
  ProductCategoryTreeNode,
  ProductCategoryInsights,
  UpdateProductCategoryInput
} from '@/lib/types/product-category'
import { SuperAdminDashboardApi } from '@/lib/services/super-admin-dashboard-service.api'

export class SuperAdminCategoryService {
  /**
   * Charge toutes les catégories (optionnellement y compris les inactives).
   */
  static async fetchCategories(options: ProductCategoryFilterOptions = {}) {
    return SuperAdminDashboardApi.fetchCategories(options)
  }

  static async createCategory(payload: CreateProductCategoryInput) {
    return SuperAdminDashboardApi.createCategory(payload)
  }

  static async updateCategory(payload: UpdateProductCategoryInput) {
    return SuperAdminDashboardApi.updateCategory(payload)
  }

  static async toggleCategory(id: string, isActive: boolean) {
    return SuperAdminDashboardApi.mutateCategory({ type: 'toggle', id, isActive })
  }

  static async reorderCategories(items: Array<{ id: string; parentId: string | null; position: number }>) {
    return SuperAdminDashboardApi.mutateCategory({ type: 'reorder', items })
  }

  static async duplicateCategory(id: string, overrides?: Partial<CreateProductCategoryInput>) {
    return SuperAdminDashboardApi.mutateCategory({ type: 'duplicate', id, overrides })
  }

  static async deleteCategory(id: string) {
    return SuperAdminDashboardApi.deleteCategory(id)
  }

  /**
   * Construit une hiérarchie arborescente pour un affichage structuré.
   */
  static buildTree(categories: ProductCategoryRecord[], insights?: ProductCategoryInsights): ProductCategoryTreeNode[] {
    const map = new Map<string, ProductCategoryTreeNode>()
    const roots: ProductCategoryTreeNode[] = []

    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name))

    for (const category of sorted) {
      const nodeInsights = insights?.[category.id]

      const node: ProductCategoryTreeNode = {
        ...category,
        position: category.metadata?.position as number | undefined,
        imageUrl: (category.metadata?.imageUrl as string | undefined) ?? null,
        seoTitle: (category.metadata?.seoTitle as string | undefined) ?? null,
        seoDescription: (category.metadata?.seoDescription as string | undefined) ?? null,
        seoKeywords: (category.metadata?.seoKeywords as string[] | undefined) ?? null,
        colorTheme: (category.metadata?.colorTheme as string | undefined) ?? null,
        displayMode: (category.metadata?.displayMode as ProductCategory['displayMode'] | undefined) ?? 'grid',
        depth: 0,
        path: [],
        children: [],
        productCount: nodeInsights?.totalProducts,
        stats: nodeInsights
      }

      map.set(category.id, node)
    }

    for (const node of map.values()) {
      if (node.parent_id && map.has(node.parent_id)) {
        const parent = map.get(node.parent_id)!
        node.depth = parent.depth + 1
        node.path = [...parent.path, parent.name]
        parent.children.push(node)
      } else {
        node.depth = 0
        node.path = []
        roots.push(node)
      }
    }

    return roots
  }
}
