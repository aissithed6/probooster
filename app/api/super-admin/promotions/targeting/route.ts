import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

type TargetingVendor = {
  id: string
  email: string | null
  display_name: string
}

type TargetingProduct = {
  id: string
  name: string
  vendor_id: string
  tags?: string[]
}

type TargetingResponse = {
  vendors: TargetingVendor[]
  vendorProducts: Record<string, TargetingProduct[]>
}

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin()

  try {
    const { data: vendorRows, error: vendorError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'vendor')
      .order('created_at', { ascending: false })

    if (vendorError) {
      throw vendorError
    }

    const vendorsRaw = vendorRows ?? []
    const vendorIds = vendorsRaw.map((vendor) => vendor.id)

    const { data: profileRows, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', vendorIds.length > 0 ? vendorIds : [''])

    if (profileError) {
      console.error('Erreur chargement profils vendeurs :', profileError)
    }

    const profileMap = (profileRows ?? []).reduce<Record<string, { first_name?: string | null; last_name?: string | null }>>(
      (acc, profile) => {
        acc[profile.user_id] = {
          first_name: profile.first_name,
          last_name: profile.last_name
        }
        return acc
      },
      {}
    )

    const vendors: TargetingVendor[] = vendorsRaw.map((vendor) => {
      const profile = profileMap[vendor.id]
      const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()
      const fallback = vendor.email ?? vendor.id

      return {
        id: vendor.id,
        email: vendor.email,
        display_name: fullName || fallback
      }
    })

    let vendorProducts: Record<string, TargetingProduct[]> = {}

    if (vendorIds.length > 0) {
      const { data: productRows, error: productError } = await supabase
        .from('user_products')
        .select('id, name, vendor_id, tags')
        .in('vendor_id', vendorIds)
        .neq('product_status', 'archived')
        .order('created_at', { ascending: false })

      if (productError) {
        console.error('Erreur chargement produits ciblage :', productError)
      }

      vendorProducts = (productRows ?? []).reduce<Record<string, TargetingProduct[]>>((acc, product) => {
        const vendorId = product.vendor_id
        if (!acc[vendorId]) acc[vendorId] = []

        const tagsRaw: unknown = (product as any).tags
        const tags = Array.isArray(tagsRaw)
          ? tagsRaw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : []

        acc[vendorId].push({
          id: product.id,
          name: product.name,
          vendor_id: product.vendor_id,
          tags
        })

        return acc
      }, {})
    }

    const payload: TargetingResponse = {
      vendors,
      vendorProducts
    }

    return NextResponse.json({ data: payload }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/super-admin/promotions/targeting failed', error)
    const message = error instanceof Error ? error.message : 'Erreur interne.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
