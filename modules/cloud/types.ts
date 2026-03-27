export type CloudEnvironmentServiceType = 'CONNECT' | 'SWITCHBOARD' | 'FUSION'

export type ServiceStatus = 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'BILLING_ISSUE'

export type CloudEnvironmentService = {
  type: CloudEnvironmentServiceType
  prefix: string
  enabled: boolean
  url: string | null
  status: ServiceStatus
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
  label: string | null
  genericSubdomain: string | null
  genericBaseDomain: string | null
  customDomain: CloudCustomDomain
  defaultPackageRegistry: string | null
  services: CloudEnvironmentService[]
  packages: CloudPackage[]
  status: CloudEnvironmentStatus
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
