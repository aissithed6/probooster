import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import {
  createSystemAlertAdmin,
  deleteSystemAlertAdmin,
  escalateSystemAlertAdmin,
  fetchSystemAlertsAdmin,
  resolveAllSystemAlertsAdmin,
  updateSystemAlertStatusAdmin
} from '@/app/api/super-admin/_helpers/system-alerts'
import type { SuperAdminSystemAlert } from '@/lib/services/super-admin-dashboard-service'

const SYSTEM_ALERT_STATUSES: SuperAdminSystemAlert['status'][] = ['active', 'resolved']
const SYSTEM_ALERT_PRIORITIES: SuperAdminSystemAlert['priority'][] = ['low', 'medium', 'high']

const isValidStatus = (value: string | null): value is SuperAdminSystemAlert['status'] =>
  Boolean(value && SYSTEM_ALERT_STATUSES.includes((value === 'ignored' ? 'resolved' : value) as SuperAdminSystemAlert['status']))

const isValidPriority = (value: string | null): value is SuperAdminSystemAlert['priority'] =>
  Boolean(value && SYSTEM_ALERT_PRIORITIES.includes(value as SuperAdminSystemAlert['priority']))

export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const { searchParams } = new URL(request.url)

    const limitParam = searchParams.get('limit')
    const statusParam = searchParams.get('status')
    const priorityParam = searchParams.get('priority')

    const limitValue = limitParam ? Number(limitParam) : undefined
    const limit = limitValue && !Number.isNaN(limitValue) ? Math.max(1, limitValue) : undefined

    const normalizedStatus = statusParam === 'ignored' ? 'resolved' : statusParam
    const status = isValidStatus(normalizedStatus) ? (normalizedStatus as SuperAdminSystemAlert['status']) : undefined
    const priority = isValidPriority(priorityParam) ? priorityParam : undefined

    const alerts = await fetchSystemAlertsAdmin({ limit, status, priority })
    return NextResponse.json({ data: alerts })
  } catch (error) {
    console.error('GET /api/super-admin/system-alerts failed:', error)
    return NextResponse.json({ error: 'Erreur lors du chargement des alertes système.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const payload = await request.json()

    if (!payload?.title || !payload?.message) {
      return NextResponse.json({ error: 'Les champs "title" et "message" sont requis.' }, { status: 400 })
    }

    const alert = await createSystemAlertAdmin(payload)
    return NextResponse.json({ data: alert }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/system-alerts failed:', error)
    return NextResponse.json({ error: "Erreur lors de la création de l'alerte système." }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const body = (await request.json()) as { id?: string; status?: SuperAdminSystemAlert['status'] }

    if (!body?.id || !body.status || !isValidStatus(body.status)) {
      return NextResponse.json({ error: "Identifiant ou statut d'alerte invalide." }, { status: 400 })
    }

    const updated = await updateSystemAlertStatusAdmin(body.id, body.status)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/super-admin/system-alerts failed:', error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour de l'alerte." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const body = (await request.json()) as { id?: string; action?: 'escalate' | 'resolve_all' }

    if (body?.action === 'escalate') {
      if (!body.id) {
        return NextResponse.json({ error: "Identifiant requis pour l'escalade." }, { status: 400 })
      }
      const escalated = await escalateSystemAlertAdmin(body.id)
      return NextResponse.json({ data: escalated })
    }

    if (body?.action === 'resolve_all') {
      const resolvedCount = await resolveAllSystemAlertsAdmin()
      return NextResponse.json({ success: true, resolved: resolvedCount })
    }

    return NextResponse.json({ error: 'Action PATCH non supportée.' }, { status: 400 })
  } catch (error) {
    console.error('PATCH /api/super-admin/system-alerts failed:', error)
    return NextResponse.json({ error: "Erreur lors de l'exécution de l'action sur les alertes." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json({ error: "Identifiant de l'alerte requis." }, { status: 400 })
    }

    await deleteSystemAlertAdmin(alertId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/super-admin/system-alerts failed:', error)
    return NextResponse.json({ error: "Erreur lors de la suppression de l'alerte." }, { status: 500 })
  }
}
