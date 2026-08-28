"use client"

import { useMemo } from "react"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"
import {
  formatMoneyAuto,
  formatMoneyWith,
  type MoneyFormatOptions
} from "@/lib/money-store"

export { formatMoneyAuto, formatMoneyWith }
export type { MoneyFormatOptions }

/**
 * Hook utilitaire pour formater les montants selon les préférences utilisateur.
 * Réagit instantanément au changement de devise (contexte) — coût nul grâce au
 * cache global d'instances Intl partagé avec `formatMoneyAuto` (lib/money-store).
 */
export function useMoney() {
  const { systemPrefs } = useUserPreferences()

  const locale = useMemo(() => {
    const lang = systemPrefs.language
    if (lang === "en") return "en-US"
    if (lang === "es") return "es-ES"
    if (lang === "de") return "de-DE"
    return "fr-FR"
  }, [systemPrefs.language])

  const currencyCode = useMemo(() => {
    const cur = systemPrefs.currency
    if (cur === "eur") return "EUR"
    if (cur === "usd") return "USD"
    if (cur === "gbp") return "GBP"
    return "XOF"
  }, [systemPrefs.currency])

  const formatMoney = useMemo(() => {
    return (amount: number, options?: MoneyFormatOptions) =>
      formatMoneyWith(amount, currencyCode, locale, options)
  }, [currencyCode, locale])

  return {
    locale,
    currencyCode,
    formatMoney
  }
}
