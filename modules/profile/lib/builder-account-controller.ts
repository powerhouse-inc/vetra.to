import type { ISigner } from 'document-model'
import { PHDocumentController } from 'document-model'
import { RemoteDocumentController } from '@powerhousedao/reactor-browser'
import { BuilderAccountV1 as BuilderAccount } from '@powerhousedao/vetra-builder-package/document-models'
import { client } from '@/modules/cloud/client'

/**
 * Action methods the BuilderAccount controller exposes. Phase 1b MVP only
 * needs profile-side ops; spaces / packages / members on accounts come once
 * a UI consumer ships.
 */
export type BuilderAccountActions = {
  setProfileName(i: { name: string }): void
  setSlug(i: { slug: string }): void
  setLogo(i: { logoUrl: string }): void
  setProfileDescription(i: { description?: string | null }): void
  updateSocials(i: { x?: string; github?: string; website?: string }): void
}

export type BuilderAccountControllerInstance = BuilderAccountActions & {
  push(): Promise<{ remoteDocument: { id: string } }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BuilderAccountController = PHDocumentController.forDocumentModel<any, any>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  BuilderAccount as any,
)

/**
 * Load an existing BuilderAccount document for signed pushes.
 *
 * `parentIdentifier` is the user drive (`user:<eth-lowercase>`).
 */
export async function loadBuilderAccountController(options: {
  documentId: string
  parentIdentifier: string
  signer: ISigner
}): Promise<BuilderAccountControllerInstance> {
  const controller = await RemoteDocumentController.pull(BuilderAccountController, {
    client,
    documentId: options.documentId,
    mode: 'batch',
    parentIdentifier: options.parentIdentifier,
    signer: options.signer,
    onConflict: 'rebase',
  })
  return controller as unknown as BuilderAccountControllerInstance
}

/** Create a controller for a brand-new (not-yet-persisted) BuilderAccount document. */
export function createNewBuilderAccountController(options: {
  parentIdentifier: string
  signer: ISigner
}): BuilderAccountControllerInstance {
  const inner = new BuilderAccountController()
  const controller = RemoteDocumentController.from(inner, {
    client,
    mode: 'batch',
    parentIdentifier: options.parentIdentifier,
    signer: options.signer,
  })
  return controller as unknown as BuilderAccountControllerInstance
}
