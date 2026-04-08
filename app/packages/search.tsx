'use client'

import { Input } from '@/modules/shared/components/ui/input'
import { useQueryState } from 'nuqs'

export function Search() {
  const [searchText, setSearchText] = useQueryState('search', {
    shallow: false,
  })

  return (
    <div>
      <Input
        type="text"
        value={searchText ?? ''}
        onChange={(e) => {
          setSearchText(e.currentTarget.value).catch(console.error)
        }}
      />
    </div>
  )
}
