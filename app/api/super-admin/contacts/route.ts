import { NextResponse } from 'next/server'

import { fetchAdminContacts } from '@/app/api/super-admin/_helpers/dashboard'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'

export async function GET() {
  try {
    await assertSuperAdmin()
    const data = await fetchAdminContacts()
    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/super-admin/contacts failed:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des contacts administrateurs.' }, { status: 500 })
  }
}
