import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

/**
 * API pour enregistrer la session utilisateur côté serveur (contourne RLS avec service_role).
 * Le client anon ne peut pas insérer dans user_sessions à cause de la politique RLS.
 */
export async function POST(request: Request) {
  try {
    const { userId, sessionToken, deviceInfo, userAgent } = await request.json()

    if (!userId || !sessionToken) {
      return NextResponse.json({ error: "userId et sessionToken requis" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Upsert la session (si existe, mise à jour de last_activity_at)
    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        session_token: sessionToken.slice(0, 24),
        device_info: deviceInfo ? JSON.stringify(deviceInfo) : null,
        user_agent: userAgent || null,
        is_active: true,
        last_activity_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }, {
        onConflict: 'session_token',
        ignoreDuplicates: false
      })

    if (error) {
      console.error("❌ Error registering session:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Error in session API:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}