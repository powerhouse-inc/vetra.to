'use client'
import { addDrive } from '@powerhousedao/reactor-browser'
import { useEffect, useRef, useState } from 'react'
import { userDriveFor } from '@/modules/cloud/drive-context'
import { useCanSign } from '@/modules/cloud/hooks/use-can-sign'
import { createNewBuilderAccountController } from './builder-account-controller'

type State = 'idle' | 'checking' | 'creating' | 'ready' | 'error'

/**
 * Lazily ensures a `user:<eth>` drive exists for the signed-in caller and
 * seeds it with a BuilderAccount document on first run. Idempotent — repeat
 * calls observe the existing drive and short-circuit.
 *
 * The hook is fire-and-forget by design: pages render normally even if
 * bootstrap is still in flight. The returned state lets the caller surface
 * a subtle hint (e.g. "setting up your account…") if they want, but most
 * consumers can ignore it.
 */
export function useEnsureUserDrive(): {
  driveId: string | null
  state: State
  error: Error | null
} {
  const { signer } = useCanSign()
  const ethAddress = signer?.user?.address ?? null
  const driveId = ethAddress ? userDriveFor(ethAddress) : null
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<Error | null>(null)
  // Guard against duplicate bootstrap if React re-renders the hook caller
  // before the effect finishes (StrictMode double-invoke, fast nav, etc.).
  const inflightFor = useRef<string | null>(null)

  useEffect(() => {
    if (!signer || !ethAddress || !driveId) return
    if (inflightFor.current === driveId) return
    inflightFor.current = driveId
    let cancelled = false

    void (async () => {
      try {
        setState('creating')
        // Step 1 — create the drive. If it already exists the reactor
        // returns an "already exists" error; treat that as success below.
        await addDrive({
          global: { name: `User ${ethAddress}` },
          id: driveId,
          slug: ethAddress.toLowerCase(),
        }).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err)
          if (/already exists|duplicate/i.test(message)) return
          throw err
        })

        // Step 2 — seed a BuilderAccount document so resolvers + UI have
        // something to render before the user edits anything. If the
        // doc was seeded by a previous run, the push will rebase onto
        // the existing state; setting slug is idempotent at the reducer.
        const controller = createNewBuilderAccountController({
          parentIdentifier: driveId,
          signer,
        })
        controller.setSlug({ slug: ethAddress.toLowerCase() })
        await controller.push().catch((err: unknown) => {
          // A pre-existing seeded doc on the same drive is fine —
          // the bootstrap is meant to be best-effort. Surfacing
          // every push error would block /profile from rendering.
          console.warn('useEnsureUserDrive: seed push failed (treating as warning):', err)
        })

        if (!cancelled) setState('ready')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setState('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [signer, ethAddress, driveId])

  return { driveId, state, error }
}
