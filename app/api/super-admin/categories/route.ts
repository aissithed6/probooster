import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type {
  CategoryProductLink,
  CategoryVendorBreakdown,
  ProductCategoryInsights,
  ProductCategoryRecord
} from '@/lib/types/product-category'

const CATEGORY_COLUMNS = [
  'id',
  'parent_id',
  'name',
  'slug',
  'description',
  'icon',
  'is_active',
  'metadata',
  'created_at',
  'updated_at'
] as const

const createCategorySchema = z.object({
  name: z.string().min(2, 'Le nom de la catégorie est requis.'),
  parentId: z.string().uuid().nullable().optional(),
  slug: z
    .string()
    .min(1, 'Le slug doit contenir au moins un caractère.')
    .max(160, 'Le slug est trop long.')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne doit contenir que des minuscules, chiffres et tirets.')
    .optional(),
  description: z.string().max(1000).nullable().optional(),
  icon: z.string().max(120).nullable().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).nullable().optional()
})

const updateCategorySchema = createCategorySchema.extend({
  id: z.string().uuid()
})

const togglePayloadSchema = z.object({
  type: z.literal('toggle'),
  id: z.string().uuid(),
  isActive: z.boolean()
})

const reorderPayloadSchema = z.object({
  type: z.literal('reorder'),
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        parentId: z.string().uuid().nullable(),
        position: z.number().int().min(0)
      })
    )
    .min(1)
})

const duplicatePayloadSchema = z.object({
  type: z.literal('duplicate'),
  id: z.string().uuid(),
  overrides: createCategorySchema.partial().optional()
})

const mutationPayloadSchema = z.discriminatedUnion('type', [
  togglePayloadSchema,
  reorderPayloadSchema,
  duplicatePayloadSchema
])

const querySchema = z.object({
  includeInactive: z.coerce.boolean().optional(),
  search: z.string().min(1).optional(),
  withStats: z.coerce.boolean().optional()
})

const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

const resolveSlug = (name: string, provided?: string | null): string => {
  const base = provided && provided.trim().length > 0 ? provided.trim() : slugify(name)
  return base.length > 0 ? base : `categorie-${Date.now()}`
}

const mapRowToRecord = (row: Record<string, any>): ProductCategoryRecord => ({
  id: row.id,
  parent_id: row.parent_id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  icon: row.icon,
  is_active: Boolean(row.is_active),
  metadata: row.metadata,
  created_at: row.created_at,
  updated_at: row.updated_at
})

async function fetchCategories(includeInactive = false, search?: string) {
  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('product_categories')
    .select(CATEGORY_COLUMNS.join(','))
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  if (search && search.trim().length > 0) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return (data ?? []).map(mapRowToRecord)
}

async function fetchCategoryInsights(categoryIds: string[]): Promise<ProductCategoryInsights> {
  if (categoryIds.length === 0) {
    return {}
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('product_category_assignments')
    .select('category_id, user_products(id, vendor_id, name, product_status, is_active)')
    .in('category_id', categoryIds)

  if (error) {
    throw error
  }

  const MAX_PRODUCTS_PER_CATEGORY = 20

  const accumulator = new Map<
    string,
    {
      products: CategoryProductLink[]
      vendorMap: Map<string | null, number>
      productIds: Set<string>
    }
  >()

  for (const row of data ?? []) {
    const categoryId = row.category_id as string | null
    const product = row.user_products as
      | {
          id: string | null
          vendor_id: string | null
          name: string | null
          product_status: string | null
          is_active: boolean | null
        }
      | null

    if (!categoryId || !product || !product.id) {
      continue
    }

    let bucket = accumulator.get(categoryId)
    if (!bucket) {
      bucket = {
        products: [],
        vendorMap: new Map<string | null, number>(),
        productIds: new Set<string>()
      }
      accumulator.set(categoryId, bucket)
    }

    if (bucket.productIds.has(product.id)) {
      continue
    }

    bucket.productIds.add(product.id)

    const vendorKey = product.vendor_id ?? null
    bucket.vendorMap.set(vendorKey, (bucket.vendorMap.get(vendorKey) ?? 0) + 1)

    if (bucket.products.length < MAX_PRODUCTS_PER_CATEGORY) {
      bucket.products.push({
        id: product.id,
        name: product.name ?? 'Produit sans nom',
        vendorId: vendorKey,
        status: product.product_status ?? null,
        isActive: Boolean(product.is_active)
      })
    }
  }

  const insights: ProductCategoryInsights = {}

  for (const categoryId of categoryIds) {
    const bucket = accumulator.get(categoryId)

    if (!bucket) {
      insights[categoryId] = {
        totalProducts: 0,
        vendors: [],
        products: []
      }
      continue
    }

    const vendors: CategoryVendorBreakdown[] = Array.from(bucket.vendorMap.entries()).map(([vendorId, count]) => ({
      vendorId,
      count
    }))

    vendors.sort((a, b) => b.count - a.count)

    insights[categoryId] = {
      totalProducts: bucket.productIds.size,
      vendors,
      products: bucket.products
    }
  }

  return insights
}

/**
 * Retourne la liste des catégories pour le super administrateur.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const categories = await fetchCategories(parsed.data.includeInactive, parsed.data.search)
    const insights = parsed.data.withStats ? await fetchCategoryInsights(categories.map((category) => category.id)) : undefined

    return NextResponse.json(
      { data: { items: categories, insights } },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ GET /api/super-admin/categories failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Crée une nouvelle catégorie produit.
 */
export async function POST(request: Request) {
  try {
    const userId = await assertSuperAdmin(request as any)
    const body = await request.json().catch(() => undefined)

    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const payload = parsed.data
    const supabase = getSupabaseAdmin()

    const resolvedSlug = resolveSlug(payload.name, payload.slug)

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        name: payload.name,
        parent_id: payload.parentId ?? null,
        slug: resolvedSlug,
        description: payload.description ?? null,
        icon: payload.icon ?? null,
        is_active: payload.isActive ?? true,
        metadata: payload.metadata ?? {}
      })
      .select(CATEGORY_COLUMNS.join(','))
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: mapRowToRecord(data) }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/super-admin/categories failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Met à jour une catégorie existante.
 */
