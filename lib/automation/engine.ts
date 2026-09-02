import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Moteur d'exécution des automatisations.
 *
 * Flux : un événement est enregistré dans `automation_events` (via recordAutomationEvent)
 * → ce moteur est appelé avec l'id de l'événement → il cherche les automatisations actives
 * dont `trigger_type` correspond à l'`event_type` → évalue les conditions
 * (`trigger_conditions.conditions`) → exécute les actions (`action_config.actions`)
 * → écrit une ligne dans `automation_executions` pour chaque automation déclenchée.
 */

export type AutomationRow = {
  id: string
  name: string
  trigger_type: string
  trigger_conditions: Record<string, unknown> | null
  action_type: string
  action_config: Record<string, unknown> | null
  is_active: boolean | null
}

export type AutomationEventRow = {
  id: string
  source: string
  event_type: string
  entity_type: string | null
  entity_id: string | null
  actor_user_id: string | null
  payload: Record<string, unknown> | null
}

type TriggerCondition = {
  id?: string
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: string | number | boolean
  logicalOperator?: 'and' | 'or'
}

type AutomationAction = {
  id?: string
  type: 'email' | 'sms' | 'notification' | 'webhook' | 'database' | 'api_call' | 'file_operation' | 'system_command'
  name?: string
  config?: Record<string, unknown>
  order?: number
  isActive?: boolean
}

const CONDITION_OPERATORS: Set<string> = new Set([
  'equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'in', 'not_in'
])

/** Résout un chemin pointé (ex: "order.total", "context.userAgent") dans le payload d'un événement. */
function resolvePath(source: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined
  let current: unknown = source
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function compareValues(actual: unknown, operator: TriggerCondition['operator'], expected: unknown): boolean {
  const actualStr = actual == null ? '' : String(actual)
  const expectedStr = expected == null ? '' : String(expected)

  switch (operator) {
    case 'equals':
      if (typeof expected === 'number' && typeof actual !== 'boolean') return Number(actual) === expected
      if (typeof expected === 'boolean') return Boolean(actual) === expected
      return actualStr.toLowerCase() === expectedStr.toLowerCase()
    case 'not_equals':
      return !compareValues(actual, 'equals', expected)
    case 'contains':
      return actualStr.toLowerCase().includes(expectedStr.toLowerCase())
    case 'not_contains':
      return !actualStr.toLowerCase().includes(expectedStr.toLowerCase())
    case 'greater_than':
      return Number(actual) > Number(expected)
    case 'less_than':
      return Number(actual) < Number(expected)
    case 'in': {
      const list = Array.isArray(expected)
        ? expected
        : expectedStr.split(',').map((v) => v.trim()).filter(Boolean)
      return list.map((v) => String(v).toLowerCase()).includes(actualStr.toLowerCase())
    }
    case 'not_in':
      return !compareValues(actual, 'in', expected)
    default:
      return false
  }
}

/**
 * Évalue les conditions d'une automatisation contre le payload d'un événement.
 * Les conditions sont combinées avec leur `logicalOperator` (and par défaut, or supporté).
 */
export function evaluateConditions(conditions: unknown, payload: Record<string, unknown>): boolean {
  if (!Array.isArray(conditions) || conditions.length === 0) return true

  let result = true
  let inOrGroup = false

  for (let i = 0; i < conditions.length; i++) {
    const raw = conditions[i] as Partial<TriggerCondition>
    if (!raw || typeof raw !== 'object' || typeof raw.field !== 'string' || !raw.field.trim()) continue

    const operator = CONDITION_OPERATORS.has(String(raw.operator)) ? raw.operator : 'equals'
    const actual = resolvePath(payload, raw.field.trim())
    const matched = compareValues(actual, operator as TriggerCondition['operator'], raw.value)
    const logical = i === 0 ? 'and' : ((raw.logicalOperator ?? 'and') as 'and' | 'or')

    if (logical === 'or') {
      inOrGroup = true
      result = result || matched
    } else if (inOrGroup) {
      result = result && matched
      inOrGroup = false
    } else {
      result = result && matched
    }
  }

  return result
}

/**
 * Exécute une action individuelle. Retourne un résultat descriptif écrit dans `output`.
 * Seuls webhook et api_call effectuent de vraies actions externes pour l'instant.
 */
async function executeAction(action: AutomationAction, event: AutomationEventRow): Promise<Record<string, unknown>> {
  const type = String(action?.type ?? '')
  const config = (action?.config && typeof action.config === 'object' ? action.config : {}) as Record<string, unknown>

  if (type === 'webhook' || type === 'api_call') {
    const url = typeof config.url === 'string' ? config.url.trim() : ''
    if (!url || !/^https?:\/\//i.test(url)) {
      return { action: type, status: 'skipped', reason: 'URL invalide ou manquante dans la configuration.' }
    }
    const method = typeof config.method === 'string' ? config.method.toUpperCase() : 'POST'
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const secretHeader = typeof config.secretHeader === 'string' ? config.secretHeader.trim() : ''
    const secretValue = typeof config.secretValue === 'string' ? config.secretValue : ''
    if (secretHeader && secretValue) headers[secretHeader] = secretValue

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify({
          event: event.event_type,
          source: event.source,
          entityType: event.entity_type,
          entityId: event.entity_id,
          payload: event.payload
        }),
        signal: controller.signal
      })
      return { action: type, status: res.ok ? 'success' : 'failed', httpStatus: res.status, url }
    } catch (e) {
      return { action: type, status: 'failed', url, error: e instanceof Error ? e.message : 'Erreur réseau' }
    } finally {
      clearTimeout(timeout)
    }
  }

  // Actions sans backend dédié : journalisées honnêtement (pas de faux succès).
  return {
    action: type || 'unknown',
    status: 'skipped',
    reason: `Action "${type}" non encore supportée par le moteur (backend requis).`
  }
}

