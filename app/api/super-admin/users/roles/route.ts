import { NextRequest, NextResponse } from 'next/server'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { assignRoleToUserAdmin, removeRoleFromUserAdmin } from '@/app/api/super-admin/_helpers/users'

/**
 * Gère l'assignation et le retrait de rôles secondaires pour un utilisateur.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const body = (await request.json()) as { userId?: string; roleId?: string }

    if (!body?.userId || !body.roleId) {
      return NextResponse.json({ error: "Identifiants utilisateur et rôle requis." }, { status: 400 })
    }

    await assignRoleToUserAdmin(body.userId, body.roleId)
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('POST /api/super-admin/users/roles failed:', error)
    return NextResponse.json({ error: "Erreur lors de l'assignation du rôle." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertSuperAdmin()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const roleId = searchParams.get('roleId')

    if (!userId || !roleId) {
      return NextResponse.json({ error: "Identifiants utilisateur et rôle requis." }, { status: 400 })
    }

    await removeRoleFromUserAdmin(userId, roleId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/super-admin/users/roles failed:', error)
    return NextResponse.json({ error: "Erreur lors du retrait du rôle." }, { status: 500 })
  }
}
