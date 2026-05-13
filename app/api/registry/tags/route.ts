import { type NextRequest, NextResponse } from 'next/server'

import { computeDistTags } from '@/modules/cloud/registry/channels'
import { fetchHarborTags } from '@/modules/cloud/registry/harbor'

export const dynamic = 'force-dynamic'
export const revalidate = 60

const IMAGE_MAP: Record<string, string> = {
  CONNECT: 'powerhouse-inc-powerhouse/connect',
  SWITCHBOARD: 'powerhouse-inc-powerhouse/switchboard',
}

const CACHE_HEADER = 'public, s-maxage=60, stale-while-revalidate=300'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('service')

    if (!serviceType) {
      return NextResponse.json({ error: 'service parameter is required' }, { status: 400 })
    }

    const imagePath = IMAGE_MAP[serviceType.toUpperCase()]
    if (!imagePath) {
      return NextResponse.json({ error: `Unknown service type: ${serviceType}` }, { status: 400 })
    }

    const tags = await fetchHarborTags(imagePath)
    const distTags = computeDistTags(tags)

    return NextResponse.json({ tags, distTags }, { headers: { 'Cache-Control': CACHE_HEADER } })
  } catch (error) {
    console.error('Registry tags API error:', error)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
