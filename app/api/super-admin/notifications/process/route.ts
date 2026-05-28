import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type JobChannel = 'email' | 'push'

type JobStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed'

interface NotificationJobRow {
  id: string
  channel: JobChannel
  status: JobStatus
  payload: any
  attempts: number | null
  last_error: string | null
  created_at: string
  updated_at: string
}

/**
 * Lit la configuration Push depuis super_admin_settings (scope=global).
 */
async function fetchGlobalPushEnabled(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<boolean> {
  const { data, error } = await supabase
    .from('super_admin_settings' as any)
    .select('settings')
    .eq('scope', 'global')
    .maybeSingle()

  if (error) {
    return true
  }

  const settings = (data as any)?.settings
  const cfg = settings?.superAdminNotifications?.push
  if (cfg && typeof cfg === 'object' && typeof cfg.enabled === 'boolean') {
    return Boolean(cfg.enabled)
  }
  return true
}

const getSmtpTransport = () => {
  const host = process.env.SMTP_HOST ?? ''
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER ?? ''
  const pass = process.env.SMTP_PASS ?? ''

  if (!host || !user || !pass) {
    throw new Error('Configuration SMTP manquante (SMTP_HOST/SMTP_USER/SMTP_PASS).')
  }

  return nodemailer.createTransport({
    host,
    port: Number.isFinite(port) ? port : 587,
    secure: port === 465,
    auth: { user, pass }
  })
}

async function sendEmail(jobPayload: any): Promise<void> {
  const transporter = getSmtpTransport()

  const from = (process.env.SMTP_FROM ?? process.env.SMTP_USER ?? '').toString().trim()
  if (!from) {
    throw new Error('SMTP_FROM manquant (ou SMTP_USER).')
  }

  const to = (jobPayload?.to ?? '').toString().trim()
  const subject = (jobPayload?.subject ?? '').toString().trim()
  const text = (jobPayload?.text ?? '').toString()

  if (!to || !subject || !text) {
    throw new Error('Payload email invalide (to/subject/text).')
  }

  await transporter.sendMail({ from, to, subject, text })
}

async function sendOneSignal(jobPayload: any): Promise<void> {
  const apiKey = (process.env.ONESIGNAL_REST_API_KEY ?? '').toString().trim()
  const appId = (process.env.ONESIGNAL_APP_ID ?? '').toString().trim()

  if (!apiKey || !appId) {
    throw new Error('Configuration OneSignal manquante (ONESIGNAL_REST_API_KEY/ONESIGNAL_APP_ID).')
  }

  const headings = jobPayload?.headings
  const contents = jobPayload?.contents
  const includedSegments = jobPayload?.included_segments
  const includeExternalUserIds = jobPayload?.include_external_user_ids

  if (!contents || typeof contents !== 'object') {
    throw new Error('Payload OneSignal invalide (contents).')
  }

  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Basic ${apiKey}`
    },
    body: JSON.stringify({
      app_id: appId,
      headings: headings ?? undefined,
      contents,
      included_segments: includedSegments ?? undefined,
      include_external_user_ids: includeExternalUserIds ?? undefined
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OneSignal error: HTTP ${res.status} ${text}`)
  }
}

/**
 * POST /api/super-admin/notifications/process
 * Traite la file technique `notification_jobs`.
 *
 * IMPORTANT:
 * - Table non créée = endpoint renvoie une erreur explicite (on ne casse rien).
 * - À brancher sur un Cron en prod.
 */
export async function POST(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const supabase = getSupabaseAdmin()

    const isPushEnabled = await fetchGlobalPushEnabled(supabase)

    // Vérifie l'existence de la table en tentant une lecture.
    const { data: pending, error } = await supabase
      .from('notification_jobs' as any)
      .select('id,channel,status,payload,attempts,last_error,created_at,updated_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) {
      return NextResponse.json(
        {
          error:
            'La table notification_jobs est indisponible. Phase 1: crée d\'abord le schéma DB (queue) puis réessaie.'
        },
        { status: 400 }
      )
    }

    const jobs = (pending ?? []) as NotificationJobRow[]

    let processed = 0
    let sent = 0
    let failed = 0

    for (const job of jobs) {
      processed += 1

      const attempts = Number(job.attempts ?? 0)
      const updatedAt = new Date().toISOString()

      await supabase
        .from('notification_jobs' as any)
        .update({ status: 'processing', attempts: attempts + 1, updated_at: updatedAt })
        .eq('id', job.id)

      try {
        if (job.channel === 'email') {
          await sendEmail(job.payload)
        } else if (job.channel === 'push') {
          if (!isPushEnabled) {
            throw new Error('Push désactivé (super_admin_settings.global.superAdminNotifications.push.enabled=false).')
          }
          await sendOneSignal(job.payload)
        } else {
          throw new Error(`Canal non supporté: ${String(job.channel)}`)
        }

        await supabase
          .from('notification_jobs' as any)
          .update({ status: 'sent', last_error: null, updated_at: new Date().toISOString() })
          .eq('id', job.id)

        sent += 1
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await supabase
          .from('notification_jobs' as any)
          .update({ status: 'failed', last_error: message, updated_at: new Date().toISOString() })
          .eq('id', job.id)

        failed += 1
      }
    }

    return NextResponse.json({ success: true, processed, sent, failed }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    console.error('POST /api/super-admin/notifications/process failed:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
