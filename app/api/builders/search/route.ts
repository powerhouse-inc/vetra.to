import { type NextRequest, NextResponse } from 'next/server'
import { fetchAllBuilderAccounts } from '@/modules/builders/lib/server-data'

export async function POST(request: NextRequest) {
  try {
    const { search } = await request.json()

    const builders = await fetchAllBuilderAccounts(search)
    console.log('builders', builders, search)

    return NextResponse.json({ builders })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Failed to search builders' }, { status: 500 })
  }
}
