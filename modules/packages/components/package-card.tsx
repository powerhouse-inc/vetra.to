'use client'

import React from 'react'

import { cn } from '@/modules/shared/lib/utils'
import PackageIcon from '@/modules/packages/assets/package-icon.svg'

export interface PackageCardProps {
  name: string
  moduleType: string
  publisherName: string
  description: string
  selected?: boolean
  previewSlot?: React.ReactNode
  moduleBadgeSlot?: React.ReactNode
  onPublisherClick?: () => void
  onClick?: () => void
  className?: string
}

export function PackageCard({
  name,
  moduleType,
  publisherName,
  description,
  selected = false,
  previewSlot,
  moduleBadgeSlot,
  onPublisherClick,
  onClick,
  className,
}: PackageCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex w-[316px] cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-lg',
        selected ? 'outline-2 outline-[#56c700]' : '',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-accent px-2 py-1">
        <span className="w-full text-center text-base leading-6 font-semibold text-foreground">
          {name}
        </span>
      </div>

      {/* Preview area */}
      <div className="relative mx-2 mt-2 h-[235px] overflow-hidden rounded-xl border border-muted bg-card">
        {previewSlot ?? (
          <div className="flex h-full items-center justify-center">
            <div className="h-full w-full bg-[repeating-conic-gradient(#f3f5f7_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]" />
          </div>
        )}

        {/* Module type badge */}
        {moduleBadgeSlot && (
          <div className="absolute right-2 bottom-2">
            {moduleBadgeSlot}
          </div>
        )}
      </div>

      {/* Footer metadata */}
      <div className="mx-2 mt-2 mb-2 flex flex-col gap-1 rounded-xl border border-muted bg-card px-2 py-1">
        {/* Module type */}
        <span className="text-sm leading-6 font-semibold text-foreground">
          {moduleType}
        </span>

        {/* Package + publisher */}
        <div className="flex items-center gap-[5px]">
          <PackageIcon className="h-[11px] w-[10px] shrink-0 text-foreground" />
          <span className="text-xs leading-[18px] font-medium text-foreground">
            {name}
            {' '}
            <span className="font-normal">by</span>
            {' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPublisherClick?.()
              }}
              className="cursor-pointer font-semibold text-info hover:underline"
            >
              {publisherName}
            </button>
          </span>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-xs leading-[18px] font-medium text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
