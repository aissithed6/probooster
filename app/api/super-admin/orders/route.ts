import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { assertOpsOrSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { OrderRepository } from '@/lib/repositories/order-repository'

export async function GET(request: NextRequest) {
  try {
    await assertOpsOrSuperAdmin(request)

    const url = new URL(request.url)
    const filters = {
      status: url.searchParams.get('status') ?? undefined,
      paymentStatus: url.searchParams.get('paymentStatus') ?? undefined,
      vendorId: url.searchParams.get('vendorId') ?? undefined,
      customerId: url.searchParams.get('customerId') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined
    }

    const pagination = {
      limit: Number(url.searchParams.get('limit') ?? '50'),
      offset: Number(url.searchParams.get('offset') ?? '0')
    }

    const data = await OrderRepository.listOrders({ filters, pagination })
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('❌ GET /api/super-admin/orders failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await assertOpsOrSuperAdmin(request)
    const payload = await request.json()
    const order = await OrderRepository.createOrder(payload, { actorId: userId, actorRole: 'super_admin' })
    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('❌ POST /api/super-admin/orders failed', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    const status = message.includes('Accès') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
