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
 * Crée un retour associé à une commande existante du super administrateur.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actorId = await assertSuperAdmin(request)
    const payload = await request.json()

    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return NextResponse.json({ error: 'Les articles retournés sont requis.' }, { status: 400 })
    }

    const order = await OrderRepository.createReturn(
      params.id,
      {
        reason: payload.reason ?? null,
        status: payload.status ?? 'pending',
        resolution: payload.resolution ?? null,
        refundAmount: payload.refundAmount ?? null,
        refundCurrency: payload.refundCurrency ?? null,
        processedAt: payload.processedAt ?? null,
        metadata: payload.metadata ?? {},
        items: payload.items.map((item: any) => ({
          orderItemId: item.orderItemId,
          quantity: item.quantity,
          condition: item.condition ?? null,
          refundAmount: item.refundAmount ?? null,
          metadata: item.metadata ?? {}
        }))
      },
      { actorId, actorRole: 'super_admin' }
    )

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error(`❌ POST /api/super-admin/orders/${params.id}/returns failed`, error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : message.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
