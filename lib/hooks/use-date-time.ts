"use client"

import { useMemo } from 'react'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'

/**
 * Options de formatage pour les fonctions de date/heure.
 */
export type DateTimeFormatOptions = {
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle']
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle']
  weekday?: Intl.DateTimeFormatOptions['weekday']
  year?: Intl.DateTimeFormatOptions['year']
  month?: Intl.DateTimeFormatOptions['month']
  day?: Intl.DateTimeFormatOptions['day']
  hour?: Intl.DateTimeFormatOptions['hour']
  minute?: Intl.DateTimeFormatOptions['minute']
  second?: Intl.DateTimeFormatOptions['second']
}

/**
 * Hook utilitaire pour formater des dates/heures selon les préférences utilisateur (langue + fuseau horaire).
 */
export function useDateTime() {
  const { systemPrefs } = useUserPreferences()

  /**
   * Déduit une locale compatible Intl à partir de la langue utilisateur.
   */
  const locale = useMemo(() => {
    const lang = systemPrefs.language
    if (lang === 'en') return 'en-US'
    if (lang === 'es') return 'es-ES'
    if (lang === 'de') return 'de-DE'
    return 'fr-FR'
  }, [systemPrefs.language])

  /**
   * Convertit l'enum de timezone stocké en IANA timezone.
   */
  const timeZone = useMemo(() => {
    const tz = systemPrefs.timezone
    if (tz === 'europe_paris') return 'Europe/Paris'
    if (tz === 'america_new_york') return 'America/New_York'
    if (tz === 'asia_tokyo') return 'Asia/Tokyo'
    return 'Africa/Abidjan'
  }, [systemPrefs.timezone])

  /**
   * Garantit un timezone supporté par Intl.DateTimeFormat pour éviter RangeError.
   */
  const safeTimeZone = useMemo(() => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone })
      return timeZone
    } catch {
      return 'UTC'
    }
  }, [timeZone])

  /**
   * Formate une date/heure (ISO string, Date, etc.) selon la locale + fuseau utilisateur.
   */
  const formatDateTime = useMemo(() => {
    return (value?: string | number | Date | null, options?: DateTimeFormatOptions) => {
      if (!value) return ''
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) return ''

      try {
        const fmt = new Intl.DateTimeFormat(locale, {
          timeZone: safeTimeZone,
          dateStyle: options?.dateStyle ?? 'medium',
          timeStyle: options?.timeStyle,
          weekday: options?.weekday,
          year: options?.year,
          month: options?.month,
          day: options?.day,
          hour: options?.hour,
          minute: options?.minute,
          second: options?.second
        })

        return fmt.format(date)
      } catch {
        const fmt = new Intl.DateTimeFormat(locale, {
          timeZone: 'UTC',
          dateStyle: options?.dateStyle ?? 'medium',
          timeStyle: options?.timeStyle,
          weekday: options?.weekday,
          year: options?.year,
          month: options?.month,
          day: options?.day,
          hour: options?.hour,
          minute: options?.minute,
          second: options?.second
        })

        return fmt.format(date)
      }
    }
  }, [locale, safeTimeZone])

  /**
   * Formate uniquement la date.
   */
  const formatDate = useMemo(() => {
    return (value?: string | number | Date | null, options?: Omit<DateTimeFormatOptions, 'timeStyle'>) => {
      return formatDateTime(value, { ...options, dateStyle: options?.dateStyle ?? 'medium', timeStyle: undefined })
    }
  }, [formatDateTime])

  /**
   * Formate uniquement l'heure.
   */
  const formatTime = useMemo(() => {
    return (value?: string | number | Date | null, options?: Omit<DateTimeFormatOptions, 'dateStyle'>) => {
      return formatDateTime(value, {
        ...options,
        dateStyle: undefined,
        timeStyle: options?.timeStyle ?? 'short',
        hour: options?.hour ?? '2-digit',
        minute: options?.minute ?? '2-digit'
      })
    }
  }, [formatDateTime])

  return {
    locale,
    timeZone: safeTimeZone,
    formatDateTime,
    formatDate,
    formatTime
  }
}
