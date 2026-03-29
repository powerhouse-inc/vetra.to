import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registryUrl = searchParams.get('registry')
    const packageName = searchParams.get('package')

    if (!registryUrl || !packageName) {
      return NextResponse.json(
        { error: 'registry and package parameters are required' },
        { status: 400 },
      )
    }

    const url = new URL(`/${packageName}`, registryUrl)
    const res = await fetch(url.toString(), { next: { revalidate: 30 } })

    if (!res.ok) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const data = (await res.json()) as {
      'dist-tags': Record<string, string>
      versions: Record<string, unknown>
    }

    const distTags = data['dist-tags'] ?? {}
    const versions = Object.keys(data.versions ?? {}).reverse()

    return NextResponse.json({ distTags, versions })
  } catch (error) {
    console.error('Registry versions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}
