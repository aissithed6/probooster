import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { assertVendor } from '@/app/api/vendor/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function buildCreateTableHelp(table: string) {
  return {
    sql: `-- Exécuter dans Supabase SQL editor\ncreate table if not exists public.${table} (\n  id uuid primary key default gen_random_uuid(),\n  vendor_id text not null,\n  data jsonb not null default '{}'::jsonb,\n  created_at timestamptz not null default now(),\n  updated_at timestamptz not null default now()\n);\n\ncreate index if not exists ${table}_vendor_id_idx on public.${table}(vendor_id);\n`,
    note: `Table manquante: public.${table}. Crée-la puis réessaie.`
  }
}

/**
 * GET /api/vendor/ranking-objectives
 * POST /api/vendor/ranking-objectives
 * Persiste les objectifs du vendeur en DB.
 */
export async function GET(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('vendor_ranking_objectives')
      .select('id, vendor_id, data, created_at, updated_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('❌ GET /api/vendor/ranking-objectives failed:', error)
      const help = String(error?.message ?? '').includes('relation') ? buildCreateTableHelp('vendor_ranking_objectives') : null
      return NextResponse.json({ error: 'Erreur lors de la récupération des objectifs.', help }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/vendor/ranking-objectives unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorId = await assertVendor(request)
    const supabase = getSupabaseAdmin()

    const body = await request.json().catch(() => ({}))
    const payload = (body as any)?.data ?? body

    const { data, error } = await supabase
      .from('vendor_ranking_objectives')
      .insert({ vendor_id: vendorId, data: payload ?? {} })
      .select('id, vendor_id, data, created_at, updated_at')
      .single()

    if (error) {
      console.error('❌ POST /api/vendor/ranking-objectives failed:', error)
      const help = String(error?.message ?? '').includes('relation') ? buildCreateTableHelp('vendor_ranking_objectives') : null
      return NextResponse.json({ error: 'Erreur lors de la création de l\'objectif.', help }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/vendor/ranking-objectives unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
