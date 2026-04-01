'use client'

import React, { useState, useMemo } from 'react'

import { PackageFilters } from './package-filters'
import { PackageItemCard } from './package-item-card'
import type { PackageFilter } from './package-filters'
import type { VetraPackage } from '../lib/server-data'

interface PackagesListProps {
  packages: VetraPackage[]
}

export function PackagesList({ packages }: PackagesListProps) {
  const [filters, setFilters] = useState<PackageFilter>({
    userExperiences: [],
    categories: [],
    searchQuery: '',
  })

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch =
          pkg.name.toLowerCase().includes(query) ||
          pkg.description?.toLowerCase().includes(query) ||
          pkg.category?.toLowerCase().includes(query) ||
          pkg.authorName?.toLowerCase().includes(query)

        if (!matchesSearch) return false
      }

      // Category filter
      if (filters.categories.length > 0) {
        const pkgCategory = pkg.category?.toLowerCase() || ''
        const matchesCategory = filters.categories.some((cat) => pkgCategory.includes(cat))

        if (!matchesCategory) return false
      }

      // User experience filter (based on category keywords)
      if (filters.userExperiences.length > 0) {
        const pkgCategory = pkg.category?.toLowerCase() || ''
        const matchesExperience = filters.userExperiences.some((exp) => {
          if (exp === 'applications') return pkgCategory.includes('application')
          if (exp === 'editors') return pkgCategory.includes('editor')
          if (exp === 'models') return pkgCategory.includes('model')
          if (exp === 'integrations') return pkgCategory.includes('integration')
          if (exp === 'subgraphs') return pkgCategory.includes('subgraph')
          if (exp === 'processors') return pkgCategory.includes('processor')
          if (exp === 'codegenerators')
            return pkgCategory.includes('codegen') || pkgCategory.includes('generator')
          return false
        })

        if (!matchesExperience) return false
      }

      return true
    })
  }, [packages, filters])

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <PackageFilters onFilterChange={setFilters} totalCount={filteredPackages.length} />
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {filteredPackages.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-muted-foreground">No packages found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPackages.map((pkg) => (
              <PackageItemCard
                key={pkg.documentId}
                documentId={pkg.documentId}
                name={pkg.name}
                description={pkg.description}
                category={pkg.category}
                authorName={pkg.authorName}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
