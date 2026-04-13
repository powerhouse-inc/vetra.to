import type { ISigner } from 'document-model'
import { PHDocumentController } from 'document-model'
import { RemoteDocumentController } from '@powerhousedao/reactor-browser'
import { VetraCloudEnvironment } from '@powerhousedao/vetra-cloud-package/document-models'
import type {
  VetraCloudEnvironmentAction,
  VetraCloudEnvironmentPHState,
} from '@powerhousedao/vetra-cloud-package/document-models/vetra-cloud-environment'
import { client, DRIVE_ID } from './client'

const VetraCloudEnvironmentController = PHDocumentController.forDocumentModel<
  VetraCloudEnvironmentPHState,
  VetraCloudEnvironmentAction
>(VetraCloudEnvironment)

export type EnvironmentController = Awaited<ReturnType<typeof createEnvironmentController>>

export function createEnvironmentController(options?: { documentId?: string; signer?: ISigner }) {
  return RemoteDocumentController.pull(VetraCloudEnvironmentController, {
    client,
    documentId: options?.documentId ?? '',
    mode: 'batch',
    parentIdentifier: DRIVE_ID,
    signer: options?.signer,
  })
}
