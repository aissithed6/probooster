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
 * Enregistre un paiement pour une commande super admin.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const actorId = await assertSuperAdmin(request)
    const payload = await request.json()

    if (!payload || !payload.provider || typeof payload.amount !== 'number') {
      return NextResponse.json({ error: 'Le fournisseur et le montant sont requis.' }, { status: 400 })
    }

    const order = await OrderRepository.createPayment(
      params.id,
      {
        provider: payload.provider,
        reference: payload.reference ?? null,
        amount: payload.amount,
        currency: payload.currency ?? null,
        status: payload.status ?? 'completed',
        paidAt: payload.paidAt ?? null,
        metadata: payload.metadata ?? {}
      },
      { actorId, actorRole: 'super_admin' }
    )

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error(`❌ POST /api/super-admin/orders/${params.id}/payments failed`, error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : message.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
