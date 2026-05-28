import { useEffect, useState } from 'react'

/**
 * Hook utilitaire pour écouter une media query CSS et retourner si elle match.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(query)

    const onChange = () => {
      setMatches(Boolean(mql.matches))
    }

    onChange()
    mql.addEventListener('change', onChange)

    return () => {
      mql.removeEventListener('change', onChange)
    }
  }, [query])

  return matches
}
