export type CloudEnvironmentService = 'CONNECT' | 'SWITCHBOARD'
export type CloudEnvironmentStatus = 'STARTED' | 'STOPPED' | 'DEPLOYING'

export type CloudPackage = {
  name: string
  version: string | null
}

export type CloudEnvironmentState = {
  name: string | null
  subdomain: string | null
  customDomain: string | null
  services: CloudEnvironmentService[]
  packages: CloudPackage[] | null
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
