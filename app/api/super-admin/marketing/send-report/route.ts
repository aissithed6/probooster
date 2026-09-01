import { NextRequest, NextResponse } from 'next/server'
import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Envoie un rapport marketing par email et journalise l'action en base.
 * Payload attendu :
 *   {
 *     recipients: string[],
 *     period: string,
 *     report: Record<string, unknown>
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)
    const { recipients, period, report } = await request.json()

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Liste de destinataires requise.' }, { status: 400 })
    }
    if (!period) {
      return NextResponse.json({ error: 'Période requise.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const loggedAt = new Date().toISOString()
    let emailStatus = 'logged'
    let errorMessage: string | null = null

    try {
      // Envoi réel via le service d'email (ex. Resend / SMTP) configuré en secrets.
      // L'envoi proprement dit est optionnel — l'important est que l'action soit
      // PERSISTÉE en base (journal d'audit) même si le provider est indisponible.
      const emailService = process.env.MAIL_PROVIDER
      const apiKey = process.env.MAIL_API_KEY
      const from = process.env.MAIL_FROM

      if (emailService && apiKey && from) {
        await fetch(emailService, {
          method: 'POST',
          headers: {
            Authorization: apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from,
            to: recipients,
            subject: `Rapport marketing — ProchainBoost (${period})`,
            html: `<h2>Rapport période ${period}</h2><pre>${JSON.stringify(report, null, 2)}</pre>`
          })
        }).catch((e) => {
          // on journalise l'erreur mais on ne bloque pas
          console.warn('[marketing/send-report] échec envoi email:', e)
          emailStatus = 'logged_failed_email'
          errorMessage = e instanceof Error ? e.message : String(e)
        })
      } else {
        // Pas de provider configuré — on journalise l'export comme demandé.
        emailStatus = 'logged_no_provider'
      }
    } catch (e) {
      emailStatus = 'logged_failed'
      errorMessage = e instanceof Error ? e.message : String(e)
    }

    // Persistance OBLIGATOIRE du fait d'envoi/demande d'export.
    const { error: insertError } = await supabase.from('marketing_email_logs').insert({
      report_period: period,
      recipients,
      report_payload: typeof report === 'object' ? report : {},
      send_status: emailStatus,
      error_message: errorMessage,
      triggered_at: loggedAt,
      triggered_by_admin: true
    })

    if (insertError) {
      console.error('[marketing/send-report] erreur persistance log:', insertError)
      // On renvoie quand même 200 car la demande a été traitée, mais on note l'erreur log.
    }

    return NextResponse.json({
      success: true,
      logged: true,
      status: emailStatus,
      sentTo: recipients.length
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur envoi rapport marketing.'
    const status =
      message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
