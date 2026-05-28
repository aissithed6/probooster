import type { NextRequest } from 'next/server'

import { getSupabaseAdmin } from '@/lib/supabase'

export type RecordAutomationEventParams = {
  source?: string
  eventType: string
  entityType?: string | null
  entityId?: string | null
  actorUserId?: string | null
  payload?: Record<string, unknown> | null
  request?: NextRequest
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Enregistre un événement d'automatisation dans `public.automation_events`.
 * Best-effort : ne doit jamais casser le flux principal (commande, produit, etc.).
 */
export async function recordAutomationEvent(params: RecordAutomationEventParams): Promise<string | null> {
  const supabase = getSupabaseAdmin()

  const ip = params.request?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = params.request?.headers.get('user-agent') ?? null
  const referrer = params.request?.headers.get('referer') ?? null

  const enrichedPayload: Record<string, unknown> = {
    ...(params.payload ?? {}),
    entityIdRaw: params.entityId ?? null,
    context: {
      ip,
      userAgent,
      referrer
    }
  }

  const rawEntityId = params.entityId == null ? '' : String(params.entityId).trim()
  const safeEntityId = rawEntityId && UUID_REGEX.test(rawEntityId) ? rawEntityId : null

  try {
    const { data, error } = await supabase
      .from('automation_events')
      .insert({
        source: params.source ?? 'system',
        event_type: params.eventType,
        entity_type: params.entityType ?? null,
        entity_id: safeEntityId,
        actor_user_id: params.actorUserId ?? null,
        payload: enrichedPayload
      } as any)
      .select('id')
      .single()

    if (error) {
      console.warn('⚠️ recordAutomationEvent failed:', error)
      return null
    }

    const id = (data as any)?.id
    return typeof id === 'string' && id.length > 0 ? id : null
  } catch (error) {
    console.warn('⚠️ recordAutomationEvent unexpected error:', error)
    return null
  }
}
