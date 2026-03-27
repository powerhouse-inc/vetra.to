import type {
  CloudEnvironment,
  CloudEnvironmentServiceType,
  EnvironmentStatus,
  Pod,
  KubeEvent,
  MetricSeries,
  LogEntry,
  MetricRange,
  TenantService,
} from './types'

// Read env vars from window.__ENV (injected at runtime by the server layout)
// with fallback to process.env (inlined at build time by Next.js).
function env(key: string): string {
  if (typeof window !== 'undefined') {
    const windowEnv = (window as unknown as { __ENV?: Record<string, string> }).__ENV
    if (windowEnv?.[key]) return windowEnv[key]
  }
  return process.env[key] ?? ''
}

function getEndpoint() {
  return (
    env('NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL') ||
    env('NEXT_PUBLIC_SWITCHBOARD_URL') ||
    'https://switchboard.vetra.io/graphql'
  )
}

function getDriveId() {
  return env('NEXT_PUBLIC_CLOUD_DRIVE_ID') || 'powerhouse'
}

// ---------------------------------------------------------------------------
// Auth helper — call renown.getBearerToken() with the switchboard URL as aud
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Renown = { getBearerToken: (opts: { expiresIn: number; aud: string }) => Promise<string> }

export async function getAuthToken(renown: Renown | null | undefined): Promise<string | null> {
  if (!renown) return null
  try {
    return await renown.getBearerToken({ expiresIn: 600, aud: getEndpoint() })
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Generic GraphQL helper
// ---------------------------------------------------------------------------

async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(getEndpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json()

  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }

  return json.data as T
}

// ---------------------------------------------------------------------------
// Shared fragments (inlined as strings)
// ---------------------------------------------------------------------------

const SERVICE_FIELDS = `type prefix enabled url status`
const PACKAGE_FIELDS = `registry name version`
const CUSTOM_DOMAIN_FIELDS = `enabled domain dnsRecords { type host value }`
const STATE_FIELDS = `label genericSubdomain genericBaseDomain customDomain { ${CUSTOM_DOMAIN_FIELDS} } defaultPackageRegistry status services { ${SERVICE_FIELDS} } packages { ${PACKAGE_FIELDS} }`
const DOCUMENT_FIELDS = `id documentType createdAtUtcIso lastModifiedAtUtcIso revisionsList { scope revision } state { global { ${STATE_FIELDS} } }`
const LIST_ITEM_FIELDS = `id state { global { ${STATE_FIELDS} } }`

// ---------------------------------------------------------------------------
// Response mapper
// ---------------------------------------------------------------------------

type RawDocument = {
  id: string
  documentType: string
  createdAtUtcIso: string
  lastModifiedAtUtcIso: string
  revisionsList: Array<{ scope: string; revision: number }>
  state: { global: CloudEnvironment['state'] }
}

type RawListItem = {
  id: string
  state: { global: CloudEnvironment['state'] }
}

function mapDocument(raw: RawDocument): CloudEnvironment {
  return {
    id: raw.id,
    name: raw.state.global.label ?? raw.id,
    documentType: raw.documentType,
    createdAtUtcIso: raw.createdAtUtcIso,
    lastModifiedAtUtcIso: raw.lastModifiedAtUtcIso,
    revision: raw.revisionsList.find((r) => r.scope === 'global')?.revision ?? 0,
    state: raw.state.global,
  }
}

function mapListItem(raw: RawListItem): CloudEnvironment {
  return {
    id: raw.id,
    name: raw.state.global.label ?? raw.id,
    documentType: 'powerhouse/vetra-cloud-environment',
    createdAtUtcIso: '',
    lastModifiedAtUtcIso: '',
    revision: 0,
    state: raw.state.global,
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function fetchEnvironments(token?: string | null): Promise<CloudEnvironment[]> {
  const data = await gql<{
    VetraCloudEnvironment_findDocuments: {
      items: RawListItem[]
    }
  }>(
    `query ($search: VetraCloudEnvironment_SearchFilterInput!) {
      VetraCloudEnvironment_findDocuments(search: $search) {
        items { ${LIST_ITEM_FIELDS} }
      }
    }`,
    { search: { parentId: getDriveId() } },
    token,
  )

  return data.VetraCloudEnvironment_findDocuments.items.map(mapListItem)
}

export async function fetchEnvironment(
  id: string,
  token?: string | null,
): Promise<CloudEnvironment | null> {
  const data = await gql<{
    VetraCloudEnvironment_document: {
      document: RawDocument
    } | null
  }>(
    `query ($id: String!) {
      VetraCloudEnvironment_document(identifier: $id) {
        document { ${DOCUMENT_FIELDS} }
      }
    }`,
    { id },
    token,
  )

  const raw = data.VetraCloudEnvironment_document?.document
  return raw ? mapDocument(raw) : null
}

// ---------------------------------------------------------------------------
// Mutations — Data Management
// ---------------------------------------------------------------------------

export async function createEnvironment(
  name: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_createDocument: RawDocument
  }>(
    `mutation ($name: String!, $parentIdentifier: String) {
      VetraCloudEnvironment_createDocument(name: $name, parentIdentifier: $parentIdentifier) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { name, parentIdentifier: getDriveId() },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_createDocument)
}

export async function setLabel(
  docId: string,
  label: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_setLabel: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_SetLabelInput!) {
      VetraCloudEnvironment_setLabel(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { label } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_setLabel)
}

export async function setGenericSubdomain(
  docId: string,
  genericSubdomain: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_setGenericSubdomain: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_SetGenericSubdomainInput!) {
      VetraCloudEnvironment_setGenericSubdomain(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { genericSubdomain } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_setGenericSubdomain)
}

export async function setCustomDomain(
  docId: string,
  enabled: boolean,
  domain?: string | null,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_setCustomDomain: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_SetCustomDomainInput!) {
      VetraCloudEnvironment_setCustomDomain(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { enabled, domain: domain ?? null } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_setCustomDomain)
}

// ---------------------------------------------------------------------------
// Mutations — Services
// ---------------------------------------------------------------------------

export async function enableService(
  docId: string,
  type: CloudEnvironmentServiceType,
  prefix: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_enableService: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_EnableServiceInput!) {
      VetraCloudEnvironment_enableService(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { type, prefix } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_enableService)
}

export async function disableService(
  docId: string,
  type: CloudEnvironmentServiceType,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_disableService: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_DisableServiceInput!) {
      VetraCloudEnvironment_disableService(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { type } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_disableService)
}

export async function toggleService(
  docId: string,
  type: CloudEnvironmentServiceType,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_toggleService: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_ToggleServiceInput!) {
      VetraCloudEnvironment_toggleService(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { type } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_toggleService)
}

// ---------------------------------------------------------------------------
// Mutations — Packages
// ---------------------------------------------------------------------------

export async function addPackage(
  docId: string,
  packageName: string,
  version?: string,
  registry?: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_addPackage: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_AddPackageInput!) {
      VetraCloudEnvironment_addPackage(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { packageName, version: version || null, registry: registry || null } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_addPackage)
}

export async function removePackage(
  docId: string,
  packageName: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_removePackage: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_RemovePackageInput!) {
      VetraCloudEnvironment_removePackage(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: { packageName } },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_removePackage)
}

// ---------------------------------------------------------------------------
// Mutations — Status Transitions
// ---------------------------------------------------------------------------

export async function initializeEnvironment(
  docId: string,
  genericSubdomain: string,
  genericBaseDomain: string,
  defaultPackageRegistry?: string | null,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_initialize: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_InitializeInput!) {
      VetraCloudEnvironment_initialize(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    {
      docId,
      input: {
        genericSubdomain,
        genericBaseDomain,
        defaultPackageRegistry: defaultPackageRegistry || null,
      },
    },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_initialize)
}

export async function approveChanges(
  docId: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_approveChanges: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_ApproveChangesInput!) {
      VetraCloudEnvironment_approveChanges(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: {} },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_approveChanges)
}

export async function terminateEnvironment(
  docId: string,
  token?: string | null,
): Promise<CloudEnvironment> {
  const data = await gql<{
    VetraCloudEnvironment_terminateEnvironment: RawDocument
  }>(
    `mutation ($docId: PHID!, $input: VetraCloudEnvironment_TerminateEnvironmentInput!) {
      VetraCloudEnvironment_terminateEnvironment(docId: $docId, input: $input) {
        ${DOCUMENT_FIELDS}
      }
    }`,
    { docId, input: {} },
    token,
  )

  return mapDocument(data.VetraCloudEnvironment_terminateEnvironment)
}

export async function deleteEnvironment(docId: string, token?: string | null): Promise<void> {
  await gql(
    `mutation ($identifier: String!) {
      deleteDocument(identifier: $identifier)
    }`,
    { identifier: docId },
    token,
  )
}

// ---------------------------------------------------------------------------
// Observability endpoint (per-tenant Switchboard)
// ---------------------------------------------------------------------------

function getObservabilityEndpoint(subdomain: string): string {
  return `https://switchboard.${subdomain}.vetra.io/graphql`
}

async function gqlObservability<T>(
  subdomain: string,
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(getObservabilityEndpoint(subdomain), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json()

  if (json.errors?.length) {
    throw new Error(json.errors[0].message)
  }

  return json.data as T
}

// ---------------------------------------------------------------------------
// Observability queries
// ---------------------------------------------------------------------------

export async function fetchEnvironmentStatus(
  subdomain: string,
  tenantId: string,
  token?: string | null,
): Promise<EnvironmentStatus | null> {
  const data = await gqlObservability<{ environmentStatus: EnvironmentStatus | null }>(
    subdomain,
    `query ($tenantId: String!) {
      environmentStatus(tenantId: $tenantId) {
        tenantId argoSyncStatus argoHealthStatus argoLastSyncedAt
        argoMessage configDriftDetected tlsCertValid tlsCertExpiresAt
        domainResolves updatedAt
      }
    }`,
    { tenantId },
    token,
  )
  return data.environmentStatus
}

export async function fetchEnvironmentPods(
  subdomain: string,
  tenantId: string,
  token?: string | null,
): Promise<Pod[]> {
  const data = await gqlObservability<{ environmentPods: Pod[] }>(
    subdomain,
    `query ($tenantId: String!) {
      environmentPods(tenantId: $tenantId) {
        name service phase ready restartCount updatedAt
      }
    }`,
    { tenantId },
    token,
  )
  return data.environmentPods
}

export async function fetchEnvironmentEvents(
  subdomain: string,
  tenantId: string,
  limit?: number,
  token?: string | null,
): Promise<KubeEvent[]> {
  const data = await gqlObservability<{ environmentEvents: KubeEvent[] }>(
    subdomain,
    `query ($tenantId: String!, $limit: Int) {
      environmentEvents(tenantId: $tenantId, limit: $limit) {
        type reason message involvedObject timestamp
      }
    }`,
    { tenantId, limit },
    token,
  )
  return data.environmentEvents
}

export async function fetchMetrics(
  subdomain: string,
  tenantId: string,
  range: MetricRange,
  token?: string | null,
): Promise<{
  cpu: MetricSeries[]
  memory: MetricSeries[]
  requestRate: MetricSeries[]
  latency: MetricSeries[]
}> {
  const data = await gqlObservability<{
    cpuUsage: MetricSeries[]
    memoryUsage: MetricSeries[]
    httpRequestRate: MetricSeries[]
    httpLatency: MetricSeries[]
  }>(
    subdomain,
    `query ($tenantId: String!, $range: MetricRange) {
      cpuUsage(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
      memoryUsage(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
      httpRequestRate(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
      httpLatency(tenantId: $tenantId, range: $range) { label datapoints { timestamp value } }
    }`,
    { tenantId, range },
    token,
  )
  return {
    cpu: data.cpuUsage,
    memory: data.memoryUsage,
    requestRate: data.httpRequestRate,
    latency: data.httpLatency,
  }
}

export async function fetchLogs(
  subdomain: string,
  tenantId: string,
  service: TenantService | null,
  since: MetricRange,
  limit: number,
  errorsOnly: boolean,
  token?: string | null,
): Promise<LogEntry[]> {
  if (errorsOnly) {
    const data = await gqlObservability<{ errorLogs: LogEntry[] }>(
      subdomain,
      `query ($tenantId: String!, $since: MetricRange, $limit: Int) {
        errorLogs(tenantId: $tenantId, since: $since, limit: $limit) {
          timestamp line
        }
      }`,
      { tenantId, since, limit },
      token,
    )
    return data.errorLogs
  }

  const data = await gqlObservability<{ logs: LogEntry[] }>(
    subdomain,
    `query ($tenantId: String!, $service: TenantService, $since: MetricRange, $limit: Int) {
      logs(tenantId: $tenantId, service: $service, since: $since, limit: $limit) {
        timestamp line
      }
    }`,
    { tenantId, service, since, limit },
    token,
  )
  return data.logs
}
