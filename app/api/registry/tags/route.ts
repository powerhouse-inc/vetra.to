import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const IMAGE_MAP: Record<string, string> = {
  CONNECT: 'powerhouse-inc-powerhouse/connect',
  SWITCHBOARD: 'powerhouse-inc-powerhouse/switchboard',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceType = searchParams.get('service')
    const registry = searchParams.get('registry') ?? 'https://cr.vetra.io'

    if (!serviceType) {
      return NextResponse.json({ error: 'service parameter is required' }, { status: 400 })
    }

    const imagePath = IMAGE_MAP[serviceType.toUpperCase()]
    if (!imagePath) {
      return NextResponse.json({ error: `Unknown service type: ${serviceType}` }, { status: 400 })
    }

    const url = new URL(`/v2/${imagePath}/tags/list`, registry)
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch tags from registry' }, { status: 502 })
    }

    const data = (await res.json()) as { name?: string; tags?: string[] }

    return NextResponse.json({ tags: data.tags ?? [] })
  } catch (error) {
    console.error('Registry tags API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}