/**
 * Traite un événement : trouve les automatisations actives correspondantes,
 * évalue leurs conditions, exécute leurs actions et enregistre les exécutions.
 * Best-effort : ne doit jamais lever d'exception vers l'appelant.
 */
export async function processAutomationEvent(eventId: string): Promise<void> {
  if (!eventId) return
  const supabase = getSupabaseAdmin()

  try {
    const { data: event, error: eventError } = await supabase
      .from('automation_events')
      .select('id, source, event_type, entity_type, entity_id, actor_user_id, payload')
      .eq('id', eventId)
      .single()
      .returns<AutomationEventRow>()

    if (eventError || !event) {
      console.warn('⚠️ automation engine: événement introuvable', eventId, eventError?.message)
      return
    }

    const { data: automations, error: automationsError } = await supabase
      .from('automations')
      .select('id, name, trigger_type, trigger_conditions, action_type, action_config, is_active')
      .eq('is_active', true)
      .eq('trigger_type', event.event_type)
      .returns<AutomationRow[]>()

    if (automationsError) {
      console.warn('⚠️ automation engine: chargement des automatisations échoué', automationsError.message)
      return
    }
    if (!automations || automations.length === 0) return

    const payload = (event.payload && typeof event.payload === 'object' ? event.payload : {}) as Record<string, unknown>

    for (const automation of automations) {
      const startedAt = Date.now()
      const conditions = (automation.trigger_conditions as Record<string, unknown> | null)?.conditions

      if (!evaluateConditions(conditions, payload)) {
        // Conditions non remplies : l'événement ne déclenche pas cette automatisation.
        continue
      }

      const configObj = (automation.action_config && typeof automation.action_config === 'object')
        ? automation.action_config as Record<string, unknown>
        : {}
      const rawActions = Array.isArray(configObj.actions) ? (configObj.actions as AutomationAction[]) : []

      const actionResults: Record<string, unknown>[] = []
      for (const action of rawActions) {
        if (action && action.isActive === false) continue
        try {
          actionResults.push(await executeAction(action, event))
        } catch (e) {
          actionResults.push({
            action: String((action as AutomationAction | undefined)?.type ?? 'unknown'),
            status: 'failed',
            error: e instanceof Error ? e.message : 'Erreur inattendue'
          })
        }
      }

      const failedActions = actionResults.filter((r) => r.status === 'failed')
      const skippedActions = actionResults.filter((r) => r.status === 'skipped')
      const status = actionResults.length === 0
        ? 'skipped'
        : failedActions.length > 0 ? 'failed' : 'success'

      await supabase.from('automation_executions').insert({
        automation_id: automation.id,
        event_id: event.id,
        status,
        started_at: new Date(startedAt).toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
        error_message: failedActions.length > 0
          ? failedActions.map((f) => String(f.error ?? 'Échec')).join(' | ')
          : null,
        output: {
          conditionsMatched: true,
          actions: actionResults,
          actionsExecuted: actionResults.length - skippedActions.length,
          actionsSkipped: skippedActions.length
        }
      } as Record<string, unknown>)
    }
  } catch (error) {
    console.warn('⚠️ automation engine: erreur inattendue', error)
  }
}
