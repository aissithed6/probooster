"use client"

import { useMemo } from "react"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"

type MoneyFormatOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  useGrouping?: boolean
}

/**
 * Hook utilitaire pour formater les montants selon les préférences utilisateur.
 */
export function useMoney() {
  const { systemPrefs } = useUserPreferences()

  /**
   * Déduit une locale compatible Intl à partir de la langue utilisateur.
   */
  const locale = useMemo(() => {
    const lang = systemPrefs.language
    if (lang === "en") return "en-US"
    if (lang === "es") return "es-ES"
    if (lang === "de") return "de-DE"
    return "fr-FR"
  }, [systemPrefs.language])

  /**
   * Déduit le code ISO de devise à partir de la préférence utilisateur.
   */
  const currencyCode = useMemo(() => {
    const cur = systemPrefs.currency
    if (cur === "eur") return "EUR"
    if (cur === "usd") return "USD"
    if (cur === "gbp") return "GBP"
    return "XOF"
  }, [systemPrefs.currency])

  /**
   * Formate un montant sous forme de devise, en gérant les valeurs non numériques.
   */
  const formatMoney = useMemo(() => {
    return (amount: number, options?: MoneyFormatOptions) => {
      const n = typeof amount === "number" ? amount : Number(amount ?? 0)
      const safe = Number.isFinite(n) ? n : 0

      const isXof = currencyCode === "XOF"
      const minimumFractionDigits = options?.minimumFractionDigits ?? (isXof ? 0 : 2)
      const maximumFractionDigits = options?.maximumFractionDigits ?? (isXof ? 0 : 2)

      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currencyCode,
          minimumFractionDigits,
          maximumFractionDigits,
          useGrouping: options?.useGrouping ?? true
        }).format(safe)
      } catch (e) {
        console.error("[useMoney] Error formatting money:", e)
        return `${safe.toLocaleString(locale)} ${currencyCode}`
      }
    }
  }, [currencyCode, locale])

  return {
    locale,
    currencyCode,
    formatMoney
  }
}
