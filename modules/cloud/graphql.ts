import type {
  CloudEnvironment,
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
// Auth helper — mint a Renown bearer token.
//
// IMPORTANT: do NOT pass `aud`. The switchboard's verifyAuthBearerToken does
// not configure an expected audience, and did-jwt then rejects any token that
// carries an `aud` claim with "JWT audience is required but your app address
// has not been configured". Keeping aud unset keeps the token valid.
// This mirrors cloud-auth-bridge.tsx (fix de289d6).
// ---------------------------------------------------------------------------

type Renown = {
  getBearerToken: (opts: { expiresIn: number }) => Promise<string>
}

export async function getAuthToken(renown: Renown | null | undefined): Promise<string | null> {
  if (!renown) return null
  try {
    return await renown.getBearerToken({ expiresIn: 600 })
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Generic GraphQL helper
// ---------------------------------------------------------------------------

type GqlResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

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

  // Surface auth/transport failures as proper errors. Without this the
  // response body is blank-ish for 401/403, `json.data` ends up undefined,
  // and callers crash later with "Cannot read properties of undefined".
  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as GqlResponse<T>

  if (json.errors?.length) {
    throw new Error(json.errors[0].message ?? 'GraphQL error')
  }

  return json.data as T
}

// ---------------------------------------------------------------------------
// Shared fragments (inlined as strings)
// ---------------------------------------------------------------------------

const SERVICE_FIELDS = `type prefix enabled url status version`
const PACKAGE_FIELDS = `registry name version`
const CUSTOM_DOMAIN_FIELDS = `enabled domain dnsRecords { type host value }`
const STATE_FIELDS = `owner label genericSubdomain genericBaseDomain customDomain { ${CUSTOM_DOMAIN_FIELDS} } defaultPackageRegistry status services { ${SERVICE_FIELDS} } packages { ${PACKAGE_FIELDS} }`
const DOCUMENT_FIELDS = `id documentType createdAtUtcIso lastModifiedAtUtcIso revisionsList { scope revision } state { global { ${STATE_FIELDS} } }`
const LIST_ITEM_FIELDS = `id state { global { ${STATE_FIELDS} } }`

// ---------------------------------------------------------------------------
// Namespaced response type helper
// ---------------------------------------------------------------------------

type Namespaced<T> = { VetraCloudEnvironment: T }

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
  const data = await gql<
    Namespaced<{
      findDocuments: {
        items: RawListItem[]
      }
    }>
  >(
    `query ($search: VetraCloudEnvironment_SearchFilterInput!) {
      VetraCloudEnvironment {
        findDocuments(search: $search) {
          items { ${LIST_ITEM_FIELDS} }
        }
      }
    }`,
    { search: { parentId: getDriveId() } },
    token,
  )

  return data.VetraCloudEnvironment.findDocuments.items.map(mapListItem)
}

export async function fetchEnvironment(
  id: string,
  token?: string | null,
): Promise<CloudEnvironment | null> {
  const data = await gql<
    Namespaced<{
      document: {
        document: RawDocument
      } | null
    }>
  >(
    `query ($id: String!) {
      VetraCloudEnvironment {
        document(identifier: $id) {
          document { ${DOCUMENT_FIELDS} }
        }
      }
    }`,
    { id },
    token,
  )

  const raw = data.VetraCloudEnvironment.document?.document
  return raw ? mapDocument(raw) : null
}

// ---------------------------------------------------------------------------
// Per-user environment listing (vetra-cloud-observability subgraph)
// ---------------------------------------------------------------------------

export type ListScope = 'MINE' | 'ALL'

export type EnvironmentSummary = {
  id: string
  name: string | null
  subdomain: string | null
  tenantId: string | null
  customDomain: string | null
  status: string | null
  owner: string | null
  /** @deprecated Prefer `owner`. Kept for transitional compatibility. */
  createdBy: string | null
}

export type Viewer = {
  address: string | null
  isAdmin: boolean
}

/**
 * Fetch environments scoped to the calling user.
 * - Without a token: returns an empty list (server-side enforced).
 * - scope=MINE (default): returns only envs the caller created.
 * - scope=ALL: requires admin status on switchboard; returns all envs.
 */
export async function fetchMyEnvironments(
  scope: ListScope = 'MINE',
  token?: string | null,
): Promise<EnvironmentSummary[]> {
  const data = await gql<{ myEnvironments: EnvironmentSummary[] }>(
    `query ($scope: ListScope!) {
      myEnvironments(scope: $scope) {
        id
        name
        subdomain
        tenantId
        customDomain
        status
        owner
        createdBy
      }
    }`,
    { scope },
    token,
  )
  return data.myEnvironments
}

/**
 * Fetch the caller's identity/admin status. Used by the UI to conditionally
 * show the "Mine | All" toggle.
 */
export async function fetchViewer(token?: string | null): Promise<Viewer> {
  const data = await gql<{ viewer: Viewer }>(`query { viewer { address isAdmin } }`, {}, token)
  return data.viewer
}

// ---------------------------------------------------------------------------
// Observability queries (same central Switchboard endpoint)
// ---------------------------------------------------------------------------

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

  const res = await fetch(getEndpoint(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as GqlResponse<T>

  if (json.errors?.length) {
    throw new Error(json.errors[0].message ?? 'GraphQL error')
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
