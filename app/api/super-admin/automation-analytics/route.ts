import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { assertSuperAdmin } from '@/app/api/super-admin/_helpers/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

type AutomationRow = {
  id: string
  trigger_type: string
  is_active: boolean | null
}

type AutomationEventRow = {
  id: string
  event_type: string
  created_at: string | null
}

type AutomationExecutionRow = {
  id: string
  automation_id: string | null
  status: string
  started_at: string | null
  duration_ms: number | null
  error_message: string | null
}

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional()
})

type TrendPoint = {
  date: string
  executions: number
  successRate: number
  errors: number
}

type ErrorTopItem = {
  message: string
  count: number
  lastOccurrence: string
}

type PerfByTriggerTypeItem = {
  triggerType: string
  total: number
  successRate: number
  avgDurationMs: number
}

type AutomationAnalyticsResponse = {
  totals: {
    totalTriggers: number
    activeTriggers: number
    totalExecutions: number
    successRate: number
    averageExecutionTimeMs: number
    totalErrors: number
    last24Hours: {
      executions: number
      errors: number
      newTriggers: number
      events: number
    }
  }
  trends7d: TrendPoint[]
  topErrors: ErrorTopItem[]
  performanceByTriggerType: PerfByTriggerTypeItem[]
  topEventTypes: { eventType: string; count: number }[]
}

function startOfDayISO(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function formatDateKey(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/**
 * GET /api/super-admin/automation-analytics
 * Agrège des statistiques réelles pour l'onglet Analytics de l'automatisation.
 */
export async function GET(request: NextRequest) {
  try {
    await assertSuperAdmin(request)

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      days: searchParams.get('days') ?? undefined
    })

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const now = new Date()
    const days = parsed.data.days ?? 30
    const since = new Date(now)
    since.setDate(since.getDate() - days)

    const last24h = new Date(now)
    last24h.setHours(last24h.getHours() - 24)

    const last7d = new Date(now)
    last7d.setDate(last7d.getDate() - 7)

    const [{ data: automations, error: automationsError }, { data: executions, error: executionsError }, { data: events, error: eventsError }] = await Promise.all([
      supabase.from('automations').select('id, trigger_type, is_active').returns<AutomationRow[]>(),
      supabase
        .from('automation_executions')
        .select('id, automation_id, status, started_at, duration_ms, error_message')
        .gte('started_at', startOfDayISO(since))
        .returns<AutomationExecutionRow[]>(),
      supabase
        .from('automation_events')
        .select('id, event_type, created_at')
        .gte('created_at', startOfDayISO(since))
        .returns<AutomationEventRow[]>()
    ])

    if (automationsError) {
      return NextResponse.json({ error: automationsError.message }, { status: 500 })
    }
    if (executionsError) {
      return NextResponse.json({ error: executionsError.message }, { status: 500 })
    }
    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 })
    }

    const automationList = automations ?? []
    const executionList = executions ?? []
    const eventList = events ?? []

    const totalTriggers = automationList.length
    const activeTriggers = automationList.filter((a) => a.is_active === true).length

    const totalExecutions = executionList.length
    const successExecutions = executionList.filter((e) => e.status === 'success').length
    const totalErrors = executionList.filter((e) => e.status === 'failed' || Boolean(e.error_message)).length

    const durations = executionList.map((e) => (typeof e.duration_ms === 'number' ? e.duration_ms : null)).filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    const averageExecutionTimeMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

    const last24Executions = executionList.filter((e) => (e.started_at ? new Date(e.started_at) >= last24h : false))
    const last24Errors = last24Executions.filter((e) => e.status === 'failed' || Boolean(e.error_message)).length

    const last24Events = eventList.filter((ev) => (ev.created_at ? new Date(ev.created_at) >= last24h : false)).length

    const successRate = totalExecutions ? (successExecutions / totalExecutions) * 100 : 0

    // tendances 7 jours
    const trendMap = new Map<string, { executions: number; success: number; errors: number }>()
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = formatDateKey(d)
      trendMap.set(key, { executions: 0, success: 0, errors: 0 })
    }

    for (const exec of executionList) {
      if (!exec.started_at) continue
      const dt = new Date(exec.started_at)
      if (dt < last7d) continue
      const key = formatDateKey(dt)
      const bucket = trendMap.get(key)
      if (!bucket) continue
      bucket.executions += 1
      if (exec.status === 'success') bucket.success += 1
      if (exec.status === 'failed' || Boolean(exec.error_message)) bucket.errors += 1
    }

    const trends7d: TrendPoint[] = Array.from(trendMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({
        date,
        executions: v.executions,
        successRate: v.executions ? Math.round((v.success / v.executions) * 1000) / 10 : 0,
        errors: v.errors
      }))

    // top erreurs (sur failed/error_message)
    const errorMap = new Map<string, { count: number; lastOccurrence: string }>()
    for (const exec of executionList) {
      const message = (exec.error_message ?? '').trim()
      if (!message) continue
      const ts = exec.started_at ?? now.toISOString()
      const current = errorMap.get(message)
      if (!current) {
        errorMap.set(message, { count: 1, lastOccurrence: ts })
        continue
      }
      current.count += 1
      if (new Date(ts) > new Date(current.lastOccurrence)) {
        current.lastOccurrence = ts
      }
    }

    const topErrors: ErrorTopItem[] = Array.from(errorMap.entries())
      .map(([message, v]) => ({ message, count: v.count, lastOccurrence: v.lastOccurrence }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // performance par trigger_type
    const typeByAutomationId = new Map<string, string>()
    for (const a of automationList) {
      typeByAutomationId.set(a.id, a.trigger_type)
    }

    const perfMap = new Map<string, { total: number; success: number; durations: number[] }>()
    for (const exec of executionList) {
      if (!exec.automation_id) continue
      const t = typeByAutomationId.get(exec.automation_id) ?? 'unknown'
      const bucket = perfMap.get(t) ?? { total: 0, success: 0, durations: [] }
      bucket.total += 1
      if (exec.status === 'success') bucket.success += 1
      if (typeof exec.duration_ms === 'number' && Number.isFinite(exec.duration_ms)) bucket.durations.push(exec.duration_ms)
      perfMap.set(t, bucket)
    }

    const performanceByTriggerType: PerfByTriggerTypeItem[] = Array.from(perfMap.entries())
      .map(([triggerType, v]) => {
        const avg = v.durations.length ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length) : 0
        return {
          triggerType,
          total: v.total,
          successRate: v.total ? Math.round((v.success / v.total) * 1000) / 10 : 0,
          avgDurationMs: avg
        }
      })
      .sort((a, b) => b.total - a.total)

    const eventTypeMap = new Map<string, number>()
    for (const ev of eventList) {
      const key = (ev.event_type ?? '').trim() || 'unknown'
      eventTypeMap.set(key, (eventTypeMap.get(key) ?? 0) + 1)
    }

    const topEventTypes = Array.from(eventTypeMap.entries())
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const response: AutomationAnalyticsResponse = {
      totals: {
        totalTriggers,
        activeTriggers,
        totalExecutions,
        successRate: Math.round(successRate * 10) / 10,
        averageExecutionTimeMs,
        totalErrors,
        last24Hours: {
          executions: last24Executions.length,
          errors: last24Errors,
          newTriggers: 0,
          events: last24Events
        }
      },
      trends7d,
      topErrors,
      performanceByTriggerType,
      topEventTypes
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('GET /api/super-admin/automation-analytics failed:', error)
    const message = error instanceof Error ? error.message : "Erreur lors du chargement des analytics."
    const status = message.toLowerCase().includes('accès') || message.toLowerCase().includes('token') ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
