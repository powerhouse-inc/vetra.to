'use client'

import SearchInput from '@/modules/shared/components/search-input'
import { useSearch } from './builders-page-client'

export function BuilderSearch() {
  const { searchTerm, setSearchTerm } = useSearch()

  return (
    <div className="relative max-w-md">
      <SearchInput onChange={setSearchTerm} value={searchTerm} />
    </div>
  )
}
