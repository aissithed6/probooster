import * as React from 'react'

import { usePublicGlobalSettings } from '@/contexts/PublicGlobalSettingsContext'

const FALLBACK_MOBILE_BREAKPOINT = 768

/**
 * Extrait le breakpoint "Mobile" depuis les réglages publics (Design & UX -> Responsive).
 * Fallback à 768px si la config n'est pas disponible.
 */
function getMobileBreakpointFromSettings(settings: unknown): number {
  const breakpoints = (settings as any)?.designUx?.responsive?.breakpoints
  if (!Array.isArray(breakpoints)) return FALLBACK_MOBILE_BREAKPOINT

  const mobile = (breakpoints as any[])
    .filter((bp) => bp && typeof bp === 'object')
    .find((bp) => String((bp as any)?.name ?? '').toLowerCase().includes('mobile'))

  const width = Number((mobile as any)?.width)
  return Number.isFinite(width) && width > 0 ? Math.round(width) : FALLBACK_MOBILE_BREAKPOINT
}

/**
 * Détecte si l'écran est en "mode mobile" en utilisant un breakpoint configurable
 * provenant des réglages Super Admin (via /api/public/global-settings).
 */
export function useIsMobile() {
  const { data } = usePublicGlobalSettings()
  const mobileBreakpoint = React.useMemo(() => getMobileBreakpointFromSettings(data), [data])

  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < mobileBreakpoint)
    return () => mql.removeEventListener('change', onChange)
  }, [mobileBreakpoint])

  return !!isMobile
}
