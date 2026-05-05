import { useCallback, useEffect, useState } from 'react'

/**
 * Optimistic state wrapper for async commits.
 *
 * Given a server-confirmed `serverValue` and an async `commit` function, the
 * returned `value` reflects the user's intent immediately on `set(next)` and
 * falls back to `serverValue` once the server has caught up — or on error,
 * in which case the override is dropped and the error is re-thrown so the
 * caller can toast.
 *
 * Use for toggles (Switch, Checkbox) where the network round-trip would
 * otherwise leave the UI feeling unresponsive.
 *
 * Example:
 *   const { value: enabled, set } = useOptimistic(serverEnabled, onToggle)
 *   try { await set(true); toast.success('on') }
 *   catch (err) { toast.error(err.message) }
 *   <Switch checked={enabled} onCheckedChange={set} />
 */
export function useOptimistic<T>(
  serverValue: T,
  commit: (next: T) => Promise<void>,
): {
  value: T
  set: (next: T) => Promise<void>
  isPending: boolean
} {
  const [pending, setPending] = useState<{ value: T } | null>(null)
  const value = pending !== null ? pending.value : serverValue

  // Once the server catches up to the optimistic value, drop the override so
  // future changes follow the server-truth path again.
  useEffect(() => {
    if (pending !== null && Object.is(pending.value, serverValue)) {
      setPending(null)
    }
  }, [pending, serverValue])

  const set = useCallback(
    async (next: T) => {
      setPending({ value: next })
      try {
        await commit(next)
      } catch (err) {
        setPending(null) // revert
        throw err
      }
    },
    [commit],
  )

  return { value, set, isPending: pending !== null }
}
