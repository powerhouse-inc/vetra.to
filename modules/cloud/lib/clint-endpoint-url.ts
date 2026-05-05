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
  // The pull-worker stores endpoint.id as the proxy path prefix
  // (e.g. "/switchboard/graphql"), so it already starts with "/".
  // Use it verbatim — joining with "/" would produce "//".
  const id = endpoint.id.startsWith('/') ? endpoint.id : `/${endpoint.id}`
  if (serviceUrl) {
    return `${serviceUrl.replace(/\/$/, '')}${id}`
  }
  const sub = genericSubdomain ?? '<subdomain>'
  const base = genericBaseDomain ?? 'vetra.io'
  return `https://${prefix}.${sub}.${base}${id}`
}
