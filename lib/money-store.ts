/**
 * Formateur monétaire central SANS hook React — utilisable partout :
 * composants clients, services, exports CSV/PDF.
 *
 * La devise/locale active est synchronisée par `UserPreferencesContext`
 * (setActiveMoney) à chaque changement de préférence. Toutes les définitions
 * locales `new Intl.NumberFormat(..., { currency: 'XOF' })` de l'app sont
 * remplacées par `formatMoneyAuto`, donc un changement de devise du vendeur
 * s'applique immédiatement dans TOUTE l'application, sans re-render coûteux
 * (cache global d'instances Intl → coût quasi nul par appel).
 */

export type MoneyFormatOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
}

let activeCurrency = 'XOF'
let activeLocale = 'fr-FR'

const formatterCache = new Map<string, Intl.NumberFormat>()

export function setActiveMoney(currencyCode: string, locale: string): void {
  activeCurrency = currencyCode || 'XOF'
  activeLocale = locale || 'fr-FR'
}

export function getActiveMoneyCurrency(): string {
  return activeCurrency
}

function getCachedFormatter(
  locale: string,
  currency: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number
): Intl.NumberFormat | null {
  const key = `${locale}:${currency}:${minimumFractionDigits}:${maximumFractionDigits}`
  let f = formatterCache.get(key)
  if (!f) {
    try {
      f = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits
      })
      formatterCache.set(key, f)
    } catch {
      return null
    }
  }
  return f
}

/**
 * Remplace les anciens `new Intl.NumberFormat('fr-FR', { style: 'currency',
 * currency: 'XOF', ... }).format(amount)` — même usage `(amount) => string`,
 * mais respecte la devise choisie par l'utilisateur.
 */
export function formatMoneyAuto(amount: unknown, options?: MoneyFormatOptions): string {
  const n = typeof amount === 'number' ? amount : Number(amount ?? 0)
  const safe = Number.isFinite(n) ? n : 0
  const isXof = activeCurrency === 'XOF'
  const min = options?.minimumFractionDigits ?? (isXof ? 0 : 2)
  const max = options?.maximumFractionDigits ?? (isXof ? 0 : 2)
  const f = getCachedFormatter(activeLocale, activeCurrency, min, max)
  if (f) {
    try {
      return f.format(safe)
    } catch {
      // fallback ci-dessous
    }
  }
  return `${safe.toLocaleString(activeLocale)} ${activeCurrency}`
}

/** Formate avec une devise explicite (hors préférence — exports, factures). */
export function formatMoneyWith(
  amount: unknown,
  currencyCode: string,
  locale: string,
  options?: MoneyFormatOptions
): string {
  const n = typeof amount === 'number' ? amount : Number(amount ?? 0)
  const safe = Number.isFinite(n) ? n : 0
  const isXof = currencyCode === 'XOF'
  const min = options?.minimumFractionDigits ?? (isXof ? 0 : 2)
  const max = options?.maximumFractionDigits ?? (isXof ? 0 : 2)
  const f = getCachedFormatter(locale, currencyCode, min, max)
  if (f) {
    try {
      return f.format(safe)
    } catch {
      // fallback ci-dessous
    }
  }
  return `${safe.toLocaleString(locale)} ${currencyCode}`
}
