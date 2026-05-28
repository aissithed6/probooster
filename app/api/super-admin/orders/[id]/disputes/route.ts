import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { OrderRepository } from '@/lib/repositories/order-repository'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Ouvre un litige pour une commande super admin.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actorId = await assertSuperAdmin(request)
    const payload = await request.json()

    if (!payload || !payload.type) {
      return NextResponse.json({ error: 'Le type de litige est requis.' }, { status: 400 })
    }

    const order = await OrderRepository.createDispute(
      params.id,
      {
        type: payload.type,
        subject: payload.subject ?? null,
        description: payload.description ?? null,
        priority: payload.priority ?? null,
        status: payload.status ?? 'open',
        assignedTo: payload.assignedTo ?? null,
        resolution: payload.resolution ?? null,
        closedAt: payload.closedAt ?? null,
        metadata: payload.metadata ?? {}
      },
      { actorId, actorRole: 'super_admin' }
    )

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error(`❌ POST /api/super-admin/orders/${params.id}/disputes failed`, error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : message.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
