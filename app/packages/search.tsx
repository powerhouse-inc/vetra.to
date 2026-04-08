'use client'

import { useQueryState } from 'nuqs'

export function Search() {
  const [searchText, setSearchText] = useQueryState('search', {
    shallow: false,
  })

  return (
    <div>
      <input
        type="text"
        value={searchText ?? ''}
        onChange={(e) => {
          setSearchText(e.currentTarget.value).catch(console.error)
        }}
      />
    </div>
  )
}
