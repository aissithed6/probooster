import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import {
  createRoleAdmin,
  deleteRoleAdmin,
  fetchRolesAdmin,
  setRolePermissionsAdmin,
  updateRoleAdmin
} from '@/app/api/super-admin/_helpers/roles'
import { fetchPermissionsAdmin } from '@/app/api/super-admin/_helpers/permissions'
import type { CreateRoleAdminInput, UpdateRoleAdminInput } from '@/app/api/super-admin/_helpers/roles'

export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const { searchParams } = new URL(request.url)

    const includePermissions = searchParams.get('includePermissions') === 'true'

    const roles = await fetchRolesAdmin()

    let permissions: Awaited<ReturnType<typeof fetchPermissionsAdmin>> | undefined

    if (includePermissions) {
      try {
        permissions = await fetchPermissionsAdmin()
      } catch (permissionsError) {
        console.error('⚠️ fetchPermissionsAdmin failed:', permissionsError)
        permissions = []
      }
    }

    return NextResponse.json({
      data: roles,
      permissions
    })
  } catch (error) {
    console.error('GET /api/super-admin/roles failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des rôles.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const payload = (await request.json()) as CreateRoleAdminInput

    if (!payload?.name || payload.name.trim().length === 0) {
      return NextResponse.json({ error: 'Le nom du rôle est requis.' }, { status: 400 })
    }

    const role = await createRoleAdmin(payload)
    return NextResponse.json({ data: role }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/roles failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la création du rôle.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const payload = (await request.json()) as (UpdateRoleAdminInput & { id?: string })

    if (!payload?.id) {
      return NextResponse.json({ error: "Identifiant du rôle requis." }, { status: 400 })
    }

    const updated = await updateRoleAdmin(payload.id, payload)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/super-admin/roles failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du rôle.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('id')

    if (!roleId) {
      return NextResponse.json({ error: "Identifiant du rôle requis." }, { status: 400 })
    }

    await deleteRoleAdmin(roleId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/super-admin/roles failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression du rôle.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const payload = (await request.json()) as { id?: string; permissions?: string[] }

    if (!payload?.id) {
      return NextResponse.json({ error: "Identifiant du rôle requis." }, { status: 400 })
    }

    const permissions = await setRolePermissionsAdmin(payload.id, payload.permissions ?? [])
    return NextResponse.json({ success: true, permissions })
  } catch (error) {
    console.error('PATCH /api/super-admin/roles failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des permissions du rôle.' }, { status: 500 })
  }
}
