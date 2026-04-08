'use client'

import { useQueryState } from 'nuqs'
import { Search as SearchIcon } from 'lucide-react'

export function Search() {
  const [searchText, setSearchText] = useQueryState('search', {
    shallow: false,
  })

  return (
    <div className="relative mt-2 mb-3 h-8 rounded-md bg-slate-50">
      <SearchIcon
        className="absolute inset-y-0 left-1 my-auto text-gray-900"
        size={15}
        strokeWidth={3}
      />
      <input
        className="h-full w-full pl-6 placeholder:font-semibold placeholder:text-gray-900 focus:outline-purple-700"
        placeholder="Search"
        type="text"
        value={searchText ?? ''}
        onChange={(e) => {
          setSearchText(e.currentTarget.value).catch(console.error)
        }}
      />
    </div>
  )
}
