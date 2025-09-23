'use client'

import { useState, useEffect } from 'react'
import { BuilderTeamCard } from './list-card'
import { BuilderAccount } from '../lib/server-data'
import { useSearch } from './builders-page-client'

interface BuilderListProps {
  initialBuilders: BuilderAccount[]
}

export function BuilderList({ initialBuilders }: BuilderListProps) {
  const { searchTerm } = useSearch()
  const [builders, setBuilders] = useState<BuilderAccount[]>(initialBuilders)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setBuilders(initialBuilders)
      return
    }

    setIsLoading(true)
    
    const searchBuilders = async () => {
      try {
        const response = await fetch('/api/builders/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ search: searchTerm }),
        })
        
        if (response.ok) {
          const data = await response.json()
          setBuilders(data.builders)
        } else {
          console.error('Search failed')
          setBuilders(initialBuilders)
        }
      } catch (error) {
        console.error('Search error:', error)
        setBuilders(initialBuilders)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(searchBuilders, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, initialBuilders])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Searching...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {builders.map((team) => (
        <BuilderTeamCard
          key={team.id}
          teamName={team.profileName || team.profileSlug || 'Unnamed Team'}
          description={
            team.profileDescription ??
            'Officially affiliated team of Powerhouse.inc. Seasoned builder on the powerhouse techstack. Strong ability to explore a problem space in any domain and develop solutions.'
          }
          xUrl={team.profileSocialsX ?? ''}
          githubUrl={team.profileSocialsGithub ?? ''}
          websiteUrl={team.profileSocialsWebsite ?? ''}
          actions={[{ link: `/builders/${team.id}`, title: 'View Profile' }]}
        />
      ))}
    </div>
  )
}
