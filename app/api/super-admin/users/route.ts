import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin, getCallerRole, isSuperAdminTarget } from '../_helpers/auth'
import {
  createUserAdmin,
  deleteUserAdmin,
  fetchUsersAdmin,
  updateUserAdmin,
  updateUserRoleAdmin,
  updateUserStatusAdmin
} from '../_helpers/users'
import type {
  CreateSuperAdminUserInput,
  GetUsersOptions,
  SuperAdminUserStatus,
  SuperAdminUserSummary,
  UpdateSuperAdminUserInput
} from '../../../../lib/services/super-admin-dashboard-service'

/**
 * Gère les opérations de lecture et de création pour les utilisateurs côté Super Admin.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const options: GetUsersOptions = {
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      role: searchParams.get('role') ?? undefined
    }

    const data = await fetchUsersAdmin(options)
    // Un simple admin ne doit jamais voir ni manipuler les comptes super administrateur.
    const callerRole = await getCallerRole(request)
    const filtered = callerRole === 'super_admin'
      ? data
      : data.filter((user) => user.role !== 'super_admin')
    return NextResponse.json({ data: filtered })
  } catch (error) {
    console.error('GET /api/super-admin/users failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la récupération des utilisateurs."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const body = (await request.json()) as Partial<UpdateSuperAdminUserInput>

    if (!body?.id) {
      return NextResponse.json({ error: "Identifiant utilisateur manquant." }, { status: 400 })
    }

    if (await isSuperAdminTarget(body.id)) {
      const callerRole = await getCallerRole(request)
      if (callerRole !== 'super_admin') {
        return NextResponse.json({ error: "Action non autorisée : un administrateur ne peut pas modifier un super administrateur." }, { status: 403 })
      }
    }

    const updated = await updateUserAdmin(body as UpdateSuperAdminUserInput)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/super-admin/users failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour de l'utilisateur."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: "Identifiant utilisateur requis." }, { status: 400 })
    }

    if (await isSuperAdminTarget(userId)) {
      const callerRole = await getCallerRole(request)
      if (callerRole !== 'super_admin') {
        return NextResponse.json({ error: "Action non autorisée : un administrateur ne peut pas supprimer un super administrateur." }, { status: 403 })
      }
    }

    await deleteUserAdmin(userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/super-admin/users failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la suppression de l’utilisateur.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const body = (await request.json()) as {
      id?: string
      status?: SuperAdminUserStatus
      role?: SuperAdminUserSummary['role']
    }

    if (!body?.id) {
      return NextResponse.json({ error: "Identifiant utilisateur requis." }, { status: 400 })
    }

    const callerRole = await getCallerRole(request)

    if (body.role) {
      const normalizedRole = typeof body.role === 'string' ? body.role : (body.role as { value?: string })?.value
      if (normalizedRole && normalizedRole.toLowerCase().replace(/-/g, '_') === 'super_admin' && callerRole !== 'super_admin') {
        return NextResponse.json({ error: "Action non autorisée : seul un super administrateur peut attribuer le rôle super administrateur." }, { status: 403 })
      }
    }

    if (await isSuperAdminTarget(body.id) && callerRole !== 'super_admin') {
      return NextResponse.json({ error: "Action non autorisée : un administrateur ne peut pas modifier un super administrateur." }, { status: 403 })
    }

    if (body.status) {
      await updateUserStatusAdmin(body.id, body.status)
    }

    if (body.role) {
      await updateUserRoleAdmin(body.id, body.role)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/super-admin/users failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors de la mise à jour partielle de l'utilisateur."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Crée un nouvel utilisateur via les privilèges Super Admin.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const body = (await request.json()) as Partial<CreateSuperAdminUserInput>

    if (!body?.email || !body.role || !body.type) {
      return NextResponse.json({ error: "Champs requis manquants (email, role, type)." }, { status: 400 })
    }

    const normalizedRole = typeof body.role === 'string' ? body.role : (body.role as { value?: string })?.value
    if (normalizedRole && normalizedRole.toLowerCase().replace(/-/g, '_') === 'super_admin') {
      const callerRole = await getCallerRole(request)
      if (callerRole !== 'super_admin') {
        return NextResponse.json({ error: "Action non autorisée : seul un super administrateur peut créer un compte super administrateur." }, { status: 403 })
      }
    }

    const newUser = await createUserAdmin(body as CreateSuperAdminUserInput)
    return NextResponse.json({ data: newUser }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/users failed:', error)
    const rawMessage = error instanceof Error ? error.message : ''
    const isDuplicateEmail = rawMessage.includes('duplicate key value') && rawMessage.includes('users_email_key')
    const responseMessage = isDuplicateEmail
      ? "Cette adresse e-mail est déjà utilisée. Veuillez en choisir une autre."
      : rawMessage || "Erreur lors de la création de l'utilisateur."
    const statusCode = isDuplicateEmail ? 409 : 500
    return NextResponse.json({ error: responseMessage }, { status: statusCode })
  }
}
