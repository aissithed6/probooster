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
 * PUT /api/vendor/ranking-notifications/:id
 * DELETE /api/vendor/ranking-notifications/:id
 */
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const vendorId = await assertVendor(request)
    const { id } = await ctx.params
    const supabase = getSupabaseAdmin()

    const body = await request.json().catch(() => ({}))
    const payload = (body as any)?.data ?? body

    const { data: existing, error: existingErr } = await supabase
      .from('vendor_ranking_notifications')
      .select('id, vendor_id')
      .eq('id', id)
      .maybeSingle()

    if (existingErr) {
      console.error('❌ PUT /api/vendor/ranking-notifications lookup failed:', existingErr)
      const help = String(existingErr?.message ?? '').includes('relation') ? buildCreateTableHelp('vendor_ranking_notifications') : null
      return NextResponse.json({ error: 'Erreur lors de la lecture de la notification.', help }, { status: 500 })
    }

    if (!existing || String((existing as any).vendor_id) !== vendorId) {
      return NextResponse.json({ error: 'Accès refusé: notification introuvable ou non autorisée.' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('vendor_ranking_notifications')
      .update({ data: payload ?? {}, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, vendor_id, data, created_at, updated_at')
      .single()

    if (error) {
      console.error('❌ PUT /api/vendor/ranking-notifications failed:', error)
      const help = String(error?.message ?? '').includes('relation') ? buildCreateTableHelp('vendor_ranking_notifications') : null
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la notification.', help }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('❌ PUT /api/vendor/ranking-notifications unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const vendorId = await assertVendor(request)
    const { id } = await ctx.params
    const supabase = getSupabaseAdmin()

    const { data: existing, error: existingErr } = await supabase
      .from('vendor_ranking_notifications')
      .select('id, vendor_id')
      .eq('id', id)
      .maybeSingle()

    if (existingErr) {
      console.error('❌ DELETE /api/vendor/ranking-notifications lookup failed:', existingErr)
      const help = String(existingErr?.message ?? '').includes('relation') ? buildCreateTableHelp('vendor_ranking_notifications') : null
      return NextResponse.json({ error: 'Erreur lors de la lecture de la notification.', help }, { status: 500 })
    }

    if (!existing || String((existing as any).vendor_id) !== vendorId) {
      return NextResponse.json({ error: 'Accès refusé: notification introuvable ou non autorisée.' }, { status: 403 })
    }

    const { error } = await supabase.from('vendor_ranking_notifications').delete().eq('id', id)

    if (error) {
      console.error('❌ DELETE /api/vendor/ranking-notifications failed:', error)
      const help = String(error?.message ?? '').includes('relation') ? buildCreateTableHelp('vendor_ranking_notifications') : null
      return NextResponse.json({ error: 'Erreur lors de la suppression de la notification.', help }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('❌ DELETE /api/vendor/ranking-notifications unexpected error:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.toLowerCase().includes('accès') ? 403 : message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
