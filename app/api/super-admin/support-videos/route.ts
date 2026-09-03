import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface SupportVideo {
  id: string
  title: string
  description: string
  youtube_url: string
  youtube_id: string
  category: string
  duration: string
  is_active: boolean
  position: number
  created_at: string
  updated_at: string
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()
    const category = searchParams.get('category')
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('support_videos')
      .select('*')
      .order('position', { ascending: true })

    if (search) {
      query = query.or(`title.ilike.%${search}%,youtube_id.ilike.%${search}%`)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      data: { items: data || [], count: (data || []).length } 
    }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/super-admin/support-videos failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    
    const { 
      title, 
      description, 
      youtube_url, 
      youtube_id, 
      category = 'general', 
      duration = '', 
      is_active = true 
    } = body

    if (!title || !youtube_url || !youtube_id) {
      return NextResponse.json({ 
        error: 'Title, YouTube URL, and YouTube ID are required' 
      }, { status: 400 })
    }

    // Get the next position
    const { count } = await supabase
      .from('support_videos')
      .select('*', { count: 'exact', head: true })

    const { data, error } = await supabase
      .from('support_videos')
      .insert({
        title,
        description,
        youtube_url,
        youtube_id,
        category,
        duration,
        is_active,
        position: count || 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: data }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/super-admin/support-videos failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('support_videos')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data: data }, { status: 200 })
  } catch (error) {
    console.error('❌ PUT /api/super-admin/support-videos failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('support_videos')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('❌ DELETE /api/super-admin/support-videos failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}