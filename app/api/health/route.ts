import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Endpoint de santé (public) utilisé pour les checks d'uptime.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString()
    },
    { status: 200 }
  )
}
