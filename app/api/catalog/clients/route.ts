import { NextResponse } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

interface ClientRecord {
  id: string
  name: string | null
  email: string | null
}

/**
 * GET /api/catalog/clients
 * Retourne la liste des clients (accès serveur).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() ?? ''

    const supabase = getSupabaseAdmin()
    let query = supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'client')
      .order('name', { ascending: true })

    if (search.length > 0) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const items: ClientRecord[] = (data ?? []).map((u: any) => ({
      id: u.id,
      name: u.name ?? null,
      email: u.email ?? null
    }))

    return NextResponse.json({ data: { items } }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/catalog/clients failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
