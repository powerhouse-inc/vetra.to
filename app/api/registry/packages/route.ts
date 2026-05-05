import { type NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registryUrl = searchParams.get('registry')
    const search = searchParams.get('search') ?? ''

    if (!registryUrl) {
      return NextResponse.json({ error: 'registry parameter is required' }, { status: 400 })
    }

    const url = new URL('/-/verdaccio/data/packages', registryUrl)
    const res = await fetch(url.toString(), { next: { revalidate: 30 } })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch packages from registry' }, { status: 502 })
    }

    const packages = (await res.json()) as Array<{
      name: string
      version: string
      description?: string
    }>

    const filtered = search
      ? packages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      : packages

    return NextResponse.json(
      filtered.map((p) => ({
        name: p.name,
        version: p.version,
        description: p.description ?? null,
      })),
    )
  } catch (error) {
    console.error('Registry packages API error:', error)
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}
