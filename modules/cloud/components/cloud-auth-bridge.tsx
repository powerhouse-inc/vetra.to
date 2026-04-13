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

    // NOTE: we intentionally do NOT pass `aud` here. The server's
    // `verifyAuthBearerToken` doesn't configure an expected audience, and
    // did-jwt rejects tokens that carry an `aud` claim without matching
    // audience config ("JWT audience is required but your app address has
    // not been configured"). Omitting `aud` keeps the token valid.
    setAuthTokenProvider(async () => {
      try {
        const token = await renown.getBearerToken({ expiresIn: 600 })
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
