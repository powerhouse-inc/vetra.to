'use client'

import { useCallback } from 'react'
import { createNewEnvironmentController } from '../controller'
import { useCanSign } from './use-can-sign'

export type CreateEnvironmentInput = {
  label: string
  subdomain: string
  baseDomain: string
  defaultPackageRegistry?: string | null
  enabledServices: Array<{ type: 'CONNECT' | 'SWITCHBOARD' | 'FUSION'; prefix: string }>
}

export type CreateEnvironmentResult = { documentId: string }

/**
 * Returns a function that creates a new environment document and dispatches
 * the initial actions (setLabel, initialize, enableService) in a single
 * signed batch via `RemoteDocumentController`. Resolves with the new doc id.
 */
export function useCreateEnvironment() {
  const { signer } = useCanSign()
  return useCallback(
    async (input: CreateEnvironmentInput): Promise<CreateEnvironmentResult> => {
      if (!signer) {
        throw new Error('You must be logged in with Renown to create an environment')
      }
      const controller = createNewEnvironmentController({ signer })
      controller.setLabel({ label: input.label })
      controller.initialize({
        genericSubdomain: input.subdomain,
        genericBaseDomain: input.baseDomain,
        defaultPackageRegistry: input.defaultPackageRegistry ?? undefined,
      })
      for (const svc of input.enabledServices) {
        controller.enableService({ type: svc.type, prefix: svc.prefix })
      }
      const result = await controller.push()
      return { documentId: result.remoteDocument.id }
    },
    [signer],
  )
}
