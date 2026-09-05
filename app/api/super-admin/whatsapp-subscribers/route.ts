import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

/**
 * API Super Admin pour gérer les abonnés WhatsApp Pulse
 * GET: Liste paginée avec filtres + export CSV/Excel/POST: Actions groupées
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const status = searchParams.get('status')
    const interest = searchParams.get('interest')
    const country = searchParams.get('country')
    const search = searchParams.get('search')

    const supabase = getSupabaseAdmin()

    // Construire la query
    let query = supabase
      .from('whatsapp_subscribers')
      .select('*', { count: 'exact' })
      .order('subscribed_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (interest && interest !== 'all') {
      query = query.contains('interests', [interest])
    }
    if (country && country !== 'all') {
      query = query.eq('country_name', country)
    }
    if (search) {
      query = query.or(`phone.ilike.%${search}%,country_name.ilike.%${search}%`)
    }

    // Exporter tous si format demandé
    if (format === 'csv' || format === 'excel' || format === 'pdf') {
      query = query.range(0, 9999)
    } else {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format d'export
    if (format === 'csv') {
      const headers = 'ID,Phone,Country,Flag,Interests,Status,Source,Subscribed At\n'
      const rows = (data || []).map((s: any) =>
        `${s.id},${s.phone},${s.country_name},${s.country_flag},"${(s.interests || []).join(';')}",${s.status},${s.source},${s.subscribed_at}`
      ).join('\n')
      const csv = headers + rows
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="whatsapp-subscribers.csv"'
        }
      })
    }

    if (format === 'excel') {
      const headers = '<table><tr><th>ID</th><th>Phone</th><th>Country</th><th>Interests</th><th>Status</th><th>Source</th><th>Subscribed At</th></tr>'
      const rows = (data || []).map((s: any) =>
        `<tr><td>${s.id}</td><td>${s.phone}</td><td>${s.country_flag} ${s.country_name}</td><td>${(s.interests || []).join(', ')}</td><td>${s.status}</td><td>${s.source}</td><td>${new Date(s.subscribed_at).toLocaleDateString('fr-FR')}</td></tr>`
      ).join('')
      const html = headers + rows + '</table>'
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="whatsapp-subscribers.xls"'
        }
      })
    }

    if (format === 'pdf') {
      // Générer un HTML stylisé pour impression PDF
      const rows = (data || []).map((s: any, i: number) =>
        `<tr><td>${i + 1}</td><td>${s.country_flag} ${s.phone}</td><td>${s.country_name}</td><td>${(s.interests || []).join(', ')}</td><td>${s.status}</td><td>${new Date(s.subscribed_at).toLocaleDateString('fr-FR')}</td></tr>`
      ).join('')
      
      const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>WhatsApp Subscribers</title>
<style>
body{font-family:Arial,sans-serif;margin:20px;}
h1{color:#25D366;}
table{width:100%;border-collapse:collapse;margin-top:20px;}
th,td{border:1px solid #ddd;padding:8px;text-align:left;}
th{background:#25D366;color:white;}
tr:nth-child(even){background:#f2f2f2;}
</style></head><body>
<h1>📱 WhatsApp Pulse - Abonnés</h1>
<p>Total: ${count} abonnés</p>
<table><tr><th>#</th><th>Phone</th><th>Country</th><th>Interests</th><th>Status</th><th>Date</th></tr>${rows}</table>
</body></html>`

      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': 'inline; filename="whatsapp-subscribers.html"'
        }
      })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching subscribers:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * POST: Actions groupées sur les abonnés
 * - delete: Suppression en lot
 * - updateStatus: Changement de statut en lot
 * - merge: Fusionner les intérêts de doublons
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, ids, status } = body

    const supabase = getSupabaseAdmin()

    switch (action) {
      case 'delete': {
        if (!ids || !Array.isArray(ids)) {
          return NextResponse.json({ error: 'IDs requis' }, { status: 400 })
        }
        const { error } = await supabase
          .from('whatsapp_subscribers')
          .delete()
          .in('id', ids)
        
        if (error) throw error
        return NextResponse.json({ success: true, deleted: ids.length })
      }

      case 'updateStatus': {
        if (!ids || !Array.isArray(ids) || !status) {
          return NextResponse.json({ error: 'IDs et statut requis' }, { status: 400 })
        }
        const { error } = await supabase
          .from('whatsapp_subscribers')
          .update({ status, updated_at: new Date().toISOString() })
          .in('id', ids)
        
        if (error) throw error
        return NextResponse.json({ success: true, updated: ids.length })
      }

      case 'unsubscribe': {
        if (!ids || !Array.isArray(ids)) {
          return NextResponse.json({ error: 'IDs requis' }, { status: 400 })
        }
        const { error } = await supabase
          .from('whatsapp_subscribers')
          .update({ status: 'unsubscribed', updated_at: new Date().toISOString() })
          .in('id', ids)
        
        if (error) throw error
        return NextResponse.json({ success: true, unsubscribed: ids.length })
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Error in bulk action:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

/**
 * Récupérer les statistiques pour le dashboard
 */
async function getStats(supabase: any) {
  const { data } = await supabase.rpc('get_whatsapp_subscribers_stats')
  return data
}