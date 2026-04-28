import type { ClintEndpoint } from '@/modules/cloud/types'

export type ComposeClintEndpointUrlInput = {
  serviceUrl: string | null
  prefix: string
  genericSubdomain: string | null
  genericBaseDomain: string | null
  endpoint: Pick<ClintEndpoint, 'id'>
}

export function composeClintEndpointUrl(input: ComposeClintEndpointUrlInput): string {
  const { serviceUrl, prefix, genericSubdomain, genericBaseDomain, endpoint } = input
  if (serviceUrl) {
    return `${serviceUrl.replace(/\/$/, '')}/${endpoint.id}`
  }
  const sub = genericSubdomain ?? '<subdomain>'
  const base = genericBaseDomain ?? 'vetra.io'
  return `https://${prefix}.${sub}.${base}/${endpoint.id}`
}
