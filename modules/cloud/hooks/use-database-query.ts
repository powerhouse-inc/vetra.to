'use client'

import { useRenown } from '@powerhousedao/reactor-browser'
import { useCallback, useRef, useState } from 'react'

import { executeReadOnlyQuery, getAuthToken } from '../graphql'
import type { DatabaseQueryResult } from '../types'

/**
 * Owner-gated read-only SQL execution. State is a simple
 * `{ result | isRunning | error }` triple; `run()` performs the mutation and
 * captures the error message verbatim so the result panel can do the
 * code-to-copy mapping. Follows the renown-ref pattern from
 * `use-environment-dumps.ts`.
 */
export function useDatabaseQuery(tenantId: string | null): {
  result: DatabaseQueryResult | null
  isRunning: boolean
  error: string | null
  run: (sql: string, limit: number) => Promise<void>
} {
  const renown = useRenown()
  const renownRef = useRef(renown)
  renownRef.current = renown

  const [result, setResult] = useState<DatabaseQueryResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(
    async (sql: string, limit: number) => {
      if (!tenantId) {
        setError('No tenant selected.')
        return
      }
      setIsRunning(true)
      setError(null)
      try {
        const token = await getAuthToken(renownRef.current)
        const res = await executeReadOnlyQuery(tenantId, sql, limit, token)
        setResult(res)
      } catch (err) {
        setResult(null)
        setError(err instanceof Error ? err.message : 'Query failed')
      } finally {
        setIsRunning(false)
      }
    },
    [tenantId],
  )

  return { result, isRunning, error, run }
}
