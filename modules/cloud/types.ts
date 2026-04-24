export type CloudEnvironmentServiceType = 'CONNECT' | 'SWITCHBOARD' | 'FUSION'

export type ServiceStatus = 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'BILLING_ISSUE'

export type CloudEnvironmentService = {
  type: CloudEnvironmentServiceType
  prefix: string
  enabled: boolean
  url: string | null
  status: ServiceStatus
  version: string | null
}

export type CloudEnvironmentStatus =
  | 'DRAFT'
  | 'CHANGES_PENDING'
  | 'CHANGES_APPROVED'
  | 'CHANGES_PUSHED'
  | 'DEPLOYING'
  | 'DEPLOYMENt_FAILED'
  | 'READY'
  | 'TERMINATING'
  | 'DESTROYED'
  | 'ARCHIVED'
  | 'STOPPED'

export type DnsRecord = {
  type: string
  host: string
  value: string
}

export type CloudCustomDomain = {
  enabled: boolean
  domain: string | null
  dnsRecords: DnsRecord[]
}

export type CloudPackage = {
  registry: string
  name: string
  version: string | null
}

export type CloudEnvironmentState = {
  /** Lowercased EthereumAddress of the owner; null until claimed via SET_OWNER. */
  owner: string | null
  label: string | null
  genericSubdomain: string | null
  genericBaseDomain: string | null
  customDomain: CloudCustomDomain | null
  defaultPackageRegistry: string | null
  services: CloudEnvironmentService[]
  packages: CloudPackage[]
  status: CloudEnvironmentStatus
  /**
   * Service pinned to the apex of the custom domain — that service's ingress
   * serves `customDomain.domain` directly instead of `<prefix>.<customDomain>`.
   * Populated by the doc model once the `apexService` field is added (rolling
   * update, read-tolerant for now).
   */
  apexService?: CloudEnvironmentServiceType | null
  /**
   * Release channel the environment is subscribed to for auto-updates.
   * When the monorepo publishes a new image on this channel, the observability
   * subgraph dispatches SET_SERVICE_VERSION + APPROVE_CHANGES on this env.
   * null (or undefined on envs created before the field existed) = off.
   */
  autoUpdateChannel?: AutoUpdateChannel | null
}

export type AutoUpdateChannel = 'DEV' | 'STAGING' | 'LATEST'
export type ReleaseTrigger = 'AUTO' | 'MANUAL' | 'ROLLBACK'

export type ReleaseIndexEntry = {
  channel: AutoUpdateChannel
  image: TenantService
  tag: string
  publishedAt: string
  releaseUrl: string | null
}

export type ReleaseHistoryEntry = {
  documentId: string
  tenantId: string | null
  service: TenantService
  fromTag: string | null
  toTag: string
  trigger: ReleaseTrigger
  channel: AutoUpdateChannel | null
  at: string
  releaseUrl: string | null
}

export type CloudEnvironment = {
  id: string
  name: string
  documentType: string
  createdAtUtcIso: string
  lastModifiedAtUtcIso: string
  revision: number
  state: CloudEnvironmentState
}

// Observability types (from vetra-cloud-observability subgraph)

export type ArgoSyncStatus = 'SYNCED' | 'OUT_OF_SYNC' | 'UNKNOWN'
export type ArgoHealthStatus = 'HEALTHY' | 'DEGRADED' | 'PROGRESSING' | 'MISSING' | 'UNKNOWN'
export type PodPhase = 'RUNNING' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN'
export type EventType = 'NORMAL' | 'WARNING'
export type TenantService = 'CONNECT' | 'SWITCHBOARD'
export type MetricRange =
  | 'ONE_MIN'
  | 'FIVE_MIN'
  | 'FIFTEEN_MIN'
  | 'ONE_HOUR'
  | 'SIX_HOURS'
  | 'TWENTY_FOUR_HOURS'

export type EnvironmentStatus = {
  tenantId: string
  argoSyncStatus: ArgoSyncStatus
  argoHealthStatus: ArgoHealthStatus
  argoLastSyncedAt: string | null
  argoMessage: string | null
  configDriftDetected: boolean
  tlsCertValid: boolean | null
  tlsCertExpiresAt: string | null
  domainResolves: boolean | null
  updatedAt: string
}

export type Pod = {
  name: string
  service: TenantService | null
  phase: PodPhase
  ready: boolean
  restartCount: number
  updatedAt: string
}

export type KubeEvent = {
  type: EventType
  reason: string
  message: string
  involvedObject: string
  timestamp: string
}

export type MetricSeries = {
  label: string
  datapoints: Datapoint[]
}

export type Datapoint = {
  timestamp: number
  value: number
}

export type LogEntry = {
  timestamp: number
  line: string
}