export async function PUT(request: Request) {
  try {
    const userId = await assertSuperAdmin(request as any)
    const body = await request.json().catch(() => undefined)

    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const payload = parsed.data

    if (payload.parentId === payload.id) {
      return NextResponse.json({ error: 'Une catégorie ne peut pas être son propre parent.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const resolvedSlug = resolveSlug(payload.name, payload.slug)

    const { data, error } = await supabase
      .from('product_categories')
      .update({
        name: payload.name,
        parent_id: payload.parentId ?? null,
        slug: resolvedSlug,
        description: payload.description ?? null,
        icon: payload.icon ?? null,
        is_active: payload.isActive ?? true,
        metadata: payload.metadata ?? {}
      })
      .eq('id', payload.id)
      .select(CATEGORY_COLUMNS.join(','))
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: mapRowToRecord(data) }, { status: 200 })
  } catch (error) {
    console.error('❌ PUT /api/super-admin/categories failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Applique une mutation (toggle, reorder, duplicate) sur les catégories.
 */
export async function PATCH(request: Request) {
  try {
    const userId = await assertSuperAdmin()
    const body = await request.json().catch(() => undefined)

    const parsed = mutationPayloadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const payload = parsed.data

    switch (payload.type) {
      case 'toggle': {
        const { error } = await supabase
          .from('product_categories')
          .update({ is_active: payload.isActive })
          .eq('id', payload.id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }

        break
      }
      case 'reorder': {
        for (const item of payload.items) {
          const { error } = await supabase
            .from('product_categories')
            .update({ parent_id: item.parentId ?? null, metadata: { position: item.position } })
            .eq('id', item.id)

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
          }
        }
        break
      }
      case 'duplicate': {
        const { data, error } = await supabase
          .from('product_categories')
          .select(CATEGORY_COLUMNS.join(','))
          .eq('id', payload.id)
          .single()

        if (error || !data) {
          return NextResponse.json({ error: error?.message ?? 'Catégorie introuvable.' }, { status: 404 })
        }

        const base = mapRowToRecord(data)
        const overrides = payload.overrides ?? {}
        const duplicatedSlug = resolveSlug(
          overrides.name ?? `${base.name} copie`,
          overrides.slug ?? `${base.slug ?? slugify(base.name)}-${Date.now()}`
        )

        const insertPayload = {
          name: overrides.name ?? `${base.name} (Copie)` ,
          parent_id: overrides.parentId ?? base.parent_id,
          slug: duplicatedSlug,
          description: overrides.description ?? base.description,
          icon: overrides.icon ?? base.icon,
          is_active: overrides.isActive ?? base.is_active,
          metadata: overrides.metadata ?? base.metadata ?? {}
        }

        const { error: insertError } = await supabase.from('product_categories').insert(insertPayload)

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 400 })
        }

        break
      }
      default:
        return NextResponse.json({ error: 'Mutation non supportée.' }, { status: 400 })
    }

    const categories = await fetchCategories(true)
    return NextResponse.json({ data: { items: categories } }, { status: 200 })
  } catch (error) {
    console.error('❌ PATCH /api/super-admin/categories failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Désactive une catégorie (soft delete).
 */
export async function DELETE(request: Request) {
  try {
    const userId = await assertSuperAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Identifiant catégorie manquant.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('product_categories')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    console.error('❌ DELETE /api/super-admin/categories failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
