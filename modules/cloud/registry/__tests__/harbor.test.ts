import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchHarborTags } from '@/modules/cloud/registry/harbor'

const IMAGE = 'powerhouse-inc-powerhouse/switchboard'
const TAGS_URL = `https://cr.vetra.io/v2/${IMAGE}/tags/list`
const TOKEN_URL =
  'https://cr.vetra.io/service/token?service=harbor-registry&scope=repository%3Apowerhouse-inc-powerhouse%2Fswitchboard%3Apull'

const CHALLENGE_HEADERS = new Headers({
  'www-authenticate':
    'Bearer realm="https://cr.vetra.io/service/token",service="harbor-registry",scope="repository:powerhouse-inc-powerhouse/switchboard:pull"',
})

describe('fetchHarborTags', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('completes 401 → token → retry happy path', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'abc123' }), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: IMAGE, tags: ['v1.0.0', 'v2.0.0'] }), {
          status: 200,
        }),
      )

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual(['v1.0.0', 'v2.0.0'])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][0]).toBe(TAGS_URL)
    expect(fetchMock.mock.calls[1][0]).toBe(TOKEN_URL)
    expect(fetchMock.mock.calls[2][0]).toBe(TAGS_URL)
    const retryInit = fetchMock.mock.calls[2][1] as RequestInit
    expect(new Headers(retryInit.headers).get('authorization')).toBe('Bearer abc123')
  })

  it('returns empty array when Www-Authenticate header is missing', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns empty array when token endpoint fails', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
  })

  it('does not loop on a second 401 after token retry', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'abc' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('returns tags directly if the first request is a 200', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ tags: ['v1.0.0'] }), { status: 200 }),
    )

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual(['v1.0.0'])
  })

  it('handles tags field absent in response', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401, headers: CHALLENGE_HEADERS }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'abc' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: IMAGE }), { status: 200 }))

    const tags = await fetchHarborTags(IMAGE)

    expect(tags).toEqual([])
  })
})
