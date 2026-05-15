'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Wraps an async function with `isPending` + `error` state so callers don't
 * have to hand-roll `useState<boolean>` + `try/catch` around every mutation.
 *
 * `run` returns the resolved value (so chaining "close modal on success" is
 * a one-liner) and re-throws on error so the caller can still catch / toast.
 * `isPending` flips back to `false` in both success and error paths.
 *
 * Safe under React 18 strict mode: the unmount guard prevents
 * state updates after the component is gone.
 */
export function useAsyncAction<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
): {
  run: (...args: Args) => Promise<R>
  isPending: boolean
  error: Error | null
} {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fnRef = useRef(fn)
  // eslint-disable-next-line react-hooks/refs
  fnRef.current = fn

  const run = useCallback(async (...args: Args) => {
    if (mountedRef.current) {
      setIsPending(true)
      setError(null)
    }
    try {
      const result = await fnRef.current(...args)
      if (mountedRef.current) setIsPending(false)
      return result
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      if (mountedRef.current) {
        setError(e)
        setIsPending(false)
      }
      throw e
    }
  }, [])

  return { run, isPending, error }
}
