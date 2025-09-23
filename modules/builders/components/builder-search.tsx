'use client'

import { Filter } from 'lucide-react'
import { useSearch } from './builders-page-client'

export function BuilderSearch() {
  const { searchTerm, setSearchTerm } = useSearch()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="relative max-w-md">
      <div className="border-border bg-background flex items-center rounded-lg border">
        <Filter className="text-muted-foreground absolute left-3 h-4 w-4" />
        <input
          type="text"
          placeholder="Search Builders"
          value={searchTerm}
          onChange={handleInputChange}
          className="w-full border-0 bg-transparent py-2 pr-16 pl-10 focus:ring-0 focus:outline-none"
        />
        <div className="text-muted-foreground absolute right-3 text-xs">Ctrl K</div>
      </div>
    </div>
  )
}
