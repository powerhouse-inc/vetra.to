'use client'

import { Check } from 'lucide-react'
import React from 'react'

import { cn } from '@/modules/shared/lib/utils'
import SearchIcon from '@/modules/packages/assets/search_icon.svg'

export type BadgeColor = 'gray' | 'orange' | 'red' | 'blue' | 'green' | 'purple'

export interface FilterItem {
  id: string
  label: string
  count: number
  color: BadgeColor
}

export interface FilterGroup {
  label?: string
  items: FilterItem[]
}

export interface FilterSection {
  label: string
  groups: FilterGroup[]
}

export interface PackageFilterPanelProps {
  sections: FilterSection[]
  selectedFilters: string[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onFilterToggle: (filterId: string) => void
  onResetFilters: () => void
}

const badgeColorClasses: Record<BadgeColor, string> = {
  gray: 'bg-[rgba(111,122,133,0.2)] border-[rgba(111,122,133,0.8)] text-[#6f7a85]',
  orange: 'bg-[#ffe8cc] border-[#ffa132] text-[#ffa132]',
  red: 'bg-[#fdeceb] border-[#f07b72] text-[#f07b72]',
  blue: 'bg-[#e5f3ff] border-[#329dff] text-[#329dff]',
  green: 'bg-[#e9f7ed] border-[#4fc86f] text-[#4fc86f]',
  purple: 'bg-[#f4eefd] border-[#a577ee] text-[#a577ee]',
}

export function PackageFilterPanel({
  sections,
  selectedFilters,
  searchQuery,
  onSearchChange,
  onFilterToggle,
  onResetFilters,
}: PackageFilterPanelProps) {
  const hasActiveFilters = searchQuery !== '' || selectedFilters.length > 0

  return (
    <div className="flex w-[316px] flex-col gap-4 rounded-xl bg-white p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <span className="text-base leading-6 font-semibold text-[#1e2124]">Filters</span>
        <button
          type="button"
          onClick={onResetFilters}
          className={cn(
            'cursor-pointer rounded-md px-4 py-1 text-base leading-6 font-semibold tracking-tight',
            hasActiveFilters ? 'text-[#b6bcc2]' : 'pointer-events-none text-transparent',
          )}
        >
          Reset Filter
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="pointer-events-none absolute top-0 bottom-0 left-3 flex items-center">
          <SearchIcon className="h-[15px] w-[15px] text-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-full rounded-lg bg-accent pl-[44px] pr-3 text-base leading-6 font-semibold text-foreground outline-none"
        />
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col">
          {/* Section header */}
          <div className="px-2 pb-2">
            <span className="text-sm leading-[22px] font-bold text-[#1e2124]">
              {section.label}
            </span>
          </div>

          {/* Items container */}
          <div className="flex flex-col gap-2 overflow-hidden rounded-xl bg-card shadow-[inset_0_0_17.4px_rgba(30,33,36,0.03)]">
            {section.groups.map((group, groupIdx) => (
              <React.Fragment key={group.label ?? groupIdx}>
                {group.label && (
                  <span className="px-2 text-sm leading-[22px] font-semibold text-foreground">
                    {group.label}
                  </span>
                )}

                {group.items.map((item) => {
                  const isSelected = selectedFilters.includes(item.id)

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onFilterToggle(item.id)}
                      className={cn(
                        'flex h-8 cursor-pointer items-center justify-between px-2 py-1 transition-colors',
                        isSelected ? 'bg-accent' : 'bg-transparent',
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            'w-6 text-center text-sm leading-[22px] font-semibold',
                            isSelected ? 'text-foreground' : 'text-border',
                          )}
                        >
                          {item.count}
                        </span>

                        <span
                          className={cn(
                            'inline-flex items-center rounded-md border-[1.5px] px-2 py-px text-sm leading-[22px] font-semibold',
                            badgeColorClasses[item.color],
                          )}
                        >
                          {item.label}
                        </span>
                      </div>

                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isSelected ? 'text-foreground' : 'text-border',
                        )}
                      />
                    </button>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
