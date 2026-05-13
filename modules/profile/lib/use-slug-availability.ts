import { useEffect, useState } from 'react'
import { fetchBuilderTeamBySlug } from './create-team-queries'
import { isValidSlug } from './validations'

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

export function useSlugAvailability(slug: string, enabled: boolean): SlugStatus {
  const [status, setStatus] = useState<SlugStatus>('idle')

  useEffect(() => {
    if (!enabled || !isValidSlug(slug)) {
      setStatus('idle')
      return
    }
    setStatus('checking')
    let cancelled = false
    const t = setTimeout(() => {
      fetchBuilderTeamBySlug(slug)
        .then((team) => {
          if (cancelled) return
          setStatus(team ? 'taken' : 'available')
        })
        .catch(() => {
          if (cancelled) return
          setStatus('error')
        })
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [slug, enabled])

  return status
}
