import { type NextRequest, NextResponse } from 'next/server'
import { fetchAllBuilderTeams } from '@/modules/builders/lib/server-data'

// Disable caching for this API route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || 'team'

    const builders = await fetchAllBuilderTeams(search)

    // Filter by type if specified
    const filteredBuilders =
      type === 'team'
        ? builders.filter((builder) => builder.profileSlug.includes('team'))
        : builders

    const response = NextResponse.json({
      builders: filteredBuilders,
      total: filteredBuilders.length,
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Builder accounts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch builder accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { search } = await request.json()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const builders = await fetchAllBuilderTeams(search)

    const response = NextResponse.json({
      builders: builders,
      total: builders.length,
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Builder accounts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch builder accounts' }, { status: 500 })
  }
}
