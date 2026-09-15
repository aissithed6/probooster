import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin, getCallerRole, isSuperAdminTarget } from '@/app/api/super-admin/_helpers/auth'
import { duplicateUserAdmin } from '@/app/api/super-admin/_helpers/users'

/**
 * Duplique un utilisateur existant pour le super administrateur.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const body = (await request.json()) as { userId?: string }

    if (!body?.userId) {
      return NextResponse.json({ error: "Identifiant utilisateur requis." }, { status: 400 })
    }

    if (await isSuperAdminTarget(body.userId)) {
      const callerRole = await getCallerRole(request)
      if (callerRole !== 'super_admin') {
        return NextResponse.json({ error: "Action non autorisée : un administrateur ne peut pas dupliquer un super administrateur." }, { status: 403 })
      }
    }

    const duplicated = await duplicateUserAdmin(body.userId)
    return NextResponse.json({ data: duplicated }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/users/duplicate failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la duplication de l’utilisateur.' }, { status: 500 })
  }
}
