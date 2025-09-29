'use client'

import { useState, createContext, useContext, ReactNode, useEffect } from 'react'
import { BuilderAccount } from '../lib/server-data'

interface SearchContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
  builders: BuilderAccount[]
  isLoading: boolean
  error: string | null
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
  children: ReactNode
}

export function BuildersPageClient({ children }: BuildersPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [builders, setBuilders] = useState<BuilderAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBuilders = async (search?: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/builder-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search, type: 'team' }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch builders')
      }

      const data = await response.json()
      setBuilders(data.builders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Failed to fetch builders:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchBuilders('team') // Load team builders by default
  }, [])

  // Search effect
  useEffect(() => {
    if (searchTerm.trim() === '') {
      fetchBuilders('team')
      return
    }

    const timeoutId = setTimeout(() => {
      fetchBuilders(searchTerm)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        builders,
        isLoading,
        error,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}
