'use client'

import { useState, createContext, useContext, ReactNode } from 'react'
import { BuilderAccount } from '../lib/server-data'

interface SearchContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

interface BuildersPageClientProps {
  initialBuilders: BuilderAccount[]
  children: ReactNode
}

export function BuildersPageClient({ initialBuilders, children }: BuildersPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <SearchContext.Provider value={{ searchTerm, setSearchTerm }}>
      {children}
    </SearchContext.Provider>
  )
}
