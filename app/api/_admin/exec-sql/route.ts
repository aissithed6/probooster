import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/_admin/exec-sql
 *
 * ⚠️  À usage interne / script de maintenance UNIQUEMENT.
 * Ne pas exposer publiquement sans authentification supplémentaire.
 *
 * Exécute une requête SQL arbitraire via le client admin (service_role → bypass RLS).
 * Body JSON : { "sql": "SELECT id,user_id,... FROM product_shares WHERE user_id='...'" }
 *
 * La fonction Postgres `exec(sql text)` doit exister dans le projet.
 * Si elle n’existe pas, on renvoie une instruction précise pour la créer.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const sql: string | undefined = body?.sql

    if (typeof sql !== 'string' || !sql.trim()) {
      return NextResponse.json({ error: 'Paramètre "sql" requis.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 1) Essayer la RPC exec(sql) exposée (plpgSQL SECURITY DEFINER)
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec', { sql })

    if (!rpcError) {
      return NextResponse.json({ data: rpcData, source: 'rpc' }, { status: 200 })
    }

    // 2) Indiquer la création de la fonction si elle n’existe pas
    const hint = `Fonction Postgres "exec(sql)" manquante. Créez-la une fois (SQL Editor) :\n` +
      `CREATE OR REPLACE FUNCTION exec(sql text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN EXECUTE sql; END $$ SECURITY DEFINER;\n` +
      `GRANT EXECUTE ON FUNCTION exec TO service_role;`

    return NextResponse.json({
      error: rpcError?.message || 'RPC exec indisponible',
      hint
    }, { status: 400 })
  } catch (e: any) {
    const message = e instanceof Error ? e.message : String(e)
    if (message.toLowerCase().includes('service_role')) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY manquant côté serveur.' }, { status: 500 })
    }
    return NextResponse.json({ error: message || 'Erreur serveur' }, { status: 500 })
  }
}