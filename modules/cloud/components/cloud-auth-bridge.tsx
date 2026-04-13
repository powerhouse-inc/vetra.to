'use client'

import { useEffect } from 'react'
import { useRenown } from '@powerhousedao/reactor-browser'
import { setAuthTokenProvider } from '../client'

/**
 * Registers a bearer-token provider with the reactor client so every cloud
 * GraphQL request carries the current user's Renown identity.
 *
 * Mount this once, near the top of the tree (after `<RenownProvider />`).
 * It has no rendered output.
 */
export function CloudAuthBridge() {
  const renown = useRenown()

  useEffect(() => {
    if (!renown) {
      setAuthTokenProvider(null)
      return
    }

    const endpoint =
      (typeof window !== 'undefined' &&
        (window as unknown as { __ENV?: Record<string, string> }).__ENV?.[
          'NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL'
        ]) ||
      process.env.NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL ||
      process.env.NEXT_PUBLIC_SWITCHBOARD_URL ||
      'https://switchboard.vetra.io/graphql'

    setAuthTokenProvider(async () => {
      try {
        const token = await renown.getBearerToken({
          expiresIn: 600,
          aud: endpoint,
        })
        return token ?? null
      } catch {
        return null
      }
    })

    return () => {
      setAuthTokenProvider(null)
    }
  }, [renown])

  return null
}
