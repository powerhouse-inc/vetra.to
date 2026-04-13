'use client'

import type { ISigner } from 'document-model'
import { useRenown, useRenownAuth } from '@powerhousedao/reactor-browser'

export type CanSignResult = {
  canSign: boolean
  signer: ISigner | null
  loading: boolean
}

/**
 * Returns the user's Renown signer when available.
 * Use to gate mutation UI: a missing or loading signer means the user can't
 * sign actions yet (not logged in, or auth still resolving).
 */
export function useCanSign(): CanSignResult {
  const renown = useRenown()
  const auth = useRenownAuth()
  const loading = auth.status === 'loading' || auth.status === 'checking'
  const signer = (renown?.signer as ISigner | null | undefined) ?? null
  return {
    canSign: !!signer && !loading,
    signer,
    loading,
  }
}
