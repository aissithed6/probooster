import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/super-admin/roles - Récupère tous les rôles
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: roles, error } = await supabase
      .from('role_definitions')
      .select('*')
      .order('role_name')

    if (error) {
      throw error
    }

    return NextResponse.json({ roles: roles || [] })
  } catch (error) {
    console.error('GET /api/super-admin/roles failed:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des rôles' },
      { status: 500 }
    )
  }
}

// POST /api/super-admin/roles - Crée ou met à jour un rôle
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    
    const { role_code, role_name, description, sections, features, is_active } = body

    if (!role_code || !role_name) {
      return NextResponse.json(
        { error: 'Le code et le nom du rôle sont requis' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('role_definitions')
      .upsert({
        role_code,
        role_name,
        description: description || '',
        sections: sections || [],
        features: features || [],
        is_active: is_active !== false,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ role: data })
  } catch (error) {
    console.error('POST /api/super-admin/roles failed:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création/mise à jour du rôle' },
      { status: 500 }
    )
  }
}