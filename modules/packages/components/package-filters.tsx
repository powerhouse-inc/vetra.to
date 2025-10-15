'use client'

import { Search, X } from 'lucide-react'
import React, { useState } from 'react'

import {
  StripedCard,
  StripedCardAction,
  StripedCardContent,
  StripedCardHeader,
  StripedCardTitle,
} from '@/modules/shared/components/striped-card/striped-card'
import { Button } from '@/modules/shared/components/ui/button'
import { Checkbox } from '@/modules/shared/components/ui/checkbox'
import { Input } from '@/modules/shared/components/ui/input'
import { cn } from '@/modules/shared/lib/utils'

export interface PackageFilter {
  userExperiences: string[]
  categories: string[]
  searchQuery: string
}

interface PackageFiltersProps {
  onFilterChange: (filters: PackageFilter) => void
  totalCount: number
}

const USER_EXPERIENCES = [
  { id: 'packages', label: 'Packages', count: 0 },
  { id: 'applications', label: 'Applications', count: 2 },
  { id: 'editors', label: 'Document Editors', count: 2 },
  { id: 'models', label: 'Document Models', count: 0 },
  { id: 'integrations', label: 'Data Integrations', count: 0 },
  { id: 'subgraphs', label: 'Subgraphs', count: 0 },
  { id: 'processors', label: 'Processors', count: 0 },
  { id: 'codegenerators', label: 'Codegenerators', count: 0 },
]

const CATEGORIES = [
  { id: 'engineering', label: 'Engineering', count: 0 },
  { id: 'project-management', label: 'Project Management', count: 0 },
  { id: 'governance', label: 'Governance', count: 0 },
  { id: 'finance', label: 'Finance', count: 13 },
  { id: 'operation', label: 'Operation', count: 0 },
]

export function PackageFilters({ onFilterChange, totalCount }: PackageFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserExperiences, setSelectedUserExperiences] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onFilterChange({
      userExperiences: selectedUserExperiences,
      categories: selectedCategories,
      searchQuery: value,
    })
  }

  const handleUserExperienceToggle = (id: string) => {
    const newSelection = selectedUserExperiences.includes(id)
      ? selectedUserExperiences.filter((item) => item !== id)
      : [...selectedUserExperiences, id]

    setSelectedUserExperiences(newSelection)
    onFilterChange({
      userExperiences: newSelection,
      categories: selectedCategories,
      searchQuery,
    })
  }

  const handleCategoryToggle = (id: string) => {
    const newSelection = selectedCategories.includes(id)
      ? selectedCategories.filter((item) => item !== id)
      : [...selectedCategories, id]

    setSelectedCategories(newSelection)
    onFilterChange({
      userExperiences: selectedUserExperiences,
      categories: newSelection,
      searchQuery,
    })
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedUserExperiences([])
    setSelectedCategories([])
    onFilterChange({
      userExperiences: [],
      categories: [],
      searchQuery: '',
    })
  }

  const hasActiveFilters =
    searchQuery !== '' || selectedUserExperiences.length > 0 || selectedCategories.length > 0

  return (
    <StripedCard className="w-full">
      <StripedCardHeader>
        <StripedCardTitle>Filters</StripedCardTitle>
        {hasActiveFilters && (
          <StripedCardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-blue-600"
            >
              Reset Filter
            </Button>
          </StripedCardAction>
        )}
      </StripedCardHeader>

      <StripedCardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pr-9 pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-sm">
          <span className="font-medium">{totalCount}</span> Results
        </div>

        {/* User Experiences */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">User Experiences</h4>
          <div className="space-y-2">
            {USER_EXPERIENCES.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center justify-between py-1 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedUserExperiences.includes(item.id)}
                    onCheckedChange={() => handleUserExperienceToggle(item.id)}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-muted-foreground text-xs">{item.count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Document Models section header - could expand */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Document Models</h4>
        </div>

        {/* Data Integrations section header - could expand */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Data Integrations</h4>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Categories</h4>
          <div className="space-y-2">
            {CATEGORIES.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center justify-between py-1 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCategories.includes(item.id)}
                    onCheckedChange={() => handleCategoryToggle(item.id)}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-muted-foreground text-xs">{item.count}</span>
              </label>
            ))}
          </div>
        </div>
      </StripedCardContent>
    </StripedCard>
  )
}
