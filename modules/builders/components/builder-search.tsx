'use client'

import { Filter } from 'lucide-react'
import SearchInput from '@/modules/shared/components/search-input'
import { useSearch } from './builders-page-client'

export function BuilderSearch() {
  const { searchTerm, setSearchTerm } = useSearch()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="relative max-w-md">
      <SearchInput onChange={setSearchTerm} value={searchTerm} />
    </div>
  )
}
