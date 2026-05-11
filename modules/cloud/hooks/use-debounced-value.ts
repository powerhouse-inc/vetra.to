'use client'

import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has remained stable for `delayMs` milliseconds.
 * Used to smooth subscription resyncs that briefly oscillate before
 * settling — anything that flips back within the window collapses to one
 * visible transition.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (Object.is(debounced, value)) return
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs, debounced])

  return debounced
}
