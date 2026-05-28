export interface ProductCategoryRecord {
  id: string
  parent_id: string | null
  name: string
  slug: string | null
  description: string | null
  icon: string | null
  is_active: boolean
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ProductCategory extends ProductCategoryRecord {
  position?: number | null
  imageUrl?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string[] | null
  colorTheme?: string | null
  displayMode?: 'grid' | 'list' | 'carousel' | 'hero'
}

export interface ProductCategoryTreeNode extends ProductCategory {
  depth: number
  path: string[]
  children: ProductCategoryTreeNode[]
  productCount?: number
  stats?: ProductCategoryInsight
}

export interface CreateProductCategoryInput {
  name: string
  parentId?: string | null
  slug?: string | null
  description?: string | null
  icon?: string | null
  isActive?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateProductCategoryInput extends CreateProductCategoryInput {
  id: string
}

export type ProductCategoryMutationPayload =
  | { type: 'toggle'; id: string; isActive: boolean }
  | { type: 'reorder'; items: Array<{ id: string; parentId: string | null; position: number }> }
  | { type: 'duplicate'; id: string; overrides?: Partial<CreateProductCategoryInput> }

export interface ProductCategoryFilterOptions {
  includeInactive?: boolean
  search?: string
  withStats?: boolean
}

export interface CategoryVendorBreakdown {
  vendorId: string | null
  count: number
}

export interface CategoryProductLink {
  id: string
  name: string
  vendorId: string | null
  status: string | null
  isActive: boolean
}

export interface ProductCategoryInsight {
  totalProducts: number
  vendors: CategoryVendorBreakdown[]
  products: CategoryProductLink[]
}

export type ProductCategoryInsights = Record<string, ProductCategoryInsight>
