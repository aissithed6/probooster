/**
 * timezone.ts
 * Utilitaires de conversion de dates (format YYYY-MM-DD) en instants UTC,
 * en prenant en compte un fuseau horaire IANA (ex: Africa/Abidjan).
 *
 * Objectif: éviter toute surprise lorsque l'admin et/ou le client est dans un autre fuseau.
 */

export const DEFAULT_MARKET_TIME_ZONE = 'Africa/Abidjan'

/**
 * Retourne un fuseau horaire IANA utilisé comme référence "market".
 *
 * Ordre:
 * - NEXT_PUBLIC_MARKET_TIMEZONE (client + server)
 * - MARKET_TIMEZONE (server)
 * - fallback
 */
export function getMarketTimeZone(fallback: string = DEFAULT_MARKET_TIME_ZONE): string {
  const raw =
    (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_MARKET_TIMEZONE || process.env.MARKET_TIMEZONE)) ||
    fallback

  return isValidIanaTimeZone(raw) ? raw : fallback
}

/**
 * Vérifie si une string correspond à un fuseau horaire IANA supporté par Intl.
 */
export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone || typeof timeZone !== 'string') return false
  try {
    // eslint-disable-next-line no-new
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

/**
 * Formate une Date en YYYY-MM-DD dans un fuseau donné.
 */
export function formatDateToYmdInTimeZone(date: Date, timeZone: string): string {
  const safeTz = isValidIanaTimeZone(timeZone) ? timeZone : DEFAULT_MARKET_TIME_ZONE

  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  // en-CA produit YYYY-MM-DD dans la plupart des moteurs, mais on reste robuste via parts.
  const parts = dtf.formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value ?? ''
  const m = parts.find((p) => p.type === 'month')?.value ?? ''
  const d = parts.find((p) => p.type === 'day')?.value ?? ''

  if (!y || !m || !d) return ''
  return `${y}-${m}-${d}`
}

/**
 * Convertit un ISO (ou une date parseable) en YYYY-MM-DD dans un fuseau donné.
 */
export function isoToYmdInTimeZone(value: string, timeZone: string): string {
  if (!value || typeof value !== 'string') return ''

  // Si c'est déjà YYYY-MM-DD, on le retourne tel quel.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value
  }

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return formatDateToYmdInTimeZone(d, timeZone)
}

/**
 * Convertit YYYY-MM-DD en instant UTC correspondant au début de journée (00:00:00.000) dans le fuseau.
 */
export function ymdToUtcIsoStartOfDay(ymd: string, timeZone: string): string {
  const parts = parseYmd(ymd)
  if (!parts) return ''
  const utc = zonedDateTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0, timeZone)
  return utc.toISOString()
}

/**
 * Convertit YYYY-MM-DD en instant UTC correspondant à la fin de journée (23:59:59.999) dans le fuseau.
 */
export function ymdToUtcIsoEndOfDay(ymd: string, timeZone: string): string {
  const parts = parseYmd(ymd)
  if (!parts) return ''
  const utc = zonedDateTimeToUtc(parts.year, parts.month, parts.day, 23, 59, 59, 999, timeZone)
  return utc.toISOString()
}

/**
 * Ajoute N jours à une date YYYY-MM-DD (logique calendrier) et retourne YYYY-MM-DD.
 *
 * Utile pour calculer des dates de fin (ex: +7 jours) sans dépendre du fuseau local.
 */
export function addDaysToYmd(ymd: string, days: number): string {
  const parts = parseYmd(ymd)
  if (!parts) return ''

  const safeDays = Number.isFinite(days) ? Math.trunc(days) : 0
  const base = Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0)
  const next = new Date(base + safeDays * 24 * 60 * 60 * 1000)

  const y = next.getUTCFullYear()
  const m = String(next.getUTCMonth() + 1).padStart(2, '0')
  const d = String(next.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

type YmdParts = { year: number; month: number; day: number }

function parseYmd(ymd: string): YmdParts | null {
  if (!ymd || typeof ymd !== 'string') return null
  const [y, m, d] = ymd.split('-').map((v) => Number(v))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  if (y < 1970 || m < 1 || m > 12 || d < 1 || d > 31) return null
  return { year: y, month: m, day: d }
}

/**
 * Convertit une date/heure "locale" (dans un fuseau IANA) en Date UTC.
 *
 * Implémentation basée sur Intl + calcul d'offset.
 */
function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number,
  timeZone: string
): Date {
  const safeTz = isValidIanaTimeZone(timeZone) ? timeZone : DEFAULT_MARKET_TIME_ZONE

  // 1) On fait une première estimation: on interprète les composants comme si c'était déjà de l'UTC.
  const guess = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  let utc = guess

  // 2) On corrige via l'offset réel du fuseau à cet instant.
  const offset1 = getTimeZoneOffsetMs(new Date(utc), safeTz)
  utc = guess - offset1

  // 3) Une seconde passe stabilise (utile en cas de DST / transitions).
  const offset2 = getTimeZoneOffsetMs(new Date(utc), safeTz)
  utc = guess - offset2

  return new Date(utc)
}

/**
 * Retourne l'offset (en millisecondes) entre UTC et le fuseau donné pour un instant donné.
 */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const parts = dtf.formatToParts(date)
  const year = Number(parts.find((p) => p.type === 'year')?.value ?? '0')
  const month = Number(parts.find((p) => p.type === 'month')?.value ?? '1')
  const day = Number(parts.find((p) => p.type === 'day')?.value ?? '1')
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  const second = Number(parts.find((p) => p.type === 'second')?.value ?? '0')

  // Interpréter ces "parts" comme un UTC nous donne le timestamp local->UTC.
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second)
  return asUtc - date.getTime()
}
