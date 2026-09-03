import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('support_videos')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      data: { items: data || [], count: (data || []).length } 
    }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/support/videos failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}