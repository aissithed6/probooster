import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

type SegmentRow = { id: string; name: string; emails: string[] }

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('user_segments')
      .select('id, name, emails')
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json([])
    }

    const rows = (data ?? []).map((s: any): SegmentRow => ({
      id: String(s.id ?? ''),
      name: String(s.name ?? 'Segment'),
      emails: Array.isArray(s.emails) ? s.emails.filter((e: any) => typeof e === 'string') : []
    }))
    return NextResponse.json(rows)
  } catch (_) {
    return NextResponse.json([])
  }
}
