import { type NextRequest, NextResponse } from 'next/server'
import { fetchAllBuilderTeams } from '@/modules/builders/lib/server-data'

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

    return NextResponse.json({
      builders: filteredBuilders,
      total: filteredBuilders.length,
    })
  } catch (error) {
    console.error('Builder accounts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch builder accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { search } = await request.json()

    const builders = await fetchAllBuilderTeams(search)

    return NextResponse.json({
      builders: builders,
      total: builders.length,
    })
  } catch (error) {
    console.error('Builder accounts API error:', error)
    return NextResponse.json({ error: 'Failed to fetch builder accounts' }, { status: 500 })
  }
}
