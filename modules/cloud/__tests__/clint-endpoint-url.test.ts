import { describe, expect, it } from 'vitest'
import { composeClintEndpointUrl } from '@/modules/cloud/lib/clint-endpoint-url'

describe('composeClintEndpointUrl', () => {
  const endpoint = { id: 'agent-graphql', type: 'api-graphql' as const, port: '12345' }

  it('uses service.url when provided', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: 'https://rupert.demo.vetra.io',
      prefix: 'rupert',
      genericSubdomain: 'demo',
      genericBaseDomain: 'vetra.io',
      endpoint,
    })
    expect(url).toBe('https://rupert.demo.vetra.io/agent-graphql')
  })

  it('strips trailing slash from service.url', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: 'https://rupert.demo.vetra.io/',
      prefix: 'rupert',
      genericSubdomain: 'demo',
      genericBaseDomain: 'vetra.io',
      endpoint,
    })
    expect(url).toBe('https://rupert.demo.vetra.io/agent-graphql')
  })

  it('composes from prefix + subdomain + base when service.url is null', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: null,
      prefix: 'rupert',
      genericSubdomain: 'demo',
      genericBaseDomain: 'vetra.io',
      endpoint,
    })
    expect(url).toBe('https://rupert.demo.vetra.io/agent-graphql')
  })

  it('uses placeholder subdomain when missing', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: null,
      prefix: 'rupert',
      genericSubdomain: null,
      genericBaseDomain: 'vetra.io',
      endpoint,
    })
    expect(url).toContain('<subdomain>')
  })

  it('falls back to vetra.io base when missing', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: null,
      prefix: 'rupert',
      genericSubdomain: 'demo',
      genericBaseDomain: null,
      endpoint,
    })
    expect(url).toBe('https://rupert.demo.vetra.io/agent-graphql')
  })

  it('does not double the slash when endpoint.id is a proxy path', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: null,
      prefix: 'ph-pirate-wouter',
      genericSubdomain: 'sure-fawn-71',
      genericBaseDomain: 'vetra.io',
      endpoint: { id: '/switchboard/graphql' },
    })
    expect(url).toBe('https://ph-pirate-wouter.sure-fawn-71.vetra.io/switchboard/graphql')
  })

  it('does not double the slash when service.url is provided and id is a path', () => {
    const url = composeClintEndpointUrl({
      serviceUrl: 'https://ph-pirate-wouter.sure-fawn-71.vetra.io/',
      prefix: 'ph-pirate-wouter',
      genericSubdomain: 'sure-fawn-71',
      genericBaseDomain: 'vetra.io',
      endpoint: { id: '/switchboard/mcp' },
    })
    expect(url).toBe('https://ph-pirate-wouter.sure-fawn-71.vetra.io/switchboard/mcp')
  })
})
