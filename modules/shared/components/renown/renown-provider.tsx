'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect, useRef } from 'react'

const Renown = dynamic(() => import('@powerhousedao/reactor-browser').then((mod) => mod.Renown), {
  ssr: false,
})

/**
 * Captures the `?user` DID from the URL at module load time, before the
 * Renown SDK can consume and remove it. This allows us to retry the login
 * if the SDK's initial attempt fails or the React UI doesn't reflect it.
 */
function captureUserDid(): string | undefined {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const user = params.get('user')
  return user ? decodeURIComponent(user) : undefined
}

const capturedUserDid = captureUserDid()

/**
 * After the Renown SDK initializes, checks if the session was established.
 * If not (e.g. due to a race condition between credential indexing and the
 * SDK's login attempt), retries the login using the captured DID.
 */
function RenownLoginGuard() {
  const didRef = useRef(capturedUserDid)

  useEffect(() => {
    const userDid = didRef.current
    if (!userDid) return

    didRef.current = undefined
    let cancelled = false

    const attempt = async () => {
      const maxWaitMs = 15_000
      const pollMs = 500
      const start = Date.now()

      while (Date.now() - start < maxWaitMs) {
        if (cancelled) return

        const renown = (window as Window).ph?.renown
        if (renown && renown.status === 'authorized') return

        if (renown && typeof renown.login === 'function') {
          try {
            await renown.login(userDid)
            return
          } catch {
            // credential may not be indexed yet — retry
          }
        }

        await new Promise((r) => setTimeout(r, pollMs))
      }
    }

    // Give the SDK a moment to handle it first
    const timeout = setTimeout(attempt, 1500)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  return null
}

export function RenownProvider({ appName, url }: { appName: string; url?: string }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <Renown appName={appName} url={url} />
      <RenownLoginGuard />
    </>
  )
}
