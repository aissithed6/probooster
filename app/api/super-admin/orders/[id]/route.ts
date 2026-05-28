import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertSuperAdmin } from '../../_helpers/auth'
import { OrderRepository } from '../../../../../lib/repositories/order-repository'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Retourne la commande détaillée pour le super administrateur.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await assertSuperAdmin(request)

    const order = await OrderRepository.getOrderById(params.id)

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
    }

    return NextResponse.json({ data: order }, { status: 200 })
  } catch (error) {
    console.error(`❌ GET /api/super-admin/orders/${params.id} failed`, error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Met à jour les statuts ou métadonnées principales d’une commande.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const actorId = await assertSuperAdmin(request)
    const payload = await request.json().catch(() => ({}))

    const allowedFields = [
      'status',
      'paymentStatus',
      'paymentMethod',
      'notes',
      'shippingAddress',
      'shippingLat',
      'shippingLng',
      'billingAddress',
      'deliveryDate'
    ]
    const updates: Record<string, unknown> = {}

    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        updates[key] = payload[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide fourni.' }, { status: 400 })
    }

    const order = await OrderRepository.updateOrder(
      params.id,
      updates as {
        status?: string
        paymentStatus?: string
        paymentMethod?: string | null
        notes?: string | null
        shippingAddress?: any
        shippingLat?: number | null
        shippingLng?: number | null
        billingAddress?: any
        deliveryDate?: string | null
      },
      { actorId, actorRole: 'super_admin' }
    )

    return NextResponse.json({ data: order }, { status: 200 })
  } catch (error) {
    console.error(`❌ PATCH /api/super-admin/orders/${params.id} failed`, error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : message.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * Supprime définitivement une commande (et ses dépendances) — super admin uniquement.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await assertSuperAdmin(request)
    await OrderRepository.deleteOrderById(params.id)
    return NextResponse.json({ data: { id: params.id } }, { status: 200 })
  } catch (error) {
    console.error(`❌ DELETE /api/super-admin/orders/${params.id} failed`, error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : message.includes('introuvable') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
