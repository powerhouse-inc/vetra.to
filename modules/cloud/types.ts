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
