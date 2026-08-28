import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/_admin/exec-sql
 * Exécute une requête SQL (read-only recommandé) via le client admin (service_role).
 * Body: { sql: "SELECT ... FROM ..." }
 * ⚠️ À usage interne uniquement — à protéger côté infra (IP / auth admin) en prod.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const sql: string | undefined = body?.sql

    if (typeof sql !== 'string' || !sql.trim()) {
      return NextResponse.json({ error: 'Paramètre "sql" requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Exécuter le SQL via l'endpoint natif PostgREST en mode raw
    // https://supabase.com/docs/guides/api/using-rpc#post-a-function-with-parameters
    // → On essaye d'abord via RPC "exec"; sinon on tente via route REST directe /rest/v1/
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec', { sql })

    if (!rpcError) {
      return NextResponse.json({ data: rpcData, source: 'rpc' }, { status: 200 })
    }

    // Fallback : appel direct à l'endpoint SQL de PostgREST (POST /rest/v1/ avec body SQL)
    // Ce endpoint natif exige le header `apikey` + `Authorization: Bearer <service_role>`.
    const directRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Prefer': 'count=exact'
        },
        body: JSON.stringify({ sql })
      }
    )

    const directJson = await directRes.json().catch(() => null)

    if (!directRes.ok) {
      return NextResponse.json({
        error: directJson?.message ?? 'Échec de l\'exécution SQL',
        details: directJson?.details,
        hint: rpcError?.message
      }, { status: 400 })
    }

    return NextResponse.json({ data: directJson, source: 'rest' }, { status: 200 })
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e)
    if (message.toLowerCase().includes('service_role')) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur.' }, { status: 500 })
    }
    return NextResponse.json({ error: message || 'Erreur serveur' }, { status: 500 })
  }
}