import type { ISigner } from 'document-model'
import { PHDocumentController } from 'document-model'
import { RemoteDocumentController } from '@powerhousedao/reactor-browser'
import { VetraCloudEnvironmentV1 as VetraCloudEnvironment } from '@powerhousedao/vetra-cloud-package/document-models'
import type {
  VetraCloudEnvironmentAction,
  VetraCloudEnvironmentPHState,
} from '@powerhousedao/vetra-cloud-package/document-models/vetra-cloud-environment'
import { client, DRIVE_ID } from './client'

/**
 * A controller class bound to our installed document-model version.
 * Built locally (rather than importing the package's prebuilt class) to
 * avoid cross-compile-unit type mismatches.
 */
const VetraCloudEnvironmentController = PHDocumentController.forDocumentModel<
  VetraCloudEnvironmentPHState,
  VetraCloudEnvironmentAction
>(VetraCloudEnvironment)

export type EnvironmentController = Awaited<ReturnType<typeof loadEnvironmentController>>

/** Load an existing environment document and wrap it for signed pushes. */
export function loadEnvironmentController(options: { documentId: string; signer: ISigner }) {
  return RemoteDocumentController.pull(VetraCloudEnvironmentController, {
    client,
    documentId: options.documentId,
    mode: 'batch',
    parentIdentifier: DRIVE_ID,
    signer: options.signer,
    onConflict: 'rebase',
  })
}

/** Create a controller for a new (not-yet-persisted) environment document. */
export function createNewEnvironmentController(options: { signer: ISigner }) {
  const inner = new VetraCloudEnvironmentController()
  return RemoteDocumentController.from(inner, {
    client,
    mode: 'batch',
    parentIdentifier: DRIVE_ID,
    signer: options.signer,
  })
}
