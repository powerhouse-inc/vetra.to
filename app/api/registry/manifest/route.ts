import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registryUrl = searchParams.get('registry')
    const packageName = searchParams.get('package')
    const version = searchParams.get('version')

    if (!registryUrl || !packageName) {
      return NextResponse.json(
        { error: 'registry and package parameters are required' },
        { status: 400 },
      )
    }

    const spec = version ? `${packageName}@${version}` : packageName
    const cdnUrl = new URL(`/-/cdn/${spec}/powerhouse.manifest.json`, registryUrl)
    const res = await fetch(cdnUrl.toString(), { next: { revalidate: 30 } })

    if (res.status === 404) {
      return NextResponse.json({ error: 'Manifest not found' }, { status: 404 })
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch manifest: ${res.status}` },
        { status: 502 },
      )
    }

    const manifest = (await res.json()) as unknown
    return NextResponse.json(manifest)
  } catch (error) {
    console.error('Registry manifest API error:', error)
    return NextResponse.json({ error: 'Failed to fetch manifest' }, { status: 500 })
  }
}
