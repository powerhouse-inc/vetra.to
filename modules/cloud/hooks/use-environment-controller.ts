'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRenown } from '@powerhousedao/reactor-browser'
import type { VetraCloudEnvironmentState } from '@powerhousedao/vetra-cloud-package/document-models/vetra-cloud-environment'
import { createEnvironmentController, type EnvironmentController } from '../controller'

export type UseEnvironmentControllerResult = {
  controller: EnvironmentController | null
  state: VetraCloudEnvironmentState | null
  isLoading: boolean
  error: Error | null
  push: () => Promise<void>
}

export function useEnvironmentController(documentId?: string): UseEnvironmentControllerResult {
  const renown = useRenown()
  const controllerRef = useRef<EnvironmentController | null>(null)
  const [state, setState] = useState<VetraCloudEnvironmentState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const signer = renown?.signer

  useEffect(() => {
    if (!signer) return

    let cancelled = false
    let unsubscribe: (() => void) | undefined

    async function init() {
      try {
        setIsLoading(true)
        setError(null)
        const ctrl = await createEnvironmentController({ documentId, signer })
        if (cancelled) return

        controllerRef.current = ctrl
        setState(ctrl.state.global)

        unsubscribe = ctrl.onChange(() => {
          setState(ctrl.state.global)
        })

        setIsLoading(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err : new Error('Failed to load environment'))
        setIsLoading(false)
      }
    }

    init()

    return () => {
      cancelled = true
      unsubscribe?.()
      controllerRef.current = null
    }
  }, [documentId, signer])

  const push = useCallback(async () => {
    const ctrl = controllerRef.current
    if (!ctrl) throw new Error('Controller not initialized')
    await ctrl.push()
  }, [])

  return {
    controller: controllerRef.current,
    state,
    isLoading,
    error,
    push,
  }
}
