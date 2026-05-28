import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import {
  fetchSupportTicketsAdmin,
  updateSupportTicketAdmin
} from '@/app/api/super-admin/_helpers/support-tickets'

export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : undefined

    const tickets = await fetchSupportTicketsAdmin(limit)
    return NextResponse.json({ data: tickets })
  } catch (error) {
    console.error('GET /api/super-admin/support-tickets failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des tickets support.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const body = (await request.json()) as {
      id?: string
      updates?: Partial<Parameters<typeof updateSupportTicketAdmin>[1]>
    }

    if (!body?.id) {
      return NextResponse.json({ error: "Identifiant du ticket requis." }, { status: 400 })
    }

    const updated = await updateSupportTicketAdmin(body.id, body.updates ?? {})
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/super-admin/support-tickets failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du ticket support.' }, { status: 500 })
  }
}
